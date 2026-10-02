import { randomUUID } from 'node:crypto';
import type { MiraLanguageCode } from '../../services/miraConfig';
import {
  MiraProviderError,
  type MiraSpeechInput,
  type MiraTranscriptionInput,
  type MiraVoiceProvider,
} from './miraProvider';

export const YARNGPT_BASE_URL = 'https://api.yarngpt.ai';
export const YARNGPT_ASR_MODEL = 'yarngpt-asr-v1';
export const YARNGPT_TTS_MODEL = 'yarngpt-streaming-conversation-v1';

type FetchLike = typeof fetch;
type SleepLike = (milliseconds: number) => Promise<void>;

export interface YarnGptProviderOptions {
  apiKey: string;
  fetchImpl?: FetchLike;
  sleep?: SleepLike;
  pollIntervalMs?: number;
  maxPolls?: number;
}

const LANGUAGE_ALIASES: Record<MiraLanguageCode, string[]> = {
  en: ['en', 'english'],
  ha: ['ha', 'hausa'],
  ig: ['ig', 'igbo'],
  yo: ['yo', 'yoruba', 'yorùbá'],
  pcm: ['pcm', 'pidgin', 'nigerian pidgin', 'naija pidgin'],
};

const TRANSIENT_HTTP_STATUSES = new Set([500, 502, 503, 504]);
const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ENETDOWN',
  'ENETUNREACH',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

function normalized(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('en');
}

function supportsLanguage(values: unknown[], language: MiraLanguageCode): boolean {
  const aliases = LANGUAGE_ALIASES[language];
  const labels = values.flatMap((value) => {
    if (!value || typeof value !== 'object') return [value];
    const record = value as Record<string, unknown>;
    return [record.code, record.name, record.language, record.language_code];
  });
  return labels.some((value) => {
    const candidate = normalized(value);
    return aliases.some((alias) => {
      const expected = normalized(alias);
      return candidate === expected || candidate.startsWith(`${expected} `) || candidate.includes(`(${expected})`);
    });
  });
}

function extensionForMime(mimeType: string): string {
  const base = mimeType.split(';')[0].toLowerCase();
  if (base.includes('wav')) return 'wav';
  if (base.includes('mpeg') || base.includes('mp3')) return 'mp3';
  if (base.includes('ogg') || base.includes('opus')) return 'ogg';
  if (base.includes('mp4') || base.includes('m4a')) return 'm4a';
  if (base.includes('flac')) return 'flac';
  if (base.includes('aiff')) return 'aiff';
  return 'webm';
}

function errorMessage(payload: unknown, fallback: string): string {
  const error = (payload as { error?: { user_message?: unknown; code?: unknown } })?.error;
  if (typeof error?.user_message === 'string' && error.user_message.trim()) return error.user_message;
  return typeof error?.code === 'string' ? `${fallback} (${error.code})` : fallback;
}

async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function isTransientTransportError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { name?: unknown; code?: unknown; cause?: unknown };
  if (candidate.name === 'AbortError' || candidate.name === 'TimeoutError') return true;
  if (typeof candidate.code === 'string' && TRANSIENT_ERROR_CODES.has(candidate.code)) return true;
  if (candidate.cause && typeof candidate.cause === 'object') {
    const causeCode = (candidate.cause as { code?: unknown }).code;
    if (typeof causeCode === 'string' && TRANSIENT_ERROR_CODES.has(causeCode)) return true;
  }
  return error instanceof TypeError;
}

async function requestWithOneTransientRetry(
  request: () => Promise<Response>,
  unavailableMessage: string,
): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await request();
      if (attempt === 0 && TRANSIENT_HTTP_STATUSES.has(response.status)) continue;
      return response;
    } catch (error) {
      if (attempt === 0 && isTransientTransportError(error)) continue;
      if (isTransientTransportError(error)) throw new MiraProviderError(unavailableMessage);
      throw error;
    }
  }
  throw new MiraProviderError(unavailableMessage);
}

export function createYarnGptVoiceProvider(options: YarnGptProviderOptions): MiraVoiceProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const pollIntervalMs = options.pollIntervalMs ?? 1000;
  const maxPolls = options.maxPolls ?? 90;
  const authorization = `Bearer ${options.apiKey}`;
  let asrLanguages: unknown[] | null = null;
  let voices: Array<Record<string, unknown>> | null = null;

  const authenticatedFetch = (path: string, init: RequestInit = {}) => fetchImpl(`${YARNGPT_BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: authorization },
  });

  const loadAsrLanguages = async (): Promise<unknown[]> => {
    if (asrLanguages) return asrLanguages;
    const response = await requestWithOneTransientRetry(
      () => authenticatedFetch('/api/v1/asr/languages'),
      'YarnGPT language availability is temporarily unavailable.',
    );
    const payload = await readJson(response);
    if (!response.ok) throw new MiraProviderError(errorMessage(payload, 'YarnGPT language availability could not be checked.'));
    const record = payload as { languages?: unknown };
    asrLanguages = Array.isArray(record?.languages) ? record.languages : [];
    return asrLanguages;
  };

  const loadVoices = async (): Promise<Array<Record<string, unknown>>> => {
    if (voices) return voices;
    const response = await requestWithOneTransientRetry(
      () => authenticatedFetch('/api/v1/voices'),
      'YarnGPT voices are temporarily unavailable.',
    );
    const payload = await readJson(response);
    if (!response.ok) throw new MiraProviderError(errorMessage(payload, 'YarnGPT voices could not be loaded.'));
    const candidates = Array.isArray(payload)
      ? payload
      : (payload as { voices?: unknown })?.voices;
    voices = Array.isArray(candidates)
      ? candidates.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
      : [];
    return voices;
  };

  const voiceForLanguage = async (language: MiraLanguageCode): Promise<string> => {
    const catalogue = await loadVoices();
    const matching = catalogue.filter((voice) => {
      const listed = Array.isArray(voice.languages) ? voice.languages : [voice.language, voice.language_code];
      return supportsLanguage(listed, language);
    });
    const selected = matching.find((voice) => voice.default === true) ?? matching[0];
    const name = selected?.name;
    if (typeof name !== 'string' || !name) {
      throw new MiraProviderError('YarnGPT has no listed voice for this language.');
    }
    return name;
  };

  return {
    async transcribe(input: MiraTranscriptionInput) {
      const supported = await loadAsrLanguages();
      if (!supportsLanguage(supported, input.language)) {
        throw new MiraProviderError('YarnGPT does not list speech recognition for this language.');
      }

      const bytes = Buffer.from(input.audioBase64, 'base64');
      const idempotencyKey = randomUUID();
      const upload = await requestWithOneTransientRetry(() => {
        const body = new FormData();
        body.append('file', new Blob([bytes], { type: input.mimeType }), `mira.${extensionForMime(input.mimeType)}`);
        return authenticatedFetch('/api/v1/asr', {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          body,
        });
      }, 'YarnGPT transcription upload is temporarily unavailable.');
      const uploadPayload = await readJson(upload);
      if (!upload.ok) throw new MiraProviderError(errorMessage(uploadPayload, 'YarnGPT transcription upload failed.'));
      const jobId = (uploadPayload as { job_id?: unknown })?.job_id;
      if (typeof jobId !== 'string' || !jobId) throw new MiraProviderError('YarnGPT returned no transcription job.');

      for (let attempt = 0; attempt < maxPolls; attempt += 1) {
        if (attempt > 0) await sleep(pollIntervalMs);
        const poll = await requestWithOneTransientRetry(
          () => authenticatedFetch(`/api/v1/asr/${encodeURIComponent(jobId)}`),
          'YarnGPT transcription status is temporarily unavailable.',
        );
        const payload = await readJson(poll);
        if (!poll.ok) throw new MiraProviderError(errorMessage(payload, 'YarnGPT transcription status failed.'));
        const result = payload as { status?: unknown; transcript?: unknown; error_message?: unknown };
        if (result.status === 'completed') {
          const transcript = typeof result.transcript === 'string' ? result.transcript.trim() : '';
          if (!transcript) throw new MiraProviderError('YarnGPT transcription returned no speech.');
          return { transcript, model: YARNGPT_ASR_MODEL };
        }
        if (result.status === 'failed') {
          throw new MiraProviderError(
            typeof result.error_message === 'string' ? result.error_message : 'YarnGPT transcription failed.',
          );
        }
      }
      throw new MiraProviderError('YarnGPT transcription timed out.');
    },

    async synthesize(input: MiraSpeechInput) {
      const voice = await voiceForLanguage(input.language);
      const idempotencyKey = randomUUID();
      const body = JSON.stringify({ text: input.text, voice, output_format: 'wav' });

      for (let attempt = 0; attempt < 2; attempt += 1) {
        let response: Response;
        try {
          response = await authenticatedFetch('/api/v1/streaming/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
            body,
          });
        } catch (error) {
          if (attempt === 0 && isTransientTransportError(error)) continue;
          if (isTransientTransportError(error)) {
            throw new MiraProviderError('YarnGPT speech synthesis is temporarily unavailable.');
          }
          throw error;
        }

        if (attempt === 0 && TRANSIENT_HTTP_STATUSES.has(response.status)) continue;
        if (!response.ok) {
          const payload = await readJson(response);
          throw new MiraProviderError(errorMessage(payload, 'YarnGPT speech synthesis failed.'));
        }

        const audio = Buffer.from(await response.arrayBuffer());
        if (audio.length === 0) {
          if (attempt === 0) continue;
          throw new MiraProviderError('YarnGPT returned empty speech audio.');
        }
        const mimeType = response.headers.get('content-type')?.split(';')[0] || 'audio/wav';
        return { audioBase64: audio.toString('base64'), mimeType, model: YARNGPT_TTS_MODEL };
      }

      throw new MiraProviderError('YarnGPT speech synthesis is temporarily unavailable.');
    },
  };
}
