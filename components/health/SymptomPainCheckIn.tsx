import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Droplets, Minus, Plus } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, ChoiceChip, Modal, SuccessState } from '../ui';

const SYMPTOM_OPTIONS = [
  'Dactylitis (hand-foot swelling)',
  'Fatigue',
  'Jaundice (yellowing eyes/skin)',
  'Fever',
  'Shortness of Breath',
  'Dehydration',
];

const TRIGGER_OPTIONS = [
  'Cold weather',
  'Stress',
  'Infection',
  'Low fluid intake',
];

type SaveState = 'idle' | 'saving' | 'success' | 'error';
type HydrationState = 'loading' | 'ready' | 'unavailable';

export interface SymptomPainCheckInProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSaved: () => void;
  onPainChange?: (painLevel: number) => void;
}

export const SymptomPainCheckIn: React.FC<SymptomPainCheckInProps> = ({
  open,
  onOpenChange,
  userId,
  onSaved,
  onPainChange,
}) => {
  const [painLevel, setPainLevel] = useState(3);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [hydrationState, setHydrationState] = useState<HydrationState>('loading');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const painRangeRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toLocaleDateString('sv');
  const isSaving = saveState === 'saving';
  const isComplete = saveState === 'success';

  useEffect(() => {
    if (!open) return;

    let active = true;
    setHydrationState('loading');

    firebaseService.getWaterLog(userId, todayStr)
      .then((log) => {
        if (!active) return;
        setWaterIntake(typeof log?.amount === 'number' ? log.amount : 0);
        setHydrationState('ready');
      })
      .catch(() => {
        if (!active) return;
        setWaterIntake(0);
        setHydrationState('unavailable');
      });

    return () => {
      active = false;
    };
  }, [open, todayStr, userId]);

  const updatePain = (value: number) => {
    setPainLevel(value);
    onPainChange?.(value);
  };

  const toggleSelection = (
    value: string,
    selectedValues: string[],
    setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setSelectedValues(selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value]);
  };

  const updateWater = (change: number) => {
    setWaterIntake((current) => Math.min(8, Math.max(0, Number((current + change).toFixed(2)))));
  };

  const closeWorkflow = () => {
    if (isSaving) return;
    if (isComplete) {
      setSymptoms([]);
      setTriggers([]);
      setSaveState('idle');
    }
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) closeWorkflow();
    else onOpenChange(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving || hydrationState === 'loading') return;

    setSaveState('saving');
    try {
      await firebaseService.addSymptomLog(
        userId,
        painLevel,
        symptoms,
        triggers,
        waterIntake,
        todayStr,
      );
      onSaved();
      setSaveState('success');
    } catch (error) {
      console.error('Unable to complete symptom and pain entry:', error);
      setSaveState('error');
    }
  };

  const footer = isComplete ? (
    <Button fullWidth className="sm:ml-auto sm:w-auto sm:min-w-36" onClick={closeWorkflow}>
      Done
    </Button>
  ) : (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button
        variant="secondary"
        fullWidth
        disabled={isSaving}
        onClick={closeWorkflow}
        className="sm:w-auto sm:min-w-32"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="symptom-pain-form"
        variant="primary"
        fullWidth
        disabled={hydrationState === 'loading'}
        loading={isSaving}
        loadingLabel="Saving health entry…"
        className="sm:w-auto sm:min-w-44"
      >
        {saveState === 'error' ? 'Retry health entry' : 'Save health entry'}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Log symptoms and pain"
      description="Record how you feel today. Optional details can be added if they are useful."
      closeLabel="Close symptom and pain log"
      initialFocusRef={painRangeRef}
      size="md"
      dismissOnBackdrop={!isSaving}
      contentClassName="space-y-6"
      footer={footer}
    >
      {isComplete ? (
        <SuccessState
          live="polite"
          title={userId ? 'Health entry saved' : 'Health entry saved on this device'}
          description={userId
            ? 'Your entry is available on this device. Cloud synchronization status could not be confirmed.'
            : 'Your entry is stored locally on this device.'}
          className="border-0 py-8 shadow-none"
        />
      ) : (
        <form id="symptom-pain-form" onSubmit={handleSubmit} className="space-y-7">
          {saveState === 'error' && (
            <Alert tone="danger" title="We couldn’t confirm the complete save" live="assertive">
              Your selections are still here. Check your connection and try again.
            </Alert>
          )}

          <section aria-labelledby="pain-score-heading" className="space-y-4">
            <div>
              <h3 id="pain-score-heading" className="text-heading-3 text-foreground">Pain score</h3>
              <p className="mt-1 text-small text-foreground-secondary">Choose a number from 0 to 10.</p>
            </div>

            <div className="rounded-card border border-line bg-surface-subtle p-4 sm:p-5">
              <div className="mb-3 flex items-end justify-between gap-4">
                <span className="text-small font-medium text-foreground-secondary">Current score</span>
                <output htmlFor="symptom-pain-range" className="text-heading-1 tabular-nums text-foreground">
                  {painLevel}<span className="text-body font-medium text-foreground-secondary"> / 10</span>
                </output>
              </div>
              <label htmlFor="symptom-pain-range" className="sr-only">Pain score</label>
              <input
                ref={painRangeRef}
                id="symptom-pain-range"
                type="range"
                min="0"
                max="10"
                step="1"
                value={painLevel}
                aria-valuetext={`${painLevel} out of 10`}
                onChange={(event) => updatePain(Number(event.target.value))}
                className="h-11 w-full cursor-pointer accent-action"
              />
              <div className="mt-1 flex justify-between gap-4 text-caption font-medium text-foreground-secondary">
                <span>0 = No pain</span>
                <span className="text-right">10 = Worst pain</span>
              </div>
            </div>
          </section>

          <fieldset className="space-y-3">
            <legend className="text-heading-3 text-foreground">Symptoms</legend>
            <p className="text-small text-foreground-secondary">Select every symptom that applies. You can leave this blank.</p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <ChoiceChip
                  key={symptom}
                  selected={symptoms.includes(symptom)}
                  onSelectedChange={() => toggleSelection(symptom, symptoms, setSymptoms)}
                  disabled={isSaving}
                  className="min-w-0 whitespace-normal text-left"
                >
                  {symptom}
                </ChoiceChip>
              ))}
            </div>
          </fieldset>

          <details className="group rounded-card border border-line bg-surface">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-card px-4 py-3 text-body font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
              <span>
                Optional details
                <span className="mt-0.5 block text-small font-normal text-foreground-secondary">Possible triggers and today’s hydration total</span>
              </span>
              <ChevronDown className="shrink-0 text-foreground-secondary group-open:rotate-180" size={20} aria-hidden="true" />
            </summary>

            <div className="space-y-6 border-t border-line px-4 py-5">
              <fieldset className="space-y-3">
                <legend className="text-body font-semibold text-foreground">Possible triggers</legend>
                <p className="text-small text-foreground-secondary">Select any possible trigger you noticed.</p>
                <div className="flex flex-wrap gap-2">
                  {TRIGGER_OPTIONS.map((trigger) => (
                    <ChoiceChip
                      key={trigger}
                      selected={triggers.includes(trigger)}
                      onSelectedChange={() => toggleSelection(trigger, triggers, setTriggers)}
                      disabled={isSaving}
                    >
                      {trigger}
                    </ChoiceChip>
                  ))}
                </div>
              </fieldset>

              <section aria-labelledby="hydration-total-heading" className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 id="hydration-total-heading" className="text-body font-semibold text-foreground">Today’s hydration total</h3>
                    <p className="mt-1 text-small text-foreground-secondary">This updates the same daily total shown on Home.</p>
                  </div>
                  <span className="inline-flex min-h-11 items-center gap-2 text-small font-semibold tabular-nums text-status-info-text">
                    <Droplets size={18} aria-hidden="true" /> {waterIntake.toFixed(2)} L
                  </span>
                </div>

                {hydrationState === 'loading' && (
                  <p role="status" className="text-small text-foreground-secondary">Loading today’s hydration total…</p>
                )}
                {hydrationState === 'unavailable' && (
                  <Alert tone="warning" title="Today’s total could not be loaded">
                    Review the editable value before saving this entry.
                  </Alert>
                )}

                <div className="flex flex-col gap-3 rounded-card border border-status-info/25 bg-status-info-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="secondary"
                      aria-label="Decrease today’s hydration total by 250 milliliters"
                      onClick={() => updateWater(-0.25)}
                      disabled={isSaving || hydrationState === 'loading'}
                      className="min-w-11 px-0"
                    >
                      <Minus size={18} aria-hidden="true" />
                    </Button>
                    <span className="min-w-24 text-center text-body font-semibold tabular-nums text-foreground">
                      {waterIntake.toFixed(2)} L
                    </span>
                    <Button
                      variant="secondary"
                      aria-label="Increase today’s hydration total by 250 milliliters"
                      onClick={() => updateWater(0.25)}
                      disabled={isSaving || hydrationState === 'loading'}
                      className="min-w-11 px-0"
                    >
                      <Plus size={18} aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '+250ml', amount: 0.25 },
                      { label: '+500ml', amount: 0.5 },
                      { label: '+1.0L', amount: 1 },
                    ].map((preset) => (
                      <Button
                        key={preset.label}
                        variant="secondary"
                        size="sm"
                        onClick={() => updateWater(preset.amount)}
                        disabled={isSaving || hydrationState === 'loading'}
                        className="px-2 text-status-info-text"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </details>

          {hydrationState === 'loading' && (
            <p role="status" className="text-small text-foreground-secondary">Preparing today’s saved hydration value before you can submit.</p>
          )}
        </form>
      )}
    </Modal>
  );
};
