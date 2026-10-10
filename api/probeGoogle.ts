import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI } from '@google/genai';

export default function handler(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify({ status: typeof GoogleGenAI === 'function' ? 'ok' : 'invalid' }));
}
