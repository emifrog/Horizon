/**
 * Paramètres réglementaires du simulateur de retraite SPP
 *
 * Ce fichier centralise toutes les valeurs réglementaires susceptibles d'évoluer.
 * Référence principale : Code des pensions civiles et militaires de retraite
 *
 * @author Xavier (Adjudant SDIS 06)
 * @version 2026
 */

// =============================================================================
// MÉTADONNÉES DE PARAMÉTRAGE
// =============================================================================

/**
 * Date de dernière mise à jour des paramètres réglementaires.
 * Format ISO (YYYY-MM-DD). Mettre à jour lors de chaque révision des valeurs.
 * Utilisé pour afficher un badge de fraîcheur et alerter si > 12 mois.
 */
export const DATE_MAJ_PARAMETRES = '2026-01-25';

// =============================================================================
// ÂGES RÉGLEMENTAIRES - Catégorie active SPP
// Réf: Décret n°2003-1306 du 26 décembre 2003, Art. 24
// =============================================================================

export const AGES = {
  /** Âge d'ouverture des droits pour les SPP (catégorie active) - valeur par défaut */
  OUVERTURE_DROITS: 57,

  /** Âge d'annulation automatique de la décote - valeur par défaut */
  ANNULATION_DECOTE: 62,

  /** Âge limite d'activité (catégorie active) */
  LIMITE_ACTIVITE: 62,

  /** Âge limite pour la catégorie sédentaire (référence) */
  LIMITE_SEDENTAIRE: 67,
};

// =============================================================================
// ÂGES LÉGAUX PROGRESSIFS - Catégorie active (Réforme 2023)
// Réf: Loi n°2023-270 du 14 avril 2023, Décret n°2023-435
// =============================================================================

export const AGE_LEGAL_ACTIF = [
  { debut: null,         fin: '1966-08-31', age: 57, mois: 0 },
  { debut: '1966-09-01', fin: '1966-12-31', age: 57, mois: 3 },
  { debut: '1967-01-01', fin: '1967-12-31', age: 57, mois: 6 },
  { debut: '1968-01-01', fin: '1968-12-31', age: 57, mois: 9 },
  { debut: '1969-01-01', fin: '1969-12-31', age: 58, mois: 0 },
  { debut: '1970-01-01', fin: '1970-12-31', age: 58, mois: 3 },
  { debut: '1971-01-01', fin: '1971-12-31', age: 58, mois: 6 },
  { debut: '1972-01-01', fin: '1972-12-31', age: 58, mois: 9 },
  { debut: '1973-01-01', fin: null,         age: 59, mois: 0 },
];

// =============================================================================
// ÂGES LÉGAUX PROGRESSIFS - Catégorie sédentaire (pour surcote)
// Réf: Loi n°2023-270 du 14 avril 2023
// =============================================================================

export const AGE_LEGAL_SEDENTAIRE = [
  { debut: null,         fin: '1961-08-31', age: 62, mois: 0 },
  { debut: '1961-09-01', fin: '1961-12-31', age: 62, mois: 3 },
  { debut: '1962-01-01', fin: '1962-12-31', age: 62, mois: 6 },
  { debut: '1963-01-01', fin: '1963-12-31', age: 62, mois: 9 },
  { debut: '1964-01-01', fin: '1964-12-31', age: 63, mois: 0 },
  { debut: '1965-01-01', fin: '1965-12-31', age: 63, mois: 3 },
  { debut: '1966-01-01', fin: '1966-12-31', age: 63, mois: 6 },
  { debut: '1967-01-01', fin: '1967-12-31', age: 63, mois: 9 },
  { debut: '1968-01-01', fin: null,         age: 64, mois: 0 },
];

// =============================================================================
// DURÉES D'ASSURANCE REQUISES PAR GÉNÉRATION
// Réf: Code des pensions, Art. L14 - Réforme 2023
// =============================================================================

export const DUREE_ASSURANCE_PAR_GENERATION = {
  1960: 167,  // 41 ans et 3 trimestres
  1961: 168,  // 42 ans
  1962: 169,  // 42 ans et 1 trimestre
  1963: 170,  // 42 ans et 2 trimestres
  1964: 171,  // 42 ans et 3 trimestres
  1965: 172,  // 43 ans
  1966: 172,
  1967: 172,
  1968: 172,
  1969: 172,
  1970: 172,
  1971: 172,
  1972: 172,
  1973: 172,
  // Générations suivantes : 172 trimestres (43 ans)
};

/** Durée d'assurance par défaut pour les générations >= 1965 */
export const DUREE_ASSURANCE_DEFAUT = 172;

// =============================================================================
// BASCULE LFSS 2026 — barèmes bornés par DATE DE NAISSANCE, régime avant/après.
// S'applique aux pensions prenant effet à compter du 01/09/2026 (comme la SPV 2026-18).
// Tables : âge légal + durée requise, catégories ACTIVE et SÉDENTAIRE (surcote), avec
// bornes infra-annuelles (ex. 01/09/1966, 01/04/1970). `fin` inclusive.
// Source : cnracl.retraites.fr « Âge légal » (MAJ 09/03/2026) et « Durée d'assurance »
//          (MAJ 16/02/2026) — DATE_VERIFICATION: 2026-07-09
// =============================================================================
export const DATE_SUSPENSION_REFORME = '2026-09-01';
// Alias conservé (compat) :
export const DATE_SUSPENSION_LFSS = DATE_SUSPENSION_REFORME;

/** Parsing local (évite le décalage UTC de new Date('YYYY-MM-DD')). */
const D = (s) => new Date(s + 'T00:00:00');

export const BAREMES = {
  actif: {
    age: [
      // fin (incl.)   avant [a,m]   après [a,m]
      ['1966-08-31', [57, 0], [57, 0]],
      ['1966-12-31', [57, 3], [57, 3]],
      ['1967-12-31', [57, 6], [57, 6]],
      ['1968-12-31', [57, 9], [57, 9]],
      ['1969-12-31', [58, 0], [57, 9]],
      ['1970-03-31', [58, 3], [57, 9]],
      ['1970-12-31', [58, 3], [58, 0]],
      ['1971-12-31', [58, 6], [58, 3]],
      ['1972-12-31', [58, 9], [58, 6]],
      ['1973-12-31', [59, 0], [58, 9]],
      [null,         [59, 0], [59, 0]],
    ],
    duree: [
      // Antérieurs au 01/01/1966 : ancienne réglementation (cf. getDureeAssuranceRequise).
      ['1966-08-31', 168, 168],
      ['1966-12-31', 169, 169],
      ['1967-12-31', 169, 169],
      ['1968-12-31', 170, 170],
      ['1969-12-31', 171, 170],
      ['1970-03-31', 172, 170],
      ['1970-12-31', 172, 171],
      [null,         172, 172],
    ],
  },
  sedentaire: {
    age: [
      ['1961-08-31', [62, 0], [62, 0]],
      ['1961-12-31', [62, 3], [62, 3]],
      ['1962-12-31', [62, 6], [62, 6]],
      ['1963-12-31', [62, 9], [62, 9]],
      ['1964-12-31', [63, 0], [62, 9]],
      ['1965-03-31', [63, 3], [62, 9]],
      ['1965-12-31', [63, 3], [63, 0]],
      ['1966-12-31', [63, 6], [63, 3]],
      ['1967-12-31', [63, 9], [63, 6]],
      ['1968-12-31', [64, 0], [63, 9]],
      [null,         [64, 0], [64, 0]],
    ],
    duree: [
      ['1961-08-31', 168, 168],
      ['1961-12-31', 169, 169],
      ['1962-12-31', 169, 169],
      ['1963-12-31', 170, 170],
      ['1964-12-31', 171, 170],
      ['1965-03-31', 172, 170],
      ['1965-12-31', 172, 171],
      [null,         172, 172],
    ],
  },
};

/** Âge d'annulation de la décote — 62 ans fixe pour un départ catégorie active. */
export const AGE_ANNULATION_DECOTE_ACTIF = { ans: 62, mois: 0 };

/** true si la pension prend effet sous le régime suspendu (≥ 01/09/2026). */
export function regimeSuspendu(dateEffetPension) {
  if (!dateEffetPension) return false;
  return new Date(dateEffetPension) >= D(DATE_SUSPENSION_REFORME);
}

/** Résout la ligne de barème applicable à une date de naissance (`fin` inclusive). */
function resoudreBareme(bareme, dateNaissance) {
  const dn = new Date(dateNaissance);
  return bareme.find(([fin]) => fin === null || dn <= D(fin));
}

// =============================================================================
// CONDITIONS DE SERVICES - Catégorie active
// Réf: Décret n°2003-1306, Art. 25
// =============================================================================

export const SERVICES = {
  /** Durée minimale de services actifs pour bénéficier de l'âge anticipé (17 ans) */
  DUREE_MIN_SERVICES_ACTIFS: 68,  // 17 ans = 68 trimestres

  /** Durée minimale pour le droit à pension (2 ans) */
  DUREE_MIN_PENSION: 8,  // 2 ans = 8 trimestres
};

// =============================================================================
// TAUX DE LIQUIDATION
// Réf: Code des pensions, Art. L13 et L14
// =============================================================================

export const TAUX = {
  /** Taux de liquidation maximum */
  PLEIN: 75,

  /** Taux de décote par trimestre manquant */
  DECOTE_PAR_TRIMESTRE: 1.25,

  /** Nombre maximum de trimestres de décote */
  DECOTE_MAX_TRIMESTRES: 20,

  /** Taux de surcote par trimestre supplémentaire */
  SURCOTE_PAR_TRIMESTRE: 1.25,

  /** Taux minimum garanti (après décote maximale) */
  MINIMUM_GARANTI: 50,  // 75% - (20 × 1.25%) = 50%
};

// =============================================================================
// VALEUR DU POINT D'INDICE
// Réf: Décret portant relèvement du minimum de traitement dans la FP
// La valeur du point d'indice est de 4.92278€/mois (janvier 2026)
// soit 59.07336€/an (4.92278 × 12)
// =============================================================================

export const POINT_INDICE = {
  /** Valeur mensuelle brute du point d'indice (janvier 2026) */
  VALEUR_MENSUELLE: 4.92278,

  /** Valeur annuelle brute du point d'indice */
  get VALEUR_ANNUELLE() {
    return this.VALEUR_MENSUELLE * 12;
  },
};

// =============================================================================
// MAJORATION SPV (Sapeur-Pompier Volontaire)
// Réf: Décret n°2026-18 du 20 janvier 2026
// Note: Seuils conformes au décret - 10 ans, 20 ans, 25 ans
// Les seuils intermédiaires (15 ans, 30 ans) sont des projections
// =============================================================================

export const MAJORATION_SPV = {
  /** Seuils d'années SPV et trimestres de majoration correspondants */
  SEUILS: [
    { annees: 10, trimestres: 1 },  // Décret 2026-18 : ≥10 ans = +1 trimestre
    { annees: 20, trimestres: 2 },  // Décret 2026-18 : ≥20 ans = +2 trimestres
    { annees: 25, trimestres: 3 },  // Décret 2026-18 : ≥25 ans = +3 trimestres
  ],
};

// =============================================================================
// BONIFICATIONS
// Réf: Code des pensions, Art. L12
// =============================================================================

export const BONIFICATIONS = {
  /** Bonification pour enfants nés avant 2004 (trimestres par enfant) */
  ENFANT_AVANT_2004: 4,

  /** Bonification du cinquième pour services actifs (1 an pour 5 ans) */
  CINQUIEME_ACTIF: {
    enabled: true,
    ratio: 1 / 5,  // 1 trimestre pour 5 trimestres de services actifs
    /** Plafond maximum de la bonification (5 ans = 20 trimestres) */
    plafond: 20,
    /** Durée minimale de services effectifs pour bénéficier de la bonification (27 ans) */
    dureeMinServicesEffectifs: 108,  // 27 ans = 108 trimestres
    /** Durée minimale en qualité SPP pour bénéficier de la bonification (17 ans) */
    dureeMinSPP: 68,  // 17 ans = 68 trimestres
  },
};

// =============================================================================
// DÉCRET 2026-18 - MAJORATION SPV
// Réf: Décret n°2026-18 du 20 janvier 2026
// =============================================================================

export const DECRET_2026_18 = {
  /** Date d'effet du décret (pensions prenant effet à partir de cette date) */
  DATE_EFFET: '2026-07-01',

  /** Barème des trimestres supplémentaires selon années SPV */
  BAREME: {
    10: 1,  // 10 ans SPV = +1 trimestre
    20: 2,  // 20 ans SPV = +2 trimestres
    25: 3,  // 25 ans SPV = +3 trimestres
  },
};

// =============================================================================
// PFR - PRIME DE FEU ET RAFP
// Réf: Décret n°98-442 relatif à la prime de feu
// Réf: Décret n°2004-569 relatif au RAFP
// =============================================================================

export const PFR = {
  /** Taux de cotisation RAFP (agent et employeur, chacun 5%) */
  TAUX_COTISATION_RAFP: 5,

  /** Plafond de l'assiette RAFP (% du traitement indiciaire brut) */
  PLAFOND_ASSIETTE_RAFP: 20,

  /** Valeur d'acquisition du point RAFP 2026 (source: rafp.fr) */
  VALEUR_ACQUISITION_POINT_RAFP: 1.4596,

  /** Valeur de service du point RAFP 2026 (€ par an et par point) */
  VALEUR_SERVICE_POINT_RAFP: 0.05671,

  /** Taux de la prime de feu (% du traitement indiciaire brut) */
  TAUX_PRIME_FEU: 25,

  /** Taux de la prime de feu avant le 26/07/2020 */
  TAUX_PRIME_FEU_ANCIEN: 19,

  /** Date de changement du taux de prime de feu */
  DATE_CHANGEMENT_TAUX_PFR: '2020-07-26',

  /** Année de création du RAFP (pour calcul des années de cotisation) */
  ANNEE_CREATION_RAFP: 2005,

  /** Seuil minimum de points pour rente viagere RAFP */
  SEUIL_RENTE_RAFP: 5125,

  /** Seuil pour capital fractionné RAFP */
  SEUIL_CAPITAL_FRACTIONNE_RAFP: 4900,
};

// =============================================================================
// COEFFICIENTS DE MAJORATION RAFP SELON L'ÂGE
// Réf: Décret n°2004-569 relatif au RAFP / ERAFP.
// Le barème DÉMARRE À 62 ANS (âge légal sédentaire) : il n'existe AUCUN coefficient
// de minoration en dessous. La rente n'est d'ailleurs pas servie avant 62 ans (même
// pour un actif ayant validé sa durée). Valeurs 71-74 non publiées ici (75 → 1,80).
// source: ERAFP — DATE_VERIFICATION: 2026-07-09
// =============================================================================

/** Âge minimal de liquidation de la rente RAFP (âge légal sédentaire). */
export const AGE_MIN_RAFP = 62;

export const COEFFICIENTS_RAFP_AGE = {
  62: 1.00,
  63: 1.04,
  64: 1.08,
  65: 1.12,
  66: 1.17,
  67: 1.22,
  68: 1.28,
  69: 1.33,
  70: 1.40,
  75: 1.80,
};

// Coefficient de conversion en CAPITAL (points < seuil de rente).
// capital = points × valeur de service × coef. majoration × coef. conversion.
// Valeurs 62-64 sourcées ; au-delà, à compléter.
export const COEFFICIENTS_CONVERSION_CAPITAL_RAFP = {
  62: 27.11,
  63: 26.34,
  64: 25.57,
};

// =============================================================================
// NPFR — NOUVELLE PRESTATION DE FIDÉLISATION ET DE RECONNAISSANCE (double statut SPV)
// Réf: Décret n°2017-912 du 9 mai 2017, modifié par le décret n°2022-620 du 22 avril 2022.
// (L'ancien régime PFR — décret 2005-1150 — est CLOS.)
// Due au SPV ayant ≥ 15 ans de service (10 ans si incapacité opérationnelle reconnue),
// versée une fois par an, à partir de 55 ans et après cessation de l'engagement,
// EXONÉRÉE d'impôt sur le revenu et de CSG/CRDS.
// ⚠️ Barème revalorisé chaque année par arrêté conjoint — montants ci-dessous À RE-SOURCER/DATER.
// source: décret 2017-912 / 2022-620 — DATE_VERIFICATION: 2026-07-09
// =============================================================================

export const PFR_SPV = {
  /** Ancienneté minimale pour la prestation standard (NPFR : 15 ans) */
  ANCIENNETE_MIN: 15,

  /** Ancienneté minimale cas incapacité opérationnelle (NPFR : 10 ans) */
  ANCIENNETE_MIN_INCAPACITE: 10,

  /** Âge minimal de versement (55 ans) */
  AGE_MIN: 55,

  /** Prestation exonérée de CSG/CRDS et d'impôt sur le revenu. */
  EXONEREE: true,

  /**
   * Barème annuel brut en euros, par palier d'ancienneté SPV (millésime à re-sourcer).
   */
  BAREME: {
    10: 512,   // seuil incapacité opérationnelle
    15: 512,   // seuil standard
    20: 1025,
    25: 2050,
    30: 2690,
    35: 3075,  // 35 ans et plus
  },
};

/**
 * Retourne le montant annuel NPFR applicable pour une ancienneté donnée.
 * @param {number} anneesSPV - Années de service SPV
 * @returns {number} Montant annuel (0 si < seuil incapacité)
 */
export function getMontantPFRSPV(anneesSPV) {
  if (anneesSPV >= 35) return PFR_SPV.BAREME[35];
  if (anneesSPV >= 30) return PFR_SPV.BAREME[30];
  if (anneesSPV >= 25) return PFR_SPV.BAREME[25];
  if (anneesSPV >= 20) return PFR_SPV.BAREME[20];
  if (anneesSPV >= PFR_SPV.ANCIENNETE_MIN) return PFR_SPV.BAREME[15];
  if (anneesSPV >= PFR_SPV.ANCIENNETE_MIN_INCAPACITE) return PFR_SPV.BAREME[10];
  return 0;
}

// =============================================================================
// NBI - NOUVELLE BONIFICATION INDICIAIRE
// Réf: Décret n°2006-779 du 3 juillet 2006
// =============================================================================

export const NBI = {
  /** Durée minimale de perception pour intégration (en années) */
  DUREE_MIN_PERCEPTION: 1,

  /** Intégration moyenne si perception >= 15 ans des 6 derniers mois */
  DUREE_INTEGRATION_COMPLETE: 15,
};

// =============================================================================
// MINIMUM GARANTI
// Réf: Code des pensions, Art. L17
// =============================================================================

export const MINIMUM_GARANTI = {
  /** Indice majoré de référence (base historique du minimum garanti) */
  INDICE_REFERENCE: 227,

  /** Montant PLEIN du minimum garanti 2026 (atteint à 40 ans de services effectifs). */
  MONTANT_ANNUEL_2026: 16396.20,
  MONTANT_MENSUEL_2026: 1366.35,

  /**
   * Barème par paliers (art. 22-I décret 2003-1306), en % du montant plein, selon les
   * ANNÉES DE SERVICES EFFECTIFS (bonifications exclues) :
   *  - en deçà de 15 ans : 1/15 du montant des 15 ans par année ;
   *  - 57,5 % à 15 ans ; +2,5 pts/an de 15 à 30 ans (→ 95 % à 30 ans) ;
   *  - +0,5 pt/an de 30 à 40 ans (→ 100 % à 40 ans).
   */
  BAREME: {
    ANNEE_PLEINE: 40,
    ANNEE_PIVOT: 15,
    PCT_15ANS: 57.5,
    PCT_30ANS: 95,
    PENTE_15_30: 2.5,
    PENTE_30_40: 0.5,
  },
};

// =============================================================================
// COTISATIONS ET PRÉLÈVEMENTS
// =============================================================================

export const COTISATIONS = {
  /** Taux de retenue pension civile */
  RETENUE_PC: 11.10,

  /** CSG sur pension (taux normal, conservé pour compatibilité) */
  CSG: 8.30,

  /** CRDS sur pension */
  CRDS: 0.50,

  /** CASA (Contribution Additionnelle de Solidarité pour l'Autonomie) */
  CASA: 0.30,
};

/**
 * Régimes de prélèvements sociaux sur pension, selon le revenu fiscal de référence (RFR).
 * La CASA (0,3 %) n'est due qu'aux taux médian et normal. La CRDS (0,5 %) ne s'applique
 * pas en cas d'exonération.
 */
export const REGIMES_CSG = {
  exonere: { label: 'Exonération (RFR faible)', csg: 0, crds: 0, casa: 0 },
  reduit:  { label: 'Taux réduit (CSG 3,8 %)', csg: 3.8, crds: 0.5, casa: 0 },
  median:  { label: 'Taux médian (CSG 6,6 %)', csg: 6.6, crds: 0.5, casa: 0.3 },
  normal:  { label: 'Taux normal (CSG 8,3 %)', csg: 8.3, crds: 0.5, casa: 0.3 },
};

// =============================================================================
// ÉCHELLE INDICIAIRE SPP
// Réf: Grilles indiciaires de la FPT
// =============================================================================

// Bornes exprimées en INDICE MAJORÉ (IM) : c'est l'indice qui, multiplié par la
// valeur du point, donne le traitement. À ne pas confondre avec l'indice brut (IB).
export const ECHELLE_INDICIAIRE = {
  /** Indice majoré minimum (bas de grille SPP) */
  MIN: 340,

  /** Indice majoré maximum (haut de grille officier supérieur) */
  MAX: 830,

  /** Quelques repères indicatifs, exprimés en indice BRUT (informatif seulement) */
  REPERES_INDICE_BRUT: {
    SAPEUR_1C_1: 367,
    CAPORAL_1: 368,
    SERGENT_1: 376,
    ADJUDANT_1: 397,
    LIEUTENANT_1: 416,
    CAPITAINE_1: 468,
    COMMANDANT_1: 562,
    COLONEL_1: 747,
  },
};

// =============================================================================
// FONCTION UTILITAIRE : Récupérer la durée d'assurance requise
// =============================================================================

/**
 * Retourne la durée d'assurance requise pour le taux plein (en trimestres), selon la
 * date de naissance, la date d'effet de la pension (bascule LFSS) et la catégorie.
 *
 * ⚠️ Passer une Date de naissance (et non une année) pour les bornes infra-annuelles
 * (ex. 01/09/1966, 01/04/1970). Une année seule est acceptée (compat) mais perd cette
 * précision (résolue au 30 juin).
 *
 * @param {number|Date} dateNaissanceOuAnnee - Date (préférée) ou année de naissance.
 * @param {Date|string} [dateEffet] - Date d'effet de la pension (bascule au 01/09/2026).
 * @param {'actif'|'sedentaire'} [categorie='actif'] - 'actif' si 17 ans de services actifs.
 * @returns {number} Nombre de trimestres requis
 */
export function getDureeAssuranceRequise(dateNaissanceOuAnnee, dateEffet, categorie = 'actif') {
  const dn = dateNaissanceOuAnnee instanceof Date
    ? dateNaissanceOuAnnee
    : new Date(dateNaissanceOuAnnee, 5, 30); // année seule → 30 juin

  // Catégorie ACTIVE, générations antérieures au 01/01/1966 : ancienne réglementation
  // (durée de l'année d'ouverture du droit) — table historique par génération.
  // (La table SÉDENTAIRE couvre, elle, les générations 1961-1965 avec leurs deltas.)
  if (categorie === 'actif' && dn < D('1966-01-01')) {
    const annee = dn.getFullYear();
    if (annee in DUREE_ASSURANCE_PAR_GENERATION) return DUREE_ASSURANCE_PAR_GENERATION[annee];
    const anneesConnues = Object.keys(DUREE_ASSURANCE_PAR_GENERATION).map(Number);
    const anneeMin = Math.min(...anneesConnues);
    if (annee < anneeMin) return DUREE_ASSURANCE_PAR_GENERATION[anneeMin];
    return DUREE_ASSURANCE_DEFAUT;
  }

  const bareme = (BAREMES[categorie] || BAREMES.actif).duree;
  const ligne = resoudreBareme(bareme, dn);
  return ligne[regimeSuspendu(dateEffet) ? 2 : 1];
}

/**
 * Retourne les trimestres de majoration SPV selon les années d'engagement
 * @param {number} anneesSPV - Nombre d'années d'engagement SPV
 * @returns {number} Nombre de trimestres de majoration
 */
export function getMajorationSPV(anneesSPV) {
  let majoration = 0;
  for (const seuil of MAJORATION_SPV.SEUILS) {
    if (anneesSPV >= seuil.annees) {
      majoration = seuil.trimestres;
    }
  }
  return majoration;
}

/**
 * Retourne l'âge légal selon la catégorie, la date de naissance et la date d'effet
 * de la pension (bascule LFSS au 01/09/2026).
 * @param {Date|string} dateNaissance - Date de naissance (bornes infra-annuelles)
 * @param {Date|string} [dateEffet] - Date d'effet du scénario (régime avant/après)
 * @param {'actif'|'sedentaire'} [categorie='actif']
 * @returns {{ans: number, mois: number, totalMois: number}}
 */
export function getAgeLegal(dateNaissance, dateEffet, categorie = 'actif') {
  const bareme = (BAREMES[categorie] || BAREMES.actif).age;
  const ligne = resoudreBareme(bareme, dateNaissance);
  const [ans, mois] = ligne[regimeSuspendu(dateEffet) ? 2 : 1];
  return { ans, mois, totalMois: ans * 12 + mois };
}

/**
 * Âge légal d'ouverture des droits — catégorie ACTIVE.
 * @param {Date|string} dateNaissance
 * @param {Date|string} [dateEffet] - date d'effet (défaut : régime « avant »)
 * @returns {{ans: number, mois: number, totalMois: number}}
 */
export function getAgeLegalActif(dateNaissance, dateEffet) {
  return getAgeLegal(dateNaissance, dateEffet, 'actif');
}

/**
 * Âge légal — catégorie SÉDENTAIRE (utilisé pour la surcote).
 * @param {Date|string} dateNaissance
 * @param {Date|string} [dateEffet]
 * @returns {{ans: number, mois: number, totalMois: number}}
 */
export function getAgeLegalSedentaire(dateNaissance, dateEffet) {
  return getAgeLegal(dateNaissance, dateEffet, 'sedentaire');
}

/**
 * Retourne le coefficient de majoration RAFP selon l'âge de départ.
 * Le barème démarre à 62 ans (coef 1,00) ; en dessous, la rente n'est pas servie
 * (voir AGE_MIN_RAFP) — on renvoie 1,00 par défaut. Entre deux paliers, on retient
 * le palier inférieur.
 * @param {number} ageDepart - Âge de départ en années
 * @returns {number} Coefficient de majoration (≥ 1)
 */
export function getCoefficientRAFPAge(ageDepart) {
  const age = Math.floor(ageDepart);
  if (age in COEFFICIENTS_RAFP_AGE) {
    return COEFFICIENTS_RAFP_AGE[age];
  }
  const ages = Object.keys(COEFFICIENTS_RAFP_AGE).map(Number).sort((a, b) => a - b);
  if (age <= ages[0]) return COEFFICIENTS_RAFP_AGE[ages[0]];             // < 62 → 1,00
  if (age >= ages[ages.length - 1]) return COEFFICIENTS_RAFP_AGE[ages[ages.length - 1]];
  // Entre deux paliers connus : retenir le palier inférieur.
  let coeff = COEFFICIENTS_RAFP_AGE[ages[0]];
  for (const a of ages) {
    if (a <= age) coeff = COEFFICIENTS_RAFP_AGE[a];
  }
  return coeff;
}

/**
 * Retourne le coefficient de conversion en capital RAFP selon l'âge (62-64 sourcés).
 * @param {number} ageDepart - Âge de départ
 * @returns {number|null} Coefficient de conversion, ou null si non disponible pour cet âge
 */
export function getCoefficientConversionCapitalRAFP(ageDepart) {
  const age = Math.floor(ageDepart);
  if (age in COEFFICIENTS_CONVERSION_CAPITAL_RAFP) {
    return COEFFICIENTS_CONVERSION_CAPITAL_RAFP[age];
  }
  // Âge < 62 : capital non liquidable ; > 64 : coefficient non sourcé.
  if (age < AGE_MIN_RAFP) return null;
  return null;
}

/**
 * Retourne les trimestres de majoration SPV selon le décret 2026-18
 * @param {number} anneesSPV - Nombre d'années d'engagement SPV
 * @param {Date|string} dateEffetPension - Date d'effet de la pension
 * @returns {number} Nombre de trimestres de majoration (0, 1, 2 ou 3)
 */
export function getMajorationSPVDecret2026(anneesSPV, dateEffetPension) {
  const dateEffet = new Date(dateEffetPension);
  const dateDecret = new Date(DECRET_2026_18.DATE_EFFET);
  
  // Le décret ne s'applique qu'aux pensions prenant effet à partir du 01/07/2026
  if (dateEffet < dateDecret) {
    return 0;
  }
  
  // Barème selon les années SPV
  if (anneesSPV >= 25) return DECRET_2026_18.BAREME[25];
  if (anneesSPV >= 20) return DECRET_2026_18.BAREME[20];
  if (anneesSPV >= 10) return DECRET_2026_18.BAREME[10];
  
  return 0;
}

// =============================================================================
// EXPORT GLOBAL DES PARAMÈTRES
// =============================================================================

export const PARAMS = {
  DATE_MAJ: DATE_MAJ_PARAMETRES,
  AGES,
  AGE_LEGAL_ACTIF,
  AGE_LEGAL_SEDENTAIRE,
  DUREE_ASSURANCE_PAR_GENERATION,
  DUREE_ASSURANCE_DEFAUT,
  SERVICES,
  TAUX,
  POINT_INDICE,
  MAJORATION_SPV,
  BONIFICATIONS,
  DECRET_2026_18,
  PFR,
  PFR_SPV,
  COEFFICIENTS_RAFP_AGE,
  NBI,
  MINIMUM_GARANTI,
  COTISATIONS,
  ECHELLE_INDICIAIRE,
  // Fonctions utilitaires
  getDureeAssuranceRequise,
  getMajorationSPV,
  getMontantPFRSPV,
  getAgeLegalActif,
  getAgeLegalSedentaire,
  getCoefficientRAFPAge,
  getMajorationSPVDecret2026,
};

export default PARAMS;
