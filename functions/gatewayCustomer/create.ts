import {StreamTransform} from "../../lib/StreamTransform";
import {CreateData} from '@sparksnetwork/sparks-schemas/types/data';
import {Profile} from '@sparksnetwork/sparks-schemas/types/models/profile';
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {applySpec, propOr, head, split, last, prop, compose} from 'ramda';
import {CustomerOptions} from "../../typings/braintree";
import {dataCreate} from "../../helpers/dataCreate";

const makeCustomerOptions:(profile:Profile) => CustomerOptions = applySpec({
  email: propOr('unknown@example.com', 'email'),
  firstName: compose<Profile, string, string[], string>(head, split(' '), propOr('Unknown', 'fullName')),
  lastName: compose<Profile, string, string[], string>(last, split(' '), propOr('Unknown', 'fullName')),
  phone: prop('phone')
});

export const profileCreate = StreamTransform('data.Profiles.create', async function({key, values: profile}:CreateData<Profile>) {

  const customerOptions = makeCustomerOptions(profile);
  const gateway = BraintreeGateway();

  const gatewayId = await new Promise((resolve, reject) => {
    gateway.customer.create(customerOptions, function(err, response) {
      if (err) { return reject(err); }
      resolve(response.customer.id);
    })
  });

  return [dataCreate('GatewayCustomers', key, profile.uid, {
    profileKey: key,
    gatewayId
  })];
});

