import type { IncomingMessage, ServerResponse } from 'node:http';
import { createMiraApiApp } from './miraApiApp.ts';

const app = createMiraApiApp();
const allowedRoutes = new Set([
  'mira/chat',
  'mira/transcribe',
  'mira/speak',
]);

export default function handler(request: IncomingMessage, response: ServerResponse) {
  const requestUrl = new URL(request.url || '/api', 'http://warrior.internal');
  const routedPath = requestUrl.searchParams.get('path')?.replace(/^\/+|\/+$/g, '') || '';
  if (!allowedRoutes.has(routedPath)) {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({ error: { code: 'not_found', message: 'API route not found.' } }));
    return;
  }

  request.url = `/api/${routedPath}`;
  app(request, response);
}
