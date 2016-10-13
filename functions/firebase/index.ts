import * as apex from 'apex.js'
import Record = Kinesis.Record;
import Actions from "./actions";
import {establishConnection} from "../../lib/Firebase";

export default apex(async function(e:Record) {
  const message = JSON.parse(e.Data as any);
  const actions = Actions(establishConnection('firebase-service'));
  const action = actions[message.action];

  if (action) {
    await action(message);
  } else {
    return true;
  }
});