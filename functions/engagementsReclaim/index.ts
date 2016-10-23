import * as assert from 'assert'
import * as apex from 'apex.js';
import {values} from 'ramda';
import {StreamTransform} from "../../lib/StreamTransform";
import {EngagementsReclaimCommand} from 'sparks-schemas/types/commands/EngagementsReclaim';
import {BraintreeGateway} from "../../lib/ExternalFactories/Braintree";
import {lookup, search} from "../../lib/ExternalFactories/Firebase";
import {Engagement} from "sparks-schemas/types/models/engagement";
import {
  SubscriptionUpdateOptions, SubscriptionAddOn, Subscription
} from "../../typings/braintree";
import {oppPayment} from "../../lib/domain/Opp";
import {dataUpdate} from "../../helpers/dataUpdate";

function updateSubscription(id: string, options: SubscriptionUpdateOptions): Promise<Subscription> {
  const gateway = BraintreeGateway();

  return new Promise<Subscription>((resolve, reject) => {
    gateway.subscription.update(id, options, function (err, response) {
      if (err) {
        return reject(err);
      }
      resolve(response.subscription);
    })
  });
}

const reclaim = StreamTransform('Engagements.reclaim', async function ({domain, uid, payload: {key}}:EngagementsReclaimCommand) {
  const engagement: Engagement = await lookup('engagementsReclaim', 'Engagements', key);
  assert(engagement, 'Engagement not found');
  assert(engagement.payment, 'Engagement not paid');

  const commitments = values(await search('engagementsReclaim', ['oppKey', engagement.oppKey], 'Commitments'));
  const payable = oppPayment(commitments);
  assert(payable.deposit > 0, 'Cannot reclaim $0');

  const depositAddon: SubscriptionAddOn = {
    inheritedFromId: 'deposit',
    amount: payable.deposit.toFixed(2)
  };

  const options: SubscriptionUpdateOptions = {
    addOns: {
      add: [depositAddon]
    }
  };

  try {
    const subscription = await updateSubscription(engagement.payment.subscriptionId, options);

    return [dataUpdate(domain, key, uid, {
      isDepositPaid: true,
      deposit: {
        billingDate: subscription.nextBillingDate
      }
    })];
  } catch (err) {
    return [dataUpdate(domain, key, uid, {
      isDepositPaid: false,
      deposit: {
        paymentError: err
      }
    })];
  }
});

export default apex(reclaim);