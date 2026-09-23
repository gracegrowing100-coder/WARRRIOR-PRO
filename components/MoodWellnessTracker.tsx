import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  Brain, 
  Wind, 
  Music, 
  Volume2, 
  VolumeX, 
  Smile, 
  Frown, 
  Meh, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  RotateCcw, 
  Sun, 
  Moon, 
  Compass, 
  ShieldAlert, 
  BookOpen, 
  Activity,
  Award
} from 'lucide-react';
import { generateMoodAdvice } from '../services/gemini';
import { firebaseService } from '../services/firebaseService';

interface MoodWellnessTrackerProps {
  userId: string;
}

const EMOTIONAL_STATES = [
  { id: 'anxious', label: 'Anxious / Fearful', emoji: '😰', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' },
  { id: 'pain_distress', label: 'Pain-Distressed', emoji: '⚡', bg: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' },
  { id: 'exhausted', label: 'Exhausted / Drained', emoji: '🥱', bg: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400' },
  { id: 'overwhelmed', label: 'Overwhelmed / Sad', emoji: '🌧️', bg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' },
  { id: 'hopeful', label: 'Hopeful / Optimistic', emoji: '🌱', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' },
  { id: 'calm', label: 'Calm / Peaceful', emoji: '🕊️', bg: 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400' },
  { id: 'resilient', label: 'Resilient / Steady', emoji: '🛡️', bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏', bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' }
];

const PHYSICAL_SYMPTOMS = [
  '🦴 Vaso-occlusive Joint Pain',
  '⚡ Severe Fatigue',
  '❄️ Cold Sensitivity',
  '🫁 Chest Tightness',
  '🤕 Throbbing Headache',
  '💧 Dehydration Feeling',
  '🌡️ Fever / Chills',
  '🤢 Nausea / Abdominal Discomfort'
];

const SCENERY_OPTIONS = [
  { id: 'beach', name: 'Sunlit Coastal Shore', icon: '🏖️', soundFreq: 220, desc: 'Warm gentle ocean waves washing onto golden sand' },
  { id: 'forest', name: 'Tranquil Redwood Forest', icon: '🌲', soundFreq: 180, desc: 'Soft wind rustling through towering pine trees' },
  { id: 'river', name: 'Mountain Stream', icon: '🏔️', soundFreq: 320, desc: 'Crisp water flowing over smooth river pebbles' },
  { id: 'space', name: 'Cosmic Starlight Haven', icon: '🌌', soundFreq: 140, desc: 'Deep warm ambient frequencies for deep relaxation' }
];

const AFFIRMATION_CARDS = [
  "My pain is real, but so is my strength. I am navigating this moment with courage.",
  "I give my body permission to rest deeply without guilt or pressure.",
  "Every slow breath I take dilates my blood vessels and brings oxygen to my cells.",
  "This pain crisis is a temporary chapter, not my permanent story.",
  "I am surrounded by support, care, and warriors who walk beside me."
];

export const MoodWellnessTracker: React.FC<MoodWellnessTrackerProps> = ({ userId }) => {
  const [selectedEmotion, setSelectedEmotion] = useState<string>('anxious');
  const [intensity, setIntensity] = useState<number>(6);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['🦴 Vaso-occlusive Joint Pain']);
  const [journalText, setJournalText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentAiResponse, setCurrentAiResponse] = useState<string | null>(null);
  const [pastLogs, setPastLogs] = useState<any[]>([]);

  // Mindfulness Interactive State
  const [activeWellnessTab, setActiveWellnessTab] = useState<'breathing' | 'pmr' | 'scenery' | 'affirmations'>('breathing');
  
  // 4-7-8 Breathing Circle Animation State
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathTimer, setBreathTimer] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  
  // Ambient Sound Generator State
  const [soundActive, setSoundActive] = useState<boolean>(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);
  const [activeScenery, setActiveScenery] = useState<string>('beach');

  // Affirmation Index
  const [affirmationIdx, setAffirmationIdx] = useState<number>(0);

  useEffect(() => {
    const loadLogs = async () => {
      const logs = await firebaseService.getMoodLogs(userId);
      setPastLogs(logs || []);
    };
    loadLogs();
  }, [userId]);

  // Handle Breathing Timer Loop
  useEffect(() => {
    let interval: any = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev <= 1) {
            if (breathPhase === 'Inhale') {
              setBreathPhase('Hold');
              return 7;
            } else if (breathPhase === 'Hold') {
              setBreathPhase('Exhale');
              return 8;
            } else {
              setBreathPhase('Inhale');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathPhase('Inhale');
      setBreathTimer(4);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase]);

  // Sound Synth Toggle
  const toggleSound = (freq = 220) => {
    if (soundActive) {
      if (oscillator) {
        try { oscillator.stop(); } catch(e){}
      }
      setSoundActive(false);
    } else {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setAudioCtx(ctx);
        setOscillator(osc);
        setSoundActive(true);
      }
    }
  };

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleGenerateEmpatheticResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setCurrentAiResponse(null);

    const emotionObj = EMOTIONAL_STATES.find(e => e.id === selectedEmotion);
    const emotionLabel = emotionObj ? emotionObj.label : selectedEmotion;

    try {
      const aiAdvice = await generateMoodAdvice(
        emotionLabel,
        intensity,
        selectedSymptoms,
        journalText
      );
      setCurrentAiResponse(aiAdvice);

      // Save log entry to Firestore and Cache
      const savedEntry = await firebaseService.saveMoodLog(userId, {
        emotion: emotionLabel,
        intensity,
        symptoms: selectedSymptoms,
        journalText,
        aiResponse: aiAdvice
      });

      setPastLogs(prev => [savedEntry, ...prev]);
    } catch (err) {
      console.error(err);
      setCurrentAiResponse("We are with you in this moment. Please rest, sip warm water, and use our guided breathing exercise below.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden border border-purple-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-purple-400/30 flex items-center gap-1.5">
              <Brain size={12} /> Mind-Body Wellness Engine
            </span>
            <span className="bg-indigo-500/20 text-indigo-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-400/30">
              SCD Empathetic Care
            </span>
          </div>
          <h3 className="text-3xl font-black tracking-tight leading-none text-white">
            Mood & Mental Wellness Tracker
          </h3>
          <p className="text-xs text-purple-100/90 font-medium leading-relaxed">
            Express your emotional state and physical symptoms freely. Receive warm, AI-powered empathetic guidance and explore interactive mindfulness tools designed for pain relief and nervous system calm.
          </p>
        </div>
      </div>

      {/* Main Expresser Form & AI Empathetic Companion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Emotion & Symptom Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-gray-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-100 dark:border-purple-800/40">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 dark:text-white text-base">Express Your Emotional State</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">How are you feeling mentally and emotionally right now?</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerateEmpatheticResponse} className="space-y-6">
            {/* Emotion Chips */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-400">
                Primary Emotional State
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {EMOTIONAL_STATES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedEmotion(st.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      selectedEmotion === st.id
                        ? `${st.bg} ring-2 ring-purple-500 font-extrabold shadow-sm scale-[1.02]`
                        : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-750 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xl select-none">{st.emoji}</span>
                    <span className="text-xs font-bold leading-snug">{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Emotional Intensity Slider */}
            <div className="space-y-3 bg-purple-50/50 dark:bg-purple-950/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/40">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                  <Activity size={12} /> Emotional Burden / Stress Rating
                </label>
                <span className="text-xs font-black px-3 py-1 bg-purple-600 text-white rounded-full">
                  Level {intensity} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-2 bg-purple-200 dark:bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[9px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest">
                <span>1 - Peaceful / Light</span>
                <span>5 - Moderate Strain</span>
                <span>10 - Heavy Crisis Distress</span>
              </div>
            </div>

            {/* Physical Symptoms Co-Tracker */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-400">
                Co-occurring Physical Symptoms (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {PHYSICAL_SYMPTOMS.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Freeform Journaling */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-400">
                Personal Notes & Reflection (Optional)
              </label>
              <textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Describe what is triggering your anxiety, pain, or thoughts today... (e.g., 'Feeling stressed about exams while my legs are aching from the cold draft.')"
                rows={3}
                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-lg shadow-purple-200 dark:shadow-purple-950/50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="animate-spin" size={16} /> Generating AI Empathetic Reflection...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Receive AI Empathetic Reflection & Advice
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Empathetic Response & Recent Journal Logs */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Output Card */}
          <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 p-6 md:p-8 rounded-[2.5rem] border border-purple-500/30 text-white shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-400/30">
                  <Sparkles size={16} />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-purple-200">
                  Empathetic Wellness Reflection
                </span>
              </div>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-900/60 px-2.5 py-1 rounded-full">
                Gemini AI Companion
              </span>
            </div>

            {currentAiResponse ? (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="text-xs text-purple-100/90 font-medium leading-relaxed whitespace-pre-line bg-purple-900/30 p-5 rounded-2xl border border-purple-500/20">
                  {currentAiResponse}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/50">
                  <CheckCircle2 size={14} /> Reflection saved to your confidential health log history.
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3 text-purple-200/70">
                <Brain className="w-12 h-12 mx-auto text-purple-400/50 animate-pulse" />
                <p className="text-xs font-medium max-w-xs mx-auto">
                  Select your emotional state and physical symptoms on the left to generate an empathetic AI reflection tailored to your warrior journey.
                </p>
              </div>
            )}
          </div>

          {/* Past Reflection History */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={14} className="text-purple-600" /> Recent Reflection Logs ({pastLogs.length})
            </h4>

            {pastLogs.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 italic">No previous reflections logged yet.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {pastLogs.slice(0, 5).map((log, idx) => (
                  <div key={log.id || idx} className="p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-750 text-xs space-y-1">
                    <div className="flex items-center justify-between font-extrabold text-gray-800 dark:text-slate-200">
                      <span>{log.emotion} (Burden: {log.intensity}/10)</span>
                      <span className="text-[9px] font-normal text-gray-400">{new Date(log.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    {log.symptoms && log.symptoms.length > 0 && (
                      <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold truncate">
                        Symptoms: {log.symptoms.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Mindfulness & Wellness Resource Deck */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-gray-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-teal-500/20">
                Supportive Mindfulness Suite
              </span>
            </div>
            <h4 className="text-xl font-black text-gray-900 dark:text-white mt-1">
              Interactive Calm & Pain Distraction Resources
            </h4>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex flex-wrap bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700">
            {[
              { id: 'breathing', label: '🫁 4-7-8 Breathing', icon: Wind },
              { id: 'pmr', label: '🧘 Muscle Relaxation', icon: Compass },
              { id: 'scenery', label: '🏖️ Sound Scenery', icon: Music },
              { id: 'affirmations', label: '✨ Affirmations', icon: Heart }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWellnessTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeWellnessTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-Tab Content 1: 4-7-8 Diaphragmatic Breathing Circle */}
        {activeWellnessTab === 'breathing' && (
          <div className="bg-gradient-to-br from-teal-950 via-slate-900 to-indigo-950 p-8 rounded-[2rem] border border-teal-500/30 text-white text-center space-y-6 relative overflow-hidden animate-in fade-in">
            <div className="max-w-md mx-auto space-y-2">
              <h5 className="text-lg font-black text-teal-300">Guided 4-7-8 Diaphragmatic Breathing</h5>
              <p className="text-xs text-teal-100/80 font-medium">
                Deep diaphragmatic breathing stimulates the vagus nerve, reducing vascular constriction and helping relax muscle tension during pain flare-ups.
              </p>
            </div>

            {/* Animated Pulsing Breathing Circle */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-6">
              <div 
                className={`absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/30 to-indigo-500/40 border-4 border-teal-400/50 transition-all duration-1000 ${
                  isBreathingActive && breathPhase === 'Inhale'
                    ? 'scale-125 border-teal-300 shadow-2xl shadow-teal-500/50'
                    : isBreathingActive && breathPhase === 'Hold'
                    ? 'scale-125 border-amber-300 shadow-2xl shadow-amber-500/50'
                    : isBreathingActive && breathPhase === 'Exhale'
                    ? 'scale-90 border-indigo-400 opacity-80'
                    : 'scale-100'
                }`}
              ></div>

              <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
                <span className="text-2xl font-black tracking-widest uppercase text-teal-200">
                  {breathPhase}
                </span>
                <span className="text-4xl font-black text-white">
                  {breathTimer}s
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-teal-500/30 cursor-pointer"
              >
                {isBreathingActive ? 'Pause Exercise' : 'Start 4-7-8 Cycle'}
              </button>
            </div>
          </div>
        )}

        {/* Sub-Tab Content 2: Progressive Muscle Relaxation (PMR) Guide */}
        {activeWellnessTab === 'pmr' && (
          <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-800 text-white space-y-6 animate-in fade-in">
            <div className="space-y-1">
              <h5 className="text-lg font-black text-purple-300">Progressive Muscle Relaxation (PMR)</h5>
              <p className="text-xs text-slate-400 font-medium">
                Systematically tense and release key muscle groups to differentiate physical pain from muscle strain.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { step: '1', title: 'Shoulders & Neck', text: 'Gentely raise shoulders up towards your ears for 5 seconds. Exhale slowly and let them drop completely.' },
                { step: '2', title: 'Hands & Arms', text: 'Clench your fists gently without over-straining. Hold for 5 seconds, then unclench and feel the warm blood flow back into your fingers.' },
                { step: '3', title: 'Thighs & Legs', text: 'Press your thighs down gently into your seat or bed. Hold for 5 seconds, then let go completely and focus on relaxation.' },
                { step: '4', title: 'Abdomen & Back', text: 'Tighten your core gently while breathing in. Release on a long exhale, feeling warmth spread through your lower back.' }
              ].map((item) => (
                <div key={item.step} className="p-4 bg-slate-850 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      {item.step}
                    </span>
                    <h6 className="font-extrabold text-xs text-white">{item.title}</h6>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Tab Content 3: Sound Scenery Generator */}
        {activeWellnessTab === 'scenery' && (
          <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-800 text-white space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-lg font-black text-indigo-300">Guided Pain Distraction & Soundscapes</h5>
                <p className="text-xs text-slate-400 font-medium">Select a calm visual landscape and play ambient tones to soothe your nervous system.</p>
              </div>

              <button
                type="button"
                onClick={() => toggleSound(SCENERY_OPTIONS.find(s => s.id === activeScenery)?.soundFreq || 220)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  soundActive
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {soundActive ? <VolumeX size={16} /> : <Volume2 size={16} />}
                {soundActive ? 'Stop Soundscape' : 'Play Ambient Sound'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SCENERY_OPTIONS.map((scene) => (
                <div
                  key={scene.id}
                  onClick={() => {
                    setActiveScenery(scene.id);
                    if (soundActive) toggleSound(scene.soundFreq);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    activeScenery === scene.id
                      ? 'bg-indigo-950/80 border-indigo-500 text-white ring-2 ring-indigo-400'
                      : 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-3xl select-none">{scene.icon}</span>
                  <div className="space-y-1">
                    <h6 className="font-extrabold text-sm text-white">{scene.name}</h6>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{scene.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Tab Content 4: Affirmation Reassurance Cards */}
        {activeWellnessTab === 'affirmations' && (
          <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 p-8 rounded-[2rem] border border-purple-500/30 text-white text-center space-y-6 animate-in fade-in">
            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-purple-400/30">
              Warrior Reassurance Deck
            </span>

            <div className="min-h-[120px] flex items-center justify-center p-6 bg-purple-900/30 rounded-2xl border border-purple-500/20 max-w-xl mx-auto">
              <p className="text-base font-black italic text-purple-100 leading-relaxed">
                "{AFFIRMATION_CARDS[affirmationIdx]}"
              </p>
            </div>

            <div className="flex justify-center items-center gap-3">
              <button
                type="button"
                onClick={() => setAffirmationIdx((prev) => (prev > 0 ? prev - 1 : AFFIRMATION_CARDS.length - 1))}
                className="px-4 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold rounded-xl border border-purple-700/50 cursor-pointer"
              >
                ← Previous
              </button>
              <span className="text-xs font-bold text-slate-400">
                {affirmationIdx + 1} of {AFFIRMATION_CARDS.length}
              </span>
              <button
                type="button"
                onClick={() => setAffirmationIdx((prev) => (prev < AFFIRMATION_CARDS.length - 1 ? prev + 1 : 0))}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Next Affirmation →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
