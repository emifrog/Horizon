/**
 * Tests unitaires Tier 2 — Horizon SPP
 *
 *  • Validations cross-field (validerCoherenceProfil)
 *  • Bug corrigé : validerProfil lit désormais dateEntreeSPP (canonique)
 *  • Paramètres étendus : COEFFICIENTS_RAFP_AGE 50-70, barème PFR SPV
 *
 * Exécution : node tests/test-tier2.js
 */

import {
  validerCoherenceProfil,
  validerProfil,
} from '../js/utils/validators.js';
import {
  COEFFICIENTS_RAFP_AGE,
  PFR_SPV,
  getMontantPFRSPV,
  getCoefficientRAFPAge,
  DATE_MAJ_PARAMETRES,
  PARAMS,
} from '../js/config/parametres.js';

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
// 1. Paramètres étendus
// ============================================================================
section('1. Paramètres étendus');

test('DATE_MAJ_PARAMETRES défini et au format ISO',
  typeof DATE_MAJ_PARAMETRES === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(DATE_MAJ_PARAMETRES));

test('PARAMS.DATE_MAJ exposé', PARAMS.DATE_MAJ === DATE_MAJ_PARAMETRES);

test('COEFFICIENTS_RAFP_AGE couvre 50-70 ans',
  Object.keys(COEFFICIENTS_RAFP_AGE).length >= 20
  && 50 in COEFFICIENTS_RAFP_AGE
  && 70 in COEFFICIENTS_RAFP_AGE);

test('COEFFICIENTS_RAFP_AGE[62] = 1.00 (âge pivot)',
  COEFFICIENTS_RAFP_AGE[62] === 1.00);

test('COEFFICIENTS_RAFP_AGE monotone croissant 55→67',
  [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67]
    .every((age, i, arr) => i === 0 || COEFFICIENTS_RAFP_AGE[age] >= COEFFICIENTS_RAFP_AGE[arr[i - 1]]));

test('getCoefficientRAFPAge(45) = 0.60 (clamp bas)',
  getCoefficientRAFPAge(45) === 0.60);

test('getCoefficientRAFPAge(75) = 1.36 (clamp haut)',
  getCoefficientRAFPAge(75) === 1.36);

// Barème PFR SPV
test('PFR_SPV.ANCIENNETE_MIN = 20', PFR_SPV.ANCIENNETE_MIN === 20);
test('PFR_SPV.ANCIENNETE_MIN_INCAPACITE = 15', PFR_SPV.ANCIENNETE_MIN_INCAPACITE === 15);

test('getMontantPFRSPV(10) = 0', getMontantPFRSPV(10) === 0);
test('getMontantPFRSPV(15) = 512 (cas incapacité)', getMontantPFRSPV(15) === 512);
test('getMontantPFRSPV(20) = 1025', getMontantPFRSPV(20) === 1025);
test('getMontantPFRSPV(25) = 2050', getMontantPFRSPV(25) === 2050);
test('getMontantPFRSPV(30) = 2690', getMontantPFRSPV(30) === 2690);
test('getMontantPFRSPV(35) = 3075', getMontantPFRSPV(35) === 3075);
test('getMontantPFRSPV(40) = 3075 (plafond)', getMontantPFRSPV(40) === 3075);

// ============================================================================
// 2. Bug corrigé : validerProfil lit dateEntreeSPP
// ============================================================================
section('2. validerProfil — clé canonique dateEntreeSPP');

const profilBase = {
  dateNaissance: new Date(1970, 5, 15),
  anneeNaissance: 1970,
  dateEntreeSPP: new Date(1995, 0, 1),
  quotite: 1,
  anneesSPV: 0,
  indiceBrut: 562,
};

const validBase = validerProfil(profilBase);
test('Profil valide (clé canonique dateEntreeSPP)', validBase.valide === true,
  JSON.stringify(validBase.erreurs));

// Date d'entrée avant la naissance (catastrophe de saisie)
const profilDateEntreeAvantNaissance = {
  ...profilBase,
  dateEntreeSPP: new Date(1960, 0, 1), // avant 1970
};
const resBug = validerProfil(profilDateEntreeAvantNaissance);
test('validerProfil détecte entrée SPP avant naissance',
  resBug.valide === false && 'dateEntreeSPP' in resBug.erreurs);

// Compat ascendante : l'ancienne clé dateEntree est encore acceptée
const profilAncienneSyntaxe = {
  dateNaissance: new Date(1970, 5, 15),
  anneeNaissance: 1970,
  dateEntree: new Date(1995, 0, 1),
  quotite: 1,
  anneesSPV: 0,
  indiceBrut: 562,
};
const validRetro = validerProfil(profilAncienneSyntaxe);
test('validerProfil — rétro-compatibilité dateEntree', validRetro.valide === true);

// ============================================================================
// 3. Cross-field — dates
// ============================================================================
section('3. validerCoherenceProfil — dates');

const dataBase = {
  dateNaissance: new Date(1970, 5, 15),
  dateEntreeSPP: new Date(1995, 0, 1),
  indiceBrut: 562,
};

const coherenceOK = validerCoherenceProfil(dataBase);
test('Profil standard — cohérent', coherenceOK.valide === true,
  `erreurs: ${JSON.stringify(coherenceOK.erreurs)}`);

// Entrée avant naissance
const coherenceKO1 = validerCoherenceProfil({
  ...dataBase,
  dateEntreeSPP: new Date(1965, 0, 1),
});
test('Entrée SPP antérieure à la naissance → erreur bloquante',
  coherenceKO1.valide === false && 'dateEntreeSPP' in coherenceKO1.erreurs);

// Entrée à 14 ans
const coherenceKO2 = validerCoherenceProfil({
  dateNaissance: new Date(1980, 0, 1),
  dateEntreeSPP: new Date(1993, 0, 1), // 13 ans
  indiceBrut: 500,
});
test('Entrée SPP < 16 ans → erreur bloquante',
  coherenceKO2.valide === false && 'dateEntreeSPP' in coherenceKO2.erreurs);

// Entrée à 17 ans → warning non bloquant
const coherenceWarn1 = validerCoherenceProfil({
  dateNaissance: new Date(1980, 0, 1),
  dateEntreeSPP: new Date(1997, 5, 1), // 17 ans
  indiceBrut: 500,
});
test('Entrée SPP à 17 ans → warning non bloquant',
  coherenceWarn1.valide === true && 'dateEntreeSPP' in coherenceWarn1.warnings);

// ============================================================================
// 4. Cross-field — NBI et RAFP
// ============================================================================
section('4. validerCoherenceProfil — NBI & RAFP');

// NBI 30 ans avec ancienneté 10 ans
const coherenceNBI = validerCoherenceProfil({
  dateNaissance: new Date(1985, 0, 1),
  dateEntreeSPP: new Date(2015, 0, 1),
  indiceBrut: 450,
  dureeNBI: 30, // très excessif
});
test('NBI > ancienneté SPP → erreur',
  coherenceNBI.valide === false && 'dureeNBI' in coherenceNBI.erreurs);

// NBI 5 ans avec ancienneté 10 ans → OK
const coherenceNBIok = validerCoherenceProfil({
  dateNaissance: new Date(1985, 0, 1),
  dateEntreeSPP: new Date(2015, 0, 1),
  indiceBrut: 450,
  dureeNBI: 5,
});
test('NBI 5 ans avec ancienneté 10 ans → valide',
  coherenceNBIok.valide === true);

// RAFP années > plafond théorique
const coherenceRAFP = validerCoherenceProfil({
  dateNaissance: new Date(1980, 0, 1),
  dateEntreeSPP: new Date(2010, 0, 1), // RAFP débute donc en 2010
  indiceBrut: 500,
  anneesCotisationRAFP: 50, // impossible
});
test('Années RAFP > plafond → warning',
  coherenceRAFP.valide === true && 'anneesCotisationRAFP' in coherenceRAFP.warnings);

// ============================================================================
// 5. Cross-field — PFR vs TIB
// ============================================================================
section('5. validerCoherenceProfil — PFR vs TIB');

// PFR annuelle très excessive pour l'indice
const coherencePFR = validerCoherenceProfil({
  dateNaissance: new Date(1970, 0, 1),
  dateEntreeSPP: new Date(1995, 0, 1),
  indiceBrut: 500,
  montantPFR: 50000, // TIB ≈ 30000, PFR 50k = 160 % → warning
});
test('PFR > 30 % du TIB → warning',
  coherencePFR.valide === true && 'montantPFR' in coherencePFR.warnings);

// PFR saisi mensuel à tort (~600€)
const coherencePFRmensuel = validerCoherenceProfil({
  dateNaissance: new Date(1970, 0, 1),
  dateEntreeSPP: new Date(1995, 0, 1),
  indiceBrut: 500,
  montantPFR: 600,
});
test('PFR très faible (< 10 % TIB) → warning "saisi en mensuel ?"',
  coherencePFRmensuel.valide === true && 'montantPFR' in coherencePFRmensuel.warnings);

// PFR correcte
const coherencePFRok = validerCoherenceProfil({
  dateNaissance: new Date(1970, 0, 1),
  dateEntreeSPP: new Date(1995, 0, 1),
  indiceBrut: 500,
  montantPFR: 7500, // ~25 % d'un TIB de 29546€
});
test('PFR ≈ 25 % du TIB → aucun warning',
  coherencePFRok.valide === true && !('montantPFR' in coherencePFRok.warnings));

// ============================================================================
// 6. Cross-field — SPV et double statut
// ============================================================================
section('6. validerCoherenceProfil — SPV & double statut');

// 40 ans de SPV à 35 ans → incompatible
const coherenceSPV = validerCoherenceProfil({
  dateNaissance: new Date(1991, 0, 1), // ~35 ans aujourd'hui (2026)
  dateEntreeSPP: new Date(2015, 0, 1),
  indiceBrut: 400,
  anneesSPV: 40,
});
test('Années SPV > (âge - 16) → erreur',
  coherenceSPV.valide === false && 'anneesSPV' in coherenceSPV.erreurs);

// Double statut coché sans années SPV
const coherenceDS = validerCoherenceProfil({
  dateNaissance: new Date(1970, 0, 1),
  dateEntreeSPP: new Date(1995, 0, 1),
  indiceBrut: 500,
  doubleStatut: true,
  anneesSPV: 0,
});
test('Double statut coché sans années SPV → erreur',
  coherenceDS.valide === false && 'anneesSPV' in coherenceDS.erreurs);

// Double statut avec années SPV → OK
const coherenceDSok = validerCoherenceProfil({
  dateNaissance: new Date(1970, 0, 1),
  dateEntreeSPP: new Date(1995, 0, 1),
  indiceBrut: 500,
  doubleStatut: true,
  anneesSPV: 15,
});
test('Double statut + anneesSPV=15 → valide', coherenceDSok.valide === true);

// ============================================================================
// 7. Cross-field — services militaires
// ============================================================================
section('7. validerCoherenceProfil — services militaires');

const coherenceMilKO = validerCoherenceProfil({
  dateNaissance: new Date(1970, 0, 1),
  dateEntreeSPP: new Date(1995, 0, 1),
  indiceBrut: 500,
  servicesMilitaires: 'bspp',
  dureeServicesMilitairesAnnees: 0,
  dureeServicesMilitairesMois: 0,
});
test('Service militaire renseigné sans durée → erreur',
  coherenceMilKO.valide === false && 'dureeServicesMilitairesAnnees' in coherenceMilKO.erreurs);

const coherenceMilMois = validerCoherenceProfil({
  dateNaissance: new Date(1970, 0, 1),
  dateEntreeSPP: new Date(1995, 0, 1),
  indiceBrut: 500,
  servicesMilitaires: 'bmpm',
  dureeServicesMilitairesAnnees: 2,
  dureeServicesMilitairesMois: 15, // devrait être < 12
});
test('Mois ≥ 12 → warning',
  'dureeServicesMilitairesMois' in coherenceMilMois.warnings);

const coherenceMilOK = validerCoherenceProfil({
  dateNaissance: new Date(1970, 0, 1),
  dateEntreeSPP: new Date(1995, 0, 1),
  indiceBrut: 500,
  servicesMilitaires: 'bspp',
  dureeServicesMilitairesAnnees: 3,
  dureeServicesMilitairesMois: 6,
});
test('Services militaires complets → valide', coherenceMilOK.valide === true);

// Service = 'aucun' avec durée > 0 : pas d'erreur (le champ est simplement ignoré)
const coherenceMilAucun = validerCoherenceProfil({
  dateNaissance: new Date(1970, 0, 1),
  dateEntreeSPP: new Date(1995, 0, 1),
  indiceBrut: 500,
  servicesMilitaires: 'aucun',
  dureeServicesMilitairesAnnees: 5,
});
test('servicesMilitaires = "aucun" → pas de contrôle durée',
  coherenceMilAucun.valide === true);

// ============================================================================
// RÉSUMÉ
// ============================================================================
console.log('\n' + '═'.repeat(72));
console.log(`  Tests Tier 2 : ${reussis} réussis · ${echoues} échoués · ${reussis + echoues} total`);
console.log('═'.repeat(72));

if (echoues > 0) {
  console.log('\nÉchecs :');
  echecs.forEach((e) => console.log(`  • ${e.nom}${e.detail ? ` — ${e.detail}` : ''}`));
  process.exit(1);
}
