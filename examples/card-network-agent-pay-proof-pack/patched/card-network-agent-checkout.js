import { checkBeforePayment } from '@monarch-shield/x402';

function mastercardAgentPay() {
  return {
    async tokenizeIntent(intent) {
      return { type: 'agentic token', scheme: 'MDES', ...intent };
    },
    async checkout(payload) {
      return { status: 'authorized', payload };
    },
  };
}

function visaIntelligentCommerce() {
  return {
    async retrieveTokenizedCredential(purchaseIntent) {
      return { type: 'Visa Token Service', purchaseIntent };
    },
  };
}

async function submitCardNetworkCheckout(payment) {
  const mastercard = mastercardAgentPay();
  const visa = visaIntelligentCommerce();
  const visaCredential = await visa.retrieveTokenizedCredential({
    purchaseIntent: payment.purchaseIntent,
    service: 'Visa Intelligent Commerce',
    authentication: 'Visa Payment Passkey',
  });
  const agentPayToken = await mastercard.tokenizeIntent({
    purchaseIntent: payment.purchaseIntent,
    tokenFormat: 'DSRP',
    verificationCode: 'DTVC',
    destinationMerchant: payment.payTo,
  });

  return mastercard.checkout({
    cardPayment: true,
    cardCharge: true,
    visaCredential,
    agentPayToken,
    digitalCommerceSolution: 'Mastercard Agent Pay',
  });
}

export async function completeAgentCheckout(payment) {
  return checkBeforePayment({
    resourceUrl: payment.resourceUrl,
    payTo: payment.payTo,
    amount: payment.amount,
    asset: 'card-network-token',
    network: 'mastercard-visa',
    intent: payment.purchaseIntent,
  }, submitCardNetworkCheckout);
}

await completeAgentCheckout({
  resourceUrl: 'https://merchant.example/card-agent/checkout',
  purchaseIntent: 'buy the approved replacement laptop',
  payTo: 'merchant-demo',
  amount: '1299',
});
