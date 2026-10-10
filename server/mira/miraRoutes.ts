// Mira API boundary.
//
// Every Mira request is authenticated with a Firebase ID token. The backend
// derives the UID from the verified token and never trusts a client-supplied
// user id. Provider secrets stay on the server; the browser only sees the
// /api/mira contract.

import type { Express, Request, Response } from 'express';
import {
  isMiraLanguageCode,
  miraLanguageDefinition,
  miraVoiceCapability,
  resolveMiraVoiceCapability,
  type MiraLanguageCode,
} from '../../services/miraConfig.ts';
import { authenticateMiraRequest } from './miraAuth.ts';
import {
  MIRA_EMERGENCY_GUIDANCE,
  MIRA_HANDOFF_LABEL,
  MIRA_URGENT_REPLY,
  buildMiraHandoffDraft,
  classifyMiraEscalation,
} from './miraSafety.ts';
import type { MiraProvider, MiraChatTurn } from './miraProvider.ts';

export const MIRA_MAX_MESSAGE_CHARS = 2000;
export const MIRA_MAX_HISTORY_TURNS = 8;
export const MIRA_MAX_HISTORY_TURN_CHARS = 1200;
export const MIRA_MAX_SPEAK_CHARS = 900;
export const MIRA_MAX_AUDIO_BASE64_CHARS = 4_000_000;
export const MIRA_PROVIDER_TIMEOUT_MS = 30_000;

const CONVERSATION_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/webm', 'audio/ogg', 'audio/opus', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
  'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/flac', 'audio/aiff', 'audio/l16', 'audio/alaw', 'audio/mulaw',
]);

const RATE_LIMITS = {
  chat: { max: 30, windowMs: 5 * 60_000 },
  voice: { max: 15, windowMs: 5 * 60_000 },
} as const;

export type MiraRateLimitKind = keyof typeof RATE_LIMITS;

const rateLimitBuckets = new Map<string, number[]>();

/** Test/reset helper. */
export function resetMiraRateLimits() {
  rateLimitBuckets.clear();
}

export function checkMiraRateLimit(
  uid: string,
  kind: MiraRateLimitKind,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  const { max, windowMs } = RATE_LIMITS[kind];
  const recent = (rateLimitBuckets.get(uid) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
    rateLimitBuckets.set(uid, recent);
    return { allowed: false, retryAfterSeconds };
  }
  recent.push(now);
  rateLimitBuckets.set(uid, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function isMiraVoiceEnabledOnServer(envValue: string | undefined = process.env.MIRA_VOICE_ENABLED): boolean {
  return resolveMiraVoiceCapability(envValue ?? null);
}

interface MiraRequestContext {
  uid: string;
}

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ error: { code, message } });
}

async function withAuthenticatedUser(
  req: Request,
  res: Response,
  projectId: string,
): Promise<MiraRequestContext | null> {
  const result = await authenticateMiraRequest(req as unknown as { headers: Record<string, unknown> }, { projectId });
  // Note: explicit `=== false` check — the repo's non-strict tsconfig does not
  // narrow this discriminated union through a negated truthiness test (`!result.ok`).
  if (result.ok === false) {
    sendError(
      res,
      result.status,
      result.code,
      result.code === 'auth_unavailable'
        ? 'Sign-in verification is temporarily unavailable. Please try again.'
        : 'Sign in again to use Mira.',
    );
    return null;
  }
  return { uid: result.uid };
}

function readString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

export function readMiraHistory(value: unknown): MiraChatTurn[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MIRA_MAX_HISTORY_TURNS) return null;
  const turns: MiraChatTurn[] = [];
  for (const entry of value) {
    if (entry === null || typeof entry !== 'object') return null;
    const record = entry as { role?: unknown; text?: unknown };
    const role = record.role === 'user' || record.role === 'assistant' ? record.role : null;
    const text = readString(record.text, MIRA_MAX_HISTORY_TURN_CHARS);
    if (!role || !text) return null;
    turns.push({ role, text });
  }
  return turns;
}

function normalizeAudioMimeType(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const base = value.split(';')[0].trim().toLowerCase();
  return ALLOWED_AUDIO_MIME_TYPES.has(base) ? base : null;
}

export interface MiraRouteOptions {
  getProvider: () => MiraProvider | null;
  projectId: string;
  providerTimeoutMs?: number;
}

async function withProviderTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Mira provider timed out.')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export function registerMiraRoutes(app: Express, options: MiraRouteOptions) {
  const providerTimeoutMs = options.providerTimeoutMs ?? MIRA_PROVIDER_TIMEOUT_MS;
  app.post('/api/mira/chat', async (req, res) => {
    const context = await withAuthenticatedUser(req, res, options.projectId);
    if (!context) return;

    const limit = checkMiraRateLimit(context.uid, 'chat');
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(limit.retryAfterSeconds));
      sendError(res, 429, 'rate_limited', 'Too many Mira messages in a short time. Please wait a moment and try again.');
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const language = body.language;
    if (!isMiraLanguageCode(language)) {
      sendError(res, 400, 'invalid_language', 'Choose one of the supported Mira languages.');
      return;
    }
    const message = readString(body.message, MIRA_MAX_MESSAGE_CHARS);
    if (!message) {
      sendError(res, 400, 'invalid_message', `Send a message between 1 and ${MIRA_MAX_MESSAGE_CHARS} characters.`);
      return;
    }
    const source = body.source === 'voice' ? 'voice' : 'text';
    const conversationId = body.conversationId;
    if (
      conversationId !== undefined &&
      (typeof conversationId !== 'string' || !CONVERSATION_ID_PATTERN.test(conversationId))
    ) {
      sendError(res, 400, 'invalid_conversation', 'The conversation reference is not valid.');
      return;
    }
    const history = readMiraHistory(body.history);
    if (history === null) {
      sendError(res, 400, 'invalid_history', 'The recent conversation could not be read.');
      return;
    }

    const recentPatientTurns = history.filter((turn) => turn.role === 'user').slice(-3).map((turn) => turn.text);
    const recentPatientMessages = [...recentPatientTurns, message];
    const deterministicEscalation = classifyMiraEscalation({
      userText: message,
      recentPatientTurns,
      language,
    });
    if (deterministicEscalation.urgency === 'urgent') {
      res.json({
        reply: MIRA_URGENT_REPLY,
        language,
        escalation: deterministicEscalation,
        handoff: null,
        handoffLabel: '',
        emergencyGuidance: MIRA_EMERGENCY_GUIDANCE,
        provider: { model: 'deterministic-safety' },
      });
      return;
    }

    const provider = options.getProvider();
    if (!provider) {
      sendError(
        res,
        503,
        'mira_unavailable',
        'Mira response service is not configured.',
      );
      return;
    }

    try {
      const result = await withProviderTimeout(
        provider.chat({ language, history, message }),
        providerTimeoutMs,
      );
      const escalation = classifyMiraEscalation({
        userText: message,
        recentPatientTurns,
        language,
        modelUrgency: result.modelUrgency,
        modelReason: result.modelReason,
      });
      const handoff = escalation.urgency === 'specialist'
        ? buildMiraHandoffDraft({ patientMessages: recentPatientMessages, escalation })
        : null;

      console.info('[Mira] chat completed', { language, source, urgency: escalation.urgency });
      res.json({
        reply: result.reply,
        language,
        escalation,
        handoff,
        handoffLabel: MIRA_HANDOFF_LABEL,
        emergencyGuidance: escalation.urgency === 'urgent' ? MIRA_EMERGENCY_GUIDANCE : null,
        provider: { model: result.model },
      });
    } catch {
      sendError(res, 503, 'mira_unavailable', 'Mira response service is temporarily unavailable. Please try again.');
    }
  });

  app.post('/api/mira/transcribe', async (req, res) => {
    const context = await withAuthenticatedUser(req, res, options.projectId);
    if (!context) return;

    const limit = checkMiraRateLimit(context.uid, 'voice');
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(limit.retryAfterSeconds));
      sendError(res, 429, 'rate_limited', 'Too many voice requests in a short time. Please wait a moment and try again.');
      return;
    }

    if (!isMiraVoiceEnabledOnServer()) {
      sendError(res, 403, 'voice_disabled', 'Voice is not enabled on this server.');
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const language = body.language;
    if (!isMiraLanguageCode(language)) {
      sendError(res, 400, 'invalid_language', 'Choose one of the supported Mira languages.');
      return;
    }
    const definition = miraLanguageDefinition(language);
    if (miraVoiceCapability(language, 'speechToText') !== 'verified') {
      sendError(res, 422, 'voice_language_unsupported', `Voice input is not available in ${definition.label} right now.`);
      return;
    }
    const mimeType = normalizeAudioMimeType(body.mimeType);
    if (!mimeType) {
      sendError(res, 400, 'invalid_audio_type', 'That audio format is not supported for transcription.');
      return;
    }
    const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64.trim() : '';
    if (!audioBase64 || audioBase64.length > MIRA_MAX_AUDIO_BASE64_CHARS) {
      sendError(res, 400, 'invalid_audio', 'Send a short voice clip (about one minute or less).');
      return;
    }

    const provider = options.getProvider();
    if (!provider) {
      sendError(res, 503, 'mira_unavailable', 'Voice service is not configured.');
      return;
    }

    try {
      const result = await withProviderTimeout(
        provider.transcribe({ audioBase64, mimeType, language }),
        providerTimeoutMs,
      );
      console.info('[Mira] transcription completed', { language, model: result.model });
      res.json({ transcript: result.transcript, language, provider: { model: result.model } });
    } catch {
      sendError(res, 503, 'mira_unavailable', 'Mira could not transcribe that recording. Please try again.');
    }
  });

  app.post('/api/mira/speak', async (req, res) => {
    const context = await withAuthenticatedUser(req, res, options.projectId);
    if (!context) return;

    const limit = checkMiraRateLimit(context.uid, 'voice');
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(limit.retryAfterSeconds));
      sendError(res, 429, 'rate_limited', 'Too many voice requests in a short time. Please wait a moment and try again.');
      return;
    }

    if (!isMiraVoiceEnabledOnServer()) {
      sendError(res, 403, 'voice_disabled', 'Voice is not enabled on this server.');
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const language = body.language;
    if (!isMiraLanguageCode(language)) {
      sendError(res, 400, 'invalid_language', 'Choose one of the supported Mira languages.');
      return;
    }
    const definition = miraLanguageDefinition(language);
    if (miraVoiceCapability(language, 'textToSpeech') !== 'verified') {
      sendError(res, 422, 'voice_language_unsupported', `Spoken replies are not available in ${definition.label} right now.`);
      return;
    }
    const text = readString(body.text, MIRA_MAX_SPEAK_CHARS);
    if (!text) {
      sendError(res, 400, 'invalid_text', `Send text between 1 and ${MIRA_MAX_SPEAK_CHARS} characters to be spoken.`);
      return;
    }

    const provider = options.getProvider();
    if (!provider) {
      sendError(res, 503, 'mira_unavailable', 'Voice service is not configured.');
      return;
    }

    try {
      const result = await withProviderTimeout(
        provider.synthesize({ text, language }),
        providerTimeoutMs,
      );
      console.info('[Mira] speech synthesized', { language, model: result.model });
      res.json({
        audioBase64: result.audioBase64,
        mimeType: result.mimeType,
        language,
        provider: { model: result.model },
      });
    } catch {
      sendError(res, 503, 'mira_unavailable', 'Mira could not create spoken audio. Please try again.');
    }
  });
}
