process.env['DOMAIN'] = 'http://example.com';

import service from './index';
import {spy} from 'sinon';
import {test} from 'ava';
import {OrganizersAcceptCommand} from '@sparksnetwork/sparks-schemas/types/commands/OrganizersAccept';
import {OrganizersCreateCommand} from '@sparksnetwork/sparks-schemas/types/commands/OrganizersCreate';
import {OrganizersRemoveCommand} from '@sparksnetwork/sparks-schemas/types/commands/OrganizersRemove';
import {StreamTransform} from "../../test/StreamTransform";
import {MockDatabase, MockFirebase} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/ExternalFactories/Firebase";

const acceptCommand:OrganizersAcceptCommand = {
  domain: 'Organizers',
  action: 'accept',
  uid: 'abc123',
  payload: {
    key: 'org123'
  }
};

const createCommand:OrganizersCreateCommand = {
  domain: 'Organizers',
  action: 'create',
  uid: 'abc123',
  payload: {
    values: {
      authority: 'organizer',
      inviteEmail: 'sample@example.com',
      projectKey: 'proj123'
    }
  }
};

const removeCommand:OrganizersRemoveCommand = {
  domain: 'Organizers',
  action: 'remove',
  uid: 'abc123',
  payload: {
    key: 'org123'
  }
};

const db = new MockFirebase();

test.beforeEach(() => {
  establishConnection('organizers', db);
  db.database().ref().child('Users').child('abc123').set('jbb392');
  db.database().ref().child('Projects').child('proj123').child('name').set('Project 1');
});

test.afterEach(() => { db.reset(); })

test.serial('create', async function(t) {
  const messages = await StreamTransform(createCommand, service);
  t.is(messages.length, 2);

  const dataMessage = messages.find(m => m.streamName === 'data.firebase');
  const emailMessage = messages.find(m => m.streamName === 'email');

  t.is(dataMessage.partitionKey, 'proj123');
  const {data} = dataMessage;
  t.is(data.domain, 'Organizers');
  t.is(data.action, 'create');
  t.truthy(data.key);
  t.deepEqual(data.values, {
    authority: 'organizer',
    inviteEmail: 'sample@example.com',
    projectKey: 'proj123',
    invitedByProfileKey: 'jbb392'
  });

  t.is(emailMessage.partitionKey, 'proj123');
  const {data: emailData} = emailMessage;
  t.is(emailData.templateId, 'a005f2a2-74b0-42f4-8ac6-46a4b137b7f1');
  t.deepEqual(emailData.substitutions, {
    project_name: 'Project 1',
    inviteUrl: `http://example.com/organize/${data.key}`
  });
});

test.serial('accept', async function(t) {
  const now = spy(Date, 'now');
  const [{data}] = await StreamTransform(acceptCommand, service);

  t.is(data.domain, 'Organizers');
  t.is(data.action, 'update');
  t.is(data.key, 'org123');
  t.deepEqual(data.values, {
    acceptedAt: now.returnValues[0],
    isAccepted: true,
    profileKey: 'jbb392'
  });
});

test.serial('remove', async function(t) {
  const [{partitionKey, data}] = await StreamTransform(removeCommand, service);

  t.is(partitionKey, 'abc123');
  t.is(data.domain, 'Organizers');
  t.is(data.action, 'remove');
  t.is(data.key, 'org123');
});
