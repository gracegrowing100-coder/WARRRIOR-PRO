import type {
  MiraAppointmentContext,
  MiraCheckInContext,
  MiraClinicalIntent,
  MiraClinicalTopic,
  MiraContextFreshness,
  MiraContextProvenance,
  MiraContextStorageState,
  MiraContextValue,
  MiraHydrationContext,
  MiraMedicalBackgroundContext,
  MiraMedicationContext,
  MiraPainContext,
  MiraPatientContextSnapshot,
  MiraSymptomContext,
} from './miraClinicalContracts';

type UnknownRecord = Record<string, unknown>;

export const MIRA_PATIENT_CONTEXT_LIMITS = Object.freeze({
  defaultWindowDays: 7,
  trendWindowDays: 30,
  medications: 12,
  eventItems: 12,
  trendEventItems: 30,
  appointments: 5,
  medicalRecordItems: 8,
  listItems: 8,
  shortStringChars: 160,
  medicalTextChars: 500,
} as const);

export interface MiraPatientContextSourceResult<T> {
  state: MiraContextStorageState;
  data: T | null;
  recordedAt?: unknown;
}

export interface MiraDatedPatientContextSourceResult<T> extends MiraPatientContextSourceResult<T> {
  date: string;
}

export interface MiraPatientContextDataSource {
  getProfile(userId: string): Promise<MiraPatientContextSourceResult<UnknownRecord>>;
  getMedications(userId: string): Promise<MiraPatientContextSourceResult<UnknownRecord[]>>;
  getPain(userId: string, startDate: string): Promise<MiraPatientContextSourceResult<UnknownRecord[]>>;
  getSymptoms(userId: string, startDate: string): Promise<MiraPatientContextSourceResult<UnknownRecord[]>>;
  getHydration(
    userId: string,
    dates: string[],
  ): Promise<Array<MiraDatedPatientContextSourceResult<UnknownRecord>>>;
  getCheckIns(
    userId: string,
    dates: string[],
  ): Promise<Array<MiraDatedPatientContextSourceResult<UnknownRecord>>>;
  getMedicalRecords(userId: string): Promise<MiraPatientContextSourceResult<UnknownRecord>>;
  getAppointments(userId: string): Promise<MiraPatientContextSourceResult<UnknownRecord[]>>;
}

export interface BuildMiraPatientContextInput {
  userId: string;
  topic: MiraClinicalTopic;
  intent: MiraClinicalIntent;
  includeTrendWindow?: boolean;
}

export interface BuildMiraPatientContextDependencies {
  dataSource: MiraPatientContextDataSource;
  now?: () => Date;
}

const PATIENT_ENTERED: MiraContextProvenance = 'patient-entered';
const PATIENT_MAINTAINED: MiraContextProvenance = 'patient-maintained';
const UNKNOWN_VALUES = new Set([
  '',
  'n/a',
  'na',
  'not applicable',
  'not specified',
  'not recorded',
  'unknown',
  'undefined',
  'null',
]);

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(
  value: unknown,
  maxLength: number = MIRA_PATIENT_CONTEXT_LIMITS.shortStringChars,
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  if (UNKNOWN_VALUES.has(cleaned.toLowerCase())) return undefined;
  return cleaned.slice(0, maxLength);
}

function cleanNumber(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : undefined;
}

function cleanBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function cleanStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => cleanString(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, MIRA_PATIENT_CONTEXT_LIMITS.listItems);
}

function getPath(source: UnknownRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => (
    isRecord(current) ? current[key] : undefined
  ), source);
}

function toIsoTimestamp(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (isRecord(value) && typeof value.toDate === 'function') {
    try {
      const date = (value.toDate as () => unknown)();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
    } catch {
      return undefined;
    }
  }
  if (isRecord(value) && typeof value.seconds === 'number') {
    const date = new Date(value.seconds * 1_000);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
}

function recordTimestamp(record: UnknownRecord, fallback?: unknown): string | undefined {
  return toIsoTimestamp(record.updatedAt)
    ?? toIsoTimestamp(record.timestamp)
    ?? toIsoTimestamp(record.createdAt)
    ?? toIsoTimestamp(fallback);
}

function freshness(recordedAt: string | undefined, now: Date, windowDays: number): MiraContextFreshness {
  if (!recordedAt) return 'unknown';
  const age = now.getTime() - Date.parse(recordedAt);
  if (!Number.isFinite(age)) return 'unknown';
  return age <= windowDays * 86_400_000 ? 'current' : 'stale';
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function datesForWindow(now: Date, days: number): string[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    return formatLocalDate(date);
  });
}

function unavailableSource<T>(): MiraPatientContextSourceResult<T> {
  return { state: 'unavailable', data: null };
}

async function safeRead<T>(read: () => Promise<MiraPatientContextSourceResult<T>>) {
  try {
    return await read();
  } catch {
    return unavailableSource<T>();
  }
}

async function safeDatedRead<T>(
  dates: string[],
  read: () => Promise<Array<MiraDatedPatientContextSourceResult<T>>>,
) {
  try {
    return await read();
  } catch {
    return dates.map(date => ({ date, state: 'unavailable' as const, data: null }));
  }
}

function contextValue<T>(
  value: T | null,
  sourceState: MiraContextStorageState,
  provenance: MiraContextProvenance,
  recordedAt: string | undefined,
  currentNow: Date,
  freshnessWindowDays: number,
): MiraContextValue<T> {
  const sourceHasNoValue = sourceState === 'missing' || sourceState === 'unavailable';
  const safeValue = sourceHasNoValue ? null : value;
  const noValueState = sourceState === 'unavailable' ? 'unavailable' : 'missing';
  return {
    value: safeValue,
    provenance,
    storageState: safeValue === null ? noValueState : sourceState,
    ...(safeValue !== null && recordedAt ? { recordedAt } : {}),
    freshness: safeValue === null ? 'unknown' : freshness(recordedAt, currentNow, freshnessWindowDays),
  };
}

function selectedState(states: MiraContextStorageState[]): MiraContextStorageState {
  if (states.includes('device-only')) return 'device-only';
  if (states.includes('cached')) return 'cached';
  if (states.includes('recorded')) return 'recorded';
  if (states.includes('unavailable')) return 'unavailable';
  return 'missing';
}

function latestTimestamp(values: Array<string | undefined>): string | undefined {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}

function itemState(state: MiraContextStorageState): 'recorded' | 'cached' | 'device-only' {
  return state === 'cached' || state === 'device-only' ? state : 'recorded';
}

function isActiveMedication(record: UnknownRecord): boolean {
  if (record.active === false || record.isActive === false) return false;
  const status = cleanString(record.status)?.toLowerCase();
  return status !== 'inactive' && status !== 'stopped' && status !== 'discontinued';
}

function medicationContext(record: UnknownRecord): MiraMedicationContext | null {
  const name = cleanString(record.name);
  if (!name) return null;
  const dosage = cleanString(record.dosage);
  const time = cleanString(record.time, 20);
  const frequency = cleanString(record.frequency, 80);
  const lastTakenDate = cleanString(record.lastTakenDate, 20);
  return {
    name,
    ...(dosage ? { dosage } : {}),
    ...(time ? { time } : {}),
    ...(frequency ? { frequency } : {}),
    ...(lastTakenDate ? { lastTakenDate } : {}),
  };
}

function sourcePlan(topic: MiraClinicalTopic, intent: MiraClinicalIntent) {
  const symptomTopics: MiraClinicalTopic[] = [
    'pain', 'fever_infection', 'hydration', 'fatigue_anemia',
    'acute_chest', 'breathing', 'neurological', 'mental_wellbeing',
  ];
  const painTopics: MiraClinicalTopic[] = ['pain', 'acute_chest', 'breathing', 'neurological'];
  const checkInTopics: MiraClinicalTopic[] = [
    'hydration', 'fever_infection', 'fatigue_anemia', 'mental_wellbeing',
  ];
  const medicalRecordTopics: MiraClinicalTopic[] = [
    'scd_basics', 'fever_infection', 'fatigue_anemia', 'medication',
    'hydroxyurea', 'transfusion',
  ];
  return {
    medications: topic === 'medication' || topic === 'hydroxyurea' || intent === 'medication_education',
    pain: painTopics.includes(topic),
    symptoms: symptomTopics.includes(topic),
    hydration: topic === 'hydration',
    checkIns: checkInTopics.includes(topic),
    medicalRecords: medicalRecordTopics.includes(topic) || intent === 'medication_education',
    appointments: intent === 'care_navigation' || intent === 'appointment_preparation',
  };
}

function sanitizeMedicalBackground(
  record: UnknownRecord,
  topic: MiraClinicalTopic,
  intent: MiraClinicalIntent,
): MiraMedicalBackgroundContext | null {
  const selected: MiraMedicalBackgroundContext = {};

  if (topic === 'scd_basics') {
    const primaryDiagnosis = cleanString(getPath(record, 'background.primaryDiagnosis'));
    if (primaryDiagnosis) selected.primaryDiagnosis = primaryDiagnosis;
  }

  if (topic === 'fever_infection') {
    const allergies = cleanString(
      getPath(record, 'background.allergies'),
      MIRA_PATIENT_CONTEXT_LIMITS.medicalTextChars,
    );
    const immunizations = cleanStringList(record.immunizations);
    if (allergies) selected.allergies = allergies;
    if (immunizations.length > 0) selected.immunizations = immunizations;
  }

  if (topic === 'medication' || topic === 'hydroxyurea' || intent === 'medication_education') {
    const history = Array.isArray(record.medications)
      ? record.medications
        .filter(isRecord)
        .map(item => {
          const name = cleanString(item.name);
          if (!name) return null;
          const dosage = cleanString(item.dosage);
          const startDate = cleanString(item.startDate, 20);
          const endDate = cleanString(item.endDate, 20);
          const isActive = cleanBoolean(item.isActive);
          return {
            name,
            ...(dosage ? { dosage } : {}),
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
            ...(isActive === undefined ? {} : { isActive }),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .slice(0, MIRA_PATIENT_CONTEXT_LIMITS.medicalRecordItems)
      : [];
    if (history.length > 0) selected.medicationHistory = history;

    if (topic === 'hydroxyurea') {
      const response = cleanString(
        getPath(record, 'diseaseModifyingTherapy.hydroxyureaResponse'),
        MIRA_PATIENT_CONTEXT_LIMITS.medicalTextChars,
      );
      const latestHbf = cleanNumber(getPath(record, 'diseaseModifyingTherapy.latestHbF'), 0, 100);
      const sideEffects = cleanString(
        getPath(record, 'diseaseModifyingTherapy.sideEffects'),
        MIRA_PATIENT_CONTEXT_LIMITS.medicalTextChars,
      );
      if (response || latestHbf !== undefined || sideEffects) {
        selected.hydroxyurea = {
          ...(response ? { response } : {}),
          ...(latestHbf === undefined ? {} : { latestHbf }),
          ...(sideEffects ? { sideEffects } : {}),
        };
      }
    }
  }

  if (topic === 'transfusion' && Array.isArray(record.transfusions)) {
    const transfusions = record.transfusions
      .filter(isRecord)
      .map(item => {
        const date = cleanString(item.date, 20);
        const volumeMl = cleanNumber(item.volumeMl);
        const units = cleanNumber(item.units);
        return date || volumeMl !== undefined || units !== undefined
          ? {
            ...(date ? { date } : {}),
            ...(volumeMl === undefined ? {} : { volumeMl }),
            ...(units === undefined ? {} : { units }),
          }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, MIRA_PATIENT_CONTEXT_LIMITS.medicalRecordItems);
    if (transfusions.length > 0) selected.transfusions = transfusions;
  }

  if (topic === 'fatigue_anemia' && Array.isArray(record.labs)) {
    const recentLabs = record.labs
      .filter(isRecord)
      .map(item => {
        const date = cleanString(item.date, 20);
        const numericFields = {
          hemoglobin: cleanNumber(item.hemoglobin),
          reticulocyte: cleanNumber(item.reticulocyte),
          bilirubin: cleanNumber(item.bilirubin),
          ldh: cleanNumber(item.ldh),
          ferritin: cleanNumber(item.ferritin),
          hbfPercentage: cleanNumber(item.hbfPercentage, 0, 100),
        };
        if (!date && Object.values(numericFields).every(value => value === undefined)) return null;
        return {
          ...(date ? { date } : {}),
          ...Object.fromEntries(Object.entries(numericFields).filter(([, value]) => value !== undefined)),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((left, right) => String(right.date ?? '').localeCompare(String(left.date ?? '')))
      .slice(0, MIRA_PATIENT_CONTEXT_LIMITS.medicalRecordItems);
    if (recentLabs.length > 0) selected.recentLabs = recentLabs;
  }

  return Object.keys(selected).length > 0 ? selected : null;
}

export async function buildMiraPatientContext(
  input: BuildMiraPatientContextInput,
  dependencies: BuildMiraPatientContextDependencies,
): Promise<MiraPatientContextSnapshot> {
  const userId = input.userId.trim();
  if (!userId) throw new Error('A signed-in patient UID is required to build Mira context.');

  const currentNow = dependencies.now?.() ?? new Date();
  const windowDays = input.includeTrendWindow
    ? MIRA_PATIENT_CONTEXT_LIMITS.trendWindowDays
    : MIRA_PATIENT_CONTEXT_LIMITS.defaultWindowDays;
  const dates = datesForWindow(currentNow, windowDays);
  const startDate = dates[0];
  const today = dates[dates.length - 1];
  const plan = sourcePlan(input.topic, input.intent);

  const [profile, medications, pain, symptoms, hydration, checkIns, medicalRecords, appointments] = await Promise.all([
    safeRead(() => dependencies.dataSource.getProfile(userId)),
    plan.medications ? safeRead(() => dependencies.dataSource.getMedications(userId)) : Promise.resolve(undefined),
    plan.pain ? safeRead(() => dependencies.dataSource.getPain(userId, startDate)) : Promise.resolve(undefined),
    plan.symptoms ? safeRead(() => dependencies.dataSource.getSymptoms(userId, startDate)) : Promise.resolve(undefined),
    plan.hydration
      ? safeDatedRead(dates, () => dependencies.dataSource.getHydration(userId, dates))
      : Promise.resolve(undefined),
    plan.checkIns
      ? safeDatedRead(dates, () => dependencies.dataSource.getCheckIns(userId, dates))
      : Promise.resolve(undefined),
    plan.medicalRecords
      ? safeRead(() => dependencies.dataSource.getMedicalRecords(userId))
      : Promise.resolve(undefined),
    plan.appointments
      ? safeRead(() => dependencies.dataSource.getAppointments(userId))
      : Promise.resolve(undefined),
  ]);

  const profileData = profile.data && isRecord(profile.data) ? profile.data : null;
  const profileRecordedAt = profileData ? recordTimestamp(profileData, profile.recordedAt) : undefined;
  const profileField = <T>(value: T | undefined): MiraContextValue<T> => contextValue(
    value ?? null,
    profile.state,
    PATIENT_ENTERED,
    profileRecordedAt,
    currentNow,
    MIRA_PATIENT_CONTEXT_LIMITS.trendWindowDays,
  );

  const snapshot: MiraPatientContextSnapshot = {
    profile: {
      scdType: profileField(profileData ? cleanString(profileData.scdType) : undefined),
      bloodType: profileField(profileData ? cleanString(profileData.bloodType) : undefined),
      age: profileField(profileData ? cleanNumber(profileData.age, 0, 130) : undefined),
    },
    generatedAt: currentNow.toISOString(),
    windowDays,
  };

  if (medications) {
    const source = medications.data ?? [];
    const active = source
      .filter(isRecord)
      .filter(isActiveMedication)
      .map(medicationContext)
      .filter((item): item is MiraMedicationContext => Boolean(item))
      .slice(0, MIRA_PATIENT_CONTEXT_LIMITS.medications);
    const recordedAt = latestTimestamp(source.filter(isRecord).map(item => recordTimestamp(item, medications.recordedAt)));
    snapshot.medications = {
      active: contextValue(
        medications.data === null ? null : active,
        medications.state,
        PATIENT_MAINTAINED,
        recordedAt,
        currentNow,
        MIRA_PATIENT_CONTEXT_LIMITS.trendWindowDays,
      ),
    };
  }

  if (pain) {
    const items = (pain.data ?? [])
      .filter(isRecord)
      .filter(item => typeof item.dateStr === 'string' && item.dateStr >= startDate && item.dateStr <= today)
      .map(item => {
        const painLevel = cleanNumber(item.painLevel, 0, 10);
        if (painLevel === undefined) return null;
        const recordedAt = recordTimestamp(item, pain.recordedAt);
        return {
          date: item.dateStr as string,
          painLevel,
          triggers: cleanStringList(item.triggers),
          ...(recordedAt ? { recordedAt } : {}),
          freshness: freshness(recordedAt, currentNow, windowDays),
          storageState: itemState(pain.state),
        } satisfies MiraPainContext;
      })
      .filter((item): item is MiraPainContext => Boolean(item))
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, input.includeTrendWindow
        ? MIRA_PATIENT_CONTEXT_LIMITS.trendEventItems
        : MIRA_PATIENT_CONTEXT_LIMITS.eventItems);
    const recordedAt = latestTimestamp(items.map(item => item.recordedAt));
    snapshot.recentPain = contextValue(
      pain.data === null ? null : items,
      pain.state,
      PATIENT_ENTERED,
      recordedAt,
      currentNow,
      windowDays,
    );
  }

  if (symptoms) {
    const items = (symptoms.data ?? [])
      .filter(isRecord)
      .filter(item => typeof item.dateStr === 'string' && item.dateStr >= startDate && item.dateStr <= today)
      .map(item => {
        const recordedAt = recordTimestamp(item, symptoms.recordedAt);
        const painLevel = cleanNumber(item.painLevel, 0, 10);
        const waterIntake = cleanNumber(item.waterIntake);
        return {
          date: item.dateStr as string,
          symptoms: cleanStringList(item.symptoms),
          triggers: cleanStringList(item.triggers),
          ...(painLevel === undefined ? {} : { painLevel }),
          ...(waterIntake === undefined ? {} : { waterIntake }),
          ...(recordedAt ? { recordedAt } : {}),
          freshness: freshness(recordedAt, currentNow, windowDays),
          storageState: itemState(symptoms.state),
        } satisfies MiraSymptomContext;
      })
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, input.includeTrendWindow
        ? MIRA_PATIENT_CONTEXT_LIMITS.trendEventItems
        : MIRA_PATIENT_CONTEXT_LIMITS.eventItems);
    const recordedAt = latestTimestamp(items.map(item => item.recordedAt));
    snapshot.recentSymptoms = contextValue(
      symptoms.data === null ? null : items,
      symptoms.state,
      PATIENT_ENTERED,
      recordedAt,
      currentNow,
      windowDays,
    );
  }

  if (hydration) {
    const items = hydration
      .filter(item => item.state !== 'missing' && item.state !== 'unavailable' && item.data && isRecord(item.data))
      .map(item => {
        const data = item.data as UnknownRecord;
        const amount = cleanNumber(data.amount);
        if (amount === undefined) return null;
        const goal = cleanNumber(data.goal);
        const recordedAt = recordTimestamp(data, item.recordedAt);
        return {
          date: item.date,
          amount,
          ...(goal === undefined ? {} : { goal }),
          ...(recordedAt ? { recordedAt } : {}),
          freshness: freshness(recordedAt, currentNow, windowDays),
          storageState: itemState(item.state),
        } satisfies MiraHydrationContext;
      })
      .filter((item): item is MiraHydrationContext => Boolean(item));
    const states = hydration.map(item => item.state);
    const collectionState = selectedState(states);
    const recordedAt = latestTimestamp(items.map(item => item.recordedAt));
    const todaySource = hydration.find(item => item.date === today);
    const todayItem = items.find(item => item.date === today) ?? null;
    snapshot.hydrationToday = contextValue(
      todayItem,
      todaySource?.state ?? 'missing',
      PATIENT_ENTERED,
      todayItem?.recordedAt,
      currentNow,
      1,
    );
    snapshot.recentHydration = contextValue(
      items.length > 0 ? items : null,
      collectionState,
      PATIENT_ENTERED,
      recordedAt,
      currentNow,
      windowDays,
    );
  }

  if (checkIns) {
    const items = checkIns
      .filter(item => item.state !== 'missing' && item.state !== 'unavailable' && item.data && isRecord(item.data))
      .map(item => {
        const data = item.data as UnknownRecord;
        const emotion = cleanString(data.emotion);
        const score = cleanNumber(data.score, 0, 10);
        if (!emotion && score === undefined) return null;
        const recordedAt = recordTimestamp(data, item.recordedAt);
        return {
          date: item.date,
          ...(emotion ? { emotion } : {}),
          ...(score === undefined ? {} : { score }),
          ...(recordedAt ? { recordedAt } : {}),
          freshness: freshness(recordedAt, currentNow, windowDays),
          storageState: itemState(item.state),
        } satisfies MiraCheckInContext;
      })
      .filter((item): item is MiraCheckInContext => Boolean(item));
    const recordedAt = latestTimestamp(items.map(item => item.recordedAt));
    snapshot.recentCheckIns = contextValue(
      items.length > 0 ? items : null,
      selectedState(checkIns.map(item => item.state)),
      PATIENT_ENTERED,
      recordedAt,
      currentNow,
      windowDays,
    );
  }

  if (medicalRecords) {
    const data = medicalRecords.data && isRecord(medicalRecords.data) ? medicalRecords.data : null;
    const selected = data ? sanitizeMedicalBackground(data, input.topic, input.intent) : null;
    const recordedAt = data ? recordTimestamp(data, medicalRecords.recordedAt) : undefined;
    snapshot.medicalBackground = contextValue(
      selected,
      selected ? medicalRecords.state : medicalRecords.state === 'unavailable' ? 'unavailable' : 'missing',
      PATIENT_MAINTAINED,
      recordedAt,
      currentNow,
      MIRA_PATIENT_CONTEXT_LIMITS.trendWindowDays,
    );
  }

  if (appointments) {
    const requests = (appointments.data ?? [])
      .filter(isRecord)
      .filter(item => cleanString(item.status)?.toLowerCase() !== 'cancelled')
      .map(item => {
        const preferredDate = cleanString(item.bookedDate ?? item.preferredDate, 20);
        const preferredTime = cleanString(item.bookedTime ?? item.preferredTime, 20);
        const status = cleanString(item.status, 80);
        return preferredDate || preferredTime || status
          ? {
            ...(preferredDate ? { preferredDate } : {}),
            ...(preferredTime ? { preferredTime } : {}),
            ...(status ? { status } : {}),
          }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, MIRA_PATIENT_CONTEXT_LIMITS.appointments);
    const recordedAt = latestTimestamp(
      (appointments.data ?? []).filter(isRecord).map(item => recordTimestamp(item, appointments.recordedAt)),
    );
    snapshot.appointmentContext = contextValue<MiraAppointmentContext>(
      appointments.data === null ? null : { requests },
      appointments.state,
      PATIENT_MAINTAINED,
      recordedAt,
      currentNow,
      MIRA_PATIENT_CONTEXT_LIMITS.trendWindowDays,
    );
  }

  return snapshot;
}
