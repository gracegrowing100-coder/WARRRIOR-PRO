import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Mic, MicOff, Send, ShieldAlert, Volume2 } from 'lucide-react';
import { Alert, Button, Card, FormField, SelectInput, Textarea } from '../ui';
import {
  MIRA_LANGUAGES,
  MIRA_TEXT_CHAT_NOTE,
  miraLanguageDefinition,
  miraVoiceCapability,
  type MiraLanguageCode,
} from '../../services/miraConfig';
import {
  MiraApiError,
  generateMiraConversationId,
  generateMiraMessageId,
  isVoiceEnabledForClient,
  loadLatestMiraConversation,
  readStoredMiraLanguage,
  saveMiraMessage,
  sendMiraMessage,
  startMiraConversation,
  storeMiraLanguage,
  synthesizeMiraSpeech,
  transcribeMiraAudio,
  type MiraChatMessage,
  type MiraEscalation,
  type MiraEscalationUrgency,
  type MiraHandoffDraft,
  type MiraMessageSource,
} from '../../services/mira';
import {
  isMiraRecordingSupported,
  playMiraAudio,
  startMiraRecording,
  type MiraAudioPlayback,
  type MiraRecording,
} from '../../services/miraMedia';

export interface MiraAssistantProps {
  userId: string;
  /** Receives the patient-approved summary. It pre-fills a request; it never submits one. */
  onContinueToAppointment: (approvedSummary: string) => void;
  /** Neutral capability flag; defaults to the environment capability setting. */
  voiceEnabled?: boolean;
}

type MiraStatus = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

const STATUS_LABELS: Record<MiraStatus, string> = {
  idle: '',
  listening: 'Listening… tap the microphone again to finish.',
  transcribing: 'Transcribing your voice…',
  thinking: 'Mira is preparing a reply…',
  speaking: 'Playing Mira’s spoken reply…',
};

export const MiraAssistant: React.FC<MiraAssistantProps> = ({
  userId,
  onContinueToAppointment,
  voiceEnabled,
}) => {
  const [language, setLanguage] = useState<MiraLanguageCode>(() => readStoredMiraLanguage());
  const [messages, setMessages] = useState<MiraChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<MiraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [escalation, setEscalation] = useState<MiraEscalation | null>(null);
  const [emergencyGuidance, setEmergencyGuidance] = useState('');
  const [handoff, setHandoff] = useState<MiraHandoffDraft | null>(null);
  const [handoffLabel, setHandoffLabel] = useState('');
  const [handoffText, setHandoffText] = useState('');
  const [handoffApproved, setHandoffApproved] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState('');
  const [loadingConversation, setLoadingConversation] = useState(true);

  const conversationRef = useRef<string>('');
  const startedConversationRef = useRef<string>('');
  const recordingRef = useRef<MiraRecording | null>(null);
  const playbackRef = useRef<MiraAudioPlayback | null>(null);
  const languageRef = useRef<MiraLanguageCode>(language);
  const activeUserRef = useRef(userId);

  const voiceAvailable = voiceEnabled ?? isVoiceEnabledForClient();
  const speechInputVerified = miraVoiceCapability(language, 'speechToText') === 'verified';
  const speechOutputVerified = miraVoiceCapability(language, 'textToSpeech') === 'verified';
  const languageDefinition = miraLanguageDefinition(language);
  const busy = status !== 'idle';

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    activeUserRef.current = userId;
    recordingRef.current?.cancel();
    recordingRef.current = null;
    playbackRef.current?.stop();
    playbackRef.current = null;
    conversationRef.current = '';
    startedConversationRef.current = '';
    setMessages([]);
    setInputText('');
    setStatus('idle');
    setErrorMessage('');
    setEscalation(null);
    setEmergencyGuidance('');
    setHandoff(null);
    setHandoffLabel('');
    setHandoffText('');
    setHandoffApproved(false);
    setSaveNotice('');
    setLastVoiceTranscript('');
    setLoadingConversation(true);
    const load = async () => {
      try {
        const existing = await loadLatestMiraConversation(userId);
        if (cancelled || !existing) return;
        conversationRef.current = existing.conversationId;
        startedConversationRef.current = existing.conversationId;
        setMessages(existing.messages);
        if (existing.messages.length > 0) setLanguage(existing.language);
      } catch {
        // A previous conversation is optional; Mira still works without it.
      } finally {
        if (!cancelled) setLoadingConversation(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
      recordingRef.current?.cancel();
      playbackRef.current?.stop();
    };
  }, [userId]);

  const stopPlayback = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
  }, []);

  const persist = useCallback(
    async (message: MiraChatMessage, urgency: MiraEscalationUrgency) => {
      const state = await saveMiraMessage({
        userId,
        conversationId: conversationRef.current,
        message,
        language: languageRef.current,
        escalationUrgency: urgency,
      });
      if (activeUserRef.current !== userId) return;
      if (state === 'device-only') {
        setSaveNotice('This conversation is only saved on this device right now.');
      } else if (state === 'unavailable') {
        setSaveNotice('This conversation could not be saved to the cloud or this device.');
      } else {
        setSaveNotice('');
      }
    },
    [userId],
  );

  const ensureConversation = useCallback(
    async (mode: MiraMessageSource) => {
      if (!conversationRef.current) conversationRef.current = generateMiraConversationId();
      if (startedConversationRef.current !== conversationRef.current) {
        startedConversationRef.current = conversationRef.current;
        await startMiraConversation({
          userId,
          conversationId: conversationRef.current,
          language: languageRef.current,
          mode,
        });
      }
      return conversationRef.current;
    },
    [userId],
  );

  const speakReply = useCallback(
    async (text: string) => {
      if (!voiceAvailable || miraVoiceCapability(languageRef.current, 'textToSpeech') !== 'verified') return;
      try {
        setStatus('speaking');
        const speech = await synthesizeMiraSpeech({ language: languageRef.current, text });
        const playback = playMiraAudio(`data:${speech.mimeType};base64,${speech.audioBase64}`);
        playbackRef.current = playback;
        await playback.done;
      } catch (error) {
        setErrorMessage(error instanceof MiraApiError ? error.message : 'The spoken reply could not be played.');
      } finally {
        playbackRef.current = null;
        setStatus('idle');
      }
    },
    [voiceAvailable],
  );

  const runTurn = useCallback(
    async (text: string, source: MiraMessageSource) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setErrorMessage('');
      setStatus('thinking');
      const conversationId = await ensureConversation(source);
      const history = messages.slice(-8).map((message) => ({ role: message.role, text: message.text }));
      const userMessage: MiraChatMessage = {
        id: generateMiraMessageId(),
        role: 'user',
        text: trimmed,
        source,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, userMessage]);

      try {
        const result = await sendMiraMessage({
          conversationId,
          language: languageRef.current,
          message: trimmed,
          source,
          history,
        });
        if (activeUserRef.current !== userId) return;
        const assistantMessage: MiraChatMessage = {
          id: generateMiraMessageId(),
          role: 'assistant',
          text: result.reply,
          source: 'text',
          createdAt: new Date().toISOString(),
        };
        setMessages((current) => [...current, assistantMessage]);
        setEscalation(result.escalation);
        setEmergencyGuidance(result.emergencyGuidance ?? '');
        setHandoff(result.handoff);
        setHandoffLabel(result.handoffLabel ?? '');
        setHandoffText(result.handoff?.summaryText ?? '');
        setHandoffApproved(false);
        await persist(userMessage, result.escalation.urgency);
        await persist(assistantMessage, result.escalation.urgency);
        if (source === 'voice') {
          await speakReply(result.reply);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof MiraApiError ? error.message : 'Mira could not reply right now. Please try again.',
        );
      } finally {
        setStatus('idle');
      }
    },
    [ensureConversation, messages, persist, speakReply],
  );

  const finishRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    recordingRef.current = null;
    setErrorMessage('');
    setStatus('transcribing');
    try {
      const clip = await recording.stop();
      const result = await transcribeMiraAudio({
        language: languageRef.current,
        audioBase64: clip.audioBase64,
        mimeType: clip.mimeType,
      });
      setLastVoiceTranscript(result.transcript);
      setStatus('idle');
      await runTurn(result.transcript, 'voice');
    } catch (error) {
      setStatus('idle');
      setErrorMessage(
        error instanceof MiraApiError || error instanceof Error
          ? error.message
          : 'Voice input failed. Please try again or type your message.',
      );
    }
  }, [runTurn]);

  const handleMicrophone = useCallback(async () => {
    if (status === 'listening') {
      await finishRecording();
      return;
    }
    if (status !== 'idle') return;
    setErrorMessage('');
    if (!isMiraRecordingSupported()) {
      setErrorMessage('Voice recording is not supported in this browser. You can type your message instead.');
      return;
    }
    try {
      recordingRef.current = await startMiraRecording({ maxSeconds: 60 });
      setStatus('listening');
    } catch {
      setErrorMessage('Microphone access was not available. Check the browser permission and try again.');
    }
  }, [finishRecording, status]);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value as MiraLanguageCode;
    setLanguage(nextLanguage);
    languageRef.current = nextLanguage;
    storeMiraLanguage(nextLanguage);
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text || busy) return;
    stopPlayback();
    setInputText('');
    await runTurn(text, 'text');
  };

  const lastVoiceLabel = lastVoiceTranscript ? `Last voice transcript: “${lastVoiceTranscript}”` : '';
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant');

  return (
    <section aria-labelledby="mira-heading" className="space-y-5" data-semantic>
      <Card as="section" className="space-y-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-action text-heading-3 font-semibold text-foreground-inverse"
          >
            M
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="mira-heading" className="text-heading-2 text-foreground">
              Mira
            </h2>
            <p className="text-small font-semibold text-foreground-secondary">by WARRIOR AI · AI assistant</p>
            <p className="mt-2 max-w-prose text-small text-foreground-secondary">
              Mira is an AI assistant for sickle cell information and everyday support. Mira is not a doctor, cannot
              diagnose or prescribe, and will say when a human should review your situation.
            </p>
          </div>
        </div>

        <FormField
          label="Conversation language"
          helpText={`${languageDefinition.voiceDetail} ${MIRA_TEXT_CHAT_NOTE}`}
        >
          <SelectInput
            value={language}
            onChange={handleLanguageChange}
            aria-label="Mira conversation language"
          >
            {MIRA_LANGUAGES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </SelectInput>
        </FormField>

        {!voiceAvailable && (
          <Alert tone="neutral" title="Voice assistant is unavailable">
            Voice is switched off in this configuration. Text chat with Mira is fully available.
          </Alert>
        )}
        {voiceAvailable && !speechInputVerified && (
          <Alert tone="warning" title="Voice input is not available in this language">
            {languageDefinition.voiceDetail} You can still type your message in {languageDefinition.label}.
          </Alert>
        )}
      </Card>

      <Card as="section" padding="none" className="overflow-hidden">
        <div className="border-b border-line bg-surface-subtle px-4 py-3 sm:px-5">
          <h3 className="text-heading-3 text-foreground">Conversation</h3>
          <p className="text-caption text-foreground-secondary">
            Everything you and Mira say stays visible here, including voice transcripts.
          </p>
        </div>
        <div
          role="log"
          aria-live="polite"
          aria-label="Mira conversation"
          className="max-h-96 space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
        >
          {loadingConversation && (
            <p role="status" className="text-small text-foreground-secondary">
              Loading your previous Mira conversation…
            </p>
          )}
          {!loadingConversation && messages.length === 0 && (
            <p className="max-w-prose text-small text-foreground-secondary">
              Ask Mira about sickle cell, hydration, pain, medication routines, or preparing for an appointment. Mira
              will explain when human review is needed instead of guessing.
            </p>
          )}
          {messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-card bg-surface-subtle px-4 py-3'
                  : 'max-w-[92%] rounded-card border border-line bg-surface px-4 py-3'
              }
            >
              <p className="text-caption font-semibold text-foreground-secondary">
                {message.role === 'user' ? 'You' : 'Mira (AI)'}
                {message.source === 'voice' ? ' · voice transcript' : ''}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-body text-foreground">{message.text}</p>
            </article>
          ))}
        </div>
        {STATUS_LABELS[status] && (
          <p role="status" aria-live="polite" className="border-t border-line px-4 py-2 text-small text-foreground-secondary sm:px-5">
            {STATUS_LABELS[status]}
          </p>
        )}
        {lastVoiceLabel && (
          <p className="border-t border-line px-4 py-2 text-small text-foreground-secondary sm:px-5">{lastVoiceLabel}</p>
        )}
      </Card>

      {errorMessage && (
        <Alert tone="danger" title="Mira could not complete that" live="assertive">
          {errorMessage}
        </Alert>
      )}
      {saveNotice && (
        <Alert tone="warning" title="Conversation save status" live="polite">
          {saveNotice}
        </Alert>
      )}

      {escalation?.urgency === 'urgent' && (
        <Alert tone="danger" title="This may need emergency care now" live="assertive" icon={<ShieldAlert size={20} />}>
          <p>{emergencyGuidance || 'Please contact emergency services or go to the nearest emergency department now.'}</p>
          <p className="mt-2">{escalation.reason}</p>
          <p className="mt-2">
            Mira has not contacted anyone for you. An appointment request is not an emergency service and does not
            replace emergency care.
          </p>
        </Alert>
      )}

      {escalation?.urgency === 'specialist' && (
        <Alert tone="warning" title="Human hematology review is appropriate" live="polite">
          <p>{escalation.reason}</p>
          <p className="mt-2">
            Mira can prepare a short draft for your care team from what you said. You review and edit it, and nothing is
            sent from this screen.
          </p>
        </Alert>
      )}

      {handoff && (
        <Card as="section" className="space-y-4">
          <div>
            <h3 className="text-heading-3 text-foreground">Handoff summary for human review</h3>
            <p className="mt-1 max-w-prose text-small text-foreground-secondary">
              {handoffLabel ||
                'AI-generated draft from your Mira conversation — not clinician-authored. Review and edit before sharing.'}
            </p>
          </div>
          <FormField
            label="Draft summary to share with the clinic"
            helpText="Mira built this from your own messages. Edit it so that only what you want to share remains."
          >
            <Textarea
              rows={10}
              value={handoffText}
              onChange={(event) => setHandoffText(event.target.value)}
              aria-label="Draft handoff summary"
            />
          </FormField>
          <label className="flex min-h-11 items-start gap-3 text-small text-foreground">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0"
              checked={handoffApproved}
              onChange={(event) => setHandoffApproved(event.target.checked)}
            />
            <span>I have reviewed this summary and approve sharing it with the clinic if I submit an appointment request.</span>
          </label>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setHandoff(null);
                setHandoffText('');
                setHandoffApproved(false);
              }}
            >
              Discard draft
            </Button>
            <Button
              disabled={!handoffApproved || handoffText.trim().length === 0}
              onClick={() => onContinueToAppointment(handoffText.trim())}
            >
              Continue to appointment request
            </Button>
          </div>
          <p className="text-caption text-foreground-secondary">
            This opens the appointment request with your summary filled in. Nothing is submitted until you review the
            date, time and reason and submit it yourself. No clinic or clinician has confirmed anything.
          </p>
        </Card>
      )}

      <Card as="section" className="space-y-4">
        <form onSubmit={handleSend} className="space-y-3" noValidate>
          <FormField
            label="Your message to Mira"
            helpText="Mira answers as an AI assistant and always tells you when human review is needed."
          >
            <Textarea
              rows={3}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Type your question or concern"
              aria-label="Message to Mira"
            />
          </FormField>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              leadingIcon={<Send size={18} />}
              loading={status === 'thinking'}
              loadingLabel="Mira is replying…"
              disabled={busy || inputText.trim().length === 0}
            >
              Send message
            </Button>
            {voiceAvailable && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleMicrophone()}
                disabled={status === 'transcribing' || status === 'thinking' || status === 'speaking' || !speechInputVerified}
                leadingIcon={status === 'listening' ? <MicOff size={18} /> : <Mic size={18} />}
                aria-pressed={status === 'listening'}
                aria-label={
                  status === 'listening'
                    ? 'Finish voice recording and send to Mira'
                    : `Speak to Mira in ${languageDefinition.label}`
                }
                title={speechInputVerified ? undefined : languageDefinition.voiceDetail}
              >
                {status === 'listening' ? 'Finish and send voice' : 'Speak to Mira'}
              </Button>
            )}
            {voiceAvailable && speechOutputVerified && lastAssistantMessage && (
              <Button
                type="button"
                variant="ghost"
                leadingIcon={<Volume2 size={18} />}
                onClick={() => void speakReply(lastAssistantMessage.text)}
                disabled={status === 'speaking'}
              >
                Play last reply
              </Button>
            )}
          </div>
        </form>
        <p className="max-w-prose text-caption text-foreground-secondary">
          Mira is an AI assistant, not a doctor. Mira never submits appointment requests, never contacts anyone for you,
          and never writes to your Health History or Medical Records. Voice availability depends on the configured
          provider. Audio is sent to the provider for transcription and is not stored in Warrior AI records.
        </p>
      </Card>
    </section>
  );
};
