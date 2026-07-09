/**
 * Module NBI - Nouvelle Bonification Indiciaire
 *
 * Ce module gère le calcul du supplément de pension lié à la NBI.
 * La NBI est prise en compte dans la pension si elle a été perçue
 * pendant au moins un an.
 *
 * @module modules/nbi
 */

import { TAUX, POINT_INDICE } from '../config/parametres.js';
import { arrondir } from '../utils/nombres.js';

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
 * Calcule le supplément de pension NBI (décret 2006-779).
 *
 * Le supplément est établi À PART : il ne subit ni décote, ni minoration, ni
 * majoration. On applique donc le taux d'UN trimestre (75 / durée requise), et non
 * le taux de liquidation de la pension. Il n'y a pas non plus d'intégration au TIB
 * ni de seuil de perception minimale (la formule gère nativement les durées partielles).
 *
 *   SUP_annuel = points NBI × (durée de perception en trimestres)
 *                × (75 / durée requise / 100) × valeur annuelle du point
 *
 * @param {number} pointsNBI - Moyenne annuelle des points majorés NBI
 * @param {number} dureeTrimestresNBI - Durée de perception en trimestres
 * @param {number} dureeRequise - Durée d'assurance requise (trimestres) l'année d'ouverture des droits
 * @returns {{mensuel: number, annuel: number}} Supplément mensuel et annuel
 */
export function calculerSupplementNBI(pointsNBI, dureeTrimestresNBI, dureeRequise) {
  if (!pointsNBI || pointsNBI <= 0 || !dureeTrimestresNBI || dureeTrimestresNBI <= 0
      || !dureeRequise || dureeRequise <= 0) {
    return { mensuel: 0, annuel: 0 };
  }

  // Taux de rémunération d'UN trimestre (et non le taux de liquidation de la pension).
  const tauxTrimestre = (TAUX.PLEIN / dureeRequise) / 100; // 75 / requise / 100
  const supplementAnnuel = pointsNBI * dureeTrimestresNBI * tauxTrimestre * POINT_INDICE.VALEUR_ANNUELLE;

  return {
    mensuel: arrondir(supplementAnnuel / 12, 2),
    annuel: arrondir(supplementAnnuel, 2),
  };
}

/**
 * Effectue le calcul complet du supplément NBI.
 * @param {{pointsNBI:number, dureeMoisNBI:number, dureeRequise:number}} donnees
 * @returns {ResultatNBI} Résultat complet
 */
export function calculerNBI({ pointsNBI, dureeMoisNBI, dureeRequise }) {
  const pts = pointsNBI || 0;
  const mois = dureeMoisNBI || 0;

  if (pts <= 0 || mois <= 0) {
    return {
      eligible: false,
      pointsNBI: pts,
      dureeMoisNBI: mois,
      dureeAnneesNBI: arrondir(mois / 12, 2),
      dureeTrimestresNBI: 0,
      supplementMensuel: 0,
      supplementAnnuel: 0,
      motifIneligibilite: pts <= 0 ? 'Aucun point NBI' : 'Aucune durée de perception',
    };
  }

  const dureeTrimestresNBI = mois / 3;
  const supplement = calculerSupplementNBI(pts, dureeTrimestresNBI, dureeRequise);

  return {
    eligible: true,
    pointsNBI: pts,
    dureeMoisNBI: mois,
    dureeAnneesNBI: arrondir(mois / 12, 2),
    dureeTrimestresNBI,
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
  return arrondir(annuel / 12, 2);
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
    difference: arrondir(supplementMensuel - nbiActivite, 2),
    tauxMaintien: nbiActivite > 0
      ? arrondir((supplementMensuel / nbiActivite) * 100, 2)
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
