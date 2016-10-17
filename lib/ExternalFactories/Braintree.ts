import * as braintree from 'braintree';
import {Braintree} from "../typings/braintree";

const cfg = process.env as any;

let staticGateway:Braintree.Gateway;

export function BraintreeGateway(gateway?) {
  if (gateway) { staticGateway = gateway; }
  if (!staticGateway) {
    const options:Braintree.GatewayOptions = {
      environment: braintree.Environment[cfg.BT_ENVIRONMENT],
      merchantId: cfg.BT_MERCHANT_ID,
      publicKey: cfg.BT_PUBLIC_KEY,
      privateKey: cfg.BT_PRIVATE_KEY
    }

    staticGateway = braintree.connect(options);
  }

  return staticGateway;
}
