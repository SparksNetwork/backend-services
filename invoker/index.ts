import {
  LocalFunctionConsumer,
  LambdaFunctionConsumer
} from "./FunctionConsumer";
import {localSchemas, remoteSchemas, getSchemasFor} from "./schemas";
import {error} from "./log";
import {localFunctions, remoteFunctions} from "./functions";

const mode = process.argv.slice(2)[0];
const time = Number(process.argv.slice(3)[0] || 10) * 1000;

if (!(mode && time >= 1)) {
  error('[usage] <script> <local or lambda> [config timeout, defaults to 10]');
  process.exit(1);
}

async function runLambda(time:number) {
  const functions = await remoteFunctions();
  const schemas = await remoteSchemas();

  const consumers = functions
    .filter(fn => fn.config['stream'])
    .map(fn => new LambdaFunctionConsumer(fn, getSchemasFor(schemas, fn), {
      connectionString: process.env['KAFKA_CONNECTION']
    }));

  return Promise.all(consumers.map(consumer => consumer.runFor(time)));
}

async function runLocal(time:number) {
  const functions = await localFunctions();
  const schemas = await localSchemas();

  const consumers = functions
    .filter(fn => fn.config['stream'])
    .map(fn => new LocalFunctionConsumer(fn, getSchemasFor(schemas, fn), {
      connectionString: process.env['KAFKA_CONNECTION']
    }));

  return Promise.all(consumers.map(consumer => consumer.runFor(time)));
}

const runFor = mode === 'lambda' ? runLambda : runLocal;

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