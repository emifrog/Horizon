/**
 * Tests de validation - Simulateur Retraite SPP
 *
 * Ces tests vérifient les calculs avec des valeurs concrètes et attendues
 * basées sur la réglementation CNRACL.
 *
 * Exécuter avec Node.js : node tests/test-validation.js
 */

import { POINT_INDICE, TAUX, getDureeAssuranceRequise, BONIFICATIONS } from '../js/config/parametres.js';
import { calculerTraitementIndiciaire, calculerTauxLiquidationBrut, calculerCoefficientDecote, calculerPension, calculerPensionBrute } from '../js/modules/pension.js';
import { calculerDurees, calculerBonificationCinquieme, calculerTrimestresServicesEffectifs } from '../js/modules/duree.js';
import { calculerTrimestresDecote, genererScenariosDepart } from '../js/modules/ages.js';
import { calculerNBI, calculerMoyennePondereeNBI, calculerSupplementNBI } from '../js/modules/nbi.js';
import { calculerSurcote, calculerTauxSurcote } from '../js/modules/surcote.js';
import { calculerAge, calculerTrimestresEntreDates } from '../js/utils/dates.js';

// Compteurs
let testsReussis = 0;
let testsEchoues = 0;
const erreurs = [];

function test(nom, valeurObtenue, valeurAttendue, tolerance = 0.01) {
  const ecart = Math.abs(valeurObtenue - valeurAttendue);
  const ok = ecart <= tolerance;

  if (ok) {
    console.log(`✅ ${nom}`);
    console.log(`   Obtenu: ${valeurObtenue}, Attendu: ${valeurAttendue}`);
    testsReussis++;
  } else {
    console.log(`❌ ${nom}`);
    console.log(`   Obtenu: ${valeurObtenue}, Attendu: ${valeurAttendue}`);
    console.log(`   Écart: ${ecart.toFixed(4)}`);
    testsEchoues++;
    erreurs.push({ nom, obtenu: valeurObtenue, attendu: valeurAttendue, ecart });
  }
}

function testBool(nom, valeurObtenue, valeurAttendue) {
  if (valeurObtenue === valeurAttendue) {
    console.log(`✅ ${nom}`);
    testsReussis++;
  } else {
    console.log(`❌ ${nom}`);
    console.log(`   Obtenu: ${valeurObtenue}, Attendu: ${valeurAttendue}`);
    testsEchoues++;
    erreurs.push({ nom, obtenu: valeurObtenue, attendu: valeurAttendue });
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('       TESTS DE VALIDATION - VALEURS CONCRÈTES');
console.log('═══════════════════════════════════════════════════════════════\n');

// ============================================================================
// TEST 1 : Valeur du point d'indice
// ============================================================================
console.log('📋 TEST 1 : Valeur du point d\'indice');
console.log('─────────────────────────────────────────────────────────────────');

// Référence 2024 : Indice majoré 361 = 1777€/mois brut (SMIC FP)
// Donc valeur point = 1777 × 12 / 361 = 59.07€/an/point
// OU valeur mensuelle = 1777 / 361 = 4.92€/mois/point

console.log(`Valeur point dans le code (annuelle): ${POINT_INDICE.VALEUR_ANNUELLE}`);
console.log(`Valeur point dans le code (mensuelle): ${POINT_INDICE.VALEUR_MENSUELLE}`);

// Test avec indice 562 (Adjudant échelon moyen)
// Traitement réel attendu ≈ 2600€/mois brut (selon grilles FPT 2024)
const indice562 = 562;
const traitement562 = calculerTraitementIndiciaire(indice562);

console.log(`\nIndice 562 - Traitement calculé:`);
console.log(`  Annuel: ${traitement562.annuel}€`);
console.log(`  Mensuel: ${traitement562.mensuel}€`);

// Le traitement mensuel d'un indice 562 devrait être ~2600€
// Si le code donne ~230€, la valeur du point est mal utilisée (annuelle au lieu de mensuelle)
const traitementAttendu562 = 562 * 4.92278; // Si valeur mensuelle = 4.92278
console.log(`  Attendu (valeur mensuelle × 12): ${(traitementAttendu562 * 12).toFixed(2)}€/an`);

// PROBLÈME IDENTIFIÉ : La valeur 4.92278 est la valeur MENSUELLE du point
// mais elle est utilisée comme valeur ANNUELLE dans le code !
// Correction : VALEUR_ANNUELLE devrait être = 4.92278 × 12 = 59.07€

const valeurPointCorrecte = 4.92278 * 12; // ~59.07€/an/point
console.log(`\n⚠️ VALEUR CORRECTE du point (annuelle): ${valeurPointCorrecte.toFixed(2)}€`);
console.log(`⚠️ Valeur actuelle dans le code: ${POINT_INDICE.VALEUR_ANNUELLE}€`);
console.log(`⚠️ Ratio: ${(valeurPointCorrecte / POINT_INDICE.VALEUR_ANNUELLE).toFixed(1)}x\n`);

// Test de cohérence
test('Valeur point annuelle cohérente (≈59€)',
  POINT_INDICE.VALEUR_ANNUELLE,
  59.07,
  1.0
);

console.log('');

// ============================================================================
// TEST 2 : Calcul du traitement indiciaire brut
// ============================================================================
console.log('📋 TEST 2 : Calcul du traitement indiciaire brut');
console.log('─────────────────────────────────────────────────────────────────');

// Cas 1 : Indice 562 (Adjudant)
// Formule : Indice × Valeur point mensuelle × 12
// 562 × 4.92278 × 12 = 33199.23€/an = 2766.60€/mois
const traitement562Result = calculerTraitementIndiciaire(562);
const tibAttendu562 = 562 * 4.92278 * 12;
test('TIB indice 562 - Annuel', traitement562Result.annuel, tibAttendu562, 1);
test('TIB indice 562 - Mensuel', traitement562Result.mensuel, tibAttendu562 / 12, 1);

// Cas 2 : Indice 700 (Lieutenant)
const traitement700Result = calculerTraitementIndiciaire(700);
const tibAttendu700 = 700 * 4.92278 * 12;
test('TIB indice 700 - Annuel', traitement700Result.annuel, tibAttendu700, 1);

console.log('');

// ============================================================================
// TEST 3 : Calcul des trimestres de services effectifs
// ============================================================================
console.log('📋 TEST 3 : Calcul des trimestres de services');
console.log('─────────────────────────────────────────────────────────────────');

// 25 ans de services = 100 trimestres
const dateEntree = new Date(2000, 0, 1);
const dateDepart = new Date(2025, 0, 1);
const trimestresCalcules = calculerTrimestresServicesEffectifs(dateEntree, dateDepart, 1);
test('25 ans de services = 100 trimestres', trimestresCalcules, 100, 0);

// 17 ans = 68 trimestres (condition services actifs)
const dateDepart17ans = new Date(2017, 0, 1);
const trimestres17ans = calculerTrimestresServicesEffectifs(dateEntree, dateDepart17ans, 1);
test('17 ans de services = 68 trimestres', trimestres17ans, 68, 0);

// Temps partiel 80%
const trimestresTP80 = calculerTrimestresServicesEffectifs(dateEntree, dateDepart, 0.8);
test('25 ans à 80% = 80 trimestres', trimestresTP80, 80, 0);

console.log('');

// ============================================================================
// TEST 4 : Bonification du 1/5ème
// ============================================================================
console.log('📋 TEST 4 : Bonification du 1/5ème');
console.log('─────────────────────────────────────────────────────────────────');

// 100 trimestres → 20 trimestres de bonification (plafonné)
test('Bonif 1/5 sur 100 trim = 20 (floor(100/5))', calculerBonificationCinquieme(100), 20, 0);

// 80 trimestres → 16 trimestres
test('Bonif 1/5 sur 80 trim = 16', calculerBonificationCinquieme(80), 16, 0);

// 68 trimestres → 13 trimestres
test('Bonif 1/5 sur 68 trim = 13', calculerBonificationCinquieme(68), 13, 0);

// 150 trimestres → 20 trimestres (plafonné)
test('Bonif 1/5 sur 150 trim = 20 (plafonné)', calculerBonificationCinquieme(150), 20, 0);

console.log('');

// ============================================================================
// TEST 5 : Calcul du taux de liquidation
// ============================================================================
console.log('📋 TEST 5 : Calcul du taux de liquidation');
console.log('─────────────────────────────────────────────────────────────────');

// Taux plein : 172/172 = 75%
test('Taux 172/172 = 75%', calculerTauxLiquidationBrut(172, 172), 75, 0.01);

// Taux réduit : 150/172 = 65.41%
const tauxReduit = (150 / 172) * 75;
test('Taux 150/172 = 65.41%', calculerTauxLiquidationBrut(150, 172), tauxReduit, 0.01);

// Taux plafonné : 200/172 = 75% (plafonné)
test('Taux 200/172 = 75% (plafonné)', calculerTauxLiquidationBrut(200, 172), 75, 0.01);

console.log('');

// ============================================================================
// TEST 6 : Calcul de la décote
// ============================================================================
console.log('📋 TEST 6 : Calcul de la décote');
console.log('─────────────────────────────────────────────────────────────────');

// Formule décote : min(trimManquantsDuree, trimManquantsAge) × 1.25%
// Maximum 20 trimestres

// 10 trimestres de décote → coefficient 0.875 (1 - 10×0.0125)
test('Décote 10 trim = coef 0.875', calculerCoefficientDecote(10), 0.875, 0.001);

// 20 trimestres de décote → coefficient 0.75 (1 - 20×0.0125)
test('Décote 20 trim = coef 0.75', calculerCoefficientDecote(20), 0.75, 0.001);

// 25 trimestres de décote → coefficient 0.75 (plafonné à 20 trim)
test('Décote 25 trim = coef 0.75 (plafond)', calculerCoefficientDecote(25), 0.75, 0.001);

console.log('');

// ============================================================================
// TEST 7 : Calcul complet de pension - Cas taux plein
// ============================================================================
console.log('📋 TEST 7 : Pension complète - Taux plein');
console.log('─────────────────────────────────────────────────────────────────');

// Profil : Indice 562, 172 trimestres, génération 1965, départ à 62 ans
// TIB attendu : 562 × 59.07 ≈ 33197€/an
// Pension brute : 33197 × 75% = 24898€/an = 2074€/mois

const donneesTauxPlein = {
  indiceBrut: 562,
  trimestresLiquidables: 172,
  trimestresAssurance: 172,
  trimestresRequis: 172,
  dateNaissance: new Date(1965, 5, 15),
  dateDepart: new Date(2027, 5, 15), // 62 ans
};

const resultatTauxPlein = calculerPension(donneesTauxPlein);

console.log(`\nRésultat calculé :`);
console.log(`  TIB annuel: ${resultatTauxPlein.traitementIndiciaireAnnuel}€`);
console.log(`  Taux liquidation: ${resultatTauxPlein.tauxLiquidationBrut}%`);
console.log(`  Pension brute mensuelle: ${resultatTauxPlein.pensionBruteMensuelle}€`);
console.log(`  Pension nette mensuelle: ${resultatTauxPlein.pensionNetteMensuelle}€`);

// Valeurs attendues (avec valeur point correcte de 59.07€)
const tibAttendu = 562 * 59.07;
const pensionBruteAttendue = tibAttendu * 0.75 / 12;

console.log(`\nValeurs attendues :`);
console.log(`  TIB annuel attendu: ${tibAttendu.toFixed(2)}€`);
console.log(`  Pension brute mensuelle attendue: ${pensionBruteAttendue.toFixed(2)}€`);

test('Pension brute mensuelle taux plein (≈2074€)',
  resultatTauxPlein.pensionBruteMensuelle,
  pensionBruteAttendue,
  100
);

console.log('');

// ============================================================================
// TEST 8 : Calcul de pension avec décote
// ============================================================================
console.log('📋 TEST 8 : Pension avec décote');
console.log('─────────────────────────────────────────────────────────────────');

// Profil : Départ à 57 ans avec 160 trimestres d'assurance (12 trim manquants)
// Décote = min(12, trimManquantsAge) × 1.25%

const donneesDecote = {
  indiceBrut: 562,
  trimestresLiquidables: 160,
  trimestresAssurance: 160,
  trimestresRequis: 172,
  dateNaissance: new Date(1970, 5, 15),
  dateDepart: new Date(2027, 5, 15), // 57 ans
};

const resultatDecote = calculerPension(donneesDecote);

console.log(`\nRésultat calculé avec décote :`);
console.log(`  Trimestres décote: ${resultatDecote.trimestresDecote}`);
console.log(`  Coefficient décote: ${resultatDecote.coefficientDecote}`);
console.log(`  Taux liquidation net: ${resultatDecote.tauxLiquidationNet}%`);
console.log(`  Pension brute mensuelle: ${resultatDecote.pensionBruteMensuelle}€`);

// Le calcul de trimestres décote devrait être :
// - Trimestres manquants durée : 172 - 160 = 12
// - Trimestres manquants âge (57→62) : 20
// - Décote = min(12, 20) = 12 trimestres
test('Trimestres décote = 12', resultatDecote.trimestresDecote, 12, 0);

// Coefficient décote = 1 - 12 × 0.0125 = 0.85
test('Coefficient décote = 0.85', resultatDecote.coefficientDecote, 0.85, 0.01);

console.log('');

// ============================================================================
// TEST 9 : Calcul NBI
// ============================================================================
console.log('📋 TEST 9 : Supplément NBI');
console.log('─────────────────────────────────────────────────────────────────');

// Cas 1 : NBI 30 points, 15 ans de perception (intégration complète)
// Supplément = 30 × valeurPoint × tauxLiquidation
// = 30 × 59.07 × 0.75 = 1329€/an = 110.75€/mois

const donneesNBI = {
  pointsNBI: 30,
  dureeMoisNBI: 180, // 15 ans = intégration complète
  dureeServicesTotal: 172,
  tauxLiquidation: 75,
};

const resultatNBI = calculerNBI(donneesNBI);

console.log(`\nRésultat NBI :`);
console.log(`  Points NBI: ${resultatNBI.pointsNBI}`);
console.log(`  Moyenne pondérée: ${resultatNBI.moyennePonderee}`);
console.log(`  Supplément mensuel: ${resultatNBI.supplementMensuel}€`);

// Avec intégration complète (≥15 ans), moyenne pondérée = points NBI
test('Moyenne pondérée NBI ≥15 ans = 30 points', resultatNBI.moyennePonderee, 30, 0);

// Supplément attendu avec valeur point correcte
const supplementAttendu = (30 * 59.07 * 0.75) / 12;
console.log(`  Supplément attendu (valeur point 59.07€): ${supplementAttendu.toFixed(2)}€/mois`);

test('Supplément NBI mensuel (≈110€)',
  resultatNBI.supplementMensuel,
  supplementAttendu,
  10
);

console.log('');

// ============================================================================
// TEST 10 : Calcul Surcote
// ============================================================================
console.log('📋 TEST 10 : Surcote');
console.log('─────────────────────────────────────────────────────────────────');

// 8 trimestres de surcote = 8 × 1.25% = 10%
test('Taux surcote 8 trim = 10%', calculerTauxSurcote(8), 10, 0.01);

// 12 trimestres = 15%
test('Taux surcote 12 trim = 15%', calculerTauxSurcote(12), 15, 0.01);

console.log('');

// ============================================================================
// TEST 11 : Durée d'assurance complète
// ============================================================================
console.log('📋 TEST 11 : Durée d\'assurance complète');
console.log('─────────────────────────────────────────────────────────────────');

const donneesDureeComplete = {
  dateEntreeSPP: new Date(1995, 0, 1),
  dateDepart: new Date(2030, 0, 1), // 35 ans de services
  quotite: 1,
  trimestresAutresRegimes: 8,
  anneesSPV: 12, // → 1 trimestre majoration
  enfantsAvant2004: 2, // → 8 trimestres
  servicesMilitaires: 'aucun',
  trimestresServicesMilitaires: 0,
};

const resultatDuree = calculerDurees(donneesDureeComplete, 1970);

console.log(`\nRésultat durée :`);
console.log(`  Services effectifs: ${resultatDuree.trimestresServicesEffectifs} trim`);
console.log(`  Bonification 1/5: ${resultatDuree.trimestresBonificationCinquieme} trim`);
console.log(`  Bonification enfants: ${resultatDuree.trimestresBonificationEnfants} trim`);
console.log(`  Majoration SPV: ${resultatDuree.trimestresMajorationSPV} trim`);
console.log(`  Total liquidables: ${resultatDuree.trimestresLiquidables} trim`);
console.log(`  Total assurance: ${resultatDuree.trimestresAssuranceTotale} trim`);

// 35 ans = 140 trimestres
test('Services effectifs 35 ans = 140 trim', resultatDuree.trimestresServicesEffectifs, 140, 0);

// Bonification 1/5 sur 140 trim = 28, mais plafonné à 20
test('Bonification 1/5 plafonnée à 20', resultatDuree.trimestresBonificationCinquieme, 20, 0);

// 2 enfants avant 2004 = 8 trimestres
test('Bonification enfants = 8', resultatDuree.trimestresBonificationEnfants, 8, 0);

// 12 ans SPV = 1 trimestre (seuil 10 ans)
test('Majoration SPV 12 ans = 1', resultatDuree.trimestresMajorationSPV, 1, 0);

// Total liquidables = 140 + 20 + 8 + 1 = 169
test('Total liquidables = 169', resultatDuree.trimestresLiquidables, 169, 0);

// Total assurance = 169 + 8 = 177
test('Total assurance = 177', resultatDuree.trimestresAssuranceTotale, 177, 0);

console.log('');

// ============================================================================
// TEST 12 : Âge et scénarios de départ
// ============================================================================
console.log('📋 TEST 12 : Âge et dates');
console.log('─────────────────────────────────────────────────────────────────');

const dateNaissance = new Date(1970, 5, 15); // 15 juin 1970
const dateRef = new Date(2027, 5, 15); // 15 juin 2027

test('Âge au 15/06/2027 = 57 ans', calculerAge(dateNaissance, dateRef), 57, 0);

const dateRef62 = new Date(2032, 5, 15);
test('Âge au 15/06/2032 = 62 ans', calculerAge(dateNaissance, dateRef62), 62, 0);

console.log('');

// ============================================================================
// RÉSUMÉ ET ANALYSE
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('                    RÉSUMÉ DES TESTS');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`✅ Tests réussis : ${testsReussis}`);
console.log(`❌ Tests échoués : ${testsEchoues}`);
console.log(`📊 Total : ${testsReussis + testsEchoues} tests`);

if (erreurs.length > 0) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    ERREURS DÉTECTÉES');
  console.log('═══════════════════════════════════════════════════════════════');
  erreurs.forEach((e, i) => {
    console.log(`\n${i + 1}. ${e.nom}`);
    console.log(`   Valeur obtenue : ${e.obtenu}`);
    console.log(`   Valeur attendue : ${e.attendu}`);
    if (e.ecart !== undefined) {
      console.log(`   Écart : ${e.ecart.toFixed(4)}`);
    }
  });
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    VALEURS DE RÉFÉRENCE');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`
📊 Valeur du point d'indice :
  - Mensuelle : ${POINT_INDICE.VALEUR_MENSUELLE}€/mois/point
  - Annuelle  : ${POINT_INDICE.VALEUR_ANNUELLE.toFixed(2)}€/an/point

📋 Exemples de calcul :
  - Indice 562 → TIB mensuel : ${(562 * POINT_INDICE.VALEUR_MENSUELLE).toFixed(2)}€
  - Indice 562 → Pension taux plein : ${(562 * POINT_INDICE.VALEUR_ANNUELLE * 0.75 / 12).toFixed(2)}€/mois
`);

console.log('═══════════════════════════════════════════════════════════════\n');

if (testsEchoues > 0) {
  process.exit(1);
}
