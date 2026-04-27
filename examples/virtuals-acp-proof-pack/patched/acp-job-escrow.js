import { checkBeforePayment } from '@monarch-shield/x402';

const AssetToken = {
  usdc(amount, chainId) {
    return { amount, chainId, symbol: 'USDC' };
  },
};

function virtualsAcpClient() {
  return {
    async createJobFromOffering(job) {
      return { id: 'job_demo', ...job };
    },
    async fundJobEscrow(jobId, payment) {
      return { event: 'job.funded', jobId, payment };
    },
  };
}

async function fundAcpJobEscrow(payment) {
  const acpClient = virtualsAcpClient();
  const job = await acpClient.createJobFromOffering({
    providerAgentId: payment.providerAgentId,
    serviceOfferingId: payment.serviceOfferingId,
    settlementAddress: payment.payTo,
    payment: AssetToken.usdc(payment.amount, 8453),
    protocol: 'Virtuals Agent Commerce Protocol',
  });

  return acpClient.fundJobEscrow(job.id, {
    asset: AssetToken.usdc(payment.amount, 8453),
    destinationWallet: payment.payTo,
    expectedEvent: 'job.completed',
  });
}

export async function hireProviderAgent(payment) {
  return checkBeforePayment({
    resourceUrl: payment.resourceUrl,
    payTo: payment.payTo,
    amount: payment.amount,
    asset: 'USDC',
    network: 'base',
    intent: 'Virtuals ACP agent funding a USDC escrow job',
    providerAgentId: payment.providerAgentId,
    serviceOfferingId: payment.serviceOfferingId,
  }, fundAcpJobEscrow);
}

await hireProviderAgent({
  resourceUrl: 'https://virtuals.example/acp/jobs/research-report',
  payTo: '0x123',
  amount: '25',
  providerAgentId: 'provider-agent-demo',
  serviceOfferingId: 'research-report',
});
