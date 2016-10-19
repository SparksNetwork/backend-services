import {test} from 'ava';
import {StreamPublish} from './StreamPublish';
import {SinonStub} from "sinon";

const AWS = require('aws-sdk-mock');
test.afterEach(() => AWS.restore());

test.serial('1 message', async function(t) {
  const putRecords = AWS.mock("Kinesis", "putRecords");

  await StreamPublish([{
    streamName: 'test-stream',
    partitionKey: 'moose',
    data: {
      my: 'data'
    }
  }]);

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

test.serial('2 messages, different streams', async function(t) {
  const putRecords = AWS.mock("Kinesis", "putRecords");

  await StreamPublish([
    {
      streamName: 'test-stream',
      partitionKey: 'moose',
      data: {
        my: 'data'
      },
    },
    {
      streamName: 'other-stream',
      partitionKey: 'mouse',
      data: {
        some: 'data'
      }
    }
  ]);

  const stub:SinonStub = putRecords.stub;
  t.is(stub.callCount, 2);

  const params1 = stub.firstCall.args[0];
  t.is(params1.StreamName, "test-stream");
  t.is(params1.Records.length, 1);

  const params2 = stub.secondCall.args[0];
  t.is(params2.StreamName, 'other-stream');
  t.is(params2.Records.length, 1);
});

test.serial('101 messages, same stream', async function(t) {
  const putRecords = AWS.mock("Kinesis", "putRecords");
  const messages = [];

  for(let i = 0; i < 101; i++) {
    messages.push({
      streamName: 'test-stream',
      partitionKey: 'moose',
      data: {
        N: i,
        my: 'data'
      }
    })
  }

  await StreamPublish(messages);

  const stub:SinonStub = putRecords.stub;
  t.is(stub.callCount, 2);

  const params1 = stub.firstCall.args[0];
  t.is(params1.StreamName, 'test-stream');
  t.is(params1.Records.length, 100);

  const params2 = stub.secondCall.args[0];
  t.is(params2.StreamName, 'test-stream');
  t.is(params2.Records.length, 1);
});
