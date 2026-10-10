import type { IncomingMessage, ServerResponse } from 'node:http';

const allowedRoutes = new Set([
  'health',
  'mira/chat',
  'mira/transcribe',
  'mira/speak',
]);
let appPromise: Promise<ReturnType<typeof import('../server/mira/miraApiApp.ts')['createMiraApiApp']>> | null = null;

function loadApp() {
  appPromise ??= import('../server/mira/miraApiApp.ts')
    .then(({ createMiraApiApp }) => createMiraApiApp());
  return appPromise;
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

function classifyInitializationFailure(error: unknown): string {
  const code = String((error as { code?: unknown })?.code ?? '');
  const message = error instanceof Error ? error.message : '';
  if (code === 'ERR_MODULE_NOT_FOUND' || /cannot find (?:module|package)/i.test(message)) {
    if (message.includes('miraApiApp')) return 'module-not-found:shared-app';
    if (message.includes('firebase-applet-config')) return 'module-not-found:firebase-config';
    if (message.includes('firebase-admin')) return 'module-not-found:firebase-admin';
    if (message.includes('@google/genai')) return 'module-not-found:google-genai';
    if (message.includes('express')) return 'module-not-found:express';
    if (message.includes('/server/mira/') || message.includes('\\server\\mira\\')) {
      return 'module-not-found:internal-mira';
    }
    return 'module-not-found:other';
  }
  if (code === 'ERR_IMPORT_ATTRIBUTE_MISSING' || /import attribute/i.test(message)) {
    return 'json-import';
  }
  if (/require is not defined|dynamic require/i.test(message)) {
    return 'module-format';
  }
  if (error instanceof SyntaxError) return 'module-syntax';
  return 'unknown';
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const requestUrl = new URL(request.url || '/api', 'http://warrior.internal');
  const routedPath = requestUrl.searchParams.get('path')?.replace(/^\/+|\/+$/g, '') || '';
  if (!allowedRoutes.has(routedPath)) {
    sendJson(response, 404, { error: { code: 'not_found', message: 'API route not found.' } });
    return;
  }

  if (routedPath === 'health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  try {
    const app = await loadApp();
    request.url = `/api/${routedPath}`;
    app(request, response);
  } catch (error) {
    const failureClass = classifyInitializationFailure(error);
    console.error('[Mira] Vercel function initialization failed.', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : 'Unknown initialization error',
      failureClass,
    });
    if (!response.headersSent) {
      response.setHeader('X-Mira-Init-Failure', failureClass);
      sendJson(response, 503, {
        error: {
          code: 'mira_unavailable',
          message: 'Mira response service is temporarily unavailable. Please try again.',
        },
      });
    }
  }
}
