import {StreamTransform} from "../../lib/StreamTransform";
import {EngagementsConfirmCommand} from '@sparksnetwork/sparks-schemas/types/commands/EngagementsConfirm'
import {lookup, search} from "../../lib/ExternalFactories/Firebase";
import {Engagement} from '@sparksnetwork/sparks-schemas/types/models/engagement';
import {oppPayment} from "../../lib/domain/Opp";
import {values} from 'ramda';
import {dataUpdate} from "../../helpers/dataUpdate";

export const confirm = StreamTransform('command.Engagements.confirm', async function({domain, uid, payload: {key}}:EngagementsConfirmCommand) {

  const engagement:Engagement = await lookup('Engagements', key);
  if (!engagement) {
    throw new Error('Engagement not found');
  }

  const commitments = await search(['oppKey', engagement.oppKey], 'Commitments');
  const payable = oppPayment(values(commitments));

  if (payable.payable > 0) {
    throw new Error('This engagement requires payment')
  }

  return [dataUpdate(domain, key, uid, {
    isPaid: true,
    isConfirmed: true,
    payment: {
      paidAt: Date.now(),
      errors: false
    }
  })]
});
