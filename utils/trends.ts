export interface TrendEntry {
  dateStr: string;
  painLevel: number;
  symptoms?: string[];
  triggers?: string[];
  waterIntake?: number;
}

export interface TrendResult {
  count: number;
  rangeDays: number;
  averagePain: number | null;
  highest: { level: number; dateStr: string } | null;
  daysLogged: number;
  averageWater: number | null;
  topSymptoms: Array<[string, number]>;
  pattern: { trigger: string; withAverage: number; withoutAverage: number } | null;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
export const MIN_PATTERN_ENTRIES = 5;

const localKey = (date: Date) => date.toLocaleDateString('sv');

export const parseDateKey = (key: unknown): Date | null => {
  if (typeof key !== 'string' || !DATE_KEY.test(key)) return null;
  const date = new Date(`${key}T12:00:00`);
  return Number.isNaN(date.getTime()) || localKey(date) !== key ? null : date;
};

export const toDateKey = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && DATE_KEY.test(value)) return parseDateKey(value) ? value : null;
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value === 'string' || typeof value === 'number') date = new Date(value);
  else if (typeof value === 'object') {
    const stamp = value as { toDate?: unknown; seconds?: unknown; _seconds?: unknown };
    if (typeof stamp.toDate === 'function') {
      try { date = (stamp.toDate as () => Date).call(value); } catch { date = null; }
    } else if (typeof stamp.seconds === 'number') date = new Date(stamp.seconds * 1000);
    else if (typeof stamp._seconds === 'number') date = new Date(stamp._seconds * 1000);
  }
  return date && !Number.isNaN(date.getTime()) ? localKey(date) : null;
};

const format = (dateStr: string, options: Intl.DateTimeFormatOptions) => {
  const date = parseDateKey(dateStr);
  return date ? new Intl.DateTimeFormat('en-GB', options).format(date) : '';
};

export const formatShortDate = (dateStr: string) => format(dateStr, { day: 'numeric', month: 'short' });
export const formatLongDate = (dateStr: string) => format(dateStr, { weekday: 'short', day: 'numeric', month: 'short' });
export const formatFullDate = (dateStr: string) => format(dateStr, { day: 'numeric', month: 'short', year: 'numeric' });

export const rangeDateKeys = (days: number, now: Date = new Date()) =>
  Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    return localKey(date);
  });

const cleanList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const list = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
  return list.length ? list : undefined;
};

export const sanitizeEntries = (raw: unknown): Array<TrendEntry & Record<string, unknown>> => {
  if (!Array.isArray(raw)) return [];
  const byDate = new Map<string, TrendEntry & Record<string, unknown>>();
  raw.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const entry = item as Record<string, unknown>;
    const pain = typeof entry.painLevel === 'string' && entry.painLevel.trim() !== '' ? Number(entry.painLevel) : entry.painLevel;
    if (typeof pain !== 'number' || !Number.isFinite(pain) || pain < 0 || pain > 10) return;
    const dateStr = toDateKey(entry.dateStr) ?? toDateKey(entry.timestamp) ?? toDateKey(entry.updatedAt);
    if (!dateStr) return;
    const water = typeof entry.waterIntake === 'number' && Number.isFinite(entry.waterIntake) && entry.waterIntake >= 0 ? entry.waterIntake : undefined;
    byDate.set(dateStr, { ...entry, dateStr, painLevel: pain, symptoms: cleanList(entry.symptoms), triggers: cleanList(entry.triggers), waterIntake: water });
  });
  return Array.from(byDate.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
};

const mean = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

export const computeTrends = (entries: TrendEntry[], rangeDays: number, now: Date = new Date()): TrendResult => {
  const keys = new Set(rangeDateKeys(rangeDays, now));
  const inRange = sanitizeEntries(entries).filter((entry) => keys.has(entry.dateStr));
  const highest = inRange.reduce<TrendResult['highest']>(
    (best, entry) => (!best || entry.painLevel > best.level ? { level: entry.painLevel, dateStr: entry.dateStr } : best),
    null,
  );
  const symptomCounts = new Map<string, number>();
  inRange.forEach((entry) => {
    new Set(entry.symptoms ?? []).forEach((symptom) => symptomCounts.set(symptom, (symptomCounts.get(symptom) ?? 0) + 1));
  });
  const topSymptoms = Array.from(symptomCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);

  const triggerNames = new Set<string>();
  inRange.forEach((entry) => (entry.triggers ?? []).forEach((trigger) => triggerNames.add(trigger)));
  let pattern: TrendResult['pattern'] = null;
  let bestGap = 0.5;
  triggerNames.forEach((trigger) => {
    const withTrigger = inRange.filter((entry) => entry.triggers?.includes(trigger)).map((entry) => entry.painLevel);
    const without = inRange.filter((entry) => !entry.triggers?.includes(trigger)).map((entry) => entry.painLevel);
    if (withTrigger.length < MIN_PATTERN_ENTRIES || without.length < MIN_PATTERN_ENTRIES) return;
    const withAverage = mean(withTrigger) as number;
    const withoutAverage = mean(without) as number;
    if (withAverage - withoutAverage >= bestGap) {
      bestGap = withAverage - withoutAverage;
      pattern = { trigger, withAverage, withoutAverage };
    }
  });

  return {
    count: inRange.length,
    rangeDays,
    averagePain: mean(inRange.map((entry) => entry.painLevel)),
    highest,
    daysLogged: inRange.length,
    averageWater: mean(inRange.map((entry) => entry.waterIntake).filter((value): value is number => typeof value === 'number')),
    topSymptoms,
    pattern,
  };
};

export interface ChartPoint { dateStr: string; painLevel: number; dayIndex: number }

export const chartPoints = (entries: TrendEntry[], rangeDays: number, now: Date = new Date()): ChartPoint[] => {
  const keys = rangeDateKeys(rangeDays, now).reverse();
  const indexByKey = new Map(keys.map((key, index) => [key, index]));
  return sanitizeEntries(entries)
    .filter((entry) => indexByKey.has(entry.dateStr))
    .map((entry) => ({ dateStr: entry.dateStr, painLevel: entry.painLevel, dayIndex: indexByKey.get(entry.dateStr) as number }))
    .sort((a, b) => a.dayIndex - b.dayIndex);
};

export const splitSegments = (points: ChartPoint[]): ChartPoint[][] => {
  const segments: ChartPoint[][] = [];
  points.forEach((point) => {
    const last = segments[segments.length - 1];
    if (last && point.dayIndex - last[last.length - 1].dayIndex === 1) last.push(point);
    else segments.push([point]);
  });
  return segments;
};

