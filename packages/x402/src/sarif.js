import { resolve } from 'node:path';

const SARIF_SCHEMA = 'https://json.schemastore.org/sarif-2.1.0.json';
const INFORMATION_URI = 'https://x402ms.ai/docs/monarch-doctor-ci.md';
const UNPROTECTED_RULE_ID = 'monarch-doctor/unprotected-payment-file';

export function toSarif(result, options = {}) {
  const root = options.root ?? result.scan.root ?? process.cwd();
  const unprotected = new Set(result.scan.unprotectedPaymentFiles ?? []);
  const paymentFindings = result.scan.findings.filter((finding) => finding.kind !== 'monarch_check');
  const results = [...unprotected].map((file) => resultForFile(file, paymentFindings));

  return {
    $schema: SARIF_SCHEMA,
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Monarch Doctor',
            informationUri: INFORMATION_URI,
            semanticVersion: options.version,
            rules: [
              {
                id: UNPROTECTED_RULE_ID,
                name: 'Unprotected payment execution',
                shortDescription: {
                  text: 'Payment execution is not inside a detectable Monarch pre-payment guard.',
                },
                fullDescription: {
                  text: 'Monarch Doctor found money-moving code where payment execution is not inside checkBeforePayment or a guarded callback.',
                },
                helpUri: 'https://x402ms.ai/docs/adversarial-benchmark.md',
                properties: {
                  category: 'payment-safety',
                  precision: 'high',
                },
              },
            ],
          },
        },
        invocations: [
          {
            executionSuccessful: result.ready,
            workingDirectory: {
              uri: pathToFileUri(root),
            },
          },
        ],
        results,
      },
    ],
  };
}

function resultForFile(file, paymentFindings) {
  const findingsForFile = paymentFindings.filter((finding) => finding.file === file);
  const primary = findingsForFile[0] ?? { file, location: { startLine: 1, startColumn: 1 } };

  return {
    ruleId: UNPROTECTED_RULE_ID,
    level: 'error',
    message: {
      text: `Patch ${file} so Monarch checkBeforePayment runs before payment execution.`,
    },
    locations: [locationForFinding(primary)],
    relatedLocations: findingsForFile.slice(1).map((finding, index) => ({
      id: index + 1,
      message: {
        text: finding.message,
      },
      physicalLocation: physicalLocationForFinding(finding),
    })),
    properties: {
      monarchKind: 'unprotected_payment_file',
      rails: [...new Set(findingsForFile.flatMap((finding) => finding.rails ?? []))].sort(),
    },
  };
}

function locationForFinding(finding) {
  return {
    physicalLocation: physicalLocationForFinding(finding),
  };
}

function physicalLocationForFinding(finding) {
  return {
    artifactLocation: {
      uri: finding.file,
      uriBaseId: '%SRCROOT%',
    },
    region: {
      startLine: finding.location?.startLine ?? 1,
      startColumn: finding.location?.startColumn ?? 1,
    },
  };
}

function pathToFileUri(path) {
  return `file://${resolve(path).replaceAll('\\', '/')}`;
}
