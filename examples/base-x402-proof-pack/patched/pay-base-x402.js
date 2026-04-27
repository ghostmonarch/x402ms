import { checkBeforePayment } from '@monarch-shield/x402';

const BASE_MAINNET_CHAIN_ID = 8453;
const baseUSDC = {
  chainId: BASE_MAINNET_CHAIN_ID,
  asset: 'USDC',
};

async function sendBaseX402Payment({ resourceUrl, payTo, amount, asset, network }) {
  const payment = {
    x402Version: 1,
    network,
    chainId: baseUSDC.chainId,
    asset: asset ?? baseUSDC.asset,
    amount,
    payTo,
  };

  return fetch(resourceUrl, {
    method: 'GET',
    headers: {
      'X-PAYMENT': JSON.stringify(payment),
    },
  });
}

export async function payBaseX402(payment) {
  // Monarch must run before the x402 header is created or sent.
  return checkBeforePayment({
    resourceUrl: payment.resourceUrl,
    payTo: payment.payTo,
    amount: payment.amount,
    asset: payment.asset ?? 'USDC',
    network: payment.network ?? 'base',
    intent: payment.intent ?? 'agent buying a Base x402 API response with USDC',
  }, sendBaseX402Payment);
}

await payBaseX402({
  resourceUrl: 'https://api.example.com/x402/base-usdc',
  payTo: '0x123',
  amount: '0.02',
  asset: 'USDC',
  network: 'base',
  intent: 'agent buying a Base x402 API response with USDC',
});
