// Deterministic safety layer for Mira.
//
// Mira's AI reply is never the only safety decision. This module provides a
// rule-based red-flag scan that can only escalate (never downgrade), a guard
// that removes first-person clinician claims from generated text, and a
// handoff draft builder that only restates what the patient explicitly wrote.

export const MIRA_AI_IDENTITY_LINE =
  'Mira is an AI assistant, not a doctor, and no clinician has verified this message.';

export const MIRA_EMERGENCY_GUIDANCE =
  'Your messages mention signs that can need emergency care. Mira cannot assess this and has not contacted anyone on your behalf. ' +
  'Please contact emergency services or go to the nearest emergency department now, or use the Emergency action in this app to reach the contacts you recorded. ' +
  'Do not wait for an appointment request.';

export const MIRA_URGENT_HEADLINE = 'This may need emergency care now';
export const MIRA_SPECIALIST_HEADLINE = 'Human hematology review is appropriate';

interface MiraRedFlagPattern {
  label: string;
  pattern: RegExp;
}

// Multilingual cues are carried over from the approved offline knowledge base
// keyword set so that escalation behaviour stays consistent across surfaces.
const MIRA_RED_FLAG_PATTERNS: MiraRedFlagPattern[] = [
  {
    label: 'chest pain or difficulty breathing',
    pattern: /\bchest pain\b|\bcan(no|')?t breathe\b|\bdifficulty breathing\b|\bshort(ness)? of breath\b|\bbreathless\b/i,
  },
  {
    label: 'fever or signs of infection',
    pattern: /\bfever\b|\bhigh temperature\b|\b38\.5\b|\b39(\.\d)?\s*(°|degrees)?\b/i,
  },
  {
    label: 'severe or worsening pain',
    pattern: /\bsevere pain\b|\bworst pain\b|\bunbearable\b|\bexcruciating\b|\b10\s*\/\s*10\b|\bpain (is )?(getting|got) worse\b/i,
  },
  {
    label: 'possible stroke signs',
    pattern: /\bstroke\b|\bface droop\b|\bslurred speech\b|\bweak(ness)? on one side\b|\bcan(no|')?t move my (arm|leg|hand)\b/i,
  },
  {
    label: 'priapism',
    pattern: /\bpriapism\b|\bpainful erection\b|\berection.{0,20}(hours?|over two hours)\b/i,
  },
  {
    label: 'possible splenic or blood-volume problem',
    pattern: /\bsplenic\b|\bspleen\b|\bsudden pallor\b|\bvery pale\b|\bpaleness\b/i,
  },
  {
    label: 'seizure or loss of consciousness',
    pattern: /\bseizure\b|\bconvulsion\b|\bfainted\b|\bfainting\b|\bpassed out\b|\bunconscious\b/i,
  },
  {
    label: 'unable to keep fluids down',
    pattern: /\bcan(no|')?t (keep|stop) (any )?(water|fluids?)\b|\bvomiting (everything|non[- ]?stop)\b|\bunable to drink\b/i,
  },
  {
    label: 'crisis described in a Nigerian language',
    pattern: /\bin (a |the )?crisis\b|\bhaving a crisis\b|oké mgbu|oke mgbu|agbako|fitila|matsanancin ciwo|nsogbu ike/i,
  },
];

const CLINICIAN_CLAIM_PATTERNS: RegExp[] = [
  /\bi('| a)?m (a|an|your) (doctor|physician|haematologist|hematologist|nurse|consultant|clinician|specialist)\b/i,
  /\bas (your|a) (doctor|physician|haematologist|hematologist|nurse|clinician|specialist)\b/i,
  /\bi (have )?(reviewed|verified|examined|assessed) your (results|records|notes|chart|scans)\b/i,
  /\b(medically|clinically) (verified|approved|confirmed) by (a|your) (doctor|clinician|haematologist|hematologist)\b/i,
  /\bi have (scheduled|booked|confirmed) (your|an) appointment\b/i,
  /\byour (blood )?results (are|show)\b/i,
];

export function scanMiraRedFlags(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ');
  return MIRA_RED_FLAG_PATTERNS.filter((entry) => entry.pattern.test(normalized)).map((entry) => entry.label);
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
  modelUrgency?: unknown;
  modelReason?: unknown;
}): MiraEscalation {
  const matched = scanMiraRedFlags(input.userText);
  const modelUrgency =
    input.modelUrgency === 'urgent' || input.modelUrgency === 'specialist' ? input.modelUrgency : 'none';
  const modelReason = typeof input.modelReason === 'string' ? input.modelReason.trim() : '';

  if (matched.length > 0) {
    return {
      needed: true,
      urgency: 'urgent',
      reason: `Your message mentions ${matched.join(', ')}. Mira cannot assess this, and a human should review it now.`,
      matchedRedFlags: matched,
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
