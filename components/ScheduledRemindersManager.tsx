import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, BellRing, Clock, Plus, Trash2, 
  Droplets, Pill, Activity, Send, Volume2, X, CheckCircle2
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

export interface ReminderItem {
  id: string;
  title: string;
  type: 'medication' | 'hydration' | 'checkin' | 'custom';
  time: string; // "HH:MM"
  enabled: boolean;
  details: string;
  lastNotifiedDate?: string;
}

interface ScheduledRemindersManagerProps {
  userId: string;
}

const DEFAULT_SCHEDULED_REMINDERS: ReminderItem[] = [
  {
    id: 'rem-morning-med',
    title: 'Morning Medication',
    type: 'medication',
    time: '08:00',
    enabled: true,
    details: 'Take prescribed Hydroxyurea / morning dosage with a full glass of water.',
  },
  {
    id: 'rem-midday-hydration',
    title: 'Midday Hydration Target',
    type: 'hydration',
    time: '12:00',
    enabled: true,
    details: 'Drink at least 2 sachets (1L) of clean water to maintain steady blood circulation.',
  },
  {
    id: 'rem-afternoon-checkin',
    title: 'Afternoon Check-in',
    type: 'checkin',
    time: '16:00',
    enabled: true,
    details: 'Log any pain, energy shifts, or temperature changes in your daily health log.',
  },
  {
    id: 'rem-evening-rest',
    title: 'Evening Warmth & Rest',
    type: 'custom',
    time: '21:00',
    enabled: true,
    details: 'Drink a glass of water before bed, keep room comfortably warm, and avoid drafts.',
  },
];

export const ScheduledRemindersManager: React.FC<ScheduledRemindersManagerProps> = ({ userId }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{ title: string; details: string; type: string } | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'medication' | 'hydration' | 'checkin' | 'custom'>('medication');
  const [newTime, setNewTime] = useState('09:00');
  const [newDetails, setNewDetails] = useState('');

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Soft reminder chime audio synthesizer (works offline, no external assets needed)
  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') void ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio autoplay restrictions gracefully handled
    }
  }, []);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const list = await firebaseService.getScheduledReminders(userId);
      if (Array.isArray(list) && list.length > 0) {
        setReminders(list);
      } else {
        // Pre-populate sensible clinical defaults on first use
        setReminders(DEFAULT_SCHEDULED_REMINDERS);
        await firebaseService.saveScheduledReminders(userId, DEFAULT_SCHEDULED_REMINDERS);
      }
    } catch (e) {
      console.warn('Failed to load reminders:', e);
      setReminders(DEFAULT_SCHEDULED_REMINDERS);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Check permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    void loadReminders();
  }, [loadReminders]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        playChime();
        new Notification('🔔 Warrior Health Reminders', {
          body: 'Scheduled reminders for medications, hydration, and check-ins are active.',
        });
      }
    } catch (e) {
      console.error('Error requesting notification permission:', e);
    }
  };

  const triggerTestAlert = (reminder?: ReminderItem) => {
    playChime();
    const item = reminder || reminders[0] || DEFAULT_SCHEDULED_REMINDERS[0];
    setActiveAlert({
      title: item.title,
      details: item.details,
      type: item.type,
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🔔 Reminder: ${item.title}`, {
        body: item.details,
      });
    }

    setTimeout(() => {
      setActiveAlert(null);
    }, 6000);
  };

  // Scheduler checking every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHHMM = now.toTimeString().slice(0, 5); // "HH:MM"
      const todayDateStr = now.toLocaleDateString('sv');

      reminders.forEach((r) => {
        if (r.enabled && r.time === currentHHMM && r.lastNotifiedDate !== todayDateStr) {
          triggerTestAlert(r);

          const updated = reminders.map((item) => 
            item.id === r.id ? { ...item, lastNotifiedDate: todayDateStr } : item
          );
          setReminders(updated);
          void firebaseService.saveScheduledReminders(userId, updated);
        }
      });
    }, 30000);

    return () => clearInterval(timer);
  }, [reminders, userId]);

  const toggleReminder = async (id: string) => {
    const updated = reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    setReminders(updated);
    await firebaseService.saveScheduledReminders(userId, updated);
  };

  const deleteReminder = async (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    await firebaseService.saveScheduledReminders(userId, updated);
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRem: ReminderItem = {
      id: `rem-${Date.now().toString(36)}`,
      title: newTitle.trim(),
      type: newType,
      time: newTime,
      enabled: true,
      details: newDetails.trim() || getDefaultDetails(newType),
    };

    const updated = [...reminders, newRem];
    setReminders(updated);
    await firebaseService.saveScheduledReminders(userId, updated);

    setShowAddModal(false);
    setNewTitle('');
    setNewDetails('');
  };

  const getDefaultDetails = (type: string) => {
    if (type === 'medication') return 'Take prescribed dosage with full glass of water.';
    if (type === 'hydration') return 'Drink 2 sachets (1L) of clean water to protect vascular flow.';
    if (type === 'checkin') return 'Log daily pain and energy in Warrior AI.';
    return 'Scheduled health routine check.';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication': return <Pill size={16} className="text-emerald-600 dark:text-emerald-400" />;
      case 'hydration': return <Droplets size={16} className="text-wa-water" />;
      case 'checkin': return <Activity size={16} className="text-wa-crimson" />;
      default: return <Clock size={16} className="text-wa-plum-muted dark:text-wa-on-plum-muted" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-wa-line-soft bg-wa-surface p-5 text-wa-plum shadow-none dark:border-white/10 dark:bg-white/5 dark:text-white sm:p-6">
      {/* Active in-app alert banner */}
      {activeAlert && (
        <div 
          role="alert" 
          className="rounded-[20px] bg-wa-crimson p-4 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
              <BellRing size={18} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Scheduled Alert Triggered</p>
              <h5 className="font-display text-base font-bold text-white mt-0.5">{activeAlert.title}</h5>
              <p className="text-xs text-white/90 leading-relaxed mt-1">{activeAlert.details}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            aria-label="Dismiss alert"
            className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-wa-rose text-wa-crimson">
            <Bell size={20} />
          </span>
          <div>
            <h4 className="font-display text-[16px] sm:text-[18px] font-bold text-wa-plum dark:text-white leading-tight">
              Scheduled Reminders
            </h4>
            <p className="text-[12px] text-wa-plum-muted dark:text-wa-on-plum-muted mt-0.5">
              Daily medication, hydration, and check-in times
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            data-ui-control
            onClick={() => triggerTestAlert()}
            title="Test alert chime and popup"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-wa-ground dark:bg-white/10 px-3.5 text-xs font-bold text-wa-plum dark:text-white hover:bg-wa-line-soft dark:hover:bg-white/20 transition-all"
          >
            <Volume2 size={14} className="text-wa-crimson" />
            <span>Test alert</span>
          </button>

          <button
            type="button"
            data-ui-control
            onClick={() => setShowAddModal(true)}
            aria-label="Add reminder"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-wa-crimson px-3.5 text-xs font-bold text-white hover:bg-wa-crimson-press transition-all"
          >
            <Plus size={15} />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Status note */}
      <div className="flex items-center justify-between rounded-[16px] bg-wa-ground/60 dark:bg-white/5 px-3.5 py-2 text-xs text-wa-plum-muted dark:text-wa-on-plum-muted border border-wa-line-soft/60 dark:border-white/5">
        <span>In-app audio & banner alerts are active.</span>
        {permission !== 'granted' && 'Notification' in window && (
          <button
            type="button"
            onClick={requestPermission}
            className="font-bold text-wa-crimson hover:underline ml-2"
          >
            Enable browser popups
          </button>
        )}
      </div>

      {/* Reminder List */}
      {loading ? (
        <div className="py-6 flex justify-center">
          <div className="w-6 h-6 border-2 border-wa-crimson border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`p-3.5 rounded-[20px] border transition-all flex items-center justify-between gap-3 ${
                rem.enabled
                  ? 'bg-wa-ground/60 dark:bg-white/5 border-wa-line-soft/80 dark:border-white/5'
                  : 'bg-wa-ground/30 dark:bg-white/[0.02] border-wa-line-soft/40 dark:border-white/[0.02] opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-[12px] bg-wa-surface dark:bg-white/10 border border-wa-line-soft/80 dark:border-white/10 shrink-0">
                  {getTypeIcon(rem.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-[13px] text-wa-plum dark:text-white truncate">
                      {rem.title}
                    </h5>
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-wa-line-soft dark:bg-white/10 text-wa-plum dark:text-white shrink-0">
                      {rem.time}
                    </span>
                  </div>
                  <p className="text-[12px] text-wa-plum-muted dark:text-wa-on-plum-muted truncate mt-0.5">
                    {rem.details}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle switch */}
                <button
                  type="button"
                  data-ui-control
                  role="switch"
                  aria-checked={rem.enabled}
                  aria-label={`Toggle ${rem.title}`}
                  onClick={() => toggleReminder(rem.id)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    rem.enabled ? 'bg-wa-crimson' : 'bg-wa-line-soft dark:bg-white/20'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                      rem.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  data-ui-control
                  onClick={() => deleteReminder(rem.id)}
                  aria-label={`Delete ${rem.title}`}
                  className="p-1.5 text-wa-plum-muted hover:text-wa-crimson rounded-lg transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm">
          <div className="bg-wa-surface dark:bg-slate-900 border border-wa-line-soft dark:border-white/10 rounded-[28px] p-6 w-full max-w-md shadow-2xl relative text-wa-plum dark:text-white">
            <h3 className="font-display text-base font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="text-wa-crimson" size={18} /> Schedule New Reminder
            </h3>

            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-wa-plum-muted dark:text-wa-on-plum-muted uppercase tracking-wider mb-1.5">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Evening Hydroxyurea"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-wa-line-soft dark:border-white/10 bg-wa-ground/60 dark:bg-white/5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-wa-crimson"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-wa-plum-muted dark:text-wa-on-plum-muted uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-wa-line-soft dark:border-white/10 bg-wa-ground/60 dark:bg-white/5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-wa-crimson"
                  >
                    <option value="medication">Medication</option>
                    <option value="hydration">Hydration</option>
                    <option value="checkin">Check-in</option>
                    <option value="custom">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-wa-plum-muted dark:text-wa-on-plum-muted uppercase tracking-wider mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-wa-line-soft dark:border-white/10 bg-wa-ground/60 dark:bg-white/5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-wa-crimson"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-wa-plum-muted dark:text-wa-on-plum-muted uppercase tracking-wider mb-1.5">
                  Guidance Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Drink 2 sachets of water"
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-wa-line-soft dark:border-white/10 bg-wa-ground/60 dark:bg-white/5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-wa-crimson"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-full border border-wa-line-soft text-xs font-bold text-wa-plum-muted hover:bg-wa-ground dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-wa-crimson text-white text-xs font-bold hover:bg-wa-crimson-press shadow-sm"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
