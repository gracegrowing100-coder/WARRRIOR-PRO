import React, { useEffect, useRef, useState } from 'react';
import { Activity, ChevronDown, Droplets, Minus, Plus, PlusCircle, X } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, ChoiceChip, FormField, Modal, SuccessState, Textarea } from '../ui';

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
type HydrationState = 'loading' | 'ready' | 'missing' | 'unavailable';

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
  const [customSymptom, setCustomSymptom] = useState('');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState('');
  const [waterIntake, setWaterIntake] = useState(0);
  const [hydrationState, setHydrationState] = useState<HydrationState>('loading');
  const [selectedUnit, setSelectedUnit] = useState<'liters' | 'sachets' | 'bottles'>('liters');
  const [quantity, setQuantity] = useState(1);
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
        setWaterIntake(log.data?.amount ?? 0);
        setHydrationState(log.data ? 'ready' : log.state === 'unavailable' ? 'unavailable' : 'missing');
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

  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms([...symptoms, trimmed]);
      setCustomSymptom('');
    }
  };

  const removeCustomSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter((s) => s !== symptom));
  };

  const addCustomTrigger = () => {
    const trimmed = customTrigger.trim();
    if (trimmed && !triggers.includes(trimmed)) {
      setTriggers([...triggers, trimmed]);
      setCustomTrigger('');
    }
  };

  const removeCustomTrigger = (trigger: string) => {
    setTriggers(triggers.filter((t) => t !== trigger));
  };

  const updateWater = (change: number) => {
    setWaterIntake((current) => Math.min(8, Math.max(0, Number((current + change).toFixed(2)))));
  };

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

  const addWaterByUnit = () => {
    const amount = calculateAmount(selectedUnit, quantity);
    updateWater(amount);
    setQuantity(1);
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
      title="Log how you feel today"
      description="Track your pain level, symptoms, and water intake to monitor your health over time."
      closeLabel="Close symptom and pain log"
      initialFocusRef={painRangeRef}
      size="lg"
      dismissOnBackdrop={!isSaving}
      contentClassName="space-y-8"
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
              <h3 id="pain-score-heading" className="text-heading-2 font-bold text-foreground">Pain Level</h3>
              <p className="text-body text-foreground-secondary">Rate your current pain from 0 to 10</p>
            </div>

            <div className="rounded-2xl border-2 border-line bg-gradient-to-br from-surface-subtle to-surface p-6 sm:p-8 shadow-sm">
              <div className="mb-4 flex items-end justify-between gap-4">
                <span className="text-body font-medium text-foreground-secondary">Your pain level</span>
                <output htmlFor="symptom-pain-range" className="text-5xl font-black tabular-nums text-action-accent">
                  {painLevel}<span className="text-2xl font-medium text-foreground-secondary"> / 10</span>
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
                className="h-3 w-full cursor-pointer accent-action rounded-full"
              />
              <div className="mt-3 flex justify-between gap-4 text-body font-semibold text-foreground-secondary">
                <span>0 = No pain</span>
                <span className="text-right">10 = Worst pain</span>
              </div>
            </div>
          </section>

          <fieldset className="space-y-4">
            <legend className="text-heading-2 font-bold text-foreground">Symptoms</legend>
            <p className="text-body text-foreground-secondary">Select all symptoms you're experiencing today</p>
            <div className="flex flex-wrap gap-3">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <ChoiceChip
                  key={symptom}
                  selected={symptoms.includes(symptom)}
                  onSelectedChange={() => toggleSelection(symptom, symptoms, setSymptoms)}
                  disabled={isSaving}
                  className="min-w-0 whitespace-normal text-left px-4 py-2.5 text-body"
                >
                  {symptom}
                </ChoiceChip>
              ))}
            </div>

            {/* Display custom symptoms */}
            {symptoms.filter(s => !SYMPTOM_OPTIONS.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {symptoms.filter(s => !SYMPTOM_OPTIONS.includes(s)).map((symptom) => (
                  <div
                    key={symptom}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-action-accent/10 border border-action-accent/20 text-body font-medium text-foreground"
                  >
                    {symptom}
                    <button
                      type="button"
                      onClick={() => removeCustomSymptom(symptom)}
                      disabled={isSaving}
                      className="p-1 rounded-full hover:bg-action-accent/20 transition-colors"
                      aria-label={`Remove ${symptom}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add custom symptom input */}
            <FormField
              label="Add custom symptom"
              helpText="Type a symptom not listed above and press Enter or click Add"
            >
              <div className="flex gap-2">
                <Textarea
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  placeholder="e.g., Headache, Nausea, etc."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addCustomSymptom();
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 min-h-12"
                  rows={1}
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={addCustomSymptom}
                  disabled={isSaving || !customSymptom.trim()}
                  className="px-4"
                >
                  <PlusCircle size={18} />
                </Button>
              </div>
            </FormField>
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

                {/* Display custom triggers */}
                {triggers.filter(t => !TRIGGER_OPTIONS.includes(t)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {triggers.filter(t => !TRIGGER_OPTIONS.includes(t)).map((trigger) => (
                      <div
                        key={trigger}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-action-accent/10 border border-action-accent/20 text-body font-medium text-foreground"
                      >
                        {trigger}
                        <button
                          type="button"
                          onClick={() => removeCustomTrigger(trigger)}
                          disabled={isSaving}
                          className="ml-1 p-0.5 rounded-full hover:bg-action-accent/20 transition-colors"
                          aria-label={`Remove ${trigger}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add custom trigger input */}
                <FormField
                  label="Add custom trigger"
                  helpText="Type a trigger not listed above and press Enter or click Add"
                >
                  <div className="flex gap-2">
                    <Textarea
                      value={customTrigger}
                      onChange={(e) => setCustomTrigger(e.target.value)}
                      placeholder="e.g., Air conditioning, Exercise, etc."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          addCustomTrigger();
                        }
                      }}
                      disabled={isSaving}
                      className="flex-1 min-h-11"
                      rows={1}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addCustomTrigger}
                      disabled={isSaving || !customTrigger.trim()}
                      className="px-3"
                    >
                      <PlusCircle size={18} />
                    </Button>
                  </div>
                </FormField>
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
                {hydrationState === 'missing' && (
                  <Alert tone="info" title="No hydration recorded today">
                    The editable value starts at zero and will be saved with this health entry.
                  </Alert>
                )}

                <div className="space-y-4 rounded-card border border-status-info/25 bg-status-info-soft p-4">
                  {/* Current total display with +/- buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="secondary"
                      aria-label="Decrease today's hydration total by 250 milliliters"
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
                      aria-label="Increase today's hydration total by 250 milliliters"
                      onClick={() => updateWater(0.25)}
                      disabled={isSaving || hydrationState === 'loading'}
                      className="min-w-11 px-0"
                    >
                      <Plus size={18} aria-hidden="true" />
                    </Button>
                  </div>

                  {/* Quick add presets */}
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

                  {/* Unit-based input with multiplier */}
                  <div className="border-t border-status-info/30 pt-4 space-y-4">
                    <div>
                      <p className="text-body font-semibold text-foreground mb-1">Add by container type</p>
                      <p className="text-small text-foreground-secondary">Select the type of water container you drank from, then multiply</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'sachets' as const, label: '50cl Sachet', description: 'Common Nigerian sachet water (0.5L each)', example: '3 sachets = 1.5L', amount: 0.5 },
                        { value: 'bottles' as const, label: '1L Bottle', description: 'Standard 1-liter bottle (1L each)', example: '2 bottles = 2L', amount: 1.0 },
                        { value: 'liters' as const, label: 'Liters', description: 'Enter amount in liters directly', example: '1.5L = 1.5L', amount: 1.0 },
                      ].map((unit) => (
                        <div key={unit.value} className="flex-1 min-w-[140px]">
                          <ChoiceChip
                            selected={selectedUnit === unit.value}
                            onSelectedChange={() => setSelectedUnit(unit.value)}
                            disabled={isSaving}
                            className="w-full justify-center"
                          >
                            {unit.label}
                          </ChoiceChip>
                          <p className="text-caption text-foreground-secondary mt-1 text-center">
                            {unit.description}
                          </p>
                          <p className="text-caption text-action-accent mt-0.5 text-center font-medium">
                            {unit.example}
                          </p>
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
                            disabled={isSaving || quantity <= 1}
                            className="px-3 py-2"
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="min-w-20 text-center text-heading-3 font-bold tabular-nums text-foreground">
                            {quantity}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setQuantity(quantity + 1)}
                            disabled={isSaving || quantity >= 10}
                            className="px-3 py-2"
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-lg bg-action-accent/5 border border-action-accent/20 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-body font-semibold text-foreground">Total to add:</span>
                          <span className="text-2xl font-black tabular-nums text-action-accent">
                            {quantity} {selectedUnit === 'sachets' ? 'sachets' : selectedUnit === 'bottles' ? 'bottles' : 'L'} = {(quantity * calculateAmount(selectedUnit, 1)).toFixed(1)}L
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={addWaterByUnit}
                        disabled={isSaving || hydrationState === 'loading'}
                        className="w-full"
                      >
                        Add {(quantity * calculateAmount(selectedUnit, 1)).toFixed(1)}L to total
                      </Button>
                    </div>
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
