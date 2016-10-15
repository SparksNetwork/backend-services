import {mock} from 'sinon'
import service from './index';
import {test, ContextualTestContext} from "ava";
import {MockFirebase} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/Firebase";
import KinesisFunction from "../../test/KinesisFunction";

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

function dbtest(m:string, tfn:(t:ContextualTestContext, db:MockFirebase) => Promise<any>) {
  return test(m, async function(t) {
    const db = new MockFirebase();
    establishConnection('firebase-service', db);
    return await tfn(t, db);
  });
}

dbtest('create message', async function(t, db) {
  const m = mock(db.database().ref().child('Arrivals').child('abc123'));
  m.expects('set')
    .withArgs(createMessage.values)
    .returns(Promise.resolve({}));

  await KinesisFunction(createMessage, service);

  m.verify();
});

dbtest('invalid create message', async function(t, db) {
  const m = mock(db.database().ref().child('Arrivals'));
  m.expects('push').never();

  await KinesisFunction(invalidCreateMessage, service);

  m.verify();
});

dbtest('update message', async function(t, db) {
  const m = mock(db.database().ref()
    .child('Commitments')
    .child('cde234'));

  m.expects('update')
    .once()
    .withArgs(updateMessage.values)
    .returns(Promise.resolve({}));

  await KinesisFunction(updateMessage, service);

  m.verify();
});

dbtest('invalid update message', async function(t, db) {
  const m = mock(db.database().ref()
    .child('Commitments'));
  m.expects('child').never();

  await KinesisFunction(invalidUpdateMessage, service);

  m.verify();
});

dbtest('remove message', async function(t, db) {
  const m = mock(db.database().ref()
    .child('Engagements')
    .child('cde234'));

  m.expects('remove')
    .once()
    .returns(Promise.resolve({}));

  await KinesisFunction(removeMessage, service);

  m.verify();
});

dbtest('invalid remove message', async function(t, db) {
  const m = mock(db.database().ref()
    .child('Engagements'));

  m.expects('child').never();

  await KinesisFunction(invalidRemoveMessage, service);

  m.verify();
});