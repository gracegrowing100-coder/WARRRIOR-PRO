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
  { emoji: '🌟', label: 'Thriving', description: 'High energy, zero pain', score: 9.5 },
  { emoji: '😊', label: 'Good & Steady', description: 'Normal mobility, well hydrated', score: 8.0 },
  { emoji: '🥱', label: 'Exhausted', description: 'Low oxygen reserves, high tiredness', score: 4.5 },
  { emoji: '⚡', label: 'Pain flare', description: 'Active discomfort, increasing fluids & warmth', score: 3.0 },
];

const MORE_OPTIONS: MoodOption[] = [
  { emoji: '🕊️', label: 'Calm & Restful', description: 'Relaxed baseline', score: 7.5 },
  { emoji: '😐', label: 'Managing / OK', description: 'Mild joint stiffness or fatigue', score: 6.0 },
  { emoji: '😰', label: 'Anxious / Stressed', description: 'Mental strain or crisis anticipation', score: 2.5 },
  { emoji: '🚨', label: 'Severe Crisis', description: 'Intense pain, initiating emergency protocol', score: 1.0 },
];

export const DailyMoodCheckIn: React.FC<DailyMoodCheckInProps> = ({ userId, onCheckInSaved, compact = false }) => {
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
        const all = [...PRIMARY_OPTIONS, ...MORE_OPTIONS];
        const match = all.find(m => normalizeLabel(m.label) === normalizeLabel(existing.emotion || ''));
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

  const handleSelectMood = async (option: MoodOption) => {
    setSelectedLabel(option.label);
    if (!showMore && !isEditing) {
      await executeSave(option, note);
    }
  };

  const allVisibleOptions = (showMore || isEditing) ? [...PRIMARY_OPTIONS, ...MORE_OPTIONS] : PRIMARY_OPTIONS;

  return (
    <div
      data-semantic="daily-check-in-card"
      className="relative flex flex-col gap-3 rounded-[28px] bg-wa-surface p-[18px] text-wa-plum shadow-lg shadow-wa-hero/10"
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-[17px] font-bold text-wa-plum">How are you feeling?</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-wa-muted">Daily check-in</span>
          {savedEntry && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-full bg-wa-ground px-2.5 py-0.5 text-xs font-semibold text-wa-plum hover:bg-wa-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {savedEntry && !isEditing ? (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-wa-ground p-3.5 text-sm">
          <div className="flex items-center gap-2 font-bold text-wa-plum">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-wa-success text-white">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>{savedEntry.emotion}</span>
          </div>
          {savedEntry.note && <p className="text-wa-muted">{savedEntry.note}</p>}
          <span className="text-xs text-wa-muted">
            {saveOutcome === 'recorded' && 'Saved to your account.'}
            {saveOutcome === 'device-only' && 'Saved on this device only.'}
            {saveOutcome === null && 'Recorded today.'}
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {allVisibleOptions.map((option) => {
              const isSelected = selectedLabel === option.label ||
                normalizeLabel(selectedLabel || '') === normalizeLabel(option.label);
              return (
                <button
                  key={option.label}
                  type="button"
                  data-ui-control
                  aria-pressed={isSelected}
                  disabled={isSaving}
                  onClick={() => handleSelectMood(option)}
                  className={`flex h-[46px] items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
                    isSelected
                      ? 'bg-wa-hero text-white'
                      : 'border border-wa-line bg-wa-surface text-wa-plum hover:border-wa-muted/40'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check size={14} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                className="self-start text-sm font-semibold text-wa-crimson hover:text-wa-crimson-press focus-visible:outline-none"
              >
                {showMore ? 'Fewer feelings' : 'More feelings · add a note'}
              </button>
            )}

            {(showMore || isEditing) && (
              <div className="flex flex-col gap-2 pt-1">
                <label className="text-xs font-semibold text-wa-muted">
                  Add a private note (optional)
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Resting, drank extra water..."
                    className="mt-1 w-full rounded-2xl border border-wa-line bg-wa-ground p-3 text-sm text-wa-plum placeholder:text-wa-muted/60 focus:border-wa-crimson focus:outline-none"
                  />
                </label>
                {selectedLabel && (
                  <div className="flex items-center gap-2 self-end">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="rounded-full border border-wa-line px-3 py-1.5 text-xs font-semibold text-wa-muted hover:bg-wa-ground"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => {
                        const all = [...PRIMARY_OPTIONS, ...MORE_OPTIONS];
                        const matched = all.find(m => m.label === selectedLabel) || PRIMARY_OPTIONS[0];
                        executeSave(matched, note);
                      }}
                      className="rounded-full bg-wa-crimson px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-wa-crimson-press"
                    >
                      Save ({selectedLabel})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {saveError && <p role="alert" className="text-xs text-wa-crimson">{saveError}</p>}
    </div>
  );
};
