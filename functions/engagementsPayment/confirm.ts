import {StreamTransform} from "../../lib/StreamTransform";
import {EngagementsConfirmCommand} from 'sparks-schemas/types/commands/EngagementsConfirm'
import {lookup, search} from "../../lib/ExternalFactories/Firebase";
import {Engagement} from "sparks-schemas/types/models/engagement";
import {oppPayment} from "../../lib/domain/Opp";
import {values} from 'ramda';
import {dataUpdate} from "../../helpers/dataUpdate";

const service = 'engagementsPayment';

export const confirm = StreamTransform('command.Engagements.confirm', async function({domain, uid, payload: {key}}:EngagementsConfirmCommand) {

  const engagement:Engagement = await lookup(service, 'Engagements', key);
  if (!engagement) {
    throw new Error('Engagement not found');
  }

  const commitments = await search(service, ['oppKey', engagement.oppKey], 'Commitments');
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
