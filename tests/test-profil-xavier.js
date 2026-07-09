/**
 * Test du profil Xavier (SDIS 06) - Comparaison avec simulation PDF
 * Données du document : simulation.txt
 */

import { 
  calculerTraitementIndiciaire, 
  calculerTauxLiquidationBrut, 
  calculerPensionBrute,
  calculerMajorationPrimeFeu 
} from '../js/modules/pension.js';
import { calculerDurees } from '../js/modules/duree.js';
import { calculerNBI } from '../js/modules/nbi.js';
import { calculerPFR } from '../js/modules/pfr.js';
import { getDureeAssuranceRequise, getAgeLegalActif } from '../js/config/parametres.js';

console.log('═══════════════════════════════════════════════════════════════════');
console.log('              TEST PROFIL XAVIER - SDIS 06');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');

// ============================================================================
// DONNÉES DU PROFIL (depuis simulation.txt)
// ============================================================================
const profil = {
  dateNaissance: new Date(1983, 4, 2),  // 02/05/1983
  dateEntreeSPP: new Date(2004, 0, 1),  // 01/01/2004
  indiceMajore: 526,
  pointsNBI: 16,
  dureeNBI: 30,  // depuis 2012 jusqu'à 2042 = 30 ans
  anneesSPV: 25,  // depuis 2000
  enfants: 2,
  quotite: 1,
};

// Date de départ optimal : 02/05/2042 (59 ans)
const dateDepartOptimal = new Date(2042, 4, 2);

// ============================================================================
// VALEURS ATTENDUES (depuis simulation.txt)
// ============================================================================
const attendu = {
  trimestresServicesEffectifs: 153,  // 38 ans 4 mois
  bonificationCinquieme: 20,  // plafonné
  majorationSPV: 3,  // décret 2026-18
  // Liquidables = 153 services + 20 bonif + 3 SPV = 176 (SPV comptée dans le montant
  // ET la durée d'assurance). Correspond au total du document CNRACL de référence.
  totalLiquidable: 176,
  totalAssurance: 176,
  trimestresRequis: 172,
  tauxLiquidation: 75,
  tibMensuel: 2589.38,
  majorationPrimeFeu: 647.35,
  pensionCNRACL: 2427.54,
  supplementNBI: 41.21,   // formule officielle (le doc affichait 61,64 € — méthode erronée)
  renteRAFP: 68,          // NB: sera revu au #6 (rente RAFP non servie avant 62 ans)
  totalBrut: 2557.18,     // valeur du document ; s'écartera après corrections NBI/RAFP
};

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

function approx(a, b, tolerance = 1) {
  return Math.abs(a - b) <= tolerance;
}

// ============================================================================
// TEST 1 : Paramètres réglementaires génération 1983
// ============================================================================
console.log('📋 TEST 1 : Paramètres réglementaires génération 1983');
console.log('─────────────────────────────────────────────────────────────────');

const trimestresRequis = getDureeAssuranceRequise(1983);
test('Trimestres requis génération 1983 = 172',
  trimestresRequis === 172,
  `Valeur: ${trimestresRequis}`);

const ageLegal = getAgeLegalActif(profil.dateNaissance);
test('Âge légal actif génération 1983 = 59 ans',
  ageLegal.ans === 59,
  `Valeur: ${ageLegal.ans} ans ${ageLegal.mois} mois`);

console.log('');

// ============================================================================
// TEST 2 : Traitement indiciaire brut
// ============================================================================
console.log('📋 TEST 2 : Traitement indiciaire brut');
console.log('─────────────────────────────────────────────────────────────────');

const traitement = calculerTraitementIndiciaire(profil.indiceMajore);
test('TIB mensuel ≈ 2 589 €',
  approx(traitement.mensuel, attendu.tibMensuel, 5),
  `Calculé: ${traitement.mensuel.toFixed(2)} € | Attendu: ${attendu.tibMensuel} €`);

test('TIB annuel ≈ 31 073 €',
  approx(traitement.annuel, 31072.56, 10),
  `Calculé: ${traitement.annuel.toFixed(2)} €`);

console.log('');

// ============================================================================
// TEST 3 : Calcul des durées
// ============================================================================
console.log('📋 TEST 3 : Calcul des durées');
console.log('─────────────────────────────────────────────────────────────────');

const donneesDuree = {
  dateEntreeSPP: profil.dateEntreeSPP,
  dateDepart: dateDepartOptimal,
  quotite: profil.quotite,
  trimestresAutresRegimes: 0,
  anneesSPV: profil.anneesSPV,
  enfantsAvant2004: 0,
  trimestresServicesMilitaires: 0,
  exceptionBonification: false,
};

const durees = calculerDurees(donneesDuree, 1983);

test('Trimestres services effectifs ≈ 153',
  approx(durees.trimestresServicesEffectifs, attendu.trimestresServicesEffectifs, 2),
  `Calculé: ${durees.trimestresServicesEffectifs} | Attendu: ${attendu.trimestresServicesEffectifs}`);

test('Bonification 1/5ème = 20 (plafond)',
  durees.trimestresBonificationCinquieme === attendu.bonificationCinquieme,
  `Calculé: ${durees.trimestresBonificationCinquieme} | Attendu: ${attendu.bonificationCinquieme}`);

test('Majoration SPV (décret 2026-18) = 3',
  durees.trimestresMajorationSPV === attendu.majorationSPV,
  `Calculé: ${durees.trimestresMajorationSPV} | Attendu: ${attendu.majorationSPV}`);

const totalLiquidable = durees.trimestresLiquidables;
test('Total trimestres liquidables = 176 (services + bonif + SPV)',
  approx(totalLiquidable, attendu.totalLiquidable, 1),
  `Calculé: ${totalLiquidable} | Attendu: ${attendu.totalLiquidable}`);

test('Durée d\'assurance = 176 (SPV comptée dans les deux)',
  approx(durees.trimestresAssuranceTotale, attendu.totalAssurance, 1),
  `Calculé: ${durees.trimestresAssuranceTotale} | Attendu: ${attendu.totalAssurance}`);

console.log('');

// ============================================================================
// TEST 4 : Taux de liquidation
// ============================================================================
console.log('📋 TEST 4 : Taux de liquidation');
console.log('─────────────────────────────────────────────────────────────────');

const tauxLiquidation = calculerTauxLiquidationBrut(totalLiquidable, trimestresRequis);
test('Taux de liquidation = 75% (maximum)',
  tauxLiquidation === attendu.tauxLiquidation,
  `Calculé: ${tauxLiquidation}% | Attendu: ${attendu.tauxLiquidation}%`);

console.log('');

// ============================================================================
// TEST 5 : Pension CNRACL
// ============================================================================
console.log('📋 TEST 5 : Pension CNRACL');
console.log('─────────────────────────────────────────────────────────────────');

// Calcul direct de la pension brute
const pensionBrute = calculerPensionBrute(traitement.annuel, tauxLiquidation);

test('Pension brute mensuelle ≈ 1 942 € (base sans majoration)',
  approx(pensionBrute.mensuel, 1942, 50),
  `Calculé: ${pensionBrute.mensuel.toFixed(2)} €`);

// Calcul de la majoration prime de feu
// Paramètres : TIB, taux, droit, trimSPP, bonifSPP, totalLiq, trimRequis
const majorationPF = calculerMajorationPrimeFeu(
  traitement.annuel,
  tauxLiquidation,
  true,  // droitMajoration
  durees.trimestresServicesEffectifs,  // 153 trimestres SPP
  durees.trimestresBonificationCinquieme,  // 20 trimestres bonification
  totalLiquidable,  // 176 trimestres
  trimestresRequis  // 172 trimestres requis
);

// Xavier : 153 SPP + 20 bonif = 173 >= 172 requis → pas de proratisation
// Majoration = TIB × 25% × 75% = 31073 × 0.25 × 0.75 = 5825 €/an = 485 €/mois
test('Majoration prime de feu ≈ 485 €/mois (sans proratisation)',
  approx(majorationPF.mensuelle, 485, 30),
  `Calculé: ${majorationPF.mensuelle.toFixed(2)} € | Proratisée: ${majorationPF.proratisee}`);

// Total pension CNRACL = base + majoration
const pensionTotaleMensuelle = pensionBrute.mensuel + majorationPF.mensuelle;
test('Pension CNRACL totale ≈ 2 428 €/mois',
  approx(pensionTotaleMensuelle, attendu.pensionCNRACL, 100),
  `Calculé: ${pensionTotaleMensuelle.toFixed(2)} € | Attendu: ${attendu.pensionCNRACL} €`);

console.log('');

// ============================================================================
// TEST 6 : Supplément NBI
// ============================================================================
console.log('📋 TEST 6 : Supplément NBI');
console.log('─────────────────────────────────────────────────────────────────');

// Formule officielle (décret 2006-779) : 16 × 120 trim. × (75/172/100) × valeur point.
// NB : le document de référence affichait 61,64 €, mais il appliquait à tort le taux de
// liquidation (75 %) au lieu du taux d'un trimestre → la valeur correcte est ~41,21 €.
const nbi = calculerNBI({
  pointsNBI: profil.pointsNBI,
  dureeMoisNBI: profil.dureeNBI * 12,  // 30 ans = 360 mois = 120 trim.
  dureeRequise: trimestresRequis,      // 172
});

test('Supplément NBI ≈ 41,21 €/mois (formule officielle)',
  approx(nbi.supplementMensuel, 41.21, 1),
  `Calculé: ${nbi.supplementMensuel.toFixed(2)} € | Attendu: 41,21 €`);

console.log('');

// ============================================================================
// TEST 7 : RAFP
// ============================================================================
console.log('📋 TEST 7 : RAFP');
console.log('─────────────────────────────────────────────────────────────────');

// Années de cotisation RAFP : depuis 2005 (création RAFP) jusqu'au départ (2042)
const anneesRAFP = 2042 - 2005; // = 37 ans
const montantPFRAnnuel = traitement.annuel * 0.25;  // Prime de feu = 25% TIB

const pfr = calculerPFR({
  indiceBrut: profil.indiceMajore,
  montantAnnuelPFR: montantPFRAnnuel,
  anneesCotisation: anneesRAFP,
}, 59);

// Départ à 59 ans : la rente RAFP n'est pas servie avant 62 ans → différée (0 ici).
// Elle sera versée à partir de 62 ans (à recalculer avec l'âge 62 le moment venu).
test('Rente RAFP différée à 59 ans (servie à partir de 62 ans)',
  pfr.renteRAFPMensuelle === 0 && pfr.renteDifferee === true,
  `renteMensuelle: ${pfr.renteRAFPMensuelle} | différée: ${pfr.renteDifferee}`);

console.log('');

// ============================================================================
// RÉSUMÉ
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════════');
console.log('                         RÉSUMÉ DES TESTS');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`✅ Tests réussis : ${passed}`);
console.log(`❌ Tests échoués : ${failed}`);
console.log(`📊 Total : ${passed + failed} tests`);
console.log('═══════════════════════════════════════════════════════════════════');

// Récapitulatif des montants
console.log('');
console.log('📊 RÉCAPITULATIF PENSION CALCULÉE :');
console.log('─────────────────────────────────────────────────────────────────');
console.log(`   Pension CNRACL base    : ${pensionBrute.mensuel.toFixed(2)} €/mois`);
console.log(`   Majoration prime feu   : ${majorationPF.mensuelle.toFixed(2)} €/mois`);
console.log(`   Supplément NBI         : ${nbi.supplementMensuel.toFixed(2)} €/mois`);
console.log(`   Rente RAFP             : ${pfr.renteRAFPMensuelle.toFixed(2)} €/mois`);
console.log('─────────────────────────────────────────────────────────────────');
const totalCalcule = pensionBrute.mensuel + majorationPF.mensuelle + nbi.supplementMensuel + pfr.renteRAFPMensuelle;
console.log(`   TOTAL BRUT ESTIMÉ      : ${totalCalcule.toFixed(2)} €/mois`);
console.log(`   (Attendu document      : ${attendu.totalBrut} €/mois)`);
console.log('');

process.exit(failed > 0 ? 1 : 0);
