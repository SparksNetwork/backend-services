import {spy, stub, mock} from 'sinon';
import service from './index';
import {test} from 'ava';
import {ArrivalsCreateCommand} from 'sparks-schemas/types/commands/ArrivalsCreate';
import {ArrivalsRemoveCommand} from 'sparks-schemas/types/commands/ArrivalsRemove';
import KinesisFunction from "../../test/KinesisFunction";
import {MockFirebase, MockSnapshot} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/Firebase";

const db = new MockFirebase();
const userRef = db.database().child('Users').child('abc123');
userRef.set('tyu678');

establishConnection('arrivals', db);

const AWS = require('aws-sdk-mock');
test.beforeEach(() => AWS.restore());

async function StreamTransform(message, service, params?:{PartitionKey:string, StreamName:string}) {
  const putRecord = AWS.mock('Kinesis', 'putRecord');
  await KinesisFunction(message, service);
  const stub = putRecord.stub;
  AWS.restore('Kinesis', 'putRecord');
  if(!stub) { throw new Error('Sent no message'); }
  if(stub.callCount > 1) { throw new Error(`Sent more than one message (${stub.callCount})`); }
  const putRecordArgs = stub.firstCall.args[0];
  return JSON.parse(putRecordArgs.Data);
}

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

  const data = await StreamTransform(message, service, {
    PartitionKey: 'abc123',
    StreamName: 'internal.data'
  });

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

  t.throws(StreamTransform(message, service), 'Already arrived');
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

  const data = await StreamTransform(message, service);

  t.deepEqual(data, {
    domain: 'Arrivals',
    action: 'remove',
    key: '-Kui88'
  });
});