/**
 * Module Âges - Calcul des âges et dates de départ
 *
 * Ce module calcule les différentes dates de départ possibles :
 * - Date d'ouverture des droits
 * - Date du taux plein
 * - Date limite d'activité
 *
 * @module modules/ages
 */

import { 
  AGES, 
  SERVICES, 
  getDureeAssuranceRequise,
  getAgeLegalActif,
  getAgeLegalSedentaire,
} from '../config/parametres.js';
import { dateAtteindreAge, calculerAge, calculerTrimestresEntreDates, formaterDateLongueFR } from '../utils/dates.js';
import { calculerDurees, verifierConditionServicesActifs } from './duree.js';

/**
 * Données pour le calcul des dates de départ
 * @typedef {Object} DonneesDepart
 * @property {Date} dateNaissance - Date de naissance
 * @property {Date} dateEntreeSPP - Date d'entrée en qualité de SPP
 * @property {number} quotite - Quotité de travail
 * @property {number} trimestresAutresRegimes - Trimestres hors CNRACL
 * @property {number} anneesSPV - Années SPV
 * @property {number} enfantsAvant2004 - Enfants nés avant 2004
 * @property {string} servicesMilitaires - Type de service militaire (aucun, bspp, bmpm)
 * @property {number} trimestresServicesMilitaires - Trimestres de services militaires
 */

/**
 * Scénario de départ
 * @typedef {Object} ScenarioDepart
 * @property {string} type - Type de scénario (anticipé, taux_plein, limite)
 * @property {Date} date - Date de départ
 * @property {number} age - Âge au départ
 * @property {number} trimestresLiquidables - Trimestres liquidables à cette date
 * @property {number} trimestresAssurance - Durée d'assurance totale
 * @property {number} tauxLiquidation - Taux de liquidation estimé
 * @property {boolean} decote - Présence d'une décote
 * @property {boolean} surcote - Présence d'une surcote
 * @property {string} description - Description du scénario
 */

/**
 * Calcule la date d'ouverture des droits (catégorie active)
 * L'âge varie selon la génération : 57 ans à 59 ans (réforme 2023)
 * Condition : 17 ans de services actifs minimum
 * Réf: Décret n°2003-1306, Art. 24 - Loi n°2023-270
 * @param {Date} dateNaissance - Date de naissance
 * @returns {Date} Date d'ouverture des droits
 */
export function calculerDateOuvertureDroits(dateNaissance) {
  const ageLegal = getAgeLegalActif(dateNaissance);
  return dateAtteindreAgeAvecMois(dateNaissance, ageLegal.ans, ageLegal.mois);
}

/**
 * Calcule une date en ajoutant un âge en années et mois
 * @param {Date} dateNaissance - Date de naissance
 * @param {number} annees - Nombre d'années
 * @param {number} mois - Nombre de mois supplémentaires
 * @returns {Date} Date résultante
 */
function dateAtteindreAgeAvecMois(dateNaissance, annees, mois = 0) {
  const date = new Date(dateNaissance);
  date.setFullYear(date.getFullYear() + annees);
  date.setMonth(date.getMonth() + mois);
  return date;
}

/**
 * Calcule la date d'annulation automatique de la décote
 * L'âge varie selon la génération : 62 ans à 64 ans (réforme 2023)
 * Réf: Code des pensions, Art. L14 - Loi n°2023-270
 * @param {Date} dateNaissance - Date de naissance
 * @returns {Date} Date d'annulation de la décote
 */
export function calculerDateAnnulationDecote(dateNaissance) {
  const ageLegal = getAgeLegalSedentaire(dateNaissance);
  return dateAtteindreAgeAvecMois(dateNaissance, ageLegal.ans, ageLegal.mois);
}

/**
 * Calcule la date à laquelle l'âge légal sédentaire est atteint
 * Utilisé pour le calcul de la surcote (qui ne s'applique qu'à partir de cet âge)
 * Réf: Loi n°2023-270 du 14 avril 2023
 * @param {Date} dateNaissance - Date de naissance
 * @returns {Date} Date d'atteinte de l'âge légal sédentaire
 */
export function calculerDateAgeLegalSedentaire(dateNaissance) {
  const ageLegal = getAgeLegalSedentaire(dateNaissance);
  return dateAtteindreAgeAvecMois(dateNaissance, ageLegal.ans, ageLegal.mois);
}

/**
 * Calcule la date limite d'activité
 * Réf: Décret n°2003-1306, Art. 28
 * @param {Date} dateNaissance - Date de naissance
 * @returns {Date} Date limite d'activité
 */
export function calculerDateLimite(dateNaissance) {
  return dateAtteindreAge(dateNaissance, AGES.LIMITE_ACTIVITE);
}

/**
 * Vérifie si un agent peut partir à l'âge anticipé (57 ans)
 * @param {DonneesDepart} donnees - Données de l'agent
 * @returns {{eligible: boolean, dateEligibilite: Date, motif: string}}
 */
export function verifierEligibiliteAgeAnticipe(donnees) {
  const dateOuverture = calculerDateOuvertureDroits(donnees.dateNaissance);

  // Calculer les trimestres de services actifs SPP
  const trimestresADateOuverture = calculerTrimestresEntreDates(
    donnees.dateEntreeSPP,
    dateOuverture
  );

  // Ajouter les services militaires (BSPP/BMPM) qui comptent comme services actifs
  const trimestresServicesMilitaires = donnees.trimestresServicesMilitaires || 0;
  const totalServicesActifs = trimestresADateOuverture + trimestresServicesMilitaires;

  const conditionRemplie = totalServicesActifs >= SERVICES.DUREE_MIN_SERVICES_ACTIFS;

  if (conditionRemplie) {
    return {
      eligible: true,
      dateEligibilite: dateOuverture,
      motif: 'Condition de 17 ans de services actifs remplie',
    };
  }

  // Calculer la date à laquelle les 17 ans seront atteints
  // En tenant compte des services militaires déjà effectués
  const trimestresRestants = SERVICES.DUREE_MIN_SERVICES_ACTIFS - trimestresServicesMilitaires;
  const anneesRestantes = Math.max(0, Math.ceil(trimestresRestants / 4));
  const dateAtteinte17Ans = new Date(donnees.dateEntreeSPP);
  dateAtteinte17Ans.setFullYear(dateAtteinte17Ans.getFullYear() + anneesRestantes);

  return {
    eligible: false,
    dateEligibilite: dateAtteinte17Ans,
    motif: `17 ans de services actifs non atteints à 57 ans (atteints le ${formaterDateLongueFR(dateAtteinte17Ans)})`,
  };
}

/**
 * Résultat du calcul de la date du taux plein
 * @typedef {Object} ResultatDateTauxPlein
 * @property {Date} date - Date du taux plein (ou date d'annulation décote si non atteint)
 * @property {boolean} atteintParDuree - True si le taux plein est atteint par la durée d'assurance
 * @property {boolean} atteintParAge - True si le taux plein est atteint par l'âge d'annulation de décote
 * @property {number} trimestresManquants - Trimestres manquants si non atteint par la durée
 */

/**
 * Calcule la date à laquelle le taux plein sera atteint
 * Optimisé : calcul analytique au lieu d'une boucle mensuelle
 * @param {DonneesDepart} donnees - Données de l'agent
 * @returns {ResultatDateTauxPlein} Résultat détaillé du calcul
 */
export function calculerDateTauxPlein(donnees) {
  const anneeNaissance = donnees.dateNaissance.getFullYear();
  const trimestresRequis = getDureeAssuranceRequise(anneeNaissance);
  const dateOuverture = calculerDateOuvertureDroits(donnees.dateNaissance);
  const dateAnnulationDecote = calculerDateAnnulationDecote(donnees.dateNaissance);

  // Calculer la durée d'assurance actuelle à la date d'ouverture des droits
  const resultatOuverture = calculerDurees(
    {
      dateEntreeSPP: donnees.dateEntreeSPP,
      dateDepart: dateOuverture,
      quotite: donnees.quotite,
      trimestresAutresRegimes: donnees.trimestresAutresRegimes,
      anneesSPV: donnees.anneesSPV,
      enfantsAvant2004: donnees.enfantsAvant2004,
      servicesMilitaires: donnees.servicesMilitaires,
      trimestresServicesMilitaires: donnees.trimestresServicesMilitaires,
    },
    anneeNaissance
  );

  // Si le taux plein est déjà atteint à 57 ans
  if (resultatOuverture.trimestresAssuranceTotale >= trimestresRequis) {
    return {
      date: dateOuverture,
      atteintParDuree: true,
      atteintParAge: false,
      trimestresManquants: 0,
    };
  }

  // Calcul analytique : combien de trimestres manquent et à quelle date seront-ils acquis ?
  const trimestresManquantsOuverture = trimestresRequis - resultatOuverture.trimestresAssuranceTotale;

  // Taux d'acquisition par trimestre de travail (avec bonification 1/5)
  // 1 trimestre travaillé = 1 trimestre + 0.2 bonification (si < plafond) = 1.2 trimestres
  // Simplifié : on compte 1 trimestre par trimestre (la bonification est déjà calculée sur le stock)
  const quotite = donnees.quotite || 1;

  // Nombre de mois nécessaires pour acquérir les trimestres manquants
  // 1 trimestre = 3 mois à temps plein
  const moisNecessaires = Math.ceil((trimestresManquantsOuverture / quotite) * 3);

  // Date estimée du taux plein
  const dateTauxPleinEstimee = new Date(dateOuverture);
  dateTauxPleinEstimee.setMonth(dateTauxPleinEstimee.getMonth() + moisNecessaires);

  // Vérifier si cette date est avant l'âge d'annulation de décote (62 ans)
  if (dateTauxPleinEstimee <= dateAnnulationDecote) {
    // Affiner le calcul en vérifiant la durée réelle à cette date
    const resultatEstime = calculerDurees(
      {
        dateEntreeSPP: donnees.dateEntreeSPP,
        dateDepart: dateTauxPleinEstimee,
        quotite: donnees.quotite,
        trimestresAutresRegimes: donnees.trimestresAutresRegimes,
        anneesSPV: donnees.anneesSPV,
        enfantsAvant2004: donnees.enfantsAvant2004,
        servicesMilitaires: donnees.servicesMilitaires,
        trimestresServicesMilitaires: donnees.trimestresServicesMilitaires,
      },
      anneeNaissance
    );

    // Ajustement si nécessaire (la bonification 1/5 peut modifier légèrement le résultat)
    if (resultatEstime.trimestresAssuranceTotale >= trimestresRequis) {
      return {
        date: dateTauxPleinEstimee,
        atteintParDuree: true,
        atteintParAge: false,
        trimestresManquants: 0,
      };
    }

    // Ajustement fin : ajouter les mois manquants
    const trimestresEncoreManquants = trimestresRequis - resultatEstime.trimestresAssuranceTotale;
    const moisSupplementaires = Math.ceil((trimestresEncoreManquants / quotite) * 3);
    dateTauxPleinEstimee.setMonth(dateTauxPleinEstimee.getMonth() + moisSupplementaires);

    if (dateTauxPleinEstimee <= dateAnnulationDecote) {
      return {
        date: dateTauxPleinEstimee,
        atteintParDuree: true,
        atteintParAge: false,
        trimestresManquants: 0,
      };
    }
  }

  // Le taux plein par durée n'est pas atteint avant 62 ans
  // Le taux plein sera atteint par l'âge d'annulation de décote
  const resultatAnnulation = calculerDurees(
    {
      dateEntreeSPP: donnees.dateEntreeSPP,
      dateDepart: dateAnnulationDecote,
      quotite: donnees.quotite,
      trimestresAutresRegimes: donnees.trimestresAutresRegimes,
      anneesSPV: donnees.anneesSPV,
      enfantsAvant2004: donnees.enfantsAvant2004,
      servicesMilitaires: donnees.servicesMilitaires,
      trimestresServicesMilitaires: donnees.trimestresServicesMilitaires,
    },
    anneeNaissance
  );

  const trimestresManquants = Math.max(0, trimestresRequis - resultatAnnulation.trimestresAssuranceTotale);

  return {
    date: dateAnnulationDecote,
    atteintParDuree: false,
    atteintParAge: true,
    trimestresManquants,
  };
}

/**
 * Génère les différents scénarios de départ possibles
 * @param {DonneesDepart} donnees - Données de l'agent
 * @returns {ScenarioDepart[]} Liste des scénarios
 */
export function genererScenariosDepart(donnees) {
  const scenarios = [];
  const anneeNaissance = donnees.dateNaissance.getFullYear();
  const trimestresRequis = getDureeAssuranceRequise(anneeNaissance);

  // Scénario 1 : Départ au plus tôt (57 ans)
  const eligibilite = verifierEligibiliteAgeAnticipe(donnees);
  const dateAuPlusTot = eligibilite.eligible
    ? calculerDateOuvertureDroits(donnees.dateNaissance)
    : eligibilite.dateEligibilite;

  const resultatAuPlusTot = calculerDurees(
    {
      dateEntreeSPP: donnees.dateEntreeSPP,
      dateDepart: dateAuPlusTot,
      quotite: donnees.quotite,
      trimestresAutresRegimes: donnees.trimestresAutresRegimes,
      anneesSPV: donnees.anneesSPV,
      enfantsAvant2004: donnees.enfantsAvant2004,
      servicesMilitaires: donnees.servicesMilitaires,
      trimestresServicesMilitaires: donnees.trimestresServicesMilitaires,
    },
    anneeNaissance
  );

  const tauxAuPlusTot = Math.min(
    75,
    (resultatAuPlusTot.trimestresLiquidables / trimestresRequis) * 75
  );
  const decoteAuPlusTot = resultatAuPlusTot.trimestresAssuranceTotale < trimestresRequis;

  scenarios.push({
    type: 'anticipé',
    date: dateAuPlusTot,
    age: calculerAge(donnees.dateNaissance, dateAuPlusTot),
    trimestresLiquidables: resultatAuPlusTot.trimestresLiquidables,
    trimestresAssurance: resultatAuPlusTot.trimestresAssuranceTotale,
    tauxLiquidation: tauxAuPlusTot,
    decote: decoteAuPlusTot,
    surcote: false,
    description: 'Départ au plus tôt' + (decoteAuPlusTot ? ' (avec décote)' : ''),
  });

  // Scénario 2 : Départ au taux plein
  const resultatDateTauxPlein = calculerDateTauxPlein(donnees);
  const dateTauxPlein = resultatDateTauxPlein.date;
  const resultatTauxPlein = calculerDurees(
    {
      dateEntreeSPP: donnees.dateEntreeSPP,
      dateDepart: dateTauxPlein,
      quotite: donnees.quotite,
      trimestresAutresRegimes: donnees.trimestresAutresRegimes,
      anneesSPV: donnees.anneesSPV,
      enfantsAvant2004: donnees.enfantsAvant2004,
      servicesMilitaires: donnees.servicesMilitaires,
      trimestresServicesMilitaires: donnees.trimestresServicesMilitaires,
    },
    anneeNaissance
  );

  const tauxTauxPlein = Math.min(
    75,
    (resultatTauxPlein.trimestresLiquidables / trimestresRequis) * 75
  );

  // Déterminer la description selon comment le taux plein est atteint
  let descriptionTauxPlein = 'Départ au taux plein';
  if (resultatDateTauxPlein.atteintParDuree) {
    descriptionTauxPlein += ' (durée d\'assurance atteinte)';
  } else if (resultatDateTauxPlein.atteintParAge) {
    descriptionTauxPlein += ' (annulation décote à 62 ans)';
    if (resultatDateTauxPlein.trimestresManquants > 0) {
      descriptionTauxPlein += ` - ${resultatDateTauxPlein.trimestresManquants} trim. manquants`;
    }
  }

  scenarios.push({
    type: 'taux_plein',
    date: dateTauxPlein,
    age: calculerAge(donnees.dateNaissance, dateTauxPlein),
    trimestresLiquidables: resultatTauxPlein.trimestresLiquidables,
    trimestresAssurance: resultatTauxPlein.trimestresAssuranceTotale,
    tauxLiquidation: tauxTauxPlein,
    decote: false,
    surcote: false,
    tauxPleinParDuree: resultatDateTauxPlein.atteintParDuree,
    tauxPleinParAge: resultatDateTauxPlein.atteintParAge,
    trimestresManquants: resultatDateTauxPlein.trimestresManquants,
    description: descriptionTauxPlein,
  });

  // Scénario 3 : Départ à la limite d'âge
  const dateLimite = calculerDateLimite(donnees.dateNaissance);
  const resultatLimite = calculerDurees(
    {
      dateEntreeSPP: donnees.dateEntreeSPP,
      dateDepart: dateLimite,
      quotite: donnees.quotite,
      trimestresAutresRegimes: donnees.trimestresAutresRegimes,
      anneesSPV: donnees.anneesSPV,
      enfantsAvant2004: donnees.enfantsAvant2004,
      servicesMilitaires: donnees.servicesMilitaires,
      trimestresServicesMilitaires: donnees.trimestresServicesMilitaires,
    },
    anneeNaissance
  );

  const tauxLimite = Math.min(
    75,
    (resultatLimite.trimestresLiquidables / trimestresRequis) * 75
  );

  // La surcote s'applique uniquement si :
  // 1. La durée d'assurance dépasse le nombre requis
  // 2. L'agent a dépassé la date du taux plein (pas juste l'âge d'ouverture)
  const surcoteLimite = resultatLimite.trimestresAssuranceTotale > trimestresRequis &&
    dateLimite > dateTauxPlein;

  // Calculer le nombre de trimestres de surcote
  const trimestresSurcoteLimite = surcoteLimite
    ? Math.max(0, resultatLimite.trimestresAssuranceTotale - trimestresRequis)
    : 0;

  scenarios.push({
    type: 'limite',
    date: dateLimite,
    age: calculerAge(donnees.dateNaissance, dateLimite),
    trimestresLiquidables: resultatLimite.trimestresLiquidables,
    trimestresAssurance: resultatLimite.trimestresAssuranceTotale,
    tauxLiquidation: tauxLimite,
    decote: false,
    surcote: surcoteLimite,
    trimestresSurcote: trimestresSurcoteLimite,
    description: 'Départ à la limite d\'âge' + (surcoteLimite ? ` (surcote +${trimestresSurcoteLimite} trim.)` : ''),
  });

  return scenarios;
}

/**
 * Calcule le nombre de trimestres de décote selon l'âge
 * Réf: Code des pensions, Art. L14
 * @param {Date} dateNaissance - Date de naissance
 * @param {Date} dateDepart - Date de départ
 * @param {number} trimestresAssurance - Durée d'assurance totale
 * @param {number} trimestresRequis - Durée requise pour le taux plein
 * @returns {number} Nombre de trimestres de décote (0 à 20)
 */
export function calculerTrimestresDecote(dateNaissance, dateDepart, trimestresAssurance, trimestresRequis) {
  const ageDepart = calculerAge(dateNaissance, dateDepart);

  // Pas de décote après l'âge d'annulation
  if (ageDepart >= AGES.ANNULATION_DECOTE) {
    return 0;
  }

  // Calcul des trimestres manquants par rapport à la durée requise
  const trimestresManquantsDuree = Math.max(0, trimestresRequis - trimestresAssurance);

  // Calcul des trimestres manquants par rapport à l'âge d'annulation
  const dateAnnulation = calculerDateAnnulationDecote(dateNaissance);
  const trimestresManquantsAge = calculerTrimestresEntreDates(dateDepart, dateAnnulation);

  // La décote s'applique sur le plus petit des deux
  const trimestresDecote = Math.min(trimestresManquantsDuree, trimestresManquantsAge);

  // Maximum 20 trimestres de décote
  return Math.min(trimestresDecote, 20);
}

/**
 * Vérifie si un agent peut bénéficier d'un départ anticipé pour carrière longue
 * (Non applicable aux SPP car déjà catégorie active, mais prévu pour référence)
 * @param {DonneesDepart} donnees - Données de l'agent
 * @returns {{eligible: boolean, motif: string}}
 */
export function verifierCarriereLongue(donnees) {
  // Les SPP bénéficient déjà du départ anticipé à 57 ans (catégorie active)
  // Le dispositif carrière longue ne s'applique pas en plus
  return {
    eligible: false,
    motif: 'Les SPP bénéficient déjà du régime catégorie active (départ à 57 ans)',
  };
}

/**
 * Génère un résumé des dates clés
 * @param {DonneesDepart} donnees - Données de l'agent
 * @returns {Object} Résumé des dates importantes
 */
export function genererResumeDates(donnees) {
  const dateOuverture = calculerDateOuvertureDroits(donnees.dateNaissance);
  const dateAnnulation = calculerDateAnnulationDecote(donnees.dateNaissance);
  const dateLimite = calculerDateLimite(donnees.dateNaissance);
  const resultatTauxPlein = calculerDateTauxPlein(donnees);

  const aujourdhui = new Date();

  return {
    dateOuvertureDroits: {
      date: dateOuverture,
      age: AGES.OUVERTURE_DROITS,
      libelle: 'Ouverture des droits',
      atteint: dateOuverture <= aujourdhui,
    },
    dateTauxPlein: {
      date: resultatTauxPlein.date,
      age: calculerAge(donnees.dateNaissance, resultatTauxPlein.date),
      libelle: resultatTauxPlein.atteintParDuree
        ? 'Taux plein (durée atteinte)'
        : 'Taux plein (annulation décote)',
      atteint: resultatTauxPlein.date <= aujourdhui,
      atteintParDuree: resultatTauxPlein.atteintParDuree,
      trimestresManquants: resultatTauxPlein.trimestresManquants,
    },
    dateAnnulationDecote: {
      date: dateAnnulation,
      age: AGES.ANNULATION_DECOTE,
      libelle: 'Annulation automatique décote',
      atteint: dateAnnulation <= aujourdhui,
    },
    dateLimite: {
      date: dateLimite,
      age: AGES.LIMITE_ACTIVITE,
      libelle: 'Limite d\'âge',
      atteint: dateLimite <= aujourdhui,
    },
  };
}
