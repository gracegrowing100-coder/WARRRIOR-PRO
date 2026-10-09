import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, ChevronDown, Droplets, HeartPulse, RefreshCw } from 'lucide-react';
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

type HistorySection = 'symptoms' | 'hydration' | 'checkIns';

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
  const [activeSection, setActiveSection] = useState<HistorySection>('symptoms');

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
  const sectionOrder: HistorySection[] = ['symptoms', 'hydration', 'checkIns'];
  const selectSectionFromKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>, current: HistorySection) => {
    const currentIndex = sectionOrder.indexOf(current);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % sectionOrder.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + sectionOrder.length) % sectionOrder.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = sectionOrder.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextSection = sectionOrder[nextIndex];
    setActiveSection(nextSection);
    document.getElementById(`history-tab-${nextSection}`)?.focus();
  };
  const overviewItems: Array<{
    id: HistorySection;
    label: string;
    value: string;
    latest: string;
    icon: React.ReactNode;
    activeClassName: string;
    iconClassName: string;
  }> = [
    {
      id: 'symptoms',
      label: 'Pain & symptoms',
      value: symptomUnavailable ? 'Unavailable' : recordedCountLabel(history.symptoms.length),
      latest: history.symptoms[0] ? `Latest ${formatDate(history.symptoms[0].dateStr)}` : symptomUnavailable ? 'Could not load' : 'No entries yet',
      icon: <HeartPulse size={20} />,
      activeClassName: 'bg-medical-50',
      iconClassName: 'bg-medical-50 text-action-accent',
    },
    {
      id: 'hydration',
      label: 'Hydration',
      value: hydrationUnavailable && hydrationEntries.length === 0
        ? 'Unavailable'
        : recordedCountLabel(hydrationEntries.length),
      latest: hydrationEntries[0] ? `Latest ${formatDate(hydrationEntries[0].dateStr)}` : hydrationUnavailable ? 'Could not load' : 'No entries yet',
      icon: <Droplets size={20} />,
      activeClassName: 'bg-status-info-soft/70',
      iconClassName: 'bg-status-info-soft text-status-info',
    },
    {
      id: 'checkIns',
      label: 'Check-ins',
      value: checkInsUnavailable && checkInEntries.length === 0
        ? 'Unavailable'
        : recordedCountLabel(checkInEntries.length),
      latest: checkInEntries[0] ? `Latest ${formatDate(checkInEntries[0].dateStr)}` : checkInsUnavailable ? 'Could not load' : 'No entries yet',
      icon: <CalendarCheck2 size={20} />,
      activeClassName: 'bg-status-success-soft/70',
      iconClassName: 'bg-status-success-soft text-status-success-text',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8" data-semantic>
      <PageHeader title="Health history" description="Review the health information you recorded over the last 30 days." />

      <section aria-labelledby="history-overview-title" className="overflow-hidden rounded-card border border-line bg-surface shadow-subtle">
        <div className="flex flex-col gap-1 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 id="history-overview-title" className="text-heading-3 text-foreground">Your 30-day snapshot</h2>
            <p className="mt-0.5 text-small text-foreground-secondary">Choose a category to review its recorded details.</p>
          </div>
          <p className="text-caption font-medium text-foreground-secondary">Missing days are not estimated</p>
        </div>
        <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0" role="tablist" aria-label="Health history categories">
          {overviewItems.map((item) => (
            <button
              key={item.id}
              data-ui-control
              id={`history-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={activeSection === item.id}
              aria-controls={`history-panel-${item.id}`}
              tabIndex={activeSection === item.id ? 0 : -1}
              onClick={() => setActiveSection(item.id)}
              onKeyDown={(event) => selectSectionFromKeyboard(event, item.id)}
              className={`group min-h-28 px-4 py-4 text-left transition-colors duration-150 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:px-5 ${activeSection === item.id ? item.activeClassName : 'bg-surface hover:bg-surface-subtle'}`}
            >
              <span className="flex items-center gap-3">
                <span aria-hidden="true" className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${item.iconClassName}`}>{item.icon}</span>
                <span className="min-w-0">
                  <span className="block text-small font-semibold text-foreground">{item.label}</span>
                  <span className="mt-0.5 block text-heading-3 tabular-nums text-foreground">{item.value}</span>
                </span>
              </span>
              <span className="mt-2 block pl-[3.25rem] text-caption text-foreground-secondary">{item.latest}</span>
            </button>
          ))}
        </div>
      </section>

      <section
        id="history-panel-symptoms"
        role="tabpanel"
        aria-labelledby="history-tab-symptoms"
        hidden={activeSection !== 'symptoms'}
        className="space-y-5"
      >
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-medical-50 text-action-accent"><HeartPulse size={21} /></span>
          <div>
            <h2 className="text-heading-2 text-foreground">Pain &amp; symptoms</h2>
            <p className="mt-1 max-w-prose text-small text-foreground-secondary">Saved pain and symptom check-ins. A pain score of zero is a recorded value.</p>
          </div>
        </div>
        {history.symptomState === 'cached' && <Alert tone="info" title="Showing information saved on this device">Cloud confirmation is unavailable.</Alert>}
        {symptomUnavailable ? (
          <StateMessage state="error" title="Pain and symptom history is unavailable right now" description="Try loading Health history again." />
        ) : history.symptoms.length === 0 ? (
          <StateMessage state="empty" title="No pain or symptom entries recorded yet" description="Entries saved from the pain and symptom check-in will appear here." />
        ) : (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
            <RecordedPainChart entries={history.symptoms} />
            <Card as="section" padding="lg" className="shadow-none">
              <div className="mb-1 flex items-center justify-between gap-4">
                <h3 className="text-heading-3 text-foreground">Recent records</h3>
                <span className="text-caption font-medium tabular-nums text-foreground-secondary">{history.symptoms.length} total</span>
              </div>
              <RecordedHistoryTimeline entries={history.symptoms} />
            </Card>
          </div>
        )}
      </section>

      <section
        id="history-panel-hydration"
        role="tabpanel"
        aria-labelledby="history-tab-hydration"
        hidden={activeSection !== 'hydration'}
        className="space-y-5"
      >
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-status-info-soft text-status-info"><Droplets size={21} /></span>
          <div>
            <h2 className="text-heading-2 text-foreground">Hydration</h2>
            <p className="mt-1 max-w-prose text-small text-foreground-secondary">Only dates with a saved hydration record are shown.</p>
          </div>
        </div>
        {hydrationCached && <Alert tone="info" title="Showing information saved on this device">Cloud confirmation is unavailable for one or more entries.</Alert>}
        {hydrationUnavailable && <Alert tone="warning" title="Some hydration history is unavailable">Unavailable dates are not shown as zero.</Alert>}
        {hydrationEntries.length === 0 ? (
          hydrationUnavailable
            ? <StateMessage state="error" title="Hydration history is unavailable right now" description="Try loading Health history again." />
            : <StateMessage state="empty" title="No hydration entries recorded for this period" description="A recorded amount of 0.00 L will appear as an entry; missing dates remain blank." />
        ) : (
          <Card padding="none" className="overflow-hidden shadow-subtle">
            <ul className="divide-y divide-line/60" aria-label="Recorded hydration entries">
              {hydrationEntries.map((entry) => (
                <li key={entry.dateStr} className="flex min-h-20 items-center gap-3 px-4 py-3 sm:px-5">
                  <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-status-info-soft text-status-info"><Droplets size={19} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{formatDate(entry.dateStr)}</p>
                    <p className="text-small text-foreground-secondary">
                      {typeof entry.data?.goal === 'number' ? `Goal ${entry.data.goal.toFixed(2)} L` : 'Saved hydration entry'}
                      {entry.state === 'cached' ? ' · Saved on this device' : ''}
                    </p>
                  </div>
                  <p className="shrink-0 text-body font-semibold tabular-nums text-foreground">{entry.data?.amount.toFixed(2)} L recorded</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section
        id="history-panel-checkIns"
        role="tabpanel"
        aria-labelledby="history-tab-checkIns"
        hidden={activeSection !== 'checkIns'}
        className="space-y-5"
      >
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-status-success-soft text-status-success-text"><CalendarCheck2 size={21} /></span>
          <div>
            <h2 className="text-heading-2 text-foreground">Daily check-ins</h2>
            <p className="mt-1 max-w-prose text-small text-foreground-secondary">Your selected check-in label and optional note. System-mapped numeric scores are not shown.</p>
          </div>
        </div>
        {checkInsCached && <Alert tone="info" title="Showing information saved on this device">Cloud confirmation is unavailable for one or more check-ins.</Alert>}
        {checkInsUnavailable && <Alert tone="warning" title="Some check-in history is unavailable">Unavailable dates are not treated as empty check-ins.</Alert>}
        {checkInEntries.length === 0 ? (
          checkInsUnavailable
            ? <StateMessage state="error" title="Daily check-in history is unavailable right now" description="Try loading Health history again." />
            : <StateMessage state="empty" title="No daily check-ins recorded for this period" description="Saved daily check-ins will appear here." />
        ) : (
          <Card padding="none" className="overflow-hidden shadow-subtle">
            <ul className="divide-y divide-line/60" aria-label="Recorded daily check-ins">
              {checkInEntries.map((entry) => (
                <li key={entry.dateStr} className="flex min-h-20 items-start gap-3 px-4 py-4 sm:px-5">
                  <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-status-success-soft text-status-success-text"><CalendarCheck2 size={19} /></span>
                  <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
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

      <details className="group rounded-card border border-line bg-surface">
        <summary data-ui-control className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-small font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:px-5">
          About medication history
          <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-foreground-secondary transition-transform duration-150 group-open:rotate-180" />
        </summary>
        <p className="border-t border-line px-4 py-4 text-small text-foreground-secondary sm:px-5">
          Detailed medication adherence history is not available from the current records. No dose timeline or adherence percentage is estimated here.
        </p>
      </details>
    </div>
  );
};
