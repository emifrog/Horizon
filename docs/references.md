# Références réglementaires — Simulateur Retraite SPP

Ce document recense les textes et articles qui fondent les calculs du simulateur. Chaque formule du code doit pouvoir être rattachée à l'une de ces références.

> **Note** : les montants et taux concrets (valeur du point d'indice, valeurs RAFP, etc.) sont centralisés dans [`js/config/parametres.js`](../js/config/parametres.js). Ce fichier est la source de vérité et doit être mis à jour à chaque évolution réglementaire.

---

## 1. Textes fondateurs

| Texte | Objet | Lien |
|-------|-------|------|
| Code des pensions civiles et militaires de retraite | Régime des pensions CNRACL (par renvoi) | [Légifrance](https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070302) |
| Décret n°2003-1306 du 26 décembre 2003 | Régime de retraite des fonctionnaires affiliés à la CNRACL | [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000795415) |
| Décret n°2006-779 du 3 juillet 2006 | Nouvelle Bonification Indiciaire (NBI) | [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000242359) |
| Décret n°2004-1056 du 5 octobre 2004 | Régime additionnel de la fonction publique (RAFP) | [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000417604) |
| Loi n°2023-270 du 14 avril 2023 | Réforme des retraites — relèvement progressif de l'âge légal | [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000047445077) |
| Décret n°2026-18 du 20 janvier 2026 | Majoration de durée d'assurance pour engagement SPV | — |

---

## 2. Catégorie active — Sapeurs-pompiers professionnels

- **Statut** : emploi classé en catégorie active (emplois présentant un risque particulier ou des fatigues exceptionnelles).
- **Conséquence** : âge légal de départ anticipé par rapport à la catégorie sédentaire.
- **Condition de services actifs** : 17 ans de services effectifs en catégorie active (68 trimestres), conformément à l'article L.24 I 1° du CPCMR.

---

## 3. Âge légal de départ — montée progressive (loi 2023-270)

### Catégorie active (SPP)
Montée progressive de **57 ans** à **59 ans** selon la génération :

| Génération | Âge légal |
|------------|-----------|
| Avant 01/09/1966 | 57 ans |
| 01/09/1966 – 31/12/1966 | 57 ans 3 mois |
| 1967 | 57 ans 6 mois |
| 1968 | 57 ans 9 mois |
| 1969 | 58 ans |
| 1970 | 58 ans 3 mois |
| 1971 | 58 ans 6 mois |
| 1972 | 58 ans 9 mois |
| 1973 et après | 59 ans |

### Catégorie sédentaire (référence)
Montée de **62 ans** à **64 ans** (1961 → 1968+).

### Âge d'annulation de la décote
Évolue en parallèle : de **62 ans** (ancien) à **64 ans** pour les générations postérieures, sous réserve des conditions de services actifs.

**Référence code** : [`js/config/parametres.js`](../js/config/parametres.js) — constantes `AGE_LEGAL_ACTIF`, `AGE_LEGAL_SEDENTAIRE` et fonction `getAgeLegalActif()`.

---

## 4. Durée d'assurance pour le taux plein

Durée requise (tous régimes confondus) selon l'année de naissance :

| Génération | Trimestres |
|------------|-----------|
| 1962 | 169 |
| 1963 | 170 |
| 1964 | 171 |
| 1965–1972 | 172 |
| 1973 et après | 172 |

**Référence code** : constante `DUREE_ASSURANCE_PAR_GENERATION` et fonction `getDureeAssuranceRequise()`.

---

## 5. Calcul de la pension CNRACL

### Formule de base

```
Pension annuelle = TIB × (Trimestres liquidables / Trimestres requis) × 75%
                 + Majoration Prime de Feu
```

- **TIB** = indice majoré × valeur du point d'indice
- **Taux de liquidation** plafonné à **75 %** (taux plein)
- **Valeur du point d'indice** : voir `POINT_INDICE.VALEUR_MENSUELLE` dans `parametres.js`

**Référence** : Décret n°2003-1306, articles 13 à 17.

### Décote

- **1,25 %** de minoration par trimestre manquant pour atteindre le taux plein
- Plafond : **20 trimestres** de décote maximum
- Annulée automatiquement à l'âge d'annulation de la décote

**Référence** : Code des pensions, **Art. L14**.

### Surcote

- **1,25 %** de majoration par trimestre supplémentaire après atteinte du taux plein
- **Pas de plafond**
- Conditions cumulatives :
  - Avoir atteint l'âge légal
  - Avoir la durée d'assurance requise pour le taux plein

**Référence** : Code des pensions, **Art. L14 II**.

---

## 6. Majoration « prime de feu »

- **25 %** du traitement indiciaire brut (TIB)
- Proratisée par le taux de liquidation
- Conditions : être sapeur-pompier professionnel en activité au moment de la radiation des cadres (RDC)

**Référence** : Code des pensions, **Art. L24 I 1° bis** et textes d'application.

---

## 7. Bonification du 1/5ème (SPP et services militaires BSPP/BMPM)

- **Ratio** : 1 trimestre de bonification pour 5 trimestres de services effectifs
- **Plafond** : 20 trimestres (5 ans)
- **Conditions cumulatives** :
  - 27 ans de services effectifs (108 trimestres) — dont 17 ans (68 trimestres) en qualité de SPP
  - Services militaires comptés uniquement pour les agents BSPP ou BMPM

**Référence** : Décret n°2003-1306 — Art. 24.

---

## 8. Majoration SPV (décret 2026-18)

Majoration de durée d'assurance pour engagement de sapeur-pompier volontaire, applicable à partir du **01/07/2026**.

| Années SPV reconnues | Trimestres de majoration |
|----------------------|--------------------------|
| 10 ans | 1 |
| 20 ans | 2 |
| 25 ans et + | 3 |

**Référence** : Décret n°2026-18 du 20 janvier 2026. Fonction `getMajorationSPVDecret2026()`.

---

## 9. NBI — Nouvelle Bonification Indiciaire

- **Condition de durée** : perception pendant au moins **1 an**
- **Formule** :

```
Supplément NBI = (Points NBI × Valeur du point)
               × (Durée NBI / Durée des services)
               × Taux de liquidation
```

**Référence** : Décret n°2006-779 du 3 juillet 2006. Article L15 du Code des pensions.

---

## 10. PFR et RAFP

### Prime de feu (PFR)
- Taux : **25 %** du TIB (versée chaque mois)
- Soumise à cotisation RAFP

### RAFP
- **Cotisation** : 5 % de la PFR, plafonnée à **20 %** du TIB
- **Acquisition de points** : cotisation / valeur d'acquisition du point (voir `parametres.js`)
- **Valeur de service du point** : voir `parametres.js`
- **Seuil de la rente** : 5 125 points (sinon capital fractionné, ou capital unique)

### Coefficient de majoration selon l'âge de départ

| Âge | Coefficient |
|-----|-------------|
| 57 ans | 0,84 |
| 58 ans | 0,88 |
| 59 ans | 0,92 |
| 60 ans | 0,96 |
| 61 ans | 0,98 |
| 62 ans | 1,00 (référence) |
| 63 ans | 1,04 |
| 64 ans | 1,08 |
| 65 ans | 1,12 |
| 66 ans | 1,18 |
| 67 ans | 1,24 |

**Référence** : Décret n°2004-1056 du 5 octobre 2004.

---

## 11. Limites et avertissements

- Le simulateur ne prend pas en compte les **cumuls emploi-retraite**.
- Les pensions de **réversion** et les majorations pour **enfants après 2004** ne sont pas couvertes par tous les modules.
- Les cas particuliers (**invalidité**, **départ anticipé pour carrière longue**, **congé de longue durée**, etc.) nécessitent une étude individuelle par la CNRACL.
- Seul **l'arrêté de radiation des cadres et la liquidation CNRACL** ont valeur définitive.

---

## 12. Sources complémentaires

- **CNRACL** — [cnracl.retraites.fr](https://www.cnracl.retraites.fr)
- **Info Retraite** — [info-retraite.fr](https://www.info-retraite.fr)
- **Légifrance** — [legifrance.gouv.fr](https://www.legifrance.gouv.fr)
- **ERAFP** — [rafp.fr](https://www.rafp.fr)

---

*Dernière mise à jour : avril 2026*
