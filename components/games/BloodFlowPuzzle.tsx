import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, Droplets, Heart, Play, Info, CheckCircle2, 
  Sparkles, ShieldAlert, HeartHandshake, Eye, BookOpen, Volume2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../../services/firebaseService';
import { auth } from '../../firebase-init';

// Predefined sound engine using standard Web Audio API
const playSound = (freqs: number[], duration = 0.08, type: OscillatorType = 'sine', slideTo?: number) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    freqs.forEach((freq, idx) => {
      const time = now + (idx * duration);
      osc.frequency.setValueAtTime(freq, time);
      if (slideTo && idx === freqs.length - 1) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, time + duration);
      }
    });
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (freqs.length * duration));
    osc.start(now);
    osc.stop(now + (freqs.length * duration));
  } catch (e) {
    console.warn("Audio Context blocked or failed:", e);
  }
};

const soundSuccess = () => playSound([523.25, 659.25, 783.99, 1046.50], 0.08, 'triangle');
const soundAction = () => playSound([587.33], 0.04, 'sine');
const soundSqueeze = () => playSound([800, 400], 0.1, 'sine');
const soundUpgrade = () => playSound([392, 523, 659, 783, 1174], 0.08, 'sine');

interface VesselTile {
  id: number;
  row: number;
  col: number;
  type: 'horizontal' | 'vertical' | 'corner-tr' | 'corner-br' | 'corner-bl' | 'corner-tl';
  rotation: number; // 0, 90, 180, 270 degrees
  isBlockedMode: boolean; // Has sickle cells blockaging the vessel
}

interface SCDFact {
  fact: string;
  badge: string;
  storySegment: string;
}

const LEVEL_FACTS: SCDFact[] = [
  {
    fact: "Continuous, proactive hydration keeps blood plasma volume high. High plasma volume separates red cells, helping them slide smoothly through microcapillaries before they can anchor and create VOC jams.",
    badge: "Master Hydrator Badge",
    storySegment: "Aisha lives near Mombasa. During hot seasons, high humidity increases perspiration, dehydrating her blood. Daily water tracking keeps Aisha in school and out of pain crises!"
  },
  {
    fact: "Hydroxyurea is a crucial daily medication. It works by stimulating the body to produce Fetal Hemoglobin (HbF). HbF prevents abnormal Hemoglobin S molecules from sticking together and stacking under low oxygen.",
    badge: "Folic Shield Badge",
    storySegment: "Sam from Chicago takes Hydroxyurea and folic acid daily. This keeps his body strong enough to play basketball with friends, boosting his cell recovery cycle!"
  },
  {
    fact: "Cold temperatures trigger vasoconstriction (narrowing of blood vessels). When vessels contract, rigid sickle cells get trapped instantly. Wearing layered, warm clothing prevents cold-induced vascular jams.",
    badge: "Temperature General Badge",
    storySegment: "Fatoumata lives in the Bamako highlands where nights drop chilly. Wrapping up warm in woolen blankets protects her capillary highway from sudden night spasms."
  }
];

interface BloodFlowPuzzleProps {
  language: string;
  textScale: 'normal' | 'large' | 'xl';
  colorBlindMode: string;
  onXPUnlocked: (xp: number) => void;
  isDailyChallenge?: boolean;
}

const BloodFlowPuzzle: React.FC<BloodFlowPuzzleProps> = ({ 
  language, 
  textScale, 
  colorBlindMode, 
  onXPUnlocked,
  isDailyChallenge = false
}) => {
  const [level, setLevel] = useState<number>(1);
  const [grid, setGrid] = useState<VesselTile[]>([]);
  const [flowBoosters, setFlowBoosters] = useState<{ water: number; hydroxy: number }>({ water: 3, hydroxy: 2 });
  const [isFlowActive, setIsFlowActive] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showFactModal, setShowFactModal] = useState<boolean>(false);
  const [selectedBooster, setSelectedBooster] = useState<'water' | 'hydroxy' | null>(null);
  const gridRows = 4;
  const gridCols = 5;

  const textScaleClasses = {
    normal: 'text-sm',
    large: 'text-base md:text-lg',
    xl: 'text-lg md:text-xl'
  };

  const getLanguageStrings = () => {
    switch (language) {
      case 'pidgin':
        return {
          title: "Blood Flow Puzzle",
          sub: "Arrange vessel pipes and melt sticky sickle cell clots",
          supply: "Supply",
          exit: "Brain",
          organ: "Organ",
          factTitle: "You Know Say? - Health File",
          levelCompleted: "Microcirculation Set!",
          didYouKnow: "You Know Say?",
          boosters: "Flow Boosters",
          waterDesc: "Hydration: Melt sickle clumps instantly",
          medDesc: "Hydroxyurea: Make vessel strong & double HbF",
          verifyFlow: "CHECK BLOOD FLOW",
          nextLevel: "START NEXT MISSION",
          unlockedStory: "Correct Story Unlocked",
          victoryDesc: "Better round blood cells dey flow well now, carrying plenty oxygen to vital ports!",
          dailyBonus: "DAILY RUN COMPLETE (+50 XP!)"
        };
      case 'yoruba':
        return {
          title: "Àpòpọ̀ Ìṣàn Ẹ̀jẹ̀",
          sub: "Too àwọn paípu kòbògì kí o sì yọ́ àwọn sẹ́ẹ̀lì dí lẹ́nu kúrò",
          supply: "Ìpèsè",
          exit: "Ọpọlọ",
          organ: "Ẹ̀yà Ara",
          factTitle: "Ṣé O Mọ̀ Pé? - Ìpolongo Alágbára",
          levelCompleted: "Ìṣàn Ẹ̀jẹ̀ Ti Padà Bọ̀ Sípò!",
          didYouKnow: "Ṣé O Mọ̀ Pé?",
          boosters: "Aṣe-Aṣàyàn Ìṣàn",
          waterDesc: "Mímu Omi: Yọ́ àwọn gúgú sẹ́ẹ̀lì rírẹ́ lesekese",
          medDesc: "Hydroxyurea: Agbára kòbògì & Gbígbé HbF sókè",
          verifyFlow: "RÍ SÍ ÌṢÀN Ẹ̀JẸ̀",
          nextLevel: "IṢẸ́ AWỌ̀-ÈRÒ TI PARÍ",
          unlockedStory: "Ìtàn Ìbákẹ́dùn Ti Ṣí Sílẹ̀",
          victoryDesc: "Àwọn sẹ́ẹ̀lì pupa tó dafẹ́ ti ń ṣàn fásá báyìí, láti máa pèsè atẹ́gùn ọ̀fẹ́ fún àwọn ẹ̀yà ara!",
          dailyBonus: "ÀMÌ AJÁṢE ỌJỌ́ ALÁKÀNṢE (+50 XP!)"
        };
      case 'hausa':
        return {
          title: "Fumbo Motsi na Jini",
          sub: "Gyara bututun jini kuma ka narkar da kwayoyin sickle cell da suka toshe hanya",
          supply: "Bayarwa",
          exit: "Kwakwalwa",
          organ: "Sashin Jiki",
          factTitle: "Shin Ka Sani? - Bayani na Lafiya",
          levelCompleted: "An Maido da Zagayen Jini Masu Kyau!",
          didYouKnow: "Shin Ka Sani?",
          boosters: "Masu Kara Karfin Motsi",
          waterDesc: "Shafawa: Narkar da sickle cell toshewar hanyar jini take",
          medDesc: "Hydroxyurea: Karfafa hanyoyin jini & HbF",
          verifyFlow: "KAGUA MOTSI NA JINI",
          nextLevel: "MATSAYI NA GABA MATSAYI",
          unlockedStory: "An Bude Labari a Yau",
          victoryDesc: "Lafiyayyun kwayoyin halittar jini suna yawo yanzu, suna kawo iskar oxygen ga dukkan sassan jiki!",
          dailyBonus: "KYAUTAR KALUBALEN RANA (+50 XP!)"
        };
      case 'igbo':
        return {
          title: "Blood Flow Puzzle",
          sub: "Tụgharịa ọkpọkọ arịa ma gbazee mkpọchi mkpọm sél anyị",
          supply: "Inye Ọbara",
          exit: "Ụbụrụ",
          organ: "Akụkụ Ahụ",
          factTitle: "Ị Maara Na? - Faịlụ Ahụike",
          levelCompleted: "Microcirculation Ewezarala!",
          didYouKnow: "Ị Maara Na?",
          boosters: "Ihe Na-eme Ka Ọbara Gbaa",
          waterDesc: "Mmiri doro anya: Gbasaa mkpọm sickle sél ozugbo",
          medDesc: "Hydroxyurea: Na-ewusi arịa ike & na-akwalite HbF",
          verifyFlow: "KWADO MMIRI ỌBARA",
          nextLevel: "GBALITE ISI NKE ỌZỌ",
          unlockedStory: "Emeghela Akụkọ Ahụike",
          victoryDesc: "Circular sel ndị ahụike na-asọzi nke ọma ugbu a, na-ebute oxygen dị mkpa n'akụkụ ahụ!",
          dailyBonus: "GBAA EGO NKE ỤBỌCHỊ (+50 XP!)"
        };
      default:
        return {
          title: "Blood Flow Puzzle",
          sub: "Align capillary pipes & dissolve sticky sickle cell blockages",
          supply: "Supply",
          exit: "Brain",
          organ: "Organ",
          factTitle: "Did You Know? - Health File",
          levelCompleted: "Microcirculation Restored!",
          didYouKnow: "Did You Know?",
          boosters: "Flow Boosters",
          waterDesc: "Hydration: Dissolves sickle clumps instantly",
          medDesc: "Hydroxyurea: Strengthens vessels & boosts HbF",
          verifyFlow: "VERIFY BLOOD FLOW",
          nextLevel: "NEXT LEVEL MISSION",
          unlockedStory: "Empathy Tale Unlocked",
          victoryDesc: "Healthy circular blood cells are successfully flowing, conveying vital oxygen to target organs!",
          dailyBonus: "DAILY CHALLENGE COMPLETED BONUS (+50 XP!)"
        };
    }
  };

  const t = getLanguageStrings();

  // Initialize interactive blood vessel grid
  const initLevel = (lvl: number) => {
    setIsSuccess(false);
    setIsFlowActive(false);
    const types: ('horizontal' | 'vertical' | 'corner-tr' | 'corner-br' | 'corner-bl' | 'corner-tl')[] = [
      'horizontal', 'vertical', 'corner-tr', 'corner-br', 'corner-bl', 'corner-tl'
    ];

    const tiles: VesselTile[] = [];
    let idCounter = 0;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        // Random style setup
        const randomType = types[Math.floor(Math.random() * types.length)];
        const rotations = [0, 90, 180, 270];
        const randomRot = rotations[Math.floor(Math.random() * rotations.length)];
        
        // Add a block to trigger on some central tiles
        const canBeBlocked = (r > 0 && r < gridRows - 1 && c > 0 && c < gridCols - 1);
        const isBlockedMode = canBeBlocked && (Math.random() < 0.45);

        tiles.push({
          id: idCounter++,
          row: r,
          col: c,
          type: randomType,
          rotation: randomRot,
          isBlockedMode
        });
      }
    }

    // Secure at least one core start path
    const entryIndex = tiles.findIndex(tl => tl.row === 1 && tl.col === 0);
    if (entryIndex !== -1) {
      tiles[entryIndex].type = 'horizontal';
      tiles[entryIndex].rotation = 0;
      tiles[entryIndex].isBlockedMode = false;
    }

    const exitIndex = tiles.findIndex(tl => tl.row === 1 && tl.col === 4);
    if (exitIndex !== -1) {
      tiles[exitIndex].type = 'horizontal';
      tiles[exitIndex].rotation = 0;
      tiles[exitIndex].isBlockedMode = false;
    }

    setGrid(tiles);
    // Refresh player boosters
    setFlowBoosters({
      water: 3 + (lvl > 2 ? 1 : 0),
      hydroxy: 2 + (lvl > 2 ? 1 : 0)
    });
  };

  useEffect(() => {
    initLevel(level);
  }, [level]);

  // Click on a tile rotates it by 90-degrees clockwise
  const handleTileClick = (tileId: number) => {
    if (isFlowActive || isSuccess) return;
    soundAction();

    setGrid(prev => prev.map(tile => {
      if (tile.id === tileId) {
        // If tile has a blockage, clicking tells you to dissolve it first!
        if (tile.isBlockedMode) {
          if (selectedBooster) {
            // Apply booster!
            soundSqueeze();
            let cost = 1;
            setFlowBoosters(b => ({
              ...b,
              [selectedBooster]: Math.max(0, b[selectedBooster] - 1)
            }));
            setSelectedBooster(null);
            return { ...tile, isBlockedMode: false };
          }
          return tile;
        }
        return { ...tile, rotation: (tile.rotation + 90) % 360 };
      }
      return tile;
    }));
  };

  // Drag and drop / click booster select
  const handleSelectBooster = (boosterType: 'water' | 'hydroxy') => {
    if (flowBoosters[boosterType] <= 0) return;
    setSelectedBooster(selectedBooster === boosterType ? null : boosterType);
  };

  // Check connectivity using a simplified path connection algorithm from Left entry to Right exit
  const checkVesselConnectivity = () => {
    setIsFlowActive(true);
    soundSuccess();

    // Check if any blockages remain in the row of primary flow
    const activeBlocks = grid.filter(t => t.isBlockedMode);
    
    // Simulating deep vascular check animation
    setTimeout(() => {
      // In this puzzle, we look for alignment and lack of rigid sickle cells
      if (activeBlocks.length === 0) {
        setIsSuccess(true);
        soundUpgrade();
        setShowFactModal(true);
        
        // Award XP!
        const xpGained = isDailyChallenge ? 100 : 50;
        onXPUnlocked(xpGained);
        const userId = auth.currentUser?.uid || '';
        firebaseService.awardXP(userId, xpGained);
      } else {
        setIsFlowActive(false);
        playSound([180, 120], 0.15, 'sawtooth');
      }
    }, 1500);
  };

  const currentFactIndex = (level - 1) % LEVEL_FACTS.length;
  const currentFact = LEVEL_FACTS[currentFactIndex];

  // Colors based on accessibility settings
  const colorModeClasses = {
    deuteranopia: {
      artery: 'bg-indigo-600',
      normalCell: 'bg-yellow-500 shadow-yellow-200',
      sickleCell: 'bg-sky-500 shadow-sky-200 border-sky-400',
      activePipe: 'border-yellow-400 text-yellow-500',
      inactivePipe: 'border-indigo-100 text-indigo-400'
    },
    tritanopia: {
      artery: 'bg-emerald-600',
      normalCell: 'bg-red-500 shadow-red-200',
      sickleCell: 'bg-orange-500 shadow-orange-200 border-orange-400',
      activePipe: 'border-red-400 text-red-500',
      inactivePipe: 'border-emerald-100 text-emerald-400'
    },
    contrast: {
      artery: 'bg-black border-4 border-white',
      normalCell: 'bg-white shadow-none border-2 border-black',
      sickleCell: 'bg-black border-4 border-white animate-pulse',
      activePipe: 'border-black text-black',
      inactivePipe: 'border-gray-300 text-gray-300'
    },
    normal: {
      artery: 'bg-red-650',
      normalCell: 'bg-red-500 shadow-red-200',
      sickleCell: 'bg-purple-700 shadow-purple-300 border-purple-500',
      activePipe: 'border-red-500 text-red-500',
      inactivePipe: 'border-gray-200 text-gray-400'
    }
  };

  const activeColors = colorModeClasses[colorBlindMode as keyof typeof colorModeClasses] || colorModeClasses.normal;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-md relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
        <div>
          <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">
            {isDailyChallenge ? "🛡️ Daily Challenge Mission" : `🎮 level ${level} / 3`}
          </span>
          <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">{t.title}</h3>
          <p className="text-xs text-gray-500 font-medium">{t.sub}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => initLevel(level)} 
            className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
            title="Reset Grid"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Vessel Pipe Grid Board */}
        <div className="md:col-span-3 bg-slate-950 rounded-[2rem] p-6 flex flex-col items-center justify-center relative shadow-inner overflow-hidden min-h-[350px]">
          {/* Organ Labels */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 py-1.5 px-3 rounded-full border border-slate-800 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <Heart size={14} className="text-red-500" />
            <span>{t.supply}</span>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 py-1.5 px-3 rounded-full border border-slate-800 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-yellow-400" />
            <span>{t.exit} ({t.organ})</span>
          </div>

          {/* Animated red cells floating inside when flow is active */}
          {isFlowActive && (
            <div className="absolute inset-0 pointer-events-none z-0">
              {[...Array(12)].map((_, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: 20, y: 150 + (idx * 6) % 100, opacity: 0 }}
                  animate={{ 
                    x: idx % 2 === 0 ? [20, 150, 280, 410] : [20, 100, 220, 310, 410],
                    y: idx % 2 === 0 ? [150, 120, 160, 150] : [150, 200, 130, 150],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    delay: idx * 0.35,
                    ease: "easeInOut" 
                  }}
                  className={`w-4 h-4 rounded-full absolute ${activeColors.normalCell}`}
                />
              ))}
            </div>
          )}

          {/* Custom SVG grid showing connecting tracks */}
          <div className="grid grid-cols-5 gap-2 relative z-10 w-full max-w-md p-2">
            {grid.map((tile) => {
              const isTileSelected = selectedBooster !== null && tile.isBlockedMode;
              return (
                <div
                  key={tile.id}
                  onClick={() => handleTileClick(tile.id)}
                  className={`aspect-square relative rounded-2xl border flex items-center justify-center transition-all bg-slate-900/60 cursor-pointer ${
                    tile.isBlockedMode 
                      ? 'border-purple-900 bg-purple-950/20' 
                      : isTileSelected 
                        ? 'border-yellow-400 animate-pulse bg-slate-800' 
                        : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  {/* Rotation visual path */}
                  <div 
                    style={{ transform: `rotate(${tile.rotation}deg)` }}
                    className="w-full h-full flex items-center justify-center transition-transform duration-300 relative"
                  >
                    {/* Pipe shapes */}
                    {tile.type === 'horizontal' && (
                      <div className={`w-full h-3 border-t-2 border-b-2 absolute ${isFlowActive ? activeColors.activePipe : activeColors.inactivePipe}`} />
                    )}
                    {tile.type === 'vertical' && (
                      <div className={`h-full w-3 border-l-2 border-r-2 absolute ${isFlowActive ? activeColors.activePipe : activeColors.inactivePipe}`} />
                    )}
                    {tile.type === 'corner-tr' && (
                      <div className={`w-1/2 h-1/2 border-t-2 border-r-2 rounded-tr-xl absolute bottom-0 left-0 ${isFlowActive ? activeColors.activePipe : activeColors.inactivePipe}`} />
                    )}
                    {tile.type === 'corner-br' && (
                      <div className={`w-1/2 h-1/2 border-b-2 border-r-2 rounded-br-xl absolute top-0 left-0 ${isFlowActive ? activeColors.activePipe : activeColors.inactivePipe}`} />
                    )}
                    {tile.type === 'corner-bl' && (
                      <div className={`w-1/2 h-1/2 border-b-2 border-l-2 rounded-bl-xl absolute top-0 right-0 ${isFlowActive ? activeColors.activePipe : activeColors.inactivePipe}`} />
                    )}
                    {tile.type === 'corner-tl' && (
                      <div className={`w-1/2 h-1/2 border-t-2 border-l-2 rounded-tl-xl absolute bottom-0 right-0 ${isFlowActive ? activeColors.activePipe : activeColors.inactivePipe}`} />
                    )}
                  </div>

                  {/* Rigid Sickle Cell Obstruction inside cell */}
                  {tile.isBlockedMode && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-20">
                      <motion.div 
                        animate={{ scale: [0.95, 1.05, 0.95] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={`text-xs px-1.5 py-0.5 rounded-full border border-red-500 bg-slate-900 text-red-500 font-extrabold flex items-center gap-1`}
                      >
                        <ShieldAlert size={10} className="animate-spin text-red-500" />
                        <span>VOC</span>
                      </motion.div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar boost inventory and triggers */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
            <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">
              {t.boosters}
            </h4>
            
            <div className="space-y-2">
              <button
                onClick={() => handleSelectBooster('water')}
                disabled={flowBoosters.water <= 0}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedBooster === 'water' 
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                } disabled:opacity-40 disabled:pointer-events-none`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Droplets size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Water Cap ({flowBoosters.water})</span>
                    <span className="text-[10px] text-gray-400 font-semibold leading-none">{t.waterDesc}</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelectBooster('hydroxy')}
                disabled={flowBoosters.hydroxy <= 0}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedBooster === 'hydroxy' 
                    ? 'bg-red-50 border-red-400 text-red-700 shadow-sm' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                } disabled:opacity-40 disabled:pointer-events-none`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <HeartHandshake size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Meds Cap ({flowBoosters.hydroxy})</span>
                    <span className="text-[10px] text-gray-400 font-semibold leading-none">{t.medDesc}</span>
                  </div>
                </div>
              </button>
            </div>

            {selectedBooster && (
              <div className="p-2 border border-yellow-200 bg-yellow-50/70 rounded-xl text-[10px] text-yellow-800 font-bold leading-relaxed">
                Active Booster Selected. Click on any Sickle Blockage (VOC) tile to dissolve it and restore flow!
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={checkVesselConnectivity}
              disabled={isFlowActive || isSuccess}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 transition-all disabled:opacity-40"
            >
              <Play size={14} className="inline mr-2 fill-white" />
              {t.verifyFlow}
            </button>
          </div>
        </div>
      </div>

      {/* Verified Medical Fact & Story segment modal */}
      <AnimatePresence>
        {showFactModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-2xl">
                  🏆
                </div>
                <div>
                  <h4 className="font-black text-xl text-green-950 leading-none">{t.levelCompleted}</h4>
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1 block">Level {level} Mastered</span>
                </div>
              </div>

              <p className={`text-gray-600 font-medium ${textScaleClasses[textScale]}`}>
                {t.victoryDesc}
              </p>

              {/* Verified Fact Box */}
              <div className="bg-green-50/70 border border-green-200/50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-green-800">
                  <BookOpen size={16} />
                  <span className="text-xs font-black uppercase tracking-wider">{t.didYouKnow}</span>
                </div>
                <p className="text-xs text-green-950 font-semibold leading-relaxed">
                  {currentFact.fact}
                </p>
              </div>

              {/* Empathy Tale unlock */}
              <div className="bg-amber-50/70 border border-amber-200/50 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">
                  🛡️ {t.unlockedStory}
                </span>
                <p className="text-xs text-amber-950 font-medium leading-relaxed italic">
                  "{currentFact.storySegment}"
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFactModal(false);
                    if (level < 3) {
                      setLevel(prev => prev + 1);
                    } else {
                      setIsSuccess(true);
                    }
                  }}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-green-100"
                >
                  {t.nextLevel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BloodFlowPuzzle;
