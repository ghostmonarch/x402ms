import { checkBeforePayment } from '@monarch-shield/x402';

export async function safePayX402(payment, payX402) {
  return checkBeforePayment({
    resourceUrl: payment.resourceUrl,
    payTo: payment.payTo,
    amount: payment.amount,
    asset: payment.asset ?? 'USDC',
    network: payment.network ?? 'base',
    intent: payment.intent,
  }, payX402);
}
