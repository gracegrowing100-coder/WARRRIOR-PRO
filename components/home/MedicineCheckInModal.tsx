import React, { useMemo, useRef, useState } from 'react';
import { Check, Clock, Pill, Plus } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Button, Modal } from '../ui';

export interface MedicationSummary {
  id?: string;
  name?: string;
  dosage?: string;
  time?: string;
  lastTakenDate?: string;
}

interface MedicineCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  medications: MedicationSummary[];
  onMedicationsChange: (next: MedicationSummary[]) => void;
  onReviewMeds?: () => void;
}

// Names only: the dose always comes from the patient's own prescription.
const COMMON_SCD_MEDICINES = ['Hydroxyurea', 'Folic Acid', 'Proguanil', 'Vitamin B Complex'];

const getTodayKey = () => new Date().toLocaleDateString('sv');
const normalise = (value?: string) => (value ?? '').trim().toLowerCase();
const duplicateKey = (med: MedicationSummary) => `${normalise(med.name)}|${normalise(med.dosage)}|${med.time ?? ''}`;
const byTime = (a: MedicationSummary, b: MedicationSummary) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99');

const inputClass =
  'min-h-12 w-full rounded-2xl border border-wa-line bg-wa-surface px-3.5 text-base text-wa-plum placeholder:text-wa-plum-muted/70 focus:border-wa-plum focus:outline-none focus:ring-1 focus:ring-wa-plum';

export const MedicineCheckInModal: React.FC<MedicineCheckInModalProps> = ({
  open,
  onOpenChange,
  userId,
  medications,
  onMedicationsChange,
  onReviewMeds,
}) => {
  const today = getTodayKey();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('08:00');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const dosageRef = useRef<HTMLInputElement>(null);

  const pending = useMemo(() => medications.filter((m) => m.lastTakenDate !== today).sort(byTime), [medications, today]);
  const taken = useMemo(() => medications.filter((m) => m.lastTakenDate === today).sort(byTime), [medications, today]);
  const listedNames = useMemo(() => new Set(medications.map((m) => normalise(m.name))), [medications]);

  const extraCopies = useMemo(() => {
    const seen = new Map<string, MedicationSummary>();
    const extras: MedicationSummary[] = [];
    // Keep a copy already marked taken today when one exists.
    [...medications]
      .sort((a, b) => Number(b.lastTakenDate === today) - Number(a.lastTakenDate === today))
      .forEach((med) => {
        const key = duplicateKey(med);
        if (seen.has(key)) extras.push(med);
        else seen.set(key, med);
      });
    return extras.filter((m) => m.id);
  }, [medications, today]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setMessage(null);
      setConfirmCleanup(false);
    }
    onOpenChange(next);
  };

  const toggleTaken = async (med: MedicationSummary) => {
    if (!med.id) return;
    const wasTaken = med.lastTakenDate === today;
    const nextDate = wasTaken ? '' : today;
    setBusyId(med.id);
    setMessage(null);
    try {
      await firebaseService.updateMedication(userId, med.id, { lastTakenDate: nextDate });
      onMedicationsChange(medications.map((m) => (m.id === med.id ? { ...m, lastTakenDate: nextDate } : m)));
      if (!wasTaken) {
        try { await firebaseService.updateStreak(userId); } catch { /* Streak sync is optional. */ }
      }
      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
    } catch (err) {
      console.error('Could not update medication status:', err);
      setMessage({ tone: 'error', text: `Couldn't update ${med.name || 'this medicine'}. Check your connection and try again.` });
    } finally {
      setBusyId(null);
    }
  };

  const choosePreset = (presetName: string) => {
    setName(presetName);
    setMessage(null);
    window.setTimeout(() => dosageRef.current?.focus(), 0);
  };

  const addMedicine = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDosage = dosage.trim();
    if (!trimmedName || !trimmedDosage) return;
    const candidate = { name: trimmedName, dosage: trimmedDosage, time };
    if (medications.some((m) => duplicateKey(m) === duplicateKey(candidate))) {
      setMessage({ tone: 'error', text: `${trimmedName} ${trimmedDosage} at ${time} is already on your list.` });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await firebaseService.addMedication(userId, { ...candidate, frequency: 'Once Daily', lastTakenDate: '' });
      onMedicationsChange([...medications, result.data as MedicationSummary]);
      setName('');
      setDosage('');
      setTime('08:00');
      setMessage({ tone: 'ok', text: `${trimmedName} added for ${time} each day.` });
      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
    } catch (err) {
      console.error('Could not add medication:', err);
      setMessage({ tone: 'error', text: `${trimmedName} wasn't saved. Check your connection and try again.` });
    } finally {
      setSaving(false);
    }
  };

  const removeExtraCopies = async () => {
    setCleaning(true);
    const removed = new Set<string>();
    for (const med of extraCopies) {
      try {
        await firebaseService.deleteMedication(userId, med.id as string);
        removed.add(med.id as string);
      } catch (err) {
        console.error('Could not remove duplicate medication:', err);
      }
    }
    onMedicationsChange(medications.filter((m) => !m.id || !removed.has(m.id)));
    setCleaning(false);
    setConfirmCleanup(false);
    setMessage(removed.size === extraCopies.length
      ? { tone: 'ok', text: `Removed ${removed.size} extra ${removed.size === 1 ? 'copy' : 'copies'}.` }
      : { tone: 'error', text: `Removed ${removed.size} of ${extraCopies.length}. Try again for the rest.` });
  };

  const total = medications.length;
  const takenCount = taken.length;

  const renderRow = (med: MedicationSummary, index: number) => {
    const isTaken = med.lastTakenDate === today;
    const isBusy = busyId === med.id;
    return (
      <li key={med.id || `${med.name}-${index}`}>
        <button
          type="button"
          data-ui-control
          disabled={isBusy || !med.id}
          aria-pressed={isTaken}
          aria-label={`${med.name || 'Medicine'} ${med.dosage ?? ''}${med.time ? ` at ${med.time}` : ''}: ${isTaken ? 'taken, tap to undo' : 'tap to mark taken'}`}
          onClick={() => void toggleTaken(med)}
          className={`flex w-full items-center gap-3 rounded-[18px] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson disabled:opacity-60 ${
            isTaken ? 'border-transparent bg-wa-ground/70 dark:bg-white/5' : 'border-wa-line bg-wa-surface hover:border-wa-crimson/50'
          }`}
        >
          <span
            aria-hidden="true"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              isTaken ? 'border-status-success-text bg-status-success-text text-white' : 'border-wa-line text-transparent'
            }`}
          >
            <Check size={20} strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-[15px] font-bold ${isTaken ? 'text-wa-plum-muted' : 'text-wa-plum'}`}>
              {med.name || 'Medicine'}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-wa-plum-muted">
              {med.dosage ? <span>{med.dosage}</span> : null}
              {med.dosage && med.time ? <span aria-hidden="true">·</span> : null}
              {med.time ? (
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} aria-hidden="true" />
                  {med.time}
                </span>
              ) : null}
            </span>
          </span>
          <span className={`shrink-0 text-[13px] font-semibold ${isTaken ? 'text-status-success-text' : 'text-wa-crimson'}`}>
            {isBusy ? 'Saving…' : isTaken ? 'Taken' : 'Mark taken'}
          </span>
        </button>
      </li>
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Today's medicines"
      description={total > 0 ? 'Tap a medicine when you take it. Tap again to undo.' : 'Add the medicines your clinic prescribed.'}
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {onReviewMeds ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-11"
              onClick={() => {
                handleOpenChange(false);
                onReviewMeds();
              }}
            >
              Full schedule
            </Button>
          ) : <span />}
          <Button variant="primary" size="sm" className="h-11 px-6" onClick={() => handleOpenChange(false)}>
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {total > 0 ? (
          <div className="space-y-2" aria-live="polite">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-display text-base font-extrabold text-wa-plum">
                {takenCount === total ? 'All done for today' : `${takenCount} of ${total} taken today`}
              </p>
              {takenCount < total ? (
                <span className="text-[13px] text-wa-plum-muted">{total - takenCount} to go</span>
              ) : null}
            </div>
            <div className="flex gap-[5px]" aria-hidden="true">
              {Array.from({ length: Math.min(total, 12) }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i < Math.round((takenCount / total) * Math.min(total, 12)) ? 'bg-status-success-text' : 'bg-wa-line'}`}
                />
              ))}
            </div>
          </div>
        ) : null}

        {extraCopies.length > 0 ? (
          <div className="rounded-[18px] border border-wa-line bg-wa-ground/70 p-3.5 text-[13px] text-wa-plum dark:bg-white/5">
            <p className="font-semibold">
              {extraCopies.length === 1 ? '1 extra copy' : `${extraCopies.length} extra copies`} of the same medicine, dose and time {extraCopies.length === 1 ? 'is' : 'are'} on your list.
            </p>
            {confirmCleanup ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-wa-plum-muted">Keep one of each and remove {extraCopies.length}?</span>
                <Button size="sm" variant="danger" className="h-11" loading={cleaning} loadingLabel="Removing…" onClick={() => void removeExtraCopies()}>
                  Remove {extraCopies.length}
                </Button>
                <Button size="sm" variant="ghost" className="h-11" disabled={cleaning} onClick={() => setConfirmCleanup(false)}>
                  Keep all
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" className="mt-2.5 h-11" onClick={() => setConfirmCleanup(true)}>
                Remove extra copies
              </Button>
            )}
          </div>
        ) : null}

        {total > 0 ? (
          <div className="space-y-4">
            {pending.length > 0 ? (
              <section aria-label="To take today" className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-wa-plum-muted">To take</h3>
                <ul className="space-y-2">{pending.map(renderRow)}</ul>
              </section>
            ) : null}
            {taken.length > 0 ? (
              <section aria-label="Taken today" className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-wa-plum-muted">Taken today</h3>
                <ul className="space-y-2">{taken.map(renderRow)}</ul>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[18px] bg-wa-ground/70 p-4 dark:bg-white/5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wa-rose text-wa-crimson">
              <Pill size={20} aria-hidden="true" />
            </span>
            <p className="text-[13px] text-wa-plum-muted">
              No medicines yet. Add each one once with its time, then tick it off here every day.
            </p>
          </div>
        )}

        <form onSubmit={addMedicine} className="space-y-3 border-t border-wa-line-soft pt-4" aria-label="Add a medicine">
          <h3 className="font-display text-[15px] font-bold text-wa-plum">Add a medicine</h3>
          <div className="flex flex-wrap gap-2">
            {COMMON_SCD_MEDICINES.map((preset) => {
              const added = listedNames.has(normalise(preset));
              const selected = normalise(name) === normalise(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={added}
                  aria-pressed={selected}
                  onClick={() => choosePreset(preset)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
                    added
                      ? 'cursor-default border-transparent bg-wa-ground text-wa-plum-muted dark:bg-white/5'
                      : selected
                        ? 'border-wa-plum bg-wa-plum text-wa-surface'
                        : 'border-wa-line bg-wa-surface text-wa-plum hover:border-wa-crimson'
                  }`}
                >
                  {added ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                  {preset}
                  {added ? <span className="sr-only">(already on your list)</span> : null}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="med-name" className="block text-[13px] font-bold text-wa-plum">Medicine</label>
            <input id="med-name" type="text" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Folic Acid" className={inputClass} />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <label htmlFor="med-dose" className="block text-[13px] font-bold text-wa-plum">Dose</label>
              <input id="med-dose" ref={dosageRef} type="text" autoComplete="off" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 5mg" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="med-time" className="block text-[13px] font-bold text-wa-plum">Time</label>
              <input id="med-time" type="time" value={time} onChange={(e) => setTime(e.target.value || '08:00')} className={`${inputClass} w-[120px]`} />
            </div>
          </div>
          <p className="text-xs text-wa-plum-muted">Use the dose on your prescription or clinic card.</p>

          {message ? (
            <p role={message.tone === 'error' ? 'alert' : 'status'} className={`text-[13px] font-semibold ${message.tone === 'error' ? 'text-status-danger-text' : 'text-status-success-text'}`}>
              {message.text}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            className="h-12 w-full"
            disabled={saving || !name.trim() || !dosage.trim()}
            loading={saving}
            loadingLabel="Saving…"
          >
            Add medicine
          </Button>
        </form>
      </div>
    </Modal>
  );
};
