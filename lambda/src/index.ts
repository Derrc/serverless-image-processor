// types for lambda function url request/response
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const message = "Hello World!";
  console.log(`Returning ${message}`);
  return {
    statusCode: 200,
    body: JSON.stringify(message),
  };
};
