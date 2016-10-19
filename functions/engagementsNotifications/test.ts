import service from './index';
import {test} from 'ava';
import {StreamTransform} from "../../test/StreamTransform";
import {spy} from 'sinon';

const engUpdateIsAccepted = {
  domain: 'Engagements',
  action: 'update',
  key: 'eng123',
  values: {
    isAccepted: true
  }
};

const engUpdatedIsNotAccepted = {
  domain: 'Engagements',
  action: 'update',
  key: 'eng123',
  values: {
    isAccepted: false
  }
};

const engUpdatedIsConfirmed = {
  domain: 'Engagements',
  action: 'update',
  key: 'eng123',
  values: {
    isConfirmed: true
  }
};

const engUpdatedIsNotConfirmed = {
  domain: 'Engagements',
  action: 'update',
  key: 'eng123',
  values: {
    isConfirmed: false
  }
};

const now = spy(Date, 'now');
test.afterEach(() => now.reset());

test.serial('isAccepted = true', async function(t) {
  const messages = await StreamTransform(engUpdateIsAccepted, service);
  t.is(messages.length, 1);

  const [{data}] = messages;
  t.is(data.domain, 'Notifications');
  t.is(data.action, 'create');
  t.is(data.key, 'eng123-accepted');
  t.deepEqual(data.values, {
    type: 'accepted',
    engagementKey: 'eng123',
    sendAt: now.returnValues[0] + 1800000
  });
});

test.serial('isAccepted = false', async function(t) {
  const messages = await StreamTransform(engUpdatedIsNotAccepted, service);
  t.is(messages.length, 1);

  const [{data}] = messages;
  t.is(data.domain, 'Notifications');
  t.is(data.action, 'remove');
  t.is(data.key, 'eng123-accepted');
});

test.serial('isConfirmed = true', async function(t) {
  const messages = await StreamTransform(engUpdatedIsConfirmed, service);
  t.is(messages.length, 1);

  const [{data}] = messages;
  t.is(data.domain, 'Notifications');
  t.is(data.action, 'create');
  t.is(data.key, 'eng123-confirmed');
  t.deepEqual(data.values, {
    type: 'confirmed',
    engagementKey: 'eng123',
    sendAt: now.returnValues[0] + 1800000
  });
});

test.serial('isConfirmed = true', async function(t) {
  const messages = await StreamTransform(engUpdatedIsNotConfirmed, service);
  t.is(messages.length, 1);

  const [{data}] = messages;
  t.is(data.domain, 'Notifications');
  t.is(data.action, 'remove');
  t.is(data.key, 'eng123-confirmed');
});
