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

  // Section surcote (si applicable)
  if (resultats.scenariosSurcote && resultats.scenariosSurcote.length > 0) {
    const surcoteSection = creerSectionSurcote(resultats);
    container.appendChild(surcoteSection);
  }

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
          ${resultats.duree?.trimestresServicesMilitaires > 0 ? `
          <div class="details-list__item">
            <dt>Services ${resultats.duree?.servicesMilitaires?.toUpperCase() || 'militaires'}</dt>
            <dd>+${resultats.duree?.trimestresServicesMilitaires || 0} trim.</dd>
          </div>
          <div class="details-list__item">
            <dt>Bonif. 1/5ème militaire</dt>
            <dd>+${resultats.duree?.trimestresBonificationMilitaire || 0} trim.</dd>
          </div>
          ` : ''}
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
            <dt>Traitement indiciaire brut${resultats.pensionTauxPlein?.nbiIntegre ? ' (NBI incluse)' : ''}</dt>
            <dd>${formaterMontant(resultats.pensionTauxPlein?.traitementIndiciaireAnnuel)}/an</dd>
          </div>
          ${resultats.pensionTauxPlein?.nbiIntegre ? `
          <div class="details-list__item">
            <dt>dont NBI intégrée</dt>
            <dd>${resultats.pensionTauxPlein.pointsNBIIntegres} pts</dd>
          </div>
          ` : ''}
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
          ${resultats.nbi?.eligible && resultats.nbi?.integreTIB ? `
            <div class="details-list__item">
              <dt>NBI intégrée au TIB</dt>
              <dd>
                <span class="badge badge--success">Oui (${resultats.nbi.pointsNBI} pts)</span>
                <br><small class="text--muted">${resultats.nbi.dureeAnneesNBI} ans de perception</small>
              </dd>
            </div>
          ` : resultats.nbi?.eligible ? `
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
 * Crée la section surcote avec scénarios détaillés
 * @param {Object} resultats - Résultats complets
 * @returns {HTMLElement} Section surcote
 */
function creerSectionSurcote(resultats) {
  const section = document.createElement('section');
  section.className = 'results-section results-section--surcote';

  const scenariosSurcote = resultats.scenariosSurcote;
  const pensionBase = resultats.pensionTauxPlein?.pensionBruteMensuelle || 0;

  const scenariosHTML = scenariosSurcote.map((scenario) => {
    const dateFormatee = formaterDateLongueFR(scenario.dateDepart);
    const gainMensuelFormate = formaterMontant(scenario.gainMensuel);
    const gainAnnuelFormate = formaterMontant(scenario.gainAnnuel);
    const pensionFormatee = formaterMontant(scenario.pensionMensuelle);

    return `
      <tr>
        <td><strong>+${scenario.anneesSupplémentaires} an${scenario.anneesSupplémentaires > 1 ? 's' : ''}</strong></td>
        <td>${escapeHtml(dateFormatee)}</td>
        <td>${Math.floor(scenario.ageDepart)} ans</td>
        <td>${scenario.trimestresSurcote} trim.</td>
        <td class="text--success">+${scenario.tauxSurcote.toFixed(2)} %</td>
        <td><strong>${escapeHtml(pensionFormatee)}</strong></td>
        <td class="text--success">
          <strong>+${escapeHtml(gainMensuelFormate)}/mois</strong>
          <br><small class="text--muted">(+${escapeHtml(gainAnnuelFormate)}/an)</small>
        </td>
      </tr>
    `;
  }).join('');

  section.innerHTML = `
    <h2 class="results-section__title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--color-success);">
        <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
        <polyline points="17,6 23,6 23,12"/>
      </svg>
      Simulation de surcote
    </h2>
    <p class="text--muted" style="margin-bottom: 1rem;">
      Si vous continuez à travailler après la date du taux plein, vous bénéficiez d'une <strong>surcote de ${formaterPourcentage(1.25)} par trimestre supplémentaire</strong>.
      Voici l'impact financier sur votre pension :
    </p>

    <div class="alert alert--info" style="margin-bottom: 1.5rem;">
      <div class="alert__content">
        <strong>Pension de référence au taux plein :</strong> ${formaterMontant(pensionBase)}/mois
      </div>
    </div>

    <div class="table-container">
      <table class="table table--surcote">
        <thead>
          <tr>
            <th>Durée supplémentaire</th>
            <th>Date de départ</th>
            <th>Âge</th>
            <th>Surcote</th>
            <th>Majoration</th>
            <th>Pension brute</th>
            <th>Gain</th>
          </tr>
        </thead>
        <tbody>
          ${scenariosHTML}
        </tbody>
      </table>
    </div>

    <div class="surcote-summary" style="margin-top: 1.5rem; padding: 1rem; background: var(--color-success-bg, #d4edda); border-radius: var(--radius-md); border-left: 4px solid var(--color-success);">
      <p style="margin: 0; font-size: 0.95rem;">
        <strong>Bon à savoir :</strong> La surcote n'est pas plafonnée. Plus vous travaillez au-delà du taux plein,
        plus votre pension augmente. Chaque trimestre supplémentaire vous rapporte <strong>${formaterMontant(pensionBase * 0.0125)}</strong> de plus par mois.
      </p>
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
    <div class="graphique-wrapper">
      <div class="graphique-container">
        <canvas id="pension-chart" aria-label="Graphique d'évolution de la pension selon l'âge de départ" role="img"></canvas>
        <div id="chart-tooltip" class="chart-tooltip"></div>
      </div>
      <div class="graphique-legende">
        <div class="graphique-legende__item">
          <span class="graphique-legende__dot graphique-legende__dot--decote"></span>
          <span>Avec décote</span>
        </div>
        <div class="graphique-legende__item">
          <span class="graphique-legende__dot graphique-legende__dot--taux-plein"></span>
          <span>Taux plein (recommandé)</span>
        </div>
        <div class="graphique-legende__item">
          <span class="graphique-legende__dot graphique-legende__dot--surcote"></span>
          <span>Avec surcote</span>
        </div>
      </div>
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
 * Crée un graphique d'évolution de la pension avec support Retina et tooltips
 * @param {Array} scenarios - Scénarios de départ
 * @param {HTMLCanvasElement} canvas - Élément canvas
 */
export function afficherGraphiquePension(scenarios, canvas) {
  if (!canvas || !scenarios.length) return;

  // Support Retina / HiDPI
  const dpr = window.devicePixelRatio || 1;

  // Taille responsive : utiliser la largeur du conteneur parent
  const container = canvas.parentElement;
  const containerWidth = container ? container.clientWidth : 600;
  const isMobile = containerWidth < 500;
  
  // Dimensions adaptatives
  const displayWidth = Math.max(containerWidth, 280);
  const displayHeight = isMobile ? Math.min(displayWidth * 0.7, 280) : Math.min(displayWidth * 0.55, 350);

  // Définir la taille CSS
  canvas.style.width = '100%';
  canvas.style.height = displayHeight + 'px';

  // Définir la taille réelle du canvas (pour Retina)
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  const ctx = canvas.getContext('2d');

  // Mettre à l'échelle le contexte pour Retina
  ctx.scale(dpr, dpr);

  const width = displayWidth;
  const height = displayHeight;
  
  // Padding adaptatif selon la largeur
  const paddingLeft = isMobile ? 50 : 70;
  const paddingRight = isMobile ? 15 : 30;
  const paddingTop = isMobile ? 20 : 30;
  const paddingBottom = isMobile ? 45 : 50;

  // Effacer le canvas
  ctx.clearRect(0, 0, width, height);

  // Fond avec dégradé subtil
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#fafbfc');
  gradient.addColorStop(1, '#ffffff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Données
  const ages = scenarios.map((s) => Math.floor(s.age));
  const pensions = scenarios.map((s) => s.pension?.pensionBruteMensuelle || 0);

  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);
  const minPension = Math.min(...pensions);
  const maxPension = Math.max(...pensions);
  
  // Ajouter une marge pour l'axe Y (10% en bas)
  const pensionRange = maxPension - minPension;
  const yMin = Math.max(0, minPension - pensionRange * 0.1);
  const yMax = maxPension + pensionRange * 0.05;

  // Zone de dessin
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Échelle
  const xScale = chartWidth / (maxAge - minAge || 1);
  const yScale = chartHeight / (yMax - yMin || 1);

  // Stocker les positions des points pour les tooltips
  const pointsData = scenarios.map((scenario, i) => {
    const pension = scenario.pension?.pensionBruteMensuelle || 0;
    return {
      x: paddingLeft + (Math.floor(scenario.age) - minAge) * xScale,
      y: paddingTop + chartHeight - (pension - yMin) * yScale,
      scenario: scenario,
      index: i
    };
  });

  // Grille horizontale
  const ySteps = isMobile ? 4 : 5;
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= ySteps; i++) {
    const value = yMin + ((yMax - yMin) / ySteps) * i;
    const y = paddingTop + chartHeight - (value - yMin) * yScale;

    // Ligne de grille
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label Y
    ctx.fillStyle = '#6c757d';
    ctx.font = `${isMobile ? '10' : '11'}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(value).toLocaleString('fr-FR')} €`, paddingLeft - 8, y);
  }

  // Axe X (ligne de base)
  ctx.strokeStyle = '#dee2e6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop + chartHeight);
  ctx.lineTo(width - paddingRight, paddingTop + chartHeight);
  ctx.stroke();

  // Labels X (âges)
  ctx.fillStyle = '#495057';
  ctx.font = `${isMobile ? '10' : '12'}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  ages.forEach((age, i) => {
    const x = paddingLeft + (age - minAge) * xScale;
    const label = isMobile ? `${age}` : `${age} ans`;
    ctx.fillText(label, x, paddingTop + chartHeight + 8);
    
    // Petite marque sur l'axe
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, paddingTop + chartHeight);
    ctx.lineTo(x, paddingTop + chartHeight + 4);
    ctx.stroke();
  });

  // Zone sous la courbe (dégradé)
  if (pointsData.length > 1) {
    const areaGradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
    areaGradient.addColorStop(0, 'rgba(200, 16, 46, 0.15)');
    areaGradient.addColorStop(1, 'rgba(200, 16, 46, 0.02)');
    
    ctx.fillStyle = areaGradient;
    ctx.beginPath();
    ctx.moveTo(pointsData[0].x, paddingTop + chartHeight);
    pointsData.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(pointsData[pointsData.length - 1].x, paddingTop + chartHeight);
    ctx.closePath();
    ctx.fill();
  }

  // Courbe avec courbe de Bézier pour un rendu plus lisse
  ctx.strokeStyle = '#C8102E';
  ctx.lineWidth = isMobile ? 2.5 : 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  pointsData.forEach((point, i) => {
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      // Courbe de Bézier pour un rendu plus lisse
      const prev = pointsData[i - 1];
      const cpX = (prev.x + point.x) / 2;
      ctx.quadraticCurveTo(prev.x + (point.x - prev.x) * 0.5, prev.y, cpX, (prev.y + point.y) / 2);
      ctx.quadraticCurveTo(cpX, point.y, point.x, point.y);
    }
  });

  ctx.stroke();

  // Points avec effet de halo
  const pointRadius = isMobile ? 6 : 8;
  const innerRadius = isMobile ? 3 : 4;
  
  pointsData.forEach((point) => {
    // Couleur selon le type de scénario
    let pointColor;
    if (point.scenario.decote) {
      pointColor = '#dc3545'; // Rouge pour décote
    } else if (point.scenario.surcote) {
      pointColor = '#17a2b8'; // Bleu pour surcote
    } else {
      pointColor = '#28a745'; // Vert pour taux plein
    }
    
    // Halo
    ctx.fillStyle = pointColor + '30';
    ctx.beginPath();
    ctx.arc(point.x, point.y, pointRadius + 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Point principal
    ctx.fillStyle = pointColor;
    ctx.beginPath();
    ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Bordure blanche
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Point central blanc
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(point.x, point.y, innerRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Gestion des tooltips
  const tooltip = canvas.parentElement?.querySelector('#chart-tooltip');
  if (tooltip) {
    setupChartTooltip(canvas, tooltip, pointsData);
  }
}

/**
 * Configure les événements de tooltip pour le graphique
 * @param {HTMLCanvasElement} canvas - Élément canvas
 * @param {HTMLElement} tooltip - Élément tooltip
 * @param {Array} pointsData - Données des points
 */
function setupChartTooltip(canvas, tooltip, pointsData) {
  const hitRadius = 15; // Rayon de détection du survol

  /**
   * Trouve le point survolé
   * @param {MouseEvent} e - Événement souris
   * @returns {Object|null} Point survolé ou null
   */
  function getHoveredPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.offsetWidth / (canvas.width / (window.devicePixelRatio || 1));
    const scaleY = canvas.offsetHeight / (canvas.height / (window.devicePixelRatio || 1));

    const mouseX = (e.clientX - rect.left) / scaleX;
    const mouseY = (e.clientY - rect.top) / scaleY;

    for (const point of pointsData) {
      const dx = mouseX - point.x;
      const dy = mouseY - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= hitRadius) {
        return point;
      }
    }
    return null;
  }

  /**
   * Affiche le tooltip
   * @param {Object} point - Données du point
   * @param {MouseEvent} e - Événement souris
   */
  function showTooltip(point, e) {
    const scenario = point.scenario;
    const pension = scenario.pension?.pensionBruteMensuelle || 0;
    const isRecommended = point.index === 1;

    let statusText = '';
    if (scenario.decote) {
      statusText = '<span style="color: #dc3545;">Avec décote</span>';
    } else if (scenario.surcote) {
      statusText = '<span style="color: #28a745;">Avec surcote</span>';
    } else {
      statusText = '<span style="color: #0d6efd;">Taux plein</span>';
    }

    tooltip.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">
        ${escapeHtml(scenario.description)}
        ${isRecommended ? '<span style="color: #28a745;"> ✓</span>' : ''}
      </div>
      <div style="margin-bottom: 2px;"><strong>${pension.toLocaleString('fr-FR')} €</strong> /mois</div>
      <div style="font-size: 11px; color: #666;">
        ${Math.floor(scenario.age)} ans · ${statusText}
      </div>
    `;

    // Positionnement du tooltip
    const rect = canvas.getBoundingClientRect();
    const containerRect = canvas.parentElement.getBoundingClientRect();

    const tooltipX = e.clientX - containerRect.left + 10;
    const tooltipY = e.clientY - containerRect.top - 10;

    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';
    tooltip.style.display = 'block';
  }

  /**
   * Cache le tooltip
   */
  function hideTooltip() {
    tooltip.style.display = 'none';
  }

  // Événements
  canvas.addEventListener('mousemove', (e) => {
    const point = getHoveredPoint(e);
    if (point) {
      canvas.style.cursor = 'pointer';
      showTooltip(point, e);
    } else {
      canvas.style.cursor = 'default';
      hideTooltip();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    canvas.style.cursor = 'default';
    hideTooltip();
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
