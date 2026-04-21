# Plan d'action — Améliorations HorizonSP

> Document de travail établi en avril 2026 à l'issue de l'audit complet de l'application.
> Objectif : prioriser et planifier les évolutions du simulateur sur les 6 à 12 prochains mois.

---

## Légende

- **Effort** : 🟢 faible (< 1 j) · 🟡 moyen (1-3 j) · 🔴 élevé (> 3 j)
- **Impact** : ⭐ utile · ⭐⭐ significatif · ⭐⭐⭐ structurant
- **Statut** : ⬜ à faire · 🔄 en cours · ✅ fait · 🚫 abandonné

---

## Vue d'ensemble

| Phase | Horizon | Objectif principal |
|-------|---------|--------------------|
| **Phase 1 — Fondations** | Court terme (1 mois) | Consolider l'existant, combler les manques du CdC |
| **Phase 2 — Expérience** | Moyen terme (1-3 mois) | Rendre l'outil plus agréable et accessible |
| **Phase 3 — Fonctionnel+** | Moyen terme (3-6 mois) | Enrichir le métier (scénarios, rachat, couple) |
| **Phase 4 — Maintenance** | Continu | Garantir la pérennité réglementaire |

---

## Phase 1 — Fondations (priorité haute)

Objectif : respecter intégralement le cahier des charges et éliminer les dettes techniques légères.

### 1.1 PWA & fonctionnement hors ligne ⭐⭐⭐ 🟡

**Contexte** : le CdC mentionne un fonctionnement hors ligne — absent aujourd'hui.

- [ ] Créer `manifest.json` (nom, icônes 192/512, theme-color, display standalone)
- [ ] Créer `sw.js` (service worker) avec stratégie **cache-first** pour les assets statiques
- [ ] Enregistrer le SW dans `index.html`
- [ ] Cacher : HTML, CSS, JS, logo, favicon, fonts (subset Poppins local)
- [ ] Ajouter un indicateur visuel "Mode hors ligne" si la connexion tombe
- [ ] Tester installation sur mobile (Android/iOS) et desktop (Chrome/Edge)

**Livrable** : app installable, usable sans connexion après 1re visite.

---

### 1.2 Accessibilité (WCAG AA complet) ⭐⭐ 🟢

- [ ] Ajouter un **skip-to-content** link en haut du `<body>`
- [ ] Mettre `role="img"` + `aria-label` descriptif sur le `<canvas>` du graphique
- [ ] Ajouter `<figcaption>` ou description textuelle alternative du graphe
- [ ] Ajouter `aria-haspopup="true"` sur le bouton hamburger
- [ ] Vérifier les contrastes avec Lighthouse (cible ≥ 4.5:1)
- [ ] Tester navigation 100 % clavier sur les 4 étapes
- [ ] Tester avec lecteur d'écran (NVDA ou VoiceOver)

**Livrable** : score Lighthouse Accessibilité ≥ 95.

---

### 1.3 Badge paramètres à jour ⭐⭐ 🟢

- [ ] Ajouter une constante `PARAMS.DATE_MAJ` dans `parametres.js`
- [ ] Afficher le badge en pied d'app : « Paramètres à jour au JJ/MM/AAAA »
- [ ] Alerte visuelle si `Date.now() - DATE_MAJ > 12 mois` : « Paramètres potentiellement obsolètes »
- [ ] Documenter dans [references.md](references.md) la procédure de mise à jour annuelle

**Livrable** : transparence réglementaire + rappel de maintenance.

---

### 1.4 CHANGELOG ⭐ 🟢

- [ ] Créer `CHANGELOG.md` à la racine au format [Keep a Changelog](https://keepachangelog.com/fr/)
- [ ] Rétro-documenter les versions existantes depuis les commits Git
- [ ] Ajouter une section « Évolutions réglementaires » séparée
- [ ] Mentionner le CHANGELOG depuis [README.md](../README.md) et la page [À propos](../pages/apropos.html)

**Livrable** : traçabilité des évolutions, utile pour les utilisateurs RH.

---

## Phase 2 — Expérience utilisateur

Objectif : transformer l'ergonomie pour des utilisateurs non-experts.

### 2.1 Tooltips explicatifs ⭐⭐⭐ 🟡

**Contexte** : termes techniques (TIB, décote, surcote, RAFP, NBI…) = barrière d'entrée.

- [ ] Créer un composant `<Tooltip>` accessible (hover + focus clavier, ARIA)
- [ ] Glossaire centralisé dans `js/config/glossaire.js`
- [ ] Identifier les 15-20 termes prioritaires (TIB, indice brut, trimestres acquis/requis, décote, surcote, PFR, RAFP, NBI, bonification 1/5, SPV, RDC, taux de liquidation…)
- [ ] Ajouter l'icône `?` à côté des labels concernés
- [ ] Style tooltip : cohérent avec `--color-info`, ombre douce, animation entrée

**Livrable** : chaque terme technique cliquable = définition instantanée.

---

### 2.2 Dark mode opérationnel ⭐⭐ 🟢

**Contexte** : l'infrastructure existe (`prefers-color-scheme` dans `variables.css:174`), il manque juste le toggle.

- [ ] Ajouter un bouton toggle dans le header (icône lune/soleil)
- [ ] Stocker la préférence dans `localStorage` (avec option "auto / clair / sombre")
- [ ] Appliquer la classe `auto-dark` sur `<html>`
- [ ] Étendre les variables dark pour tous les composants (formulaires, cartes, tableaux)
- [ ] Tester les contrastes en mode sombre
- [ ] Respecter `prefers-reduced-motion` pour la transition

**Livrable** : 3 modes : auto (système) / clair / sombre.

---

### 2.3 Timeline visuelle carrière ⭐⭐⭐ 🟡

**Contexte** : très parlant — voir sa carrière sur une frise.

- [ ] Composant frise chronologique SVG ou Canvas
- [ ] Jalons : entrée SPP, âge légal, taux plein, limite d'âge, 3 scénarios de départ
- [ ] Interactif : survol d'un jalon = détails
- [ ] Mode impression optimisé
- [ ] Responsive : horizontal desktop, vertical mobile

**Livrable** : synthèse visuelle de la carrière en un coup d'œil.

---

### 2.4 Impression / PDF amélioré ⭐⭐ 🟡

- [ ] Feuille de style `@media print` dédiée
- [ ] En-tête PDF avec logo + nom simulateur + date d'édition
- [ ] Pagination propre (éviter coupures en milieu de carte)
- [ ] Masquer boutons, navigation, menu
- [ ] QR code optionnel renvoyant au simulateur
- [ ] Pied de page avec mention « Indicatif et non contractuel »

**Livrable** : export papier/PDF digne d'être glissé dans un dossier RH.

---

### 2.5 Progression sauvegardée entre étapes ⭐⭐ 🟢

**Contexte** : recharger la page = tout ressaisir = frustration.

- [ ] Sauvegarder à chaque changement dans `sessionStorage` (non persistant)
- [ ] Option "Sauvegarder ma simulation" explicite → `localStorage` avec bannière RGPD
- [ ] Bouton "Effacer mes données" visible
- [ ] Avertissement : « les données restent sur votre appareil »

**Livrable** : reprise du formulaire en cas de rechargement + sauvegarde opt-in.

---

## Phase 3 — Enrichissements fonctionnels

Objectif : transformer le simulateur en véritable outil d'aide à la décision.

### 3.1 Comparateur de scénarios côte à côte ⭐⭐⭐ 🟡

**Contexte** : actuellement les 3 scénarios sont empilés. Un tableau comparatif aligné serait bien plus parlant.

- [ ] Vue tableau : colonnes = scénarios, lignes = indicateurs (âge, trimestres, pension brute, PFR, RAFP, total mensuel)
- [ ] Codes couleur (vert = mieux, rouge = moins bien)
- [ ] Mettre en évidence le scénario recommandé
- [ ] Export CSV multi-scénarios

**Livrable** : décision éclairée en 30 secondes.

---

### 3.2 Pension nette estimée ⭐⭐⭐ 🟡

**Contexte** : la pension brute ne parle pas à tout le monde — le net, oui.

- [ ] Ajouter CSG (déductible + non déductible), CRDS, CASA
- [ ] Prendre en compte les taux réduits/exonérés selon RFR (proposer une estimation)
- [ ] Champ optionnel « Revenu fiscal de référence estimé »
- [ ] Clairement identifier comme **estimation indicative**
- [ ] Documenter les taux dans `parametres.js` (section `PRELEVEMENTS_SOCIAUX`)

**Livrable** : fourchette net mensuel estimé sur chaque scénario.

---

### 3.3 Simulation de rachat de trimestres ⭐⭐ 🔴

**Contexte** : question fréquente — « puis-je racheter mes années d'études ? »

- [ ] Module `rachat.js` : calcul du coût (barèmes CNRACL par âge et option)
- [ ] Options : taux seul, taux + durée d'assurance, taux + durée tous régimes
- [ ] Simuler l'impact : pension avant/après rachat, ROI en années
- [ ] Alerte si le rachat n'est pas rentable (ex : surcote compensatoire)
- [ ] Section dédiée en étape 3

**Livrable** : décision chiffrée rachat oui/non.

---

### 3.4 Partage de simulation par URL ⭐⭐ 🟢

**Contexte** : un agent RH doit pouvoir envoyer un lien à un collègue.

- [ ] Encoder les paramètres du profil en base64 dans un query string
- [ ] Bouton « Copier le lien de simulation »
- [ ] À l'ouverture, détecter et pré-remplir le formulaire
- [ ] Avertissement : « les données transitent par l'URL, ne pas partager avec tiers non autorisés »

**Livrable** : partage sans serveur, 100 % client.

---

### 3.5 Mode « couple » / foyer ⭐ 🔴

**Contexte** : utile pour projeter un budget retraite de foyer.

- [ ] Deux profils séparés, calculs indépendants
- [ ] Synthèse consolidée : pension totale foyer
- [ ] Vue comparée des dates de départ
- [ ] Graphique cumulé

**Livrable** : vision foyer pour la préparation de la retraite.

---

## Phase 4 — Robustesse & maintenance

Objectif : garantir la pérennité technique et réglementaire.

### 4.1 Framework de test moderne ⭐⭐ 🟡

**Contexte** : tests actuels lancés manuellement, pas de CI.

- [ ] Installer **Vitest** (vanilla-compatible, zéro build)
- [ ] Migrer `tests/*.js` vers la structure Vitest
- [ ] Couverture visée ≥ 80 % sur `js/modules/` et `js/utils/`
- [ ] Tests de régression sur profils types
- [ ] Tests pour tous les `getXxx()` de `parametres.js`

**Livrable** : `npm test` fonctionnel, rapport de couverture.

---

### 4.2 Intégration continue GitHub Actions ⭐⭐ 🟢

- [ ] Workflow `.github/workflows/ci.yml`
- [ ] Lancement des tests à chaque push / PR
- [ ] Validation HTML (html-validate)
- [ ] Lint JS (ESLint, config minimale)
- [ ] Lighthouse CI (performance, a11y, best practices, SEO)
- [ ] Badge de statut dans README

**Livrable** : PR bloquée si régression, confiance dans les merges.

---

### 4.3 Fixtures réglementaires versionnées ⭐⭐ 🟡

**Contexte** : détecter les régressions lors de chaque mise à jour annuelle des paramètres.

- [ ] Créer `tests/fixtures/` avec profils JSON + résultats attendus
- [ ] 10-15 profils représentatifs (jeunes, séniors, SPV, NBI, carrière longue…)
- [ ] Script de snapshot : régénère les résultats attendus après validation manuelle
- [ ] Processus documenté dans [docs/references.md](references.md)

**Livrable** : filet de sécurité à chaque évolution réglementaire.

---

### 4.4 Page « Paramètres en vigueur » ⭐⭐ 🟢

**Contexte** : transparence totale sur les valeurs utilisées.

- [ ] Nouvelle page `pages/parametres.html`
- [ ] Affichage auto-généré depuis `js/config/parametres.js`
- [ ] Tableau par section (âges, durées, taux, coefficients RAFP, PFR, bonifications…)
- [ ] Références réglementaires inline
- [ ] Lien depuis la page À propos

**Livrable** : aucune boîte noire pour l'utilisateur.

---

### 4.5 Observabilité en production ⭐ 🟢

**Contexte** : savoir si des utilisateurs rencontrent des erreurs, sans tracking intrusif.

- [ ] Capture des erreurs JS (`window.addEventListener('error', ...)`)
- [ ] Log local + bouton « Signaler cette erreur » pré-rempli vers le formulaire contact
- [ ] **Aucun** envoi automatique, **aucune** donnée personnelle
- [ ] Respect total RGPD (pas de tracking)

**Livrable** : retours bug facilités sans cookie ni tracker.

---

## Synthèse et priorisation

### Top 5 à lancer en premier

| Rang | Amélioration | Phase | Effort | Impact |
|------|--------------|-------|--------|--------|
| 1 | PWA / hors ligne | 1.1 | 🟡 | ⭐⭐⭐ |
| 2 | Tooltips explicatifs | 2.1 | 🟡 | ⭐⭐⭐ |
| 3 | Comparateur scénarios | 3.1 | 🟡 | ⭐⭐⭐ |
| 4 | Accessibilité WCAG AA | 1.2 | 🟢 | ⭐⭐ |
| 5 | Badge paramètres à jour | 1.3 | 🟢 | ⭐⭐ |

### Matrice effort / impact

```
            Impact ⭐⭐⭐   Impact ⭐⭐      Impact ⭐
Effort 🟢   (1.2 a11y)    1.3 · 1.4 · 3.4   4.5 obs.
            (3.4 partage)  2.2 dark · 2.5   
            (4.4 params)   4.2 CI
Effort 🟡   1.1 PWA        2.4 PDF           —
            2.1 tooltips   4.1 vitest
            2.3 timeline   4.3 fixtures
            3.1 compare
            3.2 net
Effort 🔴   3.3 rachat     3.5 couple        —
```

### Quick wins (faible effort, fort impact — à faire en premier)

- **1.2** Accessibilité
- **1.3** Badge paramètres
- **2.2** Dark mode
- **3.4** Partage URL
- **4.4** Page paramètres

---

## Suivi d'avancement

Mise à jour à chaque livraison d'une amélioration.

| Amélioration | Statut | Date | Commentaire |
|--------------|--------|------|-------------|
| 1.1 PWA | ⬜ | — | — |
| 1.2 Accessibilité | ⬜ | — | — |
| 1.3 Badge paramètres | ⬜ | — | — |
| 1.4 CHANGELOG | ⬜ | — | — |
| 2.1 Tooltips | ⬜ | — | — |
| 2.2 Dark mode | ⬜ | — | — |
| 2.3 Timeline | ⬜ | — | — |
| 2.4 PDF amélioré | ⬜ | — | — |
| 2.5 Progression sauvegardée | ⬜ | — | — |
| 3.1 Comparateur | ⬜ | — | — |
| 3.2 Pension nette | ⬜ | — | — |
| 3.3 Rachat trimestres | ⬜ | — | — |
| 3.4 Partage URL | ⬜ | — | — |
| 3.5 Mode couple | ⬜ | — | — |
| 4.1 Vitest | ⬜ | — | — |
| 4.2 CI GitHub Actions | ⬜ | — | — |
| 4.3 Fixtures | ⬜ | — | — |
| 4.4 Page paramètres | ⬜ | — | — |
| 4.5 Observabilité | ⬜ | — | — |

---

*Document vivant — à relire et ajuster chaque trimestre.*
