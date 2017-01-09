import service from './index';
import {ProfilesCreateCommand, ProfilesCreatePayload} from '@sparksnetwork/sparks-schemas/types/commands/ProfilesCreate'
import {ProfilesUpdateCommand, ProfilesUpdatePayload} from '@sparksnetwork/sparks-schemas/types/commands/ProfilesUpdate'
import {test} from "ava";
import {StreamTransform} from "../../test/StreamTransform";
import {MockFirebase} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/ExternalFactories/Firebase";

const db = new MockFirebase();

test.beforeEach(() => {
  establishConnection('profiles', db);
});

test.serial('create for new user', async function(t) {
  const payload:ProfilesCreatePayload = {
    values: {
      email: 'test@example.com',
      fullName: 'Test Test',
      intro: 'My intro',
      phone: '+64412345',
      portraitUrl: 'http://example.com',
      skills: 'My skills'
    }
  };
  const message:ProfilesCreateCommand = {
    domain: 'Profiles',
    action: 'create',
    uid: 'lyp991',
    payload
  };

  const records = await StreamTransform(message, service);

  const {data: userRecord} = records.find(r => r.data.domain === 'Users');
  const {data: profileRecord} = records.find(r => r.data.domain === 'Profiles');

  t.is(userRecord.action, 'create');
  t.is(userRecord.key, 'lyp991');
  t.is(userRecord.values, 'lyp991');

  t.is(profileRecord.action, 'create');
  t.is(profileRecord.key, 'lyp991');
  t.deepEqual(profileRecord.values, {
    uid: 'lyp991',
    isAdmin: false,
    isEAP: false,
    email: 'test@example.com',
    fullName: 'Test Test',
    intro: 'My intro',
    phone: '+64412345',
    portraitUrl: 'http://example.com',
    skills: 'My skills'
  });
});

test.serial('create for existing profile', async function(t) {
  await db.database().ref()
    .child('Profiles')
    .set({
      muu833: {uid: 'muu833'}
    });

  const payload:ProfilesCreatePayload = {
    values: {
      email: 'test@example.com',
      fullName: 'Test Test',
      intro: 'My intro',
      phone: '+64412345',
      portraitUrl: 'http://example.com',
      skills: 'My skills'
    }
  };
  const message:ProfilesCreateCommand = {
    domain: 'Profiles',
    action: 'create',
    uid: 'muu833',
    payload
  };

  const records = await StreamTransform(message, service);
  t.is(records.length, 1);

  const data = records[0].data;
  t.deepEqual(data, {
    domain: 'Users',
    action: 'create',
    key: 'muu833',
    values: 'muu833'
  });
});

test.serial('update', async function(t) {
  const payload:ProfilesUpdatePayload = {
    key: 'lyp991',
    values: {
      fullName: 'Test Test 2'
    }
  };
  const message:ProfilesUpdateCommand = {
    domain: 'Profiles',
    action: 'update',
    uid: 'lyp991',
    payload
  };

  const records = await StreamTransform(message, service);
  t.is(records.length, 1);
  const record = records[0];

  t.is(record.streamName, 'data.firebase');
  t.is(record.partitionKey, 'lyp991');

  const data = record.data;
  t.is(data.domain, 'Profiles');
  t.is(data.action, 'update');
  t.deepEqual(data.values, {
    fullName: 'Test Test 2'
  });
});