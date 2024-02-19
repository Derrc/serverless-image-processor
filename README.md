# Serverless Image Processing

serverless image processing pipeline using AWS s3 and lambda, infrastructure created using Terraform

# Supported Operations (Query Parameters)

- saveDirectory: directory path to save image to (Ex: food/images), defaults to root directory if not present
- resizeX: width to resize image to
- resizeY: height to resize image to

# Pipeline

- post to lambda function url endpoint with image as multi-part form data and processing parameters as query parameters
- image will be processed and uploaded to s3 bucket
- response will be returned with s3 url to retrieve image

# Improvements Todo

- implement bettter security policies for get/put access to s3 bucket
- split up logic in lambda function
