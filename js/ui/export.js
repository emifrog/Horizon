/**
 * Module Export - Export PDF des résultats
 *
 * Utilise l'API native window.print() avec une feuille de style dédiée.
 *
 * @module ui/export
 */

import { formaterMontant, formaterPourcentage, formaterTrimestres } from '../utils/formatters.js';
import { formaterDateLongueFR, formaterDateFR } from '../utils/dates.js';

/**
 * Génère et affiche la version imprimable des résultats
 * @param {Object} resultats - Résultats de la simulation
 * @param {Object} profil - Profil de l'agent
 */
export function exporterPDF(resultats, profil) {
  // Créer le contenu HTML pour l'impression
  const printContent = genererContenuImpression(resultats, profil);

  // Ouvrir une nouvelle fenêtre pour l'impression
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (!printWindow) {
    alert('Veuillez autoriser les popups pour exporter en PDF');
    return;
  }

  printWindow.document.write(printContent);
  printWindow.document.close();

  // Attendre le chargement puis imprimer
  printWindow.onload = function () {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

/**
 * Génère le contenu HTML pour l'impression
 * @param {Object} resultats - Résultats
 * @param {Object} profil - Profil
 * @returns {string} HTML complet
 */
function genererContenuImpression(resultats, profil) {
  const dateGeneration = formaterDateFR(new Date());

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Simulation Retraite SPP - ${dateGeneration}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      padding: 20mm;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #C8102E;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .header h1 {
      font-size: 18pt;
      color: #C8102E;
    }

    .header .date {
      font-size: 10pt;
      color: #666;
    }

    h2 {
      font-size: 14pt;
      color: #1E3A5F;
      margin-top: 20px;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }

    h3 {
      font-size: 12pt;
      color: #333;
      margin-top: 15px;
      margin-bottom: 8px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .info-box {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 4px;
      border-left: 3px solid #C8102E;
    }

    .info-box label {
      display: block;
      font-size: 9pt;
      color: #666;
      margin-bottom: 3px;
    }

    .info-box value {
      display: block;
      font-size: 14pt;
      font-weight: 600;
      color: #333;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }

    th, td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    th {
      background: #f0f0f0;
      font-weight: 600;
      color: #1E3A5F;
    }

    tr:nth-child(even) {
      background: #fafafa;
    }

    .highlight-row {
      background: #e8f5e9 !important;
      font-weight: 600;
    }

    .total-row {
      font-weight: 700;
      background: #f0f0f0 !important;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: 600;
    }

    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-info { background: #d1ecf1; color: #0c5460; }

    .warning-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 12px;
      margin-top: 20px;
      font-size: 9pt;
    }

    .warning-box strong {
      color: #856404;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 8pt;
      color: #999;
      text-align: center;
    }

    @media print {
      body {
        padding: 10mm;
      }

      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Simulation Retraite SPP</h1>
    <span class="date">Généré le ${dateGeneration}</span>
  </div>

  <h2>Votre profil</h2>
  <div class="info-grid">
    <div class="info-box">
      <label>Année de naissance</label>
      <value>${profil.anneeNaissance || '-'}</value>
    </div>
    <div class="info-box">
      <label>Date d'entrée SPP</label>
      <value>${profil.dateEntreeSPP ? formaterDateFR(profil.dateEntreeSPP) : '-'}</value>
    </div>
    <div class="info-box">
      <label>Indice brut actuel</label>
      <value>${profil.indiceBrut || '-'}</value>
    </div>
    <div class="info-box">
      <label>Quotité de travail</label>
      <value>${profil.quotite === 1 ? 'Temps plein' : `${Math.round(profil.quotite * 100)}%`}</value>
    </div>
  </div>

  <h2>Résumé</h2>
  <div class="info-grid">
    <div class="info-box">
      <label>Pension estimée (taux plein)</label>
      <value>${formaterMontant(resultats.pensionTauxPlein?.pensionBruteMensuelle)} brut/mois</value>
    </div>
    <div class="info-box">
      <label>Date du taux plein</label>
      <value>${formaterDateLongueFR(resultats.dateTauxPlein)}</value>
    </div>
    <div class="info-box">
      <label>Taux de liquidation</label>
      <value>${formaterPourcentage(resultats.pensionTauxPlein?.tauxLiquidationNet)}</value>
    </div>
    <div class="info-box">
      <label>Durée d'assurance</label>
      <value>${formaterTrimestres(resultats.duree?.trimestresAssuranceTotale)} / ${resultats.duree?.trimestresRequis} requis</value>
    </div>
  </div>

  <h2>Scénarios de départ</h2>
  <table>
    <thead>
      <tr>
        <th>Scénario</th>
        <th>Date</th>
        <th class="text-center">Âge</th>
        <th class="text-center">Trimestres</th>
        <th class="text-center">Taux</th>
        <th class="text-right">Pension brute</th>
        <th class="text-center">Statut</th>
      </tr>
    </thead>
    <tbody>
      ${resultats.scenarios.map((s, i) => `
        <tr class="${i === 1 ? 'highlight-row' : ''}">
          <td>${s.description}</td>
          <td>${formaterDateFR(s.date)}</td>
          <td class="text-center">${Math.floor(s.age)} ans</td>
          <td class="text-center">${s.trimestresLiquidables}</td>
          <td class="text-center">${formaterPourcentage(s.tauxLiquidation)}</td>
          <td class="text-right">${formaterMontant(s.pension?.pensionBruteMensuelle)}</td>
          <td class="text-center">
            ${s.decote ? '<span class="badge badge-warning">Décote</span>' : ''}
            ${s.surcote ? '<span class="badge badge-success">Surcote</span>' : ''}
            ${!s.decote && !s.surcote ? '<span class="badge badge-info">Taux plein</span>' : ''}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Détail de la durée d'assurance</h2>
  <table>
    <tbody>
      <tr>
        <td>Services effectifs SPP</td>
        <td class="text-right">${formaterTrimestres(resultats.duree?.trimestresServicesEffectifs)}</td>
      </tr>
      <tr>
        <td>Bonification du 1/5ème</td>
        <td class="text-right">+${resultats.duree?.trimestresBonificationCinquieme || 0} trimestres</td>
      </tr>
      <tr>
        <td>Bonification enfants (avant 2004)</td>
        <td class="text-right">+${resultats.duree?.trimestresBonificationEnfants || 0} trimestres</td>
      </tr>
      <tr>
        <td>Majoration SPV</td>
        <td class="text-right">+${resultats.duree?.trimestresMajorationSPV || 0} trimestres</td>
      </tr>
      <tr>
        <td>Trimestres autres régimes</td>
        <td class="text-right">+${resultats.duree?.trimestresAutresRegimes || 0} trimestres</td>
      </tr>
      <tr class="total-row">
        <td><strong>Total durée d'assurance</strong></td>
        <td class="text-right"><strong>${formaterTrimestres(resultats.duree?.trimestresAssuranceTotale)}</strong></td>
      </tr>
    </tbody>
  </table>

  <h2>Détail de la pension</h2>
  <table>
    <tbody>
      <tr>
        <td>Traitement indiciaire brut annuel</td>
        <td class="text-right">${formaterMontant(resultats.pensionTauxPlein?.traitementIndiciaireAnnuel)}</td>
      </tr>
      <tr>
        <td>Taux de liquidation brut</td>
        <td class="text-right">${formaterPourcentage(resultats.pensionTauxPlein?.tauxLiquidationBrut)}</td>
      </tr>
      <tr>
        <td>Décote (trimestres)</td>
        <td class="text-right">${resultats.pensionTauxPlein?.trimestresDecote || 0} trimestres</td>
      </tr>
      <tr>
        <td>Taux de liquidation net</td>
        <td class="text-right">${formaterPourcentage(resultats.pensionTauxPlein?.tauxLiquidationNet)}</td>
      </tr>
      <tr class="total-row">
        <td><strong>Pension brute mensuelle</strong></td>
        <td class="text-right"><strong>${formaterMontant(resultats.pensionTauxPlein?.pensionBruteMensuelle)}</strong></td>
      </tr>
      <tr>
        <td>Pension nette estimée</td>
        <td class="text-right">${formaterMontant(resultats.pensionTauxPlein?.pensionNetteMensuelle)}</td>
      </tr>
    </tbody>
  </table>

  ${resultats.nbi?.eligible || resultats.pfr ? `
    <h2>Compléments</h2>
    <table>
      <tbody>
        ${resultats.nbi?.eligible ? `
          <tr>
            <td>Supplément NBI (${resultats.nbi.pointsNBI} points)</td>
            <td class="text-right">+${formaterMontant(resultats.nbi.supplementMensuel)}/mois</td>
          </tr>
        ` : ''}
        ${resultats.pfr ? `
          <tr>
            <td>Rente RAFP estimée</td>
            <td class="text-right">+${formaterMontant(resultats.pfr.renteRAFPMensuelle)}/mois</td>
          </tr>
        ` : ''}
        <tr class="total-row">
          <td><strong>Total retraite estimé</strong></td>
          <td class="text-right"><strong>${formaterMontant(resultats.totalRetraite)}/mois</strong></td>
        </tr>
      </tbody>
    </table>
  ` : ''}

  <div class="warning-box">
    <strong>Avertissement</strong><br>
    Cette simulation est fournie à titre indicatif et ne constitue pas un engagement.
    Seule la CNRACL est habilitée à calculer vos droits définitifs à la retraite.
    Les paramètres réglementaires (durées, taux, âges) sont susceptibles d'évoluer.
  </div>

  <div class="footer">
    Simulateur Retraite SPP - Document généré le ${dateGeneration}<br>
    Outil indicatif développé pour les sapeurs-pompiers professionnels relevant de la CNRACL
  </div>
</body>
</html>
  `;
}

/**
 * Prépare l'impression de la page courante
 */
export function preparerImpression() {
  // Ajouter une classe pour le mode impression
  document.body.classList.add('print-mode');

  // Déclencher l'impression
  window.print();

  // Retirer la classe après impression
  window.onafterprint = () => {
    document.body.classList.remove('print-mode');
  };
}

/**
 * Exporte les résultats au format CSV
 * @param {Object} resultats - Résultats
 * @param {Object} profil - Profil
 */
export function exporterCSV(resultats, profil) {
  const dateGeneration = formaterDateFR(new Date());
  const separator = ';'; // Point-virgule pour compatibilité Excel FR
  
  // En-tête du fichier
  let csv = `Simulation Retraite SPP - Généré le ${dateGeneration}\n\n`;
  
  // Section Profil
  csv += `PROFIL\n`;
  csv += `Année de naissance${separator}${profil.anneeNaissance || ''}\n`;
  csv += `Date d'entrée SPP${separator}${profil.dateEntreeSPP ? formaterDateFR(profil.dateEntreeSPP) : ''}\n`;
  csv += `Indice brut${separator}${profil.indiceBrut || ''}\n`;
  csv += `Quotité${separator}${profil.quotite === 1 ? '100%' : `${Math.round(profil.quotite * 100)}%`}\n`;
  csv += `\n`;
  
  // Section Résumé
  csv += `RÉSUMÉ\n`;
  csv += `Pension estimée (taux plein)${separator}${resultats.pensionTauxPlein?.pensionBruteMensuelle?.toFixed(2) || ''} €/mois\n`;
  csv += `Taux de liquidation${separator}${resultats.pensionTauxPlein?.tauxLiquidationNet?.toFixed(2) || ''}%\n`;
  csv += `Durée d'assurance${separator}${resultats.duree?.trimestresAssuranceTotale || ''} trimestres\n`;
  csv += `Trimestres requis${separator}${resultats.duree?.trimestresRequis || ''} trimestres\n`;
  csv += `\n`;
  
  // Section Scénarios
  csv += `SCÉNARIOS DE DÉPART\n`;
  csv += `Scénario${separator}Date${separator}Âge${separator}Trimestres${separator}Taux${separator}Pension brute${separator}Statut\n`;
  
  if (resultats.scenarios && Array.isArray(resultats.scenarios)) {
    resultats.scenarios.forEach(s => {
      const statut = s.decote ? 'Décote' : (s.surcote ? 'Surcote' : 'Taux plein');
      csv += `${s.description}${separator}`;
      csv += `${formaterDateFR(s.date)}${separator}`;
      csv += `${Math.floor(s.age)} ans${separator}`;
      csv += `${s.trimestresLiquidables}${separator}`;
      csv += `${s.tauxLiquidation?.toFixed(2)}%${separator}`;
      csv += `${s.pension?.pensionBruteMensuelle?.toFixed(2)} €${separator}`;
      csv += `${statut}\n`;
    });
  }
  csv += `\n`;
  
  // Section Durée d'assurance
  csv += `DÉTAIL DURÉE D'ASSURANCE\n`;
  csv += `Services effectifs SPP${separator}${resultats.duree?.trimestresServicesEffectifs || 0} trimestres\n`;
  csv += `Bonification 1/5ème${separator}${resultats.duree?.trimestresBonificationCinquieme || 0} trimestres\n`;
  csv += `Bonification enfants${separator}${resultats.duree?.trimestresBonificationEnfants || 0} trimestres\n`;
  csv += `Majoration SPV${separator}${resultats.duree?.trimestresMajorationSPV || 0} trimestres\n`;
  csv += `Autres régimes${separator}${resultats.duree?.trimestresAutresRegimes || 0} trimestres\n`;
  csv += `TOTAL${separator}${resultats.duree?.trimestresAssuranceTotale || 0} trimestres\n`;
  csv += `\n`;
  
  // Section Compléments
  csv += `COMPLÉMENTS\n`;
  if (resultats.nbi?.eligible) {
    csv += `Supplément NBI (${resultats.nbi.pointsNBI} pts)${separator}+${resultats.nbi.supplementMensuel?.toFixed(2)} €/mois\n`;
  }
  if (resultats.pfr?.renteRAFPMensuelle) {
    csv += `Rente RAFP${separator}+${resultats.pfr.renteRAFPMensuelle?.toFixed(2)} €/mois\n`;
  }
  if (resultats.pfrSPV?.eligible) {
    csv += `PFR SPV (${resultats.pfrSPV.anneesSPV} ans)${separator}+${resultats.pfrSPV.montantMensuel?.toFixed(2)} €/mois\n`;
  }
  csv += `Total retraite estimé${separator}${resultats.totalRetraite?.toFixed(2)} €/mois\n`;
  csv += `\n`;
  
  // Avertissement
  csv += `AVERTISSEMENT\n`;
  csv += `Cette simulation est fournie à titre indicatif. Seule la CNRACL est habilitée à calculer vos droits définitifs.\n`;

  // Créer et télécharger le fichier
  // BOM UTF-8 pour que Excel reconnaisse l'encodage
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `simulation-retraite-${dateGeneration.replace(/\//g, '-')}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
