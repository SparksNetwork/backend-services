declare interface ClientContext {
  context: 'kafka' | 'kinesis' | 'local'
}

declare interface KafkaContext extends ClientContext {
  context: 'kafka';
  topic: string;
  partition: number;
}

declare interface KinesisContext extends ClientContext {
  context: 'kinesis';
}

declare interface LocalContext extends ClientContext {
  context: 'local';
}