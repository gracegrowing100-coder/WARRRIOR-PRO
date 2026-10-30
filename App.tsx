import React, { useState, useEffect } from 'react';
import { 
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
import ChatWorkspace from './components/ChatWorkspace';
import Telemedicine from './components/Telemedicine';
import Community from './components/Community';
import Advocacy from './components/Advocacy';
import UserProfile from './components/UserProfile';
import { auth, subscribeToAuth } from './firebase-init';
import { EmergencyButton } from './components/EmergencyButton';
import { AuthFlow } from './components/AuthFlow';
import { OfflineWarriorAI } from './components/OfflineWarriorAI';
import { SyntheticDemo } from './components/SyntheticDemo';
import { CareHub } from './components/care';
import { SosPill } from './components/ui';
import { WarriorMark, Spark } from './components/brand';
import {
  AppHeader,
  AppShell,
  MoreMenu,
  PageContainer,
  PatientNavigation,
  type PatientNavigationDestination,
} from './components/layout';
import { SupportedLanguage, APP_TRANSLATIONS } from './services/offlineKnowledgeBase';
import { firebaseService } from './services/firebaseService';

export type Page = 'home' | 'games' | 'chat' | 'care' | 'telemedicine' | 'community' | 'more' | 'advocacy';

const pageFromHash = (): Page => {
  const page = window.location.hash.replace('#/', '') as Page;
  return (['home', 'games', 'chat', 'care', 'telemedicine', 'community', 'more', 'advocacy'] as Page[]).includes(page)
    ? page
    : 'home';
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(pageFromHash);
  const [user, setUser] = useState<typeof auth.currentUser>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [authStartupNotice, setAuthStartupNotice] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Mira handoff: the patient-approved summary used to prefill an appointment
  // request. It is form state only — no request is created or sent from here.
  const [miraAppointmentDraft, setMiraAppointmentDraft] = useState('');
  
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
    let disposed = false;
    let authRevision = 0;
    let initialAuthStateHandled = false;
    const authResolutionTimeout = window.setTimeout(() => {
      if (disposed || initialAuthStateHandled) return;
      setAuthStartupNotice('We could not verify your saved session in this browser. Please sign in again or use a standard browser for Google sign-in.');
      setAuthResolved(true);
    }, 8_000);
    const unsub = subscribeToAuth((u) => {
      const revision = ++authRevision;
      // Sync dark mode & high contrast style when auth state updates
      const isDark = localStorage.getItem('warrior_theme') === 'dark';
      setDarkMode(isDark);
      const isHighContrast = localStorage.getItem('warrior_high_contrast') === 'true';
      setHighContrast(isHighContrast);

      if (initialAuthStateHandled) {
        // AuthFlow owns positive sign-in transitions so its UID/profile check
        // cannot be bypassed by onAuthStateChanged firing first.
        if (!u) {
          setUser(null);
          setAuthResolved(true);
        }
        return;
      }

      initialAuthStateHandled = true;
      window.clearTimeout(authResolutionTimeout);
      setAuthStartupNotice(null);
      if (!u) {
        setUser(null);
        setAuthResolved(true);
        return;
      }

      void firebaseService.getUserProfileState(u.uid).then((profile) => {
        if (disposed || revision !== authRevision) return;
        setUser(profile.state === 'recorded' || profile.state === 'cached' ? u : null);
        setAuthResolved(true);
      }).catch(() => {
        if (disposed || revision !== authRevision) return;
        setUser(null);
        setAuthResolved(true);
      });
    });
    return () => {
      disposed = true;
      window.clearTimeout(authResolutionTimeout);
      unsub();
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(pageFromHash());
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

  const currentNavigationDestination: PatientNavigationDestination =
    currentPage === 'telemedicine' || currentPage === 'care'
      ? 'care'
      : currentPage === 'games' || currentPage === 'advocacy' || currentPage === 'more'
        ? 'more'
        : currentPage;

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Dashboard onNavigate={navigate} userId={user?.uid || ''} />;
      case 'games': return <GamesHub />;
      case 'chat': return (
        <ChatWorkspace
          userId={user?.uid || ''}
          onContinueToAppointment={(approvedSummary) => {
            setMiraAppointmentDraft(approvedSummary);
            navigate('telemedicine');
          }}
        />
      );
      case 'care': return <CareHub userId={user?.uid || ''} onOpenAppointments={() => navigate('telemedicine')} />;
      case 'telemedicine': return (
        <Telemedicine
          userId={user?.uid || ''}
          initialReason={miraAppointmentDraft}
          onInitialReasonConsumed={() => setMiraAppointmentDraft('')}
          onBackToCare={() => navigate('care')}
        />
      );
      case 'community': return <Community />;
      case 'more': return <MoreMenu onNavigate={navigate} />;
      case 'advocacy': return <Advocacy />;
      default: return <Dashboard onNavigate={navigate} userId={user?.uid || ''} />;
    }
  };

  if (demoMode) {
    return <SyntheticDemo onExit={() => setDemoMode(false)} />;
  }

  if (!authResolved) {
    return (
      <div className="h-[100dvh] w-full bg-[var(--wa-hero)] text-white relative overflow-hidden flex flex-col items-center justify-center font-body" role="status" aria-live="polite">
        {/* Concentric coral rings */}
        <div aria-hidden="true" className="absolute w-[640px] h-[640px] rounded-full border border-wa-coral/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div aria-hidden="true" className="absolute w-[460px] h-[460px] rounded-full border border-wa-coral/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div aria-hidden="true" className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(232,52,79,0.35)_0%,rgba(232,52,79,0)_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* 3 tiny sparks */}
        <Spark className="absolute top-[20%] left-[18%] w-[18px] h-[18px] text-wa-coral/70" />
        <Spark className="absolute top-[30%] right-[16%] w-[12px] h-[12px] text-wa-ground/60" />
        <Spark className="absolute bottom-[30%] right-[22%] w-[14px] h-[14px] text-wa-coral/60" />

        {/* Center mark + lockup */}
        <div className="relative flex flex-col items-center gap-7 -mt-10">
          <WarriorMark className="w-[120px] h-[160px] text-wa-coral" color="currentColor" />
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-[38px] tracking-tight text-white">Warrior</span>
            <span className="font-display font-bold text-[19px] bg-wa-crimson text-white rounded-[10px] px-2.5 py-0.5">AI</span>
          </div>
        </div>

        {/* Bottom progress bar + pilot disclaimer */}
        <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-4">
          <div className="w-[120px] h-1 rounded-full bg-white/15 overflow-hidden">
            <div className="w-[55%] h-full rounded-full bg-wa-coral animate-pulse" />
          </div>
          <span className="text-[13px] text-wa-on-plum-muted">Pilot version · sample data only</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthFlow initialNotice={authStartupNotice} onAuthSuccess={(u) => setUser(u)} onOpenDemo={() => setDemoMode(true)} />;
  }

  return (
    <>
      <AnimatePresence>
        {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      </AnimatePresence>

      <AppShell
        navigation={(
          <PatientNavigation
            currentDestination={currentNavigationDestination}
            onNavigate={navigate}
            appName={t.appName}
            connectivityLabel={isOffline ? 'Offline Mode' : 'Live & Offline Protected'}
            isOffline={isOffline}
            profileLabel={user?.displayName || 'Your profile'}
            profilePhotoUrl={user?.photoURL}
            onOpenProfile={() => setShowProfile(true)}
            hidden={showProfile}
            labels={{
              home: t.home,
              chat: 'Mira',
              care: t.care,
              community: language === 'en' ? 'Community' : t.group,
              more: 'More',
            }}
          />
        )}
        header={(
          <AppHeader
            appName={t.appName}
            connectivityLabel={isOffline ? 'Offline Mode (Local Knowledge)' : 'Live & Offline Protected'}
            isOffline={isOffline}
            onHome={() => navigate('home')}
            actions={(
              <div className="flex items-center justify-end gap-2 sm:gap-3">
                <SosPill className="md:hidden" />
                {/* Multilingual Selector */}
                <div className="flex min-h-11 items-center rounded-control border border-line bg-surface-subtle px-2">
                  <Globe size={18} className="mr-1.5 shrink-0 text-foreground-secondary" />
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                    className="min-h-11 bg-transparent text-body font-medium text-foreground focus-visible:outline-focus"
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
                  data-ui-control
                  aria-pressed={highContrast}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line ${highContrast ? 'bg-action text-foreground-inverse' : 'bg-surface-subtle text-foreground'}`}
                >
                  <Eye size={18} />
                </button>

                {/* Real-time Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle layout theme"
                  data-ui-control
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-subtle text-foreground"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

              </div>
            )}
            accountAction={(
              <button
                type="button"
                aria-label="Open profile"
                aria-expanded={showProfile}
                data-ui-control
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${showProfile ? 'bg-action text-foreground-inverse' : 'bg-surface-subtle text-foreground'}`}
                onClick={() => setShowProfile(true)}
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="h-6 w-6 rounded-lg object-cover" />
                ) : (
                  <User size={18} />
                )}
              </button>
            )}
          />
        )}
      >
        <PageContainer width={currentPage === 'home' ? 'home' : 'patient'}>{renderPage()}</PageContainer>
      </AppShell>

      {/* Emergency Action & Offline Multilingual AI Companion (modal overlays preserved, floating buttons hidden) */}
      <EmergencyButton userId={user?.uid || ''} hideFloatingButton />
      <OfflineWarriorAI
        currentLanguage={language}
        onLanguageChange={handleLanguageChange}
        onNavigateToTool={handleToolNavigation}
        hideFloatingButton
      />
    </>
  );
};

export default App;
