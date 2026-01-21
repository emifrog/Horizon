/**
 * Utilitaires de formatage pour l'affichage
 *
 * @module utils/formatters
 */

/**
 * Formate un montant en euros
 * @param {number} montant - Montant à formater
 * @param {Object} [options] - Options de formatage
 * @param {number} [options.decimales=2] - Nombre de décimales
 * @param {boolean} [options.symbole=true] - Afficher le symbole €
 * @returns {string} Montant formaté
 */
export function formaterMontant(montant, options = {}) {
  const { decimales = 2, symbole = true } = options;

  if (typeof montant !== 'number' || isNaN(montant)) {
    return symbole ? '- €' : '-';
  }

  const formatter = new Intl.NumberFormat('fr-FR', {
    style: symbole ? 'currency' : 'decimal',
    currency: 'EUR',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

  return formatter.format(montant);
}

/**
 * Formate un montant mensuel avec mention
 * @param {number} montant - Montant mensuel
 * @returns {string} Montant formaté avec "/mois"
 */
export function formaterMontantMensuel(montant) {
  return `${formaterMontant(montant)}/mois`;
}

/**
 * Formate un montant annuel avec mention
 * @param {number} montant - Montant annuel
 * @returns {string} Montant formaté avec "/an"
 */
export function formaterMontantAnnuel(montant) {
  return `${formaterMontant(montant)}/an`;
}

/**
 * Formate un pourcentage
 * @param {number} valeur - Valeur à formater (ex: 75 pour 75%)
 * @param {Object} [options] - Options de formatage
 * @param {number} [options.decimales=2] - Nombre de décimales
 * @returns {string} Pourcentage formaté
 */
export function formaterPourcentage(valeur, options = {}) {
  const { decimales = 2 } = options;

  if (typeof valeur !== 'number' || isNaN(valeur)) {
    return '- %';
  }

  return `${valeur.toFixed(decimales).replace('.', ',')} %`;
}

/**
 * Formate un nombre avec séparateurs de milliers
 * @param {number} nombre - Nombre à formater
 * @param {number} [decimales=0] - Nombre de décimales
 * @returns {string} Nombre formaté
 */
export function formaterNombre(nombre, decimales = 0) {
  if (typeof nombre !== 'number' || isNaN(nombre)) {
    return '-';
  }

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(nombre);
}

/**
 * Formate un indice (sans décimales)
 * @param {number} indice - Indice à formater
 * @returns {string} Indice formaté
 */
export function formaterIndice(indice) {
  if (typeof indice !== 'number' || isNaN(indice)) {
    return '-';
  }
  return Math.round(indice).toString();
}

/**
 * Formate un nombre de trimestres de manière concise
 * @param {number} trimestres - Nombre de trimestres
 * @returns {string} Texte formaté (ex: "172 trim." ou "43 ans")
 */
export function formaterTrimestres(trimestres) {
  if (typeof trimestres !== 'number' || isNaN(trimestres)) {
    return '-';
  }

  if (trimestres % 4 === 0) {
    return `${trimestres / 4} ans`;
  }

  return `${trimestres} trim.`;
}

/**
 * Formate un âge en années
 * @param {number} age - Âge en années
 * @returns {string} Âge formaté
 */
export function formaterAge(age) {
  if (typeof age !== 'number' || isNaN(age)) {
    return '-';
  }
  return `${Math.floor(age)} an${Math.floor(age) > 1 ? 's' : ''}`;
}

/**
 * Formate un écart de trimestres (positif ou négatif)
 * @param {number} ecart - Écart en trimestres
 * @returns {string} Écart formaté avec signe
 */
export function formaterEcartTrimestres(ecart) {
  if (typeof ecart !== 'number' || isNaN(ecart)) {
    return '-';
  }

  const signe = ecart >= 0 ? '+' : '';
  const annees = Math.floor(Math.abs(ecart) / 4);
  const trimestres = Math.abs(ecart) % 4;

  if (annees === 0) {
    return `${signe}${ecart} trimestre${Math.abs(ecart) > 1 ? 's' : ''}`;
  }

  if (trimestres === 0) {
    return `${signe}${ecart >= 0 ? annees : -annees} an${annees > 1 ? 's' : ''}`;
  }

  const signeAnnees = ecart >= 0 ? '+' : '-';
  return `${signeAnnees}${annees} an${annees > 1 ? 's' : ''} ${trimestres} trim.`;
}

/**
 * Formate une variation de taux
 * @param {number} variation - Variation en points de pourcentage
 * @returns {string} Variation formatée avec signe et couleur CSS
 */
export function formaterVariationTaux(variation) {
  if (typeof variation !== 'number' || isNaN(variation)) {
    return '-';
  }

  const signe = variation >= 0 ? '+' : '';
  return `${signe}${variation.toFixed(2).replace('.', ',')} %`;
}

/**
 * Formate un ratio de temps partiel
 * @param {number} quotite - Quotité (ex: 0.8 pour 80%)
 * @returns {string} Quotité formatée
 */
export function formaterQuotite(quotite) {
  if (typeof quotite !== 'number' || isNaN(quotite)) {
    return '-';
  }

  if (quotite === 1) {
    return 'Temps plein';
  }

  return `${Math.round(quotite * 100)} %`;
}

/**
 * Pluralise un mot selon le nombre
 * @param {number} nombre - Nombre pour déterminer le pluriel
 * @param {string} singulier - Forme singulière
 * @param {string} [pluriel] - Forme plurielle (par défaut: singulier + 's')
 * @returns {string} Mot pluralisé
 */
export function pluraliser(nombre, singulier, pluriel = null) {
  if (Math.abs(nombre) <= 1) {
    return singulier;
  }
  return pluriel || `${singulier}s`;
}

/**
 * Formate un texte avec nombre et mot pluralisé
 * @param {number} nombre - Nombre à afficher
 * @param {string} singulier - Forme singulière du mot
 * @param {string} [pluriel] - Forme plurielle (optionnel)
 * @returns {string} Texte formaté
 */
export function formaterAvecPluriel(nombre, singulier, pluriel = null) {
  return `${formaterNombre(nombre)} ${pluraliser(nombre, singulier, pluriel)}`;
}
