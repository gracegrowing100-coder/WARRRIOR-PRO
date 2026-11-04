import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid, ReferenceLine 
} from 'recharts';
import { Droplets, TrendingUp, RefreshCw, Smile, CalendarCheck2 } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

interface MoodHydrationTrendsProps {
  userId: string;
  refreshTrigger?: number;
}

export const MoodHydrationTrendsChart: React.FC<MoodHydrationTrendsProps> = ({ userId, refreshTrigger }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const trends = await firebaseService.getMoodAndHydrationTrends7Days(userId);
      setData(Array.isArray(trends) ? trends : []);
    } catch (e) {
      console.warn('Failed to load mood and hydration trends:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchData();

    const handleSync = () => void fetchData();
    window.addEventListener('warrior-streak-updated', handleSync);
    return () => window.removeEventListener('warrior-streak-updated', handleSync);
  }, [fetchData, refreshTrigger]);

  const { stats, insightText } = useMemo(() => {
    let waterDaysCount = 0;
    let totalWater = 0;
    let goalMetDays = 0;
    let moodDaysCount = 0;

    data.forEach((day) => {
      if (typeof day.waterAmount === 'number' && day.waterAmount > 0) {
        waterDaysCount++;
        totalWater += day.waterAmount;
        if (day.waterAmount >= (day.waterGoal || 3.0)) {
          goalMetDays++;
        }
      }
      if (day.hasMoodLogged && typeof day.moodScore === 'number') {
        moodDaysCount++;
      }
    });

    const avgWater = waterDaysCount > 0 ? (totalWater / waterDaysCount).toFixed(1) : null;

    // Factual clinical correlation observation
    const highHydrationDays = data.filter((t) => typeof t.waterAmount === 'number' && t.waterAmount >= 2.8 && t.hasMoodLogged);
    const lowHydrationDays = data.filter((t) => typeof t.waterAmount === 'number' && t.waterAmount < 2.0 && t.hasMoodLogged);

    let observation = 'Drinking at least 3 to 4 litres (6–8 sachets) of water daily supports steady blood flow and higher energy levels.';

    if (highHydrationDays.length > 0 && lowHydrationDays.length > 0) {
      const avgHigh = (highHydrationDays.reduce((acc, curr) => acc + (curr.moodScore || 7), 0) / highHydrationDays.length).toFixed(1);
      const avgLow = (lowHydrationDays.reduce((acc, curr) => acc + (curr.moodScore || 7), 0) / lowHydrationDays.length).toFixed(1);
      if (Number(avgHigh) > Number(avgLow)) {
        observation = `Wellness score averaged ${avgHigh}/10 on days with ≥2.8L water, compared to ${avgLow}/10 on low-hydration days.`;
      }
    } else if (waterDaysCount >= 5) {
      observation = `You tracked water on ${waterDaysCount} of the last 7 days — excellent hydration habit for crisis prevention!`;
    }

    return {
      stats: {
        waterDaysCount,
        avgWater,
        goalMetDays,
        moodDaysCount,
      },
      insightText: observation,
    };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = payload[0]?.payload;
      return (
        <div className="bg-[#1E1226] text-white p-3.5 rounded-2xl shadow-xl border border-white/15 text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1.5 font-bold">
            <span>{label} ({dayData?.displayDate})</span>
            <span className="text-sm">{dayData?.moodEmoji}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sky-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Droplets size={13} className="text-sky-400" /> Hydration:
            </span>
            <span className="font-bold text-white">
              {dayData?.waterAmount !== null ? `${dayData?.waterAmount}L / ${dayData?.waterGoal || 3}L` : 'Not recorded'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Smile size={13} className="text-rose-400" /> Wellness:
            </span>
            <span className="font-bold text-white">
              {dayData?.hasMoodLogged ? `${dayData?.moodScore} / 10` : 'Not recorded'}
            </span>
          </div>
          {dayData?.moodLabel && (
            <p className="text-[11px] text-white/70 italic pt-1 border-t border-white/10">
              {dayData.moodLabel}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-wa-line-soft bg-wa-surface p-5 text-wa-plum shadow-none dark:border-white/10 dark:bg-white/5 dark:text-white sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <TrendingUp size={20} />
          </span>
          <div>
            <h4 className="font-display text-[16px] sm:text-[18px] font-bold text-wa-plum dark:text-white leading-tight">
              7-Day Mood & Hydration Trends
            </h4>
            <p className="text-[12px] text-wa-plum-muted dark:text-wa-on-plum-muted mt-0.5">
              Daily fluid intake and wellness check-in patterns
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 bg-wa-ground dark:bg-white/10 hover:bg-wa-line-soft dark:hover:bg-white/20 text-wa-plum dark:text-white rounded-full text-xs font-bold transition-all"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[18px] bg-wa-ground/60 dark:bg-white/5 p-3 text-center border border-wa-line-soft/60 dark:border-white/5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">Hydration Days</span>
          <span className="font-display text-lg sm:text-xl font-black text-wa-plum dark:text-white mt-0.5 block">
            {stats.waterDaysCount} / 7
          </span>
        </div>
        <div className="rounded-[18px] bg-wa-ground/60 dark:bg-white/5 p-3 text-center border border-wa-line-soft/60 dark:border-white/5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">Avg Fluid</span>
          <span className="font-display text-lg sm:text-xl font-black text-wa-plum dark:text-white mt-0.5 block">
            {stats.avgWater ? `${stats.avgWater} L` : '—'}
          </span>
        </div>
        <div className="rounded-[18px] bg-wa-ground/60 dark:bg-white/5 p-3 text-center border border-wa-line-soft/60 dark:border-white/5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">Check-ins</span>
          <span className="font-display text-lg sm:text-xl font-black text-wa-plum dark:text-white mt-0.5 block">
            {stats.moodDaysCount} / 7
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      {loading ? (
        <div className="h-56 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-wa-water border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="h-60 w-full rounded-[22px] bg-wa-ground/50 dark:bg-white/5 p-3 sm:p-4 border border-wa-line-soft/60 dark:border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="waHydrationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.15)" vertical={false} />
                <XAxis 
                  dataKey="dayLabel" 
                  tickLine={false} 
                  stroke="#9ca3af" 
                  fontSize={11}
                  fontWeight={600}
                />
                {/* Left Y Axis: Hydration in Liters (0 to 4L) */}
                <YAxis 
                  yAxisId="left" 
                  domain={[0, 4]} 
                  ticks={[0, 1, 2, 3, 4]} 
                  stroke="#0284C7" 
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
                  stroke="#C8102E" 
                  fontSize={10} 
                  fontWeight={600}
                  tickFormatter={(val) => `${val}/10`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={32} 
                  formatter={(value) => <span className="text-xs font-bold text-wa-plum dark:text-white">{value}</span>}
                />
                
                {/* 3.0L Target Reference Line */}
                <ReferenceLine 
                  yAxisId="left" 
                  y={3.0} 
                  stroke="#0284C7" 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.6} 
                  label={{ value: "3L Goal", position: "insideTopRight", fill: "#0284C7", fontSize: 9, fontWeight: 700 }}
                />

                {/* Hydration Area */}
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="waterAmount" 
                  name="💧 Water (L)" 
                  fill="url(#waHydrationFill)" 
                  stroke="#0284C7" 
                  strokeWidth={2.5}
                  connectNulls={true}
                  dot={{ r: 3.5, fill: '#0284C7', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 5, fill: '#0369A1' }}
                />

                {/* Wellness Score Line */}
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="moodScore" 
                  name="✨ Wellness (1-10)" 
                  stroke="#C8102E" 
                  strokeWidth={2.5}
                  connectNulls={true}
                  dot={{ r: 3.5, fill: '#C8102E', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 5, fill: '#9E0A22' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Clinical Observation Note */}
          <div className="rounded-[18px] bg-wa-ground/60 dark:bg-white/5 p-3.5 border border-wa-line-soft/80 dark:border-white/5 flex items-start gap-3">
            <span aria-hidden="true" className="p-2 rounded-xl bg-wa-water-soft text-wa-water shrink-0 mt-0.5">
              <Droplets size={16} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">
                7-Day Health Observation
              </p>
              <p className="text-xs text-wa-plum/90 dark:text-wa-on-plum-muted font-medium leading-relaxed mt-0.5">
                {insightText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
