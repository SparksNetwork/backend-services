import {Readable} from 'stream';
import Record = Kinesis.Record;
import {Kinesis} from "aws-sdk";

export default class ShardStream extends Readable {
  private client:Kinesis;
  private shardId:string;
  private nextIterator:string;
  private waitingRecords:Record[];

  constructor(client, shardId) {
    super({
      objectMode: true,
      highWaterMark: 100
    });

    this.client = client;
    this.shardId = shardId;
    this.waitingRecords = [];
  }

  private getIterator() {
    this.client.getShardIterator({
      ShardId: this.shardId,
      ShardIteratorType: "LATEST"
    }, (err, response:Kinesis.GetShardIteratorResponse) => {
      if (err) { return setImmediate(() => this.emit('error', err)); }
      this.nextIterator = response.ShardIterator;
      setImmediate(() => this.getNextRecords());
    })
  }

  private drainWaitingRecords() {
    const drained = this.waitingRecords.slice();
    this.waitingRecords = [];
    return this.pushRecords(drained);
  }

  private pushRecords(records:Kinesis.Record[]) {
    let canPush = true;

    records.forEach(record => {
      if (canPush) {
        canPush = this.push(record);
      } else {
        this.waitingRecords.push(record);
      }
    });

    return canPush;
  }

  private getNextRecords() {
    if (!this.drainWaitingRecords()) { return }

    if (this.nextIterator === null) {
      this.push(null);
    }

    this.client.getRecords({
      ShardIterator: this.nextIterator,
      Limit: 100
    }, (err, data:Kinesis.GetRecordsResponse) => {
      if (err) { return setImmediate(() => this.emit('error', err)); }

      this.nextIterator = data.NextShardIterator;

      if (this.pushRecords(data.Records)) {
        setTimeout(() => this.getNextRecords(), 200);
      }
    })
  }

  _read() {
    if (this.nextIterator) {
      this.getNextRecords();
    } else {
      this.getIterator();
    }
  }
}

