import * as apex from 'apex.js';
import {StreamTransform} from "../../lib/StreamTransform";
import {
  ProfilesCreateCommand,
} from 'sparks-schemas/types/commands/ProfilesCreate';
import {ProfilesUpdateCommand} from 'sparks-schemas/types/commands/ProfilesUpdate';
import {search} from "../../lib/ExternalFactories/Firebase";
import {spread} from "../../lib/spread";
import {merge} from 'ramda'
import {dataCreate} from "../../helpers/dataCreate";
import {dataUpdate} from "../../helpers/dataUpdate";

const create = StreamTransform<ProfilesCreateCommand,any>('Profiles.create', async function ({uid, payload: {values}}: ProfilesCreateCommand) {
  const matchingProfiles = await search('profiles', ['uid', uid], 'Profiles');
  const profileKeys = Object.keys(matchingProfiles);

  if (profileKeys.length > 0) {
    return [
      dataCreate('Users', uid, uid, profileKeys[0])
    ];
  } else {
    return [
      dataCreate('Users', uid, uid, uid),
      dataCreate('Profiles', uid, uid, merge(values, {
        uid: uid,
        isAdmin: false,
        isEAP: false
      }))
    ]
  }
});

const update = StreamTransform('Profiles.update', async function ({uid, payload: {key, values}}: ProfilesUpdateCommand) {
  return [dataUpdate('Profiles', key, uid, values)];
});

export default apex(spread(create, update));
