import type { IncomingMessage, ServerResponse } from 'node:http';
import { MIRA_LANGUAGES } from '../services/miraConfig.ts';

export default function handler(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify({ status: MIRA_LANGUAGES.length > 0 ? 'ok' : 'invalid' }));
}
