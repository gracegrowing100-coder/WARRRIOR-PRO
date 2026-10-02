// Mira by WARRIOR AI — shared assistant configuration.
//
// Imported by both the Express backend and the React client, so this file must
// stay free of Node and browser APIs.
//
// Provider capability honesty rule: a language is marked 'verified' only when
// at least one configured provider has passed the required capability check.
// Documented-but-unverified YarnGPT languages stay 'provider-limited'.

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
      'English voice input and spoken replies passed live YarnGPT checks. Nigerian English is not a separately documented variant, so the Gemini fallback hint uses en-GB.',
  },
  {
    code: 'ha',
    label: 'Hausa',
    speechHint: 'ha-NG',
    speechToText: 'verified',
    textToSpeech: 'verified',
    voiceDetail:
      'Hausa spoken replies passed live YarnGPT checks. YarnGPT speech-to-text did not retain usable text in the human-sample check, so voice input keeps the previously verified Gemini ha-NG path.',
  },
  {
    code: 'ig',
    label: 'Igbo',
    speechHint: null,
    speechToText: 'verified',
    textToSpeech: 'verified',
    voiceDetail:
      'Igbo voice input and spoken replies passed live YarnGPT checks; the human-sample transcript retained the main meaning with some substitutions and truncation.',
  },
  {
    code: 'yo',
    label: 'Yorùbá',
    speechHint: null,
    speechToText: 'verified',
    textToSpeech: 'verified',
    voiceDetail:
      'Yorùbá voice input and spoken replies passed live YarnGPT checks; the human-sample transcript retained the main meaning with minor substitutions.',
  },
  {
    code: 'pcm',
    label: 'Nigerian Pidgin',
    speechHint: null,
    speechToText: 'verified',
    textToSpeech: 'verified',
    voiceDetail:
      'Nigerian Pidgin voice input passed a genuine human-sample YarnGPT check with the meaning retained, and spoken replies returned playable audio without a language-code assumption.',
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
