import {mock, spy} from 'sinon';
import service from './index';
import {test} from 'ava';
import {StreamTransform} from "../../test/StreamTransform";
import {StreamFunction} from "../../test/StreamFunction";
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {MockFirebase} from "../../test/MockFirebase";
import {establishConnection} from "../../lib/ExternalFactories/Firebase";

const braintree = {
  customer: {
    create() {},
    update() {}
  }
};

BraintreeGateway(braintree);
const customerMock = mock(braintree.customer);
test.afterEach(() => customerMock.restore());

const db = new MockFirebase();

test.beforeEach(() => {
  establishConnection('gatewayCustomer', db);
});
test.afterEach(() => db.reset());

test.serial('profile is created creates a gateway customer in braintree', async function(t) {
  const dataMessage = {
    domain: 'Profiles',
    action: 'create',
    key: 'vyu223',
    values: {
      uid: 'abc123',
      fullName: 'Vince Noir',
      email: 'vince@thezooniverse.org.eu',
      isAdmin: false,
      phone: '+6441234',
      portraitUrl: 'http://example.com'
    }
  };

  customerMock
    .expects('create')
    .withArgs({
      email: 'vince@thezooniverse.org.eu',
      firstName: 'Vince',
      lastName: 'Noir',
      phone: '+6441234'
    })
    .yields(null, {
      customer: {
        id: 'cust123'
      }
    });

  const messages = await StreamTransform(dataMessage, service);
  t.is(messages.length, 1);

  const [message] = messages;
  t.is(message.streamName, 'data.firebase');
  t.is(message.partitionKey, 'abc123');

  const {data} = message;
  t.is(data.domain, 'GatewayCustomers');
  t.is(data.action, 'create');
  t.is(data.key, 'vyu223');
  t.deepEqual(data.values, {
    profileKey: 'vyu223',
    gatewayId: 'cust123'
  });

  customerMock.verify();
});

test.serial('profile is updated updates the gateway customer in braintree', async function(t) {
  db.database().ref()
    .child('GatewayCustomers')
    .child('vyu223')
    .child('gatewayId')
    .set('cust123');

  const dataMessage = {
    domain: 'Profiles',
    action: 'update',
    key: 'vyu223',
    values: {
      fullName: 'Howard Moon'
    }
  };

  customerMock
    .expects('update')
    .withArgs('cust123', {
      firstName: 'Howard',
      lastName: 'Moon'
    })
    .yields(null, {});

  await StreamFunction(dataMessage, service);

  customerMock.verify();
});

test.serial('profile is updated with no relevant data', async function(t) {
  db.database().ref()
    .child('GatewayCustomers')
    .child('vyu223')
    .child('gatewayId')
    .set('cust123');

  const dataMessage = {
    domain: 'Profiles',
    action: 'update',
    key: 'vyu223',
    values: {
      irrelevant: 'Howard Moon'
    }
  };

  customerMock
    .expects('update')
    .never();

  await StreamFunction(dataMessage, service);

  customerMock.verify();
});

test.serial('profile is removed, remove the gateway customer', async function(t) {
  const dataMessage = {
    domain: 'Profiles',
    action: 'remove',
    key: 'vyu223'
  };

  const messages = await StreamTransform(dataMessage, service);

  const [message] = messages;
  t.is(message.streamName, 'data.firebase');
  t.is(message.partitionKey, 'vyu223');

  const {data} = message;
  t.is(data.domain, 'GatewayCustomers');
  t.is(data.action, 'remove');
  t.is(data.key, 'vyu223');
});