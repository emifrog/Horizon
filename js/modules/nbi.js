/**
 * Module NBI - Nouvelle Bonification Indiciaire
 *
 * Ce module gère le calcul du supplément de pension lié à la NBI.
 * La NBI est prise en compte dans la pension si elle a été perçue
 * pendant au moins un an.
 *
 * @module modules/nbi
 */

import { NBI, POINT_INDICE } from '../config/parametres.js';

/**
 * Données pour le calcul NBI
 * @typedef {Object} DonneesNBI
 * @property {number} pointsNBI - Nombre de points NBI
 * @property {number} dureeMoisNBI - Durée de perception en mois
 * @property {number} dureeServicesTotal - Durée totale des services (trimestres)
 * @property {number} tauxLiquidation - Taux de liquidation de la pension
 */

/**
 * Résultat du calcul NBI
 * @typedef {Object} ResultatNBI
 * @property {boolean} eligible - Éligibilité au supplément NBI
 * @property {number} pointsNBI - Points NBI
 * @property {number} dureeMoisNBI - Durée de perception en mois
 * @property {number} dureeAnneesNBI - Durée de perception en années
 * @property {number} moyennePonderee - Moyenne pondérée des points NBI
 * @property {number} supplementMensuel - Supplément de pension mensuel
 * @property {number} supplementAnnuel - Supplément de pension annuel
 * @property {string} motifIneligibilite - Motif si non éligible
 */

/**
 * Vérifie l'éligibilité au supplément NBI
 * Réf: Décret n°2006-779 du 3 juillet 2006
 * @param {number} dureeMoisNBI - Durée de perception en mois
 * @returns {{eligible: boolean, motif: string}}
 */
export function verifierEligibiliteNBI(dureeMoisNBI) {
  const dureeMinMois = NBI.DUREE_MIN_PERCEPTION * 12; // 12 mois minimum

  if (!dureeMoisNBI || dureeMoisNBI < dureeMinMois) {
    return {
      eligible: false,
      motif: `Durée de perception insuffisante (minimum ${NBI.DUREE_MIN_PERCEPTION} an)`,
    };
  }

  return {
    eligible: true,
    motif: '',
  };
}

/**
 * Calcule la moyenne pondérée des points NBI
 * La NBI est prise en compte au prorata de la durée de perception
 * par rapport à la durée totale des services
 *
 * @param {number} pointsNBI - Nombre de points NBI
 * @param {number} dureeMoisNBI - Durée de perception en mois
 * @param {number} dureeServicesTotal - Durée totale des services en trimestres
 * @returns {number} Points NBI moyens pondérés
 */
export function calculerMoyennePondereeNBI(pointsNBI, dureeMoisNBI, dureeServicesTotal) {
  if (!pointsNBI || !dureeMoisNBI || !dureeServicesTotal) {
    return 0;
  }

  // Conversion des trimestres en mois pour le calcul
  const dureeServicesMois = dureeServicesTotal * 3;

  // Si perception pendant au moins 15 ans, on prend la moyenne des 6 derniers mois
  // Sinon, on calcule la moyenne sur toute la carrière
  const dureeAnneesNBI = dureeMoisNBI / 12;

  if (dureeAnneesNBI >= NBI.DUREE_INTEGRATION_COMPLETE) {
    // Intégration complète de la NBI
    return pointsNBI;
  }

  // Calcul au prorata de la durée de perception
  const ratio = Math.min(dureeMoisNBI / dureeServicesMois, 1);
  return Math.round(pointsNBI * ratio * 100) / 100;
}

/**
 * Calcule le supplément de pension NBI
 * Formule : Points NBI × Valeur point × (Durée NBI / Durée services) × Taux liquidation
 *
 * @param {number} moyennePondereeNBI - Points NBI moyens pondérés
 * @param {number} tauxLiquidation - Taux de liquidation (en %)
 * @returns {{mensuel: number, annuel: number}} Supplément mensuel et annuel
 */
export function calculerSupplementNBI(moyennePondereeNBI, tauxLiquidation) {
  // Protection contre les valeurs nulles ou invalides
  if (!moyennePondereeNBI || moyennePondereeNBI <= 0) {
    return { mensuel: 0, annuel: 0 };
  }

  if (!tauxLiquidation || tauxLiquidation <= 0) {
    return { mensuel: 0, annuel: 0 };
  }

  // Traitement NBI annuel = Points NBI × Valeur du point
  const traitementNBIAnnuel = moyennePondereeNBI * POINT_INDICE.VALEUR_ANNUELLE;

  // Application du taux de liquidation
  const supplementAnnuel = traitementNBIAnnuel * (tauxLiquidation / 100);
  const supplementMensuel = supplementAnnuel / 12;

  return {
    mensuel: Math.round(supplementMensuel * 100) / 100,
    annuel: Math.round(supplementAnnuel * 100) / 100,
  };
}

/**
 * Effectue le calcul complet du supplément NBI
 * @param {DonneesNBI} donnees - Données pour le calcul
 * @returns {ResultatNBI} Résultat complet
 */
export function calculerNBI(donnees) {
  const { pointsNBI, dureeMoisNBI, dureeServicesTotal, tauxLiquidation } = donnees;

  // Vérification de l'éligibilité
  const { eligible, motif } = verifierEligibiliteNBI(dureeMoisNBI);

  if (!eligible) {
    return {
      eligible: false,
      pointsNBI: pointsNBI || 0,
      dureeMoisNBI: dureeMoisNBI || 0,
      dureeAnneesNBI: (dureeMoisNBI || 0) / 12,
      moyennePonderee: 0,
      supplementMensuel: 0,
      supplementAnnuel: 0,
      motifIneligibilite: motif,
    };
  }

  // Calcul de la moyenne pondérée
  const moyennePonderee = calculerMoyennePondereeNBI(
    pointsNBI,
    dureeMoisNBI,
    dureeServicesTotal
  );

  // Calcul du supplément
  const supplement = calculerSupplementNBI(moyennePonderee, tauxLiquidation);

  return {
    eligible: true,
    pointsNBI,
    dureeMoisNBI,
    dureeAnneesNBI: Math.round((dureeMoisNBI / 12) * 100) / 100,
    moyennePonderee,
    supplementMensuel: supplement.mensuel,
    supplementAnnuel: supplement.annuel,
    motifIneligibilite: '',
  };
}

/**
 * Calcule la valeur mensuelle brute de la NBI en activité
 * @param {number} pointsNBI - Nombre de points NBI
 * @returns {number} Montant mensuel brut
 */
export function calculerNBIActivite(pointsNBI) {
  if (!pointsNBI || pointsNBI <= 0) {
    return 0;
  }

  const annuel = pointsNBI * POINT_INDICE.VALEUR_ANNUELLE;
  return Math.round((annuel / 12) * 100) / 100;
}

/**
 * Compare la NBI en activité et le supplément à la retraite
 * @param {number} pointsNBI - Points NBI
 * @param {number} supplementMensuel - Supplément NBI mensuel à la retraite
 * @returns {Object} Comparaison
 */
export function comparerNBIActiviteRetraite(pointsNBI, supplementMensuel) {
  const nbiActivite = calculerNBIActivite(pointsNBI);

  return {
    nbiActivite: nbiActivite,
    supplementRetraite: supplementMensuel,
    difference: Math.round((supplementMensuel - nbiActivite) * 100) / 100,
    tauxMaintien: nbiActivite > 0
      ? Math.round((supplementMensuel / nbiActivite) * 100 * 100) / 100
      : 0,
  };
}

/**
 * Liste des emplois fonctionnels avec NBI pour les SPP
 * (Liste indicative, non exhaustive)
 * @returns {Array} Liste des emplois avec NBI
 */
export function getEmploisNBI() {
  return [
    { emploi: 'Chef de groupe', pointsMin: 15, pointsMax: 25 },
    { emploi: 'Chef de colonne', pointsMin: 20, pointsMax: 35 },
    { emploi: 'Chef de site', pointsMin: 25, pointsMax: 40 },
    { emploi: 'Chef de centre', pointsMin: 30, pointsMax: 50 },
    { emploi: 'Responsable formation', pointsMin: 20, pointsMax: 30 },
    { emploi: 'Chef de service', pointsMin: 35, pointsMax: 60 },
  ];
}

/**
 * Génère un résumé du calcul NBI
 * @param {ResultatNBI} resultat - Résultat du calcul
 * @returns {Object} Résumé formaté
 */
export function genererResumeNBI(resultat) {
  if (!resultat.eligible) {
    return {
      statut: 'Non éligible',
      motif: resultat.motifIneligibilite,
      supplement: '0,00 €/mois',
    };
  }

  return {
    statut: 'Éligible',
    pointsNBI: `${resultat.pointsNBI} points`,
    dureePerception: `${resultat.dureeAnneesNBI.toFixed(1)} ans`,
    moyennePonderee: `${resultat.moyennePonderee.toFixed(2)} points`,
    supplement: `${resultat.supplementMensuel.toFixed(2)} €/mois`,
    supplementAnnuel: `${resultat.supplementAnnuel.toFixed(2)} €/an`,
  };
}
