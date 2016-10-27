import {test} from 'ava';
import {oppPayment} from './Opp';

const paymentCommitment = {
  amount: 15,
  code: 'payment',
  oppKey: 'opp123'
};

const depositCommitment = {
  amount: 175,
  code: 'deposit',
  oppKey: 'opp123'
};

test('oppPayment no commitments', async function (t) {
  const payment = oppPayment([])
  t.is(payment.payment, 0);
  t.is(payment.deposit, 0);
  t.is(payment.payable, 0);
});

test('oppPayment, just payment', async function (t) {
  const payment = oppPayment([paymentCommitment]);
  t.is(payment.payment, 15);
  t.is(payment.deposit, 0);
  t.is(payment.payable, 16.53);
});

test('oppPayment, just deposit', async function (t) {
  const payment = oppPayment([depositCommitment]);
  t.is(payment.payment, 0);
  t.is(payment.deposit, 175);
  t.is(payment.payable, 7.13);
});

test('oppPayment payment and deposit', async function(t) {
  const payment = oppPayment([paymentCommitment, depositCommitment]);
  t.is(payment.payment, 15);
  t.is(payment.deposit, 175);
  t.is(payment.payable, 22.65);
});