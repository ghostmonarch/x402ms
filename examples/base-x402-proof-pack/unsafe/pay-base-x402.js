const BASE_MAINNET_CHAIN_ID = 8453;
const baseUSDC = {
  chainId: BASE_MAINNET_CHAIN_ID,
  asset: 'USDC',
};

export async function payBaseX402({ resourceUrl, payTo, amount }) {
  const payment = {
    x402Version: 1,
    network: 'base',
    chainId: baseUSDC.chainId,
    asset: baseUSDC.asset,
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

await payBaseX402({
  resourceUrl: 'https://api.example.com/x402/base-usdc',
  payTo: '0x123',
  amount: '0.02',
});
