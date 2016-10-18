import * as apex from 'apex.js';
import {UsersMigrateCommand} from 'sparks-schemas/types/commands/UsersMigrate';
import {StreamTransform} from "../../lib/StreamTransform";
import {dataCreate} from "../../helpers/dataCreate";
import {dataUpdate} from "../../helpers/dataUpdate";

/**
 * Migration command is for whne a user has changed uid
 */
const migrate = StreamTransform<any,any>('Users.migrate', async function({uid, payload: {toUid, profileKey}}:UsersMigrateCommand) {
  return [
    dataCreate('Users', toUid, uid, profileKey),
    dataUpdate('Profiles', profileKey, uid, {uid: toUid})
  ]
});

export default apex(migrate);