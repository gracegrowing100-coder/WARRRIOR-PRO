import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Volume2, Bookmark, Check, ShieldCheck, Flame, Droplets, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateHealthAdvice } from '../services/gemini';
import { SCD_FACTS } from '../constants';

interface HealthTipsWisdomProps {
  userName?: string;
  userRole?: string;
}

const CATEGORIES = [
  { id: 'all', label: '✨ Daily Sunrise Wisdom' },
  { id: 'hydration', label: '💧 Hydration Defense' },
  { id: 'crisis', label: '🛡️ Pain & Crisis Shield' },
  { id: 'nutrition', label: '🥗 Cell Nutrition' },
  { id: 'warmth', label: '🧣 Warmth & Climate' },
  { id: 'mind', label: '🕊️ Emotional Peace' },
];

export const HealthTipsWisdom: React.FC<HealthTipsWisdomProps> = ({ userName = 'Warrior', userRole = 'Warrior' }) => {
  const [currentTip, setCurrentTip] = useState<string>('Maintain rich fluid levels and keep warm today to ensure smooth blood circulation.');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const fetchTip = async (category: string = selectedCategory) => {
    setIsRefreshing(true);
    setSaved(false);
    
    try {
      const prompts: Record<string, string> = {
        all: "Give me an inspiring, actionable morning health and cellular circulation tip for a Sickle Cell Warrior.",
        hydration: "Give me a practical, high-impact hydration tip specifically to prevent vaso-occlusive sickling.",
        crisis: "Give me an early warning detection and proactive intervention tip when sickle pain twinges start.",
        nutrition: "Give me a rich nutrition tip focusing on folic acid, antioxidants, and foods that ease inflammation in SCD.",
        warmth: "Give me cold-weather protection, clothing layering, and thermal stability advice for SCD.",
        mind: "Give me comforting, grounding mental wellness and stress-reduction advice for living with chronic illness."
      };

      const prompt = prompts[category] || prompts.all;
      const userContext = `User is named ${userName}, a ${userRole} managing Sickle Cell Disease.`;
      const res = await generateHealthAdvice(prompt, userContext);
      
      let sanitized = res || SCD_FACTS[Math.floor(Math.random() * SCD_FACTS.length)];
      sanitized = sanitized.replace(/\)*\)/g, "").replace(/\*+/g, "").trim();
      sanitized = sanitized.replace(/Artificial Intelligence|AI derived|Gemini|LLM|Assistant|Model/gi, "Cellular Medical Insights");

      setCurrentTip(sanitized);
      setTipIndex(prev => prev + 1);
    } catch (e) {
      setCurrentTip(SCD_FACTS[Math.floor(Math.random() * SCD_FACTS.length)]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTip('all');
  }, [userName]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    fetchTip(catId);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentTip);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveFavorite = () => {
    setSaved(true);
    const favorites = JSON.parse(localStorage.getItem('warrior_favorite_tips') || '[]');
    if (!favorites.includes(currentTip)) {
      favorites.unshift(currentTip);
      localStorage.setItem('warrior_favorite_tips', JSON.stringify(favorites.slice(0, 20)));
    }
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 relative z-10 transition-all duration-300 overflow-hidden shadow-lg">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">
            Daily Sunrise Healing Wisdom
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSpeak}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isPlayingAudio 
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40 animate-pulse' 
                : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
            title={isPlayingAudio ? "Stop Audio" : "Listen via Audio Read-Aloud"}
          >
            <Volume2 size={14} />
          </button>

          <button
            onClick={handleSaveFavorite}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-xs font-bold transition-all cursor-pointer"
            title="Save to favorites"
          >
            {saved ? <Check size={14} className="text-emerald-400" /> : <Bookmark size={14} />}
          </button>

          <button
            onClick={() => fetchTip()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
            title="Refresh tip"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh Tip</span>
          </button>
        </div>
      </div>

      {/* Category Pills with smooth active transition */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-400 text-slate-900 font-extrabold shadow-sm scale-105'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Animated Tip Content with Framer-Motion Entrance & Exit */}
      <div className="min-h-[72px] flex items-center">
        <AnimatePresence mode="wait">
          {isRefreshing ? (
            <motion.div
              key="loading-wisdom"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 py-3"
            >
              <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce delay-150"></div>
              <div className="w-2.5 h-2.5 bg-yellow-300 rounded-full animate-bounce delay-300"></div>
              <span className="text-xs text-cyan-200 font-bold tracking-wider uppercase ml-1">
                Curating personalized cellular wisdom...
              </span>
            </motion.div>
          ) : (
            <motion.div
              key={`tip-${tipIndex}-${selectedCategory}`}
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-sm md:text-base leading-relaxed text-slate-50 font-medium select-text font-serif italic selection:bg-rose-500 selection:text-white"
            >
              "{currentTip}"
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
