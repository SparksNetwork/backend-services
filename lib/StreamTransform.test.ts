import {test} from 'ava';
import {StreamTransform} from "./StreamTransform";
import {SinonStub} from "sinon";
const AWS = require('aws-sdk-mock');

const inputEvent = {
  Records: [{
    awsRegion: 'us-west-2',
    eventName: 'aws:kinesis:record',
    eventSource: 'aws:kinesis',
    eventSourceARN: 'arn:aws:test',
    eventVersion: '1.0.0',
    invokeIdentityArn: 'arn:aws:test',
    eventID: '0001',
    kinesis: {
      sequenceNumber: '0001',
      partitionKey: 'abc123',
      kinesisSchemaVersion: '1.0.0',
      data: new Buffer(JSON.stringify({test: 'data'})).toString('base64')
    }
  }]
};

test.afterEach(() => AWS.restore());

test.serial('single record', async function(t) {
  const func = StreamTransform(() => true, async function() {
    return [{
      streamName: "test-stream",
      partitionKey: "moose",
      data: {my: "data"}
    }]
  });

  const putRecords = AWS.mock("Kinesis", "putRecords");
  await func(inputEvent, {context: 'kinesis'});

  const stub:SinonStub = putRecords.stub;
  t.is(stub.callCount, 1);

  const params = stub.firstCall.args[0];
  t.is(params.StreamName, "test-stream");

  const records = params.Records;
  t.is(records.length, 1);

  const record = records[0];
  t.is(record.PartitionKey, "moose");

  const data = JSON.parse(record.Data);
  t.deepEqual(data, {my: "data"});
});

test.serial('multiple records', async function(t) {
  const func = StreamTransform(() => true, async function():Promise<any[]> {
    return [
      {
        streamName: "test-stream",
        partitionKey: "moose",
        data: {my: "data"}
      },
      {
        streamName: "test-stream",
        partitionKey: "joy",
        data: {your: "data"}
      }
    ]
  });

  const putRecords = AWS.mock("Kinesis", "putRecords");
  await func(inputEvent, {context: 'kinesis'});

  const stub:SinonStub = putRecords.stub;
  t.is(stub.callCount, 1);

  const params = stub.firstCall.args[0];
  t.is(params.StreamName, "test-stream");

  const records = params.Records;
  t.is(records.length, 2);

  const record1 = records[0];
  t.is(record1.PartitionKey, "moose");

  const data1 = JSON.parse(record1.Data);
  t.deepEqual(data1, {my: "data"});

  const record2 = records[1];
  t.is(record2.PartitionKey, "joy");

  const data2 = JSON.parse(record2.Data);
  t.deepEqual(data2, {your: "data"});
});

test.serial('multiple records to multiple streams', async function(t) {
  const func = StreamTransform(() => true, async function():Promise<any[]> {
    return [
      {
        streamName: "test-stream",
        partitionKey: "moose",
        data: {my: "data"}
      },
      {
        streamName: "test-stream2",
        partitionKey: "joy",
        data: {your: "data"}
      }
    ]
  });

  const putRecords = AWS.mock("Kinesis", "putRecords");
  await func(inputEvent, {context: 'kinesis'});

  const stub:SinonStub = putRecords.stub;
  t.is(stub.callCount, 2);

  const params1 = stub.firstCall.args[0];
  t.is(params1.StreamName, "test-stream");

  const records1 = params1.Records;
  t.is(records1.length, 1);

  const record1 = records1[0];
  t.is(record1.PartitionKey, "moose");

  const data1 = JSON.parse(record1.Data);
  t.deepEqual(data1, {my: "data"});

  const params2 = stub.secondCall.args[0];
  t.is(params2.StreamName, "test-stream2");

  const records2 = params2.Records;
  t.is(records2.length, 1);

  const record2 = records2[0];
  t.is(record2.PartitionKey, "joy");

  const data2 = JSON.parse(record2.Data);
  t.deepEqual(data2, {your: "data"});
});

test.serial('error in transform function', async function(t) {
  const func = StreamTransform(() => true, async function():Promise<any> {
    throw new Error('An error');
  });

  const putRecords = AWS.mock("Kinesis", "putRecords");
  t.throws(func(inputEvent, {context: 'kinesis'}), "An error");
  t.falsy(putRecords.stub);
});