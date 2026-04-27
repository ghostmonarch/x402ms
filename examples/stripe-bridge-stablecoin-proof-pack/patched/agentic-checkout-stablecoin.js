import { checkBeforePayment } from '@monarch-shield/x402';

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

async function completeCheckoutAndSettlement(payment) {
  const stripe = stripeClient();
  const bridge = BridgeClient();
  const paymentData = {
    provider: 'stripe',
    token: payment.sharedPaymentGrantedToken,
    type: 'PaymentData',
  };

  const intent = await stripe.paymentIntents.create({
    amount: 1000,
    currency: 'usd',
    shared_payment_granted_token: paymentData.token,
    confirm: true,
    metadata: { protocol: 'Agentic Commerce Protocol', checkoutId: payment.checkoutId },
  });

  return bridge.bridgeStablecoin({
    paymentIntent: intent.id,
    asset: 'USDC',
    network: 'base',
    destinationWallet: payment.payTo,
    bridge: 'Bridge stablecoin settlement',
  });
}

export async function completeAgenticCheckout(payment) {
  return checkBeforePayment({
    resourceUrl: payment.resourceUrl,
    payTo: payment.payTo,
    amount: payment.amount,
    asset: 'USDC',
    network: 'base',
    intent: 'Stripe ACP checkout with Bridge stablecoin settlement',
    checkoutId: payment.checkoutId,
  }, completeCheckoutAndSettlement);
}

await completeAgenticCheckout({
  resourceUrl: 'https://merchant.example/acp/complete-checkout',
  checkoutId: 'agentic_checkout_demo',
  sharedPaymentGrantedToken: 'spt_demo',
  payTo: '0x123',
  amount: '10',
});
