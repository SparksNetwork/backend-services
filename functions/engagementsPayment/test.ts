import service from './index';
import {mock, spy} from 'sinon';
import {test} from 'ava';
import {EngagementsPayCommand} from '@sparksnetwork/sparks-schemas/types/commands/EngagementsPay'
import {EngagementsConfirmCommand} from '@sparksnetwork/sparks-schemas/types/commands/EngagementsConfirm'
import {StreamTransform} from "../../test/StreamTransform";
import Ajv from '@sparksnetwork/sparks-schemas/lib/ajv';
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {MockFirebase} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/ExternalFactories/Firebase";

const ajv = Ajv();

const now = spy(Date, 'now');
test.afterEach(() => now.reset());

const braintree = {
  subscription: {
    create() {}
  }
};
BraintreeGateway(braintree);
let subscriptionMock;
test.beforeEach(() => { subscriptionMock = mock(braintree.subscription) });
test.afterEach(() => subscriptionMock.restore());

const db = new MockFirebase();

test.beforeEach(() => {
  establishConnection('engagementsPayment', db);
});

test.afterEach(() => db.reset());

test.beforeEach(() => {
  db.database().ref()
    .child('Engagements')
    .child('eng123')
    .set({
      oppKey: 'opp123'
    });
  db.database().ref()
    .child('Engagements')
    .child('eng321')
    .set({
      oppKey: 'opp321'
    });
  db.database().ref()
    .child('Commitments')
    .set({
      payment: {
        oppKey: 'opp123',
        code: 'payment',
        amount: 17
      },
      deposit: {
        oppKey: 'opp123',
        code: 'deposit',
        amount: 175
      }
    });
});

const payCommand:EngagementsPayCommand = {
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

const confirmCommand:EngagementsConfirmCommand = {
  domain: 'Engagements',
  action: 'confirm',
  uid: 'abc123',
  payload: {
    key: 'eng321'
  }
};

test.serial('paying for an engagement', async function(t) {
  subscriptionMock
    .expects('create')
    .withArgs({
      options: {
        startImmediately: true,
        doNotInheritAddOnsOrDiscounts: true
      },
      neverExpires: true,
      paymentMethodNonce: 'nonce123',
      planId: 'event',
      price: '0.00',
      addOns: {
        add: [
          {
            amount: '24.72',
            quantity: 1,
            inheritedFromId: 'payment'
          }
        ]
      }
    })
    .yields(null, {
      subscription: {
        id: 'sub123',
        transactions: [{
          id: 'trans123',
          amount: '24.72'
        }]
      }
    });

  const [message] = await StreamTransform(payCommand, service);

  subscriptionMock.verify();

  t.is(message.streamName, 'data.firebase');
  t.is(message.partitionKey, 'abc123');

  const {data} = message;
  const valid = ajv.validate('data.Engagements.update', data);
  const errors = ajv.errors;
  t.true(valid, errors && errors.map(e => e.message).join(' '));

  t.deepEqual(data.values, {
    isPaid: true,
    isConfirmed: true,
    payment: {
      amountPaid: '24.72',
      paidAt: now.returnValues[0],
      subscriptionId: 'sub123',
      transactionId: 'trans123',
      error: false
    }
  });
});

test.serial('payment failure', async function(t) {
  subscriptionMock
    .expects('create')
    .withArgs()
    .yields('An error occurred in payment gateway', null);

  const [message] = await StreamTransform(payCommand, service);
  subscriptionMock.verify();

  t.is(message.streamName, 'data.firebase');
  t.is(message.partitionKey, 'abc123');

  const {data} = message;
  t.deepEqual(data.values, {
    isPaid: false,
    isConfirmed: false,
    payment: {
      error: 'An error occurred in payment gateway'
    }
  });
});

test.serial('nothing to pay', async function(t) {
  db.database().ref()
    .child('Commitments')
    .remove();
  t.throws(StreamTransform(payCommand, service), 'Cannot make $0 payment');
});

test.serial('confirm without payment', async function(t) {
  const [message] = await StreamTransform(confirmCommand, service);

  t.is(message.streamName, 'data.firebase');
  t.is(message.partitionKey, 'abc123');

  const {data} = message;
  t.is(data.domain, 'Engagements');
  t.is(data.action, 'update');
  t.deepEqual(data.values, {
    isConfirmed: true,
    isPaid: true,
    payment: {
      paidAt: now.returnValues[0],
      errors: false
    }
  });
});

test.serial('attempt to confirm without payment when payment due', async function(t) {
  db.database().ref()
    .child('Commitments')
    .set({
      payment: {
        amount: '1.0',
        code: 'payment',
        oppKey: 'opp321'
      }
    });

  t.throws(StreamTransform(confirmCommand, service), 'This engagement requires payment');
});

test.serial('engagement not found', async function(t) {
  db.database().ref()
    .child('Engagements')
    .child('eng321')
    .remove();

  t.throws(StreamTransform(confirmCommand, service), 'Engagement not found');
});