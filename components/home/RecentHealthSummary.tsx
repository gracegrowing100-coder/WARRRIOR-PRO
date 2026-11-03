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
          <Skeleton className="h-16 w-full rounded-[18px]" />
          <Skeleton className="h-16 w-full rounded-[18px]" />
          <Skeleton className="h-16 w-full rounded-[18px]" />
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
      className="flex flex-col gap-3 rounded-[28px] bg-wa-surface p-5 text-wa-plum dark:text-white border border-wa-line-soft dark:border-white/10 shadow-none"
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
        <dl className="mt-2 space-y-3">
          {/* Daily check-in row */}
          <div className="rounded-[20px] bg-wa-ground/60 dark:bg-white/5 p-3.5 border border-wa-line-soft/80 dark:border-white/5">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CalendarCheck2 size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[13px] font-bold text-wa-plum dark:text-white">Daily check-in</dt>
                <dd className="text-[14px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  Recorded on {summary.checkInDays} {summary.checkInDays === 1 ? 'day' : 'days'}
                </dd>
              </div>
              <div className="hidden sm:flex items-center gap-1 shrink-0" aria-hidden="true">
                {Array.from({ length: 7 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full ${
                      i < summary.checkInDays
                        ? 'bg-emerald-500'
                        : 'bg-wa-line-soft dark:bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="mt-2 text-[12px] text-wa-plum-muted dark:text-wa-on-plum-muted">
              {summary.checkInDays >= 5
                ? '🌟 Consistent logging! Daily records help you track how your body feels.'
                : summary.checkInDays > 0
                ? '👍 Good routine. Log each morning to catch warning signs early.'
                : 'Tap a mood above to log how you feel today.'}
            </p>
          </div>

          {/* Hydration row */}
          <div className="rounded-[20px] bg-wa-ground/60 dark:bg-white/5 p-3.5 border border-wa-line-soft/80 dark:border-white/5">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-wa-water-soft text-wa-water">
                <Droplets size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[13px] font-bold text-wa-plum dark:text-white">Water tracking</dt>
                <dd className="text-[14px] font-bold text-wa-water tabular-nums">
                  Recorded on {summary.hydrationDays} {summary.hydrationDays === 1 ? 'day' : 'days'}
                </dd>
              </div>
              <div className="hidden sm:flex items-center gap-1 shrink-0" aria-hidden="true">
                {Array.from({ length: 7 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full ${
                      i < summary.hydrationDays
                        ? 'bg-wa-water'
                        : 'bg-wa-line-soft dark:bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="mt-2 text-[12px] text-wa-plum-muted dark:text-wa-on-plum-muted">
              {summary.hydrationDays >= 4
                ? '💧 Great hydration! Keeping blood flow smooth helps prevent crises.'
                : '💧 Staying hydrated with clean water helps protect against pain flare-ups.'}
            </p>
          </div>

          {/* Pain entries row */}
          <div className="rounded-[20px] bg-wa-ground/60 dark:bg-white/5 p-3.5 border border-wa-line-soft/80 dark:border-white/5">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-wa-rose text-wa-crimson">
                <HeartPulse size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[13px] font-bold text-wa-plum dark:text-white">Pain entries</dt>
                <dd className="text-[14px] font-bold text-wa-crimson tabular-nums">
                  {summary.painEntries} recorded{summary.latestPain !== null ? ` · latest ${summary.latestPain} / 10` : ''}
                </dd>
              </div>
            </div>
            <p className="mt-2 text-[12px] text-wa-plum-muted dark:text-wa-on-plum-muted">
              {summary.latestPain !== null
                ? summary.latestPain <= 3
                  ? 'Mild discomfort recorded. Remember to stay warm, rest, and hydrate.'
                  : summary.latestPain <= 6
                  ? 'Moderate pain recorded. Take prescribed medicine, rest, and keep warm.'
                  : 'High pain recorded. Follow your clinic plan or tap Emergency if it persists.'
                : 'No pain episodes logged this week.'}
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

      {/* Gentle reassurance strip */}
      <div className="mt-2 flex items-center gap-2 rounded-[16px] bg-wa-sun-soft/50 dark:bg-wa-sun/10 px-3 py-2 text-[12px] text-wa-sun-ink dark:text-wa-sun">
        <span className="font-bold shrink-0">✦ Note:</span>
        <span>Regular logs help your doctor provide the best care during clinic visits.</span>
      </div>
    </div>
  );
};
