import express from 'express';
import { createServer } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
    expect(payload.handoff).toBeNull();
    expect(getProvider).not.toHaveBeenCalled();
  });
});
