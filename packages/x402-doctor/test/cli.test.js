import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const cliPath = join(import.meta.dirname, '..', 'src/cli.js');

test('x402-doctor resolves packaged Monarch CLI instead of PATH monarch', () => {
  const root = mkdtempSync(join(tmpdir(), 'x402-doctor-path-'));
  const fakeBin = join(root, 'bin');

  try {
    mkdirSync(fakeBin, { recursive: true });
    const fakeMonarch = join(fakeBin, 'monarch');
    writeFileSync(fakeMonarch, '#!/usr/bin/env bash\necho "fake monarch should not run" >&2\nexit 77\n');
    chmodSync(fakeMonarch, 0o755);

    const result = spawnSync(process.execPath, [cliPath, '--help'], {
      env: {
        ...process.env,
        PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
      },
      encoding: 'utf8',
    });

    assert.equal(result.status, 0);
    assert.doesNotMatch(result.stderr, /fake monarch should not run/);
    assert.match(result.stdout, /Monarch Doctor/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
