/**
 * Module Form - Gestion du formulaire multi-étapes
 *
 * @module ui/form
 */

import { parseDateFR } from '../utils/dates.js';
import { validerProfil, validerIndiceBrut, validerTrimestres } from '../utils/validators.js';

/**
 * État du formulaire
 */
let formState = {
  currentStep: 1,
  totalSteps: 4,
  data: {},
  errors: {},
  touched: {},
};

/**
 * Initialise le formulaire
 * @param {HTMLFormElement} formElement - Élément formulaire
 */
export function initForm(formElement) {
  if (!formElement) return;

  formState = {
    currentStep: 1,
    totalSteps: 4,
    data: {},
    errors: {},
    touched: {},
  };

  // Initialiser les écouteurs
  setupInputListeners(formElement);
  setupNavigationListeners();
  updateStepperUI();
  showStep(1);
}

/**
 * Configure les écouteurs sur les champs de saisie
 * @param {HTMLFormElement} formElement - Formulaire
 */
function setupInputListeners(formElement) {
  const inputs = formElement.querySelectorAll('input, select');

  inputs.forEach((input) => {
    // Validation en temps réel
    input.addEventListener('blur', () => {
      formState.touched[input.name] = true;
      validateField(input);

      // Restaurer 0 si le champ numérique est vide
      if (input.type === 'number' && input.value === '' && !input.required) {
        input.value = '0';
      }
    });

    input.addEventListener('input', () => {
      // Mise à jour des données
      updateFormData(input);

      // Validation si le champ a déjà été touché
      if (formState.touched[input.name]) {
        validateField(input);
      }
    });

    // Effacer le 0 initial au focus sur les champs numériques
    if (input.type === 'number') {
      input.addEventListener('focus', () => {
        if (input.value === '0') {
          input.value = '';
        }
      });
    }
  });
}

/**
 * Configure les boutons de navigation
 */
function setupNavigationListeners() {
  // Boutons précédent/suivant
  document.querySelectorAll('[data-action="prev-step"]').forEach((btn) => {
    btn.addEventListener('click', () => goToPreviousStep());
  });

  document.querySelectorAll('[data-action="next-step"]').forEach((btn) => {
    btn.addEventListener('click', () => goToNextStep());
  });

  // Navigation par le stepper (tabs)
  const tabs = Array.from(document.querySelectorAll('.stepper__step[data-step]'));

  tabs.forEach((stepEl) => {
    stepEl.addEventListener('click', () => {
      const targetStep = parseInt(stepEl.dataset.step, 10);
      if (targetStep < formState.currentStep) {
        goToStep(targetStep);
      }
    });
  });

  // Pattern clavier WAI-ARIA Tabs : flèches, Home, End
  const tablist = document.querySelector('.stepper[role="tablist"]');
  if (tablist) {
    tablist.addEventListener('keydown', (e) => {
      const focusable = tabs.filter((t) => !t.disabled);
      if (!focusable.length) return;
      const currentIndex = focusable.indexOf(document.activeElement);
      let nextIndex = null;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % focusable.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = focusable.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      const target = focusable[nextIndex];
      if (target) {
        target.focus();
        const targetStep = parseInt(target.dataset.step, 10);
        if (targetStep < formState.currentStep) {
          goToStep(targetStep);
        }
      }
    });
  }
}

/**
 * Met à jour les données du formulaire
 * @param {HTMLInputElement} input - Champ de saisie
 */
function updateFormData(input) {
  const { name, type, value, checked } = input;

  if (type === 'checkbox') {
    formState.data[name] = checked;
  } else if (type === 'number') {
    formState.data[name] = value ? parseFloat(value) : null;
  } else if (type === 'date') {
    formState.data[name] = value ? new Date(value) : null;
  } else {
    formState.data[name] = value;
  }
}

/**
 * Valide un champ spécifique
 * @param {HTMLInputElement} input - Champ à valider
 * @returns {boolean} True si valide
 */
function validateField(input) {
  const { name, value, required } = input;
  let error = null;

  // Vérification champ requis
  if (required && !value) {
    error = 'Ce champ est obligatoire';
  }

  // Validations spécifiques
  if (!error && value) {
    switch (name) {
      case 'dateNaissance':
      case 'anneeNaissance':
        const dateVal = name === 'anneeNaissance'
          ? new Date(parseInt(value, 10), 6, 1)
          : parseDateFR(value) || new Date(value);
        const result = validerProfil({ dateNaissance: dateVal });
        if (!result.valide && result.erreurs.dateNaissance) {
          error = result.erreurs.dateNaissance;
        }
        break;

      case 'indiceBrut':
        const indiceResult = validerIndiceBrut(parseInt(value, 10));
        if (!indiceResult.valide) {
          error = indiceResult.erreur;
        }
        break;

      case 'trimestresAutresRegimes':
        const trimResult = validerTrimestres(parseInt(value, 10));
        if (!trimResult.valide) {
          error = trimResult.erreur;
        }
        break;
    }
  }

  // Mise à jour de l'état d'erreur
  formState.errors[name] = error;

  // Affichage de l'erreur
  displayFieldError(input, error);

  return !error;
}

/**
 * Affiche l'erreur d'un champ avec attributs ARIA pour l'accessibilité
 * @param {HTMLInputElement} input - Champ
 * @param {string|null} error - Message d'erreur
 */
function displayFieldError(input, error) {
  const container = input.closest('.form-group');
  if (!container) return;

  // Générer un ID unique pour le message d'erreur
  const errorId = `error-${input.name || input.id || Math.random().toString(36).substr(2, 9)}`;

  // Supprimer l'ancienne erreur
  const existingError = container.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  // Mettre à jour les classes
  input.classList.toggle('input--error', !!error);
  container.classList.toggle('has-error', !!error);

  // Conserver le lien vers le texte d'aide (hint) existant
  const hintEl = container.querySelector('.form-hint');
  const hintId = hintEl ? hintEl.id : '';

  // Attributs ARIA pour l'accessibilité
  if (error) {
    input.setAttribute('aria-invalid', 'true');
    // Hint + erreur : le lecteur d'écran annonce les deux
    input.setAttribute('aria-describedby', [hintId, errorId].filter(Boolean).join(' '));

    const errorEl = document.createElement('span');
    errorEl.className = 'error-message';
    errorEl.id = errorId;
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'polite');
    errorEl.textContent = error;
    container.appendChild(errorEl);
  } else {
    input.setAttribute('aria-invalid', 'false');
    if (hintId) {
      input.setAttribute('aria-describedby', hintId);
    } else {
      input.removeAttribute('aria-describedby');
    }
  }
}

/**
 * Valide une étape complète
 * @param {number} step - Numéro de l'étape
 * @returns {boolean} True si l'étape est valide
 */
function validateStep(step) {
  const stepEl = document.querySelector(`[data-step-content="${step}"]`);
  if (!stepEl) return true;

  const inputs = stepEl.querySelectorAll('input[required], select[required]');
  let isValid = true;

  inputs.forEach((input) => {
    formState.touched[input.name] = true;
    if (!validateField(input)) {
      isValid = false;
    }
  });

  return isValid;
}

/**
 * Passe à l'étape suivante
 */
function goToNextStep() {
  if (!validateStep(formState.currentStep)) {
    showNotification('Veuillez corriger les erreurs avant de continuer', 'error');
    return;
  }

  if (formState.currentStep < formState.totalSteps) {
    goToStep(formState.currentStep + 1);
  }
}

/**
 * Revient à l'étape précédente
 */
function goToPreviousStep() {
  if (formState.currentStep > 1) {
    goToStep(formState.currentStep - 1);
  }
}

/**
 * Va à une étape spécifique
 * @param {number} step - Numéro de l'étape
 */
function goToStep(step) {
  if (step >= 1 && step <= formState.totalSteps) {
    formState.currentStep = step;
    showStep(step);
    updateStepperUI();
    scrollToFormTop();
    announceStep(step);
    focusStepPanel(step);
    document.dispatchEvent(new CustomEvent('horizon:step-changed', { detail: { step } }));
  }
}

/**
 * Déplace le focus clavier vers le panneau de la nouvelle étape.
 * Corrige la perte de focus au changement d'étape (notamment à l'étape 4 où le
 * bouton « Suivant » disparaît, ce qui renvoyait le focus sur <body>).
 * Le panneau porte tabindex="-1" ; on préserve le défilement déjà géré par
 * scrollToFormTop().
 * @param {number} step
 */
function focusStepPanel(step) {
  const panel = document.querySelector(`[data-step-content="${step}"]`);
  if (panel && typeof panel.focus === 'function') {
    panel.focus({ preventScroll: true });
  }
}

/**
 * Annonce le changement d'étape via la région live, pour les lecteurs d'écran.
 * @param {number} step
 */
function announceStep(step) {
  const announcer = document.getElementById('sr-announcer');
  if (!announcer) return;
  const tab = document.querySelector(`.stepper__step[data-step="${step}"]`);
  const label = tab ? tab.querySelector('.stepper__step-label')?.textContent.trim() : '';
  const message = `Étape ${step} sur ${formState.totalSteps}${label ? ` : ${label}` : ''}`;
  // Vider puis réécrire force l'annonce même si le texte est identique
  announcer.textContent = '';
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

/**
 * Remonte le scroll en haut du formulaire lors d'un changement d'étape.
 * Utile surtout sur mobile, où la nouvelle étape apparaîtrait sinon hors-écran.
 */
function scrollToFormTop() {
  const formSection = document.querySelector('.simulator__form-section');
  if (!formSection) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const headerEl = document.querySelector('.header');
  const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;
  const target = formSection.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
  window.scrollTo({
    top: Math.max(0, target),
    behavior: prefersReduced ? 'auto' : 'smooth',
  });
}

/** Étape précédente pour l'animation */
let previousStep = 1;

/**
 * Affiche une étape avec animation de transition
 * @param {number} step - Numéro de l'étape
 */
function showStep(step) {
  const direction = step > previousStep ? 'next' : 'prev';
  const currentStepEl = document.querySelector(`[data-step-content="${previousStep}"]`);
  const nextStepEl = document.querySelector(`[data-step-content="${step}"]`);

  // Si c'est la même étape ou pas d'éléments, pas d'animation
  if (step === previousStep || !nextStepEl) {
    if (nextStepEl) {
      nextStepEl.classList.add('step--active');
      nextStepEl.hidden = false;
    }
    updateNavigationButtons();
    triggerCalculationIfNeeded(step);
    return;
  }

  // Vérifier si les animations sont réduites
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Transition instantanée sans animation
    document.querySelectorAll('[data-step-content]').forEach((el) => {
      el.classList.remove('step--active');
      el.hidden = true;
    });
    nextStepEl.classList.add('step--active');
    nextStepEl.hidden = false;
  } else {
    // Transition avec animation
    // Préparer l'étape suivante (invisible mais présente)
    nextStepEl.hidden = false;
    nextStepEl.classList.add(`step--entering-${direction}`);

    // Animer la sortie de l'étape actuelle
    if (currentStepEl) {
      currentStepEl.classList.add(`step--leaving-${direction}`);
    }

    // Après l'animation, nettoyer les classes
    setTimeout(() => {
      // Masquer toutes les étapes sauf la nouvelle
      document.querySelectorAll('[data-step-content]').forEach((el) => {
        el.classList.remove(
          'step--active',
          'step--entering-next',
          'step--entering-prev',
          'step--leaving-next',
          'step--leaving-prev'
        );
        if (el !== nextStepEl) {
          el.hidden = true;
        }
      });

      // Activer la nouvelle étape
      nextStepEl.classList.add('step--active');
    }, 350); // Durée de l'animation
  }

  // Mettre à jour l'étape précédente
  previousStep = step;

  // Mettre à jour les boutons de navigation
  updateNavigationButtons();

  // Déclencher le calcul si nécessaire
  triggerCalculationIfNeeded(step);
}

/**
 * Déclenche le calcul automatique à l'étape des résultats
 * @param {number} step - Numéro de l'étape
 */
function triggerCalculationIfNeeded(step) {
  if (step === formState.totalSteps) {
    const form = document.getElementById('simulator-form');
    if (form) {
      // Petit délai pour laisser l'animation se terminer
      setTimeout(() => {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }, 100);
    }
  }
}

/**
 * Met à jour l'interface du stepper
 */
function updateStepperUI() {
  document.querySelectorAll('.stepper__step[data-step]').forEach((el) => {
    const step = parseInt(el.dataset.step, 10);
    const isActive = step === formState.currentStep;
    const isCompleted = step < formState.currentStep;

    el.classList.remove('stepper__step--active', 'stepper__step--completed', 'stepper__step--clickable');

    if (isActive) {
      el.classList.add('stepper__step--active');
    } else if (isCompleted) {
      el.classList.add('stepper__step--completed', 'stepper__step--clickable');
    }

    // ARIA + roving tabindex (pattern tablist)
    el.setAttribute('aria-selected', isActive ? 'true' : 'false');
    el.setAttribute('tabindex', isActive ? '0' : '-1');
    // Une étape n'est atteignable au clavier/souris que si déjà complétée
    el.disabled = !isActive && !isCompleted;
  });

  // Barre de progression
  const progress = ((formState.currentStep - 1) / (formState.totalSteps - 1)) * 100;
  const progressBar = document.querySelector('.stepper__progress-fill');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }

  // Mettre à jour le rôle progressbar (valeur + label parlé)
  const progressEl = document.querySelector('.stepper__progress[role="progressbar"]');
  if (progressEl) {
    const pct = Math.round(progress);
    progressEl.setAttribute('aria-valuenow', String(pct));
    progressEl.setAttribute(
      'aria-label',
      `Progression du formulaire : étape ${formState.currentStep} sur ${formState.totalSteps}`
    );
  }
}

/**
 * Met à jour les boutons de navigation
 */
function updateNavigationButtons() {
  const prevBtns = document.querySelectorAll('[data-action="prev-step"]');
  const nextBtns = document.querySelectorAll('[data-action="next-step"]');
  const submitBtn = document.querySelector('[data-action="submit"]');

  // Bouton précédent
  prevBtns.forEach((btn) => {
    btn.disabled = formState.currentStep === 1;
    btn.style.visibility = formState.currentStep === 1 ? 'hidden' : 'visible';
  });

  // Bouton suivant / soumettre
  nextBtns.forEach((btn) => {
    btn.style.display = formState.currentStep === formState.totalSteps ? 'none' : 'inline-flex';
  });

  if (submitBtn) {
    submitBtn.style.display = formState.currentStep === formState.totalSteps ? 'inline-flex' : 'none';
  }
}

/**
 * Affiche une notification
 * @param {string} message - Message
 * @param {string} type - Type (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
  const container = document.querySelector('.notifications') || createNotificationContainer();

  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const text = document.createElement('span');
  text.className = 'notification__message';
  text.textContent = message; // échappement automatique

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'notification__close';
  close.setAttribute('aria-label', 'Fermer');
  close.innerHTML = '&times;';

  notification.append(text, close);
  container.appendChild(notification);

  let timeoutId;
  const dismiss = () => {
    clearTimeout(timeoutId);
    notification.classList.add('notification--fade-out');
    setTimeout(() => notification.remove(), 300);
  };

  close.addEventListener('click', dismiss);
  timeoutId = setTimeout(dismiss, 5000);
}

/**
 * Crée le conteneur de notifications
 * @returns {HTMLElement} Conteneur
 */
function createNotificationContainer() {
  const container = document.createElement('div');
  container.className = 'notifications';
  document.body.appendChild(container);
  return container;
}

/**
 * Récupère les données du formulaire
 * @returns {Object} Données du formulaire
 */
export function getFormData() {
  return { ...formState.data };
}

/**
 * Définit les données du formulaire
 * @param {Object} data - Données à définir
 */
export function setFormData(data) {
  formState.data = { ...formState.data, ...data };

  // Mettre à jour les champs
  Object.entries(data).forEach(([name, value]) => {
    const input = document.querySelector(`[name="${name}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = !!value;
      } else if (input.type === 'date' && value instanceof Date) {
        input.value = value.toISOString().split('T')[0];
      } else {
        input.value = value ?? '';
      }
    }
  });
}

/**
 * Réinitialise le formulaire
 */
export function resetForm() {
  const form = document.querySelector('form');
  if (form) {
    form.reset();
  }

  formState = {
    currentStep: 1,
    totalSteps: 4,
    data: {},
    errors: {},
    touched: {},
  };

  // Réinitialiser l'état de l'animation
  previousStep = 1;

  showStep(1);
  updateStepperUI();

  // Supprimer toutes les erreurs affichées et nettoyer les attributs ARIA
  document.querySelectorAll('.error-message').forEach((el) => el.remove());
  document.querySelectorAll('.input--error').forEach((el) => {
    el.classList.remove('input--error');
    el.setAttribute('aria-invalid', 'false');
    // Restaurer le lien vers le texte d'aide plutôt que de tout supprimer
    const hint = el.closest('.form-group')?.querySelector('.form-hint');
    if (hint && hint.id) {
      el.setAttribute('aria-describedby', hint.id);
    } else {
      el.removeAttribute('aria-describedby');
    }
  });
  document.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
}

/**
 * Vérifie si le formulaire est complet et valide
 * @returns {boolean} True si le formulaire est complet
 */
export function isFormComplete() {
  for (let step = 1; step <= formState.totalSteps; step++) {
    if (!validateStep(step)) {
      return false;
    }
  }
  return true;
}

export { formState, goToStep, showNotification };
