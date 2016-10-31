declare interface ClientContext {
  context: 'kafka' | 'kinesis'
}

declare interface KafkaContext extends ClientContext {
  context: 'kafka';
  topic: string;
  partition: number;
}

declare interface KinesisContext extends ClientContext {
  context: 'kinesis';
}
