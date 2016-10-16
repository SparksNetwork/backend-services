import * as apex from 'apex.js';
import {UsersMigrateCommand} from 'sparks-schemas/types/commands/UsersMigrate';
import {StreamTransform} from "../../lib/StreamTransform";

/**
 * Migration command is for whne a user has changed uid
 */
const migrate = StreamTransform<any,any>('Users.migrate', async function(message:UsersMigrateCommand) {
  return [
    {
      streamName: 'data.firebase',
      partitionKey: message.uid,
      data: {
        domain: 'Users',
        action: 'create',
        key: message.payload.toUid,
        values: message.payload.profileKey
      }
    },
    {
      streamName: 'data.firebase',
      partitionKey: message.uid,
      data: {
        domain: 'Profiles',
        action: 'update',
        key: message.payload.profileKey,
        values: {
          uid: message.payload.toUid
        }
      }
    }
  ]
});

export default apex(migrate);