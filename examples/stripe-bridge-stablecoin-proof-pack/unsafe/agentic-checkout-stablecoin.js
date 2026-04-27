function stripeClient() {
  return {
    paymentIntents: {
      async create(payment) {
        return { id: 'pi_demo', ...payment };
      },
    },
  };
}

function BridgeClient() {
  return {
    async bridgeStablecoin(payment) {
      return { status: 'submitted', ...payment };
    },
  };
}

export async function completeAgenticCheckout({ checkoutId, sharedPaymentGrantedToken, payTo }) {
  const stripe = stripeClient();
  const bridge = BridgeClient();
  const paymentData = {
    provider: 'stripe',
    token: sharedPaymentGrantedToken,
    type: 'PaymentData',
  };

  const intent = await stripe.paymentIntents.create({
    amount: 1000,
    currency: 'usd',
    shared_payment_granted_token: paymentData.token,
    confirm: true,
    metadata: { protocol: 'Agentic Commerce Protocol', checkoutId },
  });

  return bridge.bridgeStablecoin({
    paymentIntent: intent.id,
    asset: 'USDC',
    network: 'base',
    destinationWallet: payTo,
    bridge: 'Bridge stablecoin settlement',
  });
}

await completeAgenticCheckout({
  checkoutId: 'agentic_checkout_demo',
  sharedPaymentGrantedToken: 'spt_demo',
  payTo: '0x123',
});
