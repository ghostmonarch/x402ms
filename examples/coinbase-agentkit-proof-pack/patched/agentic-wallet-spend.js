import { checkBeforePayment } from '@monarch-shield/x402';

const baseUSDC = {
  chainId: 8453,
  asset: 'USDC',
};

function createCoinbaseAgentKit() {
  return {
    async agenticWallet() {
      return {
        async send(payment) {
          return { submitted: true, payment };
        },
        async payForService(payment) {
          return { paid: true, payment };
        },
      };
    },
  };
}

async function executeAgenticWalletSpend({ resourceUrl, payTo, amount, asset, network }) {
  const agentkit = createCoinbaseAgentKit();
  const agenticWallet = await agentkit.agenticWallet();

  await agenticWallet.payForService({
    resourceUrl,
    payTo,
    amount,
    asset,
    network,
    x402: true,
  });

  return agenticWallet.send({
    to: payTo,
    amount,
    asset,
    chainId: baseUSDC.chainId,
    memo: 'agent buying a paid API response',
  });
}

export async function spendWithAgenticWallet(payment) {
  // Monarch must run before AgentKit or Agentic Wallet can pay, trade, or send.
  return checkBeforePayment({
    resourceUrl: payment.resourceUrl,
    payTo: payment.payTo,
    amount: payment.amount,
    asset: payment.asset ?? baseUSDC.asset,
    network: payment.network ?? 'base',
    intent: payment.intent ?? 'agent paying an x402 service with Coinbase Agentic Wallet',
  }, executeAgenticWalletSpend);
}

await spendWithAgenticWallet({
  resourceUrl: 'https://api.example.com/x402/coinbase-agent',
  payTo: '0x123',
  amount: '0.02',
  asset: 'USDC',
  network: 'base',
  intent: 'agent paying an x402 service with Coinbase Agentic Wallet',
});
