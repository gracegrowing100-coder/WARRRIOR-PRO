import React, { useState, useEffect } from 'react';
import { Droplets, Plus, RotateCcw, CheckCircle2, Clock, AlertCircle, Bell, Award, Sparkles, CupSoda, Flame } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

interface CareVaultHydrationLoggerProps {
  userId: string;
}

export const CareVaultHydrationLogger: React.FC<CareVaultHydrationLoggerProps> = ({ userId }) => {
  const [currentLiters, setCurrentLiters] = useState<number>(0);
  const [goalLiters, setGoalLiters] = useState<number>(3.5);
  const [loading, setLoading] = useState<boolean>(true);
  const [hydrationLogHistory, setHydrationLogHistory] = useState<Array<{ id: string; amountMl: number; drinkType: string; time: string }>>([]);
  const [reminderFrequencyHours, setReminderFrequencyHours] = useState<number>(2);
  const [showReminderAlert, setShowReminderAlert] = useState<boolean>(true);

  const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD

  const fetchHydrationData = async () => {
    setLoading(true);
    try {
      const data = await firebaseService.getWaterLog(userId, todayStr);
      if (data) {
        setCurrentLiters(data.amount || 0);
        setGoalLiters(data.goal || 3.5);
      }
    } catch (e) {
      console.warn("Failed to load water log:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHydrationData();
  }, [userId, todayStr]);

  const addFluidEntry = async (amountMl: number, drinkType: string) => {
    const addedLiters = amountMl / 1000;
    const nextAmount = parseFloat((currentLiters + addedLiters).toFixed(2));
    setCurrentLiters(nextAmount);

    const newEntry = {
      id: Date.now().toString(),
      amountMl,
      drinkType,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHydrationLogHistory(prev => [newEntry, ...prev]);

    try {
      await firebaseService.saveWaterLog(userId, todayStr, nextAmount, goalLiters);
      // Play audio cue
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }

      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const updateGoal = async (newGoal: number) => {
    setGoalLiters(newGoal);
    try {
      await firebaseService.saveWaterLog(userId, todayStr, currentLiters, newGoal);
    } catch (e) {
      console.error(e);
    }
  };

  const percent = Math.min(100, Math.round((currentLiters / goalLiters) * 100));

  const HOURLY_TIMELINE = [
    { time: '08:00 AM', label: 'Morning Wakeup Glass', ml: 350 },
    { time: '10:00 AM', label: 'Mid-Morning Hydration', ml: 300 },
    { time: '12:00 PM', label: 'Lunchtime Fluid Boost', ml: 500 },
    { time: '02:00 PM', label: 'Afternoon Micro-Perfusion', ml: 350 },
    { time: '04:00 PM', label: 'ORS / Electrolyte Sip', ml: 350 },
    { time: '06:00 PM', label: 'Dinner Fluid Intake', ml: 500 },
    { time: '08:00 PM', label: 'Evening Hydration Glass', ml: 350 },
    { time: '10:00 PM', label: 'Pre-Sleep Crisis Defense', ml: 300 }
  ];

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-800 text-white space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-3.5 rounded-2xl border border-blue-500/30 text-blue-400 shadow-inner">
            <Droplets className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-950 text-blue-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-blue-800/50">
                Microvascular Perfusion Protocol
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mt-1">
              Care Vault Hydration Manager
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Maintain optimal plasma volume to keep sickle red blood cells flowing smoothly through narrow capillaries.
            </p>
          </div>
        </div>

        {/* Goal Selector */}
        <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 flex items-center gap-3 shrink-0">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Target Goal:</span>
          <div className="flex gap-1">
            {[2.5, 3.0, 3.5, 4.0].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => updateGoal(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  goalLiters === g
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {g}L
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Reminder Protocol Card */}
      {showReminderAlert && (
        <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-slate-900 p-5 rounded-2xl border border-blue-500/30 flex items-start justify-between gap-4 relative overflow-hidden">
          <div className="flex items-start gap-3 relative z-10">
            <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-300 shrink-0 mt-0.5">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-400/20 text-blue-200 px-2 py-0.5 rounded-md">
                  ⏰ Clinical Hydration Cue
                </span>
                <span className="text-[10px] font-bold text-slate-400">Rule of 1 Glass Every 2 Hours</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                SCD red cells lose flexibility when dehydrated. Drink at least 1 glass (250ml) every 2 hours while awake to prevent blood viscosity spikes!
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowReminderAlert(false)}
            className="text-slate-400 hover:text-white text-xs font-extrabold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Hydration Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Ring Card */}
        <div className="bg-slate-850 p-6 rounded-[2rem] border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
          <div className="relative w-40 h-40 rounded-full border-4 border-slate-700/80 flex flex-col items-center justify-center overflow-hidden bg-blue-950/30 shadow-inner">
            {/* Animated Wave Background */}
            <div 
              className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-700 ease-out z-0"
              style={{ height: `${percent}%` }}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-blue-200 opacity-60 animate-pulse"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black ${percent > 45 ? 'text-white' : 'text-blue-300'} tracking-tighter`}>
                {currentLiters}L
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${percent > 45 ? 'text-blue-100' : 'text-slate-400'} mt-0.5`}>
                Target: {goalLiters}L
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-black text-blue-300 bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-full">
              {percent >= 100 ? '🎉 100% Daily Target Reached!' : `${percent}% Hydration Completed`}
            </span>
          </div>
        </div>

        {/* Quick Entry Logger Buttons */}
        <div className="lg:col-span-2 bg-slate-850 p-6 rounded-[2rem] border border-slate-800 space-y-4">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
            Quick Fluid Intake Logger
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Glass of Water', ml: 250, icon: '💧', color: 'border-blue-500/30 hover:border-blue-400' },
              { label: 'Water Bottle', ml: 500, icon: '🍾', color: 'border-cyan-500/30 hover:border-cyan-400' },
              { label: 'ORS Electrolytes', ml: 350, icon: '⚡', color: 'border-yellow-500/30 hover:border-yellow-400' },
              { label: 'Herbal Tea', ml: 200, icon: '🫖', color: 'border-amber-500/30 hover:border-amber-400' },
              { label: 'Warm Broth/Soup', ml: 300, icon: '🥣', color: 'border-orange-500/30 hover:border-orange-400' },
              { label: 'Large Flask', ml: 750, icon: '🍶', color: 'border-indigo-500/30 hover:border-indigo-400' }
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => addFluidEntry(item.ml, item.label)}
                className={`p-3.5 bg-slate-900 rounded-2xl border ${item.color} flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:bg-slate-800 active:scale-95 space-y-1 shadow-sm`}
              >
                <span className="text-2xl select-none">{item.icon}</span>
                <span className="text-xs font-extrabold text-white">{item.label}</span>
                <span className="text-[10px] font-black text-blue-400">+{item.ml} ml</span>
              </button>
            ))}
          </div>

          {/* Recent Log History */}
          <div className="pt-3 border-t border-slate-800">
            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Today's Fluid Log Entries ({hydrationLogHistory.length})
            </h5>
            {hydrationLogHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No entries logged yet today. Click any button above to log fluid intake.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                {hydrationLogHistory.map((item) => (
                  <div key={item.id} className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
                    <span className="text-blue-400 font-black">+{item.amountMl}ml</span>
                    <span className="text-slate-300 font-bold">{item.drinkType}</span>
                    <span className="text-[9px] text-slate-500">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Hourly Reminder Timeline */}
      <div className="bg-slate-850 p-6 rounded-[2rem] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black text-sm text-white uppercase tracking-wider">Hourly Hydration Schedule</h4>
            <p className="text-xs text-slate-400 font-medium">Recommended intake intervals across the day for continuous cellular hydration.</p>
          </div>
          <span className="bg-blue-950 text-blue-400 text-xs font-black px-3 py-1 rounded-full border border-blue-800/50">
            8 Scheduled Checkpoints
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {HOURLY_TIMELINE.map((slot, idx) => {
            const reachedTarget = currentLiters >= ((idx + 1) * (goalLiters / 8));
            return (
              <div
                key={slot.time}
                className={`p-3 rounded-2xl border transition-all ${
                  reachedTarget
                    ? 'bg-blue-950/50 border-blue-500/40 text-blue-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-black uppercase mb-1">
                  <span>{slot.time}</span>
                  {reachedTarget ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-slate-500" />}
                </div>
                <p className="text-xs font-extrabold text-white truncate">{slot.label}</p>
                <p className="text-[10px] font-bold text-blue-400 mt-0.5">{slot.ml} ml target</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
