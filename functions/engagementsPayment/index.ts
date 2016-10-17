import * as apex from 'apex.js';
import {StreamTransform} from "../../lib/StreamTransform";

const pay = StreamTransform('Engagements.pay', async function({domain, uid, payload: {key}}) {

  return [{
    streamName: 'data.firebase',
    partitionKey: uid,
    data: {
      domain,
      action: 'update',
      key,
      values: {
        isPaid: true
      }
    }
  }];
});


export default apex(pay);