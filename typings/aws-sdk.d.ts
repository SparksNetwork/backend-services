interface ServiceOptions {
  apiVersion?:string;
  endpoint?:string;
  accessKeyId?:string;
  secretAccessKey?:string;
  sessionToken?:string;
  credentials?:any;
  credentialProvider?:any;
  region?:string;
  maxRetries?:number;
  maxRedirects?:number;
  sslEnabled?:boolean;
  paramValidation?:any;
  convertResponseTypes?:boolean;
  correctClockSkew?:boolean;
  httpOptions?: {
    proxy?:string;
    agent?:any;
    timeout?:number;
  };
}

declare namespace Lambda {
  interface KinesisRecord {
    partitionKey: string;
    kinesisSchemaVersion: string;
    data: string;
    sequenceNumber: string;
  }

  interface KinesisEventRecord {
    kinesis: KinesisRecord;
    eventSource: "aws:kinesis";
    eventID: string;
    invokeIdentityArn: string;
    eventVersion: string;
    eventName: "aws:kinesis:record";
    eventSourceARN: string;
    awsRegion: string;
  }

  interface KinesisEvent {
    Records:KinesisEventRecord[];
  }
}

declare namespace Kinesis {
  interface Options extends ServiceOptions {
    params?:any;
  }

  interface PutRecordParams {
    Data: Buffer|string;
    PartitionKey?: string;
    StreamName?: string;
  }

  interface PutRecordResponse {
    ShardId: string;
    SequenceNumber: string;
  }

  interface PutRecordsRecord {
    Data: Buffer|string;
    ExplicitHashKey?: string;
    PartitionKey: string;
  }

  interface PutRecordsParams {
    Records: PutRecordsRecord[];
    StreamName?: string;
  }

  interface PutRecordsResponseRecord {
    SequenceNumber: string;
    ShardId: string;
    ErrorCode?: string;
    ErrorMessage?: string;
  }

  interface PutRecordsResponse {
    FailedRecordCount: number;
    Records: PutRecordsResponseRecord[];
  }

  interface CreateStreamParams {
    StreamName?: string;
    ShardCount: number;
  }

  interface CreateStreamResponse {

  }

  interface DescribeStreamParams {
    StreamName?: string;
    Limit?: number;
    ExclusiveStartShardId?: string;
  }

  interface Shard {
    ShardId: string;
    ParentShardId?: string;
    AdjacentParentShardId?: string;
    HashKeyRange: {
      StartingHashKey: string;
      EndingHashKey: string;
    };
    SequenceNumberRange: {
      StartingSequenceNumber: string;
      EndingSequenceNumber?: string;
    };
  }

  type ShardLevelMetrics = 'ALL'|'IncomingBytes'|'IncomingRecords'|
    'OutgoingBytes'|'OutgoingRecords'|'WriteProvisionedThroughputExceeded'|
    'ReadProvisionedThroughputExceeded'|'IteratorAgeMilliseconds';

  interface EnhancedMonitoring {
    ShardLevelMetrics: ShardLevelMetrics[];
  }

  interface DescribeStreamResponse {
    StreamDescription: {
      StreamName: string;
      StreamARN: string;
      StreamStatus: 'CREATING'|'DELETING'|'ACTIVE'|'UPDATING';
      Shards: Shard[];
      HasMoreShards: boolean;
      RetentionPeriodHours: number;
      EnhancedMonitoring: EnhancedMonitoring[];
    };
  }

  interface GetRecordsParams {
    ShardIterator?: string;
    Limit?: number;
  }

  export interface Record {
    SequenceNumber: string;
    ApproximateArrivalTimestamp?: Date;
    Data: Buffer;
    PartitionKey: string;
  }

  interface GetRecordsResponse {
    Records: Record[];
    NextShardIterator: string|null;
    MillisBehindLatest: number;
  }

  type ShardIteratorType = 'AT_SEQUENCE_NUMBER' |
    'AFTER_SEQUENCE_NUMBER' |
    'AT_TIMESTAMP' |
    'TRIM_HORIZON' |
    'LATEST';

  interface GetShardIteratorParams {
    StreamName?: string;
    ShardId?: string;
    ShardIteratorType?: ShardIteratorType;
    StartingSequenceNumber?: string;
    Timestamp?: string|number;
  }

  interface GetShardIteratorResponse {
    ShardIterator: string;
  }
}

declare namespace S3 {
  interface Options extends ServiceOptions {
    params?: {
      Bucket?:string;
    }
  }

  interface Params {
    SSECustomerAlgorithm?: string;
    SSECustomerKey?: Buffer | string;
    SSECustomerKeyMD5?: string;
    RequestPayer?: 'requester';
  }

  interface Response {
    SSECustomerAlgorithm?: string;
    SSECustomerKeyMD5?: string;
    SSEKMSKeyId?: string;
    RequestCharged?: string;
  }

  interface PutObjectParams extends Params {
    Bucket?: string;
    Key?: string;
    ACL?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read' | 'aws-exec-read' | 'bucket-owner-read' | 'bucker-owner-full-control';
    Body: Buffer | string | {read:any, length:number};
    CacheControl?: string;
    ContentDisposition?: string;
    ContentEncoding?: string;
    ContentLanguage?: string;
    ContentLength?: number;
    ContentMD5?: string;
    ContentType?: string;
    Expires?: Date | string | number;
    GrantFullControl?: string;
    GrantRead?: string;
    GrantReadACP?: string;
    GrantWriteACP?: string;
    Metadata?: {[index:string]:string};
    ServerSideEncryption?: 'AES256' | 'aws:kms';
    StorageClass?: 'STANDARD' | 'REDUCED_REDUNDANCY' | 'STANDARD_IA';
    WebsiteRedirectLocation?: string;
  }

  interface PutObjectResponse extends Response {
    Expiration: string;
    ETag: string;
    ServerSideEncryption?: 'AES256' | 'aws:kms';
    VersionId?: string;
  }
}

declare module 'aws-sdk' {
  type Callback<T> = (err: any, data: T) => void;

  interface Response<T> {
    promise(): Promise<T>;
  }

  export class Kinesis {
    constructor(options?: Kinesis.Options);

    putRecord(params: Kinesis.PutRecordParams,
              callback?: Callback<Kinesis.PutRecordResponse>): Response<Kinesis.PutRecordResponse>;

    putRecords(params: Kinesis.PutRecordsParams,
              callback?: Callback<Kinesis.PutRecordsResponse>): Response<Kinesis.PutRecordsResponse>;

    createStream(params: Kinesis.CreateStreamParams,
                 callback?: Callback<Kinesis.CreateStreamResponse>): Response<Kinesis.CreateStreamResponse>;

    describeStream(params: Kinesis.DescribeStreamParams,
                   callback?: Callback<Kinesis.DescribeStreamResponse>): Response<Kinesis.DescribeStreamResponse>;

    getRecords(params: Kinesis.GetRecordsParams,
               callback?: Callback<Kinesis.GetRecordsResponse>): Response<Kinesis.GetRecordsResponse>

    getShardIterator(params: Kinesis.GetShardIteratorParams,
                     callback?: Callback<Kinesis.GetShardIteratorResponse>): Response<Kinesis.GetShardIteratorResponse>
  }

  export class S3 {
    constructor(options?: S3.Options);

    putObject(params: S3.PutObjectParams, callback?: Callback<S3.PutObjectResponse>): Response<S3.PutObjectResponse>;
  }
}