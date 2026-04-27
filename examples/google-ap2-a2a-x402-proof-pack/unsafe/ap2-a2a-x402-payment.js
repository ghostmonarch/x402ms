const X_A2A_Extensions = 'https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.2';
const baseUSDC = {
  chainId: 8453,
  asset: 'USDC',
};

function ap2MerchantAgent() {
  return {
    async createCartMandate(cart) {
      return {
        type: 'CartMandate',
        payment: {
          status: 'x402.payment.required',
          required: cart.x402PaymentRequiredResponse,
        },
      };
    },
    async submitPaymentMandate(paymentMandate) {
      return {
        type: 'PaymentMandate',
        status: 'x402.payment.submitted',
        paymentMandate,
      };
    },
  };
}

export async function buyA2AService({ resourceUrl, payTo, amount }) {
  const merchantAgent = ap2MerchantAgent();
  const cartMandate = await merchantAgent.createCartMandate({
    protocol: 'Agent Payments Protocol',
    extension: X_A2A_Extensions,
    x402PaymentRequiredResponse: {
      accepts: [{ network: 'base', asset: baseUSDC.asset, chainId: baseUSDC.chainId, payTo, amount }],
    },
  });

  return merchantAgent.submitPaymentMandate({
    cartMandate,
    resourceUrl,
    payTo,
    amount,
    paymentPayload: { status: 'x402.payment.payload', network: 'base' },
  });
}

await buyA2AService({
  resourceUrl: 'https://merchant-agent.example/a2a/task',
  payTo: '0x123',
  amount: '0.10',
});
