import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, Minus, Plus } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, ChoiceChip, Modal, SuccessState } from '../ui';

const SYMPTOM_OPTIONS = [
  'Fatigue',
  'Fever',
  'Shortness of Breath',
  'Dactylitis (hand-foot swelling)',
  'Jaundice (yellowing eyes/skin)',
  'Dehydration',
];

const TRIGGER_OPTIONS = [
  'Cold weather',
  'Stress',
  'Infection',
  'Low fluid intake',
];

const BODY_REGIONS = [
  'Head',
  'Chest',
  'Back',
  'Abdomen',
  'Arms / Shoulders',
  'Hips / Pelvis',
  'Legs / Knees',
  'Hands / Feet',
];

const PAIN_SITE_PREFIX = 'Pain site: ';

type SaveState = 'idle' | 'saving' | 'success' | 'error';
type HydrationState = 'loading' | 'ready' | 'missing' | 'unavailable';

/** Plain-language band for a 0-10 score, with matching colours from the design tokens. */
export const describePain = (level: number) => {
  if (level === 0) return { word: 'No pain', chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', number: 'text-emerald-700 dark:text-emerald-300' };
  if (level <= 3) return { word: 'Mild', chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', number: 'text-emerald-700 dark:text-emerald-300' };
  if (level <= 6) return { word: 'Moderate', chip: 'bg-wa-sun-soft text-wa-sun-ink dark:text-amber-300', number: 'text-wa-sun-ink dark:text-amber-300' };
  if (level <= 8) return { word: 'Severe', chip: 'bg-wa-rose text-wa-crimson', number: 'text-wa-crimson' };
  return { word: 'Very severe', chip: 'bg-wa-rose text-wa-crimson', number: 'text-wa-crimson' };
};

const sectionTitle = 'font-display text-[15px] font-bold text-wa-plum';
const sectionHint = 'text-xs text-wa-plum-muted';
const inputClass = 'h-12 min-w-0 flex-1 rounded-2xl border border-wa-line bg-wa-surface px-4 text-base text-wa-plum placeholder:text-wa-plum-muted/70 focus:border-wa-crimson focus:outline-none focus:ring-2 focus:ring-wa-crimson/30 disabled:opacity-60';

export interface SymptomPainCheckInProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSaved: () => void;
  onPainChange?: (painLevel: number) => void;
}

interface AddOwnProps {
  id: string;
  label: string;
  placeholder: string;
  disabled: boolean;
  onAdd: (value: string) => void;
}

/** A labelled text field with an Add button; Enter also adds. */
const AddOwn: React.FC<AddOwnProps> = ({ id, label, placeholder, disabled, onAdd }) => {
  const [value, setValue] = useState('');
  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-bold text-wa-plum">{label}</label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          className={inputClass}
        />
        <Button variant="secondary" className="h-12 shrink-0 px-5" disabled={disabled || !value.trim()} onClick={submit}>
          Add
        </Button>
      </div>
    </div>
  );
};

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
  const band = describePain(painLevel);

  // The symptom record carries today's water total, and saving it rewrites the day's
  // hydration log, so it must start from the stored value rather than a default.
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
    const next = Math.min(10, Math.max(0, value));
    setPainLevel(next);
    onPainChange?.(next);
  };

  const toggle = (value: string, setValues: React.Dispatch<React.SetStateAction<string[]>>) => {
    setValues((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const addUnique = (value: string, setValues: React.Dispatch<React.SetStateAction<string[]>>) => {
    setValues((current) => (current.some((item) => item.toLowerCase() === value.toLowerCase()) ? current : [...current, value]));
  };

  const customSymptoms = symptoms.filter((s) => !SYMPTOM_OPTIONS.includes(s) && !s.startsWith(PAIN_SITE_PREFIX));
  const customTriggers = triggers.filter((t) => !TRIGGER_OPTIONS.includes(t));
  const painSites = symptoms.filter((s) => s.startsWith(PAIN_SITE_PREFIX)).map((s) => s.slice(PAIN_SITE_PREFIX.length));

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

  const openEmergencyHelp = () => {
    closeWorkflow();
    // Let the dialog release the page before the SOS button opens its own dialog.
    window.setTimeout(() => document.getElementById('emergency-fab')?.click(), 0);
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
    <Button fullWidth className="h-12 sm:ml-auto sm:w-auto sm:min-w-36" onClick={closeWorkflow}>
      Done
    </Button>
  ) : (
    <div className="flex w-full items-center gap-3 sm:justify-end">
      <Button variant="secondary" disabled={isSaving} onClick={closeWorkflow} className="h-12 shrink-0 px-5">
        Cancel
      </Button>
      <Button
        type="submit"
        form="symptom-pain-form"
        variant="primary"
        disabled={hydrationState === 'loading'}
        loading={isSaving}
        loadingLabel="Saving health entry…"
        className="h-12 flex-1 sm:flex-none sm:min-w-44"
      >
        {saveState === 'error' ? 'Retry health entry' : 'Save health entry'}
      </Button>
    </div>
  );

  const summaryParts = [
    `Pain ${painLevel}/10 (${band.word.toLowerCase()})`,
    painSites.length > 0 ? painSites.join(', ') : null,
  ].filter(Boolean);

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Log symptoms and pain"
      description="Record how you feel today. Only the pain score is needed; everything else is optional."
      closeLabel="Close symptom and pain log"
      initialFocusRef={painRangeRef}
      size="md"
      dismissOnBackdrop={!isSaving}
      footer={footer}
    >
      {isComplete ? (
        <div className="space-y-4">
          <SuccessState
            live="polite"
            title={userId ? 'Health entry saved' : 'Health entry saved on this device'}
            description={userId
              ? 'Your entry is available on this device. Cloud synchronization status could not be confirmed.'
              : 'Your entry is stored locally on this device.'}
            className="border-0 pb-2 pt-6 shadow-none"
          />
          <p className="rounded-[18px] bg-wa-ground/70 p-3.5 text-center text-[13px] font-semibold text-wa-plum dark:bg-white/5">
            {summaryParts.join(' · ')}
          </p>
          {painLevel >= 7 ? (
            <p className="text-center text-xs text-wa-plum-muted">
              If the pain isn&apos;t easing with your usual plan, contact your clinic or call 112.
            </p>
          ) : null}
        </div>
      ) : (
        <form id="symptom-pain-form" onSubmit={handleSubmit} className="space-y-6">
          {saveState === 'error' && (
            <Alert tone="danger" title="We couldn’t confirm the complete save" live="assertive">
              Your selections are still here. Check your connection and try again.
            </Alert>
          )}

          <section aria-labelledby="pain-score-heading" className="rounded-[22px] border border-wa-line bg-wa-ground/70 p-4 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="pain-score-heading" className={sectionTitle}>Pain right now</h3>
                <p className={sectionHint}>0 is no pain, 10 is the worst you can imagine</p>
              </div>
              <span className={`inline-flex min-h-7 shrink-0 items-center rounded-full px-3 text-xs font-bold ${band.chip}`}>
                {band.word}
              </span>
            </div>

            <output htmlFor="symptom-pain-range" className={`mt-2 block text-center font-display text-5xl font-black tabular-nums ${band.number}`}>
              {painLevel}<span className="text-xl font-bold text-wa-plum-muted"> / 10</span>
            </output>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                data-ui-control
                aria-label="Lower pain score by 1"
                disabled={isSaving || painLevel <= 0}
                onClick={() => updatePain(painLevel - 1)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-wa-line bg-wa-surface text-wa-plum transition-colors hover:bg-wa-rose/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson disabled:opacity-40"
              >
                <Minus size={18} aria-hidden="true" />
              </button>
              <div className="min-w-0 flex-1">
                <label htmlFor="symptom-pain-range" className="sr-only">Pain score</label>
                <input
                  ref={painRangeRef}
                  id="symptom-pain-range"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={painLevel}
                  disabled={isSaving}
                  aria-valuetext={`${painLevel} out of 10, ${band.word.toLowerCase()}`.replace(/, no pain$/, '')}
                  onChange={(event) => updatePain(Number(event.target.value))}
                  className="h-11 w-full cursor-pointer accent-wa-crimson"
                />
                <div aria-hidden="true" className="-mt-1 flex justify-between px-0.5 text-xs font-semibold tabular-nums text-wa-plum-muted">
                  <span>0</span><span>5</span><span>10</span>
                </div>
              </div>
              <button
                type="button"
                data-ui-control
                aria-label="Raise pain score by 1"
                disabled={isSaving || painLevel >= 10}
                onClick={() => updatePain(painLevel + 1)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-wa-line bg-wa-surface text-wa-plum transition-colors hover:bg-wa-rose/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson disabled:opacity-40"
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>

            {painLevel >= 7 ? (
              <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-wa-crimson/25 bg-wa-surface p-3.5">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-wa-crimson" aria-hidden="true" />
                <div className="min-w-0 space-y-2.5">
                  <p className="text-[13px] leading-relaxed text-wa-plum">
                    Severe pain can be a crisis. Get urgent help if it isn&apos;t easing with your usual plan, or you also have fever, chest pain, trouble breathing or sudden weakness.
                  </p>
                  <Button variant="danger" size="sm" className="h-11" onClick={openEmergencyHelp}>
                    Get help now
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <fieldset className="space-y-3">
            <legend className={sectionTitle}>Where does it hurt?</legend>
            <p className={`-mt-2 ${sectionHint}`}>Optional. Tap every area that hurts.</p>
            <div className="flex flex-wrap gap-2">
              {BODY_REGIONS.map((region) => {
                const tag = `${PAIN_SITE_PREFIX}${region}`;
                return (
                  <ChoiceChip
                    key={region}
                    variant="rose"
                    selected={symptoms.includes(tag)}
                    disabled={isSaving}
                    onSelectedChange={() => toggle(tag, setSymptoms)}
                  >
                    {region}
                  </ChoiceChip>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={sectionTitle}>Other symptoms</legend>
            <p className={`-mt-2 ${sectionHint}`}>Optional. Select any you have today.</p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <ChoiceChip
                  key={symptom}
                  variant="rose"
                  selected={symptoms.includes(symptom)}
                  onSelectedChange={() => toggle(symptom, setSymptoms)}
                  disabled={isSaving}
                  className="h-auto whitespace-normal py-2.5 text-left"
                >
                  {symptom}
                </ChoiceChip>
              ))}
              {customSymptoms.map((symptom) => (
                <ChoiceChip
                  key={symptom}
                  variant="rose"
                  selected
                  aria-label={`Remove ${symptom}`}
                  onSelectedChange={() => toggle(symptom, setSymptoms)}
                  disabled={isSaving}
                >
                  {symptom}
                </ChoiceChip>
              ))}
            </div>
            <AddOwn
              id="custom-symptom"
              label="Something else?"
              placeholder="e.g. Headache"
              disabled={isSaving}
              onAdd={(value) => addUnique(value, setSymptoms)}
            />
          </fieldset>

          <details className="group rounded-[18px] border border-wa-line bg-wa-surface">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-[18px] px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson">
              <span>
                <span className="block text-[15px] font-bold text-wa-plum">Possible triggers</span>
                <span className="block text-xs text-wa-plum-muted">
                  {triggers.length > 0 ? `${triggers.length} selected` : 'Optional. Helps spot patterns over time.'}
                </span>
              </span>
              <ChevronDown className="shrink-0 text-wa-plum-muted transition-transform group-open:rotate-180" size={20} aria-hidden="true" />
            </summary>

            <div className="space-y-3 border-t border-wa-line-soft px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {TRIGGER_OPTIONS.map((trigger) => (
                  <ChoiceChip
                    key={trigger}
                    variant="rose"
                    selected={triggers.includes(trigger)}
                    onSelectedChange={() => toggle(trigger, setTriggers)}
                    disabled={isSaving}
                  >
                    {trigger}
                  </ChoiceChip>
                ))}
                {customTriggers.map((trigger) => (
                  <ChoiceChip
                    key={trigger}
                    variant="rose"
                    selected
                    aria-label={`Remove ${trigger}`}
                    onSelectedChange={() => toggle(trigger, setTriggers)}
                    disabled={isSaving}
                  >
                    {trigger}
                  </ChoiceChip>
                ))}
              </div>
              <AddOwn
                id="custom-trigger"
                label="Another trigger?"
                placeholder="e.g. Air conditioning"
                disabled={isSaving}
                onAdd={(value) => addUnique(value, setTriggers)}
              />
            </div>
          </details>

          {hydrationState === 'loading' && (
            <p role="status" className="text-xs text-wa-plum-muted">Getting ready…</p>
          )}
        </form>
      )}
    </Modal>
  );
};
