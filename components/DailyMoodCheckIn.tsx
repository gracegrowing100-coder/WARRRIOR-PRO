import React, { useState, useEffect } from 'react';
import { Smile, Sparkles, Check, Clock, Edit3, Heart, MessageSquare } from 'lucide-react';
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

      setSavedEntry({ ...res, formattedTime: timeString });
      setIsEditing(false);

      // Trigger global event so Recharts trends and stats immediately update
      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
      if (onCheckInSaved) onCheckInSaved();
    } catch (e) {
      console.warn("Failed to save daily mood check-in:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedSavedTime = savedEntry?.timestamp 
    ? new Date(savedEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Earlier today';

  if (compact) {
    return (
      <Card data-semantic>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-heading-3">Daily check-in</h2>
          {savedEntry && !isEditing && <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit Check-In</Button>}
        </div>
        {savedEntry && !isEditing ? (
          <div className="mt-3 space-y-1">
            <p className="flex items-center gap-2 font-semibold"><Check size={18} aria-hidden="true" />{savedEntry.emotion}</p>
            <p className="text-small text-foreground-secondary">Logged today at {formattedSavedTime}</p>
            {savedEntry.note && <p className="text-small text-foreground-secondary">{savedEntry.note}</p>}
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
                {showNoteInput ? 'Hide Reflection Note' : '+ Add Quick Reflection Note'}
              </Button>
              {isEditing && <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>}
            </div>
            {showNoteInput && <label className="block text-small font-medium">Reflection note
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} data-ui-field data-ui
                className="mt-2 w-full rounded-control border border-line-strong bg-surface p-3 text-body text-foreground" />
            </label>}
            {(showNoteInput || isEditing) && selectedOption && <Button loading={isSaving} onClick={() => executeSave(selectedOption, note)}>Save Check-In ({selectedOption.label})</Button>}
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800/85 relative overflow-hidden transition-all duration-300">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 dark:bg-purple-900/15 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 dark:bg-purple-950/40 p-2.5 rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/40 shadow-inner">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">
              Daily Wellness & Mood Check-In
            </h4>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              One-Tap Emotional & Cellular Status
            </p>
          </div>
        </div>

        {savedEntry && !isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-xl border border-purple-200/50 dark:border-purple-800/40 transition-all cursor-pointer"
          >
            <Edit3 size={12} /> Edit Check-In
          </button>
        ) : (
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 font-black px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
            {todayStr}
          </span>
        )}
      </div>

      {/* Saved State Banner */}
      {savedEntry && !isEditing ? (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl filter drop-shadow-sm">{savedEntry.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-gray-900 dark:text-white">
                  {savedEntry.emotion}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-200/70 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                  {savedEntry.score}/10 Wellness
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300 font-medium mt-0.5 flex items-center gap-1.5">
                <Clock size={11} className="text-gray-400" /> Logged today at {formattedSavedTime}
                {savedEntry.note && <span className="italic text-gray-500">— "{savedEntry.note}"</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl">
            <Check size={14} /> Synced
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-gray-600 dark:text-slate-400 font-medium">
            How is your body and spirit feeling right now? Tap an emoji to log your daily baseline:
          </p>

          {/* Emoji Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {MOOD_OPTIONS.map((opt) => {
              const isSelected = selectedOption?.label === opt.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => handleSelectMood(opt)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected 
                      ? `${opt.bgActive} ${opt.borderActive} ring-2 ring-purple-400/40 shadow-sm scale-[1.02]` 
                      : 'bg-gray-50/70 dark:bg-slate-800/60 border-gray-150 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className={`text-[10px] font-black uppercase ${opt.color}`}>
                      {opt.score}/10
                    </span>
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                      {opt.label}
                    </h5>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Toggle optional note input */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <MessageSquare size={13} /> {showNoteInput ? 'Hide Reflection Note' : '+ Add Quick Reflection Note'}
            </button>

            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Optional Note Box */}
          <AnimatePresence>
            {showNoteInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="E.g. Drank 2L water, slight ache in knees after walking in cold breeze..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white placeholder:text-gray-400"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button if Note is open or User is in Editing Mode */}
          {(showNoteInput || isEditing) && selectedOption && (
            <button
              onClick={() => executeSave(selectedOption, note)}
              disabled={isSaving}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check size={14} /> Save Check-In ({selectedOption.emoji} {selectedOption.label})
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
