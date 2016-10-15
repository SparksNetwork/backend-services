import {Kinesis} from 'aws-sdk';
import {KinesisFunction} from "./KinesisFunction";
import {groupBy, prop, toPairs, compose} from 'ramda'

export interface StreamRecord<U> {
  streamName:string;
  partitionKey:string;
  data:U;
}

export type Transform<T,U> = (message:T) => Promise<Array<StreamRecord<U>>>;

function byStream<T>(records:StreamRecord<T>[]):[string, StreamRecord<T>[]][] {
  return compose<StreamRecord<T>[], any, [string, StreamRecord<T>[]][]>(
    toPairs,
    groupBy<StreamRecord<T>>(prop('streamName'))
  )(records);
}


/**
 * This indicates a function that takes a message from a kinesis stream and
 * outputs a message suitable for another kinesis stream.
 *
 * The schema can be a function that returns a boolean or a string that will
 * be passed to the command() function to get a schema. Messages will be
 * filtered by the schema before being passed to the function.
 *
 * @param schema
 * @param outStream
 * @param transform
 * @returns {(e:Record)=>Promise<any>}
 * @constructor
 */
export function StreamTransform<T,U>(schema:string|Function, transform:Transform<T,U>) {
  return KinesisFunction<T>(schema, async function(message:T) {
    const records:StreamRecord<U>[] = await transform(message);
    const kinesis = new Kinesis();

    return await Promise.all(
      byStream(records).map(([streamName, records]) => {
        return kinesis.putRecords({
          StreamName: streamName as string,
          Records: records.map(record => ({
            PartitionKey: record.partitionKey,
            Data: new Buffer(JSON.stringify(record.data))
          }))
        }).promise()
      })
    );
  });
}