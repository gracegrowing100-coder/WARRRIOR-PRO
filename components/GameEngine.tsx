import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameType } from '../types';
import { 
  Play, RotateCcw, Award, CheckCircle2, Droplets, Zap, 
  Shield, Heart, Zap as OxygenIcon, User, MessageSquare, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Home, Hospital, Info, Star, X, Sparkles, Navigation, Globe, Gamepad2, Info as AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';

// --- AUDITORY/SYNTH FEEDBACK SYSTEM (Web Audio API) ---
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
const soundFail = () => playSound([220, 110], 0.15, 'sawtooth', 50);
const soundAction = () => playSound([587.33], 0.04, 'sine');
const soundUnlock = () => playSound([392.00, 523.25, 659.25, 783.99], 0.06, 'sine');
const soundJump = () => playSound([200, 600], 0.08, 'sine', 1200);

const RPG_MAP_SIZE = 8;
const INITIAL_PLAYER_POS = { x: 1, y: 1 };

interface NPC {
  id: string;
  x: number;
  y: number;
  name: string;
  icon: React.ReactNode;
  dialog: string;
  questType: GameType | null;
}

const NPCs: NPC[] = [
  { 
    id: 'nurse', 
    x: 2, 
    y: 5, 
    name: 'Nurse Joy', 
    icon: <Heart className="text-red-500" />, 
    dialog: "Warrior! Your hydration levels are dropping. Complete the Hydration Challenge to keep your blood flowing!", 
    questType: 'strategy' 
  },
  { 
    id: 'doctor', 
    x: 5, 
    y: 2, 
    name: 'Dr. Hematology', 
    icon: <Hospital className="text-blue-500" />, 
    dialog: "Let's study the patterns of Sickle Cell inheritance. Match the traits in this genetic puzzle!", 
    questType: 'cards' 
  },
  { 
    id: 'peer', 
    x: 6, 
    y: 6, 
    name: 'Warrior Sam', 
    icon: <User className="text-purple-500" />, 
    dialog: "Sometimes the path gets blocked. Help me clear these vessels so we can both stay healthy!", 
    questType: 'puzzle' 
  },
];

interface GameEngineProps {
  type: GameType;
  title: string;
  onComplete: (score: number) => void;
  onCancel: () => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ type, title, onComplete, onCancel }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [extraData, setExtraData] = useState<any>(null);
  const [dialog, setDialog] = useState<{ npc: NPC; text: string } | null>(null);
  const [activeQuest, setActiveQuest] = useState<GameType | null>(null);
  const [feedback, setFeedback] = useState<{ text: string, type: 'success' | 'info' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 1500);
  };

  // --- MAIN TIME LOOP ---
  useEffect(() => {
    let interval: any;
    if (gameState === 'playing' && timer > 0 && !dialog && !activeQuest) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      soundFail();
      setGameState('end');
    }
    return () => clearInterval(interval);
  }, [gameState, timer, dialog, activeQuest]);

  const startGame = () => {
    soundUnlock();
    setGameState('playing');
    setScore(0);
    setTimer(type === 'rpg' ? 300 : 60); // More exploration time for RPG
    setDialog(null);
    setActiveQuest(null);
    initializeData(type);
  };

  const initializeData = (gameType: GameType) => {
    if (gameType === 'cards') {
      const symbols = ['💧', '💊', '🛌', '🥦', '🧣', '🌡️'];
      const pairs = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
      setExtraData({ cards: pairs.map((s, i) => ({ id: i, symbol: s, flipped: false, solved: false })), selected: [] });
    } else if (gameType === 'runner') {
      setExtraData({ distance: 0, playerLane: 1, obstacles: [], hearts: 3, speed: 1 });
    } else if (gameType === 'strategy') {
      setExtraData({ hydration: 100, oxygen: 100 });
    } else if (gameType === 'defense') {
      setExtraData({ cells: [], cleared: 0, blocked: 0 });
    } else if (gameType === 'rpg') {
      setExtraData({ player: { ...INITIAL_PLAYER_POS }, questsDone: [], discoveredNPCs: [] });
    } else if (gameType === 'platformer') {
      setExtraData({
        playerX: 10,
        oxygen: 4,
        savedCitizensCount: 0,
        citizens: [
          { id: 1, name: 'Sodiq', x: 35, saved: false },
          { id: 2, name: 'Chioma', x: 65, saved: false },
          { id: 3, name: 'Fatima', x: 88, saved: false }
        ],
        bubbles: [{ id: 1, x: 22 }, { id: 2, x: 48 }, { id: 3, x: 74 }]
      });
    } else if (gameType === 'adventure') {
      setExtraData({
        step: 1, // 1: build, 2: build mutated
        normalSequence: ['C', 'C', 'T', 'G', 'A', 'G', 'G', 'A', 'G'],
        sickleSequence: ['C', 'C', 'T', 'G', 'T', 'G', 'G', 'A', 'G'],
        built: [],
        currentIndex: 0
      });
    } else if (gameType === 'sim') {
      setExtraData({
        budget: 800,
        hydrationCenter: false,
        painClinic: false,
        supportGroup: false,
        recreationPark: false,
        hydrationLevel: 50,
        painControl: 40,
        awareness: 30
      });
    } else if (gameType === 'escape') {
      setExtraData({
        painLevel: 10,
        hasCup: false,
        isCupFilled: false,
        hasPad: false,
        isPadWarmed: false,
        medicationTaken: false,
        log: ["You wake up with a sharp throbbing pain in your joints (Scale 10/10). Find treatment!"]
      });
    } else {
      setExtraData({});
    }
  };

  // --- RPG NAVIGATION ---
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing' || dialog || activeQuest) return;
    setExtraData((prev: any) => {
      const newX = Math.max(0, Math.min(RPG_MAP_SIZE - 1, prev.player.x + dx));
      const newY = Math.max(0, Math.min(RPG_MAP_SIZE - 1, prev.player.y + dy));
      
      const isWall = (newX === 0 || newY === 0 || newX === 7 || newY === 7) && !(newX === 4 && newY === 0);
      if (isWall) return prev;

      soundAction();

      const npc = NPCs.find(n => n.x === newX && n.y === newY);
      if (npc) {
        soundUnlock();
        setDialog({ npc, text: npc.dialog });
        return { 
          ...prev, 
          player: { x: newX, y: newY },
          discoveredNPCs: [...new Set([...prev.discoveredNPCs, npc.id])]
        };
      }

      return { ...prev, player: { x: newX, y: newY } };
    });
  }, [gameState, dialog, activeQuest]);

  useEffect(() => {
    if (type !== 'rpg' || gameState !== 'playing') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') movePlayer(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's') movePlayer(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(1, 0);
      if (e.key === ' ' || e.key === 'Enter') {
        if (dialog) handleStartQuest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [type, gameState, movePlayer, dialog]);

  const handleStartQuest = () => {
    if (dialog?.npc.questType) {
      soundUnlock();
      setActiveQuest(dialog.npc.questType);
      initializeData(dialog.npc.questType);
      setDialog(null);
    } else {
      setDialog(null);
    }
  };

  const handleQuestComplete = (points: number) => {
    soundSuccess();
    setScore(s => s + points + 100);
    showFeedback(`Quest Complete! +${points + 100} XP`, 'success');
    setExtraData((prev: any) => ({
      ...prev,
      questsDone: [...new Set([...prev.questsDone, dialog?.npc.id || ''])]
    }));
    setActiveQuest(null);
    if (extraData?.questsDone.length + 1 >= NPCs.length) {
       setTimeout(() => setGameState('end'), 1500);
    }
  };

  // --- ACTIONS & TRIGGERS FOR ALL MODULES ---

  // Sickle Cell Snap (Cards)
  const handleCardClick = (id: number) => {
    const { cards, selected } = extraData;
    if (selected.length === 2 || cards[id].flipped || cards[id].solved) return;
    soundAction();
    const newCards = [...cards];
    newCards[id].flipped = true;
    const newSelected = [...selected, id];
    
    if (newSelected.length === 2) {
      if (newCards[newSelected[0]].symbol === newCards[newSelected[1]].symbol) {
        newCards[newSelected[0]].solved = true;
        newCards[newSelected[1]].solved = true;
        soundSuccess();
        showFeedback("Correct Match!", "success");
        setExtraData({ cards: newCards, selected: [] });
        if (newCards.every((c: any) => c.solved)) {
           if (type === 'rpg') handleQuestComplete(200); else {
             setScore(250);
             setTimeout(() => setGameState('end'), 1000);
           }
        }
      } else {
        setExtraData({ cards: newCards, selected: newSelected });
        setTimeout(() => {
          soundFail();
          newCards[newSelected[0]].flipped = false;
          newCards[newSelected[1]].flipped = false;
          setExtraData({ cards: newCards, selected: [] });
        }, 1000);
      }
    } else {
      setExtraData({ cards: newCards, selected: newSelected });
    }
  };

  // Strategy Hydration
  const handleDrinkWater = () => {
    soundJump();
    setExtraData((prev: any) => {
      const nextHydration = Math.min(100, prev.hydration + 25);
      showFeedback("+25 Hydration!", "success");
      if (activeQuest && nextHydration >= 95 && prev.oxygen >= 95) {
        setTimeout(() => handleQuestComplete(150), 600);
      } else if (!activeQuest && nextHydration >= 95 && prev.oxygen >= 95) {
        setScore(200);
        setTimeout(() => setGameState('end'), 1000);
      }
      return { ...prev, hydration: nextHydration };
    });
  };

  const handleDeepBreath = () => {
    soundJump();
    setExtraData((prev: any) => {
      const nextOxygen = Math.min(100, prev.oxygen + 20);
      showFeedback("+20 Oxygen!", "success");
      if (activeQuest && prev.hydration >= 95 && nextOxygen >= 95) {
        setTimeout(() => handleQuestComplete(150), 600);
      } else if (!activeQuest && prev.hydration >= 95 && nextOxygen >= 95) {
        setScore(200);
        setTimeout(() => setGameState('end'), 1000);
      }
      return { ...prev, oxygen: nextOxygen };
    });
  };

  // Red Cell Racer (Lane switch)
  const handleLaneChange = (lane: number) => {
    soundAction();
    setExtraData((prev: any) => ({ ...prev, playerLane: lane }));
  };

  // Superhero (Movement & burst)
  const handleSuperheroMove = (dx: number) => {
    soundAction();
    setExtraData((prev: any) => {
      let { playerX, oxygen, savedCitizensCount, citizens, bubbles } = prev;
      playerX = Math.max(0, Math.min(100, playerX + dx));

      // Bubble collect check
      const updatedBubbles = bubbles.filter((b: any) => {
        if (Math.abs(b.x - playerX) < 6) {
          oxygen = Math.min(6, oxygen + 1);
          soundUnlock();
          showFeedback("+1 Active Oxygen Tube!", "success");
          return false;
        }
        return true;
      });

      return { ...prev, playerX, oxygen, bubbles: updatedBubbles };
    });
  };

  const handleOxygenBurst = () => {
    if (extraData.oxygen <= 0) {
      soundFail();
      showFeedback("Out of Oxygen Burst!", "info");
      return;
    }

    soundSuccess();
    setExtraData((prev: any) => {
      let { playerX, oxygen, savedCitizensCount, citizens } = prev;
      oxygen--;

      let scoreGain = 0;
      const updatedCitizens = citizens.map((c: any) => {
        if (!c.saved && Math.abs(c.x - playerX) < 15) {
          scoreGain += 100;
          return { ...c, saved: true };
        }
        return c;
      });

      const nextSavedCount = updatedCitizens.filter((c: any) => c.saved).length;
      if (nextSavedCount > savedCitizensCount) {
        showFeedback("Sickle blockage cleared, Citizen relieved!", "success");
      } else {
        showFeedback("Oxygen burst discharged!", "info");
      }

      if (nextSavedCount >= 3) {
        setTimeout(() => {
          if (type === 'rpg') handleQuestComplete(200); else {
            setScore(300);
            setGameState('end');
          }
        }, 800);
      }

      return { ...prev, oxygen, citizens: updatedCitizens, savedCitizensCount: nextSavedCount };
    });
  };

  // Gene Journey nucleotide choose
  const handleNucleotideChoice = (base: string) => {
    const { step, normalSequence, sickleSequence, built, currentIndex } = extraData;
    const targetSequence = step === 1 ? normalSequence : sickleSequence;
    const targetBase = targetSequence[currentIndex];

    const rules: Record<string, string> = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
    const correctComplement = rules[targetBase];

    if (base === correctComplement) {
      soundUnlock();
      const updatedBuilt = [...built, { base, complemented: true }];
      const nextIndex = currentIndex + 1;

      if (nextIndex >= targetSequence.length) {
        if (step === 1) {
          soundSuccess();
          showFeedback("HbA (Normal Hb) DNA Chain Sequenced!", "success");
          setExtraData({
            step: 2,
            normalSequence,
            sickleSequence,
            built: [],
            currentIndex: 0
          });
        } else {
          soundSuccess();
          showFeedback("Mutation Found: A replaced by T!", "success");
          setTimeout(() => {
            if (type === 'rpg') handleQuestComplete(250); else {
              setScore(300);
              setGameState('end');
            }
          }, 1500);
        }
      } else {
        setExtraData((p: any) => ({ ...p, built: updatedBuilt, currentIndex: nextIndex }));
      }
    } else {
      soundFail();
      showFeedback(`Incorrect! G pairs with C, A pairs with T.`, "info");
    }
  };

  // Sickle Cell City build
  const handleBuildCity = (building: string, cost: number) => {
    if (extraData.budget < cost) {
      soundFail();
      showFeedback("Insufficient Town Funds!", "info");
      return;
    }

    soundUnlock();
    setExtraData((prev: any) => {
      const budget = prev.budget - cost;
      let { hydrationLevel, painControl, awareness } = prev;

      if (building === 'hydrationCenter') hydrationLevel = Math.min(100, hydrationLevel + 35);
      if (building === 'painClinic') painControl = Math.min(100, painControl + 40);
      if (building === 'supportGroup') awareness = Math.min(100, awareness + 45);
      if (building === 'recreationPark') {
        hydrationLevel = Math.min(100, hydrationLevel + 15);
        painControl = Math.min(100, painControl + 15);
        awareness = Math.min(100, awareness + 15);
      }

      const updated = {
        ...prev,
        budget,
        [building]: true,
        hydrationLevel,
        painControl,
        awareness
      };

      if (updated.hydrationCenter && updated.painClinic && updated.supportGroup && updated.recreationPark) {
        setTimeout(() => {
          if (type === 'rpg') handleQuestComplete(200); else {
            setScore(350);
            setGameState('end');
          }
        }, 1200);
      }

      return updated;
    });
  };

  // Escape Room actions
  const handleEscapeAction = (action: string) => {
    setExtraData((prev: any) => {
      let { painLevel, hasCup, isCupFilled, hasPad, isPadWarmed, medicationTaken, log } = prev;
      const newLog = [...log];

      if (action === 'desk') {
        soundUnlock();
        newLog.unshift("Found standard prescription bottle of Hydroxyurea in the desk!");
        hasCup = true; // allow meds to be visible
      } else if (action === 'sink') {
        soundAction();
        isCupFilled = true;
        newLog.unshift("You went to the basin and filled a fresh cup of pure water.");
      } else if (action === 'med') {
        if (!isCupFilled) {
          soundFail();
          newLog.unshift("Danger! You cannot swallow custom pills without hydration water.");
        } else {
          soundSuccess();
          medicationTaken = true;
          painLevel = Math.max(0, painLevel - 4);
          isCupFilled = false;
          newLog.unshift("Consumed prescription tablet. Cellular mutation stabilized (-4 Pain)");
        }
      } else if (action === 'pad') {
        soundUnlock();
        hasPad = true;
        isPadWarmed = true;
        painLevel = Math.max(0, painLevel - 3);
        newLog.unshift("Wrapped standard heating blanket over painful joint context (-3 Pain)");
      } else if (action === 'drink') {
        if (!isCupFilled) {
          soundFail();
          newLog.unshift("Cup is empty! Fill it from the sink first.");
        } else {
          soundSuccess();
          painLevel = Math.max(0, painLevel - 3);
          isCupFilled = false;
          newLog.unshift("Drank cell-softener water. Fluid dynamics optimized! (-3 Pain)");
        }
      }

      if (painLevel <= 0) {
        setTimeout(() => {
          if (type === 'rpg') handleQuestComplete(200); else {
            setScore(200);
            setGameState('end');
          }
        }, 1000);
      }

      return {
        ...prev,
        painLevel,
        hasCup,
        isCupFilled,
        hasPad,
        isPadWarmed,
        medicationTaken,
        log: newLog.slice(0, 5)
      };
    });
  };

  // Defenders click
  const handleCellClick = (cellId: number) => {
    soundAction();
    setExtraData((prev: any) => {
      const cells = prev.cells.filter((c: any) => c.id !== cellId);
      const cleared = prev.cleared + 1;
      
      if (cleared >= 10) {
        setTimeout(() => {
          if (type === 'rpg') handleQuestComplete(200); else {
            setScore(300);
            setGameState('end');
          }
        }, 800);
      }
      return { ...prev, cells, cleared };
    });
  };

  // --- INTERVAL GAME TICKS FOR REAL COLLISION/SPAWNS ---
  useEffect(() => {
    if (gameState !== 'playing' || dialog) return;
    const activeType = activeQuest || type;

    if (activeType === 'strategy') {
      const interval = setInterval(() => {
        setExtraData((prev: any) => {
          if (!prev || typeof prev.hydration === 'undefined') return prev;
          const h = Math.max(0, prev.hydration - 1.2);
          const o = Math.max(0, prev.oxygen - 0.8);
          if (h <= 0 || o <= 0) {
            soundFail();
            if (type === 'rpg') setActiveQuest(null); else setGameState('end');
          }
          return { ...prev, hydration: h, oxygen: o };
        });
      }, 400);
      return () => clearInterval(interval);
    }

    if (activeType === 'runner') {
      const interval = setInterval(() => {
        setExtraData((prev: any) => {
          if (!prev || typeof prev.distance === 'undefined') return prev;
          
          let { distance, playerLane, obstacles, hearts } = prev;
          distance = Math.min(100, distance + 2);

          let col = false;
          const updatedObstacles = obstacles
            .map((ob: any) => ({ ...ob, x: ob.x - 6 }))
            .filter((ob: any) => {
              if (ob.x > 8 && ob.x < 22 && ob.lane === playerLane) {
                col = true;
                return false; 
              }
              return ob.x > 0;
            });

          if (col) {
            hearts = Math.max(0, hearts - 1);
            soundFail();
            showFeedback("Vessel blockage hit! -1 Shield", "info");
            if (hearts <= 0) {
              if (type === 'rpg') {
                setActiveQuest(null);
                showFeedback("Mission Aborted due to crisis!", "info");
              } else {
                setGameState('end');
              }
            }
          }

          if (Math.random() < 0.3 && updatedObstacles.length < 3) {
            updatedObstacles.push({
              id: Math.random(),
              lane: Math.floor(Math.random() * 3),
              x: 100
            });
          }

          if (distance >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              if (type === 'rpg') handleQuestComplete(200); else {
                setScore(300);
                setGameState('end');
              }
            }, 600);
          }

          return { ...prev, distance, obstacles: updatedObstacles, hearts };
        });
      }, 200);
      return () => clearInterval(interval);
    }

    if (activeType === 'defense') {
      const interval = setInterval(() => {
        setExtraData((prev: any) => {
          if (!prev || typeof prev.cleared === 'undefined') return prev;
          
          let { cells, cleared, blocked } = prev;
          let escaped = 0;

          const updatedCells = cells
            .map((c: any) => ({ ...c, x: c.x - 7 }))
            .filter((c: any) => {
              if (c.x <= 5) {
                escaped++;
                return false;
              }
              return true;
            });

          if (escaped > 0) {
            blocked = Math.min(5, blocked + escaped);
            soundFail();
            showFeedback("Vessel blocked! Pressure building up!", "info");
            
            if (blocked >= 5) {
              if (type === 'rpg') {
                setActiveQuest(null);
                showFeedback("Vascular grid overloaded", "info");
              } else {
                setGameState('end');
              }
            }
          }

          if (Math.random() < 0.45 && updatedCells.length < 5) {
            updatedCells.push({
              id: Math.random(),
              x: 100,
              y: Math.floor(Math.random() * 4) * 25 // align in 4 lanes
            });
          }

          return { ...prev, cells: updatedCells, blocked };
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [activeQuest, type, gameState, dialog]);

  const renderGame = () => {
    const activeType = activeQuest || type;

    switch (activeType) {
      case 'rpg':
        return (
          <div className="relative w-full h-full flex flex-col bg-gray-100 overflow-hidden">
            <div className="flex-1 grid grid-cols-8 grid-rows-8 gap-0 p-2 bg-emerald-50 relative border-b border-emerald-100 shadow-inner">
              {Array.from({ length: RPG_MAP_SIZE * RPG_MAP_SIZE }).map((_, i) => {
                const x = i % RPG_MAP_SIZE;
                const y = Math.floor(i / RPG_MAP_SIZE);
                const isWall = (x === 0 || y === 0 || x === 7 || y === 7) && !(x === 4 && y === 0);
                return (
                  <div key={i} className={`flex items-center justify-center border-[0.5px] border-emerald-100/20 ${isWall ? 'bg-emerald-200/80 shadow-inner' : 'bg-white/40'}`}>
                    {x === 4 && y === 0 && <Home className="text-emerald-700 opacity-20" size={24} />}
                  </div>
                );
              })}
              
              {NPCs.map(npc => (
                <div 
                  key={npc.id} 
                  className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center transition-all duration-300"
                  style={{ left: `${npc.x * 12.5}%`, top: `${npc.y * 12.5}%` }}
                >
                  <div className={`p-1.5 rounded-full shadow-lg animate-bounce border-2 bg-white ${extraData?.questsDone.includes(npc.id) ? 'border-gray-200 opacity-50 grayscale' : 'border-emerald-400 shadow-emerald-200/50'}`}>
                    {npc.icon}
                  </div>
                </div>
              ))}

              <div 
                className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center transition-all duration-150 z-10"
                style={{ left: `${extraData?.player.x * 12.5}%`, top: `${extraData?.player.y * 12.5}%` }}
              >
                <div className="bg-red-600 text-white p-2.5 rounded-2xl shadow-xl border-4 border-white flex items-center justify-center">
                  <User size={18} fill="currentColor" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
                </div>
              </div>
            </div>

            <div className="h-28 bg-white border-t border-gray-100 p-4 flex justify-between items-center shadow-2xl">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Quest Progress</span>
                <div className="flex gap-3">
                  {NPCs.map(npc => (
                    <div key={npc.id} className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${extraData?.questsDone.includes(npc.id) ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                      {npc.icon}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Vessel Controls</span>
                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button onClick={() => movePlayer(0, -1)} className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-red-50 hover:text-red-500 transition-all"><ChevronUp size={14}/></button>
                  <div />
                  <button onClick={() => movePlayer(-1, 0)} className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-red-50 hover:text-red-500 transition-all"><ChevronLeft size={14}/></button>
                  <button onClick={() => movePlayer(0, 1)} className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-red-50 hover:text-red-500 transition-all"><ChevronDown size={14}/></button>
                  <button onClick={() => movePlayer(1, 0)} className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-red-50 hover:text-red-500 transition-all"><ChevronRight size={14}/></button>
                </div>
              </div>
            </div>

            {dialog && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center p-6">
                <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-emerald-100 p-8 max-w-sm w-full animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">{dialog.npc.icon}</div>
                    <div>
                      <h4 className="font-black text-emerald-800 text-xl tracking-tight leading-none">{dialog.npc.name}</h4>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mt-1">SCD Suppie</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-md italic leading-relaxed mb-8">"{dialog.text}"</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setDialog(null)}
                      className="flex-1 bg-gray-100 text-gray-500 font-bold py-3 rounded-2xl text-sm hover:bg-gray-200 transition-all"
                    >
                      Later
                    </button>
                    <button 
                      onClick={handleStartQuest}
                      className="flex-2 bg-emerald-600 text-white font-black py-4 px-6 rounded-2xl text-sm hover:bg-emerald-700 shadow-xl shadow-emerald-250 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap size={16} fill="currentColor"/> START MISSION
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'cards':
        return (
          <div className="h-full flex flex-col p-6 bg-red-50/50">
            <h4 className="text-center font-black text-red-600 mb-6 tracking-widest text-sm uppercase">Genetic Matcher</h4>
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
              {extraData?.cards.map((c: any) => (
                <div 
                  key={c.id} 
                  onClick={() => handleCardClick(c.id)}
                  className={`aspect-square flex items-center justify-center text-3xl rounded-2xl cursor-pointer transition-all duration-300 transform shadow-sm border-2 ${c.flipped || c.solved ? 'bg-white rotate-0 border-red-100' : 'bg-red-600 rotate-180 border-red-700'}`}
                >
                  {(c.flipped || c.solved) ? c.symbol : <div className="text-white font-black text-base">?</div>}
                </div>
              ))}
            </div>
            {activeQuest && <button onClick={() => setActiveQuest(null)} className="mt-6 mx-auto text-red-600 font-black text-xs uppercase tracking-widest hover:underline">Cancel Quest</button>}
          </div>
        );

      case 'strategy':
        return (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-blue-50/50">
            <div className="w-full max-w-sm space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-100">
                <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest text-blue-600">
                  <span className="flex items-center gap-1.5"><Droplets size={14}/> Hydration</span> 
                  <span>{Math.round(extraData?.hydration)}%</span>
                </div>
                <div className="w-full bg-blue-50 h-6 rounded-full overflow-hidden border-2 border-blue-100 p-1">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${extraData?.hydration}%` }}></div>
                </div>
                <button onClick={handleDrinkWater} className="mt-4 w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">Drink Water</button>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-red-100">
                <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest text-red-600">
                  <span className="flex items-center gap-1.5"><OxygenIcon size={14}/> Oxygen Levels</span> 
                  <span>{Math.round(extraData?.oxygen)}%</span>
                </div>
                <div className="w-full bg-red-50 h-6 rounded-full overflow-hidden border-2 border-red-100 p-1">
                  <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{ width: `${extraData?.oxygen}%` }}></div>
                </div>
                <button onClick={handleDeepBreath} className="mt-4 w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-red-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">Deep Breath</button>
              </div>
            </div>
            {activeQuest && <button onClick={() => setActiveQuest(null)} className="mt-6 text-blue-600 font-bold text-xs uppercase tracking-widest">Cancel Quest</button>}
          </div>
        );

      case 'puzzle':
        return (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-green-50/50">
            <h4 className="font-black text-green-700 mb-6 tracking-widest text-sm uppercase">Vessel Flow Aligner</h4>
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
              {[...Array(9)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    soundAction();
                    setScore(s => s + 5);
                    if (activeQuest && Math.random() > 0.8) {
                      handleQuestComplete(150);
                    } else if (!activeQuest && Math.random() > 0.85) {
                      setScore(250);
                      soundSuccess();
                      setGameState('end');
                    }
                  }} 
                  className="w-16 h-16 bg-white border-2 border-green-150 rounded-2xl flex items-center justify-center text-3xl hover:bg-green-50 active:scale-90 transition-all shadow-sm"
                >
                  {i === 4 ? '🧩' : (Math.random() > 0.5 ? '🩸' : '🧬')}
                </button>
              ))}
            </div>
            <p className="mt-6 text-[10px] font-black text-green-700 uppercase tracking-[0.2em] animate-pulse">Tap modules to optimize bloodflow!</p>
            {activeQuest && <button onClick={() => setActiveQuest(null)} className="mt-6 text-green-600 font-bold text-xs uppercase tracking-widest">Cancel Quest</button>}
          </div>
        );

      case 'runner':
        return (
          <div className="h-full flex flex-col p-6 bg-rose-50/30 overflow-hidden">
            <div className="max-w-md w-full mx-auto flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Endless Capillary Runner</span>
              <div className="flex gap-2">
                {[...Array(extraData?.hearts || 3)].map((_, i) => (
                  <Heart key={i} className="text-red-500 fill-red-500 animate-pulse" size={16} />
                ))}
              </div>
            </div>
            
            {/* Visual Highway Game Screen */}
            <div className="flex-1 max-w-md w-full mx-auto bg-gray-900 rounded-[2rem] border-4 border-gray-800 p-4 flex flex-col relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              {/* Progress Line */}
              <div className="h-1 bg-gray-800 w-full rounded-full relative mb-4">
                <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${extraData?.distance || 0}%` }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 bg-white rounded-full w-3 h-3 border border-red-500 shadow" style={{ left: `${extraData?.distance || 0}%` }}></div>
              </div>

              {/* Lanes (3 lanes) */}
              <div className="flex-1 flex flex-col justify-between relative">
                {[0, 1, 2].map((laneIndex) => (
                  <div key={laneIndex} className="h-1/3 border-b border-dashed border-gray-800 flex items-center relative">
                    {/* Obstacles in Lane */}
                    {extraData?.obstacles.map((ob: any) => ob.lane === laneIndex && (
                      <div 
                        key={ob.id} 
                        className="absolute h-8 w-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-sm shadow-lg font-black animate-pulse"
                        style={{ left: `${ob.x}%` }}
                      >
                        ⚠️
                      </div>
                    ))}

                    {/* Active Player */}
                    {extraData?.playerLane === laneIndex && (
                      <div className="absolute left-8 h-10 w-10 bg-blue-500 border-2 border-white rounded-[1rem] flex items-center justify-center shadow-lg transform translate-x-1 animate-bounce">
                        🛡️
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* On Screen Controls */}
            <div className="mt-4 flex gap-4 max-w-md w-full mx-auto">
              <button onClick={() => handleLaneChange(0)} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${extraData?.playerLane === 0 ? 'bg-red-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>Top Lane</button>
              <button onClick={() => handleLaneChange(1)} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${extraData?.playerLane === 1 ? 'bg-red-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>Mid Lane</button>
              <button onClick={() => handleLaneChange(2)} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${extraData?.playerLane === 2 ? 'bg-red-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>Bottom Lane</button>
            </div>
            {activeQuest && <button onClick={() => setActiveQuest(null)} className="mt-4 mx-auto text-red-600 font-bold text-xs uppercase tracking-widest">Cancel Quest</button>}
          </div>
        );

      case 'platformer':
        return (
          <div className="h-full flex flex-col p-6 bg-yellow-50/20 overflow-hidden">
            <div className="max-w-md w-full mx-auto flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-yellow-600">SCD Superhero Level</span>
              <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-xl text-xs font-black">
                <OxygenIcon size={14} className="fill-yellow-500" />
                <span>O₂ Tubes: {extraData?.oxygen}</span>
              </div>
            </div>

            {/* Stage Arena */}
            <div className="flex-1 max-w-md w-full mx-auto bg-gradient-to-br from-indigo-950 to-purple-950 rounded-[2.5rem] border-4 border-white shadow-2xl relative p-6 flex flex-col justify-between">
              {/* Star fields */}
              <div className="absolute top-4 right-4 bg-white/5 p-4 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="space-y-4">
                <h5 className="font-black text-white text-lg tracking-tight">Active Bloodstream Lane</h5>
                <p className="text-xs text-white/60 leading-relaxed font-semibold">Collect floating Oxygen bubbles to charge your blast, then stand near injured citizens and ignite!</p>
              </div>

              {/* Lane line structure */}
              <div className="h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center relative p-2 my-6">
                {/* Citizens */}
                {extraData?.citizens.map((citClass: any) => (
                  <div 
                    key={citClass.id} 
                    className="absolute flex flex-col items-center justify-center transition-all"
                    style={{ left: `${citClass.x}%` }}
                  >
                    <span className="text-2xl animate-pulse">{citClass.saved ? '💖' : '🤢'}</span>
                    <span className="text-[8px] bg-white text-black font-black px-1.5 py-0.5 rounded uppercase mt-1">{citClass.name}</span>
                  </div>
                ))}

                {/* Oxygen Bubbles */}
                {extraData?.bubbles.map((b: any) => (
                  <div 
                    key={b.id} 
                    className="absolute bg-sky-400 rounded-full w-5 h-5 flex items-center justify-center shadow-lg border border-white text-white font-black text-[9px] animate-bounce"
                    style={{ left: `${b.x}%` }}
                  >
                    O₂
                  </div>
                ))}

                {/* Main Hero avatar */}
                <div 
                  className="absolute h-14 w-14 bg-yellow-500 border border-white rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 z-10"
                  style={{ left: `${extraData?.playerX}%` }}
                >
                  <span className="text-2xl">🦸</span>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex justify-between items-center text-xs">
                <span className="text-white/60 font-black">Saved Citizens:</span>
                <span className="text-white font-black text-base">{extraData?.savedCitizensCount} / 3</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-4 flex gap-4 max-w-md w-full mx-auto">
              <button onClick={() => handleSuperheroMove(-12)} className="flex-1 bg-white border border-gray-200 py-3 rounded-xl hover:bg-gray-150 font-black text-gray-500 text-sm">◀ Left</button>
              <button onClick={handleOxygenBurst} className="flex-2 bg-yellow-500 py-4.5 rounded-2xl hover:bg-yellow-600 text-white font-black shadow-lg shadow-yellow-250 uppercase tracking-widest text-xs">Deploy Burst 💥</button>
              <button onClick={() => handleSuperheroMove(12)} className="flex-1 bg-white border border-gray-200 py-3 rounded-xl hover:bg-gray-150 font-black text-gray-500 text-sm">Right ▶</button>
            </div>
            {activeQuest && <button onClick={() => setActiveQuest(null)} className="mt-4 mx-auto text-red-600 font-bold text-xs uppercase tracking-widest">Cancel Quest</button>}
          </div>
        );

      case 'adventure':
        return (
          <div className="h-full flex flex-col p-6 bg-indigo-50/50 overflow-hidden">
            <h4 className="text-center font-black text-indigo-700 mb-2 tracking-widest text-sm uppercase">Gene DNA Sequence builder</h4>
            <p className="text-center text-[10px] text-gray-400 font-semibold mb-6 uppercase">Build {extraData?.step === 1 ? 'HbA (Normal Hb)' : 'HbS (Sickle Hb Mutation)'} codon profile</p>

            <div className="flex-1 max-w-sm w-full mx-auto bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              {/* Helix visualizer */}
              <div className="space-y-4">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none block">Complement Sequence</span>
                <div className="h-16 gap-1 bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100 flex items-center overflow-x-auto no-scrollbar">
                  {extraData?.built.map((b: any, index: number) => (
                    <div key={index} className="w-8 h-8 rounded bg-indigo-600 text-white font-black flex items-center justify-center animate-in zoom-in">{b.base}</div>
                  ))}
                  <div className="w-8 h-8 rounded border-2 border-dashed border-indigo-300 text-indigo-600 font-black flex items-center justify-center animate-pulse">?</div>
                </div>
              </div>

              {/* Middle DNA structure detail card */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Selected Base</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg text-indigo-600 text-sm font-black flex items-center justify-center">
                    {extraData?.step === 1 ? extraData?.normalSequence[extraData?.currentIndex] : extraData?.sickleSequence[extraData?.currentIndex]}
                  </div>
                  <p className="text-[11px] font-bold text-gray-500">Wait! Choose the corresponding matching nucleotide complementary base.</p>
                </div>
              </div>

              {/* Selection choices */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Available Codon Bases</span>
                <div className="grid grid-cols-4 gap-3">
                  {['A', 'T', 'G', 'C'].map((base) => (
                    <button 
                      key={base} 
                      onClick={() => handleNucleotideChoice(base)}
                      className="py-4.5 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-md cursor-pointer hover:bg-indigo-700 active:scale-90 transition-all"
                    >
                      {base}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'sim':
        return (
          <div className="h-full flex flex-col p-6 bg-cyan-50/30 overflow-hidden">
            <div className="max-w-md w-full mx-auto flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-cyan-600">Town Planner HUD</span>
              <span className="font-extrabold text-cyan-850 bg-cyan-100 px-3.5 py-1.5 rounded-2xl text-xs">Funds: ${extraData?.budget}</span>
            </div>

            <div className="flex-1 max-w-md w-full mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
              {/* Metrics dashboard */}
              <div className="grid grid-cols-3 gap-2 pb-6 border-b border-gray-50">
                <div className="bg-blue-50/40 p-3 rounded-2xl border border-blue-100">
                  <span className="text-[9px] text-blue-500 uppercase font-black tracking-widest block mb-1">Hydration</span>
                  <span className="text-lg font-black text-blue-900 leading-none">{extraData?.hydrationLevel}%</span>
                </div>
                <div className="bg-red-50/40 p-3 rounded-2xl border border-red-100">
                  <span className="text-[9px] text-red-500 uppercase font-black tracking-widest block mb-1">Pain Buffer</span>
                  <span className="text-lg font-black text-red-900 leading-none">{extraData?.painControl}%</span>
                </div>
                <div className="bg-purple-50/40 p-3 rounded-2xl border border-purple-100">
                  <span className="text-[9px] text-purple-500 uppercase font-black tracking-widest block mb-1">Awareness</span>
                  <span className="text-lg font-black text-purple-900 leading-none">{extraData?.awareness}%</span>
                </div>
              </div>

              {/* Build projects selectors */}
              <div className="space-y-3 pt-6 flex-1 flex flex-col justify-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Build Medical Support Base</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    disabled={extraData?.hydrationCenter} 
                    onClick={() => handleBuildCity('hydrationCenter', 200)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${extraData?.hydrationCenter ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-800 hover:border-cyan-200 active:scale-95'}`}
                  >
                    <span className="font-extrabold text-xs block mb-1">💧 Hydration Center</span>
                    <span className="text-[9px] block text-gray-400 font-bold">$200 | Hydration +35%</span>
                  </button>

                  <button 
                    disabled={extraData?.painClinic} 
                    onClick={() => handleBuildCity('painClinic', 300)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${extraData?.painClinic ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-800 hover:border-cyan-200 active:scale-95'}`}
                  >
                    <span className="font-extrabold text-xs block mb-1">🏠 Emergency Clinic</span>
                    <span className="text-[9px] block text-gray-400 font-bold">$300 | PainControl +40%</span>
                  </button>

                  <button 
                    disabled={extraData?.supportGroup} 
                    onClick={() => handleBuildCity('supportGroup', 150)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${extraData?.supportGroup ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-800 hover:border-cyan-200 active:scale-95'}`}
                  >
                    <span className="font-extrabold text-xs block mb-1">🤝 Support Space</span>
                    <span className="text-[9px] block text-gray-400 font-bold">$150 | Awareness +45%</span>
                  </button>

                  <button 
                    disabled={extraData?.recreationPark} 
                    onClick={() => handleBuildCity('recreationPark', 150)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${extraData?.recreationPark ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-800 hover:border-cyan-200 active:scale-95'}`}
                  >
                    <span className="font-extrabold text-xs block mb-1">🌳 Sickle Cell Park</span>
                    <span className="text-[9px] block text-gray-400 font-bold">$150 | All stats +15%</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'escape':
        return (
          <div className="h-full flex flex-col p-6 bg-amber-50/30 overflow-hidden">
            <div className="max-w-md w-full mx-auto flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-orange-600">Crisis Escape Room</span>
              <span className="font-extrabold text-red-600 bg-red-100 px-3 py-1 rounded-xl text-xs">Joint Pain: {extraData?.painLevel}/10</span>
            </div>

            <div className="flex-1 max-w-md w-full mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between overflow-hidden">
              {/* Terminal Logs room description */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 mb-4 bg-gray-900 rounded-2xl p-4 text-[10px] text-green-400 font-mono">
                {extraData?.log.map((line: string, index: number) => (
                  <p key={index} className="leading-relaxed animate-in fade-in">{`> ${line}`}</p>
                ))}
              </div>

              {/* Action grid */}
              <div className="space-y-4">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Resolve Room Challenges</span>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleEscapeAction('desk')} className="py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 rounded-xl text-xs font-black text-gray-600">Search Desk 🔍</button>
                  <button onClick={() => handleEscapeAction('sink')} className="py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 rounded-xl text-xs font-black text-gray-600">Go to Tap 🚰</button>
                  <button onClick={() => handleEscapeAction('drink')} disabled={!extraData?.isCupFilled} className="py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 rounded-xl text-xs font-black text-blue-700 disabled:opacity-55">Drink Water 💧</button>
                  <button onClick={() => handleEscapeAction('med')} disabled={!extraData?.hasCup} className="py-3 bg-red-50 hover:bg-red-100 border border-red-250 px-4 rounded-xl text-xs font-black text-red-700 disabled:opacity-55">Take Medication 💊</button>
                  <button onClick={() => handleEscapeAction('pad')} className="py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 rounded-xl text-xs font-black text-amber-700 col-span-2">Apply Warm Pad 🛌</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'defense':
        return (
          <div className="h-full flex flex-col p-6 bg-emerald-50/20 overflow-hidden">
            <div className="max-w-md w-full mx-auto flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Defend Capillaries!</span>
              <span className="text-xs font-extrabold text-red-600 bg-red-50 px-3 py-1 rounded-lg">Clogging: {extraData?.blocked}/5</span>
            </div>

            {/* Defenders blood channel arena */}
            <div className="flex-1 max-w-sm w-full mx-auto bg-gray-950 border-4 border-gray-900 rounded-3xl p-4 flex flex-col relative overflow-hidden shadow-2xl">
              <div className="absolute top-2 left-2 text-white/30 font-black text-[9px] uppercase tracking-widest">Capillary Grid</div>
              
              {/* Blockage exit marker on the left */}
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-red-600/30 border-r border-red-500 animate-pulse pointer-events-none z-10"></div>
              
              {/* Floating Clot Enemies */}
              <div className="flex-1 relative">
                {extraData?.cells.map((cell: any) => (
                  <button 
                    key={cell.id} 
                    onClick={() => handleCellClick(cell.id)}
                    className="absolute h-9 w-9 bg-red-600 border-2 border-white text-white font-black rounded-full flex items-center justify-center cursor-pointer shadow-red-500/20 shadow-lg text-xs animate-bounce"
                    style={{ left: `${cell.x}%`, top: `${cell.y}%` }}
                  >
                    🎈
                  </button>
                ))}
              </div>

              {/* Stats dashboard footer */}
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex justify-between items-center text-[10px]">
                <span className="text-gray-400 font-extrabold uppercase">Cells Softened:</span>
                <span className="text-emerald-400 font-black text-xs uppercase">{extraData?.cleared} / 10</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-400 font-bold uppercase mt-4">Tap on sticky sickle cells to inject Hydration therapy!</p>
          </div>
        );

      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
             <div className="text-6xl mb-6">🔮</div>
             <h4 className="font-black game-font text-2xl mb-2">{title}</h4>
             <p className="text-gray-500 text-sm mb-8">This mission module is being deployed to the bloodstream.</p>
             <button onClick={() => setGameState('end')} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold">Simulate End</button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className={`absolute top-24 left-1/2 -translate-x-1/2 z-[60] px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border-2 ${feedback.type === 'success' ? 'bg-green-500/90 text-white border-green-200' : 'bg-blue-500/90 text-white border-blue-200'}`}
          >
            <Sparkles size={24} className="animate-pulse" />
            <span className="font-black game-font text-xl tracking-widest">{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {gameState === 'start' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-8 bg-gradient-to-b from-white to-red-50">
          <div className="relative">
            <div className="absolute -inset-8 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="text-9xl relative drop-shadow-2xl">{type === 'rpg' ? '🛡️' : '🎮'}</div>
          </div>
          <div className="space-y-3">
            <h3 className="text-5xl font-black game-font text-red-600 tracking-widest leading-none">{title}</h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">{type} Mission Active</p>
          </div>
          <p className="text-gray-500 max-w-xs text-sm leading-relaxed font-semibold">
            Complete the odyssey to become a certified Warrior Advocate. Every point contributes to SCD awareness.
          </p>
          <button 
            onClick={startGame}
            className="group relative px-16 py-5 bg-red-600 rounded-[2rem] text-white font-black game-font tracking-[0.2em] text-2xl hover:bg-red-700 transition-all shadow-2xl hover:scale-105 active:scale-95 shadow-red-200"
          >
            ENTER BLOODSTREAM
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white z-10">
            <div className="flex items-center gap-4">
              <div className="bg-red-600 p-2.5 rounded-2xl text-white shadow-xl shadow-red-200">
                <Zap size={18} fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Warrior XP</span>
                <span className="text-2xl font-black text-gray-800 leading-none tracking-tighter">{score}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 transition-all ${timer < 20 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-gray-50 border-gray-100 text-gray-800'}`}>
                <span className="text-lg font-black tracking-tighter tabular-nums">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
              </div>
              <button onClick={onCancel} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><X size={20}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {renderGame()}
          </div>
        </div>
      )}

      {gameState === 'end' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-10 animate-in zoom-in-95 bg-white">
          <div className="relative">
            <div className="absolute -inset-10 bg-yellow-400/30 rounded-full blur-[4rem] animate-pulse"></div>
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-[2.5rem] flex items-center justify-center text-white border-8 border-white shadow-2xl transform rotate-6 relative">
              <Award size={64} strokeWidth={2.5} />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-5xl font-black game-font text-gray-800 tracking-wider">VICTORY!</h3>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Mission Accomplished Successfully</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-[3rem] border-8 border-white shadow-2xl w-full max-w-sm transform -rotate-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
            <div className="text-6xl font-black text-white drop-shadow-xl relative z-10">+{score}</div>
            <div className="text-[10px] text-red-200 font-black uppercase tracking-[0.3em] mt-3 relative z-10">Total Advocacy XP Earned</div>
          </div>
          <div className="flex gap-4 w-full max-w-sm">
            <button 
              onClick={startGame}
              className="flex-1 flex items-center justify-center gap-2 py-5 bg-gray-50 rounded-3xl font-black text-gray-500 hover:bg-gray-100 transition-all text-xs uppercase tracking-widest border border-gray-100"
            >
              <RotateCcw size={18} /> Retry
            </button>
            <button 
              onClick={() => onComplete(score)}
              className="flex-1 flex items-center justify-center gap-2 py-5 bg-red-600 rounded-3xl font-black text-white hover:bg-red-700 shadow-2xl shadow-red-200 transition-all text-xs uppercase tracking-[0.2em]"
            >
              <CheckCircle2 size={18} /> Finish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameEngine;
