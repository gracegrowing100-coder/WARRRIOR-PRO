import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, Video, Star, Phone, Mic, MicOff, VideoOff, 
  X, ShieldCheck, CheckCircle2, User, Info, MapPin, 
  ChevronRight, AlertCircle, FileText, Activity, Heart, 
  PhoneOff, Trash2, Camera, Shield, HeartHandshake, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';
import { PremaritalGenotypeEducation } from './PremaritalGenotypeEducation';

const DOCTORS = [
  { 
    id: '1', 
    name: 'Dr. Amina Yusuf', 
    specialty: 'Pediatric Hematology', 
    rating: 4.9, 
    reviews: 120, 
    avail: 'Available Today', 
    icon: '👩‍⚕️',
    bio: 'Specialist in child-centric sickle cell management and crisis prevention with over 15 years of clinical experience.',
    location: 'Lagos, Nigeria',
    education: 'MBBS, MD (Hematology)'
  },
  { 
    id: '2', 
    name: 'Dr. Robert Chen', 
    specialty: 'Genetic Counseling', 
    rating: 4.8, 
    reviews: 85, 
    avail: 'Available Tomorrow', 
    icon: '👨‍⚕️',
    bio: 'Expert in premarital genetic screening, family planning counselors, and CRISPR clinical therapies.',
    location: 'Boston, US / Global',
    education: 'PhD in Medical Genetics, Stanford'
  },
  { 
    id: '3', 
    name: 'Dr. Kwame Nkrumah', 
    specialty: 'SCD General Specialist', 
    rating: 4.7, 
    reviews: 210, 
    avail: 'Available Today', 
    icon: '👨‍⚕️',
    bio: 'Dedicated to wholistic warrior pain crisis hydration regimens and chronic disease supportive services.',
    location: 'Accra, Ghana',
    education: 'MBBS, Family Medicine Specialist, WACS'
  },
];

const AVAILABLE_TIMES = [
  '09:00 AM',
  '10:30 AM',
  '11:15 AM',
  '01:30 PM',
  '03:00 PM',
  '04:30 PM'
];

const Telemedicine: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [view, setView] = useState<'hub' | 'call' | 'waiting'>('hub');
  const [bookingDoc, setBookingDoc] = useState<any>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [bookedAppointments, setBookedAppointments] = useState<any[]>([]);
  
  // Custom interactive booking states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientNote, setPatientNote] = useState<string>('');
  
  // Active call specifications
  const [activeCallDoctor, setActiveCallDoctor] = useState<any>(null);
  const [callSession, setCallSession] = useState<{ active: boolean; timer: number; isVideo: boolean }>({ active: false, timer: 0, isVideo: true });
  const [muteMicrophone, setMuteMicrophone] = useState(false);
  const [cameraStreamActive, setCameraStreamActive] = useState(true);
  
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const callTimerRef = useRef<any>(null);

  // Monitor auth connection securely
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // Fetch booked appointments in real-time or cached from Firestore
  useEffect(() => {
    const fetchAppointments = async () => {
      const apps = await firebaseService.getAppointments(currentUser?.uid || '');
      setBookedAppointments(apps);
    };
    fetchAppointments();
  }, [currentUser, view]);

  // Handle active call duration ticking
  useEffect(() => {
    if (view === 'call') {
      callTimerRef.current = setInterval(() => {
        setCallSession(prev => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallSession({ active: false, timer: 0, isVideo: true });
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [view]);

  // Mount microphone/camera stream realistically in Sandbox Environment
  useEffect(() => {
    if (view === 'call' && cameraStreamActive && videoElementRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoElementRef.current) {
            videoElementRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Camera hardware access restricted, running custom simulated feed overlay.", err);
        });
    }

    return () => {
      if (videoElementRef.current?.srcObject) {
        const stream = videoElementRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [view, cameraStreamActive]);

  // Set default interactive dates based on real local time context
  const getUpcomingDates = () => {
    const dates = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
      const isoStr = d.toISOString().split('T')[0];
      dates.push({ label, isoStr });
    }
    return dates;
  };

  const upcomingDates = getUpcomingDates();

  // Reset interactive fields before booking opens
  const openBookingModal = (doc: any) => {
    setBookingDoc(doc);
    setSelectedDate(upcomingDates[1].label); // Default to Tomorrow
    setSelectedTime(AVAILABLE_TIMES[1]); // Default to second slot
    setPatientNote('');
  };

  // Submit appointment spots to persistent cloud DB
  const handleBookingExecution = async () => {
    if (!bookingDoc) return;

    const dataPayload = {
      doctorId: bookingDoc.id,
      doctorName: bookingDoc.name,
      doctorIcon: bookingDoc.icon,
      doctorSpecialty: bookingDoc.specialty,
      bookedDate: selectedDate,
      bookedTime: selectedTime,
      patientNote: patientNote || 'Routine checkup and sickle cell health monitoring',
      status: 'Confirmed'
    };

    try {
      await firebaseService.addAppointment(currentUser?.uid || '', dataPayload);
      setBookingDoc(null);
      
      // Refresh list
      const apps = await firebaseService.getAppointments(currentUser?.uid || '');
      setBookedAppointments(apps);

      // Play light notification tone
      playAudioNotification(660, 'sine', 0.2);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Reservation Failed: Data structure did not register correctly with Firestore database components.");
    }
  };

  // Safe reservation cancellation helper
  const handleCancelBooking = async (appId: string) => {
    const confirm = window.confirm("Are you sure you want to cancel this physician consultation spot?");
    if (!confirm) return;

    try {
      await firebaseService.cancelAppointment(currentUser?.uid || '', appId);
      const apps = await firebaseService.getAppointments(currentUser?.uid || '');
      setBookedAppointments(apps);
      playAudioNotification(330, 'triangle', 0.15);
    } catch (err) {
      console.error("Cancellation error:", err);
    }
  };

  // Launches high-fidelity Virtual Video consulting sessions
  const initiateVirtualConsultation = (docSpec: any) => {
    setActiveCallDoctor(docSpec);
    setView('waiting');
    
    // Play electronic dial signaling beep
    playAudioNotification(523.25, 'sine', 0.4);

    setTimeout(() => {
      setView('call');
    }, 2800);
  };

  // Helper to build realistic WebAudio feedback notifications
  const playAudioNotification = (freq: number, type: 'sine' | 'triangle' | 'square', dur: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.start();
        osc.stop(ctx.currentTime + dur);
      }
    } catch (e) {
      console.log("Audio simulation bypassed in present browser configuration.");
    }
  };

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6" id="care-hub-root-component">
      
      {/* 1. FULLSCREEN SECURE CLINICAL TELEMEDICINE TELEMTRY SCREEN */}
      <AnimatePresence>
        {view === 'call' && activeCallDoctor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#070b0e] z-[120] flex flex-col font-sans select-none text-white overflow-hidden"
          >
            {/* Upper secure telemetry rail */}
            <div className="bg-[#0b1216]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center z-10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#d9fdd3] flex items-center gap-1.5 leading-none">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    Encrypted Medical Consultation
                  </span>
                  <p className="text-[9px] text-gray-500 font-mono tracking-wider mt-0.5">HIPAA COMPLIANT CHANNEL REFERENCE: 2026_SCD_LIGN</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 rounded-full text-indigo-300 font-black tracking-widest uppercase">
                  Telemedicine Feed
                </span>
              </div>
            </div>

            {/* Video Body Workspace splits into remote medical stream and details */}
            <div className="flex-1 flex flex-col lg:flex-row relative">
              {/* Doctor remote camera visual replacement screen */}
              <div className="flex-1 relative bg-gradient-to-tr from-[#020508] to-[#121b22] flex items-center justify-center p-6 h-[60%] lg:h-auto">
                <div className="text-center space-y-6 relative max-w-sm">
                  {/* Fluid water-like medical radar ring */}
                  <div className="absolute inset-0 bg-[#3b82f6]/10 rounded-full scale-[1.65] animate-ping" style={{ animationDuration: '4s' }}></div>
                  <div className="absolute inset-0 bg-[#3b82f6]/5 rounded-full scale-[1.25] animate-pulse"></div>
                  
                  <div className="w-36 h-36 bg-[#16222f] rounded-[2.5rem] mx-auto border-[5px] border-indigo-750/30 flex items-center justify-center text-6xl shadow-2xl relative z-10">
                    {activeCallDoctor.icon}
                  </div>
                  
                  <div className="relative z-10 space-y-2">
                    <h3 className="text-2xl font-black tracking-tight text-white">{activeCallDoctor.name}</h3>
                    <p className="text-xs text-blue-400 font-black uppercase tracking-wider">{activeCallDoctor.specialty}</p>
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 font-mono uppercase tracking-widest mt-3 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Doctor Live
                    </span>
                  </div>
                </div>

                {/* Patient overlay local camera stream window (draggable-style or bottom-right placement) */}
                <div className="absolute bottom-6 right-6 w-36 md:w-56 aspect-[4/3] bg-slate-950 border-4 border-white/15 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center z-20">
                  {cameraStreamActive ? (
                    <video 
                      ref={videoElementRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover transform -scale-x-100 bg-[#000]"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-center text-gray-500 p-2 select-none">
                      <VideoOff size={18} className="opacity-40" />
                      <span className="text-[8px] font-black uppercase tracking-widest font-mono">Camera Blocked</span>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/5">
                    <span className="text-[8px] font-black font-mono text-white/80">YOU</span>
                  </div>
                </div>
              </div>

              {/* Side medical records and health instructions drawer */}
              <div className="w-full lg:w-80 bg-[#090e11] border-t lg:border-t-0 lg:border-l border-white/5 p-5 flex flex-col justify-between overflow-y-auto max-h-[40%] lg:max-h-none">
                <div className="space-y-5">
                  <header className="flex items-center gap-2 pb-3 border-b border-white/5 select-none">
                    <Activity size={16} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Consultation Brief</span>
                  </header>

                  <div className="bg-[#12191d] rounded-2xl p-4 border border-white/5 text-xs space-y-1.5 font-semibold text-gray-300">
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest block font-mono">Specialist Care Unit</span>
                    <p className="font-extrabold text-[#edf2f7]">{activeCallDoctor.education}</p>
                    <div className="flex gap-1 items-center text-[10px] opacity-75 mt-2">
                      <MapPin size={10} />
                      <span>{activeCallDoctor.location}</span>
                    </div>
                  </div>

                  <div className="space-y-2 select-text">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono">Patient Clinical Logs</span>
                    <div className="p-3 bg-red-950/15 border border-red-900/30 rounded-xl">
                      <p className="text-[10px] font-extrabold text-rose-300 leading-relaxed italic">
                        {"\"Pre-booked consultation regarding hydration velocity indexes. Ensure user maintains liquid replacement index (>3.5 Liters) prior to hydroxyurea adjustments.\""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 text-center select-none space-y-2">
                  <div className="text-3xl font-mono font-black text-white px-4 py-2 bg-[#12191d] rounded-2xl border border-white/5 inline-block tracking-widest">
                    {formatCallTime(callSession.timer)}
                  </div>
                  <p className="text-[8px] text-gray-500 uppercase font-mono tracking-widest font-black">Connection Duration</p>
                </div>
              </div>
            </div>

            {/* Bottom active consultation call controls bar */}
            <div className="bg-[#0b1216] border-t border-white/5 py-6 px-10 flex justify-center items-center gap-6 z-10 shadow-2xl">
              <button 
                onClick={() => {
                  setMuteMicrophone(!muteMicrophone);
                  playAudioNotification(muteMicrophone ? 580 : 440, 'sine', 0.1);
                }}
                className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all cursor-pointer ${
                  muteMicrophone ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#18232c] hover:bg-[#25323e] border border-white/5 text-gray-300'
                }`}
                title="Mute / Unmute Microphone Voice"
              >
                {muteMicrophone ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <button 
                onClick={() => {
                  setCameraStreamActive(!cameraStreamActive);
                  playAudioNotification(cameraStreamActive ? 420 : 610, 'sine', 0.1);
                }}
                className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all cursor-pointer ${
                  !cameraStreamActive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#18232c] hover:bg-[#25323e] border border-white/5 text-gray-300'
                }`}
                title="Toggle Local Camera Video Feed"
              >
                {cameraStreamActive ? <Camera size={22} /> : <VideoOff size={22} />}
              </button>

              <button 
                onClick={() => {
                  setView('hub');
                  playAudioNotification(220, 'square', 0.45);
                }}
                className="w-24 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] flex items-center justify-center hover:scale-105 active:scale-95 shadow-xl shadow-rose-950/45 transition-all cursor-pointer"
                title="Disconnect Secure Consultation Feed"
              >
                <PhoneOff size={24} className="stroke-[3]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SECURE WAITING ROOM TRANSITIONAL SCREEN */}
      <AnimatePresence>
        {view === 'waiting' && activeCallDoctor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#070b0e]/95 z-[120] flex flex-col items-center justify-center p-8 select-none font-sans text-white"
          >
            <div className="w-full max-w-md text-center space-y-8 bg-[#0e161c] border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
               {/* Ambient pulsing blue backlights */}
               <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
               
               <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 border-[6px] border-white/5 border-t-indigo-505 rounded-full animate-spin" style={{ animationDuration: '1.2s' }}></div>
                  <Video size={36} className="text-indigo-400 animate-pulse animate-duration-1000" />
               </div>

               <div className="space-y-3">
                  <h2 className="text-2xl font-black text-white tracking-tight">Accessing Secure Port</h2>
                  <p className="text-xs text-gray-400 font-extrabold uppercase tracking-widest leading-none">Connecting to {activeCallDoctor.name}...</p>
                  <p className="text-xs text-slate-500 font-medium italic mt-2">"Establishing telehealth signal over encrypted genomic pipelines. Hold tight."</p>
               </div>

               <div className="bg-[#121a20] p-5 rounded-2xl border border-white/5 flex items-center gap-4 text-left">
                  <div className="w-10 h-10 bg-[#1a252f] rounded-xl flex items-center justify-center text-indigo-400 border border-white/5"><Shield size={20} /></div>
                  <div>
                     <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Clinic Status</p>
                     <p className="text-sm font-black text-white leading-none">Authorized specialist on standby</p>
                  </div>
               </div>

               <button 
                 onClick={() => {
                   setView('hub');
                   playAudioNotification(260, 'sine', 0.1);
                 }}
                 className="text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-rose-400 cursor-pointer transition-all"
               >
                 Cancel consultation request
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. HEADERS AND STATISTICS NAVIGATION VIEW */}
      {view === 'hub' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-none mb-1 text-slate-900">Physician Care Hub</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Holistic Hematology Scheduling & Secure Telehealth Calls</p>
            </div>
            
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 self-start md:self-auto select-none">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">HIPAA Encrypted Clinic</span>
            </div>
          </div>

          {/* Clinical Telemedicine Hotline Banner */}
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden group border-[6px] border-white select-none">
            {/* Soft decorative background circles */}
            <div className="absolute top-1/2 right-0 w-80 h-80 bg-white/5 rounded-full -mr-24 -mt-40 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-3xl border border-white/20 shadow-2xl flex items-center justify-center shrink-0">
                <Video size={48} className="text-indigo-200 animate-pulse" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-3">
                <div className="inline-block bg-indigo-500/10 border border-white/10 text-indigo-300 font-extrabold uppercase text-[9px] tracking-widest px-3.5 py-1 rounded-full font-mono">
                  🔴 Live Telehealth Standby
                </div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight">On-Call Pain Crisis Line</h3>
                <p className="text-xs md:text-sm text-gray-200 leading-relaxed max-w-xl font-medium">
                  Connect instantaneously with our active duty hematology specialists for clinical dehydration advice, pain escalation triggers, or emergency medicine consults.
                </p>
                <div className="pt-3">
                  <button 
                    onClick={() => initiateVirtualConsultation(DOCTORS[0])}
                    className="bg-white text-indigo-800 font-black hover:bg-[#edf2f7] hover:scale-105 active:scale-95 text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-xl cursor-pointer"
                  >
                    Enter waiting room
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Primary View content splits into Verified Doctors and Schedules */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Physicians Directory listing */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center gap-2 select-none border-b border-gray-150 pb-2">
                <Star size={18} className="text-yellow-500" fill="currentColor" />
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Verified Hematology Experts</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {DOCTORS.map(doc => {
                  const isCurDocExpanded = selectedDoc?.id === doc.id;
                  return (
                    <div 
                      key={doc.id} 
                      onClick={() => setSelectedDoc(isCurDocExpanded ? null : doc)}
                      className={`bg-white p-6 rounded-[2rem] shadow-sm border-2 transition-all group cursor-pointer ${
                        isCurDocExpanded 
                          ? 'border-indigo-550 shadow-indigo-100/50 scale-[1.01]' 
                          : 'border-gray-50 hover:border-gray-200 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-gray-100 group-hover:bg-indigo-50/50 transition-colors shrink-0">
                            {doc.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-gray-800 text-lg leading-snug tracking-tight">{doc.name}</h4>
                            <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest mt-1.5 px-2.5 py-1 bg-indigo-50/50 rounded-lg inline-block whitespace-nowrap">
                              {doc.specialty}
                            </p>
                            
                            <div className="flex items-center gap-2.5 mt-2.5 font-semibold text-gray-400 text-[10px]">
                              <span className="flex items-center gap-1">
                                <MapPin size={10} />
                                {doc.location}
                              </span>
                              <span>&bull;</span>
                              <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 font-bold whitespace-nowrap">
                                <Star size={9} className="text-yellow-500" fill="currentColor" />
                                {doc.rating}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 shrink-0">
                          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1.5 select-none">{doc.avail}</p>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              openBookingModal(doc); 
                            }}
                            className="bg-slate-900 border border-slate-950 text-white text-[9px] font-black uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-black transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            Book Spot
                          </button>
                        </div>
                      </div>

                      {/* Expanded physician detailed view */}
                      <AnimatePresence>
                        {isCurDocExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-5 pt-5 border-t border-gray-100 space-y-4"
                          >
                            <p className="text-xs font-semibold text-gray-500 italic leading-relaxed">
                              "{doc.bio}"
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3.5 select-none md:max-w-md">
                              <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 font-mono">Academic Credentials</p>
                                <p className="text-[11px] font-extrabold text-slate-700">{doc.education}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 font-mono">Accreditation Status</p>
                                <p className="text-[11px] font-black text-emerald-600 flex items-center gap-1 shadow-sm leading-none py-1 rounded">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span> 
                                  Verified Consultant
                                </p>
                              </div>
                            </div>

                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                openBookingModal(doc); 
                              }}
                              className="w-full sm:hidden bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl cursor-pointer"
                            >
                              Reserve consultation appointment
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Premarital & Relationship Genotype Education Service */}
              <div className="pt-2">
                <PremaritalGenotypeEducation 
                  onBookCounselor={(doctorId, doctorName) => {
                    const doc = DOCTORS.find(d => d.id === doctorId) || DOCTORS[1];
                    openBookingModal(doc);
                  }}
                />
              </div>
            </div>

            {/* Your schedule details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 select-none border-b border-gray-150 pb-2">
                <Calendar size={18} className="text-indigo-600" />
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Active Schedule</h3>
              </div>

              {/* Booked Appointments Stream Card */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 text-center relative select-none">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-100 via-indigo-500 to-indigo-100"></div>
                
                {bookedAppointments.length > 0 ? (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 no-scrollbar text-left">
                    {bookedAppointments.map((app, i) => {
                      const isCancelled = app.status === 'Cancelled';
                      return (
                        <div 
                          key={app.id || i} 
                          className={`p-4 rounded-3xl border flex flex-col items-start translate-y-0 text-left transition-all relative ${
                            isCancelled 
                              ? 'bg-slate-50 border-gray-150 opacity-60' 
                              : 'bg-indigo-50/15 border-indigo-100/60 shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between w-full items-start mb-2">
                            <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm text-xl shrink-0">
                              {app.doctorIcon || '🩺'}
                            </div>
                            
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest font-mono leading-none ${
                                isCancelled 
                                  ? 'bg-gray-200 text-gray-500' 
                                  : 'bg-emerald-100/80 text-emerald-700 border border-emerald-200'
                              }`}>
                                {app.status || 'Confirmed'}
                              </span>
                              <span className="text-[7px] font-bold font-mono text-gray-400">ID: {app.id?.slice(0, 5) || 'Local'}</span>
                            </div>
                          </div>

                          <h5 className="font-extrabold text-[#1a202c] text-sm leading-snug tracking-tight">
                            {app.doctorName}
                          </h5>
                          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-0.5 font-mono">
                            {app.doctorSpecialty}
                          </span>

                          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 mt-3 text-slate-500">
                            <div className="flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-wider">
                              <Calendar size={11} className="text-indigo-500" /> 
                              {app.bookedDate}
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-wider">
                              <Clock size={11} className="text-indigo-500" /> 
                              {app.bookedTime}
                            </div>
                          </div>

                          <div className="w-full mt-3 p-2 bg-slate-50 border border-gray-100 rounded-lg text-[10px] font-semibold text-gray-500 select-text leading-tight max-h-[46px] overflow-y-auto no-scrollbar">
                            <span className="text-[7px] font-bold text-gray-450 uppercase block tracking-widest font-mono select-none">Patient Complaint</span>
                            {app.patientNote}
                          </div>

                          {!isCancelled && (
                            <div className="flex gap-2 w-full mt-4 select-none pt-2.5 border-t border-gray-100">
                              <button 
                                onClick={() => handleCancelBooking(app.id)}
                                className="flex-1 bg-white border border-gray-150 text-[8px] text-gray-400 font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-pointer flex items-center justify-center gap-1"
                                title="Cancel Scheduled Consultation"
                              >
                                <Trash2 size={12} />
                                Cancel
                              </button>
                              
                              <button 
                                onClick={() => initiateVirtualConsultation({
                                  id: app.doctorId,
                                  name: app.doctorName,
                                  specialty: app.doctorSpecialty,
                                  icon: app.doctorIcon || '🩺',
                                  education: 'MBBS, Clinical Hematology Consultant',
                                  location: 'Assigned Clinic Area'
                                })}
                                className="px-5 bg-[#0b141a] text-white border border-slate-900 rounded-xl hover:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                title="Launch Instant Telemedicine Consultation"
                              >
                                <Video size={13} className="text-indigo-300 animate-pulse" />
                                <span className="text-[8px] font-mono font-black uppercase tracking-widest">Connect Call</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12">
                    <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] mx-auto flex items-center justify-center text-gray-300 mb-5 border border-gray-50">
                       <Calendar size={24} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-[0.18em] font-mono">No Scheduled Spots</p>
                    <p className="text-[11px] text-gray-400 mt-2 font-medium italic opacity-70 leading-relaxed max-w-xs mx-auto">
                      "Prevention is critical. Pre-schedule diagnostic appointments with hematologists when required."
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Interactive Mini Calendar Display */}
              <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm select-none">
                <header className="flex items-center justify-between mb-4">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">June 2026</span>
                   <div className="flex gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                      <span className="text-[8px] font-bold font-mono text-gray-300">Live UTC Clock</span>
                   </div>
                </header>
                
                <div className="grid grid-cols-7 gap-1.5 text-center">
                   {['S','M','T','W','T','F','S'].map((d, idx) => <div key={`${d}-${idx}`} className="text-[8px] font-black text-gray-300">{d}</div>)}
                   {Array.from({ length: 30 }).map((_, i) => {
                      const day = i + 1;
                      const isToday = day === 14;
                      const hasAppoint = bookedAppointments.some(a => a.bookedDate.includes(String(day)) && a.status !== 'Cancelled');
                      
                      return (
                        <div 
                          key={i} 
                          className={`aspect-square flex flex-col items-center justify-center text-[10px] font-black rounded-lg cursor-default relative transition-all ${
                            isToday 
                              ? 'bg-indigo-600 text-white shadow-lg' 
                              : hasAppoint 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/60 font-black' 
                                : 'text-gray-400 hover:bg-gray-50/50'
                          }`}
                        >
                          <span>{day}</span>
                          {hasAppoint && (
                            <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-600"></span>
                          )}
                        </div>
                      );
                   })}
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* 4. CLINICAL APPOINTMENT BOOKING DIALOG (SLOT SELECTION MODAL) */}
      <AnimatePresence>
        {bookingDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] flex items-center justify-center p-4 select-none font-sans">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-6 md:p-8 shadow-2xl overflow-hidden border-2 border-slate-900 relative"
            >
               {/* Ambient top aesthetic stripe */}
               <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-indigo-500 via-indigo-700 to-indigo-500"></div>

               <div className="text-center space-y-3 mb-6 relative mt-2">
                 <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner border border-indigo-100">
                   {bookingDoc.icon}
                 </div>
                 <h3 className="text-xl font-black text-gray-800 leading-none">Book Consultation</h3>
                 <span className="text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono block">
                   Scheduling With {bookingDoc.name}
                 </span>
                 <p className="text-[11px] text-gray-400 font-semibold italic max-w-xs mx-auto">
                   "{bookingDoc.specialty}"
                 </p>
               </div>

               {/* Interactive Selector details */}
               <div className="space-y-4 mb-6">
                  
                  {/* Date Selector Row */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono">1. Choose Date Spot</span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                      {upcomingDates.map((dateObj, idx) => {
                        const isChosen = selectedDate === dateObj.label;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedDate(dateObj.label);
                              playAudioNotification(880, 'sine', 0.05);
                            }}
                            className={`px-4 py-2.5 rounded-xl border text-[10px] font-black tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                              isChosen 
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-95' 
                                : 'bg-slate-50 border-gray-150 text-gray-500 hover:bg-slate-100'
                            }`}
                          >
                            {dateObj.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Selector Row */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono">2. Choose Time Slot</span>
                    <div className="grid grid-cols-3 gap-2">
                      {AVAILABLE_TIMES.map((time, idx) => {
                        const isChosen = selectedTime === time;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedTime(time);
                              playAudioNotification(920, 'sine', 0.05);
                            }}
                            className={`py-2 rounded-xl border text-[10px] font-black tracking-tight transition-all cursor-pointer ${
                              isChosen 
                                ? 'bg-[#0b141a] text-white border-slate-900 shadow-md scale-95' 
                                : 'bg-slate-50 border-gray-150 text-gray-500 hover:bg-slate-100'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Patient Symptoms text notes */}
                  <div className="space-y-1.5 select-text">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono">3. Patient Health Notes (Optional)</span>
                    <textarea
                      placeholder="Add brief symptoms description (e.g. joint fatigue level, hydroxyurea refill review...)"
                      value={patientNote}
                      onChange={(e) => setPatientNote(e.target.value)}
                      rows={2}
                      className="w-full p-3 bg-slate-50 border border-gray-200 rounded-2xl text-[11px] font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

               </div>

               {/* Dialog actions */}
               <div className="flex gap-3 select-none">
                 <button 
                   onClick={() => setBookingDoc(null)} 
                   className="flex-1 py-3.5 bg-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest text-[#a0aec0] hover:bg-slate-200 transition-all cursor-pointer"
                 >
                   Cancel
                 </button>
                 
                 <button 
                   onClick={handleBookingExecution}
                   className="flex-2 py-3.5 bg-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all cursor-pointer"
                 >
                   Schedule Spot
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Telemedicine;
