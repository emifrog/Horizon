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
    });

    input.addEventListener('input', () => {
      // Mise à jour des données
      updateFormData(input);

      // Validation si le champ a déjà été touché
      if (formState.touched[input.name]) {
        validateField(input);
      }
    });
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

  // Navigation par le stepper
  document.querySelectorAll('[data-step]').forEach((stepEl) => {
    stepEl.addEventListener('click', () => {
      const targetStep = parseInt(stepEl.dataset.step, 10);
      if (targetStep < formState.currentStep) {
        goToStep(targetStep);
      }
    });
  });
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

  // Attributs ARIA pour l'accessibilité
  if (error) {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorId);

    const errorEl = document.createElement('span');
    errorEl.className = 'error-message';
    errorEl.id = errorId;
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'polite');
    errorEl.textContent = error;
    container.appendChild(errorEl);
  } else {
    input.setAttribute('aria-invalid', 'false');
    input.removeAttribute('aria-describedby');
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
    formState.currentStep++;
    showStep(formState.currentStep);
    updateStepperUI();
  }
}

/**
 * Revient à l'étape précédente
 */
function goToPreviousStep() {
  if (formState.currentStep > 1) {
    formState.currentStep--;
    showStep(formState.currentStep);
    updateStepperUI();
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
  }
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
  document.querySelectorAll('[data-step]').forEach((el) => {
    const step = parseInt(el.dataset.step, 10);

    el.classList.remove('stepper__step--active', 'stepper__step--completed', 'stepper__step--clickable');

    if (step === formState.currentStep) {
      el.classList.add('stepper__step--active');
    } else if (step < formState.currentStep) {
      el.classList.add('stepper__step--completed', 'stepper__step--clickable');
    }
  });

  // Mettre à jour la barre de progression
  const progress = ((formState.currentStep - 1) / (formState.totalSteps - 1)) * 100;
  const progressBar = document.querySelector('.stepper__progress-fill');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
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
  notification.innerHTML = `
    <span class="notification__message">${message}</span>
    <button class="notification__close" aria-label="Fermer">&times;</button>
  `;

  container.appendChild(notification);

  // Fermeture au clic
  notification.querySelector('.notification__close').addEventListener('click', () => {
    notification.remove();
  });

  // Auto-fermeture après 5 secondes
  setTimeout(() => {
    notification.classList.add('notification--fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
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
    el.removeAttribute('aria-describedby');
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
