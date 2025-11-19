# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## How to use CDK to make Lambda functions

* create folder in shopcomp-backend/bin/lib ex. createReceipt
* create package.json and [lambdaName].mjs (refer to default package.json)
* run npm install in the lambda function lib/[lambdaName]
* create lambda function in [lambdaName].mjs
* run 'npm run build' in shopcomp-backend directory
* run 'cdk deploy', don't need 'cdk synth'

