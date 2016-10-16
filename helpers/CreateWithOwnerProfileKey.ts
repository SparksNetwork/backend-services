import {firebaseUid, lookup} from '../lib/Firebase';
import {StreamTransform} from '../lib/StreamTransform';
import {merge} from 'ramda'

export function CreateWithOwnerProfileKey(schemaName:string) {
  return StreamTransform('Projects.create', async function ({domain, action, uid, payload: {values}}) {
    const ownerProfileKey = await lookup('projects', 'Users', uid);

    return [
      {
        streamName: 'data.firebase',
        partitionKey: uid,
        data: {
          domain,
          action,
          key: firebaseUid(),
          values: merge(values, {ownerProfileKey})
        }
      }
    ]
  });
}

