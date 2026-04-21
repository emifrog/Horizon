/**
 * Utilitaires numériques pour les calculs monétaires
 *
 * Stratégie d'arrondi :
 * - Mode par défaut "commercial" (half-away-from-zero) : 0.005 → 0.01, -0.005 → -0.01
 *   C'est le mode attendu par l'utilisateur pour l'affichage de montants en euros.
 * - On arrondit uniquement à l'étape finale d'affichage ou de restitution vers l'appelant ;
 *   les calculs intermédiaires conservent toute la précision flottante disponible.
 *
 * @module utils/nombres
 */

/**
 * Arrondit un montant à un nombre de décimales donné.
 * Utilise l'arrondi commercial (half-away-from-zero) corrigé contre les
 * imprécisions flottantes (ex: 1.005 → 1.01 et non 1.00 comme `Math.round`
 * naïf le ferait sous IEEE 754).
 *
 * @param {number} valeur - Valeur à arrondir
 * @param {number} [decimales=2] - Nombre de décimales (2 par défaut pour les euros)
 * @returns {number} Valeur arrondie, ou 0 si `valeur` n'est pas un nombre fini
 */
export function arrondir(valeur, decimales = 2) {
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) {
    return 0;
  }
  // Correction IEEE 754 : 1.005 est stocké comme 1.00499999... ; sans compensation
  // Math.round(1.005 * 100) = 100 au lieu de 101 attendu.
  const facteur = 10 ** decimales;
  const signe = valeur < 0 ? -1 : 1;
  const absolu = Math.abs(valeur);
  return signe * Math.round((absolu + Number.EPSILON) * facteur) / facteur;
}

/**
 * Arrondit un montant monétaire à l'euro supérieur, inférieur ou au plus proche.
 * @param {number} valeur - Montant
 * @param {'up'|'down'|'nearest'} [mode='nearest']
 * @returns {number}
 */
export function arrondirEntier(valeur, mode = 'nearest') {
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) return 0;
  if (mode === 'up') return Math.ceil(valeur);
  if (mode === 'down') return Math.floor(valeur);
  return Math.round(valeur);
}

/**
 * Plafonne une valeur entre un minimum et un maximum.
 * @param {number} valeur
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function borner(valeur, min, max) {
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) return min;
  return Math.min(Math.max(valeur, min), max);
}
