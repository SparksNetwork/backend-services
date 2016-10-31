import {getFunctions, ApexFunction} from "../bin/lib/apex";
import {Producer, GroupConsumer, RoundRobinAssignment} from "no-kafka";
import {Lambda} from 'aws-sdk';
import Ajv from 'sparks-schemas/lib/ajv';
import * as minimatch from 'minimatch';
import {StreamRecord} from "../lib/StreamPublish";
import * as farmhash from 'farmhash';
import {flatten} from 'ramda';

const ajv = Ajv();

const producer = new Producer({
  clientId: 'dispatch',
  connectionString: process.env['KAFKA_CONNECTION'],
  partitioner: function(topic:string, partitions:Kafka.PartitionInfo[], message) {
    const hash = farmhash.hash32(message.key);
    const index = hash % partitions.length;
    return partitions[index].partitionId;
  }
});

function publishMessage(message:StreamRecord<any>):Promise<void> {
  console.log('publish', message);
  return producer.send({
    topic: message.streamName,
    message: {
      key: message.partitionKey,
      value: JSON.stringify(message.data)
    }
  });
}

async function publishMessages(messages:StreamRecord<any>[]):Promise<void[]> {
  await producer.init();
  return Promise.all(messages.map(publishMessage));
}

function getSchemasFor(fn:ApexFunction) {
  const schemaPatterns = fn.config['schemas'] || [];
  const schemas = schemaPatterns
    .reduce((acc, p) =>
      acc.concat(minimatch.match(Object.keys(ajv['_schemas']), p)), []
    )
    .map(name => ajv.getSchema(name));
  return schemas;
}

function lambdaMessageHandler(fn:ApexFunction) {
  const lambda = new Lambda({
    region: 'us-west-2'
  });

  const schemas = getSchemasFor(fn);
  console.log(schemas.length, 'schemas for', fn.name);

  return async function(message):Promise<StreamRecord<any>[]> {
    if(schemas.some(schema => schema(message))) {
      console.log('sending to', fn.name);

      const response = await lambda.invoke({
        Payload: JSON.stringify(message),
        ClientContext: new Buffer(JSON.stringify({context: 'kafka'})).toString('base64'),
        FunctionName: `sparks_${fn.name}`,
        InvocationType: 'RequestResponse'
      }).promise();

      if (response.FunctionError) {
        throw new Error(response.Payload.toString());
      }

      return flatten([JSON.parse(response.Payload as any)]);
    } else {
      return [];
    }
  }
}

function dataHandlerForFunction(fn:ApexFunction, consumer:GroupConsumer):Kafka.DataHandler {
  const handler = lambdaMessageHandler(fn);

  return async function(messageSet, topic, partition) {
    return Promise.all(messageSet.map(async function(message) {
      const offset: Kafka.CommitOffset = {
        topic,
        partition,
        offset: message.offset
      };

      try {
        const payload = JSON.parse(message.message.value);
        const newMessages = await handler(payload);
        await publishMessages(newMessages);
        return consumer.commitOffset(offset);
      } catch(error) {
        console.error(fn.name, 'error handling message on topic', topic, partition);
        console.error(error);
        throw error;
      }
    }));
  }
}

async function consumerForFunction(fn:ApexFunction) {
  const consumer = new GroupConsumer({
    groupId: fn.name,
    connectionString: process.env['KAFKA_CONNECTION'],
    idleTimeout: 100,
  });

  await consumer.init({
    strategy: 'ConsumerStrategy',
    subscriptions: [fn.config['stream']],
    fn: RoundRobinAssignment,
    handler: dataHandlerForFunction(fn, consumer)
  });
}

getFunctions(function (err, functions) {
  functions.filter(function(fn) {
    return fn.config['stream'];
  }).forEach(function(fn) {
    consumerForFunction(fn);
  });
});