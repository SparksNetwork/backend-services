import {Readable} from 'stream';
import {Kinesis} from "aws-sdk";
import ShardIteratorType = Kinesis.Types.ShardIteratorType;

/**
 * Create a readable stream from a kinesis shard
 */
export default class ShardStream extends Readable {
  private nextIterator:string;
  private waitingRecords:Kinesis.Types.Record[] = [];

  constructor(private client:Kinesis, private streamName:string, private shardId:string, private iteratorType:ShardIteratorType = "LATEST") {
    super({
      objectMode: true,
      highWaterMark: 100
    });
  }

  private getIterator() {
    this.client.getShardIterator({
      StreamName: this.streamName,
      ShardId: this.shardId,
      ShardIteratorType: this.iteratorType
    }, (err, response:Kinesis.Types.GetShardIteratorOutput) => {
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

  private pushRecords(records:Kinesis.Types.Record[]) {
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
    }, (err, data:Kinesis.Types.GetRecordsOutput) => {
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

