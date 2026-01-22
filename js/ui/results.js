/**
 * Module Results - Affichage des résultats de simulation
 *
 * @module ui/results
 */

import { formaterMontant, formaterPourcentage, formaterTrimestres } from '../utils/formatters.js';
import { formaterDateLongueFR } from '../utils/dates.js';

/**
 * Échappe les caractères HTML pour prévenir les attaques XSS
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const str = String(text);
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Affiche les résultats complets de la simulation
 * @param {Object} resultats - Résultats de la simulation
 * @param {HTMLElement} container - Conteneur d'affichage
 */
export function afficherResultats(resultats, container) {
  if (!container) return;
  
  // Protection contre les résultats invalides
  if (!resultats) {
    console.error('Aucun résultat à afficher');
    return;
  }

  container.innerHTML = '';

  // Section résumé
  const resumeSection = creerSectionResume(resultats);
  container.appendChild(resumeSection);

  // Section scénarios
  const scenariosSection = creerSectionScenarios(resultats.scenarios);
  container.appendChild(scenariosSection);

  // Section détails
  const detailsSection = creerSectionDetails(resultats);
  container.appendChild(detailsSection);

  // Section graphique
  const graphiqueSection = creerSectionGraphique(resultats.scenarios);
  container.appendChild(graphiqueSection);

  // Section avertissement
  const avertissement = creerAvertissement();
  container.appendChild(avertissement);

  // Animation d'apparition
  container.querySelectorAll('.result-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('fade-in');
  });
}

/**
 * Crée la section résumé
 * @param {Object} resultats - Résultats
 * @returns {HTMLElement} Section résumé
 */
function creerSectionResume(resultats) {
  const section = document.createElement('section');
  section.className = 'results-section results-section--resume';

  section.innerHTML = `
    <h2 class="results-section__title">Résumé de votre situation</h2>
    <div class="result-cards">
      <div class="result-card result-card--highlight">
        <div class="result-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="result-card__content">
          <span class="result-card__label">Pension estimée (taux plein)</span>
          <span class="result-card__value">${formaterMontant(resultats.pensionTauxPlein?.pensionBruteMensuelle)}</span>
          <span class="result-card__sublabel">brut mensuel</span>
        </div>
      </div>

      <div class="result-card">
        <div class="result-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="result-card__content">
          <span class="result-card__label">Date taux plein</span>
          <span class="result-card__value">${formaterDateLongueFR(resultats.dateTauxPlein)}</span>
          <span class="result-card__sublabel">${resultats.ageTauxPlein} ans</span>
        </div>
      </div>

      <div class="result-card">
        <div class="result-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
        <div class="result-card__content">
          <span class="result-card__label">Durée d'assurance</span>
          <span class="result-card__value">${formaterTrimestres(resultats.duree?.trimestresAssuranceTotale)}</span>
          <span class="result-card__sublabel">sur ${resultats.duree?.trimestresRequis} requis</span>
        </div>
      </div>

      <div class="result-card">
        <div class="result-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        </div>
        <div class="result-card__content">
          <span class="result-card__label">Taux de liquidation</span>
          <span class="result-card__value">${formaterPourcentage(resultats.pensionTauxPlein?.tauxLiquidationNet)}</span>
          <span class="result-card__sublabel">maximum 75%</span>
        </div>
      </div>
    </div>
  `;

  return section;
}

/**
 * Crée la section des scénarios
 * @param {Array} scenarios - Liste des scénarios
 * @returns {HTMLElement} Section scénarios
 */
function creerSectionScenarios(scenarios) {
  const section = document.createElement('section');
  section.className = 'results-section results-section--scenarios';

  // Protection contre scenarios undefined
  if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
    section.innerHTML = `
      <h2 class="results-section__title">Scénarios de départ</h2>
      <p class="text--muted">Aucun scénario disponible.</p>
    `;
    return section;
  }

  const scenariosHTML = scenarios.map((scenario, index) => `
    <tr class="${index === 1 ? 'scenario--recommended' : ''}">
      <td>
        <strong>${escapeHtml(scenario.description)}</strong>
        ${index === 1 ? '<span class="badge badge--success">Recommandé</span>' : ''}
      </td>
      <td>${escapeHtml(formaterDateLongueFR(scenario.date))}</td>
      <td>${escapeHtml(Math.floor(scenario.age))} ans</td>
      <td>${escapeHtml(formaterTrimestres(scenario.trimestresLiquidables))}</td>
      <td class="${scenario.decote ? 'text--warning' : ''}">${escapeHtml(formaterPourcentage(scenario.tauxLiquidation))}</td>
      <td>
        ${scenario.decote ? '<span class="badge badge--warning">Décote</span>' : ''}
        ${scenario.surcote ? '<span class="badge badge--success">Surcote</span>' : ''}
        ${!scenario.decote && !scenario.surcote ? '<span class="badge badge--info">Taux plein</span>' : ''}
      </td>
    </tr>
  `).join('');

  section.innerHTML = `
    <h2 class="results-section__title">Scénarios de départ</h2>
    <div class="table-container">
      <table class="table table--scenarios">
        <thead>
          <tr>
            <th>Scénario</th>
            <th>Date</th>
            <th>Âge</th>
            <th>Trimestres</th>
            <th>Taux</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${scenariosHTML}
        </tbody>
      </table>
    </div>
  `;

  return section;
}

/**
 * Crée la section des détails
 * @param {Object} resultats - Résultats
 * @returns {HTMLElement} Section détails
 */
function creerSectionDetails(resultats) {
  const section = document.createElement('section');
  section.className = 'results-section results-section--details';

  section.innerHTML = `
    <h2 class="results-section__title">Détails du calcul</h2>

    <div class="details-grid">
      <!-- Détails durée -->
      <div class="details-card">
        <h3 class="details-card__title">Durée d'assurance</h3>
        <dl class="details-list">
          <div class="details-list__item">
            <dt>Services effectifs SPP</dt>
            <dd>${formaterTrimestres(resultats.duree?.trimestresServicesEffectifs)}</dd>
          </div>
          <div class="details-list__item">
            <dt>Bonification du 1/5ème</dt>
            <dd>+${resultats.duree?.trimestresBonificationCinquieme || 0} trim.</dd>
          </div>
          <div class="details-list__item">
            <dt>Bonification enfants</dt>
            <dd>+${resultats.duree?.trimestresBonificationEnfants || 0} trim.</dd>
          </div>
          <div class="details-list__item">
            <dt>Majoration SPV</dt>
            <dd>+${resultats.duree?.trimestresMajorationSPV || 0} trim.</dd>
          </div>
          <div class="details-list__item">
            <dt>Autres régimes</dt>
            <dd>+${resultats.duree?.trimestresAutresRegimes || 0} trim.</dd>
          </div>
          <div class="details-list__item details-list__item--total">
            <dt>Total</dt>
            <dd><strong>${formaterTrimestres(resultats.duree?.trimestresAssuranceTotale)}</strong></dd>
          </div>
        </dl>
      </div>

      <!-- Détails pension -->
      <div class="details-card">
        <h3 class="details-card__title">Calcul de la pension</h3>
        <dl class="details-list">
          <div class="details-list__item">
            <dt>Traitement indiciaire brut</dt>
            <dd>${formaterMontant(resultats.pensionTauxPlein?.traitementIndiciaireAnnuel)}/an</dd>
          </div>
          <div class="details-list__item">
            <dt>Taux de liquidation</dt>
            <dd>${formaterPourcentage(resultats.pensionTauxPlein?.tauxLiquidationBrut)}</dd>
          </div>
          <div class="details-list__item">
            <dt>Décote/Surcote</dt>
            <dd>${resultats.pensionTauxPlein?.trimestresDecote > 0
              ? `-${resultats.pensionTauxPlein.trimestresDecote} trim.`
              : 'Aucune'}</dd>
          </div>
          <div class="details-list__item details-list__item--total">
            <dt>Pension brute mensuelle</dt>
            <dd><strong>${formaterMontant(resultats.pensionTauxPlein?.pensionBruteMensuelle)}</strong></dd>
          </div>
          <div class="details-list__item">
            <dt>Pension nette estimée</dt>
            <dd>${formaterMontant(resultats.pensionTauxPlein?.pensionNetteMensuelle)}</dd>
          </div>
        </dl>
      </div>

      <!-- Détails compléments -->
      <div class="details-card">
        <h3 class="details-card__title">Compléments</h3>
        <dl class="details-list">
          ${resultats.nbi?.eligible ? `
            <div class="details-list__item">
              <dt>Supplément NBI</dt>
              <dd>+${formaterMontant(resultats.nbi.supplementMensuel)}/mois</dd>
            </div>
          ` : ''}
          ${resultats.pfr ? `
            <div class="details-list__item">
              <dt>Rente RAFP estimée</dt>
              <dd>+${formaterMontant(resultats.pfr.renteRAFPMensuelle)}/mois</dd>
            </div>
          ` : ''}
          ${resultats.pfrSPV?.eligible ? `
            <div class="details-list__item">
              <dt>PFR SPV (${escapeHtml(resultats.pfrSPV.anneesSPV)} ans)</dt>
              <dd>+${formaterMontant(resultats.pfrSPV.montantMensuel)}/mois</dd>
            </div>
          ` : ''}
          <div class="details-list__item details-list__item--total">
            <dt>Total retraite estimé</dt>
            <dd><strong>${formaterMontant(resultats.totalRetraite)}</strong>/mois</dd>
          </div>
        </dl>
      </div>
    </div>
  `;

  return section;
}

/**
 * Crée la section graphique
 * @param {Array} scenarios - Scénarios de départ
 * @returns {HTMLElement} Section graphique
 */
function creerSectionGraphique(scenarios) {
  const section = document.createElement('section');
  section.className = 'results-section results-section--graphique';

  section.innerHTML = `
    <h2 class="results-section__title">Évolution de la pension selon l'âge de départ</h2>
    <div class="graphique-container" style="background: var(--color-white); border: var(--border-width) solid var(--color-border); border-radius: var(--radius-lg); padding: var(--spacing-lg);">
      <canvas id="pension-chart" width="600" height="300" style="width: 100%; max-width: 600px; height: auto;" aria-label="Graphique d'évolution de la pension selon l'âge de départ" role="img"></canvas>
    </div>
  `;

  // Afficher le graphique après insertion dans le DOM
  requestAnimationFrame(() => {
    const canvas = section.querySelector('#pension-chart');
    if (canvas && scenarios?.length) {
      afficherGraphiquePension(scenarios, canvas);
    }
  });

  return section;
}

/**
 * Crée l'avertissement juridique
 * @returns {HTMLElement} Avertissement
 */
function creerAvertissement() {
  const div = document.createElement('div');
  div.className = 'alert alert--warning';

  div.innerHTML = `
    <svg class="alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    <div class="alert__content">
      <strong>Simulation indicative</strong>
      <p>
        Ces résultats sont fournis à titre indicatif et ne constituent pas un engagement.
        Seule la CNRACL est habilitée à calculer vos droits définitifs.
        Les paramètres réglementaires sont susceptibles d'évoluer.
      </p>
    </div>
  `;

  return div;
}

/**
 * Crée un graphique d'évolution de la pension
 * @param {Array} scenarios - Scénarios de départ
 * @param {HTMLCanvasElement} canvas - Élément canvas
 */
export function afficherGraphiquePension(scenarios, canvas) {
  if (!canvas || !scenarios.length) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 50;

  // Effacer le canvas
  ctx.clearRect(0, 0, width, height);

  // Données
  const ages = scenarios.map((s) => Math.floor(s.age));
  const pensions = scenarios.map((s) => s.pension?.pensionBruteMensuelle || 0);

  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);
  const maxPension = Math.max(...pensions);

  // Échelle
  const xScale = (width - 2 * padding) / (maxAge - minAge || 1);
  const yScale = (height - 2 * padding) / (maxPension || 1);

  // Axes
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;

  // Axe X
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Axe Y
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();

  // Grille et labels
  ctx.fillStyle = '#666';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';

  // Labels X (âges)
  ages.forEach((age, i) => {
    const x = padding + (age - minAge) * xScale;
    ctx.fillText(`${age} ans`, x, height - padding + 20);
  });

  // Labels Y (pensions)
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const value = (maxPension / ySteps) * i;
    const y = height - padding - value * yScale;

    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(value)} €`, padding - 10, y + 4);

    // Ligne de grille
    ctx.strokeStyle = '#eee';
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  // Courbe
  ctx.strokeStyle = '#C8102E';
  ctx.lineWidth = 3;
  ctx.beginPath();

  scenarios.forEach((scenario, i) => {
    const x = padding + (Math.floor(scenario.age) - minAge) * xScale;
    const y = height - padding - (scenario.pension?.pensionBruteMensuelle || 0) * yScale;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Points
  scenarios.forEach((scenario, i) => {
    const x = padding + (Math.floor(scenario.age) - minAge) * xScale;
    const y = height - padding - (scenario.pension?.pensionBruteMensuelle || 0) * yScale;

    ctx.fillStyle = i === 1 ? '#28A745' : '#C8102E';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Masque les résultats
 * @param {HTMLElement} container - Conteneur
 */
export function masquerResultats(container) {
  if (container) {
    container.innerHTML = `
      <div class="results-placeholder">
        <svg class="results-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        <p>Complétez le formulaire pour voir votre simulation</p>
      </div>
    `;
  }
}
