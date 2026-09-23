import React, { useState, useEffect } from 'react';
import { Droplets, Plus, RotateCcw, CupSoda, Flame, CheckCircle, BarChart2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';
import { firebaseService } from '../services/firebaseService';

interface WaterTrackerProps {
  userId: string;
}

export const WaterIntakeTracker: React.FC<WaterTrackerProps> = ({ userId }) => {
  const [amount, setAmount] = useState(0); // in Liters
  const [goal, setGoal] = useState(3.0);   // in Liters
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD Safely

  const fetchHydration = async () => {
    setLoading(true);
    const data = await firebaseService.getWaterLog(userId, todayStr);
    if (data) {
      setAmount(data.amount || 0);
      setGoal(data.goal || 3.0);
    }
    const hist = await firebaseService.getWaterLogs7Days(userId);
    if (hist) {
      setHistory(hist);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHydration();

    const handleSync = () => {
      fetchHydration();
    };
    window.addEventListener('warrior-streak-updated', handleSync);
    return () => {
      window.removeEventListener('warrior-streak-updated', handleSync);
    };
  }, [userId, todayStr]);

  const addWater = async (liters: number) => {
    const nextAmount = Math.max(0, parseFloat((amount + liters).toFixed(2)));
    setAmount(nextAmount);
    await firebaseService.saveWaterLog(userId, todayStr, nextAmount, goal);
    
    // Play subtle audio cue for hydration
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch(e) {}

    // Update 7 days bar logs dynamically without full reload
    setHistory(prev => prev.map(item => item.dateStr === todayStr ? { ...item, amount: nextAmount } : item));
    // Trigger fully verified fetch in background
    const hist = await firebaseService.getWaterLogs7Days(userId);
    if (hist) setHistory(hist);
  };

  const resetWater = async () => {
    if (window.confirm("Do you want to reset your hydration for today?")) {
      setAmount(0);
      await firebaseService.saveWaterLog(userId, todayStr, 0, goal);
      setHistory(prev => prev.map(item => item.dateStr === todayStr ? { ...item, amount: 0 } : item));
    }
  };

  const percent = Math.min(100, Math.round((amount / goal) * 100));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800/85 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-150 rounded-full -mr-12 -mt-12 opacity-30 blur-2xl"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-2xl border border-blue-50 dark:border-blue-900/40 text-blue-500 shadow-inner">
            <Droplets className="w-5 h-5 fill-blue-500" />
          </div>
          <div>
            <h4 className="font-black text-gray-800 dark:text-white text-sm uppercase tracking-wider">Hydration Tracker</h4>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">SCD Crisis Prevention</p>
          </div>
        </div>
        {amount > 0 && (
          <button 
            onClick={resetWater}
            className="p-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Reset logs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-6 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Progress Display */}
            <div className="flex flex-col items-center">
              {/* Liquid Circle Visualizer */}
              <div className="relative w-32 h-32 rounded-full border-4 border-blue-100/50 dark:border-slate-800 flex flex-col items-center justify-center overflow-hidden bg-blue-50/20 dark:bg-blue-950/10 shadow-inner mb-2">
                {/* Pulsing overlay wave background representing the water level height */}
                <div 
                  className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-blue-500/80 to-blue-400/80 transition-all duration-700 ease-out z-0"
                  style={{ height: `${percent}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-2 bg-blue-300 opacity-60 animate-pulse"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                  <span className={`text-2xl font-black ${percent > 40 ? 'text-white' : 'text-blue-900 dark:text-blue-400'} tracking-tighter`}>{amount}L</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${percent > 40 ? 'text-blue-100' : 'text-gray-400 dark:text-slate-500'} mt-0.5`}>Go: {goal}L</span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-3 py-1 rounded-full border border-blue-100/50 dark:border-blue-900/30">
                  {percent >= 100 ? (
                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Hydra-Goal Reached!</span>
                  ) : `${percent}% Completed`}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 leading-relaxed">
                Drinking 3 Liters of fluids daily prevents red blood cells from sickling and blocking bloodflow. Set your pace:
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => addWater(0.25)}
                  className="flex flex-col items-center justify-center py-3 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/55 text-blue-700 dark:text-blue-450 font-extrabold rounded-2xl transition-all active:scale-95 cursor-pointer text-xs"
                >
                  <CupSoda className="w-4 h-4 mb-1" />
                  +250ml
                </button>
                <button 
                  onClick={() => addWater(0.50)}
                  className="flex flex-col items-center justify-center py-3 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/55 text-blue-700 dark:text-blue-450 font-extrabold rounded-2xl transition-all active:scale-95 cursor-pointer text-xs"
                >
                  <CupSoda className="w-4 h-4 mb-1" />
                   +500ml
                </button>
                <button 
                  onClick={() => addWater(0.75)}
                  className="flex flex-col items-center justify-center py-3 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/55 text-blue-700 dark:text-blue-450 font-extrabold rounded-2xl transition-all active:scale-95 cursor-pointer text-xs"
                >
                  <CupSoda className="w-4 h-4 mb-1" />
                   +750ml
                </button>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => addWater(1.00)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-center"
                >
                  +1.0 Liter Bottle
                </button>
              </div>
            </div>
          </div>

          {/* 7-day Hydration bar chart history */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
            <h5 className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 justify-between">
              <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-blue-500" /> 7-Day Hydration History</span>
              <span className="text-blue-500">Goal: {goal}L</span>
            </h5>
            
            <div className="h-28 bg-gray-50/50 dark:bg-slate-950/30 rounded-2xl border border-gray-100 dark:border-slate-800 p-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis 
                    dataKey="label" 
                    stroke="#9ca3af" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 4]} 
                    tickCount={3}
                  />
                  <ReferenceLine y={goal} stroke="#93c5fd" strokeDasharray="3 3" />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #f3f4f6',
                      borderRadius: '0.75rem',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                    }}
                    formatter={(value: any) => [`${value} Liters`, 'Drank']}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={14}>
                    {history.map((entry, index) => {
                      const reachedGoal = entry.amount >= entry.goal;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={reachedGoal ? '#3b82f6' : '#93c5fd'} 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
