import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import handler from '../../api/index';

describe('Mira production function entry', () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (!server) return;
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => error ? reject(error) : resolve());
    });
    server = undefined;
  });

  it('routes production health and Mira requests into the shared authenticated API app', async () => {
    server = createServer(handler);
    server.listen(0, '127.0.0.1');
    await new Promise<void>((resolve, reject) => {
      server?.once('listening', resolve);
      server?.once('error', reject);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected an ephemeral TCP port');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const health = await fetch(`${baseUrl}/api?path=health`);
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toEqual({ status: 'ok' });

    for (const route of ['chat', 'transcribe', 'speak']) {
      const response = await fetch(`${baseUrl}/api?path=mira/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: { code: 'unauthenticated', message: 'Sign in again to use Mira.' },
      });
    }
  });

  it('keeps API rewrites ahead of the Vite SPA fallback', async () => {
    const config = JSON.parse(
      await readFile(path.resolve('vercel.json'), 'utf8'),
    ) as { rewrites?: Array<{ source?: string; destination?: string }> };
    const rewrites = config.rewrites ?? [];

    expect(rewrites.slice(0, 4)).toEqual([
      { source: '/api/health', destination: '/api?path=health' },
      { source: '/api/mira/chat', destination: '/api?path=mira/chat' },
      { source: '/api/mira/transcribe', destination: '/api?path=mira/transcribe' },
      { source: '/api/mira/speak', destination: '/api?path=mira/speak' },
    ]);
    expect(rewrites.at(-1)).toEqual({ source: '/(.*)', destination: '/index.html' });
  });
});
