import {getFunctions, ApexFunction} from "../bin/lib/apex";
import {S3} from 'aws-sdk';
import {
  LocalFunctionConsumer,
  LambdaFunctionConsumer
} from "./FunctionConsumer";
import {localSchemas, remoteSchemas, getSchemasFor} from "./schemas";
import {error} from "./log";

const mode = process.argv.slice(2)[0];
const time = Number(process.argv.slice(3)[0] || 10) * 1000;

let fetchFunctions:() => Promise<ApexFunction[]>;
let fetchSchemas:() => Promise<any>;
let functionConsumer;

if (mode === 'local') {
  fetchFunctions = function() {
    return new Promise((resolve, reject) => {
      getFunctions(function (err, functions) {
        if (err) {
          return reject(err);
        }
        resolve(functions);
      });
    });
  };
  fetchSchemas = localSchemas;
  functionConsumer = LocalFunctionConsumer
}

if (mode === 'lambda') {
  const s3 = new S3();

  fetchFunctions = async function() {
    const response = await s3.getObject({
      Bucket: 'terraform.sparks.network',
      Key: 'functions.json'
    }).promise();

    return JSON.parse(response.Body as any);
  };
  fetchSchemas = remoteSchemas;
  functionConsumer = LambdaFunctionConsumer;
}

if (!functionConsumer || time < 1) {
  error('[usage] <script> <local or lambda> [config timeout, defaults to 10]');
  process.exit(1);
}

async function runFor(time:number) {
  const functions = await fetchFunctions();
  const ajv = await fetchSchemas();

  const consumers = functions
    .filter(fn => fn.config['stream'])
    .map(fn => new functionConsumer(fn, getSchemasFor(ajv, fn), {
      connectionString: process.env['KAFKA_CONNECTION']
    }));

  return Promise.all(consumers.map(consumer => consumer.runFor(time)));
}

async function run(time:number) {
  while (true) {
    await runFor(time);
  }
}

process.on('unhandledRejection', function(reason, p) {
  error('unhandled rejection');
  error(reason);
  error(p);
  process.exit(1);
});

run(time);