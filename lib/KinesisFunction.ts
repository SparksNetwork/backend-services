import {command} from 'sparks-schemas/generator';
import Record = Kinesis.Record;

type SchemaFunction = string | Function;

/**
 * Wrap a function in a function that takes a kinesis record, deserializes it,
 * and filters messages that do not match the given schema.
 *
 * If the schema is null then all messages are passed.
 *
 * If the schema is a string then the schema function will be loaded from the
 * sparks-schema module.
 *
 * @param schema
 * @param fn
 * @returns {(e:Record)=>Promise<undefined|any>}
 * @constructor
 */
export function KinesisFunction<T>(schema:SchemaFunction = null, fn:(message:T) => Promise<any>) {
  let schemaFn;

  if (typeof schema === 'string') {
    schemaFn = command(schema);
  } else if (!schema) {
    schemaFn = () => true
  } else {
    schemaFn = schema;
  }

  return async function(e:Record) {
    const message = JSON.parse(e.Data as any) as T;

    if(schemaFn(message)) {
      return await fn(message);
    }
  };
}
