/**
 * Point d'entrée de l'application - Simulateur Retraite SPP
 *
 * Ce fichier orchestre l'ensemble des modules et gère le flux de l'application.
 *
 * @author Xavier (Adjudant SDIS 06)
 */

// Imports des modules
import { creerProfil, enrichirProfil } from './modules/profil.js';
import { calculerDurees } from './modules/duree.js';
import { genererScenariosDepart, calculerDateTauxPlein } from './modules/ages.js';
import { calculerPension, calculerPensionsMultiScenarios } from './modules/pension.js';
import { calculerPFR } from './modules/pfr.js';
import { calculerNBI } from './modules/nbi.js';
import { calculerSurcote, appliquerSurcote } from './modules/surcote.js';
import { initForm, getFormData, goToStep, showNotification } from './ui/form.js';
import { afficherResultats, masquerResultats } from './ui/results.js';
import { exporterPDF, exporterJSON } from './ui/export.js';
import { getDureeAssuranceRequise, PFR } from './config/parametres.js';
import { simulerScenariosSurcote } from './modules/surcote.js';

/**
 * État global de l'application
 */
let appState = {
  profil: null,
  resultats: null,
  isCalculated: false,
};

/**
 * Initialisation de l'application
 */
function init() {
  console.log('Initialisation du Simulateur Retraite SPP...');

  // Initialiser le formulaire
  const form = document.getElementById('simulator-form');
  if (form) {
    initForm(form);
    setupFormListeners(form);
  }

  // Boutons d'export
  document.querySelector('[data-action="export-pdf"]')?.addEventListener('click', handleExportPDF);
  document.querySelector('[data-action="export-json"]')?.addEventListener('click', handleExportJSON);

  console.log('Application initialisée.');
}

/**
 * Configure les écouteurs du formulaire
 * @param {HTMLFormElement} form - Formulaire
 */
function setupFormListeners(form) {
  // Mise à jour de l'aperçu en temps réel
  form.addEventListener('input', debounce(updatePreview, 300));

  // Soumission du formulaire
  form.addEventListener('submit', handleSubmit);

  // Bouton de calcul
  document.querySelector('[data-action="submit"]')?.addEventListener('click', handleSubmit);
}

/**
 * Gère la soumission du formulaire
 * @param {Event} event - Événement de soumission
 */
function handleSubmit(event) {
  event.preventDefault();

  try {
    // Récupérer les données du formulaire
    const formData = collectFormData();

    // Créer et enrichir le profil
    const profil = creerProfil(formData);
    const profilEnrichi = enrichirProfil(profil);

    if (!profilEnrichi.valide) {
      showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
      return;
    }

    // Effectuer les calculs
    const resultats = effectuerCalculs(formData, profilEnrichi);

    // Stocker dans l'état
    appState.profil = profilEnrichi;
    appState.resultats = resultats;
    appState.isCalculated = true;

    // Afficher les résultats
    const container = document.getElementById('results-container');
    afficherResultats(resultats, container);

    // Notification de succès
    showNotification('Simulation calculée avec succès', 'success');

  } catch (error) {
    console.error('Erreur lors du calcul:', error);
    showNotification('Une erreur est survenue lors du calcul', 'error');
  }
}

/**
 * Collecte les données du formulaire
 * @returns {Object} Données collectées
 */
function collectFormData() {
  const form = document.getElementById('simulator-form');
  const formData = new FormData(form);

  return {
    dateNaissance: formData.get('dateNaissance') ? new Date(formData.get('dateNaissance')) : null,
    dateEntreeSPP: formData.get('dateEntreeSPP') ? new Date(formData.get('dateEntreeSPP')) : null,
    quotite: parseFloat(formData.get('quotite')) || 1,
    anneesSPV: parseInt(formData.get('anneesSPV'), 10) || 0,
    trimestresAutresRegimes: parseInt(formData.get('trimestresAutresRegimes'), 10) || 0,
    enfantsAvant2004: parseInt(formData.get('enfantsAvant2004'), 10) || 0,
    indiceBrut: parseInt(formData.get('indiceBrut'), 10) || null,
    pointsNBI: parseInt(formData.get('pointsNBI'), 10) || 0,
    dureeNBI: parseInt(formData.get('dureeNBI'), 10) || 0,
    montantPFR: parseFloat(formData.get('montantPFR')) || null,
  };
}

/**
 * Effectue l'ensemble des calculs de simulation
 * @param {Object} formData - Données du formulaire
 * @param {Object} profilEnrichi - Profil enrichi
 * @returns {Object} Résultats complets
 */
function effectuerCalculs(formData, profilEnrichi) {
  const anneeNaissance = formData.dateNaissance.getFullYear();
  const trimestresRequis = getDureeAssuranceRequise(anneeNaissance);

  // 1. Générer les scénarios de départ
  const donneesDepart = {
    dateNaissance: formData.dateNaissance,
    dateEntreeSPP: formData.dateEntreeSPP,
    quotite: formData.quotite,
    trimestresAutresRegimes: formData.trimestresAutresRegimes,
    anneesSPV: formData.anneesSPV,
    enfantsAvant2004: formData.enfantsAvant2004,
  };

  const scenarios = genererScenariosDepart(donneesDepart);

  // 2. Calculer les durées pour le scénario taux plein
  const resultatDateTauxPlein = calculerDateTauxPlein(donneesDepart);
  const dateTauxPlein = resultatDateTauxPlein.date;
  const dureeTauxPlein = calculerDurees(
    {
      ...donneesDepart,
      dateDepart: dateTauxPlein,
    },
    anneeNaissance
  );

  // 3. Calculer la pension pour chaque scénario
  const scenariosAvecPension = scenarios.map((scenario) => {
    const duree = calculerDurees(
      {
        ...donneesDepart,
        dateDepart: scenario.date,
      },
      anneeNaissance
    );

    const pension = calculerPension({
      indiceBrut: formData.indiceBrut,
      trimestresLiquidables: duree.trimestresLiquidables,
      trimestresAssurance: duree.trimestresAssuranceTotale,
      trimestresRequis,
      dateNaissance: formData.dateNaissance,
      dateDepart: scenario.date,
    });

    // Calculer la surcote si applicable
    let pensionFinale = pension;
    if (scenario.surcote) {
      const surcote = calculerSurcote({
        dateNaissance: formData.dateNaissance,
        dateDepart: scenario.date,
        trimestresAssurance: duree.trimestresAssuranceTotale,
        trimestresRequis,
        dateTauxPlein,
      });

      if (surcote.eligible) {
        const pensionAvecSurcote = appliquerSurcote(
          pension.pensionBruteMensuelle,
          surcote.coefficientMajoration
        );
        pensionFinale = {
          ...pension,
          pensionBruteMensuelle: pensionAvecSurcote,
          pensionBruteAnnuelle: pensionAvecSurcote * 12,
          surcote,
        };
      }
    }

    return {
      ...scenario,
      trimestresLiquidables: duree.trimestresLiquidables,
      trimestresAssurance: duree.trimestresAssuranceTotale,
      pension: pensionFinale,
    };
  });

  // 4. Calculer la pension au taux plein (scénario principal)
  const pensionTauxPlein = calculerPension({
    indiceBrut: formData.indiceBrut,
    trimestresLiquidables: dureeTauxPlein.trimestresLiquidables,
    trimestresAssurance: dureeTauxPlein.trimestresAssuranceTotale,
    trimestresRequis,
    dateNaissance: formData.dateNaissance,
    dateDepart: dateTauxPlein,
  });

  // 5. Calculer la PFR et le RAFP
  // Note: Le RAFP a été créé en 2005, on ne compte que les années depuis cette date
  const dateDebutRAFP = new Date(Math.max(
    formData.dateEntreeSPP.getTime(),
    new Date(PFR.ANNEE_CREATION_RAFP, 0, 1).getTime()
  ));
  const anneesRAFP = Math.max(0, Math.floor(
    (dateTauxPlein.getTime() - dateDebutRAFP.getTime()) /
    (365.25 * 24 * 60 * 60 * 1000)
  ));

  const pfr = calculerPFR({
    indiceBrut: formData.indiceBrut,
    montantAnnuelPFR: formData.montantPFR,
    anneesCotisation: anneesRAFP,
  });

  // 6. Calculer le supplément NBI
  const nbi = calculerNBI({
    pointsNBI: formData.pointsNBI,
    dureeMoisNBI: formData.dureeNBI * 12,
    dureeServicesTotal: dureeTauxPlein.trimestresLiquidables,
    tauxLiquidation: pensionTauxPlein.tauxLiquidationNet,
  });

  // 7. Calculer le total retraite
  const totalRetraite =
    pensionTauxPlein.pensionBruteMensuelle +
    (nbi.eligible ? nbi.supplementMensuel : 0) +
    pfr.renteRAFPMensuelle;

  // 8. Calculer l'âge au taux plein
  const ageTauxPlein = Math.floor(
    (dateTauxPlein.getTime() - formData.dateNaissance.getTime()) /
    (365.25 * 24 * 60 * 60 * 1000)
  );

  // 9. Générer les scénarios de surcote (si taux plein atteint par durée)
  let scenariosSurcote = [];
  if (resultatDateTauxPlein.atteintParDuree) {
    scenariosSurcote = simulerScenariosSurcote(
      {
        dateNaissance: formData.dateNaissance,
        trimestresRequis,
      },
      dateTauxPlein,
      pensionTauxPlein.pensionBruteMensuelle
    );
  }

  return {
    profil: profilEnrichi,
    duree: dureeTauxPlein,
    dateTauxPlein,
    ageTauxPlein,
    tauxPleinParDuree: resultatDateTauxPlein.atteintParDuree,
    tauxPleinParAge: resultatDateTauxPlein.atteintParAge,
    trimestresManquantsTauxPlein: resultatDateTauxPlein.trimestresManquants,
    pensionTauxPlein,
    scenarios: scenariosAvecPension,
    scenariosSurcote,
    pfr,
    nbi,
    totalRetraite,
    trimestresRequis,
  };
}

/**
 * Met à jour l'aperçu en temps réel
 */
function updatePreview() {
  const formData = collectFormData();
  const previewContainer = document.getElementById('preview-container');

  // Vérifier si les données minimales sont présentes
  if (!formData.dateNaissance || !formData.dateEntreeSPP) {
    return;
  }

  try {
    const profil = creerProfil(formData);
    const profilEnrichi = enrichirProfil(profil);

    // Afficher un aperçu simplifié
    const anneeNaissance = formData.dateNaissance.getFullYear();
    const trimestresRequis = getDureeAssuranceRequise(anneeNaissance);

    // Calcul simplifié pour l'aperçu
    const aujourdhui = new Date();
    const dureeActuelle = calculerDurees(
      {
        dateEntreeSPP: formData.dateEntreeSPP,
        dateDepart: aujourdhui,
        quotite: formData.quotite,
        trimestresAutresRegimes: formData.trimestresAutresRegimes,
        anneesSPV: formData.anneesSPV,
        enfantsAvant2004: formData.enfantsAvant2004,
      },
      anneeNaissance
    );

    previewContainer.innerHTML = `
      <div class="details-card">
        <h3 class="details-card__title">Votre situation actuelle</h3>
        <dl class="details-list">
          <div class="details-list__item">
            <dt>Génération</dt>
            <dd>${anneeNaissance}</dd>
          </div>
          <div class="details-list__item">
            <dt>Durée requise</dt>
            <dd>${trimestresRequis} trimestres (${trimestresRequis / 4} ans)</dd>
          </div>
          <div class="details-list__item">
            <dt>Trimestres acquis</dt>
            <dd>${dureeActuelle.trimestresAssuranceTotale} trimestres</dd>
          </div>
          <div class="details-list__item">
            <dt>Écart taux plein</dt>
            <dd class="${dureeActuelle.ecartTauxPlein >= 0 ? 'text--success' : 'text--warning'}">
              ${dureeActuelle.ecartTauxPlein >= 0 ? '+' : ''}${dureeActuelle.ecartTauxPlein} trimestres
            </dd>
          </div>
          ${profilEnrichi.majorationSPV > 0 ? `
            <div class="details-list__item">
              <dt>Majoration SPV</dt>
              <dd>+${profilEnrichi.majorationSPV} trimestres</dd>
            </div>
          ` : ''}
          <div class="details-list__item">
            <dt>Condition 17 ans actifs</dt>
            <dd>
              <span class="badge badge--${dureeActuelle.conditionServicesActifs ? 'success' : 'warning'}">
                ${dureeActuelle.conditionServicesActifs ? 'Remplie' : 'Non remplie'}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    `;
  } catch (error) {
    // Ignorer les erreurs de calcul partiel
    console.debug('Aperçu non disponible:', error.message);
  }
}

/**
 * Gère l'export PDF
 */
function handleExportPDF() {
  if (!appState.isCalculated || !appState.resultats) {
    showNotification('Veuillez d\'abord effectuer une simulation', 'warning');
    return;
  }

  exporterPDF(appState.resultats, appState.profil.donnees);
}

/**
 * Gère l'export JSON
 */
function handleExportJSON() {
  if (!appState.isCalculated || !appState.resultats) {
    showNotification('Veuillez d\'abord effectuer une simulation', 'warning');
    return;
  }

  exporterJSON(appState.resultats, appState.profil.donnees);
  showNotification('Export JSON téléchargé', 'success');
}

/**
 * Fonction utilitaire de debounce
 * @param {Function} func - Fonction à exécuter
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction avec debounce
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export pour les tests
export { appState, effectuerCalculs };
