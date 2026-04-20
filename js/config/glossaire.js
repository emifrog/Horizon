/**
 * Glossaire — définitions des termes techniques utilisés dans l'application.
 *
 * Sert à l'auto-injection de tooltips explicatifs sur les labels du formulaire
 * et sur les termes affichés dans les résultats.
 *
 * Format d'une entrée :
 *   clé     : identifiant court (kebab-case)
 *   libelle : terme affiché
 *   resume  : phrase courte (≤ 200 caractères, lue dans le tooltip)
 *   ref     : référence réglementaire optionnelle
 *
 * @module config/glossaire
 */

export const GLOSSAIRE = {
  'tib': {
    libelle: 'TIB',
    resume:
      'Traitement Indiciaire Brut. Rémunération de base = indice majoré × valeur du point d\'indice.',
  },

  'indice-brut': {
    libelle: 'Indice brut',
    resume:
      'Votre indice figure sur votre bulletin de paie. Il détermine, avec la valeur du point, votre traitement indiciaire brut (TIB).',
  },

  'trimestres-acquis': {
    libelle: 'Trimestres acquis',
    resume:
      'Nombre total de trimestres validés tous régimes confondus (CNRACL + autres régimes + bonifications).',
  },

  'trimestres-requis': {
    libelle: 'Trimestres requis',
    resume:
      'Durée d\'assurance nécessaire pour obtenir le taux plein. Varie selon votre génération (169 à 172 trimestres).',
  },

  'trimestres-liquidables': {
    libelle: 'Trimestres liquidables',
    resume:
      'Trimestres pris en compte pour le calcul du montant de la pension (services CNRACL + bonifications).',
  },

  'decote': {
    libelle: 'Décote',
    resume:
      'Minoration de 1,25 % par trimestre manquant pour atteindre le taux plein, plafonnée à 20 trimestres.',
    ref: 'Code des pensions, Art. L14',
  },

  'surcote': {
    libelle: 'Surcote',
    resume:
      'Majoration de 1,25 % par trimestre effectué au-delà du taux plein après l\'âge légal. Aucun plafond.',
    ref: 'Code des pensions, Art. L14 II',
  },

  'taux-liquidation': {
    libelle: 'Taux de liquidation',
    resume:
      'Pourcentage appliqué au TIB pour calculer la pension. Plafonné à 75 % (taux plein).',
  },

  'taux-plein': {
    libelle: 'Taux plein',
    resume:
      'Taux maximum de 75 % du TIB. Obtenu quand la durée d\'assurance requise est atteinte, ou par l\'âge d\'annulation de la décote.',
  },

  'pfr': {
    libelle: 'PFR — Prime de feu',
    resume:
      'Indemnité de feu représentant 25 % du TIB, versée mensuellement aux SPP. Soumise à cotisation RAFP.',
  },

  'rafp': {
    libelle: 'RAFP',
    resume:
      'Régime additionnel de la Fonction publique. Régime obligatoire par points, cotisations assises sur la prime de feu.',
    ref: 'Décret n°2004-1056',
  },

  'nbi': {
    libelle: 'NBI',
    resume:
      'Nouvelle Bonification Indiciaire. Points supplémentaires liés à certaines fonctions. Si perçue ≥ 15 ans, intégrée au TIB.',
    ref: 'Décret n°2006-779',
  },

  'bonification-1-5': {
    libelle: 'Bonification du 1/5ᵉ',
    resume:
      '1 trimestre de bonification pour 5 trimestres de services actifs (max 20 trimestres). Condition : 27 ans de services effectifs dont 17 en SPP.',
    ref: 'Décret n°2003-1306, Art. 24',
  },

  'spv': {
    libelle: 'SPV',
    resume:
      'Sapeur-pompier volontaire. Depuis le décret 2026-18, l\'engagement SPV donne droit à 1 à 3 trimestres de majoration (10 / 20 / 25 ans).',
    ref: 'Décret n°2026-18',
  },

  'rdc': {
    libelle: 'RDC',
    resume:
      'Radiation des cadres. Acte administratif qui met fin à l\'activité et déclenche la liquidation de la pension.',
  },

  'age-legal': {
    libelle: 'Âge légal de départ',
    resume:
      'Âge minimum pour partir en retraite. Pour les SPP (catégorie active), monte progressivement de 57 à 59 ans selon la génération.',
    ref: 'Loi n°2023-270',
  },

  'categorie-active': {
    libelle: 'Catégorie active',
    resume:
      'Emploi classé comme présentant un risque particulier. Ouvre droit à un départ anticipé sous condition de 17 ans de services en catégorie active.',
  },

  'quotite': {
    libelle: 'Quotité de travail',
    resume:
      'Proportion de temps travaillé (1 = temps plein, 0,8 = 80 %, etc.). Impacte la durée liquidable mais pas la durée d\'assurance.',
  },

  'bspp-bmpm': {
    libelle: 'BSPP / BMPM',
    resume:
      'Brigade de Sapeurs-Pompiers de Paris (BSPP) et Bataillon de Marins-Pompiers de Marseille (BMPM). Services militaires assimilés à la catégorie active.',
  },

  'tib-mensuel': {
    libelle: 'TIB mensuel',
    resume:
      'Traitement Indiciaire Brut mensuel = indice majoré × valeur mensuelle du point d\'indice.',
  },

  'pension-brute': {
    libelle: 'Pension brute',
    resume:
      'Montant avant prélèvements sociaux (CSG, CRDS, CASA). Le net est généralement de 8 à 10 % inférieur.',
  },
};

/**
 * Récupère une entrée du glossaire par sa clé.
 * @param {string} cle
 * @returns {Object|null}
 */
export function getTerme(cle) {
  return GLOSSAIRE[cle] || null;
}
