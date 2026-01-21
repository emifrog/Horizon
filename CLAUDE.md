# CLAUDE.md — Simulateur Retraite SPP

## Contexte du projet

Application web de simulation de retraite pour les sapeurs-pompiers professionnels (SPP) relevant de la CNRACL. Outil indicatif et non contractuel destiné aux agents et services RH des SDIS.

**Auteur** : Xavier (Adjudant SDIS 06)  
**Stack** : HTML / CSS / JavaScript vanilla (aucun framework)  
**Fonctionnement** : 100% client-side, hors ligne possible

---

## Architecture technique

```
simulateur-retraite-spp/
├── index.html              # Point d'entrée unique
├── css/
│   ├── main.css            # Styles principaux
│   ├── variables.css       # Variables CSS (couleurs, espacements)
│   └── components.css      # Styles des composants (formulaires, cartes, etc.)
├── js/
│   ├── app.js              # Point d'entrée JS, orchestration
│   ├── config/
│   │   └── parametres.js   # Paramètres réglementaires (âges, durées, taux)
│   ├── modules/
│   │   ├── profil.js       # Module 1 : Saisie profil agent
│   │   ├── duree.js        # Module 2 : Durée d'assurance et services
│   │   ├── ages.js         # Module 3 : Âges et dates de départ
│   │   ├── pension.js      # Module 4 : Calcul pension CNRACL
│   │   ├── pfr.js          # Module 5 : Prime de feu (PFR)
│   │   ├── nbi.js          # Module 6 : Nouvelle Bonification Indiciaire
│   │   └── surcote.js      # Module 7 : Calcul surcote
│   ├── utils/
│   │   ├── dates.js        # Utilitaires de calcul de dates
│   │   ├── formatters.js   # Formatage (montants, pourcentages)
│   │   └── validators.js   # Validation des saisies
│   └── ui/
│       ├── form.js         # Gestion du formulaire
│       ├── results.js      # Affichage des résultats
│       ├── charts.js       # Graphiques (Canvas API)
│       └── export.js       # Export PDF
├── assets/
│   └── icons/              # Icônes SVG inline si nécessaire
├── docs/
│   └── references.md       # Références réglementaires détaillées
└── CLAUDE.md               # Ce fichier
```

---

## Conventions de code

### JavaScript

- **ES6+ modules** avec `type="module"` dans le HTML
- **Pas de classes** : préférer les fonctions pures et les objets littéraux
- **Nommage** : camelCase pour variables/fonctions, SCREAMING_SNAKE_CASE pour constantes
- **Commentaires** : JSDoc pour les fonctions publiques
- **Pas de dépendances externes** : tout le code est vanilla

```javascript
// ✅ Bon exemple
/**
 * Calcule le taux de liquidation
 * @param {number} trimestresAcquis - Trimestres validés
 * @param {number} trimestresRequis - Trimestres pour le taux plein
 * @returns {number} Taux en pourcentage (max 75)
 */
export function calculerTauxLiquidation(trimestresAcquis, trimestresRequis) {
  const taux = (trimestresAcquis / trimestresRequis) * 75;
  return Math.min(taux, 75);
}

// ❌ À éviter
class CalculateurPension { ... }
```

### CSS

- **Variables CSS** pour toutes les valeurs réutilisables
- **BEM-like** pour le nommage : `.composant`, `.composant__element`, `.composant--modifier`
- **Mobile-first** : styles de base pour mobile, media queries pour desktop
- **Pas de préprocesseur** : CSS natif uniquement

```css
/* variables.css */
:root {
  --color-primary: #C8102E;      /* Rouge pompier */
  --color-secondary: #1E3A5F;    /* Bleu marine */
  --color-success: #28A745;
  --color-warning: #FFC107;
  --color-error: #DC3545;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --radius: 4px;
}
```

### HTML

- **Sémantique** : utiliser les balises appropriées (`<main>`, `<section>`, `<article>`, etc.)
- **Accessibilité** : labels associés aux inputs, ARIA si nécessaire
- **Data attributes** : pour le binding JS (`data-module`, `data-action`)

---

## Paramètres réglementaires

Fichier `js/config/parametres.js` — À mettre à jour lors des évolutions réglementaires.

```javascript
// Paramètres 2026 - Catégorie active SPP
export const PARAMS = {
  // Âges
  AGE_LEGAL_OUVERTURE: 57,           // Âge d'ouverture des droits (cat. active)
  AGE_TAUX_PLEIN_AUTO: 62,           // Âge du taux plein automatique
  AGE_LIMITE: 67,                     // Âge limite d'activité
  
  // Durées (trimestres)
  DUREE_SERVICES_MIN: 68,            // 17 ans min en catégorie active
  DUREE_ASSURANCE_TAUX_PLEIN: {
    1962: 168,  // Génération 1962
    1963: 169,
    1964: 170,
    1965: 171,
    1966: 172,
    1967: 172,
    // ... à compléter selon les générations
  },
  
  // Taux
  TAUX_PLEIN: 75,                    // 75% maximum
  TAUX_DECOTE_PAR_TRIMESTRE: 1.25,   // -1.25% par trimestre manquant
  TAUX_SURCOTE_PAR_TRIMESTRE: 1.25,  // +1.25% par trimestre supplémentaire
  DECOTE_MAX_TRIMESTRES: 20,         // Maximum 20 trimestres de décote
  
  // Valeur du point d'indice (janvier 2026)
  VALEUR_POINT_INDICE: 4.92278,      // € brut annuel
  
  // Majoration SPV (décret 2026-18)
  MAJORATION_SPV: {
    10: 1,  // ≥10 ans : +1 trimestre
    20: 2,  // ≥20 ans : +2 trimestres
    25: 3,  // ≥25 ans : +3 trimestres
  },
  
  // PFR - Taux de cotisation RAFP
  TAUX_RAFP: 5,                      // 5% prélevé sur la PFR
  PLAFOND_RAFP: 20,                  // 20% du traitement indiciaire brut
};
```

---

## Modules fonctionnels

### Module 1 : Profil agent (`profil.js`)

**Entrées** :
- `anneeNaissance` (number) : année de naissance
- `dateEntreeSPP` (Date) : date d'entrée en qualité de SPP
- `tempsPartiel` (number) : quotité si temps partiel (0.5 à 1)
- `anneesSPV` (number) : années d'engagement SPV reconnues

**Sorties** :
- `generation` : génération pour la durée d'assurance requise
- `majorationSPV` : trimestres de majoration SPV
- `profilValide` : booléen de validation

### Module 2 : Durée d'assurance (`duree.js`)

**Entrées** :
- Profil agent
- `trimestresAutresRegimes` (number) : trimestres hors CNRACL

**Calculs** :
- Durée services effectifs SPP (en trimestres)
- Bonifications éventuelles
- Durée d'assurance totale tous régimes
- Écart avec durée requise pour taux plein

### Module 3 : Âges et dates (`ages.js`)

**Calculs** :
- Date d'ouverture des droits (57 ans si 17 ans de services actifs)
- Date du taux plein
- Date limite

**Scénarios générés** :
- Départ au plus tôt (avec décote éventuelle)
- Départ au taux plein
- Départ à la limite d'âge

### Module 4 : Pension CNRACL (`pension.js`)

**Formule de base** :
```
Pension = Traitement indiciaire brut × (Trimestres liquidables / Trimestres requis) × 75%
```

**Entrées** :
- `indiceBrut` (number) : indice majoré détenu
- `trimestresLiquidables` (number)
- `trimestresRequis` (number)

**Calculs** :
- Traitement indiciaire brut = indice × valeur du point
- Taux de liquidation (plafonné à 75%)
- Application décote si applicable
- Pension brute mensuelle

### Module 5 : PFR (`pfr.js`)

**Entrées** :
- `montantAnnuelPFR` (number) : montant brut annuel
- OU `partFixe` + `partVariable`

**Calculs** :
- Cotisation RAFP (5% plafonné à 20% du TIB)
- Estimation rente RAFP (très approximative)
- Affichage comparatif avec/sans PFR

### Module 6 : NBI (`nbi.js`)

**Entrées** :
- `pointsNBI` (number) : nombre de points NBI
- `dureeNBI` (number) : années de perception

**Formule** :
```
Supplément NBI = (Points NBI × Valeur point) × (Durée NBI / Durée services) × Taux liquidation
```

**Condition** : perception ≥ 1 an

### Module 7 : Surcote (`surcote.js`)

**Conditions** :
- Âge ≥ âge légal (57 ans)
- Durée d'assurance ≥ durée requise taux plein

**Calcul** :
```
Surcote = 1.25% × nombre de trimestres au-delà du taux plein
```

**Pas de plafond** pour la surcote (contrairement à la décote).

---

## Interface utilisateur

### Structure des étapes

1. **Étape 1** : Informations personnelles (profil)
2. **Étape 2** : Carrière et services
3. **Étape 3** : Rémunération (indice, NBI, PFR)
4. **Étape 4** : Résultats et scénarios

### Composants UI

- **Stepper** : navigation entre étapes, indicateur de progression
- **Formulaire** : validation en temps réel, messages d'erreur inline
- **Cartes résultat** : affichage synthétique avec icônes
- **Tableau comparatif** : scénarios de départ
- **Graphique** : évolution pension selon date de départ (Canvas)

### Export PDF

Utiliser l'API native `window.print()` avec une feuille de style `@media print` dédiée. Alternative : générer le PDF côté client avec une lib légère si vraiment nécessaire.

---

## Validation et tests

### Validation des entrées

```javascript
// validators.js
export function validerAnneeNaissance(annee) {
  const min = new Date().getFullYear() - 67;  // Âge limite
  const max = new Date().getFullYear() - 20;  // Minimum 20 ans
  return annee >= min && annee <= max;
}

export function validerIndiceBrut(indice) {
  return indice >= 350 && indice <= 1027;  // Échelle indiciaire FPT
}
```

### Cas de test

Prévoir des profils types pour validation :
- SPP né en 1970, entré en 1995, indice 600, sans SPV
- SPP né en 1975, entré en 2000, indice 500, 15 ans SPV
- SPP né en 1968, entré en 1990, indice 700, avec NBI

---

## Références réglementaires

Chaque calcul doit être traçable. Utiliser des commentaires avec références :

```javascript
// Réf: Code des pensions civiles et militaires, Art. L14
// Décote = 1.25% par trimestre manquant, max 20 trimestres
const decote = Math.min(trimestresManquants, 20) * 0.0125;
```

**Textes principaux** :
- Code des pensions civiles et militaires de retraite
- Décret n°2003-1306 du 26 décembre 2003 (régime CNRACL)
- Décret n°2006-779 du 3 juillet 2006 (NBI)
- Décret n°2026-18 du 20 janvier 2026 (majoration SPV)

---

## Commandes de développement

```bash
# Serveur de développement local
python3 -m http.server 8080

# Ou avec Node
npx serve .

# Validation HTML
npx html-validate index.html

# Lint JS (optionnel)
npx eslint js/
```

---

## Checklist avant livraison

- [ ] Tous les modules fonctionnels implémentés
- [ ] Validation des entrées complète
- [ ] Affichage responsive (mobile/desktop)
- [ ] Avertissement juridique visible
- [ ] Fonctionnement hors connexion testé
- [ ] Export PDF fonctionnel
- [ ] Commentaires de référence réglementaire présents
- [ ] Pas de données personnelles stockées
- [ ] Tests sur Chrome, Firefox, Safari, Edge

---

## Notes pour Claude Code

1. **Commencer par** `js/config/parametres.js` — c'est la source de vérité réglementaire
2. **Développer module par module** dans l'ordre du cahier des charges
3. **Tester chaque module** avec des valeurs connues avant intégration
4. **Ne pas optimiser prématurément** — la lisibilité prime
5. **Documenter les formules** avec les références réglementaires

**Question à poser si doute** : "Cette valeur est-elle un paramètre réglementaire susceptible de changer ?" → Si oui, la mettre dans `parametres.js`.
