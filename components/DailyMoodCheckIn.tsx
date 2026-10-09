import React, { useState, useEffect } from 'react';
import { Activity, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebaseService';
import { Button, Card } from './ui';

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
  color: string;
  bgActive: string;
  borderActive: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { 
    emoji: '🌟', 
    label: 'Thriving', 
    description: 'High energy, zero pain, clear circulation', 
    score: 9.5, 
    color: 'text-amber-500', 
    bgActive: 'bg-amber-50 dark:bg-amber-950/40', 
    borderActive: 'border-amber-400 dark:border-amber-600' 
  },
  { 
    emoji: '😊', 
    label: 'Good & Steady', 
    description: 'Normal mobility, well hydrated, positive mindset', 
    score: 8.0, 
    color: 'text-emerald-500', 
    bgActive: 'bg-emerald-50 dark:bg-emerald-950/40', 
    borderActive: 'border-emerald-400 dark:border-emerald-600' 
  },
  { 
    emoji: '🕊️', 
    label: 'Calm & Restful', 
    description: 'Relaxed breathing, peaceful resting baseline', 
    score: 7.5, 
    color: 'text-blue-500', 
    bgActive: 'bg-blue-50 dark:bg-blue-950/40', 
    borderActive: 'border-blue-400 dark:border-blue-600' 
  },
  { 
    emoji: '😐', 
    label: 'Managing / OK', 
    description: 'Mild joint stiffness or fatigue, pacing myself', 
    score: 6.0, 
    color: 'text-yellow-600 dark:text-yellow-400', 
    bgActive: 'bg-yellow-50 dark:bg-yellow-950/40', 
    borderActive: 'border-yellow-400 dark:border-yellow-600' 
  },
  { 
    emoji: '🥱', 
    label: 'Exhausted', 
    description: 'Low oxygen reserves, high tiredness, resting', 
    score: 4.5, 
    color: 'text-indigo-500', 
    bgActive: 'bg-indigo-50 dark:bg-indigo-950/40', 
    borderActive: 'border-indigo-400 dark:border-indigo-600' 
  },
  { 
    emoji: '⚡', 
    label: 'Pain Flare', 
    description: 'Active sickle discomfort, increasing fluids & heat', 
    score: 3.0, 
    color: 'text-orange-500', 
    bgActive: 'bg-orange-50 dark:bg-orange-950/40', 
    borderActive: 'border-orange-400 dark:border-orange-600' 
  },
  { 
    emoji: '😰', 
    label: 'Anxious / Stressed', 
    description: 'Mental strain or crisis anticipation, need calm', 
    score: 2.5, 
    color: 'text-purple-500', 
    bgActive: 'bg-purple-50 dark:bg-purple-950/40', 
    borderActive: 'border-purple-400 dark:border-purple-600' 
  },
  { 
    emoji: '🚨', 
    label: 'Severe Crisis', 
    description: 'Intense VAS pain, initiating emergency protocol', 
    score: 1.0, 
    color: 'text-red-500', 
    bgActive: 'bg-red-50 dark:bg-red-950/40', 
    borderActive: 'border-red-500 dark:border-red-600 animate-pulse' 
  },
];

export const DailyMoodCheckIn: React.FC<DailyMoodCheckInProps> = ({ userId, onCheckInSaved, compact = false }) => {
  const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD
  const [selectedOption, setSelectedOption] = useState<MoodOption | null>(null);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedEntry, setSavedEntry] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveOutcome, setSaveOutcome] = useState<'recorded' | 'device-only' | 'partial' | null>(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const loadTodayMood = async () => {
      const existing = await firebaseService.getDailyMoodCheckIn(userId, todayStr);
      if (existing) {
        setSavedEntry(existing);
        const match = MOOD_OPTIONS.find(m => m.label === existing.emotion || m.emoji === existing.emoji);
        if (match) setSelectedOption(match);
        if (existing.note) setNote(existing.note);
      }
    };
    loadTodayMood();
  }, [userId, todayStr]);

  const handleSelectMood = async (option: MoodOption) => {
    setSelectedOption(option);
    if (!showNoteInput && !isEditing) {
      // Direct quick save with one tap
      await executeSave(option, note);
    }
  };

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
        timestamp: new Date().toISOString()
      });

      // Play soft harmonic confirmation tone
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
      } catch (e) {}

      const outcome = res.state === 'recorded' && res.historyState === 'recorded'
        ? 'recorded'
        : res.state === 'recorded'
          ? 'partial'
          : 'device-only';
      setSavedEntry({ ...res.data, formattedTime: timeString });
      setSaveOutcome(outcome);
      setIsEditing(false);

      // Trigger global event so Recharts trends and stats immediately update
      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
      if (onCheckInSaved) onCheckInSaved();
    } catch (e) {
      console.warn("Failed to save daily mood check-in:", e);
      setSaveError('Your check-in could not be saved. Your previous entry has not been changed.');
    } finally {
      setIsSaving(false);
    }
  };

  const formattedSavedTime = savedEntry?.timestamp 
    ? new Date(savedEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Earlier today';

  if (compact) {
    return (
      <Card data-semantic className="h-full border-line/80 shadow-surface" padding="lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-medical-50 text-action-accent">
              <Activity size={22} />
            </span>
            <div>
              <p className="text-caption font-bold uppercase tracking-[0.12em] text-action-accent">Your daily check-in</p>
              <h2 className="mt-0.5 text-heading-3">How are you feeling?</h2>
            </div>
          </div>
          {savedEntry && !isEditing && <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>}
        </div>
        {savedEntry && !isEditing ? (
          <div className="mt-5 rounded-card bg-status-success-soft p-4">
            <p className="flex items-center gap-2 text-body font-semibold text-foreground"><Check size={19} className="text-status-success-text" aria-hidden="true" />{savedEntry.emotion}</p>
            <p className="mt-1 text-small text-foreground-secondary">Recorded at {formattedSavedTime}</p>
            {savedEntry.note && <p className="mt-2 text-small text-foreground-secondary">{savedEntry.note}</p>}
            <p role="status" className="text-small text-foreground-secondary">
              {saveOutcome === 'recorded' && 'Saved to your account.'}
              {saveOutcome === 'partial' && 'Check-in saved to your account; the history copy is only on this device.'}
              {saveOutcome === 'device-only' && 'Saved on this device only.'}
              {saveOutcome === null && 'Previously recorded check-in.'}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-small text-foreground-secondary">Choose the option closest to how you feel now.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MOOD_OPTIONS.map(option => (
                <Button key={option.label} variant={selectedOption?.label === option.label ? 'primary' : 'secondary'} size="sm"
                  aria-pressed={selectedOption?.label === option.label} title={option.description}
                  disabled={isSaving} onClick={() => handleSelectMood(option)}>
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNoteInput(!showNoteInput)} aria-expanded={showNoteInput}>
                {showNoteInput ? 'Hide note' : '+ Add note'}
              </Button>
              {isEditing && <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>}
            </div>
            {showNoteInput && <label className="block text-small font-medium">Note
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} data-ui-field data-ui
                className="mt-2 w-full rounded-control border border-line-strong bg-surface p-3 text-body text-foreground" />
            </label>}
            {(showNoteInput || isEditing) && selectedOption && <Button loading={isSaving} onClick={() => executeSave(selectedOption, note)}>Save ({selectedOption.label})</Button>}
          </div>
        )}
        {saveError && <p role="alert" className="mt-3 text-small text-status-danger">{saveError}</p>}
      </Card>
    );
  }

  return (
    <Card data-semantic>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-heading-3">Daily check-in</h2>
        {savedEntry && !isEditing && <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>}
      </div>
      {savedEntry && !isEditing ? (
        <div className="mt-3 space-y-1">
          <p className="flex items-center gap-2 font-medium text-foreground"><Check size={18} aria-hidden="true" />{savedEntry.emotion}</p>
          <p className="text-small text-foreground-secondary">Logged today at {formattedSavedTime}</p>
          {savedEntry.note && <p className="text-small text-foreground-secondary">{savedEntry.note}</p>}
          <p role="status" className="text-small text-foreground-secondary">
            {saveOutcome === 'recorded' && 'Saved to your account.'}
            {saveOutcome === 'partial' && 'Check-in saved to your account; the history copy is only on this device.'}
            {saveOutcome === 'device-only' && 'Saved on this device only.'}
            {saveOutcome === null && 'Previously recorded check-in.'}
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-small text-foreground-secondary">How are you feeling today?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MOOD_OPTIONS.map(option => (
              <Button key={option.label} variant={selectedOption?.label === option.label ? 'primary' : 'secondary'} size="sm"
                aria-pressed={selectedOption?.label === option.label} title={option.description}
                disabled={isSaving} onClick={() => handleSelectMood(option)}>
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowNoteInput(!showNoteInput)} aria-expanded={showNoteInput}>
              {showNoteInput ? 'Hide note' : '+ Add note'}
            </Button>
            {isEditing && <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>}
          </div>
          {showNoteInput && <label className="block text-small font-medium">Note
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} data-ui-field data-ui
              className="mt-2 w-full rounded-control border border-line-strong bg-surface p-3 text-body text-foreground" />
          </label>}
          {(showNoteInput || isEditing) && selectedOption && <Button loading={isSaving} onClick={() => executeSave(selectedOption, note)}>Save ({selectedOption.label})</Button>}
        </div>
      )}
      {saveError && <p role="alert" className="mt-3 text-small text-status-danger">{saveError}</p>}
    </Card>
  );
};
