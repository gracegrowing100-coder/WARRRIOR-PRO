import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Star, Zap, Volume2, RotateCcw, Play, X, Share2, 
  HelpCircle, BookOpen, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../../services/firebaseService';
import { auth } from '../../firebase-init';

// SOUND OSCILLANTS FOR RACER feedback
const runSound = (freqs: number[], duration = 0.08, type: OscillatorType = 'sine') => {
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

const soundJump = () => runSound([300, 600, 900], 0.06, 'sine');
const soundCollect = () => runSound([523, 783, 1046], 0.05, 'triangle');
const soundHurt = () => runSound([220, 110], 0.15, 'sawtooth');
const soundGoal = () => runSound([523, 659, 783, 1200], 0.08, 'sine');

interface Obstacle {
  id: number;
  x: number;
  lane: number;
  type: 'sickle' | 'cold' | 'dehydration';
  width: number;
  height: number;
}

interface Collectible {
  id: number;
  x: number;
  lane: number;
  type: 'water' | 'folic' | 'star';
  width: number;
  height: number;
}

// Top non-intrusive factual tips
const RUNNER_TIPS = [
  "FACT: Folic acid serves as vital cellular fuel, feeding rapid red cell growth.",
  "FACT: Cold drafts narrow blood vessels, locking rigid crescent cells inside.",
  "FACT: Sickle traits cannot transmit socially—SCD is purely a genetic inheritance.",
  "FACT: Regular simple transfusions replace sickle-vessel density with healthy cells.",
  "FACT: High hydration dilutes red cell count, lessening microclot risks."
];

interface RedCellRacerProps {
  language: string;
  textScale: 'normal' | 'large' | 'xl';
  colorBlindMode: string;
  onXPUnlocked: (xp: number) => void;
  isDailyChallenge?: boolean;
}

const RedCellRacer: React.FC<RedCellRacerProps> = ({ 
  language, 
  textScale, 
  colorBlindMode, 
  onXPUnlocked,
  isDailyChallenge = false
}) => {
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'gameover' | 'victory'>('lobby');
  const [playerLane, setPlayerLane] = useState<number>(1); // 0: Top, 1: Middle, 2: Bottom
  const [shield, setShield] = useState<number>(3);
  const [hydration, setHydration] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [activeColdTrigger, setActiveColdTrigger] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [parentWidth, setParentWidth] = useState<number>(450);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic resize observer to track and scale the canvas container fluidly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    // Direct observation of host container boundaries to support fluid desktop and mobile layouts
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setParentWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(parent);
    
    // Explicit initial resize sync
    setParentWidth(parent.clientWidth || 450);
    
    return () => {
      observer.disconnect();
    };
  }, [gameState]);
  const requestRef = useRef<number | null>(null);
  const ticksRef = useRef<number>(0);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const targetDistance = isDailyChallenge ? 500 : 300; // Complete runner level at 300m/500m

  const textScaleClasses = {
    normal: 'text-sm',
    large: 'text-base md:text-lg',
    xl: 'text-lg md:text-xl'
  };

  const getLanguageStrings = () => {
    switch (language) {
      case 'pidgin':
        return {
          title: "Red Cell Racer",
          sub: "Swipe / jump a flexible healthy cell and dodge vascular clots",
          distance: "Distance",
          shield: "Shields",
          hydration: "Hydration",
          lobbyTitle: "No-Ending Bloodstream Runner",
          lobbyDesc: "Use Up/Down control or screen button to change lanes. Collect water 💧 to stay hydrated, folic acid 💊 for power, and Stars ⭐ for big points.",
          avoid: "Comedown on sickle cells 🛑 and too much cold ❄️ wey dey narrow body lanes!",
          start: "START RUNNER MISSION",
          gameover: "BLOCKAGE DETECTED - HYDRATE AND RETRY!",
          overTitle: "Lanes Blocked (VOC)",
          victoryTitle: "Oxygen Delivery Completed!",
          victoryDesc: "Better work! You reach the final lane safely without clash, protecting oxygen and running past clots!",
          shareMsg: "SCD na jeni levels - no be infectious disease! Support and speak up! 🧬",
          shareBtn: "One-Tap Campaign Share",
          dailyBonus: "DAILY RUN COMPLETED BONUS (+50 XP!)",
          orLabel: "OR",
          toPlayLabel: "TO PLAY"
        };
      case 'yoruba':
        return {
          title: "Eré Sẹ́ẹ̀lì Pupa",
          sub: "Eré sẹ́ẹ̀lì lati dènà dídí kòbògì àti sẹ́ẹ̀lì rírẹ́",
          distance: "Ìyàtọ̀",
          shield: "Aṣààbò",
          hydration: "Mímu Omi",
          lobbyTitle: "Eré Gbọọrọ ninu Ẹ̀jẹ̀",
          lobbyDesc: "Lo bọ́tìnì Òkè/Ìsàlẹ̀ láti yípadà láàárín àwọn ipa ọ̀nà mẹ́ta. Gba omi 💧, egbògi 💊 láti kún fún agbára, àti Ìràwọ̀ ⭐ fún àmì rẹ.",
          avoid: "Yẹra fún àwọn sẹ́ẹ̀lì rírẹ́ 🛑 tí ó ń dínà, àti òtútù líle ❄️!",
          start: "BẸ̀RẸ̀ ERÉ",
          gameover: "ÌDÍPÀ NÍNÚ Ẹ̀JẸ̀ - MU OMI KÍ O LÀYÀ TAPA!",
          overTitle: "Ipa Ọ̀nà Ti Dí (VOC)",
          victoryTitle: "Ìpín Fún Atẹ́gùn Ti Parí!",
          victoryDesc: "O ṣeun pupọ! O gba ipa ọ̀nà náà dunjú rẹ láti gbé atẹ́gùn wọ̀ kálẹ́!",
          shareMsg: "Ṣé o mọ̀ pé àrùn sẹ́ẹ̀lì rírẹ́ kì í ṣe àrùn rànmọ́ràn? Ìmọ̀ apilẹ̀ṣe ni. Ẹ jẹ́ ká polongo rẹ̀! 🧬",
          shareBtn: "Pín Ètò Ìpolongo Ètò",
          dailyBonus: "AJÁṢE ỌJỌ́ PARÍ APÀRÒ (+50 XP!)",
          orLabel: "TABÍ",
          toPlayLabel: "LATI GBÁ"
        };
      case 'hausa':
        return {
          title: "Tseren Kwayoyin Halitta Pupa",
          sub: "Gudanar da kwayoyin halitta lafiyayye domin kaucewa toshewar hanyar jini",
          distance: "Nisa",
          shield: "Garkuwa",
          hydration: "Ruwa a Jiki",
          lobbyTitle: "Wasan Gudun Hanyar Jini na Har Abada",
          lobbyDesc: "Yi amfani da maballin Sama/Kasa don sauya hanyoyi guda uku. Tattara digon ruwa 💧 domin kara karfin jini, folic acid 💊 domin sabunta hanyoyin jini, da Taurari ⭐ don maki.",
          avoid: "Kauce wa kwayoyin sickle cell 🛑 da ke toshe hanya, da kuma sanyi mai tsanani ❄️ da ke matse hanyoyin jini!",
          start: "FARA RUNNER",
          gameover: "AN SAMU TOSHÈWAR JINI - SHA RUWA KA SAKE GWADAWA!",
          overTitle: "Toshewar Hanyar Jini (VOC)",
          victoryTitle: "An Isar da Iskar Oxygen!",
          victoryDesc: "Madallah! Ka isa wurin da aka nufa lafiya ba tare da toshe hanyoyin jini ba!",
          shareMsg: "Shin ka sanni cewa cutar Sickle Cell ta gado ce ba ta yaduwa? Taimaka wa jarumai! 🧬",
          shareBtn: "Raba Saƙon Yaƙin Neman Zaɓe",
          dailyBonus: "BONUS DIN KALUBALEN RANA (+50 XP!)",
          orLabel: "KO",
          toPlayLabel: "DOMIN WASA"
        };
      case 'igbo':
        return {
          title: "Racer Mkpụrụ Ndụ Pupa",
          sub: "Mee ka sél puo gaa nke ọma wee zere mkpọchi ọbara",
          distance: "Ebe Ị Gara",
          shield: "Garkuwa",
          hydration: "Mmiri n'Ahụ",
          lobbyTitle: "Egwuregwu Ọsọ Ahụike Na-adịghị Agwụ Agwụ",
          lobbyDesc: "Jiri njikwa Elu/Ala gbanwee n'etiti ụzọ capillary 3. Chịkọta mmiri 💧, folic acid 💊 maka ike, na Kpakpando ⭐ maka akara.",
          avoid: "Zere sél sickle gbagọrọ agbagọ 🛑 na oké oyi ❄️ na-eme ka ụzọ ahụ dị warara!",
          start: "BẸ̀RẸ̀ EGWUREGWU",
          gameover: "AKWỤSỊRỊ ỌSQ AHỤ - BANYERE MMIRI WE GBAGHAWAKWA!",
          overTitle: "Ụzọ Mechiri Emechi (VOC)",
          victoryTitle: "Ebufela Oxygen nke Ọma!",
          victoryDesc: "Ndị nka! Ị gbara ọsọ ahụ nke ọma n'enweghị nsogbu, na-ebute oxygen oge kwesịrị!",
          shareMsg: "Ị maara na Sickle Cell strictly abụghị ọrịa na-efe efe? Ọ bụ nke jeni. Kwado ndị dike! 🧬",
          shareBtn: "Pinye Mgbasa Ozi Mmụta",
          dailyBonus: "EGO NKWADO NKE ỤBỌCHỊ (+50 XP!)",
          orLabel: "MA Ọ BỤ",
          toPlayLabel: "Maka Igwu egwu"
        };
      default:
        return {
          title: "Red Cell Racer",
          sub: "Swipe / jump a flexible healthy cell and dodge vascular clots",
          distance: "Distance",
          shield: "Shields",
          hydration: "Hydration",
          lobbyTitle: "Endless Bloodstream Runner",
          lobbyDesc: "Use Up/Down controls or screen buttons to switch between 3 capillary lanes. Gather water droplets 💧 to expand plasma volume, folic acid 💊 to regenerate cells, and Stars ⭐ for Score.",
          avoid: "Dodge sticky crescent sickle cells 🛑 and severe cold triggers ❄️ which narrow vessels!",
          start: "START RUNNER MISSION",
          gameover: "BLOCKAGE DETECTED - HYDRATE AND RETRY!",
          overTitle: "Vessel Blocked (VOC)",
          victoryTitle: "Oxygen Delivery Completed!",
          victoryDesc: "Awesome job! You reached the target capillary distance safely, protecting oxygen levels and escaping clots!",
          shareMsg: "Did you know that Sickle Cell Disease is strictly genes—not contagious! Lend support and advocate 🧬",
          shareBtn: "One-Tap Advocacy Share",
          dailyBonus: "DAILY CHALLENGE COMPLETED (+50 XP!)",
          orLabel: "or",
          toPlayLabel: "to play"
        };
    }
  };

  const t = getLanguageStrings();

  // Canvas visual logic
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Aspect-ratio locked auto-scaling algorithm for dynamic backing store dimensions
    const width = parentWidth;
    const height = Math.max(120, parentWidth / 2.5); // Fixed aspect-ratio lock of 2.5 for gameplay consistency
    canvas.width = width;
    canvas.height = height;

    const scale = width / 450; // Reference virtual design is 450x180

    const gameLoop = () => {
      ticksRef.current += 1;

      // Decay hydration gradually
      if (ticksRef.current % 45 === 0) {
        setHydration(h => {
          const nextVal = Math.max(0, h - 1.5);
          if (nextVal <= 0) {
            setShield(s => {
              const nextShield = Math.max(0, s - 1);
              if (nextShield <= 0) {
                setGameState('gameover');
                soundHurt();
              }
              return nextShield;
            });
            return 80; // Reset hydration with minor shield loss
          }
          return nextVal;
        });

        // Toggle random informational tips
        setTipIndex(prev => (prev + 1) % RUNNER_TIPS.length);
      }

      // Generate Distance
      setDistance(d => {
        const nextDist = d + 1;
        if (nextDist >= targetDistance) {
          setGameState('victory');
          soundGoal();
          const userId = auth.currentUser?.uid || '';
          const xpGained = isDailyChallenge ? 120 : 70;
          onXPUnlocked(xpGained);
          firebaseService.awardXP(userId, xpGained);
        }
        return nextDist;
      });

      // Spawn obstacles periodically (Using design-locked virtual bounds for complete resolution independence)
      if (ticksRef.current % 70 === 0 && obstaclesRef.current.length < 3) {
        const obsTypes: ('sickle' | 'cold' | 'dehydration')[] = ['sickle', 'sickle', 'cold', 'dehydration'];
        const type = obsTypes[Math.floor(Math.random() * obsTypes.length)];
        obstaclesRef.current.push({
          id: Math.random(),
          x: 450 + 50,
          lane: Math.floor(Math.random() * 3),
          type,
          width: 30,
          height: 30
        });
      }

      // Spawn collectibles periodically
      if (ticksRef.current % 50 === 0 && collectiblesRef.current.length < 4) {
        const items: ('water' | 'folic' | 'star')[] = ['water', 'water', 'folic', 'star', 'star'];
        const type = items[Math.floor(Math.random() * items.length)];
        collectiblesRef.current.push({
          id: Math.random(),
          x: 450 + 50,
          lane: Math.floor(Math.random() * 3),
          type,
          width: 25,
          height: 25
        });
      }

      // Physics/Update
      obstaclesRef.current = obstaclesRef.current.map(obs => ({
        ...obs,
        x: obs.x - (activeColdTrigger ? 6.5 : 5)
      }));

      collectiblesRef.current = collectiblesRef.current.map(col => ({
        ...col,
        x: col.x - 5
      }));

      // Check bullet/cell overlap colliders
      const playerY = 30 + playerLane * 50 + 15;
      const playerX = 60;

      // Collide obstacles
      obstaclesRef.current = obstaclesRef.current.filter(obs => {
        const obsY = 30 + obs.lane * 50 + 15;
        const dx = Math.abs(playerX - obs.x);
        const dy = Math.abs(playerY - obsY);

        if (dx < 25 && dy < 25) {
          soundHurt();
          if (obs.type === 'sickle') {
            setShield(s => {
              const nextVal = Math.max(0, s - 1);
              if (nextVal <= 0) setGameState('gameover');
              return nextVal;
            });
          } else if (obs.type === 'dehydration') {
            setHydration(h => Math.max(0, h - 35));
          } else if (obs.type === 'cold') {
            setActiveColdTrigger(true);
            setTimeout(() => {
              setActiveColdTrigger(false);
            }, 3000);
          }
          return false;
        }
        return obs.x > -50;
      });

      // Collide collectibles
      collectiblesRef.current = collectiblesRef.current.filter(col => {
        const colY = 30 + col.lane * 50 + 15;
        const dx = Math.abs(playerX - col.x);
        const dy = Math.abs(playerY - colY);

        if (dx < 25 && dy < 25) {
          soundCollect();
          if (col.type === 'water') {
            setHydration(h => Math.min(100, h + 25));
          } else if (col.type === 'folic') {
            setShield(s => Math.min(3, s + 1));
          } else if (col.type === 'star') {
            setScore(prev => prev + 15);
          }
          return false;
        }
        return col.x > -50;
      });

      // Clear Canvas Screen in raw device dimensions
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply aspect-ratio scale for crystal clear HD rendering at any resolution with zero pixelation
      ctx.scale(scale, scale);

      // Colors based on Accessibility mode
      let bcolor = '#111827'; // Dark background
      let arteryLine = '#374151';
      let coldVisualGlow = 'rgba(125, 211, 252, 0.15)';

      if (colorBlindMode === 'contrast') {
        bcolor = '#ffffff';
        arteryLine = '#000000';
        coldVisualGlow = 'rgba(0,0,0,0.05)';
      }

      ctx.fillStyle = bcolor;
      ctx.fillRect(0, 0, 450, 180);

      // Draw 3 highway lanes
      ctx.strokeStyle = colorBlindMode === 'contrast' ? '#000055' : 'rgba(239, 68, 68, 0.15)';
      ctx.lineWidth = activeColdTrigger ? 18 : 3;

      for (let i = 0; i < 3; i++) {
        const laneY = 30 + i * 50 + 15;
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(450, laneY);
        ctx.stroke();
      }

      // Draw constriction cold effect around the frame
      if (activeColdTrigger) {
        ctx.fillStyle = coldVisualGlow;
        ctx.fillRect(0, 0, 450, 24);
        ctx.fillRect(0, 180 - 24, 450, 24);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 450, 180);
      }

      // Draw flexible red blood cell (Player)
      const pY = 30 + playerLane * 50 + 15;
      
      // Accessibility color themes
      let cellColor = '#ef4444'; // default red
      let cellInnerColor = '#b91c1c';
      let sickleColor = '#7e22ce'; // purple
      let waterColor = '#3b82f6';
      let folicColor = '#10b981';

      if (colorBlindMode === 'deuteranopia') {
        cellColor = '#eab308'; // Amber normal
        cellInnerColor = '#a16207';
        sickleColor = '#0284c7'; // Blue sickle
      } else if (colorBlindMode === 'tritanopia') {
        cellColor = '#f43f5e';
        cellInnerColor = '#9f1239';
        sickleColor = '#f97316'; // orange sickle
      } else if (colorBlindMode === 'contrast') {
        cellColor = '#000000';
        cellInnerColor = '#ffffff';
        sickleColor = '#555555';
        waterColor = '#444444';
        folicColor = '#666666';
      }

      // Draw player body
      ctx.fillStyle = cellColor;
      ctx.beginPath();
      ctx.arc(playerX, pY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Biconcave circular indent effect for realism
      ctx.fillStyle = cellInnerColor;
      ctx.beginPath();
      ctx.arc(playerX, pY, 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Cute eyes for friendly gaming design
      if (colorBlindMode !== 'contrast') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(playerX + 5, pY - 4, 3, 0, Math.PI * 2);
        ctx.arc(playerX + 5, pY + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(playerX + 6, pY - 4, 1.5, 0, Math.PI * 2);
        ctx.arc(playerX + 6, pY + 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Obstacles
      obstaclesRef.current.forEach(obs => {
        const obsY = 30 + obs.lane * 50 + 15;
        if (obs.type === 'sickle') {
          // Stiff Sickle Sick S-shape crescent
          ctx.fillStyle = sickleColor;
          ctx.beginPath();
          ctx.arc(obs.x, obsY, 12, 0.4, Math.PI - 0.4);
          ctx.arc(obs.x - 4, obsY - 4, 12, 0.4, Math.PI - 0.4, true);
          ctx.closePath();
          ctx.fill();
        } else if (obs.type === 'dehydration') {
          ctx.fillStyle = '#f97316'; // orange desert
          ctx.beginPath();
          ctx.moveTo(obs.x, obsY - 14);
          ctx.lineTo(obs.x + 12, obsY + 12);
          ctx.lineTo(obs.x - 12, obsY + 12);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px sans-serif';
          ctx.fillText('🏜️', obs.x - 6, obsY + 8);
        } else if (obs.type === 'cold') {
          ctx.fillStyle = '#0ea5e9'; // Blue snowflake
          ctx.beginPath();
          ctx.arc(obs.x, obsY, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px sans-serif';
          ctx.fillText('❄️', obs.x - 5, obsY + 3);
        }
      });

      // Draw Collectibles
      collectiblesRef.current.forEach(col => {
        const colY = 30 + col.lane * 50 + 15;
        if (col.type === 'water') {
          ctx.fillStyle = waterColor;
          ctx.beginPath();
          ctx.moveTo(col.x, colY - 12);
          ctx.quadraticCurveTo(col.x + 10, colY + 2, col.x, colY + 12);
          ctx.quadraticCurveTo(col.x - 10, colY + 2, col.x, colY - 12);
          ctx.fill();
        } else if (col.type === 'folic') {
          ctx.fillStyle = folicColor;
          ctx.fillRect(col.x - 10, colY - 6, 20, 12);
          ctx.fillStyle = '#ffffff';
          ctx.font = '9px sans-serif';
          ctx.fillText('Rx', col.x - 6, colY + 4);
        } else if (col.type === 'star') {
          ctx.fillStyle = '#eab308'; // gold star
          ctx.beginPath();
          ctx.arc(col.x, colY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px sans-serif';
          ctx.fillText('⭐', col.x - 4, colY + 3);
        }
      });

      ctx.restore();

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, playerLane, activeColdTrigger, parentWidth, colorBlindMode]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (gameState !== 'playing') return;
    if (e.key === 'ArrowUp') {
      soundJump();
      setPlayerLane(prev => Math.max(0, prev - 1));
    }
    if (e.key === 'ArrowDown') {
      soundJump();
      setPlayerLane(prev => Math.min(2, prev + 1));
    }
  };

  const shiftLane = (dir: 'up' | 'down') => {
    soundJump();
    setPlayerLane(p => {
      if (dir === 'up') return Math.max(0, p - 1);
      return Math.min(2, p + 1);
    });
  };

  const handleStartGame = () => {
    setGameState('playing');
    setShield(3);
    setHydration(100);
    setScore(0);
    setDistance(0);
    obstaclesRef.current = [];
    collectiblesRef.current = [];
  };

  return (
    <div 
      tabIndex={0}
      onKeyDown={handleKeyPress}
      className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-md relative overflow-hidden outline-none"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-2 mb-4">
        <div>
          <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">
            {isDailyChallenge ? "🛡️ Daily Runner challenge" : "🏃 Capillary Endless Side-scroller"}
          </span>
          <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">{t.title}</h3>
          <p className="text-xs text-gray-500 font-medium">{t.sub}</p>
        </div>
        {gameState === 'playing' && (
          <div className="flex gap-4 items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 text-xs">
            <div className="flex items-center gap-1">
              <Star className="text-yellow-500 fill-yellow-500" size={14} />
              <span className="font-bold">{score} pts</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center gap-1 font-bold text-gray-600">
              <span>{t.distance}:</span>
              <span className="text-blue-600">{distance}m / {targetDistance}m</span>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'lobby' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center p-8 bg-slate-900 rounded-[2rem] text-white space-y-6"
          >
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg animate-bounce">
              🩸
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black uppercase tracking-wide">{t.lobbyTitle}</h4>
              <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                {t.lobbyDesc}
              </p>
              <div className="inline-block bg-slate-800 border border-slate-700 py-1.5 px-3 rounded-xl text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                {t.avoid}
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="px-10 py-4 bg-red-650 hover:bg-red-750 text-white rounded-2xl font-black tracking-widest text-xs uppercase shadow-xl transition-all"
            >
              {t.start}
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Fact Banner sliding top */}
            <div className="bg-blue-50 border border-blue-150 rounded-2xl p-3 flex gap-2.5 items-center animate-pulse">
              <BookOpen size={16} className="text-blue-500 shrink-0" />
              <p className="text-xs text-blue-900 font-extrabold leading-none uppercase tracking-wide">
                {RUNNER_TIPS[tipIndex]}
              </p>
            </div>

            {/* Microcirculation Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-gray-400">{t.shield}</span>
                <div className="flex gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <Heart 
                      key={i} 
                      className={`w-5 h-5 ${i < shield ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-gray-400">{t.hydration}</span>
                <div className="w-24 bg-gray-200 h-3 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${hydration}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Game Canvas Container */}
            <div className="relative border-4 border-slate-800 rounded-[2rem] overflow-hidden shadow-lg bg-slate-950">
              <canvas ref={canvasRef} className="w-full block" />
            </div>

            {/* Touch Action Controls (Optimized for Mobile/Tablets and Keyboards with large touch targets >= 48px) */}
            <div className="flex sm:hidden gap-4 justify-center items-center w-full">
              <button 
                onClick={() => shiftLane('up')}
                className="flex-1 min-h-[48px] h-12 flex items-center justify-center bg-slate-100 border border-slate-200 active:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm select-none active:scale-95 animate-none outline-none"
              >
                ▲ Move Up
              </button>
              <button 
                onClick={() => shiftLane('down')}
                className="flex-1 min-h-[48px] h-12 flex items-center justify-center bg-slate-100 border border-slate-200 active:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm select-none active:scale-95 animate-none outline-none"
              >
                ▼ Move Down
              </button>
            </div>
            
            {/* Desktop Quick Indicator and Controls */}
            <div className="hidden sm:flex justify-center items-center gap-3">
              <kbd className="px-2.5 py-1 text-[10px] bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono shadow-sm">▲ UP Arrow</kbd>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.orLabel}</span>
              <kbd className="px-2.5 py-1 text-[10px] bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono shadow-sm">▼ DOWN Arrow</kbd>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.toPlayLabel}</span>
            </div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-8 bg-red-50 rounded-[2rem] border border-red-100 space-y-5"
          >
            <div className="w-14 h-14 bg-red-100 rounded-2xl text-2xl flex items-center justify-center text-red-600 mx-auto">
              ☠️
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-red-950 uppercase tracking-tight">{t.overTitle}</h4>
              <p className="text-xs text-red-800 font-semibold">{t.gameover}</p>
            </div>
            <button
              onClick={handleStartGame}
              className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider"
            >
              RESTART RUN
            </button>
          </motion.div>
        )}

        {gameState === 'victory' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-8 bg-green-50 rounded-[2rem] border border-green-150 space-y-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full text-3xl flex items-center justify-center text-green-600 mx-auto animate-bounce">
              🌟
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-green-950 uppercase tracking-widest">{t.victoryTitle}</h4>
              <p className="text-xs text-green-800 font-bold max-w-sm mx-auto leading-relaxed">
                {t.victoryDesc}
              </p>
              {isDailyChallenge && (
                <span className="text-xs text-yellow-700 font-black uppercase tracking-wider block bg-yellow-100 py-1.5 px-3 rounded-full border border-yellow-200">
                  {t.dailyBonus}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleStartGame}
                className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Play Again
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="px-6 py-4 border border-green-200 text-green-800 bg-white hover:bg-green-50 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
              >
                <Share2 size={14} />
                {t.shareBtn}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Infographic popup */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full border border-gray-150 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h4 className="font-black text-gray-800 text-sm uppercase tracking-wider">Share Warrior Wisdom</h4>
                <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-gray-50 rounded-full">
                  <X size={18} />
                </button>
              </div>

              {/* Share Card preview */}
              <div id="share-card" className="bg-gradient-to-tr from-red-600 to-indigo-700 rounded-3xl p-6 text-white text-center space-y-4 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl">🧬</div>
                <h4 className="text-lg font-black tracking-tight leading-snug">
                  "SICKLE CELL TRUTH 🧬"
                </h4>
                <p className="text-xs text-red-50/90 leading-relaxed font-semibold">
                  "{t.shareMsg}"
                </p>
                <div className="border-t border-white/20 pt-3 flex justify-between items-center text-[8px] uppercase tracking-widest text-indigo-200 font-bold">
                  <span>Warrior Cell Portal</span>
                  <span>Break the Stigma</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(`Sickle Cell Disease awareness: ${t.shareMsg}`);
                    alert("Awarerness infographic snippet copied to clipboard! Share far and wide.");
                  } catch (e) {}
                  setShowShareModal(false);
                }}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Copy Shareable Link
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RedCellRacer;
