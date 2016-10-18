import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {EngagementsCreateCommand} from 'sparks-schemas/types/commands/EngagementsCreate';
import {StreamTransform} from "../../lib/StreamTransform";
import {UpdateTransform} from "../../helpers/CommandToDataTransform";
import {dataUpdate} from "../../helpers/dataUpdate";

const create = StreamTransform('Engagements.create', async function(
  {domain, uid, payload: {values}}:EngagementsCreateCommand) {

  const key = [values.oppKey, values.profileKey].join('-');
  const {oppKey, profileKey} = values;

  // We perform an update here instead of a create because other services
  // might be updating this same record with additional data
  return [dataUpdate(domain, key, uid, {
    oppKey,
    profileKey,
    isApplied: false,
    isAccepted: false,
    isConfirmed: false
  })];
});

export default apex(spread(
  create,
  UpdateTransform('Engagements.update')
));