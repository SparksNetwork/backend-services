import {spy, stub, mock} from 'sinon';
import service from './index';
import {test} from 'ava';
import {ArrivalsCreateCommand, ArrivalsCreatePayload} from 'sparks-schemas/types/commands/ArrivalsCreate';
import KinesisFunction from "../../test/KinesisFunction";
import {MockFirebase, MockSnapshot} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/Firebase";

const db = new MockFirebase();
const userRef = db.database().child('Users').child('abc123');
userRef.set('tyu678');

establishConnection('arrivals', db);

const AWS = require('aws-sdk-mock');
test.beforeEach(() => AWS.restore());

test.serial('create', async function(t) {
  const putRecord = AWS.mock('Kinesis', 'putRecord');
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

  await KinesisFunction(message, service);

  t.is(putRecord.stub.callCount, 1);
  const params = putRecord.stub.firstCall.args[0];
  const data = JSON.parse(params.Data);

  t.is(params.PartitionKey, 'abc123');
  t.is(params.StreamName, 'internal.data');

  t.is(data.domain, 'Arrivals');
  t.is(data.action, 'create');
  t.is(data.key, 'cde234-bce234');
  t.is(data.values.projectKey, 'cde234');
  t.is(data.values.profileKey, 'bce234');
  t.is(data.values.ownerProfileKey, 'tyu678');
  t.is(data.values.arrivedAt, now.returnValues[0]);
});

test.serial('create already arrived', async function(t) {
  const putRecord = AWS.mock('Kinesis', 'putRecord');

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

  t.throws(KinesisFunction(message, service), 'Already arrived');
  t.falsy(putRecord.stub)
});