import React, { useState, useEffect, useRef } from 'react';
import { Pill, Plus, Trash2, CheckCircle2, Clock, AlertCircle, X, Check, Volume2, BellRing, BellOff, ShieldAlert } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { Button, Card, Modal } from './ui';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string; // e.g. "08:00"
  frequency: string; // e.g. "Once Daily"
  lastTakenDate?: string; // locked to a YYYY-MM-DD string
}

interface MedicationProps {
  userId: string;
  compact?: boolean;
}

export const MedicationReminder: React.FC<MedicationProps> = ({ userId, compact = false }) => {
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Alarm state
  const [activeAlarmMed, setActiveAlarmMed] = useState<Medication | null>(null);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<any>(null);

  // Add form fields
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    time: '08:00',
    frequency: 'Once Daily'
  });

  const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotificationsEnabled(true);
        new Notification("Medication Reminders Enabled", {
          body: "You will receive timely alerts for Hydroxyurea, supplements, and pain medications.",
          icon: "/metadata.json"
        });
      }
    }
  };

  // Loud Alarm Sound Generator via Web Audio API
  const startLoudSiren = (medName: string = "Scheduled Medication") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      setIsAlarmRinging(true);

      // Pulse siren pattern
      let toggle = false;
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);

      const playPulse = () => {
        if (!ctx || ctx.state === 'closed') return;
        
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // High decibel dual frequencies (Square/Sawtooth waves for maximal piercing alarm)
        osc1.type = 'sawtooth';
        osc2.type = 'square';

        const freq1 = toggle ? 880 : 1760; // A5 vs A6 high alarm
        const freq2 = toggle ? 1046.5 : 2093; // C6 vs C7

        osc1.frequency.setValueAtTime(freq1, now);
        osc2.frequency.setValueAtTime(freq2, now);

        // Max volume gain
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.38);
        osc2.stop(now + 0.38);

        toggle = !toggle;
      };

      playPulse();
      alarmIntervalRef.current = setInterval(playPulse, 420);
    } catch (e) {
      console.warn("Could not start audio synth:", e);
    }
  };

  const stopLoudSiren = () => {
    setIsAlarmRinging(false);
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.suspend();
    }
    setActiveAlarmMed(null);
  };

  // Check schedules every 15 seconds for alerts
  useEffect(() => {
    const checkSchedule = () => {
      if (meds.length === 0) return;
      const now = new Date();
      const currentHHMM = now.toTimeString().slice(0, 5); // "08:00"

      const dueMed = meds.find(m => m.time === currentHHMM && m.lastTakenDate !== todayStr);
      if (dueMed && !isAlarmRinging) {
        setActiveAlarmMed(dueMed);
        startLoudSiren(dueMed.name);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`🚨 MEDICATION DUE: ${dueMed.name}`, {
            body: `Dosage: ${dueMed.dosage}. Please take your medication to maintain cellular protection.`,
            tag: `med-alarm-${dueMed.id}`,
            requireInteraction: true
          });
        }
      }
    };

    const interval = setInterval(checkSchedule, 15000);
    return () => clearInterval(interval);
  }, [meds, todayStr, isAlarmRinging]);

  const triggerTestAlarm = () => {
    const testMed: Medication = {
      id: 'test-alarm',
      name: 'Hydroxyurea (Test Alarm)',
      dosage: '500mg',
      time: new Date().toTimeString().slice(0, 5),
      frequency: 'Once Daily'
    };
    setActiveAlarmMed(testMed);
    startLoudSiren("Hydroxyurea Test Alarm");
  };

  const fetchMeds = async () => {
    setLoading(true);
    const data = await firebaseService.getMedications(userId);
    if (!data || data.length === 0) {
      // Seed some default medications if user has absolutely empty setup
      const defaults = [
        { name: 'Hydroxyurea', dosage: '500mg', time: '08:00', frequency: 'Once Daily', lastTakenDate: '' },
        { name: 'Folic Acid', dosage: '5mg', time: '12:00', frequency: 'Once Daily', lastTakenDate: '' }
      ];
      const saved: Medication[] = [];
      for (const def of defaults) {
        const added = await firebaseService.addMedication(userId, def);
        if (added) saved.push(added as Medication);
      }
      setMeds(saved);
    } else {
      setMeds(data as Medication[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMeds();
  }, [userId]);

  const handleToggleTaken = async (medId: string, currentlyTaken: boolean) => {
    const updatedDate = currentlyTaken ? '' : todayStr;
    
    // Optimistic UI
    setMeds(prev => prev.map(m => m.id === medId ? { ...m, lastTakenDate: updatedDate } : m));
    
    try {
      await firebaseService.updateMedication(userId, medId, { lastTakenDate: updatedDate });
      
      // Play a little check-mark notification noise
      if (!currentlyTaken) {
        await firebaseService.updateStreak(userId);
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 0.16);
          osc2.stop(ctx.currentTime + 0.16);
        }
      }
    } catch (e) {
      console.error(e);
      // Revert on error
      fetchMeds();
    }
  };

  const handleCreateMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dosage) return;
    
    setLoading(true);
    await firebaseService.addMedication(userId, {
      ...newMed,
      lastTakenDate: ''
    });
    
    setNewMed({ name: '', dosage: '', time: '08:00', frequency: 'Once Daily' });
    setShowAddForm(false);
    fetchMeds();
  };

  const handleDeleteMed = async (medId: string) => {
    if (window.confirm("Are you sure you want to remove this medication from your schedule?")) {
      setLoading(true);
      await firebaseService.deleteMedication(userId, medId);
      fetchMeds();
    }
  };

  return (
    <div className={compact ? 'relative' : 'bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800/80 flex flex-col relative overflow-hidden transition-all duration-300'}>
      {compact && <Card data-semantic>
        <h2 className="text-heading-3">Medication</h2>
        <p className="mt-1 text-small text-foreground-secondary">{meds.filter(m => m.lastTakenDate === todayStr).length} of {meds.length} taken today</p>
        {loading ? <p role="status" className="mt-3 text-small">Loading medication…</p> : (
          <ul className="mt-3 divide-y divide-line">
            {(showFullSchedule ? meds : meds.filter(m => m.lastTakenDate !== todayStr).slice(0, 3)).map(med => {
              const taken = med.lastTakenDate === todayStr;
              return <li key={med.id} className="flex items-start gap-3 py-3">
                <Button variant={taken ? 'primary' : 'secondary'} size="sm" aria-label={`Mark ${med.name} ${med.dosage} at ${med.time} as ${taken ? 'not taken' : 'taken'}`} aria-pressed={taken}
                  onClick={() => handleToggleTaken(med.id, taken)}><Check size={18} aria-hidden="true" /></Button>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-small font-semibold">{med.name}</p>
                  <p className="text-small text-foreground-secondary">{med.dosage} · {med.time}</p>
                  <p className={`text-caption ${taken ? 'text-status-success-text' : 'text-foreground-secondary'}`}>{taken ? 'Taken' : 'Pending'}</p>
                </div>
                {showFullSchedule && <Button variant="ghost" size="sm" aria-label={`Delete ${med.name} ${med.dosage} at ${med.time}`} onClick={() => handleDeleteMed(med.id)}><Trash2 size={18} aria-hidden="true" /></Button>}
              </li>;
            })}
          </ul>
        )}
        {!loading && meds.length > 0 && meds.every(m => m.lastTakenDate === todayStr) && !showFullSchedule && <p className="mt-3 text-small text-status-success-text">All listed medication is marked taken today.</p>}
        <Button variant="ghost" size="sm" className="mt-2" aria-expanded={showFullSchedule} onClick={() => setShowFullSchedule(!showFullSchedule)}>
          {showFullSchedule ? 'Show daily summary' : `View full schedule (${meds.length})`}
        </Button>
        {showFullSchedule && <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {!notificationsEnabled ? <Button variant="secondary" size="sm" onClick={requestNotificationPermission}>Enable alerts</Button> : <span className="self-center text-small text-status-success-text">Alerts active</span>}
          <Button variant="secondary" size="sm" onClick={triggerTestAlarm}>Test Alarm</Button>
          <Button size="sm" onClick={() => setShowAddForm(true)}>Add medication</Button>
        </div>}
      </Card>}
      <div hidden={compact}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-red-50 dark:bg-red-950/20 p-2.5 rounded-2xl border border-red-50 dark:border-red-900/45 text-red-500 shadow-inner">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-gray-800 dark:text-white text-sm uppercase tracking-wider">Medication Reminder & Alarm</h4>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Hydroxyurea & Daily Schedule</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!notificationsEnabled ? (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 transition-all cursor-pointer"
              title="Enable push alerts"
            >
              <BellOff className="w-3 h-3 text-amber-500" /> Alerts
            </button>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/50">
              <BellRing className="w-3 h-3 text-emerald-500" /> Active
            </span>
          )}

          <button
            type="button"
            onClick={triggerTestAlarm}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-[10px] font-black uppercase tracking-wider border border-rose-300 dark:border-rose-800/60 hover:bg-rose-200 transition-all cursor-pointer shadow-sm"
            title="Test high-decibel alarm tone"
          >
            <Volume2 className="w-3 h-3 text-rose-600 animate-pulse" /> Test Alarm
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow shadow-red-200 dark:shadow-red-950/30"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-6 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : meds.length === 0 ? (
        <div className="py-6 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl p-6">
          <AlertCircle className="w-8 h-8 text-gray-300 dark:text-slate-750 mx-auto mb-2" />
          <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1.5">No meds listed</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">Keep your daily treatment plan here to maintain cellular hydration.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meds.map((med) => {
            const isTaken = med.lastTakenDate === todayStr;
            return (
              <div 
                key={med.id} 
                className={`flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 ${isTaken ? 'bg-green-50/40 dark:bg-green-950/20 border-green-150 dark:border-green-900/35 shadow-sm opacity-80' : 'bg-gray-50/50 dark:bg-slate-850/40 border-gray-100 dark:border-slate-800 hover:border-red-100 dark:hover:border-red-950/40'}`}
              >
                <div className="flex items-center gap-3">
                  {/* Status checkbox button */}
                  <button
                    aria-label={`Mark ${med.name} as ${isTaken ? 'not taken' : 'taken'}`}
                    onClick={() => handleToggleTaken(med.id, isTaken)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border-2 cursor-pointer ${isTaken ? 'bg-green-600 border-green-600 text-white' : 'bg-white dark:bg-slate-805 border-gray-200 dark:border-slate-700 hover:border-red-500 text-transparent'}`}
                  >
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </button>

                  <div className="min-w-0">
                    <span className={`font-black text-sm block ${isTaken ? 'line-through text-gray-400 dark:text-slate-550' : 'text-gray-800 dark:text-slate-205'}`}>{med.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 dark:text-slate-450 font-bold uppercase">{med.dosage}</span>
                      <span className="text-[10px] text-gray-300 dark:text-slate-600">•</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-450 font-bold flex items-center gap-0.5 uppercase">
                        <Clock className="w-3 h-3 text-red-500" /> {med.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${isTaken ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700'}`}>
                    {isTaken ? 'Taken' : 'Pending'}
                  </span>
                  
                  <button 
                    aria-label={`Delete ${med.name}`}
                    onClick={() => handleDeleteMed(med.id)}
                    className="p-2 text-gray-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>
      {/* Very Loud Medication Alarm Modal Overlay */}
      {isAlarmRinging && activeAlarmMed && (
        <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-50 p-6 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-red-500 rounded-[2.5rem] p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-bounce">
            <div className="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/50 animate-pulse">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div>
              <span className="bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-red-500/30">
                🚨 URGENT MEDICATION REMINDER
              </span>
              <h3 className="text-2xl font-black text-white mt-3">{activeAlarmMed.name}</h3>
              <p className="text-sm font-bold text-red-300 mt-1">Dosage: {activeAlarmMed.dosage} • Time: {activeAlarmMed.time}</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Adherence to Hydroxyurea and prescribed supplements protects red blood cells and reduces severe vaso-occlusive pain crises.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  handleToggleTaken(activeAlarmMed.id, false);
                  stopLoudSiren();
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" strokeWidth={3} /> Take Medication Now
              </button>

              <button
                type="button"
                onClick={stopLoudSiren}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
              >
                Silence / Snooze Alarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Up Overlay Add Form Modal */}
      {showAddForm && compact && (
        <Modal open onOpenChange={setShowAddForm} title="Add Scheduled Medication" closeLabel="Close medication form" size="sm">
            <form onSubmit={handleCreateMed} className="mt-4 space-y-4">
              {(['name', 'dosage', 'time', 'frequency'] as const).map(field => <label key={field} className="block text-small font-medium">
                {{name: 'Medication Name', dosage: 'Dosage', time: 'Reminder Time', frequency: 'Frequency'}[field]}
                <input required data-ui-field data-ui type={field === 'time' ? 'time' : 'text'} value={newMed[field]} onChange={e => setNewMed(p => ({...p, [field]: e.target.value}))}
                  className="mt-1 min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-body text-foreground" />
              </label>)}
              <div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button><Button type="submit">Save Schedule</Button></div>
            </form>
        </Modal>
      )}
      {showAddForm && !compact && (
        <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/98 backdrop-blur-sm z-30 p-6 flex flex-col justify-center animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-gray-800 dark:text-white text-sm uppercase tracking-wider">Add Scheduled Medication</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateMed} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Medication Name</label>
              <input
                type="text"
                required
                value={newMed.name}
                onChange={(e) => setNewMed(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-slate-805 border border-gray-200 dark:border-slate-800 rounded-2xl px-4 py-3 font-semibold text-gray-850 dark:text-white text-sm focus:outline-none focus:border-red-500 dark:focus:border-red-600 transition-colors"
                placeholder="e.g. Hydroxyurea"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Dosage</label>
                <input
                  type="text"
                  required
                  value={newMed.dosage}
                  onChange={(e) => setNewMed(p => ({ ...p, dosage: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-slate-805 border border-gray-200 dark:border-slate-800 rounded-2xl px-4 py-3 font-semibold text-gray-855 dark:text-white text-sm focus:outline-none focus:border-red-500 dark:focus:border-red-600 transition-colors"
                  placeholder="e.g. 500mg, 1 Capsule"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Reminder Time</label>
                <input
                  type="time"
                  required
                  value={newMed.time}
                  onChange={(e) => setNewMed(p => ({ ...p, time: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-slate-805 border border-gray-200 dark:border-slate-800 rounded-2xl px-4 py-3 font-semibold text-gray-855 dark:text-white text-sm focus:outline-none focus:border-red-500 dark:focus:border-red-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Frequency</label>
              <input
                type="text"
                required
                value={newMed.frequency}
                onChange={(e) => setNewMed(p => ({ ...p, frequency: e.target.value }))}
                className="w-full bg-gray-55 dark:bg-slate-850 border border-gray-200 dark:border-slate-850 text-slate-800 dark:text-white rounded-2xl px-4 py-3 font-semibold text-sm focus:outline-none focus:border-red-500 transition-colors"
                placeholder="e.g. Once Daily, Twice Daily"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-705 text-gray-750 dark:text-slate-350 font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} /> Save Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
