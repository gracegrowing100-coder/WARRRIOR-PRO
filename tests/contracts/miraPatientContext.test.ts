import { describe, expect, it, vi } from 'vitest';
import {
  buildMiraPatientContext,
  type MiraPatientContextDataSource,
} from '../../services/miraPatientContext';

const NOW = new Date('2026-10-08T12:00:00.000Z');

function createSource(overrides: Partial<MiraPatientContextDataSource> = {}): MiraPatientContextDataSource {
  return {
    getProfile: vi.fn(async () => ({
      state: 'recorded' as const,
      data: { scdType: 'HbSS', bloodType: 'O+', age: 28 },
    })),
    getMedications: vi.fn(async () => ({ state: 'missing' as const, data: null })),
    getPain: vi.fn(async () => ({ state: 'missing' as const, data: null })),
    getSymptoms: vi.fn(async () => ({ state: 'missing' as const, data: null })),
    getHydration: vi.fn(async (_userId: string, dates: string[]) => (
      dates.map(date => ({ date, state: 'missing' as const, data: null }))
    )),
    getCheckIns: vi.fn(async (_userId: string, dates: string[]) => (
      dates.map(date => ({ date, state: 'missing' as const, data: null }))
    )),
    getMedicalRecords: vi.fn(async () => ({ state: 'missing' as const, data: null })),
    getAppointments: vi.fn(async () => ({ state: 'missing' as const, data: null })),
    ...overrides,
  };
}

function build(
  dataSource: MiraPatientContextDataSource,
  input: Partial<Parameters<typeof buildMiraPatientContext>[0]> = {},
) {
  return buildMiraPatientContext({
    userId: 'patient-1',
    topic: 'other',
    intent: 'education',
    ...input,
  }, { dataSource, now: () => NOW });
}

describe('Mira patient context builder', () => {
  it('includes a valid patient-entered SCD type in profile context', async () => {
    const snapshot = await build(createSource());

    expect(snapshot.profile.scdType).toEqual({
      value: 'HbSS',
      provenance: 'patient-entered',
      storageState: 'recorded',
      freshness: 'unknown',
    });
  });

  it('treats Not Specified and N/A profile values as unknown and missing', async () => {
    const snapshot = await build(createSource({
      getProfile: vi.fn(async () => ({
        state: 'recorded' as const,
        data: { scdType: 'Not Specified', bloodType: 'N/A', age: undefined },
      })),
    }));

    expect(snapshot.profile.scdType).toMatchObject({ value: null, storageState: 'missing', freshness: 'unknown' });
    expect(snapshot.profile.bloodType).toMatchObject({ value: null, storageState: 'missing' });
    expect(snapshot.profile.age).toMatchObject({ value: null, storageState: 'missing' });
  });

  it('selects the current day hydration record without inventing a timestamp', async () => {
    const source = createSource({
      getHydration: vi.fn(async (_userId: string, dates: string[]) => dates.map(date => ({
        date,
        state: 'recorded' as const,
        data: date === '2026-10-08' ? { amount: 2.25, goal: 3 } : null,
      }))),
    });

    const snapshot = await build(source, { topic: 'hydration' });

    expect(snapshot.hydrationToday).toMatchObject({
      storageState: 'recorded',
      freshness: 'unknown',
      value: { date: '2026-10-08', amount: 2.25, goal: 3, freshness: 'unknown' },
    });
  });

  it('does not convert malformed hydration values into zero or a default goal', async () => {
    const source = createSource({
      getHydration: vi.fn(async (_userId: string, dates: string[]) => dates.map(date => ({
        date,
        state: 'recorded' as const,
        data: date === '2026-10-08' ? { amount: 'not-recorded', goal: 'not-recorded' } : null,
      }))),
    });

    const snapshot = await build(source, { topic: 'hydration' });

    expect(snapshot.hydrationToday).toMatchObject({ value: null, storageState: 'missing' });
    expect(JSON.stringify(snapshot)).not.toContain('"amount":0');
  });

  it('excludes pain records older than seven days from default context', async () => {
    const source = createSource({
      getPain: vi.fn(async () => ({
        state: 'recorded' as const,
        data: [
          { dateStr: '2026-09-30', painLevel: 8, timestamp: '2026-09-30T12:00:00Z' },
          { dateStr: '2026-10-04', painLevel: 3, timestamp: '2026-10-04T12:00:00Z' },
        ],
      })),
    });

    const snapshot = await build(source, { topic: 'pain' });

    expect(snapshot.windowDays).toBe(7);
    expect(snapshot.recentPain?.value?.map(item => item.date)).toEqual(['2026-10-04']);
    expect(source.getPain).toHaveBeenCalledWith('patient-1', '2026-10-02');
  });

  it('includes active medication and excludes inactive medication', async () => {
    const source = createSource({
      getMedications: vi.fn(async () => ({
        state: 'recorded' as const,
        data: [
          { id: 'active-id', name: 'Synthetic active medicine', dosage: '1 unit', active: true },
          { id: 'inactive-id', name: 'Synthetic inactive medicine', dosage: '2 units', active: false },
          { id: 'stopped-id', name: 'Synthetic stopped medicine', status: 'stopped' },
        ],
      })),
    });

    const snapshot = await build(source, { topic: 'medication', intent: 'medication_education' });

    expect(snapshot.medications?.active.value).toEqual([{
      name: 'Synthetic active medicine',
      dosage: '1 unit',
    }]);
    expect(JSON.stringify(snapshot)).not.toContain('active-id');
    expect(JSON.stringify(snapshot)).not.toContain('inactive-id');
  });

  it('selects Medical Records fields and never dumps the whole document', async () => {
    const source = createSource({
      getMedicalRecords: vi.fn(async () => ({
        state: 'recorded' as const,
        data: {
          medications: [{
            name: 'Synthetic history medicine',
            dosage: '1 unit',
            adherenceNotes: 'PRIVATE_UNRELATED_NOTE',
          }],
          emergencyInfo: { hematologistName: 'PRIVATE_CLINICIAN', hematologistPhone: 'PRIVATE_PHONE' },
          notesJournal: 'PRIVATE_WHOLE_RECORD_NOTE',
          attachedFiles: [{ url: 'PRIVATE_ATTACHMENT' }],
        },
      })),
    });

    const snapshot = await build(source, { topic: 'medication' });
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.medicalBackground?.value).toEqual({
      medicationHistory: [{ name: 'Synthetic history medicine', dosage: '1 unit' }],
    });
    expect(serialized).not.toContain('PRIVATE_UNRELATED_NOTE');
    expect(serialized).not.toContain('PRIVATE_WHOLE_RECORD_NOTE');
    expect(serialized).not.toContain('PRIVATE_ATTACHMENT');
  });

  it('excludes appointment context unless care navigation or appointment preparation is requested', async () => {
    const appointments = vi.fn(async () => ({
      state: 'recorded' as const,
      data: [{ id: 'private-id', bookedDate: '2026-10-20', bookedTime: '10:00', status: 'Requested' }],
    }));
    const source = createSource({ getAppointments: appointments });

    const general = await build(source);
    expect(general).not.toHaveProperty('appointmentContext');
    expect(appointments).not.toHaveBeenCalled();

    const navigation = await build(source, { intent: 'care_navigation' });
    expect(navigation.appointmentContext?.value).toEqual({
      requests: [{ preferredDate: '2026-10-20', preferredTime: '10:00', status: 'Requested' }],
    });
    expect(JSON.stringify(navigation)).not.toContain('private-id');
  });

  it('preserves cached context after a cloud read failure with a valid scoped cache', async () => {
    const snapshot = await build(createSource({
      getPain: vi.fn(async () => ({
        state: 'cached' as const,
        data: [{ dateStr: '2026-10-06', painLevel: 4, timestamp: '2026-10-06T12:00:00Z' }],
      })),
    }), { topic: 'pain' });

    expect(snapshot.recentPain).toMatchObject({ storageState: 'cached' });
    expect(snapshot.recentPain?.value?.[0]).toMatchObject({ storageState: 'cached', painLevel: 4 });

    const deviceOnly = await build(createSource({
      getPain: vi.fn(async () => ({
        state: 'device-only' as const,
        data: [{ dateStr: '2026-10-06', painLevel: 2 }],
      })),
    }), { topic: 'pain' });
    expect(deviceOnly.recentPain).toMatchObject({ storageState: 'device-only' });
    expect(deviceOnly.recentPain?.value?.[0]).toMatchObject({ storageState: 'device-only' });
  });

  it('returns unavailable rather than fabricating context after a failed read with no cache', async () => {
    const snapshot = await build(createSource({
      getPain: vi.fn(async () => { throw new Error('offline'); }),
    }), { topic: 'pain' });

    expect(snapshot.recentPain).toEqual({
      value: null,
      provenance: 'patient-entered',
      storageState: 'unavailable',
      freshness: 'unknown',
    });
  });

  it('preserves stale timestamps as stale', async () => {
    const snapshot = await build(createSource({
      getPain: vi.fn(async () => ({
        state: 'recorded' as const,
        data: [{ dateStr: '2026-10-07', painLevel: 5, timestamp: '2026-09-01T12:00:00Z' }],
      })),
    }), { topic: 'pain' });

    expect(snapshot.recentPain).toMatchObject({ freshness: 'stale' });
    expect(snapshot.recentPain?.value?.[0]).toMatchObject({ freshness: 'stale' });
  });

  it('uses unknown freshness when no reliable timestamp exists', async () => {
    const snapshot = await build(createSource({
      getPain: vi.fn(async () => ({
        state: 'recorded' as const,
        data: [{ dateStr: '2026-10-07', painLevel: 5 }],
      })),
    }), { topic: 'pain' });

    expect(snapshot.recentPain).toMatchObject({ freshness: 'unknown' });
    expect(snapshot.recentPain?.value?.[0]).toMatchObject({ freshness: 'unknown' });
  });

  it('excludes unrelated profile PII and the Firebase UID from the snapshot', async () => {
    const snapshot = await build(createSource({
      getProfile: vi.fn(async () => ({
        state: 'recorded' as const,
        data: {
          scdType: 'HbSC',
          bloodType: 'A+',
          age: 31,
          email: 'private@example.test',
          phone: 'PRIVATE_PHONE',
          address: 'PRIVATE_ADDRESS',
          uid: 'PRIVATE_UID',
        },
      })),
    }));
    const serialized = JSON.stringify(snapshot);

    expect(serialized).not.toContain('private@example.test');
    expect(serialized).not.toContain('PRIVATE_PHONE');
    expect(serialized).not.toContain('PRIVATE_ADDRESS');
    expect(serialized).not.toContain('PRIVATE_UID');
    expect(serialized).not.toContain('patient-1');
  });

  it('excludes emergency-contact identity from selected Medical Records context', async () => {
    const snapshot = await build(createSource({
      getMedicalRecords: vi.fn(async () => ({
        state: 'recorded' as const,
        data: {
          background: { primaryDiagnosis: 'Synthetic recorded diagnosis' },
          emergencyInfo: {
            emergencyContactName: 'PRIVATE_CONTACT_NAME',
            emergencyContactPhone: 'PRIVATE_CONTACT_PHONE',
          },
        },
      })),
    }), { topic: 'scd_basics' });
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.medicalBackground?.value).toEqual({ primaryDiagnosis: 'Synthetic recorded diagnosis' });
    expect(serialized).not.toContain('PRIVATE_CONTACT_NAME');
    expect(serialized).not.toContain('PRIVATE_CONTACT_PHONE');
  });

  it('keeps a partial snapshot when one relevant source fails', async () => {
    const snapshot = await build(createSource({
      getSymptoms: vi.fn(async () => { throw new Error('symptoms offline'); }),
      getHydration: vi.fn(async (_userId: string, dates: string[]) => dates.map(date => ({
        date,
        state: 'recorded' as const,
        data: date === '2026-10-08' ? { amount: 1.75 } : null,
      }))),
    }), { topic: 'hydration' });

    expect(snapshot.hydrationToday?.value).toMatchObject({ amount: 1.75 });
    expect(snapshot.recentSymptoms).toMatchObject({ value: null, storageState: 'unavailable' });
    expect(snapshot.profile.scdType.value).toBe('HbSS');
  });

  it('keeps builds stateless and passes only the requested UID to every source', async () => {
    const profile = vi.fn(async (userId: string) => ({
      state: 'recorded' as const,
      data: { scdType: userId === 'patient-a' ? 'HbSS' : 'HbSC' },
    }));
    const source = createSource({ getProfile: profile });

    const first = await build(source, { userId: 'patient-a' });
    const second = await build(source, { userId: 'patient-b' });

    expect(first.profile.scdType.value).toBe('HbSS');
    expect(second.profile.scdType.value).toBe('HbSC');
    expect(profile.mock.calls).toEqual([['patient-a'], ['patient-b']]);
    expect(JSON.stringify(first)).not.toContain('patient-a');
    expect(JSON.stringify(second)).not.toContain('patient-b');
  });

  it('loads up to 30 days only when the explicit trend window is requested', async () => {
    const pain = vi.fn(async () => ({
      state: 'recorded' as const,
      data: [{ dateStr: '2026-09-15', painLevel: 2, timestamp: '2026-09-15T12:00:00Z' }],
    }));
    const snapshot = await build(createSource({ getPain: pain }), {
      topic: 'pain',
      includeTrendWindow: true,
    });

    expect(snapshot.windowDays).toBe(30);
    expect(snapshot.recentPain?.value?.[0].date).toBe('2026-09-15');
    expect(pain).toHaveBeenCalledWith('patient-1', '2026-09-09');
  });
});
