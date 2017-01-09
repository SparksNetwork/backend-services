import {StreamTransform} from "../../lib/StreamTransform";
import {RemoveData} from '@sparksnetwork/sparks-schemas/types/data';
import {data} from '@sparksnetwork/sparks-schemas/generators/data';
import {dataRemove} from "../../helpers/dataRemove";

export const profileRemove = StreamTransform(data('Profiles.remove'), async function(message:RemoveData) {

  return [dataRemove('GatewayCustomers', message.key, message.key)];
});

