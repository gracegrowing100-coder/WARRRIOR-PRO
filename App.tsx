
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Gamepad2, 
  MessageSquare, 
  Video, 
  Users, 
  Megaphone, 
  User,
  Activity,
  Sun,
  Moon,
  Eye,
  Globe,
  WifiOff,
  ShieldCheck
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import GamesHub from './components/GamesHub';
import ChatSystem from './components/ChatSystem';
import Telemedicine from './components/Telemedicine';
import Community from './components/Community';
import Advocacy from './components/Advocacy';
import UserProfile from './components/UserProfile';
import { auth, subscribeToAuth } from './firebase-init';
import { EmergencyButton } from './components/EmergencyButton';
import { AuthFlow } from './components/AuthFlow';
import { OfflineWarriorAI } from './components/OfflineWarriorAI';
import { SyntheticDemo } from './components/SyntheticDemo';
import { AppHeader, AppShell, PageContainer } from './components/layout';
import { SupportedLanguage, APP_TRANSLATIONS } from './services/offlineKnowledgeBase';

export type Page = 'home' | 'games' | 'chat' | 'telemedicine' | 'community' | 'advocacy';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState(auth.currentUser);
  const [authResolved, setAuthResolved] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Multilingual state (English, Yoruba, Hausa, Igbo)
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('warrior_language') as SupportedLanguage) || 'en';
  });

  // Offline status monitoring
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    localStorage.setItem('warrior_language', newLang);
  };

  // Dynamic unified dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('warrior_theme') === 'dark';
  });

  // Dynamic high contrast state
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('warrior_high_contrast') === 'true';
  });

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem('warrior_theme', nextTheme ? 'dark' : 'light');
  };

  const toggleHighContrast = () => {
    const nextVal = !highContrast;
    setHighContrast(nextVal);
    localStorage.setItem('warrior_high_contrast', nextVal ? 'true' : 'false');
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
      setAuthResolved(true);
      // Sync dark mode & high contrast style when auth state updates
      const isDark = localStorage.getItem('warrior_theme') === 'dark';
      setDarkMode(isDark);
      const isHighContrast = localStorage.getItem('warrior_high_contrast') === 'true';
      setHighContrast(isHighContrast);
    });
    return () => unsub();
  }, []);


  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '') as Page;
      const validPages: Page[] = ['home', 'games', 'chat', 'telemedicine', 'community', 'advocacy'];
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (to: Page) => {
    setCurrentPage(to);
    try {
      window.location.hash = `/${to}`;
    } catch (e) {
      console.warn("Navigation hash update blocked, relying on state.");
    }
  };

  const handleToolNavigation = (toolName: string) => {
    const lower = toolName.toLowerCase();
    if (lower.includes('water') || lower.includes('hydration') || lower.includes('pain') || lower.includes('medication') || lower.includes('report') || lower.includes('wisdom')) {
      navigate('home');
      setTimeout(() => {
        const el = document.getElementById(
          lower.includes('water') ? 'water-intake-tracker-module' :
          lower.includes('pain') ? 'pain-trends-chart-card' :
          lower.includes('medication') ? 'medication-reminder-card' : 'home-header-stats'
        );
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } else if (lower.includes('sos') || lower.includes('emergency')) {
      const sosBtn = document.getElementById('emergency-sos-action-button');
      if (sosBtn) sosBtn.click();
    } else if (lower.includes('chat') || lower.includes('peer')) {
      navigate('chat');
    } else if (lower.includes('academy') || lower.includes('game')) {
      navigate('games');
    } else {
      navigate('home');
    }
  };

  const t = APP_TRANSLATIONS[language] || APP_TRANSLATIONS.en;

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Dashboard onNavigate={navigate} userId={user?.uid || ''} />;
      case 'games': return <GamesHub />;
      case 'chat': return <ChatSystem />;
      case 'telemedicine': return <Telemedicine />;
      case 'community': return <Community />;
      case 'advocacy': return <Advocacy />;
      default: return <Dashboard onNavigate={navigate} userId={user?.uid || ''} />;
    }
  };

  if (demoMode) {
    return <SyntheticDemo onExit={() => setDemoMode(false)} />;
  }

  if (!authResolved) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center" role="status" aria-live="polite">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-600 flex items-center justify-center font-black text-xl shadow-lg shadow-red-950/40">W</div>
          <p className="text-sm font-bold">Checking your secure session...</p>
          <p className="mt-1 text-xs text-slate-400">Warrior AI will open the correct workspace when verification finishes.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthFlow onAuthSuccess={(u) => setUser(u)} onOpenDemo={() => setDemoMode(true)} />;
  }

  return (
    <>
      <AnimatePresence>
        {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      </AnimatePresence>

      <AppShell
        navigation={(
          <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-4 py-2 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:flex-col md:w-20 md:h-screen md:py-8">
            <NavItem onClick={() => navigate('home')} icon={<Home size={24} />} label={t.home} active={currentPage === 'home'} />
            <NavItem onClick={() => navigate('games')} icon={<Gamepad2 size={24} />} label={t.play} active={currentPage === 'games'} />
            <NavItem onClick={() => navigate('chat')} icon={<MessageSquare size={24} />} label={t.chat} active={currentPage === 'chat'} />
            <NavItem onClick={() => navigate('telemedicine')} icon={<Video size={24} />} label={t.care} active={currentPage === 'telemedicine'} />
            <NavItem onClick={() => navigate('community')} icon={<Users size={24} />} label={t.group} active={currentPage === 'community'} />
            <NavItem onClick={() => navigate('advocacy')} icon={<Megaphone size={24} />} label={t.act} active={currentPage === 'advocacy'} />
          </nav>
        )}
        header={(
          <AppHeader
            appName={t.appName}
            connectivityLabel={isOffline ? 'Offline Mode (Local Knowledge)' : 'Live & Offline Protected'}
            isOffline={isOffline}
            onHome={() => navigate('home')}
            actions={(
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Multilingual Selector */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-2 py-1">
                  <Globe size={14} className="text-indigo-600 dark:text-indigo-400 mr-1.5 shrink-0" />
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                    className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                    aria-label="Select Language"
                  >
                    <option value="en">English</option>
                    <option value="yo">Yorùbá</option>
                    <option value="ha">Hausa</option>
                    <option value="ig">Igbo</option>
                  </select>
                </div>
                
                {/* Real-time High Contrast Mode Toggle */}
                <button
                  onClick={toggleHighContrast}
                  title="Toggle High Contrast Mode"
                  aria-label="Toggle High Contrast Mode"
                  className={`p-2 rounded-xl transition-all cursor-pointer border ${
                    highContrast 
                      ? 'bg-yellow-400 text-black border-black font-black ring-2 ring-yellow-300' 
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 border-transparent'
                  }`}
                >
                  <Eye size={18} />
                </button>

                {/* Real-time Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle layout theme"
                  className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 transition-all cursor-pointer"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div 
                  className={`p-2 rounded-xl cursor-pointer transition-all ${showProfile ? 'bg-red-50 text-red-600 dark:bg-red-950/35 dark:text-red-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300'}`}
                  onClick={() => setShowProfile(true)}
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-lg object-cover" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
              </div>
            )}
          />
        )}
      >
        <PageContainer>{renderPage()}</PageContainer>
      </AppShell>

      {/* Emergency Action & Offline Multilingual AI Companion */}
      <EmergencyButton userId={user?.uid || ''} />
      <OfflineWarriorAI 
        currentLanguage={language} 
        onLanguageChange={handleLanguageChange}
        onNavigateToTool={handleToolNavigation}
      />
    </>
  );
};

const NavItem = ({ onClick, icon, label, active }: { onClick: () => void, icon: React.ReactNode, label: string, active: boolean }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all group ${active ? 'text-red-600 dark:text-red-400' : 'text-gray-400 hover:text-red-400'}`}
  >
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-red-50 dark:bg-red-950/20' : 'group-hover:bg-gray-50 dark:group-hover:bg-slate-800/60'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest md:hidden">{label}</span>
  </button>
);

export default App;
