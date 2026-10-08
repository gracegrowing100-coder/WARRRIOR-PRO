import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 20_000 });

const miraApi = vi.hoisted(() => {
  let messageCounter = 0;
  return {
    sendMiraMessage: vi.fn(),
    transcribeMiraAudio: vi.fn(),
    synthesizeMiraSpeech: vi.fn(),
    saveMiraMessage: vi.fn(),
    startMiraConversation: vi.fn(),
    loadLatestMiraConversation: vi.fn(),
    readStoredMiraLanguage: vi.fn(() => 'en'),
    storeMiraLanguage: vi.fn(),
    isVoiceEnabledForClient: vi.fn(() => true),
    generateMiraConversationId: vi.fn(() => 'mira-test-conversation'),
    generateMiraMessageId: vi.fn(() => `msg-${(messageCounter += 1)}`),
    MiraApiError: class MiraApiError extends Error {
      readonly code: string;
      constructor(code: string, message: string) {
        super(message);
        this.code = code;
      }
    },
  };
});

vi.mock('../../../services/mira', () => miraApi);

const media = vi.hoisted(() => ({
  startMiraRecording: vi.fn(),
  playMiraAudio: vi.fn(),
  isMiraRecordingSupported: vi.fn(() => true),
}));

vi.mock('../../../services/miraMedia', () => media);

import { MiraAssistant } from '../../../components/mira/MiraAssistant';

const baseResult = {
  reply: 'Hydration is one of the most useful daily habits for sickle cell.',
  language: 'en' as const,
  escalation: { needed: false, urgency: 'none' as const, reason: '', matchedRedFlags: [] },
  handoff: null,
  handoffLabel: '',
  emergencyGuidance: null,
  provider: { model: 'gemini-test' },
};

const baseHandoff = {
  concern: 'My pain keeps coming back.',
  duration: 'Not stated in the conversation.',
  symptoms: ['pain'],
  medications: [],
  hydration: 'Not mentioned in the conversation.',
  reason: 'Recurring pain should be reviewed by a hematologist.',
  summaryText: 'MIRA HANDOFF DRAFT\n\nReported concern: My pain keeps coming back.\n\nAI-generated draft.',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const renderMira = (props?: Partial<React.ComponentProps<typeof MiraAssistant>>) => {
  const onContinueToAppointment = vi.fn();
  render(<MiraAssistant userId="patient-1" onContinueToAppointment={onContinueToAppointment} {...props} />);
  return { onContinueToAppointment };
};

const sendText = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await user.type(screen.getByLabelText('Message to Mira'), text);
  await user.click(screen.getByRole('button', { name: /Send message/i }));
};

describe('Mira assistant experience', () => {
  beforeEach(() => {
    miraApi.loadLatestMiraConversation.mockReset().mockResolvedValue(null);
    miraApi.startMiraConversation.mockReset().mockResolvedValue('recorded');
    miraApi.saveMiraMessage.mockReset().mockResolvedValue('recorded');
    miraApi.sendMiraMessage.mockReset().mockResolvedValue(baseResult);
    miraApi.transcribeMiraAudio
      .mockReset()
      .mockResolvedValue({ transcript: 'My legs hurt after walking', language: 'en', provider: { model: 'transcribe-test' } });
    miraApi.synthesizeMiraSpeech
      .mockReset()
      .mockResolvedValue({ audioBase64: 'ZZZ', mimeType: 'audio/wav', provider: { model: 'tts-test' } });
    miraApi.storeMiraLanguage.mockReset();
    miraApi.readStoredMiraLanguage.mockReset().mockReturnValue('en');
    miraApi.isVoiceEnabledForClient.mockReset().mockReturnValue(true);
    miraApi.generateMiraConversationId.mockReset().mockReturnValue('mira-test-conversation');
    media.isMiraRecordingSupported.mockReset().mockReturnValue(true);
    media.startMiraRecording.mockReset().mockResolvedValue({
      stop: vi.fn(async () => ({ audioBase64: 'AAAA', mimeType: 'audio/webm' })),
      cancel: vi.fn(),
    });
    media.playMiraAudio.mockReset().mockReturnValue({
      done: Promise.resolve(),
      pause: vi.fn(),
      resume: vi.fn(async () => undefined),
      stop: vi.fn(),
    });
  });

  it('identifies Mira as an AI assistant and never as a clinician', async () => {
    renderMira();

    expect(await screen.findByRole('heading', { name: 'Mira' })).toBeInTheDocument();
    expect(screen.getByText(/by WARRIOR AI/)).toBeInTheDocument();
    expect(screen.getByText(/Mira is an AI assistant for sickle cell information/i)).toBeInTheDocument();
    expect(screen.getByText(/Mira is an AI assistant, not a doctor/i)).toBeInTheDocument();
    expect(screen.queryByText(/Dr\.|hematologist on call|I am your doctor|clinician-verified/i)).not.toBeInTheDocument();
  });

  it('keeps a chosen voice language available without exposing provider or QA wording', async () => {
    const user = userEvent.setup();
    renderMira();

    await user.selectOptions(await screen.findByLabelText('Mira conversation language'), 'yo');

    expect(miraApi.storeMiraLanguage).toHaveBeenCalledWith('yo');
    expect(await screen.findByText(/Voice input and spoken replies are available in Yorùbá/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Speak to Mira in Yorùbá/i })).toBeEnabled();
    expect(document.body).not.toHaveTextContent(/YarnGPT|Gemini|live checks|configured provider/i);
  });

  it('shows a neutral capability notice when voice is switched off', async () => {
    renderMira({ voiceEnabled: false });

    expect(await screen.findByText('Voice assistant is unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Speak to Mira/i })).not.toBeInTheDocument();
  });

  it('runs a text conversation through the Mira pipeline and shows the reply', async () => {
    const user = userEvent.setup();
    renderMira();

    await sendText(user, 'How much water should I drink?');

    expect(await screen.findByText(/Hydration is one of the most useful daily habits/i)).toBeInTheDocument();
    expect(screen.getByText('Mira (AI)')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(miraApi.sendMiraMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'mira-test-conversation',
        language: 'en',
        message: 'How much water should I drink?',
        source: 'text',
      }),
    );
    expect(miraApi.saveMiraMessage).toHaveBeenCalledTimes(2);
  });

  it('starts a new isolated conversation without deleting the previous one', async () => {
    miraApi.loadLatestMiraConversation.mockResolvedValue({
      conversationId: 'previous-conversation',
      language: 'en',
      updatedAt: '2026-01-01T00:00:00Z',
      messages: [{ id: 'old-1', role: 'user', text: 'Previous urgent context', source: 'text', createdAt: '2026-01-01T00:00:00Z' }],
    });
    miraApi.generateMiraConversationId.mockReturnValue('fresh-conversation');
    const user = userEvent.setup();
    renderMira();

    expect(await screen.findByText('Previous urgent context')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New chat' }));

    expect(screen.queryByText('Previous urgent context')).not.toBeInTheDocument();
    await sendText(user, 'Hello from a fresh chat');
    expect(miraApi.sendMiraMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'fresh-conversation',
        history: [],
        message: 'Hello from a fresh chat',
      }),
    );
  });

  it('does not block a Mira reply while the conversation cloud write is pending', async () => {
    miraApi.startMiraConversation.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    renderMira();

    await sendText(user, 'Can Mira answer before Firestore reconnects?');

    expect(await screen.findByText(/Hydration is one of the most useful daily habits/i)).toBeInTheDocument();
    expect(miraApi.sendMiraMessage).toHaveBeenCalledTimes(1);
  });

  it('produces an editable specialist handoff that is only shared after explicit approval', async () => {
    miraApi.sendMiraMessage.mockResolvedValue({
      ...baseResult,
      escalation: {
        needed: true,
        urgency: 'specialist',
        reason: 'Recurring pain should be reviewed by a hematologist.',
        matchedRedFlags: [],
      },
      handoff: baseHandoff,
      handoffLabel: 'AI-generated draft from your Mira conversation — not clinician-authored. Review and edit before sharing.',
    });
    const user = userEvent.setup();
    const { onContinueToAppointment } = renderMira();

    await sendText(user, 'My pain keeps coming back every week.');

    expect(await screen.findByText('Human hematology review is appropriate')).toBeInTheDocument();
    expect(screen.getByText(/AI-generated draft from your Mira conversation/i)).toBeInTheDocument();

    const continueButton = screen.getByRole('button', { name: 'Continue to appointment request' });
    const editor = screen.getByLabelText('Draft handoff summary');
    expect(continueButton).toBeDisabled();
    expect(editor).toHaveValue(baseHandoff.summaryText);

    await user.clear(editor);
    await user.type(editor, 'Edited summary for the clinic');
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByLabelText(/I have reviewed this summary/i));
    expect(continueButton).toBeEnabled();
    await user.click(continueButton);

    expect(onContinueToAppointment).toHaveBeenCalledWith('Edited summary for the clinic');
    expect(miraApi.sendMiraMessage).toHaveBeenCalledTimes(1);
  });

  it('shows emergency guidance for urgent escalation and never submits anything', async () => {
    miraApi.sendMiraMessage.mockResolvedValue({
      ...baseResult,
      escalation: {
        needed: true,
        urgency: 'urgent',
        reason: 'Your message mentions chest pain or difficulty breathing. Mira cannot assess this, and a human should review it now.',
        matchedRedFlags: ['chest pain or difficulty breathing'],
      },
      handoff: baseHandoff,
      handoffLabel: 'AI-generated draft from your Mira conversation — not clinician-authored. Review and edit before sharing.',
      emergencyGuidance:
        'Your messages mention signs that can need emergency care. Mira cannot assess this and has not contacted anyone on your behalf. Please contact emergency services or go to the nearest emergency department now.',
    });
    const user = userEvent.setup();
    const { onContinueToAppointment } = renderMira();

    await sendText(user, 'I have chest pain and I cannot breathe well.');

    const emergency = await screen.findByRole('alert');
    expect(emergency).toHaveTextContent('This may need emergency care now');
    expect(emergency).toHaveTextContent(/has not contacted anyone on your behalf/i);
    expect(emergency).toHaveTextContent(/No appointment has been submitted/i);
    expect(within(screen.getByRole('log', { name: 'Mira conversation' })).getByRole('alert')).toBe(emergency);
    expect(onContinueToAppointment).not.toHaveBeenCalled();
    expect(miraApi.sendMiraMessage).toHaveBeenCalledTimes(1);
  });

  it('moves from recording to transcribing and waits for transcript review', async () => {
    const transcription = deferred<{ transcript: string; language: 'en'; provider: { model: string } }>();
    miraApi.transcribeMiraAudio.mockReturnValueOnce(transcription.promise);
    const user = userEvent.setup();
    renderMira();

    await user.click(screen.getByRole('button', { name: /Speak to Mira in English/i }));
    expect(await screen.findByText('Listening...')).toBeInTheDocument();
    expect(screen.getByText('0:00')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stop recording' }));
    expect(await screen.findByText('Transcribing your message...')).toBeInTheDocument();

    await act(async () => {
      transcription.resolve({ transcript: 'My legs hurt after walking', language: 'en', provider: { model: 'transcribe-test' } });
      await transcription.promise;
    });

    expect(await screen.findByRole('heading', { name: 'You said:' })).toBeInTheDocument();
    expect(screen.getByText(/My legs hurt after walking/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Send to Mira' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Record again' })).toBeEnabled();
    expect(miraApi.sendMiraMessage).not.toHaveBeenCalled();
    expect(miraApi.transcribeMiraAudio).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en', audioBase64: 'AAAA', mimeType: 'audio/webm' }),
    );
  });

  it('supports record again, transcript editing, and explicit send', async () => {
    miraApi.transcribeMiraAudio
      .mockResolvedValueOnce({ transcript: 'First inaccurate transcript', language: 'en', provider: { model: 'transcribe-test' } })
      .mockResolvedValueOnce({ transcript: 'My back dey pain', language: 'en', provider: { model: 'transcribe-test' } });
    const user = userEvent.setup();
    renderMira();

    await user.click(screen.getByRole('button', { name: /Speak to Mira in English/i }));
    await user.click(await screen.findByRole('button', { name: 'Stop recording' }));
    await screen.findByText(/First inaccurate transcript/);
    await user.click(screen.getByRole('button', { name: 'Record again' }));
    expect(await screen.findByText('Listening...')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stop recording' }));
    await screen.findByText(/My back dey pain/);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const editor = screen.getByLabelText('Edit voice transcript');
    await user.clear(editor);
    await user.type(editor, 'My back dey pain and I get fever.');
    await user.click(screen.getByRole('button', { name: 'Send to Mira' }));

    expect(await screen.findByText('My back dey pain and I get fever.')).toBeInTheDocument();
    expect(miraApi.sendMiraMessage).toHaveBeenCalledWith(expect.objectContaining({
      source: 'voice',
      conversationId: 'mira-test-conversation',
      message: 'My back dey pain and I get fever.',
    }));
    expect(miraApi.synthesizeMiraSpeech).toHaveBeenCalledWith(expect.objectContaining({ language: 'en' }));
    expect(media.playMiraAudio).toHaveBeenCalledTimes(1);
  });

  it('shows the thinking state while waiting for a text response', async () => {
    const response = deferred<typeof baseResult>();
    miraApi.sendMiraMessage.mockReturnValueOnce(response.promise);
    const user = userEvent.setup();
    renderMira();

    await user.type(screen.getByLabelText('Message to Mira'), 'How much water should I drink?');
    await user.click(screen.getByRole('button', { name: /Send message/i }));
    expect(await screen.findByText('Mira is thinking...', { selector: 'p' })).toHaveAttribute('role', 'status');

    await act(async () => {
      response.resolve(baseResult);
      await response.promise;
    });
    expect(await screen.findByText(/Hydration is one of the most useful daily habits/i)).toBeInTheDocument();
  });

  it('shows spoken-reply preparation, playback, pause, and resume states', async () => {
    const speech = deferred<{ audioBase64: string; mimeType: string; provider: { model: string } }>();
    const playbackDone = deferred<void>();
    const pause = vi.fn();
    const resume = vi.fn(async () => undefined);
    miraApi.synthesizeMiraSpeech.mockReturnValueOnce(speech.promise);
    media.playMiraAudio.mockReturnValueOnce({ done: playbackDone.promise, pause, resume, stop: vi.fn() });
    const user = userEvent.setup();
    renderMira();

    await user.click(screen.getByRole('button', { name: /Speak to Mira in English/i }));
    await user.click(await screen.findByRole('button', { name: 'Stop recording' }));
    await user.click(await screen.findByRole('button', { name: 'Send to Mira' }));
    expect(await screen.findByText('Preparing spoken reply...')).toBeInTheDocument();

    await act(async () => {
      speech.resolve({ audioBase64: 'ZZZ', mimeType: 'audio/wav', provider: { model: 'tts-test' } });
      await speech.promise;
    });
    expect(await screen.findByText("Playing Mira's reply")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pause reply' }));
    expect(pause).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Mira's reply is paused.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Resume reply' }));
    expect(resume).toHaveBeenCalledTimes(1);

    await act(async () => {
      playbackDone.resolve();
      await playbackDone.promise;
    });
  });

  it('reports an unavailable provider instead of inventing a reply', async () => {
    miraApi.sendMiraMessage.mockRejectedValue(
      new miraApi.MiraApiError('mira_unavailable', 'Mira response service is not configured.'),
    );
    const user = userEvent.setup();
    renderMira();

    await sendText(user, 'Hello Mira');

    expect(await screen.findByText(/response service is not configured/i)).toBeInTheDocument();
    expect(screen.queryByText('Mira (AI)')).not.toBeInTheDocument();
  });

  it('clears Account A state before loading or persisting Account B', async () => {
    miraApi.loadLatestMiraConversation
      .mockResolvedValueOnce({
        conversationId: 'account-a-conversation',
        language: 'en',
        updatedAt: '2026-01-01T00:00:00Z',
        messages: [{ id: 'a1', role: 'user', text: 'Account A private message', source: 'text', createdAt: '2026-01-01T00:00:00Z' }],
      })
      .mockResolvedValueOnce(null);
    const onContinueToAppointment = vi.fn();
    const view = render(<MiraAssistant userId="account-a" onContinueToAppointment={onContinueToAppointment} />);
    expect(await screen.findByText('Account A private message')).toBeInTheDocument();

    view.rerender(<MiraAssistant userId="account-b" onContinueToAppointment={onContinueToAppointment} />);
    expect(screen.queryByText('Account A private message')).not.toBeInTheDocument();

    const user = userEvent.setup();
    await sendText(user, 'Account B question');
    await screen.findByText(/Hydration is one of the most useful daily habits/i);
    expect(miraApi.saveMiraMessage).toHaveBeenCalledWith(expect.objectContaining({ userId: 'account-b' }));
    expect(miraApi.saveMiraMessage).not.toHaveBeenCalledWith(expect.objectContaining({ userId: 'account-a' }));
  });
});
