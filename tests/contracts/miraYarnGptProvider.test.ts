import { describe, expect, it, vi } from 'vitest';
import { MiraProviderError, type MiraProvider, type MiraVoiceProvider } from '../../server/mira/miraProvider';
import { createYarnGptVoiceProvider } from '../../server/mira/miraYarnGptProvider';
import {
  MIRA_VOICE_PROVIDER_PREFERENCES,
  createMiraProviderWithVoiceSelection,
} from '../../server/mira/miraVoiceProvider';

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('YarnGPT voice adapter', () => {
  it('authenticates, uploads multipart audio, polls, and normalizes STT', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ languages: ['English', 'Hausa', 'Igbo', 'Yoruba', 'Nigerian Pidgin'] }))
      .mockResolvedValueOnce(json({ job_id: 'asr-job-1', status: 'queued' }, 202))
      .mockResolvedValueOnce(json({ status: 'completed', transcript: 'How you dey today?' }));
    const provider = createYarnGptVoiceProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as typeof fetch,
      sleep: async () => undefined,
    });

    await expect(provider.transcribe({
      language: 'pcm',
      mimeType: 'audio/webm',
      audioBase64: Buffer.from('audio').toString('base64'),
    })).resolves.toMatchObject({ transcript: 'How you dey today?', model: 'yarngpt-asr-v1' });

    for (const [, init] of fetchImpl.mock.calls) {
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    }
    expect(fetchImpl.mock.calls[1][0]).toBe('https://api.yarngpt.ai/api/v1/asr');
    expect(fetchImpl.mock.calls[1][1].body).toBeInstanceOf(FormData);
    expect(fetchImpl.mock.calls[2][0]).toContain('/api/v1/asr/asr-job-1');
  });

  it('selects a listed language voice and normalizes playable TTS audio', async () => {
    const audio = Uint8Array.from([82, 73, 70, 70, 1, 2, 3]);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ voices: [{ name: 'yoruba-voice', languages: ['Yorùbá'], default: true }] }))
      .mockResolvedValueOnce(new Response(audio, { status: 200, headers: { 'Content-Type': 'audio/wav' } }));
    const provider = createYarnGptVoiceProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as typeof fetch,
      sleep: async () => undefined,
    });

    const result = await provider.synthesize({ language: 'yo', text: 'Báwo ni?' });
    expect(result).toMatchObject({ mimeType: 'audio/wav', model: 'yarngpt-streaming-conversation-v1' });
    expect(Buffer.from(result.audioBase64, 'base64')).toEqual(Buffer.from(audio));
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual({
      text: 'Báwo ni?',
      voice: 'yoruba-voice',
      output_format: 'wav',
    });
  });

  it('retries one zero-byte TTS response with the same idempotency key', async () => {
    const audio = Uint8Array.from([82, 73, 70, 70, 1, 2, 3]);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ voices: [{ name: 'english-voice', languages: ['English'] }] }))
      .mockResolvedValueOnce(new Response(new Uint8Array(), { status: 200, headers: { 'Content-Type': 'audio/wav' } }))
      .mockResolvedValueOnce(new Response(audio, { status: 200, headers: { 'Content-Type': 'audio/wav' } }));
    const provider = createYarnGptVoiceProvider({ apiKey: 'test-key', fetchImpl: fetchImpl as typeof fetch });

    await expect(provider.synthesize({ language: 'en', text: 'Hello' })).resolves.toMatchObject({
      mimeType: 'audio/wav',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const firstKey = (fetchImpl.mock.calls[1][1].headers as Record<string, string>)['Idempotency-Key'];
    const retryKey = (fetchImpl.mock.calls[2][1].headers as Record<string, string>)['Idempotency-Key'];
    expect(firstKey).toBeTruthy();
    expect(retryKey).toBe(firstKey);
  });

  it('treats repeated zero-byte TTS responses as provider failure', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ voices: [{ name: 'english-voice', languages: ['English'] }] }))
      .mockResolvedValueOnce(new Response(new Uint8Array(), { status: 200 }))
      .mockResolvedValueOnce(new Response(new Uint8Array(), { status: 200 }));
    const provider = createYarnGptVoiceProvider({ apiKey: 'test-key', fetchImpl: fetchImpl as typeof fetch });

    await expect(provider.synthesize({ language: 'en', text: 'Hello' })).rejects.toMatchObject({
      message: 'YarnGPT returned empty speech audio.',
    });
  });

  it('retries one transient TTS timeout and preserves the idempotency key', async () => {
    const timeout = Object.assign(new TypeError('fetch failed'), {
      cause: { code: 'UND_ERR_CONNECT_TIMEOUT' },
    });
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ voices: [{ name: 'english-voice', languages: ['English'] }] }))
      .mockRejectedValueOnce(timeout)
      .mockResolvedValueOnce(new Response(Uint8Array.from([82, 73, 70, 70]), { status: 200 }));
    const provider = createYarnGptVoiceProvider({ apiKey: 'test-key', fetchImpl: fetchImpl as typeof fetch });

    await expect(provider.synthesize({ language: 'en', text: 'Hello' })).resolves.toMatchObject({
      model: 'yarngpt-streaming-conversation-v1',
    });
    const firstKey = (fetchImpl.mock.calls[1][1].headers as Record<string, string>)['Idempotency-Key'];
    const retryKey = (fetchImpl.mock.calls[2][1].headers as Record<string, string>)['Idempotency-Key'];
    expect(retryKey).toBe(firstKey);
  });

  it('retries a transient voice-catalogue timeout before TTS', async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(Object.assign(new TypeError('fetch failed'), {
        cause: { code: 'UND_ERR_CONNECT_TIMEOUT' },
      }))
      .mockResolvedValueOnce(json({ voices: [{ name: 'english-voice', languages: ['English'] }] }))
      .mockResolvedValueOnce(new Response(Uint8Array.from([82, 73, 70, 70]), { status: 200 }));
    const provider = createYarnGptVoiceProvider({ apiKey: 'test-key', fetchImpl: fetchImpl as typeof fetch });

    await expect(provider.synthesize({ language: 'en', text: 'Hello' })).resolves.toMatchObject({
      model: 'yarngpt-streaming-conversation-v1',
    });
    expect(fetchImpl.mock.calls[0][0]).toContain('/api/v1/voices');
    expect(fetchImpl.mock.calls[1][0]).toContain('/api/v1/voices');
    expect(fetchImpl.mock.calls[2][0]).toContain('/api/v1/streaming/conversation');
  });

  it('retries a transient ASR upload with the same key', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ languages: ['English'] }))
      .mockResolvedValueOnce(json({ error: { code: 'SERVICE_UNAVAILABLE' } }, 503))
      .mockResolvedValueOnce(json({ job_id: 'asr-job-1', status: 'queued' }, 202))
      .mockResolvedValueOnce(json({ status: 'completed', transcript: 'Hello there' }));
    const provider = createYarnGptVoiceProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as typeof fetch,
      sleep: async () => undefined,
    });

    await expect(provider.transcribe({
      language: 'en',
      mimeType: 'audio/wav',
      audioBase64: Buffer.from('audio').toString('base64'),
    })).resolves.toMatchObject({ transcript: 'Hello there' });
    const firstKey = (fetchImpl.mock.calls[1][1].headers as Record<string, string>)['Idempotency-Key'];
    const retryKey = (fetchImpl.mock.calls[2][1].headers as Record<string, string>)['Idempotency-Key'];
    expect(retryKey).toBe(firstKey);
  });

  it('waits and replays an in-progress ASR upload with the same idempotency key', async () => {
    const sleep = vi.fn(async () => undefined);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ languages: ['Nigerian Pidgin'] }))
      .mockResolvedValueOnce(json({ error: { code: 'ALREADY_EXISTS' } }, 409))
      .mockResolvedValueOnce(json({ job_id: 'asr-job-1', status: 'queued' }, 202))
      .mockResolvedValueOnce(json({ status: 'completed', transcript: 'How you dey?' }));
    const provider = createYarnGptVoiceProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as typeof fetch,
      sleep,
    });

    await expect(provider.transcribe({
      language: 'pcm',
      mimeType: 'audio/webm',
      audioBase64: Buffer.from('audio').toString('base64'),
    })).resolves.toMatchObject({ transcript: 'How you dey?' });

    const uploadCalls = fetchImpl.mock.calls.slice(1, 3);
    const keys = uploadCalls.map(([, init]) => (init.headers as Record<string, string>)['Idempotency-Key']);
    expect(new Set(keys).size).toBe(1);
    expect(sleep).toHaveBeenNthCalledWith(1, 1_000);
  });

  it('retries a transient ASR-language catalogue timeout before upload', async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ETIMEDOUT' } }))
      .mockResolvedValueOnce(json({ languages: ['English'] }))
      .mockResolvedValueOnce(json({ job_id: 'asr-job-1', status: 'queued' }, 202))
      .mockResolvedValueOnce(json({ status: 'completed', transcript: 'Hello there' }));
    const provider = createYarnGptVoiceProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as typeof fetch,
      sleep: async () => undefined,
    });

    await expect(provider.transcribe({
      language: 'en',
      mimeType: 'audio/wav',
      audioBase64: Buffer.from('audio').toString('base64'),
    })).resolves.toMatchObject({ transcript: 'Hello there' });
    expect(fetchImpl.mock.calls[0][0]).toContain('/api/v1/asr/languages');
    expect(fetchImpl.mock.calls[1][0]).toContain('/api/v1/asr/languages');
    expect(fetchImpl.mock.calls[2][0]).toBe('https://api.yarngpt.ai/api/v1/asr');
  });

  it('retries a transient ASR poll without submitting a second job', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ languages: ['English'] }))
      .mockResolvedValueOnce(json({ job_id: 'asr-job-1', status: 'queued' }, 202))
      .mockRejectedValueOnce(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } }))
      .mockResolvedValueOnce(json({ status: 'completed', transcript: 'Hello there' }));
    const provider = createYarnGptVoiceProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as typeof fetch,
      sleep: async () => undefined,
    });

    await expect(provider.transcribe({
      language: 'en',
      mimeType: 'audio/wav',
      audioBase64: Buffer.from('audio').toString('base64'),
    })).resolves.toMatchObject({ transcript: 'Hello there' });
    const uploadCalls = fetchImpl.mock.calls.filter(([url]) => url === 'https://api.yarngpt.ai/api/v1/asr');
    expect(uploadCalls).toHaveLength(1);
    expect(fetchImpl.mock.calls[2][0]).toContain('/api/v1/asr/asr-job-1');
    expect(fetchImpl.mock.calls[3][0]).toContain('/api/v1/asr/asr-job-1');
  });

  it('normalizes repeated transient ASR upload failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json({ languages: ['English'] }))
      .mockResolvedValueOnce(json({ error: { code: 'PROVIDER_TIMEOUT' } }, 504))
      .mockResolvedValueOnce(json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'private provider detail',
          service: 'speech',
          trace_id: 'trace-123',
        },
      }, 500));
    const provider = createYarnGptVoiceProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as typeof fetch,
      sleep: async () => undefined,
    });

    await expect(provider.transcribe({
      language: 'en',
      mimeType: 'audio/wav',
      audioBase64: Buffer.from('audio').toString('base64'),
    })).rejects.toBeInstanceOf(MiraProviderError);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalledWith('[Mira] YarnGPT request failed', {
      operation: 'asr_upload',
      status: 500,
      code: 'INTERNAL_ERROR',
      service: 'speech',
      traceId: 'trace-123',
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('private provider detail');
    expect(JSON.stringify(warn.mock.calls)).not.toContain('test-key');
    warn.mockRestore();
  });

  it('rejects unlisted ASR languages before uploading charged audio', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(json({ languages: ['English'] }));
    const provider = createYarnGptVoiceProvider({ apiKey: 'test-key', fetchImpl: fetchImpl as typeof fetch });
    await expect(provider.transcribe({ language: 'ig', mimeType: 'audio/webm', audioBase64: 'AAAA' }))
      .rejects.toBeInstanceOf(MiraProviderError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('normalizes provider authentication errors without exposing the key', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(json({
      error: { code: 'INVALID_API_KEY', user_message: 'That API key is not valid.' },
    }, 401));
    const provider = createYarnGptVoiceProvider({ apiKey: 'secret-not-for-output', fetchImpl: fetchImpl as typeof fetch });
    await expect(provider.synthesize({ language: 'en', text: 'Hello' })).rejects.toMatchObject({
      message: 'That API key is not valid.',
    });
  });
});

describe('Mira voice provider selection', () => {
  it('centralizes live-verified provider mapping for all five pitch languages', () => {
    expect(Object.keys(MIRA_VOICE_PROVIDER_PREFERENCES)).toEqual(['en', 'ha', 'ig', 'yo', 'pcm']);
    Object.values(MIRA_VOICE_PROVIDER_PREFERENCES).forEach((mapping) => {
      expect(mapping.textToSpeech[0]).toBe('yarngpt');
      expect(mapping.speechToText[0]).toBe('gemini');
      expect(mapping.speechToText).toContain('gemini');
    });
    expect(MIRA_VOICE_PROVIDER_PREFERENCES.ha.speechToText).toEqual(['gemini']);
  });

  it('falls back to Gemini when YarnGPT is unavailable for a verified language', async () => {
    const unavailable: MiraVoiceProvider = {
      transcribe: vi.fn(async () => { throw new MiraProviderError('unavailable'); }),
      synthesize: vi.fn(async () => { throw new MiraProviderError('unavailable'); }),
    };
    const gemini: MiraProvider = {
      chat: vi.fn(),
      transcribe: vi.fn(async () => ({ transcript: 'Hello', model: 'gemini-stt' })),
      synthesize: vi.fn(async () => ({ audioBase64: 'AAAA', mimeType: 'audio/wav', model: 'gemini-tts' })),
    };
    const provider = createMiraProviderWithVoiceSelection(gemini, { yarngpt: unavailable, gemini });

    await expect(provider.transcribe({ language: 'en', mimeType: 'audio/webm', audioBase64: 'AAAA' }))
      .resolves.toMatchObject({ model: 'gemini-stt' });
    await expect(provider.synthesize({ language: 'ha', text: 'Sannu' }))
      .resolves.toMatchObject({ model: 'gemini-tts' });
  });

  it('keeps YarnGPT voice available when the chat provider is not configured', async () => {
    const yarnGpt: MiraVoiceProvider = {
      transcribe: vi.fn(async () => ({ transcript: 'How body?', model: 'yarngpt-stt' })),
      synthesize: vi.fn(async () => ({ audioBase64: 'AAAA', mimeType: 'audio/wav', model: 'yarngpt-tts' })),
    };
    const provider = createMiraProviderWithVoiceSelection(null, { yarngpt: yarnGpt });

    await expect(provider.transcribe({ language: 'pcm', mimeType: 'audio/webm', audioBase64: 'AAAA' }))
      .resolves.toMatchObject({ transcript: 'How body?', model: 'yarngpt-stt' });
    await expect(provider.synthesize({ language: 'pcm', text: 'I dey here with you.' }))
      .resolves.toMatchObject({ model: 'yarngpt-tts' });
    await expect(provider.chat({ language: 'pcm', history: [], message: 'How body?' }))
      .rejects.toMatchObject({ message: 'Mira response service is not configured.' });
  });
});
