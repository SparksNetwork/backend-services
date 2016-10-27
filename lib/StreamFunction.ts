import Ajv from 'sparks-schemas/lib/ajv';
import {command} from 'sparks-schemas/generators/command';
import Record = Kinesis.Record;
import ValidateFunction = ajv.ValidateFunction;
import KinesisEventRecord = Lambda.KinesisEventRecord;

type SchemaFunction = (message:any) => boolean | Promise<boolean>;
type ValidationOption = ValidateFunction | SchemaFunction | string | null;
type ValidationArg = ValidationOption | Promise<ValidationOption>;

const ajv = Ajv();

async function createValidationFunction(fromp:ValidationArg):Promise<SchemaFunction> {
  const from = await Promise.resolve(fromp);

  if (typeof from === 'string' && from.startsWith('command.')) {
    return command(from.split('.').slice(1).join('.')) as any
  } else if (typeof from === 'string') {
    return ajv.getSchema(from) as any;
  } else if (!from) {
    return () => true
  }

  return from as any;
}

function executeFnIfSchema<T>(fn:(message:T) => Promise<any>, schemaFn:(message) => Promise<boolean> | boolean) {
  return async function(record:Lambda.KinesisRecord) {
    const data = new Buffer(record.data, 'base64');
    const message = JSON.parse(data as any) as T;
    const valid = await Promise.resolve(schemaFn(message));

    if(valid) {
      return await fn(message);
    }
  }
}

function unwrapEvent(e:KinesisEventRecord) {
  return e.kinesis;
}

/**
 * Wrap a function in a function that takes a kinesis record, deserializes it,
 * and filters messages that do not match the given schema.
 *
 * If the schema is null then all messages are passed.
 *
 * If the schema is a string then the schema function will be loaded from the
 * sparks-schema module.
 *
 * If the schema is a function then it must return a boolean
 *
 * @param schema
 * @param fn
 * @returns {(e:Record)=>Promise<undefined|any>}
 * @constructor
 */
export function StreamFunction<T>(schema: ValidationArg, fn:(message:T) => Promise<any>) {
  const schemaPromise = createValidationFunction(schema);

  return async function(e:Lambda.KinesisEvent) {
    const schemaFn = await schemaPromise;

    if (typeof schemaFn !== 'function') {
      throw new Error('Schema ' + schema + ' not found!');
    }

    const executeFn = executeFnIfSchema(fn, schemaFn);
    return Promise.all(e.Records.map(unwrapEvent).map(executeFn));
  };
}
