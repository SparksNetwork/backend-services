import {AssignmentsCreateCommand} from '@sparksnetwork/sparks-schemas/types/commands/AssignmentsCreate';
import {AssignmentsRemoveCommand} from '@sparksnetwork/sparks-schemas/types/commands/AssignmentsRemove';
import {test} from 'ava';
import service from './index';
import {StreamTransform} from "../../test/StreamTransform";

const createMessage:AssignmentsCreateCommand = {
  domain: 'Assignments',
  action: 'create',
  uid: 'abc123',
  payload: {
    values: {
      engagementKey: 'eng123',
      oppKey: 'opp123',
      shiftKey: 'shift123',
      teamKey: 'team123',
      profileKey: 'profile123'
    }
  }
};

const removeMessage:AssignmentsRemoveCommand = {
  domain: 'Assignments',
  action: 'remove',
  uid: 'abc123',
  payload: {
    key: 'opp123-shift123'
  }
};

test.serial('create', async function(t) {
  const [{streamName, data}] = await StreamTransform(createMessage, service);

  t.is(streamName, 'data.firebase');
  t.is(data.domain, 'Assignments');
  t.is(data.action, 'create');
  t.is(data.key, 'opp123-shift123');
  t.deepEqual(data.values, {
    engagementKey: 'eng123',
    oppKey: 'opp123',
    shiftKey: 'shift123',
    teamKey: 'team123',
    profileKey: 'profile123'
  });
});

test.serial('remove', async function(t) {
  const [{streamName, data}] = await StreamTransform(removeMessage, service);

  t.is(streamName, 'data.firebase');
  t.is(data.domain, 'Assignments');
  t.is(data.action, 'remove');
  t.is(data.key, 'opp123-shift123');
});