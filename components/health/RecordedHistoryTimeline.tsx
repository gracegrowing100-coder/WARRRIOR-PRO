import React from 'react';
import { Droplets, HeartPulse } from 'lucide-react';
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
      <dd className="mt-1 text-body text-foreground">{values.join(', ')}</dd>
    </div>
  );
};

export const RecordedHistoryTimeline: React.FC<RecordedHistoryTimelineProps> = ({ entries }) => (
  <ol className="divide-y divide-line" aria-label="Recorded pain and symptom entries">
    {entries.map((entry) => (
      <li key={entry.dateStr} className="py-5 first:pt-0 last:pb-0">
        <article aria-labelledby={`history-entry-${entry.dateStr}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id={`history-entry-${entry.dateStr}`} className="text-heading-3 text-foreground">
                {formatDate(entry.dateStr)}
              </h3>
              <p className="mt-1 inline-flex items-center gap-2 text-body font-semibold text-foreground">
                <HeartPulse size={18} aria-hidden="true" className="text-action-accent" />
                Pain: {entry.painLevel} / 10
              </p>
            </div>
            {entry.sourceState === 'cached' && (
              <span className="text-small font-medium text-status-info-text">Saved on this device</span>
            )}
          </div>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
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

