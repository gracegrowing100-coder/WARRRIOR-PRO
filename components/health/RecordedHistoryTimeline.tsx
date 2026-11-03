import React from 'react';
import type { HealthHistoryReadState, SymptomHistoryData } from '../../services/firebaseService';
import { formatLongDate } from '../../utils/trends';

export interface RecordedSymptomEntry extends SymptomHistoryData {
  sourceState?: Extract<HealthHistoryReadState, 'recorded' | 'cached'>;
}

export interface RecordedHistoryTimelineProps {
  entries: RecordedSymptomEntry[];
}

export const RecordedHistoryTimeline: React.FC<RecordedHistoryTimelineProps> = ({ entries }) => (
  <ol className="flex flex-col gap-2.5" aria-label="Recorded pain and symptom entries">
    {entries.map((entry, index) => {
      const high = entry.painLevel >= 4;
      const detail = [entry.symptoms?.length ? entry.symptoms.join(', ') : null, entry.triggers?.length ? entry.triggers.join(', ') : null].filter(Boolean).join(' · ');
      return (
        <li key={entry.dateStr || entry.id || index} className="flex items-center gap-3.5 rounded-[22px] bg-wa-surface px-4 py-3.5">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-extrabold ${high ? 'bg-wa-rose text-wa-crimson' : 'bg-wa-sun-soft text-wa-sun-ink'}`}>
            <span aria-hidden="true">{entry.painLevel}</span>
            <span className="sr-only">Pain: {entry.painLevel} / 10</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-wa-plum">{formatLongDate(entry.dateStr) || 'Date not recorded'}</p>
            <p className="text-[13px] text-wa-muted">
              {detail}
              {detail && typeof entry.waterIntake === 'number' ? ' · ' : ''}
              {typeof entry.waterIntake === 'number' && <><span>{entry.waterIntake.toFixed(2)} L</span> water</>}
              {!detail && typeof entry.waterIntake !== 'number' && 'No symptoms or triggers noted'}
            </p>
            {entry.sourceState === 'cached' && <p className="mt-0.5 text-[13px] font-medium text-wa-water">Saved on this device</p>}
          </div>
        </li>
      );
    })}
  </ol>
);
