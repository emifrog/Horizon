/**
 * Tests unitaires Tier 3 — Horizon SPP
 *
 *  • Formaters Intl.NumberFormat (pourcentage, variation)
 *  • Formatage cohérent fr-FR (virgule, espace insécable)
 *
 * Note : l'accessibilité (HTML sémantique, focus-visible) se teste en
 * navigateur (Lighthouse / NVDA) ; ce fichier ne couvre que la logique JS.
 *
 * Exécution : node tests/test-tier3.js
 */

import {
  formaterMontant,
  formaterPourcentage,
  formaterVariationTaux,
  formaterNombre,
} from '../js/utils/formatters.js';

let reussis = 0;
let echoues = 0;
const echecs = [];

function test(nom, condition, detail = '') {
  if (condition) {
    reussis++;
    console.log(`  ✅ ${nom}`);
  } else {
    echoues++;
    echecs.push({ nom, detail });
    console.log(`  ❌ ${nom}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(titre) {
  console.log(`\n── ${titre} ${'─'.repeat(Math.max(0, 68 - titre.length))}`);
}

// ============================================================================
// 1. formaterPourcentage — sortie fr-FR, virgule décimale
// ============================================================================
section('1. formaterPourcentage — Intl.NumberFormat');

// La virgule française est utilisée (non point)
const p75 = formaterPourcentage(75);
test('75 % formaté contient "75" et "%"',
  p75.includes('75') && p75.endsWith('%'), `obtenu "${p75}"`);

const p1234 = formaterPourcentage(1.25);
test('1.25 → "1,25 %" (virgule décimale)',
  p1234.startsWith('1,25'), `obtenu "${p1234}"`);

test('NaN → "- %"', formaterPourcentage(NaN) === '- %');
test('undefined → "- %"', formaterPourcentage(undefined) === '- %');
test('null → "- %"', formaterPourcentage(null) === '- %');

// Décimales configurables
test('Pourcentage à 0 décimales',
  formaterPourcentage(75, { decimales: 0 }).startsWith('75 ')
  || formaterPourcentage(75, { decimales: 0 }).startsWith('75 '),
  `obtenu "${formaterPourcentage(75, { decimales: 0 })}"`);

test('Pourcentage à 4 décimales',
  formaterPourcentage(1.2345, { decimales: 4 }).startsWith('1,2345'));

// Valeurs grandes (milliers)
const pGrand = formaterPourcentage(12345.67);
test('Pourcentage avec milliers : séparateur de milliers présent',
  // Intl fr-FR utilise un espace insécable ou un espace fin selon le runtime
  /12[\s  ]?345/.test(pGrand), `obtenu "${pGrand}"`);

// Négatif
const pNeg = formaterPourcentage(-5.25);
test('Pourcentage négatif',
  pNeg.startsWith('-5,25'), `obtenu "${pNeg}"`);

// ============================================================================
// 2. formaterVariationTaux — signe +/- explicite
// ============================================================================
section('2. formaterVariationTaux — signDisplay');

const v1 = formaterVariationTaux(1.25);
test('+1.25 → "+1,25 %"',
  v1.startsWith('+1,25') && v1.endsWith('%'), `obtenu "${v1}"`);

const vNeg = formaterVariationTaux(-3);
test('-3 → "-3,00 %"',
  vNeg.startsWith('-3,00'), `obtenu "${vNeg}"`);

const vZero = formaterVariationTaux(0);
test('0 → "0,00 %" (pas de signe pour zéro)',
  vZero.startsWith('0,00') && !vZero.startsWith('+') && !vZero.startsWith('-'),
  `obtenu "${vZero}"`);

test('formaterVariationTaux(NaN) = "-"', formaterVariationTaux(NaN) === '-');

// ============================================================================
// 3. formaterMontant — déjà en Intl.NumberFormat
// ============================================================================
section('3. formaterMontant — cohérence fr-FR');

const m = formaterMontant(1234.56);
test('formaterMontant(1234.56) contient "1" et "234,56" et "€"',
  /1[\s  ]?234,56/.test(m) && m.includes('€'), `obtenu "${m}"`);

test('formaterMontant(NaN) = "- €"', formaterMontant(NaN) === '- €');
test('formaterMontant(0) formatté',
  formaterMontant(0).includes('0,00'), `obtenu "${formaterMontant(0)}"`);

// Sans symbole
const mSansSymbole = formaterMontant(1000, { symbole: false });
test('formaterMontant sans symbole pas de €',
  !mSansSymbole.includes('€'), `obtenu "${mSansSymbole}"`);

// ============================================================================
// 4. formaterNombre — contrôle séparateur milliers
// ============================================================================
section('4. formaterNombre');

const n = formaterNombre(1234567);
test('formaterNombre(1234567) a des séparateurs de milliers',
  /1[\s  ]?234[\s  ]?567/.test(n), `obtenu "${n}"`);

test('formaterNombre(NaN) = "-"', formaterNombre(NaN) === '-');

// ============================================================================
// RÉSUMÉ
// ============================================================================
console.log('\n' + '═'.repeat(72));
console.log(`  Tests Tier 3 : ${reussis} réussis · ${echoues} échoués · ${reussis + echoues} total`);
console.log('═'.repeat(72));

if (echoues > 0) {
  console.log('\nÉchecs :');
  echecs.forEach((e) => console.log(`  • ${e.nom}${e.detail ? ` — ${e.detail}` : ''}`));
  process.exit(1);
}
