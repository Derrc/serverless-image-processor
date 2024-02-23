import Jimp from "jimp";
import { parse } from "parse-multipart-data";
import { S3 } from "aws-sdk";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

/**
 * Expected query params for processing image:
 *
 * Params:
 * - saveDirectory: filepath for directory to save image to (Ex: food/images)
 * - resizeX: width for resized image
 * - resizeY: height for resized image (both resizeX and Y must be present for resizing)
 */
type QueryParams = {
  saveDirectory?: string;
  resizeX?: string;
  resizeY?: string;
};

// define s3 client and bucket name
const s3 = new S3();
const bucketName = "serverless-image-processor-images-1220";

// entry-point for lambda function url
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  let body;

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify("Request body is empty"),
    };
  }

  const queryParams = event.queryStringParameters as QueryParams;

  // get boundary from content-type header
  const headers = event.headers;
  const contentType = headers["content-type"];

  if (!contentType) {
    return {
      statusCode: 400,
      body: JSON.stringify("Body not sent as multipart form data"),
    };
  }

  const boundary = contentType.split(" ")[1].split("=")[1];

  // read form data as Buffer
  body = Buffer.from(event.body, "base64");

  // parse form data
  const parts = parse(body, boundary);
  // should only contain image file
  if (
    parts.length > 1 ||
    !parts[0].filename ||
    parts[0].type.split("/")[0] !== "image"
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify("Expected form data to contain 1 valid image"),
    };
  }

  const filename = parts[0].filename.split(".")[0];
  const imageType = parts[0].type;
  const imageData = parts[0].data;

  // process image
  const image = await Jimp.read(imageData);
  let operations = "";

  if (queryParams?.resizeX && queryParams?.resizeY) {
    const resizeX = parseInt(queryParams.resizeX);
    const resizeY = parseInt(queryParams.resizeY);
    // check if resize parameters are too big
    if (resizeX > 3000 || resizeY > 3000) {
      return {
        statusCode: 400,
        body: JSON.stringify(
          "Resize parameters are too large, try a smaller value"
        ),
      };
    }

    image.resize(resizeX, resizeY);
    operations += `resizeX=${queryParams.resizeX}resizeY=${queryParams.resizeY}`;
  }

  // convert image back to Buffer
  const imageBuffer = await image.getBufferAsync(imageType);
  // get full filepath
  const directoryPath = queryParams?.saveDirectory
    ? queryParams.saveDirectory + "/"
    : "";
  const filePath =
    directoryPath + filename + (operations ? `_${operations}` : "");

  // add image to bucket
  const result = await s3
    .putObject({
      Bucket: bucketName,
      Body: imageBuffer,
      Key: filePath,
      CacheControl: "max-age=3600",
      ContentType: imageType,
    })
    .promise();

  console.log("image uploaded: " + JSON.stringify(result));

  // get s3 url of uploaded image
  const url = s3
    .getSignedUrl("getObject", {
      Bucket: bucketName,
      Key: filePath,
    })
    .split("?")[0];

  return {
    statusCode: 200,
    body: JSON.stringify({ url: url }),
  };
};
