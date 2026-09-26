import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, ChevronDown, Droplets, Heart, LifeBuoy, MapPin, Minus, Phone, Plus } from 'lucide-react';
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
import { RecentHealthSummary, TodaysHealthCard, UpcomingAppointmentCard } from './home';
import { Button, Card, Modal } from './ui';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';

interface DashboardProps {
  onNavigate: (to: Page) => void;
  userId: string;
}

const TRIGGER_OPTIONS = [
  'Cold weather',
  'Stress',
  'Infection',
  'Low fluid intake'
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userId }) => {
  const [profileName, setProfileName] = useState<string>("Warrior");
  const [refreshPain, setRefreshPain] = useState<number>(0);

  // Quick Log Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickPain, setQuickPain] = useState<number>(3);
  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([]);
  const [quickTriggers, setQuickTriggers] = useState<string[]>([]);
  const [quickWater, setQuickWater] = useState<number>(1.0); // Liters logged inside symptom log
  const [isSaving, setIsSaving] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string | null>(null);
  const painRangeRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD

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

  const handleTriggerToggle = (trigger: string) => {
    if (quickTriggers.includes(trigger)) {
      setQuickTriggers(prev => prev.filter(t => t !== trigger));
    } else {
      setQuickTriggers(prev => [...prev, trigger]);
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    if (quickSymptoms.includes(symptom)) {
      setQuickSymptoms(prev => prev.filter(s => s !== symptom));
    } else {
      setQuickSymptoms(prev => [...prev, symptom]);
    }
  };

  const handleSaveQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await firebaseService.addSymptomLog(userId, quickPain, quickSymptoms, quickTriggers, quickWater, todayStr);
      
      // Play beautiful audio validation chord
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
      } catch (err) {}

      // Refresh pain trends and streak trackers
      setRefreshPain(prev => prev + 1);

      // Trigger standard hydration event and streak refresh
      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));

      setModalSuccessMsg("Symptom log recorded and synchronized successfully!");
      fetchProfileAndStats(true);

      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccessMsg(null);
        setQuickSymptoms([]);
        setQuickTriggers([]);
        setQuickWater(1.0);
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const getSymptomLabel = (val: number) => {
    if (val <= 3) return { text: "1-3 Mild Pain", color: "border-status-success/30 bg-status-success-soft text-status-success-text" };
    if (val <= 6) return { text: "4-6 Moderate Pain", color: "border-status-warning/30 bg-status-warning-soft text-status-warning-text" };
    return { text: "7-10 Severe Pain crisis!", color: "border-status-danger/40 bg-status-danger-soft text-status-danger-text" };
  };

  return (
    <div data-semantic className="space-y-5 pb-4">
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

      <Card as="section" aria-labelledby="pain-symptoms-title" padding="lg">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section id="water-intake-tracker-module" aria-label="Hydration">
          <WaterIntakeTracker compact userId={userId} />
        </section>
        <section id="medication-reminder-card" aria-label="Medication">
          <MedicationReminder compact userId={userId} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentHealthSummary userId={userId} refreshKey={refreshPain} />
        <UpcomingAppointmentCard userId={userId} onOpenCare={() => onNavigate('care')} />
      </div>

      <Card as="section" aria-labelledby="crisis-help-title" padding="lg">
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
            { title: 'Caregiver tools', content: <DesignatedCaregiverWidget currentPainLevel={quickPain} /> },
            { title: 'Pain trends', content: <section id="pain-trends-chart-card" aria-label="Pain trends"><PainTrendsChart userId={userId} refreshKey={refreshPain} /></section> },
            { title: 'Care Vault', content: <section id="care-vault-section" aria-label="Care Vault"><CareVault userId={userId} /></section> },
          ].map(tool => <details key={tool.title}>
            <summary className="min-h-12 cursor-pointer py-3 text-small font-semibold focus-visible:outline focus-visible:outline-focus">{tool.title}</summary>
            <div className="pb-4">{tool.content}</div>
          </details>)}
        </div>
      </details>


      <Modal
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) setIsModalOpen(false);
        }}
        title="Log symptoms and pain"
        description="Record pain, symptoms, possible triggers, and related water intake."
        closeLabel="Close symptom and pain log"
        initialFocusRef={painRangeRef}
        size="lg"
        dismissOnBackdrop={!isSaving}
        contentClassName="space-y-6"
        footer={!modalSuccessMsg ? (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              fullWidth
              disabled={isSaving}
              onClick={() => setIsModalOpen(false)}
              className="sm:w-auto sm:min-w-32"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="symptom-pain-form"
              variant="accent"
              fullWidth
              loading={isSaving}
              loadingLabel="Syncing..."
              className="sm:w-auto sm:min-w-44"
            >
              Save Log Entries
            </Button>
          </div>
        ) : undefined}
      >
        {modalSuccessMsg ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-10 text-center" role="status">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-success-soft text-status-success">
              <Check className="h-8 w-8" strokeWidth={3} aria-hidden="true" />
            </div>
            <h3 className="text-heading-3 text-foreground">{modalSuccessMsg}</h3>
            <p className="max-w-sm text-small text-foreground-secondary">
              Your pain trend logs, cellular wellness indicators, and water metrics have been stored securely.
            </p>
          </div>
        ) : (
          <form id="symptom-pain-form" onSubmit={handleSaveQuickLog} className="space-y-7">
            <section aria-labelledby="pain-level-heading" className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id="pain-level-heading" className="text-heading-3 text-foreground">Pain level</h3>
                  <p className="mt-1 text-small text-foreground-secondary">Choose a point or use the slider from 1 to 10.</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-caption font-semibold ${getSymptomLabel(quickPain).color}`}>
                  {quickPain <= 3 ? '1-3 Mild' : quickPain <= 6 ? '4-6 Moderate' : '7-10 Severe'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  { val: 2, desc: 'No Hurt' },
                  { val: 4, desc: 'Hurts Little' },
                  { val: 6, desc: 'Even More' },
                  { val: 8, desc: 'Much More' },
                  { val: 10, desc: 'Worst Pain' }
                ].map((item) => {
                  const isSelected = Math.abs(quickPain - item.val) <= 1;
                  return (
                    <button
                      type="button"
                      key={item.val}
                      aria-pressed={isSelected}
                      onClick={() => setQuickPain(item.val)}
                      className={`flex min-h-16 flex-col items-center justify-center rounded-control border px-2 py-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
                        isSelected
                          ? 'border-action bg-action text-foreground-inverse'
                          : 'border-line-strong bg-surface text-foreground hover:bg-surface-subtle'
                      }`}
                    >
                      <span className="text-lg font-bold">{item.val}</span>
                      <span className="text-caption">{item.desc}</span>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-card border border-line bg-surface-subtle p-4">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <label htmlFor="quick-pain-range" className="text-small font-semibold text-foreground">Pain score</label>
                  <output htmlFor="quick-pain-range" className="text-heading-3 text-foreground">{quickPain}<span className="text-small font-medium text-foreground-secondary"> / 10</span></output>
                </div>
                <input
                  ref={painRangeRef}
                  id="quick-pain-range"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={quickPain}
                  onChange={(e) => setQuickPain(parseInt(e.target.value))}
                  className="h-11 w-full cursor-pointer accent-action-accent"
                />
              </div>

              <div className={`rounded-card border p-4 text-small leading-relaxed ${getSymptomLabel(quickPain).color}`}>
                <p className="font-semibold">{getSymptomLabel(quickPain).text}</p>
                <p className="mt-1">
                  {quickPain <= 3
                    ? "Comfortable baseline. Keep warmth optimal and fluids actively flowing."
                    : quickPain <= 6
                    ? "Friction detected. Rest completely, increase hydration immediately, and stay warm."
                    : "Severe pain detected. Rest immediately. Initiate your personalized sickle cell emergency plan."}
                </p>
              </div>
            </section>

            {(quickPain >= 8 || (quickSymptoms.includes("Fever") && quickPain >= 7)) && (
              <section aria-labelledby="crisis-alert-title" className="space-y-4 rounded-card border border-status-danger/50 bg-status-danger-soft p-5 text-status-danger-text">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
                  <div>
                    <h3 id="crisis-alert-title" className="text-body font-bold">Critical crisis alert triggered</h3>
                    <p className="mt-1 text-small">
                      You logged a pain level of <strong>{quickPain}/10</strong> {quickSymptoms.includes("Fever") ? 'along with active Fever' : ''}. This can indicate an active vaso-occlusive crisis (VOC) or severe infection.
                    </p>
                    <p className="mt-2 text-small font-semibold">
                      Action Recommended: Contact your hematologist or healthcare physician immediately, or visit the nearest emergency room.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <a href="tel:+1234567890" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control bg-status-danger px-4 text-small font-semibold text-white">
                    <Phone size={18} aria-hidden="true" /> Call Dr. Specialist
                  </a>
                  <button
                    type="button"
                    onClick={() => alert("Directing to nearest Medical Center. Keep warm during transport!")}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control border border-status-danger/50 bg-surface px-4 text-small font-semibold text-status-danger-text"
                  >
                    <MapPin size={18} aria-hidden="true" /> Nearest Emergency Center
                  </button>
                </div>
              </section>
            )}

            <fieldset className="space-y-3">
              <legend className="text-heading-3 text-foreground">Active symptoms</legend>
              <p className="text-small text-foreground-secondary">Select every symptom that applies.</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  'Dactylitis (hand-foot swelling)',
                  'Fatigue',
                  'Jaundice (yellowing eyes/skin)',
                  'Fever',
                  'Shortness of Breath',
                  'Dehydration'
                ].map((sym) => {
                  const isChecked = quickSymptoms.includes(sym);
                  return (
                    <button
                      type="button"
                      key={sym}
                      aria-pressed={isChecked}
                      onClick={() => handleSymptomToggle(sym)}
                      className={`flex min-h-11 items-center gap-3 rounded-control border px-4 py-3 text-left text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
                        isChecked
                          ? 'border-action bg-action text-foreground-inverse'
                          : 'border-line-strong bg-surface text-foreground hover:bg-surface-subtle'
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isChecked ? 'border-foreground-inverse bg-foreground-inverse text-action' : 'border-line-strong bg-surface text-transparent'}`}>
                        <Check className="h-3 w-3" strokeWidth={4} aria-hidden="true" />
                      </span>
                      <span>{sym}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-heading-3 text-foreground">Possible triggers</legend>
              <p className="text-small text-foreground-secondary">Select any possible trigger you noticed.</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TRIGGER_OPTIONS.map((trigger) => {
                  const isChecked = quickTriggers.includes(trigger);
                  return (
                    <button
                      type="button"
                      key={trigger}
                      aria-pressed={isChecked}
                      onClick={() => handleTriggerToggle(trigger)}
                      className={`flex min-h-11 items-center gap-3 rounded-control border px-4 py-3 text-left text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
                        isChecked
                          ? 'border-action bg-action text-foreground-inverse'
                          : 'border-line-strong bg-surface text-foreground hover:bg-surface-subtle'
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isChecked ? 'border-foreground-inverse bg-foreground-inverse text-action' : 'border-line-strong bg-surface text-transparent'}`}>
                        <Check className="h-3 w-3" strokeWidth={4} aria-hidden="true" />
                      </span>
                      <span>{trigger}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <section aria-labelledby="water-with-symptoms-heading" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 id="water-with-symptoms-heading" className="text-heading-3 text-foreground">Water intake</h3>
                  <p className="mt-1 text-small text-foreground-secondary">Logged with this symptom entry.</p>
                </div>
                <span className="inline-flex items-center gap-2 text-small font-semibold text-status-info-text">
                  <Droplets size={18} aria-hidden="true" /> {quickWater.toFixed(2)} L / {Math.round(quickWater * 33.8)} oz
                </span>
              </div>

              <div className="flex flex-col gap-4 rounded-card border border-status-info/25 bg-status-info-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    aria-label="Decrease water by 250 milliliters"
                    onClick={() => setQuickWater(prev => Math.max(0.0, parseFloat((prev - 0.25).toFixed(2))))}
                    className="flex h-11 w-11 items-center justify-center rounded-control border border-line-strong bg-surface text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <Minus size={18} aria-hidden="true" />
                  </button>
                  <span className="min-w-24 text-center text-body font-semibold text-foreground">{quickWater.toFixed(2)} Liters</span>
                  <button
                    type="button"
                    aria-label="Increase water by 250 milliliters"
                    onClick={() => setQuickWater(prev => Math.min(8.0, parseFloat((prev + 0.25).toFixed(2))))}
                    className="flex h-11 w-11 items-center justify-center rounded-control border border-line-strong bg-surface text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <Plus size={18} aria-hidden="true" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { lab: "+250ml", vol: 0.25 },
                    { lab: "+500ml", vol: 0.50 },
                    { lab: "+1.0L", vol: 1.00 }
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.lab}
                      onClick={() => setQuickWater(prev => Math.min(8.0, parseFloat((prev + preset.vol).toFixed(2))))}
                      className="min-h-11 rounded-control border border-status-info/30 bg-surface px-3 text-small font-semibold text-status-info-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      {preset.lab}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
