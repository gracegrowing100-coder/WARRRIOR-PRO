import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestore = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn((_db: unknown, path: string) => ({ path })),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db: unknown, path: string) => ({ path })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  increment: vi.fn((amount: number) => ({ increment: amount })),
  onSnapshot: vi.fn(),
  orderBy: vi.fn((field: string, direction?: string) => ({ field, direction })),
  query: vi.fn((source: unknown) => source),
  serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));

const firebase = vi.hoisted(() => ({
  auth: { currentUser: null as null | { uid: string; email?: string } },
  db: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  ...firestore,
  Timestamp: { now: vi.fn() },
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadString: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock('../../firebase-init', () => firebase);

import { firebaseService } from '../../services/firebaseService';

describe('Medical Records persistence and account isolation', () => {
  beforeEach(() => {
    firestore.getDoc.mockReset().mockResolvedValue({ exists: () => false });
    firestore.setDoc.mockReset().mockResolvedValue(undefined);
  });
  it('leaves a missing document empty without creating a sample profile', async () => {
    expect(await firebaseService.getCareVaultResult('A')).toEqual({ data: {}, state: 'empty' });
    expect(await firebaseService.getCareVault('A')).toEqual({});
    expect(firestore.setDoc).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('warrior_carevault_A')!)).toEqual({});
  });
  it('reads the existing Firestore path and preserves missing fields, zeroes, and unknown data', async () => {
    const stored = { primaryDiagnosis: '', labs: [{ id: 'lab-user', hemoglobin: 0 }], customField: { retained: true } };
    firestore.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => stored });
    expect(await firebaseService.getCareVaultResult('A')).toEqual({ state: 'recorded', data: stored });
    expect(firestore.doc).toHaveBeenCalledWith(firebase.db, 'users/A/careVault/medicalHistory');
    expect(JSON.parse(localStorage.getItem('warrior_carevault_A')!)).toEqual(stored);
  });
  it('never reads the legacy global cache for an authenticated account', async () => {
    localStorage.setItem('warrior_carevault', JSON.stringify({ primaryDiagnosis: 'Ambiguous legacy information' }));
    firestore.getDoc.mockRejectedValue(new Error('offline'));
    expect(await firebaseService.getCareVaultResult('A')).toEqual({ state: 'unavailable', data: {} });
    expect(localStorage.getItem('warrior_carevault_A')).toBeNull();
    expect(localStorage.getItem('warrior_carevault')).toContain('Ambiguous legacy information');
  });
  it('isolates account caches on both reads and writes', async () => {
    localStorage.setItem('warrior_carevault_A', JSON.stringify({ notesJournal: 'Only A' }));
    firestore.getDoc.mockRejectedValue(new Error('offline'));
    expect(await firebaseService.getCareVaultResult('A')).toEqual({ state: 'cached', data: { notesJournal: 'Only A' } });
    expect(await firebaseService.getCareVaultResult('B')).toEqual({ state: 'unavailable', data: {} });
    firestore.setDoc.mockRejectedValueOnce(new Error('permission-denied'));
    expect(await firebaseService.saveCareVault('B', { allergies: 'Only B' })).toEqual({ state: 'device-only' });
    expect(await firebaseService.getCareVaultResult('B')).toEqual({ state: 'cached', data: { allergies: 'Only B' } });
    expect(JSON.parse(localStorage.getItem('warrior_carevault_A')!)).toEqual({ notesJournal: 'Only A' });
  });
  it('keeps guest compatibility without importing guest data into accounts', async () => {
    localStorage.setItem('warrior_carevault', JSON.stringify({ notesJournal: 'Guest note' }));
    expect(await firebaseService.getCareVault('')).toEqual({ notesJournal: 'Guest note' });
    expect(await firebaseService.getCareVault('A')).toEqual({});
  });
  it('merges edits without replacing unknown fields or changing the Firestore contract', async () => {
    localStorage.setItem('warrior_carevault_A', JSON.stringify({
      notesJournal: 'Keep', customField: 9, emergencyInfo: { hematologistName: 'Recorded contact', customContactField: 'Keep too' },
      painCrises: [{ id: 'legacy-entry' }], attachedFiles: [{ id: 'metadata-only' }],
    }));
    const patch = { emergencyInfo: { hematologistPhone: 'Recorded number' }, labs: [] };
    expect(await firebaseService.saveCareVault('A', patch)).toEqual({ state: 'recorded' });
    expect(firestore.setDoc).toHaveBeenCalledWith({ path: 'users/A/careVault/medicalHistory' }, {
      ...patch, updatedAt: { __serverTimestamp: true },
    }, { merge: true });
    expect(JSON.parse(localStorage.getItem('warrior_carevault_A')!)).toEqual({
      notesJournal: 'Keep', customField: 9, emergencyInfo: { hematologistName: 'Recorded contact', customContactField: 'Keep too', hematologistPhone: 'Recorded number' },
      painCrises: [{ id: 'legacy-entry' }], attachedFiles: [{ id: 'metadata-only' }], labs: [],
    });
  });
  it('reports unusable cache as unavailable instead of manufacturing records', async () => {
    localStorage.setItem('warrior_carevault_A', '{broken');
    firestore.getDoc.mockRejectedValueOnce(new Error('offline'));
    expect(await firebaseService.getCareVaultResult('A')).toEqual({ state: 'unavailable', data: {} });
  });
  it('does not report success when device and cloud writes both fail', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    firestore.setDoc.mockRejectedValueOnce(new Error('offline'));
    await expect(firebaseService.saveCareVault('A', { notesJournal: 'Unsaved' })).rejects.toThrow('could not be saved');
  });
  it('accepts a confirmed cloud save even when device storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(await firebaseService.saveCareVault('A', { notesJournal: 'Cloud only' })).toEqual({ state: 'recorded' });
  });
});
