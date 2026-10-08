import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, Mic, Pause, Pencil, Play, RotateCcw, Send, ShieldAlert, Square, Volume2 } from 'lucide-react';
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

type MiraStatus =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'reviewing-transcript'
  | 'sending'
  | 'thinking'
  | 'speaking'
  | 'error';
type MiraSpeechStage = 'preparing' | 'playing' | null;

const STATUS_LABELS: Record<MiraStatus, string> = {
  idle: '',
  recording: 'Listening...',
  transcribing: 'Transcribing your message...',
  'reviewing-transcript': 'Review your transcript before sending it to Mira.',
  sending: 'Sending your message...',
  thinking: 'Mira is thinking...',
  speaking: '',
  error: '',
};

function formatRecordingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

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
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechStage, setSpeechStage] = useState<MiraSpeechStage>(null);
  const [playbackPaused, setPlaybackPaused] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(true);

  const conversationRef = useRef<string>('');
  const startedConversationRef = useRef<string>('');
  const recordingRef = useRef<MiraRecording | null>(null);
  const playbackRef = useRef<MiraAudioPlayback | null>(null);
  const speechOperationRef = useRef(0);
  const languageRef = useRef<MiraLanguageCode>(language);
  const activeUserRef = useRef(userId);

  const voiceAvailable = voiceEnabled ?? isVoiceEnabledForClient();
  const speechInputVerified = miraVoiceCapability(language, 'speechToText') === 'verified';
  const speechOutputVerified = miraVoiceCapability(language, 'textToSpeech') === 'verified';
  const languageDefinition = miraLanguageDefinition(language);
  const busy = status !== 'idle' && status !== 'error';
  const voiceHelpText = speechInputVerified && speechOutputVerified
    ? `Voice input and spoken replies are available in ${languageDefinition.label}. ${MIRA_TEXT_CHAT_NOTE}`
    : `Mira can reply in ${languageDefinition.label}. ${MIRA_TEXT_CHAT_NOTE}`;

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
    speechOperationRef.current += 1;
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
    setTranscriptDraft('');
    setEditingTranscript(false);
    setRecordingSeconds(0);
    setSpeechStage(null);
    setPlaybackPaused(false);
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
    speechOperationRef.current += 1;
    playbackRef.current?.stop();
    playbackRef.current = null;
    setSpeechStage(null);
    setPlaybackPaused(false);
  }, []);

  const startNewChat = useCallback(() => {
    recordingRef.current?.cancel();
    recordingRef.current = null;
    stopPlayback();
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
    setTranscriptDraft('');
    setEditingTranscript(false);
    setRecordingSeconds(0);
    setSpeechStage(null);
    setPlaybackPaused(false);
    setLoadingConversation(false);
  }, [stopPlayback]);

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
        const conversationId = conversationRef.current;
        void startMiraConversation({
          userId,
          conversationId,
          language: languageRef.current,
          mode,
        }).then((state) => {
          if (activeUserRef.current !== userId || conversationRef.current !== conversationId) return;
          if (state === 'device-only') {
            setSaveNotice('This conversation is only saved on this device right now.');
          } else if (state === 'unavailable') {
            setSaveNotice('This conversation could not be saved to the cloud or this device.');
          }
        });
      }
      return conversationRef.current;
    },
    [userId],
  );

  const speakReply = useCallback(
    async (text: string): Promise<boolean> => {
      if (!voiceAvailable || miraVoiceCapability(languageRef.current, 'textToSpeech') !== 'verified') return true;
      const operationId = speechOperationRef.current + 1;
      speechOperationRef.current = operationId;
      try {
        setStatus('speaking');
        setSpeechStage('preparing');
        setPlaybackPaused(false);
        const speech = await synthesizeMiraSpeech({ language: languageRef.current, text });
        if (speechOperationRef.current !== operationId) return true;
        const playback = playMiraAudio(`data:${speech.mimeType};base64,${speech.audioBase64}`);
        playbackRef.current = playback;
        setSpeechStage('playing');
        await playback.done;
        if (speechOperationRef.current === operationId) setStatus('idle');
        return true;
      } catch (error) {
        setErrorMessage(error instanceof MiraApiError ? error.message : 'The spoken reply could not be played.');
        if (speechOperationRef.current === operationId) setStatus('error');
        return false;
      } finally {
        if (speechOperationRef.current === operationId) {
          playbackRef.current = null;
          setSpeechStage(null);
          setPlaybackPaused(false);
        }
      }
    },
    [voiceAvailable],
  );

  const runTurn = useCallback(
    async (text: string, source: MiraMessageSource) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setErrorMessage('');
      setEscalation(null);
      setEmergencyGuidance('');
      setStatus('sending');
      try {
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
        setStatus('thinking');
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
          const spoken = await speakReply(result.reply);
          if (!spoken) return;
        }
        setStatus('idle');
      } catch (error) {
        setErrorMessage(
          error instanceof MiraApiError ? error.message : 'Mira could not reply right now. Please try again.',
        );
        setStatus('error');
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
      setTranscriptDraft(result.transcript);
      setEditingTranscript(false);
      setStatus('reviewing-transcript');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof MiraApiError || error instanceof Error
          ? error.message
          : 'Voice input failed. Please try again or type your message.',
      );
    }
  }, []);

  useEffect(() => {
    if (status !== 'recording') return;
    let elapsed = 0;
    setRecordingSeconds(0);
    const timer = window.setInterval(() => {
      elapsed += 1;
      setRecordingSeconds(elapsed);
      if (elapsed >= 60) {
        window.clearInterval(timer);
        void finishRecording();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finishRecording, status]);

  const beginRecording = useCallback(async () => {
    setErrorMessage('');
    if (!isMiraRecordingSupported()) {
      setStatus('error');
      setErrorMessage('Voice recording is not supported in this browser. You can type your message instead.');
      return;
    }
    try {
      stopPlayback();
      setTranscriptDraft('');
      setEditingTranscript(false);
      recordingRef.current = await startMiraRecording({ maxSeconds: 60 });
      setStatus('recording');
    } catch {
      setStatus('error');
      setErrorMessage('Microphone access was not available. Check the browser permission and try again.');
    }
  }, [stopPlayback]);

  const handleMicrophone = useCallback(async () => {
    if (status !== 'idle' && status !== 'error') return;
    await beginRecording();
  }, [beginRecording, status]);

  const sendReviewedTranscript = useCallback(async () => {
    const transcript = transcriptDraft.trim();
    if (!transcript) return;
    setTranscriptDraft('');
    setEditingTranscript(false);
    await runTurn(transcript, 'voice');
  }, [runTurn, transcriptDraft]);

  const recordAgain = useCallback(async () => {
    setTranscriptDraft('');
    setEditingTranscript(false);
    setStatus('idle');
    await beginRecording();
  }, [beginRecording]);

  const togglePlaybackPause = useCallback(async () => {
    const playback = playbackRef.current;
    if (!playback || speechStage !== 'playing') return;
    if (playbackPaused) {
      try {
        await playback.resume();
        setPlaybackPaused(false);
      } catch {
        setErrorMessage('The spoken reply could not resume. You can replay it when ready.');
        setStatus('error');
      }
      return;
    }
    playback.pause();
    setPlaybackPaused(true);
  }, [playbackPaused, speechStage]);

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
          helpText={voiceHelpText}
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
            You can still type your message in {languageDefinition.label}.
          </Alert>
        )}
      </Card>

      <Card as="section" padding="none" className="overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-line bg-surface-subtle px-4 py-3 sm:px-5">
          <div>
            <h3 className="text-heading-3 text-foreground">Conversation</h3>
            <p className="text-caption text-foreground-secondary">
              Everything you and Mira say stays visible here, including voice transcripts.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leadingIcon={<MessageSquarePlus size={17} />}
            onClick={startNewChat}
            disabled={busy || loadingConversation}
          >
            New chat
          </Button>
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
          {escalation?.urgency === 'urgent' && (
            <Alert
              tone="danger"
              title="This may need emergency care now"
              live="assertive"
              icon={<ShieldAlert size={20} />}
              className="max-w-[92%]"
            >
              <p>{emergencyGuidance || 'Please contact emergency services or go to the nearest emergency department now.'}</p>
              <p className="mt-2">{escalation.reason}</p>
              <p className="mt-2">
                Mira has not contacted anyone for you. No appointment has been submitted, and nothing has been written
                to your health or medical records.
              </p>
            </Alert>
          )}
        </div>
        {(status === 'sending' || status === 'thinking' || status === 'speaking') && (
          <p role="status" aria-live="polite" className="border-t border-line px-4 py-2 text-small text-foreground-secondary sm:px-5">
            {status === 'speaking'
              ? speechStage === 'preparing'
                ? 'Preparing spoken reply...'
                : playbackPaused
                  ? "Mira's reply is paused."
                  : "Playing Mira's reply"
              : STATUS_LABELS[status]}
          </p>
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
        {status === 'recording' && (
          <Alert
            tone="info"
            title="Listening..."
            live="polite"
            icon={<Mic size={20} />}
            action={(
              <Button
                type="button"
                variant="danger"
                leadingIcon={<Square size={17} />}
                onClick={() => void finishRecording()}
              >
                Stop recording
              </Button>
            )}
          >
            <span className="font-semibold tabular-nums">{formatRecordingTime(recordingSeconds)}</span>
            <span className="ml-2">Your microphone is active.</span>
          </Alert>
        )}

        {status === 'transcribing' && (
          <Alert tone="info" title="Transcribing your message..." live="polite">
            Keep this screen open while Mira turns your recording into text.
          </Alert>
        )}

        {status === 'reviewing-transcript' && (
          <section aria-labelledby="mira-transcript-review-title" className="space-y-3 rounded-card border border-line bg-surface-subtle p-4">
            <div>
              <h3 id="mira-transcript-review-title" className="text-body font-semibold text-foreground">You said:</h3>
              <p className="mt-1 text-caption text-foreground-secondary">Review this transcript before sending it to Mira.</p>
            </div>
            {editingTranscript ? (
              <FormField label="Edit transcript">
                <Textarea
                  rows={3}
                  value={transcriptDraft}
                  onChange={(event) => setTranscriptDraft(event.target.value)}
                  aria-label="Edit voice transcript"
                />
              </FormField>
            ) : (
              <blockquote className="whitespace-pre-wrap rounded-control bg-surface px-4 py-3 text-body text-foreground">
                “{transcriptDraft}”
              </blockquote>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                leadingIcon={<Pencil size={17} />}
                onClick={() => setEditingTranscript(true)}
                disabled={editingTranscript}
              >
                Edit
              </Button>
              <Button
                type="button"
                leadingIcon={<Send size={17} />}
                onClick={() => void sendReviewedTranscript()}
                disabled={transcriptDraft.trim().length === 0}
              >
                Send to Mira
              </Button>
              <Button
                type="button"
                variant="ghost"
                leadingIcon={<RotateCcw size={17} />}
                onClick={() => void recordAgain()}
              >
                Record again
              </Button>
            </div>
          </section>
        )}

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
              disabled={busy}
            />
          </FormField>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              leadingIcon={<Send size={18} />}
              loading={status === 'sending' || status === 'thinking'}
              loadingLabel={status === 'sending' ? 'Sending...' : 'Mira is thinking...'}
              disabled={busy || inputText.trim().length === 0}
            >
              Send message
            </Button>
            {voiceAvailable && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleMicrophone()}
                disabled={busy || !speechInputVerified}
                leadingIcon={<Mic size={18} />}
                aria-label={`Speak to Mira in ${languageDefinition.label}`}
                title={speechInputVerified ? undefined : `Voice input is not available in ${languageDefinition.label} right now.`}
              >
                Speak to Mira
              </Button>
            )}
            {status === 'speaking' && speechStage === 'playing' && (
              <Button
                type="button"
                variant="secondary"
                leadingIcon={playbackPaused ? <Play size={18} /> : <Pause size={18} />}
                onClick={() => void togglePlaybackPause()}
              >
                {playbackPaused ? 'Resume reply' : 'Pause reply'}
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
                Replay last reply
              </Button>
            )}
          </div>
        </form>
        <p className="max-w-prose text-caption text-foreground-secondary">
          Mira is an AI assistant, not a doctor. Mira never submits appointment requests, never contacts anyone for you,
          and never writes to your Health History or Medical Records. Voice availability may vary by language and
          service availability. Audio is used for transcription and is not stored in Warrior AI records.
        </p>
      </Card>
    </section>
  );
};
