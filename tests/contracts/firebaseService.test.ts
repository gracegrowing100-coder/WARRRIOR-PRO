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

describe('firebaseService current persistence contracts', () => {
  beforeEach(() => {
    localStorage.clear();
    firebase.auth.currentUser = null;
    firestore.addDoc.mockReset().mockResolvedValue({ id: 'cloud-id' });
    firestore.deleteDoc.mockReset().mockResolvedValue(undefined);
    firestore.getDoc.mockReset().mockResolvedValue({ exists: () => false });
    firestore.getDocs.mockReset().mockResolvedValue({ empty: true, docs: [] });
    firestore.setDoc.mockReset().mockResolvedValue(undefined);
    firestore.updateDoc.mockReset().mockResolvedValue(undefined);
  });

  it('upserts a guest pain entry by date instead of duplicating it', async () => {
    const streak = vi.spyOn(firebaseService, 'updateStreak').mockResolvedValue(1);

    await firebaseService.addPainLog('', 4, '2026-09-25', ['Cold weather']);
    await firebaseService.addPainLog('', 7, '2026-09-25', ['Stress']);

    expect(JSON.parse(localStorage.getItem('warrior_pain') || '[]')).toEqual([
      expect.objectContaining({
        dateStr: '2026-09-25',
        painLevel: 7,
        triggers: ['Stress'],
      }),
    ]);
    expect(streak).toHaveBeenCalledTimes(2);
    expect(firestore.addDoc).not.toHaveBeenCalled();
  });

  it('keeps guest symptoms local without creating linked pain or hydration records', async () => {
    const pain = vi.spyOn(firebaseService, 'addPainLog');
    const water = vi.spyOn(firebaseService, 'saveWaterLog');
    vi.spyOn(firebaseService, 'updateStreak').mockResolvedValue(1);

    await firebaseService.addSymptomLog('', 6, ['Fatigue'], ['Stress'], 1.5, '2026-09-25');

    expect(JSON.parse(localStorage.getItem('warrior_symptom_logs') || '[]')).toEqual([
      expect.objectContaining({
        userId: 'guest',
        painLevel: 6,
        symptoms: ['Fatigue'],
        waterIntake: 1.5,
      }),
    ]);
    expect(pain).not.toHaveBeenCalled();
    expect(water).not.toHaveBeenCalled();
  });

  it('writes an authenticated symptom before invoking linked pain and hydration writes', async () => {
    const pain = vi.spyOn(firebaseService, 'addPainLog').mockResolvedValue(undefined);
    const water = vi.spyOn(firebaseService, 'saveWaterLog').mockResolvedValue(undefined);
    const streak = vi.spyOn(firebaseService, 'updateStreak').mockResolvedValue(1);

    await firebaseService.addSymptomLog('user-1', 5, ['Headache'], ['Cold weather'], 2, '2026-09-25');

    expect(firestore.addDoc).toHaveBeenCalledTimes(1);
    expect(firestore.addDoc.mock.invocationCallOrder[0]).toBeLessThan(pain.mock.invocationCallOrder[0]);
    expect(pain).toHaveBeenCalledWith('user-1', 5, '2026-09-25', ['Cold weather']);
    expect(water).toHaveBeenCalledWith('user-1', '2026-09-25', 2, 3);
    expect(streak).toHaveBeenCalledWith('user-1');
  });

  it('retains the local symptom and stops linked writes when the symptom cloud write fails', async () => {
    firestore.addDoc.mockRejectedValueOnce(new Error('network unavailable'));
    const pain = vi.spyOn(firebaseService, 'addPainLog').mockResolvedValue(undefined);
    const water = vi.spyOn(firebaseService, 'saveWaterLog').mockResolvedValue(undefined);

    await firebaseService.addSymptomLog('user-1', 8, ['Fever'], ['Infection'], 1, '2026-09-25');

    expect(JSON.parse(localStorage.getItem('warrior_symptom_logs') || '[]')).toHaveLength(1);
    expect(pain).not.toHaveBeenCalled();
    expect(water).not.toHaveBeenCalled();
  });

  it('persists guest hydration by date and reads it without Firestore', async () => {
    vi.spyOn(firebaseService, 'updateStreak').mockResolvedValue(1);

    await firebaseService.saveWaterLog('', '2026-09-25', 1.75, 3);

    await expect(firebaseService.getWaterLog('', '2026-09-25')).resolves.toEqual({ amount: 1.75, goal: 3 });
    expect(firestore.setDoc).not.toHaveBeenCalled();
  });

  it('preserves guest medication add, taken update, and delete behavior', async () => {
    const medication = await firebaseService.addMedication('', {
      name: 'Hydroxyurea',
      dosage: '500mg',
      time: '08:00',
    });

    await firebaseService.updateMedication('', medication.id, { lastTakenDate: '2026-09-25' });
    expect(JSON.parse(localStorage.getItem('warrior_meds') || '[]')[0]).toEqual(
      expect.objectContaining({ name: 'Hydroxyurea', lastTakenDate: '2026-09-25' }),
    );

    await firebaseService.deleteMedication('', medication.id);
    expect(JSON.parse(localStorage.getItem('warrior_meds') || '[]')).toEqual([]);
  });

  it('loads cached medications when Firestore is unavailable', async () => {
    const cached = [{ id: 'med-1', name: 'Hydroxyurea', dosage: '500mg', time: '08:00' }];
    localStorage.setItem('warrior_meds', JSON.stringify(cached));
    firestore.getDocs.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.getMedications('user-1')).resolves.toEqual(cached);
  });

  it('does not cache an authenticated medication until its cloud create succeeds', async () => {
    firestore.addDoc.mockRejectedValueOnce(new Error('offline'));

    await firebaseService.addMedication('user-1', { name: 'Folic Acid', dosage: '5mg', time: '12:00' });

    expect(localStorage.getItem('warrior_meds')).toBeNull();
  });

  it('replaces a provisional appointment id after an authenticated cloud create', async () => {
    firestore.addDoc.mockResolvedValueOnce({ id: 'appointment-cloud-id' });

    const result = await firebaseService.addAppointment('user-1', {
      doctorName: 'Dr. Amina',
      status: 'Confirmed',
    });

    expect(result).toEqual(expect.objectContaining({ id: 'appointment-cloud-id', doctorName: 'Dr. Amina' }));
    expect(JSON.parse(localStorage.getItem('warrior_appointments') || '[]')[0].id).toBe('appointment-cloud-id');
  });

  it('marks an appointment cancelled locally before attempting its cloud update', async () => {
    localStorage.setItem('warrior_appointments', JSON.stringify([{ id: 'appointment-1', status: 'Confirmed' }]));
    firestore.updateDoc.mockRejectedValueOnce(new Error('offline'));

    await firebaseService.cancelAppointment('user-1', 'appointment-1');

    expect(JSON.parse(localStorage.getItem('warrior_appointments') || '[]')[0].status).toBe('Cancelled');
  });

  it('loads cached appointments when Firestore is unavailable', async () => {
    const cached = [{ id: 'appointment-1', doctorName: 'Dr. Amina', status: 'Confirmed' }];
    localStorage.setItem('warrior_appointments', JSON.stringify(cached));
    firestore.getDocs.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.getAppointments('user-1')).resolves.toEqual(cached);
  });

  it('preserves unknown profile fields locally and omits createdAt from the cloud update', async () => {
    const profile = {
      displayName: 'Tayo',
      role: 'Warrior',
      createdAt: 'existing-value',
      futureField: { retained: true },
    };

    await firebaseService.updateUserProfile('user-1', profile);

    expect(JSON.parse(localStorage.getItem('user_profile_user-1') || '{}')).toEqual(profile);
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ futureField: { retained: true } }),
    );
    expect(firestore.updateDoc.mock.calls[0][1]).not.toHaveProperty('createdAt');
  });
});
