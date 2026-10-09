// Deterministic safety layer for Mira.
//
// Mira's AI reply is never the only safety decision. This module provides a
// rule-based red-flag scan that can only escalate (never downgrade), a guard
// that removes first-person clinician claims from generated text, and a
// handoff draft builder that only restates what the patient explicitly wrote.

import type { MiraLanguageCode } from '../../services/miraConfig';
import type {
  MiraClinicalUrgency,
  MiraSafetyCategory,
  MiraSafetyResult,
} from '../../services/miraClinicalContracts';
import {
  MIRA_SAFETY_CATEGORY_DEFINITIONS,
  type MiraSafetyCategoryDefinition,
} from './miraSafetyCategories';

export const MIRA_AI_IDENTITY_LINE =
  'Mira is an AI assistant, not a doctor, and no clinician has verified this message.';

export const MIRA_EMERGENCY_GUIDANCE =
  'Your messages mention signs that can need emergency care. Mira cannot assess this and has not contacted anyone on your behalf. ' +
  'Please contact emergency services or go to the nearest emergency department now, or use the Emergency action in this app to reach the contacts you recorded. ' +
  'Do not wait for an appointment request.';

export const MIRA_URGENT_HEADLINE = 'This may need emergency care now';
export const MIRA_SPECIALIST_HEADLINE = 'Human hematology review is appropriate';

export const MIRA_URGENT_REPLY = 'Please use the urgent safety guidance shown below.';

const CURRENT_MARKER = /\b(?:now|right now|today|currently|still|continues?|continuing|ongoing|at the moment|dey now|still dey|har yanzu)\b|ṣì|ka dị/iu;
const CONTINUATION_MARKER = /\b(?:still|continues?|continuing|ongoing|has not stopped|not getting better|still dey|har yanzu)\b|ṣì|ka dị/iu;
const PREVENTIVE_OR_EDUCATIONAL = [
  /\bwhat (?:should|do|can) i do if\b/i,
  /\bwhat if i (?:ever )?(?:get|have|develop)\b/i,
  /\bif i (?:ever )?(?:get|have|develop)\b/i,
  /\bhow (?:do|can) i (?:prevent|avoid|recognize|recognise)\b/i,
  /\bwatch (?:out )?for\b/i,
  /\bsigns (?:of|to watch)\b/i,
];
const HISTORICAL_MARKER = /\b(?:last year|last month|years? ago|when i was (?:younger|a child)|in (?:19|20)\d{2})\b/i;
const NEGATION_BEFORE_CUE = /(?:\bno\b|\bnot\b|\bnever\b|\bwithout\b|\bdo not\b|\bdon't\b|\bdoes not\b|\bdoesn't\b|\bhave not\b|\bhaven't\b|\bno get\b)[^.!?]{0,36}$/i;
const UNSAFE_MEDICATION_REQUEST = /\b(?:what|which) (?:drug|medicine|medication) should i take(?: right now)?\b|\b(?:should|can) i (?:double|increase|reduce|change|stop) (?:my |the )?(?:dose|dosage|medicine|medication)\b|\bdouble my dose\b/i;
const LEGACY_CRISIS_DESCRIPTION = /\bin (?:a |the )?crisis\b|\bhaving a crisis\b|agbákò|agbako|fitila|oké mgbu|oke mgbu|matsanancin ciwo|nsogbu ike/iu;

function normalizeSafetyText(text: string): string {
  return text.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
}

function cueMatch(
  definition: MiraSafetyCategoryDefinition,
  text: string,
  language?: MiraLanguageCode,
): RegExpExecArray | null {
  const languages = language
    ? Array.from(new Set<MiraLanguageCode>(['en', language]))
    : (Object.keys(definition.cues) as MiraLanguageCode[]);
  for (const code of languages) {
    for (const pattern of definition.cues[code] ?? []) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) return match;
    }
  }
  return null;
}

function isNonCurrentUse(text: string, cueIndex: number): boolean {
  const hasCurrentMarker = CURRENT_MARKER.test(text);
  if (!hasCurrentMarker && PREVENTIVE_OR_EDUCATIONAL.some(pattern => pattern.test(text))) return true;
  if (!hasCurrentMarker && HISTORICAL_MARKER.test(text)) return true;
  const beforeCue = text.slice(Math.max(0, cueIndex - 64), cueIndex);
  return NEGATION_BEFORE_CUE.test(beforeCue);
}

function detectCurrentCategories(
  text: string,
  language?: MiraLanguageCode,
): MiraSafetyCategoryDefinition[] {
  const normalized = normalizeSafetyText(text);
  return MIRA_SAFETY_CATEGORY_DEFINITIONS.filter((definition) => {
    const match = cueMatch(definition, normalized, language);
    return Boolean(match && !isNonCurrentUse(normalized, match.index));
  });
}

export interface AssessMiraSafetyInput {
  currentText: string;
  recentPatientTurns?: string[];
  language?: MiraLanguageCode;
}

/**
 * Evaluates the current turn first. History can mark a current cue as a
 * continuation, but an older red flag can never make an unrelated new turn
 * urgent by itself.
 */
export function assessMiraSafety(input: AssessMiraSafetyInput): MiraSafetyResult {
  const currentText = normalizeSafetyText(input.currentText);
  const currentDefinitions = detectCurrentCategories(currentText, input.language);
  const categories = currentDefinitions.map(definition => definition.category);
  const currentCategorySet = new Set(categories);
  const priorCategories = new Set<MiraSafetyCategory>();
  for (const turn of input.recentPatientTurns ?? []) {
    detectCurrentCategories(turn, input.language).forEach(definition => priorCategories.add(definition.category));
  }
  const continuationOfRecentConcern = CONTINUATION_MARKER.test(currentText)
    && Array.from(currentCategorySet).some(category => priorCategories.has(category));
  const medicationBoundary = !isNonCurrentUse(currentText, 0) && UNSAFE_MEDICATION_REQUEST.test(currentText);
  const urgent = currentDefinitions.some(definition => definition.urgency === 'urgent');
  const specialist = currentDefinitions.some(definition => definition.urgency === 'specialist') || medicationBoundary;
  const urgency: MiraClinicalUrgency = urgent ? 'urgent' : specialist ? 'specialist' : 'none';
  const reasons = currentDefinitions.map(definition => definition.reason);
  if (medicationBoundary) reasons.push('medication selection or dose changes require human clinical review');

  return {
    urgency,
    categories,
    deterministic: medicationBoundary || currentDefinitions.some(definition => definition.level === 'DETERMINISTIC'),
    matchedCurrentTurn: categories.length > 0 || medicationBoundary,
    continuationOfRecentConcern,
    reasons,
  };
}

const CLINICIAN_CLAIM_PATTERNS: RegExp[] = [
  /\bi('| a)?m (a|an|your) (doctor|physician|haematologist|hematologist|nurse|consultant|clinician|specialist)\b/i,
  /\bas (your|a) (doctor|physician|haematologist|hematologist|nurse|clinician|specialist)\b/i,
  /\bi (have )?(reviewed|verified|examined|assessed) your (results|records|notes|chart|scans)\b/i,
  /\b(medically|clinically) (verified|approved|confirmed) by (a|your) (doctor|clinician|haematologist|hematologist)\b/i,
  /\bi have (scheduled|booked|confirmed) (your|an) appointment\b/i,
  /\byour (blood )?results (are|show)\b/i,
];

export function scanMiraRedFlags(text: string, language?: MiraLanguageCode): string[] {
  const definitions = detectCurrentCategories(text, language).filter(definition => definition.urgency === 'urgent');
  return definitions.map((definition) => (
    definition.category === 'severe_or_worsening_pain' && LEGACY_CRISIS_DESCRIPTION.test(text)
      ? 'crisis described in a Nigerian language'
      : definition.legacyLabel
  ));
}

/**
 * Removes sentences that claim a human clinical identity or clinical
 * verification, and states the AI boundary instead. Applied to every generated
 * reply before it is returned to the client.
 */
export function applyMiraIdentityGuard(reply: string): string {
  const sentences = reply.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.trim().length > 0);
  if (sentences.length === 0) return MIRA_AI_IDENTITY_LINE;
  const kept = sentences.filter((sentence) => !CLINICIAN_CLAIM_PATTERNS.some((pattern) => pattern.test(sentence)));
  if (kept.length === sentences.length) return sentences.join(' ').trim();
  if (kept.length === 0) return MIRA_AI_IDENTITY_LINE;
  return `${kept.join(' ').trim()}\n\n${MIRA_AI_IDENTITY_LINE}`;
}

export type MiraEscalationUrgency = 'none' | 'specialist' | 'urgent';

export interface MiraEscalation {
  needed: boolean;
  urgency: MiraEscalationUrgency;
  reason: string;
  matchedRedFlags: string[];
}

/**
 * Bounded escalation classification. The rule-based scan can only escalate, so
 * a missed model signal can never hide a red flag, and the model cannot
 * downgrade a rule-based urgent escalation.
 */
export function classifyMiraEscalation(input: {
  userText: string;
  recentPatientTurns?: string[];
  language?: MiraLanguageCode;
  modelUrgency?: unknown;
  modelReason?: unknown;
}): MiraEscalation {
  const safety = assessMiraSafety({
    currentText: input.userText,
    recentPatientTurns: input.recentPatientTurns,
    language: input.language,
  });
  const modelUrgency =
    input.modelUrgency === 'urgent' || input.modelUrgency === 'specialist' ? input.modelUrgency : 'none';
  const modelReason = typeof input.modelReason === 'string' ? input.modelReason.trim() : '';

  if (safety.urgency === 'urgent') {
    return {
      needed: true,
      urgency: 'urgent',
      reason: `Your message mentions ${safety.reasons.join(', ')}. Mira cannot assess this, and a human should review it now.`,
      matchedRedFlags: safety.reasons,
    };
  }
  if (modelUrgency === 'urgent') {
    return {
      needed: true,
      urgency: 'urgent',
      reason: modelReason || 'Mira flagged this conversation as needing urgent human review.',
      matchedRedFlags: [],
    };
  }
  if (safety.urgency === 'specialist') {
    return {
      needed: true,
      urgency: 'specialist',
      reason: `Your message mentions ${safety.reasons.join(', ')}. A human clinician should review this before medication or care decisions are made.`,
      matchedRedFlags: safety.reasons,
    };
  }
  if (modelUrgency === 'specialist') {
    return {
      needed: true,
      urgency: 'specialist',
      reason: modelReason || 'Mira flagged this conversation as needing hematology review.',
      matchedRedFlags: [],
    };
  }
  return { needed: false, urgency: 'none', reason: '', matchedRedFlags: [] };
}

export const MIRA_HANDOFF_LABEL =
  'AI-generated draft from your Mira conversation — not clinician-authored. Review and edit before sharing.';

export interface MiraHandoffDraft {
  concern: string;
  duration: string;
  symptoms: string[];
  medications: string[];
  hydration: string;
  reason: string;
  summaryText: string;
}

const SYMPTOM_TERMS = [
  'bone pain', 'joint pain', 'back pain', 'chest pain', 'abdominal pain', 'stomach pain', 'leg pain', 'arm pain',
  'pain', 'headache', 'fever', 'fatigue', 'tiredness', 'breathlessness', 'shortness of breath', 'cough',
  'vomiting', 'nausea', 'diarrhoea', 'diarrhea', 'jaundice', 'yellow eyes', 'swelling', 'dizziness', 'rash',
  'infection', 'priapism', 'weakness',
];

const MEDICATION_TERMS = [
  'hydroxyurea', 'hydroxycarbamide', 'folic acid', 'folate', 'penicillin', 'paracetamol', 'acetaminophen',
  'ibuprofen', 'diclofenac', 'morphine', 'tramadol', 'codeine', 'omeprazole', 'deferasirox', 'deferiprone',
  'crizanlizumab', 'voxelotor', 'l-glutamine', 'vitamin d', 'calcium', 'iron tablets',
];

const DURATION_PATTERN = new RegExp(
  [
    '\\b(?:for|since|over|about)\\s+(?:\\d+\\s*(?:hours?|days?|weeks?|months?)|this (?:morning|week|month)|yesterday|today|last night|a (?:day|week|month))\\b',
    '\\b\\d+\\s*(?:hours?|days?|weeks?|months?)\\b',
    '\\b(?:today|yesterday|this morning|last night|this week|last week)\\b',
  ].join('|'),
  'i',
);

const HYDRATION_PATTERN = /\b(water|hydration|hydrated|fluids?|drinking|litres?|liters?|millilitres?|ml)\b/i;

function matchTerms(text: string, terms: string[]): string[] {
  const normalized = ` ${text.toLowerCase().replace(/\s+/g, ' ')} `;
  const matched: string[] = [];
  terms.forEach((term) => {
    if (new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(normalized) && !matched.includes(term)) {
      matched.push(term);
    }
  });
  return matched;
}

function firstSentence(value: string, maxLength = 160): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return 'Not stated in the conversation.';
  const sentence = trimmed.split(/(?<=[.!?])\s/)[0] ?? trimmed;
  const clipped = sentence.length > maxLength ? `${sentence.slice(0, maxLength).trim()}…` : sentence;
  return clipped;
}

/**
 * Builds a concise handoff draft using only what the patient explicitly wrote.
 * Nothing is inferred, no clinical value is invented, and missing detail is
 * reported as missing.
 */
export function buildMiraHandoffDraft(input: { patientMessages: string[]; escalation: MiraEscalation }): MiraHandoffDraft {
  const patientText = input.patientMessages.join('\n');
  const concern = firstSentence(input.patientMessages[0] ?? '');
  const durationMatch = patientText.match(DURATION_PATTERN);
  const duration = durationMatch?.[0]?.trim() ?? 'Not stated in the conversation.';
  const symptoms = matchTerms(patientText, SYMPTOM_TERMS);
  const medications = matchTerms(patientText, MEDICATION_TERMS);
  const hydration = HYDRATION_PATTERN.test(patientText)
    ? 'Mentioned by the patient in this conversation.'
    : 'Not mentioned in the conversation.';

  const summaryText = [
    'MIRA HANDOFF DRAFT',
    '',
    `Reported concern: ${concern}`,
    `How long: ${duration}`,
    `Symptoms stated by the patient: ${symptoms.length > 0 ? symptoms.join(', ') : 'None stated in the conversation.'}`,
    `Medications mentioned by the patient: ${medications.length > 0 ? medications.join(', ') : 'None stated in the conversation.'}`,
    `Hydration: ${hydration}`,
    `AI-generated reason for suggesting human review: ${input.escalation.reason || 'No AI rationale available.'}`,
    '',
    MIRA_HANDOFF_LABEL,
  ].join('\n');

  return { concern, duration, symptoms, medications, hydration, reason: input.escalation.reason, summaryText };
}
