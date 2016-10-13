import {mock} from 'sinon'
import Firebase from '../../lib/Firebase'
import crud from './index';
import {ArrivalsCreateCommand} from 'sparks-schemas/types/commands/ArrivalsCreate';
import {CommitmentsUpdateCommand} from 'sparks-schemas/types/commands/CommitmentsUpdate';
import {EngagementsRemoveCommand} from 'sparks-schemas/types/commands/EngagementsRemove';
import {test, ContextualTestContext} from "ava";
import {apex} from "../../test/apex";
import {MockFirebase} from "../../test/MockFirebase";
import {Command} from "sparks-schemas/types/command";

const createMessage:ArrivalsCreateCommand = {
  domain: "Arrivals",
  action: "create",
  uid: "abc123",
  payload: {
    values: {
      arrivedAt: Date.now(),
      profileKey: "cde234",
      projectKey: "def345"
    }
  }
};
const invalidCreateMessage:Command = {
  domain: 'Arrivals',
  action: 'create',
  uid: 'abc123',
  payload: {}
};

const updateMessage:CommitmentsUpdateCommand = {
  domain: "Commitments",
  action: "update",
  uid: "abc123",
  payload: {
    key: "cde234",
    values: {
      amount: 1
    }
  }
};

const invalidUpdateMessage:Command = {
  domain: 'Commitments',
  action: 'update',
  uid: 'abc123',
  payload: {}
};

const removeMessage:EngagementsRemoveCommand = {
  domain: "Engagements",
  action: "remove",
  uid: "abc123",
  payload: {
    key: "cde234"
  }
};

const invalidRemoveMessage:Command = {
  domain: 'Engagements',
  action: 'remove',
  uid: 'abc123',
  payload: {}
};

function makeRecord(message) {
  return {
    Data: JSON.stringify(message)
  }
}

function dbtest(m:string, tfn:(t:ContextualTestContext, db:MockFirebase) => Promise<any>) {
  return test(m, async function(t) {
    const db = new MockFirebase();
    Firebase.establishConnection('crud', db);
    return await tfn(t, db);
  });
}

dbtest('create message', async function(t, db) {
  const m = mock(db.database().ref().child('Arrivals'));
  m.expects('push')
    .withArgs(createMessage.payload.values)
    .returns(Promise.resolve({}));

  await apex(crud, makeRecord(createMessage));

  m.verify();
});

dbtest('invalid create message', async function(t, db) {
  const m = mock(db.database().ref().child('Arrivals'));
  m.expects('push').never();

  t.throws(apex(crud, makeRecord(invalidCreateMessage)), 'Invalid payload');

  m.verify();
});

dbtest('update message', async function(t, db) {
  const m = mock(db.database().ref()
    .child('Commitments')
    .child('cde234'));

  m.expects('update')
    .once()
    .withArgs(updateMessage.payload.values)
    .returns(Promise.resolve({}));

  await apex(crud, makeRecord(updateMessage));

  m.verify();
});

dbtest('invalid update message', async function(t, db) {
  const m = mock(db.database().ref()
    .child('Commitments'));
  m.expects('child').never();

  t.throws(apex(crud, makeRecord(invalidUpdateMessage)), 'Invalid payload');

  m.verify();
});

dbtest('remove message', async function(t, db) {
  const m = mock(db.database().ref()
    .child('Engagements')
    .child('cde234'));

  m.expects('remove')
    .once()
    .returns(Promise.resolve({}));

  await apex(crud, makeRecord(removeMessage));

  m.verify();
});

dbtest('invalid remove message', async function(t, db) {
  const m = mock(db.database().ref()
    .child('Engagements'));

  m.expects('child').never();

  t.throws(apex(crud, makeRecord(invalidRemoveMessage)), 'Invalid payload');

  m.verify();
});