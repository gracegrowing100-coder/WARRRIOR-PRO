import { describe, expect, it } from 'vitest';
import {
  MIRA_AI_IDENTITY_LINE,
  MIRA_HANDOFF_LABEL,
  applyMiraIdentityGuard,
  assessMiraSafety,
  buildMiraHandoffDraft,
  classifyMiraEscalation,
  scanMiraRedFlags,
} from '../../server/mira/miraSafety';
import {
  MIRA_SAFETY_CATEGORY_DEFINITIONS,
  MIRA_SAFETY_LANGUAGE_REVIEW_STATUS,
} from '../../server/mira/miraSafetyCategories';
import type { MiraLanguageCode } from '../../services/miraConfig';
import type { MiraSafetyCategory } from '../../services/miraClinicalContracts';

describe('Mira escalation classification', () => {
  it('does not escalate ordinary educational conversation', () => {
    const escalation = classifyMiraEscalation({ userText: 'How much water should I drink each day?', modelUrgency: 'none' });
    expect(escalation.needed).toBe(false);
    expect(escalation.urgency).toBe('none');
    expect(escalation.reason).toBe('');
  });

  it('escalates to specialist when human hematology review is appropriate', () => {
    const escalation = classifyMiraEscalation({
      userText: 'My pain keeps coming back every week.',
      modelUrgency: 'specialist',
      modelReason: 'Recurring pain should be reviewed by a hematologist.',
    });
    expect(escalation.needed).toBe(true);
    expect(escalation.urgency).toBe('specialist');
    expect(escalation.reason).toMatch(/hematolog/i);
  });

  it('cannot downgrade a red flag even when the model returns no escalation', () => {
    const escalation = classifyMiraEscalation({
      userText: 'I have chest pain and I cannot breathe well.',
      modelUrgency: 'none',
      modelReason: '',
    });
    expect(escalation.urgency).toBe('urgent');
    expect(escalation.matchedRedFlags.length).toBeGreaterThan(0);
  });

  it('recognises local-language crisis phrasing as urgent', () => {
    expect(classifyMiraEscalation({ userText: 'oké mgbu na-eme m ugbu a' }).urgency).toBe('urgent');
    expect(classifyMiraEscalation({ userText: 'ina matsanancin ciwo yanzu' }).urgency).toBe('urgent');
  });

  it('only scans for escalation and ignores preventive questions', () => {
    expect(scanMiraRedFlags('How do I prevent a crisis?')).toEqual([]);
    expect(scanMiraRedFlags('I am in a crisis right now')).toContain('crisis described in a Nigerian language');
  });

  it('classifies severe pain plus fever as deterministic urgent', () => {
    const safety = assessMiraSafety({ currentText: 'I have severe pain and fever.', language: 'en' });
    expect(safety).toMatchObject({ urgency: 'urgent', deterministic: true, matchedCurrentTurn: true });
    expect(safety.categories).toEqual(expect.arrayContaining(['severe_or_worsening_pain', 'fever_or_infection']));
  });

  it.each<[string, MiraSafetyCategory]>([
    ['I have chest pain now.', 'chest_pain'],
    ['I have shortness of breath.', 'breathing_difficulty'],
    ["I can't breathe.", 'breathing_difficulty'],
    ['I have new one-sided weakness.', 'neurological_warning'],
    ['I have new speech difficulty.', 'neurological_warning'],
    ['I had a seizure just now.', 'seizure_or_unconsciousness'],
    ['I became unconscious.', 'seizure_or_unconsciousness'],
    ["I can't keep fluids down.", 'unable_to_drink_or_retain_fluids'],
    ['I have a painful erection.', 'priapism'],
    ['I have a fever.', 'fever_or_infection'],
    ['My pain is getting worse.', 'severe_or_worsening_pain'],
    ['I want to kill myself.', 'mental_health_crisis'],
  ])('treats clear current danger as urgent: %s', (currentText, category) => {
    const safety = assessMiraSafety({ currentText, language: 'en' });
    expect(safety.urgency).toBe('urgent');
    expect(safety.categories).toContain(category);
  });

  it.each<[string, MiraSafetyCategory]>([
    ['I am suddenly very weak.', 'confusion_or_severe_weakness'],
    ['I have sudden pallor.', 'sudden_pallor_or_splenic_concern'],
    ['I am pregnant and have heavy bleeding.', 'pregnancy_emergency'],
  ])('uses the specialist clarification path for hybrid categories: %s', (currentText, category) => {
    const safety = assessMiraSafety({ currentText, language: 'en' });
    expect(safety).toMatchObject({ urgency: 'specialist', deterministic: false });
    expect(safety.categories).toContain(category);
  });

  it('defines all required categories independently with an explicit detection level', () => {
    expect(MIRA_SAFETY_CATEGORY_DEFINITIONS.map(definition => definition.category)).toEqual([
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
    ]);
    expect(MIRA_SAFETY_CATEGORY_DEFINITIONS.every(definition => (
      definition.level === 'DETERMINISTIC' || definition.level === 'HYBRID' || definition.level === 'LLM_ASSISTED'
    ))).toBe(true);
  });

  it('suppresses obvious negated, preventive, and historical mentions', () => {
    expect(assessMiraSafety({ currentText: 'I do not have chest pain.', language: 'en' }).categories)
      .not.toContain('chest_pain');
    expect(assessMiraSafety({ currentText: 'What if I get chest pain?', language: 'en' }).categories)
      .not.toContain('chest_pain');
    expect(assessMiraSafety({ currentText: 'My doctor told me to watch for fever.', language: 'en' }).categories)
      .not.toContain('fever_or_infection');
    expect(assessMiraSafety({ currentText: 'I had severe pain last year.', language: 'en' }).categories)
      .not.toContain('severe_or_worsening_pain');
  });

  it('does not make an unrelated new turn urgent because an older turn was urgent', () => {
    const safety = assessMiraSafety({
      currentText: 'Thanks Mira.',
      recentPatientTurns: ['I have severe pain and fever.'],
      language: 'en',
    });
    expect(safety).toEqual({
      urgency: 'none',
      categories: [],
      deterministic: false,
      matchedCurrentTurn: false,
      continuationOfRecentConcern: false,
      reasons: [],
    });
  });

  it('marks an explicit current continuation of the same recent concern', () => {
    const safety = assessMiraSafety({
      currentText: 'The pain is still severe.',
      recentPatientTurns: ['I have severe pain.'],
      language: 'en',
    });
    expect(safety).toMatchObject({
      urgency: 'urgent',
      categories: ['severe_or_worsening_pain'],
      matchedCurrentTurn: true,
      continuationOfRecentConcern: true,
    });
  });

  it('routes unsafe medication selection or dose-change requests to specialist review', () => {
    const escalation = classifyMiraEscalation({
      userText: 'What drug should I take right now?',
      modelUrgency: 'none',
    });
    expect(escalation).toMatchObject({ needed: true, urgency: 'specialist' });
    expect(escalation.reason).toMatch(/human clinician|medication/i);
    expect(escalation.reason).not.toMatch(/take \d|double your|stop your/i);
  });

  it('keeps deterministic urgent when the model tries to downgrade it', () => {
    expect(classifyMiraEscalation({
      userText: 'I have chest pain now.',
      modelUrgency: 'none',
      modelReason: 'No escalation needed.',
    }).urgency).toBe('urgent');
  });
});

describe('Mira multilingual deterministic safety cues', () => {
  const cases: Array<{
    language: MiraLanguageCode;
    severePain: string;
    fever: string;
    breathing: string;
  }> = [
    { language: 'en', severePain: 'I have severe pain.', fever: 'I have fever.', breathing: "I can't breathe." },
    { language: 'pcm', severePain: 'Pain dey too much.', fever: 'I get fever.', breathing: 'I no fit breathe.' },
    { language: 'yo', severePain: 'Ìrora gíga n pa mí.', fever: 'Mo ní ibà.', breathing: 'Mi ò lè mí.' },
    { language: 'ig', severePain: 'Oke mgbu na-eme m.', fever: 'Enwere m ahụ ọkụ.', breathing: 'Enweghị m ike iku ume.' },
    { language: 'ha', severePain: 'Ina matsanancin ciwo.', fever: 'Ina zazzabi.', breathing: 'Ba zan iya numfashi ba.' },
  ];

  it.each(cases)('detects clear severe-pain, fever, and breathing cues in $language', ({
    language,
    severePain,
    fever,
    breathing,
  }) => {
    expect(assessMiraSafety({ currentText: severePain, language }).categories)
      .toContain('severe_or_worsening_pain');
    expect(assessMiraSafety({ currentText: fever, language }).categories)
      .toContain('fever_or_infection');
    expect(assessMiraSafety({ currentText: breathing, language }).categories)
      .toContain('breathing_difficulty');
  });

  it('marks all non-English cue sets as requiring native human review', () => {
    expect(MIRA_SAFETY_LANGUAGE_REVIEW_STATUS).toEqual({
      en: 'code-reviewed',
      pcm: 'native-human-review-required',
      yo: 'native-human-review-required',
      ig: 'native-human-review-required',
      ha: 'native-human-review-required',
    });
  });
});

describe('Mira handoff summary', () => {
  it('restates only what the patient wrote and labels the draft as AI-generated', () => {
    const messages = ['I have had bone pain and fever for 3 days and I take hydroxyurea'];
    const escalation = classifyMiraEscalation({ userText: messages[0], modelUrgency: 'specialist', modelReason: 'Recurring pain.' });
    const draft = buildMiraHandoffDraft({ patientMessages: messages, escalation });

    expect(draft.symptoms).toEqual(expect.arrayContaining(['bone pain', 'fever']));
    expect(draft.medications).toContain('hydroxyurea');
    expect(draft.duration).toMatch(/3 days/i);
    expect(draft.summaryText).toContain(MIRA_HANDOFF_LABEL);
    expect(draft.summaryText).toContain('I have had bone pain and fever for 3 days');
    expect(draft.summaryText).not.toMatch(/paracetamol|morphine|penicillin|hydroxyurea dose/i);
  });

  it('reports missing detail instead of inventing clinical facts', () => {
    const escalation = classifyMiraEscalation({ userText: 'My legs hurt sometimes', modelUrgency: 'specialist' });
    const draft = buildMiraHandoffDraft({ patientMessages: ['My legs hurt sometimes'], escalation });

    expect(draft.medications).toEqual([]);
    expect(draft.hydration).toContain('Not mentioned');
    expect(draft.summaryText).toContain('None stated in the conversation.');
    expect(draft.summaryText).toContain('Not mentioned in the conversation.');
  });

  it('notes explicit hydration mentions without adding clinical values', () => {
    const escalation = classifyMiraEscalation({ userText: 'I drank only 1 litre of water today', modelUrgency: 'specialist' });
    const draft = buildMiraHandoffDraft({ patientMessages: ['I drank only 1 litre of water today'], escalation });

    expect(draft.hydration).toContain('Mentioned by the patient');
    expect(draft.summaryText).not.toMatch(/dehydration|haemoglobin|hemoglobin/i);
  });
});

describe('Mira identity guard', () => {
  it('removes first-person clinician claims from generated text', () => {
    const guarded = applyMiraIdentityGuard(
      'I am your doctor and I have reviewed your results. Please keep drinking water.',
    );
    expect(guarded).not.toMatch(/i am your doctor/i);
    expect(guarded).not.toMatch(/i have reviewed your results/i);
    expect(guarded).toContain(MIRA_AI_IDENTITY_LINE);
    expect(guarded).toContain('Please keep drinking water.');
  });

  it('leaves ordinary supportive replies unchanged', () => {
    const reply = 'Hydration is one of the most useful daily habits for sickle cell.';
    expect(applyMiraIdentityGuard(reply)).toBe(reply);
  });
});
