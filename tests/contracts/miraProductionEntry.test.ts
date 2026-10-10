import { createServer, type RequestListener, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import statusHandler from '../../api/status';
import handler from '../../server/mira/miraVercelHandler';

describe('Mira production function entry', () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (!server) return;
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => error ? reject(error) : resolve());
    });
    server = undefined;
  });

  async function listenWith(requestHandler: RequestListener) {
    server = createServer(requestHandler);
    server.listen(0, '127.0.0.1');
    await new Promise<void>((resolve, reject) => {
      server?.once('listening', resolve);
      server?.once('error', reject);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected an ephemeral TCP port');
    return `http://127.0.0.1:${address.port}`;
  }

  it('serves production health without loading the Mira runtime', async () => {
    const baseUrl = await listenWith(statusHandler);
    const health = await fetch(`${baseUrl}/api/status`);
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toEqual({ status: 'ok' });
  });

  it('routes production Mira requests into the shared authenticated API app', async () => {
    const baseUrl = await listenWith(handler);
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
      { source: '/api/health', destination: '/api/status' },
      { source: '/api/mira/chat', destination: '/api/mira?path=mira/chat' },
      { source: '/api/mira/transcribe', destination: '/api/mira?path=mira/transcribe' },
      { source: '/api/mira/speak', destination: '/api/mira?path=mira/speak' },
    ]);
    expect(rewrites.at(-1)).toEqual({ source: '/(.*)', destination: '/index.html' });
  });

  it('ships a self-contained Mira function bundle without relative runtime imports', async () => {
    const bundle = await readFile(path.resolve('api/_lib/mira-runtime.mjs'), 'utf8');
    expect(bundle).toContain('Generated from server/mira/miraVercelHandler.ts');
    expect(bundle).not.toMatch(/\bfrom\s+["']\.\.?\//);
    expect(bundle).not.toMatch(/\bimport\(["']\.\.?\//);
  });
});
