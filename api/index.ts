import type { IncomingMessage, ServerResponse } from 'node:http';

const allowedRoutes = new Set([
  'health',
  'mira/chat',
  'mira/transcribe',
  'mira/speak',
]);
let appPromise: Promise<ReturnType<typeof import('../server/mira/miraApiApp')['createMiraApiApp']>> | null = null;

function loadApp() {
  appPromise ??= import('../server/mira/miraApiApp')
    .then(({ createMiraApiApp }) => createMiraApiApp());
  return appPromise;
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
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
    console.error('[Mira] Vercel function initialization failed.', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : 'Unknown initialization error',
    });
    if (!response.headersSent) {
      sendJson(response, 503, {
        error: {
          code: 'mira_unavailable',
          message: 'Mira response service is temporarily unavailable. Please try again.',
        },
      });
    }
  }
}
