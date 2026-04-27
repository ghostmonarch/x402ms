export type Decision = 'allow' | 'caution' | 'block' | 'route';
export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export interface CheckPaymentRequest {
  resourceUrl: string;
  payTo: string;
  amount: string;
  asset?: string;
  network?: string;
  intent: string;
  mode?: 'sandbox' | 'preprod' | 'runtime';
  hasPrepaymentCheck?: boolean;
  payToWalletChanged?: boolean;
  knownBadEndpoint?: boolean;
  providerStatus?: 'verified' | 'unknown_wrapper' | string;
  deliveryReliability?: 'passing' | 'failing' | string;
  priceSanity?: 'normal' | 'high' | string;
  verifiedAlternative?: string | null;
}

export interface CheckPaymentResponse {
  decision: Decision;
  risk: RiskLevel;
  status: string;
  reason: string;
  suggestedAction: string;
  userMessage: string;
  verifiedAlternative: string | null;
  checks: {
    domainOwnership: string;
    payToWallet: string;
    payToWalletChanged: boolean;
    deliveryReliability: string;
    provenance: string;
    priceSanity: string;
  };
}

export interface SandboxResult {
  id: string;
  title: string;
  expected: Decision;
  actual: Decision;
  passed: boolean;
  reason: string;
}

export interface ScanFinding {
  kind: 'payment_flow' | 'monarch_check';
  file: string;
  message: string;
  rails: Array<'x402' | 'paid_mcp' | 'agentkit' | 'stripe' | 'stablecoin' | 'wallet' | 'card' | 'bank' | 'regional_rail'>;
  ruleId?: string;
  location?: {
    startLine: number;
    startColumn: number;
  };
}

export interface ScanProjectResult {
  root: string;
  hasPaymentFlow: boolean;
  hasMonarchCheck: boolean;
  hasUnprotectedPaymentFiles: boolean;
  unprotectedPaymentFiles: string[];
  ready: boolean;
  findings: ScanFinding[];
  recommendation: string;
}

export interface PreprodCheck {
  id: string;
  passed: boolean;
  message: string;
}

export interface ValidatePreprodResult {
  applicable: boolean;
  ready: boolean;
  checks: PreprodCheck[];
  scan: ScanProjectResult;
  sandbox: SandboxResult[];
}

export interface MonarchError extends Error {
  monarch: CheckPaymentResponse;
}

export function evaluatePayment(input: Partial<CheckPaymentRequest>): CheckPaymentResponse;
export function checkPayment(input: Partial<CheckPaymentRequest>): Promise<CheckPaymentResponse>;
export function checkBeforePayment<T>(
  input: Partial<CheckPaymentRequest>,
  pay?: (payment: Partial<CheckPaymentRequest> & { monarch: CheckPaymentResponse }) => Promise<T> | T
): Promise<T | CheckPaymentResponse | { requiresUserApproval: true; monarch: CheckPaymentResponse }>;
export function runSandbox(): SandboxResult[];
export function scanProject(root?: string): ScanProjectResult;
export function validatePreprod(root?: string): ValidatePreprodResult;
export function toSarif(result: ValidatePreprodResult, options?: { root?: string; version?: string }): unknown;
export const scenarios: unknown[];
