/**
 * Utilitaires de calcul et manipulation de dates
 *
 * @module utils/dates
 */

/**
 * Calcule l'âge en années à une date donnée
 * @param {Date} dateNaissance - Date de naissance
 * @param {Date} [dateReference=new Date()] - Date de référence (par défaut aujourd'hui)
 * @returns {number} Âge en années révolues
 */
export function calculerAge(dateNaissance, dateReference = new Date()) {
  let age = dateReference.getFullYear() - dateNaissance.getFullYear();
  const moisDiff = dateReference.getMonth() - dateNaissance.getMonth();

  if (moisDiff < 0 || (moisDiff === 0 && dateReference.getDate() < dateNaissance.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calcule la date à laquelle une personne atteindra un âge donné
 * @param {Date} dateNaissance - Date de naissance
 * @param {number} age - Âge à atteindre
 * @returns {Date} Date d'anniversaire correspondante
 */
export function dateAtteindreAge(dateNaissance, age) {
  const date = new Date(dateNaissance);
  date.setFullYear(date.getFullYear() + age);
  return date;
}

/**
 * Calcule le nombre de trimestres entre deux dates
 * @param {Date} dateDebut - Date de début
 * @param {Date} dateFin - Date de fin
 * @returns {number} Nombre de trimestres complets
 */
export function calculerTrimestresEntreDates(dateDebut, dateFin) {
  const moisTotal = calculerMoisEntreDates(dateDebut, dateFin);
  return Math.floor(moisTotal / 3);
}

/**
 * Calcule le nombre de mois entre deux dates
 * @param {Date} dateDebut - Date de début
 * @param {Date} dateFin - Date de fin
 * @returns {number} Nombre de mois complets
 */
export function calculerMoisEntreDates(dateDebut, dateFin) {
  const annees = dateFin.getFullYear() - dateDebut.getFullYear();
  const mois = dateFin.getMonth() - dateDebut.getMonth();
  const jours = dateFin.getDate() - dateDebut.getDate();

  let totalMois = annees * 12 + mois;
  if (jours < 0) {
    totalMois--;
  }

  return Math.max(0, totalMois);
}

/**
 * Calcule le nombre d'années complètes entre deux dates
 * @param {Date} dateDebut - Date de début
 * @param {Date} dateFin - Date de fin
 * @returns {number} Nombre d'années complètes
 */
export function calculerAnneesEntreDates(dateDebut, dateFin) {
  return Math.floor(calculerMoisEntreDates(dateDebut, dateFin) / 12);
}

/**
 * Convertit des trimestres en années et trimestres restants
 * @param {number} trimestres - Nombre total de trimestres
 * @returns {{annees: number, trimestres: number}} Décomposition en années/trimestres
 */
export function trimestresEnAnneesEtTrimestres(trimestres) {
  return {
    annees: Math.floor(trimestres / 4),
    trimestres: trimestres % 4,
  };
}

/**
 * Convertit des années et trimestres en trimestres totaux
 * @param {number} annees - Nombre d'années
 * @param {number} trimestres - Nombre de trimestres supplémentaires
 * @returns {number} Nombre total de trimestres
 */
export function anneesEtTrimestresEnTrimestres(annees, trimestres = 0) {
  return annees * 4 + trimestres;
}

/**
 * Formate une durée en trimestres de manière lisible
 * @param {number} trimestres - Nombre de trimestres
 * @returns {string} Chaîne formatée (ex: "15 ans et 2 trimestres")
 */
export function formaterDureeTrimestres(trimestres) {
  const { annees, trimestres: trim } = trimestresEnAnneesEtTrimestres(trimestres);

  if (annees === 0 && trim === 0) {
    return '0 trimestre';
  }

  const parties = [];

  if (annees > 0) {
    parties.push(`${annees} an${annees > 1 ? 's' : ''}`);
  }

  if (trim > 0) {
    parties.push(`${trim} trimestre${trim > 1 ? 's' : ''}`);
  }

  return parties.join(' et ');
}

/**
 * Ajoute des trimestres à une date
 * @param {Date} date - Date de départ
 * @param {number} trimestres - Nombre de trimestres à ajouter
 * @returns {Date} Nouvelle date
 */
export function ajouterTrimestres(date, trimestres) {
  const nouvelleDate = new Date(date);
  nouvelleDate.setMonth(nouvelleDate.getMonth() + trimestres * 3);
  return nouvelleDate;
}

/**
 * Retourne le premier jour du trimestre civil contenant la date
 * @param {Date} date - Date quelconque
 * @returns {Date} Premier jour du trimestre
 */
export function debutTrimestreCivil(date) {
  const mois = date.getMonth();
  const trimestreMois = Math.floor(mois / 3) * 3;
  return new Date(date.getFullYear(), trimestreMois, 1);
}

/**
 * Retourne le dernier jour du trimestre civil contenant la date
 * @param {Date} date - Date quelconque
 * @returns {Date} Dernier jour du trimestre
 */
export function finTrimestreCivil(date) {
  const mois = date.getMonth();
  const trimestreMois = Math.floor(mois / 3) * 3 + 2;
  return new Date(date.getFullYear(), trimestreMois + 1, 0);
}

/**
 * Vérifie si une date est valide
 * @param {*} date - Valeur à vérifier
 * @returns {boolean} True si la date est valide
 */
export function estDateValide(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Parse une chaîne de date au format français (JJ/MM/AAAA) ou ISO
 * @param {string} dateStr - Chaîne de date
 * @returns {Date|null} Date parsée ou null si invalide
 */
export function parseDateFR(dateStr) {
  if (!dateStr) return null;

  // Format ISO (AAAA-MM-JJ)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr);
    return estDateValide(date) ? date : null;
  }

  // Format français (JJ/MM/AAAA)
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, jour, mois, annee] = match;
    const date = new Date(parseInt(annee), parseInt(mois) - 1, parseInt(jour));
    return estDateValide(date) ? date : null;
  }

  return null;
}

/**
 * Formate une date au format français
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée (JJ/MM/AAAA)
 */
export function formaterDateFR(date) {
  if (!estDateValide(date)) return '';

  const jour = String(date.getDate()).padStart(2, '0');
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const annee = date.getFullYear();

  return `${jour}/${mois}/${annee}`;
}

/**
 * Formate une date au format long français
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée (ex: "15 janvier 2030")
 */
export function formaterDateLongueFR(date) {
  if (!estDateValide(date)) return '';

  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('fr-FR', options);
}

/**
 * Retourne l'année de naissance à partir d'une date de naissance
 * @param {Date|string} dateNaissance - Date de naissance
 * @returns {number|null} Année de naissance
 */
export function extraireAnneeNaissance(dateNaissance) {
  if (typeof dateNaissance === 'string') {
    dateNaissance = parseDateFR(dateNaissance);
  }
  return estDateValide(dateNaissance) ? dateNaissance.getFullYear() : null;
}
