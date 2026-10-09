import React, { useMemo } from 'react';
import type { RecordedSymptomEntry } from './RecordedHistoryTimeline';

export interface RecordedPainChartProps {
  entries: RecordedSymptomEntry[];
}

const WIDTH = 640;
const HEIGHT = 240;
const LEFT = 48;
const RIGHT = 24;
const TOP = 28;
const BOTTOM = 52;

const shortDate = (dateStr: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
}).format(new Date(`${dateStr}T12:00:00`));

export const RecordedPainChart: React.FC<RecordedPainChartProps> = ({ entries }) => {
  const points = useMemo(() => {
    const byDate = new Map<string, RecordedSymptomEntry>();
    entries.forEach((entry) => {
      if (Number.isFinite(entry.painLevel) && entry.painLevel >= 0 && entry.painLevel <= 10) {
        byDate.set(entry.dateStr, entry);
      }
    });
    return Array.from(byDate.values())
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
      .slice(-10);
  }, [entries]);

  if (points.length < 2) return null;

  const firstTime = new Date(`${points[0].dateStr}T12:00:00`).getTime();
  const lastTime = new Date(`${points[points.length - 1].dateStr}T12:00:00`).getTime();
  const timeRange = Math.max(1, lastTime - firstTime);
  const chartWidth = WIDTH - LEFT - RIGHT;
  const chartHeight = HEIGHT - TOP - BOTTOM;

  return (
    <figure className="overflow-hidden rounded-card border border-line bg-surface p-4 shadow-none sm:p-5">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h3 className="text-heading-3 text-foreground">Last 10 pain entries</h3>
        <span className="text-caption text-foreground-secondary">0–10 scale</span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto min-h-52 w-full"
        role="img"
        aria-labelledby="recorded-pain-chart-title recorded-pain-chart-description"
      >
        <title id="recorded-pain-chart-title">Recorded pain scores</title>
        <desc id="recorded-pain-chart-description">
          A marker-only chart of saved pain scores from zero to ten. Dates without entries have no marker.
        </desc>
        {[0, 5, 10].map((score) => {
          const y = TOP + ((10 - score) / 10) * chartHeight;
          return (
            <g key={score}>
              <line x1={LEFT} x2={WIDTH - RIGHT} y1={y} y2={y} className="stroke-line" strokeWidth="1" />
              <text x={LEFT - 12} y={y + 4} textAnchor="end" className="fill-foreground-secondary text-[12px]">{score}</text>
            </g>
          );
        })}
        {points.map((entry, index) => {
          const timestamp = new Date(`${entry.dateStr}T12:00:00`).getTime();
          const x = LEFT + ((timestamp - firstTime) / timeRange) * chartWidth;
          const y = TOP + ((10 - entry.painLevel) / 10) * chartHeight;
          const showDate = points.length <= 6 || index === 0 || index === points.length - 1;
          return (
            <g key={entry.dateStr}>
              <circle cx={x} cy={y} r="7" className="fill-action stroke-surface" strokeWidth="3" />
              <text x={x} y={Math.max(16, y - 13)} textAnchor="middle" className="fill-foreground text-[12px] font-semibold">
                {entry.painLevel}
              </text>
              {showDate && (
                <text x={x} y={HEIGHT - 18} textAnchor="middle" className="fill-foreground-secondary text-[11px]">
                  {shortDate(entry.dateStr)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-small text-foreground-secondary">
        Each marker is a saved entry. Dates without an entry are left blank.
      </figcaption>
      <ul className="sr-only">
        {points.map((entry) => <li key={entry.dateStr}>{shortDate(entry.dateStr)}: pain {entry.painLevel} out of 10</li>)}
      </ul>
    </figure>
  );
};

