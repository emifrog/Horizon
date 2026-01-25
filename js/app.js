/**
 * Point d'entrée de l'application - Simulateur Retraite SPP
 *
 * Ce fichier orchestre l'ensemble des modules et gère le flux de l'application.
 *
 * @author Xavier (Adjudant SDIS 06)
 */

// =============================================================================
// GESTION D'ERREURS GLOBALE
// =============================================================================

/**
 * Gestionnaire d'erreurs global pour les erreurs non capturées
 */
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Erreur globale:', { message, source, lineno, colno, error });
  
  // Afficher une notification utilisateur si le module form est chargé
  if (typeof showNotification === 'function') {
    showNotification('Une erreur inattendue s\'est produite. Veuillez réessayer.', 'error');
  }
  
  // Ne pas bloquer l'exécution
  return false;
};

/**
 * Gestionnaire pour les promesses rejetées non gérées
 */
window.addEventListener('unhandledrejection', function(event) {
  console.error('Promesse rejetée non gérée:', event.reason);
  
  // Afficher une notification utilisateur
  if (typeof showNotification === 'function') {
    showNotification('Une erreur asynchrone s\'est produite.', 'error');
  }
  
  // Empêcher l'affichage dans la console par défaut (déjà loggé)
  event.preventDefault();
});

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
import { exporterPDF, exporterCSV } from './ui/export.js';
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

  // Gestion du double statut SPP/SPV
  setupDoubleStatutToggle();

  // Gestion des services militaires (BSPP/BMPM)
  setupServicesMilitairesToggle();

  // Calcul automatique des années RAFP
  setupAnneesRAFPAutoCalcul();

  // Boutons d'export
  document.querySelector('[data-action="export-pdf"]')?.addEventListener('click', handleExportPDF);
  document.querySelector('[data-action="export-csv"]')?.addEventListener('click', handleExportCSV);

  // Menu hamburger
  setupHamburgerMenu();

  // Lien À propos dans la navbar desktop
  document.querySelector('.nav-desktop [data-action="about"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleAbout();
  });

  console.log('Application initialisée.');
}

/**
 * Configure le menu hamburger
 */
function setupHamburgerMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  
  if (!hamburger || !navMenu) return;

  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.id = 'nav-overlay';
  document.body.appendChild(overlay);

  // Toggle du menu
  function toggleMenu() {
    const isOpen = navMenu.classList.contains('is-open');
    
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu() {
    hamburger.classList.add('is-active');
    hamburger.setAttribute('aria-expanded', 'true');
    navMenu.classList.add('is-open');
    overlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  // Événements
  hamburger.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', closeMenu);

  // Fermer avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // Gestion des liens du menu
  navMenu.querySelectorAll('[data-action]').forEach(link => {
    link.addEventListener('click', (e) => {
      const action = link.dataset.action;
      
      // Pour les liens avec href réel (documentation), laisser la navigation se faire
      if (action === 'documentation') {
        closeMenu();
        return; // Laisser le navigateur suivre le lien href
      }
      
      e.preventDefault();
      closeMenu();
      
      switch (action) {
        case 'new-simulation':
          handleNewSimulation();
          break;
        case 'export-pdf':
          handleExportPDF();
          break;
        case 'export-csv':
          handleExportCSV();
          break;
        case 'about':
          handleAbout();
          break;
      }
    });
  });
}

/**
 * Réinitialise le formulaire pour une nouvelle simulation
 */
function handleNewSimulation() {
  const form = document.getElementById('simulator-form');
  if (form) {
    form.reset();
    goToStep(1);
    appState.profil = null;
    appState.resultats = null;
    appState.isCalculated = false;
    
    // Réinitialiser l'aperçu
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div class="results-placeholder">
          <svg class="results-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
          <p>Complétez le formulaire pour voir l'aperçu de votre simulation</p>
        </div>
      `;
    }
    
    // Réinitialiser les résultats
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="results-placeholder">
          <svg class="results-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          <p>Calcul en cours...</p>
        </div>
      `;
    }
    
    // Masquer les champs SPV
    const spvFields = document.getElementById('spv-fields');
    if (spvFields) {
      spvFields.style.display = 'none';
    }
    
    showNotification('Formulaire réinitialisé', 'info');
  }
}

/**
 * Affiche la modale À propos
 */
function handleAbout() {
  // Créer une modale simple
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">À propos d'Horizon</h3>
        <button class="modal__close" aria-label="Fermer">&times;</button>
      </div>
      <div class="modal__body">
        <p><strong>Horizon</strong> est un simulateur de retraite pour les sapeurs-pompiers professionnels (SPP).</p>
        <p>Cet outil fournit une estimation indicative de votre future pension selon différents scénarios de départ.</p>
        <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--color-gray-200);">
        <p style="font-size: 0.875rem; color: var(--color-text-muted);">
          <strong>Version :</strong> 1.0.0<br>
          <strong>Développé par :</strong> XRWeb<br>
          <strong>Dernière mise à jour :</strong> Janvier 2026
        </p>
        <div class="alert alert--warning" style="margin-top: 1rem;">
          <div class="alert__content">
            <strong>Avertissement</strong>
            <p style="margin: 0;">Cette simulation est fournie à titre indicatif. Seule la CNRACL est habilitée à calculer vos droits définitifs.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Fermer la modale
  const closeModal = () => {
    modal.remove();
    document.body.style.overflow = '';
  };
  
  modal.querySelector('.modal__close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

/**
 * Configure le calcul automatique des années de cotisation RAFP
 * Formule : max(date entrée SPP, 2005) → date de départ prévue
 */
function setupAnneesRAFPAutoCalcul() {
  const dateEntreeSPPInput = document.getElementById('dateEntreeSPP');
  const anneesCotisationRAFPInput = document.getElementById('anneesCotisationRAFP');
  
  if (!dateEntreeSPPInput || !anneesCotisationRAFPInput) return;

  function updateAnneesRAFP() {
    const dateEntreeSPP = dateEntreeSPPInput.value ? new Date(dateEntreeSPPInput.value) : null;
    
    if (!dateEntreeSPP || isNaN(dateEntreeSPP.getTime())) {
      anneesCotisationRAFPInput.value = 0;
      return;
    }

    // Date de début RAFP = max(date entrée SPP, 01/01/2005)
    const dateCreationRAFP = new Date(PFR.ANNEE_CREATION_RAFP, 0, 1);
    const dateDebutRAFP = new Date(Math.max(dateEntreeSPP.getTime(), dateCreationRAFP.getTime()));
    
    // Date de fin = aujourd'hui (pour l'instant, sera la date de départ au calcul final)
    const dateFin = new Date();
    
    // Calcul des années
    const anneesRAFP = Math.max(0, Math.floor(
      (dateFin.getTime() - dateDebutRAFP.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    ));
    
    anneesCotisationRAFPInput.value = anneesRAFP;
  }

  // Mettre à jour quand la date d'entrée SPP change
  dateEntreeSPPInput.addEventListener('change', updateAnneesRAFP);
  
  // Calcul initial si une valeur existe déjà
  if (dateEntreeSPPInput.value) {
    updateAnneesRAFP();
  }
}

/**
 * Configure l'affichage conditionnel des champs SPV (double statut)
 */
function setupDoubleStatutToggle() {
  const checkbox = document.getElementById('doubleStatut');
  const spvFields = document.getElementById('spv-fields');

  if (checkbox && spvFields) {
    checkbox.addEventListener('change', () => {
      spvFields.style.display = checkbox.checked ? 'block' : 'none';
    });
  }
}

/**
 * Configure l'affichage conditionnel des champs services militaires (BSPP/BMPM)
 */
function setupServicesMilitairesToggle() {
  const select = document.getElementById('servicesMilitaires');
  const fieldsContainer = document.getElementById('services-militaires-fields');

  if (select && fieldsContainer) {
    select.addEventListener('change', () => {
      const hasServiceMilitaire = select.value !== 'aucun';
      fieldsContainer.style.display = hasServiceMilitaire ? 'flex' : 'none';

      // Réinitialiser les valeurs si "aucun" est sélectionné
      if (!hasServiceMilitaire) {
        const anneesInput = document.getElementById('dureeServicesMilitairesAnnees');
        const moisInput = document.getElementById('dureeServicesMilitairesMois');
        if (anneesInput) anneesInput.value = '0';
        if (moisInput) moisInput.value = '0';
      }
    });
  }
}

/**
 * Barème PFR SPV selon les années de service
 * Réf: Décret n°2005-1150 du 13 septembre 2005
 */
const BAREME_PFR_SPV = {
  15: 512,   // 15 ans : 512€/an (cas incapacité)
  20: 1025,  // 20 ans : 1025€/an
  25: 2050,  // 25 ans : 2050€/an
  30: 2690,  // 30 ans : 2690€/an
  35: 3075,  // 35 ans et + : 3075€/an
};

/**
 * Calcule le montant de la PFR SPV selon les années de service
 * @param {number} anneesSPV - Années de service SPV
 * @returns {number} Montant annuel de la PFR SPV
 */
function getMontantPFRSPV(anneesSPV) {
  if (anneesSPV >= 35) return BAREME_PFR_SPV[35];
  if (anneesSPV >= 30) return BAREME_PFR_SPV[30];
  if (anneesSPV >= 25) return BAREME_PFR_SPV[25];
  if (anneesSPV >= 20) return BAREME_PFR_SPV[20];
  if (anneesSPV >= 15) return BAREME_PFR_SPV[15]; // Cas incapacité opérationnelle
  return 0;
}

/**
 * Calcule la PFR SPV pour les agents en double statut
 * @param {boolean} doubleStatut - Si l'agent a le double statut
 * @param {number} anneesSPV - Années de service SPV
 * @param {number} montantManuel - Montant saisi manuellement (optionnel)
 * @returns {Object} Résultat du calcul PFR SPV
 */
function calculerPFRSPV(doubleStatut, anneesSPV, montantManuel) {
  if (!doubleStatut || anneesSPV < 15) {
    return {
      eligible: false,
      anneesSPV: anneesSPV || 0,
      montantAnnuel: 0,
      montantMensuel: 0,
    };
  }

  // Utiliser le montant manuel si renseigné, sinon calcul automatique
  const montantAnnuel = montantManuel > 0 ? montantManuel : getMontantPFRSPV(anneesSPV);

  return {
    eligible: anneesSPV >= 20, // Éligibilité standard à 20 ans
    eligibleIncapacite: anneesSPV >= 15 && anneesSPV < 20, // Éligibilité cas incapacité
    anneesSPV,
    montantAnnuel,
    montantMensuel: Math.round((montantAnnuel / 12) * 100) / 100,
  };
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
    console.log('Données du formulaire:', formData);

    // Vérifier les données obligatoires
    if (!formData.dateNaissance || !formData.dateEntreeSPP || !formData.indiceBrut) {
      const champsManquants = [];
      if (!formData.dateNaissance) champsManquants.push('Date de naissance');
      if (!formData.dateEntreeSPP) champsManquants.push("Date d'entrée SPP");
      if (!formData.indiceBrut) champsManquants.push('Indice brut');
      
      console.warn('Champs obligatoires manquants:', champsManquants);
      showNotification(`Champs manquants : ${champsManquants.join(', ')}`, 'error');
      
      const container = document.getElementById('results-container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert--warning">
            <div class="alert__content">
              <strong>Données incomplètes</strong>
              <p>Veuillez remplir les champs obligatoires : ${champsManquants.join(', ')}</p>
            </div>
          </div>
        `;
      }
      return;
    }

    // Créer et enrichir le profil
    const profil = creerProfil(formData);
    console.log('Profil créé:', profil);
    
    const profilEnrichi = enrichirProfil(profil);
    console.log('Profil enrichi:', profilEnrichi);

    if (!profilEnrichi.valide) {
      console.warn('Profil invalide:', profilEnrichi.erreurs);
      showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
      return;
    }

    // Effectuer les calculs
    console.log('Début des calculs...');
    const resultats = effectuerCalculs(formData, profilEnrichi);
    console.log('Résultats calculés:', resultats);

    // Stocker dans l'état
    appState.profil = profilEnrichi;
    appState.resultats = resultats;
    appState.isCalculated = true;

    // Afficher les résultats
    const container = document.getElementById('results-container');
    console.log('Container trouvé:', container);
    afficherResultats(resultats, container);

    // Notification de succès
    showNotification('Simulation calculée avec succès', 'success');

  } catch (error) {
    console.error('Erreur lors du calcul:', error);
    console.error('Stack trace:', error.stack);
    showNotification('Une erreur est survenue lors du calcul', 'error');
    
    // Afficher l'erreur dans le conteneur de résultats
    const container = document.getElementById('results-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert--error">
          <div class="alert__content">
            <strong>Erreur de calcul</strong>
            <p>${error.message}</p>
            <p style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.5rem;">
              Vérifiez que tous les champs obligatoires sont remplis correctement.
            </p>
          </div>
        </div>
      `;
    }
  }
}

/**
 * Collecte les données du formulaire
 * @returns {Object} Données collectées
 */
function collectFormData() {
  const form = document.getElementById('simulator-form');
  const formData = new FormData(form);

  // Services militaires (BSPP/BMPM)
  const servicesMilitaires = formData.get('servicesMilitaires') || 'aucun';
  const dureeServicesMilitairesAnnees = parseInt(formData.get('dureeServicesMilitairesAnnees'), 10) || 0;
  const dureeServicesMilitairesMois = parseInt(formData.get('dureeServicesMilitairesMois'), 10) || 0;

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
    anneesCotisationRAFP: parseInt(formData.get('anneesCotisationRAFP'), 10) || 0,
    // Double statut SPP/SPV (utilise anneesSPV du profil)
    doubleStatut: formData.get('doubleStatut') === 'on',
    montantPFRSPV: parseFloat(formData.get('montantPFRSPV')) || 0,
    // Services militaires (BSPP/BMPM)
    servicesMilitaires: servicesMilitaires,
    dureeServicesMilitairesAnnees: dureeServicesMilitairesAnnees,
    dureeServicesMilitairesMois: dureeServicesMilitairesMois,
    // Durée totale en trimestres (pour les calculs)
    trimestresServicesMilitaires: servicesMilitaires !== 'aucun'
      ? Math.floor((dureeServicesMilitairesAnnees * 12 + dureeServicesMilitairesMois) / 3)
      : 0,
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
    // Services militaires (BSPP/BMPM)
    servicesMilitaires: formData.servicesMilitaires,
    trimestresServicesMilitaires: formData.trimestresServicesMilitaires,
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

  // 3. Déterminer si la NBI doit être intégrée au TIB (perception ≥ 15 ans)
  // Réf: Décret n°2006-779, Art. 2 - NBI intégrée si perçue 15 ans ou plus
  const dureeNBIAnnees = formData.dureeNBI || 0;
  const nbiIntegrable = dureeNBIAnnees >= 15;
  const pointsNBIIntegres = nbiIntegrable ? (formData.pointsNBI || 0) : 0;

  // 4. Calculer la pension pour chaque scénario
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
      pointsNBIIntegres,
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

  // 5. Calculer la pension au taux plein (scénario principal)
  const pensionTauxPlein = calculerPension({
    indiceBrut: formData.indiceBrut,
    trimestresLiquidables: dureeTauxPlein.trimestresLiquidables,
    trimestresAssurance: dureeTauxPlein.trimestresAssuranceTotale,
    trimestresRequis,
    dateNaissance: formData.dateNaissance,
    dateDepart: dateTauxPlein,
    pointsNBIIntegres,
  });

  // 6. Calculer la PFR et le RAFP
  // Utiliser les années de cotisation RAFP du formulaire si renseignées,
  // sinon calculer automatiquement depuis 2005
  let anneesRAFP = formData.anneesCotisationRAFP;
  if (!anneesRAFP || anneesRAFP === 0) {
    const dateDebutRAFP = new Date(Math.max(
      formData.dateEntreeSPP.getTime(),
      new Date(PFR.ANNEE_CREATION_RAFP, 0, 1).getTime()
    ));
    anneesRAFP = Math.max(0, Math.floor(
      (dateTauxPlein.getTime() - dateDebutRAFP.getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
    ));
  }

  // Calculer l'âge au taux plein pour le coefficient RAFP
  const ageTauxPleinRAFP = Math.floor(
    (dateTauxPlein.getTime() - formData.dateNaissance.getTime()) /
    (365.25 * 24 * 60 * 60 * 1000)
  );

  const pfr = calculerPFR({
    indiceBrut: formData.indiceBrut,
    montantAnnuelPFR: formData.montantPFR,
    anneesCotisation: anneesRAFP,
  }, ageTauxPleinRAFP);

  // 7. Calculer le supplément NBI
  // Note : Si la NBI est intégrée au TIB (≥ 15 ans), le supplément séparé est nul
  // car la NBI fait déjà partie du calcul de la pension principale
  let nbi;
  if (nbiIntegrable) {
    // NBI intégrée au TIB - pas de supplément séparé
    nbi = {
      eligible: true,
      integreTIB: true,
      pointsNBI: formData.pointsNBI,
      dureeMoisNBI: formData.dureeNBI * 12,
      dureeAnneesNBI: formData.dureeNBI,
      moyennePonderee: formData.pointsNBI, // 100% car ≥ 15 ans
      supplementMensuel: 0, // Intégré au TIB, pas de supplément séparé
      supplementAnnuel: 0,
      motifIneligibilite: '',
    };
  } else {
    // NBI en supplément séparé (prorata)
    nbi = calculerNBI({
      pointsNBI: formData.pointsNBI,
      dureeMoisNBI: formData.dureeNBI * 12,
      dureeServicesTotal: dureeTauxPlein.trimestresLiquidables,
      tauxLiquidation: pensionTauxPlein.tauxLiquidationNet,
    });
    if (nbi.eligible) {
      nbi.integreTIB = false;
    }
  }

  // 8. Calculer la PFR SPV (double statut) - utilise anneesSPV du profil
  const pfrSPV = calculerPFRSPV(formData.doubleStatut, formData.anneesSPV, formData.montantPFRSPV);

  // 9. Calculer le total retraite
  const totalRetraite =
    pensionTauxPlein.pensionBruteMensuelle +
    (nbi.eligible ? nbi.supplementMensuel : 0) +
    pfr.renteRAFPMensuelle +
    (pfrSPV.eligible ? pfrSPV.montantMensuel : 0);

  // 10. Calculer l'âge au taux plein
  const ageTauxPlein = Math.floor(
    (dateTauxPlein.getTime() - formData.dateNaissance.getTime()) /
    (365.25 * 24 * 60 * 60 * 1000)
  );

  // 11. Générer les scénarios de surcote (si taux plein atteint par durée)
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
    pfrSPV,
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
        servicesMilitaires: formData.servicesMilitaires,
        trimestresServicesMilitaires: formData.trimestresServicesMilitaires,
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
          ${dureeActuelle.trimestresServicesMilitaires > 0 ? `
            <div class="details-list__item">
              <dt>Services ${dureeActuelle.servicesMilitaires.toUpperCase()}</dt>
              <dd>+${dureeActuelle.trimestresServicesMilitaires} trim. (+${dureeActuelle.trimestresBonificationMilitaire} bonif.)</dd>
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
 * Gère l'export CSV
 */
function handleExportCSV() {
  if (!appState.isCalculated || !appState.resultats) {
    showNotification('Veuillez d\'abord effectuer une simulation', 'warning');
    return;
  }

  exporterCSV(appState.resultats, appState.profil.donnees);
  showNotification('Export CSV téléchargé', 'success');
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
  document.addEventListener('DOMContentLoaded', safeInit);
} else {
  safeInit();
}

/**
 * Wrapper sécurisé pour l'initialisation
 */
function safeInit() {
  try {
    init();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    
    // Afficher un message d'erreur dans le DOM si possible
    const main = document.querySelector('.main');
    if (main) {
      main.innerHTML = `
        <div class="alert alert--error" style="margin: 2rem;">
          <div class="alert__content">
            <strong>Erreur d'initialisation</strong>
            <p>L'application n'a pas pu démarrer correctement. Veuillez rafraîchir la page.</p>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">Détail: ${error.message}</p>
          </div>
        </div>
      `;
    }
  }
}

// Export pour les tests
export { appState, effectuerCalculs };
