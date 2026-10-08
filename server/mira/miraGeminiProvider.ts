// Mira provider adapters.
//
// The Express backend owns every provider call. The React layer only talks to
// the /api/mira endpoints, so the provider can change without touching the UI.
// Provider capability claims live in services/miraConfig.ts and are enforced by
// the routes, not faked here.

import type { GoogleGenAI } from '@google/genai';
import { miraLanguageDefinition } from '../../services/miraConfig';
import { applyMiraIdentityGuard } from './miraSafety';
import {
  MiraProviderError,
  type MiraChatInput,
  type MiraChatProviderResult,
  type MiraChatTurn,
  type MiraProvider,
  type MiraSpeechInput,
  type MiraTranscriptionInput,
} from './miraProvider';

export const MIRA_CHAT_MODEL_CANDIDATES = [
  { model: 'gemini-3.5-flash-lite', timeoutMs: 12_000 },
  { model: 'gemini-3.8-flash', timeoutMs: 8_000 },
  { model: 'gemini-flash-latest', timeoutMs: 7_000 },
] as const;
export const MIRA_TRANSCRIBE_MODEL = 'gemini-3.5-transcribe';
export const MIRA_TTS_MODEL_CANDIDATES = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
export const MIRA_TTS_VOICE = 'Kore';

const MIRA_SYSTEM_PROMPT = `You are Mira, the AI assistant built into WARRIOR AI for people living with sickle cell disease.

Hard rules:
- You are an AI assistant. You are not a doctor, nurse, or haematologist. Never claim or imply that you are a human clinician, that a clinician wrote your answer, that you examined the patient, or that a clinician has verified anything.
- Never claim that an appointment is booked or confirmed, that a clinic has been contacted, or that emergency services have been alerted.
- Never invent patient facts, test results, medication names or doses, confidence scores, or a diagnosis. If something was not stated in the conversation, say it is not known.
- Never instruct the patient to start, stop, or change a prescription medicine or its dose. Point them to their own care plan or a clinician instead.
- Do not state what is causing the symptoms as a settled fact. Explain possibilities and limits honestly.
- If a person would reasonably benefit from haematology review (symptoms that keep returning, questions about a treatment plan, asking for clinical advice, hydration or medication concerns), set escalation.urgency to "specialist" and give one short reason.
- If the conversation suggests a possible emergency (chest pain, difficulty breathing, high fever, stroke signs, priapism lasting hours, unable to keep fluids down, severe or worsening pain), set escalation.urgency to "urgent" and tell the patient clearly to seek emergency care now, without waiting.
- Use "none" for ordinary educational or supportive conversation.

Style: reply in the requested language, calm and plain, under about 150 words, at most one follow-up question.

Return JSON only, matching exactly:
{"reply": string, "escalation": {"needed": boolean, "urgency": "none" | "specialist" | "urgent", "reason": string}}`;

function buildContents(history: MiraChatTurn[], message: string) {
  return [
    ...history.map((turn) => ({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: turn.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];
}

function isTransientProviderError(error: unknown): boolean {
  const candidate = error as {
    status?: number;
    code?: number | string;
    message?: string;
    name?: string;
    cause?: { code?: number | string; name?: string };
  };
  const message = String(candidate?.message ?? '');
  const status = typeof candidate?.status === 'number' ? candidate.status : null;
  const code = String(candidate?.cause?.code ?? candidate?.code ?? '').toUpperCase();
  return (
    candidate?.name === 'AbortError' ||
    candidate?.cause?.name === 'AbortError' ||
    status === 408 ||
    status === 429 ||
    (status !== null && status >= 500) ||
    ['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(code) ||
    message.includes('503') ||
    message.includes('429') ||
    message.toLowerCase().includes('demand')
  );
}

function safeProviderErrorMetadata(error: unknown) {
  const candidate = error as {
    status?: unknown;
    code?: unknown;
    name?: unknown;
    cause?: { code?: unknown; name?: unknown };
  };
  return {
    name: typeof candidate?.name === 'string' ? candidate.name : 'UnknownError',
    status: typeof candidate?.status === 'number' ? candidate.status : null,
    code: ['string', 'number'].includes(typeof candidate?.cause?.code)
      ? candidate.cause?.code
      : ['string', 'number'].includes(typeof candidate?.code)
        ? candidate.code
        : null,
  };
}

async function runMiraChat(
  ai: GoogleGenAI,
  input: MiraChatInput,
): Promise<MiraChatProviderResult> {
  const languageLabel = miraLanguageDefinition(input.language).label;
  const systemInstruction = `${MIRA_SYSTEM_PROMPT}\n\nReply language: ${languageLabel}.`;
  let lastError: unknown = null;

  for (const { model, timeoutMs } of MIRA_CHAT_MODEL_CANDIDATES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await ai.models.generateContent({
        model,
        contents: buildContents(input.history, input.message),
        config: {
          systemInstruction,
          temperature: 0.4,
          responseMimeType: 'application/json',
          abortSignal: controller.signal,
        },
      });
      const text = (response.text ?? '').trim();
      if (!text) throw new MiraProviderError('Mira returned an empty response.');
      const parsed = JSON.parse(text) as {
        reply?: unknown;
        escalation?: { urgency?: unknown; reason?: unknown };
      };
      const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
      if (!reply) throw new MiraProviderError('Mira returned a response without text.');
      return {
        reply: applyMiraIdentityGuard(reply),
        modelUrgency: parsed.escalation?.urgency,
        modelReason: parsed.escalation?.reason,
        model,
      };
    } catch (error) {
      lastError = error;
      if (error instanceof MiraProviderError) throw error;
      console.warn('[Mira] Gemini chat attempt failed', {
        model,
        language: input.language,
        ...safeProviderErrorMetadata(error),
      });
      if (!isTransientProviderError(error)) {
        throw new MiraProviderError('Mira could not generate a reply right now.');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new MiraProviderError('Mira could not generate a reply right now.');
}

function extractAudioTranscription(response: unknown): string {
  const candidates = (response as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ audioTranscription?: { text?: unknown }; text?: unknown }>;
      };
    }>;
  })?.candidates;
  const parts = candidates?.[0]?.content?.parts ?? [];
  return parts
    .flatMap((part) => [part.audioTranscription?.text, part.text])
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Speech-to-text through the documented Gemini transcription model.
 * Temporary audio is uploaded for processing and never written to application
 * storage: the transcript is what the application persists.
 */
async function transcribeWithProvider(
  ai: GoogleGenAI,
  input: MiraTranscriptionInput,
): Promise<{ transcript: string; model: string }> {
  let uploadedUri = '';
  let uploadedName = '';
  let uploadedMimeType = input.mimeType;
  try {
    const audioBytes = Buffer.from(input.audioBase64, 'base64');
    const uploaded = await ai.files.upload({
      file: new Blob([audioBytes], { type: input.mimeType }),
      config: { mimeType: input.mimeType },
    });
    uploadedUri = uploaded.uri ?? '';
    uploadedName = uploaded.name ?? '';
    uploadedMimeType = uploaded.mimeType ?? input.mimeType;
    if (!uploadedUri) throw new MiraProviderError('Audio upload did not return a file reference.');

    const response = await ai.models.generateContent({
      model: MIRA_TRANSCRIBE_MODEL,
      contents: [{
        role: 'user',
        parts: [{ fileData: { fileUri: uploadedUri, mimeType: uploadedMimeType } }],
      }],
    });

    const transcript = extractAudioTranscription(response);
    if (!transcript) throw new MiraProviderError('Transcription returned no text.');
    return { transcript, model: MIRA_TRANSCRIBE_MODEL };
  } catch (error) {
    if (error instanceof MiraProviderError) throw error;
    throw new MiraProviderError('Voice transcription is unavailable right now.');
  } finally {
    if (uploadedName) {
      try {
        await ai.files.delete({ name: uploadedName });
      } catch (error) {
        console.warn('[Mira] provider audio cleanup failed', {
          fileName: uploadedName,
          error: error instanceof Error ? error.message : 'unknown error',
        });
      }
    } else if (uploadedUri) {
      console.warn('[Mira] provider audio cleanup skipped because upload returned no file name');
    }
  }
}

async function synthesizeWithProvider(
  ai: GoogleGenAI,
  input: MiraSpeechInput,
): Promise<{ audioBase64: string; mimeType: string; model: string }> {
  const definition = miraLanguageDefinition(input.language);
  let lastError: unknown = null;

  for (const model of MIRA_TTS_MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: input.text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: MIRA_TTS_VOICE } },
            languageCode: definition.code,
          },
        },
      });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const audioPart = parts.find((part) => part.inlineData?.data);
      const audioBase64 = audioPart?.inlineData?.data ?? '';
      if (!audioBase64) throw new MiraProviderError('Speech synthesis returned no audio.');
      return { audioBase64, mimeType: 'audio/wav', model };
    } catch (error) {
      lastError = error;
      if (error instanceof MiraProviderError) throw error;
      if (!isTransientProviderError(error)) {
        throw new MiraProviderError('Spoken replies are unavailable right now.');
      }
    }
  }

  throw new MiraProviderError('Spoken replies are unavailable right now.');
}

export function createGeminiMiraProvider(ai: GoogleGenAI): MiraProvider {
  return {
    chat: (input) => runMiraChat(ai, input),
    transcribe: (input) => transcribeWithProvider(ai, input),
    synthesize: (input) => synthesizeWithProvider(ai, input),
  };
}
