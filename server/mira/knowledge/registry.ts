import {
  type MiraClinicalTopic,
  type MiraKnowledgeModule,
  type MiraKnowledgeSourceReference,
  MIRA_SAFETY_CATEGORIES,
} from '../../../services/miraClinicalContracts';
import type { MiraLanguageCode } from '../../../services/miraConfig';
import { validateMiraKnowledgeModules } from './validators';

export const MIRA_KNOWLEDGE_REVIEW_STATUS = 'research-curated-pending-clinical-review' as const;
export const MIRA_KNOWLEDGE_REVIEWED_AT = '2026-10-08' as const;

const SOURCES = {
  whoScdFactSheet: {
    title: 'Sickle-cell disease fact sheet',
    organization: 'World Health Organization',
    publicationDate: '2025-08-06',
    jurisdiction: 'Global',
    url: 'https://www.who.int/news-room/fact-sheets/detail/sickle-cell-disease',
  },
  whoAfricaSicklePackage: {
    title: 'WHO Africa releases groundbreaking guidance to boost fight against sickle-cell disease',
    organization: 'World Health Organization Regional Office for Africa',
    publicationDate: '2024-06-19',
    jurisdiction: 'WHO African Region',
    url: 'https://www.afro.who.int/news/who-africa-releases-groundbreaking-guidance-boost-fight-against-sickle-cell-disease',
  },
  whoPregnancyGuideline: {
    title: 'WHO recommendations on the management of sickle-cell disease during pregnancy, childbirth and the interpregnancy period',
    organization: 'World Health Organization',
    publicationDate: '2025-06-19',
    jurisdiction: 'Global',
    url: 'https://www.who.int/publications/i/item/9789240109124',
  },
  nigeriaNationalGuideline: {
    title: 'National Guideline for the Control and Management of Sickle Cell Disease, 2nd edition',
    organization: 'Federal Ministry of Health, Nigeria',
    jurisdiction: 'Nigeria',
    url: 'https://health.gov.ng/wp-content/uploads/2025/06/SCD-Guideline-Final-2nd-Edition.pdf',
  },
  cdcPreventionTreatment: {
    title: 'Prevention and treatment of sickle cell disease',
    organization: 'Centers for Disease Control and Prevention',
    publicationDate: '2026-08-07',
    jurisdiction: 'United States',
    url: 'https://www.cdc.gov/sickle-cell/about/prevention-and-treatment.html',
  },
  cdcFever: {
    title: 'Fever',
    organization: 'Centers for Disease Control and Prevention',
    publicationDate: '2024-05-15',
    jurisdiction: 'United States',
    url: 'https://www.cdc.gov/sickle-cell/complications/fever.html',
  },
  cdcInfection: {
    title: 'Complications of sickle cell disease: Infection',
    organization: 'Centers for Disease Control and Prevention',
    publicationDate: '2026-08-07',
    jurisdiction: 'United States',
    url: 'https://www.cdc.gov/sickle-cell/complications/complications-of-scd-infection.html',
  },
  cdcAcuteChest: {
    title: 'Acute chest syndrome',
    organization: 'Centers for Disease Control and Prevention',
    publicationDate: '2026-08-07',
    jurisdiction: 'United States',
    url: 'https://www.cdc.gov/sickle-cell/complications/acute-chest-syndrome.html',
  },
  cdcSplenicSequestration: {
    title: 'Splenic sequestration',
    organization: 'Centers for Disease Control and Prevention',
    publicationDate: '2026-08-07',
    jurisdiction: 'United States',
    url: 'https://www.cdc.gov/sickle-cell/complications/splenic-sequestration.html',
  },
  nhlbiEvidenceBasedManagement: {
    title: 'Evidence-Based Management of Sickle Cell Disease',
    organization: 'National Heart, Lung, and Blood Institute',
    jurisdiction: 'United States',
    url: 'https://www.nhlbi.nih.gov/health-topics/evidence-based-management-sickle-cell-disease',
  },
  ashPainGuideline: {
    title: 'Sickle Cell Disease Guidelines: Management of Acute and Chronic Pain',
    organization: 'American Society of Hematology',
    jurisdiction: 'United States',
    url: 'https://www.hematology.org/education/clinicians/guidelines-and-quality-care/clinical-practice-guidelines/sickle-cell-disease-guidelines/scd-guidelines-management-of-acute-and-chronic-pain',
  },
  ashCerebrovascularGuideline: {
    title: 'Sickle Cell Disease Guidelines: Cerebrovascular Disease',
    organization: 'American Society of Hematology',
    jurisdiction: 'United States',
    url: 'https://www.hematology.org/education/clinicians/guidelines-and-quality-care/clinical-practice-guidelines/sickle-cell-disease-guidelines/scd-guidelines-cerebrovascular-disease',
  },
  ashHydroxyureaBooklet: {
    title: 'Hydroxyurea for Sickle Cell Disease',
    organization: 'American Society of Hematology',
    jurisdiction: 'United States',
    url: 'https://www.hematology.org/-/media/hematology/files/patients/hydroxyurea-booklet.pdf',
  },
  nhsSickleCellDisease: {
    title: 'Sickle cell disease',
    organization: 'National Health Service',
    jurisdiction: 'United Kingdom',
    url: 'https://www.nhs.uk/conditions/sickle-cell-disease/',
  },
  nhsPriapism: {
    title: 'Priapism (painful erections)',
    organization: 'National Health Service',
    jurisdiction: 'United Kingdom',
    url: 'https://www.nhs.uk/symptoms/priapism-painful-erections/',
  },
  guysHydroxycarbamide: {
    title: 'Taking hydroxycarbamide for sickle cell disease',
    organization: "Guy's and St Thomas' NHS Foundation Trust",
    jurisdiction: 'United Kingdom',
    url: 'https://www.guysandstthomas.nhs.uk/health-information/hydroxycarbamide-sickle-cell-disease/taking-hydroxycarbamide',
  },
  medlinePlusHydroxyurea: {
    title: 'Hydroxyurea',
    organization: 'MedlinePlus, U.S. National Library of Medicine',
    jurisdiction: 'United States',
    url: 'https://medlineplus.gov/druginfo/meds/a682004.html',
  },
} satisfies Record<string, MiraKnowledgeSourceReference>;

const MODULE_CANDIDATES: MiraKnowledgeModule[] = [
  {
    id: 'scd_basics',
    version: '1.0.0',
    title: 'Sickle-cell basics',
    topics: ['scd_basics'],
    languages: ['en'],
    risk: 'low',
    reviewedAt: MIRA_KNOWLEDGE_REVIEWED_AT,
    reviewedBy: MIRA_KNOWLEDGE_REVIEW_STATUS,
    sourceRefs: [
      SOURCES.whoScdFactSheet,
      SOURCES.whoAfricaSicklePackage,
      SOURCES.nigeriaNationalGuideline,
      SOURCES.cdcPreventionTreatment,
    ],
    educationalPoints: [
      'Sickle-cell disease is an inherited disorder involving abnormal haemoglobin.',
      'Red blood cells can become rigid or sickle-shaped, break down early, and obstruct blood flow, contributing to anaemia, pain, and organ complications.',
      'The burden of sickle-cell disease is especially high in sub-Saharan Africa, where access to screening and comprehensive care remains uneven.',
    ],
    allowedSelfCareGuidance: [
      'Keep regular care appointments and follow the patient-specific clinical plan.',
      'Maintain adequate hydration, avoid known extremes or triggers, and receive clinician-recommended vaccinations.',
    ],
    prohibitedClaims: [
      'Do not diagnose sickle-cell disease or genotype.',
      'Do not promise a cure, predict an individual disease course, or claim every complication is preventable.',
    ],
    escalationCategories: [],
  },
  {
    id: 'vaso_occlusive_pain',
    version: '1.0.0',
    title: 'Vaso-occlusive pain',
    topics: ['pain'],
    languages: ['en'],
    risk: 'high',
    reviewedAt: MIRA_KNOWLEDGE_REVIEWED_AT,
    reviewedBy: MIRA_KNOWLEDGE_REVIEW_STATUS,
    sourceRefs: [
      SOURCES.nigeriaNationalGuideline,
      SOURCES.nhlbiEvidenceBasedManagement,
      SOURCES.ashPainGuideline,
      SOURCES.nhsSickleCellDisease,
    ],
    educationalPoints: [
      'Vaso-occlusive pain is associated with impaired blood flow and may vary greatly between people and episodes.',
      'Medicine choice, dose, opioid use, and changes to a home pain plan are individualized clinical decisions.',
      'Cognitive or behavioural strategies may be adjuncts to care, but the evidence for some approaches is low certainty and they do not replace medical treatment.',
    ],
    allowedSelfCareGuidance: [
      'Follow the clinician-approved home pain plan.',
      'Rest, warmth, and oral fluids may be supportive when the patient has not been told to restrict fluids.',
      'Contact the care team when the approved home plan is not working.',
    ],
    prohibitedClaims: [
      'Do not label all pain as a vaso-occlusive crisis.',
      'Do not recommend a new medicine or dose.',
      'Do not tell a patient to endure severe pain at home or imply pain intensity rules out a dangerous complication.',
    ],
    escalationCategories: ['severe_or_worsening_pain'],
  },
  {
    id: 'fever_infection',
    version: '1.0.0',
    title: 'Fever and infection concern',
    topics: ['fever_infection'],
    languages: ['en'],
    risk: 'critical',
    reviewedAt: MIRA_KNOWLEDGE_REVIEWED_AT,
    reviewedBy: MIRA_KNOWLEDGE_REVIEW_STATUS,
    sourceRefs: [
      SOURCES.nigeriaNationalGuideline,
      SOURCES.cdcFever,
      SOURCES.cdcInfection,
      SOURCES.nhsSickleCellDisease,
    ],
    educationalPoints: [
      'Infection can become serious rapidly in sickle-cell disease, and fever or infection concern warrants urgent human assessment.',
      'Published fever thresholds differ between the reviewed Nigerian and United States guidance and remain unresolved pending clinical approval.',
      'Tests, antibiotics, malaria assessment, and preventive medicines are clinician decisions.',
    ],
    allowedSelfCareGuidance: [
      'Measure temperature if possible, seek urgent care, and follow the existing sick-day plan.',
      'Do not let home treatment delay urgent assessment.',
    ],
    prohibitedClaims: [
      'Do not diagnose malaria or sepsis.',
      'Do not recommend antibiotics or antimalarials.',
      'Do not declare a fever safe below one universal temperature threshold.',
      'Do not claim vaccination eliminates infection risk.',
    ],
    escalationCategories: ['fever_or_infection'],
  },
  {
    id: 'hydration',
    version: '1.0.0',
    title: 'Hydration',
    topics: ['hydration'],
    languages: ['en'],
    risk: 'medium',
    reviewedAt: MIRA_KNOWLEDGE_REVIEWED_AT,
    reviewedBy: MIRA_KNOWLEDGE_REVIEW_STATUS,
    sourceRefs: [
      SOURCES.whoScdFactSheet,
      SOURCES.nigeriaNationalGuideline,
      SOURCES.cdcPreventionTreatment,
      SOURCES.nhsSickleCellDisease,
    ],
    educationalPoints: [
      'Dehydration is a recognized sickle-cell trigger, and adequate fluid intake is commonly advised.',
      'A fixed fluid volume is not appropriate for every patient because health conditions and acute illness may change the advice.',
    ],
    allowedSelfCareGuidance: [
      'Drink regularly according to the personal care plan and take extra care during heat, exercise, or illness.',
      'Seek clinical advice when fluid intake is restricted.',
    ],
    prohibitedClaims: [
      'Do not prescribe a universal number of litres, glasses, cups, or millilitres per day.',
      'Do not claim water treats a crisis.',
      'Do not urge oral fluids when the patient cannot swallow, is repeatedly vomiting, has breathing difficulty, or has a fluid restriction.',
    ],
    escalationCategories: [
      'unable_to_drink_or_retain_fluids',
      'confusion_or_severe_weakness',
    ],
  },
  {
    id: 'acute_chest_breathing',
    version: '1.0.0',
    title: 'Acute chest and breathing warning signs',
    topics: ['acute_chest', 'breathing'],
    languages: ['en'],
    risk: 'critical',
    reviewedAt: MIRA_KNOWLEDGE_REVIEWED_AT,
    reviewedBy: MIRA_KNOWLEDGE_REVIEW_STATUS,
    sourceRefs: [
      SOURCES.nigeriaNationalGuideline,
      SOURCES.cdcAcuteChest,
      SOURCES.nhsSickleCellDisease,
    ],
    educationalPoints: [
      'Acute chest syndrome is a serious sickle-cell complication, and warning features include chest pain, cough, fever, wheeze, or breathing difficulty.',
      'Breathing difficulty can accompany acute chest syndrome or another serious condition and needs urgent medical assessment.',
      'Confirmation and treatment require hospital assessment and clinical direction.',
    ],
    allowedSelfCareGuidance: [
      'Stop exertion, seek emergency assessment immediately, and use the patient-specific emergency plan while arranging care.',
    ],
    prohibitedClaims: [
      'Do not diagnose or exclude acute chest syndrome or another cause of breathing difficulty.',
      'Do not advise waiting for an appointment.',
      'Do not recommend oxygen or medicine, or suggest hydration or inhalers make emergency assessment unnecessary.',
      'Do not downgrade breathing difficulty because chest pain is absent.',
    ],
    escalationCategories: [
      'chest_pain',
      'breathing_difficulty',
      'fever_or_infection',
    ],
  },
  {
    id: 'neurological_warning',
    version: '1.0.0',
    title: 'Neurological and stroke warning signs',
    topics: ['neurological'],
    languages: ['en'],
    risk: 'critical',
    reviewedAt: MIRA_KNOWLEDGE_REVIEWED_AT,
    reviewedBy: MIRA_KNOWLEDGE_REVIEW_STATUS,
    sourceRefs: [
      SOURCES.nigeriaNationalGuideline,
      SOURCES.ashCerebrovascularGuideline,
      SOURCES.nhsSickleCellDisease,
    ],
    educationalPoints: [
      'Sudden weakness or numbness, facial asymmetry, speech or vision change, severe unusual headache, seizure, confusion, loss of balance, or loss of consciousness require emergency assessment.',
      'Stroke screening, imaging, and transfusion decisions belong to specialist teams.',
    ],
    allowedSelfCareGuidance: [
      'Seek emergency care immediately and record the symptom onset time if known.',
      'Keep the person safe while help is arranged, and do not give food or drink to someone with impaired consciousness or swallowing.',
    ],
    prohibitedClaims: [
      'Do not perform a chat-based stroke exclusion or advise waiting for symptoms to resolve.',
      'Do not recommend aspirin, transfusion, or another treatment.',
    ],
    escalationCategories: [
      'neurological_warning',
      'seizure_or_unconsciousness',
      'confusion_or_severe_weakness',
    ],
  },
  {
    id: 'hydroxyurea_education',
    version: '1.0.0',
    title: 'Hydroxyurea education',
    topics: ['medication', 'hydroxyurea'],
    languages: ['en'],
    risk: 'high',
    reviewedAt: MIRA_KNOWLEDGE_REVIEWED_AT,
    reviewedBy: MIRA_KNOWLEDGE_REVIEW_STATUS,
    sourceRefs: [
      SOURCES.whoScdFactSheet,
      SOURCES.nigeriaNationalGuideline,
      SOURCES.cdcPreventionTreatment,
      SOURCES.ashHydroxyureaBooklet,
      SOURCES.guysHydroxycarbamide,
      SOURCES.medlinePlusHydroxyurea,
    ],
    educationalPoints: [
      'Hydroxyurea can increase fetal haemoglobin and reduce pain crises and some complications for suitable patients.',
      'Eligibility, dose, laboratory monitoring, side effects, fertility, and pregnancy decisions are individualized clinical matters.',
      'Reviewed missed-dose instructions differ, but the sources agree that a missed dose must not be doubled.',
    ],
    allowedSelfCareGuidance: [
      'Take hydroxyurea exactly as prescribed and attend required monitoring.',
      'Do not double a missed dose; ask the clinician or pharmacist for regimen-specific missed-dose instructions.',
    ],
    prohibitedClaims: [
      'Do not start, stop, select, or change a hydroxyurea dose.',
      'Do not promise hydroxyurea prevents every crisis.',
      'Do not interpret blood results or give autonomous pregnancy, fertility, or contraception instructions.',
    ],
    escalationCategories: [],
  },
  {
    id: 'emergency_warning_signs',
    version: '1.0.0',
    title: 'Emergency warning signs',
    topics: [
      'pain',
      'fever_infection',
      'hydration',
      'fatigue_anemia',
      'acute_chest',
      'breathing',
      'neurological',
      'pregnancy',
      'mental_wellbeing',
    ],
    languages: ['en'],
    risk: 'critical',
    reviewedAt: MIRA_KNOWLEDGE_REVIEWED_AT,
    reviewedBy: MIRA_KNOWLEDGE_REVIEW_STATUS,
    sourceRefs: [
      SOURCES.whoPregnancyGuideline,
      SOURCES.nigeriaNationalGuideline,
      SOURCES.cdcFever,
      SOURCES.cdcAcuteChest,
      SOURCES.cdcSplenicSequestration,
      SOURCES.ashCerebrovascularGuideline,
      SOURCES.nhsSickleCellDisease,
      SOURCES.nhsPriapism,
    ],
    educationalPoints: [
      'Urgent warning signs include breathing difficulty, chest pain, fever or infection concern, sudden neurological change, seizure or loss of consciousness, severe or worsening pain, inability to retain fluids, painful or prolonged erection, sudden pallor, severe weakness, or splenic or abdominal swelling.',
      'Pregnancy adds a lower threshold for specialist assessment.',
      'This warning-sign list is not exhaustive and does not diagnose the underlying cause.',
    ],
    allowedSelfCareGuidance: [
      'Use the documented emergency plan and seek human assessment without delay.',
      'Mira may help summarize symptoms but cannot contact a clinician or emergency service on the patient’s behalf.',
    ],
    prohibitedClaims: [
      'Do not call the warning-sign list complete or rank an emergency symptom as safe.',
      'Do not provide autonomous triage clearance or claim that help has been contacted.',
    ],
    escalationCategories: [...MIRA_SAFETY_CATEGORIES],
  },
];

export function createMiraKnowledgeRegistry(value: unknown): readonly MiraKnowledgeModule[] {
  return Object.freeze(validateMiraKnowledgeModules(value));
}

export const MIRA_KNOWLEDGE_MODULES = createMiraKnowledgeRegistry(MODULE_CANDIDATES);

const MODULES_BY_ID = new Map(MIRA_KNOWLEDGE_MODULES.map((module) => [module.id, module]));

export function getMiraKnowledgeModuleById(id: string): MiraKnowledgeModule | undefined {
  return MODULES_BY_ID.get(id);
}

export function getMiraKnowledgeModulesByTopic(
  topic: MiraClinicalTopic,
): readonly MiraKnowledgeModule[] {
  return MIRA_KNOWLEDGE_MODULES.filter((module) => module.topics.includes(topic));
}

export function getMiraKnowledgeModulesByLanguage(
  language: MiraLanguageCode,
): readonly MiraKnowledgeModule[] {
  return MIRA_KNOWLEDGE_MODULES.filter((module) => module.languages.includes(language));
}
