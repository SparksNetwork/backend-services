import {apex} from "./apex";

function makeRecord(message) {
  return {
    Data: new Buffer(JSON.stringify(message))
  }
}

export async function StreamFunction(message:Object, service:Function) {
  return await apex(service, makeRecord(message));
}
