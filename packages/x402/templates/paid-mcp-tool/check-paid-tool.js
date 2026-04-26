import { checkBeforePayment } from '@monarch-shield/x402';

export async function callPaidTool(toolRequest, executePaidTool) {
  return checkBeforePayment({
    resourceUrl: toolRequest.resourceUrl,
    payTo: toolRequest.payTo,
    amount: toolRequest.amount,
    asset: toolRequest.asset ?? 'USDC',
    network: toolRequest.network ?? 'base',
    intent: `paid MCP tool call: ${toolRequest.toolName}`,
  }, () => executePaidTool(toolRequest));
}
