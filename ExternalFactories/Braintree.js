"use strict";
const braintree = require('braintree');
const cfg = process.env;
let staticGateway;
function BraintreeGateway(gateway) {
    if (gateway) {
        staticGateway = gateway;
    }
    if (!staticGateway) {
        const options = {
            environment: braintree.Environment[cfg.BT_ENVIRONMENT],
            merchantId: cfg.BT_MERCHANT_ID,
            publicKey: cfg.BT_PUBLIC_KEY,
            privateKey: cfg.BT_PRIVATE_KEY
        };
        staticGateway = braintree.connect(options);
    }
    return staticGateway;
}
exports.BraintreeGateway = BraintreeGateway;
//# sourceMappingURL=Braintree.js.map