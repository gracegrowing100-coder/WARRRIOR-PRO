import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid, ReferenceLine 
} from 'recharts';
import { Droplets, Smile, TrendingUp, Sparkles, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

interface MoodHydrationTrendsProps {
  userId: string;
  refreshTrigger?: number;
}

export const MoodHydrationTrendsChart: React.FC<MoodHydrationTrendsProps> = ({ userId, refreshTrigger }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryInsight, setSummaryInsight] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const trends = await firebaseService.getMoodAndHydrationTrends7Days(userId);
      setData(trends);

      // Compute simple correlation insight
      const highHydrationDays = trends.filter(t => t.waterAmount >= 2.8);
      const lowHydrationDays = trends.filter(t => t.waterAmount < 2.0);

      const avgMoodHighHydra = highHydrationDays.length > 0
        ? (highHydrationDays.reduce((acc, curr) => acc + (curr.moodScore || 7), 0) / highHydrationDays.length).toFixed(1)
        : null;

      const avgMoodLowHydra = lowHydrationDays.length > 0
        ? (lowHydrationDays.reduce((acc, curr) => acc + (curr.moodScore || 7), 0) / lowHydrationDays.length).toFixed(1)
        : null;

      if (avgMoodHighHydra && avgMoodLowHydra && Number(avgMoodHighHydra) > Number(avgMoodLowHydra)) {
        setSummaryInsight(`Wellness score averaged ${avgMoodHighHydra}/10 on well-hydrated days (≥2.8L), compared to ${avgMoodLowHydra}/10 on low hydration days.`);
      } else {
        setSummaryInsight("Maintaining ≥3.0L daily hydration keeps red blood cell elasticity high and supports optimal mood & energy.");
      }
    } catch (e) {
      console.warn("Failed to load mood and hydration trends:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleSync = () => fetchData();
    window.addEventListener('warrior-streak-updated', handleSync);
    return () => window.removeEventListener('warrior-streak-updated', handleSync);
  }, [userId, refreshTrigger]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = payload[0]?.payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-750 text-xs space-y-1.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1.5">
            <span className="font-black text-slate-200">{label} ({dayData?.displayDate})</span>
            <span className="text-base">{dayData?.moodEmoji}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-blue-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Droplets size={13} className="text-blue-400" /> Hydration:
            </span>
            <span className="font-black text-white">{dayData?.waterAmount}L / {dayData?.waterGoal}L</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-purple-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Smile size={13} className="text-purple-400" /> Wellness Score:
            </span>
            <span className="font-black text-white">{dayData?.moodScore}/10</span>
          </div>
          {dayData?.moodLabel && (
            <p className="text-[10px] text-slate-400 italic pt-0.5 border-t border-slate-800/60 font-medium">
              Status: {dayData?.moodLabel}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800/85 relative overflow-hidden transition-all duration-300">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 dark:bg-purple-900/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-3 rounded-2xl text-white shadow-md shadow-purple-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-gray-900 dark:text-white text-base tracking-tight">
                7-Day Mood & Hydration Trajectory
              </h3>
              <span className="bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/40">
                Recharts Analytics
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
              Dual-metric correlation between daily fluid intake and emotional wellness
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Chart Canvas */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading 7-Day Metrics...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hydrationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                <XAxis 
                  dataKey="dayLabel" 
                  tickLine={false} 
                  stroke="#94a3b8" 
                  fontSize={11}
                  fontWeight={600}
                />
                {/* Left Y Axis: Hydration in Liters (0 to 4L) */}
                <YAxis 
                  yAxisId="left" 
                  domain={[0, 4]} 
                  ticks={[0, 1, 2, 3, 4]} 
                  stroke="#3b82f6" 
                  fontSize={10} 
                  fontWeight={600}
                  tickFormatter={(val) => `${val}L`}
                />
                {/* Right Y Axis: Wellness/Mood Score (1 to 10) */}
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 10]} 
                  ticks={[2, 4, 6, 8, 10]} 
                  stroke="#a855f7" 
                  fontSize={10} 
                  fontWeight={600}
                  tickFormatter={(val) => `${val}/10`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  formatter={(value) => <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{value}</span>}
                />
                
                {/* 3.0L Target Reference Line */}
                <ReferenceLine 
                  yAxisId="left" 
                  y={3.0} 
                  stroke="#3b82f6" 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.5} 
                  label={{ value: "3L Goal", position: "insideTopRight", fill: "#3b82f6", fontSize: 9, fontWeight: 700 }}
                />

                {/* Hydration Area & Bar/Line */}
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="waterAmount" 
                  name="💧 Hydration (Liters)" 
                  fill="url(#hydrationFill)" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#2563eb' }}
                />

                {/* Mood / Wellness Score Line */}
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="moodScore" 
                  name="🧠 Wellness Score (1-10)" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#9333ea' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Clinical Trend Takeaway Badge */}
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 flex items-start gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div>
              <h5 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                Correlation Observation
              </h5>
              <p className="text-xs text-gray-600 dark:text-slate-300 font-medium leading-relaxed mt-0.5">
                {summaryInsight}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
