import { GoogleGenAI } from '@google/genai';
import express, { type Express } from 'express';
import type { MiraProvider } from './miraProvider.ts';
import { createGeminiMiraProvider } from './miraGeminiProvider.ts';
import { registerMiraRoutes } from './miraRoutes.ts';
import { createMiraProviderWithVoiceSelection } from './miraVoiceProvider.ts';
import { createYarnGptVoiceProvider } from './miraYarnGptProvider.ts';

const DEFAULT_FIREBASE_PROJECT_ID = 'gen-lang-client-0440960552';

interface MiraApiAppOptions {
  getGemini?: () => GoogleGenAI | null;
  projectId?: string;
}

type MiraApiInitializationStage = 'express' | 'middleware' | 'routes';

function initializeStage<T>(stage: MiraApiInitializationStage, operation: () => T): T {
  try {
    return operation();
  } catch (cause) {
    const error = new Error(`Mira API initialization failed at ${stage}.`, { cause }) as Error & { code: string };
    error.name = 'MiraApiInitializationError';
    error.code = `MIRA_INIT_${stage.toUpperCase()}`;
    throw error;
  }
}

export function createMiraApiApp(options: MiraApiAppOptions = {}): Express {
  const app = initializeStage('express', () => express());
  let geminiInstance: GoogleGenAI | null = null;
  let provider: MiraProvider | null = null;

  const getGemini = options.getGemini ?? (() => {
    if (geminiInstance) return geminiInstance;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey?.trim()) return null;
    geminiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    return geminiInstance;
  });

  const getProvider = (): MiraProvider | null => {
    if (provider) return provider;
    const ai = getGemini();
    const gemini = ai ? createGeminiMiraProvider(ai) : null;
    const yarnGptKey = process.env.YARNGPT_API_KEY?.trim();
    if (!gemini && !yarnGptKey) return null;
    provider = createMiraProviderWithVoiceSelection(gemini, {
      ...(gemini ? { gemini } : {}),
      ...(yarnGptKey ? { yarngpt: createYarnGptVoiceProvider({ apiKey: yarnGptKey }) } : {}),
    });
    return provider;
  };

  // Audio is base64 encoded, so only transcription receives the larger body
  // allowance. Other Mira routes keep Express's normal JSON limit.
  initializeStage('middleware', () => {
    app.use('/api/mira/transcribe', express.json({ limit: '8mb' }));
    app.use('/api/mira', express.json());
  });
  initializeStage('routes', () => {
    registerMiraRoutes(app, {
      getProvider,
      projectId: options.projectId || process.env.MIRA_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID,
    });
    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  });

  return app;
}
