import type { IncomingMessage, ServerResponse } from 'node:http';
import { registerMiraRoutes } from '../server/mira/miraRoutes.ts';

export default function handler(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify({ status: typeof registerMiraRoutes === 'function' ? 'ok' : 'invalid' }));
}
