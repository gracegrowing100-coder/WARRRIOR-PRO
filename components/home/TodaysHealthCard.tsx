import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, CircleDashed, Droplets, HeartPulse, Pill, Plus, RefreshCw } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, Card, Skeleton } from '../ui';
import { MedicineCheckInModal, type MedicationSummary } from './MedicineCheckInModal';
import { WaterQuickAddModal } from './WaterQuickAddModal';

interface TodaysHealthCardProps {
  userId: string;
  refreshKey?: number;
  onStartCheckIn?: () => void;
  onLogPain?: () => void;
  onReviewMeds?: () => void;
  onOpenHydration?: () => void;
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

const getTodayKey = () => new Date().toLocaleDateString('sv');

const formatUpdatedTime = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const TodaysHealthCard: React.FC<TodaysHealthCardProps> = ({ userId, refreshKey = 0, onStartCheckIn, onLogPain, onReviewMeds, onOpenHydration }) => {
  const [snapshot, setSnapshot] = useState<TodaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [waterModalOpen, setWaterModalOpen] = useState(false);
  const [medsModalOpen, setMedsModalOpen] = useState(false);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const today = getTodayKey();
      const [checkIn, painLogs, symptomLogs, water, medications] = await Promise.all([
        firebaseService.getDailyMoodCheckIn(userId, today),
        firebaseService.getPainLogs(userId),
        typeof firebaseService.getSymptomLogs === 'function'
          ? firebaseService.getSymptomLogs(userId).catch(() => [])
          : Promise.resolve([]),
        firebaseService.getWaterLog(userId, today),
        firebaseService.getMedications(userId),
      ]);
      const todayPain = (painLogs as PainLog[]).find((entry) => entry.dateStr === today)
        ?? (symptomLogs as PainLog[]).find((entry) => entry.dateStr === today);
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
      <Card as="section" data-semantic id="home-header-stats" aria-labelledby="todays-health-title" className="rounded-[28px] border border-wa-line bg-wa-surface shadow-[0_12px_30px_rgb(59_15_44/0.12)]" padding="md">
        <h2 id="todays-health-title" className="text-sm font-bold text-wa-plum">Today&apos;s snapshot</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Skeleton className="min-h-24 rounded-[18px]" />
          <Skeleton className="min-h-24 rounded-[18px]" />
          <Skeleton className="col-span-2 min-h-20 rounded-[18px] sm:col-span-1 sm:min-h-24" />
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

  // Explainable plain-language factor bullets (Sec. 4.1 — self-monitoring support, not a clinical prediction)
  const explainableFactors: string[] = [];
  if (snapshot.painLevel !== null) {
    if (snapshot.painLevel >= 7) {
      explainableFactors.push(`Pain (${snapshot.painLevel}/10): High pain logged today—prioritize warmth, rest, prescribed analgesia, and contact your care team or use Emergency SOS if symptoms worsen.`);
    } else if (snapshot.painLevel >= 4) {
      explainableFactors.push(`Pain (${snapshot.painLevel}/10): Moderate discomfort logged—keep warm, avoid cold drafts, and sip fluids steadily.`);
    } else {
      explainableFactors.push(`Pain (${snapshot.painLevel}/10): Low pain logged today—continue pacing your activity and hydration.`);
    }
  }
  if (snapshot.waterAmount !== null && snapshot.waterGoal !== null) {
    const remaining = Math.max(0, snapshot.waterGoal - snapshot.waterAmount);
    if (remaining > 0) {
      explainableFactors.push(`Hydration (${snapshot.waterAmount.toFixed(1)}L/${snapshot.waterGoal.toFixed(1)}L): ${remaining.toFixed(1)}L remaining toward your daily target to support blood flow.`);
    } else {
      explainableFactors.push(`Hydration (${snapshot.waterAmount.toFixed(1)}L/${snapshot.waterGoal.toFixed(1)}L): Daily fluid target reached.`);
    }
  }
  if (snapshot.medications.length > 0) {
    if (pendingMedications.length > 0) {
      explainableFactors.push(`Medicines (${pendingMedications.length} due): Taking prescribed doses on schedule supports your daily care plan.`);
    } else {
      explainableFactors.push(`Medicines: All scheduled doses marked taken for today.`);
    }
  }

  return (
    <>
      <Card
        as="section"
        id="home-header-stats"
        aria-labelledby="todays-health-title"
        data-semantic
        className="relative overflow-hidden rounded-[28px] border border-wa-line bg-wa-surface p-4 text-wa-plum shadow-[0_12px_30px_rgb(59_15_44/0.12)] sm:p-5"
        padding="none"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="todays-health-title" className="font-display text-base font-extrabold text-wa-plum sm:text-lg">
                  {snapshot.moodLabel || (hasTodayData ? "Today's snapshot" : 'Ready when you are')}
                </h2>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  snapshot.hasCheckIn
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-wa-ground text-wa-plum-muted ring-1 ring-wa-line'
                }`}>
                  {snapshot.hasCheckIn ? <CheckCircle2 size={13} aria-hidden="true" /> : <CircleDashed size={13} aria-hidden="true" />}
                  {snapshot.hasCheckIn ? 'Check-in recorded' : 'Not yet today'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-wa-plum-muted">
                {updatedTime ? `Updated at ${updatedTime}` : 'Your daily pain, water, and medicines at a glance'}
              </p>
            </div>
            {!snapshot.hasCheckIn && onStartCheckIn ? (
              <button
                type="button"
                data-ui-control
                aria-label="Start daily check-in"
                onClick={onStartCheckIn}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-wa-crimson px-3.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-wa-crimson-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
              >
                Start daily check-in
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            <div className="flex flex-col justify-between rounded-[18px] border border-wa-line-soft bg-wa-ground/70 p-3 dark:bg-white/5">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-wa-plum-muted">
                  <HeartPulse size={15} className="text-wa-crimson" aria-hidden="true" />
                  <dt>Pain</dt>
                </div>
                {snapshot.painLevel === null ? (
                  <dd className="mt-1.5 text-sm font-semibold text-wa-plum-muted">Not recorded</dd>
                ) : (
                  <dd className="mt-1.5 font-display text-lg font-extrabold tabular-nums text-wa-plum sm:text-xl">
                    {`${snapshot.painLevel} / 10`}
                  </dd>
                )}
              </div>
              {onLogPain ? (
                <button
                  type="button"
                  data-ui-control
                  onClick={onLogPain}
                  className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-full bg-wa-rose px-2.5 text-xs font-bold text-wa-crimson transition-colors hover:bg-wa-crimson hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
                >
                  <Plus size={14} aria-hidden="true" />
                  Log pain
                </button>
              ) : null}
            </div>

            <div className="flex flex-col justify-between rounded-[18px] border border-wa-line-soft bg-wa-ground/70 p-3 dark:bg-white/5">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-wa-plum-muted">
                  <Droplets size={15} className="text-wa-water" aria-hidden="true" />
                  <dt>Water</dt>
                </div>
                {snapshot.waterAmount !== null && snapshot.waterGoal !== null ? (
                  <dd className="mt-1.5">
                    <span className="block font-display text-base font-extrabold tabular-nums text-wa-plum sm:text-lg">
                      {waterValueText}
                    </span>
                    <span
                      role="progressbar"
                      aria-label="Today's hydration"
                      aria-valuemin={0}
                      aria-valuemax={snapshot.waterGoal}
                      aria-valuenow={snapshot.waterAmount}
                      aria-valuetext={waterValueText}
                      className="mt-1.5 block h-1.5 overflow-hidden rounded-pill bg-wa-line"
                    >
                      <span aria-hidden="true" className="block h-full rounded-pill bg-wa-water" style={{ width: `${hydrationPercentage}%` }} />
                    </span>
                  </dd>
                ) : (
                  <dd className="mt-1.5 text-sm font-semibold text-wa-plum-muted">
                    {snapshot.hydrationState === 'unavailable' ? "Couldn't load right now" : 'Not recorded'}
                  </dd>
                )}
              </div>
              <button
                type="button"
                data-ui-control
                onClick={() => setWaterModalOpen(true)}
                className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-full bg-wa-water-soft px-2.5 text-xs font-bold text-wa-water-ink transition-colors hover:bg-wa-water hover:text-white dark:text-wa-water-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-water"
              >
                <Plus size={14} aria-hidden="true" />
                Add water
              </button>
            </div>

            <div className="col-span-2 flex flex-col justify-between rounded-[18px] border border-wa-line-soft bg-wa-ground/70 p-3 dark:bg-white/5 sm:col-span-1">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-wa-plum-muted">
                  <Pill size={15} className="text-wa-plum" aria-hidden="true" />
                  <dt>Medicines</dt>
                </div>
                <dd className="mt-1.5">
                  <span className={snapshot.medications.length === 0
                    ? 'block text-sm font-semibold text-wa-plum-muted'
                    : 'block font-display text-base font-bold text-wa-plum'}>
                    {medicationSummary}
                  </span>
                  {nextMedication ? (
                    <span className="mt-0.5 block truncate text-xs text-wa-plum-muted">
                      {[nextMedication.name, nextMedication.time].filter(Boolean).join(' · ')}
                    </span>
                  ) : null}
                </dd>
              </div>
              <button
                type="button"
                data-ui-control
                onClick={() => setMedsModalOpen(true)}
                className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-wa-line bg-wa-surface px-2.5 text-xs font-bold text-wa-plum transition-colors hover:bg-wa-rose/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
              >
                <Check size={14} aria-hidden="true" />
                Check meds
              </button>
            </div>
          </dl>

          {/* Explainable Daily Self-Monitoring Guide ("Why today's signals matter") */}
          {explainableFactors.length > 0 && (
            <div className="rounded-[18px] border border-wa-line-soft bg-wa-ground/60 p-3.5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-xs font-extrabold uppercase tracking-wider text-wa-plum">
                  Why today&apos;s signals matter
                </span>
                <span className="text-xs font-semibold text-wa-plum-muted">
                  Self-monitoring support &bull; Not a clinical prediction
                </span>
              </div>
              <ul className="space-y-1 text-xs text-wa-plum-muted leading-relaxed">
                {explainableFactors.map((factor) => (
                  <li key={factor} className="flex items-start gap-1.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-wa-crimson" aria-hidden="true" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      <WaterQuickAddModal
        open={waterModalOpen}
        onOpenChange={setWaterModalOpen}
        userId={userId}
        amount={snapshot.waterAmount}
        goal={snapshot.waterGoal}
        onOpenHydration={onOpenHydration}
        onSaved={(total, goal, state) => {
          setSnapshot((prev) => (prev ? { ...prev, waterAmount: total, waterGoal: goal, hydrationState: state } : prev));
          void loadSnapshot();
        }}
      />

      <MedicineCheckInModal
        open={medsModalOpen}
        onOpenChange={setMedsModalOpen}
        userId={userId}
        medications={snapshot.medications}
        onMedicationsChange={(medications) => setSnapshot((prev) => (prev ? { ...prev, medications } : prev))}
        onReviewMeds={onReviewMeds}
      />
    </>
  );
};
