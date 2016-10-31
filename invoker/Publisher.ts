import {Producer} from "no-kafka";
import farmhash = require("farmhash");
import {StreamRecord} from "../lib/StreamPublish";

const producer = new Producer({
  clientId: 'invoker',
  connectionString: process.env['KAFKA_CONNECTION'],
  partitioner: function(topic:string, partitions:Kafka.PartitionInfo[], message) {
    const hash = farmhash.hash32(message.key);
    const index = hash % partitions.length;
    return partitions[index].partitionId;
  }
});

export function publishMessage(message:StreamRecord<any>):Promise<void> {
  console.log('publish', message);
  return producer.send({
    topic: message.streamName,
    message: {
      key: message.partitionKey,
      value: JSON.stringify(message.data)
    }
  });
}

export async function publishMessages(messages:StreamRecord<any>[]):Promise<void[]> {
  await producer.init();
  return Promise.all(messages.map(publishMessage));
}
