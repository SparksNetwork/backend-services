import * as apex from 'apex.js';
import {
  CommandTransform,
  UpdateTransform, RemoveTransform
} from "../../helpers/CommandToDataTransform";
import {MembershipsCreateCommand} from 'sparks-schemas/types/commands/MembershipsCreate'
import {StreamTransform} from "../../lib/StreamTransform";
import {spread} from "../../lib/spread";
import {dataCreate} from "../../helpers/dataCreate";

const create = StreamTransform('Memberships.create', async function({domain, uid, payload: {values}}:MembershipsCreateCommand) {

  return [dataCreate(domain, [values.engagementKey, values.teamKey, values.oppKey].join('-'), uid, values)];
});

export default apex(spread(
  create,
  UpdateTransform('Memberships.update'),
  RemoveTransform('Memberships.remove')
));