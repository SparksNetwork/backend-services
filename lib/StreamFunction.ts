import {command} from 'sparks-schemas/generator';
import Record = Kinesis.Record;
import ValidateFunction = ajv.ValidateFunction;

type SchemaFunction = (message:any) => boolean | Promise<boolean>;

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
export function StreamFunction<T>(schema: ValidateFunction | SchemaFunction | string | null, fn:(message:T) => Promise<any>) {
  let schemaFn:SchemaFunction;

  if (typeof schema === 'string') {
    schemaFn = command(schema) as SchemaFunction;
  } else if (!schema) {
    schemaFn = () => true
  } else {
    schemaFn = schema as any;
  }

  return async function(e:Record) {
    const message = JSON.parse(e.Data as any) as T;
    const valid = await Promise.resolve(schemaFn(message));

    if(valid) {
      return await fn(message);
    }
  };
}
