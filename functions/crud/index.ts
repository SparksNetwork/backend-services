import * as apex from 'apex.js'
import Record = Kinesis.Record;
import {createAction, updateAction, removeAction} from "./actions";

const actions = {
  create: createAction,
  update: updateAction,
  remove: removeAction
};

export default apex(async function(e:Record) {
  const message = JSON.parse(e.Data as any);
  const action = actions[message.action];

  console.log(message);
  console.log(action);

  if (action) {
    return await action(message);
  }
});