# ShopComp Backend

## How to use CDK to make Lambda functions

* create folder in `shopcomp-backend/lib` with the name of the lambda function ex. createReceipt
    * Use camelCase
* create `package.json` and `[lambdaName].mjs` (refer to `lib/default/package.json`)
* run `npm install` in the lambda function folder `lib/[lambdaName]`
* write lambda function code in `[lambdaName].mjs`
* run `npm run build` in `shopcomp-backend` directory
* run `cdk deploy LambdaStack`, don't need `cdk synth`

