import {firebaseUid, lookup} from '../lib/ExternalFactories/Firebase';
import {StreamTransform} from '../lib/StreamTransform';
import {merge, identity} from 'ramda'
import {TransformFunction} from "./CommandToDataTransform";

/**
 * Helper, this is a replacement for CreateTransform that adds the profile key
 * of the current user as the ownerProfileKey.
 */
export function CreateWithOwnerProfileKey(schemaName:string, transform?:TransformFunction) {
  return StreamTransform(schemaName, async function ({domain, action, uid, payload: {values}}) {
    const ownerProfileKey = await lookup('Users', uid);

    return (transform||identity)([
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
    ])
  });
}

