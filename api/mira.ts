import type { IncomingMessage, ServerResponse } from 'node:http';

type MiraHandler = (request: IncomingMessage, response: ServerResponse) => void;
let handlerPromise: Promise<MiraHandler> | null = null;

function loadHandler() {
  handlerPromise ??= import('./_lib/mira-runtime.cjs').then((module) => {
    const commonJsExport = module.default as MiraHandler | { default?: MiraHandler };
    const candidate = typeof commonJsExport === 'function' ? commonJsExport : commonJsExport.default;
    if (typeof candidate !== 'function') throw new TypeError('Mira runtime did not export a request handler.');
    return candidate;
  });
  return handlerPromise;
}

function failureClass(error: unknown): string {
  const code = String((error as { code?: unknown })?.code ?? '');
  const message = error instanceof Error ? error.message : '';
  if (code === 'MIRA_INIT_EXPRESS') return 'app-construction';
  if (code === 'MIRA_INIT_MIDDLEWARE') return 'middleware-registration';
  if (code === 'MIRA_INIT_ROUTES') return 'route-registration';
  if (code === 'ERR_MODULE_NOT_FOUND' || /cannot find (?:module|package)/i.test(message)) {
    if (message.includes('@google/genai')) return 'missing-google-genai';
    if (message.includes('firebase-admin')) return 'missing-firebase-admin';
    if (message.includes('express')) return 'missing-express';
    if (message.includes('mira-runtime')) return 'missing-runtime';
    return 'missing-module';
  }
  if (error instanceof SyntaxError) return 'runtime-syntax';
  return 'runtime-initialization';
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  try {
    const miraHandler = await loadHandler();
    miraHandler(request, response);
  } catch (error) {
    const diagnostic = failureClass(error);
    console.error('[Mira] Production runtime failed to initialize.', {
      diagnostic,
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : 'Unknown initialization error',
    });
    response.statusCode = 503;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('X-Mira-Runtime-Failure', diagnostic);
    response.end(JSON.stringify({
      error: {
        code: 'mira_unavailable',
        message: 'Mira response service is temporarily unavailable. Please try again.',
      },
    }));
  }
}
