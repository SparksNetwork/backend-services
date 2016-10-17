import * as apex from 'apex.js';
import {StreamTransform} from "../../lib/StreamTransform";
import {spread} from "../../lib/spread";
import {StreamFunction} from "../../lib/StreamFunction";
import {CreateData, UpdateData, RemoveData} from 'sparks-schemas/types/data';
import {Profile} from "sparks-schemas/types/models/profile";
import {data} from 'sparks-schemas/generator';
import {applySpec, prop, propOr, compose, head, last, split, fromPairs, toPairs, filter} from 'ramda';
import {Braintree} from "../../typings/braintree";
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {lookup} from "../../lib/ExternalFactories/Firebase";

const makeCustomerOptions:(profile:Profile) => Braintree.CustomerOptions = applySpec({
  email: propOr('unknown@example.com', 'email'),
  firstName: compose<Profile, string, string[], string>(head, split(' '), propOr('Unknown', 'fullName')),
  lastName: compose<Profile, string, string[], string>(last, split(' '), propOr('Unknown', 'fullName')),
  phone: prop('phone')
});

const profileCreate = StreamTransform(data('Profiles.create'), async function({key, values: profile}:CreateData<Profile>) {

  const customerOptions = makeCustomerOptions(profile);
  const gateway = BraintreeGateway();

  const gatewayId = await new Promise((resolve, reject) => {
    gateway.customer.create(customerOptions, function(err, response) {
      if (err) { return reject(err); }
      resolve(response.customer.id);
    })
  });

  return [{
    streamName: 'data.firebase',
    partitionKey: profile.uid,
    data: {
      domain: 'GatewayCustomers',
      action: 'create',
      key,
      values: {
        profileKey: key,
        gatewayId
      }
    }
  }];
});

const profileUpdate = StreamFunction(data('Profiles.update'), async function(message:UpdateData<Profile>) {
  const gatewayId = await lookup('gatewayCustomer', 'GatewayCustomers', message.key, 'gatewayId');
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

const profileRemove = StreamTransform(data('Profiles.remove'), async function(message:RemoveData) {
  return [{
    streamName: 'data.firebase',
    partitionKey: message.key,
    data: {
      domain: 'GatewayCustomers',
      action: 'remove',
      key: message.key
    }
  }]

});

export default apex(
  spread(profileCreate, profileUpdate, profileRemove)
)