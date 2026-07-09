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
import { calculerMajorationPrimeFeu, calculerTraitementIndiciaire, calculerPension } from '../js/modules/pension.js';
import { verifierEligibiliteSurcote } from '../js/modules/surcote.js';
import { POINT_INDICE, getDureeAssuranceRequise } from '../js/config/parametres.js';

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
// C1 — La majoration SPV compte dans les liquidables ET la durée d'assurance
// ============================================================================
console.log('📋 C1 : Majoration SPV dans les liquidables ET l\'assurance');
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
test('Liquidables = 151 (128 + 20 bonif + 3 SPV)', cSPV.trimestresLiquidables === 151,
  `Calculé: ${cSPV.trimestresLiquidables}`);
test('Assurance CNRACL = 151 (SPV comptée aussi)', cSPV.trimestresAssuranceCNRACL === 151,
  `Calculé: ${cSPV.trimestresAssuranceCNRACL}`);
test('SPV comptée dans les deux : liquidables = assurance CNRACL',
  cSPV.trimestresAssuranceCNRACL === cSPV.trimestresLiquidables,
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
// #10 — BSPP/BMPM hors 1/5e (militaires exclus de la bonification du cinquième)
// ============================================================================
console.log('📋 #10 : BSPP/BMPM hors bonification du 1/5e');
console.log('───────────────────────────────────────────────────────────────────');

// SPP 30 ans (120 trim, condition 27 ans OK) + 30 trim militaires.
// La bonification 1/5e ne porte QUE sur les services SPP (plafond 20) ; les militaires
// comptent dans les liquidables mais n'ouvrent PAS le 1/5e.
const m10 = calculerDurees({
  dateEntreeSPP: new Date(2004, 0, 1),
  dateDepart: new Date(2034, 0, 1),
  quotite: 1,
  trimestresAutresRegimes: 0,
  anneesSPV: 0,
  enfantsAvant2004: 0,
  servicesMilitaires: 'bspp',
  trimestresServicesMilitaires: 30,
}, 1980);

test('Bonification militaire = 0 (BSPP/BMPM hors 1/5e)', m10.trimestresBonificationMilitaire === 0,
  `Calculé: ${m10.trimestresBonificationMilitaire}`);
test('Bonification 1/5e = 20 (sur les seuls services SPP, plafonné)', m10.trimestresBonificationCinquieme === 20,
  `Calculé: ${m10.trimestresBonificationCinquieme}`);
test('Liquidables = 170 (120 SPP + 20 bonif + 30 militaires)', m10.trimestresLiquidables === 170,
  `Calculé: ${m10.trimestresLiquidables}`);

// ============================================================================
// #9 — Services CNRACL hors SPP : comptent pour la condition des 27 ans (fonctionnaire)
// ============================================================================
console.log('\n📋 #9 : Services CNRACL hors SPP (condition 27 ans)');
console.log('───────────────────────────────────────────────────────────────────');

// SPP 26 ans (104 trim < 108) : sans services hors SPP, condition 27 ans NON remplie → 1/5e = 0.
const m9sans = calculerDurees({
  dateEntreeSPP: new Date(2004, 0, 1),
  dateDepart: new Date(2030, 0, 1), // 26 ans → 104 trim
  quotite: 1, anneesSPV: 0, enfantsAvant2004: 0,
  servicesMilitaires: 'aucun', trimestresServicesMilitaires: 0,
  trimestresServicesHorsSPP: 0,
}, 1980);
test('Sans services hors SPP : SPP 26 ans < 27 → bonification 1/5e = 0', m9sans.trimestresBonificationCinquieme === 0,
  `Calculé: ${m9sans.trimestresBonificationCinquieme}`);

// Avec 8 trim hors SPP : services fonctionnaire = 104 + 8 = 112 ≥ 108 → condition remplie → 1/5e actif.
const m9avec = calculerDurees({
  dateEntreeSPP: new Date(2004, 0, 1),
  dateDepart: new Date(2030, 0, 1),
  quotite: 1, anneesSPV: 0, enfantsAvant2004: 0,
  servicesMilitaires: 'aucun', trimestresServicesMilitaires: 0,
  trimestresServicesHorsSPP: 8,
}, 1980);
test('Avec 8 trim hors SPP : condition 27 ans remplie → bonification 1/5e > 0', m9avec.trimestresBonificationCinquieme > 0,
  `Calculé: ${m9avec.trimestresBonificationCinquieme} (services fonctionnaire ${m9avec.servicesFonctionnaire})`);

console.log('');

// ============================================================================
// M3 — Annulation de décote FIXE à 62 ans (catégorie active)
// ============================================================================
console.log('📋 M3 : Décote — annulation FIXE à 62 ans (catégorie active)');
console.log('───────────────────────────────────────────────────────────────────');

// Né en 1969 : annulation décote à 62 ans FIXE (2031). Départ à 61 ans (2030),
// durée insuffisante (160/172) → décote = min(12 manquants durée, 4 trim jusqu'à 62).
const decote61 = calculerTrimestresDecote(
  new Date(1969, 0, 1),
  new Date(2030, 0, 1), // 61 ans
  160,
  172
);
test('Décote à 61 ans (avant annulation à 62) = 4 trimestres', decote61 === 4,
  `Calculé: ${decote61}`);

// À 62 ans (âge d'annulation fixe), plus aucune décote.
const decote62 = calculerTrimestresDecote(
  new Date(1969, 0, 1),
  new Date(2031, 0, 1), // 62 ans
  160,
  172
);
test('Décote à 62 ans (annulation fixe) = 0', decote62 === 0, `Calculé: ${decote62}`);

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
// MINEURS (b) — surcote âge actif, minimum garanti, générations < 1960
// ============================================================================
console.log('📋 Mineurs (b) : surcote (âge actif), minimum garanti, gén. < 1960');
console.log('───────────────────────────────────────────────────────────────────');

// m1 — Surcote basée sur l'âge légal SÉDENTAIRE (62-64). Un SPP (limite d'âge 62) n'y
// a quasi pas droit. Né en 1965 → âge sédentaire 63 ans 3 mois (2028).
// Départ à 62 ans (2027) : âge sédentaire non atteint → NON éligible.
const surcKO = verifierEligibiliteSurcote(new Date(1965, 0, 1), new Date(2027, 0, 1), 176, 172);
test('Surcote NON éligible à 62 ans (âge sédentaire non atteint)', surcKO.eligible === false,
  `motif: ${surcKO.motif}`);
// Départ après l'âge sédentaire (65 ans) : éligible.
const surcOK = verifierEligibiliteSurcote(new Date(1965, 0, 1), new Date(2030, 0, 1), 176, 172);
test('Surcote éligible une fois l\'âge sédentaire atteint (65 ans)', surcOK.eligible === true,
  `motif: ${surcOK.motif}`);

// #7 — Minimum garanti : barème par paliers + condition taux plein (pas de décote).
// Cas applicable : indice bas, 40 ans de services effectifs (MG à 100 %), départ à 62 ans
// (âge d'annulation atteint → PAS de décote). MG dépasse la base → servi.
const resMG = calculerPension({
  indiceBrut: 340,
  trimestresLiquidables: 160,        // 40 ans
  trimestresAssurance: 160,
  trimestresServicesEffectifs: 160,  // 40 ans → MG à 100 %
  trimestresRequis: 172,
  dateNaissance: new Date(1965, 0, 1),
  dateDepart: new Date(2027, 0, 1),  // 62 ans → aucune décote
});
test('Minimum garanti appliqué (pension faible, taux plein sans décote)', resMG.minimumGarantiApplique === true,
  `min: ${resMG.minimumGaranti} | base: ${resMG.pensionBaseMensuelle} | décote: ${resMG.trimestresDecote}`);
test('Prime de feu ajoutée PAR-DESSUS le minimum garanti (non absorbée)',
  resMG.pensionBruteMensuelle > resMG.minimumGaranti,
  `total: ${resMG.pensionBruteMensuelle} | min: ${resMG.minimumGaranti}`);
test('Pension totale = minimum garanti + majoration prime de feu',
  approx(resMG.pensionBruteMensuelle, resMG.minimumGaranti + resMG.majorationPrimeFeu.mensuelle, 1),
  `total: ${resMG.pensionBruteMensuelle} | attendu: ${(resMG.minimumGaranti + resMG.majorationPrimeFeu.mensuelle).toFixed(2)}`);

// #7 — Minimum garanti NON servi si la pension subit une décote (condition taux plein).
const resMGdecote = calculerPension({
  indiceBrut: 340,
  trimestresLiquidables: 80,
  trimestresAssurance: 80,
  trimestresServicesEffectifs: 80,
  trimestresRequis: 172,
  dateNaissance: new Date(1970, 0, 1),
  dateDepart: new Date(2027, 0, 1),  // 57 ans → décote (âge d'annulation non atteint)
});
test('Minimum garanti NON servi si décote (condition taux plein non remplie)',
  resMGdecote.minimumGarantiApplique === false && resMGdecote.trimestresDecote > 0,
  `applique: ${resMGdecote.minimumGarantiApplique} | décote: ${resMGdecote.trimestresDecote}`);

// m5 — Générations < 1960 : durée requise plafonnée à la plus ancienne valeur connue (167)
test('Durée requise génération 1955 = 167 (et non 172)', getDureeAssuranceRequise(1955) === 167,
  `Calculé: ${getDureeAssuranceRequise(1955)}`);
test('Durée requise génération 1980 = 172', getDureeAssuranceRequise(1980) === 172,
  `Calculé: ${getDureeAssuranceRequise(1980)}`);

// #3 — Table durée requise CATÉGORIE ACTIVE (≠ droit commun) : 1966→169 … 1970→172.
test('Durée requise active 1966 = 169 (et non 172)', getDureeAssuranceRequise(1966) === 169,
  `Calculé: ${getDureeAssuranceRequise(1966)}`);
test('Durée requise active 1968 = 170 (exemple CNRACL)', getDureeAssuranceRequise(1968) === 170,
  `Calculé: ${getDureeAssuranceRequise(1968)}`);
test('Durée requise active 1969 = 171', getDureeAssuranceRequise(1969) === 171,
  `Calculé: ${getDureeAssuranceRequise(1969)}`);
// #4 — Deltas post-suspension LFSS (pension à effet ≥ 01/09/2026).
test('Durée requise 1969 post-suspension = 170', getDureeAssuranceRequise(1969, '2027-01-01') === 170,
  `Calculé: ${getDureeAssuranceRequise(1969, '2027-01-01')}`);
test('Durée requise 1968 pré-suspension inchangée = 170', getDureeAssuranceRequise(1968, '2026-01-01') === 170,
  `Calculé: ${getDureeAssuranceRequise(1968, '2026-01-01')}`);

console.log('');

// ============================================================================
// RÉSUMÉ
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`  Corrections P1 : ${passed} réussis · ${failed} échoués · ${passed + failed} total`);
console.log('═══════════════════════════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
