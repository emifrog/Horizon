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

import { setFormData, showNotification } from './form.js';

const STORAGE_KEY = 'horizon:last-simulation';
const CONSENT_KEY = 'horizon:storage-consent';
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
// INITIALISATION PUBLIQUE
// =============================================================================

/**
 * À appeler au démarrage de l'application.
 * 1. Si l'URL contient ?profile=..., applique la simulation partagée (prioritaire).
 * 2. Sinon, si l'utilisateur a consenti et qu'une sauvegarde existe, la restaure.
 * 3. Propose la bannière de consentement lors de la première saisie significative.
 *
 * @param {HTMLFormElement} form - Formulaire à observer
 */
export function initPersistence(form) {
  if (!form) return;

  // 1. Priorité à l'URL de partage
  const shared = readSimulationFromUrl();
  if (shared) {
    applySnapshot(shared);
    stripShareParamFromUrl();
    showNotification('Simulation chargée depuis le lien partagé', 'info');
    return;
  }

  // 2. Sauvegarde locale existante
  if (hasStorageConsent()) {
    const saved = loadLocalSimulation();
    if (saved) {
      applySnapshot(saved);
      showNotification('Simulation précédente restaurée', 'info');
    }
  }

  // 3. Sauvegarde automatique à chaque saisie (si consentement)
  //    + proposition de la bannière dès qu'une donnée significative est saisie
  let bannerShown = false;
  const significantFields = ['dateNaissance', 'dateEntreeSPP', 'indiceBrut'];
  form.addEventListener('input', () => {
    if (hasStorageConsent()) {
      // debouncé via rAF pour éviter l'écriture à chaque frappe
      cancelAnimationFrame(form._persistenceRAF);
      form._persistenceRAF = requestAnimationFrame(() => saveSimulationLocally());
      return;
    }
    if (bannerShown) return;
    const consentChoice = (() => {
      try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
    })();
    if (consentChoice !== null) return;

    // On ne propose la bannière que si un champ significatif est renseigné
    const filled = significantFields.some((name) => {
      const el = document.querySelector(`[name="${name}"]`);
      return el && el.value !== '' && el.value !== null;
    });
    if (filled) {
      bannerShown = true;
      showConsentBanner();
    }
  });
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
