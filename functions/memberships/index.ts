import * as apex from 'apex.js';
import {
  UpdateTransform, RemoveTransform
} from "../../helpers/CommandToDataTransform";
import {MembershipsCreateCommand} from '@sparksnetwork/sparks-schemas/types/commands/MembershipsCreate'
import {StreamTransform} from "../../lib/StreamTransform";
import {spread} from "../../lib/spread";
import {dataCreate} from "../../helpers/dataCreate";

const create = StreamTransform('command.Memberships.create', async function ({domain, uid, payload: {values}}:MembershipsCreateCommand) {

  return [dataCreate(domain, [values.engagementKey, values.teamKey, values.oppKey].join('-'), uid, values)];
});

export default apex(spread(
  create,
  UpdateTransform('command.Memberships.update'),
  RemoveTransform('command.Memberships.remove')
));