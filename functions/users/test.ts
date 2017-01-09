import service from './index';
import {test} from 'ava';
import {StreamTransform} from "../../test/StreamTransform";
import {UsersMigrateCommand} from '@sparksnetwork/sparks-schemas/types/commands/UsersMigrate';

const message:UsersMigrateCommand = {
  domain: 'Users',
  action: 'migrate',
  uid: 'abc123',
  payload: {
    fromUid: 'abc123',
    toUid: 'cba321',
    profileKey: 'sic293'
  }
};

test.serial('users migrate', async function(t) {
  const messages = await StreamTransform(message, service);
  t.is(messages.length, 2);

  const userMessage = messages.find(m => m.data.domain === 'Users');
  const profilesMessage = messages.find(m => m.data.domain === 'Profiles');

  const {data: userData} = userMessage;
  t.is(userData.action, 'create');
  t.is(userData.key, 'cba321');
  t.is(userData.values, 'sic293');

  const {data: profileData} = profilesMessage;
  t.is(profileData.action, 'update');
  t.is(profileData.key, 'sic293');
  t.deepEqual(profileData.values, {
    uid: 'cba321'
  });
});