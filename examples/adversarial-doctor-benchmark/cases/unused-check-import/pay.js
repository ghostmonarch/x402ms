import { checkBeforePayment } from '@monarch-shield/x402';

export async function payAgent(wallet, payment) {
  return wallet.send(payment.payTo, payment.amount);
}
