import * as apex from 'apex.js';
import {StreamTransform, Transformed} from "../../lib/StreamTransform";
import {ArrivalsCreateCommand, ArrivalsCreatePayload} from 'sparks-schemas/types/commands/ArrivalsCreate';
import {ArrivalsRemoveCommand, ArrivalsRemovePayload} from 'sparks-schemas/types/commands/ArrivalsRemove';
import {Arrival} from "sparks-schemas/types/models/arrival";
import {connect} from "../../lib/Firebase";
import {spread} from "../../lib/spread";

const streamName = 'internal.data';

function action<T,U>(schema, fn:(message:T, firebase) => Promise<Transformed<U>>) {
  const innerFn = connect('arrivals', fn) as any;
  return StreamTransform<T,U>(schema, innerFn);
}

const create = action<ArrivalsCreateCommand, Arrival>('Arrivals.create', async function(message, firebase) {
  const payload:ArrivalsCreatePayload = message.payload;
  const values = payload.values;
  const key = [values.projectKey, values.profileKey].join('-');

  const alreadyArrived = await firebase
    .database()
    .ref()
    .child('Arrivals')
    .child(key)
    .once('value')
    .then(s => s.val());

  if (alreadyArrived) {
    throw new Error('Already arrived');
  }

  const profileKey = await firebase
    .database()
    .ref()
    .child('Users')
    .child(message.uid)
    .once('value')
    .then(s => s.val());

  return {
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
  };
});

const remove = StreamTransform('Arrivals.remove', async function (message:ArrivalsRemoveCommand) {
  return {
    streamName,
    partitionKey: message.uid,
    data: {
      domain: 'Arrivals',
      action: 'remove',
      key: message.payload.key
    }
  }
});

export default apex(spread(create, remove));
