/**
 * Script de la page Contact.
 * Externalisé (hors HTML) pour permettre une CSP stricte `script-src 'self'`.
 *
 * NB : formulaire placeholder — aucune soumission réelle n'est effectuée.
 */
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
    form.reset();
  });
}
