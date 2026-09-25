import express from 'express';
import type { Server } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';

describe('Express 5 production routing baseline', () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => error ? reject(error) : resolve());
      });
      server = undefined;
    }
  });

  it('serves registered APIs before the Express 5 SPA fallback and leaves unknown APIs as 404', async () => {
    const app = express();
    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
    app.get('/{*splat}', (req, res, next) => {
      if (req.path === '/api' || req.path.startsWith('/api/')) return next();
      res.type('html').send('<!doctype html><div id="root"></div>');
    });

    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve, reject) => {
      server?.once('listening', resolve);
      server?.once('error', reject);
    });

    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected an ephemeral TCP port');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const health = await fetch(`${baseUrl}/api/health`);
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toEqual({ status: 'ok' });

    for (const path of ['/', '/patient/home']) {
      const response = await fetch(`${baseUrl}${path}`);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('id="root"');
    }

    const missingApi = await fetch(`${baseUrl}/api/not-found`);
    expect(missingApi.status).toBe(404);
    expect(await missingApi.text()).not.toContain('id="root"');
  });
});
