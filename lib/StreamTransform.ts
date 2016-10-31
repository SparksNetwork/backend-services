import {StreamFunction} from "./StreamFunction";
import {StreamPublish, StreamRecord} from "./StreamPublish";

export type Transform<T,U> = (message:T, context:ClientContext) => Promise<Array<StreamRecord<U>>>;

/**
 * This indicates a function that takes a message from a kinesis stream and
 * outputs messages suitable to send back to kinesis.
 *
 * The schema can be a function that returns a boolean or a string that will
 * be passed to the command() function to get a schema. Messages will be
 * filtered by the schema before being passed to the function.
 *
 * The returned messages must implement the StreamRecord interface, and
 * can be sent to one or more streams.
 *
 * @param schema
 * @param transform
 * @returns {(e:Record, context:string)=>Promise<any>}
 * @constructor
 */
export function StreamTransform<T,U>(schema, transform:Transform<T,U>) {
  return StreamFunction<T>(schema, async function(message:T, context:ClientContext) {
    const records:StreamRecord<U>[] = await transform(message, context);

    if (!records.reduce) {
      throw new Error('StreamTransform expects the function to return the promise of an Array of StreamRecord objects');
    }

    if (context.context === 'kinesis') {
      return StreamPublish(records);
    } else {
      return records;
    }
  });
}