#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../');

const TIERS = [
  { tier: 1, name: 'Tier 1: Feature Coverage & Interface Contracts', file: 'tests/tier1_feature_coverage.test.js' },
  { tier: 2, name: 'Tier 2: Boundary & Corner Cases', file: 'tests/tier2_boundary_corner.test.js' },
  { tier: 3, name: 'Tier 3: Cross-Feature Combinations & Integration', file: 'tests/tier3_cross_feature.test.js' },
  { tier: 4, name: 'Tier 4: Real-World Scenarios & Full Lifecycles', file: 'tests/tier4_real_world_scenarios.test.js' },
];

const args = process.argv.slice(2);
const tierArgIdx = args.findIndex(a => a === '--tier' || a === '-t');
const requestedTier = tierArgIdx !== -1 ? parseInt(args[tierArgIdx + 1], 10) : null;

const tiersToRun = requestedTier
  ? TIERS.filter(t => t.tier === requestedTier)
  : TIERS;

if (requestedTier && tiersToRun.length === 0) {
  console.error(`Invalid tier: ${requestedTier}. Please choose 1, 2, 3, or 4.`);
  process.exit(1);
}

console.log('='.repeat(70));
console.log('  نحو الأفضل — 4-Tier Automated E2E & Verification Test Suite');
console.log('='.repeat(70));
console.log(`Node.js: ${process.version}`);
console.log(`Mode: ${requestedTier ? `Single Tier (${requestedTier})` : 'Full 4-Tier Suite'}`);
console.log(`Target directory: ${PROJECT_ROOT}`);
console.log('-'.repeat(70));

const testFiles = tiersToRun.map(t => path.resolve(PROJECT_ROOT, t.file));

const child = spawn(
  process.execPath,
  ['--test', ...testFiles],
  {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  }
);

child.on('close', (code) => {
  console.log('-'.repeat(70));
  if (code === 0) {
    console.log('✔ All targeted tests completed successfully!');
  } else {
    console.log(`✖ Test run completed with failures (exit code: ${code})`);
    console.log('Note: Failed tests pinpoint pending milestone deliverables.');
  }
  console.log('='.repeat(70));
  process.exit(code ?? 1);
});
