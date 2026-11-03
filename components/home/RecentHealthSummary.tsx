import React, { useCallback, useEffect, useState } from 'react';
import { CalendarCheck2, Droplets, HeartPulse, RefreshCw } from 'lucide-react';
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

  return (
    <div
      data-semantic="recent-health"
      aria-labelledby="recent-health-title"
      className="flex flex-col gap-3.5 rounded-[28px] bg-wa-surface p-5 text-wa-plum dark:text-white border border-wa-line-soft dark:border-white/10 shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">
            Past 7 days
          </p>
          <h2 id="recent-health-title" className="font-display text-[18px] sm:text-[20px] font-bold text-wa-plum dark:text-white mt-0.5">
            Recent health
          </h2>
        </div>
        <span className="rounded-full bg-wa-ground dark:bg-white/10 px-3 py-1 text-xs font-bold text-wa-plum dark:text-white">
          7 days
        </span>
      </div>
      <p className="text-xs text-wa-plum-muted dark:text-wa-on-plum-muted -mt-1">
        Recorded entries from the last seven days only.
      </p>

      {hasRecords ? (
        <dl className="mt-1 space-y-3">
          {/* Daily check-in card */}
          <div className="rounded-[20px] bg-wa-ground/60 dark:bg-white/5 p-4 border border-wa-line-soft/80 dark:border-white/5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CalendarCheck2 size={18} />
                </span>
                <div>
                  <dt className="text-[13px] font-bold text-wa-plum dark:text-white leading-tight">Daily check-in</dt>
                  <dd className="text-xs font-medium text-wa-plum-muted dark:text-wa-on-plum-muted mt-0.5">
                    Recorded on {summary.checkInDays} {summary.checkInDays === 1 ? 'day' : 'days'}
                  </dd>
                </div>
              </div>
              <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                summary.checkInDays === 7
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-wa-line-soft dark:bg-white/10 text-wa-plum-muted dark:text-wa-on-plum-muted'
              }`}>
                {summary.checkInDays === 7 ? 'Full week completed' : `${summary.checkInDays} of 7 days`}
              </span>
            </div>

            {/* 7-day visual dot progress track */}
            <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    i < summary.checkInDays
                      ? 'bg-emerald-500'
                      : 'bg-wa-line-soft/80 dark:bg-white/10'
                  }`}
                />
              ))}
            </div>

            <p className="mt-2.5 text-[12px] leading-relaxed text-wa-plum/85 dark:text-wa-on-plum-muted">
              {summary.checkInDays === 1
                ? "You completed 1 check-in over the last 7 days. Try to check in every morning so you and your doctor have a full picture of your health."
                : summary.checkInDays >= 5
                ? `You completed ${summary.checkInDays} check-ins this week — excellent habit for tracking your wellbeing!`
                : `You completed ${summary.checkInDays} check-ins in the last 7 days. Regular daily check-ins help spot pain triggers early.`}
            </p>
          </div>

          {/* Hydration card */}
          <div className="rounded-[20px] bg-wa-ground/60 dark:bg-white/5 p-4 border border-wa-line-soft/80 dark:border-white/5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-wa-water-soft text-wa-water">
                  <Droplets size={18} />
                </span>
                <div>
                  <dt className="text-[13px] font-bold text-wa-plum dark:text-white leading-tight">Water tracking</dt>
                  <dd className="text-xs font-medium text-wa-plum-muted dark:text-wa-on-plum-muted mt-0.5">
                    Recorded on {summary.hydrationDays} {summary.hydrationDays === 1 ? 'day' : 'days'}
                  </dd>
                </div>
              </div>
              <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                summary.hydrationDays >= 5
                  ? 'bg-wa-water/15 text-wa-water'
                  : 'bg-wa-water-soft text-[#11535E] dark:text-wa-water'
              }`}>
                {summary.hydrationDays >= 5 ? 'Hydration on track' : `${summary.hydrationDays} of 7 days`}
              </span>
            </div>

            {/* 7-day visual dot progress track */}
            <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    i < summary.hydrationDays
                      ? 'bg-wa-water'
                      : 'bg-wa-line-soft/80 dark:bg-white/10'
                  }`}
                />
              ))}
            </div>

            <p className="mt-2.5 text-[12px] leading-relaxed text-wa-plum/85 dark:text-wa-on-plum-muted">
              {summary.hydrationDays === 1
                ? "Water intake logged on 1 day this week. Drinking at least 3 to 4 litres (or 6–8 sachets) every day keeps red blood cells flowing smoothly and prevents crises."
                : summary.hydrationDays >= 5
                ? `Water logged on ${summary.hydrationDays} days this week. Great hydration protects your red blood cells!`
                : `Water logged on ${summary.hydrationDays} of the last 7 days. Aim to drink pure water regularly throughout each day.`}
            </p>
          </div>

          {/* Pain entries card */}
          <div className="rounded-[20px] bg-wa-ground/60 dark:bg-white/5 p-4 border border-wa-line-soft/80 dark:border-white/5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-wa-rose text-wa-crimson">
                  <HeartPulse size={18} />
                </span>
                <div>
                  <dt className="text-[13px] font-bold text-wa-plum dark:text-white leading-tight">Pain entries</dt>
                  <dd className="text-xs font-medium text-wa-plum-muted dark:text-wa-on-plum-muted mt-0.5">
                    {summary.painEntries} recorded{summary.latestPain !== null ? ` · latest ${summary.latestPain} / 10` : ''}
                  </dd>
                </div>
              </div>
              {summary.latestPain !== null ? (
                <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                  summary.latestPain <= 3
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : summary.latestPain <= 6
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-wa-crimson/15 text-wa-crimson'
                }`}>
                  {summary.latestPain === 0
                    ? 'Pain-free'
                    : summary.latestPain <= 3
                    ? `Mild (${summary.latestPain}/10)`
                    : summary.latestPain <= 6
                    ? `Moderate (${summary.latestPain}/10)`
                    : `Severe (${summary.latestPain}/10)`}
                </span>
              ) : (
                <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-wa-line-soft dark:bg-white/10 text-wa-plum-muted dark:text-wa-on-plum-muted shrink-0">
                  None logged
                </span>
              )}
            </div>

            <p className="mt-2.5 text-[12px] leading-relaxed text-wa-plum/85 dark:text-wa-on-plum-muted">
              {summary.latestPain !== null
                ? summary.latestPain === 0
                  ? "Zero pain recorded on your last entry. Rest well and keep up your daily routines."
                  : summary.latestPain <= 3
                  ? "Mild discomfort recorded on your last entry. Remember to stay warm, drink plenty of water, and rest."
                  : summary.latestPain <= 6
                  ? "Moderate pain recorded. Take your prescribed medicines on schedule, rest, and keep warm."
                  : "High pain recorded. Follow your clinic emergency action plan or tap Emergency if it persists."
                : "No pain flare-ups or crisis symptoms logged in the past 7 days."}
            </p>
          </div>
        </dl>
      ) : (
        <div className="mt-4 rounded-[22px] bg-wa-ground/50 dark:bg-white/5 p-6 text-center border border-dashed border-wa-line-soft dark:border-white/10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wa-coral/15 text-wa-coral">
            <CalendarCheck2 size={24} aria-hidden="true" />
          </div>
          <p className="mt-3 font-display text-[15px] font-bold text-wa-plum dark:text-white">No recent health activity</p>
          <p className="mt-1 text-[13px] text-wa-plum-muted dark:text-wa-on-plum-muted max-w-sm mx-auto">
            Check-ins, hydration, and pain entries from the last seven days will appear here.
          </p>
        </div>
      )}

      {/* Reassurance note */}
      <div className="mt-1 flex items-center gap-2 rounded-[16px] bg-wa-sun-soft/50 dark:bg-wa-sun/10 px-3.5 py-2.5 text-[12px] text-wa-sun-ink dark:text-wa-sun">
        <span className="font-bold shrink-0">✦ Note:</span>
        <span>Every check-in gives your doctor an accurate record of how you feel between clinic visits.</span>
      </div>
    </div>
  );
};
