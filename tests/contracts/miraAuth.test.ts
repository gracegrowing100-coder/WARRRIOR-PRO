import { describe, expect, it, vi } from 'vitest';
import {
  authenticateMiraRequest,
  readSafeFirebaseTokenMetadata,
  verifyFirebaseIdToken,
} from '../../server/mira/miraAuth';

const PROJECT_ID = 'warrior-test-project';

describe('Mira Firebase Admin token boundary', () => {
  it('returns only the UID produced by the official verifier', async () => {
    const verifyToken = vi.fn(async () => ({ uid: 'patient-1' }));
    await expect(verifyFirebaseIdToken('valid-token', { projectId: PROJECT_ID, verifyToken })).resolves.toEqual({
      uid: 'patient-1',
    });
    expect(verifyToken).toHaveBeenCalledWith('valid-token');
  });

  it.each(['password', 'google.com'])('accepts a valid Firebase token from %s', async (signInProvider) => {
    const verifyToken = vi.fn(async () => ({
      uid: 'same-patient',
      iss: `https://securetoken.google.com/${PROJECT_ID}`,
      aud: PROJECT_ID,
      firebase: { sign_in_provider: signInProvider },
    }));

    await expect(verifyFirebaseIdToken(`${signInProvider}-token`, { projectId: PROJECT_ID, verifyToken })).resolves.toEqual({
      uid: 'same-patient',
    });
  });

  it('maps both valid providers to the same server identity', async () => {
    const passwordVerifier = vi.fn(async () => ({ uid: 'same-patient', firebase: { sign_in_provider: 'password' } }));
    const googleVerifier = vi.fn(async () => ({ uid: 'same-patient', firebase: { sign_in_provider: 'google.com' } }));

    const passwordIdentity = await verifyFirebaseIdToken('password-token', {
      projectId: PROJECT_ID,
      verifyToken: passwordVerifier,
    });
    const googleIdentity = await verifyFirebaseIdToken('google-token', {
      projectId: PROJECT_ID,
      verifyToken: googleVerifier,
    });

    expect(googleIdentity).toEqual(passwordIdentity);
  });

  it('maps Firebase Auth token rejection to a bounded 401', async () => {
    const error = Object.assign(new Error('expired'), { code: 'auth/id-token-expired' });
    const verifyToken = vi.fn(async () => { throw error; });
    const result = await authenticateMiraRequest(
      { headers: { authorization: 'Bearer expired-token' } },
      { projectId: PROJECT_ID, verifyToken },
    );
    expect(result).toEqual({ ok: false, status: 401, code: 'unauthenticated' });
  });

  it('maps an invalid Firebase token to 401', async () => {
    const error = Object.assign(new Error('Decoding Firebase ID token failed.'), { code: 'auth/argument-error' });
    const verifyToken = vi.fn(async () => { throw error; });
    const result = await authenticateMiraRequest(
      { headers: { authorization: 'Bearer malformed-token' } },
      { projectId: PROJECT_ID, verifyToken },
    );
    expect(result).toEqual({ ok: false, status: 401, code: 'unauthenticated' });
  });

  it('extracts only bounded non-secret token diagnostics', () => {
    const payload = Buffer.from(JSON.stringify({
      iss: `https://securetoken.google.com/${PROJECT_ID}`,
      aud: PROJECT_ID,
      sub: 'same-patient',
      iat: 123,
      auth_time: 120,
      firebase: { sign_in_provider: 'google.com' },
      secret: 'must-not-appear',
    })).toString('base64url');
    const metadata = readSafeFirebaseTokenMetadata(`header.${payload}.signature`);

    expect(metadata).toEqual({
      format: 'jwt',
      segmentCount: 3,
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      uid: 'same-patient',
      signInProvider: 'google.com',
      issuedAt: 123,
      authTime: 120,
    });
    expect(JSON.stringify(metadata)).not.toContain('must-not-appear');
    expect(JSON.stringify(metadata)).not.toContain(payload);
  });

  it('rejects missing bearer credentials before calling the verifier', async () => {
    const verifyToken = vi.fn(async () => ({ uid: 'patient-1' }));
    const result = await authenticateMiraRequest({ headers: {} }, { projectId: PROJECT_ID, verifyToken });
    expect(result).toEqual({ ok: false, status: 401, code: 'unauthenticated' });
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('maps verifier infrastructure failure to a bounded 503', async () => {
    const verifyToken = vi.fn(async () => { throw new Error('certificate service unavailable'); });
    const result = await authenticateMiraRequest(
      { headers: { authorization: 'Bearer signed-token' } },
      { projectId: PROJECT_ID, verifyToken },
    );
    expect(result).toEqual({ ok: false, status: 503, code: 'auth_unavailable' });
  });

  it('maps Firebase public-key retrieval failure to a bounded 503', async () => {
    const error = Object.assign(
      new Error('Error fetching public keys for Google certs: unable to verify certificate chain'),
      { code: 'auth/argument-error' },
    );
    const verifyToken = vi.fn(async () => { throw error; });
    const result = await authenticateMiraRequest(
      { headers: { authorization: 'Bearer signed-token' } },
      { projectId: PROJECT_ID, verifyToken },
    );
    expect(result).toEqual({ ok: false, status: 503, code: 'auth_unavailable' });
  });

  it('rejects a verifier result without a UID', async () => {
    const verifyToken = vi.fn(async () => ({ uid: '' }));
    const result = await authenticateMiraRequest(
      { headers: { authorization: 'Bearer signed-token' } },
      { projectId: PROJECT_ID, verifyToken },
    );
    expect(result).toEqual({ ok: false, status: 401, code: 'unauthenticated' });
  });
});
