/**
 * Script to run a function locally.
 */
import Shard = Kinesis.Shard;
import * as aws from 'aws-sdk';
import ShardRecord = Kinesis.Record;
const https = require('https');
import ShardStream from "../lib/ShardStream";
const unique = require('unique-stream');

function usage() {
  console.log('kinesis-simulator.js <stream-name> <function-name> [...<function-name>]');
  process.exit(1);
}

const streamName = process.argv[1]
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

async function getShards() {
  const stream = await kinesis.describeStream({}).promise();
  return stream.StreamDescription.Shards
}

async function start() {
  console.log('starting');
  const shards = await getShards();
  const streams = shards.map(shard => {
    return new ShardStream(kinesis, shard.ShardId);
  });

  const fns = functionNames.map(functionName => {
    return require(`../functions/${functionName}/index.js`).default;
  });

  const stream = unique('SequenceNumber');
  streams.forEach(s => s.pipe(stream));

  stream.on('data', data => {
    fns.forEach(fn => fn(data));
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
