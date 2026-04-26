import { checkBeforePayment } from '../src/index.js';

async function payX402(payment) {
  return {
    paid: true,
    resourceUrl: payment.resourceUrl,
    monarchDecision: payment.monarch.decision,
  };
}

const result = await checkBeforePayment({
  resourceUrl: 'https://api.example.com/x402/search',
  payTo: '0x123',
  amount: '0.02',
  asset: 'USDC',
  network: 'base',
  intent: 'research agent buying search results',
}, payX402);

console.log(result);
