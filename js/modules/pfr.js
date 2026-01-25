/**
 * Module PFR - Prime de Feu et RAFP
 *
 * Ce module gère le calcul de la Prime de Feu (PFR) et son impact
 * sur la retraite via le RAFP (Régime Additionnel de la Fonction Publique).
 *
 * @module modules/pfr
 */

import { PFR, POINT_INDICE } from '../config/parametres.js';

/**
 * Données pour le calcul PFR/RAFP
 * @typedef {Object} DonneesPFR
 * @property {number} indiceBrut - Indice brut de l'agent
 * @property {number} montantAnnuelPFR - Montant annuel brut de la PFR (si connu)
 * @property {number} [partFixe] - Part fixe mensuelle (alternative)
 * @property {number} [partVariable] - Part variable mensuelle (alternative)
 * @property {number} anneesCotisation - Années de cotisation RAFP
 */

/**
 * Résultat du calcul PFR/RAFP
 * @typedef {Object} ResultatPFR
 * @property {number} traitementIndiciaireAnnuel - TIB annuel de référence
 * @property {number} montantPFRAnnuel - Montant annuel de la PFR
 * @property {number} tauxPFR - Taux effectif de la PFR
 * @property {number} plafondRAFP - Plafond de cotisation RAFP
 * @property {number} assietteRAFP - Assiette retenue pour le RAFP
 * @property {number} cotisationAnnuelleRAFP - Cotisation annuelle RAFP (agent)
 * @property {number} pointsRAFPAnnuels - Points RAFP acquis par an (estimation)
 * @property {number} totalPointsRAFP - Total points RAFP estimé
 * @property {number} renteRAFPMensuelle - Rente RAFP mensuelle estimée
 */

/**
 * Calcule le montant théorique de la PFR selon le taux réglementaire
 * Réf: Décret n°98-442 du 5 juin 1998
 * @param {number} indiceBrut - Indice brut de l'agent
 * @returns {number} Montant annuel théorique de la PFR
 */
export function calculerPFRTheorique(indiceBrut) {
  const traitementAnnuel = indiceBrut * POINT_INDICE.VALEUR_ANNUELLE;
  return Math.round(traitementAnnuel * (PFR.TAUX_PRIME_FEU / 100) * 100) / 100;
}

/**
 * Calcule le plafond de l'assiette RAFP (20% du TIB)
 * Réf: Décret n°2004-569 du 18 juin 2004
 * @param {number} traitementIndiciaireAnnuel - TIB annuel
 * @returns {number} Plafond annuel de l'assiette RAFP
 */
export function calculerPlafondRAFP(traitementIndiciaireAnnuel) {
  return Math.round(traitementIndiciaireAnnuel * (PFR.PLAFOND_ASSIETTE_RAFP / 100) * 100) / 100;
}

/**
 * Calcule l'assiette effective de cotisation RAFP
 * L'assiette est plafonnée à 20% du TIB
 * @param {number} montantPFR - Montant annuel de la PFR
 * @param {number} plafondRAFP - Plafond RAFP
 * @returns {number} Assiette retenue pour la cotisation
 */
export function calculerAssietteRAFP(montantPFR, plafondRAFP) {
  return Math.min(montantPFR, plafondRAFP);
}

/**
 * Calcule la cotisation RAFP de l'agent
 * @param {number} assietteRAFP - Assiette de cotisation
 * @returns {number} Cotisation annuelle
 */
export function calculerCotisationRAFP(assietteRAFP) {
  return Math.round(assietteRAFP * (PFR.TAUX_COTISATION_RAFP / 100) * 100) / 100;
}

/**
 * Estime les points RAFP acquis annuellement
 * Réf: https://www.rafp.fr/actif/activite/calculer-vos-cotisations-et-vos-points-rafp
 * @param {number} cotisationAgent - Cotisation agent annuelle
 * @param {number} cotisationEmployeur - Cotisation employeur annuelle (égale à celle de l'agent)
 * @returns {number} Points RAFP acquis (arrondi au point supérieur)
 */
export function estimerPointsRAFPAnnuels(cotisationAgent, cotisationEmployeur) {
  // Total des cotisations (agent + employeur)
  const totalCotisations = cotisationAgent + cotisationEmployeur;

  // Arrondi au point supérieur (règle officielle RAFP)
  return Math.ceil(totalCotisations / PFR.VALEUR_ACQUISITION_POINT_RAFP);
}

/**
 * Calcule la rente RAFP estimée
 * Réf: Décret n°2004-569, Art. 17
 * Réf: https://www.rafp.fr/actif/activite/calculer-vos-cotisations-et-vos-points-rafp
 * @param {number} totalPoints - Nombre total de points RAFP
 * @returns {number} Rente mensuelle estimée
 */
export function calculerRenteRAFP(totalPoints) {
  // La valeur de service est utilisée pour calculer la rente annuelle
  const renteAnnuelle = totalPoints * PFR.VALEUR_SERVICE_POINT_RAFP;
  const renteMensuelle = renteAnnuelle / 12;

  return Math.round(renteMensuelle * 100) / 100;
}

/**
 * Effectue le calcul complet PFR/RAFP
 * @param {DonneesPFR} donnees - Données pour le calcul
 * @returns {ResultatPFR} Résultat complet
 */
export function calculerPFR(donnees) {
  const { indiceBrut, montantAnnuelPFR, partFixe, partVariable, anneesCotisation } = donnees;

  // Protection contre indice brut invalide
  if (!indiceBrut || indiceBrut <= 0) {
    return {
      traitementIndiciaireAnnuel: 0,
      montantPFRAnnuel: 0,
      tauxPFR: 0,
      plafondRAFP: 0,
      assietteRAFP: 0,
      cotisationAnnuelleRAFP: 0,
      pointsRAFPAnnuels: 0,
      totalPointsRAFP: 0,
      renteRAFPMensuelle: 0,
    };
  }

  // Calcul du traitement indiciaire
  const traitementIndiciaireAnnuel = indiceBrut * POINT_INDICE.VALEUR_ANNUELLE;

  // Détermination du montant de la PFR
  let montantPFRAnnuel;
  if (montantAnnuelPFR !== undefined && montantAnnuelPFR > 0) {
    montantPFRAnnuel = montantAnnuelPFR;
  } else if (partFixe !== undefined || partVariable !== undefined) {
    const fixe = partFixe || 0;
    const variable = partVariable || 0;
    montantPFRAnnuel = (fixe + variable) * 12;
  } else {
    // Calcul théorique si aucun montant fourni
    montantPFRAnnuel = calculerPFRTheorique(indiceBrut);
  }

  // Calcul du taux effectif (protection division par zéro)
  const tauxPFR = traitementIndiciaireAnnuel > 0
    ? (montantPFRAnnuel / traitementIndiciaireAnnuel) * 100
    : 0;

  // Calcul RAFP
  const plafondRAFP = calculerPlafondRAFP(traitementIndiciaireAnnuel);
  const assietteRAFP = calculerAssietteRAFP(montantPFRAnnuel, plafondRAFP);
  const cotisationAnnuelleRAFP = calculerCotisationRAFP(assietteRAFP);

  // Estimation des points RAFP
  const pointsRAFPAnnuels = estimerPointsRAFPAnnuels(cotisationAnnuelleRAFP, cotisationAnnuelleRAFP);
  const totalPointsRAFP = Math.round(pointsRAFPAnnuels * (anneesCotisation || 0) * 100) / 100;

  // Calcul de la rente RAFP
  const renteRAFPMensuelle = calculerRenteRAFP(totalPointsRAFP);

  return {
    traitementIndiciaireAnnuel: Math.round(traitementIndiciaireAnnuel * 100) / 100,
    montantPFRAnnuel: Math.round(montantPFRAnnuel * 100) / 100,
    tauxPFR: Math.round(tauxPFR * 100) / 100,
    plafondRAFP,
    assietteRAFP,
    cotisationAnnuelleRAFP,
    pointsRAFPAnnuels,
    totalPointsRAFP,
    renteRAFPMensuelle,
  };
}

/**
 * Projette le RAFP à la date de départ
 * @param {DonneesPFR} donneesActuelles - Données actuelles
 * @param {Date} dateDepart - Date de départ prévue
 * @param {Date} dateEntree - Date d'entrée (pour calculer les années futures)
 * @returns {ResultatPFR} Résultat projeté
 */
export function projeterRAFP(donneesActuelles, dateDepart, dateEntree) {
  const aujourdhui = new Date();
  const anneesPassees = donneesActuelles.anneesCotisation || 0;

  // Calcul des années futures de cotisation
  const anneesFutures = Math.max(0, Math.floor(
    (dateDepart.getTime() - aujourdhui.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  ));

  const totalAnnees = anneesPassees + anneesFutures;

  return calculerPFR({
    ...donneesActuelles,
    anneesCotisation: totalAnnees,
  });
}

/**
 * Compare les revenus avec et sans PFR intégrée dans la pension
 * Note: La PFR n'est pas intégrée dans le calcul de la pension CNRACL,
 * seul le RAFP compense partiellement cette absence
 * @param {number} pensionCNRACL - Pension CNRACL mensuelle
 * @param {number} renteRAFP - Rente RAFP mensuelle
 * @param {number} montantPFRMensuel - PFR mensuelle en activité
 * @returns {Object} Comparaison des revenus
 */
export function comparerRevenusAvecSansPFR(pensionCNRACL, renteRAFP, montantPFRMensuel) {
  const retraiteAvecRAFP = pensionCNRACL + renteRAFP;

  // Si la PFR avait été intégrée au traitement (hypothétique)
  // elle aurait augmenté la pension de base
  const pensionHypothetique = pensionCNRACL * (1 + PFR.TAUX_PRIME_FEU / 100);

  const pertePFRNonIntegree = pensionHypothetique - retraiteAvecRAFP;

  return {
    pensionCNRACL: Math.round(pensionCNRACL * 100) / 100,
    renteRAFP: Math.round(renteRAFP * 100) / 100,
    totalRetraite: Math.round(retraiteAvecRAFP * 100) / 100,
    pfrEnActivite: Math.round(montantPFRMensuel * 100) / 100,
    pensionHypothetiqueSiPFRIntegree: Math.round(pensionHypothetique * 100) / 100,
    perteEstimee: Math.round(pertePFRNonIntegree * 100) / 100,
    tauxRemplacement: Math.round((retraiteAvecRAFP / (pensionCNRACL + montantPFRMensuel)) * 100 * 100) / 100,
  };
}

/**
 * Génère un résumé du calcul PFR/RAFP
 * @param {ResultatPFR} resultat - Résultat du calcul
 * @returns {Object} Résumé formaté
 */
export function genererResumePFR(resultat) {
  const plafondAtteint = resultat.assietteRAFP < resultat.montantPFRAnnuel;

  return {
    montantPFR: `${resultat.montantPFRAnnuel.toFixed(2)} €/an (${resultat.tauxPFR.toFixed(1)} % du TIB)`,
    cotisationRAFP: `${resultat.cotisationAnnuelleRAFP.toFixed(2)} €/an`,
    plafondRAFP: plafondAtteint
      ? `Plafond atteint (${resultat.plafondRAFP.toFixed(2)} €)`
      : 'Non plafonné',
    pointsRAFP: `~${resultat.pointsRAFPAnnuels.toFixed(0)} points/an`,
    totalPoints: `${resultat.totalPointsRAFP.toFixed(0)} points`,
    renteEstimee: `${resultat.renteRAFPMensuelle.toFixed(2)} €/mois`,
  };
}
