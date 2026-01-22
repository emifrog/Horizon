/**
 * Module Durée - Calcul de la durée d'assurance et des services
 *
 * Ce module calcule les différentes durées nécessaires au calcul de la pension :
 * - Durée des services effectifs
 * - Bonifications
 * - Durée d'assurance totale tous régimes
 *
 * @module modules/duree
 */

import { SERVICES, BONIFICATIONS, getDureeAssuranceRequise, getMajorationSPV } from '../config/parametres.js';
import { calculerTrimestresEntreDates, calculerAnneesEntreDates } from '../utils/dates.js';

/**
 * Données de durée de services
 * @typedef {Object} DonneesServices
 * @property {Date} dateEntreeSPP - Date d'entrée en qualité de SPP
 * @property {Date} dateDepart - Date de départ envisagée
 * @property {number} quotite - Quotité moyenne de travail
 * @property {number} trimestresAutresRegimes - Trimestres validés hors CNRACL
 * @property {number} anneesSPV - Années d'engagement SPV
 * @property {number} enfantsAvant2004 - Nombre d'enfants nés avant 2004
 * @property {string} servicesMilitaires - Type de service militaire (aucun, bspp, bmpm)
 * @property {number} trimestresServicesMilitaires - Trimestres de services militaires BSPP/BMPM
 */

/**
 * Résultat du calcul de durée
 * @typedef {Object} ResultatDuree
 * @property {number} trimestresServicesEffectifs - Trimestres de services effectifs SPP
 * @property {number} trimestresBonificationCinquieme - Bonification du 1/5e
 * @property {number} trimestresBonificationEnfants - Bonification pour enfants
 * @property {number} trimestresMajorationSPV - Majoration SPV
 * @property {number} trimestresServicesMilitaires - Trimestres services militaires (BSPP/BMPM)
 * @property {number} trimestresBonificationMilitaire - Bonification du 1/5e sur services militaires
 * @property {number} trimestresLiquidables - Total trimestres liquidables CNRACL
 * @property {number} trimestresAutresRegimes - Trimestres autres régimes
 * @property {number} trimestresAssuranceTotale - Durée d'assurance tous régimes
 * @property {number} trimestresRequis - Trimestres requis pour le taux plein
 * @property {number} ecartTauxPlein - Écart avec le taux plein (positif = excédent)
 * @property {boolean} conditionServicesActifs - Condition des 17 ans remplie
 * @property {boolean} conditionDureePension - Condition des 2 ans remplie
 */

/**
 * Calcule les trimestres de services effectifs
 * @param {Date} dateEntree - Date d'entrée
 * @param {Date} dateFin - Date de fin (départ)
 * @param {number} [quotite=1] - Quotité moyenne de travail
 * @returns {number} Nombre de trimestres de services effectifs
 */
export function calculerTrimestresServicesEffectifs(dateEntree, dateFin, quotite = 1) {
  if (!dateEntree || !dateFin || dateFin <= dateEntree) {
    return 0;
  }

  const trimestresBruts = calculerTrimestresEntreDates(dateEntree, dateFin);

  // Application de la quotité pour le temps partiel
  // Réf: Code des pensions, Art. L9 - Les services à temps partiel sont comptés
  // pour leur durée effective (prorata)
  const trimestresEffectifs = Math.floor(trimestresBruts * quotite);

  return trimestresEffectifs;
}

/**
 * Calcule la bonification du cinquième pour services actifs
 * Réf: Code des pensions, Art. L12 b)
 * @param {number} trimestresServicesActifs - Trimestres de services en catégorie active
 * @returns {number} Trimestres de bonification
 */
export function calculerBonificationCinquieme(trimestresServicesActifs) {
  if (!BONIFICATIONS.CINQUIEME_ACTIF.enabled) {
    return 0;
  }

  // 1 trimestre de bonification pour 5 trimestres de services actifs
  // Plafonnée à 5 ans (20 trimestres) de bonification
  const bonification = Math.floor(trimestresServicesActifs * BONIFICATIONS.CINQUIEME_ACTIF.ratio);
  return Math.min(bonification, 20);
}

/**
 * Calcule la bonification pour enfants nés avant 2004
 * Réf: Code des pensions, Art. L12 b)
 * @param {number} nombreEnfants - Nombre d'enfants nés avant le 1er janvier 2004
 * @returns {number} Trimestres de bonification
 */
export function calculerBonificationEnfants(nombreEnfants) {
  if (!nombreEnfants || nombreEnfants <= 0) {
    return 0;
  }

  // 4 trimestres (1 an) par enfant né avant 2004
  return nombreEnfants * BONIFICATIONS.ENFANT_AVANT_2004;
}

/**
 * Vérifie si la condition de durée minimale de services actifs est remplie
 * Réf: Décret n°2003-1306, Art. 25
 * @param {number} trimestresServicesActifs - Trimestres de services en catégorie active
 * @returns {boolean} True si la condition est remplie (17 ans minimum)
 */
export function verifierConditionServicesActifs(trimestresServicesActifs) {
  return trimestresServicesActifs >= SERVICES.DUREE_MIN_SERVICES_ACTIFS;
}

/**
 * Vérifie si la condition de durée minimale pour pension est remplie
 * @param {number} trimestresServices - Trimestres de services
 * @returns {boolean} True si la condition est remplie (2 ans minimum)
 */
export function verifierConditionDureePension(trimestresServices) {
  return trimestresServices >= SERVICES.DUREE_MIN_PENSION;
}

/**
 * Calcule la durée totale liquidable CNRACL
 * @param {Object} params - Paramètres de calcul
 * @param {number} params.trimestresServicesEffectifs - Services effectifs SPP
 * @param {number} params.trimestresBonificationCinquieme - Bonification du 1/5e (SPP)
 * @param {number} params.trimestresBonificationEnfants - Bonification enfants
 * @param {number} params.trimestresMajorationSPV - Majoration SPV
 * @param {number} params.trimestresServicesMilitaires - Services militaires (BSPP/BMPM)
 * @param {number} params.trimestresBonificationMilitaire - Bonification du 1/5e sur services militaires
 * @returns {number} Total trimestres liquidables
 */
export function calculerTrimestresLiquidables({
  trimestresServicesEffectifs,
  trimestresBonificationCinquieme,
  trimestresBonificationEnfants,
  trimestresMajorationSPV,
  trimestresServicesMilitaires = 0,
  trimestresBonificationMilitaire = 0,
}) {
  return (
    trimestresServicesEffectifs +
    trimestresBonificationCinquieme +
    trimestresBonificationEnfants +
    trimestresMajorationSPV +
    trimestresServicesMilitaires +
    trimestresBonificationMilitaire
  );
}

/**
 * Calcule la durée d'assurance totale tous régimes
 * @param {number} trimestresLiquidablesCNRACL - Trimestres CNRACL
 * @param {number} trimestresAutresRegimes - Trimestres autres régimes
 * @returns {number} Durée d'assurance totale
 */
export function calculerDureeAssuranceTotale(trimestresLiquidablesCNRACL, trimestresAutresRegimes) {
  return trimestresLiquidablesCNRACL + (trimestresAutresRegimes || 0);
}

/**
 * Calcule l'écart avec la durée requise pour le taux plein
 * @param {number} trimestresAssurance - Durée d'assurance totale
 * @param {number} trimestresRequis - Durée requise pour le taux plein
 * @returns {number} Écart (positif = excédent, négatif = manquant)
 */
export function calculerEcartTauxPlein(trimestresAssurance, trimestresRequis) {
  return trimestresAssurance - trimestresRequis;
}

/**
 * Calcule l'ensemble des durées de services et d'assurance
 * @param {DonneesServices} donnees - Données de services
 * @param {number} anneeNaissance - Année de naissance pour la durée requise
 * @returns {ResultatDuree} Résultat complet du calcul
 */
export function calculerDurees(donnees, anneeNaissance) {
  const {
    dateEntreeSPP,
    dateDepart,
    quotite = 1,
    trimestresAutresRegimes = 0,
    anneesSPV = 0,
    enfantsAvant2004 = 0,
    servicesMilitaires = 'aucun',
    trimestresServicesMilitaires = 0,
  } = donnees;

  // Calcul des services effectifs SPP
  const trimestresServicesEffectifs = calculerTrimestresServicesEffectifs(
    dateEntreeSPP,
    dateDepart,
    quotite
  );

  // Calcul des bonifications SPP
  const trimestresBonificationCinquieme = calculerBonificationCinquieme(trimestresServicesEffectifs);
  const trimestresBonificationEnfants = calculerBonificationEnfants(enfantsAvant2004);
  const trimestresMajorationSPV = getMajorationSPV(anneesSPV);

  // Services militaires (BSPP/BMPM) - comptent comme services actifs
  // Réf: Code des pensions civiles et militaires de retraite
  // Les services militaires sont repris en catégorie active
  const trimServicesMilitaires = servicesMilitaires !== 'aucun' ? trimestresServicesMilitaires : 0;

  // Bonification du 1/5e sur les services militaires (catégorie active)
  // La bonification s'applique également aux services BSPP/BMPM
  const trimestresBonificationMilitaire = calculerBonificationCinquieme(trimServicesMilitaires);

  // Total des services actifs (SPP + militaires) pour la condition des 17 ans
  const totalServicesActifs = trimestresServicesEffectifs + trimServicesMilitaires;

  // Calcul des totaux
  const trimestresLiquidables = calculerTrimestresLiquidables({
    trimestresServicesEffectifs,
    trimestresBonificationCinquieme,
    trimestresBonificationEnfants,
    trimestresMajorationSPV,
    trimestresServicesMilitaires: trimServicesMilitaires,
    trimestresBonificationMilitaire,
  });

  const trimestresAssuranceTotale = calculerDureeAssuranceTotale(
    trimestresLiquidables,
    trimestresAutresRegimes
  );

  // Durée requise selon la génération
  const trimestresRequis = getDureeAssuranceRequise(anneeNaissance);

  // Écart avec le taux plein
  const ecartTauxPlein = calculerEcartTauxPlein(trimestresAssuranceTotale, trimestresRequis);

  // Vérification des conditions - inclut les services militaires pour la condition des 17 ans
  const conditionServicesActifs = verifierConditionServicesActifs(totalServicesActifs);
  const conditionDureePension = verifierConditionDureePension(totalServicesActifs);

  return {
    trimestresServicesEffectifs,
    trimestresBonificationCinquieme,
    trimestresBonificationEnfants,
    trimestresMajorationSPV,
    trimestresServicesMilitaires: trimServicesMilitaires,
    trimestresBonificationMilitaire,
    totalServicesActifs,
    trimestresLiquidables,
    trimestresAutresRegimes,
    trimestresAssuranceTotale,
    trimestresRequis,
    ecartTauxPlein,
    conditionServicesActifs,
    conditionDureePension,
    // Informations sur le type de service militaire
    servicesMilitaires,
  };
}

/**
 * Calcule le nombre de trimestres manquants pour atteindre le taux plein
 * @param {ResultatDuree} resultatDuree - Résultat du calcul de durée
 * @returns {number} Trimestres manquants (0 si taux plein atteint)
 */
export function calculerTrimestresManquants(resultatDuree) {
  return Math.max(0, -resultatDuree.ecartTauxPlein);
}

/**
 * Calcule le nombre de trimestres supplémentaires au-delà du taux plein
 * @param {ResultatDuree} resultatDuree - Résultat du calcul de durée
 * @returns {number} Trimestres excédentaires (0 si taux plein non atteint)
 */
export function calculerTrimestresExcedentaires(resultatDuree) {
  return Math.max(0, resultatDuree.ecartTauxPlein);
}

/**
 * Projette la durée d'assurance à une date future
 * @param {DonneesServices} donneesActuelles - Données actuelles
 * @param {Date} dateProjection - Date de projection
 * @param {number} anneeNaissance - Année de naissance
 * @returns {ResultatDuree} Résultat projeté
 */
export function projeterDurees(donneesActuelles, dateProjection, anneeNaissance) {
  return calculerDurees(
    {
      ...donneesActuelles,
      dateDepart: dateProjection,
    },
    anneeNaissance
  );
}

/**
 * Calcule la date à laquelle le taux plein sera atteint
 * @param {DonneesServices} donnees - Données de services
 * @param {number} anneeNaissance - Année de naissance
 * @returns {Date|null} Date du taux plein ou null si déjà atteint/impossible
 */
export function calculerDateTauxPlein(donnees, anneeNaissance) {
  const aujourdhui = new Date();
  const resultatActuel = calculerDurees({ ...donnees, dateDepart: aujourdhui }, anneeNaissance);

  if (resultatActuel.ecartTauxPlein >= 0) {
    // Taux plein déjà atteint
    return aujourdhui;
  }

  const trimestresManquants = -resultatActuel.ecartTauxPlein;

  // Estimation : 1 trimestre = 3 mois de travail à temps plein
  const moisNecessaires = Math.ceil(trimestresManquants / donnees.quotite) * 3;

  const dateTauxPlein = new Date(aujourdhui);
  dateTauxPlein.setMonth(dateTauxPlein.getMonth() + moisNecessaires);

  return dateTauxPlein;
}

/**
 * Génère un résumé textuel de la durée d'assurance
 * @param {ResultatDuree} resultat - Résultat du calcul
 * @returns {Object} Résumé formaté
 */
export function genererResumeDuree(resultat) {
  const anneesServices = Math.floor(resultat.trimestresServicesEffectifs / 4);
  const trimRestants = resultat.trimestresServicesEffectifs % 4;

  return {
    servicesEffectifs: `${anneesServices} ans${trimRestants > 0 ? ` et ${trimRestants} trimestres` : ''}`,
    bonifications: resultat.trimestresBonificationCinquieme + resultat.trimestresBonificationEnfants + resultat.trimestresMajorationSPV,
    totalLiquidable: resultat.trimestresLiquidables,
    totalAssurance: resultat.trimestresAssuranceTotale,
    requis: resultat.trimestresRequis,
    ecart: resultat.ecartTauxPlein,
    tauxPleinAtteint: resultat.ecartTauxPlein >= 0,
    conditionAge: resultat.conditionServicesActifs,
  };
}
