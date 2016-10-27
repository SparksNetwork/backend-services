import * as apex from 'apex.js';
import {StreamTransform} from "../../lib/StreamTransform";
import {ArrivalsCreateCommand, ArrivalsCreatePayload} from 'sparks-schemas/types/commands/ArrivalsCreate';
import {Arrival} from "sparks-schemas/types/models/arrival";
import {lookup} from "../../lib/ExternalFactories/Firebase";
import {spread} from "../../lib/spread";
import {RemoveTransform} from "../../helpers/CommandToDataTransform";
import {dataCreate} from "../../helpers/dataCreate";

/**
 * An arrival can only be marked as arrived once
 */
const create = StreamTransform<ArrivalsCreateCommand, Arrival>('command.Arrivals.create', async function(message) {
  const payload:ArrivalsCreatePayload = message.payload;
  const values = payload.values;
  const key = [values.projectKey, values.profileKey].join('-');

  const alreadyArrived = await lookup('arrivals', 'Arrivals', key);

  // If already arrived then exit still consuming the message.
  if (alreadyArrived) { return [] }

  const profileKey = await lookup('arrivals', 'Users', message.uid);

  return [dataCreate(message.domain, key, message.uid, {
    arrivedAt: Date.now(),
    ownerProfileKey: profileKey,
    projectKeyProfileKey: key,
    profileKey: values.profileKey,
    projectKey: values.projectKey
  })];
});

export default apex(spread(create, RemoveTransform('command.Arrivals.remove')));
