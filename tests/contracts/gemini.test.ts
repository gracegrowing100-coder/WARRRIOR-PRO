import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/offlineKnowledgeBase', () => ({
  processOfflineQuery: vi.fn((query: string) => ({ response: `offline:${query}` })),
}));

import { generateHealthAdvice } from '../../services/gemini';

describe('Gemini client fallback behavior', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses local knowledge immediately when the browser is offline', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);

    await expect(generateHealthAdvice('hydration', 'test context')).resolves.toBe('offline:hydration');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns the server response when the request succeeds', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'server response' }),
    } as Response);

    await expect(generateHealthAdvice('hydration', 'test context')).resolves.toBe('server response');
    expect(fetch).toHaveBeenCalledWith('/api/gemini/advice', expect.objectContaining({ method: 'POST' }));
  });

  it('falls back locally when the network request fails', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
    vi.mocked(fetch).mockRejectedValue(new Error('network unavailable'));

    await expect(generateHealthAdvice('warmth', 'test context')).resolves.toBe('offline:warmth');
  });
});
