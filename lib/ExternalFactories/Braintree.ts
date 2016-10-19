const braintree = require('braintree');
import {GatewayOptions, Gateway} from "../../typings/braintree";

const cfg = process.env as any;

let staticGateway: Gateway;

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
    }

    staticGateway = braintree.connect(options);
  }

  return staticGateway;
}
