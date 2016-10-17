import service from './index';
import {test} from 'ava';
import {EngagementsPayCommand} from 'sparks-schemas/types/commands/EngagementsPay'
import {StreamTransform} from "../../test/StreamTransform";
import {data} from 'sparks-schemas/generator';
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {MockFirebase} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/ExternalFactories/Firebase";

const dataUpdate = data('Engagements.update');

const braintree = {

};
BraintreeGateway(braintree);

const db = new MockFirebase();
establishConnection('engagementsPayment', db);

test.serial('paying for an engagement', async function(t) {
  const command:EngagementsPayCommand = {
    domain: 'Engagements',
    action: 'pay',
    uid: 'abc123',
    payload: {
      key: 'eng123',
      values: {
        paymentNonce: 'nonce123'
      }
    }
  };

  const [message] = await StreamTransform(command, service);
  t.is(message.streamName, 'data.firebase');
  t.is(message.partitionKey, 'abc123');

  const {data} = message;
  const valid = await dataUpdate(data);
  const errors = (dataUpdate as any).errors as any[];
  t.true(valid, errors && errors.map(e => e.message).join(' '));

  t.deepEqual(data.values, {
    isPaid: true
  })
});

test('payment failure', async function(t) {

});

test('confirm without payment', async function(t) {

});

test('attempt to confirm without payment when payment due', async function(t) {

});