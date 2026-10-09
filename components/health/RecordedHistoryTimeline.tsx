import React from 'react';
import { Droplets } from 'lucide-react';
import type { HealthHistoryReadState, SymptomHistoryData } from '../../services/firebaseService';

export interface RecordedSymptomEntry extends SymptomHistoryData {
  sourceState?: Extract<HealthHistoryReadState, 'recorded' | 'cached'>;
}

export interface RecordedHistoryTimelineProps {
  entries: RecordedSymptomEntry[];
}

const formatDate = (dateStr: string) => new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(`${dateStr}T12:00:00`));

const OptionalList: React.FC<{ label: string; values?: string[] }> = ({ label, values }) => {
  if (!values?.length) return null;
  return (
    <div>
      <dt className="text-small font-medium text-foreground-secondary">{label}</dt>
      <dd className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span key={value} className="rounded-pill bg-surface-subtle px-2.5 py-1 text-small text-foreground">{value}</span>
        ))}
      </dd>
    </div>
  );
};

export const RecordedHistoryTimeline: React.FC<RecordedHistoryTimelineProps> = ({ entries }) => (
  <ol className="mt-2 divide-y divide-line" aria-label="Recorded pain and symptom entries">
    {entries.map((entry) => (
      <li key={entry.dateStr} className="py-4 first:pt-3 last:pb-0">
        <article aria-labelledby={`history-entry-${entry.dateStr}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 id={`history-entry-${entry.dateStr}`} className="text-body font-semibold text-foreground">
                {formatDate(entry.dateStr)}
              </h4>
              {entry.sourceState === 'cached' && <span className="mt-1 block text-small font-medium text-status-info-text">Saved on this device</span>}
            </div>
            <span className="inline-flex min-h-9 shrink-0 items-center rounded-pill bg-medical-50 px-3 text-small font-semibold tabular-nums text-action-accent">Pain: {entry.painLevel} / 10</span>
          </div>

          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <OptionalList label="Symptoms" values={entry.symptoms} />
            <OptionalList label="Possible triggers" values={entry.triggers} />
            {typeof entry.waterIntake === 'number' && (
              <div>
                <dt className="inline-flex items-center gap-2 text-small font-medium text-foreground-secondary">
                  <Droplets size={16} aria-hidden="true" /> Hydration recorded with this check-in
                </dt>
                <dd className="mt-1 text-body text-foreground">{entry.waterIntake.toFixed(2)} L</dd>
              </div>
            )}
          </dl>
        </article>
      </li>
    ))}
  </ol>
);

