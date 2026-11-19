import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, CircleDashed, Clock, Droplets, HeartPulse, Pill, Plus, RefreshCw } from 'lucide-react';
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
  const [medsModalOpen, setMedsModalOpen] = useState(false);
  const [medBusyId, setMedBusyId] = useState<string | null>(null);
  const [quickMedName, setQuickMedName] = useState('');
  const [quickMedDosage, setQuickMedDosage] = useState('');
  const [quickMedTime, setQuickMedTime] = useState('08:00');
  const [isSavingQuickMed, setIsSavingQuickMed] = useState(false);
  const [quickMedError, setQuickMedError] = useState<string | null>(null);

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

  const toggleMedicationTaken = async (med: MedicationSummary) => {
    if (!med.id) return;
    const today = getTodayKey();
    const currentlyTaken = med.lastTakenDate === today;
    const updatedDate = currentlyTaken ? '' : today;
    setMedBusyId(med.id);
    try {
      await firebaseService.updateMedication(userId, med.id, { lastTakenDate: updatedDate });
      setSnapshot((prev) => prev ? {
        ...prev,
        medications: prev.medications.map((m) => (m.id === med.id ? { ...m, lastTakenDate: updatedDate } : m)),
      } : prev);
      if (!currentlyTaken) {
        try { await firebaseService.updateStreak(userId); } catch { /* Optional streak sync */ }
      }
      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
    } catch (err) {
      console.error('Could not update medication status:', err);
    } finally {
      setMedBusyId(null);
    }
  };

  const handleQuickAddMed = async (name: string, dosage: string, time = '08:00') => {
    const trimmedName = name.trim();
    const trimmedDosage = dosage.trim();
    if (!trimmedName || !trimmedDosage) return;
    setIsSavingQuickMed(true);
    setQuickMedError(null);
    try {
      const result = await firebaseService.addMedication(userId, {
        name: trimmedName,
        dosage: trimmedDosage,
        time,
        frequency: 'Once Daily',
        lastTakenDate: '',
      });
      setSnapshot((prev) => prev ? {
        ...prev,
        medications: [...prev.medications, result.data as MedicationSummary],
      } : prev);
      setQuickMedName('');
      setQuickMedDosage('');
      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
    } catch (err) {
      console.error('Could not add medication:', err);
      setQuickMedError('Medicine could not be saved. Check your connection and try again.');
    } finally {
      setIsSavingQuickMed(false);
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
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
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
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-wa-crimson px-3.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-wa-crimson-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
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
                className="mt-2.5 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-full border border-wa-line bg-wa-surface px-2.5 text-xs font-bold text-wa-plum transition-colors hover:bg-wa-rose/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
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
                <span className="text-[10px] font-semibold text-wa-plum-muted">
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

      {/* Quick Check-in Medicines Modal */}
      <Modal
        open={medsModalOpen}
        onOpenChange={setMedsModalOpen}
        title="Today's medicines"
        description="Tap any medicine to mark it taken today, or quick-add a daily medicine."
        size="sm"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            {onReviewMeds ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setMedsModalOpen(false);
                  onReviewMeds();
                }}
              >
                Full schedule
              </Button>
            ) : <span />}
            <Button variant="primary" size="sm" onClick={() => setMedsModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {snapshot.medications.length > 0 ? (
            <ul className="space-y-2.5">
              {snapshot.medications.map((med, index) => {
                const isTaken = med.lastTakenDate === getTodayKey();
                const isBusy = medBusyId === med.id;
                return (
                  <li
                    key={med.id || `${med.name}-${index}`}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-colors ${
                      isTaken
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-wa-line bg-wa-ground/70 dark:bg-white/5'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-bold ${isTaken ? 'line-through text-wa-plum-muted' : 'text-wa-plum'}`}>
                        {med.name || 'Medication'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-wa-plum-muted">
                        {med.dosage ? <span>{med.dosage}</span> : null}
                        {med.time ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} aria-hidden="true" />
                            {med.time}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ui-control
                      disabled={isBusy || !med.id}
                      onClick={() => void toggleMedicationTaken(med)}
                      aria-label={`Mark ${med.name || 'medication'} as ${isTaken ? 'not taken' : 'taken'}`}
                      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
                        isTaken
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'border border-wa-line bg-wa-surface text-wa-plum hover:border-wa-crimson hover:bg-wa-rose/30'
                      }`}
                    >
                      <Check size={14} aria-hidden="true" />
                      {isTaken ? 'Taken' : 'Take'}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-wa-line bg-wa-ground/60 p-4 text-center dark:bg-white/5">
              <p className="text-sm font-bold text-wa-plum">No medicines scheduled yet</p>
              <p className="mt-1 text-xs text-wa-plum-muted">
                Tap a common sickle cell medicine below or add your own.
              </p>
            </div>
          )}

          <div className="space-y-2.5 border-t border-wa-line-soft pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-wa-plum-muted">
              Quick add medicine
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Hydroxyurea', dosage: '500mg' },
                { name: 'Folic Acid', dosage: '5mg' },
                { name: 'Proguanil', dosage: '100mg' },
                { name: 'Vitamin B Complex', dosage: '1 tablet' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  disabled={isSavingQuickMed}
                  onClick={() => void handleQuickAddMed(preset.name, preset.dosage, '08:00')}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-wa-line bg-wa-surface px-2.5 text-xs font-semibold text-wa-plum transition-colors hover:border-wa-crimson hover:bg-wa-rose/30 disabled:opacity-50"
                >
                  <Plus size={12} aria-hidden="true" />
                  {preset.name}
                </button>
              ))}
            </div>
            <form
              className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-[1fr_90px_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                void handleQuickAddMed(quickMedName, quickMedDosage, quickMedTime);
              }}
            >
              <input
                type="text"
                value={quickMedName}
                onChange={(e) => setQuickMedName(e.target.value)}
                placeholder="Medicine name"
                aria-label="Medicine name"
                className="min-h-10 rounded-xl border border-wa-line bg-wa-surface px-3 text-sm text-wa-plum placeholder:text-wa-plum-muted focus:border-wa-crimson focus:outline-none"
              />
              <input
                type="text"
                value={quickMedDosage}
                onChange={(e) => setQuickMedDosage(e.target.value)}
                placeholder="Dosage"
                aria-label="Dosage"
                className="min-h-10 rounded-xl border border-wa-line bg-wa-surface px-3 text-sm text-wa-plum placeholder:text-wa-plum-muted focus:border-wa-crimson focus:outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSavingQuickMed || !quickMedName.trim() || !quickMedDosage.trim()}
                className="min-h-10"
              >
                Add
              </Button>
            </form>
            {quickMedError && (
              <p role="alert" className="mt-2 text-xs font-semibold text-status-danger-text">
                {quickMedError}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
