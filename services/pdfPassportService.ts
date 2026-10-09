import { jsPDF } from 'jspdf';
import { displayValue, fieldValue, isRecord, recordSections, type MedicalRecordData } from './medicalRecords';

// Retain the existing export entry point, but export only recorded fields.
export const generateClinicalPassportPDF = (input: object, userName?: string) => {
  const data = input as MedicalRecordData;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 18;
  const write = (text: string, heading = false) => {
    doc.setFont('helvetica', heading ? 'bold' : 'normal');
    doc.setFontSize(heading ? 12 : 10);
    const lines: string[] = doc.splitTextToSize(text, 174);
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 18; }
      doc.text(line, 18, y); y += 6;
    }
    y += 2;
  };
  write('Patient-maintained health summary', true);
  write('Not clinician-verified. Earlier versions could save sample information. Review every entry before sharing. This is not a treatment plan.');
  write('Exported: ' + new Date().toLocaleDateString());
  if (userName?.trim()) write('Name supplied for export: ' + userName.trim());
  for (const section of recordSections) {
    write(section.title, true);
    if (section.itemLabel) {
      const items: unknown[] = Array.isArray(data[section.key]) ? data[section.key] as unknown[] : [];
      if (!items.length) write('No information recorded.');
      items.forEach((item, index) => {
        if (section.stringList) write(displayValue(item));
        else if (isRecord(item)) {
          write('Entry ' + (index + 1));
          section.fields?.forEach(field => write(field.label + ': ' + displayValue(fieldValue(item, field.key))));
        } else write('An older entry could not be represented in this summary.');
      });
    } else section.fields?.forEach(field => write(field.label + ': ' + displayValue(fieldValue(data, field.key))));
  }
  doc.save('Patient_Health_Summary.pdf');
};
