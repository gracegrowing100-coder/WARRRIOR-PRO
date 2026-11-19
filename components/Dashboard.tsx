import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Calendar, CloudSun, FileText, LifeBuoy, Shield, ShieldCheck, Smile, TrendingUp, UserCheck, Volume2, VolumeX } from 'lucide-react';
import { Page } from '../App';
import { WaterIntakeTracker } from './WaterIntakeTracker';
import { MedicationReminder } from './MedicationReminder';
import { PainTrendsChart } from './PainTrendsChart';
import { CareVault } from './CareVault';
import { DesignatedCaregiverWidget } from './DesignatedCaregiverWidget';
import { DailyMoodCheckIn } from './DailyMoodCheckIn';
import { MoodHydrationTrendsChart } from './MoodHydrationTrendsChart';
import { ScheduledRemindersManager } from './ScheduledRemindersManager';
import { PatternInsightsDoctorReport } from './PatternInsightsDoctorReport';
import { SymptomPainCheckIn } from './health';
import { HomeActionHub, RecentHealthSummary, TodaysHealthCard, UpcomingAppointmentCard } from './home';
import { WeatherCard } from './home/WeatherCard';
import { WelcomeGuide } from './home/WelcomeGuide';
import { Spark } from './brand';
import { Button, SosPill } from './ui';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';
import { APP_TRANSLATIONS, SupportedLanguage } from '../services/offlineKnowledgeBase';

interface DashboardProps {
  onNavigate: (to: Page) => void;
  userId: string;
  language?: SupportedLanguage;
}

type HomeToolView =
  | null
  | 'hydration'
  | 'medication'
  | 'checkin'
  | 'trends'
  | 'reports'
  | 'reminders'
  | 'caregiver'
  | 'vault'
  | 'weather';

interface ToolMeta {
  title: string;
  subtitle: string;
}

const TOOL_META: Record<Exclude<HomeToolView, null>, ToolMeta> = {
  hydration: {
    title: 'Water & Hydration',
    subtitle: 'Track sachets, bottles, and daily hydration goals',
  },
  medication: {
    title: 'Medicines & Schedule',
    subtitle: 'Track daily doses and mark medicines taken',
  },
  checkin: {
    title: 'Daily Check-in',
    subtitle: 'Log your mood, fatigue, and how you feel today',
  },
  trends: {
    title: 'Pain, Mood & Hydration Trends',
    subtitle: 'See how your symptoms and water intake change over time',
  },
  reports: {
    title: 'Doctor Reports',
    subtitle: 'Create a 30-day summary to share with your clinic',
  },
  reminders: {
    title: 'Scheduled Reminders',
    subtitle: 'Set daily alerts for water and medicines',
  },
  caregiver: {
    title: 'Caregiver & Alerts',
    subtitle: 'Manage emergency alerts for family or trusted contacts',
  },
  vault: {
    title: 'Care Vault',
    subtitle: 'Store genotype, steady-state PCV, E/U/Cr & clinic notes',
  },
  weather: {
    title: 'Weather & Recent Logs',
    subtitle: 'Check local temperature triggers and recent health entries',
  },
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userId, language = 'en' }) => {
  const [profileName, setProfileName] = useState<string>('Warrior');
  const [refreshPain, setRefreshPain] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPainLevel, setCurrentPainLevel] = useState<number>(3);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<HomeToolView>(null);

  const fetchProfileAndStats = async (active = true) => {
    let pName = 'Warrior';

    try {
      const s = await firebaseService.updateStreak(userId);
      if (typeof s === 'number') {
        setStreakDays(s);
      }
    } catch (e) {
      console.warn('Failed to update streak count on startup:', e);
    }

    if (userId) {
      try {
        const p = await firebaseService.getUserProfile(userId);
        if (p && active) {
          pName = p.displayName || 'Warrior';
          setProfileName(pName);
        } else {
          const currentUser = auth.currentUser;
          if (currentUser && active) {
            pName = currentUser.displayName || 'Warrior';
            setProfileName(pName);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch user profile:', e);
      }
    }
  };

  useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      await fetchProfileAndStats(active);
    };

    fetchAll();

    const handleStreakReload = () => {
      fetchProfileAndStats(true);
    };

    window.addEventListener('warrior-streak-updated', handleStreakReload);

    return () => {
      active = false;
      window.removeEventListener('warrior-streak-updated', handleStreakReload);
    };
  }, [userId, profileName]);

  const handleSymptomPainSaved = () => {
    setRefreshPain(prev => prev + 1);
    window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
    void fetchProfileAndStats(true);
  };

  const openTool = (tool: Exclude<HomeToolView, null>) => {
    setActiveTool(tool);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const closeTool = () => {
    setActiveTool(null);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const firstName = profileName.trim().split(/\s+/)[0] || 'Warrior';
  const currentHour = new Date().getHours();
  const t = APP_TRANSLATIONS[language] || APP_TRANSLATIONS.en;
  const greeting = currentHour < 12 ? t.greetingMorning : currentHour < 18 ? t.greetingAfternoon : t.greetingEvening;

  const toolTiles: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    accentClass: string;
    onClick: () => void;
  }> = [
    {
      id: 'checkin',
      title: 'Daily Check-in',
      description: 'Mood & energy',
      icon: <Smile size={22} />,
      accentClass: 'bg-wa-rose text-wa-crimson',
      onClick: () => openTool('checkin'),
    },
    {
      id: 'trends',
      title: 'Pain & Trends',
      description: 'Charts & patterns',
      icon: <TrendingUp size={22} />,
      accentClass: 'bg-wa-rose text-wa-crimson',
      onClick: () => openTool('trends'),
    },
    {
      id: 'reports',
      title: 'Doctor Report',
      description: '30-day summary',
      icon: <FileText size={22} />,
      accentClass: 'bg-wa-water-soft text-wa-water-ink dark:text-wa-water-bright',
      onClick: () => openTool('reports'),
    },
    {
      id: 'vault',
      title: 'Care Vault',
      description: 'PCV, E/U/Cr & labs',
      icon: <Shield size={22} />,
      accentClass: 'bg-wa-sun-soft text-wa-sun-ink dark:text-amber-300',
      onClick: () => openTool('vault'),
    },
    {
      id: 'reminders',
      title: 'Reminders',
      description: 'Water & meds alerts',
      icon: <Bell size={22} />,
      accentClass: 'bg-wa-water-soft text-wa-water-ink dark:text-wa-water-bright',
      onClick: () => openTool('reminders'),
    },
    {
      id: 'caregiver',
      title: 'Caregiver',
      description: 'Family SOS alerts',
      icon: <UserCheck size={22} />,
      accentClass: 'bg-wa-rose text-wa-crimson',
      onClick: () => openTool('caregiver'),
    },
    {
      id: 'weather',
      title: 'Weather & Logs',
      description: 'Triggers & history',
      icon: <CloudSun size={22} />,
      accentClass: 'bg-wa-sun-soft text-wa-sun-ink dark:text-amber-300',
      onClick: () => openTool('weather'),
    },
    {
      id: 'appointments',
      title: 'Appointments',
      description: 'Clinic & video visits',
      icon: <Calendar size={22} />,
      accentClass: 'bg-wa-water-soft text-wa-water-ink dark:text-wa-water-bright',
      onClick: () => onNavigate('care'),
    },
  ];

  const renderActiveTool = () => {
    if (!activeTool) return null;
    const meta = TOOL_META[activeTool];

    return (
      <div data-semantic className="space-y-5 pb-8">
        <div className="sticky top-0 z-20 -mx-4 border-b border-wa-line bg-wa-ground/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              data-ui-control
              onClick={closeTool}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-wa-line bg-wa-surface px-4 text-sm font-bold text-wa-plum shadow-xs transition-colors hover:bg-wa-rose/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Back to Home
            </button>
            <SosPill onClick={() => document.getElementById('emergency-fab')?.click()} />
          </div>
          <div className="mt-3">
            <h1 className="font-display text-xl font-extrabold text-wa-plum sm:text-2xl">{meta.title}</h1>
            <p className="text-xs text-wa-plum-muted sm:text-sm">{meta.subtitle}</p>
          </div>
        </div>

        {activeTool === 'hydration' && (
          <section id="water-intake-tracker-module" aria-label="Hydration">
            <WaterIntakeTracker userId={userId} />
          </section>
        )}

        {activeTool === 'medication' && (
          <section id="medication-reminder-card" aria-label="Medication">
            <MedicationReminder userId={userId} />
          </section>
        )}

        {activeTool === 'checkin' && (
          <section id="daily-check-in-card" aria-label="Daily check-in">
            <DailyMoodCheckIn userId={userId} onCheckInSaved={() => setRefreshPain(prev => prev + 1)} />
          </section>
        )}

        {activeTool === 'trends' && (
          <div className="space-y-6">
            <section id="pain-trends-chart-card" aria-label="Pain trends">
              <PainTrendsChart userId={userId} refreshKey={refreshPain} />
            </section>
            <section aria-label="Mood and hydration trends">
              <MoodHydrationTrendsChart userId={userId} refreshTrigger={refreshPain} />
            </section>
          </div>
        )}

        {activeTool === 'reports' && (
          <section aria-label="Generated reports">
            <PatternInsightsDoctorReport userId={userId} />
          </section>
        )}

        {activeTool === 'reminders' && (
          <section aria-label="Scheduled reminders">
            <ScheduledRemindersManager userId={userId} />
          </section>
        )}

        {activeTool === 'caregiver' && (
          <section aria-label="Caregiver tools">
            <DesignatedCaregiverWidget userId={userId} currentPainLevel={currentPainLevel} />
          </section>
        )}

        {activeTool === 'vault' && (
          <section id="care-vault-section" aria-label="Care Vault">
            <CareVault userId={userId} />
          </section>
        )}

        {activeTool === 'weather' && (
          <div className="space-y-5">
            <WeatherCard />
            <RecentHealthSummary userId={userId} refreshKey={refreshPain} />
            <UpcomingAppointmentCard userId={userId} onOpenCare={() => onNavigate('care')} />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {activeTool ? (
        renderActiveTool()
      ) : (
        <div data-semantic className="space-y-5 pb-8">
          <header className="rounded-b-[36px] bg-[var(--wa-hero)] text-white px-5 pt-5 pb-11 sm:px-6 sm:pt-6 sm:pb-12 lg:px-7 relative overflow-hidden -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
            <div aria-hidden="true" className="absolute -right-12 -top-6 w-48 h-60 opacity-[0.07] pointer-events-none text-wa-coral">
              <svg viewBox="14 2 72 96" className="w-full h-full fill-current">
                <path fillRule="evenodd" d="M50 6C50 6 82 42 82 63A32 32 0 0 1 18 63C18 42 50 6 50 6ZM50 40L44.5 56.5L28 62L44.5 67.5L50 84L55.5 67.5L72 62L55.5 56.5Z" />
              </svg>
            </div>
            <div className="relative">
              <div className="flex min-h-11 items-center justify-between gap-3">
                <p className="text-xs font-semibold text-wa-on-plum-muted sm:text-small">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <SosPill className="md:hidden" onClick={() => document.getElementById('emergency-fab')?.click()} />
              </div>
              <h1 className="mt-1 text-[1.65rem] font-extrabold leading-tight tracking-[-0.02em] text-white text-balance sm:text-[2.1rem] lg:text-[2.4rem] font-display">
                {greeting}, {firstName}
              </h1>
              <div className="mt-3 inline-flex min-h-7 items-center gap-1.5 rounded-full bg-wa-coral/20 px-3 py-1 text-[12px] font-semibold text-[#FFC7D0]">
                <Spark className="w-3 h-3 shrink-0 text-wa-coral" />
                <span>{streakDays > 0 ? `${streakDays}-${t.dayLoggingStreak}` : t.startLoggingStreak}</span>
              </div>
            </div>
          </header>

          {/* Floating Snapshot Card overlapping the Plum Hero edge */}
          <div className="-mt-8 relative z-10">
            <TodaysHealthCard
              userId={userId}
              refreshKey={refreshPain}
              onLogPain={() => setIsModalOpen(true)}
              onStartCheckIn={() => openTool('checkin')}
              onReviewMeds={() => openTool('medication')}
            />
          </div>

          <WelcomeGuide />

          {/* Step 2: Primary Quick Action Icons */}
          <HomeActionHub
            onLogHealth={() => setIsModalOpen(true)}
            onAddWater={() => openTool('hydration')}
            onReviewMedication={() => openTool('medication')}
            onOpenMira={() => onNavigate('chat')}
            onOpenCare={() => onNavigate('care')}
          />

          {/* Step 3: Health Tools & Records Icon Grid (each opens full page with Back to Home) */}
          <section aria-label="Health tools and records" className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-[16px] font-bold text-wa-plum dark:text-white">
                Health tools &amp; records
              </h2>
              <span className="text-[12px] font-medium text-wa-plum-muted">
                Tap any icon to open
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {toolTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  data-ui-control
                  onClick={tile.onClick}
                  className="flex flex-col items-start gap-2.5 rounded-[22px] border border-wa-line bg-wa-surface p-4 text-left shadow-xs transition-all hover:border-wa-crimson/40 hover:bg-wa-rose/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${tile.accentClass}`}
                  >
                    {tile.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="block font-display text-sm font-bold text-wa-plum">
                      {tile.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-wa-plum-muted">
                      {tile.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Compact Bottom Strip: Urgent Help + Tip + Privacy */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section aria-labelledby="crisis-help-title" className="rounded-[24px] border border-medical-100/70 bg-medical-50 p-5 shadow-subtle dark:border-medical-700/40 dark:bg-medical-900/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-action-accent shadow-subtle dark:bg-medical-950/70 dark:text-medical-200">
                    <LifeBuoy size={20} />
                  </span>
                  <div className="min-w-0">
                    <h2 id="crisis-help-title" className="text-base font-bold text-wa-plum dark:text-white">{t.needUrgentHelp}</h2>
                    <p className="mt-0.5 text-xs text-wa-plum-muted dark:text-wa-on-plum-muted">{t.urgentHelpSub}</p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  className="shrink-0"
                  onClick={() => document.getElementById('emergency-fab')?.click()}
                >
                  {t.getHelpBtn}
                </Button>
              </div>
            </section>

            <div className="rounded-[24px] bg-wa-rose p-5 flex gap-3.5 items-start justify-between text-wa-plum border border-wa-line-soft dark:border-white/10">
              <div className="flex gap-3.5 items-start min-w-0">
                <Spark className="w-6 h-6 text-wa-crimson shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-display font-bold text-[14px] text-wa-plum dark:text-white">{t.warriorTipTitle}</div>
                  <div className="text-[13px] leading-relaxed mt-0.5 text-wa-plum/90 dark:text-white/90">
                    {t.warriorTipBody}
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Listen to warrior tip"
                onClick={() => {
                  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(`${t.warriorTipTitle}. ${t.warriorTipBody}`);
                  utterance.rate = 0.95;
                  utterance.lang =
                    language === 'yo'
                      ? 'yo-NG'
                      : language === 'ha'
                      ? 'ha-NG'
                      : language === 'ig'
                      ? 'ig-NG'
                      : language === 'pcm'
                      ? 'en-NG'
                      : 'en-US';
                  window.speechSynthesis.speak(utterance);
                }}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-wa-line bg-wa-surface px-3 text-xs font-bold text-wa-plum shadow-2xs transition hover:border-wa-crimson hover:text-wa-crimson cursor-pointer"
                title="Listen to guidance (Voice Note)"
              >
                <Volume2 size={14} className="text-wa-crimson" aria-hidden="true" />
                <span>Listen</span>
              </button>
            </div>
          </div>

          <section aria-labelledby="privacy-ethics-title" className="rounded-[20px] bg-wa-ground/60 dark:bg-white/5 p-3.5 border border-wa-line-soft/80 dark:border-white/10 text-wa-plum dark:text-white flex items-start gap-3">
            <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={18} />
            </span>
            <div className="min-w-0">
              <h2 id="privacy-ethics-title" className="text-[12px] font-bold">Privacy &amp; Clinical Data Ethics</h2>
              <p className="text-[11px] leading-relaxed text-wa-plum-muted dark:text-wa-on-plum-muted mt-0.5">
                Your personal health logs, symptom records, and pain trends are stored with patient privacy safeguards. Your data is never sold or shared without your explicit consent.
              </p>
            </div>
          </section>
        </div>
      )}

      <SymptomPainCheckIn
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        userId={userId}
        onPainChange={setCurrentPainLevel}
        onSaved={handleSymptomPainSaved}
      />
    </>
  );
};

export default Dashboard;
