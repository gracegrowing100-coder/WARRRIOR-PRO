import React, { useState, useEffect } from 'react';
import { ChevronDown, LifeBuoy, ShieldCheck, TrendingUp, FileText, Bell, UserCheck, Heart, Shield } from 'lucide-react';
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

interface DashboardProps {
  onNavigate: (to: Page) => void;
  userId: string;
}

const ExpandableTool: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <details className="group" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between py-3 text-small font-bold text-wa-plum dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson">
        <span className="flex items-center gap-2.5">
          {icon && <span className="text-wa-crimson">{icon}</span>}
          <span>{title}</span>
        </span>
        <ChevronDown size={18} className="text-wa-plum-muted dark:text-wa-on-plum-muted transition-transform group-open:rotate-180 shrink-0" aria-hidden="true" />
      </summary>
      {open ? <div className="pb-4">{children}</div> : null}
    </details>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userId }) => {
  const [profileName, setProfileName] = useState<string>("Warrior");
  const [refreshPain, setRefreshPain] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPainLevel, setCurrentPainLevel] = useState<number>(3);
  const [streakDays, setStreakDays] = useState<number>(12);

  const fetchProfileAndStats = async (active = true) => {
    let pName = "Warrior";

    try {
      // Calculate/retrieve up-to-date daily streak first
      const s = await firebaseService.updateStreak(userId);
      if (typeof s === 'number') {
        setStreakDays(s);
      }
    } catch (e) {
      console.warn("Failed to update streak count on startup:", e);
    }

    if (userId) {
      try {
        const p = await firebaseService.getUserProfile(userId);
        if (p && active) {
          pName = p.displayName || "Warrior";
          setProfileName(pName);
        } else {
          const currentUser = auth.currentUser;
          if (currentUser && active) {
            pName = currentUser.displayName || "Warrior";
            setProfileName(pName);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch user profile:", e);
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

  const scrollToHomeSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const reducedMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    const firstControl = section.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    firstControl?.focus({ preventScroll: true });
  };

  const firstName = profileName.trim().split(/\s+/)[0] || 'Warrior';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div data-semantic className="space-y-7 pb-8 sm:space-y-8 lg:space-y-9">
      <header className="rounded-b-[32px] bg-[var(--wa-hero)] text-white p-5 sm:p-6 lg:p-7 relative overflow-hidden -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 mb-2">
        <div aria-hidden="true" className="absolute -right-12 -top-6 w-48 h-60 opacity-[0.07] pointer-events-none text-wa-coral">
          <svg viewBox="14 2 72 96" className="w-full h-full fill-current">
            <path fillRule="evenodd" d="M50 6C50 6 82 42 82 63A32 32 0 0 1 18 63C18 42 50 6 50 6ZM50 40L44.5 56.5L28 62L44.5 67.5L50 84L55.5 67.5L72 62L55.5 56.5Z" />
          </svg>
        </div>
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-small font-semibold text-wa-on-plum-muted">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="mt-1 text-[1.85rem] font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-[2.2rem] lg:text-[2.5rem] font-display">
              {greeting}, {firstName}
            </h1>
            <div className="mt-3 inline-flex items-center gap-1.5 h-[30px] px-3 rounded-full bg-wa-coral/20 text-[#FFC7D0] text-[13px] font-semibold">
              <Spark className="w-3 h-3 text-wa-coral" />
              <span>{streakDays > 0 ? `${streakDays}-day logging streak` : 'Start your logging streak today'}</span>
            </div>
            <p className="mt-3 max-w-sm text-[14px] leading-snug text-wa-on-plum-muted">
              Your daily health companion. Start with a quick check-in below.
            </p>
          </div>
          <SosPill className="md:hidden" onClick={() => document.getElementById('emergency-fab')?.click()} />
        </div>
      </header>

      <WelcomeGuide />

      <TodaysHealthCard
        userId={userId}
        refreshKey={refreshPain}
        onStartCheckIn={() => scrollToHomeSection('daily-check-in-card')}
      />

      <div className="grid grid-cols-1 gap-6 lg:gap-7 xl:grid-cols-[minmax(0,3fr)_minmax(19rem,1fr)] xl:items-start xl:gap-8">
        <div className="contents xl:col-start-1 xl:row-start-1 xl:flex xl:min-w-0 xl:flex-col xl:gap-8">
          <section id="daily-check-in-card" aria-label="Daily check-in" className="order-4 min-w-0 scroll-mt-24 xl:order-none">
            <DailyMoodCheckIn compact userId={userId} onCheckInSaved={() => setRefreshPain(prev => prev + 1)} />
          </section>

          <section id="water-intake-tracker-module" aria-label="Hydration" className="order-2 min-w-0 scroll-mt-24 xl:order-none">
            <WaterIntakeTracker compact userId={userId} />
          </section>

          <section id="medication-reminder-card" aria-label="Medication" className="order-3 min-w-0 scroll-mt-24 xl:order-none">
            <MedicationReminder compact userId={userId} />
          </section>

          <div className="order-5 min-w-0 xl:order-none">
            <UpcomingAppointmentCard userId={userId} onOpenCare={() => onNavigate('care')} />
          </div>
        </div>

        <aside aria-label="Home shortcuts and support" className="contents xl:col-start-2 xl:row-start-1 xl:flex xl:min-w-0 xl:flex-col xl:gap-8">
          <div className="order-1 xl:order-none">
            <HomeActionHub
              onLogHealth={() => setIsModalOpen(true)}
              onAddWater={() => scrollToHomeSection('water-intake-tracker-module')}
              onReviewMedication={() => scrollToHomeSection('medication-reminder-card')}
              onOpenMira={() => onNavigate('chat')}
              onOpenCare={() => onNavigate('care')}
            />
          </div>

          <section aria-labelledby="crisis-help-title" className="order-7 rounded-card border border-medical-100/70 bg-medical-50 p-5 shadow-subtle dark:border-medical-700/40 dark:bg-medical-900/20 sm:p-6 xl:order-none">
            <div className="flex h-full min-h-[13rem] flex-col gap-5">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-white text-action-accent shadow-subtle dark:bg-medical-950/70 dark:text-medical-200">
                  <LifeBuoy size={21} />
                </span>
                <div>
                  <h2 id="crisis-help-title" className="text-heading-2">Need urgent help?</h2>
                  <p className="mt-1 max-w-prose text-small text-foreground-secondary">Open your existing emergency information and contact options.</p>
                </div>
              </div>
              <Button
                variant="danger"
                size="lg"
                leadingIcon={<LifeBuoy size={19} />}
                className="mt-auto w-full shrink-0"
                onClick={() => document.getElementById('emergency-fab')?.click()}
              >
                Get help
              </Button>
            </div>
          </section>

          <div className="order-6 min-w-0 xl:order-none">
            <RecentHealthSummary userId={userId} refreshKey={refreshPain} />
          </div>

          <div className="order-8 min-w-0 xl:order-none">
            <WeatherCard />
          </div>

          <div className="order-9 min-w-0 xl:order-none">
            <div className="rounded-[28px] bg-wa-rose p-[18px] flex gap-3.5 items-start text-wa-plum border border-wa-line-soft dark:border-white/10">
              <Spark className="w-7 h-7 text-wa-crimson shrink-0 mt-0.5" />
              <div>
                <div className="font-display font-bold text-[15px] text-wa-plum dark:text-white">Warrior tip</div>
                <div className="text-[14px] leading-relaxed mt-1 text-wa-plum/90 dark:text-white/90">
                  Keep a small &ldquo;flare bag&rdquo; ready: water, warm socks, your medicines and your clinic card.
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <details className="group">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-control px-4 py-3 text-body font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 sm:px-5">
          <span>
            More health tools
            <span className="mt-0.5 block text-small font-normal text-foreground-secondary">Secondary tools — open only what you need</span>
          </span>
          <ChevronDown className="shrink-0 text-foreground-secondary group-open:rotate-180" size={20} aria-hidden="true" />
        </summary>
        <div className="divide-y divide-line/50 border-t border-line/40 px-4 sm:px-5">
          {[
            { title: 'Mood and hydration trends', icon: <TrendingUp size={16} />, content: <MoodHydrationTrendsChart userId={userId} refreshTrigger={refreshPain} /> },
            { title: 'Generated reports', icon: <FileText size={16} />, content: <PatternInsightsDoctorReport userId={userId} /> },
            { title: 'Scheduled reminders', icon: <Bell size={16} />, content: <ScheduledRemindersManager userId={userId} /> },
            { title: 'Caregiver tools', icon: <UserCheck size={16} />, content: <DesignatedCaregiverWidget userId={userId} currentPainLevel={currentPainLevel} /> },
            { title: 'Pain trends', icon: <Heart size={16} />, content: <section id="pain-trends-chart-card" aria-label="Pain trends"><PainTrendsChart userId={userId} refreshKey={refreshPain} /></section> },
            { title: 'Care Vault', icon: <Shield size={16} />, content: <section id="care-vault-section" aria-label="Care Vault"><CareVault userId={userId} /></section> },
          ].map(tool => <ExpandableTool key={tool.title} title={tool.title} icon={tool.icon}>{tool.content}</ExpandableTool>)}
        </div>
      </details>

      {/* Patient Privacy & Data Ethics Notice */}
      <section aria-labelledby="privacy-ethics-title" className="rounded-[22px] bg-wa-ground/60 dark:bg-white/5 p-4 border border-wa-line-soft/80 dark:border-white/10 text-wa-plum dark:text-white flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck size={20} />
        </span>
        <div className="min-w-0">
          <h2 id="privacy-ethics-title" className="text-[13px] font-bold">Privacy & Clinical Data Ethics</h2>
          <p className="text-[12px] leading-relaxed text-wa-plum-muted dark:text-wa-on-plum-muted mt-0.5">
            Your personal health logs, symptom records, and pain trends are stored with patient privacy safeguards. Your data is never sold or shared without your explicit consent.
          </p>
        </div>
      </section>
      <SymptomPainCheckIn
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        userId={userId}
        onPainChange={setCurrentPainLevel}
        onSaved={handleSymptomPainSaved}
      />
    </div>
  );
};

export default Dashboard;
