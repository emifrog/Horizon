/**
 * Module Pension - Calcul de la pension CNRACL
 *
 * Ce module effectue le calcul de la pension de base selon la formule CNRACL :
 * Pension = Traitement indiciaire × (Trimestres liquidables / Trimestres requis) × 75%
 *
 * @module modules/pension
 */

import { TAUX, POINT_INDICE, MINIMUM_GARANTI, COTISATIONS, getDureeAssuranceRequise } from '../config/parametres.js';
import { calculerTrimestresDecote } from './ages.js';

/**
 * Données pour le calcul de la pension
 * @typedef {Object} DonneesPension
 * @property {number} indiceBrut - Indice brut détenu
 * @property {number} trimestresLiquidables - Trimestres liquidables CNRACL
 * @property {number} trimestresAssurance - Durée d'assurance tous régimes
 * @property {number} trimestresRequis - Trimestres requis pour le taux plein
 * @property {Date} dateNaissance - Date de naissance
 * @property {Date} dateDepart - Date de départ
 */

/**
 * Résultat du calcul de pension
 * @typedef {Object} ResultatPension
 * @property {number} traitementIndiciaireAnnuel - Traitement indiciaire brut annuel
 * @property {number} traitementIndicaireMensuel - Traitement indiciaire brut mensuel
 * @property {number} tauxLiquidationBrut - Taux avant application décote/surcote
 * @property {number} coefficientDecote - Coefficient de décote (1 = pas de décote)
 * @property {number} trimestresDecote - Nombre de trimestres de décote
 * @property {number} tauxLiquidationNet - Taux final après décote
 * @property {number} pensionBruteAnnuelle - Pension brute annuelle
 * @property {number} pensionBruteMensuelle - Pension brute mensuelle
 * @property {number} pensionNetteMensuelle - Pension nette mensuelle (estimée)
 * @property {number} minimumGaranti - Montant du minimum garanti si applicable
 * @property {boolean} minimumGarantiApplique - Si le minimum garanti est appliqué
 */

/**
 * Calcule le traitement indiciaire brut à partir de l'indice
 * Réf: Article L15 du Code des pensions
 * @param {number} indiceBrut - Indice brut
 * @returns {{annuel: number, mensuel: number}} Traitement annuel et mensuel
 */
export function calculerTraitementIndiciaire(indiceBrut) {
  const annuel = indiceBrut * POINT_INDICE.VALEUR_ANNUELLE;
  const mensuel = annuel / 12;

  return {
    annuel: Math.round(annuel * 100) / 100,
    mensuel: Math.round(mensuel * 100) / 100,
  };
}

/**
 * Calcule le taux de liquidation brut (avant décote/surcote)
 * Réf: Code des pensions, Art. L13
 * @param {number} trimestresLiquidables - Trimestres liquidables
 * @param {number} trimestresRequis - Trimestres requis pour le taux plein
 * @returns {number} Taux de liquidation en pourcentage (max 75%)
 */
export function calculerTauxLiquidationBrut(trimestresLiquidables, trimestresRequis) {
  // Protection contre division par zéro
  if (!trimestresRequis || trimestresRequis <= 0) {
    return 0;
  }
  const taux = (trimestresLiquidables / trimestresRequis) * TAUX.PLEIN;
  return Math.min(taux, TAUX.PLEIN);
}

/**
 * Calcule le coefficient de décote
 * Réf: Code des pensions, Art. L14
 * @param {number} trimestresDecote - Nombre de trimestres de décote
 * @returns {number} Coefficient de décote (entre 0.75 et 1)
 */
export function calculerCoefficientDecote(trimestresDecote) {
  if (trimestresDecote <= 0) {
    return 1;
  }

  // Décote de 1.25% par trimestre manquant
  const decote = trimestresDecote * (TAUX.DECOTE_PAR_TRIMESTRE / 100);

  // Le coefficient minimum est de 0.75 (décote max de 25%)
  return Math.max(1 - decote, 0.75);
}

/**
 * Calcule le taux de liquidation net après décote
 * @param {number} tauxBrut - Taux de liquidation brut
 * @param {number} coefficientDecote - Coefficient de décote
 * @returns {number} Taux net après décote
 */
export function calculerTauxLiquidationNet(tauxBrut, coefficientDecote) {
  return tauxBrut * coefficientDecote;
}

/**
 * Calcule la pension brute
 * Réf: Code des pensions, Art. L13
 * @param {number} traitementIndiciaire - Traitement indiciaire de référence
 * @param {number} tauxLiquidation - Taux de liquidation (en %)
 * @returns {{annuel: number, mensuel: number}} Pension brute annuelle et mensuelle
 */
export function calculerPensionBrute(traitementIndiciaire, tauxLiquidation) {
  const pensionAnnuelle = traitementIndiciaire * (tauxLiquidation / 100);
  const pensionMensuelle = pensionAnnuelle / 12;

  return {
    annuel: Math.round(pensionAnnuelle * 100) / 100,
    mensuel: Math.round(pensionMensuelle * 100) / 100,
  };
}

/**
 * Calcule le minimum garanti applicable
 * Réf: Code des pensions, Art. L17
 * @param {number} trimestresLiquidables - Trimestres liquidables
 * @param {number} trimestresRequis - Trimestres requis
 * @returns {number} Montant mensuel du minimum garanti
 */
export function calculerMinimumGaranti(trimestresLiquidables, trimestresRequis) {
  // Formule simplifiée du minimum garanti
  // Le minimum garanti est proratisé selon la durée de services
  const ratio = Math.min(trimestresLiquidables / trimestresRequis, 1);
  return Math.round(MINIMUM_GARANTI.MONTANT_MENSUEL_2026 * ratio * 100) / 100;
}

/**
 * Calcule les cotisations sur la pension (CSG, CRDS, CASA)
 * @param {number} pensionBruteMensuelle - Pension brute mensuelle
 * @returns {{total: number, detail: Object}} Total des cotisations et détail
 */
export function calculerCotisationsPension(pensionBruteMensuelle) {
  const csg = pensionBruteMensuelle * (COTISATIONS.CSG / 100);
  const crds = pensionBruteMensuelle * (COTISATIONS.CRDS / 100);
  const casa = pensionBruteMensuelle * (COTISATIONS.CASA / 100);

  const total = csg + crds + casa;

  return {
    total: Math.round(total * 100) / 100,
    detail: {
      csg: Math.round(csg * 100) / 100,
      crds: Math.round(crds * 100) / 100,
      casa: Math.round(casa * 100) / 100,
    },
  };
}

/**
 * Calcule la pension nette estimée
 * @param {number} pensionBruteMensuelle - Pension brute mensuelle
 * @returns {number} Pension nette mensuelle estimée
 */
export function calculerPensionNette(pensionBruteMensuelle) {
  const cotisations = calculerCotisationsPension(pensionBruteMensuelle);
  return Math.round((pensionBruteMensuelle - cotisations.total) * 100) / 100;
}

/**
 * Effectue le calcul complet de la pension
 * @param {DonneesPension} donnees - Données pour le calcul
 * @returns {ResultatPension} Résultat complet du calcul
 */
export function calculerPension(donnees) {
  const {
    indiceBrut,
    trimestresLiquidables,
    trimestresAssurance,
    trimestresRequis,
    dateNaissance,
    dateDepart,
  } = donnees;

  // Calcul du traitement indiciaire
  const traitement = calculerTraitementIndiciaire(indiceBrut);

  // Calcul du taux de liquidation brut
  const tauxLiquidationBrut = calculerTauxLiquidationBrut(trimestresLiquidables, trimestresRequis);

  // Calcul de la décote
  const trimestresDecote = calculerTrimestresDecote(
    dateNaissance,
    dateDepart,
    trimestresAssurance,
    trimestresRequis
  );
  const coefficientDecote = calculerCoefficientDecote(trimestresDecote);

  // Calcul du taux net
  const tauxLiquidationNet = calculerTauxLiquidationNet(tauxLiquidationBrut, coefficientDecote);

  // Calcul de la pension brute
  const pensionBrute = calculerPensionBrute(traitement.annuel, tauxLiquidationNet);

  // Vérification du minimum garanti
  const minimumGaranti = calculerMinimumGaranti(trimestresLiquidables, trimestresRequis);
  const minimumGarantiApplique = pensionBrute.mensuel < minimumGaranti;

  // Pension finale (avec minimum garanti si applicable)
  const pensionBruteMensuelleFinale = minimumGarantiApplique
    ? minimumGaranti
    : pensionBrute.mensuel;
  const pensionBruteAnnuelleFinale = pensionBruteMensuelleFinale * 12;

  // Calcul de la pension nette
  const pensionNetteMensuelle = calculerPensionNette(pensionBruteMensuelleFinale);

  return {
    traitementIndiciaireAnnuel: traitement.annuel,
    traitementIndicaireMensuel: traitement.mensuel,
    tauxLiquidationBrut: Math.round(tauxLiquidationBrut * 100) / 100,
    coefficientDecote: Math.round(coefficientDecote * 10000) / 10000,
    trimestresDecote,
    tauxLiquidationNet: Math.round(tauxLiquidationNet * 100) / 100,
    pensionBruteAnnuelle: Math.round(pensionBruteAnnuelleFinale * 100) / 100,
    pensionBruteMensuelle: Math.round(pensionBruteMensuelleFinale * 100) / 100,
    pensionNetteMensuelle,
    minimumGaranti: Math.round(minimumGaranti * 100) / 100,
    minimumGarantiApplique,
  };
}

/**
 * Calcule la pension pour plusieurs scénarios de départ
 * @param {Object} donneesBase - Données de base (profil, durées)
 * @param {Array} scenarios - Liste des scénarios de départ
 * @returns {Array} Liste des résultats de pension par scénario
 */
export function calculerPensionsMultiScenarios(donneesBase, scenarios) {
  return scenarios.map((scenario) => {
    const resultatPension = calculerPension({
      indiceBrut: donneesBase.indiceBrut,
      trimestresLiquidables: scenario.trimestresLiquidables,
      trimestresAssurance: scenario.trimestresAssurance,
      trimestresRequis: donneesBase.trimestresRequis,
      dateNaissance: donneesBase.dateNaissance,
      dateDepart: scenario.date,
    });

    return {
      scenario,
      pension: resultatPension,
    };
  });
}

/**
 * Génère un résumé du calcul de pension
 * @param {ResultatPension} resultat - Résultat du calcul
 * @returns {Object} Résumé formaté
 */
export function genererResumePension(resultat) {
  return {
    tauxLiquidation: `${resultat.tauxLiquidationNet.toFixed(2)} %`,
    decote: resultat.trimestresDecote > 0
      ? `${resultat.trimestresDecote} trimestre(s) = -${(resultat.trimestresDecote * TAUX.DECOTE_PAR_TRIMESTRE).toFixed(2)} %`
      : 'Aucune',
    pensionBruteMensuelle: resultat.pensionBruteMensuelle.toFixed(2) + ' €',
    pensionNetteMensuelle: resultat.pensionNetteMensuelle.toFixed(2) + ' €',
    minimumGaranti: resultat.minimumGarantiApplique
      ? `Appliqué (${resultat.minimumGaranti.toFixed(2)} €)`
      : 'Non applicable',
  };
}

/**
 * Estime le coût de chaque trimestre de décote
 * @param {number} traitementIndiciaire - Traitement indiciaire annuel
 * @param {number} tauxLiquidationBrut - Taux de liquidation brut
 * @returns {number} Perte mensuelle par trimestre de décote
 */
export function estimerCoutTrimestreDecote(traitementIndiciaire, tauxLiquidationBrut) {
  // Perte = TI × Taux × 1.25% / 12
  const perteMensuelle = (traitementIndiciaire * (tauxLiquidationBrut / 100) * (TAUX.DECOTE_PAR_TRIMESTRE / 100)) / 12;
  return Math.round(perteMensuelle * 100) / 100;
}
