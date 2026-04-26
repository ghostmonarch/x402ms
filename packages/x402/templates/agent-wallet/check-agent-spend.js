import { checkBeforePayment } from '@monarch-shield/x402';

export async function spendFromAgentWallet(spendRequest, sendPayment) {
  return checkBeforePayment({
    resourceUrl: spendRequest.resourceUrl,
    payTo: spendRequest.payTo,
    amount: spendRequest.amount,
    asset: spendRequest.asset ?? 'USDC',
    network: spendRequest.network ?? 'base',
    intent: spendRequest.intent ?? 'agent wallet payment',
  }, () => sendPayment(spendRequest));
}
