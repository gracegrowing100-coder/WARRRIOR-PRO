import React from 'react';
import { MedicalRecords } from './care/MedicalRecords';

// Compatibility types for existing consumers; stored field names are unchanged.
export interface Surgery {
  id: string;
  name: string;
  date: string;
  hospital: string;
  complications?: string;
}

export interface Hospitalization {
  id: string;
  reason: string;
  date: string;
  durationDays: number;
  notes: string;
}

export interface Transfusion {
  id: string;
  date: string;
  volumeMl: number;
  units: number;
  reactionNotes: string;
}

export interface PainCrisisLog {
  id: string;
  date: string;
  chiefComplaint: string;
  severity: number; // 0-10
  durationHours: number;
  triggers: string[];
  painLocations: string[];
  treatmentsUsed: string;
  didGoToER: boolean;
  outcome: string;
}

export interface MedicationHistory {
  id: string;
  name: string;
  dosage: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  adherenceNotes?: string;
}

export interface LabResult {
  id: string;
  date: string;
  hemoglobin: number;
  reticulocyte?: number;
  bilirubin?: number;
  ldh?: number;
  ferritin?: number;
  hbfPercentage?: number;
  notes?: string;
}

export interface AttachedRecord {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
}

export interface CareVaultData {
  primaryDiagnosis: string;
  otherConditions: string[];
  allergies: string;
  surgeries: Surgery[];
  hospitalizations: Hospitalization[];
  transfusions: Transfusion[];
  immunizations: string[];
  painCrises: PainCrisisLog[];
  medications: MedicationHistory[];
  labs: LabResult[];
  attachedFiles: AttachedRecord[];
  chelation: {
    isActive: boolean;
    agentName: string;
    ironOverloadStatus: string;
  };
  diseaseModifyingTherapy: {
    hydroxyureaResponse: string;
    latestHbF: string;
    sideEffects: string;
  };
  emergencyInfo: {
    hematologistName: string;
    hematologistPhone: string;
    usualPainRegimen: string;
    whatToTellER: string;
  };
  notesJournal: string;
}


// Every production entry point uses the same patient-maintained records surface.
export const CareVault: React.FC<{ userId: string }> = ({ userId }) => (
  <MedicalRecords key={userId} userId={userId} />
);
