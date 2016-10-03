"use strict";
const stream_1 = require('stream');
class ShardStream extends stream_1.Readable {
    constructor(client, shardId) {
        super({
            objectMode: true,
            highWaterMark: 100
        });
        this.client = client;
        this.shardId = shardId;
        this.waitingRecords = [];
    }
    getIterator() {
        this.client.getShardIterator({
            ShardId: this.shardId,
            ShardIteratorType: "LATEST"
        }, (err, response) => {
            if (err) {
                return setImmediate(() => this.emit('error', err));
            }
            this.nextIterator = response.ShardIterator;
            setImmediate(() => this.getNextRecords());
        });
    }
    drainWaitingRecords() {
        const drained = this.waitingRecords.slice();
        this.waitingRecords = [];
        return this.pushRecords(drained);
    }
    pushRecords(records) {
        let canPush = true;
        records.forEach(record => {
            if (canPush) {
                canPush = this.push(record);
            }
            else {
                this.waitingRecords.push(record);
            }
        });
        return canPush;
    }
    getNextRecords() {
        if (!this.drainWaitingRecords()) {
            return;
        }
        if (this.nextIterator === null) {
            this.push(null);
        }
        this.client.getRecords({
            ShardIterator: this.nextIterator,
            Limit: 100
        }, (err, data) => {
            if (err) {
                return setImmediate(() => this.emit('error', err));
            }
            this.nextIterator = data.NextShardIterator;
            if (this.pushRecords(data.Records)) {
                setTimeout(() => this.getNextRecords(), 200);
            }
        });
    }
    _read() {
        if (this.nextIterator) {
            this.getNextRecords();
        }
        else {
            this.getIterator();
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ShardStream;
