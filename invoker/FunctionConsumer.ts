import {ApexFunction} from "../bin/lib/apex";
import {GroupConsumer} from "no-kafka";
import {RoundRobinAssignment} from "no-kafka";
import {Lambda} from 'aws-sdk';
import {StreamRecord} from "../lib/StreamPublish";
import {flatten, filter, identity} from 'ramda';
import {publishMessages} from "./Publisher";
import {error, debug} from "./log";

interface Schema {
  (message:any):boolean;
}

/**
 * Implementing classes take an ApexFunction and consume messages from the
 * kafka topics for that ApexFunction that match the schemas.
 */
abstract class FunctionConsumer {
  private consumer:GroupConsumer;

  constructor(protected fn:ApexFunction, protected schemas:Schema[], protected options?:Kafka.GroupConsumerOptions) {
    if (!fn.config['stream']) {
      throw new Error(`The function ${fn.name} does not have a stream specified`);
    }
  }

  protected abstract async messageHandler(message, topic, partition);

  private async rawMessageHandler(rawMessage, topic, partition) {
    const fnStart = Date.now();
    let start = Date.now();

    const offset: Kafka.CommitOffset = {
      topic,
      partition,
      offset: rawMessage.offset
    };

    let message;

    try {
      message = JSON.parse(rawMessage.message.value);
    } catch(err) {
      error(this.fn.name, 'error parsing message on topic', topic, partition);
      error(err);
      error(rawMessage);
      return this.consumer.commitOffset(offset);
    }
    debug(this.fn.name, 'parse time', Date.now() - start);
    start = Date.now();

    if (this.schemas.length === 0 || this.schemas.every(schema => !schema(message))) {
      return this.consumer.commitOffset(offset);
    }

    debug(this.fn.name, 'validation time', Date.now() - start);
    start = Date.now();
    const newMessages = await this.messageHandler(message, topic, partition);
    debug(this.fn.name, 'execution tmie', Date.now() - start);
    start = Date.now();

    await publishMessages(filter<any>(identity, newMessages));
    debug(this.fn.name, 'publish time', Date.now() - start);
    debug(this.fn.name, 'total time', Date.now() - fnStart);

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

  constructor(protected fn:ApexFunction, protected schemas:Schema[], protected options?:Kafka.GroupConsumerOptions) {
    super(fn, schemas, options);

    this.lambda = new Lambda({
      region: process.env['AWS_REGION']
    });
  }

  async messageHandler(message, topic, partition):Promise<StreamRecord<any>[]> {
    debug(this.fn.name, 'sending', message);
    const context:KafkaContext = {
      context: 'kafka',
      topic,
      partition
    };

    const response = await this.lambda.invoke({
      Payload: JSON.stringify(message),
      ClientContext: new Buffer(JSON.stringify(context)).toString('base64'),
      FunctionName: `sparks_${this.fn.name}`,
      InvocationType: 'RequestResponse'
    }).promise();

    if (response.FunctionError) {
      error(this.fn.name, 'error', response);
      throw new Error(response.Payload.toString());
    }

    return flatten([JSON.parse(response.Payload as any)]);
  }
}

export class LocalFunctionConsumer extends FunctionConsumer {
  private local:(event:any, ctx: {clientContext: KafkaContext}) => Promise<any[]>;

  constructor(protected fn:ApexFunction, protected schemas:Schema[], protected options?:Kafka.GroupConsumerOptions) {
    super(fn, schemas, options);
    const module = require('../' + fn.path);
    if (typeof module.default === 'function') {
      this.local = module.default;
    } else if (typeof module === 'function') {
      this.local = module;
    } else {
      throw new Error(`Function ${fn.name} does not export a function`);
    }
  }

  async messageHandler(message, topic, partition) {
    const response = await this.local(
      JSON.stringify(message),
      {clientContext: {
        context: 'kafka',
        topic,
        partition
      }}
    );

    return flatten([response]);
  }
}