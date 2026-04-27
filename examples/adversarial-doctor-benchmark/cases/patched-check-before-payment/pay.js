import { checkBeforePayment } from '@monarch-shield/x402';

export async function payAgent(wallet, payment) {
  return checkBeforePayment(payment, async (safePayment) => {
    return wallet.send(safePayment.payTo, safePayment.amount);
  });
}
