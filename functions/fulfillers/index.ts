import * as apex from 'apex.js';
import {RemoveTransform} from "../../helpers/CommandToDataTransform";
import {spread} from "../../lib/spread";
import {StreamTransform} from "../../lib/StreamTransform";
import {FulfillersCreateCommand} from 'sparks-schemas/types/commands/FulfillersCreate';
import {dataCreate} from "../../helpers/dataCreate";

const create = StreamTransform('Fulfillers.create', async function({domain, action, uid, payload: {values}}:FulfillersCreateCommand) {

  return [dataCreate(domain, [values.oppKey, values.teamKey].join('-'), uid, values)];
});

export default apex(spread(
  create,
  RemoveTransform('Fulfillers.remove')
));
