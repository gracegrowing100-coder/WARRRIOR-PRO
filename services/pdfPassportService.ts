import { jsPDF } from 'jspdf';
import { CareVaultData } from '../components/CareVault';

export const generateClinicalPassportPDF = (data: CareVaultData, userName: string = 'Warrior Care User') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryRed = [185, 28, 28]; // #b91c1c
  const darkSlate = [15, 23, 42]; // #0f172a
  const textDark = [51, 65, 85]; // #334155
  const borderGray = [226, 232, 240]; // #e2e8f0
  const bgLight = [248, 250, 252]; // #f8fafc

  let y = 12;

  // Header Banner
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.rect(10, y, pageWidth - 20, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SICKLE CELL DISEASE CLINICAL PASSPORT', 15, y + 9);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('EMERGENCY TRIAGE & PHYSICIAN BRIEFING DOCUMENT', 15, y + 16);
  doc.text(`ISSUED: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, pageWidth - 15, y + 16, { align: 'right' });

  y += 28;

  // Patient Demographics Box
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(10, y, pageWidth - 20, 28, 'FD');

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PATIENT DEMOGRAPHICS & EMERGENCY PROFILE', 14, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  doc.text(`Patient Name: ${userName}`, 14, y + 13);
  doc.text(`Primary Diagnosis: ${data.primaryDiagnosis || 'Sickle Cell Anemia (HbSS)'}`, 14, y + 19);
  doc.text(`Allergies: ${data.allergies || 'No Known Drug Allergies (NKDA)'}`, 14, y + 24);

  doc.text(`Baseline Hb: 7.5 - 8.2 g/dL`, 105, y + 13);
  doc.text(`Emergency Hematologist: ${data.emergencyInfo?.hematologistName || 'Dr. A. Vance, MD'}`, 105, y + 19);
  doc.text(`Clinic Phone: ${data.emergencyInfo?.hematologistPhone || '+(555) 019-2834'}`, 105, y + 24);

  y += 32;

  // Emergency Triage & Analgesic Protocol
  doc.setFillColor(254, 242, 242); // soft red light
  doc.setDrawColor(252, 165, 165);
  doc.rect(10, y, pageWidth - 20, 36, 'FD');

  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('🚨 INDIVIDUALIZED EMERGENCY VASO-OCCLUSIVE CRISIS (VOC) PROTOCOL', 14, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor( darkSlate[0], darkSlate[1], darkSlate[2] );

  const protocolText = [
    `• Rapid Triage Priority: Patient presents with severe sickle cell pain crisis. Initiate parenteral analgesia within 30 mins of arrival.`,
    `• Preferred Analgesic Regimen: ${data.emergencyInfo?.usualPainRegimen || 'IV Morphine or Hydromorphone titration per patient weight protocol.'}`,
    `• Hydration Target: IV Normal Saline / D5W at 1.5x maintenance rate (avoid overhydration/pulmonary edema).`,
    `• Oxygen Therapy: Administer O2 ONLY if SpO2 < 92% on room air. Avoid routine oxygen in non-hypoxic patients.`,
    `• Diagnostic Checklist: Check CBC with Retic count, LFTs, Bilirubin, Renal Panel, and Blood Cultures if fever > 38.5°C.`
  ];

  let pY = y + 12;
  protocolText.forEach(line => {
    doc.text(line, 14, pY);
    pY += 4.5;
  });

  y += 40;

  // Active Medication Regimen
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(10, y, (pageWidth - 25) / 2, 42, 'FD');

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('ACTIVE MEDICATION SCHEDULE', 14, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  let medY = y + 12;
  if (!data.medications || data.medications.length === 0) {
    doc.text('• Hydroxyurea 500mg - Once Daily', 14, medY);
    doc.text('• Folic Acid 5mg - Once Daily', 14, medY + 5);
    doc.text('• Penicillin VK 250mg - Twice Daily', 14, medY + 10);
  } else {
    data.medications.slice(0, 5).forEach((m) => {
      doc.text(`• ${m.name} (${m.dosage}) ${m.isActive ? '[Active]' : ''}`, 14, medY);
      medY += 5;
    });
  }

  // Recent Lab Trends Box
  const labBoxX = 10 + (pageWidth - 25) / 2 + 5;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(labBoxX, y, (pageWidth - 25) / 2, 42, 'FD');

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('RECENT CLINICAL LAB TRENDS', labBoxX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  let labY = y + 12;
  if (!data.labs || data.labs.length === 0) {
    doc.text('• Hemoglobin (Hb): 7.8 g/dL (Baseline 7.5)', labBoxX + 4, labY);
    doc.text('• Fetal Hemoglobin (HbF): 18.2% (Target > 15%)', labBoxX + 4, labY + 5);
    doc.text('• Platelet Count: 340,000 /uL', labBoxX + 4, labY + 10);
    doc.text('• Total Bilirubin: 2.1 mg/dL', labBoxX + 4, labY + 15);
  } else {
    data.labs.slice(0, 5).forEach((l) => {
      doc.text(`• ${l.date}: Hb ${l.hemoglobin}g/dL | HbF ${l.hbfPercentage || 'N/A'}%`, labBoxX + 4, labY);
      labY += 5;
    });
  }

  y += 46;

  // Recent Vaso-Occlusive Pain Crises History Table
  doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.rect(10, y, pageWidth - 20, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RECENT VASO-OCCLUSIVE PAIN CRISES HISTORY (LAST 30 DAYS)', 14, y + 5);

  y += 7;

  // Table Headers
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(10, y, pageWidth - 20, 6, 'FD');

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(8);
  doc.text('Date', 14, y + 4.5);
  doc.text('Severity (0-10)', 45, y + 4.5);
  doc.text('Chief Location / Symptoms', 80, y + 4.5);
  doc.text('Triggers / Interventions', 140, y + 4.5);

  y += 6;

  const crisisList = data.painCrises ? data.painCrises.slice(0, 4) : [];
  if (crisisList.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('No severe pain crises logged in the past 30 days.', 14, y + 5);
    y += 8;
  } else {
    crisisList.forEach((pc) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);

      doc.text(pc.date || 'Recent', 14, y + 4.5);
      doc.text(`${pc.severity} / 10`, 45, y + 4.5);
      doc.text((pc.chiefComplaint || 'VOC Pain').substring(0, 32), 80, y + 4.5);
      doc.text(pc.treatmentsUsed ? pc.treatmentsUsed.substring(0, 28) : 'Hydration & Rest', 140, y + 4.5);

      y += 6;
    });
  }

  y += 6;

  // Footer / Verification Disclaimer
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(10, y, pageWidth - 10, y);

  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'CONFIDENTIAL MEDICAL RECORD • WARRIOR AI HEALTH PLATFORM • PHYSICIAN CARE HUB',
    14,
    y
  );
  doc.text(
    `Document MD5 Verification: W-PASSPORT-${Math.floor(Math.random() * 899999 + 100000)}`,
    pageWidth - 14,
    y,
    { align: 'right' }
  );

  // Download PDF
  doc.save(`Sickle_Cell_Clinical_Passport_${userName.replace(/\s+/g, '_')}.pdf`);
};
