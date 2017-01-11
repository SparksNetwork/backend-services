import Ajv from '@sparksnetwork/sparks-schemas/lib/ajv';
import {command} from '@sparksnetwork/sparks-schemas/generators/command';
import ValidateFunction = ajv.ValidateFunction;
import {view, lensPath, unnest} from 'ramda';
import {error, debug} from "./log";

interface LambdaFunction<T> {
  (message: T, context: ClientContext):Promise<any>;
}

interface SchemaFunction {
  (message:any): boolean;
  errors?: Array<any>
}
type ValidationOption = ValidateFunction | SchemaFunction | string | null;
type ValidationArg = ValidationOption | Promise<ValidationOption>;

interface KinesisEventRecord {
  kinesis: KinesisRecord;
  eventSource: 'aws:kinesis';
  eventID: string;
  invokeIdentityArn: string;
  eventVersion: string;
  eventName: 'aws:kinesis:record';
  eventSourceARN: string;
  awsRegion: string;
}

interface KinesisRecord {
  partitionKey: string;
  kinesisSchemaVersion: string;
  data: string;
  sequenceNumber: string;
}

interface KinesisEvent {
  Records: KinesisEventRecord[];
}

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

function recordToMessage(record:KinesisEventRecord) {
  const kinesis = record.kinesis;
  const data = new Buffer(kinesis.data, 'base64');
  return JSON.parse(data as any);
}

function showInvalidReason(domainAction:string, schemaFn:SchemaFunction, messages:any[]) {
  const [stream, domain, action] = domainAction.split('.');

  messages.forEach(message => {
    if (!message.domain || !message.action) { return; }
    if (message.domain !== domain || message.action !== action) { return; }

    debug(domainAction, 'message did not pass validation');
    schemaFn(message);
    if (schemaFn.errors) {
      error(schemaFn.errors);
    }
    debug(message);
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
async function kinesisFunction(e:KinesisEvent, validator, fn:LambdaFunction<any>) {
  debug({
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

  debug({received: messages.length, valid: validMessages.length});
  return Promise.all(validMessages.map(message => fn(message, {context: 'kinesis'})));
}

async function kafkaFunction(e, context:KafkaContext, validator, fn:LambdaFunction<any>):Promise<any[]> {
  const valid = validator(e);

  if (valid) {
    error(e);
    return await fn(e, context);
  } else if (validator.schema) {
    showInvalidReason(
      validator.schema.id,
      validator,
      [e]
    );
    return [];
  }
}

async function localFunction(e, context:LocalContext, validator, fn:LambdaFunction<any>):Promise<any[]> {
  const valid = validator(e);

  if (valid) {
    error(e);
    return await fn(e, context);
  } else if (validator.schema) {
    showInvalidReason(
      validator.schema.id,
      validator,
      [e]
    );
    return ;
  }
}

export function StreamFunction<T>(schema: ValidationArg, fn:LambdaFunction<any>) {
  const schemaPromise = createValidationFunction(schema);

  return async function(event, ctx) {
    const validator = await schemaPromise;

    if (typeof validator !== 'function') {
      throw new Error('Schema ' + schema + ' not found!');
    }

    const context = view(contextPath, ctx) || 'kinesis';

    switch(context) {
      case 'kafka':
        return kafkaFunction(event, ctx.clientContext, validator, fn);
      case 'local':
        return localFunction(event, ctx.clientContext, validator, fn);
      default:
        return kinesisFunction(event, validator, fn);
    }
  };
}
