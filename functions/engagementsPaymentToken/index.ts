import * as apex from 'apex.js';
import {EngagementsCreateCommand} from 'sparks-schemas/types/commands/EngagementsCreate';
import {StreamTransform} from "../../lib/StreamTransform";
import {spread} from "../../lib/spread";
import {lookup} from "../../lib/ExternalFactories/Firebase";
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";

const generatePaymentToken = StreamTransform('Engagements.create', async function({domain, uid, payload: {values}}:EngagementsCreateCommand) {

  const key = [values.oppKey, values.profileKey].join('-');
  const customerId = await lookup('engagementsPayment', 'GatewayCustomers', values.profileKey, 'gatewayId');

  if (!customerId) {
    throw new Error('Cannot find gateway id');
  }

  const gateway = BraintreeGateway();
  const clientToken = await new Promise((resolve, reject) => {
    gateway.clientToken.generate({
      customerId
    }, (err, response) => {
      if (err) { return reject(err); }
      resolve(response.clientToken);
    });
  });

  return [
    {
      streamName: 'data.firebase',
      partitionKey: uid,
      data: {
        domain,
        action: 'update',
        key,
        values: {
          payment: clientToken
        }
      }
    }
  ]
});

export default apex(spread(generatePaymentToken));

