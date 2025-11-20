# ShopComp Backend

## How to Use CDK to Make Lambda Functions

1. **Create the Lambda folder**  
- Inside `shopcomp-backend/lib`, create a folder named after your Lambda function, e.g., `createReceipt` (use camelCase).

2. **Add files**  
- Copy or create `package.json` (refer to `lib/default/package.json`)  
- Create `[lambdaName].mjs` for your Lambda code and write the function.

3. **Install dependencies**  
`cd lib/[lambdaName]`
`npm install`

## How to CDK Deploy
- Make sure you are in the root directory `cd ..`

1. **IF FIRST TIME DEPLOYING**
- `npm install`
- `cdk bootstrap`
2. **Deploy**
- Build the project with `npm run build`
- *Optional*: Preveiw resources to be deployed with `cdk synth`
- Deploy LambdaStack (deploys Lambda functions & API Gateway) with `cdk deploy LambdaStack`