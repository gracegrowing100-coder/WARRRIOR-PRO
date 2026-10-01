import { describe, expect, it, vi } from 'vitest';
import { authenticateMiraRequest, verifyFirebaseIdToken } from '../../server/mira/miraAuth';

const PROJECT_ID = 'warrior-test-project';

describe('Mira Firebase Admin token boundary', () => {
  it('returns only the UID produced by the official verifier', async () => {
    const verifyToken = vi.fn(async () => ({ uid: 'patient-1' }));
    await expect(verifyFirebaseIdToken('valid-token', { projectId: PROJECT_ID, verifyToken })).resolves.toEqual({
      uid: 'patient-1',
    });
    expect(verifyToken).toHaveBeenCalledWith('valid-token');
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

  it('rejects a verifier result without a UID', async () => {
    const verifyToken = vi.fn(async () => ({ uid: '' }));
    const result = await authenticateMiraRequest(
      { headers: { authorization: 'Bearer signed-token' } },
      { projectId: PROJECT_ID, verifyToken },
    );
    expect(result).toEqual({ ok: false, status: 401, code: 'unauthenticated' });
  });
});
