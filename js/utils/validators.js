/**
 * Utilitaires de validation des saisies utilisateur
 *
 * @module utils/validators
 */

import { ECHELLE_INDICIAIRE, AGES, PFR, POINT_INDICE } from '../config/parametres.js';

/**
 * Résultat de validation
 * @typedef {Object} ValidationResult
 * @property {boolean} valide - True si la validation a réussi
 * @property {string} [erreur] - Message d'erreur si invalide
 */

/**
 * Valide une année de naissance
 * @param {number} annee - Année de naissance
 * @returns {ValidationResult} Résultat de la validation
 */
export function validerAnneeNaissance(annee) {
  const anneeActuelle = new Date().getFullYear();
  const ageMin = 18;
  const ageMax = AGES.LIMITE_SEDENTAIRE + 5; // Marge pour les cas particuliers

  if (!Number.isInteger(annee)) {
    return { valide: false, erreur: "L'année de naissance doit être un nombre entier" };
  }

  const anneeMin = anneeActuelle - ageMax;
  const anneeMax = anneeActuelle - ageMin;

  if (annee < anneeMin) {
    return { valide: false, erreur: `L'année de naissance ne peut pas être antérieure à ${anneeMin}` };
  }

  if (annee > anneeMax) {
    return { valide: false, erreur: `Vous devez avoir au moins ${ageMin} ans` };
  }

  return { valide: true };
}

/**
 * Valide une date de naissance
 * @param {Date} date - Date de naissance
 * @returns {ValidationResult} Résultat de la validation
 */
export function validerDateNaissance(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return { valide: false, erreur: 'Date de naissance invalide' };
  }

  const resultatAnnee = validerAnneeNaissance(date.getFullYear());
  if (!resultatAnnee.valide) {
    return resultatAnnee;
  }

  const aujourdhui = new Date();
  if (date > aujourdhui) {
    return { valide: false, erreur: 'La date de naissance ne peut pas être dans le futur' };
  }

  return { valide: true };
}

/**
 * Valide une date d'entrée dans la fonction publique
 * @param {Date} dateEntree - Date d'entrée
 * @param {Date} dateNaissance - Date de naissance (pour vérifier la cohérence)
 * @returns {ValidationResult} Résultat de la validation
 */
export function validerDateEntree(dateEntree, dateNaissance) {
  if (!(dateEntree instanceof Date) || isNaN(dateEntree.getTime())) {
    return { valide: false, erreur: "Date d'entrée invalide" };
  }

  const aujourdhui = new Date();
  if (dateEntree > aujourdhui) {
    return { valide: false, erreur: "La date d'entrée ne peut pas être dans le futur" };
  }

  if (dateNaissance) {
    const ageEntree = dateEntree.getFullYear() - dateNaissance.getFullYear();
    if (ageEntree < 16) {
      return { valide: false, erreur: "L'âge d'entrée dans la fonction publique ne peut pas être inférieur à 16 ans" };
    }
  }

  // Date minimale raisonnable (1970)
  if (dateEntree.getFullYear() < 1970) {
    return { valide: false, erreur: "La date d'entrée semble trop ancienne" };
  }

  return { valide: true };
}

/**
 * Valide un indice brut
 * @param {number} indice - Indice brut
 * @returns {ValidationResult} Résultat de la validation
 */
export function validerIndiceBrut(indice) {
  if (!Number.isInteger(indice)) {
    return { valide: false, erreur: "L'indice doit être un nombre entier" };
  }

  if (indice < ECHELLE_INDICIAIRE.MIN) {
    return { valide: false, erreur: `L'indice minimum est ${ECHELLE_INDICIAIRE.MIN}` };
  }

  if (indice > ECHELLE_INDICIAIRE.MAX) {
    return { valide: false, erreur: `L'indice maximum est ${ECHELLE_INDICIAIRE.MAX}` };
  }

  return { valide: true };
}

/**
 * Valide un nombre de trimestres
 * @param {number} trimestres - Nombre de trimestres
 * @param {Object} [options] - Options de validation
 * @param {number} [options.min=0] - Minimum autorisé
 * @param {number} [options.max=250] - Maximum autorisé
 * @returns {ValidationResult} Résultat de la validation
 */
export function validerTrimestres(trimestres, options = {}) {
  const { min = 0, max = 250 } = options;

  if (!Number.isInteger(trimestres)) {
    return { valide: false, erreur: 'Le nombre de trimestres doit être un entier' };
  }

  if (trimestres < min) {
    return { valide: false, erreur: `Le nombre de trimestres ne peut pas être inférieur à ${min}` };
  }

  if (trimestres > max) {
    return { valide: false, erreur: `Le nombre de trimestres ne peut pas dépasser ${max}` };
  }

  return { valide: true };
}

/**
 * Valide une quotité de temps partiel
 * @param {number} quotite - Quotité (entre 0 et 1)
 * @returns {ValidationResult} Résultat de la validation
 */
export function validerQuotite(quotite) {
  if (typeof quotite !== 'number' || isNaN(quotite)) {
    return { valide: false, erreur: 'La quotité doit être un nombre' };
  }

  if (quotite < 0.5) {
    return { valide: false, erreur: 'La quotité minimale est de 50%' };
  }

  if (quotite > 1) {
    return { valide: false, erreur: 'La quotité ne peut pas dépasser 100%' };
  }

  return { valide: true };
}

/**
 * Valide un nombre d'années d'engagement SPV
 * @param {number} annees - Nombre d'années
 * @returns {ValidationResult} Résultat de la validation
 */
export function validerAnneesSPV(annees) {
  if (typeof annees !== 'number' || isNaN(annees)) {
    return { valide: false, erreur: "Le nombre d'années SPV doit être un nombre" };
  }

  if (annees < 0) {
    return { valide: false, erreur: "Le nombre d'années SPV ne peut pas être négatif" };
  }

  if (annees > 50) {
    return { valide: false, erreur: "Le nombre d'années SPV semble excessif" };
  }

  if (!Number.isInteger(annees)) {
    return { valide: false, erreur: "Le nombre d'années SPV doit être un entier" };
  }

  return { valide: true };
}

/**
 * Valide un nombre de points NBI
 * @param {number} points - Nombre de points NBI
 * @returns {ValidationResult} Résultat de la validation
 */
export function validerPointsNBI(points) {
  if (!Number.isInteger(points)) {
    return { valide: false, erreur: 'Le nombre de points NBI doit être un entier' };
  }

  if (points < 0) {
    return { valide: false, erreur: 'Le nombre de points NBI ne peut pas être négatif' };
  }

  if (points > 200) {
    return { valide: false, erreur: 'Le nombre de points NBI semble excessif (max usuel: 60)' };
  }

  return { valide: true };
}

/**
 * Valide un montant (positif)
 * @param {number} montant - Montant à valider
 * @param {Object} [options] - Options de validation
 * @param {number} [options.min=0] - Montant minimum
 * @param {number} [options.max] - Montant maximum
 * @returns {ValidationResult} Résultat de la validation
 */
export function validerMontant(montant, options = {}) {
  const { min = 0, max = Infinity } = options;

  if (typeof montant !== 'number' || isNaN(montant)) {
    return { valide: false, erreur: 'Le montant doit être un nombre' };
  }

  if (montant < min) {
    return { valide: false, erreur: `Le montant ne peut pas être inférieur à ${min} €` };
  }

  if (montant > max) {
    return { valide: false, erreur: `Le montant ne peut pas dépasser ${max} €` };
  }

  return { valide: true };
}

/**
 * Valide un nombre d'enfants
 * @param {number} nombreEnfants - Nombre d'enfants
 * @returns {ValidationResult} Résultat de la validation
 */
export function validerNombreEnfants(nombreEnfants) {
  if (!Number.isInteger(nombreEnfants)) {
    return { valide: false, erreur: "Le nombre d'enfants doit être un entier" };
  }

  if (nombreEnfants < 0) {
    return { valide: false, erreur: "Le nombre d'enfants ne peut pas être négatif" };
  }

  if (nombreEnfants > 20) {
    return { valide: false, erreur: "Le nombre d'enfants semble excessif" };
  }

  return { valide: true };
}

/**
 * Valide un formulaire complet de profil
 * @param {Object} profil - Données du profil
 * @returns {{valide: boolean, erreurs: Object}} Résultat global et erreurs par champ
 */
export function validerProfil(profil) {
  const erreurs = {};

  // Validation date de naissance
  if (profil.dateNaissance) {
    const resultat = validerDateNaissance(profil.dateNaissance);
    if (!resultat.valide) {
      erreurs.dateNaissance = resultat.erreur;
    }
  } else if (profil.anneeNaissance) {
    const resultat = validerAnneeNaissance(profil.anneeNaissance);
    if (!resultat.valide) {
      erreurs.anneeNaissance = resultat.erreur;
    }
  }

  // Validation date d'entrée SPP
  // Le champ canonique dans ProfilAgent est `dateEntreeSPP` ; `dateEntree` est accepté
  // par rétro-compatibilité au cas où un appelant transmettrait l'ancienne clé.
  const dateEntreeValeur = profil.dateEntreeSPP ?? profil.dateEntree;
  if (dateEntreeValeur) {
    const resultat = validerDateEntree(dateEntreeValeur, profil.dateNaissance);
    if (!resultat.valide) {
      erreurs.dateEntreeSPP = resultat.erreur;
    }
  }

  // Validation indice (seulement si renseigné)
  if (profil.indiceBrut !== undefined && profil.indiceBrut !== null) {
    const resultat = validerIndiceBrut(profil.indiceBrut);
    if (!resultat.valide) {
      erreurs.indiceBrut = resultat.erreur;
    }
  }

  // Validation quotité
  if (profil.quotite !== undefined) {
    const resultat = validerQuotite(profil.quotite);
    if (!resultat.valide) {
      erreurs.quotite = resultat.erreur;
    }
  }

  // Validation années SPV
  if (profil.anneesSPV !== undefined) {
    const resultat = validerAnneesSPV(profil.anneesSPV);
    if (!resultat.valide) {
      erreurs.anneesSPV = resultat.erreur;
    }
  }

  return {
    valide: Object.keys(erreurs).length === 0,
    erreurs,
  };
}

// =============================================================================
// VALIDATIONS CROSS-FIELD
// =============================================================================

/**
 * Nombre d'années entre deux dates (positif si d2 > d1).
 * @param {Date} d1
 * @param {Date} d2
 * @returns {number}
 */
function anneesEntre(d1, d2) {
  return (d2.getTime() - d1.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

/**
 * Vérifie la cohérence transversale d'un ensemble de données de simulation.
 * Les contrôles mono-champ (plages, types) sont assurés par les autres validers ;
 * cette fonction détecte les incohérences entre plusieurs champs, ex :
 *  - dateEntreeSPP antérieure à la majorité de l'agent
 *  - durée de perception NBI supérieure à l'ancienneté
 *  - PFR saisi bien plus élevé que le plafond théorique (erreur de saisie)
 *
 * Retourne un objet par champ contenant des messages d'avertissement ou d'erreur.
 * Les avertissements (warning) n'empêchent pas le calcul, les erreurs oui.
 *
 * @param {Object} donnees - Données collectées du formulaire
 * @param {Date} [donnees.dateNaissance]
 * @param {Date} [donnees.dateEntreeSPP]
 * @param {number} [donnees.indiceBrut]
 * @param {number} [donnees.montantPFR]     Montant ANNUEL
 * @param {number} [donnees.dureeNBI]        En ANNÉES
 * @param {number} [donnees.anneesCotisationRAFP]
 * @param {number} [donnees.anneesSPV]
 * @param {boolean} [donnees.doubleStatut]
 * @param {string} [donnees.servicesMilitaires]   'aucun' | 'bspp' | 'bmpm'
 * @param {number} [donnees.dureeServicesMilitairesAnnees]
 * @param {number} [donnees.dureeServicesMilitairesMois]
 * @returns {{valide: boolean, erreurs: Object<string, string>, warnings: Object<string, string>}}
 */
export function validerCoherenceProfil(donnees) {
  const erreurs = {};
  const warnings = {};
  const maintenant = new Date();

  const { dateNaissance, dateEntreeSPP } = donnees;

  // --- Cohérence naissance / entrée SPP ---
  if (dateNaissance instanceof Date && !isNaN(dateNaissance.getTime())
    && dateEntreeSPP instanceof Date && !isNaN(dateEntreeSPP.getTime())) {

    if (dateEntreeSPP < dateNaissance) {
      erreurs.dateEntreeSPP = "La date d'entrée SPP est antérieure à la date de naissance.";
    } else {
      const ageEntree = anneesEntre(dateNaissance, dateEntreeSPP);
      if (ageEntree < 16) {
        erreurs.dateEntreeSPP = `Entrée SPP à ${ageEntree.toFixed(1)} ans : âge minimum légal en catégorie active = 16 ans.`;
      } else if (ageEntree < 18) {
        warnings.dateEntreeSPP = `Entrée SPP à ${ageEntree.toFixed(1)} ans : vérifiez la date (entrée active usuelle ≥ 18 ans).`;
      } else if (ageEntree > 50) {
        warnings.dateEntreeSPP = `Entrée SPP à ${ageEntree.toFixed(0)} ans : valeur inhabituelle, vérifiez la saisie.`;
      }
    }
  }

  // --- Durée NBI ≤ ancienneté SPP ---
  if (typeof donnees.dureeNBI === 'number' && donnees.dureeNBI > 0
    && dateEntreeSPP instanceof Date && !isNaN(dateEntreeSPP.getTime())) {
    const ancienneteAnnees = anneesEntre(dateEntreeSPP, maintenant);
    if (donnees.dureeNBI > ancienneteAnnees + 0.25) {
      erreurs.dureeNBI = `Durée de perception NBI (${donnees.dureeNBI} ans) supérieure à l'ancienneté SPP (${ancienneteAnnees.toFixed(1)} ans).`;
    }
  }

  // --- Années de cotisation RAFP cohérentes ---
  // RAFP créé le 01/01/2005, cotisations = max(2005, entrée SPP) → aujourd'hui
  if (typeof donnees.anneesCotisationRAFP === 'number' && donnees.anneesCotisationRAFP > 0
    && dateEntreeSPP instanceof Date && !isNaN(dateEntreeSPP.getTime())) {
    const creationRAFP = new Date(PFR.ANNEE_CREATION_RAFP, 0, 1);
    const debutRAFP = dateEntreeSPP > creationRAFP ? dateEntreeSPP : creationRAFP;
    const maxCotisationRAFP = Math.max(0, anneesEntre(debutRAFP, maintenant));
    if (donnees.anneesCotisationRAFP > maxCotisationRAFP + 0.5) {
      warnings.anneesCotisationRAFP = `Années RAFP (${donnees.anneesCotisationRAFP}) > plafond théorique (${maxCotisationRAFP.toFixed(1)}). Recalcul auto recommandé.`;
    }
  }

  // --- Montant PFR cohérent avec l'indice ---
  // La prime de feu théorique = TIB × 25 %. Au-delà de 30 % du TIB, probable erreur de saisie.
  if (typeof donnees.montantPFR === 'number' && donnees.montantPFR > 0
    && typeof donnees.indiceBrut === 'number' && donnees.indiceBrut > 0) {
    const tibAnnuel = donnees.indiceBrut * POINT_INDICE.VALEUR_ANNUELLE;
    const plafondRaisonnable = tibAnnuel * 0.30; // Marge au-delà des 25 % réglementaires
    if (donnees.montantPFR > plafondRaisonnable) {
      warnings.montantPFR = `PFR annuelle (${donnees.montantPFR} €) > 30 % du TIB (${plafondRaisonnable.toFixed(0)} €). Vérifiez que le montant est bien annuel.`;
    }
    // PFR trop faible : moins de 10 % du TIB = probablement mensuelle saisie à tort
    const seuilFaible = tibAnnuel * 0.10;
    if (donnees.montantPFR < seuilFaible && donnees.montantPFR > 100) {
      warnings.montantPFR = `PFR annuelle (${donnees.montantPFR} €) < 10 % du TIB. Saisi-e par erreur en mensuel ?`;
    }
  }

  // --- Années SPV cohérentes avec la vie professionnelle ---
  if (typeof donnees.anneesSPV === 'number' && donnees.anneesSPV > 0
    && dateNaissance instanceof Date && !isNaN(dateNaissance.getTime())) {
    const ageActuel = anneesEntre(dateNaissance, maintenant);
    // Engagement SPV possible dès 16 ans
    const maxSPV = Math.max(0, ageActuel - 16);
    if (donnees.anneesSPV > maxSPV + 1) {
      erreurs.anneesSPV = `Années SPV (${donnees.anneesSPV}) incompatibles avec l'âge (${ageActuel.toFixed(0)} ans, maximum ~${maxSPV.toFixed(0)} ans).`;
    }
  }

  // --- Services militaires : cohérence "type" vs "durée" ---
  if (donnees.servicesMilitaires && donnees.servicesMilitaires !== 'aucun') {
    const annees = donnees.dureeServicesMilitairesAnnees || 0;
    const mois = donnees.dureeServicesMilitairesMois || 0;
    if (annees === 0 && mois === 0) {
      erreurs.dureeServicesMilitairesAnnees = `Type de services militaires renseigné (${donnees.servicesMilitaires.toUpperCase()}) sans durée — précisez les années ou mois.`;
    }
    if (mois >= 12) {
      warnings.dureeServicesMilitairesMois = 'Le champ "mois" devrait être < 12 ; convertir l\'excédent en années.';
    }
  }

  // --- Double statut sans années SPV ---
  if (donnees.doubleStatut === true && (!donnees.anneesSPV || donnees.anneesSPV < 1)) {
    erreurs.anneesSPV = 'Double statut SPP/SPV coché : précisez les années d\'engagement SPV.';
  }

  return {
    valide: Object.keys(erreurs).length === 0,
    erreurs,
    warnings,
  };
}

/**
 * Vérifie si une valeur est vide (null, undefined, chaîne vide)
 * @param {*} valeur - Valeur à vérifier
 * @returns {boolean} True si la valeur est vide
 */
export function estVide(valeur) {
  return valeur === null || valeur === undefined || valeur === '';
}

/**
 * Vérifie si une chaîne est un nombre valide
 * @param {string} str - Chaîne à vérifier
 * @returns {boolean} True si la chaîne représente un nombre valide
 */
export function estNombreValide(str) {
  if (typeof str !== 'string') return false;
  const num = parseFloat(str.replace(',', '.'));
  return !isNaN(num) && isFinite(num);
}
