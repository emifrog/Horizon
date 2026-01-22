# Horizon - Simulateur de Retraite SPP

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

**Horizon** est une application web de simulation de retraite pour les **sapeurs-pompiers professionnels (SPP)**

> ⚠️ **Outil indicatif** : Les résultats fournis sont à titre informatif uniquement et ne constituent pas un engagement. Seule la CNRACL est habilitée à calculer vos droits définitifs.

## 🎯 Fonctionnalités

- **Calcul de la pension CNRACL** selon la formule réglementaire
- **Scénarios de départ** : anticipé (57 ans), taux plein, limite d'activité (62 ans)
- **Calcul de la décote/surcote** selon les trimestres manquants ou supplémentaires
- **Bonification du 1/5ème** pour services actifs (catégorie active)
- **Majoration SPV** pour les anciens sapeurs-pompiers volontaires
- **Calcul du RAFP** (Régime Additionnel de la Fonction Publique)
- **Supplément NBI** (Nouvelle Bonification Indiciaire)
- **PFR SPV** pour les agents en double statut SPP/SPV
- **Export PDF et JSON** des résultats
- **Mode hors ligne** (100% client-side)

## 🚀 Démarrage rapide

### Prérequis

Aucune installation requise. L'application fonctionne entièrement dans le navigateur.

### Lancement local

```bash
# Option 1 : Avec Python
python -m http.server 8080

# Option 2 : Avec Node.js
npx serve .

# Option 3 : Avec VS Code
# Installer l'extension "Live Server" et cliquer sur "Go Live"
```

Ouvrez ensuite http://localhost:8080 dans votre navigateur.

## 📁 Structure du projet

```
Horizon/
├── index.html              # Page principale
├── css/
│   ├── main.css           # Styles principaux
│   ├── variables.css      # Variables CSS (couleurs, espacements)
│   └── components.css     # Composants réutilisables
├── js/
│   ├── app.js             # Point d'entrée, orchestration
│   ├── config/
│   │   └── parametres.js  # Paramètres réglementaires
│   ├── modules/
│   │   ├── profil.js      # Gestion du profil agent
│   │   ├── duree.js       # Calcul des durées d'assurance
│   │   ├── ages.js        # Calcul des dates de départ
│   │   ├── pension.js     # Calcul de la pension CNRACL
│   │   ├── pfr.js         # Prime de feu et RAFP
│   │   ├── nbi.js         # Nouvelle Bonification Indiciaire
│   │   └── surcote.js     # Calcul de la surcote
│   ├── ui/
│   │   ├── form.js        # Gestion du formulaire multi-étapes
│   │   ├── results.js     # Affichage des résultats
│   │   └── export.js      # Export PDF/JSON
│   └── utils/
│       ├── dates.js       # Utilitaires de dates
│       ├── formatters.js  # Formatage des valeurs
│       └── validators.js  # Validation des saisies
├── tests/
│   └── test-calculs.js    # Tests unitaires
├── assets/
│   ├── logo.svg           # Logo de l'application
│   └── favicon.ico        # Favicon
├── CLAUDE.md              # Documentation technique détaillée
└── README.md              # Ce fichier
```

## 🧮 Formule de calcul

La pension CNRACL est calculée selon la formule :

```
Pension = Traitement indiciaire × (Trimestres liquidables / Trimestres requis) × 75%
```

Avec application éventuelle de :
- **Décote** : -1,25% par trimestre manquant (max 20 trimestres)
- **Surcote** : +1,25% par trimestre supplémentaire

## ⚙️ Paramètres réglementaires

| Paramètre | Valeur |
|-----------|--------|
| Âge d'ouverture des droits (cat. active) | 57 ans |
| Âge d'annulation de la décote | 62 ans |
| Âge limite d'activité | 62 ans |
| Taux de liquidation maximum | 75% |
| Décote par trimestre | 1,25% |
| Durée d'assurance requise (gén. 1965+) | 172 trimestres |
| Valeur du point d'indice (2026) | 4,92278 €/an |

## 🧪 Tests

```bash
# Exécuter les tests unitaires
node tests/test-calculs.js
```

## 🛠️ Technologies

- **HTML5** sémantique avec attributs ARIA
- **CSS3** avec variables et design responsive (mobile-first)
- **JavaScript ES6+** vanilla (aucun framework)
- **Canvas API** pour les graphiques

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
- Mobile-first avec media queries

### HTML
- Balises sémantiques (`<main>`, `<section>`, `<nav>`)
- Attributs ARIA pour l'accessibilité
- Data attributes pour le binding JS

## 📚 Références réglementaires

- **Code des pensions civiles et militaires de retraite**
- **Décret n°2003-1306** du 26 décembre 2003 (régime CNRACL)
- **Décret n°98-442** du 5 juin 1998 (prime de feu)
- **Décret n°2004-569** du 18 juin 2004 (RAFP)
- **Décret n°2005-1150** du 13 septembre 2005 (PFR SPV)

## 👤 Auteur

**XRWeb**

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

*Dernière mise à jour : Janvier 2026*
