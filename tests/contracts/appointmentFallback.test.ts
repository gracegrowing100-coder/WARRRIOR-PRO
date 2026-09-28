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

describe('Appointment local-write truthfulness', () => {
  beforeEach(() => {
    localStorage.clear();
    firestore.addDoc.mockReset();
    firestore.updateDoc.mockReset();
  });
  it.each(['offline', 'permission-denied'])('retains a single local request on %s without reporting total failure', async (error) => {
    firestore.addDoc.mockRejectedValueOnce(new Error(error));
    await expect(firebaseService.addAppointment('patient-1', {
      bookedDate: '2026-10-12', bookedTime: '14:30', status: 'Requested',
    })).resolves.toBeUndefined();
    const requests = JSON.parse(localStorage.getItem('warrior_appointments_patient-1') || '[]');
    expect(requests).toHaveLength(1);
    expect(requests[0].status).toBe('Requested');
  });
  it.each(['offline', 'permission-denied'])('identifies device-only cancellation on %s', async (error) => {
    localStorage.setItem('warrior_appointments_patient-1', JSON.stringify([{ id: 'r-1', status: 'Requested' }]));
    firestore.updateDoc.mockRejectedValueOnce(new Error(error));
    await expect(firebaseService.cancelAppointment('patient-1', 'r-1')).resolves.toEqual({ state: 'device-only' });
    expect(JSON.parse(localStorage.getItem('warrior_appointments_patient-1') || '[]')).toEqual([{ id: 'r-1', status: 'Cancelled' }]);
  });
  it('does not claim cancellation when neither local nor cloud recording succeeded', async () => {
    firestore.updateDoc.mockRejectedValueOnce(new Error('offline'));
    await expect(firebaseService.cancelAppointment('patient-1', 'missing')).rejects.toThrow('offline');
  });
  it('identifies a cloud-recorded cancellation', async () => {
    firestore.updateDoc.mockResolvedValueOnce(undefined);
    await expect(firebaseService.cancelAppointment('patient-1', 'r-1')).resolves.toEqual({ state: 'recorded' });
  });
});
