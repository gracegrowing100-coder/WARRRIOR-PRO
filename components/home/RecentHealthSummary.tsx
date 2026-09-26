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
        hydrationDays: waterLogs.filter((entry) => Number(entry?.amount || 0) > 0).length,
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
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
    <Card as="section" aria-labelledby="recent-health-title" padding="lg">
      <h2 id="recent-health-title" className="text-heading-2">Recent health summary</h2>
      <p className="mt-1 text-small text-foreground-secondary">Recorded entries from the last seven days only.</p>

      {hasRecords ? (
        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-card bg-surface-subtle p-4">
            <dt className="flex items-center gap-2 text-small text-foreground-secondary">
              <CalendarCheck2 size={18} aria-hidden="true" /> Check-ins
            </dt>
            <dd className="mt-2 text-heading-2 tabular-nums">{summary.checkInDays} days</dd>
          </div>
          <div className="rounded-card bg-surface-subtle p-4">
            <dt className="flex items-center gap-2 text-small text-foreground-secondary">
              <Droplets size={18} aria-hidden="true" /> Hydration entries
            </dt>
            <dd className="mt-2 text-heading-2 tabular-nums">{summary.hydrationDays} days</dd>
          </div>
          <div className="rounded-card bg-surface-subtle p-4">
            <dt className="flex items-center gap-2 text-small text-foreground-secondary">
              <HeartPulse size={18} aria-hidden="true" /> Pain entries
            </dt>
            <dd className="mt-2 text-heading-2 tabular-nums">{summary.painEntries}</dd>
            {summary.latestPain !== null && (
              <p className="mt-1 text-small text-foreground-secondary">Latest recorded: {summary.latestPain} / 10</p>
            )}
          </div>
        </dl>
      ) : (
        <p className="mt-5 rounded-card bg-surface-subtle p-4 text-body text-foreground-secondary">
          No check-ins, hydration amounts, or pain entries were found for the last seven days.
        </p>
      )}
    </Card>
  );
};
