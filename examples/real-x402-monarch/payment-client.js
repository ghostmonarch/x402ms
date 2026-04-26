import { checkBeforePayment } from '@monarch-shield/x402';

async function payX402({ resourceUrl, payTo, amount, asset, network }) {
  // Existing x402/facilitator code belongs here. Monarch wraps this call
  // because checking after X-PAYMENT is sent is only analytics, not protection.
  return fetch(resourceUrl, {
    headers: {
      'X-PAYMENT': JSON.stringify({ payTo, amount, asset, network }),
    },
  });
}

export async function safePayX402(payment) {
  return checkBeforePayment({
    resourceUrl: payment.resourceUrl,
    payTo: payment.payTo,
    amount: payment.amount,
    asset: payment.asset ?? 'USDC',
    network: payment.network ?? 'base',
    intent: payment.intent ?? 'agent paying an x402 endpoint',
  }, payX402);
}

await safePayX402({
  resourceUrl: 'https://api.example.com/x402/search',
  payTo: '0x123',
  amount: '0.02',
  asset: 'USDC',
  network: 'base',
  intent: 'research agent buying search results',
});
