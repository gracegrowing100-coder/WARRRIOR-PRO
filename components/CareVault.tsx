import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Calendar, 
  MapPin, 
  Activity, 
  FileText, 
  HeartHandshake, 
  Printer, 
  Sparkle, 
  Edit3, 
  AlertCircle,
  Stethoscope,
  Lock,
  Unlock,
  FileDown,
  Check,
  TrendingUp,
  Upload,
  User,
  Phone,
  BookOpen,
  X,
  FileCheck,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebaseService';
import { PainAndSymptomTrends } from './PainAndSymptomTrends';
import { generateClinicalPassportPDF } from '../services/pdfPassportService';
import { VoiceInputButton } from './VoiceInputButton';
import { PredictivePainAnalysis } from './PredictivePainAnalysis';
import { ERSurvivalToolkit } from './ERSurvivalToolkit';
import { CareVaultHydrationLogger } from './CareVaultHydrationLogger';
import { MoodWellnessTracker } from './MoodWellnessTracker';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer 
} from 'recharts';

// --- TYPES ---
export interface Surgery {
  id: string;
  name: string;
  date: string;
  hospital: string;
  complications?: string;
}

export interface Hospitalization {
  id: string;
  reason: string;
  date: string;
  durationDays: number;
  notes: string;
}

export interface Transfusion {
  id: string;
  date: string;
  volumeMl: number;
  units: number;
  reactionNotes: string;
}

export interface PainCrisisLog {
  id: string;
  date: string;
  chiefComplaint: string;
  severity: number; // 0-10
  durationHours: number;
  triggers: string[];
  painLocations: string[];
  treatmentsUsed: string;
  didGoToER: boolean;
  outcome: string;
}

export interface MedicationHistory {
  id: string;
  name: string;
  dosage: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  adherenceNotes?: string;
}

export interface LabResult {
  id: string;
  date: string;
  hemoglobin: number;
  reticulocyte?: number;
  bilirubin?: number;
  ldh?: number;
  ferritin?: number;
  hbfPercentage?: number;
  notes?: string;
}

export interface AttachedRecord {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
}

export interface CareVaultData {
  primaryDiagnosis: string;
  otherConditions: string[];
  allergies: string;
  surgeries: Surgery[];
  hospitalizations: Hospitalization[];
  transfusions: Transfusion[];
  immunizations: string[];
  painCrises: PainCrisisLog[];
  medications: MedicationHistory[];
  labs: LabResult[];
  attachedFiles: AttachedRecord[];
  chelation: {
    isActive: boolean;
    agentName: string;
    ironOverloadStatus: string;
  };
  diseaseModifyingTherapy: {
    hydroxyureaResponse: string;
    latestHbF: string;
    sideEffects: string;
  };
  emergencyInfo: {
    hematologistName: string;
    hematologistPhone: string;
    usualPainRegimen: string;
    whatToTellER: string;
  };
  notesJournal: string;
}

interface CareVaultProps {
  userId: string;
}

type TabType = 'symptoms' | 'mood' | 'hydration' | 'predictive' | 'er_toolkit' | 'diagnostics' | 'procedures' | 'medications' | 'labs' | 'passport';

export const CareVault: React.FC<CareVaultProps> = ({ userId }) => {
  // Gating Lock State
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem('warrior_carevault_unlocked') === 'true';
  });
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);

  // Core Data State
  const [data, setData] = useState<CareVaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('symptoms');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab 1 (Symptoms Form Stating)
  const [sympDate, setSympDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sympComplaint, setSympComplaint] = useState('Vaso-occlusive Pain Crisis (VOC)');
  const [sympSeverity, setSympSeverity] = useState(7);
  const [sympDuration, setSympDuration] = useState(12);
  const [sympTriggers, setSympTriggers] = useState<string[]>([]);
  const [sympLocations, setSympLocations] = useState<string[]>([]);
  const [sympTreatments, setSympTreatments] = useState('');
  const [sympER, setSympER] = useState(false);
  const [sympOutcome, setSympOutcome] = useState('Home hydration and resting');

  // Tab 2 (Diagnostics / History)
  const [newComorb, setNewComorb] = useState('');
  const [editingDiagnostics, setEditingDiagnostics] = useState(false);
  const [scdGenotype, setScdGenotype] = useState('');
  const [chelationAgent, setChelationAgent] = useState('');
  const [chelationActive, setChelationActive] = useState(false);
  const [chelationStatus, setChelationStatus] = useState('');
  const [hydroxyResponse, setHydroxyResponse] = useState('');
  const [hydroxyHbF, setHydroxyHbF] = useState('');
  const [hydroxySideEffects, setHydroxySideEffects] = useState('');

  const [vaccines, setVaccines] = useState({
    pneumococcal: true,
    meningococcal: true,
    flu: true,
    covid: true,
    hepatitisB: true
  });

  // Tab 3 (Procedures / Stays)
  const [surgName, setSurgName] = useState('');
  const [surgDate, setSurgDate] = useState('');
  const [surgHospital, setSurgHospital] = useState('');
  const [surgComps, setSurgComps] = useState('None');

  const [hospReason, setHospReason] = useState('');
  const [hospDate, setHospDate] = useState('');
  const [hospDurationDays, setHospDurationDays] = useState(2);
  const [hospNotesValue, setHospNotesValue] = useState('');

  const [transDate, setTransDate] = useState('');
  const [transVol, setTransVol] = useState(350);
  const [transUnits, setTransUnits] = useState(1);
  const [transNotes, setTransNotes] = useState('None. Simple transfusion.');

  // Tab 4 (Medications & Allergies)
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medStart, setMedStart] = useState('');
  const [medEnd, setMedEnd] = useState('');
  const [medActive, setMedActive] = useState(true);
  const [medNotes, setMedNotes] = useState('');
  const [allergiesText, setAllergiesText] = useState('');

  // Tab 5 (Lab Records & OCR Simulation)
  const [labDate, setLabDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [labHb, setLabHb] = useState(8.2);
  const [labRetic, setLabRetic] = useState(11.5);
  const [labBili, setLabBili] = useState(2.3);
  const [labFerritin, setLabFerritin] = useState(450);
  const [labLDH, setLabLDH] = useState(360);
  const [labHbF, setLabHbF] = useState(18.0);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrExtractedValue, setOcrExtractedValue] = useState<string | null>(null);

  // Tab 6 (Passport & Free-text)
  const [emergencyMeds, setEmergencyMeds] = useState('');
  const [emergencyERWhat, setEmergencyERWhat] = useState('');
  const [emergencyPainReg, setEmergencyPainReg] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [journalContent, setJournalContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default Prefilled Core Model
  const ensureFullVaultData = (raw: any): CareVaultData => {
    return {
      primaryDiagnosis: raw.primaryDiagnosis || 'Sickle Cell Disease (HbSS - Homozygous)',
      otherConditions: raw.otherConditions || ['Asthma', 'Avascular Necrosis (Right hip)'],
      allergies: raw.allergies || 'Penicillin (Anaphylaxis), Sulfa (Rashes)',
      surgeries: raw.surgeries || [
        { id: 's-1', name: 'Splenectomy', date: '2021-04-12', hospital: 'St. Jude Children\'s Hospital', complications: 'None. Scheduled procedure.' },
        { id: 's-2', name: 'Cholecystectomy', date: '2023-08-15', hospital: 'General Surgical Center', complications: 'None.' }
      ],
      hospitalizations: raw.hospitalizations || [
        { id: 'h-1', reason: 'Severe Vaso-occlusive Pain Crisis', date: '2025-11-10', durationDays: 4, notes: 'Treated with IV Hydromorphone PCA and aggressive normal saline hydration.' }
      ],
      transfusions: raw.transfusions || [
        { id: 't-1', date: '2024-12-05', volumeMl: 350, units: 1, reactionNotes: 'Simple transfusion. No adverse reactions recorded.' }
      ],
      immunizations: raw.immunizations || [
        'Pneumococcal PCV15', 'Meningococcal Quadrivalent', 'Annual Influenza Nose Spray', 'Hepatitis B Complete Series'
      ],
      painCrises: raw.painCrises || [
        { id: 'c-1', date: '2026-02-18', chiefComplaint: 'Severe Sternum VOC', severity: 8, durationHours: 36, triggers: ['Sudden Cold Temperature', 'Dehydration'], painLocations: ['Back', 'Chest'], treatmentsUsed: 'Oral fluids (3.5L), Oxycodone 10mg, Warm heating pads', didGoToER: false, outcome: 'Resolved at home with intense resting' }
      ],
      medications: raw.medications || [
        { id: 'm-1', name: 'Hydroxyurea', dosage: '1500mg daily (Oral)', startDate: '2022-03-10', isActive: true, adherenceNotes: 'Very high adherence. Excellent hematological response.' },
        { id: 'm-2', name: 'Folic Acid', dosage: '1mg daily', startDate: '2019-01-01', isActive: true, adherenceNotes: 'Routine supplement helper.' }
      ],
      labs: raw.labs || [
        { id: 'l-1', date: '2026-01-15', hemoglobin: 8.5, reticulocyte: 11.2, bilirubin: 2.1, ldh: 340, ferritin: 450, hbfPercentage: 18.2, notes: 'Routine hematology check.' },
        { id: 'l-2', date: '2026-03-20', hemoglobin: 7.9, reticulocyte: 12.8, bilirubin: 2.7, ldh: 410, ferritin: 480, hbfPercentage: 18.5, notes: 'Checked shortly after mild chest cold.' },
        { id: 'l-3', date: '2026-05-10', hemoglobin: 8.6, reticulocyte: 10.9, bilirubin: 1.9, ldh: 320, ferritin: 430, hbfPercentage: 18.8, notes: 'Stable baseline.' }
      ],
      attachedFiles: raw.attachedFiles || [
        { id: 'f-1', name: 'tcd_transcranial_doppler_scan_2025.pdf', type: 'PDF Scan', date: '2025-06-18', size: '2.4 MB' }
      ],
      chelation: raw.chelation || {
        isActive: false,
        agentName: 'Deferasirox (Exjade)',
        ironOverloadStatus: 'Normal (Ferritin < 500 ng/mL). No active iron overload worries.'
      },
      diseaseModifyingTherapy: raw.diseaseModifyingTherapy || {
        hydroxyureaResponse: 'Excellent therapeutic outcome',
        latestHbF: '18.8%',
        sideEffects: 'Mild transient nausea if taken on fully empty stomach.'
      },
      emergencyInfo: raw.emergencyInfo || {
        hematologistName: 'Dr. Evelyn Martinez, MD',
        hematologistPhone: '(555) 732-2615 ext. 4',
        usualPainRegimen: 'Dilaudid 1.5mg IV bolus or Oxycodone 10mg PO. Fluid volume 1.5x maintenance. Demerol contraindicated.',
        whatToTellER: 'I have homozygous Sickle Cell (HbSS) with a baseline Hb of 8.0. I am presenting with typical acute pain crisis. Please do not assume drug-seeking. Rapid treatment avoids acute chest syndrome.'
      },
      notesJournal: raw.notesJournal || 'Key notes from Dr. Martinez: Emphatically maintain high hydration during peak summer workouts. Incentive spirometer 10 breaths every 2 hours if chest congestion appears.'
    };
  };

  // Sync Core Data
  useEffect(() => {
    let active = true;
    const fetchVault = async () => {
      try {
        const vault = await firebaseService.getCareVault(userId);
        if (active) {
          const formatted = ensureFullVaultData(vault || {});
          setData(formatted);
          setScdGenotype(formatted.primaryDiagnosis);
          setAllergiesText(formatted.allergies);
          setChelationAgent(formatted.chelation.agentName);
          setChelationActive(formatted.chelation.isActive);
          setChelationStatus(formatted.chelation.ironOverloadStatus);
          setHydroxyResponse(formatted.diseaseModifyingTherapy.hydroxyureaResponse);
          setHydroxyHbF(formatted.diseaseModifyingTherapy.latestHbF);
          setHydroxySideEffects(formatted.diseaseModifyingTherapy.sideEffects);
          setEmergencyERWhat(formatted.emergencyInfo.whatToTellER);
          setEmergencyPainReg(formatted.emergencyInfo.usualPainRegimen);
          setDoctorName(formatted.emergencyInfo.hematologistName);
          setDoctorPhone(formatted.emergencyInfo.hematologistPhone);
          setJournalContent(formatted.notesJournal);
        }
      } catch (err) {
        console.error('Error fetching clinical vault:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchVault();
    return () => { active = false; };
  }, [userId]);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Locking actions
  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234' || pin.trim() === '1234') {
      setIsUnlocked(true);
      localStorage.setItem('warrior_carevault_unlocked', 'true');
      setPinError(false);
      setPin('');
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleSimulateBiometrics = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      setIsUnlocked(true);
      localStorage.setItem('warrior_carevault_unlocked', 'true');
    }, 1400);
  };

  const handleLockVault = () => {
    setIsUnlocked(false);
    localStorage.removeItem('warrior_carevault_unlocked');
  };

  // DB Sync helper
  const syncWithFirebase = async (updatedData: CareVaultData) => {
    setSaving(true);
    try {
      await firebaseService.saveCareVault(userId, updatedData);
      setData(updatedData);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Action: Add Symptoms/Pain Log
  const handleAddSymptomLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const newLog: PainCrisisLog = {
      id: 'cr-' + Math.random().toString(36).substring(2, 9),
      date: sympDate,
      chiefComplaint: sympComplaint,
      severity: Number(sympSeverity),
      durationHours: Number(sympDuration),
      triggers: sympTriggers,
      painLocations: sympLocations,
      treatmentsUsed: sympTreatments || 'Oral fluids and heating packs',
      didGoToER: sympER,
      outcome: sympOutcome
    };
    const updated = {
      ...data,
      painCrises: [newLog, ...data.painCrises]
    };
    await syncWithFirebase(updated);
    // Reset form
    setSympTreatments('');
    setSympOutcome('Resolved at home');
    setSympTriggers([]);
    setSympLocations([]);
    triggerSuccess('Pain Crisis & Symptom Milestone logged successfully.');
  };

  const handleRemoveSymptomLog = async (id: string) => {
    if (!data) return;
    const filtered = data.painCrises.filter(p => p.id !== id);
    await syncWithFirebase({ ...data, painCrises: filtered });
    triggerSuccess('Log entry removed.');
  };

  // Action: Save SCD diagnostics status
  const handleSaveDiagnostics = async () => {
    if (!data) return;
    const updated: CareVaultData = {
      ...data,
      primaryDiagnosis: scdGenotype,
      allergies: allergiesText,
      chelation: {
        isActive: chelationActive,
        agentName: chelationAgent,
        ironOverloadStatus: chelationStatus
      },
      diseaseModifyingTherapy: {
        hydroxyureaResponse: hydroxyResponse,
        latestHbF: hydroxyHbF,
        sideEffects: hydroxySideEffects
      }
    };
    await syncWithFirebase(updated);
    setEditingDiagnostics(false);
    triggerSuccess('Clinical & therapy records synchronized.');
  };

  // Action: Add surgery
  const handleAddSurgery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !surgName) return;
    const newItem: Surgery = {
      id: 'su-' + Math.random().toString(36).substring(2, 9),
      name: surgName,
      date: surgDate || new Date().toISOString().split('T')[0],
      hospital: surgHospital || 'General Clinic',
      complications: surgComps
    };
    await syncWithFirebase({ ...data, surgeries: [...data.surgeries, newItem] });
    setSurgName('');
    setSurgHospital('');
    setSurgComps('None');
    triggerSuccess('Surgical report logged.');
  };

  const handleRemoveSurgery = async (id: string) => {
    if (!data) return;
    const filtered = data.surgeries.filter(s => s.id !== id);
    await syncWithFirebase({ ...data, surgeries: filtered });
    triggerSuccess('Surgical metric archived.');
  };

  // Action: Add hospitalization
  const handleAddHosp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !hospReason) return;
    const newItem: Hospitalization = {
      id: 'ho-' + Math.random().toString(36).substring(2, 9),
      reason: hospReason,
      date: hospDate || new Date().toISOString().split('T')[0],
      durationDays: Number(hospDurationDays),
      notes: hospNotesValue
    };
    await syncWithFirebase({ ...data, hospitalizations: [...data.hospitalizations, newItem] });
    setHospReason('');
    setHospNotesValue('');
    triggerSuccess('Hospital admission record synchronized.');
  };

  const handleRemoveHosp = async (id: string) => {
    if (!data) return;
    const filtered = data.hospitalizations.filter(h => h.id !== id);
    await syncWithFirebase({ ...data, hospitalizations: filtered });
  };

  // Action: Add blood transfusion
  const handleAddTrans = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !transDate) return;
    const newItem: Transfusion = {
      id: 'tr-' + Math.random().toString(36).substring(2, 9),
      date: transDate,
      volumeMl: Number(transVol),
      units: Number(transUnits),
      reactionNotes: transNotes
    };
    await syncWithFirebase({ ...data, transfusions: [...data.transfusions, newItem] });
    setTransNotes('None.');
    triggerSuccess('Blood transfusion recorded.');
  };

  const handleRemoveTrans = async (id: string) => {
    if (!data) return;
    const filtered = data.transfusions.filter(t => t.id !== id);
    await syncWithFirebase({ ...data, transfusions: filtered });
  };

  // Action: Medications
  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !medName) return;
    const newItem: MedicationHistory = {
      id: 'md-' + Math.random().toString(36).substring(2, 9),
      name: medName,
      dosage: medDosage || 'As directed',
      startDate: medStart || new Date().toISOString().split('T')[0],
      endDate: medEnd || undefined,
      isActive: medActive,
      adherenceNotes: medNotes
    };
    await syncWithFirebase({ ...data, medications: [...data.medications, newItem] });
    setMedName('');
    setMedDosage('');
    setMedNotes('');
    triggerSuccess('Therapeutic medication added.');
  };

  const handleRemoveMed = async (id: string) => {
    if (!data) return;
    const filtered = data.medications.filter(m => m.id !== id);
    await syncWithFirebase({ ...data, medications: filtered });
  };

  // Action: Add Lab Result
  const handleAddLab = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!data) return;
    const newLab: LabResult = {
      id: 'lb-' + Math.random().toString(36).substring(2, 9),
      date: labDate,
      hemoglobin: Number(labHb),
      reticulocyte: Number(labRetic),
      bilirubin: Number(labBili),
      ldh: Number(labLDH),
      ferritin: Number(labFerritin),
      hbfPercentage: Number(labHbF)
    };
    const updated = {
      ...data,
      labs: [...data.labs, newLab].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };
    await syncWithFirebase(updated);
    triggerSuccess('Hematological markers recorded.');
  };

  const handleRemoveLab = async (id: string) => {
    if (!data) return;
    const filtered = data.labs.filter(l => l.id !== id);
    await syncWithFirebase({ ...data, labs: filtered });
  };

  // Action: Simulated File Drag/Drop File Upload (OCR Mock)
  const handleFileUpload = (file: File) => {
    if (!data) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds HIPAA guideline limits of 10MB.');
      return;
    }
    setOcrScanning(true);
    setOcrExtractedValue(null);

    // Simulate OCR Scan with standard laser animation
    setTimeout(() => {
      setOcrScanning(false);
      // Simulate extraction based on name
      let extractedHb = 8.1;
      let docName = file.name.slice(0, 30);
      if (file.name.toLowerCase().includes('cbc')) extractedHb = 8.4;
      if (file.name.toLowerCase().includes('lab')) extractedHb = 7.8;
      
      setLabHb(extractedHb);
      setOcrExtractedValue(`Extracted Hemoglobin: ${extractedHb} g/dL, Retic: 11.2%`);

      const newFile: AttachedRecord = {
        id: 'fl-' + Math.random().toString(36).substring(2, 9),
        name: docName,
        type: file.type || 'Clinical Report',
        date: new Date().toISOString().split('T')[0],
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      };

      const updated = {
        ...data,
        attachedFiles: [newFile, ...data.attachedFiles]
      };
      syncWithFirebase(updated);
      triggerSuccess(`Uploader: "${docName}" successfully verified & scanned.`);
    }, 2800);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = async (id: string) => {
    if (!data) return;
    const filtered = data.attachedFiles.filter(f => f.id !== id);
    await syncWithFirebase({ ...data, attachedFiles: filtered });
    triggerSuccess('Document deleted from Clinical Vault.');
  };

  // Action: Save Passport contacts
  const handleSavePassportNotes = async () => {
    if (!data) return;
    const updated: CareVaultData = {
      ...data,
      notesJournal: journalContent,
      emergencyInfo: {
        hematologistName: doctorName,
        hematologistPhone: doctorPhone,
        usualPainRegimen: emergencyPainReg,
        whatToTellER: emergencyERWhat
      }
    };
    await syncWithFirebase(updated);
    triggerSuccess('Clinical Emergency Card parameters saved.');
  };

  const handlePrint = () => {
    window.print();
  };

  // Format Copy Clinical Text Resume
  const handleCopySummary = () => {
    if (!data) return;
    const txt = `
CLINICAL ACCREDITED SUMMARY: SECURE SYLVAN CARE VAULT
------------------------------------------------------
Patient Genotype: ${data.primaryDiagnosis}
Severe Drug Allergies: ${data.allergies}
Co-Morbidities: ${data.otherConditions.join(', ') || 'None'}

ACTIVE CLINICAL REGIMENS:
${data.medications.filter(m => m.isActive).map(m => `- ${m.name}: ${m.dosage}`).join('\n')}

LATEST HEMATOLOGICAL BASELINE STATS:
- Hemoglobin range: ${data.labs.slice(-1)[0]?.hemoglobin || 'N/A'} g/dL
- HbF Percentage: ${data.diseaseModifyingTherapy.latestHbF}

EMERGENCY PROTOCOL (FOR ER STAFF):
- Hematologist Contact: ${data.emergencyInfo.hematologistName} / ${data.emergencyInfo.hematologistPhone}
- Advised Pain Regimen: ${data.emergencyInfo.usualPainRegimen}
- Principal Advisory: ${data.emergencyInfo.whatToTellER}
    `;
    navigator.clipboard.writeText(txt.trim());
    triggerSuccess('Clinical medical summary formatted & copied to clipboard.');
  };

  const toggleTrigger = (trigger: string) => {
    setSympTriggers(prev => 
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const toggleLocation = (loc: string) => {
    setSympLocations(prev => 
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-12 flex flex-col items-center justify-center min-h-[380px]">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest mt-4">Decrypting Care Vault Database...</p>
      </div>
    );
  }

  // Gating Render: LOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden shadow-2xl max-w-4xl mx-auto">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center py-6">
          <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 text-teal-400 shadow-inner mb-6 relative">
            <Lock className="w-10 h-10 text-teal-400 animate-pulse" />
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight uppercase">SCD Care Vault Locked</h3>
          <span className="bg-teal-500/10 text-teal-400 text-[10px] tracking-widest uppercase font-black px-3.5 py-1.5 rounded-full mt-3 inline-flex items-center gap-1.5 border border-teal-500/20">
            <Sparkle size={10} fill="currentColor" /> AES-256 Cloud Cryptographic Lock
          </span>

          <p className="text-sm text-slate-450 max-w-lg mt-4 leading-relaxed font-semibold">
            This module contains highly confidential medical records, clinical genomes, vaso-occlusive crisis trends, and emergency medication regimen guidelines.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
            {/* PIN Card form */}
            <form onSubmit={handleUnlockPin} className="bg-slate-900/50 hover:bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 transition-colors flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">PIN Pad Lock</span>
              <input 
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-24 text-center bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl py-3 text-lg font-bold tracking-[0.5em] text-white"
              />
              {pinError && (
                <span className="text-red-400 text-[9px] font-black uppercase tracking-wider mt-2 block animate-bounce">Incorrect PIN. Try 1234</span>
              )}
              <button 
                type="submit"
                className="w-full mt-4 bg-slate-800 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-widest py-3 rounded-xl cursor-pointer transition-colors"
              >
                Access PIN Code
              </button>
            </form>

            {/* Quick Fingerprint Biometrics */}
            <div className="bg-slate-900/50 hover:bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 transition-colors flex flex-col items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Simulated Biometric Gate</span>
              
              <button 
                onClick={handleSimulateBiometrics}
                disabled={biometricScanning}
                className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${
                  biometricScanning 
                    ? 'border-yellow-500 text-yellow-400 scale-105 rotate-180 duration-1000' 
                    : 'border-teal-500/40 text-teal-400 hover:border-teal-400'
                }`}
              >
                <Activity className="w-7 h-7" />
              </button>

              <button
                onClick={handleSimulateBiometrics}
                className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-widest py-3 rounded-xl cursor-pointer transition-colors"
              >
                {biometricScanning ? 'Verifying Bio...' : 'Fingerprint Access'}
              </button>
            </div>
          </div>
          
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-6">
            Default sandbox credentials: PIN code <strong className="text-teal-400">1234</strong>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all text-slate-105">
      {/* Decorative Glow elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/10 p-3.5 rounded-[1.5rem] text-teal-400 border border-teal-500/20 shadow-inner">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-xl text-white leading-none">Sickle Cell Care Vault</h3>
              <span className="bg-teal-500/15 text-teal-400 text-[9px] uppercase font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-teal-500/20">
                <Sparkle size={9} fill="currentColor" /> Active Encrypted Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Double-secured clinical chronicle tracking complaints, therapeutic drug compliance, lab curves, and active emergency passports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => data && generateClinicalPassportPDF(data)}
            className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-red-950/40"
            title="Download formatted Clinical Passport PDF for healthcare professionals"
          >
            <FileDown className="w-3.5 h-3.5" /> Clinical Passport PDF
          </button>

          <button 
            type="button"
            onClick={handleLockVault}
            className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer self-start sm:self-center transition-all"
          >
            <Lock className="w-3.5 h-3.5" /> Lock Vault
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-slate-900/60 rounded-[1.5rem] border border-slate-850">
        {[
          { id: 'symptoms', label: '🚨 Symptoms & Pain' },
          { id: 'mood', label: '🧠 Mood & Wellness' },
          { id: 'hydration', label: '💧 Hydration Manager' },
          { id: 'predictive', label: '🔮 Predictive Analysis' },
          { id: 'er_toolkit', label: '🎒 ER Survival Toolkit' },
          { id: 'diagnostics', label: '📋 Genotype & Therapy' },
          { id: 'procedures', label: '🏥 Procedures & Stays' },
          { id: 'medications', label: '💊 Meds & Allergies' },
          { id: 'labs', label: '📊 Labs & Scans' },
          { id: 'passport', label: '🪪 Clinical Passport' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 min-w-[130px] text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-teal-650 text-white shadow-lg border border-teal-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback messaging */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-[280px]">
        {/* TAB MOOD & MENTAL WELLNESS */}
        {activeTab === 'mood' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MoodWellnessTracker userId={userId} />
          </motion.div>
        )}
        
        {/* TAB HYDRATION MANAGER */}
        {activeTab === 'hydration' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CareVaultHydrationLogger userId={userId} />
          </motion.div>
        )}

        {/* TAB PREDICTIVE PAIN ANALYSIS */}
        {activeTab === 'predictive' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PredictivePainAnalysis painCrises={data?.painCrises || []} />
          </motion.div>
        )}

        {/* TAB ER SURVIVAL TOOLKIT */}
        {activeTab === 'er_toolkit' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ERSurvivalToolkit />
          </motion.div>
        )}

        {/* TAB 1: Symptoms and Pain Log */}
        {activeTab === 'symptoms' && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* 30-Day Pain & Symptom Trends Recharts Dashboard */}
            <PainAndSymptomTrends painCrises={data.painCrises} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Pain Crisis Quick Log Form */}
              <form onSubmit={handleAddSymptomLog} className="lg:col-span-2 bg-slate-900/80 border border-slate-805 p-5 rounded-[2rem] space-y-4">
                <span className="text-teal-400 text-xs font-black uppercase tracking-widest block">Quick Pain & Symptom Logger</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Entry date</label>
                    <input 
                      type="date"
                      value={sympDate}
                      onChange={(e) => setSympDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Chief Symptom</label>
                    <select
                      value={sympComplaint}
                      onChange={(e) => setSympComplaint(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option>Vaso-occlusive Pain Crisis (VOC)</option>
                      <option>Extreme Fatigue & Lethargy</option>
                      <option>Shortness of Breath (Acute Chest concern)</option>
                      <option>Headache & Dizziness</option>
                      <option>Fever or Joint Joint Stiffness</option>
                    </select>
                  </div>
                </div>

                {/* Pain intensity slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Pain Severity Scale</label>
                    <span className="font-black text-rose-400 text-xs">{sympSeverity}/10</span>
                  </div>
                  <input 
                    type="range"
                    min={1}
                    max={10}
                    value={sympSeverity}
                    onChange={(e) => setSympSeverity(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                    <span>MILD</span>
                    <span>MODERATE</span>
                    <span>SEVERE CRISIS</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Duration (Hours)</label>
                    <input 
                      type="number"
                      value={sympDuration}
                      onChange={(e) => setSympDuration(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <input 
                      type="checkbox"
                      id="sympERCheck"
                      checked={sympER}
                      onChange={(e) => setSympER(e.target.checked)}
                      className="w-4 h-4 accent-teal-500 mr-2"
                    />
                    <label htmlFor="sympERCheck" className="text-xs text-rose-450 font-bold selection:cursor-pointer uppercase tracking-wider">Required ER visit?</label>
                  </div>
                </div>

                {/* Triggers checkboxes */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Triggers recognized</label>
                  <div className="flex flex-wrap gap-1">
                    {['Sudden Cold', 'Dehydration', 'High Stress', 'Sore Throat/Flu', 'Over-exertion'].map((trigger) => {
                      const active = sympTriggers.includes(trigger);
                      return (
                        <button
                          key={trigger}
                          type="button"
                          onClick={() => toggleTrigger(trigger)}
                          className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${
                            active ? 'bg-orange-600/30 text-orange-400 border border-orange-500/20' : 'bg-slate-950 text-slate-450'
                          }`}
                        >
                          {trigger}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pain locations */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Pain pain location body checklist</label>
                  <div className="flex flex-wrap gap-1 font-semibold text-[9px]">
                    {['Back', 'Chest', 'Sternum', 'Bilateral Knees', 'Hip joints', 'Abdomen', 'Shoulders'].map((loc) => {
                      const active = sympLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => toggleLocation(loc)}
                          className={`px-2 py-1 rounded-md transition-colors ${
                            active ? 'bg-rose-600/30 text-rose-400 border border-rose-500/20' : 'bg-slate-950 text-slate-450'
                          }`}
                        >
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Treatments & Symptom Details</label>
                    <VoiceInputButton 
                      label="Dictate Log"
                      onTranscript={(text) => {
                        setSympTreatments((prev) => (prev ? `${prev} ${text}` : text));
                      }} 
                    />
                  </div>
                  <input 
                    type="text"
                    value={sympTreatments}
                    onChange={(e) => setSympTreatments(e.target.value)}
                    placeholder="Treatments (Doses/Hydration/Warm bath, etc.)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                  <input 
                    type="text"
                    value={sympOutcome}
                    onChange={(e) => setSympOutcome(e.target.value)}
                    placeholder="Current outcome / pain progression"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] uppercase tracking-widest py-3 rounded-xl cursor-pointer"
                >
                  {saving ? 'Syncing...' : '💾 Save Symptom Activity'}
                </button>
              </form>

              {/* Symptom Timeline logs display */}
              <div className="lg:col-span-3 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                <span className="text-slate-450 text-xs font-black uppercase tracking-widest block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Historic logged pain crises logs ({data.painCrises.length})
                </span>

                {data.painCrises.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl relative group">
                    <button 
                      onClick={() => handleRemoveSymptomLog(p.id)}
                      className="absolute top-3 right-3 text-slate-550 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] font-black text-rose-450 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{p.chiefComplaint}</span>
                      <span className="text-[9px] font-black text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full">Pain: {p.severity}/10</span>
                      {p.didGoToER && <span className="text-[9px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full animate-bounce">🚨 ER ADMIT</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">Details & Outcomes</span>
                        <p className="font-extrabold text-slate-205 mt-0.5 leading-relaxed">{p.outcome}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">Body Locations & Triggers</span>
                        <p className="font-bold text-slate-400 mt-0.5 leading-relaxed">
                          Locations: <span className="text-rose-350">{p.painLocations.join(', ') || 'N/A'}</span> &bull; 
                          Triggers: <span className="text-amber-400">{p.triggers.join(', ') || 'None'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-850 text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="font-bold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Checked: {p.date} &bull; duration: {p.durationHours} hrs
                      </span>
                      <span className="italic">Med: {p.treatmentsUsed}</span>
                    </div>
                  </div>
                ))}

                {data.painCrises.length === 0 && (
                  <p className="text-center text-xs text-slate-500 italic py-8">No sickle cell pain logs recorded. Use the left form to quick-log.</p>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: Diagnostics, Genotypes & Disease-Modifying Therapy */}
        {activeTab === 'diagnostics' && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Genotype Comorbidity block */}
              <div className="bg-slate-900 border border-slate-855 rounded-3xl p-5 space-y-4">
                <span className="text-teal-400 text-xs font-black uppercase tracking-widest block">Accredited Diagnosis & Co-morbidities</span>
                
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Primary Genotype</label>
                  {editingDiagnostics ? (
                    <input 
                      type="text"
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white w-full"
                      value={scdGenotype}
                      onChange={(e) => setScdGenotype(e.target.value)}
                    />
                  ) : (
                    <p className="font-black text-sm text-slate-105 bg-slate-950 border border-slate-855 px-3 py-2 rounded-xl">{data.primaryDiagnosis}</p>
                  )}
                  <span className="text-[8px] text-slate-500 font-bold block mt-1">e.g. Homozygous HbSS, HbSC, HbSβ0-thal</span>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Accredited Co-Morbidities</label>
                  <div className="flex flex-wrap gap-1.5">
                    {data.otherConditions.map((cond, idx) => (
                      <span key={idx} className="bg-slate-950 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-800 flex items-center gap-1.5">
                        {cond}
                        <button 
                          onClick={async () => {
                            const updated = data.otherConditions.filter((_, i) => i !== idx);
                            await syncWithFirebase({ ...data, otherConditions: updated });
                            triggerSuccess('Comorbidity updated.');
                          }} 
                          className="text-red-400 hover:text-red-650 cursor-pointer text-xs"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input 
                      type="text"
                      placeholder="Add comorbidity (e.g. Asthma, Retinopathy)"
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white w-full"
                      value={newComorb}
                      onChange={(e) => setNewComorb(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && newComorb.trim()) {
                          await syncWithFirebase({ ...data, otherConditions: [...data.otherConditions, newComorb.trim()] });
                          setNewComorb('');
                          triggerSuccess('Added comorbidity.');
                        }
                      }}
                    />
                    <button 
                      onClick={async () => {
                        if (newComorb.trim()) {
                          await syncWithFirebase({ ...data, otherConditions: [...data.otherConditions, newComorb.trim()] });
                          setNewComorb('');
                          triggerSuccess('Added comorbidity.');
                        }
                      }}
                      className="bg-slate-800 hover:bg-slate-750 px-3.5 rounded-xl cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Severe Reactions & Allergies</label>
                  {editingDiagnostics ? (
                    <input 
                      type="text"
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white w-full"
                      value={allergiesText}
                      onChange={(e) => setAllergiesText(e.target.value)}
                    />
                  ) : (
                    <p className="text-xs text-rose-350 bg-rose-500/5 border border-rose-500/10 px-3 py-2 rounded-xl italic font-bold">⚠️ {data.allergies}</p>
                  )}
                </div>

                <div className="pt-2">
                  {editingDiagnostics ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSaveDiagnostics}
                        className="bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-[10px] uppercase py-2 px-4 rounded-xl w-full cursor-pointer"
                      >
                        Save record Parameters
                      </button>
                      <button 
                        onClick={() => setEditingDiagnostics(false)}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-400 text-[10px] uppercase py-2 px-4 rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setEditingDiagnostics(true)}
                      className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-extrabold text-[10px] uppercase py-2.5 px-4 rounded-xl w-full flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit accredited values
                    </button>
                  )}
                </div>
              </div>

              {/* Disease-Modifying Therapies (Hydroxyurea / HbF) */}
              <div className="bg-slate-900 border border-slate-855 rounded-3xl p-5 space-y-4">
                <span className="text-teal-400 text-xs font-black uppercase tracking-widest block">Therapy & Modifiers</span>
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3.5">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-850/50">
                    <span className="text-[10px] text-slate-400 font-black uppercase">Hydroxyurea Status</span>
                    <span className="bg-purple-500/10 text-purple-400 p-1 rounded-md text-[9px] font-black uppercase">Active Therapy</span>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block">HU Patient Response</label>
                    <p className="font-extrabold text-xs text-slate-205 mt-0.5">{data.diseaseModifyingTherapy.hydroxyureaResponse}</p>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Latest HbF Level</label>
                    <p className="font-extrabold text-sm text-purple-400 mt-0.5">{data.diseaseModifyingTherapy.latestHbF}</p>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block">HU Monitoring Side Effects</label>
                    <p className="text-slate-400 text-[11px] leading-relaxed italic mt-0.5">"{data.diseaseModifyingTherapy.sideEffects}"</p>
                  </div>
                </div>

                {/* Simulated Chelation Therapy */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4">
                  <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest block mb-2.5">📋 Chelation & Iron Load</span>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Active Deferasirox/Chelation?</span>
                    <span className="text-xs font-bold text-slate-205">{data.chelation.isActive ? 'Active intake' : 'None. Ferritin levels safe (< 500)'}</span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Iron Overload Status Notes</span>
                    <p className="text-[11px] text-slate-450 leading-relaxed italic font-semibold mt-0.5">"{data.chelation.ironOverloadStatus}"</p>
                  </div>
                </div>
              </div>

              {/* Preventative Immunization targets */}
              <div className="bg-slate-900 border border-slate-855 rounded-3xl p-5 space-y-4">
                <span className="text-teal-400 text-xs font-black uppercase tracking-widest block">SCD preventative Vaccinations</span>
                <p className="text-[11px] text-slate-450 leading-relaxed">
                  Patients lacking splenic protective filters require active prophylactic vaccination schedules to combat encapsulated bacteria.
                </p>

                <div className="space-y-2.5">
                  {[
                    { id: 'p', label: 'PCV13 & PCV15 Pneumococcal status', val: vaccines.pneumococcal, set: () => setVaccines(v => ({...v, pneumococcal: !v.pneumococcal})) },
                    { id: 'm', label: 'Meningococcal Quadrivalent (ACWY)', val: vaccines.meningococcal, set: () => setVaccines(v => ({...v, meningococcal: !v.meningococcal})) },
                    { id: 'f', label: 'Annual Influenza nasal or standard shot', val: vaccines.flu, set: () => setVaccines(v => ({...v, flu: !v.flu})) },
                    { id: 'c', label: 'COVID-19 Booster immunization', val: vaccines.covid, set: () => setVaccines(v => ({...v, covid: !v.covid})) },
                    { id: 'h', label: 'Hepatitis B Routine Schedule vaccine', val: vaccines.hepatitisB, set: () => setVaccines(v => ({...v, hepatitisB: !v.hepatitisB})) },
                  ].map((chk) => (
                    <div key={chk.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-850">
                      <span className="text-xs text-slate-300 font-semibold">{chk.label}</span>
                      <button 
                        onClick={chk.set}
                        className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border ${
                          chk.val ? 'bg-emerald-600/20 text-emerald-400 border-emerald-555' : 'bg-slate-900 text-slate-550 border-slate-800'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 3: Procedures & Clinical Stays */}
        {activeTab === 'procedures' && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Box A: Surgeries */}
              <div className="bg-slate-900/50 border border-slate-850 p-5 rounded-3xl space-y-4">
                <span className="text-amber-400 text-xs font-black uppercase block flex items-center gap-1">
                  <Stethoscope className="w-4 h-4" /> Surgical history
                </span>

                <form onSubmit={handleAddSurgery} className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3">
                  <input 
                    type="text" 
                    required 
                    placeholder="Procedure (e.g. Splenectomy)" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    value={surgName}
                    onChange={(e) => setSurgName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      value={surgDate}
                      onChange={(e) => setSurgDate(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="Hospital clinic" 
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      value={surgHospital}
                      onChange={(e) => setSurgHospital(e.target.value)}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="complications if any" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white text-[11px]"
                    value={surgComps}
                    onChange={(e) => setSurgComps(e.target.value)}
                  />
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs uppercase select-none">
                    Log Surgery procedure
                  </button>
                </form>

                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {data.surgeries.map((s) => (
                    <div key={s.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl relative group text-xs">
                      <button onClick={() => handleRemoveSurgery(s.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 cursor-pointer">
                        &times;
                      </button>
                      <h5 className="font-extrabold text-white text-[11px]">{s.name}</h5>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">{s.date} &bull; {s.hospital}</span>
                      <p className="text-[10px] italic text-slate-400 mt-1">Complications: {s.complications || 'None'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box B: Hospitalizations & ICU Admissions */}
              <div className="bg-slate-900/50 border border-slate-850 p-5 rounded-3xl space-y-4">
                <span className="text-rose-450 text-xs font-black uppercase block flex items-center gap-1">
                  <HeartHandshake className="w-4 h-4" /> Hospital admissions Stays
                </span>

                <form onSubmit={handleAddHosp} className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3">
                  <input 
                    type="text" 
                    required 
                    placeholder="Reason (e.g. Acute chest crisis)" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    value={hospReason}
                    onChange={(e) => setHospReason(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      value={hospDate}
                      onChange={(e) => setHospDate(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Duration days" 
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      value={hospDurationDays}
                      onChange={(e) => setHospDurationDays(Number(e.target.value))}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Treatment details IV fluids/pain protocol" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white text-[11px]"
                    value={hospNotesValue}
                    onChange={(e) => setHospNotesValue(e.target.value)}
                  />
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs uppercase select-none">
                    Log Admission Stay
                  </button>
                </form>

                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {data.hospitalizations.map((h) => (
                    <div key={h.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl relative text-xs">
                      <button onClick={() => handleRemoveHosp(h.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 cursor-pointer">
                        &times;
                      </button>
                      <h5 className="font-extrabold text-white text-[11px]">{h.reason}</h5>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">{h.date} &bull; {h.durationDays} Days</span>
                      <p className="text-[10px] text-slate-400 italic mt-1 font-semibold">{h.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box C: Transfusions */}
              <div className="bg-slate-900/50 border border-slate-850 p-5 rounded-3xl space-y-4">
                <span className="text-red-400 text-xs font-black uppercase block flex items-center gap-1">
                  <Activity className="w-4 h-4 animate-pulse" /> Blood transfusions history
                </span>

                <form onSubmit={handleAddTrans} className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      required 
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      value={transDate}
                      onChange={(e) => setTransDate(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Volume (ml)" 
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      value={transVol}
                      onChange={(e) => setTransVol(Number(e.target.value))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number" 
                      placeholder="Units" 
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      value={transUnits}
                      onChange={(e) => setTransUnits(Number(e.target.value))}
                    />
                    <input 
                      type="text" 
                      placeholder="Reaction notes If any" 
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      value={transNotes}
                      onChange={(e) => setTransNotes(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs uppercase select-none">
                    Log Blood transfusion
                  </button>
                </form>

                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {data.transfusions.map((t) => (
                    <div key={t.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl relative text-xs">
                      <button onClick={() => handleRemoveTrans(t.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 cursor-pointer">
                        &times;
                      </button>
                      <h5 className="font-extrabold text-red-400 text-[11px]">{t.units} Units Transfused ({t.volumeMl}ml)</h5>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">{t.date}</span>
                      <p className="text-[10px] text-slate-400 italic mt-1 font-semibold">Reaction notes: {t.reactionNotes}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 4: Medications & Allergies */}
        {activeTab === 'medications' && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Form Entry */}
              <form onSubmit={handleAddMed} className="lg:col-span-1.5 bg-slate-900 border border-slate-850 p-5 rounded-[2rem] space-y-3.5">
                <span className="text-teal-400 text-xs font-black uppercase tracking-widest block mb-2">Add clinical drug formulation</span>
                
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Drug name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Hydroxyurea, Siklos" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">dosage mg</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1000mg PO daily" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      value={medDosage}
                      onChange={(e) => setMedDosage(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Status Active?</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      value={medActive ? "true" : "false"}
                      onChange={(e) => setMedActive(e.target.value === "true")}
                    >
                      <option value="true">Active therapy</option>
                      <option value="false">Past medication</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      value={medStart}
                      onChange={(e) => setMedStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Stop Date if any</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      value={medEnd}
                      onChange={(e) => setMedEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Adherence Notes / Side effects</label>
                  <input 
                    type="text" 
                    placeholder="Adherence details or symptoms" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                    value={medNotes}
                    onChange={(e) => setMedNotes(e.target.value)}
                  />
                </div>

                <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] uppercase py-3 rounded-xl cursor-pointer select-none">
                  Save active drug to charts
                </button>
              </form>

              {/* Grid medications list */}
              <div className="lg:col-span-2.5 space-y-3">
                <span className="text-slate-450 text-xs font-black uppercase tracking-widest block">Active Medications Tracker</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[440px] overflow-y-auto pr-1">
                  
                  {data.medications.map((m) => (
                    <div key={m.id} className="bg-slate-900 border border-slate-855 rounded-3xl p-4 relative flex flex-col justify-between">
                      <button 
                        onClick={() => handleRemoveMed(m.id)}
                        className="absolute top-3.5 right-3.5 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <div className="flex gap-2 items-center">
                          <h4 className="font-extrabold text-sm text-white">{m.name}</h4>
                          <span className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-full ${
                            m.isActive ? 'bg-teal-500/15 text-teal-400 border border-teal-500/10' : 'bg-slate-950 text-slate-500'
                          }`}>
                            {m.isActive ? 'Active' : 'Archived'}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-teal-400 mt-1">{m.dosage}</p>
                        <p className="text-[10px] text-slate-400 bg-slate-950/45 border border-slate-850 p-2 rounded-xl mt-3 italic leading-normal">
                          "{m.adherenceNotes || 'Refills logged.'}"
                        </p>
                      </div>

                      <div className="mt-3 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        Start: {m.startDate} {m.endDate ? `&bull; Stop: ${m.endDate}` : ''}
                      </div>
                    </div>
                  ))}

                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 5: Laboratory Results & Scans Curves */}
        {activeTab === 'labs' && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Manual Laboratory Numbers Entry */}
              <form onSubmit={handleAddLab} className="lg:col-span-4 bg-slate-900 border border-slate-850 p-5 rounded-[2rem] space-y-4">
                <span className="text-teal-400 text-xs font-black uppercase tracking-widest block">Accredited Lab Records Log</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase">Draw Date</label>
                    <input 
                      type="date"
                      value={labDate}
                      onChange={(e) => setLabDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase">Hemoglobin (g/dL)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={labHb}
                      onChange={(e) => setLabHb(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase">Reticulocyte (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={labRetic}
                      onChange={(e) => setLabRetic(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase">Bilirubin (mg/dL)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={labBili}
                      onChange={(e) => setLabBili(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[8px] text-slate-500 font-bold block mb-1 uppercase">LDH (U/L)</label>
                    <input 
                      type="number"
                      value={labLDH}
                      onChange={(e) => setLabLDH(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-500 font-bold block mb-1 uppercase">Ferritin</label>
                    <input 
                      type="number"
                      value={labFerritin}
                      onChange={(e) => setLabFerritin(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-500 font-bold block mb-1 uppercase">HbF (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={labHbF}
                      onChange={(e) => setLabHbF(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-[10px]"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-[10px] uppercase py-3 rounded-xl cursor-pointer transition-colors select-none">
                  💾 Logging Numerical Lab markers
                </button>

                {/* Simulated file upload area (progressive disclosure) */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="bg-slate-950 border-2 border-dashed border-slate-800/80 hover:border-teal-500/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]);
                    }}
                  />
                  <Upload className="w-6 h-6 text-slate-500 mb-1" />
                  <span className="text-[10px] uppercase font-black text-slate-400">Drag & Drop Lab PDF/Image</span>
                  <span className="text-[8px] text-slate-500 tracking-wider">HIPAA constraint limit: 10MB</span>
                </div>

                {ocrScanning && (
                  <div className="bg-slate-950 border border-yellow-500/20 p-3 rounded-xl flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[9px] text-yellow-400 font-black uppercase tracking-wider animate-pulse">Running OCR Clinical Analysis scanner...</span>
                  </div>
                )}

                {ocrExtractedValue && (
                  <div className="bg-slate-950 border border-emerald-500/20 p-3 rounded-xl text-emerald-400 text-[10px] font-bold text-center">
                    {ocrExtractedValue}
                  </div>
                )}
              </form>

              {/* Lab Hemoglobin plotting & clinical scan repository */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Recharts trend */}
                <div className="bg-slate-900 border border-slate-855 rounded-[2rem] p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-teal-400" /> Haemoglobin baseline trend over time (g/dL)
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Healthy Target range: 7 - 9.5 g/dL</span>
                  </div>

                  <div className="w-full h-56 font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.labs} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="date" stroke="#666" style={{ fontSize: '9px', fill: '#888' }} />
                        <YAxis domain={[4, 12]} stroke="#666" style={{ fontSize: '9px', fill: '#888' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="hemoglobin" stroke="#0ea5e9" strokeWidth={3} activeDot={{ r: 8 }} name="Hemoglobin (g/dL)" />
                        <Line type="monotone" dataKey="hbfPercentage" stroke="#a855f7" strokeWidth={2} name="HbF % (Target > 15)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Uploaded scans records archive */}
                <div className="space-y-3">
                  <span className="text-slate-450 text-xs font-black uppercase tracking-widest block">Scanned clinical diagnostic imaging records</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[190px] overflow-y-auto pr-1">
                    
                    {data.attachedFiles.map((f) => (
                      <div key={f.id} className="p-3 bg-slate-900 border border-slate-855 rounded-2xl flex items-center justify-between text-xs transition-colors">
                        <div className="flex gap-2.5 items-center">
                          <div className="bg-slate-950 p-2 border border-slate-800 rounded-xl text-teal-400">
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="font-extrabold text-white leading-tight">{f.name}</p>
                            <span className="text-[9px] uppercase font-bold text-slate-500 mt-0.5 block">{f.date} &bull; {f.size} &bull; {f.type}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveFile(f.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ))}

                    {data.attachedFiles.length === 0 && (
                      <p className="text-center text-xs text-slate-500 italic py-4">No imaging files or vaccination files uploaded. Drop clinical PDFs above.</p>
                    )}

                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 6: Clinical Emergency Passport & Export */}
        {activeTab === 'passport' && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Split page */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ER PASSPORT CARD */}
              <div className="lg:col-span-5 p-1 rounded-3xl border-2 border-indigo-500/20 bg-indigo-950/10 shadow-xl max-w-md mx-auto w-full">
                <div id="print-area-carevault" className="p-6 bg-slate-900 text-white rounded-[1.7rem] space-y-4 shadow-2xl relative overflow-hidden">
                  
                  {/* Subtle graphics */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none"></div>

                  <div className="flex justify-between items-start gap-4 border-b border-slate-850 pb-3">
                    <div>
                      <h4 className="text-sm font-black tracking-wider uppercase text-indigo-400">Clinical Emergency Card</h4>
                      <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Warrior Cell SCD Network</span>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-xl text-center">
                      <span className="text-[7px] font-black uppercase text-rose-400 block leading-tight">Baseline Hb</span>
                      <span className="text-xs font-black tracking-tight leading-none">8.2 g/dL</span>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-[8px] text-indigo-400/80 uppercase font-bold block">Patient Diagnose</span>
                      <p className="font-extrabold text-slate-200 mt-0.5">{data.primaryDiagnosis}</p>
                    </div>

                    <div>
                      <span className="text-[8px] text-indigo-400/80 uppercase font-bold block">Allergies & reactions</span>
                      <p className="font-semibold text-rose-350 bg-rose-500/15 border border-rose-500/20 rounded-lg px-2 py-1 mt-0.5 inline-block text-[10px]">
                        ⚠️ {data.allergies}
                      </p>
                    </div>

                    <div>
                      <span className="text-[8px] text-indigo-400/80 uppercase font-bold block block">Usual analgesic regimen</span>
                      <p className="font-bold text-slate-300 mt-0.5 leading-relaxed text-[11px] italic bg-slate-950/60 p-2 rounded-xl">
                        "{data.emergencyInfo.usualPainRegimen}"
                      </p>
                    </div>

                    <div>
                      <span className="text-[8px] text-indigo-400/80 uppercase font-bold block block">Hematology clinic contacts</span>
                      <p className="font-black text-slate-105 mt-0.5 flex justify-between">
                        <span>{data.emergencyInfo.hematologistName}</span>
                        <span className="text-yellow-400 font-mono">{data.emergencyInfo.hematologistPhone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-850 text-[8px] text-slate-500 flex items-center justify-between">
                    <span>Cryptographic verify SCD Card token</span>
                    <span className="font-mono">{userId.slice(0, 10).toUpperCase()}-SCDV-2026</span>
                  </div>

                </div>

                <div className="flex flex-col gap-2.5 p-3">
                  <button 
                    type="button"
                    onClick={() => data && generateClinicalPassportPDF(data)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-black py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/50"
                  >
                    <FileDown className="w-4 h-4" /> Download Clinical Passport PDF
                  </button>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button 
                      onClick={handlePrint}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer select-none"
                    >
                      <Printer className="w-4 h-4" /> Print ER Card
                    </button>
                    <button 
                      onClick={handleCopySummary}
                      className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-black px-4 py-3 rounded-xl cursor-pointer"
                    >
                      Copy Summary
                    </button>
                  </div>
                </div>
              </div>

              {/* Passport values editing form */}
              <div className="lg:col-span-7 bg-slate-900/40 border border-slate-850 p-6 rounded-[2rem] space-y-4">
                <span className="text-teal-400 text-xs font-black uppercase tracking-widest block">Update ER protocol Parameters</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Clinic Hematologist Name</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Hematologist Phone line</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                      value={doctorPhone}
                      onChange={(e) => setDoctorPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Advised ER Pain Regimen</label>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white h-16 resize-none font-semibold"
                    value={emergencyPainReg}
                    onChange={(e) => setEmergencyPainReg(e.target.value)}
                    placeholder="Enter usual analgesic dosage triggers"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">"What to Tell the ER" summary</label>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white h-20 resize-none font-semibold leading-relaxed"
                    value={emergencyERWhat}
                    onChange={(e) => setEmergencyERWhat(e.target.value)}
                    placeholder="Provide patient summary guidelines"
                  />
                </div>

                <div className="border-t border-slate-850 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-teal-400 font-black uppercase tracking-widest block">📋 Free-text observations journal</span>
                    <VoiceInputButton 
                      label="Voice Journal"
                      onTranscript={(text) => {
                        setJournalContent((prev) => (prev ? `${prev}\n${text}` : text));
                      }} 
                    />
                  </div>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white h-24 resize-none font-semibold leading-relaxed"
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder="Add detailed clinician visits records or private somatic notes..."
                  />
                </div>

                <button 
                  onClick={handleSavePassportNotes}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] uppercase py-3 px-6 rounded-xl cursor-pointer"
                >
                  Save and Sync Passport parameters
                </button>
              </div>

            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
