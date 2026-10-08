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

export interface MiraDecodedIdentity extends Pick<DecodedIdToken, 'uid'> {
  iss?: string;
  aud?: string;
  iat?: number;
  auth_time?: number;
  firebase?: { sign_in_provider?: string };
}

export type MiraTokenVerifier = (idToken: string) => Promise<MiraDecodedIdentity>;
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

export interface SafeFirebaseTokenMetadata {
  format: 'jwt' | 'opaque';
  segmentCount: number;
  issuer?: string;
  audience?: string;
  uid?: string;
  signInProvider?: string;
  issuedAt?: number;
  authTime?: number;
}

function boundedString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 200 ? value : undefined;
}

export function readSafeFirebaseTokenMetadata(idToken: string): SafeFirebaseTokenMetadata {
  const segments = idToken.split('.');
  const metadata: SafeFirebaseTokenMetadata = {
    format: segments.length === 3 ? 'jwt' : 'opaque',
    segmentCount: segments.length,
  };
  if (segments.length !== 3) return metadata;

  try {
    const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8')) as Record<string, unknown>;
    const firebase = payload.firebase as { sign_in_provider?: unknown } | undefined;
    return {
      ...metadata,
      issuer: boundedString(payload.iss),
      audience: boundedString(payload.aud),
      uid: boundedString(payload.sub),
      signInProvider: boundedString(firebase?.sign_in_provider),
      issuedAt: typeof payload.iat === 'number' ? payload.iat : undefined,
      authTime: typeof payload.auth_time === 'number' ? payload.auth_time : undefined,
    };
  } catch {
    return metadata;
  }
}

function verificationFailureStage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Decoding Firebase ID token failed')) return 'decode';
  if (message.includes('Error fetching public keys for Google certs')) return 'public-key-fetch';
  if (message.includes('invalid signature')) return 'signature';
  if (message.includes('does not correspond to a known public key')) return 'public-key-id';
  if (message.includes('incorrect "aud"')) return 'audience';
  if (message.includes('incorrect "iss"')) return 'issuer';
  if (message.includes('no "kid"')) return 'key-id';
  if (message.includes('incorrect algorithm')) return 'algorithm';
  if (message.includes('subject')) return 'subject';
  return 'verifyIdToken';
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
    const stage = verificationFailureStage(error);
    const rejectedTokenCodes = new Set([
      'auth/argument-error',
      'auth/id-token-expired',
      'auth/id-token-revoked',
      'auth/invalid-id-token',
      'auth/user-disabled',
    ]);
    if (rejectedTokenCodes.has(code) && stage !== 'public-key-fetch') {
      if (!options.verifyToken) {
        console.warn('[Mira auth] Firebase rejected an ID token.', {
          code,
          stage,
          expectedProjectId: options.projectId,
          token: readSafeFirebaseTokenMetadata(idToken),
        });
      }
      throw new MiraAuthError('unauthenticated', 'Authentication token is invalid or expired.');
    }
    if (!options.verifyToken) {
      console.warn('[Mira auth] Firebase token verification is unavailable.', {
        code: code || 'unknown',
        stage,
        expectedProjectId: options.projectId,
      });
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
