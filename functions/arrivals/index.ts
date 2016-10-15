import * as apex from 'apex.js';
import {StreamTransform} from "../../lib/StreamTransform";
import {ArrivalsCreateCommand, ArrivalsCreatePayload} from 'sparks-schemas/types/commands/ArrivalsCreate';
import {ArrivalsRemoveCommand} from 'sparks-schemas/types/commands/ArrivalsRemove';
import {Arrival} from "sparks-schemas/types/models/arrival";
import {lookup} from "../../lib/Firebase";
import {spread} from "../../lib/spread";

const streamName = 'data.firebase';

const create = StreamTransform<ArrivalsCreateCommand, Arrival>('Arrivals.create', async function(message) {
  const payload:ArrivalsCreatePayload = message.payload;
  const values = payload.values;
  const key = [values.projectKey, values.profileKey].join('-');

  const alreadyArrived = await lookup('arrivals', 'Arrivals', key);

  if (alreadyArrived) {
    throw new Error('Already arrived');
  }

  const profileKey = await lookup('arrivals', 'Users', message.uid);

  return [{
    streamName,
    partitionKey: message.uid,
    data: {
      domain: 'Arrivals',
      action: 'create',
      key,
      values: {
        arrivedAt: Date.now(),
        ownerProfileKey: profileKey,
        projectKeyProfileKey: key,
        profileKey: values.profileKey,
        projectKey: values.projectKey
      }
    }
  }];
});

const remove = StreamTransform('Arrivals.remove', async function (message:ArrivalsRemoveCommand) {
  return [{
    streamName,
    partitionKey: message.uid,
    data: {
      domain: 'Arrivals',
      action: 'remove',
      key: message.payload.key
    }
  }];
});

export default apex(spread(create, remove));
