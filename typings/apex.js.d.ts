declare interface LambdaContext {
  functionName:string
  functionVersion:string
  invokedFunctionArn:string
  memoryLimitInMB:number
  getRemainingTimeInMillis():number
  awsRequestId:string
  logGroupName:string
  logStreamName:string
  clientContext?:any
  identity?:{cognitoIdentityId:string,cognitoIdentityPoolId:string}
}

declare type ApexJsFunction<T> = (e:T, c:LambdaContext) => Promise<any>

declare let ApexJs: <T>(fn:ApexJsFunction<T>) => Function;

declare module "apex.js" {
  export = ApexJs
}