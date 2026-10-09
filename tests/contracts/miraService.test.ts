import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authHarness = vi.hoisted(() => ({
  user: null as { uid: string; getIdToken: (forceRefresh?: boolean) => Promise<string> } | null,
  authStateReady: vi.fn(async () => undefined),
}));

vi.mock('../../firebase-init', () => ({
  auth: {
    get currentUser() {
      return authHarness.user;
    },
    authStateReady: authHarness.authStateReady,
  },
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
}));

import { getDocs, orderBy, setDoc } from 'firebase/firestore';

import {
  MiraApiError,
  isVoiceEnabledForClient,
  loadLatestMiraConversation,
  readStoredMiraLanguage,
  sendMiraMessage,
  saveMiraMessage,
  startMiraConversation,
  storeMiraLanguage,
  synthesizeMiraSpeech,
  transcribeMiraAudio,
} from '../../services/mira';

const chatResponse = {
  reply: 'Hydration helps.',
  language: 'en',
  escalation: { needed: false, urgency: 'none', reason: '', matchedRedFlags: [] },
  handoff: null,
  handoffLabel: '',
  emergencyGuidance: null,
  provider: { model: 'gemini-test' },
};

function jsonResponse(payload: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => payload } as Response;
}

describe('Mira client service', () => {
  beforeEach(() => {
    authHarness.user = { uid: 'patient-1', getIdToken: vi.fn(async () => 'firebase-id-token') };
    authHarness.authStateReady.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(setDoc).mockReset().mockResolvedValue(undefined);
    vi.mocked(getDocs).mockReset();
    vi.mocked(orderBy).mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends the Firebase ID token and never a client-supplied user id', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(chatResponse));

    await sendMiraMessage({
      conversationId: 'mira-1',
      language: 'en',
      message: 'hello Mira',
      source: 'text',
      history: [{ role: 'user', text: 'earlier question' }],
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/mira/chat');
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer firebase-id-token');
    expect(authHarness.user?.getIdToken).toHaveBeenCalledWith(false);
    const body = (options as RequestInit).body as string;
    expect(body).not.toContain('userId');
    expect(JSON.parse(body)).toMatchObject({
      conversationId: 'mira-1',
      language: 'en',
      message: 'hello Mira',
      source: 'text',
    });
  });

  it('fails fast when there is no signed-in user', async () => {
    authHarness.user = null;

    await expect(
      sendMiraMessage({ conversationId: 'mira-1', language: 'en', message: 'hello', source: 'text', history: [] }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(authHarness.authStateReady).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refreshes the Firebase token once and retries an authenticated request after a 401', async () => {
    const initialGetIdToken = vi.fn().mockResolvedValue('stale-token');
    const refreshedGetIdToken = vi.fn().mockResolvedValue('fresh-token');
    authHarness.user = { uid: 'patient-1', getIdToken: initialGetIdToken };
    vi.mocked(fetch)
      .mockImplementationOnce(async () => {
        authHarness.user = { uid: 'patient-1', getIdToken: refreshedGetIdToken };
        return jsonResponse({ error: { code: 'unauthenticated', message: 'Sign in again to use Mira.' } }, false, 401);
      })
      .mockResolvedValueOnce(jsonResponse(chatResponse));

    await expect(sendMiraMessage({
      conversationId: 'mira-1',
      language: 'en',
      message: 'hello',
      source: 'text',
      history: [],
    })).resolves.toMatchObject({ reply: 'Hydration helps.' });

    expect(initialGetIdToken).toHaveBeenCalledWith(false);
    expect(refreshedGetIdToken).toHaveBeenCalledWith(true);
    expect(authHarness.authStateReady).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(2);
    const retryHeaders = (vi.mocked(fetch).mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer fresh-token');
  });

  it('reports a temporary verification error when token refresh cannot reach Firebase', async () => {
    const refreshError = Object.assign(new Error('offline'), { code: 'auth/network-request-failed' });
    authHarness.user = {
      uid: 'patient-1',
      getIdToken: vi.fn()
        .mockResolvedValueOnce('stale-token')
        .mockRejectedValueOnce(refreshError),
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ error: { code: 'unauthenticated', message: 'Sign in again to use Mira.' } }, false, 401),
    );

    await expect(sendMiraMessage({
      conversationId: 'mira-1',
      language: 'en',
      message: 'hello',
      source: 'text',
      history: [],
    })).rejects.toMatchObject({
      code: 'auth_unavailable',
      message: 'Mira could not verify your sign-in right now. Please try again.',
      status: 503,
    });
  });

  it('does not report an ended session when Firebase still has the user after a rejected refresh', async () => {
    authHarness.user = {
      uid: 'patient-1',
      getIdToken: vi.fn()
        .mockResolvedValueOnce('stale-token')
        .mockResolvedValueOnce('refreshed-token'),
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: 'unauthenticated', message: 'Sign in again to use Mira.' } }, false, 401),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: 'unauthenticated', message: 'Sign in again to use Mira.' } }, false, 401),
      );

    await expect(sendMiraMessage({
      conversationId: 'mira-1',
      language: 'en',
      message: 'hello',
      source: 'text',
      history: [],
    })).rejects.toMatchObject({
      code: 'auth_unavailable',
      message: 'Mira could not verify your sign-in right now. Please try again.',
      status: 503,
    });
  });

  it('reports an ended session when Firebase removes the user during token refresh', async () => {
    const user = {
      uid: 'patient-1',
      getIdToken: vi.fn()
        .mockResolvedValueOnce('stale-token')
        .mockImplementationOnce(async () => {
          authHarness.user = null;
          return 'refreshed-token';
        }),
    };
    authHarness.user = user;
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: 'unauthenticated', message: 'Sign in again to use Mira.' } }, false, 401),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: 'unauthenticated', message: 'Sign in again to use Mira.' } }, false, 401),
      );

    await expect(sendMiraMessage({
      conversationId: 'mira-1',
      language: 'en',
      message: 'hello',
      source: 'text',
      history: [],
    })).rejects.toMatchObject({
      code: 'unauthenticated',
      message: 'Your session has ended. Sign in again to use Mira.',
      status: 401,
    });
  });

  it('reports the server error code instead of inventing a reply', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        { error: { code: 'voice_language_unsupported', message: 'Yorùbá: not documented by the speech provider.' } },
        false,
        422,
      ),
    );

    await expect(transcribeMiraAudio({ language: 'yo', audioBase64: 'AAAA', mimeType: 'audio/webm' })).rejects.toBeInstanceOf(
      MiraApiError,
    );
    await expect(
      transcribeMiraAudio({ language: 'yo', audioBase64: 'AAAA', mimeType: 'audio/webm' }),
    ).rejects.toMatchObject({ code: 'voice_language_unsupported' });
  });

  it('routes voice audio and spoken replies through the Mira endpoints', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ transcript: 'My legs hurt', language: 'ha', provider: { model: 't' } }));
    await transcribeMiraAudio({ language: 'ha', audioBase64: 'AAAA', mimeType: 'audio/webm' });
    const [transcribeUrl, transcribeOptions] = vi.mocked(fetch).mock.calls[0];
    expect(transcribeUrl).toBe('/api/mira/transcribe');
    expect(JSON.parse((transcribeOptions as RequestInit).body as string)).toMatchObject({
      language: 'ha',
      audioBase64: 'AAAA',
      mimeType: 'audio/webm',
    });

    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ audioBase64: 'ZZZ', mimeType: 'audio/wav', language: 'ha', provider: { model: 'tts' } }),
    );
    await expect(synthesizeMiraSpeech({ language: 'ha', text: 'Sannu' })).resolves.toMatchObject({
      audioBase64: 'ZZZ',
      mimeType: 'audio/wav',
    });
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('/api/mira/speak');
  });

  it('persists the selected Mira language', () => {
    storeMiraLanguage('pcm');
    expect(localStorage.getItem('warrior_mira_language')).toBe('pcm');
    expect(readStoredMiraLanguage()).toBe('pcm');
  });

  it('keeps voice enabled for the demo and honours an explicit lock', () => {
    expect(isVoiceEnabledForClient()).toBe(true);
    localStorage.setItem('warrior_mira_voice_enabled', 'false');
    expect(isVoiceEnabledForClient()).toBe(false);
  });

  it('does not report device-only when cloud and device persistence both fail', async () => {
    vi.mocked(setDoc).mockRejectedValue(new Error('cloud unavailable'));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage unavailable'); });

    await expect(saveMiraMessage({
      userId: 'patient-1',
      conversationId: 'mira-1',
      language: 'en',
      escalationUrgency: 'none',
      message: { id: 'm1', role: 'user', text: 'hello', source: 'text', createdAt: '2026-01-01T00:00:00Z' },
    })).resolves.toBe('unavailable');
  });

  it('uses the device fallback when a new-conversation Firestore write does not settle', async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(setDoc).mockReturnValue(new Promise(() => undefined) as never);
      const result = startMiraConversation({
        userId: 'patient-1',
        conversationId: 'mira-new',
        language: 'en',
        mode: 'text',
      });

      await vi.advanceTimersByTimeAsync(3_000);
      await expect(result).resolves.toBe('device-only');
    } finally {
      vi.useRealTimers();
    }
  });

  it('starts a fresh device conversation without copying messages from the prior chat', async () => {
    localStorage.setItem('warrior_mira_conversation_patient-1', JSON.stringify({
      conversationId: 'prior-chat',
      language: 'en',
      updatedAt: '2026-01-01T00:00:00Z',
      messages: [{ id: 'old', role: 'user', text: 'old context', source: 'text', createdAt: '2026-01-01T00:00:00Z' }],
    }));

    await startMiraConversation({
      userId: 'patient-1',
      conversationId: 'fresh-chat',
      language: 'en',
      mode: 'text',
    });

    expect(JSON.parse(localStorage.getItem('warrior_mira_conversation_patient-1') || '{}')).toMatchObject({
      conversationId: 'fresh-chat',
      messages: [],
    });
  });

  it('loads the newest cloud messages and restores chronological order', async () => {
    vi.mocked(getDocs)
      .mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'conversation-1', data: () => ({ language: 'en', updatedAt: '2026-01-03T00:00:00Z' }) }],
      } as never)
      .mockResolvedValueOnce({
        docs: [
          { id: 'm3', data: () => ({ role: 'assistant', text: 'third', source: 'text', createdAt: '2026-01-03T00:00:00Z' }) },
          { id: 'm2', data: () => ({ role: 'user', text: 'second', source: 'text', createdAt: '2026-01-02T00:00:00Z' }) },
        ],
      } as never);

    const conversation = await loadLatestMiraConversation('patient-1');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(conversation?.messages.map((message) => message.id)).toEqual(['m2', 'm3']);
  });
});
