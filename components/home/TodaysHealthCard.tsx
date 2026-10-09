import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleDashed, Droplets, HeartPulse, RefreshCw } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, Card, HealthStatusBadge, ProgressBar, Skeleton } from '../ui';

interface TodaysHealthCardProps {
  userId: string;
  refreshKey?: number;
}

interface TodaySnapshot {
  hasCheckIn: boolean;
  moodLabel: string | null;
  updatedAt: string | null;
  painLevel: number | null;
  waterAmount: number | null;
  waterGoal: number | null;
  hydrationState: 'recorded' | 'cached' | 'missing' | 'unavailable';
}

interface PainLog {
  dateStr?: string;
  painLevel?: number;
}

const getTodayKey = () => new Date().toLocaleDateString('sv');

const formatUpdatedTime = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const TodaysHealthCard: React.FC<TodaysHealthCardProps> = ({ userId, refreshKey = 0 }) => {
  const [snapshot, setSnapshot] = useState<TodaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const today = getTodayKey();
      const [checkIn, painLogs, water] = await Promise.all([
        firebaseService.getDailyMoodCheckIn(userId, today),
        firebaseService.getPainLogs(userId),
        firebaseService.getWaterLog(userId, today),
      ]);
      const todayPain = (painLogs as PainLog[]).find((entry) => entry.dateStr === today);
      const recordedCheckIn = checkIn as { emotion?: string; timestamp?: string } | null;

      setSnapshot({
        hasCheckIn: Boolean(checkIn),
        moodLabel: recordedCheckIn?.emotion || null,
        updatedAt: recordedCheckIn?.timestamp || null,
        painLevel: typeof todayPain?.painLevel === 'number' ? todayPain.painLevel : null,
        waterAmount: water.data?.amount ?? null,
        waterGoal: water.data?.goal ?? null,
        hydrationState: water.state,
      });
    } catch (loadError) {
      console.warn("Today's health summary could not be loaded:", loadError);
      setError(true);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot, refreshKey]);

  if (loading) {
    return (
      <Card as="section" data-semantic id="home-header-stats" aria-labelledby="todays-health-title" className="border-medical-100 bg-surface shadow-none" padding="lg">
        <h2 id="todays-health-title" className="text-heading-2 text-foreground">Today&apos;s health</h2>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="min-h-20" />
          <Skeleton className="min-h-20" />
          <Skeleton className="min-h-20" />
        </div>
      </Card>
    );
  }

  if (error || !snapshot) {
    return (
      <Card as="section" id="home-header-stats" aria-labelledby="todays-health-title" padding="lg">
        <h2 id="todays-health-title" className="text-heading-2">Today&apos;s Health</h2>
        <Alert
          tone="warning"
          title="Today’s summary is unavailable"
          className="mt-4"
          action={(
            <Button variant="secondary" size="sm" leadingIcon={<RefreshCw size={16} />} onClick={() => void loadSnapshot()}>
              Try again
            </Button>
          )}
        >
          Your existing health records have not been changed. You can still use the check-in tools below.
        </Alert>
      </Card>
    );
  }

  const hasTodayData = snapshot.hasCheckIn || snapshot.painLevel !== null || snapshot.waterAmount !== null;
  const updatedTime = formatUpdatedTime(snapshot.updatedAt);
  const waterValueText = snapshot.waterAmount !== null && snapshot.waterGoal !== null
    ? `${snapshot.waterAmount.toFixed(2)} L of ${snapshot.waterGoal.toFixed(2)} L`
    : '';

  return (
    <Card
      as="section"
      id="home-header-stats"
      aria-labelledby="todays-health-title"
      data-semantic
      className="relative h-full overflow-hidden border-line/80 bg-surface shadow-surface"
      padding="lg"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-action-accent" aria-hidden="true" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-caption font-bold uppercase tracking-[0.14em] text-action-accent">Today&apos;s health</p>
          <h2 id="todays-health-title" className="mt-2 text-heading-1 text-foreground">
            {snapshot.moodLabel || (hasTodayData ? 'Your day at a glance' : 'Ready when you are')}
          </h2>
          <p className="mt-1 text-small text-foreground-secondary">
            {updatedTime ? `Last check-in at ${updatedTime}` : 'Based only on what you recorded today.'}
          </p>
        </div>
        <HealthStatusBadge
          tone={snapshot.hasCheckIn ? 'success' : 'neutral'}
          icon={snapshot.hasCheckIn ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
          className="w-fit"
        >
          {snapshot.hasCheckIn ? 'Check-in recorded' : 'Check-in due'}
        </HealthStatusBadge>
      </div>

      {hasTodayData ? (
        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-card bg-surface-subtle p-4 sm:p-5">
            <div className="flex items-center gap-2 text-small font-medium text-foreground-secondary">
              <HeartPulse size={18} className="text-action-accent" aria-hidden="true" />
              <dt>Recorded pain</dt>
            </div>
            <dd className="mt-2 text-heading-1 tabular-nums text-foreground">
              {snapshot.painLevel === null ? 'Not recorded' : `${snapshot.painLevel} / 10`}
            </dd>
          </div>
          <div className="rounded-card bg-status-info-soft/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-small font-medium text-foreground-secondary">
              <Droplets size={18} className="text-status-info" aria-hidden="true" />
              <dt>Hydration</dt>
            </div>
            {snapshot.waterAmount !== null && snapshot.waterGoal !== null ? (
              <ProgressBar
                value={snapshot.waterAmount}
                max={snapshot.waterGoal}
                label="Today’s hydration"
                valueText={waterValueText}
                tone="info"
                className="mt-2"
              />
            ) : (
              <dd className="mt-2 text-body font-semibold text-foreground">
                {snapshot.hydrationState === 'unavailable' ? 'Unavailable' : 'Not recorded'}
              </dd>
            )}
          </div>
        </dl>
      ) : (
        <div className="mt-5 rounded-card border border-dashed border-line-strong bg-medical-50 p-4">
          <p className="text-body font-semibold text-foreground">Start with today&apos;s check-in</p>
          <p className="mt-1 text-small text-foreground-secondary">Nothing has been recorded for today yet. Your check-in is the next step.</p>
        </div>
      )}
    </Card>
  );
};
