"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const aws = require('aws-sdk');
const https = require('https');
const ShardStream_1 = require("../lib/ShardStream");
const unique = require('unique-stream');
function usage() {
    console.log('kinesis-simulator.js <stream-name> <function-name> [...<function-name>]');
    process.exit(1);
}
const streamName = process.argv[1];
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
function getShards() {
    return __awaiter(this, void 0, void 0, function* () {
        const stream = yield kinesis.describeStream({}).promise();
        return stream.StreamDescription.Shards;
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('starting');
        const shards = yield getShards();
        const streams = shards.map(shard => {
            return new ShardStream_1.default(kinesis, shard.ShardId);
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