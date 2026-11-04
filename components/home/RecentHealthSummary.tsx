import React, { useCallback, useEffect, useState } from 'react';
import { CalendarCheck2, ChevronDown, Droplets, HeartPulse, RefreshCw } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, Skeleton } from '../ui';

interface RecentHealthSummaryProps {
  userId: string;
  refreshKey?: number;
}

interface PainLog {
  dateStr?: string;
  painLevel?: number;
}

interface RecentSummary {
  checkInDays: number;
  hydrationDays: number;
  painEntries: number;
  latestPain: number | null;
}

const getRecentDateKeys = () => {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    return date.toLocaleDateString('sv');
  });
};

interface MetricRowProps {
  id: string;
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  detail: string;
  chip: string;
  chipClassName: string;
  /** Number of filled bars in the 7-day track; omit to hide the track. */
  filled?: number;
  barClassName?: string;
  advice: string;
}

/** One compact metric: short status always visible, longer advice behind "Read more". */
const MetricRow: React.FC<MetricRowProps> = ({
  id, icon, iconClassName, title, detail, chip, chipClassName, filled, barClassName, advice,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[20px] border border-wa-line-soft/80 bg-wa-ground/60 p-3.5 dark:border-white/5 dark:bg-white/5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${iconClassName}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <dt className="text-[13px] font-bold leading-tight text-wa-plum dark:text-white">{title}</dt>
            <dd className="mt-0.5 text-xs font-medium text-wa-plum-muted dark:text-wa-on-plum-muted">{detail}</dd>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold ${chipClassName}`}>{chip}</span>
      </div>

      {filled !== undefined ? (
        <div className="mt-2.5 flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < filled ? barClassName : 'bg-wa-line-soft/80 dark:bg-white/10'}`}
            />
          ))}
        </div>
      ) : null}

      <button
        type="button"
        data-ui-control
        aria-expanded={open}
        aria-controls={`${id}-advice`}
        onClick={() => setOpen((value) => !value)}
        className="mt-2 inline-flex min-h-8 items-center gap-1 text-[12px] font-bold text-wa-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
      >
        {open ? 'Show less' : 'Read more'}
        <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <p id={`${id}-advice`} className="mt-1 text-[12px] leading-relaxed text-wa-plum/85 dark:text-wa-on-plum-muted">
          {advice}
        </p>
      ) : null}
    </div>
  );
};

export const RecentHealthSummary: React.FC<RecentHealthSummaryProps> = ({ userId, refreshKey = 0 }) => {
  const [summary, setSummary] = useState<RecentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const dateKeys = getRecentDateKeys();
      const [checkIns, waterLogs, painLogs] = await Promise.all([
        Promise.all(dateKeys.map((date) => firebaseService.getDailyMoodCheckIn(userId, date))),
        Promise.all(dateKeys.map((date) => firebaseService.getWaterLog(userId, date))),
        firebaseService.getPainLogs(userId),
      ]);
      const recentPain = (painLogs as PainLog[])
        .filter((entry) => entry.dateStr && dateKeys.includes(entry.dateStr) && typeof entry.painLevel === 'number')
        .sort((a, b) => String(b.dateStr).localeCompare(String(a.dateStr)));

      setSummary({
        checkInDays: checkIns.filter(Boolean).length,
        hydrationDays: waterLogs.filter((entry) => entry.data !== null).length,
        painEntries: recentPain.length,
        latestPain: recentPain[0]?.painLevel ?? null,
      });
    } catch (loadError) {
      console.warn('Recent health summary could not be loaded:', loadError);
      setError(true);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary, refreshKey]);

  if (loading) {
    return (
      <div data-semantic="recent-health" aria-labelledby="recent-health-title" className="rounded-[28px] bg-wa-surface p-5 border border-wa-line-soft dark:border-white/10">
        <h2 id="recent-health-title" className="font-display text-[18px] font-bold text-wa-plum dark:text-white">Recent health summary</h2>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-20 w-full rounded-[18px]" />
          <Skeleton className="h-20 w-full rounded-[18px]" />
          <Skeleton className="h-20 w-full rounded-[18px]" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div data-semantic="recent-health" aria-labelledby="recent-health-title" className="rounded-[28px] bg-wa-surface p-5 border border-wa-line-soft dark:border-white/10">
        <h2 id="recent-health-title" className="font-display text-[18px] font-bold text-wa-plum dark:text-white">Recent health summary</h2>
        <Alert
          tone="warning"
          title="Recent records are unavailable"
          className="mt-4"
          action={(
            <Button variant="secondary" size="sm" leadingIcon={<RefreshCw size={16} />} onClick={() => void loadSummary()}>
              Try again
            </Button>
          )}
        >
          No trend has been inferred from missing information.
        </Alert>
      </div>
    );
  }

  const hasRecords = summary.checkInDays > 0 || summary.hydrationDays > 0 || summary.painEntries > 0;
  const dayWord = (n: number) => (n === 1 ? 'day' : 'days');

  const checkInAdvice = summary.checkInDays === 1
    ? 'You completed 1 check-in over the last 7 days. Try to check in every morning so you and your doctor have a full picture of your health.'
    : summary.checkInDays >= 5
      ? `You completed ${summary.checkInDays} check-ins this week — excellent habit for tracking your wellbeing!`
      : `You completed ${summary.checkInDays} check-ins in the last 7 days. Regular daily check-ins help spot pain triggers early.`;

  const hydrationAdvice = summary.hydrationDays === 1
    ? 'Water intake logged on 1 day this week. Drinking at least 3 to 4 litres (or 6–8 sachets) every day keeps red blood cells flowing smoothly and prevents crises.'
    : summary.hydrationDays >= 5
      ? `Water logged on ${summary.hydrationDays} days this week. Great hydration protects your red blood cells!`
      : `Water logged on ${summary.hydrationDays} of the last 7 days. Aim to drink pure water regularly throughout each day.`;

  const pain = summary.latestPain;
  const painAdvice = pain !== null
    ? pain === 0
      ? 'Zero pain recorded on your last entry. Rest well and keep up your daily routines.'
      : pain <= 3
        ? 'Mild discomfort recorded on your last entry. Remember to stay warm, drink plenty of water, and rest.'
        : pain <= 6
          ? 'Moderate pain recorded. Take your prescribed medicines on schedule, rest, and keep warm.'
          : 'High pain recorded. Follow your clinic emergency action plan or tap Emergency if it persists.'
    : 'No pain flare-ups or crisis symptoms logged in the past 7 days.';
  const painChip = pain === null
    ? 'None logged'
    : pain === 0
      ? 'Pain-free'
      : pain <= 3
        ? `Mild (${pain}/10)`
        : pain <= 6
          ? `Moderate (${pain}/10)`
          : `Severe (${pain}/10)`;
  const painChipClass = pain === null
    ? 'bg-wa-line-soft dark:bg-white/10 text-wa-plum-muted dark:text-wa-on-plum-muted'
    : pain <= 3
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : pain <= 6
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
        : 'bg-wa-crimson/15 text-wa-crimson';

  return (
    <div
      data-semantic="recent-health"
      aria-labelledby="recent-health-title"
      className="flex flex-col gap-3 rounded-[28px] bg-wa-surface p-5 text-wa-plum dark:text-white border border-wa-line-soft dark:border-white/10 shadow-none"
    >
      <div>
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">
          Past 7 days
        </p>
        <h2 id="recent-health-title" className="font-display text-[18px] sm:text-[20px] font-bold text-wa-plum dark:text-white mt-0.5">
          Recent health
        </h2>
      </div>

      {hasRecords ? (
        <dl className="space-y-2.5">
          <MetricRow
            id="recent-checkin"
            icon={<CalendarCheck2 size={18} />}
            iconClassName="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            title="Daily check-in"
            detail={`Recorded on ${summary.checkInDays} ${dayWord(summary.checkInDays)}`}
            chip={summary.checkInDays === 7 ? 'Full week' : `${summary.checkInDays} of 7 days`}
            chipClassName={summary.checkInDays === 7
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-wa-line-soft dark:bg-white/10 text-wa-plum-muted dark:text-wa-on-plum-muted'}
            filled={summary.checkInDays}
            barClassName="bg-emerald-500"
            advice={checkInAdvice}
          />
          <MetricRow
            id="recent-water"
            icon={<Droplets size={18} />}
            iconClassName="bg-wa-water-soft text-wa-water"
            title="Water tracking"
            detail={`Recorded on ${summary.hydrationDays} ${dayWord(summary.hydrationDays)}`}
            chip={summary.hydrationDays >= 5 ? 'On track' : `${summary.hydrationDays} of 7 days`}
            chipClassName={summary.hydrationDays >= 5
              ? 'bg-wa-water/15 text-wa-water'
              : 'bg-wa-water-soft text-[#11535E] dark:text-wa-water'}
            filled={summary.hydrationDays}
            barClassName="bg-wa-water"
            advice={hydrationAdvice}
          />
          <MetricRow
            id="recent-pain"
            icon={<HeartPulse size={18} />}
            iconClassName="bg-wa-rose text-wa-crimson"
            title="Pain entries"
            detail={`${summary.painEntries} recorded${pain !== null ? ` · latest ${pain} / 10` : ''}`}
            chip={painChip}
            chipClassName={painChipClass}
            advice={painAdvice}
          />
        </dl>
      ) : (
        <div className="mt-2 rounded-[22px] bg-wa-ground/50 dark:bg-white/5 p-6 text-center border border-dashed border-wa-line-soft dark:border-white/10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wa-coral/15 text-wa-coral">
            <CalendarCheck2 size={24} aria-hidden="true" />
          </div>
          <p className="mt-3 font-display text-[15px] font-bold text-wa-plum dark:text-white">No recent health activity</p>
          <p className="mt-1 text-[13px] text-wa-plum-muted dark:text-wa-on-plum-muted max-w-sm mx-auto">
            Check-ins, hydration, and pain entries from the last seven days will appear here.
          </p>
        </div>
      )}
    </div>
  );
};
