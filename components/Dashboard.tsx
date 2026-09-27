import React, { useState, useEffect } from 'react';
import { ChevronDown, Heart, LifeBuoy } from 'lucide-react';
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
import { RecentHealthSummary, TodaysHealthCard, UpcomingAppointmentCard } from './home';
import { Button, Card } from './ui';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';

interface DashboardProps {
  onNavigate: (to: Page) => void;
  userId: string;
}

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

  return (
    <div data-semantic className="space-y-6 pb-4">
      <header className="space-y-1 px-1">
        <p className="text-small font-medium text-foreground-secondary">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-heading-1 text-foreground">Welcome back, {profileName}</h1>
        <p className="max-w-2xl text-body text-foreground-secondary">Here is what you have recorded and what you can do today.</p>
      </header>

      <TodaysHealthCard userId={userId} refreshKey={refreshPain} />

      <section aria-label="Daily check-in">
        <DailyMoodCheckIn compact userId={userId} onCheckInSaved={() => setRefreshPain(prev => prev + 1)} />
      </section>

      <Card as="section" aria-labelledby="pain-symptoms-title" className="border-line/70 shadow-none" padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="pain-symptoms-title" className="text-heading-2">Pain &amp; symptoms</h2>
            <p className="mt-1 max-w-prose text-small text-foreground-secondary">Record pain, symptoms, possible triggers, and related water intake in one check-in.</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            leadingIcon={<Heart size={19} />}
            className="shrink-0"
            onClick={() => setIsModalOpen(true)}
          >
            Log symptoms and pain
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <section id="water-intake-tracker-module" aria-label="Hydration">
          <WaterIntakeTracker compact userId={userId} />
        </section>
        <section id="medication-reminder-card" aria-label="Medication">
          <MedicationReminder compact userId={userId} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <RecentHealthSummary userId={userId} refreshKey={refreshPain} />
        <UpcomingAppointmentCard userId={userId} onOpenCare={() => onNavigate('care')} />
      </div>

      <Card as="section" aria-labelledby="crisis-help-title" className="border-line/70 shadow-none" padding="lg">
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
      </Card>

      <details className="group rounded-card border border-line bg-surface">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-card px-4 py-3 text-body font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 sm:px-5">
          <span>
            More health tools
            <span className="mt-0.5 block text-small font-normal text-foreground-secondary">Secondary tools — open only what you need</span>
          </span>
          <ChevronDown className="shrink-0 text-foreground-secondary group-open:rotate-180" size={20} aria-hidden="true" />
        </summary>
        <div className="divide-y divide-line border-t border-line px-4 sm:px-5">
          {[
            { title: 'Health guidance', content: <HealthTipsWisdom userName={profileName} userRole="Warrior" /> },
            { title: 'Mood and hydration trends', content: <MoodHydrationTrendsChart userId={userId} refreshTrigger={refreshPain} /> },
            { title: 'Generated reports', content: <PatternInsightsDoctorReport userId={userId} /> },
            { title: 'Scheduled reminders', content: <ScheduledRemindersManager userId={userId} /> },
            { title: 'Caregiver tools', content: <DesignatedCaregiverWidget currentPainLevel={currentPainLevel} /> },
            { title: 'Pain trends', content: <section id="pain-trends-chart-card" aria-label="Pain trends"><PainTrendsChart userId={userId} refreshKey={refreshPain} /></section> },
            { title: 'Care Vault', content: <section id="care-vault-section" aria-label="Care Vault"><CareVault userId={userId} /></section> },
          ].map(tool => <details key={tool.title}>
            <summary className="min-h-12 cursor-pointer py-3 text-small font-semibold focus-visible:outline focus-visible:outline-focus">{tool.title}</summary>
            <div className="pb-4">{tool.content}</div>
          </details>)}
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
