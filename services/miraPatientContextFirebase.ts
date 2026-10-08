import {
  firebaseService,
  type DailyCheckInHistoryData,
  type HydrationContextData,
} from './firebaseService';
import {
  buildMiraPatientContext,
  type BuildMiraPatientContextInput,
  type MiraDatedPatientContextSourceResult,
  type MiraPatientContextDataSource,
  type MiraPatientContextSourceResult,
} from './miraPatientContext';

type UnknownRecord = Record<string, unknown>;

function state(state: 'recorded' | 'cached' | 'missing' | 'unavailable' | 'empty') {
  return state === 'empty' ? 'missing' as const : state;
}

function dated<T extends object>(
  records: Array<{ dateStr: string; state: 'recorded' | 'cached' | 'missing' | 'unavailable'; data: T | null }>,
): Array<MiraDatedPatientContextSourceResult<UnknownRecord>> {
  return records.map(record => ({
    date: record.dateStr,
    state: record.state,
    data: record.data as UnknownRecord | null,
  }));
}

export const firebaseMiraPatientContextDataSource: MiraPatientContextDataSource = {
  async getProfile(userId) {
    const result = await firebaseService.getUserProfileState(userId);
    return { state: result.state, data: result.data as UnknownRecord | null };
  },
  async getMedications(userId) {
    const result = await firebaseService.getMedicationScheduleResult(userId);
    return { state: result.state, data: result.data as UnknownRecord[] };
  },
  async getPain(userId, startDate) {
    const result = await firebaseService.getPainHistory(userId, startDate);
    return { state: result.state, data: result.data as unknown as UnknownRecord[] };
  },
  async getSymptoms(userId, startDate) {
    const result = await firebaseService.getSymptomHistory(userId, startDate);
    return { state: result.state, data: result.data as unknown as UnknownRecord[] };
  },
  async getHydration(userId, dates) {
    const result = await firebaseService.getHydrationContextHistory(userId, dates);
    return dated<HydrationContextData>(result);
  },
  async getCheckIns(userId, dates) {
    const result = await firebaseService.getDailyCheckInHistory(userId, dates);
    return dated<DailyCheckInHistoryData>(result);
  },
  async getMedicalRecords(userId) {
    const result = await firebaseService.getCareVaultResult(userId);
    return { state: state(result.state), data: result.state === 'empty' ? null : result.data };
  },
  async getAppointments(userId) {
    const result = await firebaseService.getAppointmentRequests(userId);
    return {
      state: state(result.state),
      data: result.state === 'empty' ? null : result.data as UnknownRecord[],
    };
  },
};

/** Dormant H2 entry point. No current Mira route or provider calls this function. */
export function buildFirebaseMiraPatientContext(input: BuildMiraPatientContextInput) {
  return buildMiraPatientContext(input, { dataSource: firebaseMiraPatientContextDataSource });
}

export type { MiraPatientContextSourceResult };
