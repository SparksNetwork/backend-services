import {spy} from 'sinon';
import service from './index';
import {test} from 'ava';
import {ArrivalsCreateCommand} from '@sparksnetwork/sparks-schemas/types/commands/ArrivalsCreate';
import {ArrivalsRemoveCommand} from '@sparksnetwork/sparks-schemas/types/commands/ArrivalsRemove';
import {MockFirebase} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/ExternalFactories/Firebase";
import {StreamTransform} from "../../test/StreamTransform";

const db = new MockFirebase();
const userRef = db.database().child('Users').child('abc123');
userRef.set('tyu678');

test.beforeEach(() => {
  establishConnection('arrivals', db);
});

test.serial('create', async function(t) {
  const now = spy(Date, 'now');

  const message:ArrivalsCreateCommand = {
    domain: 'Arrivals',
    action: 'create',
    uid: 'abc123',
    payload: {
      values: {
        projectKey: 'cde234',
        profileKey: 'bce234'
      }
    }
  };

  const [{data}] = await StreamTransform(message, service);

  t.is(data.domain, 'Arrivals');
  t.is(data.action, 'create');
  t.is(data.key, 'cde234-bce234');
  t.is(data.values.projectKey, 'cde234');
  t.is(data.values.profileKey, 'bce234');
  t.is(data.values.ownerProfileKey, 'tyu678');
  t.is(data.values.arrivedAt, now.returnValues[0]);
});

test.serial('create already arrived', async function(t) {
  await db.database()
    .child('Arrivals')
    .child('-Kcj112--Kmop993')
    .set({arrivedAt: Date.now()});

  const message:ArrivalsCreateCommand = {
    domain: 'Arrivals',
    action: 'create',
    uid: 'abc123',
    payload: {
      values: {
        projectKey: '-Kcj112',
        profileKey: '-Kmop993'
      }
    }
  };

  const messages = await StreamTransform(message, service);
  t.is(messages.length, 0, 'Already arrived produces no messages');
});

test.serial('remove', async function(t) {
  const message:ArrivalsRemoveCommand = {
    domain: 'Arrivals',
    action: 'remove',
    uid: 'abc123',
    payload: {
      key: '-Kui88'
    }
  };

  const [{data}] = await StreamTransform(message, service);

  t.deepEqual(data, {
    domain: 'Arrivals',
    action: 'remove',
    key: '-Kui88'
  });
});