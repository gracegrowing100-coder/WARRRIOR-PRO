import express from "express";
import path from "path";
import fs from "node:fs";
import { loadEnvFile } from "node:process";
import { getCACertificates, setDefaultCACertificates } from "node:tls";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import firebaseConfig from "./firebase-applet-config.json";
import { createMiraApiApp } from "./server/mira/miraApiApp";
import { createGeminiRouter } from "./server/gemini/geminiRoutes";

function resolveProjectRoot(): string {
  const npmPackageJson = process.env.npm_package_json;
  if (npmPackageJson && path.basename(npmPackageJson).toLowerCase() === 'package.json') {
    return path.dirname(path.resolve(npmPackageJson));
  }

  const entryPath = process.argv[1];
  if (entryPath) {
    const entryDirectory = path.dirname(path.resolve(entryPath));
    return path.basename(entryDirectory).toLowerCase() === 'dist'
      ? path.dirname(entryDirectory)
      : entryDirectory;
  }

  return process.cwd();
}

const projectRoot = resolveProjectRoot();

// Firebase Admin fetches Google's public signing certificates over TLS. On
// Windows, include the OS trust store so locally trusted enterprise/root CAs
// are honoured without disabling certificate verification.
if (process.platform === 'win32') {
  setDefaultCACertificates([
    ...getCACertificates('default'),
    ...getCACertificates('system'),
  ]);
}

try {
  loadEnvFile(path.join(projectRoot, '.env.local'));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

console.info('[Mira] runtime configuration', {
  yarnGptConfigured: Boolean(process.env.YARNGPT_API_KEY?.trim()),
  geminiConfigured: Boolean((process.env.GEMINI_API_KEY || process.env.API_KEY)?.trim()),
  firebaseProjectId: process.env.MIRA_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
});

async function startServer() {
  const app = express();
  const PORT = Number.parseInt(process.env.PORT ?? '', 10) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    app.use((_req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      next();
    });
  }

  // Initialize secure GenAI instance lazily on the server
  let aiInstance: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI | null {
    if (!aiInstance) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY or API_KEY not provided. Will utilize offline local wisdom fallbacks.");
        return null;
      }
      aiInstance = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiInstance;
  }

  app.use(createMiraApiApp({
    getGemini: getGenAI,
    projectId: process.env.MIRA_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  }));
  app.use(express.json());

  app.use(createGeminiRouter(getGenAI));

  // Serve Service Worker for Care Vault offline caching
  app.get("/sw.js", (req, res) => {
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Content-Type", "application/javascript");
    // Single source of truth: public/sw.js (copied to dist/sw.js by Vite for static hosts).
    const builtWorker = path.join(projectRoot, "dist", "sw.js");
    const sourceWorker = path.join(projectRoot, "public", "sw.js");
    res.sendFile(process.env.NODE_ENV === "production" && fs.existsSync(builtWorker) ? builtWorker : sourceWorker);
  });

  // Vite development vs Production static routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: projectRoot,
      configFile: path.join(projectRoot, 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(projectRoot, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (req, res, next) => {
      if (req.path === '/api' || req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
