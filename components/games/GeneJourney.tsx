import React, { useState } from 'react';
import { 
  Dna, HelpCircle, ArrowRight, RotateCcw, PenTool, Check, 
  Heart, Plus, Palette, Download, Sparkles, AlertCircle, Info, BookOpen 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../../services/firebaseService';
import { auth } from '../../firebase-init';

// SOUND ENGINES
const playGeneSound = (freqs: number[], duration = 0.08, type: OscillatorType = 'sine') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    freqs.forEach((freq, idx) => {
      osc.frequency.setValueAtTime(freq, now + (idx * duration));
    });
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (freqs.length * duration));
    osc.start();
    osc.stop(now + (freqs.length * duration));
  } catch (e) {}
};

const soundClickBase = () => playGeneSound([349.23], 0.04, 'sine');
const soundRepairMatch = () => playGeneSound([523, 659, 783], 0.07, 'triangle');
const soundMutationHurt = () => playGeneSound([261.63, 196.00], 0.1, 'sawtooth');
const soundPosterDone = () => playGeneSound([440, 554, 659, 880], 0.07, 'triangle');

interface GeneJourneyProps {
  language: string;
  textScale: 'normal' | 'large' | 'xl';
  colorBlindMode: string;
  onXPUnlocked: (xp: number) => void;
  isDailyChallenge?: boolean;
}

const GeneJourney: React.FC<GeneJourneyProps> = ({ 
  language, 
  textScale, 
  colorBlindMode, 
  onXPUnlocked,
  isDailyChallenge = false
}) => {
  const [activeStep, setActiveStep] = useState<'intro' | 'repair' | 'inheritance' | 'poster' | 'summary'>('intro');
  
  // Phase 1: DNA Base Repair States
  const normalHbbCodon = ['C', 'C', 'T', 'G', 'A', 'G', 'G', 'A', 'G']; // Normal codon (GAG for Glutamic acid)
  const sickleHbbCodon = ['C', 'C', 'T', 'G', 'T', 'G', 'G', 'A', 'G']; // Mutation codon (GTG for Valine)
  const [dnaPhase, setDnaPhase] = useState<'build-normal' | 'discover-mutation' | 'crispr-therapy'>('build-normal');
  const [builtNormal, setBuiltNormal] = useState<string[]>([]);
  const [builtSickle, setBuiltSickle] = useState<string[]>([]);
  const [isMutationDiscovered, setIsMutationDiscovered] = useState<boolean>(false);
  
  // Phase 2: Inheritance Punnett State
  const [momGene, setMomGene] = useState<'A' | 'S'>('A');
  const [dadGene, setDadGene] = useState<'A' | 'S'>('S');
  const [punnettMatrix, setPunnettMatrix] = useState<string[][]>([
    ['', ''],
    ['', '']
  ]);
  const [punnettSolved, setPunnettSolved] = useState<boolean>(false);

  // Phase 3: Poster Design States
  const [selectedSlogan, setSelectedSlogan] = useState<string>("");
  const [selectedBackground, setSelectedBackground] = useState<string>("slate");
  const [selectedSticker, setSelectedSticker] = useState<string>("");
  const [campaignUnlocked, setCampaignUnlocked] = useState<boolean>(false);

  const textScaleClasses = {
    normal: 'text-sm',
    large: 'text-base md:text-lg',
    xl: 'text-lg md:text-xl'
  };

  const slogans = [
    "SICKLE CELL IS STRENGTH: EMPOWER WARRIORS! 🛡️",
    "BORN A SOLDIER: CONQUERING SICKLE CELLS DAILY! 🩸",
    "IT'S MATHEMATICALLY GENES - NOT CONTAGIOUS! 🧬",
    "HYDRATE, ELEVATE, EDUCATE FOR LIFETIME CRISIS PREVENTION! 💧",
  ];

  const backgrounds = [
    { id: 'slate', name: 'Ambient Slate', font: 'text-white', class: 'bg-gradient-to-tr from-slate-900 to-indigo-950 font-sans' },
    { id: 'warm', name: 'Golden Sunset', font: 'text-white', class: 'bg-gradient-to-tr from-amber-600 to-red-650 font-serif' },
    { id: 'neon', name: 'Bio Neon Green', font: 'text-sh-900', class: 'bg-gradient-to-tr from-teal-50 to-emerald-100/50 font-mono text-emerald-950' }
  ];

  const stickers = [
    { id: 'dna', icon: '🧬', name: 'Double Helix' },
    { id: 'shield', icon: '🛡️', name: 'Fighter Shield' },
    { id: 'biconcave', icon: '🔴', name: 'Healthy Cell' },
    { id: 'hands', icon: '🤝', name: 'Village Unity' }
  ];

  const getLanguageStrings = () => {
    switch (language) {
      case 'pidgin':
        return {
          title: "Gene Journey",
          sub: "Fix genetic codes, predict family traits & build high-impact awareness poster",
          repair: "Phase 1: Nucleus HBB DNA Repair",
          crispr: "Apply Gene Editing (CRISPR Therapy)",
          inheritance: "Phase 2: Punnett Family Traits Matrix",
          poster: "Phase 3: Creative Poster Campaign Studio",
          discoverMutation: "Point Mutation found: Adenine change to Thymine at codon 6, creating Valine (HbS).",
          crisprRun: "APPLY CRISPR-CAS9 NUCLEOTIDE SWAP",
          predictTitle: "Cross parents' coding to solve the 2x2 pedigree block",
          punnettSuccess: "Super! You cross the carrier traits and predict the risk well.",
          postTitle: "Design your own SCD big awareness campaign poster",
          publish: "PUBLISH WARRIOR POSTER",
          done: "POSTER CAMPAIGN DEY LIVE!",
          dailyBonus: "DAILY MISSION DONE (+50 XP!)"
        };
      case 'yoruba':
        return {
          title: "Ìrìn-Àjò Apilẹ̀ṣe",
          sub: "Atúnṣe àwọn apilẹ̀ṣe, sọtẹ́lẹ̀ àwọn àbùdá ìdílé & kọ́ àwọn ìpolongo tó dánmọ́ràn",
          repair: "Ìpele 1: Atúnṣe DNA HBB nínú Nucleus",
          crispr: "Bẹ̀rẹ̀ Atúnṣe Apilẹ̀ṣe (CRISPR)",
          inheritance: "Ìpele 2: Àtẹ Ìṣirò Ìdílé Punnett",
          poster: "Ìpele 3: Gbọ̀ngàn Fún Eré Ìbánisọ̀rọ̀ Aṣàpẹẹrẹ",
          discoverMutation: "Àbùdá àṣìṣe ti wà: Adenine ti yí padà sí Thymine ní codon 6, tó dá Valine (HbS).",
          crisprRun: "ṢẸ̀RỌ̀ CRISPR-CAS9 NUCLEOTIDE SWAP",
          predictTitle: "Dájú àwọn àbùdá àwọn òbí láti parí àtẹ Punnett",
          punnettSuccess: "O yẹ kọ́! O ti sọtẹ́lẹ̀ ewu ìbí ati àbùdá dunjú rẹ.",
          postTitle: "Ṣe àpẹẹrẹ àwọn ìpolongo sẹ́ẹ̀lì rírẹ́ tó kún fún àmì",
          publish: "TẸ̀ JÁDE ÌPOLONGO AKỌNI",
          done: "ÌPOLONGO TI WÀ LÓRÍ AFẸ́FẸ́!",
          dailyBonus: "AJÁṢE ỌJỌ́ GBA AGIDGBA (+50 XP!)"
        };
      case 'hausa':
        return {
          title: "Tafiyar Halitta",
          sub: "Gyara kwayoyin halitta, gano kwayoyin gadon iyali da kuma tsara bango",
          repair: "Mataki na 1: Gyaran HBB DNA a Nucleus",
          crispr: "Bude Gyaran Kwayoyin Halitta (CRISPR)",
          inheritance: "Mataki na 2: Chart din Gadon Iyali na Punnett",
          poster: "Mataki na 3: Wurin Tsara Bango na Jam'i",
          discoverMutation: "An sami matsala: Adenine ta sauya zuwa Thymine a codon 6, wanda ke samar da Valine (HbS).",
          crisprRun: "FARA CRISPR-CAS9 GENE SWAP",
          predictTitle: "Warware matsalolin 2x2 ta hanyar hada kwayoyin iyaye",
          punnettSuccess: "Madallah! Ka yi nasarar gano haɗarin gadon kwayoyin halitta.",
          postTitle: "Tsara bango na musamman don yaƙi da unyanyapaa na cutar sickle cell",
          publish: "BUDE BANKA NA JARUMI",
          done: "AN KADDAMAR DA KAMFE CO LIVE!",
          dailyBonus: "AN KAMMALA KALUBALEN YAU (+50 XP!)"
        };
      case 'igbo':
        return {
          title: "Njem Jeni gị",
          sub: "Mee ka mkpụrụ ndụ jeni gaa nke ọma, chọpụta ihe nketa ezinụlọ & mepụta ihe ọmụmụ ahụike",
          repair: "Isi nke 1: Nucleus HBB DNA n'Ahụ",
          crispr: "Gbanwee sél na CRISPR Therapy",
          inheritance: "Isi nke 2: Akwụsị mkpụrụ ndụ n'Ahụ mụ nwa ọ bụla",
          poster: "Isi nke 3: Studio Mmepụta Mgbasa Ozi gị",
          discoverMutation: "Point mutation: Adenine agbanweela gaa Thymine na codon 6, na-emepụta Valine (HbS).",
          crisprRun: "MEWAKWA CRISPR-CAS9 GENE SWAP",
          predictTitle: "Sọlụsịọn block 2x2 site na ejikọta mkpụrụ ndụ nne na nna",
          punnettSuccess: "Ọmarịcha! Ị mere nchọpụta ahụ ziri ezi banyere ihe nketa.",
          postTitle: "Mepụta mgbasa ozi mkpọm sél anyị dị egwu gburugburu ezinụlọ",
          publish: "IPU WARRIOR MGBASA OZI",
          done: "MGBASA OZI DỊZỊ LIVE!",
          dailyBonus: "EGO NKWADO TA TAA ANYỊ (+50 XP!)"
        };
      default:
        return {
          title: "Gene Journey",
          sub: "Fix Beta-globin mutations, predict inheritance vectors & design advocacy posters",
          repair: "Phase 1: Nucleus HBB DNA Repair",
          crispr: "Launch Gene Editing (CRISPR Therapy)",
          inheritance: "Phase 2: Autosomal Recessive Punnett Challenger",
          poster: "Phase 3: Creative Activism Poster Studio",
          discoverMutation: "Point Mutation found: Adenine changed to Thymine at codon 6, creating Valine (HbS).",
          crisprRun: "TRIGGER CRISPR-CAS9 NUCLEOTIDE SWAP",
          predictTitle: "Solve the 2x2 pedigree block by crossing parents' genotypes",
          punnettSuccess: "Excellent! You crossed the carrier traits and predicted risk correctly.",
          postTitle: "Design your personalized SCD high-impact advocacy campaign poster",
          publish: "PUBLISH WARRIOR POSTER",
          done: "ADVOCACY CAMPAIGN BROADCASTED!",
          dailyBonus: "DAILY CHALLENGE COMPLETED (+50 XP!)"
        };
    }
  };

  const t = getLanguageStrings();

  // Handle complementary code alignment (Phase 1)
  const complementRules: Record<string, string> = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };

  const handleBaseClick = (base: string) => {
    if (dnaPhase === 'build-normal') {
      const targetBase = normalHbbCodon[builtNormal.length];
      const correctComplement = complementRules[targetBase];

      if (base === correctComplement) {
        soundRepairMatch();
        setBuiltNormal(prev => [...prev, base]);
        
        if (builtNormal.length + 1 === normalHbbCodon.length) {
          setDnaPhase('discover-mutation');
          soundMutationHurt();
        }
      } else {
        soundMutationHurt();
      }
    } else if (dnaPhase === 'discover-mutation') {
      // Prompt user to notice the mutated point (A transformed to T)
      setIsMutationDiscovered(true);
    }
  };

  const handleRunCrispr = () => {
    soundRepairMatch();
    // Replaced codon fixed
    setDnaPhase('crispr-therapy');
    setTimeout(() => {
      setActiveStep('inheritance');
      setBuiltNormal([]);
    }, 1500);
  };

  // Phase 2 inheritance solve checker
  const solvePunnett = () => {
    const parent1 = [momGene, 'A']; // Simple genetic parameters
    const parent2 = [dadGene, 'S'];

    const matrix = [
      [parent1[0] + parent2[0], parent1[0] + parent2[1]],
      [parent1[1] + parent2[0], parent1[1] + parent2[1]]
    ];

    setPunnettMatrix(matrix);
    setPunnettSolved(true);
    soundRepairMatch();
  };

  // Phase 3 Poster Campaign publisher
  const handlePublishPoster = () => {
    soundPosterDone();
    setCampaignUnlocked(true);
    
    // Reward points!
    const xpGained = isDailyChallenge ? 150 : 100;
    onXPUnlocked(xpGained);
    const userId = auth.currentUser?.uid || '';
    firebaseService.awardXP(userId, xpGained);

    setTimeout(() => {
      setActiveStep('summary');
    }, 2000);
  };

  // Accessible UI selections
  const colorBlindTheme = {
    contrast: {
      activeLine: 'border-black text-black bg-white font-bold',
      dnaG: 'bg-black text-white border-2 border-white',
      dnaC: 'bg-white text-black border-2 border-black',
      dnaA: 'bg-gray-300 text-black border-2 border-black',
      dnaT: 'bg-gray-650 text-white border-2 border-white',
    },
    normal: {
      activeLine: 'border-indigo-400 bg-indigo-50 text-indigo-700',
      dnaG: 'bg-teal-500 text-white shadow-teal-200',
      dnaC: 'bg-yellow-500 text-yellow-950 shadow-yellow-200',
      dnaA: 'bg-red-500 text-white shadow-red-200',
      dnaT: 'bg-blue-500 text-white shadow-blue-200',
    }
  };

  const currentTheme = colorBlindMode === 'contrast' ? colorBlindTheme.contrast : colorBlindTheme.normal;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-md relative overflow-hidden">
      
      {/* Upper Navigation Progress Dots */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
            {isDailyChallenge ? "🛡️ daily challenge adventure" : "🧬 2D Biology double helix"}
          </span>
          <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">{t.title}</h3>
        </div>
        <div className="flex gap-1.5 bg-gray-50 p-1.5 rounded-full border border-gray-100">
          <div className={`w-3 h-3 rounded-full ${activeStep === 'repair' ? 'bg-indigo-600 scale-110' : 'bg-gray-200'}`} />
          <div className={`w-3 h-3 rounded-full ${activeStep === 'inheritance' ? 'bg-indigo-600 scale-110' : 'bg-gray-200'}`} />
          <div className={`w-3 h-3 rounded-full ${activeStep === 'poster' ? 'bg-indigo-600 scale-110' : 'bg-gray-200'}`} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Intro sequence */}
        {activeStep === 'intro' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center p-8 bg-slate-900 rounded-[2rem] text-white space-y-6"
          >
            <Dna className="w-16 h-16 text-indigo-400 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
            <div className="space-y-2">
              <h4 className="text-xl font-black uppercase tracking-wide">Explore Double Helix Mechanics</h4>
              <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                Sickle Cell is a tiny point mutation of a single basic cell code. Discover the chromosomes in the cell nucleus, predict family patterns, and build campaigns to end stigmas!
              </p>
            </div>
            <button
              onClick={() => {
                setActiveStep('repair');
                soundRepairMatch();
              }}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-400/20"
            >
              Start Journey 🧬
            </button>
          </motion.div>
        )}

        {/* Phase 1: DNA REPAIR */}
        {activeStep === 'repair' && (
          <motion.div 
            initial={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-4 flex gap-3">
              <Info className="text-indigo-600 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-xs font-black text-indigo-900 uppercase">
                  {t.repair}
                </h4>
                <p className="text-xs text-indigo-700 font-semibold leading-relaxed">
                  Complementary Base Rules: Adenine (A) always pairs with Thymine (T), Cytosine (C) with Guanine (G). Click nucleotide buttons below to sequence the healthy HBB chain!
                </p>
              </div>
            </div>

            {/* Helix graphical representation */}
            <div className="bg-slate-950 rounded-[2.5rem] p-6 relative border-4 border-slate-900 shadow-inner overflow-hidden min-h-[160px] flex flex-col justify-center items-center">
              <div className="flex gap-2 max-w-md w-full justify-around relative">
                {normalHbbCodon.map((base, idx) => {
                  const complBuilt = builtNormal[idx];
                  const rules: Record<string, string> = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
                  const targetCompl = rules[base];

                  // Mutation details highlight
                  const isMutPosition = idx === 4;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 relative">
                      {/* Upper Base Strand (Original HBB) */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isMutPosition && dnaPhase !== 'build-normal'
                          ? 'bg-red-600 text-white font-black animate-pulse'
                          : 'bg-slate-800 text-indigo-200 border border-slate-700'
                      }`}>
                        {isMutPosition && dnaPhase === 'discover-mutation' ? 'T*' : base}
                      </div>

                      {/* Bridge thread linkage */}
                      <div className="w-1 bg-slate-800 h-6 shrink-0" />

                      {/* Lower Base Strand (Built by Player) */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        complBuilt 
                          ? complBuilt === 'G' ? currentTheme.dnaG
                            : complBuilt === 'C' ? currentTheme.dnaC
                            : complBuilt === 'A' ? currentTheme.dnaA
                            : currentTheme.dnaT
                          : 'border-2 border-dashed border-slate-800 text-slate-800 font-black'
                      }`}>
                        {complBuilt || "?"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phase actions details */}
            {dnaPhase === 'build-normal' && (
              <div className="space-y-4">
                <div className="flex gap-2 justify-center">
                  {['A', 'T', 'C', 'G'].map(b => (
                    <button
                      key={b}
                      onClick={() => handleBaseClick(b)}
                      className="w-14 h-14 bg-slate-900 hover:bg-indigo-650 text-white font-black rounded-2xl flex items-center justify-center text-lg active:scale-90 transition-transform cursor-pointer"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dnaPhase === 'discover-mutation' && (
              <div className="bg-red-50/80 border border-red-150 p-5 rounded-2xl space-y-4 animate-in fade-in duration-300">
                <div className="flex gap-2.5 text-red-955">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-black text-xs uppercase tracking-wider">Sickle point mutation observed!</h5>
                    <p className="text-xs text-red-800 font-medium leading-relaxed">
                      {t.discoverMutation} Unlike flexible healthy cells, sickled crescent cells stick in blood vessel walls creating crises. Use modern CRISPR base-editing to repair it!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRunCrispr}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <PenTool size={16} />
                  {t.crisprRun}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Phase 2: PUNNETT SQUARE CHALLENGER */}
        {activeStep === 'inheritance' && (
          <motion.div 
            initial={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-4 flex gap-3 text-indigo-900">
              <Dna size={20} className="shrink-0 text-indigo-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase">{t.inheritance}</h4>
                <p className="text-xs text-indigo-700 font-semibold leading-relaxed">
                  Learn carrier status vs disease risk under Autosomal Recessive genes. Select mothers gene (A = Normal, S = Sickle Trait) and fathers, then click solve to complete the Punnett Square!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto items-center">
              {/* Selector configurations */}
              <div className="bg-gray-50 border border-gray-150 rounded-[2rem] p-5 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Configure Parent Traits</span>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-700 block">Mother Genotype:</span>
                    <div className="flex gap-2">
                      {['A', 'S'].map((g) => (
                        <button
                          key={g}
                          onClick={() => { setMomGene(g as 'A' | 'S'); setPunnettSolved(false); }}
                          className={`w-10 h-10 rounded-xl font-bold text-xs ${momGene === g ? 'bg-indigo-600 text-white font-black' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {g === 'A' ? 'AA' : 'AS'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-700 block">Father Genotype:</span>
                    <div className="flex gap-2">
                      {['A', 'S'].map((g) => (
                        <button
                          key={g}
                          onClick={() => { setDadGene(g as 'A' | 'S'); setPunnettSolved(false); }}
                          className={`w-10 h-10 rounded-xl font-bold text-xs ${dadGene === g ? 'bg-indigo-600 text-white font-black' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {g === 'A' ? 'AA' : 'AS'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={solvePunnett}
                  className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow transition-all"
                >
                  SIMULATE REPAIR CROSS
                </button>
              </div>

              {/* Punnett Square Matrix output */}
              <div className="bg-slate-900 border border-slate-800 text-white rounded-[2rem] p-6 flex flex-col justify-center items-center">
                <div className="grid grid-cols-3 gap-2 text-center max-w-[200px] w-full">
                  <div />
                  <div className="text-xs font-black text-indigo-400">Mother</div>
                  <div className="text-xs font-black text-indigo-400">A</div>

                  <div className="text-xs font-black text-indigo-400 flex items-center justify-center">Father</div>
                  <div className={`aspect-square bg-slate-850 rounded-xl border flex items-center justify-center text-sm font-black font-mono shadow-sm ${punnettSolved ? 'text-green-400' : 'text-slate-600'}`}>
                    {punnettSolved ? (momGene === 'A' ? 'AA' : 'AS') : '?'}
                  </div>
                  <div className={`aspect-square bg-slate-850 rounded-xl border flex items-center justify-center text-sm font-black font-mono shadow-sm ${punnettSolved ? 'text-blue-400' : 'text-slate-600'}`}>
                    {punnettSolved ? 'AS' : '?'}
                  </div>

                  <div className="text-xs font-black text-indigo-400 flex items-center justify-center">S</div>
                  <div className={`aspect-square bg-slate-850 rounded-xl border flex items-center justify-center text-sm font-black font-mono shadow-sm ${punnettSolved ? 'text-yellow-400' : 'text-slate-600'}`}>
                    {punnettSolved ? 'AS' : '?'}
                  </div>
                  <div className={`aspect-square bg-slate-850 rounded-xl border flex items-center justify-center text-sm font-black font-mono shadow-sm ${punnettSolved ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                    {punnettSolved ? (momGene === 'A' ? 'AS' : 'SS') : '?'}
                  </div>
                </div>

                {punnettSolved && (
                  <div className="mt-4 text-center space-y-1 animate-in zoom-in-95 leading-relaxed">
                    <span className="text-[10px] font-black uppercase text-green-400 tracking-widest">Cross Analysis</span>
                    <p className="text-[10px] text-gray-300 font-semibold uppercase leading-snug">
                      {momGene === 'A' && dadGene === 'S' && "50% AA (Healthy), 50% AS (Carrier—usually asymptomatic)"}
                      {momGene === 'S' && dadGene === 'S' && "25% Normal, 50% AS Carrier, 25% SS (Sickle Cell Chronic)"}
                    </p>
                    <button
                      onClick={() => {
                        setActiveStep('poster');
                        soundRepairMatch();
                      }}
                      className="mt-3 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl select-none"
                    >
                      Step 3: Studio Activism →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase 3: POSTER CAMPAIGN CREATOR */}
        {activeStep === 'poster' && (
          <motion.div 
            initial={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-4 flex gap-3 text-indigo-900">
              <Palette className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase">{t.poster}</h4>
                <p className="text-xs text-indigo-700 font-semibold leading-relaxed">
                  {t.postTitle} Create it, stylize it, insert illustrative icons, and export to support high scores.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Configuration panel */}
              <div className="bg-gray-50 border border-gray-150 p-5 rounded-[2rem] space-y-5">
                {/* Select Slogan */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">1. Slogan Message</span>
                  <div className="space-y-2">
                    {slogans.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlogan(s)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-extrabold transition-all leading-relaxed ${
                          selectedSlogan === s 
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">2. Visual palette background</span>
                  <div className="flex gap-2.5">
                    {backgrounds.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBackground(bg.id)}
                        className={`flex-1 py-1.5 px-3 rounded-xl border text-[10px] font-black uppercase ${
                          selectedBackground === bg.id 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        {bg.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sticker Add */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">3. Advocacy Stamp Badge</span>
                  <div className="flex gap-2">
                    {stickers.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSelectedSticker(st.icon)}
                        className={`flex-1 py-3 border rounded-xl flex flex-col items-center gap-1 transition-all ${
                          selectedSticker === st.icon 
                            ? 'bg-indigo-100/50 border-indigo-400 text-indigo-700' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl">{st.icon}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{st.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePublishPoster}
                  disabled={!selectedSlogan}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200"
                >
                  {t.publish}
                </button>
              </div>

              {/* Dynamic Poster Preview Board */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex flex-col justify-center items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Poster Live Preview</span>
                
                {/* Large Canvas Poster Card */}
                <div className={`w-full max-w-[280px] aspect-[3/4] rounded-3xl p-6 flex flex-col justify-between text-center relative overflow-hidden shadow-2xl border-4 border-slate-950 ${
                  backgrounds.find(bg => bg.id === selectedBackground)?.class
                }`}>
                  <div className="border-2 border-dashed border-white/25 w-full h-full rounded-2xl p-4 flex flex-col justify-between items-center relative">
                    <div className="text-[10px] uppercase tracking-widest font-black opacity-60">Gene Campaign</div>

                    <div className="space-y-4 my-auto">
                      {selectedSticker && (
                        <motion.div 
                          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-5xl"
                        >
                          {selectedSticker}
                        </motion.div>
                      )}
                      
                      <h4 className="text-xs md:text-sm font-black leading-snug tracking-tight">
                        {selectedSlogan || "Write Slogan to Preview poster"}
                      </h4>
                    </div>

                    <span className="text-[8px] opacity-75 uppercase tracking-widest font-black block">Supported by World Science Village</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase 4: MISSION SUCCESS SUMMARY */}
        {activeStep === 'summary' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-8 bg-green-50 rounded-[2rem] border border-green-150 space-y-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full text-3xl flex items-center justify-center text-green-600 mx-auto animate-bounce">
              🧪
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-green-950 uppercase tracking-widest">CHAPTER COMPLETED!</h4>
              <p className="text-xs text-green-800 font-bold max-w-sm mx-auto leading-relaxed">
                {t.done} Your scientific double helix awareness poster has been compiled & broadcasted! You earned Strength points!
              </p>
              {isDailyChallenge && (
                <span className="text-xs text-yellow-700 font-black uppercase tracking-wider block bg-yellow-100 py-1.5 px-3 rounded-full border border-yellow-200">
                  {t.dailyBonus}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setActiveStep('intro');
                setBuiltNormal([]);
                setDnaPhase('build-normal');
                setIsMutationDiscovered(false);
                setPunnettSolved(false);
                setSelectedSlogan("");
                setSelectedSticker("");
              }}
              className="px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-widest"
            >
              Reset Journey Track
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default GeneJourney;
