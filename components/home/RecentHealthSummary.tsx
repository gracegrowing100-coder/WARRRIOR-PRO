import React, { useCallback, useEffect, useState } from 'react';
import { CalendarCheck2, Droplets, HeartPulse, RefreshCw } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, Card, Skeleton } from '../ui';

interface RecentHealthSummaryProps {
  userId: string;
  refreshKey?: number;
}

interface PainLog {
  dateStr?: string;
  painLevel?: number;
}

interface RecentSummary {
  checkInDays: number;
  hydrationDays: number;
  painEntries: number;
  latestPain: number | null;
}

const getRecentDateKeys = () => {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    return date.toLocaleDateString('sv');
  });
};

export const RecentHealthSummary: React.FC<RecentHealthSummaryProps> = ({ userId, refreshKey = 0 }) => {
  const [summary, setSummary] = useState<RecentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const dateKeys = getRecentDateKeys();
      const [checkIns, waterLogs, painLogs] = await Promise.all([
        Promise.all(dateKeys.map((date) => firebaseService.getDailyMoodCheckIn(userId, date))),
        Promise.all(dateKeys.map((date) => firebaseService.getWaterLog(userId, date))),
        firebaseService.getPainLogs(userId),
      ]);
      const recentPain = (painLogs as PainLog[])
        .filter((entry) => entry.dateStr && dateKeys.includes(entry.dateStr) && typeof entry.painLevel === 'number')
        .sort((a, b) => String(b.dateStr).localeCompare(String(a.dateStr)));

      setSummary({
        checkInDays: checkIns.filter(Boolean).length,
        hydrationDays: waterLogs.filter((entry) => entry.data !== null).length,
        painEntries: recentPain.length,
        latestPain: recentPain[0]?.painLevel ?? null,
      });
    } catch (loadError) {
      console.warn('Recent health summary could not be loaded:', loadError);
      setError(true);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary, refreshKey]);

  if (loading) {
    return (
      <Card as="section" aria-labelledby="recent-health-title" padding="lg">
        <h2 id="recent-health-title" className="text-heading-2">Recent health summary</h2>
        <div className="mt-5 space-y-3">
          <Skeleton className="min-h-24" />
          <Skeleton className="min-h-24" />
          <Skeleton className="min-h-24" />
        </div>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card as="section" aria-labelledby="recent-health-title" padding="lg">
        <h2 id="recent-health-title" className="text-heading-2">Recent health summary</h2>
        <Alert
          tone="warning"
          title="Recent records are unavailable"
          className="mt-4"
          action={(
            <Button variant="secondary" size="sm" leadingIcon={<RefreshCw size={16} />} onClick={() => void loadSummary()}>
              Try again
            </Button>
          )}
        >
          No trend has been inferred from missing information.
        </Alert>
      </Card>
    );
  }

  const hasRecords = summary.checkInDays > 0 || summary.hydrationDays > 0 || summary.painEntries > 0;

  return (
    <Card as="section" aria-labelledby="recent-health-title" className="border-line/70 shadow-none" padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption font-bold uppercase tracking-[0.1em] text-foreground-secondary">Recorded activity</p>
          <h2 id="recent-health-title" className="mt-1 text-heading-2">Recent health</h2>
        </div>
        <span className="rounded-pill bg-surface-subtle px-3 py-1 text-caption font-semibold text-foreground-secondary">7 days</span>
      </div>
      <p className="mt-1 text-small text-foreground-secondary">Recorded entries from the last seven days only.</p>

      {hasRecords ? (
        <dl className="relative mt-6 space-y-1 before:absolute before:bottom-5 before:left-[1.15rem] before:top-5 before:w-px before:bg-line">
          <div className="relative flex items-start gap-3 rounded-card p-3">
            <span aria-hidden="true" className="z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-success-soft text-status-success-text ring-4 ring-surface">
              <CalendarCheck2 size={17} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <dt className="text-small font-semibold text-foreground">Check-ins</dt>
              <dd className="mt-0.5 text-small tabular-nums text-foreground-secondary">Recorded on {summary.checkInDays} {summary.checkInDays === 1 ? 'day' : 'days'}</dd>
            </div>
          </div>
          <div className="relative flex items-start gap-3 rounded-card p-3">
            <span aria-hidden="true" className="z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-info-soft text-status-info-text ring-4 ring-surface">
              <Droplets size={17} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <dt className="text-small font-semibold text-foreground">Hydration</dt>
              <dd className="mt-0.5 text-small tabular-nums text-foreground-secondary">Recorded on {summary.hydrationDays} {summary.hydrationDays === 1 ? 'day' : 'days'}</dd>
            </div>
          </div>
          <div className="relative flex items-start gap-3 rounded-card p-3">
            <span aria-hidden="true" className="z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-medical-50 text-action-accent ring-4 ring-surface dark:bg-medical-950/55 dark:text-medical-200">
              <HeartPulse size={17} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <dt className="text-small font-semibold text-foreground">Pain entries</dt>
              <dd className="mt-0.5 text-small tabular-nums text-foreground-secondary">
                {summary.painEntries} recorded{summary.latestPain !== null ? ` · latest ${summary.latestPain} / 10` : ''}
              </dd>
            </div>
          </div>
        </dl>
      ) : (
        <div className="mt-5 rounded-card bg-surface-subtle p-5 text-center">
          <CalendarCheck2 className="mx-auto text-foreground-secondary" size={24} aria-hidden="true" />
          <p className="mt-3 text-body font-semibold text-foreground">No recent health activity</p>
          <p className="mt-1 text-small text-foreground-secondary">Check-ins, hydration, and pain entries from the last seven days will appear here.</p>
        </div>
      )}
    </Card>
  );
};
