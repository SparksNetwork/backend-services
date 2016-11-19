import {StreamFunction} from "./StreamFunction";
import {SinonStub} from "sinon";
import {flatten} from 'ramda'
import {StreamRecord} from "../lib/StreamPublish";
const AWS = require('aws-sdk-mock');

/**
 * This is a testing function that undoes what the original StreamTransform
 * does.
 *
 * The original function takes a Kinesis event, extracts the event message,
 * calls the service function which returns an array of new messages that
 * StreamTransform sends to kinesis.
 *
 * Therefore this function takes a message, converts it to a Kinesis event,
 * sends that to the original service (which, as above, unwraps it, transforms
 * it and then puts messages on kinesis). This function mocks the Kinesis API
 * so that it can intercept the messages going there and then returns them
 * instead.
 *
 * event -> service -> messages -> kinesis
 *
 * becomes
 *
 * message -> event -> service -> messages -> kinesis -> messages
 *
 * And then we can test it.
 *
 * @param message Message to send to the service
 * @param service The service
 * @returns {{streamName: string, partitionKey: string, data: any}[]}
 * @constructor
 */
export async function StreamTransform(message, service):Promise<StreamRecord<any>[]> {
  try {
    const putRecords = AWS.mock('Kinesis', 'putRecords');
    await StreamFunction(message, service);
    const stub:SinonStub = putRecords.stub;
    if (!stub) {
      throw new Error('Sent no messages');
    }
    const eachCallRecords = stub.getCalls().map(call => {
      const params = call.args[0];

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

