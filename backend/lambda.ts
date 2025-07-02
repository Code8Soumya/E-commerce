import serverless from "serverless-http";
import app from "./app";
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

exports.handler = serverless(app, {
    binary: false,
    request: (request: any, event: APIGatewayProxyEvent, context: Context) => {
        // Fix body parsing for API Gateway v2
        if (event.body) {
            let bodyStr = event.body;
            if (event.isBase64Encoded) {
                bodyStr = Buffer.from(event.body, "base64").toString();
            }

            // Parse JSON string to object
            try {
                request.body = JSON.parse(bodyStr);
            } catch (e) {
                console.error("Error parsing body:", e);
                // Keep original body if parsing fails
            }
        }
    },
});
