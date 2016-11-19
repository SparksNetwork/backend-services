import {spy} from 'sinon';
import {test} from 'ava';
import {SinonSpy} from "sinon";
import {StreamFunction} from "./StreamFunction";

let seq = 0;
function generateEvent(message) {
  return {
    awsRegion: 'us-west-2',
    eventName: 'aws:kinesis:record',
    eventSource: 'aws:kinesis',
    eventSourceARN: 'arn:aws:test',
    eventVersion: '1.0.0',
    invokeIdentityArn: 'arn:aws:test',
    eventID: `${++seq}`,
    kinesis: {
      sequenceNumber: `${++seq}`,
      partitionKey: 'abc123',
      kinesisSchemaVersion: '1.0.0',
      data: new Buffer(JSON.stringify(message)).toString('base64')
    }
  };
}

test.serial('invokes function for only matching records', async function(t) {
  const fn:SinonSpy = spy(() => Promise.resolve(true));
  const validate = message => message.valid;
  const sf = StreamFunction(validate, fn);

  const events = [
    {
      Records: [
        generateEvent({id: 1, valid: true}),
        generateEvent({id: 2, valid: false})
      ]
    },
    {
      Records: [
        generateEvent({id: 3, valid: true})
      ]
    }
  ];

  await Promise.all(events.map(event => sf(event, {context: 'kinesis'})));

  t.is(fn.callCount, 2);
  const message1 = fn.firstCall.args[0];
  const message2 = fn.secondCall.args[0];

  t.is(message1.id, 1);
  t.is(message2.id, 3);
});