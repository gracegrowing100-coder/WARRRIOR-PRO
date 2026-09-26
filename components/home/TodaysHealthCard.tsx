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
  waterAmount: number;
  waterGoal: number;
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
        waterAmount: Number(water?.amount || 0),
        waterGoal: Number(water?.goal || 3),
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
      <Card as="section" data-semantic id="home-header-stats" aria-labelledby="todays-health-title" className="bg-brand text-brand-foreground" padding="lg">
        <h2 id="todays-health-title" className="text-heading-2">Today&apos;s Health</h2>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="min-h-20 bg-white/15" />
          <Skeleton className="min-h-20 bg-white/15" />
          <Skeleton className="min-h-20 bg-white/15" />
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

  const hasTodayData = snapshot.hasCheckIn || snapshot.painLevel !== null || snapshot.waterAmount > 0;
  const waterValueText = `${snapshot.waterAmount.toFixed(2)} L of ${snapshot.waterGoal.toFixed(2)} L`;

  return (
    <Card
      as="section"
      id="home-header-stats"
      aria-labelledby="todays-health-title"
      data-semantic
      className="bg-brand text-brand-foreground"
      padding="lg"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="todays-health-title" className="text-heading-2">Today&apos;s Health</h2>
          <p className="mt-1 text-small">A factual summary of what you have recorded today.</p>
        </div>
        <HealthStatusBadge
          tone="neutral"
          icon={snapshot.hasCheckIn ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
          className="w-fit border-current bg-transparent text-inherit [&_span]:text-inherit"
        >
          {snapshot.hasCheckIn ? 'Check-in recorded' : 'Check-in not recorded'}
        </HealthStatusBadge>
      </div>

      {hasTodayData ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-small">
              <HeartPulse size={18} aria-hidden="true" />
              <span>Recorded pain</span>
            </div>
            <p className="mt-2 text-heading-2 tabular-nums">
              {snapshot.painLevel === null ? 'Not recorded' : `${snapshot.painLevel} / 10`}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-small">
              <Droplets size={18} aria-hidden="true" />
              <span>Hydration</span>
            </div>
            <ProgressBar
              value={snapshot.waterAmount}
              max={snapshot.waterGoal}
              label="Today’s hydration"
              valueText={waterValueText}
              className="mt-2 [&_span]:text-brand-foreground [&_[role=progressbar]]:bg-brand-foreground/20 [&_[role=progressbar]>div]:bg-brand-foreground"
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-body">
          Nothing has been recorded for today yet. Start with the daily check-in below.
        </p>
      )}
    </Card>
  );
};
