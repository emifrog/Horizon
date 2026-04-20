/**
 * Module Theme — Gestion du thème clair / sombre / auto
 *
 * Trois modes :
 *   - 'auto'  → suit prefers-color-scheme (par défaut)
 *   - 'light' → thème clair forcé
 *   - 'dark'  → thème sombre forcé
 *
 * Le choix est persistant via localStorage ('horizon:theme').
 * L'application de la classe sur <html> est faite le plus tôt possible
 * (voir le script inline dans index.html) pour éviter le FOUC.
 *
 * @module ui/theme
 */

const STORAGE_KEY = 'horizon:theme';
const MODES = ['auto', 'light', 'dark'];

const LABELS = {
  auto: 'Thème automatique (système)',
  light: 'Thème clair',
  dark: 'Thème sombre',
};

/**
 * Lit le mode persistant, avec fallback sur 'auto'.
 * @returns {string}
 */
function readStoredMode() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(raw) ? raw : 'auto';
  } catch {
    return 'auto';
  }
}

/**
 * Applique le mode choisi sur <html> et expose l'état pour CSS.
 * @param {string} mode
 */
function applyMode(mode) {
  const root = document.documentElement;
  root.classList.remove('theme-auto', 'theme-light', 'theme-dark');
  root.classList.add(`theme-${mode}`);
  root.setAttribute('data-theme', mode);
}

/**
 * Stocke le mode choisi.
 * @param {string} mode
 */
function persistMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Stockage indisponible — le choix ne survivra pas au rechargement.
  }
}

/**
 * Mode suivant dans le cycle auto → light → dark → auto.
 * @param {string} current
 * @returns {string}
 */
function nextMode(current) {
  const i = MODES.indexOf(current);
  return MODES[(i + 1) % MODES.length];
}

/**
 * Initialise le bouton de bascule du thème.
 * Doit être appelé une fois au chargement de l'application.
 * @param {HTMLElement} [toggleBtn] - Bouton optionnel (sinon #theme-toggle)
 */
export function initTheme(toggleBtn) {
  const btn = toggleBtn || document.getElementById('theme-toggle');
  const currentMode = readStoredMode();
  applyMode(currentMode);

  if (!btn) return;

  const updateBtnState = (mode) => {
    btn.setAttribute('aria-label', LABELS[mode]);
    btn.setAttribute('title', LABELS[mode]);
    btn.setAttribute('data-mode', mode);
  };
  updateBtnState(currentMode);

  btn.addEventListener('click', () => {
    const stored = readStoredMode();
    const next = nextMode(stored);
    applyMode(next);
    persistMode(next);
    updateBtnState(next);
  });
}

/**
 * API publique pour lire le mode actuel (utile aux modules tiers).
 * @returns {string}
 */
export function getCurrentThemeMode() {
  return readStoredMode();
}
