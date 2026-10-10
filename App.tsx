
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
            labels={{
              home: t.home,
              chat: t.chat,
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

      {/* Emergency Action & Offline Multilingual AI Companion */}
      <div data-semantic className="fixed bottom-[calc(4.5rem+var(--safe-area-bottom)+0.75rem)] left-3 right-3 z-50 flex h-11 items-center justify-end gap-2 md:inset-x-0 md:left-64 md:bottom-0 md:h-[calc(4rem+var(--safe-area-bottom))] md:gap-3 md:border-t md:border-line md:bg-surface md:px-4 md:pb-[var(--safe-area-bottom)]" aria-label="Patient support">
        <EmergencyButton userId={user?.uid || ''} />
        <OfflineWarriorAI
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
          onNavigateToTool={handleToolNavigation}
        />
      </div>
    </>
  );
};

export default App;
