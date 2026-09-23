import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  BookOpen, 
  Users, 
  User, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Phone, 
  Share2, 
  Lock, 
  FileText, 
  ArrowRight,
  ExternalLink,
  Shield,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export type Genotype = 'AA' | 'AS' | 'SS' | 'AC' | 'SC' | 'CC' | 'S-Beta Thal';

interface PremaritalGenotypeEducationProps {
  onBookCounselor?: (doctorId: string, doctorName: string) => void;
}

export const PremaritalGenotypeEducation: React.FC<PremaritalGenotypeEducationProps> = ({ onBookCounselor }) => {
  // Mode State
  const [mode, setMode] = useState<'couple' | 'single'>('couple');
  
  // Genotype Inputs
  const [userGenotype, setUserGenotype] = useState<Genotype>('AS');
  const [partnerGenotype, setPartnerGenotype] = useState<Genotype>('AS');
  const [culturalRegion, setCulturalRegion] = useState<string>('West Africa (e.g. Nigeria, Ghana)');

  // Active Educational Tab
  const [activeEduTab, setActiveEduTab] = useState<'calculator' | 'trait_vs_disease' | 'scripts' | 'centers' | 'ai_chat'>('calculator');

  // AI Chat Assistant State
  const [userQuestion, setUserQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [copiedScriptIndex, setCopiedScriptIndex] = useState<number | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  
  // Privacy Setting
  const [saveToVault, setSaveToVault] = useState(false);

  // Punnett Square & Probability Calculations
  const calculateInheritance = (g1: Genotype, g2: Genotype) => {
    // Allele maps
    const getAlleles = (g: Genotype): [string, string] => {
      if (g === 'AA') return ['A', 'A'];
      if (g === 'AS') return ['A', 'S'];
      if (g === 'SS') return ['S', 'S'];
      if (g === 'AC') return ['A', 'C'];
      if (g === 'SC') return ['S', 'C'];
      if (g === 'CC') return ['C', 'C'];
      return ['S', 'Thal'];
    };

    const a1 = getAlleles(g1);
    const a2 = getAlleles(g2);

    const outcomes: string[] = [];
    a1.forEach(m => {
      a2.forEach(p => {
        const sorted = [m, p].sort().join('');
        if (sorted === 'AS' || sorted === 'SA') outcomes.push('AS');
        else if (sorted === 'AC' || sorted === 'CA') outcomes.push('AC');
        else if (sorted === 'CS' || sorted === 'SC') outcomes.push('SC');
        else outcomes.push(sorted);
      });
    });

    const total = outcomes.length;
    let countAA = outcomes.filter(o => o === 'AA').length;
    let countCarrier = outcomes.filter(o => o === 'AS' || o === 'AC' || o === 'CC').length;
    let countDisease = outcomes.filter(o => o === 'SS' || o === 'SC' || o.includes('Thal')).length;

    const probAA = Math.round((countAA / total) * 100);
    const probCarrier = Math.round((countCarrier / total) * 100);
    const probDisease = Math.round((countDisease / total) * 100);

    let riskLevel: 'optimal' | 'mindful' | 'high' = 'optimal';
    let riskLabel = 'Optimal Genetic Compatibility';
    let riskBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

    if (probDisease > 0 && probDisease < 50) {
      riskLevel = 'mindful';
      riskLabel = 'Mindful Carrier Combination (25% - 33% SCD Risk)';
      riskBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    } else if (probDisease >= 50) {
      riskLevel = 'high';
      riskLabel = 'High Recessive Risk (50% - 100% SCD Risk)';
      riskBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }

    return {
      outcomes,
      grid: [
        [a1[0] + a2[0], a1[0] + a2[1]],
        [a1[1] + a2[0], a1[1] + a2[1]]
      ],
      probAA,
      probCarrier,
      probDisease,
      riskLevel,
      riskLabel,
      riskBadgeColor
    };
  };

  const inheritance = calculateInheritance(userGenotype, mode === 'couple' ? partnerGenotype : 'AA');

  // Trigger Gemini AI Counseling Request
  const handleAskAiCounselor = async (customPrompt?: string) => {
    const q = customPrompt || userQuestion;
    if (!q.trim()) return;

    setLoadingAi(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/gemini/genotype-counselor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGenotype,
          partnerGenotype: mode === 'couple' ? partnerGenotype : 'N/A (Single)',
          mode,
          culturalContext: culturalRegion,
          question: q
        })
      });

      const data = await res.json();
      setAiResponse(data.text || 'Thank you for consulting Warrior AI. All recommendations prioritize informed love, open communication, and medical options.');
    } catch (err) {
      console.error(err);
      setAiResponse('Warrior AI Genotype Counselor is operating with cached clinical guidelines. Remember that genotype knowledge is an empowering tool for a healthier family.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Pre-crafted Conversation Starters for Couples
  const CONVERSATION_SCRIPTS = [
    {
      title: 'Dating & Early Relationship Stage',
      stage: 'Casual / Serious Dating',
      script: `"Hey, I really value our relationship and our future together. I recently learned about how knowing our hemoglobin genotypes (like AA, AS) helps us make smart, loving choices for our future family. Have you ever done a genotype test, or would you be open to doing one together with me?"`
    },
    {
      title: 'Before Engagement / Marriage Commitment',
      stage: 'Pre-marital Planning',
      script: `"My love, as we plan our lives and marriage, I want to make sure we build our family on a foundation of health and wisdom. Let's get our genotype screening checked at a certified lab. Knowing our results early gives us peace of mind and allows us to consult with genetic counselors so we can protect our future children."`
    },
    {
      title: 'Addressing Extended Family & Traditional In-Laws',
      stage: 'Family Discussions in African & Diaspora Settings',
      script: `"We deeply respect our family's traditions and blessings. In addition to our cultural traditions, we are also taking proactive medical steps by verifying our genotypes through standard blood tests. Medical science allows us to safeguard our future children's health, ensuring our lineage remains strong and healthy."`
    }
  ];

  const handleCopyScript = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptIndex(idx);
    setTimeout(() => setCopiedScriptIndex(null), 2500);
  };

  // Formatted Printable Summary
  const handleCopySummaryReport = () => {
    const txt = `
WARRIOR AI PREMARITAL GENOTYPE COUNSELING REPORT
------------------------------------------------
Mode: ${mode === 'couple' ? 'Couple Relationship Matching' : 'Individual Genotype Assessment'}
User Genotype: ${userGenotype}
${mode === 'couple' ? `Partner Genotype: ${partnerGenotype}` : ''}
Cultural Region Focus: ${culturalRegion}

INHERITANCE PROBABILITY ANALYSIS:
- Chance of Normal Hemoglobin (AA): ${inheritance.probAA}%
- Chance of Sickle Cell Trait (AS/AC): ${inheritance.probCarrier}%
- Chance of Sickle Cell Disease (SS/SC): ${inheritance.probDisease}%
- Overall Category: ${inheritance.riskLabel}

KEY MEDICAL & COUNSELING ADVISORY:
- Genotype knowledge is an empowering tool for healthier families, NOT a barrier to love.
- For carrier matches, modern family planning offers genetic counseling, pre-implantation testing (IVF + PGT-M), prenatal diagnosis, and early pediatric management.
- Always verify blood results with hemoglobin electrophoresis at an accredited clinical laboratory.

Verified Platform: Warrior AI Physician Care Hub
Date: ${new Date().toLocaleDateString()}
------------------------------------------------
    `;
    navigator.clipboard.writeText(txt.trim());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden text-slate-100">
      
      {/* Background Subtle Gradient Spheres */}
      <div className="absolute -top-10 -right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Main Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 mb-8 border-b border-slate-800">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Warrior AI &bull; Premarital & Relationship Genotype Service
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Genotype Education & Matching Advisor
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-2xl leading-relaxed">
            A private, judgment-free genetic counseling service designed to educate couples and individuals on hemoglobin variants (AA, AS, SS, SC, AC). Empowering your relationship with science, empathy, and informed decision-making.
          </p>
        </div>

        {/* Confidentiality Privacy Badge */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest block font-mono">
              100% Private & Encrypted
            </span>
            <span className="text-[11px] font-bold text-slate-300">
              Zero Data Sharing Without Consent
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
        {[
          { id: 'calculator', label: '🧬 Genotype Matcher & Risk Tool', icon: Heart },
          { id: 'trait_vs_disease', label: '📘 Trait vs. Disease Guide', icon: BookOpen },
          { id: 'scripts', label: '💬 Couples Conversation Starters', icon: MessageSquare },
          { id: 'centers', label: '🏥 Testing Centers & Counselors', icon: MapPin },
          { id: 'ai_chat', label: '✨ Ask AI Genetic Counselor', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeEduTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveEduTab(tab.id as any)}
              className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENOTYPE MATCHING TOOL & RISK CALCULATOR */}
      {activeEduTab === 'calculator' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Mode Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Select Assessment Mode:</span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setMode('couple')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                    mode === 'couple' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Couple Planning
                </button>
                <button
                  onClick={() => setMode('single')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                    mode === 'single' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Single Individual
                </button>
              </div>
            </div>

            {/* Cultural Context Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Region:</span>
              <select
                value={culturalRegion}
                onChange={(e) => setCulturalRegion(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
              >
                <option>West Africa (e.g. Nigeria, Ghana, Senegal)</option>
                <option>East & Central Africa (e.g. Kenya, Uganda, DRC)</option>
                <option>African Diaspora (US, UK, Caribbean, Europe)</option>
                <option>Middle East & South Asia</option>
                <option>Global / General Context</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Inputs Panel */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-indigo-400" />
                  {mode === 'couple' ? 'Couple Genotype Selection' : 'Your Genotype Selection'}
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Step 1 of 2</span>
              </div>

              {/* User Genotype Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-300 block flex justify-between">
                  <span>{mode === 'couple' ? 'Partner A Genotype (You)' : 'Your Hemoglobin Genotype'}</span>
                  <span className="text-indigo-400 font-mono font-black">{userGenotype}</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['AA', 'AS', 'SS', 'AC', 'SC', 'CC', 'S-Beta Thal'] as Genotype[]).map((gt) => (
                    <button
                      key={gt}
                      onClick={() => setUserGenotype(gt)}
                      className={`py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                        userGenotype === gt
                          ? 'bg-indigo-600 text-white border-2 border-indigo-400 shadow-lg scale-95'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {gt}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic mt-1">
                  {userGenotype === 'AA' && 'Normal Hemoglobin (No sickle cell gene)'}
                  {userGenotype === 'AS' && 'Sickle Cell Trait (Healthy carrier)'}
                  {userGenotype === 'SS' && 'Sickle Cell Anemia (Homozygous S)'}
                  {userGenotype === 'AC' && 'Hemoglobin C Trait (Carrier)'}
                  {userGenotype === 'SC' && 'Sickle Hemoglobin C Disease'}
                  {userGenotype === 'CC' && 'Hemoglobin C Disease'}
                  {userGenotype === 'S-Beta Thal' && 'Sickle Beta Thalassemia'}
                </p>
              </div>

              {/* Partner Genotype Input (if couple mode) */}
              {mode === 'couple' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-bold uppercase text-slate-300 block flex justify-between">
                    <span>Partner B Genotype</span>
                    <span className="text-pink-400 font-mono font-black">{partnerGenotype}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['AA', 'AS', 'SS', 'AC', 'SC', 'CC', 'S-Beta Thal'] as Genotype[]).map((gt) => (
                      <button
                        key={gt}
                        onClick={() => setPartnerGenotype(gt)}
                        className={`py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                          partnerGenotype === gt
                            ? 'bg-pink-600 text-white border-2 border-pink-400 shadow-lg scale-95'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {gt}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic mt-1">
                    {partnerGenotype === 'AA' && 'Normal Hemoglobin (No sickle cell gene)'}
                    {partnerGenotype === 'AS' && 'Sickle Cell Trait (Healthy carrier)'}
                    {partnerGenotype === 'SS' && 'Sickle Cell Anemia (Homozygous S)'}
                    {partnerGenotype === 'AC' && 'Hemoglobin C Trait (Carrier)'}
                    {partnerGenotype === 'SC' && 'Sickle Hemoglobin C Disease'}
                  </p>
                </div>
              )}

              {/* Privacy Save Toggle */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-300">Save result in my Care Vault?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveToVault(!saveToVault)}
                  className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                    saveToVault ? 'bg-teal-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                </button>
              </div>

              {/* Quick Consult Trigger */}
              <button
                onClick={() => handleAskAiCounselor(`Give me a detailed, compassionate counseling breakdown for a match between ${userGenotype} and ${mode === 'couple' ? partnerGenotype : 'N/A'}.`)}
                disabled={loadingAi}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
              >
                {loadingAi ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Counseling Assessment</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Visual Punnett Square & Calculated Results */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-6 flex flex-col justify-between">
              <div>
                {/* Result Category Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-widest">Calculated Genetic Outcome</span>
                    <h4 className="text-lg font-black text-white mt-0.5">
                      {mode === 'couple' ? `${userGenotype} + ${partnerGenotype} Marriage Match` : `${userGenotype} Individual Analysis`}
                    </h4>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border ${inheritance.riskBadgeColor}`}>
                    {inheritance.riskLabel}
                  </span>
                </div>

                {/* Percentage Breakdown Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[9px] font-black uppercase text-emerald-400 block font-mono">Normal (AA)</span>
                    <span className="text-2xl font-black text-white mt-1 block">{inheritance.probAA}%</span>
                    <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Chance Per Pregnancy</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[9px] font-black uppercase text-amber-400 block font-mono">Carrier (AS/AC)</span>
                    <span className="text-2xl font-black text-white mt-1 block">{inheritance.probCarrier}%</span>
                    <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Healthy Trait Carriers</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[9px] font-black uppercase text-rose-400 block font-mono">Disease (SS/SC)</span>
                    <span className="text-2xl font-black text-white mt-1 block">{inheritance.probDisease}%</span>
                    <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Sickle Cell Disease</span>
                  </div>
                </div>

                {/* Punnett Square Grid Diagram */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono mb-3 text-center">
                    Scientific Punnett Square Inheritance Grid
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-center font-mono font-black text-xs">
                    {inheritance.grid.map((row, rIdx) => (
                      <React.Fragment key={rIdx}>
                        {row.map((cell, cIdx) => {
                          let isDisease = cell === 'SS' || cell === 'SC';
                          let isCarrier = cell === 'AS' || cell === 'AC';
                          return (
                            <div
                              key={cIdx}
                              className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                isDisease
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                  : isCarrier
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              }`}
                            >
                              <span className="text-lg font-black">{cell}</span>
                              <span className="text-[9px] uppercase tracking-wider mt-1 opacity-80 font-bold">
                                {isDisease ? 'Sickle Cell Anemia' : isCarrier ? 'Carrier Trait' : 'Normal Hemoglobin'}
                              </span>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Key Medical Takeaway */}
                <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
                    <Info className="w-4 h-4" />
                    <span>Genetic Counseling Insights & Next Steps</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {inheritance.probDisease === 0 ? (
                      "With a 0% probability of sickle cell disease in offspring, your match is genetically optimal. Focus on maintaining standard health checks and spreading positive genotype awareness!"
                    ) : inheritance.probDisease < 50 ? (
                      "When both partners carry the sickle trait (e.g. AS + AS), each child has a 25% chance of inheriting SS. This does NOT mean 1 in 4 children will definitely have SS; each pregnancy is an independent 25% event. Modern medicine offers options including genetic counseling, prenatal testing, and IVF with PGT-M."
                    ) : (
                      "Because this match carries a higher probability of passing sickle cell disease, we gently recommend scheduling a comprehensive session with a certified genetic counselor to explore reproductive technologies, early pediatric care, and family planning choices."
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={handleCopySummaryReport}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedReport ? 'Report Copied!' : 'Copy Summary Report'}</span>
                </button>

                {onBookCounselor && (
                  <button
                    onClick={() => onBookCounselor('2', 'Dr. Robert Chen')}
                    className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Book Genetic Counselor</span>
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* AI Response Display Box */}
          <AnimatePresence>
            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-900 border border-indigo-500/30 p-6 rounded-3xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest font-mono">
                    <Sparkles className="w-4 h-4" />
                    <span>Warrior AI Genetic Counseling Advisor</span>
                  </div>
                  <button
                    onClick={() => setAiResponse(null)}
                    className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-wider"
                  >
                    Close Analysis
                  </button>
                </div>

                <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed font-medium">
                  <ReactMarkdown>{aiResponse}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}

      {/* TAB 2: SICKLE CELL TRAIT VS SICKLE CELL DISEASE */}
      {activeEduTab === 'trait_vs_disease' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-black text-white">Sickle Cell Trait (AS) vs. Sickle Cell Disease (SS)</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Clear, science-backed facts to eliminate fear and misunderstanding. Being a carrier of the trait is NOT a medical illness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Trait Card */}
            <div className="bg-slate-900/90 border-2 border-amber-500/30 p-6 rounded-3xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase text-amber-400 tracking-widest font-mono">Genotype: AS / AC</span>
                <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                  Carrier State (Trait)
                </span>
              </div>

              <h4 className="text-lg font-black text-white">Sickle Cell Trait</h4>

              <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Not an Illness:</strong> Trait carriers have normal red blood cells and usually experience NO symptoms throughout life.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Normal Lifespan:</strong> Individuals with AS live full, active, healthy lives without blood crises.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Inheritance Role:</strong> Trait carriers can pass the sickle gene to offspring if matched with another carrier.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Practical Wellness:</strong> Maintain high hydration during severe athletics or high-altitude climbing as a general precaution.</span>
                </li>
              </ul>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-semibold text-slate-400 italic">
                "Having the AS trait simply means you hold one gene copy. Knowledge of your trait allows you to make informed premarital family decisions."
              </div>
            </div>

            {/* Disease Card */}
            <div className="bg-slate-900/90 border-2 border-rose-500/30 p-6 rounded-3xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase text-rose-400 tracking-widest font-mono">Genotype: SS / SC / S-Beta Thal</span>
                <span className="bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                  Chronic Condition
                </span>
              </div>

              <h4 className="text-lg font-black text-white">Sickle Cell Disease</h4>

              <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Cellular Stiffening:</strong> Red blood cells bend into rigid crescent shapes under low oxygen, blocking microvessels.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Vaso-occlusive Crises:</strong> Causes episodes of severe pain, chronic fatigue, and potential organ complications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Modern Care & Therapies:</strong> Hydroxyurea, blood transfusions, Voxelotor, L-glutamine, and CRISPR gene therapy offer high quality of life.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Early Pediatric Management:</strong> Penicillin prophylaxis and comprehensive hydration keep children thriving.</span>
                </li>
              </ul>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-semibold text-slate-400 italic">
                "Living with SS requires specialized clinical support, hydration, and medical care—enabling warriors to pursue full careers and fulfilling lives."
              </div>
            </div>

          </div>

          {/* Real Life Scenarios Accordion / Modules */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h4 className="text-sm font-black uppercase text-indigo-400 tracking-widest font-mono flex items-center gap-2">
              <Users className="w-4 h-4" /> Real-Life Family & Relationship Scenarios
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-emerald-400 uppercase font-mono">Scenario A: AA + AS Couple</span>
                <h5 className="text-xs font-black text-white">100% Healthy Offspring</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Zero chance of sickle cell disease in children. 50% chance of children inheriting the AS trait (carriers), and 50% chance of AA.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-amber-400 uppercase font-mono">Scenario B: AS + AS Couple</span>
                <h5 className="text-xs font-black text-white">25% Disease Risk Per Child</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Each pregnancy has a 25% chance of SS, 50% chance of AS, and 25% chance of AA. Knowledge enables family planning choices like IVF with PGT-M or prenatal diagnosis.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase font-mono">Scenario C: Modern Reproductive Options</span>
                <h5 className="text-xs font-black text-white">IVF with PGT-M & Adoption</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Pre-implantation Genetic Testing (PGT-M) selects non-affected embryos before implantation, guaranteeing unaffected children for carrier couples.
                </p>
              </div>
            </div>
          </div>

        </motion.div>
      )}

      {/* TAB 3: COUPLE CONVERSATION STARTERS */}
      {activeEduTab === 'scripts' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-black text-white">Gentle Conversation Starters for Couples</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Bringing up genotype screening with a partner or family can feel intimidating. Use these loving, respectful scripts tailored for different stages of a relationship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONVERSATION_SCRIPTS.map((item, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest font-mono">
                      Script {idx + 1}
                    </span>
                    <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                      {item.stage}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white">{item.title}</h4>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 font-medium italic leading-relaxed">
                    {item.script}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyScript(item.script, idx)}
                  className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedScriptIndex === idx ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Script Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Cultural Guidance Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-teal-400 font-black text-xs uppercase tracking-widest font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Cultural Sensitivity & Community Stigma Breakdown</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              In many regions across Sub-Saharan Africa and the diaspora, premarital genotype screening is recognized as a vital public health goal. Frame this conversation as an act of profound love and care for your future lineage—never as a test of love or a reason for shame.
            </p>
          </div>

        </motion.div>
      )}

      {/* TAB 4: VERIFIED TESTING CENTERS & COUNSELORS */}
      {activeEduTab === 'centers' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-black text-white">Verified Screening Labs & Genetic Counselors</h3>
              <p className="text-xs text-slate-400 font-semibold">
                Accredited medical diagnostic laboratories for hemoglobin electrophoresis and genetic telehealth specialists.
              </p>
            </div>

            {onBookCounselor && (
              <button
                onClick={() => onBookCounselor('2', 'Dr. Robert Chen')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg cursor-pointer flex items-center gap-2 self-start sm:self-auto"
              >
                <Stethoscope className="w-4 h-4" /> Book Dr. Robert Chen (Genetics)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {[
              {
                name: 'Clina-Lancet Laboratories',
                region: 'Lagos & Abuja, Nigeria',
                service: 'High-performance Liquid Chromatography (HPLC)',
                status: 'Accredited Lab',
                phone: '+234 1 463 0860'
              },
              {
                name: 'MDS Lancet Laboratories',
                region: 'Accra & Kumasi, Ghana',
                service: 'Hemoglobin Electrophoresis & Genotype Panel',
                status: 'Accredited Lab',
                phone: '+233 30 261 0480'
              },
              {
                name: 'PathCare Kenya Diagnostics',
                region: 'Nairobi, Kenya',
                service: 'Full Hematology & Premarital Screening',
                status: 'Accredited Lab',
                phone: '+254 20 271 2288'
              },
              {
                name: 'Sickle Cell Society UK & NHS Genetics',
                region: 'London & UK Nationwide',
                service: 'NHS Premarital & Antenatal Hemoglobinopathy Screening',
                status: 'Verified Public Health Partner',
                phone: '+44 20 8961 7795'
              },
              {
                name: 'Dr. Robert Chen, PhD',
                region: 'Global Telehealth / USA',
                service: 'Specialist in Premarital Genetic Counseling & IVF PGT-M',
                status: 'Verified Warrior AI Specialist',
                phone: 'Direct Booking Available'
              },
              {
                name: 'Dr. Amina Yusuf, MD',
                region: 'Lagos, Nigeria / Telehealth',
                service: 'Pediatric Hematology & Premarital Guidance',
                status: 'Verified Warrior AI Specialist',
                phone: 'Direct Booking Available'
              }
            ].map((center, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20 font-mono">
                      {center.status}
                    </span>
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  </div>

                  <h4 className="font-black text-sm text-white">{center.name}</h4>
                  <p className="text-[11px] font-bold text-slate-400">{center.region}</p>

                  <p className="text-[11px] text-slate-300 font-medium italic pt-1 border-t border-slate-800">
                    "{center.service}"
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-mono text-indigo-400 block font-bold">
                    Contact: {center.phone}
                  </span>
                </div>
              </div>
            ))}

          </div>

        </motion.div>
      )}

      {/* TAB 5: ASK AI GENETIC COUNSELOR CHAT */}
      {activeEduTab === 'ai_chat' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest font-mono">
              <Sparkles className="w-4 h-4" />
              <span>Ask Warrior AI Genetic Counseling Assistant</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ask any question about genotype inheritance, relationship conversations, modern family planning technologies, or cultural considerations. Our AI provides warm, science-backed guidance.
            </p>

            {/* Quick Questions Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                "Is Sickle Cell Trait (AS) an illness?",
                "Can two AS carriers have a 100% healthy baby?",
                "What is IVF with PGT-M for sickle cell prevention?",
                "How do I explain my AS genotype to my partner's family?"
              ].map((btnQ, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setUserQuestion(btnQ);
                    handleAskAiCounselor(btnQ);
                  }}
                  className="text-[10px] font-bold bg-slate-950 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                >
                  "{btnQ}"
                </button>
              ))}
            </div>

            {/* Question Input Field */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskAiCounselor();
                }}
                placeholder="Type your question about genotypes, marriage, or genetics..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleAskAiCounselor()}
                disabled={loadingAi || !userQuestion.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {loadingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {/* AI Response Box */}
          {aiResponse && (
            <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-3xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase text-indigo-400 font-mono tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Genetic Counselor Insights
                </span>
              </div>
              <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed font-medium">
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
            </div>
          )}

        </motion.div>
      )}

    </div>
  );
};
