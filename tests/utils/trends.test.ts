import { describe, expect, it } from 'vitest';
import { chartPoints, computeTrends, formatShortDate, parseDateKey, sanitizeEntries, splitSegments, toDateKey } from '../../utils/trends';

const now = new Date('2026-10-30T12:00:00');
const day = (offset: number) => {
  const date = new Date(now);
  date.setDate(now.getDate() - offset);
  return date.toLocaleDateString('sv');
};

describe('trends', () => {
  it('handles empty input', () => {
    const result = computeTrends([], 30, now);
    expect(result).toMatchObject({ count: 0, averagePain: null, highest: null, daysLogged: 0, averageWater: null, topSymptoms: [], pattern: null });
    expect(chartPoints([], 30, now)).toEqual([]);
  });

  it('handles a single entry, including a recorded zero', () => {
    const result = computeTrends([{ dateStr: day(0), painLevel: 0, waterIntake: 0 }], 7, now);
    expect(result.count).toBe(1);
    expect(result.averagePain).toBe(0);
    expect(result.highest).toEqual({ level: 0, dateStr: day(0) });
    expect(result.averageWater).toBe(0);
  });

  it('computes average, highest, top symptoms and range filtering', () => {
    const result = computeTrends([
      { dateStr: day(0), painLevel: 3, symptoms: ['Tired'], waterIntake: 2 },
      { dateStr: day(2), painLevel: 7, symptoms: ['Tired', 'Fever'], waterIntake: 3 },
      { dateStr: day(20), painLevel: 9, symptoms: ['Fever'] },
    ], 7, now);
    expect(result.count).toBe(2);
    expect(result.averagePain).toBe(5);
    expect(result.highest).toEqual({ level: 7, dateStr: day(2) });
    expect(result.averageWater).toBe(2.5);
    expect(result.topSymptoms[0]).toEqual(['Tired', 2]);
  });

  it('skips malformed entries without throwing', () => {
    const raw = [
      null, 'x', {}, { dateStr: 'nope', painLevel: 4 }, { dateStr: day(1), painLevel: 'abc' },
      { dateStr: day(1), painLevel: 11 }, { dateStr: day(1), painLevel: NaN },
      { dateStr: day(1), painLevel: '5', symptoms: 'Tired', triggers: [1, 'cold'], waterIntake: -2 },
    ] as unknown[];
    const clean = sanitizeEntries(raw);
    expect(clean).toHaveLength(1);
    expect(clean[0]).toMatchObject({ painLevel: 5, triggers: ['cold'], symptoms: undefined, waterIntake: undefined });
    expect(() => computeTrends(raw as never, 30, now)).not.toThrow();
  });

  it('coerces Firestore timestamps and ISO strings to date keys', () => {
    expect(toDateKey({ toDate: () => new Date('2026-10-12T12:00:00') })).toBe('2026-10-12');
    expect(toDateKey({ seconds: new Date('2026-10-12T12:00:00').getTime() / 1000 })).toBe('2026-10-12');
    expect(toDateKey('2026-10-12T12:00:00')).toBe('2026-10-12');
    expect(toDateKey('2026-02-31')).toBeNull();
    expect(toDateKey(undefined)).toBeNull();
    const [entry] = sanitizeEntries([{ painLevel: 2, timestamp: { toDate: () => new Date('2026-10-12T12:00:00') } }]);
    expect(entry.dateStr).toBe('2026-10-12');
  });

  it('formats invalid dates as empty instead of throwing', () => {
    expect(parseDateKey('bad')).toBeNull();
    expect(formatShortDate('bad')).toBe('');
    expect(formatShortDate('2026-10-12')).toContain('Oct');
  });

  it('only reports a pattern with enough entries on each side', () => {
    const few = Array.from({ length: 6 }, (_, i) => ({ dateStr: day(i), painLevel: i < 3 ? 7 : 3, triggers: i < 3 ? ['cold'] : [] }));
    expect(computeTrends(few, 30, now).pattern).toBeNull();
    const enough = Array.from({ length: 12 }, (_, i) => ({ dateStr: day(i), painLevel: i < 6 ? 7 : 3, triggers: i < 6 ? ['cold'] : [] }));
    const pattern = computeTrends(enough, 30, now).pattern;
    expect(pattern).toEqual({ trigger: 'cold', withAverage: 7, withoutAverage: 3 });
  });

  it('breaks chart segments on missing days', () => {
    const points = chartPoints([
      { dateStr: day(0), painLevel: 2 }, { dateStr: day(1), painLevel: 3 }, { dateStr: day(4), painLevel: 5 },
    ], 7, now);
    const segments = splitSegments(points);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toHaveLength(1);
    expect(segments[1]).toHaveLength(2);
  });
});

