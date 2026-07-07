/**
 * Utilitaires HTML partagés.
 *
 * @module utils/html
 */

/**
 * Échappe une valeur pour une insertion sûre dans du HTML ou du SVG.
 * Neutralise les caractères & < > " ' — utilisable aussi bien en contenu
 * qu'en valeur d'attribut. Barrière anti-XSS commune à toute l'interface.
 *
 * @param {*} value - Valeur à échapper (null/undefined → chaîne vide)
 * @returns {string} Texte échappé
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
