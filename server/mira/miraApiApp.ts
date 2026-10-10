import { GoogleGenAI } from '@google/genai';
import express, { type Express } from 'express';
import firebaseConfig from '../../firebase-applet-config.json';
import type { MiraProvider } from './miraProvider';
import { createGeminiMiraProvider } from './miraGeminiProvider';
import { registerMiraRoutes } from './miraRoutes';
import { createMiraProviderWithVoiceSelection } from './miraVoiceProvider';
import { createYarnGptVoiceProvider } from './miraYarnGptProvider';

interface MiraApiAppOptions {
  getGemini?: () => GoogleGenAI | null;
  projectId?: string;
}

export function createMiraApiApp(options: MiraApiAppOptions = {}): Express {
  const app = express();
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
  app.use('/api/mira/transcribe', express.json({ limit: '8mb' }));
  app.use('/api/mira', express.json());
  registerMiraRoutes(app, {
    getProvider,
    projectId: options.projectId || process.env.MIRA_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  });
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}
