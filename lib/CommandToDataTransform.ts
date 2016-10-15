import {StreamTransform} from "./StreamTransform";
import {Command} from "sparks-schemas/types/command";
import {v4} from "node-uuid";
import {spread} from "./spread";

export function CreateTransform(schemaName:string) {
  return StreamTransform(schemaName, async function({domain, action, uid, payload}:Command) {
    const {values} = payload;
    const key = v4();

    return [{
      streamName: 'data.firebase',
      partitionKey: uid,
      data: {
        domain,
        action,
        key,
        values
      }
    }];
  });
}

export function UpdateTransform(schemaName:string) {
  return StreamTransform(schemaName, async function({domain, action, uid, payload}:Command) {
    const {key, values} = payload;

    return [{
      streamName: 'data.firebase',
      partitionKey: uid,
      data: {
        domain,
        action,
        key,
        values
      }
    }]
  });
}

export function RemoveTransform(schemaName:string) {
  return StreamTransform(schemaName, async function({domain, action, uid, payload}:Command) {
    const {key} = payload;

    return [{
      streamName: 'data.firebase',
      partitionKey: uid,
      data: {
        domain,
        action,
        key
      }
    }];
  });
}

export function CommandTransform(domain:string) {
  return spread(
    CreateTransform(domain + '.create'),
    UpdateTransform(domain + '.update'),
    RemoveTransform(domain + '.remove')
  );
}