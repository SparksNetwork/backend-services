import {readFileSync} from "fs";
const braintree = require('braintree');
import {GatewayOptions, Gateway} from "../../typings/braintree";

let staticGateway: Gateway;

/**
 * Create a braintree gateway object for the local environment.
 * Requires the following envionment variables:
 *
 * * BT_ENVIRONMENT: The name of the environment, Sandbox or Production
 * * BT_MERCHANT_ID
 * * BT_PUBLIC_KEY
 * * BT_PRIVATE_KEY
 *
 * A mock object can be passed to this function which will then be given to
 * all future callers.
 *
 * @param gateway
 * @returns {Gateway}
 * @constructor
 */
export function BraintreeGateway(gateway?) {
  if (gateway) {
    staticGateway = gateway;
  }
  if (!staticGateway) {
    const credentials = JSON.parse(readFileSync('braintree.json', 'utf-8'));

    const options: GatewayOptions = {
      environment: braintree.Environment[credentials.environment],
      merchantId: credentials.merchant_id,
      publicKey: credentials.public_key,
      privateKey: credentials.private_key
    };

    staticGateway = braintree.connect(options);
  }

  return staticGateway;
}
