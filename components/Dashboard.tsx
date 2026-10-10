import React, { useState, useEffect } from 'react';
import { ChevronDown, LifeBuoy } from 'lucide-react';
import { Page } from '../App';
import { WaterIntakeTracker } from './WaterIntakeTracker';
import { MedicationReminder } from './MedicationReminder';
import { PainTrendsChart } from './PainTrendsChart';
import { CareVault } from './CareVault';
import { DesignatedCaregiverWidget } from './DesignatedCaregiverWidget';
import { HealthTipsWisdom } from './HealthTipsWisdom';
import { DailyMoodCheckIn } from './DailyMoodCheckIn';
import { MoodHydrationTrendsChart } from './MoodHydrationTrendsChart';
import { ScheduledRemindersManager } from './ScheduledRemindersManager';
import { PatternInsightsDoctorReport } from './PatternInsightsDoctorReport';
import { SymptomPainCheckIn } from './health';
import { HomeActionHub, RecentHealthSummary, TodaysHealthCard, UpcomingAppointmentCard } from './home';
import { Button } from './ui';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';

interface DashboardProps {
  onNavigate: (to: Page) => void;
  userId: string;
}

const ExpandableTool: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary className="min-h-12 cursor-pointer py-3 text-small font-semibold focus-visible:outline focus-visible:outline-focus">{title}</summary>
      {open ? <div className="pb-4">{children}</div> : null}
    </details>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userId }) => {
  const [profileName, setProfileName] = useState<string>("Warrior");
  const [refreshPain, setRefreshPain] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPainLevel, setCurrentPainLevel] = useState<number>(3);

  const fetchProfileAndStats = async (active = true) => {
    let pName = "Warrior";

    try {
      // Calculate/retrieve up-to-date daily streak first
      await firebaseService.updateStreak(userId);
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
      <header className="px-1 pb-1 lg:pt-2">
        <p className="text-small font-bold uppercase tracking-[0.08em] text-action-accent">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mt-2 max-w-3xl text-[1.9rem] font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-[2.25rem] lg:text-[2.65rem]">{greeting}, {firstName}</h1>
        <p className="mt-2 max-w-2xl text-body text-foreground-secondary sm:text-lg">Your health, routines, and next steps for today.</p>
      </header>

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
            { title: 'Health guidance', content: <HealthTipsWisdom userName={profileName} userRole="Warrior" /> },
            { title: 'Mood and hydration trends', content: <MoodHydrationTrendsChart userId={userId} refreshTrigger={refreshPain} /> },
            { title: 'Generated reports', content: <PatternInsightsDoctorReport userId={userId} /> },
            { title: 'Scheduled reminders', content: <ScheduledRemindersManager userId={userId} /> },
            { title: 'Caregiver tools', content: <DesignatedCaregiverWidget userId={userId} currentPainLevel={currentPainLevel} /> },
            { title: 'Pain trends', content: <section id="pain-trends-chart-card" aria-label="Pain trends"><PainTrendsChart userId={userId} refreshKey={refreshPain} /></section> },
            { title: 'Care Vault', content: <section id="care-vault-section" aria-label="Care Vault"><CareVault userId={userId} /></section> },
          ].map(tool => <ExpandableTool key={tool.title} title={tool.title}>{tool.content}</ExpandableTool>)}
        </div>
      </details>
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
