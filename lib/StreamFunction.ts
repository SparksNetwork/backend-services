import {command} from 'sparks-schemas/generator';
import Record = Kinesis.Record;
import ValidateFunction = ajv.ValidateFunction;

type SchemaFunction = (message:any) => boolean | Promise<boolean>;
type ValidationOption = ValidateFunction | SchemaFunction | string | null;
type ValidationArg = ValidationOption | Promise<ValidationOption>;

async function createValidationFunction(fromp:ValidationArg):Promise<SchemaFunction> {
  const from = await Promise.resolve(fromp);

  if (typeof from === 'string') {
    return command(from) as SchemaFunction;
  } else if (!from) {
    return () => true
  }

  return from as any;
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

  return async function(e:Record) {
    const schemaFn = await schemaPromise;
    const message = JSON.parse(e.Data as any) as T;
    const valid = await Promise.resolve(schemaFn(message));

    if(valid) {
      return await fn(message);
    }
  };
}
