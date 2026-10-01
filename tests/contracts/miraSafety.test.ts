import { describe, expect, it } from 'vitest';
import {
  MIRA_AI_IDENTITY_LINE,
  MIRA_HANDOFF_LABEL,
  applyMiraIdentityGuard,
  buildMiraHandoffDraft,
  classifyMiraEscalation,
  scanMiraRedFlags,
} from '../../server/mira/miraSafety';

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
