import {StreamTransform} from "../../lib/StreamTransform";
import {lookup, search} from "../../lib/ExternalFactories/Firebase";
import {Engagement} from '@sparksnetwork/sparks-schemas/types/models/engagement';
import {EngagementPayment} from '@sparksnetwork/sparks-schemas/types/models/EngagementPayment';
import {EngagementsPayCommand} from '@sparksnetwork/sparks-schemas/types/commands/EngagementsPay';
import {oppPayment} from "../../lib/domain/Opp";
import {values} from 'ramda';
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {
  SubscriptionAddOn, SubscriptionResponse,
  Subscription, SubscriptionCreateOptions
} from "../../typings/braintree";
import {dataUpdate} from "../../helpers/dataUpdate";

function createSubscription(options):Promise<Subscription> {
  const gateway = BraintreeGateway();

  return new Promise<Subscription>((resolve, reject) => {
    gateway.subscription.create(options, function (err, response: SubscriptionResponse) {
      if (err) {
        return reject(err);
      }
      resolve(response.subscription);
    });
  });
}

export const pay = StreamTransform('command.Engagements.pay', async function ({domain, uid, payload: {key, values: {paymentNonce}}}:EngagementsPayCommand) {
  const engagement: Engagement = await lookup('Engagements', key);
  if (!engagement) {
    throw new Error('Engagement not found');
  }
  const commitments = await search(['oppKey', engagement.oppKey], 'Commitments');
  const payable = oppPayment(values(commitments));

  if (payable.payable === 0) {
    throw new Error('Cannot make $0 payment');
  }

  const paymentAddon: SubscriptionAddOn = {
    inheritedFromId: 'payment',
    quantity: 1,
    amount: payable.payable.toFixed(2)
  };

  const options: SubscriptionCreateOptions = {
    options: {
      startImmediately: true,
      doNotInheritAddOnsOrDiscounts: true
    },
    neverExpires: true,
    paymentMethodNonce: paymentNonce,
    planId: 'event',
    price: '0.00',
    addOns: {
      add: [paymentAddon]
    }
  };

  try {
    const subscription: Subscription = await createSubscription(options);

    const payment: EngagementPayment = {
      paidAt: Date.now(),
      subscriptionId: subscription.id,
      transactionId: subscription.transactions[0].id,
      amountPaid: subscription.transactions[0].amount,
      error: false
    };

    return [dataUpdate(domain, key, uid, {
      isPaid: true,
      isConfirmed: true,
      payment
    })];
  } catch (error) {
    return [dataUpdate(domain, key, uid, {
      isPaid: false,
      isConfirmed: false,
      payment: {
        error: error.toString()
      }
    })];
  }
});
