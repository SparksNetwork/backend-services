"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
/**
 * Script to run a function locally.
 */
require('source-map-support').install();
const aws = require('aws-sdk');
const https = require('https');
const ShardStream_1 = require("../lib/ShardStream");
const unique = require('unique-stream');
function usage() {
    console.log('kinesis-simulator.js <stream-name> <function-name> [...<function-name>]');
    process.exit(1);
}
const streamName = process.argv[2];
const functionNames = process.argv.slice(3);
if (!streamName) {
    usage();
}
if (functionNames.length < 1) {
    usage();
}
const agent = new https.Agent({
    rejectUnauthorized: false
});
const kinesis = new aws.Kinesis({
    endpoint: process.env['KINESIS_ENDPOINT'],
    httpOptions: { agent },
    params: { StreamName: streamName }
});
function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}
function waitForReady() {
    return __awaiter(this, void 0, void 0, function* () {
        let stream;
        let state = 'CREATING';
        while (state === 'CREATING') {
            yield sleep(500);
            stream = yield kinesis.describeStream({}).promise();
            state = stream.StreamDescription.StreamStatus;
        }
        return stream;
    });
}
function getShards() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stream = yield waitForReady();
            return stream.StreamDescription.Shards;
        }
        catch (err) {
            yield kinesis.createStream({
                ShardCount: 1
            }).promise();
            return yield getShards();
        }
    });
}
function StreamRecordToEvent(record) {
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
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        const shards = yield getShards();
        console.log(`${shards.length} shards`);
        const streams = shards.map(shard => {
            return new ShardStream_1.default(kinesis, shard.ShardId, "TRIM_HORIZON");
        });
        const fns = functionNames.map(functionName => {
            return require(`../functions/${functionName}/index.js`).default;
        });
        const stream = unique('SequenceNumber');
        streams.forEach(s => s.pipe(stream));
        stream.on('data', data => {
            const event = StreamRecordToEvent(data);
            fns.forEach(fn => {
                fn(event, {}, function (err, data) {
                    console.log(err, data);
                });
            });
        });
        stream.on('error', err => {
            console.log('error', err);
        });
        stream.on('end', () => {
            console.log('end');
        });
    });
}
start()
    .then(() => console.log('started'))
    .catch(err => console.error('[error]', err));
//# sourceMappingURL=kinesis-simulator.js.map