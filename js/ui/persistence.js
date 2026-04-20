/**
 * Module Persistence — Sauvegarde locale et partage d'une simulation
 *
 * Deux canaux, une sérialisation commune :
 *   • localStorage     → sauvegarde opt-in sur l'appareil de l'utilisateur
 *   • URL ?profile=... → partage d'une simulation par lien (base64url)
 *
 * Aucune donnée ne quitte l'appareil sans action explicite de l'utilisateur.
 *
 * @module ui/persistence
 */

import { setFormData, showNotification, goToStep } from './form.js';

const STORAGE_KEY = 'horizon:last-simulation';
const CONSENT_KEY = 'horizon:storage-consent';
const SESSION_KEY = 'horizon:session-draft';
const URL_PARAM = 'profile';
const CURRENT_VERSION = 1;

/**
 * Champs sérialisables du formulaire.
 * Ordre figé : sert à la fois de référence et de schéma d'encodage.
 */
const FIELDS = [
  'dateNaissance',
  'dateEntreeSPP',
  'quotite',
  'anneesSPV',
  'servicesMilitaires',
  'dureeServicesMilitairesAnnees',
  'dureeServicesMilitairesMois',
  'trimestresAutresRegimes',
  'enfantsAvant2004',
  'indiceBrut',
  'pointsNBI',
  'dureeNBI',
  'montantPFR',
  'anneesCotisationRAFP',
  'doubleStatut',
  'montantPFRSPV',
];

// =============================================================================
// SÉRIALISATION
// =============================================================================

/**
 * Collecte les valeurs sérialisables depuis le DOM.
 * @returns {Object} snapshot des champs du formulaire
 */
function collectSnapshot() {
  const snapshot = { v: CURRENT_VERSION };
  FIELDS.forEach((name) => {
    const input = document.querySelector(`[name="${name}"]`);
    if (!input) return;
    if (input.type === 'checkbox') {
      snapshot[name] = input.checked;
    } else {
      snapshot[name] = input.value;
    }
  });
  return snapshot;
}

/**
 * Applique un snapshot au formulaire.
 * @param {Object} snapshot - Données à restaurer
 */
function applySnapshot(snapshot) {
  if (!snapshot || snapshot.v !== CURRENT_VERSION) return;

  const data = {};
  FIELDS.forEach((name) => {
    if (snapshot[name] !== undefined) {
      data[name] = snapshot[name];
    }
  });
  setFormData(data);

  // Déclencher les listeners dépendants (toggle SPV, services militaires, RAFP)
  ['servicesMilitaires', 'doubleStatut', 'dateEntreeSPP'].forEach((name) => {
    const input = document.querySelector(`[name="${name}"]`);
    if (input) input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

// =============================================================================
// ENCODAGE URL (base64url, UTF-8 safe)
// =============================================================================

/**
 * Encode une chaîne en base64url (URL-safe, sans padding).
 * @param {string} str
 * @returns {string}
 */
function toBase64Url(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Décode une chaîne base64url.
 * @param {string} b64url
 * @returns {string}
 */
function fromBase64Url(b64url) {
  const pad = b64url.length % 4 === 0 ? '' : '='.repeat(4 - (b64url.length % 4));
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(escape(atob(b64)));
}

// =============================================================================
// LOCALSTORAGE — SAUVEGARDE OPT-IN
// =============================================================================

/**
 * L'utilisateur a-t-il donné son consentement à la sauvegarde locale ?
 * @returns {boolean}
 */
export function hasStorageConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

/**
 * Enregistre le consentement (true/false) de l'utilisateur.
 * @param {boolean} granted
 */
export function setStorageConsent(granted) {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  } catch {
    // Stockage indisponible (mode navigation privée strict, etc.) — on ignore.
  }
}

/**
 * Sauvegarde la simulation courante dans localStorage (si consentement).
 * @returns {boolean} true si sauvegardé
 */
export function saveSimulationLocally() {
  if (!hasStorageConsent()) return false;
  try {
    const snapshot = collectSnapshot();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch (err) {
    console.warn('Sauvegarde locale impossible :', err);
    return false;
  }
}

/**
 * Charge la dernière simulation sauvegardée.
 * @returns {Object|null} snapshot ou null
 */
export function loadLocalSimulation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Efface la sauvegarde locale et le consentement.
 */
export function clearLocalSimulation() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // ignore
  }
}

// =============================================================================
// URL — PARTAGE DE SIMULATION
// =============================================================================

/**
 * Construit une URL partageable contenant la simulation courante.
 * @returns {string} URL absolue
 */
export function buildShareUrl() {
  const snapshot = collectSnapshot();
  const encoded = toBase64Url(JSON.stringify(snapshot));
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set(URL_PARAM, encoded);
  return url.toString();
}

/**
 * Lit la simulation présente dans l'URL (si elle existe).
 * @returns {Object|null} snapshot ou null
 */
export function readSimulationFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get(URL_PARAM);
    if (!encoded) return null;
    const json = fromBase64Url(encoded);
    return JSON.parse(json);
  } catch (err) {
    console.warn('Paramètre de partage invalide :', err);
    return null;
  }
}

/**
 * Supprime le paramètre de partage de l'URL (sans recharger la page).
 */
function stripShareParamFromUrl() {
  const url = new URL(window.location.href);
  if (url.searchParams.has(URL_PARAM)) {
    url.searchParams.delete(URL_PARAM);
    window.history.replaceState({}, '', url.toString());
  }
}

// =============================================================================
// COPIE PRESSE-PAPIERS
// =============================================================================

/**
 * Copie une chaîne dans le presse-papiers avec fallback.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback ci-dessous
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

// =============================================================================
// BANNIÈRE DE CONSENTEMENT
// =============================================================================

/**
 * Affiche la bannière de consentement si une simulation est en cours et
 * qu'aucun choix n'a encore été enregistré.
 */
function showConsentBanner() {
  if (document.getElementById('storage-consent-banner')) return;
  const choixExistant = (() => {
    try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
  })();
  if (choixExistant !== null) return;

  const banner = document.createElement('div');
  banner.id = 'storage-consent-banner';
  banner.className = 'consent-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'Sauvegarde locale de la simulation');
  banner.innerHTML = `
    <div class="consent-banner__content">
      <strong>Sauvegarder votre simulation&nbsp;?</strong>
      <p>
        Vos données peuvent être conservées <strong>uniquement sur cet appareil</strong>
        (localStorage du navigateur) pour être restaurées lors de votre prochaine visite.
        Aucune donnée n'est envoyée sur un serveur.
      </p>
    </div>
    <div class="consent-banner__actions">
      <button type="button" class="btn btn--ghost" data-consent="deny">Non merci</button>
      <button type="button" class="btn btn--primary" data-consent="accept">Sauvegarder</button>
    </div>
  `;
  document.body.appendChild(banner);

  banner.querySelector('[data-consent="accept"]').addEventListener('click', () => {
    setStorageConsent(true);
    saveSimulationLocally();
    banner.remove();
    showNotification('Simulation sauvegardée sur cet appareil', 'success');
    document.dispatchEvent(new CustomEvent('horizon:consent-changed', { detail: { granted: true } }));
  });
  banner.querySelector('[data-consent="deny"]').addEventListener('click', () => {
    setStorageConsent(false);
    banner.remove();
  });
}

// =============================================================================
// SESSION DRAFT (sessionStorage, non opt-in, purgé à la fermeture de l'onglet)
// =============================================================================

/**
 * Sauvegarde l'état courant du formulaire + étape active dans sessionStorage.
 * @param {number} [currentStep] - Étape courante (optionnelle)
 */
function saveSessionDraft(currentStep) {
  try {
    const snapshot = collectSnapshot();
    if (currentStep) snapshot.__step = currentStep;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    // sessionStorage peut être désactivé — on ignore silencieusement
  }
}

/**
 * Récupère la dernière session sauvegardée dans cet onglet.
 * @returns {Object|null}
 */
function readSessionDraft() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Efface le brouillon de session.
 */
function clearSessionDraft() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

// =============================================================================
// INITIALISATION PUBLIQUE
// =============================================================================

/**
 * À appeler au démarrage de l'application.
 * Ordre de priorité pour restaurer un état :
 *   1. URL ?profile=...        → simulation partagée (prioritaire absolu)
 *   2. sessionStorage          → brouillon en cours (rechargement de l'onglet)
 *   3. localStorage + consent  → sauvegarde opt-in entre sessions
 *
 * La sauvegarde sessionStorage est ensuite alimentée à chaque saisie et à
 * chaque changement d'étape, sans consentement explicite : elle ne survit
 * pas à la fermeture de l'onglet.
 *
 * @param {HTMLFormElement} form - Formulaire à observer
 */
export function initPersistence(form) {
  if (!form) return;

  let restored = false;

  // 1. Priorité à l'URL de partage
  const shared = readSimulationFromUrl();
  if (shared) {
    applySnapshot(shared);
    stripShareParamFromUrl();
    showNotification('Simulation chargée depuis le lien partagé', 'info');
    restored = true;
  }

  // 2. Brouillon de session (rechargement de l'onglet courant)
  if (!restored) {
    const draft = readSessionDraft();
    if (draft) {
      applySnapshot(draft);
      if (typeof draft.__step === 'number' && draft.__step > 1) {
        // Après rendu (setFormData a déclenché des listeners), on saute à l'étape
        requestAnimationFrame(() => goToStep(draft.__step));
      }
      showNotification('Progression restaurée', 'info');
      restored = true;
    }
  }

  // 3. Sauvegarde locale existante (opt-in de longue durée)
  if (!restored && hasStorageConsent()) {
    const saved = loadLocalSimulation();
    if (saved) {
      applySnapshot(saved);
      showNotification('Simulation précédente restaurée', 'info');
    }
  }

  // --- Alimentation automatique ---

  // A chaque saisie : sauvegarde sessionStorage (debouncé via rAF) + éventuellement localStorage
  form.addEventListener('input', () => {
    cancelAnimationFrame(form._persistenceRAF);
    form._persistenceRAF = requestAnimationFrame(() => {
      saveSessionDraft(getCurrentStepFromDom());
      if (hasStorageConsent()) saveSimulationLocally();
    });
    proposerConsentementSiSignificatif(form);
  });

  // A chaque changement d'étape : synchroniser immédiatement
  document.addEventListener('horizon:step-changed', (e) => {
    saveSessionDraft(e.detail?.step);
  });

  // Purger le brouillon de session après un submit réussi
  form.addEventListener('submit', () => {
    // Un petit délai laisse le calcul se faire ; le brouillon sera écrasé par
    // la prochaine saisie de toute façon — on le vide uniquement en cas de
    // reset explicite (pour ne pas perdre la progression en cas d'erreur).
  });
}

/**
 * Récupère l'étape courante depuis le DOM (classe active sur le stepper).
 * @returns {number}
 */
function getCurrentStepFromDom() {
  const active = document.querySelector('.stepper__step--active');
  const n = active ? parseInt(active.dataset.step, 10) : 1;
  return Number.isFinite(n) ? n : 1;
}

/**
 * Affiche la bannière de consentement localStorage si une saisie significative
 * a été faite et qu'aucun choix n'a encore été enregistré.
 * @param {HTMLFormElement} form
 */
function proposerConsentementSiSignificatif(form) {
  if (form._consentBannerShown) return;
  if (hasStorageConsent()) return;
  const consentChoice = (() => {
    try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
  })();
  if (consentChoice !== null) return;

  const significantFields = ['dateNaissance', 'dateEntreeSPP', 'indiceBrut'];
  const filled = significantFields.some((name) => {
    const el = document.querySelector(`[name="${name}"]`);
    return el && el.value !== '' && el.value !== null;
  });
  if (filled) {
    form._consentBannerShown = true;
    showConsentBanner();
  }
}

/**
 * Efface le brouillon de session (utilisé lors d'un reset complet).
 */
export function clearSessionProgress() {
  clearSessionDraft();
}

/**
 * Copie un lien de partage dans le presse-papiers.
 * @returns {Promise<string>} l'URL partagée (même si la copie a échoué)
 */
export async function shareSimulation() {
  const url = buildShareUrl();
  const ok = await copyToClipboard(url);
  if (ok) {
    showNotification('Lien de la simulation copié dans le presse-papiers', 'success');
  } else {
    showNotification('Copie automatique indisponible — le lien s\'affiche dans une boîte de dialogue', 'warning');
    // Fallback : prompt non bloquant avec le lien
    window.prompt('Copiez ce lien :', url);
  }
  return url;
}

/**
 * Permet à l'utilisateur d'effacer sa sauvegarde locale.
 */
export function forgetLocalSimulation() {
  clearLocalSimulation();
  showNotification('Sauvegarde locale effacée', 'info');
}
