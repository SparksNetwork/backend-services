import {ApexFunction} from "../bin/lib/apex";
import {GroupConsumer} from "no-kafka";
import {RoundRobinAssignment} from "no-kafka";
import {Lambda} from 'aws-sdk';
import {StreamRecord} from "../lib/StreamPublish";
import {flatten, filter, identity} from 'ramda';
import {getSchemasFor} from "./schemas";
import {publishMessages} from "./Publisher";

abstract class FunctionConsumer {
  private consumer:GroupConsumer;
  private schemas:((message:any) => boolean)[];

  constructor(protected fn:ApexFunction, protected options?:Kafka.GroupConsumerOptions) {
    if (!fn.config['stream']) {
      throw new Error(`The function ${fn.name} does not have a stream specified`);
    }

    this.schemas = getSchemasFor(fn);
  }

  protected abstract async messageHandler(message);

  private async rawMessageHandler(rawMessage, topic, partition) {
    const offset: Kafka.CommitOffset = {
      topic,
      partition,
      offset: rawMessage.offset
    };

    let message;

    try {
      message = JSON.parse(rawMessage.message.value);
    } catch(error) {
      console.error(this.fn.name, 'error parsing message on topic', topic, partition);
      console.error(rawMessage);
      return this.consumer.commitOffset(offset);
    }

    if (this.schemas.length === 0 || this.schemas.every(schema => !schema(message))) {
      console.log(this.fn.name, 'no schema matches on', topic);
      return this.consumer.commitOffset(offset);
    }

    const newMessages = await this.messageHandler(message);
    await publishMessages(filter<any>(identity, newMessages));

    return this.consumer.commitOffset(offset);
  }

  private async dataHandler(rawMessages, topic, partition) {
    return Promise.all(rawMessages.map(rawMessage =>
      this.rawMessageHandler(rawMessage, topic, partition)));
  }

  async runFor(time:number) {
    this.consumer = new GroupConsumer(Object.assign({}, {
      clientId: 'invoker',
      groupId: this.fn.name,
      idleTimeout: 100,
    }, this.options));

    await this.consumer.init({
      strategy: 'ConsumerStrategy',
      subscriptions: [this.fn.config['stream']],
      fn: RoundRobinAssignment,
      handler: this.dataHandler.bind(this)
    });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.consumer.end()
          .then(() => resolve())
          .catch(reject)
      }, time)
    });
  }
}

export class LambdaFunctionConsumer extends FunctionConsumer {
  private lambda:Lambda;

  constructor(protected fn:ApexFunction, protected options?:Kafka.GroupConsumerOptions) {
    super(fn, options);

    this.lambda = new Lambda({
      region: process.env['AWS_REGION']
    });
  }

  async messageHandler(message):Promise<StreamRecord<any>[]> {
    console.log('sending to', this.fn.name);

    const response = await this.lambda.invoke({
      Payload: JSON.stringify(message),
      ClientContext: new Buffer(JSON.stringify({context: 'kafka'})).toString('base64'),
      FunctionName: `sparks_${this.fn.name}`,
      InvocationType: 'RequestResponse'
    }).promise();

    if (response.FunctionError) {
      throw new Error(response.Payload.toString());
    }

    return flatten([JSON.parse(response.Payload as any)]);
  }
}

export class LocalFunctionConsumer extends FunctionConsumer {
  private local:(event:any, ctx: {clientContext: {context: 'kafka'}}) => Promise<any[]>;

  constructor(protected fn:ApexFunction, protected options?:Kafka.GroupConsumerOptions) {
    super(fn, options);
    const module = require('../' + fn.path);
    if (typeof module.default === 'function') {
      this.local = module.default;
    } else if (typeof module === 'function') {
      this.local = module;
    } else {
      throw new Error(`Function ${fn.name} does not export a function`);
    }
  }

  async messageHandler(message) {
    const response = await this.local(
      JSON.stringify(message),
      {clientContext: { context: 'kafka' }}
    );

    return flatten([response]);
  }
}