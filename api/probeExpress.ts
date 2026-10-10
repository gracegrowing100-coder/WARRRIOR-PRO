import type { IncomingMessage, ServerResponse } from 'node:http';
import express from 'express';

export default function handler(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify({ status: typeof express === 'function' ? 'ok' : 'invalid' }));
}
