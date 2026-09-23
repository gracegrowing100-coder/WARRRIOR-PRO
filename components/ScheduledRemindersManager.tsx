import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, BellRing, BellOff, Clock, Plus, Trash2, CheckCircle2, 
  AlertCircle, Droplets, Pill, Activity, Sparkles, Send, Volume2, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebaseService';

interface ReminderItem {
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

export const ScheduledRemindersManager: React.FC<ScheduledRemindersManagerProps> = ({ userId }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'medication' | 'hydration' | 'checkin' | 'custom'>('medication');
  const [newTime, setNewTime] = useState('09:00');
  const [newDetails, setNewDetails] = useState('');

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Check permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    loadReminders();
  }, [userId]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const list = await firebaseService.getScheduledReminders(userId);
      setReminders(list);
    } catch (e) {
      console.warn("Failed to load reminders:", e);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop/mobile notifications.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        playChime();
        new Notification("🔔 Warrior Reminders Activated!", {
          body: "Scheduled alerts for Hydroxyurea, hydration goals, and health check-ins will notify you on time.",
          icon: "/metadata.json"
        });
      }
    } catch (e) {
      console.error("Error requesting notification permission:", e);
    }
  };

  // Soft reminder chime audio
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {}
  };

  const sendTestNotification = () => {
    playChime();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification("🧪 Test Warrior Notification", {
        body: "Your browser notification channel is working perfectly for medication & hydration alerts!",
        icon: "/metadata.json"
      });
    }
  };

  // Active interval scheduler checking every 20 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHHMM = now.toTimeString().slice(0, 5); // "HH:MM"
      const todayDateStr = now.toLocaleDateString('sv');

      reminders.forEach((r) => {
        if (r.enabled && r.time === currentHHMM && r.lastNotifiedDate !== todayDateStr) {
          // Fire alert
          playChime();
          if ('Notification' in window && Notification.permission === 'granted') {
            const icons = {
              medication: '💊',
              hydration: '💧',
              checkin: '🩺',
              custom: '⏰'
            };
            new Notification(`${icons[r.type]} ${r.title}`, {
              body: r.details || `Scheduled ${r.type} check-in for your Sickle Cell wellness routine.`,
              icon: "/metadata.json"
            });
          }

          // Mark as notified today
          const updated = reminders.map(item => 
            item.id === r.id ? { ...item, lastNotifiedDate: todayDateStr } : item
          );
          setReminders(updated);
          firebaseService.saveScheduledReminders(userId, updated);
        }
      });
    }, 20000);

    return () => clearInterval(timer);
  }, [reminders, userId]);

  const toggleReminder = async (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setReminders(updated);
    await firebaseService.saveScheduledReminders(userId, updated);
  };

  const deleteReminder = async (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    await firebaseService.saveScheduledReminders(userId, updated);
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRem: ReminderItem = {
      id: 'rem-' + Date.now().toString(36),
      title: newTitle.trim(),
      type: newType,
      time: newTime,
      enabled: true,
      details: newDetails.trim() || getDefaultDetails(newType, newTitle)
    };

    const updated = [...reminders, newRem];
    setReminders(updated);
    await firebaseService.saveScheduledReminders(userId, updated);

    setShowAddModal(false);
    setNewTitle('');
    setNewDetails('');
  };

  const getDefaultDetails = (type: string, title: string) => {
    if (type === 'medication') return 'Take prescribed dosage with full glass of water.';
    if (type === 'hydration') return 'Drink 350-500ml water to protect vascular flow.';
    if (type === 'checkin') return 'Log symptoms and pain rating in your Health Vault.';
    return 'Scheduled health routine check.';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication': return <Pill className="w-4 h-4 text-emerald-500" />;
      case 'hydration': return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'checkin': return <Activity className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800/85 relative overflow-hidden transition-all duration-300">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-900/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 shadow-inner">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">
              Scheduled Medication & Check-In Reminders
            </h4>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Browser Notification API Alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {permission !== 'granted' ? (
            <button
              onClick={requestPermission}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <Bell size={13} /> Enable Notifications
            </button>
          ) : (
            <button
              onClick={sendTestNotification}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={12} /> {testSent ? 'Alert Dispatched!' : 'Test Notification'}
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Add reminder"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Permission Status Banner if not granted */}
      {permission !== 'granted' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              Browser Alerts are Currently {permission === 'denied' ? 'Blocked in Browser Settings' : 'Inactive'}
            </h5>
            <p className="text-xs text-amber-800 dark:text-amber-200/90 font-medium leading-relaxed">
              Enable notifications to receive timely popups for your morning Hydroxyurea doses, fluid intake targets, and afternoon pain logs even while browsing other tabs.
            </p>
          </div>
        </div>
      )}

      {/* Reminder List */}
      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                rem.enabled
                  ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                  : 'bg-gray-50/40 dark:bg-slate-900/40 border-gray-100 dark:border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 shadow-sm shrink-0">
                  {getTypeIcon(rem.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-xs text-gray-900 dark:text-white">
                      {rem.title}
                    </h5>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {rem.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                    {rem.details}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle switch */}
                <button
                  onClick={() => toggleReminder(rem.id)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    rem.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'
                  }`}
                  title={rem.enabled ? "Disable reminder" : "Enable reminder"}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                      rem.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                {/* Delete button */}
                <button
                  onClick={() => deleteReminder(rem.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                  title="Remove reminder"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {reminders.length === 0 && (
            <div className="text-center py-6 text-xs text-gray-400 font-medium">
              No active scheduled reminders. Click the + button above to add one.
            </div>
          )}
        </div>
      )}

      {/* Add Reminder Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="text-blue-500" size={18} /> Schedule New Health Alert
              </h3>

              <form onSubmit={handleAddReminder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Reminder Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="E.g. Hydroxyurea Dose, Drink 500ml Water, Pain Check"
                    className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Type
                    </label>
                    <select
                      value={newType}
                      onChange={(e: any) => setNewType(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="medication">💊 Medication</option>
                      <option value="hydration">💧 Hydration</option>
                      <option value="checkin">🩺 Pain / Health Check</option>
                      <option value="custom">⏰ Custom Reminder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Time (24-Hour)
                    </label>
                    <input
                      type="time"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Instructions / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    placeholder="E.g. Take 500mg capsule with warm water"
                    className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-gray-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
                  >
                    Save Reminder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
