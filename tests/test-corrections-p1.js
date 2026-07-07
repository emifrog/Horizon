/**
 * Tests de non-régression — Corrections Priorité 1 (justesse des calculs)
 *
 * Verrouille les corrections apportées suite à l'analyse complète :
 *  - C1 : la majoration SPV ne compte QUE pour la durée d'assurance (pas le montant)
 *  - M1 : le temps partiel ne réduit PAS la durée d'assurance (temps plein)
 *  - M2 : plafond GLOBAL de 20 trimestres pour la bonification du 1/5e (SPP + militaire)
 *  - M3 : annulation de décote PROGRESSIVE (62 → 64 ans selon génération)
 *  - M4 : proratisation de la majoration prime de feu (ordre d'arguments)
 *  - M5 : la NBI n'est pas intégrée au TIB (pas de prime de feu sur la NBI)
 *
 * Exécution : node tests/test-corrections-p1.js
 */

import { calculerDurees } from '../js/modules/duree.js';
import { calculerTrimestresDecote } from '../js/modules/ages.js';
import { calculerMajorationPrimeFeu, calculerTraitementIndiciaire } from '../js/modules/pension.js';
import { POINT_INDICE } from '../js/config/parametres.js';

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

const approx = (a, b, t = 0.1) => Math.abs(a - b) <= t;

console.log('═══════════════════════════════════════════════════════════════════');
console.log('        TESTS DE NON-RÉGRESSION — CORRECTIONS PRIORITÉ 1');
console.log('═══════════════════════════════════════════════════════════════════\n');

// ============================================================================
// C1 — La majoration SPV ne compte QUE pour la durée d'assurance
// ============================================================================
console.log('📋 C1 : Majoration SPV en durée d\'assurance uniquement');
console.log('───────────────────────────────────────────────────────────────────');

// SPP entré en 2004, départ 2036 (32 ans = 128 trim), 25 ans SPV → +3 trimestres
const cSPV = calculerDurees({
  dateEntreeSPP: new Date(2004, 0, 1),
  dateDepart: new Date(2036, 0, 1),
  quotite: 1,
  trimestresAutresRegimes: 0,
  anneesSPV: 25,
  enfantsAvant2004: 0,
  servicesMilitaires: 'aucun',
  trimestresServicesMilitaires: 0,
}, 1980);

test('Services effectifs = 128', cSPV.trimestresServicesEffectifs === 128,
  `Calculé: ${cSPV.trimestresServicesEffectifs}`);
test('Majoration SPV = 3', cSPV.trimestresMajorationSPV === 3,
  `Calculé: ${cSPV.trimestresMajorationSPV}`);
test('Liquidables = 148 (128 + 20 bonif, SANS les 3 SPV)', cSPV.trimestresLiquidables === 148,
  `Calculé: ${cSPV.trimestresLiquidables}`);
test('Assurance CNRACL = 151 (148 + 3 SPV)', cSPV.trimestresAssuranceCNRACL === 151,
  `Calculé: ${cSPV.trimestresAssuranceCNRACL}`);
test('Assurance − liquidables = majoration SPV',
  cSPV.trimestresAssuranceCNRACL - cSPV.trimestresLiquidables === cSPV.trimestresMajorationSPV,
  `Écart: ${cSPV.trimestresAssuranceCNRACL - cSPV.trimestresLiquidables}`);

console.log('');

// ============================================================================
// M1 — Le temps partiel ne réduit pas la durée d'assurance
// ============================================================================
console.log('📋 M1 : Temps partiel — durée d\'assurance à temps plein');
console.log('───────────────────────────────────────────────────────────────────');

// Carrière de 40 ans (160 trim temps plein) à quotité 0,8 → 128 trim proratisés.
// (Carrière assez longue pour que la bonification 1/5e s'applique dans les deux cas.)
const mTP = calculerDurees({
  dateEntreeSPP: new Date(2004, 0, 1),
  dateDepart: new Date(2044, 0, 1),
  quotite: 0.8,
  trimestresAutresRegimes: 0,
  anneesSPV: 0,
  enfantsAvant2004: 0,
  servicesMilitaires: 'aucun',
  trimestresServicesMilitaires: 0,
}, 1980);

test('Services temps plein = 160 (durée d\'assurance)', mTP.trimestresServicesTempsPlein === 160,
  `Calculé: ${mTP.trimestresServicesTempsPlein}`);
test('Services proratisés = 128 (liquidation, 160 × 0,8)', mTP.trimestresServicesEffectifs === 128,
  `Calculé: ${mTP.trimestresServicesEffectifs}`);
test('Liquidables = 148 (128 services proratisés + 20 bonif)', mTP.trimestresLiquidables === 148,
  `Calculé: ${mTP.trimestresLiquidables}`);
test('Assurance CNRACL = 180 (160 temps plein + 20 bonif, NON proratisée)', mTP.trimestresAssuranceCNRACL === 180,
  `Calculé: ${mTP.trimestresAssuranceCNRACL}`);

console.log('');

// ============================================================================
// M2 — Plafond global de 20 trimestres pour la bonification du 1/5e
// ============================================================================
console.log('📋 M2 : Plafond global du 1/5e (SPP + militaire)');
console.log('───────────────────────────────────────────────────────────────────');

// 100 trim SPP (bonif 20) + 30 trim militaires (bonif 6) → total plafonné à 20, pas 26
const m2 = calculerDurees({
  dateEntreeSPP: new Date(2004, 0, 1),
  dateDepart: new Date(2029, 0, 1),
  quotite: 1,
  trimestresAutresRegimes: 0,
  anneesSPV: 0,
  enfantsAvant2004: 0,
  servicesMilitaires: 'bspp',
  trimestresServicesMilitaires: 30,
}, 1980);

const bonifTotale = m2.trimestresBonificationCinquieme + m2.trimestresBonificationMilitaire;
test('Bonification 1/5e totale (SPP + militaire) = 20, plafond global', bonifTotale === 20,
  `Calculé: ${bonifTotale} (SPP ${m2.trimestresBonificationCinquieme} + mil ${m2.trimestresBonificationMilitaire})`);
test('Liquidables = 150 (100 services + 20 bonif + 30 militaires)', m2.trimestresLiquidables === 150,
  `Calculé: ${m2.trimestresLiquidables}`);

console.log('');

// ============================================================================
// M3 — Annulation de décote progressive (62 → 64 ans)
// ============================================================================
console.log('📋 M3 : Décote progressive (génération 1969 → annulation à 64 ans)');
console.log('───────────────────────────────────────────────────────────────────');

// Né en 1969 : annulation décote à 64 ans (2033). Départ à 62 ans (2031),
// durée insuffisante (160/172). L'ancienne garde figée à 62 ans renvoyait 0 à tort.
const decote1969 = calculerTrimestresDecote(
  new Date(1969, 0, 1),
  new Date(2031, 0, 1), // 62 ans
  160,
  172
);
test('Décote à 62 ans (génération 1969) = 8 trimestres (et non 0)', decote1969 === 8,
  `Calculé: ${decote1969}`);

// Contrôle : au-delà de l'âge d'annulation (64 ans, 2033), plus de décote
const decoteApres = calculerTrimestresDecote(
  new Date(1969, 0, 1),
  new Date(2033, 6, 1), // > 64 ans
  160,
  172
);
test('Décote après 64 ans = 0', decoteApres === 0, `Calculé: ${decoteApres}`);

console.log('');

// ============================================================================
// M4 — Proratisation de la majoration prime de feu
// ============================================================================
console.log('📋 M4 : Proratisation prime de feu (carrière mixte)');
console.log('───────────────────────────────────────────────────────────────────');

// Carrière mixte : 80 trim SPP sur 140 liquidables → proratisation 80/140 ≈ 57,14 %
const pfMixte = calculerMajorationPrimeFeu(30000, 75, true, 80, 0, 140, 172);
test('Majoration prime de feu proratisée (carrière mixte)', pfMixte.proratisee === true,
  `proratisee: ${pfMixte.proratisee}`);
test('Taux de proratisation ≈ 57,14 %', approx(pfMixte.tauxProratisation, 57.14, 0.1),
  `Calculé: ${pfMixte.tauxProratisation}`);

// Carrière SPP complète (173 ≥ 172) → pas de proratisation
const pfComplet = calculerMajorationPrimeFeu(30000, 75, true, 173, 0, 173, 172);
test('Carrière SPP complète : pas de proratisation', pfComplet.proratisee === false,
  `proratisee: ${pfComplet.proratisee}`);

console.log('');

// ============================================================================
// M5 — La NBI n'est pas intégrée au TIB (pas de prime de feu sur la NBI)
// ============================================================================
console.log('📋 M5 : NBI non intégrée au TIB');
console.log('───────────────────────────────────────────────────────────────────');

const tibSansNBI = calculerTraitementIndiciaire(526);
test('TIB sans NBI intégrée (nbiIntegre = false)', tibSansNBI.nbiIntegre === false,
  `nbiIntegre: ${tibSansNBI.nbiIntegre}`);
test('TIB annuel = indice × valeur point (aucune NBI ajoutée)',
  approx(tibSansNBI.annuel, 526 * POINT_INDICE.VALEUR_ANNUELLE, 0.5),
  `Calculé: ${tibSansNBI.annuel} | Attendu: ${(526 * POINT_INDICE.VALEUR_ANNUELLE).toFixed(2)}`);

console.log('');

// ============================================================================
// RÉSUMÉ
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`  Corrections P1 : ${passed} réussis · ${failed} échoués · ${passed + failed} total`);
console.log('═══════════════════════════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
