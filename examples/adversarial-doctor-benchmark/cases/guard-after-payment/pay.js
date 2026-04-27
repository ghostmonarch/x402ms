import { checkBeforePayment } from '@monarch-shield/x402';

export async function payAgent(wallet, payment) {
  const receipt = await wallet.send(payment.payTo, payment.amount);
  await checkBeforePayment(payment);
  return receipt;
}
