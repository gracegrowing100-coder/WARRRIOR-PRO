// Firebase ID-token verification for the Mira API boundary.
// The official Admin SDK owns signature, issuer, audience, expiry and claim validation.

import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

export type MiraAuthFailureCode = 'unauthenticated' | 'auth_unavailable';

export class MiraAuthError extends Error {
  readonly code: MiraAuthFailureCode;
  constructor(code: MiraAuthFailureCode, message: string) {
    super(message);
    this.name = 'MiraAuthError';
    this.code = code;
  }
}

export type MiraTokenVerifier = (idToken: string) => Promise<Pick<DecodedIdToken, 'uid'>>;
export interface VerifyFirebaseIdTokenOptions {
  projectId: string;
  /** Injectable official-verifier boundary for focused tests. */
  verifyToken?: MiraTokenVerifier;
}

const ADMIN_APP_NAME = 'warrior-mira-admin';
let adminApp: App | null = null;

function resolveAdminApp(projectId: string): App {
  if (adminApp) return adminApp;
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  adminApp = existing ?? initializeApp({ projectId }, ADMIN_APP_NAME);
  return adminApp;
}

function officialVerifier(projectId: string): MiraTokenVerifier {
  return (idToken) => getAuth(resolveAdminApp(projectId)).verifyIdToken(idToken);
}

export function readBearerToken(authorizationHeader?: string | null): string | null {
  if (typeof authorizationHeader !== 'string') return null;
  const token = authorizationHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return token || null;
}

export async function verifyFirebaseIdToken(
  idToken: string,
  options: VerifyFirebaseIdTokenOptions,
): Promise<{ uid: string }> {
  if (!idToken) throw new MiraAuthError('unauthenticated', 'Missing authentication token.');
  try {
    const decoded = await (options.verifyToken ?? officialVerifier(options.projectId))(idToken);
    if (!decoded.uid) throw new MiraAuthError('unauthenticated', 'Authentication token has no subject.');
    return { uid: decoded.uid };
  } catch (error) {
    if (error instanceof MiraAuthError) throw error;
    const code = String((error as { code?: unknown })?.code ?? '');
    const rejectedTokenCodes = new Set([
      'auth/argument-error',
      'auth/id-token-expired',
      'auth/id-token-revoked',
      'auth/invalid-id-token',
      'auth/user-disabled',
    ]);
    if (rejectedTokenCodes.has(code)) {
      throw new MiraAuthError('unauthenticated', 'Authentication token is invalid or expired.');
    }
    throw new MiraAuthError('auth_unavailable', 'Sign-in verification service is unavailable.');
  }
}

export interface MiraRequestLike { headers: Record<string, unknown>; }

export async function authenticateMiraRequest(
  request: MiraRequestLike,
  options: VerifyFirebaseIdTokenOptions,
): Promise<{ ok: true; uid: string } | { ok: false; status: 401 | 503; code: MiraAuthFailureCode }> {
  const header = typeof request.headers.authorization === 'string' ? request.headers.authorization : null;
  const token = readBearerToken(header);
  if (!token) return { ok: false, status: 401, code: 'unauthenticated' };
  try {
    const { uid } = await verifyFirebaseIdToken(token, options);
    return { ok: true, uid };
  } catch (error) {
    const code = error instanceof MiraAuthError ? error.code : 'auth_unavailable';
    return { ok: false, status: code === 'auth_unavailable' ? 503 : 401, code };
  }
}
