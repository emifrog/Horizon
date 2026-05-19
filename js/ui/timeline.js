/**
 * Module Timeline — Frise chronologique de carrière
 *
 * Représente sur une frise les jalons clés de la carrière du sapeur-pompier :
 *   - Entrée en qualité de SPP
 *   - Ouverture des droits (âge légal)
 *   - Taux plein
 *   - Annulation de la décote
 *   - Limite d'âge
 *   - Les 3 scénarios de départ
 *
 * Rendu en SVG (net à l'impression, accessible, responsive via viewBox).
 * La disposition horizontale (desktop) bascule en vertical (mobile) par CSS.
 *
 * @module ui/timeline
 */

import { formaterDateLongueFR, calculerAge } from '../utils/dates.js';

/**
 * Échappe le texte pour insertion HTML/SVG.
 * @param {string} s
 * @returns {string}
 */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Construit la liste ordonnée des jalons à partir des résultats.
 * @param {Object} resultats
 * @returns {Array<{key,date,age,libelle,type,detail}>}
 */
function construireJalons(resultats) {
  const { dateNaissance, dateEntreeSPP, resumeDates, scenarios } = resultats;
  const jalons = [];

  if (dateEntreeSPP) {
    jalons.push({
      key: 'entree',
      date: new Date(dateEntreeSPP),
      age: dateNaissance ? calculerAge(dateNaissance, dateEntreeSPP) : null,
      libelle: 'Entrée SPP',
      type: 'debut',
      detail: 'Titularisation en qualité de sapeur-pompier professionnel.',
    });
  }

  if (resumeDates) {
    const r = resumeDates;
    if (r.dateOuvertureDroits) {
      jalons.push({
        key: 'ouverture',
        date: new Date(r.dateOuvertureDroits.date),
        age: r.dateOuvertureDroits.age,
        libelle: 'Âge légal',
        type: 'legal',
        detail: 'Ouverture des droits : âge minimum de départ en catégorie active.',
      });
    }
    if (r.dateTauxPlein) {
      jalons.push({
        key: 'tauxplein',
        date: new Date(r.dateTauxPlein.date),
        age: r.dateTauxPlein.age,
        libelle: 'Taux plein',
        type: 'tauxplein',
        detail: r.dateTauxPlein.libelle + '.',
      });
    }
    if (r.dateAnnulationDecote) {
      jalons.push({
        key: 'annulation',
        date: new Date(r.dateAnnulationDecote.date),
        age: r.dateAnnulationDecote.age,
        libelle: 'Annulation décote',
        type: 'decote',
        detail: 'À partir de cette date, la décote ne s\'applique plus.',
      });
    }
    if (r.dateLimite) {
      jalons.push({
        key: 'limite',
        date: new Date(r.dateLimite.date),
        age: r.dateLimite.age,
        libelle: 'Limite d\'âge',
        type: 'limite',
        detail: 'Âge limite d\'activité en catégorie active.',
      });
    }
  }

  // Scénarios de départ
  (scenarios || []).forEach((s, i) => {
    if (!s.date) return;
    jalons.push({
      key: `scenario-${i}`,
      date: new Date(s.date),
      age: Math.floor(s.age),
      libelle: s.description || `Scénario ${i + 1}`,
      type: s.decote ? 'scenario-decote' : s.surcote ? 'scenario-surcote' : 'scenario-plein',
      detail: `Départ envisagé à ${Math.floor(s.age)} ans.`,
      scenario: true,
    });
  });

  // Tri chronologique, dédoublonnage des dates identiques par regroupement
  jalons.sort((a, b) => a.date - b.date);
  return jalons;
}

/**
 * Crée la section frise chronologique.
 * @param {Object} resultats
 * @returns {HTMLElement|null}
 */
export function creerSectionTimeline(resultats) {
  const jalons = construireJalons(resultats);
  if (jalons.length < 2) return null;

  const section = document.createElement('section');
  section.className = 'results-section results-section--timeline';
  section.setAttribute('aria-labelledby', 'timeline-title');

  const minTime = jalons[0].date.getTime();
  const maxTime = jalons[jalons.length - 1].date.getTime();
  const span = Math.max(1, maxTime - minTime);

  // Géométrie SVG (coordonnées logiques, mises à l'échelle par viewBox)
  const W = 1000;
  const H = 220;
  const padX = 70;
  const axisY = 110;
  const usable = W - 2 * padX;

  const xFor = (t) => padX + ((t - minTime) / span) * usable;

  // Alternance haut / bas pour éviter le chevauchement des étiquettes
  let segments = '';
  let points = '';
  let labels = '';

  jalons.forEach((j, idx) => {
    const x = xFor(j.date.getTime());
    const up = idx % 2 === 0;
    const labelY = up ? axisY - 38 : axisY + 38;
    const tickY1 = up ? axisY - 6 : axisY + 6;
    const tickY2 = up ? axisY - 26 : axisY + 26;
    const dateStr = formaterDateLongueFR(j.date);
    const ageStr = j.age != null ? `${j.age} ans` : '';

    points += `
      <g class="timeline__node timeline__node--${esc(j.type)}"
         tabindex="0" role="listitem"
         aria-label="${esc(j.libelle)} : ${esc(dateStr)}${ageStr ? `, ${esc(ageStr)}` : ''}. ${esc(j.detail)}"
         data-detail="${esc(j.libelle)} — ${esc(dateStr)}${ageStr ? ` (${esc(ageStr)})` : ''}">
        <line class="timeline__tick" x1="${x}" y1="${tickY1}" x2="${x}" y2="${tickY2}"></line>
        <circle class="timeline__dot" cx="${x}" cy="${axisY}" r="9"></circle>
        <text class="timeline__label" x="${x}" y="${labelY}" text-anchor="middle">${esc(j.libelle)}</text>
        <text class="timeline__sublabel" x="${x}" y="${labelY + (up ? -14 : 14)}" text-anchor="middle">${esc(ageStr || dateStr)}</text>
      </g>
    `;
  });

  // Ligne d'axe principale
  segments = `<line class="timeline__axis" x1="${padX}" y1="${axisY}" x2="${W - padX}" y2="${axisY}"></line>`;

  section.innerHTML = `
    <h2 id="timeline-title" class="results-section__title">Frise de votre carrière</h2>
    <figure class="timeline-figure">
      <div class="timeline-scroll">
        <svg class="timeline-svg" viewBox="0 0 ${W} ${H}" role="list"
             aria-label="Frise chronologique des jalons de carrière"
             preserveAspectRatio="xMidYMid meet">
          ${segments}
          ${points}
        </svg>
      </div>
      <figcaption class="timeline-caption">
        Repères clés de votre carrière, de l'entrée en service jusqu'à la limite d'âge.
        Survolez ou sélectionnez un repère pour le détail.
      </figcaption>
      <div class="timeline-tooltip" id="timeline-tooltip" role="status" aria-live="polite" hidden></div>
      <ul class="timeline-list">
        ${jalons.map((j) => {
          const dateStr = formaterDateLongueFR(j.date);
          const ageStr = j.age != null ? ` · ${j.age} ans` : '';
          return `<li class="timeline-list__item timeline-list__item--${esc(j.type)}">
            <strong>${esc(j.libelle)}</strong>
            <span>${esc(dateStr)}${esc(ageStr)}</span>
            <span class="timeline-list__detail">${esc(j.detail)}</span>
          </li>`;
        }).join('')}
      </ul>
    </figure>
  `;

  // Interactivité : survol / focus d'un nœud → tooltip
  requestAnimationFrame(() => attacherInteractions(section));

  return section;
}

/**
 * Attache les interactions de survol/focus sur les nœuds de la frise.
 * @param {HTMLElement} section
 */
function attacherInteractions(section) {
  const tooltip = section.querySelector('#timeline-tooltip');
  const svg = section.querySelector('.timeline-svg');
  if (!tooltip || !svg) return;

  const show = (node) => {
    const text = node.getAttribute('data-detail');
    if (!text) return;
    tooltip.textContent = text;
    tooltip.hidden = false;
    section.querySelectorAll('.timeline__node--hover').forEach((n) =>
      n.classList.remove('timeline__node--hover'));
    node.classList.add('timeline__node--hover');
  };

  const hide = () => {
    tooltip.hidden = true;
    section.querySelectorAll('.timeline__node--hover').forEach((n) =>
      n.classList.remove('timeline__node--hover'));
  };

  svg.querySelectorAll('.timeline__node').forEach((node) => {
    node.addEventListener('mouseenter', () => show(node));
    node.addEventListener('mouseleave', hide);
    node.addEventListener('focus', () => show(node));
    node.addEventListener('blur', hide);
  });
}
