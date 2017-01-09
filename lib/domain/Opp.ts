import {PaymentDue} from '@sparksnetwork/sparks-schemas/types/models/paymentDue';
import {reduce, compose, propEq, either, filter} from 'ramda';
import {Commitment} from "@sparksnetwork/sparks-schemas/types/models/commitment";

const SPARKS_RATE = 0.035;
const SPARKS_MIN = 1.0;

const sum = reduce<Commitment,number>((acc, c) => acc + Number(c.amount), 0);

const rateReducer = compose<Commitment[],number,number,number>(
  round,
  n => n * SPARKS_RATE,
  sum
);

const paymentΩ = propEq('code', 'payment');
const depositΩ = propEq('code', 'deposit');
const payableΩ = either(paymentΩ, depositΩ);

function round(amount:number):number {
  return Math.round(amount * 100) / 100;
}

function calcSparks(commitments) {
  const rate = rateReducer(commitments);

  if (rate > 0) {
    return SPARKS_MIN + rate;
  }

  return 0;
}

/**
 * Calculate the required payments
 *
 * @param commitments
 * @returns {{deposit: any, payment: any, payable: any}}
 */
export function oppPayment(commitments):PaymentDue {
  const sparksRate = calcSparks(filter(payableΩ, commitments));
  const payment = sum(filter(paymentΩ, commitments));
  const payable = sparksRate + payment;
  const deposit = sum(filter(depositΩ, commitments));

  return {
    deposit,
    payment,
    payable
  }
}