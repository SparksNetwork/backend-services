import Ajv from 'sparks-schemas/lib/ajv';
import {command} from 'sparks-schemas/generators/command';
import Record = Kinesis.Record;
import ValidateFunction = ajv.ValidateFunction;
import KinesisEventRecord = Lambda.KinesisEventRecord;
import {view, lensPath, unnest} from 'ramda';

interface SchemaFunction {
  (message:any): boolean;
  errors?: Array<any>
}
type ValidationOption = ValidateFunction | SchemaFunction | string | null;
type ValidationArg = ValidationOption | Promise<ValidationOption>;

const ajv = Ajv();

const contextPath = lensPath(['clientContext', 'context']);

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

function recordToMessage(record:Lambda.KinesisEventRecord) {
  const kinesis = record.kinesis;
  const data = new Buffer(kinesis.data, 'base64');
  const message = JSON.parse(data as any)
  return message;
}

function showInvalidReason(domainAction:string, schemaFn:SchemaFunction, messages:any[]) {
  const [stream, domain, action] = domainAction.split('.');

  messages.forEach(message => {
    if (!message.domain || !message.action) { return; }
    if (message.domain !== domain || message.action !== action) { return; }

    console.log(domainAction, 'message did not pass validation');
    schemaFn(message);
    if (schemaFn.errors) {
      console.log('Errors')
      console.log(schemaFn.errors);
    }
    console.log(message);
  });
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
 * @param e
 * @param validator
 * @param fn
 * @returns {(e:Record)=>Promise<undefined|any>}
 * @constructor
 */
async function kinesisFunction(e:Lambda.KinesisEvent, validator, fn) {
  console.log({
    sequenceNumbers: e.Records.map(record => record.kinesis.sequenceNumber)
  });

  const messages = e.Records.map(recordToMessage);
  const validMessages = messages.filter(validator);

  if (validMessages.length === 0 && validator.schema) {
    showInvalidReason(
      validator.schema.id,
      validator,
      messages
    )
  }

  console.log({received: messages.length, valid: validMessages.length});
  return Promise.all(validMessages.map(message => fn(message, 'kinesis')));
}

async function kafkaFunction(e, validator, fn):Promise<any[]> {
  const valid = validator(e);

  if (valid) {
    return await fn(e, 'kafka');
  } else if (validator.schema) {
    showInvalidReason(
      validator.schema.id,
      validator,
      [e]
    );
    return [];
  }
}

export function StreamFunction<T>(schema: ValidationArg, fn:(message:T, context?:string) => Promise<any>) {
  const schemaPromise = createValidationFunction(schema);

  return async function(event, ctx) {
    const validator = await schemaPromise;

    if (typeof validator !== 'function') {
      throw new Error('Schema ' + schema + ' not found!');
    }

    const context = view(contextPath, ctx) || 'kinesis';

    if (context === 'kafka') {
      return kafkaFunction(event, validator, fn);
    } else {
      return kinesisFunction(event, validator, fn);
    }
  };
}
