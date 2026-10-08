import { describe, expect, it, vi } from 'vitest';
import {
  MIRA_CHAT_MODEL_CANDIDATES,
  createGeminiMiraProvider,
} from '../../server/mira/miraGeminiProvider';

describe('Gemini Mira provider', () => {
  it('moves to the next current chat model after a transient provider failure', async () => {
    const generateContent = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('provider detail must stay private'), { status: 503 }))
      .mockResolvedValueOnce({
        text: JSON.stringify({
          reply: 'I dey here with you.',
          escalation: { needed: false, urgency: 'none', reason: '' },
        }),
      });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ai = {
      files: { upload: vi.fn(), delete: vi.fn() },
      interactions: { create: vi.fn() },
      models: { generateContent },
    };

    const provider = createGeminiMiraProvider(ai as never);
    await expect(provider.chat({ language: 'pcm', history: [], message: 'Mira, how you dey?' }))
      .resolves.toMatchObject({ reply: 'I dey here with you.', model: MIRA_CHAT_MODEL_CANDIDATES[1].model });

    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(MIRA_CHAT_MODEL_CANDIDATES).toEqual([
      { model: 'gemini-3.5-flash-lite', timeoutMs: 12_000 },
      { model: 'gemini-3.8-flash', timeoutMs: 8_000 },
      { model: 'gemini-flash-latest', timeoutMs: 7_000 },
    ]);
    expect(generateContent.mock.calls[0][0]).toMatchObject({ model: MIRA_CHAT_MODEL_CANDIDATES[0].model });
    expect(generateContent.mock.calls[1][0]).toMatchObject({ model: MIRA_CHAT_MODEL_CANDIDATES[1].model });
    expect(generateContent.mock.calls[0][0].config.abortSignal).toBeInstanceOf(AbortSignal);
    expect(JSON.stringify(warn.mock.calls)).not.toContain('provider detail must stay private');
    warn.mockRestore();
  });

  it('deletes uploaded transcription audio by file name, not URI', async () => {
    const remove = vi.fn(async () => ({}));
    const generateContent = vi.fn(async () => ({
      candidates: [{ content: { parts: [{ audioTranscription: { text: 'My legs hurt' } }] } }],
    }));
    const ai = {
      files: {
        upload: vi.fn(async () => ({
          name: 'files/upload-123',
          uri: 'https://provider/files/upload-123',
          mimeType: 'audio/webm',
        })),
        delete: remove,
      },
      models: { generateContent },
    };

    const provider = createGeminiMiraProvider(ai as never);
    await expect(
      provider.transcribe({ audioBase64: Buffer.from('audio').toString('base64'), mimeType: 'audio/webm', language: 'en' }),
    ).resolves.toMatchObject({ transcript: 'My legs hurt' });

    expect(remove).toHaveBeenCalledWith({ name: 'files/upload-123' });
    expect(generateContent).toHaveBeenCalledWith({
      model: 'gemini-3.5-transcribe',
      contents: [{
        role: 'user',
        parts: [{ fileData: { fileUri: 'https://provider/files/upload-123', mimeType: 'audio/webm' } }],
      }],
    });
  });

  it('uses automatic language detection when no speech hint is configured', async () => {
    const ai = {
      files: {
        upload: vi.fn(async () => ({
          name: 'files/upload-yo',
          uri: 'https://provider/files/upload-yo',
          mimeType: 'audio/webm',
        })),
        delete: vi.fn(async () => ({})),
      },
      models: {
        generateContent: vi.fn(async () => ({
          candidates: [{ content: { parts: [{ audioTranscription: { text: 'Ẹ káàrọ̀ Mira' } }] } }],
        })),
      },
    };

    const provider = createGeminiMiraProvider(ai as never);
    await expect(provider.transcribe({
      audioBase64: Buffer.from('audio').toString('base64'),
      mimeType: 'audio/webm',
      language: 'yo',
    })).resolves.toMatchObject({ transcript: 'Ẹ káàrọ̀ Mira' });
  });
});
