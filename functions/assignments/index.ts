import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {StreamTransform} from "../../lib/StreamTransform";
import {AssignmentsCreateCommand} from 'sparks-schemas/types/commands/AssignmentsCreate';
import {AssignmentsRemoveCommand} from 'sparks-schemas/types/commands/AssignmentsRemove';
import {RemoveTransform} from "../../helpers/CommandToDataTransform";

const create = StreamTransform('Assignments.create', async function({domain, action, uid, payload: {values}}:AssignmentsCreateCommand) {
  return [{
    streamName: 'data.firebase',
    partitionKey: uid,
    data: {
      domain,
      action,
      key: [values.oppKey, values.shiftKey].join('-'),
      values
    }
  }];
});

export default apex(spread(create, RemoveTransform('Assignments.remove')));