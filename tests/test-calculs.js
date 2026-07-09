/**
 * Tests de fonctionnalités - Simulateur Retraite SPP
 *
 * Ce fichier teste les principales fonctions de calcul
 * Exécuter avec Node.js : node tests/test-calculs.js
 */

// Simuler l'environnement navigateur pour les imports
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Imports des modules à tester
import { getDureeAssuranceRequise, getMajorationSPV, AGES, TAUX, PFR } from '../js/config/parametres.js';
import { calculerTraitementIndiciaire, calculerTauxLiquidationBrut, calculerCoefficientDecote, calculerPension } from '../js/modules/pension.js';
import { calculerPFR } from '../js/modules/pfr.js';
import { calculerNBI } from '../js/modules/nbi.js';
import { calculerSurcote, appliquerSurcote } from '../js/modules/surcote.js';

// Compteurs de tests
let testsReussis = 0;
let testsEchoues = 0;

/**
 * Fonction utilitaire pour exécuter un test
 */
function test(nom, condition, messageEchec = '') {
  if (condition) {
    console.log(`✅ ${nom}`);
    testsReussis++;
  } else {
    console.log(`❌ ${nom}`);
    if (messageEchec) console.log(`   → ${messageEchec}`);
    testsEchoues++;
  }
}

/**
 * Fonction pour comparer des nombres avec tolérance
 */
function aproximativement(a, b, tolerance = 0.01) {
  return Math.abs(a - b) <= tolerance;
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('          TESTS DE FONCTIONNALITÉS - SIMULATEUR RETRAITE SPP');
console.log('═══════════════════════════════════════════════════════════════\n');

// ============================================================================
// TEST 1 : Paramètres réglementaires
// ============================================================================
console.log('📋 TEST 1 : Paramètres réglementaires');
console.log('─────────────────────────────────────────────────────────────────');

test('Durée assurance génération 1965 = 172 trimestres',
  getDureeAssuranceRequise(1965) === 172);

test('Durée assurance génération 1962 = 169 trimestres',
  getDureeAssuranceRequise(1962) === 169);

test('Durée assurance génération 2000 = 172 trimestres (défaut)',
  getDureeAssuranceRequise(2000) === 172);

test('Majoration SPV 0 ans = 0 trimestre',
  getMajorationSPV(0) === 0);

test('Majoration SPV 10 ans = 1 trimestre',
  getMajorationSPV(10) === 1);

test('Majoration SPV 15 ans = 1 trimestre (entre 10 et 20)',
  getMajorationSPV(15) === 1);

test('Majoration SPV 20 ans = 2 trimestres',
  getMajorationSPV(20) === 2);

test('Majoration SPV 25 ans = 3 trimestres',
  getMajorationSPV(25) === 3);

test('Majoration SPV 30 ans = 3 trimestres (max)',
  getMajorationSPV(30) === 3);

test('Âge ouverture droits = 57 ans',
  AGES.OUVERTURE_DROITS === 57);

test('Âge annulation décote = 62 ans',
  AGES.ANNULATION_DECOTE === 62);

test('Taux plein = 75%',
  TAUX.PLEIN === 75);

test('Décote par trimestre = 1.25%',
  TAUX.DECOTE_PAR_TRIMESTRE === 1.25);

test('Année création RAFP = 2005',
  PFR.ANNEE_CREATION_RAFP === 2005);

console.log('');

// ============================================================================
// TEST 2 : Calcul du traitement indiciaire
// ============================================================================
console.log('📋 TEST 2 : Calcul du traitement indiciaire');
console.log('─────────────────────────────────────────────────────────────────');

const traitement500 = calculerTraitementIndiciaire(500);
test('Traitement indice 500 - annuel calculé',
  traitement500.annuel > 0,
  `Valeur: ${traitement500.annuel}`);

test('Traitement indice 500 - mensuel = annuel / 12',
  aproximativement(traitement500.mensuel, traitement500.annuel / 12),
  `Mensuel: ${traitement500.mensuel}, Annuel/12: ${traitement500.annuel / 12}`);

const traitement700 = calculerTraitementIndiciaire(700);
test('Traitement indice 700 > traitement indice 500',
  traitement700.annuel > traitement500.annuel);

console.log('');

// ============================================================================
// TEST 3 : Calcul du taux de liquidation
// ============================================================================
console.log('📋 TEST 3 : Calcul du taux de liquidation');
console.log('─────────────────────────────────────────────────────────────────');

test('Taux liquidation 172/172 trimestres = 75%',
  calculerTauxLiquidationBrut(172, 172) === 75);

test('Taux liquidation 86/172 trimestres = 37.5%',
  aproximativement(calculerTauxLiquidationBrut(86, 172), 37.5));

test('Taux liquidation 200/172 trimestres = 75% (plafonné)',
  calculerTauxLiquidationBrut(200, 172) === 75);

test('Protection division par zéro (trimestres requis = 0)',
  calculerTauxLiquidationBrut(100, 0) === 0);

test('Protection division par zéro (trimestres requis négatif)',
  calculerTauxLiquidationBrut(100, -10) === 0);

console.log('');

// ============================================================================
// TEST 4 : Calcul de la décote
// ============================================================================
console.log('📋 TEST 4 : Calcul de la décote');
console.log('─────────────────────────────────────────────────────────────────');

test('Coefficient décote 0 trimestres = 1 (pas de décote)',
  calculerCoefficientDecote(0) === 1);

test('Coefficient décote -5 trimestres = 1 (pas de décote)',
  calculerCoefficientDecote(-5) === 1);

test('Coefficient décote 4 trimestres = 0.95',
  aproximativement(calculerCoefficientDecote(4), 0.95));

test('Coefficient décote 20 trimestres = 0.75',
  aproximativement(calculerCoefficientDecote(20), 0.75));

test('Coefficient décote 25 trimestres = 0.75 (min garanti)',
  calculerCoefficientDecote(25) === 0.75);

console.log('');

// ============================================================================
// TEST 5 : Calcul complet de pension
// ============================================================================
console.log('📋 TEST 5 : Calcul complet de pension');
console.log('─────────────────────────────────────────────────────────────────');

const donneesPension = {
  indiceBrut: 562,
  trimestresLiquidables: 172,
  trimestresAssurance: 172,
  trimestresRequis: 172,
  dateNaissance: new Date(1970, 5, 15),
  dateDepart: new Date(2032, 5, 15),
};

const resultatPension = calculerPension(donneesPension);

test('Pension calculée - traitement annuel > 0',
  resultatPension.traitementIndiciaireAnnuel > 0,
  `Valeur: ${resultatPension.traitementIndiciaireAnnuel}`);

test('Pension calculée - taux liquidation brut = 75%',
  resultatPension.tauxLiquidationBrut === 75,
  `Valeur: ${resultatPension.tauxLiquidationBrut}`);

test('Pension calculée - pas de décote (coefficient = 1)',
  resultatPension.coefficientDecote === 1,
  `Valeur: ${resultatPension.coefficientDecote}`);

test('Pension calculée - pension brute mensuelle > 0',
  resultatPension.pensionBruteMensuelle > 0,
  `Valeur: ${resultatPension.pensionBruteMensuelle}`);

test('Pension calculée - pension nette < pension brute',
  resultatPension.pensionNetteMensuelle < resultatPension.pensionBruteMensuelle);

console.log('');

// ============================================================================
// TEST 6 : Calcul PFR et RAFP
// ============================================================================
console.log('📋 TEST 6 : Calcul PFR et RAFP');
console.log('─────────────────────────────────────────────────────────────────');

const donneesPFR = {
  indiceBrut: 562,
  montantAnnuelPFR: null, // Calcul automatique
  anneesCotisation: 20,
};

const resultatPFR = calculerPFR(donneesPFR);

test('PFR calculée - montant PFR annuel > 0',
  resultatPFR.montantPFRAnnuel > 0,
  `Valeur: ${resultatPFR.montantPFRAnnuel}`);

test('PFR calculée - cotisation RAFP annuelle > 0',
  resultatPFR.cotisationAnnuelleRAFP > 0,
  `Valeur: ${resultatPFR.cotisationAnnuelleRAFP}`);

test('PFR calculée - rente RAFP mensuelle >= 0',
  resultatPFR.renteRAFPMensuelle >= 0,
  `Valeur: ${resultatPFR.renteRAFPMensuelle}`);

// Test protection division par zéro
const resultatPFRZero = calculerPFR({ indiceBrut: 0, anneesCotisation: 20 });
test('PFR protection indice zéro',
  resultatPFRZero.montantPFRAnnuel === 0);

console.log('');

// ============================================================================
// TEST 7 : Calcul NBI
// ============================================================================
console.log('📋 TEST 7 : Calcul NBI');
console.log('─────────────────────────────────────────────────────────────────');

const donneesNBI = {
  pointsNBI: 30,
  dureeMoisNBI: 180, // 15 ans
  dureeRequise: 172,
};

const resultatNBI = calculerNBI(donneesNBI);

test('NBI calculée - éligible (points et durée > 0)',
  resultatNBI.eligible === true);

test('NBI calculée - supplément mensuel > 0',
  resultatNBI.supplementMensuel > 0,
  `Valeur: ${resultatNBI.supplementMensuel}`);

// Plus de seuil de perception minimale (la formule gère les durées courtes).
const resultatNBICourt = calculerNBI({
  pointsNBI: 30,
  dureeMoisNBI: 6,
  dureeRequise: 172,
});

test('NBI courte durée - éligible (plus de seuil 1 an), supplément > 0',
  resultatNBICourt.eligible === true && resultatNBICourt.supplementMensuel > 0);

// Points null → non éligible, supplément 0.
const resultatNBINull = calculerNBI({
  pointsNBI: null,
  dureeMoisNBI: 180,
  dureeRequise: 172,
});

test('NBI avec points null - supplément = 0',
  resultatNBINull.supplementMensuel === 0,
  `Supplément: ${resultatNBINull.supplementMensuel}`);

console.log('');

// ============================================================================
// TEST 8 : Calcul Surcote
// ============================================================================
console.log('📋 TEST 8 : Calcul Surcote');
console.log('─────────────────────────────────────────────────────────────────');

// La surcote s'applique à partir de l'âge légal SÉDENTAIRE (64 ans pour génération 1965)
const donneesSurcote = {
  dateNaissance: new Date(1965, 0, 1),
  dateDepart: new Date(2030, 0, 1), // 65 ans (> 64 ans âge sédentaire)
  trimestresAssurance: 180, // > 172 requis
  trimestresRequis: 172,
  dateTauxPlein: new Date(2024, 0, 1), // Taux plein atteint avant
};

const resultatSurcote = calculerSurcote(donneesSurcote);

test('Surcote calculée - éligible',
  resultatSurcote.eligible === true,
  `Eligible: ${resultatSurcote.eligible}`);

test('Surcote calculée - trimestres > 0',
  resultatSurcote.trimestresSurcote > 0,
  `Trimestres: ${resultatSurcote.trimestresSurcote}`);

test('Surcote calculée - coefficient majoration > 1',
  resultatSurcote.coefficientMajoration > 1,
  `Coefficient: ${resultatSurcote.coefficientMajoration}`);

// Test application surcote
const pensionBase = 2000;
const pensionAvecSurcote = appliquerSurcote(pensionBase, 1.05);
test('Application surcote 5% sur 2000€ = 2100€',
  aproximativement(pensionAvecSurcote, 2100));

// Test surcote non éligible (trimestres insuffisants)
const donneesSurcoteNonEligible = {
  dateNaissance: new Date(1965, 0, 1),
  dateDepart: new Date(2027, 0, 1),
  trimestresAssurance: 160, // < 172 requis
  trimestresRequis: 172,
  dateTauxPlein: new Date(2024, 0, 1),
};

const resultatSurcoteNonEligible = calculerSurcote(donneesSurcoteNonEligible);

test('Surcote non éligible si trimestres < requis',
  resultatSurcoteNonEligible.eligible === false);

console.log('');

// ============================================================================
// TEST 9 : Calcul des durées
// ============================================================================
console.log('📋 TEST 9 : Calcul des durées');
console.log('─────────────────────────────────────────────────────────────────');

import { calculerDurees } from '../js/modules/duree.js';

const donneesDuree = {
  dateEntreeSPP: new Date(1995, 0, 1),
  dateDepart: new Date(2030, 0, 1),
  quotite: 1,
  trimestresAutresRegimes: 8,
  anneesSPV: 10,
  enfantsAvant2004: 2,
};

const resultatDuree = calculerDurees(donneesDuree, 1970);

test('Durée calculée - trimestres services effectifs > 0',
  resultatDuree.trimestresServicesEffectifs > 0,
  `Valeur: ${resultatDuree.trimestresServicesEffectifs}`);

test('Durée calculée - trimestres liquidables >= services effectifs',
  resultatDuree.trimestresLiquidables >= resultatDuree.trimestresServicesEffectifs,
  `Liquidables: ${resultatDuree.trimestresLiquidables}, Effectifs: ${resultatDuree.trimestresServicesEffectifs}`);

test('Durée calculée - bonification 1/5ème calculée',
  resultatDuree.trimestresBonificationCinquieme >= 0,
  `Valeur: ${resultatDuree.trimestresBonificationCinquieme}`);

test('Durée calculée - durée assurance totale inclut autres régimes',
  resultatDuree.trimestresAssuranceTotale >= resultatDuree.trimestresLiquidables,
  `Totale: ${resultatDuree.trimestresAssuranceTotale}, Liquidables: ${resultatDuree.trimestresLiquidables}`);

console.log('');

// ============================================================================
// TEST 10 : Calcul des âges et dates
// ============================================================================
console.log('📋 TEST 10 : Calcul des âges et dates');
console.log('─────────────────────────────────────────────────────────────────');

import {
  calculerDateOuvertureDroits,
  calculerDateAnnulationDecote,
  calculerDateLimite,
  calculerDateTauxPlein,
  genererScenariosDepart
} from '../js/modules/ages.js';

const dateNaissance = new Date(1970, 5, 15);

// Note: Depuis la réforme 2023, les âges sont progressifs selon la génération
// Pour 1970: âge légal actif = 58 ans 3 mois, âge annulation décote = 63 ans
const dateOuverture = calculerDateOuvertureDroits(dateNaissance);
test('Date ouverture droits = 58 ans 3 mois (génération 1970)',
  dateOuverture.getFullYear() === 2028,
  `Année: ${dateOuverture.getFullYear()}`);

const dateAnnulation = calculerDateAnnulationDecote(dateNaissance);
// Annulation de la décote FIXE à 62 ans (catégorie active) : juin 1970 + 62 ans = juin 2032.
test('Date annulation décote = 62 ans (fixe, catégorie active)',
  dateAnnulation.getFullYear() === 2032,
  `Année: ${dateAnnulation.getFullYear()}`);

const dateLimite = calculerDateLimite(dateNaissance);
test('Date limite = 62 ans (catégorie active)',
  dateLimite.getFullYear() === 2032,
  `Année: ${dateLimite.getFullYear()}`);

// Test calcul date taux plein
const donneesDateTauxPlein = {
  dateNaissance: new Date(1970, 5, 15),
  dateEntreeSPP: new Date(1995, 0, 1),
  quotite: 1,
  trimestresAutresRegimes: 0,
  anneesSPV: 0,
  enfantsAvant2004: 0,
};

const resultatTauxPlein = calculerDateTauxPlein(donneesDateTauxPlein);
test('Date taux plein - retourne un objet avec date',
  resultatTauxPlein.date instanceof Date,
  `Type: ${typeof resultatTauxPlein.date}`);

test('Date taux plein - propriété atteintParDuree ou atteintParAge',
  resultatTauxPlein.atteintParDuree !== undefined && resultatTauxPlein.atteintParAge !== undefined,
  `ParDuree: ${resultatTauxPlein.atteintParDuree}, ParAge: ${resultatTauxPlein.atteintParAge}`);

// Test génération scénarios
const scenarios = genererScenariosDepart(donneesDateTauxPlein);
test('Génération scénarios - au moins 2 scénarios',
  scenarios.length >= 2,
  `Nombre: ${scenarios.length}`);

test('Génération scénarios - scénario anticipé existe',
  scenarios.some(s => s.type === 'anticipé' || s.type === 'au_plus_tot'),
  `Types: ${scenarios.map(s => s.type).join(', ')}`);

test('Génération scénarios - scénario taux plein existe',
  scenarios.some(s => s.type === 'taux_plein'),
  `Types: ${scenarios.map(s => s.type).join(', ')}`);

console.log('');

// ============================================================================
// RÉSUMÉ DES TESTS
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('                        RÉSUMÉ DES TESTS');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`✅ Tests réussis : ${testsReussis}`);
console.log(`❌ Tests échoués : ${testsEchoues}`);
console.log(`📊 Total : ${testsReussis + testsEchoues} tests`);
console.log('═══════════════════════════════════════════════════════════════');

if (testsEchoues > 0) {
  process.exit(1);
}
