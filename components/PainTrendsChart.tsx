import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { Heart, Calendar, Plus, Activity, CheckCircle2 } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

interface PainTrendsChartProps {
  userId: string;
  refreshKey?: number;
}

interface PainEntry {
  dateStr: string;
  painLevel: number;
  triggers?: string[];
  notes?: string;
}

export const PainTrendsChart: React.FC<PainTrendsChartProps> = ({ userId, refreshKey }) => {
  const [userLogs, setUserLogs] = useState<PainEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sliderVal, setSliderVal] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD

  const fetchPainLogs = useCallback(async () => {
    setLoading(true);
    try {
      const logs = await firebaseService.getPainLogs(userId);
      if (Array.isArray(logs)) {
        setUserLogs(logs as PainEntry[]);
      }
    } catch (err) {
      console.warn('Could not load pain logs:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchPainLogs();
  }, [fetchPainLogs, refreshKey]);

  // Build authentic 30-day dataset based strictly on patient-recorded data
  const { chartData, stats } = useMemo(() => {
    const dataset = [];
    const now = new Date();
    let totalScore = 0;
    let realCount = 0;
    let maxPain = 0;
    let severeCount = 0;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('sv');
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const realLog = userLogs.find((l) => l.dateStr === dateStr);

      if (realLog && typeof realLog.painLevel === 'number') {
        const val = realLog.painLevel;
        dataset.push({
          dateStr,
          label,
          pain: val,
          isReal: true,
          triggers: realLog.triggers || [],
        });
        totalScore += val;
        realCount++;
        if (val > maxPain) maxPain = val;
        if (val >= 7) severeCount++;
      } else {
        dataset.push({
          dateStr,
          label,
          pain: null,
          isReal: false,
          triggers: [],
        });
      }
    }

    const avg = realCount > 0 ? (totalScore / realCount).toFixed(1) : null;

    return {
      chartData: dataset,
      stats: {
        recordedDays: realCount,
        averagePain: avg,
        maxPain: realCount > 0 ? maxPain : null,
        severeCount,
      },
    };
  }, [userLogs]);

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await firebaseService.addPainLog(userId, sliderVal, todayStr);
      await fetchPainLogs();
      setSuccessInfo(`Recorded: ${sliderVal}/10 for today`);
      setTimeout(() => setSuccessInfo(null), 3500);
    } catch (err) {
      console.error('Failed to log pain:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getSymptomLabel = (val: number) => {
    if (val === 0) return { text: 'Pain-free', desc: 'Baseline comfort. Keep drinking fluids and resting well.', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20' };
    if (val <= 3) return { text: 'Mild discomfort', desc: 'Drink at least 3-4L of clean fluids. Keep joints comfortably warm.', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20' };
    if (val <= 6) return { text: 'Moderate pain', desc: 'Rest, stay well hydrated, take prescribed analgesics on schedule, avoid chills.', color: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20' };
    if (val <= 8) return { text: 'High pain flare', desc: 'Use warm blankets/heating wraps, take medications, notify your caregiver.', color: 'text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/20' };
    return { text: 'Severe crisis level', desc: 'Intense vaso-occlusive pain. Initiate your clinical crisis plan or tap Emergency.', color: 'text-wa-crimson bg-wa-crimson/10 border-wa-crimson/25 font-bold' };
  };

  const currentLabelState = getSymptomLabel(sliderVal);
  const hasRecords = stats.recordedDays > 0;

  return (
    <div className="flex flex-col gap-5 rounded-[28px] border border-wa-line-soft bg-wa-surface p-5 text-wa-plum shadow-none dark:border-white/10 dark:bg-white/5 dark:text-white sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-wa-rose text-wa-crimson">
            <Calendar size={20} />
          </span>
          <div>
            <h4 className="font-display text-[16px] sm:text-[18px] font-bold text-wa-plum dark:text-white leading-tight">
              30-Day Pain Trends
            </h4>
            <p className="text-[12px] text-wa-plum-muted dark:text-wa-on-plum-muted mt-0.5">
              Based on your recorded daily health entries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-wa-ground dark:bg-white/10 px-3 py-1 text-xs font-bold text-wa-plum dark:text-white">
            <Heart size={13} className="text-wa-crimson fill-wa-crimson" />
            <span>Scale 0-10</span>
          </span>
          <span className="rounded-full bg-wa-ground dark:bg-white/10 px-3 py-1 text-xs font-bold text-wa-plum-muted dark:text-wa-on-plum-muted">
            {stats.recordedDays} of 30 days
          </span>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[18px] bg-wa-ground/60 dark:bg-white/5 p-3 text-center border border-wa-line-soft/60 dark:border-white/5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">Avg Pain</span>
          <span className="font-display text-lg sm:text-xl font-black text-wa-plum dark:text-white mt-0.5 block">
            {stats.averagePain ? `${stats.averagePain} / 10` : '—'}
          </span>
        </div>
        <div className="rounded-[18px] bg-wa-ground/60 dark:bg-white/5 p-3 text-center border border-wa-line-soft/60 dark:border-white/5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">Highest Pain</span>
          <span className="font-display text-lg sm:text-xl font-black text-wa-plum dark:text-white mt-0.5 block">
            {stats.maxPain !== null ? `${stats.maxPain} / 10` : '—'}
          </span>
        </div>
        <div className="rounded-[18px] bg-wa-ground/60 dark:bg-white/5 p-3 text-center border border-wa-line-soft/60 dark:border-white/5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">Days Logged</span>
          <span className="font-display text-lg sm:text-xl font-black text-wa-plum dark:text-white mt-0.5 block">
            {stats.recordedDays}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart View */}
        <div className="lg:col-span-7 rounded-[22px] bg-wa-ground/50 dark:bg-white/5 p-3.5 sm:p-4 border border-wa-line-soft/60 dark:border-white/5 flex flex-col justify-center min-h-[260px]">
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-wa-crimson border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : hasRecords ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="waPainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8102E" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#C8102E" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.15)" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#9ca3af" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    stroke="#9ca3af" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickCount={6}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1E1226',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '1rem',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)'
                    }}
                    formatter={(value: any, _name: any, props: any) => {
                      if (value === null || value === undefined) return ['Not logged', 'Pain'];
                      const triggers = props.payload.triggers || [];
                      const triggerText = triggers.length > 0 ? ` · ${triggers.join(', ')}` : '';
                      return [`${value} / 10${triggerText}`, 'Pain score'];
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pain" 
                    stroke="#C8102E" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#waPainGrad)" 
                    connectNulls={true}
                    dot={{ r: 3, fill: '#C8102E', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 5, fill: '#9E0A22' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-wa-plum-muted dark:text-wa-on-plum-muted">
              <Activity className="h-10 w-10 text-wa-crimson/40 mb-2" />
              <p className="font-display font-bold text-[14px] text-wa-plum dark:text-white">No pain records yet</p>
              <p className="text-xs max-w-xs mt-1">
                Your entries will plot a genuine 30-day pain curve here as you log. Use the slider on the right to record your score.
              </p>
            </div>
          )}
        </div>

        {/* Input Log Slider Form */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <form onSubmit={handleSubmitLog} className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted block">
                Record today&apos;s pain
              </span>
              
              <div className="rounded-[20px] bg-wa-ground/60 dark:bg-white/5 border border-wa-line-soft dark:border-white/10 p-3.5 flex flex-col items-center">
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-wa-plum dark:text-white mb-1">
                  {sliderVal} <span className="text-sm font-semibold text-wa-plum-muted dark:text-wa-on-plum-muted">/ 10</span>
                </span>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={sliderVal}
                  onChange={(e) => setSliderVal(parseInt(e.target.value, 10))}
                  aria-label="Pain score slider"
                  className="w-full accent-wa-crimson cursor-pointer h-2 bg-wa-line-soft dark:bg-white/20 rounded-lg appearance-none mt-1"
                />
              </div>

              {/* Status Indicator detail card */}
              <div className={`p-3 rounded-[16px] border transition-all ${currentLabelState.color}`}>
                <span className="font-bold text-xs block leading-tight">{currentLabelState.text}</span>
                <p className="text-[11px] leading-snug mt-0.5 opacity-90">{currentLabelState.desc}</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full min-h-11 rounded-full bg-wa-crimson hover:bg-wa-crimson-press text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Plus size={16} />
                <span>{submitting ? 'Recording…' : 'Record pain level'}</span>
              </button>

              {successInfo && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold text-center flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>{successInfo}</span>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
