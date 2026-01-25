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
// Réf: Décret n°2004-569 relatif au RAFP
// =============================================================================

export const COEFFICIENTS_RAFP_AGE = {
  55: 0.76,
  56: 0.80,
  57: 0.84,
  58: 0.88,
  59: 0.92,
  60: 0.96,
  61: 0.98,
  62: 1.00,
  63: 1.04,
  64: 1.08,
  65: 1.12,
  66: 1.18,
  67: 1.24,
};

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
  /** Valeur annuelle de l'indice majoré 227 (base du minimum garanti) */
  INDICE_REFERENCE: 227,

  /** Montant mensuel brut du minimum garanti 2026 (estimé) */
  MONTANT_MENSUEL_2026: 1367.51,
};

// =============================================================================
// COTISATIONS ET PRÉLÈVEMENTS
// =============================================================================

export const COTISATIONS = {
  /** Taux de retenue pension civile */
  RETENUE_PC: 11.10,

  /** CSG sur pension */
  CSG: 8.30,

  /** CRDS sur pension */
  CRDS: 0.50,

  /** CASA (Contribution Additionnelle de Solidarité pour l'Autonomie) */
  CASA: 0.30,
};

// =============================================================================
// ÉCHELLE INDICIAIRE SPP
// Réf: Grilles indiciaires de la FPT
// =============================================================================

export const ECHELLE_INDICIAIRE = {
  /** Indice brut minimum (sapeur 1er échelon) */
  MIN: 367,

  /** Indice brut maximum (colonel hors classe dernier échelon) */
  MAX: 1027,

  /** Quelques repères indicatifs */
  REPERES: {
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
 * Retourne la durée d'assurance requise pour le taux plein selon l'année de naissance
 * @param {number} anneeNaissance - Année de naissance de l'agent
 * @returns {number} Nombre de trimestres requis
 */
export function getDureeAssuranceRequise(anneeNaissance) {
  if (anneeNaissance in DUREE_ASSURANCE_PAR_GENERATION) {
    return DUREE_ASSURANCE_PAR_GENERATION[anneeNaissance];
  }
  // Pour les générations non listées, appliquer la valeur par défaut
  return DUREE_ASSURANCE_DEFAUT;
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
 * Retourne l'âge légal d'ouverture des droits pour la catégorie active selon la date de naissance
 * @param {Date|string} dateNaissance - Date de naissance de l'agent
 * @returns {{ans: number, mois: number, totalMois: number}} Âge légal en années et mois
 */
export function getAgeLegalActif(dateNaissance) {
  const dn = new Date(dateNaissance);
  for (const tranche of AGE_LEGAL_ACTIF) {
    const debut = tranche.debut ? new Date(tranche.debut) : new Date('1900-01-01');
    const fin = tranche.fin ? new Date(tranche.fin) : new Date('2100-12-31');
    if (dn >= debut && dn <= fin) {
      return { ans: tranche.age, mois: tranche.mois, totalMois: tranche.age * 12 + tranche.mois };
    }
  }
  return { ans: 59, mois: 0, totalMois: 708 }; // Par défaut (génération >= 1973)
}

/**
 * Retourne l'âge légal pour la catégorie sédentaire selon la date de naissance
 * Utilisé pour le calcul de la surcote (qui ne s'applique qu'à partir de cet âge)
 * @param {Date|string} dateNaissance - Date de naissance de l'agent
 * @returns {{ans: number, mois: number, totalMois: number}} Âge légal en années et mois
 */
export function getAgeLegalSedentaire(dateNaissance) {
  const dn = new Date(dateNaissance);
  for (const tranche of AGE_LEGAL_SEDENTAIRE) {
    const debut = tranche.debut ? new Date(tranche.debut) : new Date('1900-01-01');
    const fin = tranche.fin ? new Date(tranche.fin) : new Date('2100-12-31');
    if (dn >= debut && dn <= fin) {
      return { ans: tranche.age, mois: tranche.mois, totalMois: tranche.age * 12 + tranche.mois };
    }
  }
  return { ans: 64, mois: 0, totalMois: 768 }; // Par défaut (génération >= 1968)
}

/**
 * Retourne le coefficient de majoration RAFP selon l'âge de départ
 * @param {number} ageDepart - Âge de départ en années
 * @returns {number} Coefficient de majoration (< 1 si avant 62 ans, > 1 si après)
 */
export function getCoefficientRAFPAge(ageDepart) {
  const age = Math.floor(ageDepart);
  if (age in COEFFICIENTS_RAFP_AGE) {
    return COEFFICIENTS_RAFP_AGE[age];
  }
  // Hors bornes
  if (age < 55) return 0.72;
  if (age > 67) return 1.30;
  return 1.00;
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
  COEFFICIENTS_RAFP_AGE,
  NBI,
  MINIMUM_GARANTI,
  COTISATIONS,
  ECHELLE_INDICIAIRE,
  // Fonctions utilitaires
  getDureeAssuranceRequise,
  getMajorationSPV,
  getAgeLegalActif,
  getAgeLegalSedentaire,
  getCoefficientRAFPAge,
  getMajorationSPVDecret2026,
};

export default PARAMS;
