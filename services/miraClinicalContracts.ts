import type { MiraLanguageCode } from './miraConfig.ts';

export const MIRA_CLINICAL_INTENTS = [
  'education',
  'symptom_support',
  'medication_education',
  'self_care',
  'care_navigation',
  'appointment_preparation',
  'other',
] as const;

export type MiraClinicalIntent = (typeof MIRA_CLINICAL_INTENTS)[number];

export const MIRA_CLINICAL_TOPICS = [
  'scd_basics',
  'pain',
  'fever_infection',
  'hydration',
  'fatigue_anemia',
  'acute_chest',
  'breathing',
  'neurological',
  'medication',
  'hydroxyurea',
  'transfusion',
  'pregnancy',
  'mental_wellbeing',
  'routine_follow_up',
  'other',
] as const;

export type MiraClinicalTopic = (typeof MIRA_CLINICAL_TOPICS)[number];

export const MIRA_CLINICAL_URGENCIES = ['none', 'specialist', 'urgent'] as const;
export type MiraClinicalUrgency = (typeof MIRA_CLINICAL_URGENCIES)[number];

export const MIRA_SAFETY_CATEGORIES = [
  'chest_pain',
  'breathing_difficulty',
  'neurological_warning',
  'seizure_or_unconsciousness',
  'fever_or_infection',
  'severe_or_worsening_pain',
  'unable_to_drink_or_retain_fluids',
  'priapism',
  'confusion_or_severe_weakness',
  'sudden_pallor_or_splenic_concern',
  'pregnancy_emergency',
  'mental_health_crisis',
] as const;

export type MiraSafetyCategory = (typeof MIRA_SAFETY_CATEGORIES)[number];

export const MIRA_SAFETY_DETECTION_LEVELS = ['DETERMINISTIC', 'HYBRID', 'LLM_ASSISTED'] as const;
export type MiraSafetyDetectionLevel = (typeof MIRA_SAFETY_DETECTION_LEVELS)[number];

export interface MiraSafetyResult {
  urgency: MiraClinicalUrgency;
  categories: MiraSafetyCategory[];
  deterministic: boolean;
  matchedCurrentTurn: boolean;
  continuationOfRecentConcern: boolean;
  reasons: string[];
}

export const MIRA_CONTEXT_PROVENANCES = ['patient-entered', 'patient-maintained'] as const;
export type MiraContextProvenance = (typeof MIRA_CONTEXT_PROVENANCES)[number];

export const MIRA_CONTEXT_STORAGE_STATES = [
  'recorded',
  'cached',
  'device-only',
  'missing',
  'unavailable',
] as const;
export type MiraContextStorageState = (typeof MIRA_CONTEXT_STORAGE_STATES)[number];

export const MIRA_CONTEXT_FRESHNESS_VALUES = ['current', 'stale', 'unknown'] as const;
export type MiraContextFreshness = (typeof MIRA_CONTEXT_FRESHNESS_VALUES)[number];

export const MIRA_KNOWLEDGE_RISKS = ['low', 'medium', 'high', 'critical'] as const;
export type MiraKnowledgeRisk = (typeof MIRA_KNOWLEDGE_RISKS)[number];

export const MIRA_CLINICAL_DISCLAIMER = 'mira-ai-not-clinician' as const;

export interface MiraContextValue<T> {
  value: T | null;
  provenance: MiraContextProvenance;
  storageState: MiraContextStorageState;
  recordedAt?: string;
  freshness: MiraContextFreshness;
}

export interface MiraKnowledgeSourceReference {
  title: string;
  organization: string;
  publicationDate?: string;
  jurisdiction?: string;
  url: string;
}

export interface MiraKnowledgeModule {
  id: string;
  version: string;
  title: string;
  topics: MiraClinicalTopic[];
  languages: MiraLanguageCode[];
  risk: MiraKnowledgeRisk;
  reviewedAt: string;
  reviewedBy: string;
  sourceRefs: MiraKnowledgeSourceReference[];
  educationalPoints: string[];
  allowedSelfCareGuidance: string[];
  prohibitedClaims: string[];
  escalationCategories: string[];
}

export interface MiraKnowledgeRetrievalInput {
  topic: MiraClinicalTopic;
  language: MiraLanguageCode;
  maxModules: number;
}

/** Future retrieval seam only. H1 provides no production knowledge source. */
export interface MiraKnowledgeRetriever {
  retrieve(input: MiraKnowledgeRetrievalInput): Promise<MiraKnowledgeModule[]>;
}

export interface MiraContextReference {
  key: string;
  provenance: MiraContextProvenance;
  recordedAt?: string;
  freshness: MiraContextFreshness;
}

export interface MiraClinicalResult {
  reply: string;
  intent: MiraClinicalIntent;
  topic: MiraClinicalTopic;
  urgency: MiraClinicalUrgency;
  guidance: string[];
  followUpQuestions: string[];
  patientContextUsed: MiraContextReference[];
  escalationRecommended: boolean;
  escalationReason: string;
  knowledgeModuleIds: string[];
  disclaimer: typeof MIRA_CLINICAL_DISCLAIMER;
  model: string;
}

export interface MiraPatientProfileContext {
  scdType: MiraContextValue<string>;
  bloodType: MiraContextValue<string>;
  age: MiraContextValue<number>;
}

export interface MiraDatedContextEntry {
  date: string;
  recordedAt?: string;
  freshness: MiraContextFreshness;
  storageState: MiraContextStorageState;
}

export interface MiraMedicationContext {
  name: string;
  dosage?: string;
  time?: string;
  frequency?: string;
  lastTakenDate?: string;
}

export interface MiraPainContext extends MiraDatedContextEntry {
  painLevel: number;
  triggers: string[];
}

export interface MiraSymptomContext extends MiraDatedContextEntry {
  symptoms: string[];
  triggers: string[];
  painLevel?: number;
  waterIntake?: number;
}

export interface MiraHydrationContext extends MiraDatedContextEntry {
  amount: number;
  goal?: number;
}

export interface MiraCheckInContext extends MiraDatedContextEntry {
  emotion?: string;
  score?: number;
}

export interface MiraMedicalBackgroundContext {
  primaryDiagnosis?: string;
  allergies?: string;
  immunizations?: string[];
  medicationHistory?: Array<{
    name: string;
    dosage?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }>;
  hydroxyurea?: {
    response?: string;
    latestHbf?: number;
    sideEffects?: string;
  };
  transfusions?: Array<{
    date?: string;
    volumeMl?: number;
    units?: number;
  }>;
  recentLabs?: Array<{
    date?: string;
    hemoglobin?: number;
    reticulocyte?: number;
    bilirubin?: number;
    ldh?: number;
    ferritin?: number;
    hbfPercentage?: number;
  }>;
}

export interface MiraAppointmentContext {
  requests: Array<{
    preferredDate?: string;
    preferredTime?: string;
    status?: string;
  }>;
}

export interface MiraPatientContextSnapshot {
  profile: MiraPatientProfileContext;
  medications?: {
    active: MiraContextValue<MiraMedicationContext[]>;
  };
  recentPain?: MiraContextValue<MiraPainContext[]>;
  recentSymptoms?: MiraContextValue<MiraSymptomContext[]>;
  hydrationToday?: MiraContextValue<MiraHydrationContext>;
  recentHydration?: MiraContextValue<MiraHydrationContext[]>;
  recentCheckIns?: MiraContextValue<MiraCheckInContext[]>;
  medicalBackground?: MiraContextValue<MiraMedicalBackgroundContext>;
  appointmentContext?: MiraContextValue<MiraAppointmentContext>;
  generatedAt: string;
  windowDays: 7 | 30;
}
