import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleDashed, Droplets, HeartPulse, Pill, Plus, RefreshCw } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, Card, ChoiceChip, Modal, Skeleton } from '../ui';

interface TodaysHealthCardProps {
  userId: string;
  refreshKey?: number;
  onStartCheckIn?: () => void;
  onLogPain?: () => void;
  onReviewMeds?: () => void;
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

export const TodaysHealthCard: React.FC<TodaysHealthCardProps> = ({ userId, refreshKey = 0, onStartCheckIn, onLogPain, onReviewMeds }) => {
  const [snapshot, setSnapshot] = useState<TodaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [waterModalOpen, setWaterModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<'liters' | 'sachets' | 'bottles'>('liters');
  const [quantity, setQuantity] = useState(1);
  const [isAddingWater, setIsAddingWater] = useState(false);

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

  const calculateAmount = (unit: 'liters' | 'sachets' | 'bottles', qty: number): number => {
    switch (unit) {
      case 'sachets':
        return qty * 0.5; // 50cl sachet = 0.5L
      case 'bottles':
        return qty * 1.0; // 1L bottle = 1.0L
      default:
        return qty;
    }
  };

  const addWater = async () => {
    setIsAddingWater(true);
    try {
      const today = getTodayKey();
      const currentWater = snapshot?.waterAmount ?? 0;
      const waterGoal = snapshot?.waterGoal ?? 3.0;
      const amountToAdd = calculateAmount(selectedUnit, quantity);
      const newTotal = Math.min(8, parseFloat((currentWater + amountToAdd).toFixed(2)));

      const result = await firebaseService.saveWaterLog(
        userId,
        today,
        newTotal,
        waterGoal
      );

      setSnapshot((prev) => prev ? {
        ...prev,
        waterAmount: newTotal,
        waterGoal,
        hydrationState: result.state === 'recorded' ? 'recorded' : 'cached',
      } : prev);

      setQuantity(1);
      setWaterModalOpen(false);
      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
      await loadSnapshot();
    } catch (error) {
      console.error('Could not add water:', error);
    } finally {
      setIsAddingWater(false);
    }
  };

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
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  snapshot.hasCheckIn
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-wa-sun-soft text-wa-sun-ink dark:text-amber-300'
                }`}>
                  {snapshot.hasCheckIn ? <CheckCircle2 size={13} aria-hidden="true" /> : <CircleDashed size={13} aria-hidden="true" />}
                  {snapshot.hasCheckIn ? 'Checked in' : 'Check-in due'}
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
                onClick={onStartCheckIn}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-wa-crimson px-3.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-wa-crimson-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
              >
                Check in
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
                <dd className="mt-1.5 font-display text-lg font-extrabold tabular-nums text-wa-plum sm:text-xl">
                  {snapshot.painLevel === null ? 'Not logged' : `${snapshot.painLevel} / 10`}
                </dd>
              </div>
              {onLogPain ? (
                <button
                  type="button"
                  data-ui-control
                  onClick={onLogPain}
                  className="mt-2.5 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-full bg-wa-rose px-2.5 text-xs font-bold text-wa-crimson transition-colors hover:bg-wa-crimson hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
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
                    <span className="block font-display text-lg font-extrabold tabular-nums text-wa-plum sm:text-xl">
                      {snapshot.waterAmount.toFixed(1)}L <span className="text-xs font-semibold text-wa-plum-muted">/ {snapshot.waterGoal.toFixed(1)}L</span>
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
                  <dd className="mt-1.5 font-display text-base font-bold text-wa-plum">
                    {snapshot.hydrationState === 'unavailable' ? 'Unavailable' : 'Not logged'}
                  </dd>
                )}
              </div>
              <button
                type="button"
                data-ui-control
                onClick={() => setWaterModalOpen(true)}
                className="mt-2.5 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-full bg-wa-water-soft px-2.5 text-xs font-bold text-wa-water-ink transition-colors hover:bg-wa-water hover:text-white dark:text-wa-water-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-water"
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
                  <span className="block font-display text-base font-bold text-wa-plum">{medicationSummary}</span>
                  {nextMedication ? (
                    <span className="mt-0.5 block truncate text-xs text-wa-plum-muted">
                      {[nextMedication.name, nextMedication.time].filter(Boolean).join(' · ')}
                    </span>
                  ) : null}
                </dd>
              </div>
              {onReviewMeds ? (
                <button
                  type="button"
                  data-ui-control
                  onClick={onReviewMeds}
                  className="mt-2.5 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-full border border-wa-line bg-wa-surface px-2.5 text-xs font-bold text-wa-plum transition-colors hover:bg-wa-rose/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
                >
                  Open meds
                </button>
              ) : null}
            </div>
          </dl>
        </div>
      </Card>

      {/* Quick Add Water Modal */}
      <Modal
        open={waterModalOpen}
        onOpenChange={setWaterModalOpen}
        title="Add water intake"
        description="Quickly add water by container type"
        size="sm"
        footer={
          <Button
            variant="primary"
            onClick={addWater}
            disabled={isAddingWater}
            loading={isAddingWater}
            loadingLabel="Adding..."
          >
            Add {(quantity * calculateAmount(selectedUnit, 1)).toFixed(1)}L
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'sachets' as const, label: '50cl Sachet', description: 'Common Nigerian sachet water (0.5L each)', example: '3 sachets = 1.5L' },
              { value: 'bottles' as const, label: '1L Bottle', description: 'Standard 1-liter bottle (1L each)', example: '2 bottles = 2L' },
              { value: 'liters' as const, label: 'Liters', description: 'Enter amount in liters directly', example: '1.5L = 1.5L' },
            ].map((unit) => (
              <div key={unit.value} className="flex-1 min-w-[120px]">
                <ChoiceChip
                  selected={selectedUnit === unit.value}
                  onSelectedChange={() => setSelectedUnit(unit.value)}
                  disabled={isAddingWater}
                  className="w-full justify-center text-sm"
                >
                  {unit.label}
                </ChoiceChip>
                <p className="text-caption text-foreground-secondary mt-1 text-center">{unit.description}</p>
                <p className="text-caption text-action-accent mt-0.5 text-center font-medium">{unit.example}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-surface border border-line p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body font-medium text-foreground">How many did you drink?</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isAddingWater || quantity <= 1}
                  className="px-3 py-2"
                >
                  <Droplets size={16} />
                </Button>
                <span className="min-w-16 text-center text-heading-3 font-bold tabular-nums text-foreground">{quantity}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isAddingWater || quantity >= 10}
                  className="px-3 py-2"
                >
                  <Droplets size={16} />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-line">
              <span className="text-small text-foreground-secondary">Total to add:</span>
              <span className="text-heading-2 font-bold tabular-nums text-action-accent">{quantity} {selectedUnit === 'sachets' ? 'sachets' : selectedUnit === 'bottles' ? 'bottles' : 'L'} = {(quantity * calculateAmount(selectedUnit, 1)).toFixed(1)}L</span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
