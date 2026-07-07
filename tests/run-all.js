/**
 * Lanceur de l'ensemble des suites de tests (exécuté par `npm test`).
 *
 * Chaque suite est un module Node autonome qui se termine par process.exit(1)
 * en cas d'échec. On les lance en processus enfants séparés et on agrège les
 * codes de sortie pour renvoyer un statut global.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUITES = [
  'test-calculs.js',
  'test-validation.js',
  'test-tier1.js',
  'test-tier2.js',
  'test-tier3.js',
  'test-profil-xavier.js',
  'test-corrections-p1.js',
  'test-utils.js',
];

let echecs = 0;
for (const suite of SUITES) {
  const res = spawnSync(process.execPath, [join(__dirname, suite)], { stdio: 'inherit' });
  if (res.status !== 0) echecs++;
}

console.log('\n' + '═'.repeat(72));
if (echecs === 0) {
  console.log(`  ✅ ${SUITES.length} suites — toutes vertes.`);
} else {
  console.log(`  ❌ ${echecs} suite(s) sur ${SUITES.length} en échec.`);
}
console.log('═'.repeat(72));

process.exit(echecs > 0 ? 1 : 0);
