terraform {
  required_providers {
    aws = ">= 4.47.0"
  }
  
  backend "s3" {
    bucket = "bucket-terraform-state-1220"
    key = "serverless-image-processor/terraform.tfstate"
    region = "us-east-1"
  }
  
  required_version = ">= 0.12"
}

provider "aws" {
  region = "us-east-1"
}

# bucket for terraform state
resource "aws_s3_bucket" "tf_state" {
  bucket = "bucket-terraform-state-1220"

  # prevent accidental deletion of bucket
  lifecycle {
    prevent_destroy = false
  }
}

# bucket for uploaded images after processing
resource "aws_s3_bucket" "images" {
  bucket = "serverless-image-processor-images-1220"

  # prevent accidental deletion of bucket
  lifecycle {
    prevent_destroy = false
  }
}

# create role for lambda function
resource "aws_iam_role" "image_processor_lambda_role" {
  name = "image-processor-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# lambda function
resource "aws_lambda_function" "image_processor_lambda" {
  filename = "zips/image_processor_lambda_${var.lambdaVersion}.zip"
  function_name = "image-processor-lambda"
  # assign created role
  role = aws_iam_role.image_processor_lambda_role.arn
  # lambda function file.method
  handler = "index.handler"
  runtime = "nodejs18.x"
  memory_size = 1024
  timeout = 300
}

# lambda function url
resource "aws_lambda_function_url" "image_processor_lambda_function_url" {
  function_name = aws_lambda_function.image_processor_lambda.id
  authorization_type = "NONE"
}

# add cloudwatch log group for lambda function
resource "aws_cloudwatch_log_group" "image_processor_lambda_log_group" {
  name = "/aws/lambda/${aws_lambda_function.image_processor_lambda.function_name}"
  retention_in_days = 3
}

data "aws_iam_policy_document" "image_processor_lambda_policy" {
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      aws_cloudwatch_log_group.image_processor_lambda_log_group.arn,
      "${aws_cloudwatch_log_group.image_processor_lambda_log_group.arn}:*"
    ]
  }
}

resource "aws_iam_role_policy" "image_processor_lambda_role_policy" {
  policy = data.aws_iam_policy_document.image_processor_lambda_policy.json
  role = aws_iam_role.image_processor_lambda_role.id
  name = "image-processor-lambda-policy"
}