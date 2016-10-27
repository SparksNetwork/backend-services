import {mock} from 'sinon'
import service from './index';
import {test} from "ava";
import {MockFirebase} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/ExternalFactories/Firebase";
import {StreamFunction} from "../../test/StreamFunction";

const createMessage = {
  domain: "Arrivals",
  action: "create",
  key: 'abc123',
  values: {
    arrivedAt: Date.now(),
    profileKey: "cde234",
    projectKey: "def345"
  }
};
const invalidCreateMessage = {
  domain: 'Arrivals',
  action: 'create',
};

const updateMessage = {
  domain: "Commitments",
  action: "update",
  key: "cde234",
  values: {
    amount: 1
  }
};

const invalidUpdateMessage = {
  domain: 'Commitments',
  action: 'update',
};

const removeMessage = {
  domain: "Engagements",
  action: "remove",
  key: "cde234"
};

const invalidRemoveMessage = {
  domain: 'Engagements',
  action: 'remove'
};

const db = new MockFirebase();

test.beforeEach(() => {
  establishConnection('firebase-service', db);
});

test.serial('create message', async function(t) {
  const m = mock(db.database().ref().child('Arrivals').child('abc123'));
  m.expects('set')
    .withArgs(createMessage.values)
    .returns(Promise.resolve({}));

  await StreamFunction(createMessage, service);

  m.verify();
});

test.serial('invalid create message', async function(t) {
  const m = mock(db.database().ref().child('Arrivals'));
  m.expects('push').never();

  await StreamFunction(invalidCreateMessage, service);

  m.verify();
});

test.serial('update message', async function(t) {
  const m = mock(db.database().ref()
    .child('Commitments')
    .child('cde234'));

  m.expects('update')
    .once()
    .withArgs(updateMessage.values)
    .returns(Promise.resolve({}));

  await StreamFunction(updateMessage, service);

  m.verify();
});

test.serial('invalid update message', async function(t) {
  const m = mock(db.database().ref()
    .child('Commitments'));
  m.expects('child').never();

  await StreamFunction(invalidUpdateMessage, service);

  m.verify();
});

test.serial('remove message', async function(t) {
  const m = mock(db.database().ref()
    .child('Engagements')
    .child('cde234'));

  m.expects('remove')
    .once()
    .returns(Promise.resolve({}));

  await StreamFunction(removeMessage, service);

  m.verify();
});

test.serial('invalid remove message', async function(t) {
  const m = mock(db.database().ref()
    .child('Engagements'));

  m.expects('child').never();

  await StreamFunction(invalidRemoveMessage, service);

  m.verify();
});