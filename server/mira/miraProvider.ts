import type { MiraLanguageCode } from '../../services/miraConfig';

export class MiraProviderError extends Error {
  readonly code = 'provider_unavailable' as const;
  constructor(message: string) {
    super(message);
    this.name = 'MiraProviderError';
  }
}

export interface MiraChatTurn { role: 'user' | 'assistant'; text: string; }
export interface MiraChatInput { language: MiraLanguageCode; history: MiraChatTurn[]; message: string; }
export interface MiraChatProviderResult {
  reply: string;
  modelUrgency: unknown;
  modelReason: unknown;
  model: string;
}
export interface MiraTranscriptionInput { audioBase64: string; mimeType: string; language: MiraLanguageCode; }
export interface MiraSpeechInput { text: string; language: MiraLanguageCode; }

export interface MiraVoiceProvider {
  transcribe(input: MiraTranscriptionInput): Promise<{ transcript: string; model: string }>;
  synthesize(input: MiraSpeechInput): Promise<{ audioBase64: string; mimeType: string; model: string }>;
}

/** Provider-neutral server contract. The browser API does not depend on a vendor. */
export interface MiraProvider extends MiraVoiceProvider {
  chat(input: MiraChatInput): Promise<MiraChatProviderResult>;
}
