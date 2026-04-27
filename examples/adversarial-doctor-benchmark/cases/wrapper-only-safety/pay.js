import { checkBeforePayment } from '@monarch-shield/x402';

async function guardedSend(wallet, payment) {
  return checkBeforePayment(payment, () => wallet.send(payment.payTo, payment.amount));
}

export async function payAgent(wallet, payment) {
  return guardedSend(wallet, payment);
}
