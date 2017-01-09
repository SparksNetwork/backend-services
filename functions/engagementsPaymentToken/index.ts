import {EngagementsCreateCommand} from '@sparksnetwork/sparks-schemas/types/commands/EngagementsCreate';
import {StreamTransform} from "../../lib/StreamTransform";
import {lookup} from "../../lib/ExternalFactories/Firebase";
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {dataUpdate} from "../../helpers/dataUpdate";
import {λ} from "../../lib/lambda";

const generatePaymentToken = StreamTransform('command.Engagements.create', async function({domain, uid, payload: {values}}:EngagementsCreateCommand) {

  const key = [values.oppKey, values.profileKey].join('-');
  const customerId = await lookup('GatewayCustomers', values.profileKey, 'gatewayId');

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

  return [dataUpdate(domain, key, uid, {
    paymentClientToken: clientToken
  })];
});

export default λ('engagementsPaymentToken', generatePaymentToken);

