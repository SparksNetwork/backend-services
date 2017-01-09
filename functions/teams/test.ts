require('source-map-support').install();

import service from './index';
import {test} from 'ava';
import {TeamsCreateCommand} from '@sparksnetwork/sparks-schemas/types/commands/TeamsCreate'
import {TeamsUpdateCommand} from '@sparksnetwork/sparks-schemas/types/commands/TeamsUpdate'
import {TeamsRemoveCommand} from '@sparksnetwork/sparks-schemas/types/commands/TeamsRemove'
import {StreamTransform} from "../../test/StreamTransform";
import {MockFirebase} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/ExternalFactories/Firebase";

const createCommand:TeamsCreateCommand = {
  domain: 'Teams',
  action: 'create',
  uid: 'abc123',
  payload: {
    values: {
      projectKey: 'proj123',
      name: 'My team'
    }
  }
};

const updateCommand:TeamsUpdateCommand = {
  domain: 'Teams',
  action: 'update',
  uid: 'abc123',
  payload: {
    key: 'team123',
    values: {
      description: 'my description'
    }
  }
};

const removeCommand:TeamsRemoveCommand = {
  domain: 'Teams',
  action: 'remove',
  uid: 'abc123',
  payload: {
    key: 'team123'
  }
};

const db = new MockFirebase();

test.afterEach(() => db.reset());
test.beforeEach(() => {
  establishConnection('teams', db);

  db.database().ref()
    .child('Users')
    .child('abc123')
    .set('edh622');
});

test.serial('teams create', async function(t) {
  const [dataMessage] = await StreamTransform(createCommand, service);
  t.is(dataMessage.streamName, 'data.firebase');
  t.is(dataMessage.partitionKey, 'proj123');
  const {data} = dataMessage;
  t.is(data.domain, 'Teams');
  t.is(data.action, 'create');
  t.truthy(data.key);
  t.deepEqual(data.values, {
    name: 'My team',
    projectKey: 'proj123',
    ownerProfileKey: 'edh622'
  });
});

test.serial('teams update', async function(t) {
  db.database().ref().child('Teams').child('team123').child('projectKey').set('proj123');

  const [dataMessage] = await StreamTransform(updateCommand, service);
  t.is(dataMessage.streamName, 'data.firebase');
  t.is(dataMessage.partitionKey, 'proj123');
  const {data} = dataMessage;
  t.is(data.domain, 'Teams');
  t.is(data.action, 'update');
  t.is(data.key, 'team123');
  t.deepEqual(data.values, {
    description: 'my description'
  });
});

test.serial('teams remove', async function(t) {
  db.database().ref().child('Teams').child('team123').child('projectKey').set('proj123');

  const [dataMessage] = await StreamTransform(removeCommand, service);
  t.is(dataMessage.streamName, 'data.firebase');
  t.is(dataMessage.partitionKey, 'proj123');
  const {data} = dataMessage;
  t.is(data.domain, 'Teams');
  t.is(data.action, 'remove');
  t.is(data.key, 'team123');
});
