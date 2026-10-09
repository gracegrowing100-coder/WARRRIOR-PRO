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
    <div data-semantic className="space-y-5 pb-4 sm:space-y-6">
      <header className="px-1 pb-1">
        <p className="text-small font-semibold text-action-accent">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mt-1 text-heading-1 text-foreground">{greeting}, {firstName}</h1>
        <p className="mt-1 max-w-2xl text-body text-foreground-secondary">Your health, routines, and next steps for today.</p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)] lg:items-stretch">
        <TodaysHealthCard
          userId={userId}
          refreshKey={refreshPain}
          onStartCheckIn={() => scrollToHomeSection('daily-check-in-card')}
        />
        <section id="daily-check-in-card" aria-label="Daily check-in" className="min-w-0 scroll-mt-24">
          <DailyMoodCheckIn compact userId={userId} onCheckInSaved={() => setRefreshPain(prev => prev + 1)} />
        </section>
      </div>

      <HomeActionHub
        onLogHealth={() => setIsModalOpen(true)}
        onAddWater={() => scrollToHomeSection('water-intake-tracker-module')}
        onReviewMedication={() => scrollToHomeSection('medication-reminder-card')}
        onOpenMira={() => onNavigate('chat')}
        onOpenCare={() => onNavigate('care')}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <section id="water-intake-tracker-module" aria-label="Hydration" className="scroll-mt-24">
          <WaterIntakeTracker compact userId={userId} />
        </section>
        <section id="medication-reminder-card" aria-label="Medication" className="scroll-mt-24">
          <MedicationReminder compact userId={userId} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <RecentHealthSummary userId={userId} refreshKey={refreshPain} />
        <UpcomingAppointmentCard userId={userId} onOpenCare={() => onNavigate('care')} />
      </div>

      <section aria-labelledby="crisis-help-title" className="rounded-card border border-medical-100/60 bg-medical-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="crisis-help-title" className="text-heading-2">Need urgent help?</h2>
            <p className="mt-1 max-w-prose text-small text-foreground-secondary">Open your existing emergency information and contact options.</p>
          </div>
          <Button
            variant="danger"
            size="lg"
            leadingIcon={<LifeBuoy size={19} />}
            className="shrink-0"
            onClick={() => document.getElementById('emergency-fab')?.click()}
          >
            Get help
          </Button>
        </div>
      </section>

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
