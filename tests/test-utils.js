/**
 * Tests des utilitaires transverses : échappement HTML et calcul d'années.
 *
 * Exécution : node tests/test-utils.js
 */

import { escapeHtml } from '../js/utils/html.js';
import { anneesEntre, MS_PAR_AN } from '../js/utils/dates.js';

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   → ${details}`);
    failed++;
  }
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log('              TESTS UTILITAIRES (html, dates)');
console.log('═══════════════════════════════════════════════════════════════════\n');

// ============================================================================
// escapeHtml — barrière anti-XSS
// ============================================================================
console.log('📋 escapeHtml');
console.log('───────────────────────────────────────────────────────────────────');

test('Échappe une balise script',
  escapeHtml('<script>alert(1)</script>') === '&lt;script&gt;alert(1)&lt;/script&gt;',
  escapeHtml('<script>alert(1)</script>'));
test('Échappe les guillemets doubles et simples',
  escapeHtml(`"x" 'y'`) === '&quot;x&quot; &#39;y&#39;');
test('Échappe l\'esperluette',
  escapeHtml('Tom & Jerry') === 'Tom &amp; Jerry');
test('null → chaîne vide', escapeHtml(null) === '');
test('undefined → chaîne vide', escapeHtml(undefined) === '');
test('Nombre converti en chaîne', escapeHtml(42) === '42');
test('Ordre d\'échappement : & traité en premier (pas de double échappement)',
  escapeHtml('<') === '&lt;' && escapeHtml('&lt;') === '&amp;lt;');

console.log('');

// ============================================================================
// anneesEntre — années entières, plancher à 0
// ============================================================================
console.log('📋 anneesEntre / MS_PAR_AN');
console.log('───────────────────────────────────────────────────────────────────');

// Calcul CALENDAIRE (anniversaires révolus). Verrouille la correction du
// sous-comptage ms/365,25 qui rabaissait d'1 an les spans en années entières.
test('MS_PAR_AN = 365,25 jours en ms', MS_PAR_AN === 365.25 * 24 * 60 * 60 * 1000);
test('10 années calendaires pleines = 10 (et non 9)',
  anneesEntre(new Date(2010, 0, 1), new Date(2020, 0, 1)) === 10,
  `Calculé: ${anneesEntre(new Date(2010, 0, 1), new Date(2020, 0, 1))}`);
test('Années de cotisation RAFP 2005→2042 = 37 (et non 36)',
  anneesEntre(new Date(2005, 0, 1), new Date(2042, 0, 1)) === 37,
  `Calculé: ${anneesEntre(new Date(2005, 0, 1), new Date(2042, 0, 1))}`);
test('~10,5 ans → 10', anneesEntre(new Date(2000, 0, 1), new Date(2010, 6, 1)) === 10,
  `Calculé: ${anneesEntre(new Date(2000, 0, 1), new Date(2010, 6, 1))}`);
test('5 ans 9 mois → 5 (années partielles planchées)',
  anneesEntre(new Date(2010, 0, 1), new Date(2015, 9, 1)) === 5,
  `Calculé: ${anneesEntre(new Date(2010, 0, 1), new Date(2015, 9, 1))}`);
test('Dates inversées → 0 (jamais négatif)',
  anneesEntre(new Date(2020, 0, 1), new Date(2010, 0, 1)) === 0);
test('Date manquante → 0', anneesEntre(null, new Date(2020, 0, 1)) === 0);

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`  Utils : ${passed} réussis · ${failed} échoués · ${passed + failed} total`);
console.log('═══════════════════════════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
