import React, { useState, useEffect } from 'react';
import { Heart, Award, ChevronRight, Zap, Users, X, Flame, Check, Plus, AlertCircle, Brain, Sparkles, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SCD_FACTS } from '../constants';
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
  const [advice, setAdvice] = useState<string>("Loading your health tip...");
  const [isTyping, setIsTyping] = useState(false);
  const [profileName, setProfileName] = useState<string>("Warrior");
  const [profileRole, setProfileRole] = useState<string>("Novice Warrior");
  const [profileXP, setProfileXP] = useState<number>(0);
  const [profileStreak, setProfileStreak] = useState<number>(1);
  const [refreshPain, setRefreshPain] = useState<number>(0);

  // Quick Log Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickPain, setQuickPain] = useState<number>(3);
  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([]);
  const [quickTriggers, setQuickTriggers] = useState<string[]>([]);
  const [quickWater, setQuickWater] = useState<number>(1.0); // Liters logged inside symptom log
  const [isSaving, setIsSaving] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string | null>(null);

  const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD

  const getDailyPrompt = () => {
    const days = [
      "Sunday: Give me an inspiring quote and deep hydration tip for Sickle Cell Warriors to start the week with positive energy.",
      "Monday: Give me a fresh nutrition tip for keeping vaso-occlusive crises away with superfoods and rich hydration options.",
      "Tuesday: Give me light movement and safe home activity tip for Sickle Cell Warriors, emphasizing joints and fluid intake.",
      "Wednesday: Give me emotional well-being and stress relief advice for caregivers and SCD warriors.",
      "Thursday: Give me warm clothing/layering or heat-retaining tip to deal with sudden climate/weather temperature triggers in SCD.",
      "Friday: Give me oxygen-carrying boosting tips (folic acid, iron, deep breathing) to combat fatigue.",
      "Saturday: Give me a restful recovery, sleep regulation, and gentle self-care tip for cellular restoration."
    ];
    const today = new Date().getDay(); // 0 to 6
    return days[today];
  };

  const fetchProfileAndStats = async (active = true) => {
    let pName = "Warrior";
    let pRole = "Novice Warrior";
    let pXP = 0;
    let streakCount = 1;

    try {
      // Calculate/retrieve up-to-date daily streak first
      const currentStreak = await firebaseService.updateStreak(userId);
      if (active) {
        setProfileStreak(currentStreak || 1);
      }
    } catch (e) {
      console.warn("Failed to update streak count on startup:", e);
    }

    if (userId) {
      try {
        const p = await firebaseService.getUserProfile(userId);
        if (p && active) {
          pName = p.displayName || "Warrior";
          pRole = p.role || "Warrior";
          pXP = p.xp || 0;
          setProfileName(pName);
          setProfileRole(pRole);
          setProfileXP(pXP);
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
    if (val <= 3) return { text: "1-3 Mild Pain", color: "text-green-600 bg-green-50 border-green-150" };
    if (val <= 6) return { text: "4-6 Moderate Pain", color: "text-amber-650 bg-amber-50 border-amber-100" };
    return { text: "7-10 Severe Pain crisis!", color: "text-red-150 bg-red-600/90 border-red-500 animate-pulse font-bold" };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Dynamic Wellness Dashboard Card */}
      <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-500 hover:shadow-red-200/50">
        {/* Abstract Glowing Graphics */}
        <div className="absolute top-0 right-0 w-85 h-85 bg-white/10 rounded-full -mr-24 -mt-24 blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-85 h-85 bg-red-400/20 rounded-full blur-[90px]"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 mb-8">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] uppercase font-black tracking-widest px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                🛡️ {profileRole}
              </span>
              <span className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 text-[10px] font-black tracking-widest px-3.5 py-1.5 rounded-full border border-orange-500/10 flex items-center gap-1 cursor-help transition-colors" title="Continuous Logging Days">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" /> {profileStreak}-Day Streak
              </span>
              <span className="bg-red-900/40 text-rose-200 text-[10px] font-black tracking-widest px-3.5 py-1.5 rounded-full border border-red-500/20">
                ✨ {profileXP} XP
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Hello, <span className="text-yellow-200 drop-shadow">{profileName}</span>!
            </h2>
            <p className="text-rose-100/90 text-sm font-medium leading-relaxed italic max-w-lg">
              "Your health journey is our absolute priority. Stand proud—every cell holds the strength of a true warrior."
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/20 shadow-lg shrink-0 flex items-center justify-center hover:scale-105 transition-transform duration-300">
            <Zap className="text-yellow-300 animate-bounce" fill="currentColor" size={32} />
          </div>
        </div>

        {/* Human Wellness Wisdom (With Framer-Motion Entrance & Exit Animations) */}
        <HealthTipsWisdom userName={profileName} userRole={profileRole} />
      </div>

      {/* Daily Mood & Wellness Check-In (1-Tap Emoji Baseline) */}
      <DailyMoodCheckIn userId={userId} onCheckInSaved={() => setRefreshPain(prev => prev + 1)} />

      {/* Primary Tracking Modules Section (Water + Medications) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaterIntakeTracker userId={userId} />
        <MedicationReminder userId={userId} />
      </div>

      {/* 7-Day Recharts Mood & Hydration Correlation Visualizer */}
      <MoodHydrationTrendsChart userId={userId} refreshTrigger={refreshPain} />

      {/* Crisis Pattern Insights & Doctor Clinical Reports */}
      <PatternInsightsDoctorReport userId={userId} />

      {/* Scheduled Reminders & Browser Notification API Manager */}
      <ScheduledRemindersManager userId={userId} />

      {/* Quick-Access Designated Caregiver Emergency Widget */}
      <DesignatedCaregiverWidget currentPainLevel={quickPain} />

      {/* 30-Day Pain Trends Chart */}
      <PainTrendsChart userId={userId} refreshKey={refreshPain} />

      {/* Actions and Learning Sections */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Village Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionButton 
            onClick={() => setIsModalOpen(true)}
            title="Log Symptoms" 
            desc="Quickly record pain & triggers"
            icon={<Heart className="text-red-500" />}
          />
          <ActionButton 
            onClick={() => onNavigate('games')}
            title="SCD Academy" 
            desc="WHO-Guided Education"
            icon={<Award className="text-yellow-600" />}
          />
          <ActionButton 
            onClick={() => onNavigate('community')}
            title="Find Support" 
            desc="NGOs & Clinic Directory"
            icon={<Users className="text-blue-500" />}
          />
        </div>
      </section>

      {/* SCD Educational Snippet Banner */}
      <section className="bg-white dark:bg-slate-900 border-2 border-yellow-100 dark:border-yellow-950/25 rounded-[2rem] p-6 shadow-sm">
        <h4 className="font-black text-yellow-700 dark:text-yellow-500 mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
          <Zap size={15} fill="currentColor" /> Did You Know?
        </h4>
        <p className="text-gray-600 dark:text-slate-300 text-sm italic leading-relaxed font-medium">
          "{SCD_FACTS[Math.floor(Math.random() * SCD_FACTS.length)]}"
        </p>
      </section>

      {/* Mood & Mental Wellness Quick Access Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-[2rem] p-6 text-white shadow-lg border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-400/30 shrink-0">
            <Brain size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/30 text-purple-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-purple-400/40 flex items-center gap-1">
                <Sparkles size={10} /> AI Empathetic Companion
              </span>
            </div>
            <h4 className="text-lg font-black text-white mt-1">Mood & Mental Wellness Engine</h4>
            <p className="text-xs text-purple-200/80 font-medium">Log emotional state, get AI-powered comfort, and practice guided 4-7-8 breathing.</p>
          </div>
        </div>

        <button
          onClick={() => {
            const vaultElem = document.getElementById('care-vault-section');
            if (vaultElem) {
              vaultElem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="px-5 py-3 bg-purple-500 hover:bg-purple-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer shrink-0 self-start md:self-center"
        >
          Open Mood Tracker →
        </button>
      </div>

      {/* Care Vault Secure Medical History Archive */}
      <section id="care-vault-section">
        <CareVault userId={userId} />
      </section>


      {/* Quick-Log Symptoms Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
            {/* Backdrop Blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsModalOpen(false)}
              className="absolute inset-0"
            ></motion.div>

            {/* Modal Container */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-150 dark:border-slate-800 p-6 md:p-8 max-h-[92vh] overflow-y-auto z-10 space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-2xl border border-red-105 dark:border-red-900/30 text-red-500">
                    <Heart className="w-5 h-5 fill-red-500 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 dark:text-white text-base uppercase tracking-wider">Log Daily Symptoms & Pain</h4>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">SCD Crisis Prevention Tracker</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalSuccessMsg ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center border border-green-200 dark:border-green-900/30 shadow-inner">
                    <Check className="w-10 h-10 animate-bounce" strokeWidth={3} />
                  </div>
                  <h5 className="text-xl font-black text-gray-800 dark:text-white">{modalSuccessMsg}</h5>
                  <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Your pain trend logs, cellular wellness indicators, and water metrics have been stored securely.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveQuickLog} className="space-y-6">
                  {/* Pain Scale section - Slider & Emojis */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Pain Level (Wong-Baker FACES style)</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase border ${
                        quickPain <= 3 ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30' :
                        quickPain <= 6 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-750 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' :
                        'bg-red-50 dark:bg-red-950/25 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30'
                      }`}>
                        {quickPain <= 3 ? '1-3 Mild' : quickPain <= 6 ? '4-6 Moderate' : '7-10 Severe'}
                      </span>
                    </div>

                    {/* Highly Visual Emojis Row */}
                    <div className="grid grid-cols-5 gap-2 bg-gray-55 dark:bg-slate-850 p-3 rounded-2xl border border-gray-100 dark:border-slate-800/80 justify-items-center">
                      {[
                        { val: 2, face: '😊', desc: 'No Hurt' },
                        { val: 4, face: '🙂', desc: 'Hurts Little' },
                        { val: 6, face: '😐', desc: 'Even More' },
                        { val: 8, face: '🙁', desc: 'Much More' },
                        { val: 10, face: '😭', desc: 'Worst Pain' }
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.val}
                          onClick={() => setQuickPain(item.val)}
                          className={`flex flex-col items-center p-2 rounded-xl transition-all w-full cursor-pointer hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs ${
                            Math.abs(quickPain - item.val) <= 1
                              ? 'bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/40 scale-105 shadow-sm font-black text-rose-600 dark:text-rose-455' 
                              : 'opacity-50 hover:opacity-90'
                          }`}
                        >
                          <span className="text-3xl md:text-4xl mb-1 select-none">{item.face}</span>
                          <span className="text-[9px] text-gray-500 dark:text-slate-400 text-center font-bold">{item.desc}</span>
                        </button>
                      ))}
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800/85 rounded-2xl p-4 flex flex-col items-center">
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-3xl font-black text-gray-850 dark:text-white">{quickPain}</span>
                        <span className="text-xs text-gray-450 dark:text-slate-500 font-bold">/ 10</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1"
                        value={quickPain}
                        onChange={(e) => setQuickPain(parseInt(e.target.value))}
                        className="w-full accent-rose-650 cursor-pointer h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Severity Context Feedback */}
                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${getSymptomLabel(quickPain).color}`}>
                      <span className="font-extrabold uppercase tracking-widest block mb-0.5">
                        {getSymptomLabel(quickPain).text}
                      </span>
                      <p className="opacity-90 font-medium">
                        {quickPain <= 3 
                          ? "Comfortable baseline. Keep warmth optimal and fluids actively flowing." 
                          : quickPain <= 6 
                          ? "Friction detected. Rest completely, increase hydration immediately, and stay warm." 
                          : "Severe pain detected. Rest immediately. Initiate your personalized sickle cell emergency plan."}
                      </p>
                    </div>
                  </div>

                  {/* Crisis Alerts (Immediate real-time check) */}
                  {(quickPain >= 8 || (quickSymptoms.includes("Fever") && quickPain >= 7)) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 dark:bg-red-950/20 border-2 border-red-500 dark:border-red-900/45 rounded-[2rem] p-5 shadow-lg relative overflow-hidden space-y-3"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03] select-none pointer-events-none">
                        <AlertCircle size={90} className="text-red-650" />
                      </div>
                      <div className="flex gap-3">
                        <div className="bg-red-600 p-2 text-white rounded-xl h-fit w-fit shrink-0 mt-0.5">
                          <AlertCircle className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-black text-red-900 dark:text-red-350 text-xs uppercase tracking-wider">CRITICAL CRISIS ALERT TRIGGERED</h5>
                          <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed font-semibold">
                            You logged a pain level of <strong className="text-red-900 dark:text-red-200">{quickPain}/10</strong> {quickSymptoms.includes("Fever") ? 'along with active Fever' : ''}. This can indicate an active vaso-occlusive crisis (VOC) or severe infection.
                          </p>
                          <p className="text-[11px] text-red-800 dark:text-red-300 font-bold italic leading-relaxed mt-1">
                            Action Recommended: Contact your hematologist or healthcare physician immediately, or visit the nearest emergency room.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 relative z-10">
                        <a 
                          href="tel:+1234567890" 
                          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black text-center uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          📞 Call Dr. Specialist
                        </a>
                        <button 
                          type="button"
                          onClick={() => alert("Directing to nearest Medical Center. Keep warm during transport!")}
                          className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-red-400 dark:border-red-900 hover:bg-red-50 dark:hover:bg-slate-755 text-red-700 dark:text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          🏥 Nearest Emergency Center
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Symptoms Multi-Checklist */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-400 dark:text-slate-505 uppercase tracking-widest block">Active Symptoms Checklist</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                            onClick={() => handleSymptomToggle(sym)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/40 font-extrabold shadow-xs' 
                                : 'bg-gray-50 dark:bg-slate-850/50 text-gray-600 dark:text-slate-300 border-gray-100 dark:border-slate-800/80 hover:border-gray-200'
                            }`}
                          >
                            <div className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                              isChecked ? 'bg-red-600 border-red-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-transparent'
                            }`}>
                              <Check className="w-3 h-3 text-white" strokeWidth={4} />
                            </div>
                            <span className="truncate">{sym}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Triggers Checklist */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block">Potential Triggers Checklist</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TRIGGER_OPTIONS.map((trigger) => {
                        const isChecked = quickTriggers.includes(trigger);
                        return (
                          <button
                            type="button"
                            key={trigger}
                            onClick={() => handleTriggerToggle(trigger)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/40 font-extrabold shadow-xs' 
                                : 'bg-gray-50 dark:bg-slate-850/50 text-gray-600 dark:text-slate-300 border-gray-100 dark:border-slate-800/80 hover:border-gray-200'
                            }`}
                          >
                            <div className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                              isChecked ? 'bg-cyan-600 border-cyan-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-transparent'
                            }`}>
                              <Check className="w-3 h-3 text-white" strokeWidth={4} />
                            </div>
                            <span className="truncate">{trigger}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Hydration Counter with presets */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Logged Water Intake with symptoms</span>
                      <span className="text-xs font-extrabold text-cyan-650 dark:text-cyan-400">
                        {quickWater.toFixed(2)} L / {Math.round(quickWater * 33.8)} oz
                      </span>
                    </div>

                    <div className="bg-cyan-50/50 dark:bg-cyan-950/15 border border-cyan-100/60 dark:border-cyan-900/35 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button 
                          type="button"
                          onClick={() => setQuickWater(prev => Math.max(0.0, parseFloat((prev - 0.25).toFixed(2))))}
                          className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-cyan-150 dark:border-cyan-900/40 hover:bg-cyan-50 dark:hover:bg-slate-750 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-black text-lg transition-all active:scale-90 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-sm font-extrabold text-gray-700 dark:text-slate-300 select-none min-w-[70px] text-center">
                          {quickWater.toFixed(2)} Liters
                        </span>
                        <button 
                          type="button"
                          onClick={() => setQuickWater(prev => Math.min(8.0, parseFloat((prev + 0.25).toFixed(2))))}
                          className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-cyan-150 dark:border-cyan-900/40 hover:bg-cyan-50 dark:hover:bg-slate-750 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-black text-lg transition-all active:scale-90 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Presets Row */}
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {[
                          { lab: "+250ml", vol: 0.25 },
                          { lab: "+500ml", vol: 0.50 },
                          { lab: "+1.0L", vol: 1.00 }
                        ].map((preset) => (
                          <button
                            type="button"
                            key={preset.lab}
                            onClick={() => setQuickWater(prev => Math.min(8.0, parseFloat((prev + preset.vol).toFixed(2))))}
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-750 text-cyan-700 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/35 rounded-xl text-[10px] font-black uppercase transition-all shadow-2xs active:scale-95 cursor-pointer"
                          >
                            {preset.lab}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Form Submission buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 md:flex-row flex-col-reverse">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-350 font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSaving ? "Syncing..." : "Save Log Entries"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActionButton = ({ title, desc, icon, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-805/80 hover:border-red-200 dark:hover:border-red-900/30 transition-all text-left w-full group active:scale-95 outline-none cursor-pointer"
  >
    <div className="bg-gray-50 dark:bg-slate-850 p-4 rounded-2xl group-hover:bg-red-50 dark:group-hover:bg-red-950/20 transition-colors shadow-inner">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-black text-gray-800 dark:text-white text-xs uppercase tracking-widest truncate">{title}</h4>
      <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-1 line-clamp-1">{desc}</p>
    </div>
    <ChevronRight size={18} className="text-gray-300 dark:text-slate-600 group-hover:text-red-500 transform group-hover:translate-x-1 transition-all" />
  </button>
);

export default Dashboard;
