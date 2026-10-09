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

      setSnapshot({
        hasCheckIn: Boolean(checkIn),
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
  const waterValueText = snapshot.waterAmount !== null && snapshot.waterGoal !== null
    ? `${snapshot.waterAmount.toFixed(2)} L of ${snapshot.waterGoal.toFixed(2)} L`
    : '';

  return (
    <Card
      as="section"
      id="home-header-stats"
      aria-labelledby="todays-health-title"
      data-semantic
      className="relative overflow-hidden border-medical-100 bg-surface shadow-none before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-action-accent"
      padding="lg"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-caption font-bold uppercase tracking-[0.14em] text-action-accent">Your day at a glance</p>
          <h2 id="todays-health-title" className="mt-1 text-heading-2 text-foreground">Today&apos;s health</h2>
          <p className="mt-1 text-small text-foreground-secondary">Based only on what you recorded today.</p>
        </div>
        <HealthStatusBadge
          tone={snapshot.hasCheckIn ? 'success' : 'neutral'}
          icon={snapshot.hasCheckIn ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
          className="w-fit"
        >
          {snapshot.hasCheckIn ? 'Check-in complete' : 'Check-in due'}
        </HealthStatusBadge>
      </div>

      {hasTodayData ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-card border border-line bg-surface-subtle p-4">
            <div className="flex items-center gap-2 text-small text-foreground-secondary">
              <HeartPulse size={18} className="text-action-accent" aria-hidden="true" />
              <span>Recorded pain</span>
            </div>
            <p className="mt-2 text-heading-2 tabular-nums text-foreground">
              {snapshot.painLevel === null ? 'Not recorded' : `${snapshot.painLevel} / 10`}
            </p>
          </div>
          <div className="rounded-card border border-line bg-surface-subtle p-4">
            <div className="flex items-center gap-2 text-small text-foreground-secondary">
              <Droplets size={18} className="text-status-info" aria-hidden="true" />
              <span>Hydration</span>
            </div>
            {snapshot.waterAmount !== null && snapshot.waterGoal !== null ? (
              <ProgressBar
                value={snapshot.waterAmount}
                max={snapshot.waterGoal}
                label="Today’s hydration"
                valueText={waterValueText}
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-body font-semibold text-foreground">
                {snapshot.hydrationState === 'unavailable' ? 'Unavailable' : 'Not recorded'}
              </p>
            )}
          </div>
          <div className="rounded-card border border-line bg-surface-subtle p-4">
            <div className="flex items-center gap-2 text-small text-foreground-secondary">
              {snapshot.hasCheckIn ? <CheckCircle2 size={18} aria-hidden="true" /> : <CircleDashed size={18} aria-hidden="true" />}
              <span>Daily check-in</span>
            </div>
            <HealthStatusBadge
              tone="neutral"
              icon={snapshot.hasCheckIn ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
              className="mt-2 w-fit"
            >
              {snapshot.hasCheckIn ? 'Check-in recorded' : 'Check-in not recorded'}
            </HealthStatusBadge>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-card border border-dashed border-line-strong bg-medical-50 p-4">
          <p className="text-body font-semibold text-foreground">Start with today&apos;s check-in</p>
          <p className="mt-1 text-small text-foreground-secondary">Nothing is recorded yet. Your check-in is the next step.</p>
        </div>
      )}
    </Card>
  );
};
