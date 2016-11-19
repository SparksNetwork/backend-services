import {apex} from "./apex";

function makeEvent(message) {
  const record = {
    awsRegion: 'us-west-2',
    eventName: 'aws:kinesis:record',
    eventSource: 'aws:kinesis',
    eventSourceARN: 'arn:aws:test',
    eventVersion: '1.0.0',
    invokeIdentityArn: 'arn:aws:test',
    eventID: '001',
    kinesis: {
      sequenceNumber: '0001',
      partitionKey: 'abc123',
      kinesisSchemaVersion: '1.0.0',
      data: new Buffer(JSON.stringify(message)).toString('base64')
    }
  };

  const Records = [record];

  return {
    Records
  }
}

/**
 * This is a testing function that undoes the wrapping of StreamFunction
 * i.e. you give it a message and it converts it into a Kinesis event which
 * then gets sent to the service which calls the original StreamFunction that
 * unwraps the Kinesis record.
 *
 * The point of this is that the tests do not need to know the underlying messaging
 * implementation.
 *
 * @param message The message to send to the service function
 * @param service The service function
 * @returns {Promise<T>}
 * @constructor
 */
export async function StreamFunction(message:Object, service:Function) {
  return await apex(service, makeEvent(message));
}
