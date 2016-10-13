import {spy, stub, mock} from 'sinon'
import Firebase from '../../lib/Firebase'
import crud from './index';
import {ArrivalsCreateCommand} from 'sparks-schemas/types/commands/ArrivalsCreate';
import {CommitmentsUpdateCommand} from 'sparks-schemas/types/commands/CommitmentsUpdate';
import {EngagementsRemoveCommand} from 'sparks-schemas/types/commands/EngagementsRemove';
import {test} from "ava";
import {SinonSpy} from "sinon";
import {SinonStub} from "sinon";
import {SinonMock} from "sinon";
import {SinonExpectation} from "sinon";
import {apex} from "../../test/apex";
import {MockDatabase, MockFirebase} from "../../test/MockFirebase";

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

const removeMessage:EngagementsRemoveCommand = {
  domain: "Engagements",
  action: "remove",
  uid: "abc123",
  payload: {
    key: "cde234"
  }
};

function makeRecord(message) {
  return {
    Data: JSON.stringify(message)
  }
}

const db = new MockFirebase();
Firebase.establishConnection('crud', db);

test('create message', async function() {
  const m = mock(db.database().ref().child('Arrivals'));
  m.expects('push')
    .withArgs(createMessage.payload.values)
    .returns(Promise.resolve({}));

  await apex(crud, makeRecord(createMessage));

  m.verify();
});

test('update message', async function() {
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

test('remove message', async function() {
  const m = mock(db.database().ref()
    .child('Engagements')
    .child('cde234'));

  m.expects('remove')
    .once()
    .returns(Promise.resolve({}))

  await apex(crud, makeRecord(removeMessage));

  m.verify();
});