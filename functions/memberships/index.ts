import * as apex from 'apex.js';
import {
  CommandTransform,
  UpdateTransform, RemoveTransform
} from "../../lib/CommandToDataTransform";
import {MembershipsCreateCommand} from 'sparks-schemas/types/commands/MembershipsCreate'
import {StreamTransform} from "../../lib/StreamTransform";
import {spread} from "../../lib/spread";

const create = StreamTransform('Memberships.create', async function({domain, action, uid, payload: {values}}:MembershipsCreateCommand) {
  return [{
    streamName: 'data.firebase',
    partitionKey: uid,
    data: {
      domain,
      action,
      key: [values.engagementKey, values.teamKey, values.oppKey].join('-'),
      values
    }
  }]
});

export default apex(spread(
  create,
  UpdateTransform('Memberships.update'),
  RemoveTransform('Memberships.remove')
));