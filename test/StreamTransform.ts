import KinesisFunction from "./KinesisFunction";
import {SinonStub} from "sinon";
import {StreamRecord} from "../lib/StreamTransform";
import {flatten} from 'ramda'
const AWS = require('aws-sdk-mock');

export async function StreamTransform(message, service, params?:{PartitionKey:string, StreamName:string}):Promise<StreamRecord<any>[]> {
  try {
    const putRecords = AWS.mock('Kinesis', 'putRecords');
    await KinesisFunction(message, service);
    const stub:SinonStub = putRecords.stub;
    if (!stub) {
      throw new Error('Sent no messages');
    }
    const eachCallRecords = stub.getCalls().map(call => {
      const params: Kinesis.PutRecordsParams = call.args[0];

      return params.Records.map(record => ({
        streamName: params.StreamName,
        partitionKey: record.PartitionKey,
        data: JSON.parse(record.Data as any)
      }));
    });

    return flatten(eachCallRecords);
  } finally {
    AWS.restore();
  }
}

