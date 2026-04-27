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

export async function hireProviderAgent({ providerAgentId, serviceOfferingId, walletAddress }) {
  const acpClient = virtualsAcpClient();
  const job = await acpClient.createJobFromOffering({
    providerAgentId,
    serviceOfferingId,
    settlementAddress: walletAddress,
    payment: AssetToken.usdc('25', 8453),
    protocol: 'Virtuals Agent Commerce Protocol',
  });

  return acpClient.fundJobEscrow(job.id, {
    asset: AssetToken.usdc('25', 8453),
    destinationWallet: walletAddress,
    expectedEvent: 'job.completed',
  });
}

await hireProviderAgent({
  providerAgentId: 'provider-agent-demo',
  serviceOfferingId: 'research-report',
  walletAddress: '0x123',
});
