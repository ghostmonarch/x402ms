import { checkPayment } from '@monarch-shield/x402';

export async function chooseSafeProvider(candidates) {
  const checks = [];

  for (const candidate of candidates) {
    const result = await checkPayment({
      resourceUrl: candidate.resourceUrl,
      payTo: candidate.payTo,
      amount: candidate.amount,
      asset: candidate.asset ?? 'USDC',
      network: candidate.network ?? 'base',
      intent: candidate.intent,
    });

    checks.push({ candidate, result });
  }

  return checks.find((check) => check.result.decision === 'allow')
    ?? checks.find((check) => check.result.decision === 'route')
    ?? checks[0];
}
