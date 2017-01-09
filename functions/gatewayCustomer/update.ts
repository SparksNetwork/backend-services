import {StreamFunction} from "../../lib/StreamFunction";
import {UpdateData} from '@sparksnetwork/sparks-schemas/types/data';
import {Profile} from '@sparksnetwork/sparks-schemas/types/models/profile';
import {data} from '@sparksnetwork/sparks-schemas/generators/data';
import {applySpec, prop, propOr, compose, head, last, split, fromPairs, toPairs, filter} from 'ramda';
import {CustomerOptions} from "../../typings/braintree";
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {lookup} from "../../lib/ExternalFactories/Firebase";

const makeCustomerOptions:(profile:Profile) => CustomerOptions = applySpec({
  email: propOr('unknown@example.com', 'email'),
  firstName: compose<Profile, string, string[], string>(head, split(' '), propOr('Unknown', 'fullName')),
  lastName: compose<Profile, string, string[], string>(last, split(' '), propOr('Unknown', 'fullName')),
  phone: prop('phone')
});

export const profileUpdate = StreamFunction(data('Profiles.update'), async function(message:UpdateData<Profile>) {
  const gatewayId = await lookup('GatewayCustomers', message.key, 'gatewayId');
  // If the gateway id is not found then it might be due to message ordering
  if (!gatewayId) { throw new Error('Could not find gateway customer'); }

  const partialUpdate = compose(
    fromPairs,
    filter(([key, value]) => value && value !== 'Unknown' && value !== 'unknown@example.com'),
    toPairs,
    makeCustomerOptions
  )(message.values);

  if (Object.keys(partialUpdate).length === 0) { return; }

  const gateway = BraintreeGateway();

  await new Promise((resolve, reject) => {
    gateway.customer.update(gatewayId, partialUpdate, (err, response) => {
      if (err) { return reject(err); }
      resolve(response.customer);
    })
  });
});
