import {S3} from 'aws-sdk';
import {getFunctions, ApexFunction} from "../bin/lib/apex";

export async function remoteFunctions():Promise<ApexFunction[]> {
  const s3 = new S3();
  const functionsObj = await s3.getObject({
    Bucket: 'terraform.sparks.network',
    Key: 'functions.json'
  }).promise();

  return JSON.parse(functionsObj.Body as any);
}

export function localFunctions():Promise<ApexFunction[]> {
  return new Promise((resolve, reject) => {
    getFunctions(function (err, functions) {
      if (err) {
        return reject(err);
      }
      resolve(functions);
    });
  });
}
