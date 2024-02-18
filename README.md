# serverless image processor

pipeline:

- create s3 buckets for terraform state and images
- lambda function url that takes in processing parameters (resize, etc.), image file, and file name
- triggers lambda function that processes image with parameters
- uploads image to s3 bucket
- returns url to processed image file in bucket
- all setup with Terraform
