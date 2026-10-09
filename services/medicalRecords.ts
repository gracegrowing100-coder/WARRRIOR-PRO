// Existing careVault/medicalHistory fields. No clinical defaults or schema migration.
export type MedicalRecordData = Record<string, unknown>;
export interface RecordField {
  key: string;
  label: string;
  type?: 'number' | 'boolean' | 'multiline';
  required?: boolean;
}
export interface RecordSection {
  key: string;
  title: string;
  fields?: RecordField[];
  itemLabel?: string;
  stringList?: boolean;
}
export const recordSections: RecordSection[] = [
  { key: 'background', title: 'Health background', fields: [
    { key: 'primaryDiagnosis', label: 'Diagnosis' },
    { key: 'allergies', label: 'Allergies', type: 'multiline' },
  ] },
  { key: 'otherConditions', title: 'Conditions', stringList: true, itemLabel: 'condition' },
  { key: 'medications', title: 'Medication history', itemLabel: 'medication', fields: [
    { key: 'name', label: 'Medication name', required: true }, { key: 'dosage', label: 'Dosage' },
    { key: 'startDate', label: 'Start date' }, { key: 'endDate', label: 'End date' },
    { key: 'isActive', label: 'Currently taking', type: 'boolean' },
    { key: 'adherenceNotes', label: 'Medication notes', type: 'multiline' },
  ] },
  { key: 'therapy', title: 'Therapy information', fields: [
    { key: 'diseaseModifyingTherapy.hydroxyureaResponse', label: 'Recorded hydroxyurea response', type: 'multiline' },
    { key: 'diseaseModifyingTherapy.latestHbF', label: 'Recorded HbF' },
    { key: 'diseaseModifyingTherapy.sideEffects', label: 'Side effects noted', type: 'multiline' },
    { key: 'chelation.isActive', label: 'Currently taking chelation therapy', type: 'boolean' },
    { key: 'chelation.agentName', label: 'Chelation medication' },
    { key: 'chelation.ironOverloadStatus', label: 'Recorded iron status', type: 'multiline' },
  ] },
  { key: 'surgeries', title: 'Surgeries', itemLabel: 'surgery', fields: [
    { key: 'name', label: 'Procedure name', required: true }, { key: 'date', label: 'Procedure date' },
    { key: 'hospital', label: 'Hospital or facility' }, { key: 'complications', label: 'Complications or notes', type: 'multiline' },
  ] },
  { key: 'hospitalizations', title: 'Hospital stays', itemLabel: 'hospital stay', fields: [
    { key: 'reason', label: 'Reason for admission', required: true }, { key: 'date', label: 'Admission date' },
    { key: 'durationDays', label: 'Duration in days', type: 'number' }, { key: 'notes', label: 'Admission notes', type: 'multiline' },
  ] },
  { key: 'transfusions', title: 'Transfusions', itemLabel: 'transfusion', fields: [
    { key: 'date', label: 'Transfusion date', required: true }, { key: 'volumeMl', label: 'Volume (mL)', type: 'number' },
    { key: 'units', label: 'Units', type: 'number' }, { key: 'reactionNotes', label: 'Reaction notes', type: 'multiline' },
  ] },
  { key: 'labs', title: 'Laboratory records', itemLabel: 'laboratory record', fields: [
    { key: 'date', label: 'Laboratory date', required: true }, { key: 'hemoglobin', label: 'Haemoglobin (g/dL)', type: 'number', required: true },
    { key: 'reticulocyte', label: 'Reticulocytes (%)', type: 'number' }, { key: 'bilirubin', label: 'Bilirubin (mg/dL)', type: 'number' },
    { key: 'ldh', label: 'LDH (U/L)', type: 'number' }, { key: 'ferritin', label: 'Ferritin (ng/mL)', type: 'number' },
    { key: 'hbfPercentage', label: 'HbF (%)', type: 'number' }, { key: 'notes', label: 'Laboratory notes', type: 'multiline' },
  ] },
  { key: 'immunizations', title: 'Immunizations', stringList: true, itemLabel: 'immunization' },
  { key: 'care', title: 'Care information', fields: [
    { key: 'emergencyInfo.hematologistName', label: 'Care contact name' },
    { key: 'emergencyInfo.hematologistPhone', label: 'Care contact phone' },
    { key: 'emergencyInfo.usualPainRegimen', label: 'Pain plan you have recorded', type: 'multiline' },
    { key: 'emergencyInfo.whatToTellER', label: 'Information to share in an emergency', type: 'multiline' },
    { key: 'notesJournal', label: 'Care notes', type: 'multiline' },
  ] },
];
export function isRecord(value: unknown): value is MedicalRecordData {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function fieldValue(record: MedicalRecordData, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => isRecord(value) ? value[key] : undefined, record);
}
export function displayValue(value: unknown): string {
  if (typeof value === 'string') return value.trim() || 'Not recorded';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return 'Not recorded';
}
export function mergeMedicalRecords(current: MedicalRecordData, patch: MedicalRecordData): MedicalRecordData {
  const result = { ...current };
  Object.entries(patch).forEach(([key, value]) => {
    result[key] = isRecord(value) && isRecord(current[key])
      ? mergeMedicalRecords(current[key], value) : value;
  });
  return result;
}
export function fieldPatch(path: string, value: unknown): MedicalRecordData {
  const [key, ...rest] = path.split('.');
  return { [key]: rest.length ? fieldPatch(rest.join('.'), value) : value };
}
export function hasMedicalInformation(data: MedicalRecordData): boolean {
  return recordSections.some(section => section.itemLabel
    ? Array.isArray(data[section.key]) && (data[section.key] as unknown[]).length > 0
    : section.fields?.some(field => displayValue(fieldValue(data, field.key)) !== 'Not recorded'));
}
