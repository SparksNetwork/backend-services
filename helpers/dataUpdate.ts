import {UpdateData} from '@sparksnetwork/sparks-schemas/types/data'
import {StreamRecord} from "../lib/StreamPublish";

/**
 * Helper to produce data update messages
 *
 * @param domain
 * @param key
 * @param partitionKey
 * @param values
 * @returns {{streamName: string, partitionKey: string, data: {domain: string, action: string, key: string, values: any}}}
 */
export function dataUpdate(domain:string, key:string, partitionKey:string, values:any):StreamRecord<UpdateData<any>> {
  return {
    streamName: 'data.firebase',
    partitionKey,
    data: {
      domain,
      action: 'update',
      key,
      values
    }
  };
}
