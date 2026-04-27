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

export async function spendWithAgenticWallet({ resourceUrl, payTo, amount }) {
  const agentkit = createCoinbaseAgentKit();
  const agenticWallet = await agentkit.agenticWallet();

  await agenticWallet.payForService({
    resourceUrl,
    payTo,
    amount,
    asset: baseUSDC.asset,
    network: 'base',
    x402: true,
  });

  return agenticWallet.send({
    to: payTo,
    amount,
    asset: baseUSDC.asset,
    chainId: baseUSDC.chainId,
    memo: 'agent buying a paid API response',
  });
}

await spendWithAgenticWallet({
  resourceUrl: 'https://api.example.com/x402/coinbase-agent',
  payTo: '0x123',
  amount: '0.02',
});
