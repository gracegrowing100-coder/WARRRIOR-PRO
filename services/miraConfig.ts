// Mira by WARRIOR AI — shared assistant configuration.
//
// Imported by both the Express backend and the React client, so this file must
// stay free of Node and browser APIs.
//
// Provider capability honesty rule: a language is marked 'verified' only when
// at least one configured provider has passed the required capability check.

export type MiraLanguageCode = 'en' | 'ha' | 'ig' | 'yo' | 'pcm';

export type MiraVoiceCapability = 'verified' | 'provider-limited';

export interface MiraLanguageDefinition {
  code: MiraLanguageCode;
  label: string;
  /** Provider language hint. null when the provider does not document the language. */
  speechHint: string | null;
  speechToText: MiraVoiceCapability;
  textToSpeech: MiraVoiceCapability;
}

export const MIRA_LANGUAGES: MiraLanguageDefinition[] = [
  {
    code: 'en',
    label: 'English',
    speechHint: 'en-GB',
    speechToText: 'verified',
    textToSpeech: 'verified',
  },
  {
    code: 'ha',
    label: 'Hausa',
    speechHint: 'ha-NG',
    speechToText: 'verified',
    textToSpeech: 'verified',
  },
  {
    code: 'ig',
    label: 'Igbo',
    speechHint: null,
    speechToText: 'verified',
    textToSpeech: 'verified',
  },
  {
    code: 'yo',
    label: 'Yorùbá',
    speechHint: null,
    speechToText: 'verified',
    textToSpeech: 'verified',
  },
  {
    code: 'pcm',
    label: 'Nigerian Pidgin',
    speechHint: null,
    speechToText: 'verified',
    textToSpeech: 'verified',
  },
];

export const DEFAULT_MIRA_LANGUAGE: MiraLanguageCode = 'en';

export const MIRA_LANGUAGE_STORAGE_KEY = 'warrior_mira_language';
export const MIRA_VOICE_CAPABILITY_KEY = 'warrior_mira_voice_enabled';

/** Text chat is offered in every Mira language; generated text is not clinically reviewed. */
export const MIRA_TEXT_CHAT_NOTE =
  'Mira can reply in the language you choose. AI replies can contain mistakes and have not been reviewed by a clinician.';

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
