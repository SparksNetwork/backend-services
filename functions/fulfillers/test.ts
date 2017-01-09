import {test} from 'ava';
import service from './index';
import {FulfillersCreateCommand} from '@sparksnetwork/sparks-schemas/types/commands/FulfillersCreate';
import {FulfillersRemoveCommand} from '@sparksnetwork/sparks-schemas/types/commands/FulfillersRemove';
import {StreamTransform} from "../../test/StreamTransform";

const createCommand:FulfillersCreateCommand = {
  domain: 'Fulfillers',
  action: 'create',
  uid: 'abc123',
  payload: {
    values: {
      oppKey: 'opp123',
      teamKey: 'team123'
    }
  }
};

const removeCommand:FulfillersRemoveCommand = {
  domain: 'Fulfillers',
  action: 'remove',
  uid: 'abc123',
  payload: {
    key: 'opp123-team123'
  }
};

test.serial('create', async function(t) {
  const [{streamName, data}] = await StreamTransform(createCommand, service);
  t.is(streamName, 'data.firebase');
  t.is(data.domain, 'Fulfillers');
  t.is(data.action, 'create');
  t.is(data.key, 'opp123-team123');
  t.deepEqual(data.values, {
    oppKey: 'opp123',
    teamKey: 'team123'
  });
});

test.serial('remove', async function(t) {
  const [{streamName, data}] = await StreamTransform(removeCommand, service);
  t.is(streamName, 'data.firebase');
  t.is(data.domain, 'Fulfillers');
  t.is(data.action, 'remove');
  t.is(data.key, 'opp123-team123');
});