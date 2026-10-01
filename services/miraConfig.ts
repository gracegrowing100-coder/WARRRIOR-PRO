// Mira by WARRIOR AI — shared assistant configuration.
//
// Imported by both the Express backend and the React client, so this file must
// stay free of Node and browser APIs.
//
// Provider capability honesty rule: a language is marked 'verified' only when
// the current speech provider (Gemini 3.5 Transcribe / Gemini 3.8 Flash TTS)
// documents support for it. Everything else stays 'provider-limited' and voice
// is not simulated.

export type MiraLanguageCode = 'en' | 'ha' | 'ig' | 'yo' | 'pcm';

export type MiraVoiceCapability = 'verified' | 'provider-limited';

export interface MiraLanguageDefinition {
  code: MiraLanguageCode;
  label: string;
  /** Provider language hint. null when the provider does not document the language. */
  speechHint: string | null;
  speechToText: MiraVoiceCapability;
  textToSpeech: MiraVoiceCapability;
  voiceDetail: string;
}

export const MIRA_LANGUAGES: MiraLanguageDefinition[] = [
  {
    code: 'en',
    label: 'English',
    speechHint: 'en-GB',
    speechToText: 'verified',
    textToSpeech: 'verified',
    voiceDetail:
      'English voice input and spoken replies are documented by the current speech provider. Nigerian English is not a separately documented variant, so the provider hint uses en-GB.',
  },
  {
    code: 'ha',
    label: 'Hausa',
    speechHint: 'ha-NG',
    speechToText: 'verified',
    textToSpeech: 'verified',
    voiceDetail:
      'Hausa is documented for speech-to-text (ha-NG) and for spoken replies by the current speech provider.',
  },
  {
    code: 'ig',
    label: 'Igbo',
    speechHint: null,
    speechToText: 'provider-limited',
    textToSpeech: 'verified',
    voiceDetail:
      'Spoken Igbo replies are documented by the current speech provider. Igbo speech-to-text is not in the provider language list, so voice input is unavailable for Igbo.',
  },
  {
    code: 'yo',
    label: 'Yorùbá',
    speechHint: null,
    speechToText: 'provider-limited',
    textToSpeech: 'provider-limited',
    voiceDetail:
      'Yorùbá is not documented for the current speech provider, so voice input and spoken replies are unavailable. Text chat still works.',
  },
  {
    code: 'pcm',
    label: 'Nigerian Pidgin',
    speechHint: null,
    speechToText: 'provider-limited',
    textToSpeech: 'provider-limited',
    voiceDetail:
      'Nigerian Pidgin is not documented for the current speech provider, so voice input and spoken replies are unavailable. Text chat still works.',
  },
];

export const DEFAULT_MIRA_LANGUAGE: MiraLanguageCode = 'en';

export const MIRA_LANGUAGE_STORAGE_KEY = 'warrior_mira_language';
export const MIRA_VOICE_CAPABILITY_KEY = 'warrior_mira_voice_enabled';

/** Text chat is offered in every Mira language; generated text is not clinically reviewed. */
export const MIRA_TEXT_CHAT_NOTE =
  'Mira replies in the language you choose using an AI model. Replies have not been reviewed by a clinician.';

export function isMiraLanguageCode(value: unknown): value is MiraLanguageCode {
  return typeof value === 'string' && MIRA_LANGUAGES.some((entry) => entry.code === value);
}

export function miraLanguageDefinition(code: MiraLanguageCode): MiraLanguageDefinition {
  return MIRA_LANGUAGES.find((entry) => entry.code === code) ?? MIRA_LANGUAGES[0];
}

export function miraVoiceCapability(
  code: MiraLanguageCode,
  mode: 'speechToText' | 'textToSpeech',
): MiraVoiceCapability {
  return miraLanguageDefinition(code)[mode];
}

/**
 * Neutral voice capability gate. Patient V1 keeps it enabled by default, and
 * an explicit 'false' override (stored by the client, or the
 * MIRA_VOICE_ENABLED env var on the server) locks voice without simulating it.
 */
export function resolveMiraVoiceCapability(override?: string | null): boolean {
  return override !== 'false';
}
