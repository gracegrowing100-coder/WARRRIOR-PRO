import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, WifiOff, Globe, Volume2, VolumeX, 
  AlertTriangle, ShieldAlert, ArrowRight, RefreshCw, CheckCircle, 
  Trash2, X, ChevronDown, Mic, Droplets, Pill, Activity, ShieldCheck, HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  processOfflineQuery, 
  SupportedLanguage, 
  APP_TRANSLATIONS 
} from '../services/offlineKnowledgeBase';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  lang?: SupportedLanguage;
  dangerLevel?: 'emergency' | 'warning' | 'info';
  suggestedTools?: string[];
  localFoods?: string[];
}

export const OfflineWarriorAI: React.FC<{
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onNavigateToTool?: (toolName: string) => void;
  userGenotype?: string;
  isOpenDefault?: boolean;
}> = ({
  currentLanguage = 'en',
  onLanguageChange,
  onNavigateToTool,
  userGenotype = 'HbSS',
  isOpenDefault = false
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(currentLanguage);
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Synchronize language when prop updates
  useEffect(() => {
    setSelectedLang(currentLanguage);
  }, [currentLanguage]);

  // Load chat history from localStorage or set initial warm welcome
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('warrior_offline_ai_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load offline chat history");
    }
    return [
      {
        id: 'init-1',
        sender: 'bot',
        text: "👋 Sannu / Ẹ n lẹ́ / Ndewo / Hello, Warrior! I am your 100% Offline Sickle Cell Companion. I work instantly anywhere without internet or network coverage in English, Yoruba, Hausa, and Igbo.\n\nAsk me about pain crisis management, hydration science, Nigerian nutrition, Hydroxyurea, or genotype compatibility!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: 'en',
        suggestedTools: ["Emergency SOS", "Water Intake Tracker", "Medication Reminder"]
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Monitor network status dynamically
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('warrior_offline_ai_history', JSON.stringify(chatHistory));
    } catch (e) {
      console.warn("Could not save offline chat history");
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: selectedLang
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputText('');

    // Process 100% locally via offline engine
    setTimeout(() => {
      const result = processOfflineQuery(query, selectedLang, {
        genotype: userGenotype,
      });

      if (result.detectedLang !== selectedLang && onLanguageChange) {
        setSelectedLang(result.detectedLang);
        onLanguageChange(result.detectedLang);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: result.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: result.detectedLang,
        dangerLevel: result.dangerLevel,
        suggestedTools: result.suggestedTools,
        localFoods: result.localFoods
      };

      setChatHistory(prev => [...prev, botMsg]);
    }, 150); // Instant, realistic natural cadence
  };

  // Text to Speech for Accessibility & Low Literacy
  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown tags before reading
    const cleanText = text.replace(/[*_#`🚨⚠️📌•]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; // Clear, measured pace
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Clear Chat History
  const handleClearHistory = () => {
    localStorage.removeItem('warrior_offline_ai_history');
    setChatHistory([
      {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: "Chat history cleared. How can I support your health today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: selectedLang
      }
    ]);
  };

  // Quick Preset Inquiries
  const PRESET_QUERIES: Record<SupportedLanguage, { label: string; query: string }[]> = {
    en: [
      { label: "🚨 Crisis Protocol", query: "What should I do right now during a sickle cell pain crisis?" },
      { label: "💧 Hydration Target", query: "How much water must I drink daily for sickle cell?" },
      { label: "🍲 Nigerian Foods", query: "What Nigerian foods and herbs help build red blood cells?" },
      { label: "💊 Hydroxyurea Facts", query: "How does Hydroxyurea work and what are its safety rules?" },
      { label: "🧬 Genotype Marriage", query: "Can AS and AS marry? Explain the genotype chances." }
    ],
    yo: [
      { label: "🚨 Ìṣòro Ìrora (Crisis)", query: "Kí ni mo gbọ́dọ̀ ṣe nígbà tí ìrora ẹ̀jẹ̀ dídì bá dé?" },
      { label: "💧 Omi Mumu", query: "Omi mélòó ni mo gbọ́dọ̀ mu lójoojúmọ́ fún Sickle Cell?" },
      { label: "🍲 Oúnjẹ Tó Dáa", query: "Àwọn oúnjẹ àbínibí wo ló dáa fún ẹ̀jẹ̀ ní Nàìjíríà?" },
      { label: "🧬 Ìmọ̀ Genotype", query: "Ṣé AS àti AS lè fẹ́ ara wọn? Ṣàlàyé ewu rẹ̀." }
    ],
    ha: [
      { label: "🚨 Ciwon Kanjamau", query: "Me zan yi yayin da nake jin matsanancin ciwon sickle cell?" },
      { label: "💧 Shan Ruwa", query: "Yaya yawan ruwan da ya kamata in sha a kowace rana?" },
      { label: "🍲 Abincin Jini", query: "Wadanne abincin gargajiya ke taimakawa wajen kara jini?" },
      { label: "🧬 Aure da Genotype", query: "Shin AS da AS zasu iya aure? Bayyana hadarin." }
    ],
    ig: [
      { label: "🚨 Oké Mgbu Ọrịa", query: "Gịnị ka m ga-eme mgbe oke mgbu sickle cell dapụtara?" },
      { label: "💧 Ọṅụṅụ Mmiri", query: "Mmiri ole ka m kwesịrị ịṅụ kwa ụbọchị maka sickle cell?" },
      { label: "🍲 Nri Na-edozi Ahụ", query: "Kedu nri ndị Naijiria na-enye aka n'ịmepụta ọbara ọhụrụ?" },
      { label: "🧬 Nyocha Genotype", query: "AS na AS hà nwere ike ịlụ? Kọwaa ihe ize ndụ ya." }
    ]
  };

  return (
    <>
      {/* Floating Action Badge Button */}
      <button
        id="offline-warrior-ai-floating-trigger"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white p-3.5 rounded-full shadow-2xl border-2 border-white/20 flex items-center gap-2 cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95"
        title="Open Offline Multilingual AI Companion"
      >
        <div className="relative">
          <Bot size={22} className="animate-bounce" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-red-700 rounded-full animate-pulse"></span>
        </div>
        <span className="text-xs font-black tracking-wide hidden sm:inline pr-1">
          Warrior AI <span className="text-[10px] opacity-80 font-mono bg-black/30 px-1.5 py-0.5 rounded">OFFLINE</span>
        </span>
      </button>

      {/* Main Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 50, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.96 }}
              className="bg-slate-900 border border-slate-800 w-full sm:max-w-2xl h-[90vh] sm:h-[80vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-white shadow-md">
                    <Bot size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">Warrior AI Companion</h3>
                      <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck size={10} />
                        <span>100% Offline Engine</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Instant Clinical & Cultural SCD Guidance</p>
                  </div>
                </div>

                {/* Controls & Close */}
                <div className="flex items-center gap-2">
                  {/* Language Selector */}
                  <div className="relative">
                    <select
                      value={selectedLang}
                      onChange={(e) => {
                        const nextLang = e.target.value as SupportedLanguage;
                        setSelectedLang(nextLang);
                        if (onLanguageChange) onLanguageChange(nextLang);
                      }}
                      className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
                    >
                      <option value="en">🇬🇧 English</option>
                      <option value="yo">🇳🇬 Yorùbá</option>
                      <option value="ha">🇳🇬 Hausa</option>
                      <option value="ig">🇳🇬 Igbo</option>
                    </select>
                  </div>

                  <button
                    onClick={handleClearHistory}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="Clear Conversation"
                  >
                    <Trash2 size={16} />
                  </button>

                  <button
                    onClick={() => {
                      if (isSpeaking) window.speechSynthesis.cancel();
                      setIsOpen(false);
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60">
                {chatHistory.map((msg) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div className={`max-w-[88%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-md ${
                        isBot 
                          ? msg.dangerLevel === 'emergency'
                            ? 'bg-red-950/70 border-2 border-red-600/70 text-slate-100'
                            : 'bg-slate-900 border border-slate-800 text-slate-200'
                          : 'bg-red-600 text-white rounded-tr-none'
                      }`}>
                        {/* Emergency banner for red flag alerts */}
                        {isBot && msg.dangerLevel === 'emergency' && (
                          <div className="flex items-center gap-2 text-red-300 font-bold mb-2 pb-2 border-b border-red-800/60 text-xs">
                            <AlertTriangle size={15} className="text-red-400 shrink-0" />
                            <span>CRITICAL SCD SAFETY PROTOCOL</span>
                          </div>
                        )}

                        <div className="whitespace-pre-line">
                          {msg.text}
                        </div>

                        {/* Interactive In-App Tool Shortcuts */}
                        {isBot && msg.suggestedTools && msg.suggestedTools.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold self-center mr-1">
                              Quick Tools:
                            </span>
                            {msg.suggestedTools.map((tool, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (onNavigateToTool) onNavigateToTool(tool);
                                  else alert(`Opening offline tool: ${tool}`);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg text-[11px] font-semibold border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                              >
                                <span>{tool}</span>
                                <ArrowRight size={10} />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Speech Synthesis Trigger */}
                        {isBot && (
                          <div className="mt-2.5 pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/50">
                            <span className="font-mono">{msg.timestamp}</span>
                            <button
                              onClick={() => handleSpeak(msg.text)}
                              className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition cursor-pointer px-2 py-0.5 rounded hover:bg-slate-800"
                            >
                              <Volume2 size={12} />
                              <span>Listen (Audio)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Carousel */}
              <div className="p-2.5 bg-slate-950 border-t border-slate-900 overflow-x-auto no-scrollbar flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">Topics:</span>
                {(PRESET_QUERIES[selectedLang] || PRESET_QUERIES.en).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.query)}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 whitespace-nowrap transition cursor-pointer hover:border-slate-700"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={
                    selectedLang === 'yo' 
                      ? 'Béèrè nípa omi, oúnjẹ, tàbí ìrora...' 
                      : selectedLang === 'ha'
                      ? 'Tambayi game da ruwa, abinci, ko ciwo...'
                      : selectedLang === 'ig'
                      ? 'Jụọ banyere mmiri, nri, ma ọ bụ mgbu...'
                      : 'Ask about hydration, crises, Nigerian foods, or Hydroxyurea...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white placeholder:text-slate-500 outline-none transition"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className="p-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-md shadow-red-900/30"
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
