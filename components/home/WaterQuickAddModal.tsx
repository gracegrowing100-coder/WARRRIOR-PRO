import React, { useEffect, useState } from 'react';
import { CupSoda, Droplet, Droplets, GlassWater, Minus, Plus } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Button, Modal } from '../ui';

/** Containers people in Nigeria actually drink from, in litres. */
export const WATER_CONTAINERS = [
  { id: 'cup', label: 'Cup', size: '250 ml', litres: 0.25, icon: GlassWater },
  { id: 'sachet', label: 'Sachet', size: '50 cl', litres: 0.5, icon: Droplet },
  { id: 'bottle', label: 'Bottle', size: '75 cl', litres: 0.75, icon: CupSoda },
  { id: 'big-bottle', label: 'Big bottle', size: '1.5 L', litres: 1.5, icon: Droplets },
] as const;

type ContainerId = typeof WATER_CONTAINERS[number]['id'];

const DEFAULT_GOAL = 3;
const DAILY_CAP = 8;
const MAX_COUNT = 10;

const formatLitres = (value: number) => `${Number(value.toFixed(2))} L`;

export interface WaterQuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  /** Today's stored total, or null when nothing is recorded yet. */
  amount: number | null;
  goal: number | null;
  onSaved: (total: number, goal: number, state: 'recorded' | 'cached') => void;
  onOpenHydration?: () => void;
}

export const WaterQuickAddModal: React.FC<WaterQuickAddModalProps> = ({
  open,
  onOpenChange,
  userId,
  amount,
  goal,
  onSaved,
  onOpenHydration,
}) => {
  const [containerId, setContainerId] = useState<ContainerId>('sachet');
  const [count, setCount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCount(1);
      setError(null);
    }
  }, [open]);

  const container = WATER_CONTAINERS.find((item) => item.id === containerId) ?? WATER_CONTAINERS[1];
  const current = amount ?? 0;
  const target = goal && goal > 0 ? goal : DEFAULT_GOAL;
  const toAdd = Number((container.litres * count).toFixed(2));
  const newTotal = Math.min(DAILY_CAP, Number((current + toAdd).toFixed(2)));
  const capped = current + toAdd > DAILY_CAP;
  const percent = Math.min(100, Math.max(0, (current / target) * 100));
  const afterPercent = Math.min(100, Math.max(0, (newTotal / target) * 100));
  const remaining = Math.max(0, target - current);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await firebaseService.saveWaterLog(userId, new Date().toLocaleDateString('sv'), newTotal, target);
      onSaved(newTotal, target, result?.state === 'recorded' ? 'recorded' : 'cached');
      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
      onOpenChange(false);
    } catch (saveError) {
      console.error('Could not add water:', saveError);
      setError("Water wasn't saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => { if (!saving) onOpenChange(next); }}
      title="Add water"
      description="Steady sips through the day help your blood flow."
      size="sm"
      dismissOnBackdrop={!saving}
      footer={(
        <div className="flex w-full items-center gap-3">
          {onOpenHydration ? (
            <Button
              variant="secondary"
              className="h-12 shrink-0 px-4"
              disabled={saving}
              onClick={() => {
                onOpenChange(false);
                onOpenHydration();
              }}
            >
              Full tracker
            </Button>
          ) : null}
          <Button
            variant="water"
            className="h-12 flex-1"
            disabled={newTotal <= current}
            loading={saving}
            loadingLabel="Adding…"
            onClick={() => void save()}
          >
            Add {formatLitres(toAdd)}
          </Button>
        </div>
      )}
    >
      <div className="space-y-5">
        <section aria-label="Today's water" className="rounded-[22px] bg-wa-water-soft p-4 dark:bg-white/5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-2xl font-extrabold tabular-nums text-wa-water-ink dark:text-wa-water-bright">
              {formatLitres(current)}
              <span className="text-sm font-bold text-wa-plum-muted"> of {formatLitres(target)}</span>
            </p>
            <p className="text-[13px] font-semibold text-wa-plum-muted">
              {remaining > 0 ? `${formatLitres(remaining)} to go` : 'Goal reached'}
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Today's water"
            aria-valuemin={0}
            aria-valuemax={target}
            aria-valuenow={current}
            aria-valuetext={`${formatLitres(current)} of ${formatLitres(target)}`}
            className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-wa-surface/80 dark:bg-white/10"
          >
            <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-wa-water/35 transition-all" style={{ width: `${afterPercent}%` }} />
            <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-wa-water transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-wa-plum-muted" aria-live="polite">
            After this: <span className="font-bold text-wa-plum">{formatLitres(newTotal)}</span>
            {capped ? ` (daily maximum is ${DAILY_CAP} L)` : ''}
          </p>
        </section>

        <fieldset className="space-y-2.5">
          <legend className="font-display text-[15px] font-bold text-wa-plum">What did you drink from?</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {WATER_CONTAINERS.map((item) => {
              const selected = item.id === containerId;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-ui-control
                  aria-pressed={selected}
                  aria-label={`${item.label}, ${item.size}`}
                  disabled={saving}
                  onClick={() => setContainerId(item.id)}
                  className={`flex min-h-[60px] items-center gap-3 rounded-[18px] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-water disabled:opacity-60 ${
                    selected
                      ? 'border-2 border-wa-water bg-wa-water-soft dark:bg-white/5'
                      : 'border-wa-line bg-wa-surface hover:border-wa-water/50'
                  }`}
                >
                  <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-wa-water text-white' : 'bg-wa-water-soft text-wa-water-ink dark:text-wa-water-bright'}`}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-wa-plum">{item.label}</span>
                    <span className="block text-xs text-wa-plum-muted">{item.size}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-wa-line bg-wa-surface p-3">
          <span id="water-count-label" className="text-sm font-bold text-wa-plum">How many?</span>
          <div className="flex items-center gap-2" role="group" aria-labelledby="water-count-label">
            <button
              type="button"
              data-ui-control
              aria-label="One fewer"
              disabled={saving || count <= 1}
              onClick={() => setCount((value) => Math.max(1, value - 1))}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-wa-line bg-wa-surface text-wa-plum transition-colors hover:bg-wa-water-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-water disabled:opacity-40"
            >
              <Minus size={18} aria-hidden="true" />
            </button>
            <output aria-live="polite" className="min-w-10 text-center font-display text-2xl font-extrabold tabular-nums text-wa-plum">
              {count}
            </output>
            <button
              type="button"
              data-ui-control
              aria-label="One more"
              disabled={saving || count >= MAX_COUNT}
              onClick={() => setCount((value) => Math.min(MAX_COUNT, value + 1))}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-wa-line bg-wa-surface text-wa-plum transition-colors hover:bg-wa-water-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-water disabled:opacity-40"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-[13px] font-semibold text-status-danger-text">{error}</p>
        ) : null}
      </div>
    </Modal>
  );
};
