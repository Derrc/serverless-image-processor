"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const jimp_1 = __importDefault(require("jimp"));
const parse_multipart_data_1 = require("parse-multipart-data");
const aws_sdk_1 = require("aws-sdk");
// define s3 bucket and bucket name
const s3 = new aws_sdk_1.S3();
const bucketName = "serverless-image-processor-images-1220";
// entry-point for lambda function url
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    let body;
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify("Request body is empty"),
        };
    }
    const queryParams = event.queryStringParameters;
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
    const parts = (0, parse_multipart_data_1.parse)(body, boundary);
    // should only contain image file
    if (parts.length > 1 ||
        !parts[0].filename ||
        parts[0].type.split("/")[0] !== "image") {
        return {
            statusCode: 400,
            body: JSON.stringify("Expected form data to contain 1 valid image"),
        };
    }
    const filename = parts[0].filename.split(".")[0];
    const imageType = parts[0].type;
    const imageData = parts[0].data;
    // process image
    const image = yield jimp_1.default.read(imageData);
    let operations = "";
    if ((queryParams === null || queryParams === void 0 ? void 0 : queryParams.resizeX) && (queryParams === null || queryParams === void 0 ? void 0 : queryParams.resizeY)) {
        image.resize(parseInt(queryParams.resizeX), parseInt(queryParams.resizeY));
        operations += `resizeX=${queryParams.resizeX}resizeY=${queryParams.resizeY}`;
    }
    // convert image back to Buffer
    const imageBuffer = yield image.getBufferAsync(imageType);
    // get full filepath
    const directoryPath = (queryParams === null || queryParams === void 0 ? void 0 : queryParams.saveDirectory)
        ? queryParams.saveDirectory + "/"
        : "";
    const filePath = directoryPath + filename + (operations ? `_${operations}` : "");
    // add image to bucket
    const result = yield s3
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
});
exports.handler = handler;
