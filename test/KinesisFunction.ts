import {apex} from "./apex";

function makeRecord(message) {
  return {
    Data: JSON.stringify(message)
  }
}

export default async function KinesisFunction(message:Object, service:Function) {
  return await apex(service, makeRecord(message));
}
