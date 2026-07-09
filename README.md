# Horizon - Simulateur de Retraite SPP

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)

**Horizon** est une application web de simulation de retraite pour les **sapeurs-pompiers professionnels (SPP)**
relevant de la CNRACL (catégorie active). Outil indicatif destiné aux agents et aux services RH des SDIS.

> ⚠️ **Outil indicatif** : Les résultats fournis sont à titre informatif uniquement et ne constituent pas un engagement. Seule la CNRACL est habilitée à calculer vos droits définitifs.

## 🎯 Fonctionnalités

- **Calcul de la pension CNRACL** selon la formule réglementaire (à partir de l'indice majoré)
- **Suspension LFSS 2026** : âges et durées calculés selon la date d'effet de la pension (bascule au 1ᵉʳ septembre 2026)
- **Scénarios de départ** : anticipé (57 ans), taux plein, limite d'activité (62 ans)
- **Décote / surcote** : décote plafonnée (âge d'annulation 62 ans fixe), surcote sur âge sédentaire
- **Bonification du 1/5ème** pour services actifs SPP (services militaires BSPP/BMPM exclus du 1/5ème)
- **Majoration prime de feu** (25% du TIB, proratisable)
- **Majoration SPV** (décret 2026-18, pensions à effet ≥ 01/07/2026)
- **RAFP** (Régime Additionnel de la Fonction Publique) : rente / capital, coefficient d'âge
- **Supplément NBI** (Nouvelle Bonification Indiciaire)
- **NPFR** (Nouvelle Prestation de Fidélisation et de Reconnaissance) pour le double statut SPP/SPV
- **Minimum garanti** (barème par paliers) et **prélèvements sociaux** (4 régimes CSG)
- **Export PDF et CSV** des résultats
- **PWA installable** et **mode hors ligne** (100% client-side, sans dépendance externe)

## 🚀 Démarrage rapide

### Prérequis

Aucune installation requise. L'application fonctionne entièrement dans le navigateur.

### Lancement local

```bash
# Option 1 : Avec Node.js (recommandé)
npx serve .
# ou :
npm run serve

# Option 2 : Avec Python
python3 -m http.server 8080

# Option 3 : Avec VS Code
# Installer l'extension "Live Server" et cliquer sur "Go Live"
```

Ouvrez ensuite http://localhost:8080 dans votre navigateur.

## 📁 Structure du projet

```
Horizon/
├── index.html              # Point d'entrée unique
├── manifest.json           # Manifeste PWA
├── service-worker.js       # Cache hors ligne (cache-first)
├── css/
│   ├── main.css            # Styles principaux
│   ├── variables.css       # Variables CSS (couleurs, espacements)
│   ├── components.css      # Composants réutilisables
│   ├── print.css           # Feuille de style impression / export PDF
│   ├── contact.css         # Page contact
│   ├── reglementaire.css   # Page réglementaire
│   └── fonts.css           # Police Poppins auto-hébergée
├── js/
│   ├── app.js              # Point d'entrée, orchestration
│   ├── config/
│   │   ├── parametres.js   # Paramètres réglementaires (source de vérité)
│   │   └── glossaire.js    # Définitions des termes (tooltips)
│   ├── modules/
│   │   ├── profil.js       # Profil agent
│   │   ├── duree.js        # Durée d'assurance et services
│   │   ├── ages.js         # Âges et dates de départ
│   │   ├── pension.js      # Pension CNRACL, minimum garanti, cotisations
│   │   ├── pfr.js          # Prime de feu, RAFP, NPFR
│   │   ├── nbi.js          # Nouvelle Bonification Indiciaire
│   │   └── surcote.js      # Surcote
│   ├── ui/
│   │   ├── form.js         # Formulaire multi-étapes (stepper ARIA)
│   │   ├── results.js      # Résultats et graphiques (Canvas)
│   │   ├── timeline.js     # Frise chronologique (SVG)
│   │   ├── glossaire.js    # Injection des tooltips
│   │   ├── persistence.js  # Sauvegarde locale (opt-in) + partage par lien
│   │   └── export.js       # Export PDF et CSV
│   └── utils/
│       ├── dates.js        # Utilitaires de dates
│       ├── formatters.js   # Formatage des valeurs
│       ├── nombres.js      # Arrondi commercial, bornage
│       ├── html.js         # escapeHtml (barrière anti-XSS)
│       └── validators.js   # Validation des saisies
├── pages/
│   ├── apropos.html        # À propos
│   ├── contact.html        # Contact
│   └── reglementaire.html  # Documentation réglementaire
├── tests/                  # Suites de tests Node (npm test)
├── assets/                 # Logo, favicon, icônes, images
├── docs/references.md      # Références réglementaires détaillées
├── CLAUDE.md               # Documentation technique détaillée
└── README.md               # Ce fichier
```

## 🧮 Formule de calcul

La pension CNRACL est calculée selon la formule :

```
Pension = Traitement indiciaire × (Trimestres liquidables / Trimestres requis) × 75%
```

Le traitement indiciaire est établi à partir de l'**indice majoré** (× valeur du point d'indice).
S'y appliquent ensuite :
- **Décote** : -1,25% par trimestre manquant (max 20 trimestres ; annulée à 62 ans)
- **Surcote** : +1,25% par trimestre supplémentaire (âge sédentaire requis)
- **Majoration prime de feu** : 25% du TIB, proratisable

## ⚙️ Paramètres réglementaires

| Paramètre | Valeur |
|-----------|--------|
| Âge d'ouverture des droits (cat. active) | 57 à 59 ans selon génération |
| Âge d'annulation de la décote | 62 ans (fixe) |
| Âge limite d'activité | 62 ans |
| Taux de liquidation maximum | 75% |
| Décote par trimestre | 1,25% (max 20 trimestres) |
| Durée d'assurance requise (gén. 1965+) | 172 trimestres |
| Bascule LFSS 2026 | pensions à effet ≥ 01/09/2026 |
| Valeur du point d'indice (2026) | 4,92278 €/mois |
| Taux de la prime de feu | 25% du TIB |

> La bascule LFSS 2026 suspend l'accélération de la réforme 2023 : les âges et durées sont fonction de
> la **date d'effet de la pension**. Voir la page *Documentation réglementaire* pour les tables détaillées.

## 🧪 Tests

```bash
# Exécuter toutes les suites de tests (Node, sans dépendance)
npm test          # = node tests/run-all.js
```

## 🛠️ Technologies

- **HTML5** sémantique avec attributs ARIA
- **CSS3** avec variables et design responsive (desktop-first)
- **JavaScript ES6+** vanilla (aucun framework, aucune dépendance externe)
- **Canvas API** pour les graphiques, **SVG** pour la frise
- **PWA** : manifeste, service worker (cache hors ligne), police auto-hébergée

## 📋 Conventions de code

### JavaScript
- ES6+ modules avec `type="module"`
- Fonctions pures, pas de classes
- camelCase pour variables/fonctions
- SCREAMING_SNAKE_CASE pour constantes
- JSDoc pour les fonctions publiques

### CSS
- Variables CSS pour la cohérence
- Nommage BEM-like (`.composant__element--modifier`)
- Desktop-first avec media queries

### HTML
- Balises sémantiques (`<main>`, `<section>`, `<nav>`)
- Attributs ARIA pour l'accessibilité
- Data attributes pour le binding JS

## 📚 Références réglementaires

- **Code des pensions civiles et militaires de retraite**
- **Décret n°2003-1306** du 26 décembre 2003 (régime CNRACL)
- **Loi n°2023-270** du 14 avril 2023 (réforme des retraites) et sa **suspension par la LFSS 2026**
- **Décret n°2006-779** du 3 juillet 2006 (NBI)
- **Décret n°2004-569** du 18 juin 2004 (RAFP)
- **Décret n°2017-912** du 9 mai 2017, modifié par le décret n°2022-620 (NPFR)
- **Décret n°2026-18** du 20 janvier 2026 (majoration SPV)

## 👤 Auteur

**XRWeb** — Xavier, adjudant au SDIS 06

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

*Dernière mise à jour : Juillet 2026*
