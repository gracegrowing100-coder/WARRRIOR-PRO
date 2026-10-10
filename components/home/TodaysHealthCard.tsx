import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleDashed, Droplets, HeartPulse, Pill, RefreshCw } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, Card, Skeleton } from '../ui';

interface TodaysHealthCardProps {
  userId: string;
  refreshKey?: number;
  onStartCheckIn?: () => void;
}

interface TodaySnapshot {
  hasCheckIn: boolean;
  moodLabel: string | null;
  updatedAt: string | null;
  painLevel: number | null;
  waterAmount: number | null;
  waterGoal: number | null;
  hydrationState: 'recorded' | 'cached' | 'missing' | 'unavailable';
  medications: MedicationSummary[];
}

interface PainLog {
  dateStr?: string;
  painLevel?: number;
}

interface MedicationSummary {
  id?: string;
  name?: string;
  dosage?: string;
  time?: string;
  lastTakenDate?: string;
}

const getTodayKey = () => new Date().toLocaleDateString('sv');

const formatUpdatedTime = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const TodaysHealthCard: React.FC<TodaysHealthCardProps> = ({ userId, refreshKey = 0, onStartCheckIn }) => {
  const [snapshot, setSnapshot] = useState<TodaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const today = getTodayKey();
      const [checkIn, painLogs, water, medications] = await Promise.all([
        firebaseService.getDailyMoodCheckIn(userId, today),
        firebaseService.getPainLogs(userId),
        firebaseService.getWaterLog(userId, today),
        firebaseService.getMedications(userId),
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
        medications: Array.isArray(medications) ? medications as MedicationSummary[] : [],
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

  const hasTodayData = snapshot.hasCheckIn
    || snapshot.painLevel !== null
    || snapshot.waterAmount !== null
    || snapshot.medications.length > 0;
  const updatedTime = formatUpdatedTime(snapshot.updatedAt);
  const waterValueText = snapshot.waterAmount !== null && snapshot.waterGoal !== null
    ? `${snapshot.waterAmount.toFixed(2)} L of ${snapshot.waterGoal.toFixed(2)} L`
    : '';
  const hydrationPercentage = snapshot.waterAmount !== null && snapshot.waterGoal !== null && snapshot.waterGoal > 0
    ? Math.min(Math.max((snapshot.waterAmount / snapshot.waterGoal) * 100, 0), 100)
    : 0;
  const pendingMedications = snapshot.medications.filter((medication) => medication.lastTakenDate !== getTodayKey());
  const nextMedication = pendingMedications[0] ?? snapshot.medications[0] ?? null;
  const medicationSummary = snapshot.medications.length === 0
    ? 'No medication scheduled'
    : pendingMedications.length === 0
      ? 'All marked taken today'
      : `${pendingMedications.length} pending`;

  return (
    <Card
      as="section"
      id="home-header-stats"
      aria-labelledby="todays-health-title"
      data-semantic
      className="relative overflow-hidden rounded-[1.75rem] border-0 bg-gradient-to-br from-medical-500 via-medical-600 to-medical-900 p-6 text-white shadow-[0_22px_52px_-26px_rgb(165_25_42_/_0.78)] dark:from-medical-700 dark:via-medical-900 dark:to-navy-950 sm:p-8 lg:min-h-[24rem] lg:p-10 xl:p-12"
      padding="none"
    >
      <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/[0.07]" aria-hidden="true" />
      <span className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-navy-950/10 blur-3xl" aria-hidden="true" />
      <div className="relative flex h-full flex-col gap-6 lg:gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <p className="text-small font-bold uppercase tracking-[0.08em] text-white/80">Today&apos;s health</p>
            <h2 id="todays-health-title" className="mt-4 max-w-3xl text-[2.1rem] font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-[2.7rem] lg:text-[3.25rem]">
              {snapshot.moodLabel || (hasTodayData ? 'Your day at a glance' : 'Ready when you are')}
            </h2>
            <p className="mt-3 max-w-xl text-body text-white/80">
              {updatedTime ? `Last check-in at ${updatedTime}.` : 'Based only on what you recorded today.'}
            </p>
          </div>
          <span className="inline-flex min-h-10 w-fit shrink-0 items-center gap-2 self-start rounded-pill bg-white/15 px-4 text-small font-semibold text-white ring-1 ring-inset ring-white/30">
            {snapshot.hasCheckIn ? <CheckCircle2 size={17} className="text-emerald-200" /> : <CircleDashed size={17} className="text-amber-200" />}
            {snapshot.hasCheckIn ? 'Check-in recorded' : 'Check-in due'}
          </span>
        </div>

        {!snapshot.hasCheckIn && onStartCheckIn ? (
          <Button
            variant="secondary"
            size="lg"
            trailingIcon={<ArrowRight size={19} />}
            className="min-h-14 w-full border-white/30 bg-white px-6 text-medical-700 shadow-elevated hover:bg-medical-50 sm:w-fit"
            onClick={onStartCheckIn}
          >
            Start daily check-in
          </Button>
        ) : null}

        <dl className="mt-auto grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
          <div className="min-h-32 rounded-card bg-white/[0.11] p-4 ring-1 ring-inset ring-white/20 sm:min-h-36 sm:p-5 lg:min-h-40 lg:p-6">
            <div className="flex items-center gap-2 text-small font-semibold text-white/85">
              <HeartPulse size={18} className="text-medical-100" aria-hidden="true" />
              <dt>Recorded pain</dt>
            </div>
            <dd className="mt-4 text-heading-1 tabular-nums text-white">
              {snapshot.painLevel === null ? 'Not recorded' : `${snapshot.painLevel} / 10`}
            </dd>
          </div>
          <div className="min-h-32 rounded-card bg-white/[0.11] p-4 ring-1 ring-inset ring-white/20 sm:min-h-36 sm:p-5 lg:min-h-40 lg:p-6">
            <div className="flex items-center gap-2 text-small font-semibold text-white/85">
              <Droplets size={18} className="text-sky-300" aria-hidden="true" />
              <dt>Hydration</dt>
            </div>
            {snapshot.waterAmount !== null && snapshot.waterGoal !== null ? (
              <dd className="mt-4">
                <span className="block text-heading-3 tabular-nums text-white">{waterValueText}</span>
                <span
                  role="progressbar"
                  aria-label="Today’s hydration"
                  aria-valuemin={0}
                  aria-valuemax={snapshot.waterGoal}
                  aria-valuenow={snapshot.waterAmount}
                  aria-valuetext={waterValueText}
                  className="mt-3 block h-2 overflow-hidden rounded-pill bg-navy-950/25"
                >
                  <span aria-hidden="true" className="block h-full rounded-pill bg-sky-300" style={{ width: `${hydrationPercentage}%` }} />
                </span>
              </dd>
            ) : (
              <dd className="mt-4 text-body font-semibold text-white">
                {snapshot.hydrationState === 'unavailable' ? 'Unavailable' : 'Not recorded'}
              </dd>
            )}
          </div>
          <div className="col-span-2 min-h-28 rounded-card bg-white/[0.11] p-4 ring-1 ring-inset ring-white/20 sm:col-span-1 sm:min-h-36 sm:p-5 lg:min-h-40 lg:p-6">
            <div className="flex items-center gap-2 text-small font-semibold text-white/85">
              <Pill size={18} className="text-medical-100" aria-hidden="true" />
              <dt>Medication</dt>
            </div>
            <dd className="mt-4">
              <span className="block text-body font-semibold text-white">{medicationSummary}</span>
              {nextMedication ? (
                <span className="mt-1 block text-small text-white/75">
                  {[nextMedication.name, nextMedication.time].filter(Boolean).join(' · ')}
                </span>
              ) : null}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
};
