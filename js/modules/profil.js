/**
 * Module Profil - Gestion du profil de l'agent SPP
 *
 * Ce module gère la création et la validation du profil de l'agent,
 * incluant les informations personnelles et de carrière de base.
 *
 * @module modules/profil
 */

import { getDureeAssuranceRequise, getMajorationSPV } from '../config/parametres.js';
import { calculerAge, extraireAnneeNaissance } from '../utils/dates.js';
import { validerProfil } from '../utils/validators.js';

/**
 * Profil d'un agent SPP
 * @typedef {Object} ProfilAgent
 * @property {Date} dateNaissance - Date de naissance
 * @property {number} anneeNaissance - Année de naissance
 * @property {Date} dateEntreeSPP - Date d'entrée en qualité de SPP
 * @property {number} quotite - Quotité de travail (1 = temps plein)
 * @property {number} anneesSPV - Années d'engagement SPV reconnues
 * @property {number} indiceBrut - Indice brut actuel
 * @property {number} pointsNBI - Points NBI éventuels
 * @property {number} enfantsAvant2004 - Nombre d'enfants nés avant 2004
 */

/**
 * Profil enrichi avec les données calculées
 * @typedef {Object} ProfilEnrichi
 * @property {ProfilAgent} donnees - Données brutes du profil
 * @property {number} generation - Génération pour la durée d'assurance
 * @property {number} dureeAssuranceRequise - Trimestres requis pour le taux plein
 * @property {number} majorationSPV - Trimestres de majoration SPV
 * @property {number} ageActuel - Âge actuel en années
 * @property {boolean} valide - Profil valide ou non
 * @property {Object} erreurs - Erreurs de validation éventuelles
 */

/**
 * Crée un profil agent vide avec les valeurs par défaut
 * @returns {ProfilAgent} Profil vide initialisé
 */
export function creerProfilVide() {
  return {
    dateNaissance: null,
    anneeNaissance: null,
    dateEntreeSPP: null,
    quotite: 1,
    anneesSPV: 0,
    indiceBrut: null,
    pointsNBI: 0,
    enfantsAvant2004: 0,
  };
}

/**
 * Crée un profil agent à partir des données saisies
 * @param {Object} donnees - Données du formulaire
 * @returns {ProfilAgent} Profil créé
 */
export function creerProfil(donnees) {
  const profil = creerProfilVide();

  // Extraction de l'année de naissance si date complète fournie
  if (donnees.dateNaissance) {
    profil.dateNaissance = donnees.dateNaissance instanceof Date
      ? donnees.dateNaissance
      : new Date(donnees.dateNaissance);
    profil.anneeNaissance = extraireAnneeNaissance(profil.dateNaissance);
  } else if (donnees.anneeNaissance) {
    profil.anneeNaissance = parseInt(donnees.anneeNaissance, 10);
    // Créer une date approximative au 1er juillet
    profil.dateNaissance = new Date(profil.anneeNaissance, 6, 1);
  }

  // Date d'entrée SPP
  if (donnees.dateEntreeSPP) {
    profil.dateEntreeSPP = donnees.dateEntreeSPP instanceof Date
      ? donnees.dateEntreeSPP
      : new Date(donnees.dateEntreeSPP);
  }

  // Quotité de travail
  if (donnees.quotite !== undefined) {
    profil.quotite = parseFloat(donnees.quotite);
  }

  // Années SPV
  if (donnees.anneesSPV !== undefined) {
    profil.anneesSPV = parseInt(donnees.anneesSPV, 10) || 0;
  }

  // Indice brut
  if (donnees.indiceBrut !== undefined) {
    profil.indiceBrut = parseInt(donnees.indiceBrut, 10);
  }

  // Points NBI
  if (donnees.pointsNBI !== undefined) {
    profil.pointsNBI = parseInt(donnees.pointsNBI, 10) || 0;
  }

  // Enfants avant 2004
  if (donnees.enfantsAvant2004 !== undefined) {
    profil.enfantsAvant2004 = parseInt(donnees.enfantsAvant2004, 10) || 0;
  }

  return profil;
}

/**
 * Enrichit un profil avec les données calculées
 * @param {ProfilAgent} profil - Profil de base
 * @returns {ProfilEnrichi} Profil enrichi avec les calculs
 */
export function enrichirProfil(profil) {
  const validation = validerProfil(profil);

  // Calcul de la génération et durée d'assurance requise
  const generation = profil.anneeNaissance;
  const dureeAssuranceRequise = generation ? getDureeAssuranceRequise(generation) : null;

  // Calcul de la majoration SPV
  const majorationSPV = getMajorationSPV(profil.anneesSPV || 0);

  // Calcul de l'âge actuel
  const ageActuel = profil.dateNaissance ? calculerAge(profil.dateNaissance) : null;

  return {
    donnees: { ...profil },
    generation,
    dureeAssuranceRequise,
    majorationSPV,
    ageActuel,
    valide: validation.valide,
    erreurs: validation.erreurs,
  };
}

/**
 * Met à jour un profil existant avec de nouvelles données
 * @param {ProfilAgent} profilExistant - Profil à mettre à jour
 * @param {Object} nouvellesDonnees - Nouvelles données à fusionner
 * @returns {ProfilEnrichi} Profil mis à jour et enrichi
 */
export function mettreAJourProfil(profilExistant, nouvellesDonnees) {
  const profilMisAJour = creerProfil({
    ...profilExistant,
    ...nouvellesDonnees,
  });

  return enrichirProfil(profilMisAJour);
}

/**
 * Vérifie si un profil est complet pour la simulation
 * @param {ProfilAgent} profil - Profil à vérifier
 * @returns {{complet: boolean, champsManquants: string[]}} Résultat de la vérification
 */
export function verifierProfilComplet(profil) {
  const champsManquants = [];

  if (!profil.dateNaissance && !profil.anneeNaissance) {
    champsManquants.push('Date ou année de naissance');
  }

  if (!profil.dateEntreeSPP) {
    champsManquants.push("Date d'entrée SPP");
  }

  if (!profil.indiceBrut) {
    champsManquants.push('Indice brut');
  }

  return {
    complet: champsManquants.length === 0,
    champsManquants,
  };
}

/**
 * Calcule le résumé du profil pour affichage
 * @param {ProfilEnrichi} profilEnrichi - Profil enrichi
 * @returns {Object} Résumé formaté du profil
 */
export function obtenirResumeProfil(profilEnrichi) {
  const { donnees, generation, dureeAssuranceRequise, majorationSPV, ageActuel } = profilEnrichi;

  return {
    ageActuel: ageActuel !== null ? `${ageActuel} ans` : '-',
    generation: generation || '-',
    dureeRequise: dureeAssuranceRequise
      ? `${dureeAssuranceRequise} trimestres (${dureeAssuranceRequise / 4} ans)`
      : '-',
    quotite: donnees.quotite === 1 ? 'Temps plein' : `${Math.round(donnees.quotite * 100)}%`,
    experienceSPV: donnees.anneesSPV > 0
      ? `${donnees.anneesSPV} ans (+${majorationSPV} trimestre${majorationSPV > 1 ? 's' : ''})`
      : 'Non',
    indiceBrut: donnees.indiceBrut || '-',
    pointsNBI: donnees.pointsNBI > 0 ? donnees.pointsNBI : 'Non',
  };
}

/**
 * Exporte le profil au format JSON pour sauvegarde
 * @param {ProfilAgent} profil - Profil à exporter
 * @returns {string} Profil au format JSON
 */
export function exporterProfil(profil) {
  const profilExport = {
    ...profil,
    dateNaissance: profil.dateNaissance?.toISOString(),
    dateEntreeSPP: profil.dateEntreeSPP?.toISOString(),
  };

  return JSON.stringify(profilExport, null, 2);
}

/**
 * Importe un profil depuis un JSON
 * @param {string} json - JSON du profil
 * @returns {ProfilEnrichi|null} Profil importé et enrichi, ou null si invalide
 */
export function importerProfil(json) {
  try {
    const donnees = JSON.parse(json);

    // Reconvertir les dates
    if (donnees.dateNaissance) {
      donnees.dateNaissance = new Date(donnees.dateNaissance);
    }
    if (donnees.dateEntreeSPP) {
      donnees.dateEntreeSPP = new Date(donnees.dateEntreeSPP);
    }

    const profil = creerProfil(donnees);
    return enrichirProfil(profil);
  } catch (e) {
    console.error('Erreur lors de l\'importation du profil:', e);
    return null;
  }
}
