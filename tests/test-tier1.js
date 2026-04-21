/**
 * Tests unitaires Tier 1 — Horizon SPP
 *
 * Couvre les correctifs de sécurité et de précision apportés lors du Tier 1 :
 *  • arrondi commercial stable (utils/nombres.js)
 *  • plafonnement de la surcote (pas de taux de liquidation > 100 %)
 *  • scénarios CNRACL réels : pension de base, décote, surcote, NBI intégrée
 *
 * Exécution : node tests/test-tier1.js
 */

import { arrondir, arrondirEntier, borner } from '../js/utils/nombres.js';
import {
  calculerTraitementIndiciaire,
  calculerTauxLiquidationBrut,
  calculerCoefficientDecote,
  calculerPension,
  calculerMinimumGaranti,
  estimerCoutTrimestreDecote,
} from '../js/modules/pension.js';
import {
  calculerNBI,
  calculerMoyennePondereeNBI,
  calculerNBIActivite,
} from '../js/modules/nbi.js';
import {
  calculerSurcote,
  appliquerSurcote,
  calculerTauxSurcote,
  calculerCoefficientSurcote,
  simulerScenariosSurcote,
} from '../js/modules/surcote.js';
import { POINT_INDICE, TAUX } from '../js/config/parametres.js';

// --- Mini-framework de test -------------------------------------------------

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

function proche(a, b, tol = 0.01) {
  return Math.abs(a - b) <= tol;
}

function section(titre) {
  console.log(`\n── ${titre} ${'─'.repeat(Math.max(0, 68 - titre.length))}`);
}

// ============================================================================
// 1. UTILITAIRE arrondir()
// ============================================================================
section('1. utils/nombres — arrondir()');

test('arrondir(1.005, 2) = 1.01 (pas d\'erreur flottante)', arrondir(1.005, 2) === 1.01,
  `obtenu ${arrondir(1.005, 2)}`);

test('arrondir(2.345, 2) = 2.35', arrondir(2.345, 2) === 2.35,
  `obtenu ${arrondir(2.345, 2)}`);

test('arrondir(-1.005, 2) = -1.01 (symétrique autour de zéro)',
  arrondir(-1.005, 2) === -1.01, `obtenu ${arrondir(-1.005, 2)}`);

test('arrondir(0.1 + 0.2, 2) = 0.30', arrondir(0.1 + 0.2, 2) === 0.30,
  `obtenu ${arrondir(0.1 + 0.2, 2)}`);

test('arrondir(NaN) = 0', arrondir(NaN) === 0);
test('arrondir(null) = 0', arrondir(null) === 0);
test('arrondir(undefined) = 0', arrondir(undefined) === 0);
test('arrondir(Infinity) = 0', arrondir(Infinity) === 0);

test('arrondir(1234.5678, 0) = 1235', arrondir(1234.5678, 0) === 1235);
test('arrondir(1234.5678, 4) = 1234.5678', arrondir(1234.5678, 4) === 1234.5678);

test('arrondirEntier(1.5, "up") = 2', arrondirEntier(1.5, 'up') === 2);
test('arrondirEntier(1.5, "down") = 1', arrondirEntier(1.5, 'down') === 1);
test('arrondirEntier(1.49) = 1', arrondirEntier(1.49) === 1);

test('borner(5, 0, 10) = 5', borner(5, 0, 10) === 5);
test('borner(15, 0, 10) = 10', borner(15, 0, 10) === 10);
test('borner(-5, 0, 10) = 0', borner(-5, 0, 10) === 0);

// ============================================================================
// 2. PENSION — scénarios CNRACL réels
// ============================================================================
section('2. modules/pension — scénarios CNRACL');

// Scénario A : SPP indice 562 (commandant 1er échelon), né 1970, carrière pleine
const pensionA = calculerPension({
  indiceBrut: 562,
  trimestresLiquidables: 172,
  trimestresAssurance: 172,
  trimestresRequis: 172,
  dateNaissance: new Date(1970, 5, 15),
  dateDepart: new Date(2032, 5, 15), // 62 ans (limite active)
});

const tibAttendu = 562 * POINT_INDICE.VALEUR_ANNUELLE;
test('Scénario A — TIB annuel ≈ indice × valeur point',
  proche(pensionA.traitementIndiciaireAnnuel, tibAttendu, 0.5),
  `${pensionA.traitementIndiciaireAnnuel} vs ${tibAttendu.toFixed(2)}`);

test('Scénario A — taux liquidation brut = 75 %',
  pensionA.tauxLiquidationBrut === 75);

test('Scénario A — coefficient décote = 1 (pas de décote)',
  pensionA.coefficientDecote === 1);

test('Scénario A — taux net = 75 %',
  pensionA.tauxLiquidationNet === 75);

// Pension base attendue : TIB × 75 %
const pensionBaseAttendue = tibAttendu * 0.75 / 12;
test('Scénario A — pension de base ≈ TIB × 75 % / 12',
  proche(pensionA.pensionBaseMensuelle, pensionBaseAttendue, 0.5),
  `${pensionA.pensionBaseMensuelle} vs ${pensionBaseAttendue.toFixed(2)}`);

test('Scénario A — majoration prime de feu > 0 (SPP RDC)',
  pensionA.majorationPrimeFeu.mensuelle > 0);

test('Scénario A — majoration ≈ 25 % de la pension de base',
  proche(pensionA.majorationPrimeFeu.mensuelle, pensionA.pensionBaseMensuelle * 0.25, 1),
  `majoration = ${pensionA.majorationPrimeFeu.mensuelle}`);

test('Scénario A — pension brute totale = base + majoration',
  proche(pensionA.pensionBruteMensuelle,
    pensionA.pensionBaseMensuelle + pensionA.majorationPrimeFeu.mensuelle, 0.05));

test('Scénario A — pension nette < pension brute',
  pensionA.pensionNetteMensuelle < pensionA.pensionBruteMensuelle);

// Scénario B : départ anticipé avec décote (4 trimestres manquants)
const pensionB = calculerPension({
  indiceBrut: 562,
  trimestresLiquidables: 168,          // 4 manquants
  trimestresAssurance: 168,
  trimestresRequis: 172,
  dateNaissance: new Date(1970, 5, 15),
  dateDepart: new Date(2029, 5, 15),   // 59 ans : avant annulation décote
});

test('Scénario B — décote : 4 trimestres manquants détectés',
  pensionB.trimestresDecote === 4,
  `trimestresDecote = ${pensionB.trimestresDecote}`);

test('Scénario B — coefficient décote = 0.95 (4 × 1.25 %)',
  proche(pensionB.coefficientDecote, 0.95, 0.0001),
  `coef = ${pensionB.coefficientDecote}`);

test('Scénario B — pension brute < pension scénario A',
  pensionB.pensionBruteMensuelle < pensionA.pensionBruteMensuelle);

// Scénario C : NBI intégrée au TIB (≥ 15 ans de perception)
const pensionC = calculerPension({
  indiceBrut: 562,
  trimestresLiquidables: 172,
  trimestresAssurance: 172,
  trimestresRequis: 172,
  dateNaissance: new Date(1970, 5, 15),
  dateDepart: new Date(2032, 5, 15),
  pointsNBIIntegres: 30,
});

test('Scénario C — nbiIntegre = true avec 30 pts',
  pensionC.nbiIntegre === true && pensionC.pointsNBIIntegres === 30);

test('Scénario C — TIB gonflé par la NBI intégrée',
  pensionC.traitementIndiciaireAnnuel > pensionA.traitementIndiciaireAnnuel);

test('Scénario C — pension brute > scénario A (même carrière + NBI)',
  pensionC.pensionBruteMensuelle > pensionA.pensionBruteMensuelle);

// Minimum garanti
test('calculerMinimumGaranti(172, 172) > 0',
  calculerMinimumGaranti(172, 172) > 0);

test('calculerMinimumGaranti(0, 172) = 0',
  calculerMinimumGaranti(0, 172) === 0);

test('calculerMinimumGaranti(172, 0) = 0 (protection div/0)',
  calculerMinimumGaranti(172, 0) === 0);

// Coût d'un trimestre de décote
const coutDecote = estimerCoutTrimestreDecote(tibAttendu, 75);
test('estimerCoutTrimestreDecote retourne un montant > 0',
  coutDecote > 0);

// Cas limites
test('calculerTauxLiquidationBrut(300, 172) plafonné à 75 %',
  calculerTauxLiquidationBrut(300, 172) === 75);

test('calculerCoefficientDecote(100) plafonné à 0.75 (décote max 25 %)',
  calculerCoefficientDecote(100) === 0.75);

// ============================================================================
// 3. NBI
// ============================================================================
section('3. modules/nbi');

const nbi15ans = calculerNBI({
  pointsNBI: 30,
  dureeMoisNBI: 180,       // 15 ans pile
  dureeServicesTotal: 172,
  tauxLiquidation: 75,
});

test('NBI 15 ans — éligible', nbi15ans.eligible === true);
test('NBI 15 ans — moyenne pondérée = points (intégration complète)',
  nbi15ans.moyennePonderee === 30);
test('NBI 15 ans — supplément mensuel > 0',
  nbi15ans.supplementMensuel > 0);

// Formule attendue : 30 × valeur point × 75 %
const supplementAttendu15 = 30 * POINT_INDICE.VALEUR_ANNUELLE * 0.75 / 12;
test('NBI 15 ans — supplément conforme à la formule',
  proche(nbi15ans.supplementMensuel, supplementAttendu15, 0.05),
  `obtenu ${nbi15ans.supplementMensuel}, attendu ${supplementAttendu15.toFixed(2)}`);

const nbi5ans = calculerNBI({
  pointsNBI: 30,
  dureeMoisNBI: 60,        // 5 ans
  dureeServicesTotal: 172,
  tauxLiquidation: 75,
});

test('NBI 5 ans — éligible (≥ 1 an)', nbi5ans.eligible === true);
test('NBI 5 ans — moyenne pondérée < points (prorata)',
  nbi5ans.moyennePonderee < 30 && nbi5ans.moyennePonderee > 0);
test('NBI 5 ans — supplément < supplément 15 ans',
  nbi5ans.supplementMensuel < nbi15ans.supplementMensuel);

const nbi6mois = calculerNBI({
  pointsNBI: 30,
  dureeMoisNBI: 6,         // < 12 mois
  dureeServicesTotal: 172,
  tauxLiquidation: 75,
});

test('NBI 6 mois — non éligible', nbi6mois.eligible === false);
test('NBI 6 mois — supplément = 0', nbi6mois.supplementMensuel === 0);

// Bornes de calculerMoyennePondereeNBI
test('moyenne pondérée avec points=0 retourne 0',
  calculerMoyennePondereeNBI(0, 180, 172) === 0);
test('moyenne pondérée avec duree=0 retourne 0',
  calculerMoyennePondereeNBI(30, 0, 172) === 0);

const nbiActivite = calculerNBIActivite(30);
test('NBI activité 30 pts > 0', nbiActivite > 0);
test('NBI activité 0 pts = 0', calculerNBIActivite(0) === 0);

// ============================================================================
// 4. SURCOTE — éligibilité et plafonnement
// ============================================================================
section('4. modules/surcote — éligibilité et plafonnement');

// Scénario éligible : né 1965, départ 65 ans avec 180 trimestres
const surcoteOK = calculerSurcote({
  dateNaissance: new Date(1965, 0, 1),
  dateDepart: new Date(2030, 0, 1),
  trimestresAssurance: 180,
  trimestresRequis: 172,
  dateTauxPlein: new Date(2024, 0, 1),
});

test('Surcote — éligible quand âge sédentaire atteint + taux plein',
  surcoteOK.eligible === true);
test('Surcote — trimestres > 0', surcoteOK.trimestresSurcote > 0);
test('Surcote — coefficient > 1', surcoteOK.coefficientMajoration > 1);

// Inéligible : trimestres insuffisants
const surcoteKO1 = calculerSurcote({
  dateNaissance: new Date(1965, 0, 1),
  dateDepart: new Date(2027, 0, 1),
  trimestresAssurance: 160,          // < 172
  trimestresRequis: 172,
  dateTauxPlein: new Date(2024, 0, 1),
});
test('Surcote — non éligible si trimestres < requis',
  surcoteKO1.eligible === false);

// Inéligible : âge trop jeune
const surcoteKO2 = calculerSurcote({
  dateNaissance: new Date(1970, 0, 1),
  dateDepart: new Date(2030, 0, 1),  // 60 ans < 63-64 ans sédentaire
  trimestresAssurance: 180,
  trimestresRequis: 172,
  dateTauxPlein: new Date(2028, 0, 1),
});
test('Surcote — non éligible si âge < âge sédentaire',
  surcoteKO2.eligible === false);

// Calcul du taux
test('calculerTauxSurcote(4) = 5.00 (4 × 1.25 %)',
  proche(calculerTauxSurcote(4), 5.00, 0.01));
test('calculerTauxSurcote(0) = 0', calculerTauxSurcote(0) === 0);
test('calculerCoefficientSurcote(5) = 1.05',
  proche(calculerCoefficientSurcote(5), 1.05, 0.0001));

// Application & plafonnement
test('appliquerSurcote(2000, 1.05) = 2100 (+5 %)',
  proche(appliquerSurcote(2000, 1.05, 75), 2100, 0.01));

// Cas critique : coefficient aberrant → plafonnement
// Avec taux 75 % et coef 1.5, taux final = 112.5 % → doit être plafonné à 100 %
// Pension calculée à 75 % : 2000€ → équivalent à 2000 × (100/75) = 2666.67 max
const pensionPlafonnee = appliquerSurcote(2000, 1.5, 75);
test('appliquerSurcote plafonné à 100 % du taux de liquidation',
  pensionPlafonnee <= 2666.67 + 0.01,
  `obtenu ${pensionPlafonnee}, max attendu 2666.67`);

test('appliquerSurcote avec coef < 1 clampé à 1 (pas de surcote négative)',
  appliquerSurcote(2000, 0.5, 75) === 2000);

// Scénarios multiples (jusqu'à 5 ans après taux plein, sans dépasser limite d'âge)
const scenariosSurc = simulerScenariosSurcote(
  {
    dateNaissance: new Date(1965, 0, 1),
    trimestresRequis: 172,
  },
  new Date(2025, 0, 1), // taux plein à 60 ans
  2000,                 // pension de référence
);

test('simulerScenariosSurcote retourne des scénarios',
  scenariosSurc.length > 0);

test('simulerScenariosSurcote — gain mensuel ≥ 0 pour tout scénario',
  scenariosSurc.every((s) => s.gainMensuel >= 0));

test('simulerScenariosSurcote — pension croissante',
  scenariosSurc.every((s, i, a) => i === 0 || s.pensionMensuelle >= a[i - 1].pensionMensuelle));

// ============================================================================
// RÉSUMÉ
// ============================================================================
console.log('\n' + '═'.repeat(72));
console.log(`  Tests Tier 1 : ${reussis} réussis · ${echoues} échoués · ${reussis + echoues} total`);
console.log('═'.repeat(72));

if (echoues > 0) {
  console.log('\nÉchecs :');
  echecs.forEach((e) => console.log(`  • ${e.nom}${e.detail ? ` — ${e.detail}` : ''}`));
  process.exit(1);
}
