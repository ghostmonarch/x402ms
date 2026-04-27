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

export async function completeAgentCheckout({ purchaseIntent, payTo }) {
  const mastercard = mastercardAgentPay();
  const visa = visaIntelligentCommerce();
  const visaCredential = await visa.retrieveTokenizedCredential({
    purchaseIntent,
    service: 'Visa Intelligent Commerce',
    authentication: 'Visa Payment Passkey',
  });
  const agentPayToken = await mastercard.tokenizeIntent({
    purchaseIntent,
    tokenFormat: 'DSRP',
    verificationCode: 'DTVC',
    destinationMerchant: payTo,
  });

  return mastercard.checkout({
    cardPayment: true,
    cardCharge: true,
    visaCredential,
    agentPayToken,
    digitalCommerceSolution: 'Mastercard Agent Pay',
  });
}

await completeAgentCheckout({
  purchaseIntent: 'buy the approved replacement laptop',
  payTo: 'merchant-demo',
});
