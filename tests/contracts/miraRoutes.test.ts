import express from 'express';
import { createServer } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MiraProviderError, type MiraProvider } from '../../server/mira/miraProvider';

vi.mock('../../server/mira/miraAuth', () => ({
  authenticateMiraRequest: vi.fn(async () => ({ ok: true, uid: 'patient-1' })),
}));

import { registerMiraRoutes } from '../../server/mira/miraRoutes';

describe('Mira urgent route safety', () => {
  const servers: ReturnType<typeof createServer>[] = [];
  afterEach(() => servers.splice(0).forEach((server) => server.close()));

  it('returns emergency guidance without resolving or calling an AI provider', async () => {
    const app = express();
    app.use(express.json());
    const getProvider = vi.fn(() => null);
    registerMiraRoutes(app, { getProvider, projectId: 'test-project' });
    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/mira/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ language: 'en', message: 'I have chest pain and cannot breathe', history: [] }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.escalation.urgency).toBe('urgent');
    expect(payload.emergencyGuidance).toMatch(/emergency/i);
    expect(payload.reply).not.toBe(payload.emergencyGuidance);
    expect(payload.handoff).toBeNull();
    expect(getProvider).not.toHaveBeenCalled();
  });

  it('does not carry an old emergency into an unrelated current turn', async () => {
    const app = express();
    app.use(express.json());
    const provider: MiraProvider = {
      chat: vi.fn(async () => ({
        reply: 'You are welcome.',
        modelUrgency: 'none',
        modelReason: '',
        model: 'test-model',
      })),
      transcribe: vi.fn(),
      synthesize: vi.fn(),
    };
    registerMiraRoutes(app, { getProvider: () => provider, projectId: 'test-project' });
    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/mira/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        language: 'en',
        message: 'Thanks Mira.',
        history: [
          { role: 'user', text: 'I have severe pain and fever.' },
          { role: 'assistant', text: 'Please seek emergency care now.' },
        ],
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.escalation.urgency).toBe('none');
    expect(payload.emergencyGuidance).toBeNull();
    expect(provider.chat).toHaveBeenCalledTimes(1);
  });

  it('keeps an explicit current continuation urgent without calling the provider', async () => {
    const app = express();
    app.use(express.json());
    const getProvider = vi.fn(() => null);
    registerMiraRoutes(app, { getProvider, projectId: 'test-project' });
    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/mira/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        language: 'en',
        message: 'The pain is still severe.',
        history: [{ role: 'user', text: 'I have severe pain.' }],
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.escalation.urgency).toBe('urgent');
    expect(payload.emergencyGuidance).toMatch(/emergency/i);
    expect(getProvider).not.toHaveBeenCalled();
  });

  it('reports the response stage without exposing provider diagnostics', async () => {
    const app = express();
    app.use(express.json());
    const provider: MiraProvider = {
      chat: vi.fn(async () => { throw new MiraProviderError('Gemini credential rejected: secret detail'); }),
      transcribe: vi.fn(),
      synthesize: vi.fn(),
    };
    registerMiraRoutes(app, { getProvider: () => provider, projectId: 'test-project' });
    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/mira/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ language: 'en', message: 'How much water should I drink?', history: [] }),
    });
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error.message).toBe('Mira response service is temporarily unavailable. Please try again.');
    expect(JSON.stringify(payload)).not.toContain('Gemini');
    expect(JSON.stringify(payload)).not.toContain('secret detail');
  });

  it('returns a temporary response error when the chat provider does not settle', async () => {
    const app = express();
    app.use(express.json());
    const provider: MiraProvider = {
      chat: vi.fn(() => new Promise<never>(() => undefined)),
      transcribe: vi.fn(),
      synthesize: vi.fn(),
    };
    registerMiraRoutes(app, { getProvider: () => provider, projectId: 'test-project', providerTimeoutMs: 10 });
    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/mira/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ language: 'ig', message: 'Biko nye m ndụmọdụ mmiri.', history: [] }),
    });
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error.message).toBe('Mira response service is temporarily unavailable. Please try again.');
  });

  it('reports the transcription stage when voice is not configured', async () => {
    const app = express();
    app.use(express.json());
    registerMiraRoutes(app, { getProvider: () => null, projectId: 'test-project' });
    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/mira/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ language: 'en', mimeType: 'audio/webm', audioBase64: 'AAAA' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error.message).toBe('Voice service is not configured.');
  });

  it('reports the speech stage without exposing provider diagnostics', async () => {
    const app = express();
    app.use(express.json());
    const provider: MiraProvider = {
      chat: vi.fn(),
      transcribe: vi.fn(),
      synthesize: vi.fn(async () => { throw new MiraProviderError('YarnGPT credential rejected: secret detail'); }),
    };
    registerMiraRoutes(app, { getProvider: () => provider, projectId: 'test-project' });
    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/mira/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ language: 'pcm', text: 'I dey here with you.' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error.message).toBe('Mira could not create spoken audio. Please try again.');
    expect(JSON.stringify(payload)).not.toContain('YarnGPT');
    expect(JSON.stringify(payload)).not.toContain('secret detail');
  });
});
