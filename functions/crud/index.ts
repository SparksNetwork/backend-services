import * as apex from 'apex.js'
import Record = Kinesis.Record;
import Actions from "./actions";
import Firebase from '../../lib/Firebase'

export default apex(async function(e:Record) {
  const message = JSON.parse(e.Data as any);
  const actions = Actions(Firebase.establishConnection('crud'));
  const action = actions[message.action];

  if (action) {
    return await action(message);
  } else {
    return true;
  }
});