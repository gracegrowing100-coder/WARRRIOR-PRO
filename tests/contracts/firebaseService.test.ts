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

  it('upserts a guest symptom entry by date instead of duplicating it', async () => {
    vi.spyOn(firebaseService, 'updateStreak').mockResolvedValue(1);

    await firebaseService.addSymptomLog('', 2, ['Fatigue'], [], 1, '2026-09-25');
    await firebaseService.addSymptomLog('', 7, ['Fever'], ['Infection'], 2, '2026-09-25');

    expect(JSON.parse(localStorage.getItem('warrior_symptom_logs') || '[]')).toEqual([
      expect.objectContaining({
        dateStr: '2026-09-25',
        painLevel: 7,
        symptoms: ['Fever'],
        triggers: ['Infection'],
        waterIntake: 2,
      }),
    ]);
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

    expect(JSON.parse(localStorage.getItem('warrior_symptom_logs_user-1') || '[]')).toHaveLength(1);
    expect(pain).not.toHaveBeenCalled();
    expect(water).not.toHaveBeenCalled();
  });

  it('persists guest hydration by date and reads it without Firestore', async () => {
    vi.spyOn(firebaseService, 'updateStreak').mockResolvedValue(1);

    await expect(firebaseService.saveWaterLog('', '2026-09-25', 1.75, 3)).resolves.toEqual({
      state: 'device-only', data: { amount: 1.75, goal: 3 },
    });

    await expect(firebaseService.getWaterLog('', '2026-09-25')).resolves.toEqual({
      state: 'recorded', data: { amount: 1.75, goal: 3 },
    });
    expect(firestore.setDoc).not.toHaveBeenCalled();
  });

  it('classifies a stored hydration amount of zero as recorded history', async () => {
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ amount: 0, goal: 3 }),
    });

    await expect(firebaseService.getHydrationHistory('user-1', ['2026-09-25'])).resolves.toEqual([
      { dateStr: '2026-09-25', state: 'recorded', data: { amount: 0, goal: 3 } },
    ]);
  });

  it('distinguishes missing hydration from zero and unavailable hydration', async () => {
    firestore.getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.getHydrationHistory('user-1', ['2026-09-25', '2026-09-24'])).resolves.toEqual([
      { dateStr: '2026-09-25', state: 'missing', data: null },
      { dateStr: '2026-09-24', state: 'unavailable', data: null },
    ]);
  });

  it('labels a local hydration record as cached when cloud confirmation fails', async () => {
    localStorage.setItem('health_history_water_user-1_2026-09-25', JSON.stringify({ amount: 1.5, goal: 3 }));
    firestore.getDoc.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.getHydrationHistory('user-1', ['2026-09-25'])).resolves.toEqual([
      { dateStr: '2026-09-25', state: 'cached', data: { amount: 1.5, goal: 3 } },
    ]);
  });

  it('does not use stale hydration cache when cloud confirms the record is missing', async () => {
    localStorage.setItem('health_history_water_user-1_2026-09-25', JSON.stringify({ amount: 1.5, goal: 3 }));
    firestore.getDoc.mockResolvedValueOnce({ exists: () => false });

    await expect(firebaseService.getHydrationHistory('user-1', ['2026-09-25'])).resolves.toEqual([
      { dateStr: '2026-09-25', state: 'missing', data: null },
    ]);
  });

  it('does not expose the unscoped hydration cache to an authenticated history read', async () => {
    localStorage.setItem('water_2026-09-25', JSON.stringify({ amount: 2.5, goal: 3 }));
    firestore.getDoc.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.getHydrationHistory('user-1', ['2026-09-25'])).resolves.toEqual([
      { dateStr: '2026-09-25', state: 'unavailable', data: null },
    ]);
  });

  it('preserves presence for daily check-in history without exposing a synthetic default', async () => {
    firestore.getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ emotion: 'Managing / OK', score: 6, note: 'Resting' }),
      })
      .mockResolvedValueOnce({ exists: () => false });

    await expect(firebaseService.getDailyCheckInHistory('user-1', ['2026-09-25', '2026-09-24'])).resolves.toEqual([
      {
        dateStr: '2026-09-25',
        state: 'recorded',
        data: { emotion: 'Managing / OK', score: 6, note: 'Resting' },
      },
      { dateStr: '2026-09-24', state: 'missing', data: null },
    ]);
  });

  it('returns legacy-format records from the current UID-scoped symptom cache when Firestore is unavailable', async () => {
    localStorage.setItem('warrior_symptom_logs_user-1', JSON.stringify([
      { id: 'mine', dateStr: '2026-09-25', painLevel: 0 },
    ]));
    firestore.getDocs.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.getSymptomHistory('user-1')).resolves.toEqual({
      state: 'cached',
      data: [{ id: 'mine', dateStr: '2026-09-25', painLevel: 0 }],
    });
  });

  it('preserves guest medication add, taken update, and delete behavior', async () => {
    const medication = await firebaseService.addMedication('', {
      name: 'Hydroxyurea',
      dosage: '500mg',
      time: '08:00',
    });

    await firebaseService.updateMedication('', medication.data.id, { lastTakenDate: '2026-09-25' });
    expect(JSON.parse(localStorage.getItem('warrior_meds') || '[]')[0]).toEqual(
      expect.objectContaining({ name: 'Hydroxyurea', lastTakenDate: '2026-09-25' }),
    );

    await firebaseService.deleteMedication('', medication.data.id);
    expect(JSON.parse(localStorage.getItem('warrior_meds') || '[]')).toEqual([]);
  });

  it('loads cached medications when Firestore is unavailable', async () => {
    const cached = [{ id: 'med-1', name: 'Hydroxyurea', dosage: '500mg', time: '08:00' }];
    localStorage.setItem('warrior_meds_user-1', JSON.stringify(cached));
    firestore.getDocs.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.getMedications('user-1')).resolves.toEqual(cached);
  });

  it('does not cache an authenticated medication until its cloud create succeeds', async () => {
    firestore.addDoc.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.addMedication('user-1', { name: 'Folic Acid', dosage: '5mg', time: '12:00' })).rejects.toThrow('offline');

    expect(localStorage.getItem('warrior_meds_user-1')).toBeNull();
  });

  it('distinguishes missing, unavailable, and recorded-zero hydration reads', async () => {
    firestore.getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ amount: 0, goal: 3 }) });

    await expect(firebaseService.getWaterLog('user-1', '2026-09-25')).resolves.toEqual({ state: 'missing', data: null });
    await expect(firebaseService.getWaterLog('user-1', '2026-09-24')).resolves.toEqual({ state: 'unavailable', data: null });
    await expect(firebaseService.getWaterLog('user-1', '2026-09-23')).resolves.toEqual({ state: 'recorded', data: { amount: 0, goal: 3 } });
  });

  it('continues a daily check-in when its optional history copy is device-only', async () => {
    firestore.addDoc.mockRejectedValueOnce(new Error('permission-denied'));

    await expect(firebaseService.saveDailyMoodCheckIn('user-1', '2026-09-25', {
      emoji: '😊', emotion: 'Good & Steady', score: 8,
    })).resolves.toEqual(expect.objectContaining({
      state: 'recorded',
      historyState: 'device-only',
      data: expect.objectContaining({ emotion: 'Good & Steady', dateStr: '2026-09-25' }),
    }));
    expect(firestore.setDoc).toHaveBeenCalled();
  });

  it('reports hydration and medication mutations as device-only after cloud failure when local storage changed', async () => {
    localStorage.setItem('warrior_meds_user-1', JSON.stringify([{ id: 'med-1', name: 'Existing' }]));
    firestore.setDoc.mockRejectedValueOnce(new Error('offline'));
    firestore.updateDoc.mockRejectedValueOnce(new Error('offline'));
    firestore.deleteDoc.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.saveWaterLog('user-1', '2026-09-25', 1, 3)).resolves.toEqual({ state: 'device-only', data: { amount: 1, goal: 3 } });
    await expect(firebaseService.updateMedication('user-1', 'med-1', { lastTakenDate: '2026-09-25' })).resolves.toEqual(expect.objectContaining({ state: 'device-only' }));
    await expect(firebaseService.deleteMedication('user-1', 'med-1')).resolves.toEqual(expect.objectContaining({ state: 'device-only' }));
  });

  it('isolates authenticated symptom caches by UID and ignores the legacy global cache', async () => {
    localStorage.setItem('warrior_symptom_logs', JSON.stringify([
      { id: 'legacy', userId: 'user-1', dateStr: '2026-09-25', painLevel: 9 },
    ]));
    localStorage.setItem('warrior_symptom_logs_user-1', JSON.stringify([
      { id: 'mine', userId: 'user-1', dateStr: '2026-09-25', painLevel: 2 },
    ]));
    localStorage.setItem('warrior_symptom_logs_user-2', JSON.stringify([
      { id: 'theirs', userId: 'user-2', dateStr: '2026-09-25', painLevel: 7 },
    ]));
    firestore.getDocs.mockRejectedValue(new Error('offline'));

    await expect(firebaseService.getSymptomLogs('user-1')).resolves.toEqual([
      expect.objectContaining({ id: 'mine', painLevel: 2 }),
    ]);
    await expect(firebaseService.getSymptomLogs('user-2')).resolves.toEqual([
      expect.objectContaining({ id: 'theirs', painLevel: 7 }),
    ]);
  });

  it('keeps same-day authenticated pain writes in separate UID caches', async () => {
    vi.spyOn(firebaseService, 'updateStreak').mockResolvedValue(1);
    firestore.getDocs.mockResolvedValue({ empty: true, docs: [] });

    await firebaseService.addPainLog('user-1', 2, '2026-09-25');
    await firebaseService.addPainLog('user-2', 8, '2026-09-25');

    expect(JSON.parse(localStorage.getItem('warrior_pain_user-1') || '[]')).toEqual([
      expect.objectContaining({ userId: 'user-1', painLevel: 2 }),
    ]);
    expect(JSON.parse(localStorage.getItem('warrior_pain_user-2') || '[]')).toEqual([
      expect.objectContaining({ userId: 'user-2', painLevel: 8 }),
    ]);
    expect(localStorage.getItem('warrior_pain')).toBeNull();
  });

  it('keeps authenticated hydration and emergency data in separate UID caches', async () => {
    vi.spyOn(firebaseService, 'updateStreak').mockResolvedValue(1);

    await firebaseService.saveWaterLog('user-1', '2026-09-25', 1, 3);
    await firebaseService.saveWaterLog('user-2', '2026-09-25', 2, 3.5);
    await firebaseService.saveEmergencyInfo('user-1', { emergencyContactName: 'Contact One' });
    await firebaseService.saveEmergencyInfo('user-2', { emergencyContactName: 'Contact Two' });

    expect(JSON.parse(localStorage.getItem('water_user-1_2026-09-25') || '{}')).toEqual({ amount: 1, goal: 3 });
    expect(JSON.parse(localStorage.getItem('water_user-2_2026-09-25') || '{}')).toEqual({ amount: 2, goal: 3.5 });
    expect(JSON.parse(localStorage.getItem('warrior_emergency_user-1') || '{}')).toEqual({ emergencyContactName: 'Contact One' });
    expect(JSON.parse(localStorage.getItem('warrior_emergency_user-2') || '{}')).toEqual({ emergencyContactName: 'Contact Two' });
    expect(localStorage.getItem('water_2026-09-25')).toBeNull();
    expect(localStorage.getItem('warrior_emergency')).toBeNull();
  });

  it('returns empty emergency information instead of sample patient data', async () => {
    localStorage.setItem('warrior_emergency', JSON.stringify({ emergencyContactName: 'Legacy Sample' }));

    await expect(firebaseService.getEmergencyInfo('user-1')).resolves.toEqual({});
    await expect(firebaseService.getEmergencyInfo('')).resolves.toEqual({ emergencyContactName: 'Legacy Sample' });
  });

  it('returns no scheduled reminders until the user creates or saves them', async () => {
    await expect(firebaseService.getScheduledReminders('user-1')).resolves.toEqual([]);
    await expect(firebaseService.getScheduledReminders('')).resolves.toEqual([]);

    const saved = [{ id: 'mine', title: 'User-created reminder', time: '09:15', enabled: true }];
    localStorage.setItem('warrior_reminders_user-1', JSON.stringify(saved));
    await expect(firebaseService.getScheduledReminders('user-1')).resolves.toEqual(saved);
  });

  it('replaces a provisional appointment id after an authenticated cloud create', async () => {
    firestore.addDoc.mockResolvedValueOnce({ id: 'appointment-cloud-id' });

    const result = await firebaseService.addAppointment('user-1', {
      doctorName: 'Dr. Amina',
      status: 'Confirmed',
    });

    expect(result).toEqual(expect.objectContaining({ id: 'appointment-cloud-id', doctorName: 'Dr. Amina' }));
    expect(JSON.parse(localStorage.getItem('warrior_appointments_user-1') || '[]')[0].id).toBe('appointment-cloud-id');
  });

  it('marks an appointment cancelled locally before attempting its cloud update', async () => {
    localStorage.setItem('warrior_appointments_user-1', JSON.stringify([{ id: 'appointment-1', status: 'Confirmed' }]));
    firestore.updateDoc.mockRejectedValueOnce(new Error('offline'));

    await firebaseService.cancelAppointment('user-1', 'appointment-1');

    expect(JSON.parse(localStorage.getItem('warrior_appointments_user-1') || '[]')[0].status).toBe('Cancelled');
  });

  it('loads cached appointments when Firestore is unavailable', async () => {
    const cached = [{ id: 'appointment-1', doctorName: 'Dr. Amina', status: 'Confirmed' }];
    localStorage.setItem('warrior_appointments_user-1', JSON.stringify(cached));
    firestore.getDocs.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.getAppointments('user-1')).resolves.toEqual(cached);
  });

  it('never returns the legacy global appointment cache to an authenticated user', async () => {
    localStorage.setItem('warrior_appointments', JSON.stringify([
      { id: 'legacy-global', patientNote: 'Another patient record' },
    ]));
    firestore.getDocs.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.getAppointmentRequests('user-1')).resolves.toEqual({
      state: 'unavailable',
      data: [],
    });
  });

  it('isolates authenticated appointment caches by UID', async () => {
    localStorage.setItem('warrior_appointments_user-1', JSON.stringify([
      { id: 'user-1-request', bookedDate: '2026-10-12' },
    ]));
    localStorage.setItem('warrior_appointments_user-2', JSON.stringify([
      { id: 'user-2-request', bookedDate: '2026-10-13' },
    ]));
    firestore.getDocs.mockRejectedValue(new Error('offline'));

    await expect(firebaseService.getAppointments('user-1')).resolves.toEqual([
      expect.objectContaining({ id: 'user-1-request' }),
    ]);
    await expect(firebaseService.getAppointments('user-2')).resolves.toEqual([
      expect.objectContaining({ id: 'user-2-request' }),
    ]);
  });

  it('reports successful empty and cached appointment reads truthfully', async () => {
    await expect(firebaseService.getAppointmentRequests('user-1')).resolves.toEqual({
      state: 'empty',
      data: [],
    });

    localStorage.setItem('warrior_appointments_user-1', JSON.stringify([
      { id: 'cached-request', status: 'Requested' },
    ]));
    firestore.getDocs.mockRejectedValueOnce(new Error('offline'));

    await expect(firebaseService.getAppointmentRequests('user-1')).resolves.toEqual({
      state: 'cached',
      data: [expect.objectContaining({ id: 'cached-request' })],
    });
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
