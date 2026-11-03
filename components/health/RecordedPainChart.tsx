import React, { useMemo } from 'react';
import { chartPoints, formatShortDate, rangeDateKeys, splitSegments, type TrendEntry } from '../../utils/trends';

export interface RecordedPainChartProps {
  entries: TrendEntry[];
  rangeDays?: number;
}

const LEFT = 30;
const SPAN = 290;
const baseline = 134;
const step = 12;

export const RecordedPainChart: React.FC<RecordedPainChartProps> = ({ entries, rangeDays = 30 }) => {
  const { points, segments, highest, first, last } = useMemo(() => {
    const list = chartPoints(entries, rangeDays);
    const keys = rangeDateKeys(rangeDays);
    return {
      points: list,
      segments: splitSegments(list),
      highest: list.reduce<typeof list[number] | null>((best, point) => (!best || point.painLevel > best.painLevel ? point : best), null),
      first: keys[keys.length - 1],
      last: keys[0],
    };
  }, [entries, rangeDays]);

  if (!points.length) return null;

  const x = (dayIndex: number) => LEFT + (dayIndex / Math.max(1, rangeDays - 1)) * SPAN;
  const y = (level: number) => baseline - level * step;
  const summary = `Pain over ${rangeDays} days from ${formatShortDate(first)} to ${formatShortDate(last)}${highest ? `, highest ${highest.painLevel} on ${formatShortDate(highest.dateStr)}` : ''}`;

  return (
    <figure className="flex flex-col gap-2.5 rounded-[28px] bg-wa-surface p-[18px] shadow-none">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-lg font-extrabold text-wa-plum">Pain over time</h3>
        <span className="text-xs text-wa-muted">gaps = no entry</span>
      </div>
      <svg viewBox="0 0 330 170" className="h-[170px] w-full" role="img" aria-label={summary}>
        {[0, 5, 10].map((score) => (
          <g key={score}>
            <line x1={24} x2={330} y1={y(score)} y2={y(score)} className={score === 0 ? 'stroke-wa-line' : 'stroke-wa-line-soft'} />
            <text x={score === 10 ? 0 : 6} y={y(score) + 4} className="fill-wa-muted text-[11px]">{score}</text>
          </g>
        ))}
        {segments.filter((segment) => segment.length > 1).map((segment) => (
          <polyline
            key={segment[0].dateStr}
            points={segment.map((point) => `${x(point.dayIndex)},${y(point.painLevel)}`).join(' ')}
            fill="none"
            className="stroke-wa-crimson"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {points.map((point) => (
          <circle
            key={point.dateStr}
            cx={x(point.dayIndex)}
            cy={y(point.painLevel)}
            r={highest?.dateStr === point.dateStr ? 6 : 3.5}
            className="fill-wa-crimson stroke-wa-surface"
            strokeWidth="2"
          />
        ))}
        {highest && (
          <text x={x(highest.dayIndex)} y={Math.max(12, y(highest.painLevel) - 12)} textAnchor="middle" className="fill-wa-plum font-display text-[12px] font-extrabold">
            {highest.painLevel}
          </text>
        )}
        <text x={24} y={166} className="fill-wa-muted text-[11px]">{formatShortDate(first)}</text>
        <text x={330} y={166} textAnchor="end" className="fill-wa-muted text-[11px]">{formatShortDate(last)}</text>
      </svg>
      <figcaption className="sr-only">Each marker is a saved entry. Dates without an entry are left blank.</figcaption>
      <ul className="sr-only">
        {points.map((point) => <li key={point.dateStr}>{formatShortDate(point.dateStr)}: pain {point.painLevel} out of 10</li>)}
      </ul>
    </figure>
  );
};
