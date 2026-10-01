import { describe, expect, it, vi } from 'vitest';
import { createGeminiMiraProvider } from '../../server/mira/miraGeminiProvider';

describe('Gemini Mira provider', () => {
  it('deletes uploaded transcription audio by file name, not URI', async () => {
    const remove = vi.fn(async () => ({}));
    const ai = {
      files: {
        upload: vi.fn(async () => ({ name: 'files/upload-123', uri: 'https://provider/files/upload-123' })),
        delete: remove,
      },
      interactions: { create: vi.fn(async () => ({ output_text: 'My legs hurt' })) },
      models: { generateContent: vi.fn() },
    };

    const provider = createGeminiMiraProvider(ai as never);
    await expect(
      provider.transcribe({ audioBase64: Buffer.from('audio').toString('base64'), mimeType: 'audio/webm', language: 'en' }),
    ).resolves.toMatchObject({ transcript: 'My legs hurt' });

    expect(remove).toHaveBeenCalledWith({ name: 'files/upload-123' });
  });
});
