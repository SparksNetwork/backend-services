import * as https from 'https';
import {Kinesis} from 'aws-sdk';
import {compose, toPairs, groupBy, prop, splitEvery} from 'ramda';
import {debug} from "./log";

export interface StreamRecord<U> {
  streamName:string;
  partitionKey:string;
  data:U;
}

/**
 * Take an array of StreamRecords that might be destined for different streams
 * and group by the target stream name.
 *
 * @param records
 * @returns {any}
 */
function byStream<T>(records:StreamRecord<T>[]):[string, StreamRecord<T>[]][] {
  return compose<StreamRecord<T>[], any, [string, StreamRecord<T>[]][]>(
    toPairs,
    groupBy<StreamRecord<T>>(prop('streamName'))
  )(records);
}

/**
 * This function puts records on to a single kinesis stream, given by streamName.
 * It will split the records into batches of 100 to avoid the kinesis limits.
 *
 * @param kinesis
 * @param streamName
 * @param records
 * @returns {Promise<any>}
 */
function putRecords(kinesis:Kinesis, streamName:string, records:StreamRecord<any>[]):Promise<any> {
  return Promise.all(
    splitEvery(100, records).map(innerRecords => {
      return kinesis.putRecords({
        StreamName: streamName,
        Records: innerRecords.map(record => ({
          PartitionKey: record.partitionKey,
          Data: new Buffer(JSON.stringify(record.data))
        }))
      }).promise();
    })
  );
}

/**
 * Publish records to kinesis. This function will handle publishing the records
 * to different streams and splitting the records into batches.
 *
 * @param records
 * @returns {Promise<any[]>}
 * @constructor
 */
export function StreamPublish(records:StreamRecord<any>[]):Promise<any> {
  debug('publish to kinesis', {records: records.length});

  const agent = new https.Agent({
    rejectUnauthorized: false
  } as any);

  const kinesis = new Kinesis({
    endpoint: process.env['KINESIS_ENDPOINT'],
    httpOptions: {agent}
  });

  return Promise.all(
    byStream(records).map(([streamName, records]) =>
      putRecords(kinesis, streamName, records))
  );
}
