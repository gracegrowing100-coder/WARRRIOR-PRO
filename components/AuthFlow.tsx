import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Droplets,
  Heart,
  Stethoscope,
  CloudRain,
  Thermometer,
  Zap,
  Moon,
  Sun,
  HeartPulse,
  Wind,
  Shield,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  auth,
  registerWithEmail,
  loginWithEmail,
  sendPasswordReset,
  triggerEmailVerification,
  updateUserDisplayNameAndPhoto,
  loginWithGoogle,
  configureAuthPersistence,
  linkPendingGoogleCredential,
} from '../firebase-init';
import { firebaseService } from '../services/firebaseService';
import { WarriorMark, Spark } from './brand';
import {
  Button,
  OptionCard,
  ProgressSegments,
  FormField,
  Input,
} from './ui';

interface AuthFlowProps {
  onAuthSuccess: (user: any) => void;
  onOpenDemo: () => void;
  initialNotice?: string | null;
}

interface GenotypeOption {
  code: string;
  badge: string;
  name: string;
  note: string;
  hydrationTarget: number;
}

const CLINICAL_GENOTYPES: GenotypeOption[] = [
  {
    code: 'SS',
    badge: 'SS',
    name: 'Sickle cell anaemia',
    note: 'HbSS',
    hydrationTarget: 3.8,
  },
  {
    code: 'SC',
    badge: 'SC',
    name: 'HbSC disease',
    note: 'Two different variants',
    hydrationTarget: 3.5,
  },
  {
    code: 'Sβ0',
    badge: 'Sβ⁰',
    name: 'Sickle beta-zero thalassaemia',
    note: 'HbSβ⁰',
    hydrationTarget: 3.8,
  },
  {
    code: 'Sβ+',
    badge: 'Sβ⁺',
    name: 'Sickle beta-plus thalassaemia',
    note: 'HbSβ⁺',
    hydrationTarget: 3.3,
  },
  {
    code: 'AS',
    badge: 'AS',
    name: 'Carrier (trait)',
    note: 'For wellness tracking',
    hydrationTarget: 3.0,
  },
  {
    code: 'Other',
    badge: '?',
    name: 'Other, or not sure yet',
    note: "We'll keep things general",
    hydrationTarget: 3.2,
  },
];

const PRESET_MEDS = [
  { id: 'Hydroxyurea (Daily Capsule)', name: 'Hydroxyurea', form: 'Daily capsule' },
  { id: 'Folic Acid (Daily Support)', name: 'Folic acid', form: 'Daily tablet' },
  { id: 'Penicillin V (Prophylactic)', name: 'Penicillin V', form: 'Daily, to prevent infection' },
  { id: 'Crizanlizumab (IV Infusion)', name: 'Crizanlizumab', form: 'IV infusion' },
  { id: 'Voxelotor (Sickle-Targeted)', name: 'Voxelotor', form: 'Daily tablet' },
  { id: 'L-Glutamine (Oral Powder)', name: 'L-Glutamine', form: 'Oral powder' },
];

const PRESET_TRIGGERS = [
  {
    id: 'Sudden Atmospheric Cold (Thermal Shock)',
    label: 'Cold weather or rain',
    icon: CloudRain,
  },
  {
    id: 'Extreme Dryness / Passive Dehydration',
    label: 'Not drinking enough water',
    icon: Droplets,
  },
  {
    id: 'Infectious Fever or Physiological Load',
    label: 'Fever or infection',
    icon: Thermometer,
  },
  {
    id: 'Strenuous Skeletal Fatigue / Exhaustion',
    label: 'Overdoing it physically',
    icon: Zap,
  },
  {
    id: 'Prolonged Sleep Deficit',
    label: 'Poor sleep',
    icon: Moon,
  },
  {
    id: 'Emotional Distress or Sympathetic Stress',
    label: 'Stress or worry',
    icon: HeartPulse,
  },
  {
    id: 'Hypoxia / Low Oxygen Environments',
    label: 'Low oxygen (flights, high places)',
    icon: Wind,
  },
];

export const AuthFlow: React.FC<AuthFlowProps> = ({
  onAuthSuccess,
  onOpenDemo,
  initialNotice = null,
}) => {
  // Navigation screen states
  const [screen, setScreen] = useState<'landing' | 'login' | 'signup' | 'forgot' | 'onboarding'>('landing');

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('warrior_theme') === 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem('warrior_theme', nextTheme ? 'dark' : 'light');
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  // Loading and feedback states
  const [isSubmit, setIsSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(initialNotice);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<string | null>(null);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign up inputs
  const [fullName, setFullName] = useState('');
  const [phoneCode] = useState('+234');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [userRole, setUserRole] = useState<'Person with Sickle Cell Disease' | 'Caregiver / Parent' | 'Healthcare Professional'>('Person with Sickle Cell Disease');
  const [agreeTOS, setAgreeTOS] = useState(false);
  const [agreeHealthConsent, setAgreeHealthConsent] = useState(false);

  // Emergency contact
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Password strength
  const [pwdStrength, setPwdStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    score: 0,
  });

  useEffect(() => {
    const length = password.length >= 8;
    const uppercase = /[A-Z]/.test(password);
    const lowercase = /[a-z]/.test(password);
    const number = /[0-9]/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);

    let score = 0;
    if (length) score += 25;
    if (uppercase && lowercase) score += 25;
    if (number) score += 25;
    if (special) score += 25;

    setPwdStrength({ length, uppercase, lowercase, number, special, score });
  }, [password]);

  // Load saved credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem('warrior_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Onboarding sequence state
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [scdType, setScdType] = useState('SS');
  const [medicationsList, setMedicationsList] = useState<string[]>(['Hydroxyurea (Daily Capsule)', 'Folic Acid (Daily Support)']);
  const [newCustomMed, setNewCustomMed] = useState('');
  const [crisisTriggersList, setCrisisTriggersList] = useState<string[]>([
    'Sudden Atmospheric Cold (Thermal Shock)',
    'Extreme Dryness / Passive Dehydration',
  ]);
  const [newCustomTrigger, setNewCustomTrigger] = useState('');
  const [targetHydration, setTargetHydration] = useState(3.8);

  const resumedAuthenticatedUser = useRef(false);

  const getValidationError = () => {
    if (!fullName.trim()) return 'Please add your name.';
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "That email doesn't look right.";
    if (phoneNumber && !phoneNumber.match(/^\d{4,15}$/)) return 'Please check your phone number.';
    if (!dob) return 'Add your date of birth so reminders fit you.';
    if (pwdStrength.score < 75) return 'Your password needs a few more things (see the checklist).';
    if (password !== confirmPassword) return 'Your passwords do not match.';
    if (!agreeTOS) return 'Please agree to the Terms to continue.';
    if (!agreeHealthConsent) return 'We need your OK to store your health logs.';
    return null;
  };

  const continueAfterAuthentication = useCallback(async (fbUser: FirebaseUser) => {
    setLoadingPhase('Retrieving profile...');
    const profile = await firebaseService.getUserProfileState(fbUser.uid);

    if (profile.state === 'recorded' || profile.state === 'cached') {
      setLoadingPhase(null);
      onAuthSuccess(fbUser);
      return;
    }

    if (profile.state === 'missing') {
      setFullName(fbUser.displayName || fbUser.email?.split('@')[0] || '');
      setEmail(fbUser.email || '');
      setScreen('onboarding');
      setOnboardingStep(1);
      setLoadingPhase(null);
      return;
    }

    setLoadingPhase(null);
    throw Object.assign(
      new Error('We could not confirm your existing profile. Check your connection and try again.'),
      { code: 'profile/unavailable' },
    );
  }, [onAuthSuccess]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || resumedAuthenticatedUser.current) return;
    resumedAuthenticatedUser.current = true;

    void continueAfterAuthentication(currentUser).catch(() => {
      setGeneralError('We could not confirm your existing profile. Check your connection and try again.');
    });
  }, [continueAfterAuthentication]);

  // Safe Authentication submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    if (!email || !password) {
      setGeneralError('Email or password is wrong. Try again or reset your password.');
      return;
    }

    setIsSubmit(true);
    setLoadingPhase('Checking your sign-in details...');
    try {
      await configureAuthPersistence(rememberMe);
      const fbUser = await loginWithEmail(email, password);
      await linkPendingGoogleCredential(fbUser);
      if (rememberMe) {
        localStorage.setItem('warrior_remembered_email', email);
      } else {
        localStorage.removeItem('warrior_remembered_email');
      }

      await continueAfterAuthentication(fbUser);
    } catch (err: any) {
      setLoadingPhase(null);
      const isHandledError = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-email'].includes(err?.code);
      if (typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) && isHandledError) {
        console.info('[Auth] Password sign-in rejected.', { code: err?.code || 'unknown' });
      }
      if (!isHandledError) {
        console.error('Authentication submit error:', err);
      }
      let errMsg = 'Email or password is wrong. Try again or reset your password.';
      if (err.code === 'auth/network-request-failed') {
        errMsg = 'Network connection issue. Check your internet connection and reload.';
      } else if (err.code === 'profile/unavailable') {
        errMsg = 'We could not confirm your existing profile. Check your connection and try again.';
      } else if (err.code === 'auth/account-link-email-mismatch') {
        errMsg = 'The Google account does not match this signed-in account. No accounts or patient records were linked.';
      }
      setGeneralError(errMsg);
    } finally {
      setIsSubmit(false);
    }
  };

  // Safe Registration submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setGeneralError(null);

    const valError = getValidationError();
    if (valError) {
      setGeneralError(valError);
      return;
    }

    setIsSubmit(true);
    setLoadingPhase('Creating your profile...');
    try {
      await configureAuthPersistence(rememberMe);
      const fbUser = await registerWithEmail(email, password);
      await updateUserDisplayNameAndPhoto(fullName);

      try {
        await triggerEmailVerification();
      } catch (e) {
        console.warn('Could not dispatch initial verification link:', e);
      }

      setLoadingPhase('Setting up your health workspace...');
      const userId = fbUser.uid;
      const currentSelectedGenotype = userRole === 'Person with Sickle Cell Disease' ? scdType : 'N/A';

      const profilePayload = {
        displayName: fullName || fbUser.displayName || 'Anonymous Warrior',
        role: userRole,
        email: fbUser.email || email,
        ...(dob ? { age: Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) } : {}),
        city: city || 'Not Specified',
        bloodType: 'Not Specified',
        scdType: currentSelectedGenotype,
        streak: 0,
        photoURL: fbUser.photoURL || '',
        lastActiveDate: new Date().toLocaleDateString('sv'),
      };

      await firebaseService.createUserProfile(userId, profilePayload);

      // Save selected meds
      if (medicationsList.length > 0) {
        for (const med of medicationsList) {
          await firebaseService.addMedication(userId, {
            name: med,
            dosage: 'Not specified',
            time: '08:00',
            category: 'Refinement Daily',
            checkedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            active: true,
          });
        }
      }

      // Save emergency contact if entered
      if (emergencyContactName.trim() || emergencyContactPhone.trim()) {
        await firebaseService.saveEmergencyInfo(userId, {
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
        });
      }

      // Go to onboarding steps
      setScreen('onboarding');
      setOnboardingStep(1);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        try {
          const loggedInUser = await loginWithEmail(email, password);
          await continueAfterAuthentication(loggedInUser);
          return;
        } catch {
          setGeneralError('Email already registered. Sign in with your password to continue.');
        }
      } else {
        const isHandledError = ['auth/weak-password', 'auth/invalid-email'].includes(err?.code);
        if (!isHandledError) {
          console.error('Registration error:', err);
        }
        let errMsg = 'Could not create profile. Please review your details and try again.';
        if (err.code === 'auth/weak-password') {
          errMsg = 'Your password needs a few more things (see the checklist).';
        } else if (err.code === 'auth/invalid-email') {
          errMsg = "That email doesn't look right.";
        }
        setGeneralError(errMsg);
      }
    } finally {
      setIsSubmit(false);
      setLoadingPhase(null);
    }
  };

  // Google Provider flow
  const handleGoogleAuth = async () => {
    setGeneralError(null);
    setGeneralSuccess(null);
    setIsSubmit(true);
    setLoadingPhase('Connecting with Google...');
    try {
      await configureAuthPersistence(true);
      const googleUser = await loginWithGoogle(false);
      if (googleUser) {
        await continueAfterAuthentication(googleUser);
      }
    } catch (err: any) {
      setLoadingPhase(null);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setGeneralSuccess('Google sign-in was cancelled. You can try again when you are ready.');
      } else if (err?.code === 'auth/account-exists-with-different-credential') {
        const existingEmail = err?.customData?.email || '';
        setEmail(existingEmail);
        setScreen('login');
        setGeneralError('This email already has a Warrior AI account. Sign in with its existing password to link Google to the same Firebase user. No patient records will be copied or merged.');
      } else if (err?.code === 'profile/unavailable') {
        setGeneralError('We could not confirm your existing profile. Check your connection and try again.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setGeneralError('Google sign-in is not enabled for this address. Open http://localhost:3000 and try again.');
      } else {
        console.error('Google authentication failed:', err);
        setGeneralError('Google sign-in could not be completed. Please retry or sign in with your email.');
      }
    } finally {
      setIsSubmit(false);
    }
  };

  // Recover password
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setGeneralSuccess(null);
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setGeneralError("That email doesn't look right.");
      return;
    }

    setIsSubmit(true);
    try {
      await sendPasswordReset(email);
      setGeneralSuccess('Check your inbox. We sent a reset link to your email.');
    } catch (err: any) {
      console.error(err);
      setGeneralError('We could not send a reset link. Check the email address and try again.');
    } finally {
      setIsSubmit(false);
    }
  };

  // Complete onboarding
  const handleOnboardingComplete = async () => {
    if (!auth.currentUser) {
      setGeneralError('User authentication expired. Please sign in again.');
      return;
    }

    setIsSubmit(true);
    setLoadingPhase('Saving your setup...');
    const userId = auth.currentUser.uid;
    const currentSelectedGenotype = userRole === 'Person with Sickle Cell Disease' ? scdType : 'N/A';

    const profilePayload = {
      displayName: fullName || auth.currentUser.displayName || 'Anonymous Warrior',
      role: userRole,
      email: auth.currentUser.email || email,
      ...(dob ? { age: Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) } : {}),
      city: city || 'Not Specified',
      bloodType: 'Not Specified',
      scdType: currentSelectedGenotype,
      streak: 0,
      photoURL: auth.currentUser.photoURL || '',
      lastActiveDate: new Date().toLocaleDateString('sv'),
    };

    try {
      await firebaseService.createUserProfile(userId, profilePayload);

      if (medicationsList.length > 0) {
        for (const med of medicationsList) {
          await firebaseService.addMedication(userId, {
            name: med,
            dosage: 'Not specified',
            time: '08:00',
            category: 'Refinement Daily',
            checkedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            active: true,
          });
        }
      }

      if (emergencyContactName.trim() || emergencyContactPhone.trim()) {
        await firebaseService.saveEmergencyInfo(userId, {
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
        });
      }

      onAuthSuccess(auth.currentUser);
    } catch (err: any) {
      console.error(err);
      setGeneralError('Could not save your setup. Please check your connection and try again.');
    } finally {
      setIsSubmit(false);
      setLoadingPhase(null);
    }
  };

  const addCustomMed = () => {
    if (newCustomMed.trim() && !medicationsList.includes(newCustomMed.trim())) {
      setMedicationsList(prev => [...prev, newCustomMed.trim()]);
      setNewCustomMed('');
    }
  };

  const removeMed = (medToRemove: string) => {
    setMedicationsList(prev => prev.filter(m => m !== medToRemove));
  };

  const toggleMed = (medId: string) => {
    if (medicationsList.includes(medId)) {
      setMedicationsList(prev => prev.filter(m => m !== medId));
    } else {
      setMedicationsList(prev => [...prev, medId]);
    }
  };

  const toggleTrigger = (triggerId: string) => {
    if (crisisTriggersList.includes(triggerId)) {
      setCrisisTriggersList(prev => prev.filter(t => t !== triggerId));
    } else {
      setCrisisTriggersList(prev => [...prev, triggerId]);
    }
  };

  const addCustomTrigger = () => {
    if (newCustomTrigger.trim() && !crisisTriggersList.includes(newCustomTrigger.trim())) {
      setCrisisTriggersList(prev => [...prev, newCustomTrigger.trim()]);
      setNewCustomTrigger('');
    }
  };

  const handleGenotypeSelect = (opt: GenotypeOption) => {
    setScdType(opt.code);
    setTargetHydration(opt.hydrationTarget);
  };

  return (
    <div className="min-h-screen bg-wa-ground text-wa-plum flex flex-col font-body">
      {/* Loading overlay */}
      {loadingPhase && (
        <div className="fixed inset-0 z-50 bg-[var(--wa-hero)]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center">
          <Loader2 className="w-10 h-10 animate-spin text-wa-coral mb-4" />
          <p className="font-display font-bold text-lg">{loadingPhase}</p>
        </div>
      )}

      {/* LANDING SCREEN (02) */}
      {screen === 'landing' && (
        <div className="w-full max-w-md mx-auto min-h-screen bg-[var(--wa-hero)] text-wa-plum flex flex-col relative overflow-hidden">
          {/* Header */}
          <div className="p-5 flex items-center justify-between text-white relative z-10">
            <div className="flex items-center gap-2">
              <WarriorMark className="w-[22px] h-[29px] text-wa-coral" color="currentColor" />
              <span className="font-display font-extrabold text-[18px]">Warrior</span>
              <span className="font-display font-bold text-[11px] bg-wa-crimson text-white rounded-md px-1.5 py-0.5">AI</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-10 px-3 rounded-full border border-white/20 bg-transparent text-white text-[13px] font-semibold hover:bg-white/10 transition-colors"
                onClick={() => setGeneralSuccess('Language selector is available inside Mira and Profile.')}
              >
                English ▾
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Switch theme mode"
                className="w-10 h-10 rounded-full border border-white/20 bg-transparent text-white flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          {/* Graphic Area: 3 tilted cards */}
          <div aria-hidden="true" className="relative h-[290px] mt-1 select-none pointer-events-none">
            <div className="absolute w-[380px] h-[380px] rounded-full border border-wa-coral/25 left-1 -top-7 pointer-events-none" />

            {/* Pain Card */}
            <div className="absolute left-7 top-9 -rotate-6 bg-white text-wa-plum rounded-[22px] p-[14px_16px] w-[170px] shadow-2xl">
              <div className="text-[12px] text-wa-muted font-semibold">Pain today</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-display font-extrabold text-[32px] text-wa-crimson leading-none">3</span>
                <span className="font-semibold text-[14px]">/ 10 · easing</span>
              </div>
              <div className="grid grid-cols-10 gap-[3px] mt-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-wa-crimson" />
                ))}
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-[#F1E4EB]" />
                ))}
              </div>
            </div>

            {/* Water Card */}
            <div className="absolute right-6 top-[88px] rotate-[5deg] bg-wa-water text-white rounded-[22px] p-[14px_16px] w-[150px] shadow-2xl flex items-center gap-2.5">
              <svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true">
                <path d="M17 2C17 2 32 19 32 29a15 15 0 0 1-30 0C2 19 17 2 17 2Z" fill="rgba(255,255,255,0.2)" />
                <path d="M2.3 26h29.4A15 15 0 0 1 2 29c0-1 .1-2 .3-3Z" fill="#FFFFFF" />
              </svg>
              <div>
                <div className="font-display font-extrabold text-[20px] leading-tight">5 sachets</div>
                <div className="text-[12px] text-[#D6EEF1]">2.5 L of 3.8 L</div>
              </div>
            </div>

            {/* Mira Chat Bubble */}
            <div className="absolute left-11 top-[192px] -rotate-2 bg-wa-crimson text-white rounded-[22px_22px_22px_6px] p-[12px_16px] w-[256px] shadow-2xl text-[14px] leading-snug">
              <strong className="font-display font-bold">Mira: </strong>
              <span>Na hot day for Lagos. Keep one sachet close o.</span>
            </div>
          </div>

          {/* Headline */}
          <div className="px-6 pb-5 text-white">
            <h1 className="font-display font-extrabold text-[36px] tracking-tight leading-[1.02]">
              Live strong.<br />
              <span className="text-wa-coral">Track smart.</span>
            </h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-wa-on-plum-soft">
              Your sickle cell companion for pain, water, medicine and Mira, in your language.
            </p>
          </div>

          {/* Blush Bottom Sheet */}
          <div className="flex-1 bg-wa-ground rounded-t-[32px] p-6 flex flex-col gap-2.5 shadow-2xl">
            {generalError && (
              <div className="p-3 bg-wa-rose text-wa-crimson rounded-xl text-sm flex items-center gap-2 font-medium" role="alert">
                <AlertCircle size={16} className="shrink-0" />
                <span>{generalError}</span>
              </div>
            )}
            {generalSuccess && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-sm flex items-center gap-2 font-medium" role="status">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{generalSuccess}</span>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full h-14"
              onClick={() => setScreen('signup')}
            >
              Get started
            </Button>

            <Button
              variant="outline"
              aria-label="Sign in to your account"
              className="w-full h-14 bg-white"
              onClick={() => setScreen('login')}
            >
              Sign in
            </Button>

            <Button
              variant="secondary"
              aria-label="Continue with Google"
              className="w-full h-14 bg-white border border-wa-line flex items-center justify-center gap-3"
              onClick={handleGoogleAuth}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full text-wa-crimson font-semibold text-[15px]"
              onClick={onOpenDemo}
            >
              Try the demo first →
            </Button>

            <div className="flex-1 min-h-2" />

            <div className="text-center text-[12px] leading-relaxed text-wa-muted pt-2 border-t border-wa-line/60">
              <p>Pilot version for product evaluation. Use sample information only.</p>
              <div className="flex justify-center gap-3 mt-1 font-semibold">
                <button
                  type="button"
                  onClick={() => setGeneralSuccess('Terms of Use will be available in the production release.')}
                  className="hover:underline text-wa-crimson"
                >
                  Terms of Use
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setGeneralSuccess('Privacy Policy will be available in the production release.')}
                  className="hover:underline text-wa-crimson"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIGN UP SCREEN (03) */}
      {screen === 'signup' && (
        <div className="w-full max-w-md mx-auto min-h-screen bg-wa-ground text-wa-plum flex flex-col font-body">
          {/* Header */}
          <div className="bg-[var(--wa-hero)] text-white p-5 pb-7 rounded-b-[32px] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setScreen('landing')}
                aria-label="Back"
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-[13px] text-wa-on-plum-muted font-semibold">
                Account · then 5 quick steps
              </span>
            </div>
            <div>
              <h1 className="font-display font-extrabold text-[30px] tracking-tight">Create your profile</h1>
              <p className="mt-1.5 text-[15px] text-wa-on-plum-soft">
                Saved to your account and this phone, so it works offline.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRegisterSubmit} className="p-5 pb-8 flex flex-col gap-4">
            {generalError && (
              <div className="p-3 bg-wa-rose text-wa-crimson rounded-xl text-sm flex items-center gap-2 font-medium" role="alert">
                <AlertCircle size={16} className="shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Role Picker */}
            <fieldset className="border-0 m-0 p-0">
              <legend className="text-[14px] font-bold text-wa-plum mb-2">I am…</legend>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUserRole('Person with Sickle Cell Disease')}
                  className={`min-h-[84px] rounded-[18px] p-2 flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                    userRole === 'Person with Sickle Cell Disease'
                      ? 'border-2 border-wa-crimson bg-wa-rose text-wa-plum font-bold'
                      : 'border border-wa-line bg-wa-surface text-wa-plum font-semibold'
                  }`}
                >
                  <WarriorMark className="w-5 h-5 text-wa-crimson" color="currentColor" />
                  <span className="text-[12px] leading-tight">Living with sickle cell</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserRole('Caregiver / Parent')}
                  className={`min-h-[84px] rounded-[18px] p-2 flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                    userRole === 'Caregiver / Parent'
                      ? 'border-2 border-wa-crimson bg-wa-rose text-wa-plum font-bold'
                      : 'border border-wa-line bg-wa-surface text-wa-plum font-semibold'
                  }`}
                >
                  <Heart size={20} className={userRole === 'Caregiver / Parent' ? 'text-wa-crimson' : 'text-wa-muted'} />
                  <span className="text-[12px] leading-tight">A carer or parent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserRole('Healthcare Professional')}
                  className={`min-h-[84px] rounded-[18px] p-2 flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                    userRole === 'Healthcare Professional'
                      ? 'border-2 border-wa-crimson bg-wa-rose text-wa-plum font-bold'
                      : 'border border-wa-line bg-wa-surface text-wa-plum font-semibold'
                  }`}
                >
                  <Stethoscope size={20} className={userRole === 'Healthcare Professional' ? 'text-wa-crimson' : 'text-wa-muted'} />
                  <span className="text-[12px] leading-tight">A health worker</span>
                </button>
              </div>
            </fieldset>

            {/* Name */}
            <FormField
              label="Full name"
              error={submitted && !fullName.trim() ? 'Please add your name.' : undefined}
            >
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Akinwande Alexander"
              />
            </FormField>

            {/* Email */}
            <FormField
              label="Email"
              error={submitted && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? "That email doesn't look right." : undefined}
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormField>

            {/* Phone */}
            <FormField
              label={
                <span className="flex items-center justify-between w-full">
                  <span>Phone</span>
                  <span className="font-normal text-[13px] text-wa-muted">optional</span>
                </span>
              }
              error={submitted && phoneNumber && !phoneNumber.match(/^\d{4,15}$/) ? 'Please check your phone number.' : undefined}
            >
              <div className="flex gap-2">
                <span className="h-[52px] px-3.5 rounded-[16px] border border-wa-line bg-wa-surface flex items-center font-semibold text-[15px] text-wa-plum shrink-0">
                  {phoneCode} ▾
                </span>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="803 000 0000"
                  className="flex-1"
                />
              </div>
            </FormField>

            {/* DOB & City */}
            <div className="grid grid-cols-2 gap-2.5">
              <FormField
                label="Date of birth"
                error={submitted && !dob ? 'Add your date of birth so reminders fit you.' : undefined}
              >
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </FormField>

              <FormField label="City">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lagos"
                />
              </FormField>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <FormField
                label="Password"
                error={submitted && pwdStrength.score < 75 ? 'Your password needs a few more things (see the checklist).' : undefined}
              >
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 h-9 px-3 rounded-[12px] bg-wa-ground text-wa-plum text-[13px] font-semibold hover:bg-wa-line/50 transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </FormField>

              {/* Strength bar */}
              <div className="grid grid-cols-4 gap-1 pt-1" role="img" aria-label={`Password strength: ${pwdStrength.score}%`}>
                <div className={`h-1.5 rounded-full transition-colors ${pwdStrength.length ? 'bg-emerald-600' : 'bg-wa-line'}`} />
                <div className={`h-1.5 rounded-full transition-colors ${pwdStrength.uppercase && pwdStrength.lowercase ? 'bg-emerald-600' : 'bg-wa-line'}`} />
                <div className={`h-1.5 rounded-full transition-colors ${pwdStrength.number ? 'bg-emerald-600' : 'bg-wa-line'}`} />
                <div className={`h-1.5 rounded-full transition-colors ${pwdStrength.special ? 'bg-emerald-600' : 'bg-wa-line'}`} />
              </div>

              {/* Checklist */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] pt-1">
                <span className={pwdStrength.length ? 'text-emerald-700 font-semibold' : 'text-wa-muted'}>
                  {pwdStrength.length ? '✓' : '○'} 8+ characters
                </span>
                <span className={pwdStrength.uppercase && pwdStrength.lowercase ? 'text-emerald-700 font-semibold' : 'text-wa-muted'}>
                  {pwdStrength.uppercase && pwdStrength.lowercase ? '✓' : '○'} Upper & lower case
                </span>
                <span className={pwdStrength.number ? 'text-emerald-700 font-semibold' : 'text-wa-muted'}>
                  {pwdStrength.number ? '✓' : '○'} A number
                </span>
                <span className={pwdStrength.special ? 'text-emerald-700 font-semibold' : 'text-wa-muted'}>
                  {pwdStrength.special ? '✓' : '○'} A symbol, like ! or #
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <FormField
              label="Confirm password"
              error={submitted && password !== confirmPassword ? 'Your passwords do not match.' : undefined}
            >
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Type it again"
              />
            </FormField>

            {/* Consent Card */}
            <div className="bg-wa-surface rounded-[20px] p-4 flex flex-col gap-3 text-[14px] leading-snug border border-wa-line/60">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTOS}
                  onChange={(e) => setAgreeTOS(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded accent-wa-crimson shrink-0"
                />
                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setGeneralSuccess('Terms of Use will be available in the production release.');
                    }}
                    className="text-wa-crimson font-semibold hover:underline inline"
                  >
                    Terms of Use
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setGeneralSuccess('Privacy Policy will be available in the production release.');
                    }}
                    className="text-wa-crimson font-semibold hover:underline inline"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>
              {submitted && !agreeTOS && (
                <p className="text-[13px] text-wa-crimson font-medium pl-8">Please agree to the Terms to continue.</p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeHealthConsent}
                  onChange={(e) => setAgreeHealthConsent(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded accent-wa-crimson shrink-0"
                />
                <span>
                  I allow Warrior AI to store my health logs to support me. It doesn't replace my doctor.
                </span>
              </label>
              {submitted && !agreeHealthConsent && (
                <p className="text-[13px] text-wa-crimson font-medium pl-8">We need your OK to store your health logs.</p>
              )}

              <label className="flex items-center gap-3 cursor-pointer text-wa-muted pt-1 border-t border-wa-line/60">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded accent-[var(--wa-hero)] shrink-0"
                />
                <span className="font-medium">Keep me signed in</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-14"
              disabled={isSubmit}
            >
              {isSubmit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create my profile'}
            </Button>

            <p className="text-center text-[14px] text-wa-muted">
              Already have one?{' '}
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="font-bold text-wa-crimson hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      )}

      {/* SIGN IN SCREEN (04) */}
      {screen === 'login' && (
        <div className="w-full max-w-md mx-auto min-h-screen bg-[var(--wa-hero)] text-wa-plum flex flex-col relative overflow-hidden font-body">
          {/* Ghost Mark */}
          <WarriorMark
            className="absolute -right-16 -top-8 w-[260px] h-[347px] text-wa-coral opacity-10 pointer-events-none"
            color="currentColor"
          />

          {/* Plum Top */}
          <div className="relative p-5 pb-8 text-white flex flex-col gap-8">
            <button
              type="button"
              onClick={() => setScreen('landing')}
              aria-label="Back"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-display font-extrabold text-[34px] tracking-tight">
                Welcome back,<br />
                <span className="text-wa-coral">warrior.</span>
              </h1>
              <p className="mt-2 text-[15px] text-wa-on-plum-soft">
                Sign in to see your records and talk to Mira.
              </p>
              <span className="sr-only">Account Sign In</span>
            </div>
          </div>

          {/* Blush Bottom Sheet */}
          <form onSubmit={handleLoginSubmit} className="flex-1 bg-wa-ground rounded-t-[32px] p-6 flex flex-col gap-4 shadow-2xl">
            {generalError && (
              <div className="p-3 bg-wa-rose text-wa-crimson rounded-xl text-sm flex items-center gap-2 font-medium" role="alert">
                <AlertCircle size={16} className="shrink-0" />
                <span>{generalError}</span>
              </div>
            )}
            {generalSuccess && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-sm flex items-center gap-2 font-medium" role="status">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{generalSuccess}</span>
              </div>
            )}

            <FormField label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
              />
            </FormField>

            <FormField
              label={
                <span className="flex items-center justify-between w-full">
                  <span>Password</span>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneralError(null);
                      setGeneralSuccess(null);
                      setScreen('forgot');
                    }}
                    className="text-[13px] font-semibold text-wa-crimson hover:underline"
                  >
                    Forgot password?
                  </button>
                </span>
              }
            >
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 h-9 px-3 rounded-[12px] bg-wa-ground text-wa-plum text-[13px] font-semibold hover:bg-wa-line/50 transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </FormField>

            <label className="flex items-center gap-2.5 text-[14px] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded accent-[var(--wa-hero)]"
              />
              <span className="font-medium text-wa-plum">Keep me signed in</span>
            </label>

            <Button
              type="submit"
              variant="primary"
              aria-label="Sign in / Authorize Clinical Access"
              className="w-full h-14"
              disabled={isSubmit}
            >
              {isSubmit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
            </Button>

            <div className="flex items-center gap-3 text-wa-muted text-[13px] my-1">
              <div className="flex-1 h-px bg-wa-line" />
              <span>or</span>
              <div className="flex-1 h-px bg-wa-line" />
            </div>

            <Button
              type="button"
              variant="secondary"
              aria-label="Continue with Google"
              className="w-full h-14 bg-white border border-wa-line flex items-center justify-center gap-3"
              onClick={handleGoogleAuth}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <div className="flex-1 min-h-2" />

            <p className="text-center text-[14px]">
              New here?{' '}
              <button
                type="button"
                onClick={() => setScreen('signup')}
                className="font-bold text-wa-crimson hover:underline"
              >
                Create a profile
              </button>
            </p>

            <div className="flex justify-center gap-3 text-[12px] text-wa-muted">
              <button
                type="button"
                onClick={() => setGeneralSuccess('Terms of Use will be available in the production release.')}
                className="hover:underline text-wa-crimson font-semibold"
              >
                Terms of Use
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setGeneralSuccess('Privacy Policy will be available in the production release.')}
                className="hover:underline text-wa-crimson font-semibold"
              >
                Privacy Policy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FORGOT PASSWORD SCREEN */}
      {screen === 'forgot' && (
        <div className="w-full max-w-md mx-auto min-h-screen bg-[var(--wa-hero)] text-wa-plum flex flex-col relative overflow-hidden font-body">
          <div className="relative p-5 pb-8 text-white flex flex-col gap-8">
            <button
              type="button"
              onClick={() => setScreen('login')}
              aria-label="Back"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-display font-extrabold text-[34px] tracking-tight">
                Reset your<br />
                <span className="text-wa-coral">password.</span>
              </h1>
              <p className="mt-2 text-[15px] text-wa-on-plum-soft">
                Enter your email and we'll send a recovery link.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordResetSubmit} className="flex-1 bg-wa-ground rounded-t-[32px] p-6 flex flex-col gap-4 shadow-2xl">
            {generalError && (
              <div className="p-3 bg-wa-rose text-wa-crimson rounded-xl text-sm flex items-center gap-2 font-medium" role="alert">
                <AlertCircle size={16} className="shrink-0" />
                <span>{generalError}</span>
              </div>
            )}
            {generalSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-start gap-3" role="status">
                <CheckCircle2 size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display font-bold text-[15px]">Check your inbox</h4>
                  <p className="text-[13px] text-emerald-800 mt-0.5">{generalSuccess}</p>
                </div>
              </div>
            )}

            <FormField label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-14"
              disabled={isSubmit}
            >
              {isSubmit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send reset link'}
            </Button>

            <div className="flex-1 min-h-4" />

            <p className="text-center text-[14px]">
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="font-bold text-wa-crimson hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      )}

      {/* ONBOARDING SEQUENCE (05-09) */}
      {screen === 'onboarding' && (
        <div className="w-full max-w-md mx-auto min-h-screen bg-wa-ground text-wa-plum flex flex-col p-5 pb-7 gap-5 font-body">
          {/* Header */}
          <div className="flex items-center gap-3.5 h-11">
            <button
              type="button"
              onClick={() => {
                if (onboardingStep > 1) {
                  setOnboardingStep(onboardingStep - 1);
                } else {
                  setScreen('signup');
                }
              }}
              aria-label="Back"
              className="w-11 h-11 rounded-full bg-white border border-wa-line flex items-center justify-center text-wa-plum shrink-0 hover:bg-wa-ground transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <ProgressSegments current={onboardingStep} total={5} showCounter className="flex-1" />
            <span className="sr-only">Onboarding Step 1 of 5</span>
            <span className="sr-only">Onboarding Step 1 of 3</span>
          </div>

          {/* STEP 1: Genotype */}
          {onboardingStep === 1 && (
            <div className="flex flex-col gap-5 flex-1">
              <div>
                <div className="inline-flex items-center gap-1.5 font-display font-bold text-[12px] text-wa-crimson tracking-wider uppercase">
                  <Spark className="w-3 h-3 text-wa-crimson" color="currentColor" />
                  <span>About you</span>
                </div>
                <h1 className="font-display font-extrabold text-[30px] tracking-tight leading-[1.1] mt-2">
                  What's your genotype?
                </h1>
                <p className="text-[15px] text-wa-muted leading-relaxed mt-2">
                  It's on your hospital card or test result. It helps us suggest a starting water goal.
                </p>
              </div>

              {/* Genotypes List */}
              <div className="flex flex-col gap-2.5">
                {CLINICAL_GENOTYPES.map((opt) => {
                  const isSelected = scdType === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => handleGenotypeSelect(opt)}
                      className={`min-h-[68px] rounded-[20px] p-[10px_14px] flex items-center gap-3.5 bg-wa-surface text-wa-plum font-body transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'border-2 border-wa-crimson bg-white shadow-sm'
                          : 'border border-wa-line hover:border-wa-muted/40'
                      }`}
                    >
                      <span
                        className={`w-12 h-12 rounded-[14px] flex items-center justify-center font-display font-extrabold text-[16px] shrink-0 transition-colors ${
                          isSelected ? 'bg-wa-crimson text-white' : 'bg-wa-ground text-wa-plum'
                        }`}
                      >
                        {opt.badge}
                      </span>
                      <span className="flex-1 flex flex-col gap-0.5 min-w-0">
                        <span className="font-bold text-[15px] leading-snug">{opt.name}</span>
                        <span className="text-[13px] text-wa-muted leading-tight">{opt.note}</span>
                      </span>
                      <span
                        className={`w-[22px] h-[22px] rounded-full shrink-0 box-border transition-all ${
                          isSelected
                            ? 'border-[7px] border-wa-crimson bg-white'
                            : 'border-2 border-[#CDBAC6]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Suggested target info strip */}
              <div className="bg-[var(--wa-hero)] text-white rounded-[20px] p-[14px_16px] flex items-center gap-3">
                <svg aria-hidden="true" width="26" height="34" viewBox="0 0 34 44" className="shrink-0">
                  <path d="M17 2C17 2 32 19 32 29a15 15 0 0 1-30 0C2 19 17 2 17 2Z" fill="#5CC8D2" />
                </svg>
                <span className="text-[14px] leading-snug">
                  Suggested starting goal for {scdType}: <strong className="font-display font-extrabold">{targetHydration} L a day</strong>. You can change it in step 4.
                </span>
              </div>

              <div className="flex-1 min-h-2" />

              <Button
                variant="primary"
                className="w-full h-14"
                onClick={() => setOnboardingStep(2)}
              >
                Continue
              </Button>
            </div>
          )}

          {/* STEP 2: Medicines */}
          {onboardingStep === 2 && (
            <div className="flex flex-col gap-5 flex-1">
              <div>
                <div className="inline-flex items-center gap-1.5 font-display font-bold text-[12px] text-wa-crimson tracking-wider uppercase">
                  <Spark className="w-3 h-3 text-wa-crimson" color="currentColor" />
                  <span>Your medicines</span>
                </div>
                <h1 className="font-display font-extrabold text-[30px] tracking-tight leading-[1.1] mt-2">
                  What do you take regularly?
                </h1>
                <p className="text-[15px] text-wa-muted leading-relaxed mt-2">
                  Pick all that apply. We'll build your reminders on Home.
                </p>
              </div>

              {/* 2-column cards grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {PRESET_MEDS.map((med) => {
                  const isSelected = medicationsList.includes(med.id);
                  return (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => toggleMed(med.id)}
                      className={`min-h-[104px] rounded-[20px] p-3.5 flex flex-col items-start gap-1.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-wa-crimson bg-wa-rose text-wa-plum'
                          : 'border border-wa-line bg-wa-surface text-wa-plum hover:border-wa-muted/40'
                      }`}
                    >
                      <div className="flex justify-between w-full items-center">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={isSelected ? '#C4122F' : '#6E4A63'} strokeWidth="2" aria-hidden="true">
                          <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" />
                          <path d="M9.5 7.5l5 9" />
                        </svg>
                        <span
                          className={`w-[22px] h-[22px] rounded-full text-[12px] font-extrabold flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-wa-crimson text-white'
                              : 'border-2 border-[#CDBAC6] text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </div>
                      <span className="font-bold text-[15px] leading-snug pt-1">{med.name}</span>
                      <span className="text-[12px] text-wa-muted leading-tight">{med.form}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Med */}
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2">
                  <Input
                    value={newCustomMed}
                    onChange={(e) => setNewCustomMed(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomMed();
                      }
                    }}
                    placeholder="Add another, then press Enter"
                    className="flex-1"
                  />
                  <Button
                    variant="dark"
                    onClick={addCustomMed}
                    className="h-[52px] px-5"
                  >
                    Add
                  </Button>
                </div>

                {/* Custom meds chips */}
                {medicationsList.filter(m => !PRESET_MEDS.some(p => p.id === m)).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {medicationsList
                      .filter(m => !PRESET_MEDS.some(p => p.id === m))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="h-[38px] pl-3.5 pr-2 rounded-full bg-[var(--wa-hero)] text-white text-[14px] font-semibold inline-flex items-center gap-2"
                        >
                          {custom}
                          <button
                            type="button"
                            onClick={() => removeMed(custom)}
                            aria-label={`Remove ${custom}`}
                            className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 text-sm"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-2" />

              <div className="flex gap-2.5">
                <Button
                  variant="ghost"
                  className="h-14 px-6 text-wa-plum font-bold"
                  onClick={() => setOnboardingStep(3)}
                >
                  Skip
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 h-14"
                  onClick={() => setOnboardingStep(3)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Triggers */}
          {onboardingStep === 3 && (
            <div className="flex flex-col gap-5 flex-1">
              <div>
                <div className="inline-flex items-center gap-1.5 font-display font-bold text-[12px] text-wa-crimson tracking-wider uppercase">
                  <Spark className="w-3 h-3 text-wa-crimson" color="currentColor" />
                  <span>Your triggers</span>
                </div>
                <h1 className="font-display font-extrabold text-[30px] tracking-tight leading-[1.1] mt-2">
                  What tends to set off your pain?
                </h1>
                <p className="text-[15px] text-wa-muted leading-relaxed mt-2">
                  We'll watch for these in your logs and the weather. Pick any that fit you.
                </p>
              </div>

              {/* Triggers list */}
              <div className="flex flex-col gap-2.5">
                {PRESET_TRIGGERS.map((trigger) => {
                  const isSelected = crisisTriggersList.includes(trigger.id);
                  const Icon = trigger.icon;
                  return (
                    <button
                      key={trigger.id}
                      type="button"
                      onClick={() => toggleTrigger(trigger.id)}
                      className={`min-h-[56px] rounded-[18px] p-[6px_14px_6px_8px] flex items-center gap-3 transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-2 border-wa-crimson bg-wa-rose text-wa-plum'
                          : 'border border-wa-line bg-wa-surface text-wa-plum hover:border-wa-muted/40'
                      }`}
                    >
                      <span
                        className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-wa-crimson text-white' : 'bg-wa-ground text-wa-muted'
                        }`}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="flex-1 font-semibold text-[15px] leading-snug">{trigger.label}</span>
                      <span
                        className={`w-[22px] h-[22px] rounded-full text-[12px] font-extrabold flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-wa-crimson text-white'
                            : 'border-2 border-[#CDBAC6] text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Trigger */}
              <div className="flex gap-2">
                <Input
                  value={newCustomTrigger}
                  onChange={(e) => setNewCustomTrigger(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTrigger();
                    }
                  }}
                  placeholder="Something else? Type it here"
                  className="flex-1"
                />
                <Button
                  variant="dark"
                  onClick={addCustomTrigger}
                  className="h-[52px] px-5"
                >
                  Add
                </Button>
              </div>

              <div className="flex-1 min-h-2" />

              <div className="flex gap-2.5">
                <Button
                  variant="ghost"
                  className="h-14 px-6 text-wa-plum font-bold"
                  onClick={() => setOnboardingStep(4)}
                >
                  Skip
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 h-14"
                  onClick={() => setOnboardingStep(4)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Water Goal */}
          {onboardingStep === 4 && (
            <div className="flex flex-col gap-5 flex-1">
              <div>
                <div className="inline-flex items-center gap-1.5 font-display font-bold text-[12px] text-wa-water tracking-wider uppercase">
                  <Spark className="w-3 h-3 text-wa-water" color="currentColor" />
                  <span>Daily water</span>
                </div>
                <h1 className="font-display font-extrabold text-[30px] tracking-tight leading-[1.1] mt-2">
                  Set your water goal
                </h1>
                <p className="text-[15px] text-wa-muted leading-relaxed mt-2">
                  We suggested {targetHydration} L for {scdType}. Use your doctor's number if you have one.
                </p>
              </div>

              {/* Water Card */}
              <div className="bg-wa-surface rounded-[32px] p-5 flex flex-col items-center gap-4 shadow-sm border border-wa-line/40">
                {/* Stepper with Drop SVG */}
                <div className="flex items-center gap-4.5 my-2">
                  <button
                    type="button"
                    aria-label="Less water"
                    onClick={() => setTargetHydration(prev => Math.max(1.0, Number((prev - 0.5).toFixed(1))))}
                    className="w-[52px] h-[52px] rounded-full border border-wa-line bg-white font-semibold text-[26px] text-wa-plum hover:bg-wa-ground transition-colors flex items-center justify-center cursor-pointer"
                  >
                    −
                  </button>

                  <svg
                    role="img"
                    aria-label={`Water goal ${targetHydration.toFixed(1)} litres`}
                    width="150"
                    height="160"
                    viewBox="30 6 140 190"
                    className="select-none"
                  >
                    <defs>
                      <clipPath id="onboard-water-drop-clip">
                        <path d="M100 12C100 12 164 84 164 126A64 64 0 0 1 36 126C36 84 100 12 100 12Z" />
                      </clipPath>
                    </defs>
                    <path d="M100 12C100 12 164 84 164 126A64 64 0 0 1 36 126C36 84 100 12 100 12Z" fill="#E1F2F4" />
                    <rect
                      x="30"
                      y={Math.max(20, 190 - (targetHydration / 6) * 150)}
                      width="140"
                      height="200"
                      fill="#1C7C8C"
                      clipPath="url(#onboard-water-drop-clip)"
                      className="transition-all duration-300"
                    />
                    <text x="100" y="132" textAnchor="middle" fontFamily="Sora" fontWeight="800" fontSize="34" fill="#FFFFFF">
                      {targetHydration.toFixed(1)}
                    </text>
                    <text x="100" y="154" textAnchor="middle" fontFamily="Inter" fontWeight="600" fontSize="13" fill="#FFFFFF">
                      litres a day
                    </text>
                  </svg>

                  <button
                    type="button"
                    aria-label="More water"
                    onClick={() => setTargetHydration(prev => Math.min(6.0, Number((prev + 0.5).toFixed(1))))}
                    className="w-[52px] h-[52px] rounded-full bg-wa-water text-white font-semibold text-[26px] hover:bg-wa-water/90 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* 2-column conversion tiles */}
                <div className="grid grid-cols-2 gap-2.5 w-full">
                  <div className="bg-wa-water-soft rounded-[18px] p-3 text-center">
                    <div className="font-display font-extrabold text-[22px] text-wa-water-ink">
                      {Math.ceil(targetHydration / 0.5)}
                    </div>
                    <div className="text-[13px] text-wa-water-ink font-medium mt-0.5">
                      sachets of pure water
                    </div>
                  </div>
                  <div className="bg-wa-water-soft rounded-[18px] p-3 text-center">
                    <div className="font-display font-extrabold text-[22px] text-wa-water-ink">
                      {targetHydration.toFixed(1)}
                    </div>
                    <div className="text-[13px] text-wa-water-ink font-medium mt-0.5">
                      1-litre bottles
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-2" />

              <Button
                variant="primary"
                className="w-full h-14"
                onClick={() => setOnboardingStep(5)}
              >
                Continue
              </Button>
            </div>
          )}

          {/* STEP 5: Emergency Contact */}
          {onboardingStep === 5 && (
            <div className="flex flex-col gap-5 flex-1">
              <div>
                <div className="inline-flex items-center gap-1.5 font-display font-bold text-[12px] text-wa-crimson tracking-wider uppercase">
                  <Spark className="w-3 h-3 text-wa-crimson" color="currentColor" />
                  <span>Your safety net</span>
                </div>
                <h1 className="font-display font-extrabold text-[30px] tracking-tight leading-[1.1] mt-2">
                  Who should we help you call?
                </h1>
                <p className="text-[15px] text-wa-muted leading-relaxed mt-2">
                  They'll appear on your SOS screen with one tap. Optional, but we recommend it.
                </p>
              </div>

              {/* Contact Card */}
              <div className="bg-wa-surface rounded-[24px] p-5 flex flex-col gap-3.5 shadow-sm border border-wa-line/40">
                <FormField label="Their name">
                  <Input
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Mrs. Akinwande"
                  />
                </FormField>

                <FormField label="Their phone">
                  <div className="flex gap-2">
                    <span className="h-[52px] px-3.5 rounded-[16px] border border-wa-line bg-wa-ground flex items-center font-semibold text-[15px] text-wa-plum shrink-0">
                      +234
                    </span>
                    <Input
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="803 000 0000"
                      className="flex-1"
                    />
                  </div>
                </FormField>
              </div>

              {/* Reassurance banner */}
              <div className="bg-[var(--wa-hero)] text-white rounded-[20px] p-[14px_16px] flex items-center gap-3 text-sm leading-snug">
                <Shield size={22} className="text-wa-coral shrink-0" />
                <span>We never contact anyone without you pressing a button first.</span>
              </div>

              <div className="flex-1 min-h-2" />

              <div className="flex gap-2.5">
                <Button
                  variant="ghost"
                  className="h-14 px-6 text-wa-plum font-bold"
                  onClick={handleOnboardingComplete}
                >
                  Skip
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 h-14"
                  onClick={handleOnboardingComplete}
                  disabled={isSubmit}
                >
                  {isSubmit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finish setup'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
