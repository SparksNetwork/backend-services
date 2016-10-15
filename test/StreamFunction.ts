import {apex} from "./apex";

function makeRecord(message) {
  return {
    Data: new Buffer(JSON.stringify(message))
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
  return await apex(service, makeRecord(message));
}
