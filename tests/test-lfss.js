/**
 * Tests des barèmes LFSS 2026 (bascule au 01/09/2026) — âge légal et durée requise,
 * catégories active et sédentaire, régimes AVANT / APRÈS suspension, par palier.
 *
 * Exécution : node tests/test-lfss.js
 */

import {
  getDureeAssuranceRequise, getAgeLegal, regimeSuspendu, DATE_SUSPENSION_REFORME,
} from '../js/config/parametres.js';

let passed = 0;
let failed = 0;
function test(name, cond, details = '') {
  if (cond) { console.log(`✅ ${name}`); passed++; }
  else { console.log(`❌ ${name}`); if (details) console.log(`   → ${details}`); failed++; }
}

const d = (s) => new Date(s + 'T00:00:00');
const AVANT = d('2026-06-01');   // pension à effet < 01/09/2026
const APRES = d('2026-10-01');   // pension à effet ≥ 01/09/2026

console.log('═══════════════════════════════════════════════════════════════════');
console.log('        BARÈMES LFSS 2026 — âge légal & durée requise (par palier)');
console.log('═══════════════════════════════════════════════════════════════════\n');

test('regimeSuspendu : 01/06/2026 = avant', regimeSuspendu(AVANT) === false);
test('regimeSuspendu : 01/10/2026 = après', regimeSuspendu(APRES) === true);
test(`DATE_SUSPENSION_REFORME = 2026-09-01`, DATE_SUSPENSION_REFORME === '2026-09-01');

// ── Durée requise ─────────────────────────────────────────────────────────
console.log('\n📋 Durée requise (avant / après)');
// [dateNaissance, catégorie, avant, après]
const DUREES = [
  ['1966-06-15', 'actif', 168, 168],
  ['1966-09-01', 'actif', 169, 169],
  ['1967-06-01', 'actif', 169, 169],
  ['1968-06-01', 'actif', 170, 170],
  ['1969-06-01', 'actif', 171, 170],
  ['1970-03-15', 'actif', 172, 170],
  ['1970-06-15', 'actif', 172, 171],
  ['1971-06-01', 'actif', 172, 172],
  ['1964-06-01', 'sedentaire', 171, 170],
  ['1965-03-15', 'sedentaire', 172, 170],
  ['1965-06-15', 'sedentaire', 172, 171],
  ['1966-06-01', 'sedentaire', 172, 172],
];
for (const [naiss, cat, avant, apres] of DUREES) {
  test(`Durée ${cat} né ${naiss} : avant=${avant}`, getDureeAssuranceRequise(d(naiss), AVANT, cat) === avant,
    `Calculé: ${getDureeAssuranceRequise(d(naiss), AVANT, cat)}`);
  test(`Durée ${cat} né ${naiss} : après=${apres}`, getDureeAssuranceRequise(d(naiss), APRES, cat) === apres,
    `Calculé: ${getDureeAssuranceRequise(d(naiss), APRES, cat)}`);
}

// ── Âge légal ─────────────────────────────────────────────────────────────
console.log('\n📋 Âge légal (avant / après)');
// [dateNaissance, catégorie, [ansAvant,moisAvant], [ansApres,moisApres]]
const AGES = [
  ['1966-06-15', 'actif', [57, 0], [57, 0]],
  ['1966-09-01', 'actif', [57, 3], [57, 3]],
  ['1968-06-01', 'actif', [57, 9], [57, 9]],
  ['1969-06-01', 'actif', [58, 0], [57, 9]],
  ['1970-03-15', 'actif', [58, 3], [57, 9]],
  ['1970-06-15', 'actif', [58, 3], [58, 0]],
  ['1973-06-01', 'actif', [59, 0], [58, 9]],
  ['1974-06-01', 'actif', [59, 0], [59, 0]],
  ['1964-06-01', 'sedentaire', [63, 0], [62, 9]],
  ['1965-03-15', 'sedentaire', [63, 3], [62, 9]],
  ['1965-06-15', 'sedentaire', [63, 3], [63, 0]],
  ['1968-06-01', 'sedentaire', [64, 0], [63, 9]],
  ['1969-06-01', 'sedentaire', [64, 0], [64, 0]],
];
for (const [naiss, cat, [avA, avM], [apA, apM]] of AGES) {
  const av = getAgeLegal(d(naiss), AVANT, cat);
  const ap = getAgeLegal(d(naiss), APRES, cat);
  test(`Âge ${cat} né ${naiss} : avant=${avA}a${avM}m`, av.ans === avA && av.mois === avM,
    `Calculé: ${av.ans}a${av.mois}m`);
  test(`Âge ${cat} né ${naiss} : après=${apA}a${apM}m`, ap.ans === apA && ap.mois === apM,
    `Calculé: ${ap.ans}a${ap.mois}m`);
}

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log(`  LFSS : ${passed} réussis · ${failed} échoués · ${passed + failed} total`);
console.log('═══════════════════════════════════════════════════════════════════');
process.exit(failed > 0 ? 1 : 0);
