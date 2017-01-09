import service from './index';
import {mock} from 'sinon';
import {test} from 'ava';
import {StreamTransform} from "../../test/StreamTransform";
import {EngagementsReclaimCommand} from '@sparksnetwork/sparks-schemas/types/commands/EngagementsReclaim';
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {establishConnection} from "../../lib/ExternalFactories/Firebase";
import {MockFirebase} from "../../test/MockFirebase";

const reclaimCommand:EngagementsReclaimCommand = {
  domain: 'Engagements',
  action: 'reclaim',
  uid: 'abc123',
  payload: {
    key: 'eng123'
  }
};

const braintree = {
  subscription: {
    update() {}
  }
};
BraintreeGateway(braintree);
let subscriptionMock;
test.beforeEach(() => { subscriptionMock = mock(braintree.subscription); });
test.afterEach(() => subscriptionMock.restore());

const db = new MockFirebase();
test.beforeEach(() => {
  establishConnection('engagementsReclaim', db);
})
test.afterEach(() => db.reset());

test.beforeEach(() => {
  db.database().ref()
    .child('Engagements')
    .child('eng123')
    .set({
      isPaid: true,
      payment: {
        subscriptionId: 'sub123',
        transactionId: 'trans123'
      }
    });
  db.database().ref()
    .child('Commitments')
    .set({
      deposit: {
        code: 'deposit',
        amount: '175'
      }
    });
});

test.serial('reclaim', async function(t) {
  subscriptionMock
    .expects('update')
    .withArgs('sub123', {
      addOns: {
        add: [
          {
            amount: '175.00',
            inheritedFromId: 'deposit'
          }
        ]
      }
    })
    .yields(null, {
      subscription: {
        nextBillingDate: '2016-10-19'
      }
    });

  const messages = await StreamTransform(reclaimCommand, service);
  subscriptionMock.verify();

  t.is(messages.length, 1);

  const [{data}] = messages;
  t.is(data.domain, 'Engagements');
  t.is(data.action, 'update');
  t.is(data.key, 'eng123');
  t.deepEqual(data.values, {
    isDepositPaid: true,
    deposit: {
      billingDate: '2016-10-19'
    }
  });
});

test.serial('reclaim $0 deposit', async function(t) {
  db.database().ref().child('Commitments').remove();
  t.throws(StreamTransform(reclaimCommand, service), 'Cannot reclaim $0');
});

test.serial('reclaim, engagement not paid', async function(t) {
  db.database().ref().child('Engagements').child('eng123').remove();
  t.throws(StreamTransform(reclaimCommand, service), 'Engagement not found');
});

test.serial('reclaim, payment not found', async function(t) {
  db.database().ref().child('Engagements').child('eng123').update({
    payment: null
  });
  t.throws(StreamTransform(reclaimCommand, service), 'Engagement not paid');
});

test.serial('reclaim, subscription update error', async function(t) {
  subscriptionMock
    .expects('update')
    .once()
    .yields('Subscription update error');

  const [{data}] = await StreamTransform(reclaimCommand, service);

  subscriptionMock.verify();

  t.deepEqual(data.values, {
    isDepositPaid: false,
    deposit: {
      paymentError: 'Subscription update error'
    }
  });
});