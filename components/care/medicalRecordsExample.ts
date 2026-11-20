import type { MedicalRecordData } from '../../services/medicalRecords';

/**
 * Demo content for the Medical records screen.
 *
 * The example is shown on screen only, under a clear "Example" banner. It is never
 * written to the patient's account or device. To turn the "See an example" button off,
 * set SHOW_MEDICAL_RECORDS_EXAMPLE to false; to change what it shows, edit
 * EXAMPLE_MEDICAL_RECORD (same shape as the stored careVault/medicalHistory document).
 */
export const SHOW_MEDICAL_RECORDS_EXAMPLE = true;

export const EXAMPLE_MEDICAL_RECORD: MedicalRecordData = {
  primaryDiagnosis: 'Sickle cell anaemia (Hemoglobin SS)',
  allergies: 'Penicillin (rash as a child)',
  otherConditions: ['Gallstones (gallbladder removed 2022)'],
  medications: [
    {
      id: 'example-med-1',
      name: 'Hydroxyurea',
      dosage: '500 mg once daily',
      startDate: '2023-03-01',
      isActive: true,
      adherenceNotes: 'Taken at bedtime.',
    },
    {
      id: 'example-med-2',
      name: 'Folic acid',
      dosage: '5 mg once daily',
      startDate: '2022-01-10',
      isActive: true,
    },
  ],
  diseaseModifyingTherapy: {
    hydroxyureaResponse: 'Fewer pain crises since starting.',
    latestHbF: '15%',
  },
  surgeries: [
    {
      id: 'example-surgery-1',
      name: 'Gallbladder removal (cholecystectomy)',
      date: '2022-11-18',
      hospital: 'Example Teaching Hospital',
    },
  ],
  hospitalizations: [
    {
      id: 'example-stay-1',
      reason: 'Acute chest syndrome',
      date: '2024-04-12',
      durationDays: 4,
    },
  ],
  transfusions: [
    {
      id: 'example-transfusion-1',
      date: '2024-04-13',
      units: 2,
      reactionNotes: 'No reaction.',
    },
  ],
  labs: [
    {
      id: 'example-lab-1',
      date: '2026-08-14',
      hemoglobin: 8.7,
      steadyStatePcv: 26,
      lastEUCr: 'Urea 3.4 mmol/L, Creatinine 62 µmol/L',
      hbfPercentage: 15,
      notes: 'Routine clinic check, feeling well (steady state).',
    },
  ],
  immunizations: ['Pneumococcal vaccine (2024)', 'Meningococcal vaccine (2025)'],
  emergencyInfo: {
    hematologistName: 'Example Haematology Clinic',
    hematologistPhone: '',
    usualPainRegimen: 'Warmth, fluids and the pain medicine on my clinic plan. Go to hospital if pain is not easing after 2 hours.',
    whatToTellER: 'I have sickle cell anaemia (HbSS). My usual Hb is about 8.7 g/dL. I am allergic to penicillin. Please treat my pain promptly.',
  },
};
