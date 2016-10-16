import * as apex from 'apex.js';
import {RemoveTransform} from "../../helpers/CommandToDataTransform";
import {spread} from "../../lib/spread";
import {StreamTransform} from "../../lib/StreamTransform";
import {FulfillersCreateCommand} from 'sparks-schemas/types/commands/FulfillersCreate';

const create = StreamTransform('Fulfillers.create', async function({domain, action, uid, payload: {values}}:FulfillersCreateCommand) {

  return [{
    streamName: 'data.firebase',
    partitionKey: uid,
    data: {
      domain,
      action,
      key: [values.oppKey, values.teamKey].join('-'),
      values
    }
  }];
});

export default apex(spread(
  create,
  RemoveTransform('Fulfillers.remove')
));
