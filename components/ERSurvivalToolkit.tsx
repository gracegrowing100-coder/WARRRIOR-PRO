import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  Plus, 
  Trash2, 
  Printer, 
  Sparkles, 
  ShieldAlert, 
  CheckSquare, 
  Square, 
  FileText, 
  HeartHandshake, 
  Phone, 
  Thermometer, 
  Droplets, 
  Pill, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface ChecklistItem {
  id: string;
  category: 'Comfort & Warmth' | 'Medical & Records' | 'Hygiene & Personal' | 'Electronics & Tech' | 'Hydration & Snacks';
  label: string;
  checked: boolean;
  isCustom?: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Comfort & Warmth
  { id: 'cw-1', category: 'Comfort & Warmth', label: 'Heavy Plush Blanket or Heated Travel Throw', checked: true },
  { id: 'cw-2', category: 'Comfort & Warmth', label: 'Thick Thermal Socks & Slippers', checked: true },
  { id: 'cw-3', category: 'Comfort & Warmth', label: 'Comfortable Hoodie / Zip Jacket (Easy IV access)', checked: true },
  { id: 'cw-4', category: 'Comfort & Warmth', label: 'Eye Mask & Earplugs (Hospital noise reduction)', checked: false },
  
  // Medical & Records
  { id: 'mr-1', category: 'Medical & Records', label: 'Printed Clinical Passport & Emergency VOC Protocol', checked: true },
  { id: 'mr-2', category: 'Medical & Records', label: 'Home Medications in Original Pill Bottles (Hydroxyurea, etc.)', checked: true },
  { id: 'mr-3', category: 'Medical & Records', label: 'Government ID, Insurance Cards & Hospital Medical Record #', checked: true },
  { id: 'mr-4', category: 'Medical & Records', label: 'Contact List for Hematologist On-Call & Emergency Contact', checked: true },
  
  // Hygiene & Personal
  { id: 'hp-1', category: 'Hygiene & Personal', label: 'Lip Balm & Moisturizer (Prevent hospital air dryness)', checked: true },
  { id: 'hp-2', category: 'Hygiene & Personal', label: 'Travel Toothbrush, Toothpaste & Unscented Wipes', checked: false },
  { id: 'hp-3', category: 'Hygiene & Personal', label: 'Heating Pad or Rechargeable Hand Warmers', checked: true },

  // Electronics & Tech
  { id: 'et-1', category: 'Electronics & Tech', label: 'Phone & 10ft Extra Long Braided Charging Cable', checked: true },
  { id: 'et-2', category: 'Electronics & Tech', label: 'Noise-Canceling Headphones or Earbuds', checked: true },
  { id: 'et-3', category: 'Electronics & Tech', label: 'Portable Power Bank (Charged)', checked: false },

  // Hydration & Snacks
  { id: 'hs-1', category: 'Hydration & Snacks', label: '32oz Insulated Water Bottle with Straw', checked: true },
  { id: 'hs-2', category: 'Hydration & Snacks', label: 'Electrolyte Powder Packets (Liquid I.V., Gatorade)', checked: true },
  { id: 'hs-3', category: 'Hydration & Snacks', label: 'Bland High-Protein Snacks (Crackers, Nuts, Bars)', checked: false }
];

export const ERSurvivalToolkit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'advocacy_card'>('checklist');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('warrior_er_checklist');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_CHECKLIST; }
    }
    return DEFAULT_CHECKLIST;
  });

  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ChecklistItem['category']>('Comfort & Warmth');

  // Patient Advocacy Card State
  const [patientName, setPatientName] = useState('Warrior Care Patient');
  const [genotype, setGenotype] = useState('HbSS (Sickle Cell Anemia)');
  const [baselineHb, setBaselineHb] = useState('7.5 g/dL');
  const [preferredOpioid, setPreferredOpioid] = useState('IV Hydromorphone 1-2mg q3h or IV Morphine 5mg q3h');
  const [avoidMeds, setAvoidMeds] = useState('Avoid High-Dose NSAIDs (Renal history), Avoid Meperidine/Demerol');
  const [hydrationProtocol, setHydrationProtocol] = useState('D5W or Normal Saline at 1.5x maintenance (150 mL/hr). Avoid fluid overload.');
  const [ivAccessNotes, setIvAccessNotes] = useState('Difficult vein access. Request Ultrasound-guided IV or Vein Finder immediately.');
  const [hematologistContact, setHematologistContact] = useState('Dr. A. Vance, MD (Comprehensive Sickle Cell Center) • Ph: (555) 019-2834');
  const [allergies, setAllergies] = useState('Codeine (causes severe itching/nausea)');
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('warrior_er_checklist', JSON.stringify(checklist));
  }, [checklist]);

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      category: newItemCategory,
      label: newItemText.trim(),
      checked: true,
      isCustom: true
    };
    setChecklist(prev => [...prev, newItem]);
    setNewItemText('');
  };

  const deleteItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const resetChecklist = () => {
    setChecklist(DEFAULT_CHECKLIST);
  };

  const handlePrintCard = () => {
    window.print();
  };

  const copyAdvocacyCardText = () => {
    const cardText = `
PATIENT ADVOCACY & PAIN MANAGEMENT PREFERENCES CARD
---------------------------------------------------
PATIENT: ${patientName} (${genotype})
BASELINE HEMOGLOBIN: ${baselineHb}
ALLERGIES: ${allergies}

PREFERRED ANALGESIC REGIMEN (VOC PAIN CRISIS):
${preferredOpioid}

MEDICATIONS TO AVOID:
${avoidMeds}

IV HYDRATION PROTOCOL:
${hydrationProtocol}

VASCULAR ACCESS INSTRUCTIONS:
${ivAccessNotes}

PRIMARY HEMATOLOGIST ON-CALL:
${hematologistContact}

TRIAGE NOTE: Sickle Cell Disease vaso-occlusive crisis is a medical emergency requiring rapid parenteral analgesia within 30 minutes of triage per NHLBI Guidelines.
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(cardText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const categories: ChecklistItem['category'][] = [
    'Comfort & Warmth',
    'Medical & Records',
    'Hygiene & Personal',
    'Electronics & Tech',
    'Hydration & Snacks'
  ];

  const totalChecked = checklist.filter(i => i.checked).length;
  const progressPercent = Math.round((totalChecked / checklist.length) * 100) || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-6 text-white shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 text-red-400">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-white">ER Survival Toolkit & Advocacy Card</h3>
              <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-red-500/20">
                Hospital Readiness
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Customizable packing checklist for ER stays & printable patient advocacy preferences.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'checklist' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hospital Packing List
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advocacy_card')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'advocacy_card' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Advocacy Card
          </button>
        </div>
      </div>

      {/* TAB 1: HOSPITAL PACKING CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-300">Hospital Bag Readiness</span>
              <span className="text-red-400 font-black">{totalChecked} of {checklist.length} items packed ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 to-rose-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Add Custom Item Form */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add custom item (e.g. Favorite aromatherapy oil, Portable fan)..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addItem}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus size={14} /> Add Item
            </button>
            <button
              type="button"
              onClick={resetChecklist}
              className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold border border-slate-800 transition-all cursor-pointer"
              title="Reset to default ER bag checklist"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Category Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => {
              const catItems = checklist.filter(i => i.category === cat);
              return (
                <div key={cat} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center justify-between border-b border-slate-850 pb-2">
                    <span>{cat}</span>
                    <span className="text-[10px] text-slate-500">({catItems.filter(i => i.checked).length}/{catItems.length})</span>
                  </h4>

                  <div className="space-y-2">
                    {catItems.map(item => (
                      <div 
                        key={item.id} 
                        className={`flex items-start justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                          item.checked 
                            ? 'bg-slate-900/90 border-slate-800/80 text-slate-300' 
                            : 'bg-slate-900/40 border-slate-850 text-slate-400 opacity-70'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCheck(item.id)}
                          className="flex items-start gap-2.5 text-left flex-1 cursor-pointer"
                        >
                          {item.checked ? (
                            <CheckSquare className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                          )}
                          <span className={`text-xs font-semibold leading-relaxed ${item.checked ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                            {item.label}
                          </span>
                        </button>

                        {item.isCustom && (
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="text-slate-600 hover:text-red-400 p-1 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT ADVOCACY CARD */}
      {activeTab === 'advocacy_card' && (
        <div className="space-y-6">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-300">
              <span className="font-extrabold text-white block">Customized Pain Management Preferences</span>
              This printable card clearly communicates your baseline hemoglobin, preferred opioid dosages, and contraindicated medications to emergency staff upon triage.
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={copyAdvocacyCardText}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>

              <button
                type="button"
                onClick={handlePrintCard}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/50"
              >
                <Printer size={14} /> Print Card
              </button>
            </div>
          </div>

          {/* Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Patient Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Genotype & Diagnosis</label>
              <input
                type="text"
                value={genotype}
                onChange={(e) => setGenotype(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Preferred Analgesic VOC Protocol</label>
              <input
                type="text"
                value={preferredOpioid}
                onChange={(e) => setPreferredOpioid(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Medications to Avoid</label>
              <input
                type="text"
                value={avoidMeds}
                onChange={(e) => setAvoidMeds(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">IV Hydration Guidelines</label>
              <input
                type="text"
                value={hydrationProtocol}
                onChange={(e) => setHydrationProtocol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vascular Access Strategy</label>
              <input
                type="text"
                value={ivAccessNotes}
                onChange={(e) => setIvAccessNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hematologist Emergency Contact</label>
              <input
                type="text"
                value={hematologistContact}
                onChange={(e) => setHematologistContact(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Printable Preview Card */}
          <div id="printable-advocacy-card" className="bg-white text-slate-900 p-6 rounded-2xl border-2 border-red-600 space-y-4 shadow-2xl">
            <div className="bg-red-700 text-white p-3 rounded-xl flex justify-between items-center">
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider">SICKLE CELL DISEASE PATIENT ADVOCACY CARD</h4>
                <p className="text-[10px] text-red-100 font-bold uppercase">National Heart, Lung, and Blood Institute (NHLBI) VOC Triage Protocol</p>
              </div>
              <ShieldAlert className="w-8 h-8 text-yellow-300 shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold border-b pb-3 border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-black block">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm">{patientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-black block">Genotype / Baseline Hb</span>
                <span className="font-bold text-slate-900">{genotype} • Baseline: {baselineHb}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
                <span className="text-[10px] font-black text-red-800 uppercase block">🚨 Preferred Parenteral VOC Analgesia</span>
                <span className="font-bold text-slate-900">{preferredOpioid}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">Avoid / Contraindicated</span>
                  <span className="font-bold text-slate-800">{avoidMeds}</span>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">IV Access Request</span>
                  <span className="font-bold text-slate-800">{ivAccessNotes}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] font-black text-slate-500 uppercase block">Hydration & Oxygen Target</span>
                <span className="font-bold text-slate-800">{hydrationProtocol} • O2 only if SpO2 &lt; 92%</span>
              </div>

              <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-indigo-900 uppercase block">Primary Hematologist</span>
                  <span className="font-bold text-indigo-950">{hematologistContact}</span>
                </div>
                <Phone className="w-4 h-4 text-indigo-700" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
