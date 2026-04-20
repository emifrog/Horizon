/**
 * Module Glossaire UI — injecte des tooltips explicatifs à côté des termes
 * techniques marqués via l'attribut data-glossaire="cle".
 *
 * Usage dans le HTML :
 *   <label>Indice brut <span data-glossaire="indice-brut"></span></label>
 *
 * Le script :
 *   - lit la clé dans data-glossaire
 *   - récupère la définition dans glossaire.js
 *   - construit un <span class="tooltip"> avec icône et contenu accessible
 *
 * @module ui/glossaire
 */

import { getTerme } from '../config/glossaire.js';

const ICON_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
`;

/**
 * Échappe les caractères HTML d'une chaîne.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Construit le markup d'un tooltip à partir d'une entrée de glossaire.
 * @param {Object} entree
 * @returns {string} HTML du tooltip
 */
function renderTooltip(entree) {
  const ref = entree.ref ? `<br><em>Réf : ${escapeHtml(entree.ref)}</em>` : '';
  return `
    <span class="tooltip tooltip--inline" tabindex="0"
          role="button"
          aria-label="Définition : ${escapeHtml(entree.libelle)}">
      <span class="tooltip__icon tooltip__icon--inline">${ICON_SVG}</span>
      <span class="tooltip__content" role="tooltip">
        <strong>${escapeHtml(entree.libelle)}</strong><br>
        ${escapeHtml(entree.resume)}${ref}
      </span>
    </span>
  `;
}

/**
 * Ferme tous les tooltips actifs dans le document.
 */
function closeAllTooltips() {
  document.querySelectorAll('.tooltip.tooltip--active').forEach((t) => {
    t.classList.remove('tooltip--active');
  });
}

/**
 * Attache les listeners click/keyboard sur un tooltip pour qu'il se toggle
 * au tap (mobile) sans activer le <label> parent.
 * @param {HTMLElement} tooltip
 */
function attachTooltipHandlers(tooltip) {
  if (tooltip.dataset.tooltipBound === 'true') return;
  tooltip.dataset.tooltipBound = 'true';

  const toggle = (e) => {
    // Évite que le click sur l'icône ne déclenche le <label> parent (focus input)
    e.preventDefault();
    e.stopPropagation();
    const wasActive = tooltip.classList.contains('tooltip--active');
    closeAllTooltips();
    if (!wasActive) tooltip.classList.add('tooltip--active');
  };

  tooltip.addEventListener('click', toggle);

  tooltip.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggle(e);
    } else if (e.key === 'Escape') {
      tooltip.classList.remove('tooltip--active');
    }
  });
}

/**
 * Initialise les tooltips du glossaire sur tous les éléments marqués
 * data-glossaire dans le document.
 * @param {Element} [root] - Racine de recherche (document par défaut)
 */
export function initGlossaireTooltips(root) {
  const scope = root || document;
  const cibles = scope.querySelectorAll('[data-glossaire]');

  cibles.forEach((el) => {
    const cle = el.getAttribute('data-glossaire');
    const entree = getTerme(cle);
    if (!entree) {
      console.warn(`Glossaire : terme inconnu "${cle}"`);
      return;
    }
    // Ne pas ré-injecter si déjà fait
    if (el.dataset.glossaireRendu === 'true') return;
    el.innerHTML = renderTooltip(entree);
    el.dataset.glossaireRendu = 'true';

    const tooltip = el.querySelector('.tooltip');
    if (tooltip) attachTooltipHandlers(tooltip);
  });

  // Fermer en cliquant ailleurs (une seule fois pour le document)
  if (!document._glossaireOutsideBound) {
    document._glossaireOutsideBound = true;
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.tooltip')) closeAllTooltips();
    });
  }
}
