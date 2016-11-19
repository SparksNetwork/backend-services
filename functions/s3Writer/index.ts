import * as zlib from 'zlib';
import * as apex from 'apex.js';
import {S3} from 'aws-sdk';
import {groupBy, head, last} from 'ramda'

const bucket = process.env['BUCKET'];
const s3Client:S3 = new S3({
  params: {
    Bucket: bucket
  }
});

interface KinesisEventRecord {
  eventSourceARN:string;
  kinesis: {
    partitionKey: string;
    sequenceNumber: string;
    data: string;
  }
}

interface KinesisEvent {
  Records: KinesisEventRecord[];
}

const byPartitionKey = groupBy<KinesisEventRecord>(record =>
  [
    record.eventSourceARN.split('/').slice(-1)[0],
    record.kinesis.partitionKey
  ].join('/')
);

function gzip(data):Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.gzip(data, (err, buffer) => {
      if (err) { return reject(err); }
      resolve(buffer);
    });
  })
}

function savePartition(streamName:string, partitionKey:string, records:KinesisEventRecord[]) {
  const sequenceNumbers = records.map(r => r.kinesis.sequenceNumber);
  const [from, to] = [head(sequenceNumbers), last(sequenceNumbers)];
  const key = [streamName, partitionKey, [from, to].join('-')].join('/');
  const data = records.map(record => record.kinesis.data.trim()).join("\n");

  return gzip(data)
    .then(buffer => s3Client.putObject({
        Key: key,
        Body: buffer,
        ContentEncoding: 'gzip'
      } as any).promise()
    ).then(s3Response => ({
      Key: key,
      Bucket: bucket,
      ETag: s3Response.ETag
    }));
}

export default apex(async function(event:KinesisEvent, ctx) {
  if (ctx.clientContext.context !== 'kinesis') { return; }

  const partitions = byPartitionKey(event.Records);
  const promises = Object.keys(partitions).map(key => {
    const [streamName, partitionKey] = key.split('/');
    const records = partitions[key];
    return savePartition(streamName, partitionKey, records);
  });
  return Promise.all(promises);
});

