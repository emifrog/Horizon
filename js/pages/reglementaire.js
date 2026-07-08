/**
 * Script de la page Réglementaire — bouton « retour en haut ».
 * Externalisé (hors HTML) pour permettre une CSP stricte `script-src 'self'`.
 */
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('back-to-top--visible', window.scrollY > 400);
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
