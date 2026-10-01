import React from 'react';
import { render, screen } from '@testing-library/react';
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
    media.isMiraRecordingSupported.mockReset().mockReturnValue(true);
    media.startMiraRecording.mockReset().mockResolvedValue({
      stop: vi.fn(async () => ({ audioBase64: 'AAAA', mimeType: 'audio/webm' })),
      cancel: vi.fn(),
    });
    media.playMiraAudio.mockReset().mockReturnValue({ done: Promise.resolve(), stop: vi.fn() });
  });

  it('identifies Mira as an AI assistant and never as a clinician', async () => {
    renderMira();

    expect(await screen.findByRole('heading', { name: 'Mira' })).toBeInTheDocument();
    expect(screen.getByText(/by WARRIOR AI/)).toBeInTheDocument();
    expect(screen.getByText(/Mira is an AI assistant for sickle cell information/i)).toBeInTheDocument();
    expect(screen.getByText(/Mira is an AI assistant, not a doctor/i)).toBeInTheDocument();
    expect(screen.queryByText(/Dr\.|hematologist on call|I am your doctor|clinician-verified/i)).not.toBeInTheDocument();
  });

  it('keeps the chosen language and states provider voice limits truthfully', async () => {
    const user = userEvent.setup();
    renderMira();

    await user.selectOptions(await screen.findByLabelText('Mira conversation language'), 'yo');

    expect(miraApi.storeMiraLanguage).toHaveBeenCalledWith('yo');
    expect(await screen.findByText('Voice input is not available in this language')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Speak to Mira/i })).toBeDisabled();
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
    expect(screen.getByText(/does not replace emergency care/i)).toBeInTheDocument();
    expect(onContinueToAppointment).not.toHaveBeenCalled();
    expect(miraApi.sendMiraMessage).toHaveBeenCalledTimes(1);
  });

  it('sends voice through the same conversation and plays the spoken reply', async () => {
    const user = userEvent.setup();
    renderMira();

    await sendText(user, 'Hello Mira');
    await screen.findByText(/Hydration is one of the most useful daily habits/i);

    await user.click(screen.getByRole('button', { name: /Speak to Mira in English/i }));
    const finishButton = await screen.findByRole('button', { name: /Finish voice recording and send to Mira/i });
    await user.click(finishButton);

    expect(await screen.findByText('My legs hurt after walking')).toBeInTheDocument();
    expect(await screen.findByText(/Last voice transcript/i)).toBeInTheDocument();
    expect(miraApi.transcribeMiraAudio).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en', audioBase64: 'AAAA', mimeType: 'audio/webm' }),
    );
    expect(miraApi.sendMiraMessage).toHaveBeenCalledTimes(2);
    expect(miraApi.sendMiraMessage.mock.calls[1][0]).toMatchObject({
      source: 'voice',
      conversationId: 'mira-test-conversation',
      message: 'My legs hurt after walking',
    });
    expect(miraApi.synthesizeMiraSpeech).toHaveBeenCalledWith(expect.objectContaining({ language: 'en' }));
    expect(media.playMiraAudio).toHaveBeenCalledTimes(1);
  });

  it('reports an unavailable provider instead of inventing a reply', async () => {
    miraApi.sendMiraMessage.mockRejectedValue(
      new miraApi.MiraApiError('mira_unavailable', 'Mira is not available on this server because no AI provider key is configured.'),
    );
    const user = userEvent.setup();
    renderMira();

    await sendText(user, 'Hello Mira');

    expect(await screen.findByText(/no AI provider key is configured/i)).toBeInTheDocument();
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
