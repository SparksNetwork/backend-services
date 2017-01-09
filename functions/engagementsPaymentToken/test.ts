import {mock} from 'sinon';
import service from './index';
import {test} from 'ava';
import {EngagementsCreateCommand} from '@sparksnetwork/sparks-schemas/types/commands/EngagementsCreate';
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {StreamTransform} from "../../test/StreamTransform";
import {MockFirebase} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/ExternalFactories/Firebase";

const braintree = {
  clientToken: {
    generate() {}
  }
};

BraintreeGateway(braintree);
const clientTokenMock = mock(braintree.clientToken);
test.afterEach(() => clientTokenMock.restore());

const db = new MockFirebase();

test.beforeEach(() => {
  establishConnection('engagementsPayment', db);
});

test.afterEach(() => db.reset());

test.serial('generate payment token on creation', async function(t) {

  db.database().ref()
    .child('GatewayCustomers')
    .child('pro123')
    .child('gatewayId')
    .set('cust123');

  const command:EngagementsCreateCommand = {
    domain: 'Engagements',
    action: 'create',
    uid: 'abc123',
    payload: {
      values: {
        oppKey: 'opp123',
        profileKey: 'pro123'
      }
    }
  };

  clientTokenMock
    .expects('generate')
    .withArgs({
      customerId: 'cust123'
    })
    .yields(null, {
      clientToken: 'tok123'
    });

  const [message] = await StreamTransform(command, service);

  clientTokenMock.verify();

  t.is(message.streamName, 'data.firebase');
  t.is(message.partitionKey, 'abc123');

  const {data} = message;
  t.is(data.domain, 'Engagements');
  t.is(data.action, 'update');
  t.is(data.key, 'opp123-pro123');
  t.deepEqual(data.values, {
    paymentClientToken: 'tok123'
  });
});

test.serial('cannot find gateway customer when generating token', async function(t) {

  const command:EngagementsCreateCommand = {
    domain: 'Engagements',
    action: 'create',
    uid: 'abc123',
    payload: {
      values: {
        oppKey: 'opp123',
        profileKey: 'pro123'
      }
    }
  };

  t.throws(StreamTransform(command, service), 'Cannot find gateway id');
});