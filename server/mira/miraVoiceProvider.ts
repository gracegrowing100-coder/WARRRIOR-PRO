import type { MiraLanguageCode } from '../../services/miraConfig';
import { MiraProviderError, type MiraProvider, type MiraVoiceProvider } from './miraProvider';

export type MiraVoiceProviderId = 'yarngpt' | 'gemini';

export const MIRA_VOICE_PROVIDER_PREFERENCES: Record<
  MiraLanguageCode,
  { speechToText: MiraVoiceProviderId[]; textToSpeech: MiraVoiceProviderId[] }
> = {
  en: { speechToText: ['yarngpt', 'gemini'], textToSpeech: ['yarngpt', 'gemini'] },
  ha: { speechToText: ['gemini'], textToSpeech: ['yarngpt', 'gemini'] },
  ig: { speechToText: ['yarngpt'], textToSpeech: ['yarngpt', 'gemini'] },
  yo: { speechToText: ['yarngpt'], textToSpeech: ['yarngpt'] },
  pcm: { speechToText: ['yarngpt'], textToSpeech: ['yarngpt'] },
};

async function usePreferredProvider<T>(
  ids: MiraVoiceProviderId[],
  providers: Partial<Record<MiraVoiceProviderId, MiraVoiceProvider>>,
  call: (provider: MiraVoiceProvider) => Promise<T>,
): Promise<T> {
  for (const id of ids) {
    const provider = providers[id];
    if (!provider) continue;
    try {
      return await call(provider);
    } catch (error) {
      if (!(error instanceof MiraProviderError)) throw error;
    }
  }
  throw new MiraProviderError('Voice is unavailable for this language right now.');
}

export function createMiraProviderWithVoiceSelection(
  chatProvider: MiraProvider,
  providers: Partial<Record<MiraVoiceProviderId, MiraVoiceProvider>>,
): MiraProvider {
  return {
    chat: (input) => chatProvider.chat(input),
    transcribe: (input) => usePreferredProvider(
      MIRA_VOICE_PROVIDER_PREFERENCES[input.language].speechToText,
      providers,
      (provider) => provider.transcribe(input),
    ),
    synthesize: (input) => usePreferredProvider(
      MIRA_VOICE_PROVIDER_PREFERENCES[input.language].textToSpeech,
      providers,
      (provider) => provider.synthesize(input),
    ),
  };
}
