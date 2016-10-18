import {CreateData} from 'sparks-schemas/types/data'
import {StreamRecord} from '../lib/StreamTransform';

export function dataCreate(domain:string, key:string, partitionKey:string, values:any):StreamRecord<CreateData<any>> {
  return {
    streamName: 'data.firebase',
    partitionKey,
    data: {
      domain,
      action: 'create',
      key,
      values
    }
  };
}