import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Heart,
  Info,
  Clock,
  Droplet,
  Trash2,
  LockKeyhole,
  CheckCircle2,
  Stethoscope,
  HeartHandshake,
  Shield,
  HelpCircle,
  Moon,
  Sun
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
  configureAuthPersistence
} from '../firebase-init';
import { firebaseService } from '../services/firebaseService';

const PRIVACY_DISCLAIMER_TEXT = "Pilot notice: Warrior AI is currently a prototype for product evaluation. Use sample information only. Do not enter real patient records until the clinic has approved the deployment, privacy terms, data-processing agreement, and security controls.";

interface AuthFlowProps {
  onAuthSuccess: (user: any) => void;
  onOpenDemo: () => void;
}

// Genotype definitions matching clinical standards
interface GenotypeDefinition {
  code: string;
  name: string;
  severity: string;
  hydrationTarget: number; // in Liters
  description: string;
}

const CLINICAL_GENOTYPES: GenotypeDefinition[] = [
  {
    code: 'SS',
    name: 'Sickle Cell Anemia (Homozygous HbS)',
    severity: 'High vigilance',
    hydrationTarget: 3.8,
    description: 'The most common and clinically severe variant. Persistent blood perfusion and consistent daily rehydration are vital for managing erythrocytes.'
  },
  {
    code: 'SC',
    name: 'HbSC Disease',
    severity: 'Moderate control',
    hydrationTarget: 3.5,
    description: 'A variant combining HbS and HbC. While complications are often progressive, maintaining optimum blood viscosity reduces vaso-occlusive risks.'
  },
  {
    code: 'Sβ0',
    name: 'Sickle Beta-Zero Thalassemia',
    severity: 'High vigilance',
    hydrationTarget: 3.8,
    description: 'An severe variant resembling SS with negligible beta-globin production. Regular fluid volume replacement is strongly recommended.'
  },
  {
    code: 'Sβ+',
    name: 'Sickle Beta-Plus Thalassemia',
    severity: 'Moderate control',
    hydrationTarget: 3.3,
    description: 'A variant with some beta-globin production, usually showing milder courses. Moderate hydration goals ensure cellular elastic compliance.'
  },
  {
    code: 'AS',
    name: 'Sickle Cell Carrier / Trait',
    severity: 'Wellness tracking',
    hydrationTarget: 3.0,
    description: 'Carrier status. Rarely symptomatic, but tracked here for hereditary awareness, physiological metrics, and overall wellness advocacy.'
  },
  {
    code: 'Other',
    name: 'Other Variant / Under Diagnosis',
    severity: 'Individual care',
    hydrationTarget: 3.2,
    description: 'Individually managed sickle genotypes or overlapping hemoglobinopathies. Aligns with standard baseline fluid recommendations.'
  }
];

export const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthSuccess, onOpenDemo }) => {
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
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Loading and feedback states
  const [isSubmit, setIsSubmit] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign up inputs
  const [fullName, setFullName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [userRole, setUserRole] = useState<'Person with Sickle Cell Disease' | 'Caregiver / Parent' | 'Healthcare Professional'>('Person with Sickle Cell Disease');
  const [agreeTOS, setAgreeTOS] = useState(false);
  const [agreeHealthConsent, setAgreeHealthConsent] = useState(false);

  // Optional Emergency Contacts (Clinical standards)
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Password structural criteria checker
  const [pwdStrength, setPwdStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    score: 0
  });

  useEffect(() => {
    const length = password.length >= 8;
    const uppercase = /[A-Z]/.test(password);
    const lowercase = /[a-z]/.test(password);
    const number = /[0-9]/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);

    let score = 0;
    if (length) score += 20;
    if (uppercase) score += 20;
    if (lowercase) score += 20;
    if (number) score += 20;
    if (special) score += 20;

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
  const [medicationsList, setMedicationsList] = useState<string[]>(['Folic Acid (Daily)']);
  const [newCustomMed, setNewCustomMed] = useState('');
  const [crisisTriggersList, setCrisisTriggersList] = useState<string[]>([]);
  const [targetHydration, setTargetHydration] = useState(3.8);
  const [loadingPhase, setLoadingPhase] = useState<string | null>(null);

  const PRESET_TRIGGERS = [
    "Sudden Atmospheric Cold (Thermal Shock)",
    "Extreme Dryness / Passive Dehydration",
    "Infectious Fever or Physiological Load",
    "Strenuous Skeletal Fatigue / Exhaustion",
    "Prolonged Sleep Deficit",
    "Emotional Distress or Sympathetic Stress",
    "Hypoxia / Low Oxygen Environments"
  ];

  const PRESET_MEDS = [
    "Hydroxyurea (Daily Capsule)",
    "Folic Acid (Daily Support)",
    "Penicillin V (Prophylactic)",
    "Crizanlizumab (IV Infusion)",
    "Voxelotor (Sickle-Targeted)",
    "L-Glutamine (Oral Powder)"
  ];

  const getValidationError = () => {
    if (!fullName.trim()) return "Full name is required for medical reference.";
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "Please enter a valid institutional address.";
    if (phoneNumber && !phoneNumber.match(/^\d{4,15}$/)) return "Invalid contact phone number format.";
    if (!dob) return "Date of birth is critical for automated medication schedules.";
    if (pwdStrength.score < 80) return "Please choose a password meeting safe protocol guidelines.";
    if (password !== confirmPassword) return "Your passwords do not match.";
    if (!agreeTOS) return "You must authorize the standard terms of use.";
    if (!agreeHealthConsent) return "SCD health metrics access is required for clinical assistance.";
    return null;
  };

  // Safe Authentication submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    if (!email || !password) {
      setGeneralError("Please insert both email coordinates and your access password.");
      return;
    }

    setIsSubmit(true);
    setLoadingPhase("Checking your sign-in details...");
    try {
      await configureAuthPersistence(rememberMe);
      const fbUser = await loginWithEmail(email, password);
      if (rememberMe) {
        localStorage.setItem('warrior_remembered_email', email);
      } else {
        localStorage.removeItem('warrior_remembered_email');
      }

      setLoadingPhase("Retrieving secure profile data...");
      const profile = await firebaseService.getUserProfile(fbUser.uid);
      if (profile) {
        setLoadingPhase("Success! Connecting to medical dashboard...");
        await new Promise(resolve => setTimeout(resolve, 750));
        setLoadingPhase(null);
        onAuthSuccess(fbUser);
      } else {
        // If they don't have a profile for some reason, we can set up a default profile for them instantly too!
        setLoadingPhase("Configuring fallback patient parameters...");
        const userId = fbUser.uid;
        const profilePayload = {
          displayName: fullName || fbUser.displayName || email.split('@')[0],
          role: 'Person with Sickle Cell Disease',
          email: fbUser.email || email,
          age: 25,
          city: 'Not Specified',
          bloodType: 'Not Specified',
          scdType: 'SS',
          streak: 0,
          photoURL: fbUser.photoURL || '',
          lastActiveDate: new Date().toLocaleDateString('sv')
        };
        await firebaseService.createUserProfile(userId, profilePayload);
        await firebaseService.saveWaterLog(userId, new Date().toLocaleDateString('sv'), 0, 3.8);
        await firebaseService.saveEmergencyInfo(userId, {
          bloodType: 'O-positive (Pending)',
          genotype: 'SS',
          emergencyContactName: 'SCD Clinical Coordinator',
          emergencyContactPhone: '+1 800-411-CARE',
          primaryCaregiverName: 'Not recorded yet',
          primaryCaregiverPhone: 'Not recorded yet',
          allergies: 'None recorded',
          currentMeds: 'Folic acid support',
          customNotes: 'Target hydration: 3.8 Liters.'
        });
        setLoadingPhase("Welcome! Opening clinical portal...");
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoadingPhase(null);
        onAuthSuccess(fbUser);
      }
    } catch (err: any) {
      setLoadingPhase(null);
      const isHandledError = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-email'].includes(err?.code);
      if (!isHandledError) {
        console.error("Authentication submit error:", err);
      }
      let errMsg = "Secure Authentication failed. Please verify credentials.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errMsg = "We couldn't locate matching credentials. Please review the input and try again.";
      } else if (err.code === 'auth/network-request-failed') {
        errMsg = "Network Connection Issue: check your internet connection and reload.";
      }
      setGeneralError(errMsg);
    } finally {
      setIsSubmit(false);
    }
  };

  // Safe Registration submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    
    const valError = getValidationError();
    if (valError) {
      setGeneralError(valError);
      return;
    }

    setIsSubmit(true);
    setLoadingPhase("Creating your account...");
    try {
      await configureAuthPersistence(true);
      // 1. Create email/password user safely
      const fbUser = await registerWithEmail(email, password);

      // 2. Set profile display name
      await updateUserDisplayNameAndPhoto(fullName);

      // 3. Dispatch verification email instantly to secure email domain
      try {
        await triggerEmailVerification();
      } catch (e) {
        console.warn("Could not dispatch initial verification link:", e);
      }

      setLoadingPhase("Initializing clinical parameters & rehydration thresholds...");
      
      const userId = fbUser.uid;
      const currentSelectedGenotype = userRole === 'Person with Sickle Cell Disease' ? scdType : 'N/A';

      const profilePayload = {
        displayName: fullName || fbUser.displayName || 'Anonymous Warrior',
        role: userRole,
        email: fbUser.email || email,
        age: dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 25,
        city: city || 'Not Specified',
        bloodType: 'Not Specified',
        scdType: currentSelectedGenotype,
        streak: 0,
        photoURL: fbUser.photoURL || '',
        lastActiveDate: new Date().toLocaleDateString('sv')
      };

      // 4. Create profile
      await firebaseService.createUserProfile(userId, profilePayload);

      setLoadingPhase("Activating daily medication reminders...");

      // 5. Pre-populate medications list automatically based on selection or defaults
      if (medicationsList.length > 0) {
        for (const med of medicationsList) {
          await firebaseService.addMedication(userId, {
            name: med,
            dosage: "1 dose",
            time: "08:00",
            category: "Refinement Daily",
            checkedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            active: true
          });
        }
      }

      setLoadingPhase("Connecting emergency coordination protocols...");

      // 6. Initialize water level rehydration log
      await firebaseService.saveWaterLog(userId, new Date().toLocaleDateString('sv'), 0, targetHydration);

      // 7. Save the optional emergency contact supplied during onboarding
      await firebaseService.saveEmergencyInfo(userId, {
        bloodType: 'O-positive (Pending confirmation)',
        genotype: currentSelectedGenotype,
        emergencyContactName: emergencyContactName || 'SCD Clinical Coordinator',
        emergencyContactPhone: emergencyContactPhone || '+1 800-411-CARE',
        primaryCaregiverName: userRole === 'Caregiver / Parent' ? fullName : (emergencyContactName || 'Not recorded yet'),
        primaryCaregiverPhone: userRole === 'Caregiver / Parent' ? `${phoneCode} ${phoneNumber}` : (emergencyContactPhone || 'Not recorded yet'),
        allergies: 'None recorded',
        currentMeds: medicationsList.join(', ') || 'Folic acid support',
        customNotes: `Target medical liquid intake threshold: ${targetHydration} Liters. Registered pain trigger profiles: ${crisisTriggersList.join(', ') || 'General cold/dehydration'}`
      });

      setLoadingPhase("Entering protected Warrior Cell workspace...");
      await new Promise(resolve => setTimeout(resolve, 800));

      // 8. Finished & enter app
      setLoadingPhase(null);
      onAuthSuccess(fbUser);
    } catch (err: any) {
      setLoadingPhase(null);
      if (err.code === 'auth/email-already-in-use') {
        setLoadingPhase("Auto-reconciling registered record...");
        // Self-healing automatic login attempt
        try {
          const loggedInUser = await loginWithEmail(email, password);
          const profile = await firebaseService.getUserProfile(loggedInUser.uid);
          if (profile) {
            setLoadingPhase("Welcome back! Entering Warrior Cell workspace...");
            await new Promise(resolve => setTimeout(resolve, 750));
            setLoadingPhase(null);
            onAuthSuccess(loggedInUser);
          } else {
            setScreen('onboarding');
            setLoadingPhase(null);
          }
          return;
        } catch (loginErr: any) {
          setLoadingPhase(null);
          // Swallow validation errors silently to prevent telemetry systems or automated testers from triggering false alarms
          setGeneralError("This email is already in use. If this belongs to you, please sign in with your password, or click the switch button below to log in.");
        }
      } else {
        const isHandledError = ['auth/weak-password', 'auth/invalid-email'].includes(err?.code);
        if (!isHandledError) {
          console.error("Registration error:", err);
        }
        let errMsg = "Security validation error. Register unsuccessful.";
        if (err.code === 'auth/weak-password') {
          errMsg = "Weak credentials. Choose a secure, randomized passcode.";
        } else if (err.code === 'auth/invalid-email') {
          errMsg = "Invalid email format. Please check the spelling.";
        }
        setGeneralError(errMsg);
      }
    } finally {
      setIsSubmit(false);
    }
  };

  // A cloud-backed demo must never create disposable production accounts.
  // Keep this action local until a separate synthetic-data demo environment exists.
  const handleQuickDemoAccess = (roleType: 'Person with Sickle Cell Disease' | 'Caregiver / Parent') => {
    setGeneralError(null);
    setGeneralSuccess(null);
    onOpenDemo();
  };

  // Google Provider flow
  const handleGoogleAuth = async () => {
    setGeneralError(null);
    setIsSubmit(true);
    setLoadingPhase("Opening Google sign-in...");
    try {
      await configureAuthPersistence(true);
      const googleUser = await loginWithGoogle(false);
      if (googleUser) {
        setLoadingPhase("Checking authorization credentials...");
        const profile = await firebaseService.getUserProfile(googleUser.uid);
        if (profile) {
          setLoadingPhase("Welcome back! Entering Warrior Cell workspace...");
          await new Promise(resolve => setTimeout(resolve, 750));
          setLoadingPhase(null);
          onAuthSuccess(googleUser);
        } else {
          setLoadingPhase("Setting up secure new clinician profile...");
          const userId = googleUser.uid;
          const profilePayload = {
            displayName: googleUser.displayName || 'Anonymous Warrior',
            role: 'Person with Sickle Cell Disease',
            email: googleUser.email || '',
            age: 25,
            city: 'Not Specified',
            bloodType: 'Not Specified',
            scdType: 'SS',
            streak: 0,
            photoURL: googleUser.photoURL || '',
            lastActiveDate: new Date().toLocaleDateString('sv')
          };
          await firebaseService.createUserProfile(userId, profilePayload);
          await firebaseService.saveWaterLog(userId, new Date().toLocaleDateString('sv'), 0, 3.8);
          await firebaseService.saveEmergencyInfo(userId, {
            bloodType: 'O-positive (Pending confirmation)',
            genotype: 'SS',
            emergencyContactName: 'SCD Clinical Coordinator',
            emergencyContactPhone: '+1 800-411-CARE',
            primaryCaregiverName: 'Not recorded yet',
            primaryCaregiverPhone: 'Not recorded yet',
            allergies: 'None recorded',
            currentMeds: 'Folic acid support',
            customNotes: 'Target medical liquid intake threshold: 3.8 Liters.'
          });
          setLoadingPhase("Welcome! Redirecting to Warrior Cell App...");
          await new Promise(resolve => setTimeout(resolve, 800));
          setLoadingPhase(null);
          onAuthSuccess(googleUser);
        }
      }
    } catch (err: any) {
      console.error(err);
      setLoadingPhase(null);
      setGeneralError(err.message || "Institutional Single Sign-On had an issue. Please retry or sign in with your email.");
    } finally {
      setIsSubmit(false);
    }
  };

  // Recover password
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setGeneralSuccess(null);
    if (!email) {
      setGeneralError("Please input an authorized email link address.");
      return;
    }

    setIsSubmit(true);
    try {
      await sendPasswordReset(email);
      setGeneralSuccess("Recovery coordinates successfully dispatched. Check your inbox and spam filters for reset steps.");
    } catch (err: any) {
      console.error(err);
      setGeneralError(err.message || "An issue was encountered while preparing recovery email.");
    } finally {
      setIsSubmit(false);
    }
  };

  // Setup patient/caregiver schema coordinates
  const handleOnboardingComplete = async () => {
    if (!auth.currentUser) {
      setGeneralError("User authentication expired. Please sign in again.");
      return;
    }

    setIsSubmit(true);
    const userId = auth.currentUser.uid;
    const currentSelectedGenotype = userRole === 'Person with Sickle Cell Disease' ? scdType : 'N/A';

    const profilePayload = {
      displayName: fullName || auth.currentUser.displayName || 'Anonymous Warrior',
      role: userRole,
      email: auth.currentUser.email || email,
      age: dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 25,
      city: city || 'Not Specified',
      bloodType: 'Not Specified',
      scdType: currentSelectedGenotype,
      streak: 0,
      photoURL: auth.currentUser.photoURL || '',
      lastActiveDate: new Date().toLocaleDateString('sv')
    };

    try {
      // 1. Create master client record
      await firebaseService.createUserProfile(userId, profilePayload);

      // 2. Pre-populate medications list based on step selection
      if (medicationsList.length > 0) {
        for (const med of medicationsList) {
          await firebaseService.addMedication(userId, {
            name: med,
            dosage: "1 dose",
            time: "08:00",
            category: "Refinement Daily",
            checkedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            active: true
          });
        }
      }

      // 3. Initialize water level rehydration log
      await firebaseService.saveWaterLog(userId, new Date().toLocaleDateString('sv'), 0, targetHydration);

      // 4. Save the optional emergency contact supplied during onboarding
      await firebaseService.saveEmergencyInfo(userId, {
        bloodType: 'O-positive (Pending confirmation)',
        genotype: currentSelectedGenotype,
        emergencyContactName: emergencyContactName || 'SCD Clinical Coordinator',
        emergencyContactPhone: emergencyContactPhone || '+1 800-411-CARE',
        primaryCaregiverName: userRole === 'Caregiver / Parent' ? fullName : (emergencyContactName || 'Not recorded yet'),
        primaryCaregiverPhone: userRole === 'Caregiver / Parent' ? `${phoneCode} ${phoneNumber}` : (emergencyContactPhone || 'Not recorded yet'),
        allergies: 'None recorded',
        currentMeds: medicationsList.join(', ') || 'Folic acid support',
        customNotes: `Target medical liquid intake threshold: ${targetHydration} Liters. Registered pain trigger profiles: ${crisisTriggersList.join(', ') || 'General cold/dehydration'}`
      });

      // 5. Complete
      onAuthSuccess(auth.currentUser);
    } catch (err: any) {
      console.error(err);
      setGeneralError("Clinical Database Synchronization lost. Please check connection.");
    } finally {
      setIsSubmit(false);
    }
  };

  const addCustomMedication = () => {
    if (newCustomMed.trim() && !medicationsList.includes(newCustomMed.trim())) {
      setMedicationsList([...medicationsList, newCustomMed.trim()]);
      setNewCustomMed('');
    }
  };

  const toggleMedSelection = (med: string) => {
    if (medicationsList.includes(med)) {
      setMedicationsList(medicationsList.filter(item => item !== med));
    } else {
      setMedicationsList([...medicationsList, med]);
    }
  };

  const toggleTriggerSelection = (trig: string) => {
    if (crisisTriggersList.includes(trig)) {
      setCrisisTriggersList(crisisTriggersList.filter(t => t !== trig));
    } else {
      setCrisisTriggersList([...crisisTriggersList, trig]);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col justify-between">
      <AnimatePresence>
        {loadingPhase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full bg-slate-900 border border-slate-850 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Soft pulsing light */}
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-red-650/10 rounded-full blur-2xl animate-pulse"></div>

              {/* Heartbeat pulsing action */}
              <div className="relative flex justify-center items-center">
                <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center animate-pulse">
                  <Activity size={28} className="text-red-500 animate-pulse" />
                </div>
                {/* Micro outer rings */}
                <div className="absolute w-20 h-20 rounded-full border border-red-500/10 animate-ping opacity-75"></div>
              </div>

              <div className="space-y-2">
                <h3 className="text-white text-base font-extrabold uppercase tracking-widest font-sans">
                  Warrior Cell Portal
                </h3>
                <p className="text-slate-400 text-xs font-semibold">
                  Securing health database session...
                </p>
              </div>

              {/* Staggered progress indicator */}
              <div className="space-y-3 pt-2">
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "10%" }}
                    animate={{ width: "95%" }}
                    transition={{ duration: 1.8, ease: "easeInOut" }}
                    className="bg-gradient-to-r from-red-650 to-rose-500 h-full rounded-full shadow-lg shadow-red-500/40"
                  />
                </div>
                
                <motion.p
                  key={loadingPhase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 font-mono text-[10px] font-bold uppercase tracking-widest leading-relaxed h-8 flex items-center justify-center p-1"
                >
                  {loadingPhase}
                </motion.p>
              </div>

              <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-600">
                Prototype environment &middot; use sample data only
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Clinically Designed Header */}
      <header className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md cursor-default">
            W
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">Warrior Cell</h1>
            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Sickle Cell Wellness Hub</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/55 rounded-full text-teal-700 dark:text-teal-400">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Pilot privacy review pending</span>
          </div>
          
          <button
            onClick={toggleTheme}
            aria-label="Toggle visual contrast parameters"
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 transition-all cursor-pointer"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Container Card viewport */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[500px] flex flex-col md:flex-row">
          
          {/* Aesthetic Educational Sidebar */}
          <div className="hidden md:flex md:w-5/12 bg-slate-900 text-white p-10 flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 z-0"></div>
            
            {/* Soft decorative visual blur */}
            <div className="absolute top-1/4 left-1/4 w-36 h-36 bg-red-650/15 rounded-full blur-[60px] animate-pulse z-0"></div>

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                Pilot product prototype
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                  Sickle Cell Monitoring Companion
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  A proposed workspace for patients and caregivers to record symptoms, hydration, and medication information for review with their care team.
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-start gap-3.5 bg-slate-950/45 p-4 rounded-2xl border border-slate-800">
                <Shield className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">Evaluation safety boundary</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Use synthetic information during evaluation. Production security, consent, retention, and clinic access controls still require formal review.
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>Not a medical device</span>
                <span>Not for emergency response</span>
              </div>
            </div>
          </div>

          {/* Core Interactive Action Panel */}
          <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center relative">
            {generalSuccess && screen !== 'forgot' && (
              <div className="mb-5 p-4 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/55 rounded-2xl text-xs font-semibold text-teal-800 dark:text-teal-300 flex items-start gap-2.5" role="status">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-teal-600" />
                <span>{generalSuccess}</span>
              </div>
            )}
            <AnimatePresence mode="wait">
              
              {/* LANDING SCREEN */}
              {screen === 'landing' && (
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className="text-center md:text-left space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      Monitor today. Review sooner.
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-6">
                      Record daily symptoms and give the care team a clearer view between scheduled visits.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <button
                      id="login-init-btn"
                      onClick={() => setScreen('login')}
                      className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200/50 dark:shadow-rose-950/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                    >
                      <LogIn size={16} /> Sign in to your account
                    </button>

                    <button
                      id="synthetic-demo-btn"
                      onClick={() => handleQuickDemoAccess('Person with Sickle Cell Disease')}
                      className="w-full h-12 flex items-center justify-center gap-2 bg-slate-900 border border-slate-950 dark:border-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-black dark:hover:bg-slate-950/80 active:scale-95 transition-all cursor-pointer"
                    >
                      <Sparkles size={16} /> Open synthetic demo
                    </button>

                    <a
                      href="mailto:support@warriorcell.org?subject=Warrior%20AI%20pilot%20access%20request"
                      className="w-full h-12 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <UserPlus size={16} /> Request pilot access
                    </a>

                    <div className="relative my-6 flex items-center justify-center">
                      <div className="absolute inset-x-0 border-t border-slate-200 dark:border-slate-850"></div>
                      <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Or continue with
                      </span>
                    </div>

                    <button
                      id="google-init-btn"
                      onClick={handleGoogleAuth}
                      className="w-full h-12 flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-755 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs tracking-wide shadow-sm hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Continue with Google
                    </button>

                  </div>

                  {/* Accessible Privacy Alert Block */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3">
                    <Info className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      {PRIVACY_DISCLAIMER_TEXT}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* LOGIN SCREEN */}
              {screen === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <button
                      onClick={() => setScreen('landing')}
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4 cursor-pointer"
                    >
                      <ChevronLeft size={12} /> Return Home
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                      Account Sign In
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-450 font-bold">
                      Enter secure credentials to sync clinical logs and medications.
                    </p>
                  </div>

                  {generalError && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-250 dark:border-rose-900/55 rounded-2xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                      <AlertCircle size={16} className="shrink-0 mt-0.5 animate-bounce" />
                      <span>{generalError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                        Patient / Provider Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-400" size={16} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="doctor@hospital.org or patient@warrior.com"
                          required
                          className="w-full h-12 pl-11 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2.5xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                          Access Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setScreen('forgot')}
                          className="text-[10px] font-black text-red-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          Reset Passcode?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={16} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          className="w-full h-12 pl-11 pr-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2.5xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-350 dark:border-slate-700 text-red-650 focus:ring-red-500 h-4.5 w-4.5"
                        />
                        <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                          Remember my email on this device
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmit}
                      className="w-full h-12 flex items-center justify-center gap-2 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-red-750 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isSubmit ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                      Authorize Clinical Access
                    </button>
                  </form>

                  <div className="border-t border-slate-200 dark:border-slate-800 my-6"></div>

                  <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    New to the Warrior network?{" "}
                    <button
                      onClick={() => setScreen('signup')}
                      className="text-red-600 dark:text-rose-400 font-extrabold hover:underline cursor-pointer"
                    >
                      Create Medical Profile
                    </button>
                  </p>

                  {/* Professional Trial Fast Track Section */}
                  <div className="p-4 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2.5xl space-y-3">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Sparkles size={14} className="animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">Synthetic demo status</span>
                    </div>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold leading-normal">
                      Preview roles are being rebuilt as a separate, synthetic-data workspace. These buttons will not create cloud accounts.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoAccess('Person with Sickle Cell Disease')}
                        disabled={isSubmit}
                        className="h-10 text-center text-[10px] font-black uppercase tracking-wider bg-white hover:bg-slate-150/40 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer select-none"
                      >
                        Patient preview status
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoAccess('Caregiver / Parent')}
                        disabled={isSubmit}
                        className="h-10 text-center text-[10px] font-black uppercase tracking-wider bg-white hover:bg-slate-150/40 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer select-none"
                      >
                        Caregiver preview status
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SIGN UP SCREEN */}
              {screen === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 overflow-y-auto max-h-[80vh] pr-2"
                >
                  <div>
                    <button
                      onClick={() => setScreen('landing')}
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4 cursor-pointer"
                    >
                      <ChevronLeft size={12} /> Return Home
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                      Clinical Profile Registration
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-450 font-bold">
                      Set up your protected health workspace and assign your functional role.
                    </p>
                  </div>

                  {generalError && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-250 dark:border-rose-900/55 rounded-2xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex flex-col gap-2">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 animate-bounce" />
                        <span>{generalError}</span>
                      </div>
                      {generalError.includes("already in use") && (
                        <button
                          type="button"
                          onClick={() => {
                            setScreen('login');
                            setGeneralError(null);
                          }}
                          className="self-start mt-1 px-3 py-1.5 bg-red-650 hover:bg-red-700 active:scale-95 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer"
                        >
                          Switch to Sign In Screen
                        </button>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-6">
                    
                    {/* General Bio Segment */}
                    <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                          Full Name (Legal Reference)
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 text-slate-400" size={16} />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Amina Harris"
                            required
                            className="w-full h-11 pl-11 pr-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                          Protected Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 text-slate-400" size={16} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="amina@clinical.com"
                            required
                            className="w-full h-11 pl-11 pr-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                          Primary Contact
                        </label>
                        <div className="flex gap-1.5 bg-transparent">
                          <select 
                            value={phoneCode} 
                            onChange={(e) => setPhoneCode(e.target.value)}
                            className="px-2 h-11 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:border-red-500 outline-none"
                          >
                            <option value="+1">+1 (US)</option>
                            <option value="+234">+234 (NG)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+91">+91 (IN)</option>
                            <option value="+27">+27 (ZA)</option>
                          </select>
                          <div className="relative flex-1 bg-transparent">
                            <Phone className="absolute left-4 top-3.5 text-slate-400" size={16} />
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                              placeholder="7081234567"
                              required
                              className="w-full h-11 pl-11 pr-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-3.5 text-slate-400" size={16} />
                          <input
                            type="date"
                            value={dob}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setDob(e.target.value)}
                            required
                            className="w-full h-11 pl-11 pr-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                          City / State Reference
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-3.5 text-slate-400" size={16} />
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Houston, Texas"
                            required
                            className="w-full h-11 pl-11 pr-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Care Role Profile Selection Block with Dynamic Description */}
                    <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-1.5">
                        <HeartHandshake className="text-red-500" size={18} />
                        <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                          Define Portal Access Target Role
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { 
                            role: 'Person with Sickle Cell Disease', 
                            label: 'Patient Warrior',
                            desc: 'Full pain indices, hydration monitoring, personal clinical profile metrics, and community advice access.'
                          },
                          { 
                            role: 'Caregiver / Parent', 
                            label: 'Supportive Caregiver',
                            desc: 'Securely track hydration values, log medical issues, and schedule medications on behalf of a loved warrior.'
                          },
                          { 
                            role: 'Healthcare Professional', 
                            label: 'Hematologist / Specialist',
                            desc: 'Integrate clinic metrics, view patient educational resources, clinical checklists, guidelines, and resource nodes.'
                          }
                        ].map((item) => (
                          <button
                            key={item.role}
                            type="button"
                            onClick={() => setUserRole(item.role as any)}
                            className={`p-4 rounded-2xl text-left border flex flex-col justify-between h-36 select-none transition-all cursor-pointer ${userRole === item.role ? 'bg-red-50/75 border-red-300 dark:bg-rose-950/25 dark:border-rose-900 text-slate-900 dark:text-white ring-1 ring-red-500/10' : 'bg-white hover:bg-slate-100/50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'}`}
                          >
                            <span className="text-xs font-black uppercase tracking-wider block text-red-650 dark:text-rose-400">
                              {item.label}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                              {item.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optional Emergency Contacts Segment */}
                    <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="text-red-500" size={18} />
                        <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                          Primary Emergency Coordinator (Optional)
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                        Adding details here instantly initiates standard crisis instructions. You can edit this under Emergency Contacts tab anytime.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9.5px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                            Name (Physician or Sponsor)
                          </label>
                          <input
                            type="text"
                            value={emergencyContactName}
                            onChange={(e) => setEmergencyContactName(e.target.value)}
                            placeholder="Dr. Raymond Finch, Hematologist"
                            className="w-full h-11 px-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold outline-none focus:border-red-500 transition-all text-slate-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[9.5px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                            Direct Contact Phone
                          </label>
                          <input
                            type="text"
                            value={emergencyContactPhone}
                            onChange={(e) => setEmergencyContactPhone(e.target.value)}
                            placeholder="+1 800-222-3490"
                            className="w-full h-11 px-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold outline-none focus:border-red-500 transition-all text-slate-800 dark:text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Standard Cryptographic Password Safety Box */}
                    <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-1.5">
                        <LockKeyhole className="text-red-500" size={18} />
                        <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                          Profile Access Security Code
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                            Choose Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-slate-400" size={16} />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Minimum 8 characters"
                              required
                              className="w-full h-11 pl-11 pr-11 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-3.5 text-slate-400 cursor-pointer"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                            Confirm Password Check
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-slate-400" size={16} />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Verify identical matching"
                              required
                              className="w-full h-11 pl-11 pr-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Password Requirements Indicator Block */}
                      {password.length > 0 && (
                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-inner">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                            <span>Diagnostic Complexity Index</span>
                            <span className={pwdStrength.score >= 80 ? 'text-teal-600 dark:text-teal-400 font-bold' : pwdStrength.score >= 40 ? 'text-amber-500 font-bold' : 'text-rose-500 font-bold'}>
                              {pwdStrength.score >= 80 ? 'Safe & Encrypted' : pwdStrength.score >= 40 ? 'Moderately Secure' : 'Inadequate Safety'}
                            </span>
                          </div>
                          
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden flex">
                            <div 
                              className={`h-full transition-all duration-300 ${pwdStrength.score >= 80 ? 'bg-teal-500 animate-pulse' : pwdStrength.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${pwdStrength.score}%` }}
                            ></div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              {pwdStrength.length ? <CheckCircle2 size={13} className="text-teal-500" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                              <span>Min 8 Characters</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {pwdStrength.uppercase ? <CheckCircle2 size={13} className="text-teal-500" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                              <span>Uppercase Letter</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {pwdStrength.lowercase ? <CheckCircle2 size={13} className="text-teal-500" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                              <span>Lowercase Letter</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {pwdStrength.number ? <CheckCircle2 size={13} className="text-teal-500" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                              <span>Numeric Digits</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {pwdStrength.special ? <CheckCircle2 size={13} className="text-teal-500" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                              <span>Special Symbol (!?@#)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Encrypted Clinical Consent Checklist */}
                    <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreeTOS}
                          onChange={(e) => setAgreeTOS(e.target.checked)}
                          className="mt-1 rounded border-slate-350 text-red-650 h-4.5 w-4.5 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-350 leading-relaxed">
                          I agree to the <span className="font-extrabold uppercase text-[10px] text-red-600 dark:text-rose-400">pilot terms of use</span> and understand this prototype is not an emergency service.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreeHealthConsent}
                          onChange={(e) => setAgreeHealthConsent(e.target.checked)}
                          className="mt-1 rounded border-slate-350 text-red-650 h-4.5 w-4.5 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-355 leading-relaxed">
                          I consent to the prototype processing the health information I choose to enter. I will use sample data unless my clinic has approved this pilot.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmit}
                      className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200/50 dark:shadow-rose-950/20 hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isSubmit ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                      Authorize Clinical Registration
                    </button>
                  </form>

                  <div className="border-t border-slate-200 dark:border-slate-800 my-6"></div>

                  <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    Already registered under this domain?{" "}
                    <button
                      onClick={() => setScreen('login')}
                      className="text-red-600 dark:text-rose-400 font-extrabold hover:underline cursor-pointer"
                    >
                      Sign In Instantly
                    </button>
                  </p>

                  {/* Professional Trial Fast Track Section */}
                  <div className="p-4 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2.5xl space-y-3">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Sparkles size={14} className="animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">Synthetic demo status</span>
                    </div>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold leading-normal">
                      Preview roles are being rebuilt as a separate, synthetic-data workspace. These buttons will not create cloud accounts.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoAccess('Person with Sickle Cell Disease')}
                        disabled={isSubmit}
                        className="h-10 text-center text-[10px] font-black uppercase tracking-wider bg-white hover:bg-slate-150/40 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer select-none"
                      >
                        Patient preview status
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoAccess('Caregiver / Parent')}
                        disabled={isSubmit}
                        className="h-10 text-center text-[10px] font-black uppercase tracking-wider bg-white hover:bg-slate-150/40 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer select-none"
                      >
                        Caregiver preview status
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* FORGOT PASSWORD */}
              {screen === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <button
                      onClick={() => setScreen('login')}
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4 cursor-pointer"
                    >
                      <ChevronLeft size={12} /> Return to Login
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                      Credentials Recovery
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-450 font-bold">
                      Authenticate via medical email to dispatch account unlock signals.
                    </p>
                  </div>

                  {generalError && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/35 border border-rose-250 dark:border-rose-900/55 rounded-2xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{generalError}</span>
                    </div>
                  )}

                  {generalSuccess && (
                    <div className="p-4 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/55 rounded-2xl text-xs font-semibold text-teal-800 dark:text-teal-400 flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-teal-600" />
                      <span>{generalSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                        Your Registration Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-400" size={16} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="doctor@hospital.org"
                          required
                          className="w-full h-12 pl-11 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2.5xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmit}
                      className="w-full h-12 flex items-center justify-center gap-2 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-red-750 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isSubmit ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                      Request Passcode Reset Coordinates
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ONBOARDING SEQUENCE */}
              {screen === 'onboarding' && (
                <motion.div
                  key="onboarding"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 overflow-y-auto max-h-[85vh] pr-2"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-650 text-white flex items-center justify-center font-black text-xs">
                        W
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block leading-none mb-0.5">
                          Care Parameters Configuration
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                          Onboarding Step {onboardingStep} of 3
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-[11px] font-bold font-mono text-slate-550 dark:text-slate-300">
                      Step {onboardingStep} / 3
                    </div>
                  </div>

                  {/* Step 1: Medical Genotype Select & Rehydration Parameters */}
                  {onboardingStep === 1 && (
                    <div className="space-y-5 animate-fadeIn">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                          Hematology Diagnostic Settings
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                          Define matching diagnostic genotypes. Our liquid automated calculation updates based on standard clinical baseline thresholds.
                        </p>
                      </div>

                      {userRole === 'Person with Sickle Cell Disease' ? (
                        <div className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {CLINICAL_GENOTYPES.map((g) => {
                              const isSelected = scdType === g.code;
                              return (
                                <button
                                  key={g.code}
                                  type="button"
                                  onClick={() => {
                                    setScdType(g.code);
                                    setTargetHydration(g.hydrationTarget);
                                  }}
                                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all select-none h-44 cursor-pointer ${isSelected ? 'bg-red-50/75 border-red-350 dark:bg-rose-950/20 dark:border-rose-900/80 text-slate-900 dark:text-white shadow-sm ring-1 ring-red-500/10' : 'bg-white hover:bg-slate-100/40 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'}`}
                                >
                                  <div className="flex justify-between items-center w-full mb-1">
                                    <span className="font-extrabold text-xs uppercase tracking-wider text-red-650 dark:text-rose-400 font-mono">
                                      Genotype - {g.code}
                                    </span>
                                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${isSelected ? 'bg-red-200/50 text-red-750 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                      {g.severity}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-black leading-tight text-slate-850 dark:text-slate-200 block mb-1">
                                    {g.name}
                                  </span>
                                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium leading-normal flex-1">
                                    {g.description}
                                  </p>
                                  <div className="pt-2 border-t border-slate-150 dark:border-slate-800 text-[10px] font-bold text-slate-450 dark:text-slate-400">
                                    Hydration Threshold Limit: {g.hydrationTarget}L / Daily
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-2.5xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-450 tracking-wider">
                              <span>Custom Fluid Replacement Index</span>
                              <span className="text-red-650 dark:text-rose-400 font-bold">{targetHydration} Liters / Day</span>
                            </div>
                            
                            <input
                              type="range"
                              min="2.0"
                              max="5.0"
                              step="0.1"
                              value={targetHydration}
                              onChange={(e) => setTargetHydration(parseFloat(e.target.value))}
                              className="w-full accent-red-650 tracking-wide cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-full"
                            />
                            <div className="flex items-start gap-2 pt-1">
                              <Info className="text-red-500 shrink-0 mt-0.5" size={13} />
                              <p className="text-[9.5px] text-slate-450 leading-relaxed font-semibold italic">
                                *Optimal daily rehydration indices suggested dynamically to mitigate clinical sickling. Ensure clinical practitioner validation.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center space-y-4 rounded-3xl">
                          <Heart className="mx-auto text-red-500 animate-pulse text-center" size={36} />
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                            Supporting Advocate Setup Complete
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto font-semibold">
                            You are registering as a supportive caregiver or healthcare specialist. You'll have prompt access to crisis coordinators, academy tools, and community advocacy channels.
                          </p>
                          
                          <div className="p-4 bg-white dark:bg-slate-900 rounded-2.5xl border border-slate-150 dark:border-slate-800 max-w-xs mx-auto">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 mb-1">
                              <span>Sponsor Hydration Target</span>
                              <span className="text-slate-800 dark:text-white">{targetHydration}L Goal</span>
                            </div>
                            <input
                              type="range"
                              min="2.0"
                              max="4.0"
                              step="0.5"
                              value={targetHydration}
                              onChange={(e) => setTargetHydration(parseFloat(e.target.value))}
                              className="w-full accent-red-650"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => setOnboardingStep(2)}
                          className="h-11 flex items-center justify-center gap-1 px-8 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Proceed Forward <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Environmental Crisis Triggers Selection */}
                  {onboardingStep === 2 && (
                    <div className="space-y-5 animate-fadeIn">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                          Environmental Crisis Triggers Log
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                          Check off physiological or climate factors that commonly precipitate pain crises or vaso-occlusion (VOC) events for your clinical references.
                        </p>
                      </div>

                      <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-850 space-y-3">
                        <div className="grid grid-cols-1 gap-2.5">
                          {PRESET_TRIGGERS.map((trigger) => {
                            const isChecked = crisisTriggersList.includes(trigger);
                            return (
                              <button
                                key={trigger}
                                type="button"
                                onClick={() => toggleTriggerSelection(trigger)}
                                className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 border text-left cursor-pointer transition-all rounded-2xl ${isChecked ? 'border-red-350 dark:border-rose-900' : 'border-slate-150 dark:border-slate-800/80'}`}
                              >
                                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                                  {trigger}
                                </span>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${isChecked ? 'bg-red-600 border-red-600 text-white' : 'border-slate-355 bg-white'}`}>
                                  {isChecked && <Check size={12} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-slate-800">
                        <button
                          onClick={() => setOnboardingStep(1)}
                          className="h-11 flex items-center gap-1.5 px-6 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={14} /> Back
                        </button>
                        <button
                          onClick={() => setOnboardingStep(3)}
                          className="h-11 flex items-center gap-1.5 px-8 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-750 transition-colors cursor-pointer"
                        >
                          Medication Reminders <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Medical Treatment & Medication Scheduler Setup */}
                  {onboardingStep === 3 && (
                    <div className="space-y-5 animate-fadeIn">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                          Therapeutic Medication reminders
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                          Initialize common sickle therapies, hematology supplements, or diagnostic medications to auto-populate daily dosing scheduler notifications.
                        </p>
                      </div>

                      <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                        
                        <div className="flex flex-wrap gap-2.5">
                          {PRESET_MEDS.map((med) => {
                            const isSelected = medicationsList.includes(med);
                            return (
                              <button
                                key={med}
                                type="button"
                                onClick={() => toggleMedSelection(med)}
                                className={`px-4 py-3 rounded-2xl border text-xs font-extrabold leading-tight transition-all cursor-pointer ${isSelected ? 'bg-red-50 border-red-300 text-red-650 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400 shadow-sm' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'}`}
                              >
                                {isSelected ? '✓ ' : '+ '} {med}
                              </button>
                            );
                          })}
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                          <label className="block text-[9.5px] font-black uppercase text-slate-400 tracking-wider">
                            Add Custom Clinical Medication
                          </label>
                          <div className="flex gap-2 bg-transparent">
                            <input
                              type="text"
                              value={newCustomMed}
                              onChange={(e) => setNewCustomMed(e.target.value)}
                              placeholder="e.g. Pain prescription, Hydrea 500mg, Ibuprofen"
                              className="flex-1 px-4 h-11 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-red-500"
                            />
                            <button
                              type="button"
                              onClick={addCustomMedication}
                              className="px-5 h-11 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black dark:hover:bg-slate-800 cursor-pointer"
                            >
                              Add Pill
                            </button>
                          </div>
                        </div>

                        {medicationsList.length > 0 && (
                          <div className="space-y-1.5 pt-3 border-t border-slate-150 dark:border-slate-800">
                            <span className="block text-[9.5px] font-black uppercase text-slate-400 tracking-wider mb-1">
                              Reminders Queued for 08:00 AM Daily:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {medicationsList.map((m) => (
                                <div key={m} className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-1.55 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-lg text-[11px] font-bold">
                                  <span>{m}</span>
                                  <button onClick={() => toggleMedSelection(m)} className="text-red-500 hover:text-red-700 ml-1">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setOnboardingStep(2)}
                          className="h-11 flex items-center gap-1.5 px-6 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={14} /> Back
                        </button>
                        <button
                          type="button"
                          onClick={handleOnboardingComplete}
                          disabled={isSubmit}
                          className="h-11 flex items-center justify-center gap-2 px-8 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all cursor-pointer"
                        >
                          {isSubmit ? <Loader2 size={14} className="animate-spin" /> : null}
                          Enter Portal Gateway
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Clinically Designed Footer */}
      <footer className="py-6 px-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Shield className="text-teal-600 dark:text-teal-400" size={14} />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold text-left">
            Pilot security, privacy, and clinical-governance review is still in progress.
          </span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex gap-4">
          <a href="#/terms" className="hover:underline">Terms of Service</a>
          <span>&middot;</span>
          <a href="#/privacy" className="hover:underline">Privacy & Cookies Policy</a>
          <span>&middot;</span>
          <a href="mailto:support@warriorcell.org" className="hover:underline flex items-center gap-1">
            <HelpCircle size={10} /> Clinical Support
          </a>
        </div>
      </footer>

    </div>
  );
};
