import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Droplets, HeartPulse, RefreshCw } from 'lucide-react';
import {
  firebaseService,
  type DailyCheckInHistoryData,
  type HealthHistoryRecord,
  type HydrationHistoryData,
  type SymptomHistoryData,
} from '../../services/firebaseService';
import { PageHeader } from '../layout';
import { Alert, Button, Card, ErrorState, Skeleton, StateMessage } from '../ui';
import { RecordedHistoryTimeline, type RecordedSymptomEntry } from './RecordedHistoryTimeline';
import { RecordedPainChart } from './RecordedPainChart';

interface HealthHistoryProps {
  userId: string;
}

interface HistoryData {
  symptoms: RecordedSymptomEntry[];
  symptomState: 'recorded' | 'cached' | 'missing' | 'unavailable';
  hydration: Array<HealthHistoryRecord<HydrationHistoryData>>;
  checkIns: Array<HealthHistoryRecord<DailyCheckInHistoryData>>;
}

const historyDateKeys = (days = 30) => {
  const now = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    return date.toLocaleDateString('sv');
  });
};

const formatDate = (dateStr: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(`${dateStr}T12:00:00`));

const dedupeSymptoms = (entries: SymptomHistoryData[], cached: boolean): RecordedSymptomEntry[] => {
  const byDate = new Map<string, RecordedSymptomEntry>();
  entries.forEach((entry) => {
    if (entry.dateStr && typeof entry.painLevel === 'number') {
      byDate.set(entry.dateStr, { ...entry, sourceState: cached ? 'cached' : 'recorded' });
    }
  });
  return Array.from(byDate.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
};

const isPresent = <T,>(record: HealthHistoryRecord<T>) =>
  (record.state === 'recorded' || record.state === 'cached') && record.data !== null;

export const HealthHistory: React.FC<HealthHistoryProps> = ({ userId }) => {
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const dateKeys = historyDateKeys();
      const [symptomResult, hydration, checkIns] = await Promise.all([
        firebaseService.getSymptomHistory(userId),
        firebaseService.getHydrationHistory(userId, dateKeys),
        firebaseService.getDailyCheckInHistory(userId, dateKeys),
      ]);
      setHistory({
        symptoms: dedupeSymptoms(
          symptomResult.data.filter((entry) => dateKeys.includes(entry.dateStr)),
          symptomResult.state === 'cached',
        ),
        symptomState: symptomResult.state,
        hydration,
        checkIns,
      });
    } catch (error) {
      console.warn('Health history could not be loaded:', error);
      setHistory(null);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const hydrationEntries = useMemo(
    () => history?.hydration.filter(isPresent).sort((a, b) => b.dateStr.localeCompare(a.dateStr)) ?? [],
    [history],
  );
  const checkInEntries = useMemo(
    () => history?.checkIns.filter(isPresent).sort((a, b) => b.dateStr.localeCompare(a.dateStr)) ?? [],
    [history],
  );

  if (loading) {
    return (
      <section aria-labelledby="health-history-loading-title" className="space-y-6">
        <div>
          <h1 id="health-history-loading-title" className="text-heading-1 text-foreground">Health history</h1>
          <p className="mt-1 text-body text-foreground-secondary">Loading health information you have recorded over time.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3" role="status" aria-label="Loading health history">
          <Skeleton className="min-h-28" />
          <Skeleton className="min-h-28" />
          <Skeleton className="min-h-28" />
        </div>
        <Skeleton className="min-h-72" />
      </section>
    );
  }

  if (loadFailed || !history) {
    return (
      <section aria-labelledby="health-history-error-title" className="space-y-6">
        <PageHeader title={<span id="health-history-error-title">Health history</span>} description="Health information you have recorded over time." />
        <ErrorState
          title="Health history is unavailable right now"
          description="Your records were not changed. Try loading them again."
          action={<Button variant="secondary" leadingIcon={<RefreshCw size={17} />} onClick={() => void loadHistory()}>Try again</Button>}
        />
      </section>
    );
  }

  const symptomUnavailable = history.symptomState === 'unavailable';
  const hydrationUnavailable = history.hydration.some((entry) => entry.state === 'unavailable');
  const checkInsUnavailable = history.checkIns.some((entry) => entry.state === 'unavailable');
  const hydrationCached = hydrationEntries.some((entry) => entry.state === 'cached');
  const checkInsCached = checkInEntries.some((entry) => entry.state === 'cached');
  const recordedCountLabel = (count: number) => `${count} recorded ${count === 1 ? 'entry' : 'entries'}`;
  const overviewItems = [
    {
      label: 'Pain & symptoms',
      value: symptomUnavailable ? 'Unavailable' : recordedCountLabel(history.symptoms.length),
      icon: <HeartPulse size={20} />,
    },
    {
      label: 'Hydration',
      value: hydrationUnavailable && hydrationEntries.length === 0
        ? 'Unavailable'
        : recordedCountLabel(hydrationEntries.length),
      icon: <Droplets size={20} />,
    },
    {
      label: 'Check-ins',
      value: checkInsUnavailable && checkInEntries.length === 0
        ? 'Unavailable'
        : recordedCountLabel(checkInEntries.length),
      icon: <CalendarCheck2 size={20} />,
    },
  ];

  return (
    <div className="space-y-8" data-semantic>
      <PageHeader title="Health history" description="Health information you have recorded over time." />

      <section aria-labelledby="history-overview-title" className="space-y-4">
        <div>
          <h2 id="history-overview-title" className="text-heading-2 text-foreground">Overview</h2>
          <p className="mt-1 text-small text-foreground-secondary">Recorded entries from the last 30 days. No missing days are estimated.</p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-3">
          {overviewItems.map((item) => (
            <Card key={item.label} surface="subtle" className="shadow-none">
              <dt className="flex items-center gap-2 text-small font-medium text-foreground-secondary">
                <span aria-hidden="true" className="text-action">{item.icon}</span>{item.label}
              </dt>
              <dd className="mt-2 text-heading-2 tabular-nums text-foreground">{item.value}</dd>
            </Card>
          ))}
        </dl>
      </section>

      <section aria-labelledby="pain-symptom-history-title" className="space-y-4">
        <div>
          <h2 id="pain-symptom-history-title" className="text-heading-2 text-foreground">Pain &amp; symptoms</h2>
          <p className="mt-1 max-w-prose text-small text-foreground-secondary">Saved pain and symptom check-ins. A pain score of zero is a recorded value.</p>
        </div>
        {history.symptomState === 'cached' && <Alert tone="info" title="Showing information saved on this device">Cloud confirmation is unavailable.</Alert>}
        {symptomUnavailable ? (
          <StateMessage state="error" title="Pain and symptom history is unavailable right now" description="Try loading Health history again." />
        ) : history.symptoms.length === 0 ? (
          <StateMessage state="empty" title="No pain or symptom entries recorded yet" description="Entries saved from the pain and symptom check-in will appear here." />
        ) : (
          <>
            <RecordedPainChart entries={history.symptoms} />
            <Card as="section" padding="lg" className="shadow-none">
              <RecordedHistoryTimeline entries={history.symptoms} />
            </Card>
          </>
        )}
      </section>

      <section aria-labelledby="hydration-history-title" className="space-y-4">
        <div>
          <h2 id="hydration-history-title" className="text-heading-2 text-foreground">Hydration</h2>
          <p className="mt-1 max-w-prose text-small text-foreground-secondary">Only dates with a saved hydration record are shown.</p>
        </div>
        {hydrationCached && <Alert tone="info" title="Showing information saved on this device">Cloud confirmation is unavailable for one or more entries.</Alert>}
        {hydrationUnavailable && <Alert tone="warning" title="Some hydration history is unavailable">Unavailable dates are not shown as zero.</Alert>}
        {hydrationEntries.length === 0 ? (
          hydrationUnavailable
            ? <StateMessage state="error" title="Hydration history is unavailable right now" description="Try loading Health history again." />
            : <StateMessage state="empty" title="No hydration entries recorded for this period" description="A recorded amount of 0.00 L will appear as an entry; missing dates remain blank." />
        ) : (
          <Card padding="none" className="overflow-hidden shadow-none">
            <ul className="divide-y divide-line" aria-label="Recorded hydration entries">
              {hydrationEntries.map((entry) => (
                <li key={entry.dateStr} className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div>
                    <p className="font-semibold text-foreground">{formatDate(entry.dateStr)}</p>
                    {entry.state === 'cached' && <p className="text-small text-status-info-text">Saved on this device</p>}
                  </div>
                  <p className="text-body font-semibold tabular-nums text-foreground">{entry.data?.amount.toFixed(2)} L recorded</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section aria-labelledby="check-in-history-title" className="space-y-4">
        <div>
          <h2 id="check-in-history-title" className="text-heading-2 text-foreground">Daily check-ins</h2>
          <p className="mt-1 max-w-prose text-small text-foreground-secondary">Your selected check-in label and optional note. System-mapped numeric scores are not shown.</p>
        </div>
        {checkInsCached && <Alert tone="info" title="Showing information saved on this device">Cloud confirmation is unavailable for one or more check-ins.</Alert>}
        {checkInsUnavailable && <Alert tone="warning" title="Some check-in history is unavailable">Unavailable dates are not treated as empty check-ins.</Alert>}
        {checkInEntries.length === 0 ? (
          checkInsUnavailable
            ? <StateMessage state="error" title="Daily check-in history is unavailable right now" description="Try loading Health history again." />
            : <StateMessage state="empty" title="No daily check-ins recorded for this period" description="Saved daily check-ins will appear here." />
        ) : (
          <Card padding="none" className="overflow-hidden shadow-none">
            <ul className="divide-y divide-line" aria-label="Recorded daily check-ins">
              {checkInEntries.map((entry) => (
                <li key={entry.dateStr} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{formatDate(entry.dateStr)}</p>
                      <p className="mt-1 text-body text-foreground">{entry.data?.emotion || 'Check-in recorded'}</p>
                      {entry.data?.note && <p className="mt-1 max-w-prose text-small text-foreground-secondary">{entry.data.note}</p>}
                    </div>
                    {entry.state === 'cached' && <span className="text-small font-medium text-status-info-text">Saved on this device</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <Alert tone="neutral" title="Medication history">
        Detailed medication adherence history is not available from the current records. No dose timeline or adherence percentage is estimated here.
      </Alert>
    </div>
  );
};
