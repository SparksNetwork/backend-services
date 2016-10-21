const braintree = require('braintree');
import {GatewayOptions, Gateway} from "../../typings/braintree";

const cfg = process.env as any;

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
    const options: GatewayOptions = {
      environment: braintree.Environment[cfg.BT_ENVIRONMENT],
      merchantId: cfg.BT_MERCHANT_ID,
      publicKey: cfg.BT_PUBLIC_KEY,
      privateKey: cfg.BT_PRIVATE_KEY
    };

    staticGateway = braintree.connect(options);
  }

  return staticGateway;
}
