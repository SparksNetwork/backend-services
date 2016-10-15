import * as apex from 'apex.js';
import {StreamTransform} from "../../lib/StreamTransform";
import {ProfilesCreateCommand, ProfilesCreatePayload} from 'sparks-schemas/types/commands/ProfilesCreate';
import {ProfilesUpdateCommand} from 'sparks-schemas/types/commands/ProfilesUpdate';
import {Profile} from 'sparks-schemas/types/models/profile';
import {lookup, search} from "../../lib/Firebase";
import {spread} from "../../lib/spread";
import {merge} from 'ramda'

const streamName = 'data.firebase';

const create = StreamTransform<ProfilesCreateCommand,any>('Profiles.create', async function(message:ProfilesCreateCommand) {
  const matchingProfiles = await search('profiles', ['uid', message.uid], 'Profiles');
  const profileKeys = Object.keys(matchingProfiles);

  if (profileKeys.length > 0) {
    return [
      {
        streamName,
        partitionKey: message.uid,
        data: {
          domain: 'Users',
          action: 'create',
          key: message.uid,
          values: profileKeys[0]
        }
      }
    ]
  } else {
    return [
      {
        streamName,
        partitionKey: message.uid,
        data: {
          domain: 'Users',
          action: 'create',
          key: message.uid,
          values: message.uid
        }
      },
      {
        streamName,
        partitionKey: message.uid,
        data: {
          domain: 'Profiles',
          action: 'create',
          key: message.uid,
          values: merge(message.payload.values, {
            uid: message.uid,
            isAdmin: false,
            isEAP: false
          })
        }
      }
    ]
  }
});

const update = StreamTransform('Profiles.update', async function(message:ProfilesUpdateCommand) {
  return [
    {
      streamName,
      partitionKey: message.uid,
      data: {
        domain: 'Profiles',
        action: 'update',
        key: message.payload.key,
        values: message.payload.values
      }
    }
  ];
});

export default apex(spread(create, update));
