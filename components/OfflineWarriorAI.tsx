import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, WifiOff, Wifi, Volume2, VolumeX, 
  AlertTriangle, ArrowRight, Trash2, X, Mic, MicOff,
  Droplets, Pill, Activity, ShieldCheck, HeartPulse, Sparkles,
  Utensils, CheckCircle2, ChevronDown, RefreshCw
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

const SUPPORTED_LANGUAGES: { id: SupportedLanguage; label: string; flag: string; nativeName: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
  { id: 'yo', label: 'Yorùbá', flag: '🇳🇬', nativeName: 'Yorùbá' },
  { id: 'ha', label: 'Hausa', flag: '🇳🇬', nativeName: 'Hausa' },
  { id: 'ig', label: 'Igbo', flag: '🇳🇬', nativeName: 'Asụsụ Igbo' }
];

export const OfflineWarriorAI: React.FC<{
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onNavigateToTool?: (toolName: string) => void;
  userGenotype?: string;
  isOpenDefault?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideFloatingButton?: boolean;
}> = ({
  currentLanguage = 'en',
  onLanguageChange,
  onNavigateToTool,
  userGenotype = 'HbSS',
  isOpenDefault = false,
  isOpen: controlledOpen,
  onOpenChange,
  hideFloatingButton = false,
}) => {
  const [internalOpen, setInternalOpen] = useState(isOpenDefault);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setDrawerOpen = (open: boolean) => {
    setInternalOpen(open);
    onOpenChange?.(open);
  };

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(currentLanguage);
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

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
    } catch {
      console.warn("Could not load offline chat history");
    }
    return [
      {
        id: 'init-1',
        sender: 'bot',
        text: "👋 Sannu / Ẹ n lẹ́ / Ndewo / Hello, Warrior! I am your 100% Offline Sickle Cell Companion.\n\nI work instantly anywhere without internet or network coverage in English, Yorùbá, Hausa, and Igbo.\n\nAsk me about acute pain crisis protocols, daily hydration science, high-iron Nigerian nutrition, Hydroxyurea guidance, or genotype compatibility!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: 'en',
        suggestedTools: ["Emergency SOS", "Hydration Tracker", "Medication Reminder"]
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

  // Save chat history to localStorage & scroll to bottom
  useEffect(() => {
    try {
      localStorage.setItem('warrior_offline_ai_history', JSON.stringify(chatHistory));
    } catch {
      console.warn("Could not save offline chat history");
    }
    if (typeof chatEndRef.current?.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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

    // Process 100% locally via offline SCD intelligence engine
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
    }, 120); // Natural responsive cadence
  };

  // Text to Speech for Accessibility & Low Literacy
  const handleSpeak = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) {
      showToast("Speech audio is not supported in this browser.");
      return;
    }

    if (isSpeaking && speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown tags and emojis for smooth pronunciation
    const cleanText = text.replace(/[*_#`🚨⚠️📌•👋🍲💊🧬💧]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; // Clear, measured pace
    utterance.pitch = 1.0;

    // Set voice language locale
    if (selectedLang === 'yo') utterance.lang = 'yo-NG';
    else if (selectedLang === 'ha') utterance.lang = 'ha-NG';
    else if (selectedLang === 'ig') utterance.lang = 'ig-NG';
    else utterance.lang = 'en-US';

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    setIsSpeaking(true);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Voice Dictation (Speech Recognition via Web Speech API)
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition 
      || (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("Voice transcription is not available on this device. Please type your query.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLang === 'yo' ? 'yo-NG' : selectedLang === 'ha' ? 'ha-NG' : selectedLang === 'ig' ? 'ig-NG' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        showToast("Listening... speak your question.");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      showToast("Could not start microphone.");
    }
  };

  // Clear Chat History
  const handleClearHistory = () => {
    localStorage.removeItem('warrior_offline_ai_history');
    setChatHistory([
      {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: "Conversation cleared. How can I assist your sickle cell wellness right now?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: selectedLang
      }
    ]);
    showToast("Chat history cleared.");
  };

  // Handle Tool Click with Toast fallback
  const handleToolClick = (tool: string) => {
    if (onNavigateToTool) {
      onNavigateToTool(tool);
    } else {
      showToast(`Navigating to ${tool}...`);
    }
  };

  // Quick Preset Inquiries localized per language
  const PRESET_QUERIES: Record<SupportedLanguage, { label: string; query: string }[]> = {
    en: [
      { label: "🚨 Crisis Protocol", query: "What should I do right now during a sickle cell pain crisis?" },
      { label: "💧 Hydration Target", query: "How much water must I drink daily for sickle cell?" },
      { label: "🍲 Nigerian Blood Builders", query: "What Nigerian foods and herbs help build red blood cells?" },
      { label: "💊 Hydroxyurea Facts", query: "How does Hydroxyurea work and what are its safety rules?" },
      { label: "🧬 Genotype Marriage", query: "Can AS and AS marry? Explain the genotype chances." },
      { label: "❄️ Harmattan & Cold Care", query: "How do I protect against sickle cell crisis during Harmattan or cold drafts?" }
    ],
    yo: [
      { label: "🚨 Ìṣòro Ìrora (Crisis)", query: "Kí ni mo gbọ́dọ̀ ṣe nígbà tí ìrora ẹ̀jẹ̀ dídì bá dé?" },
      { label: "💧 Omi Mumu Lójoojúmọ́", query: "Omi mélòó ni mo gbọ́dọ̀ mu lójoojúmọ́ fún Sickle Cell?" },
      { label: "🍲 Oúnjẹ Tó Dáa fún Ẹ̀jẹ̀", query: "Àwọn oúnjẹ àbínibí wo ló dáa fún ẹ̀jẹ̀ ní Nàìjíríà?" },
      { label: "🧬 Ìmọ̀ Genotype & Ìgbéyàwó", query: "Ṣé AS àti AS lè fẹ́ ara wọn? Ṣàlàyé ewu rẹ̀." },
      { label: "❄️ Ìtọ́jú Òtútù Ọ̀yẹ́", query: "Báwo ni mo ṣe lè dáàbò bo ara mi kúrò lọ́wọ́ òtútù ọ̀yẹ́ láti dènà agbákò?" }
    ],
    ha: [
      { label: "🚨 Ciwon Kanjamau (Crisis)", query: "Me zan yi yayin da nake jin matsanancin ciwon sickle cell?" },
      { label: "💧 Shan Ruwa a Rana", query: "Yaya yawan ruwan da ya kamata in sha a kowace rana?" },
      { label: "🍲 Abincin Gargajiya na Jini", query: "Wadanne abincin gargajiya ke taimakawa wajen kara jini?" },
      { label: "🧬 Aure da Genotype", query: "Shin AS da AS zasu iya aure? Bayyana hadarin." },
      { label: "❄️ Kariya daga Hunturu", query: "Yaya zan kiyaye kaina daga sanyin hunturu don guje wa ciwon gaggawa?" }
    ],
    ig: [
      { label: "🚨 Oké Mgbu Ọrịa (Crisis)", query: "Gịnị ka m ga-eme mgbe oke mgbu sickle cell dapụtara?" },
      { label: "💧 Ọṅụṅụ Mmiri Kwa Ụbọchị", query: "Mmiri ole ka m kwesịrị ịṅụ kwa ụbọchị maka sickle cell?" },
      { label: "🍲 Nri Na-edozi Ahụ & Ọbara", query: "Kedu nri ndị Naijiria na-enye aka n'ịmepụta ọbara ọhụrụ?" },
      { label: "🧬 Nyocha Genotype & Ọlụlụ", query: "AS na AS hà nwere ike ịlụ? Kọwaa ihe ize ndụ ya." },
      { label: "❄️ Oge Oyi & Nchedo Ahụ", query: "Kedu ka m ga-esi chebe onwe m pụọ n'oge oyi iji gbochie nsogbu mgbu?" }
    ]
  };

  return (
    <>
      {/* Accessible Trigger Button (Preserved for tests & trigger clicks) */}
      <button
        id="offline-warrior-ai-floating-trigger"
        onClick={() => setDrawerOpen(true)}
        type="button"
        data-ui-control
        aria-label="Open Offline AI"
        className={
          hideFloatingButton
            ? 'sr-only'
            : 'flex min-h-11 items-center gap-2 rounded-full border border-[#EADDE2] bg-white px-4 py-2 text-xs font-semibold text-[#3B0F2C] hover:bg-[#FBE4E8] shadow-sm transition-colors'
        }
        title="Open Offline Multilingual AI Companion"
      >
        <Bot size={18} className="text-[#C4122F]" aria-hidden="true" />
        <span className="hidden sm:inline">Offline AI</span>
      </button>

      {/* Main Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1E0817]/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 50, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="bg-[#FAF6F8] border border-[#EADDE2] w-full sm:max-w-2xl h-[94vh] sm:h-[84vh] rounded-t-[28px] sm:rounded-[28px] flex flex-col overflow-hidden shadow-2xl relative"
            >
              {/* Toast Notification Notification Pill */}
              <AnimatePresence>
                {toastMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2 z-60 bg-[#3B0F2C] text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} className="text-[#3DDC84]" />
                    <span>{toastMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Plum Header */}
              <div className="bg-[#3B0F2C] text-white px-5 py-4 border-b border-[#2D0B22] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#C4122F] flex items-center justify-center text-white shadow-md ring-2 ring-white/10 shrink-0">
                    <Bot size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Warrior AI Companion</h3>
                      <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck size={11} />
                        <span>100% Offline</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-[#D9B9CC] mt-0.5">
                      Instant Clinical & Cultural SCD Guidance (No Data Needed)
                    </p>
                  </div>
                </div>

                {/* Header Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Language Selector */}
                  <div className="relative">
                    <select
                      value={selectedLang}
                      onChange={(e) => {
                        const nextLang = e.target.value as SupportedLanguage;
                        setSelectedLang(nextLang);
                        if (onLanguageChange) onLanguageChange(nextLang);
                        showToast(`Switched language to ${SUPPORTED_LANGUAGES.find(l => l.id === nextLang)?.label}`);
                      }}
                      className="bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-white rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer appearance-none pr-7 transition-colors"
                      aria-label="Select Offline Language"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id} className="bg-[#3B0F2C] text-white">
                          {lang.flag} {lang.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
                  </div>

                  {/* Clear History */}
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="p-2 text-[#D9B9CC] hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                    title="Clear Conversation"
                    aria-label="Clear Conversation"
                  >
                    <Trash2 size={17} />
                  </button>

                  {/* Close Drawer Button */}
                  <button
                    type="button"
                    aria-label="Close Offline AI"
                    onClick={() => {
                      if (isSpeaking) window.speechSynthesis.cancel();
                      setDrawerOpen(false);
                    }}
                    className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl p-2 text-[#D9B9CC] transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Sub-header Context Bar */}
              <div className="bg-[#FDF2F4] border-b border-[#F1E6EC] px-4 py-2 text-xs text-[#6E4A63] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={14} className="text-[#C4122F] shrink-0" />
                  <span>
                    Operates 100% locally on this device. Fully functional without internet, cellular, or Wi-Fi.
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-[#3B0F2C]">
                  {isOnline ? (
                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Device Online (Offline Core Active)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#C4122F] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      <WifiOff size={11} />
                      Device Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#F7F2F5]">
                {chatHistory.map((msg) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div className={`max-w-[90%] sm:max-w-[85%] rounded-[22px] p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                        isBot 
                          ? 'bg-white border border-[#EADDE2] text-[#3B0F2C] rounded-bl-[4px]'
                          : 'bg-[#3B0F2C] text-white rounded-br-[4px]'
                      }`}>
                        {/* Emergency Banner for High-Risk Alerts */}
                        {isBot && msg.dangerLevel === 'emergency' && (
                          <div className="bg-[#FFF1F2] border border-[#FCA5A5] text-[#991B1B] rounded-xl p-3 mb-3">
                            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-[#C4122F]">
                              <AlertTriangle size={15} className="shrink-0" />
                              <span>Critical SCD Safety Protocol</span>
                            </div>
                            <p className="text-[11px] text-[#7F1D1D] mt-1 font-medium">
                              Severe acute symptoms require immediate evaluation. Do not delay emergency care.
                            </p>
                          </div>
                        )}

                        {/* Message Content */}
                        <div className="whitespace-pre-line font-normal leading-relaxed text-[#1E0817]">
                          {msg.text}
                        </div>

                        {/* Traditional Local Nigerian Foods / Herbs */}
                        {isBot && msg.localFoods && msg.localFoods.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#F0E5EA]">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8C233C] mb-1.5">
                              <Utensils size={13} />
                              <span>Traditional SCD Nutrition & Herbs:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.localFoods.map((food, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 bg-[#FDF2F4] text-[#8C233C] border border-[#FCEAEF] rounded-lg text-[11px] font-medium"
                                >
                                  {food}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive In-App Tool Shortcuts */}
                        {isBot && msg.suggestedTools && msg.suggestedTools.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#F0E5EA] flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A626E] mr-1">
                              Quick Actions:
                            </span>
                            {msg.suggestedTools.map((tool, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleToolClick(tool)}
                                className="px-3 py-1 bg-[#FAF6F8] hover:bg-[#FBE4E8] text-[#C4122F] hover:text-[#9B0D24] rounded-full text-[11px] font-semibold border border-[#EADDE2] hover:border-[#F8B4C0] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <span>{tool}</span>
                                <ArrowRight size={11} />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Bot Bubble Footer: Timestamp & Audio Read Aloud */}
                        {isBot && (
                          <div className="mt-3 pt-2 flex items-center justify-between text-[10px] text-[#7A626E] border-t border-[#F5EDF1]">
                            <span className="font-mono">{msg.timestamp}</span>
                            <button
                              type="button"
                              onClick={() => handleSpeak(msg.text, msg.id)}
                              className={`flex items-center gap-1.5 transition cursor-pointer px-2.5 py-1 rounded-full text-[11px] font-medium ${
                                isSpeaking && speakingMsgId === msg.id
                                  ? 'bg-[#C4122F] text-white shadow-xs'
                                  : 'text-[#7A626E] hover:text-[#C4122F] hover:bg-[#FDF2F4]'
                              }`}
                            >
                              {isSpeaking && speakingMsgId === msg.id ? (
                                <>
                                  <VolumeX size={13} />
                                  <span>Stop Audio</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 size={13} />
                                  <span>Listen (Audio)</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* User Bubble Footer: Timestamp */}
                        {!isBot && (
                          <div className="mt-1 flex items-center justify-end text-[10px] text-[#D9B9CC] font-mono">
                            <span>{msg.timestamp}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Topics Carousel */}
              <div className="px-3 py-2.5 bg-white border-t border-[#EADDE2] overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-[#7A626E] uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles size={12} className="text-[#C4122F]" />
                  <span>Topics:</span>
                </span>
                {(PRESET_QUERIES[selectedLang] || PRESET_QUERIES.en).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.query)}
                    className="px-3 py-1.5 bg-[#FAF6F8] hover:bg-[#FBE4E8] text-[#3B0F2C] hover:text-[#C4122F] text-xs font-semibold rounded-full border border-[#EADDE2] hover:border-[#F8B4C0] whitespace-nowrap transition cursor-pointer shadow-xs"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 sm:p-4 bg-white border-t border-[#EADDE2] flex items-center gap-2 shrink-0">
                <div className="flex-1 flex items-center bg-[#FAF6F8] border border-[#EADDE2] focus-within:border-[#C4122F] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#C4122F]/15 rounded-full px-4 py-1 transition-all shadow-xs">
                  <input
                    type="text"
                    placeholder={
                      selectedLang === 'yo' 
                        ? 'Béèrè nípa omi, oúnjẹ, tàbí ìrora...' 
                        : selectedLang === 'ha'
                        ? 'Tambayi game da ruwa, abinci, ko ciwo...'
                        : selectedLang === 'ig'
                        ? 'Jụọ banyere mmiri, nri, ma ọ bụ mgbu...'
                        : 'Ask about hydration, pain crisis, Nigerian nutrition, or Hydroxyurea...'
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    className="flex-1 bg-transparent py-2 text-xs sm:text-sm text-[#3B0F2C] placeholder:text-[#9B8591] outline-none"
                  />

                  {/* Voice Dictation Button */}
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`p-1.5 rounded-full transition cursor-pointer ${
                      isListening
                        ? 'bg-[#C4122F] text-white animate-pulse'
                        : 'text-[#7A626E] hover:text-[#C4122F] hover:bg-white'
                    }`}
                    title={isListening ? "Listening... click to stop" : "Speak your query"}
                    aria-label="Voice input"
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className="p-3 bg-[#C4122F] hover:bg-[#A80F28] disabled:bg-[#F1E6EC] disabled:text-[#BFA5B3] text-white rounded-full transition cursor-pointer shadow-sm disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
                  title="Send message"
                  aria-label="Send message"
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
