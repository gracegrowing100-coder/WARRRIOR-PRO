import type { IncomingMessage, ServerResponse } from 'node:http';
import { probeConfigValue } from './_lib/probeConfigValue';

export default function handler(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify({ status: probeConfigValue }));
}
