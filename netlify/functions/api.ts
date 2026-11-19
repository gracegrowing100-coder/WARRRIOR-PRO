import express from 'express';
import serverless from 'serverless-http';
import { GoogleGenAI } from '@google/genai';
import firebaseConfig from '../../firebase-applet-config.json';
import { createMiraApiApp } from '../../server/mira/miraApiApp';
import { createGeminiRouter } from '../../server/gemini/geminiRoutes';

// Netlify entry point for every /api/* request (see netlify.toml). It mounts the same
// Express routers the local server uses, so Mira and the /api/gemini/* endpoints behave
// identically in development and on Netlify. Secrets come from Netlify environment
// variables (GEMINI_API_KEY, YARNGPT_API_KEY) and never reach the browser bundle.

let aiInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY)?.trim();
  if (!apiKey) return null;
  aiInstance = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  return aiInstance;
}

const app = express();

// A redirect can deliver the function path instead of the original /api/* path.
app.use((req, _res, next) => {
  const prefix = '/.netlify/functions/api';
  if (req.url.startsWith(prefix)) req.url = `/api${req.url.slice(prefix.length) || '/'}`;
  next();
});

app.get(['/api/status', '/api/health'], (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(createMiraApiApp({
  getGemini: getGenAI,
  projectId: process.env.MIRA_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
}));
app.use(createGeminiRouter(getGenAI));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'API route not found.' } });
});

export const handler = serverless(app);
