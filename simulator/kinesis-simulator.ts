/**
 * Script to run a function locally.
 */
require('source-map-support').install();

import * as aws from 'aws-sdk';
import Shard = Kinesis.Shard;
import ShardRecord = Kinesis.Record;
const https = require('https');
import ShardStream from "../lib/ShardStream";
const unique = require('unique-stream');

function usage() {
  console.log('kinesis-simulator.js <stream-name> <function-name> [...<function-name>]');
  process.exit(1);
}

const streamName = process.argv[2];
const functionNames = process.argv.slice(3);

if (!streamName) { usage(); }
if (functionNames.length < 1) { usage(); }

const agent = new https.Agent({
  rejectUnauthorized: false
});
const kinesis = new aws.Kinesis({
  endpoint: process.env['KINESIS_ENDPOINT'],
  httpOptions: {agent},
  params: {StreamName: streamName}
});

function sleep(ms:number):Promise<any> {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function waitForReady() {
  let stream;
  let state = 'CREATING';

  while (state === 'CREATING') {
    await sleep(500);
    stream = await kinesis.describeStream({}).promise();
    state = stream.StreamDescription.StreamStatus;
  }

  return stream;
}

async function getShards() {
  try {
    const stream = await waitForReady();
    return stream.StreamDescription.Shards
  } catch (err) {
    await kinesis.createStream({
      ShardCount: 1
    }).promise();

    return await getShards();
  }
}

function StreamRecordToEvent(record:ShardRecord):Lambda.KinesisEvent {
  return {
    Records: [{
      awsRegion: 'us-west-2',
      eventName: 'aws:kinesis:record',
      eventSource: 'aws:kinesis',
      eventSourceARN: 'arn:aws:simulated/stream',
      eventVersion: '1.0.0',
      invokeIdentityArn: 'arn:aws:simulated',
      eventID: '0001',
      kinesis: {
        kinesisSchemaVersion: '1.0.0',
        sequenceNumber: record.SequenceNumber,
        partitionKey: record.PartitionKey,
        data: record.Data.toString('base64')
      }
    }]
  };
}

async function start() {
  const shards = await getShards();
  console.log(`${shards.length} shards`);

  const streams = shards.map(shard => {
    return new ShardStream(kinesis, shard.ShardId, "TRIM_HORIZON");
  });

  const fns = functionNames.map(functionName => {
    return require(`../functions/${functionName}/index.js`).default;
  });

  const stream = unique('SequenceNumber');
  streams.forEach(s => s.pipe(stream));

  stream.on('data', data => {
    const event = StreamRecordToEvent(data);

    fns.forEach(fn => {
      fn(event, {}, function(err, data) {
        console.log(err, data);
      });
    });
  });
  stream.on('error', err => {
    console.log('error', err)
  });
  stream.on('end', () => {
    console.log('end');
  });
}

start()
  .then(() => console.log('started'))
  .catch(err => console.error('[error]', err));
