import {Producer} from "no-kafka";
import farmhash = require("farmhash");
import {StreamRecord} from "../lib/StreamPublish";
import {debug} from "./log";

function farmhashPartitioner(topic:string, partitions:Kafka.PartitionInfo[], message) {
  const hash = farmhash.hash32(message.key);
  const index = hash % partitions.length;
  return partitions[index].partitionId;
}

export class Publisher {
  private producer:Producer;

  constructor(options) {
    this.producer = new Producer(Object.assign({}, {
      clientId: 'invoker',
      connectionString: process.env['KAFKA_CONNECTION'],
      partitioner: farmhashPartitioner
    }, options));
  }

  init() {
    return this.producer.init();
  }

  end() {
    return this.producer.end();
  }

  publishMessages(messages:StreamRecord<any>[]) {
    debug('publishing', messages);

    const topicMessages = messages.map(message => {
      return {
        topic: message.streamName,
        message: {
          key: message.partitionKey,
          value: JSON.stringify(message.data)
        }
      }
    });

    return this.producer.send(topicMessages);
  }

  publishMessage(message:StreamRecord<any>) {
    return this.publishMessages([message]);
  }
}
