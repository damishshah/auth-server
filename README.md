# auth-server

Authentication server template built using node, dynamodb, and sendgrid.

## Running Locally

To just run the unit test suite, run the following:

- npm install
- npm run test

To run the server locally and manually test API operations with something like PostMan, you'll need to do the following:

_Setup DynamoDB in the AWS Console or to run locally_

- Copy `sample.env` file to `.env`
- Update AWS environment variables to real ones if you have a real DDB instance setup with AWS
- Otherwise, use [this link](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html) to setup and run a DDB instance locally for testing
- Run `npm run createdb` to create a local users table

_Setup a SendGrid account_

- Go to sendgrid.com and follow the steps there to setup a sample project. Consider [using sandbox mode](https://sendgrid.com/docs/for-developers/sending-email/sandbox-mode/) when testing.

_Run the server and test_

- Run `npm install`
- Run `npm run server`
- Test api calls with your tool of choice (cURL, PostMan, etc.). Server runs on localhost:5000 by default.

## API Functions

### Auth route

- GET - auth/
- POST - auth/register
- POST - auth/login
- GET - auth/verify/:token
- POST - auth/resend
- POST - auth/recover
- GET - auth/reset/:token
- POST - auth/reset

### User route

- GET - user/
- PUT - user/
- DELETE - user/
