import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, HeartPulse, MessageSquarePlus, Mic, Pause, Pencil, Play, RotateCcw, Send, Settings2, ShieldAlert, Square, Volume2 } from 'lucide-react';
import { Alert, Button, Card, FormField, IconButton, Modal, SelectInput, Textarea } from '../ui';
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

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MIRA_INTRO_DISMISSED_KEY = 'warrior_mira_preferences_intro_dismissed';
const MIRA_SPOKEN_REPLIES_KEY = 'warrior_mira_spoken_replies';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(() => localStorage.getItem(MIRA_INTRO_DISMISSED_KEY) === 'true');
  const [spokenRepliesEnabled, setSpokenRepliesEnabled] = useState(() => localStorage.getItem(MIRA_SPOKEN_REPLIES_KEY) !== 'false');

  const conversationRef = useRef<string>('');
  const startedConversationRef = useRef<string>('');
  const recordingRef = useRef<MiraRecording | null>(null);
  const playbackRef = useRef<MiraAudioPlayback | null>(null);
  const speechOperationRef = useRef(0);
  const languageRef = useRef<MiraLanguageCode>(language);
  const activeUserRef = useRef(userId);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Only auto-scroll if user is already near the bottom (reading recent messages)
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

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
      if (!voiceAvailable || !spokenRepliesEnabled || miraVoiceCapability(languageRef.current, 'textToSpeech') !== 'verified') return true;
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
    [spokenRepliesEnabled, voiceAvailable],
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

  const dismissPreferencesIntro = useCallback(() => {
    setIntroDismissed(true);
    localStorage.setItem(MIRA_INTRO_DISMISSED_KEY, 'true');
  }, []);

  const toggleSpokenReplies = useCallback(() => {
    setSpokenRepliesEnabled((enabled) => {
      const next = !enabled;
      localStorage.setItem(MIRA_SPOKEN_REPLIES_KEY, String(next));
      if (!next) stopPlayback();
      return next;
    });
  }, [stopPlayback]);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text || busy) return;
    stopPlayback();
    setInputText('');
    await runTurn(text, 'text');
  };

  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant');
  const currentUrgentMessageId = escalation?.urgency === 'urgent' ? lastAssistantMessage?.id : undefined;

  return (
    <section aria-labelledby="mira-heading" className="space-y-4" data-semantic>
      <Card as="section" padding="none" className="flex min-h-[calc(100dvh-15rem)] flex-col overflow-hidden border-line/80 shadow-none">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action-accent text-white shadow-sm">
              <HeartPulse size={22} />
            </span>
            <div className="min-w-0">
              <h2 id="mira-heading" className="text-heading-3 text-foreground">Mira</h2>
              <p className="truncate text-caption text-foreground-secondary">AI sickle-cell assistant</p>
              <span className="sr-only">by WARRIOR AI</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="New chat"
              onClick={startNewChat}
              disabled={busy || loadingConversation}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control px-3 text-small font-semibold text-foreground-secondary transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageSquarePlus size={19} aria-hidden="true" />
              <span className="hidden sm:inline">New chat</span>
            </button>
            <IconButton label="Mira settings" icon={<Settings2 size={19} />} onClick={() => setSettingsOpen(true)} />
          </div>
        </header>

        <div className="border-b border-line bg-medical-50 dark:bg-medical-900/20 px-4 py-2.5 text-small text-foreground-secondary dark:text-foreground sm:px-5">
          <span className="font-semibold text-foreground dark:text-foreground">Mira is an AI assistant, not a doctor.</span>{' '}
          <span className="text-foreground-secondary dark:text-foreground-secondary">It can make mistakes and will tell you when human review is needed.</span>
        </div>

        <div
          ref={messagesContainerRef}
          role="log"
          aria-live="polite"
          aria-label="Mira conversation"
          className="min-h-[22rem] flex-1 space-y-4 overflow-y-auto overflow-x-hidden bg-canvas/70 px-3 py-5 sm:px-5 scroll-smooth"
        >
          {!introDismissed && (
            <Card surface="subtle" className="mx-auto max-w-xl border-medical-100 shadow-none">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-medical-50 text-action-accent">
                  <Settings2 size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-body font-semibold text-foreground">Make Mira yours</h3>
                  <p className="mt-1 text-small text-foreground-secondary">Choose your language and whether you want spoken replies.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => { dismissPreferencesIntro(); setSettingsOpen(true); }}>Set preferences</Button>
                    <Button size="sm" variant="ghost" onClick={dismissPreferencesIntro}>Not now</Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {loadingConversation && (
            <div role="status" className="flex items-center gap-2 text-small text-foreground-secondary">
              <span className="h-2 w-2 rounded-full bg-action-accent" aria-hidden="true" />
              Loading your conversation…
            </div>
          )}

          {!loadingConversation && messages.length === 0 && (
            <div className="mx-auto max-w-md py-8 text-center">
              <span aria-hidden="true" className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface text-action-accent shadow-surface">
                <HeartPulse size={25} />
              </span>
              <h3 className="mt-4 text-heading-3 text-foreground">How can I support you?</h3>
              <p className="mt-2 text-small text-foreground-secondary">Ask about daily sickle-cell support, hydration, pain, medication routines, or preparing for an appointment.</p>
            </div>
          )}

          {messages.map((message) => {
            const timestamp = formatMessageTime(message.createdAt);
            const isUrgentAssistant = message.id === currentUrgentMessageId;

            if (isUrgentAssistant) {
              return (
                <div key={message.id} className="flex max-w-[94%] items-end gap-2">
                  <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action-accent text-white"><HeartPulse size={16} /></span>
                  <Alert tone="danger" title="This may need emergency care now" live="assertive" icon={<ShieldAlert size={20} />} className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap">{message.text || emergencyGuidance}</p>
                    <p className="mt-2 font-medium text-status-danger-text">Mira has not contacted anyone on your behalf. No appointment has been submitted, and nothing has been written to your health or medical records.</p>
                  </Alert>
                </div>
              );
            }

            if (message.role === 'user') {
              return (
                <div key={message.id} className="flex justify-end">
                  <article className="max-w-[80%] rounded-[1.25rem] rounded-br-md bg-action-accent px-4 py-3 text-white shadow-floating">
                    <span className="sr-only">You</span>
                    <p className="whitespace-pre-wrap text-body">{message.text}</p>
                    <p className="mt-1.5 text-right text-caption text-white/70">{message.source === 'voice' ? 'Voice' : 'Sent'}{timestamp ? ` · ${timestamp}` : ''}</p>
                  </article>
                </div>
              );
            }

            return (
              <div key={message.id} className="flex max-w-[92%] items-end gap-2">
                <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-medical-100 text-action-accent"><HeartPulse size={16} /></span>
                <article className="min-w-0 rounded-[1.25rem] rounded-bl-md border border-line/60 bg-surface px-4 py-3 shadow-subtle">
                  <div className="flex items-center gap-2 text-caption font-medium text-foreground-secondary">
                    <span>Mira</span><span className="rounded-pill bg-medical-50 px-2 py-0.5 text-action-accent text-[10px]">AI</span>
                    <span className="sr-only">Mira (AI)</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-body text-foreground">{message.text}</p>
                  {timestamp && <p className="mt-1.5 text-caption text-foreground-secondary">{timestamp}</p>}
                </article>
              </div>
            );
          })}

          {(status === 'sending' || status === 'thinking') && (
            <div role="status" aria-live="polite" className="flex items-end gap-2">
              <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-action-accent text-white"><HeartPulse size={16} /></span>
              <div className="rounded-[1.25rem] rounded-bl-md border border-line bg-surface px-4 py-3 text-small text-foreground-secondary shadow-surface">
                {STATUS_LABELS[status]}
              </div>
            </div>
          )}
        </div>

        {(errorMessage || saveNotice || escalation?.urgency === 'specialist') && (
          <div className="space-y-2 border-t border-line bg-surface px-3 py-3 sm:px-5">
            {errorMessage && <Alert tone="danger" title="Mira could not complete that" live="assertive">{errorMessage}</Alert>}
            {saveNotice && <Alert tone="warning" title="Conversation save status" live="polite">{saveNotice}</Alert>}
            {escalation?.urgency === 'specialist' && (
              <Alert tone="warning" title="A hematology review may help" live="polite">
                <p>{escalation.reason}</p>
                <p className="mt-2">Review Mira&apos;s draft below before sharing anything with your care team.</p>
              </Alert>
            )}
          </div>
        )}

        {(status === 'recording' || status === 'transcribing' || status === 'reviewing-transcript') && (
          <div className="border-t border-line bg-surface px-3 py-3 sm:px-5">
            {status === 'recording' && (
              <Alert tone="info" title="Listening..." live="polite" icon={<Mic size={20} />} action={<Button type="button" variant="danger" leadingIcon={<Square size={17} />} onClick={() => void finishRecording()}>Stop recording</Button>}>
                <span className="font-semibold tabular-nums">{formatRecordingTime(recordingSeconds)}</span><span className="ml-2">Microphone active</span>
              </Alert>
            )}
            {status === 'transcribing' && <Alert tone="info" title="Transcribing your message..." live="polite">Keep this screen open for a moment.</Alert>}
            {status === 'reviewing-transcript' && (
              <section aria-labelledby="mira-transcript-review-title" className="space-y-3 rounded-card border border-medical-100 bg-medical-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 id="mira-transcript-review-title" className="text-body font-semibold text-foreground">You said:</h3>
                    <p className="text-caption text-foreground-secondary">Review before sending.</p>
                  </div>
                  <Check size={19} className="text-status-success-text" aria-hidden="true" />
                </div>
                {editingTranscript ? (
                  <FormField label="Edit transcript"><Textarea rows={3} value={transcriptDraft} onChange={(event) => setTranscriptDraft(event.target.value)} aria-label="Edit voice transcript" /></FormField>
                ) : (
                  <p className="whitespace-pre-wrap rounded-control bg-surface px-4 py-3 text-body text-foreground">“{transcriptDraft}”</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" leadingIcon={<Pencil size={16} />} onClick={() => setEditingTranscript(true)} disabled={editingTranscript}>Edit</Button>
                  <Button type="button" size="sm" leadingIcon={<Send size={16} />} onClick={() => void sendReviewedTranscript()} disabled={transcriptDraft.trim().length === 0}>Send to Mira</Button>
                  <Button type="button" size="sm" variant="ghost" leadingIcon={<RotateCcw size={16} />} onClick={() => void recordAgain()}>Record again</Button>
                </div>
              </section>
            )}
          </div>
        )}

        <form onSubmit={handleSend} className="border-t border-line/60 bg-surface px-3 py-3 sm:px-5" noValidate>
          <label htmlFor="mira-message-composer" className="sr-only">Your message to Mira</label>
          <div className="flex items-end gap-1.5 rounded-xl border border-line/60 bg-surface-subtle p-1.5 focus-within:border-action-accent focus-within:ring-2 focus-within:ring-medical-100 shadow-floating transition-all duration-150">
            <Textarea
              id="mira-message-composer"
              rows={1}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Type a message…"
              aria-label="Message to Mira"
              disabled={busy}
              className="min-h-12 max-h-32 resize-none border-0 bg-transparent px-3 py-3 focus-visible:outline-none"
            />
            {voiceAvailable && (
              <IconButton
                label={`Speak to Mira in ${languageDefinition.label}`}
                icon={<Mic size={20} />}
                variant="ghost"
                onClick={() => void handleMicrophone()}
                disabled={busy || !speechInputVerified}
                title={speechInputVerified ? undefined : `Voice input is not available in ${languageDefinition.label} right now.`}
              />
            )}
            <IconButton label="Send message" icon={<Send size={20} />} type="submit" disabled={busy || inputText.trim().length === 0} className="bg-action-accent text-white hover:bg-action-accent-hover" />
          </div>
          <div className="mt-2 flex min-h-6 flex-wrap items-center justify-between gap-2 text-caption text-foreground-secondary">
            <span>{status === 'speaking' ? (speechStage === 'preparing' ? 'Preparing spoken reply...' : playbackPaused ? 'Spoken reply paused' : 'Playing Mira’s reply') : `${languageDefinition.label} conversation`}</span>
            <div className="flex flex-wrap items-center gap-1">
              {status === 'speaking' && speechStage === 'playing' && (
                <Button type="button" size="sm" variant="ghost" leadingIcon={playbackPaused ? <Play size={16} /> : <Pause size={16} />} onClick={() => void togglePlaybackPause()}>{playbackPaused ? 'Resume reply' : 'Pause reply'}</Button>
              )}
              {voiceAvailable && spokenRepliesEnabled && speechOutputVerified && lastAssistantMessage && (
                <Button type="button" size="sm" variant="ghost" leadingIcon={<Volume2 size={16} />} onClick={() => void speakReply(lastAssistantMessage.text)} disabled={status === 'speaking'}>Replay reply</Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {handoff && (
        <Card as="section" className="space-y-4 border-status-warning/30 shadow-none">
          <div>
            <h3 className="text-heading-3 text-foreground">Summary for human review</h3>
            <p className="mt-1 max-w-prose text-small text-foreground-secondary">{handoffLabel || 'AI-generated draft from your conversation. Review and edit before sharing.'}</p>
          </div>
          <FormField label="Draft summary to share with the clinic" helpText="Keep only what you want to share.">
            <Textarea rows={8} value={handoffText} onChange={(event) => setHandoffText(event.target.value)} aria-label="Draft handoff summary" />
          </FormField>
          <label className="flex min-h-11 items-start gap-3 text-small text-foreground">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={handoffApproved} onChange={(event) => setHandoffApproved(event.target.checked)} />
            <span>I reviewed this summary and approve using it in an appointment request.</span>
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => { setHandoff(null); setHandoffText(''); setHandoffApproved(false); }}>Discard draft</Button>
            <Button disabled={!handoffApproved || handoffText.trim().length === 0} onClick={() => onContinueToAppointment(handoffText.trim())}>Continue to appointment request</Button>
          </div>
          <p className="text-caption text-foreground-secondary">Nothing is sent until you review and submit the appointment request yourself.</p>
        </Card>
      )}

      <Modal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title="Mira settings"
        description="Choose how Mira speaks with you. Changes apply to your next message."
        presentation="bottom-sheet"
        size="sm"
      >
        <div className="space-y-5">
          <FormField label="Language" helpText={voiceHelpText}>
            <SelectInput value={language} onChange={handleLanguageChange} aria-label="Mira conversation language">
              {MIRA_LANGUAGES.map((entry) => <option key={entry.code} value={entry.code}>{entry.label}</option>)}
            </SelectInput>
          </FormField>
          <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface-subtle p-4">
            <div>
              <p className="text-body font-semibold text-foreground">Spoken replies</p>
              <p className="mt-1 text-small text-foreground-secondary">Play Mira&apos;s reply after a voice message.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={spokenRepliesEnabled}
              onClick={toggleSpokenReplies}
              data-ui-control
              className={`relative h-8 w-14 shrink-0 rounded-pill transition-colors ${spokenRepliesEnabled ? 'bg-action-accent' : 'bg-line-strong'}`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${spokenRepliesEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              <span className="sr-only">{spokenRepliesEnabled ? 'On' : 'Off'}</span>
            </button>
          </div>
          {!voiceAvailable && <Alert tone="neutral" title="Voice is unavailable">Text chat with Mira is still available.</Alert>}
          {voiceAvailable && !speechInputVerified && <Alert tone="warning" title="Voice input is unavailable in this language">You can type your message in {languageDefinition.label}.</Alert>}
        </div>
      </Modal>
    </section>
  );
};
