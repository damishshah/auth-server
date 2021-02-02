const dynamodb = require("aws-sdk/clients/dynamodb");

const isTest = process.env.JEST_WORKER_ID;
const isProd = !isTest;

const config = {
  ...(isTest && {
    endpoint: "http://localhost:8000",
    sslEnabled: false,
    region: "local-env",
  }),
  ...(isProd && {
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  }),
};

const docClient = new dynamodb.DocumentClient(config);

module.exports = { docClient };
