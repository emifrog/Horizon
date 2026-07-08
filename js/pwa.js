/**
 * Enregistrement du service worker (mode hors ligne / installable) et indicateur
 * de perte de connexion. Script classique (hors module) pour rester compatible
 * avec une CSP stricte `script-src 'self'`.
 */
(function () {
  // --- Enregistrement du service worker ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.warn('Service worker non enregistré :', err);
      });
    });
  }

  // --- Indicateur hors ligne ---
  function majStatutConnexion() {
    const horsLigne = !navigator.onLine;
    document.body.classList.toggle('is-offline', horsLigne);

    let banner = document.getElementById('offline-banner');
    if (horsLigne) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.className = 'offline-banner';
        banner.setAttribute('role', 'status');
        banner.textContent = 'Mode hors ligne — le simulateur reste utilisable.';
        document.body.appendChild(banner);
      }
    } else if (banner) {
      banner.remove();
    }
  }

  window.addEventListener('online', majStatutConnexion);
  window.addEventListener('offline', majStatutConnexion);
  if (document.readyState !== 'loading') {
    majStatutConnexion();
  } else {
    document.addEventListener('DOMContentLoaded', majStatutConnexion);
  }
})();
