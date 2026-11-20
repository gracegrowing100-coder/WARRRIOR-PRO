import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

interface DailyMoodCheckInProps {
  userId: string;
  onCheckInSaved?: () => void;
  compact?: boolean;
}

interface MoodOption {
  emoji: string;
  label: string;
  description: string;
  score: number;
}

const PRIMARY_OPTIONS: MoodOption[] = [
  { emoji: '🌟', label: 'Thriving', description: 'Lots of energy, no pain', score: 9.5 },
  { emoji: '😊', label: 'Good & Steady', description: 'Feeling like my usual self', score: 8.0 },
  { emoji: '🥱', label: 'Exhausted', description: 'Very tired, low energy', score: 4.5 },
  { emoji: '⚡', label: 'Pain flare', description: 'Pain is building up', score: 3.0 },
];

const MORE_OPTIONS: MoodOption[] = [
  { emoji: '🕊️', label: 'Calm & Restful', description: 'Relaxed, resting well', score: 7.5 },
  { emoji: '😐', label: 'Managing / OK', description: 'Some stiffness or tiredness', score: 6.0 },
  { emoji: '😰', label: 'Anxious / Stressed', description: 'Worried or under strain', score: 2.5 },
  { emoji: '🚨', label: 'Severe Crisis', description: 'Severe pain, opens Emergency', score: 1.0 },
];

const ALL_OPTIONS = [...PRIMARY_OPTIONS, ...MORE_OPTIONS];

const smallButton = 'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson disabled:opacity-60';

export const DailyMoodCheckIn: React.FC<DailyMoodCheckInProps> = ({ userId, onCheckInSaved }) => {
  const todayStr = new Date().toLocaleDateString('sv');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedEntry, setSavedEntry] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveOutcome, setSaveOutcome] = useState<'recorded' | 'device-only' | 'partial' | null>(null);
  const [saveError, setSaveError] = useState('');

  const normalizeLabel = (l: string) => l.toLowerCase().replace('&', '&amp;');

  useEffect(() => {
    const loadTodayMood = async () => {
      const existing = await firebaseService.getDailyMoodCheckIn(userId, todayStr);
      if (existing) {
        setSavedEntry(existing);
        const match = ALL_OPTIONS.find(m => normalizeLabel(m.label) === normalizeLabel(existing.emotion || ''));
        if (match) setSelectedLabel(match.label);
        if (existing.note) setNote(existing.note);
      }
    };
    loadTodayMood();
  }, [userId, todayStr]);

  const executeSave = async (option: MoodOption, userNote: string) => {
    setIsSaving(true);
    setSaveError('');
    try {
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const res = await firebaseService.saveDailyMoodCheckIn(userId, todayStr, {
        emoji: option.emoji,
        emotion: option.label,
        score: option.score,
        note: userNote.trim(),
        timestamp: new Date().toISOString(),
      });

      const outcome = res.state === 'recorded' && res.historyState === 'recorded'
        ? 'recorded'
        : res.state === 'recorded'
          ? 'partial'
          : 'device-only';
      setSavedEntry({ ...res.data, formattedTime: timeString });
      setSaveOutcome(outcome);
      setIsEditing(false);

      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
      if (onCheckInSaved) onCheckInSaved();

      // Choosing "Severe crisis" opens Emergency screen in addition to saving
      if (option.label.toLowerCase().includes('crisis')) {
        const fab = document.getElementById('emergency-fab');
        if (fab) fab.click();
      }
    } catch (e) {
      console.warn("Failed to save daily mood check-in:", e);
      setSaveError('Your check-in could not be saved. Your previous entry has not been changed.');
    } finally {
      setIsSaving(false);
    }
  };

  // Main moods save on one tap; with the note area open, the patient saves explicitly.
  const handleSelectMood = async (option: MoodOption) => {
    setSelectedLabel(option.label);
    if (!showMore && !isEditing) {
      await executeSave(option, note);
    }
  };

  const allVisibleOptions = (showMore || isEditing) ? ALL_OPTIONS : PRIMARY_OPTIONS;
  const savedTime = savedEntry?.formattedTime
    || (savedEntry?.timestamp && !Number.isNaN(new Date(savedEntry.timestamp).getTime())
      ? new Date(savedEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null);
  const savedStatus = saveOutcome === 'device-only'
    ? 'Saved on this device only.'
    : saveOutcome
      ? 'Saved to your account.'
      : 'Recorded today.';
  const savedOption = savedEntry
    ? ALL_OPTIONS.find((m) => normalizeLabel(m.label) === normalizeLabel(savedEntry.emotion || ''))
    : null;

  return (
    <div
      data-semantic="daily-check-in-card"
      className="relative flex flex-col gap-4 rounded-[28px] border border-wa-line bg-wa-surface p-4 text-wa-plum shadow-[0_12px_30px_rgb(59_15_44/0.08)] sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-bold text-wa-plum">How are you feeling?</h2>
          <p className="text-xs text-wa-plum-muted">
            {savedEntry && !isEditing ? 'You can change this any time today.' : 'Tap the one closest to today.'}
          </p>
        </div>
        {savedEntry && !isEditing && (
          <button
            type="button"
            data-ui-control
            onClick={() => setIsEditing(true)}
            className={`${smallButton} shrink-0 border border-wa-line bg-wa-surface text-wa-plum hover:bg-wa-rose/30`}
          >
            Edit
          </button>
        )}
      </div>

      {savedEntry && !isEditing ? (
        <div className="flex items-start gap-3 rounded-[18px] bg-wa-ground/70 p-3.5 dark:bg-white/5">
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wa-surface text-2xl">
            {savedEntry.emoji || savedOption?.emoji || '🙂'}
          </span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="flex items-center gap-1.5 text-[15px] font-bold text-wa-plum">
              {savedEntry.emotion}
              <Check size={15} strokeWidth={3} className="text-status-success-text" aria-hidden="true" />
            </p>
            {savedEntry.note && <p className="text-[13px] text-wa-plum">{savedEntry.note}</p>}
            <p className="text-xs text-wa-plum-muted">
              {savedStatus}{savedTime ? ` · ${savedTime}` : ''}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            {allVisibleOptions.map((option, index) => {
              const isSelected = selectedLabel === option.label ||
                normalizeLabel(selectedLabel || '') === normalizeLabel(option.label);
              const isCrisis = option.label === 'Severe Crisis';
              const descriptionId = `mood-desc-${index}`;
              return (
                <button
                  key={option.label}
                  type="button"
                  data-ui-control
                  aria-pressed={isSelected}
                  aria-label={option.label}
                  aria-describedby={descriptionId}
                  disabled={isSaving}
                  onClick={() => handleSelectMood(option)}
                  className={`flex min-h-[68px] items-center gap-2.5 rounded-[18px] border p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson disabled:opacity-60 ${
                    isSelected
                      ? 'border-wa-hero bg-wa-hero text-white'
                      : isCrisis
                        ? 'border-wa-crimson/30 bg-wa-rose/40 text-wa-plum hover:border-wa-crimson'
                        : 'border-wa-line bg-wa-surface text-wa-plum hover:border-wa-crimson/40 hover:bg-wa-rose/20'
                  }`}
                >
                  <span aria-hidden="true" className="text-2xl leading-none">{option.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">{option.label}</span>
                    <span id={descriptionId} className={`mt-0.5 block text-xs leading-snug ${isSelected ? 'text-white/80' : 'text-wa-plum-muted'}`}>
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            {!isEditing && (
              <button
                type="button"
                data-ui-control
                onClick={() => setShowMore(!showMore)}
                className="inline-flex min-h-11 items-center self-start rounded-full text-sm font-semibold text-wa-crimson hover:text-wa-crimson-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
              >
                {showMore ? 'Fewer feelings' : 'More feelings · add a note'}
              </button>
            )}

            {(showMore || isEditing) && (
              <div className="flex flex-col gap-2 border-t border-wa-line-soft pt-3">
                <label htmlFor="mood-note" className="text-[13px] font-bold text-wa-plum">
                  Private note <span className="font-normal text-wa-plum-muted">(optional)</span>
                </label>
                <textarea
                  id="mood-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Resting, drank extra water"
                  className="w-full rounded-2xl border border-wa-line bg-wa-surface p-3 text-base text-wa-plum placeholder:text-wa-plum-muted/70 focus:border-wa-crimson focus:outline-none focus:ring-2 focus:ring-wa-crimson/30"
                />
                <div className="mt-1 flex items-center justify-end gap-2">
                  {isEditing && (
                    <button
                      type="button"
                      data-ui-control
                      onClick={() => setIsEditing(false)}
                      className={`${smallButton} border border-wa-line text-wa-plum hover:bg-wa-ground`}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    data-ui-control
                    disabled={isSaving || !selectedLabel}
                    onClick={() => {
                      const matched = ALL_OPTIONS.find(m => m.label === selectedLabel) || PRIMARY_OPTIONS[0];
                      executeSave(matched, note);
                    }}
                    className={`${smallButton} bg-wa-crimson px-5 text-white shadow-sm hover:bg-wa-crimson-press`}
                  >
                    {isSaving ? 'Saving…' : 'Save check-in'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {saveError && <p role="alert" className="text-[13px] font-semibold text-status-danger-text">{saveError}</p>}
    </div>
  );
};
