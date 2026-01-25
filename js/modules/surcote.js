/**
 * Module Surcote - Calcul de la surcote
 *
 * La surcote est une majoration de la pension accordée aux agents
 * qui continuent à travailler après avoir atteint à la fois :
 * - L'âge légal d'ouverture des droits
 * - La durée d'assurance requise pour le taux plein
 *
 * @module modules/surcote
 */

import { TAUX, AGES, getDureeAssuranceRequise, getAgeLegalSedentaire } from '../config/parametres.js';
import { calculerAge, calculerTrimestresEntreDates } from '../utils/dates.js';

/**
 * Données pour le calcul de la surcote
 * @typedef {Object} DonneesSurcote
 * @property {Date} dateNaissance - Date de naissance
 * @property {Date} dateDepart - Date de départ effective
 * @property {number} trimestresAssurance - Durée d'assurance totale au départ
 * @property {number} trimestresRequis - Durée requise pour le taux plein
 * @property {Date} dateTauxPlein - Date à laquelle le taux plein a été atteint
 */

/**
 * Résultat du calcul de surcote
 * @typedef {Object} ResultatSurcote
 * @property {boolean} eligible - Éligibilité à la surcote
 * @property {number} trimestresSurcote - Nombre de trimestres de surcote
 * @property {number} tauxSurcote - Taux de surcote (en %)
 * @property {number} coefficientMajoration - Coefficient multiplicateur
 * @property {string} motifIneligibilite - Motif si non éligible
 */

/**
 * Vérifie l'éligibilité à la surcote
 * Réf: Code des pensions, Art. L14
 * @param {Date} dateNaissance - Date de naissance
 * @param {Date} dateDepart - Date de départ
 * @param {number} trimestresAssurance - Durée d'assurance au moment du départ
 * @param {number} trimestresRequis - Durée requise pour le taux plein
 * @returns {{eligible: boolean, motif: string}}
 */
export function verifierEligibiliteSurcote(dateNaissance, dateDepart, trimestresAssurance, trimestresRequis) {
  const ageDepart = calculerAge(dateNaissance, dateDepart);
  
  // La surcote s'applique à partir de l'âge légal SÉDENTAIRE (62-64 ans selon génération)
  // et non l'âge d'ouverture des droits actif (57-59 ans)
  const ageSedentaire = getAgeLegalSedentaire(dateNaissance);

  // Condition 1 : Avoir atteint l'âge légal sédentaire
  if (ageDepart < ageSedentaire.ans) {
    return {
      eligible: false,
      motif: `Âge insuffisant pour la surcote (${ageDepart} ans, minimum requis : ${ageSedentaire.ans} ans - âge légal sédentaire)`,
    };
  }

  // Condition 2 : Avoir la durée d'assurance requise pour le taux plein
  if (trimestresAssurance < trimestresRequis) {
    return {
      eligible: false,
      motif: `Durée d'assurance insuffisante (${trimestresAssurance} trimestres, requis : ${trimestresRequis} trimestres)`,
    };
  }

  return {
    eligible: true,
    motif: '',
  };
}

/**
 * Calcule la date à partir de laquelle la surcote commence
 * C'est la date la plus tardive entre :
 * - La date d'atteinte de l'âge légal SÉDENTAIRE (62-64 ans selon génération)
 * - La date d'atteinte de la durée d'assurance requise
 * @param {Date} dateNaissance - Date de naissance
 * @param {Date} dateTauxPlein - Date d'atteinte du taux plein
 * @returns {Date} Date de début de la surcote
 */
export function calculerDateDebutSurcote(dateNaissance, dateTauxPlein) {
  // Date de l'âge légal sédentaire (62-64 ans selon génération)
  const ageSedentaire = getAgeLegalSedentaire(dateNaissance);
  const dateAgeSedentaire = new Date(dateNaissance);
  dateAgeSedentaire.setFullYear(dateAgeSedentaire.getFullYear() + ageSedentaire.ans);
  if (ageSedentaire.mois) {
    dateAgeSedentaire.setMonth(dateAgeSedentaire.getMonth() + ageSedentaire.mois);
  }

  // La surcote commence à la date la plus tardive
  return dateTauxPlein > dateAgeSedentaire ? dateTauxPlein : dateAgeSedentaire;
}

/**
 * Calcule le nombre de trimestres de surcote
 * @param {Date} dateDebutSurcote - Date de début de la période de surcote
 * @param {Date} dateDepart - Date de départ effective
 * @returns {number} Nombre de trimestres de surcote
 */
export function calculerTrimestresSurcote(dateDebutSurcote, dateDepart) {
  if (dateDepart <= dateDebutSurcote) {
    return 0;
  }

  return calculerTrimestresEntreDates(dateDebutSurcote, dateDepart);
}

/**
 * Calcule le taux de surcote
 * Réf: Code des pensions, Art. L14 - 1.25% par trimestre supplémentaire
 * @param {number} trimestresSurcote - Nombre de trimestres de surcote
 * @returns {number} Taux de surcote en pourcentage
 */
export function calculerTauxSurcote(trimestresSurcote) {
  if (trimestresSurcote <= 0) {
    return 0;
  }

  // Pas de plafond pour la surcote (contrairement à la décote)
  return trimestresSurcote * TAUX.SURCOTE_PAR_TRIMESTRE;
}

/**
 * Calcule le coefficient de majoration lié à la surcote
 * @param {number} tauxSurcote - Taux de surcote en %
 * @returns {number} Coefficient multiplicateur (ex: 1.05 pour +5%)
 */
export function calculerCoefficientSurcote(tauxSurcote) {
  return 1 + (tauxSurcote / 100);
}

/**
 * Effectue le calcul complet de la surcote
 * @param {DonneesSurcote} donnees - Données pour le calcul
 * @returns {ResultatSurcote} Résultat complet
 */
export function calculerSurcote(donnees) {
  const {
    dateNaissance,
    dateDepart,
    trimestresAssurance,
    trimestresRequis,
    dateTauxPlein,
  } = donnees;

  // Vérification de l'éligibilité
  const { eligible, motif } = verifierEligibiliteSurcote(
    dateNaissance,
    dateDepart,
    trimestresAssurance,
    trimestresRequis
  );

  if (!eligible) {
    return {
      eligible: false,
      trimestresSurcote: 0,
      tauxSurcote: 0,
      coefficientMajoration: 1,
      motifIneligibilite: motif,
    };
  }

  // Calcul de la date de début de surcote
  const dateDebutSurcote = calculerDateDebutSurcote(dateNaissance, dateTauxPlein);

  // Calcul des trimestres de surcote
  const trimestresSurcote = calculerTrimestresSurcote(dateDebutSurcote, dateDepart);

  // Calcul du taux et du coefficient
  const tauxSurcote = calculerTauxSurcote(trimestresSurcote);
  const coefficientMajoration = calculerCoefficientSurcote(tauxSurcote);

  return {
    eligible: true,
    trimestresSurcote,
    tauxSurcote: Math.round(tauxSurcote * 100) / 100,
    coefficientMajoration: Math.round(coefficientMajoration * 10000) / 10000,
    motifIneligibilite: '',
  };
}

/**
 * Applique la surcote à une pension
 * @param {number} pensionBrute - Pension brute avant surcote
 * @param {number} coefficientSurcote - Coefficient de surcote
 * @returns {number} Pension après surcote
 */
export function appliquerSurcote(pensionBrute, coefficientSurcote) {
  return Math.round(pensionBrute * coefficientSurcote * 100) / 100;
}

/**
 * Calcule le gain mensuel lié à la surcote
 * @param {number} pensionSansSurcote - Pension mensuelle sans surcote
 * @param {number} pensionAvecSurcote - Pension mensuelle avec surcote
 * @returns {number} Gain mensuel
 */
export function calculerGainSurcote(pensionSansSurcote, pensionAvecSurcote) {
  return Math.round((pensionAvecSurcote - pensionSansSurcote) * 100) / 100;
}

/**
 * Simule plusieurs scénarios de surcote
 * @param {Object} donneesBase - Données de base
 * @param {Date} dateTauxPlein - Date du taux plein
 * @param {number} pensionTauxPlein - Pension au taux plein
 * @returns {Array} Liste des scénarios avec pension estimée
 */
export function simulerScenariosSurcote(donneesBase, dateTauxPlein, pensionTauxPlein) {
  const scenarios = [];
  const { dateNaissance, trimestresRequis } = donneesBase;

  // Scénarios : +1 an, +2 ans, +3 ans, +4 ans, +5 ans après le taux plein
  for (let annees = 1; annees <= 5; annees++) {
    const dateScenario = new Date(dateTauxPlein);
    dateScenario.setFullYear(dateScenario.getFullYear() + annees);

    // Ne pas dépasser la limite d'âge
    const ageScenario = calculerAge(dateNaissance, dateScenario);
    if (ageScenario > AGES.LIMITE_ACTIVITE) {
      break;
    }

    const trimestresSupp = annees * 4;
    const resultatSurcote = calculerSurcote({
      dateNaissance,
      dateDepart: dateScenario,
      trimestresAssurance: trimestresRequis + trimestresSupp,
      trimestresRequis,
      dateTauxPlein,
    });

    const pensionAvecSurcote = appliquerSurcote(pensionTauxPlein, resultatSurcote.coefficientMajoration);
    const gainMensuel = calculerGainSurcote(pensionTauxPlein, pensionAvecSurcote);

    scenarios.push({
      anneesSupplémentaires: annees,
      dateDepart: dateScenario,
      ageDepart: ageScenario,
      trimestresSurcote: resultatSurcote.trimestresSurcote,
      tauxSurcote: resultatSurcote.tauxSurcote,
      pensionMensuelle: pensionAvecSurcote,
      gainMensuel,
      gainAnnuel: gainMensuel * 12,
    });
  }

  return scenarios;
}

/**
 * Calcule le "point mort" de la surcote
 * (Nombre d'années de retraite nécessaires pour récupérer les salaires non perçus)
 * @param {number} salaireMensuelNet - Salaire mensuel net en activité
 * @param {number} pensionSansSurcote - Pension sans surcote
 * @param {number} pensionAvecSurcote - Pension avec surcote
 * @param {number} anneesTravailSupp - Années de travail supplémentaires
 * @returns {Object} Analyse du point mort
 */
export function calculerPointMortSurcote(salaireMensuelNet, pensionSansSurcote, pensionAvecSurcote, anneesTravailSupp) {
  // Coût : pensions non perçues pendant les années de travail supplémentaires
  const coutPensionsNonPercues = pensionSansSurcote * 12 * anneesTravailSupp;

  // Gain annuel lié à la surcote
  const gainAnnuelSurcote = (pensionAvecSurcote - pensionSansSurcote) * 12;

  // Point mort en années
  const pointMortAnnees = gainAnnuelSurcote > 0
    ? Math.ceil(coutPensionsNonPercues / gainAnnuelSurcote)
    : Infinity;

  return {
    anneesTravailSupp,
    coutPensionsNonPercues: Math.round(coutPensionsNonPercues * 100) / 100,
    gainAnnuelSurcote: Math.round(gainAnnuelSurcote * 100) / 100,
    pointMortAnnees,
    rentable: pointMortAnnees < 20, // Considéré rentable si récupéré en moins de 20 ans
  };
}

/**
 * Génère un résumé du calcul de surcote
 * @param {ResultatSurcote} resultat - Résultat du calcul
 * @returns {Object} Résumé formaté
 */
export function genererResumeSurcote(resultat) {
  if (!resultat.eligible) {
    return {
      statut: 'Non éligible',
      motif: resultat.motifIneligibilite,
      majoration: '0 %',
    };
  }

  return {
    statut: 'Éligible',
    trimestres: `${resultat.trimestresSurcote} trimestre(s)`,
    taux: `+${resultat.tauxSurcote.toFixed(2)} %`,
    coefficient: `×${resultat.coefficientMajoration.toFixed(4)}`,
    explication: `${resultat.trimestresSurcote} × ${TAUX.SURCOTE_PAR_TRIMESTRE}% = +${resultat.tauxSurcote.toFixed(2)}%`,
  };
}
