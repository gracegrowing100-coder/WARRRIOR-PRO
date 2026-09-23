import React, { useState, useEffect } from 'react';
import { 
  Play, Info, Trophy, Star, X, GraduationCap, Gamepad2, 
  Settings, Volume2, Globe, Heart, ArrowRight, CheckCircle2, Award 
} from 'lucide-react';
import { GAME_CONCEPTS } from '../constants';
import { SCDAcademy } from './SCDAcademy';

// Import our newly created modular premium subcomponents
import BloodFlowPuzzle from './games/BloodFlowPuzzle';
import RedCellRacer from './games/RedCellRacer';
import GeneJourney from './games/GeneJourney';
import LearnSection from './games/LearnSection';
import EmpathyStories from './games/EmpathyStories';
import SkinsAndRewards from './games/SkinsAndRewards';
import AdvocacyAndImpact from './games/AdvocacyAndImpact';

import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';

const GamesHub: React.FC = () => {
  // Navigation: academy, games, anatomy, empathy, progression, advocacy
  const [activeHubTab, setActiveHubTab] = useState<'academy' | 'games' | 'anatomy' | 'empathy' | 'progression' | 'advocacy'>('games');
  
  // Custom game launcher states
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isDailyMode, setIsDailyMode] = useState<boolean>(false);
  const [dailyCompleted, setDailyCompleted] = useState<boolean>(false);

  // Global Accessibility Parameters
  const [language, setLanguage] = useState<string>('en'); // en, fr, sw, ar
  const [textScale, setTextScale] = useState<'normal' | 'large' | 'xl'>('normal');
  const [colorBlindMode, setColorBlindMode] = useState<string>('normal'); // normal, deuteranopia, tritanopia, contrast
  const [activeSkinId, setActiveSkinId] = useState<string>('standard');
  const [totalXP, setTotalXP] = useState<number>(310);

  // Load user details and synchronization from database/localStorage
  useEffect(() => {
    const syncStats = async () => {
      const user = auth.currentUser;
      if (user) {
        const profile = await firebaseService.getUserProfile(user.uid);
        if (profile) {
          setTotalXP(profile.xp || 310);
        }
      } else {
        const cachedXP = localStorage.getItem('warrior_xp');
        if (cachedXP) setTotalXP(Number(cachedXP));
      }

      setDailyCompleted(localStorage.getItem('warrior_daily_challenge') === 'true');
      const loadedSkin = localStorage.getItem('warrior_active_skin') || 'standard';
      setActiveSkinId(loadedSkin);
    };

    syncStats();
  }, [activeGameId, activeHubTab]);

  // Handle game points rewards dynamically
  const handleXPGained = async (xpValue: number) => {
    setTotalXP(prev => {
      const nextXP = prev + xpValue;
      localStorage.setItem('warrior_xp', String(nextXP));
      return nextXP;
    });

    if (isDailyMode) {
      setDailyCompleted(true);
      localStorage.setItem('warrior_daily_challenge', 'true');
    }
    setActiveGameId(null);
    setIsDailyMode(false);
  };

  const getLanguageStrings = () => {
    switch (language) {
      case 'pidgin':
        return {
          title: "Warrior Knowledge & Quest Hub",
          sub: "Get sharp medical levels and check how your bodi cells strong",
          tabAcademy: "SCD Academy",
          tabGames: "Fight Missions",
          tabAnatomy: "Bodi Structure & Jeni",
          tabEmpathy: "Voice Empathy Tales",
          tabProgression: "Skins & Badges",
          tabAdvocacy: "Campaign Studio",
          dailyTile: "🛡️ SPECIAL DAILY RUN IS LIVE",
          dailyMission: "Oxygen Flow booster: Clear sickle cell block-up inside Blood Flow Puzzle.",
          playDaily: "PLAY AM SENSE-SENSE (+100 XP!)",
          dailyCompletedMsg: "Daily challenge set! Levels don change. Drink plenty water!",
          gameListTitle: "Choose your Biomedical Game",
          gamesSub: "Play correct clinic codes to win plenty Strength Points (XP)",
          btnPlay: "ENTER MISSION",
          closeGame: "COMEOUT FOR GAME",
          accSettings: "Accessibility Options",
          optLang: "Language",
          optScale: "How big text go be",
          optColorblind: "Color Filter"
        };
      case 'yoruba':
        return {
          title: "Pẹpẹ Ìmọ̀ & Ìrìn-Àjò Akọni",
          sub: "Gba àwọn ìmọ̀ ìṣègùn títayọ kí o sì dán agbára àwọn sẹ́ẹ̀lì rẹ wò",
          tabAcademy: "SCD Akádẹ́mì",
          tabGames: "Àwọn Iṣẹ́ Àkànṣe",
          tabAnatomy: "Egbògi & Apá Ara jẹ́jẹ́",
          tabEmpathy: "Àwọn Ìtàn Ìbákẹ́dùn",
          tabProgression: "Àwọn Àwọ̀ & Àmì-ẹ̀yẹ",
          tabAdvocacy: "Gbọ̀ngàn Ìpolongo",
          dailyTile: "🛡️ AJÁṢE ỌJỌ́ ALÁKÀNṢE TI ṢÍ SÍLẸ̀",
          dailyMission: "Oxygen Flow booster: Palẹ̀ àwọn sẹ́ẹ̀lì tó dí ọ̀nà mọ́ kúrò nínú Blood Flow Puzzle.",
          playDaily: "BẸ̀RẸ̀ AJÁṢE ỌJỌ́ (+100 XP!)",
          dailyCompletedMsg: "A dúpẹ́! O ti parí ajáṣe tí òní dunjú dunjú. Mu omi dúpẹ́!",
          gameListTitle: "Yan Ìrìn-Àjò Ìṣègùn Rẹ",
          gamesSub: "Gbá àwọn eré tó dánmọ́ràn láti gba Àwọn Àmì Agbára (XP)",
          btnPlay: "BẸ̀RẸ̀ IṢẸ́",
          closeGame: "KÚRÒ NÍNÚ ERÉ",
          accSettings: "Àwọn Ètò Ìrọ̀rùn",
          optLang: "Èdè",
          optScale: "Títóbi Ìwé",
          optColorblind: "Aṣẹ́-Àwọ̀"
        };
      case 'hausa':
        return {
          title: "Wurin Ilimi & Taron Yakin Jarumi",
          sub: "Hada kanka da basirar lafiya domin kare lafiyar kwayoyin halittarka",
          tabAcademy: "Makarantar SCD",
          tabGames: "Ayyukan Jarumi",
          tabAnatomy: "Tsarin Jiki & Halittu",
          tabEmpathy: "Labaran Tausayi na Sauti",
          tabProgression: "Salo & Lambobin Yabo",
          tabAdvocacy: "Wurin Kamfe",
          dailyTile: "🛡️ AN KADDAMAR DA KALUBALEN RANA",
          dailyMission: "Oxygen Flow booster: Share kwayoyin cell da suka toshe hanyar jini a cikin Blood Flow Puzzle.",
          playDaily: "FARA KALUBALEN YAU (+100 XP!)",
          dailyCompletedMsg: "An yi nasarar kammala kalubalen yau! To madallah. Sha ruwa sosai!",
          gameListTitle: "Zabi Babin Lafiya",
          gamesSub: "Yi wasa da tsarin lafiya don samun Makin Karfi (XP)",
          btnPlay: "FARA AIKIN YAU",
          closeGame: "FITA DAGA WASAN",
          accSettings: "Sauran Sauki na Jama'a",
          optLang: "Harshe",
          optScale: "Girma na Rubutu",
          optColorblind: "Tace Launi"
        };
      case 'igbo':
        return {
          title: "Ebe Ọmụmụ Ihe & Nchọpụta Ndị Dike",
          sub: "Kwado onwe gị na nkà ahụike iji nwalee ike sél gị",
          tabAcademy: "SCD Akadami",
          tabGames: "Mgbasa Ozi Dike",
          tabAnatomy: "Ahụ & Mkpụrụ Ndụ Jeni",
          tabEmpathy: "Akụkọ Ọmịiko Olulu",
          tabProgression: "Akpụkpọ Ahụ & Baajị",
          tabAdvocacy: "Ebe Mmepụta Mgbasa Ozi",
          dailyTile: "🛡️ EMEGHERI NDỊ ỌRỤ DỊ NILE NKE ỤBỌCHỊ",
          dailyMission: "Oxygen Flow booster: Kpochapụ mkpọmkpọ sél ahụ mechiri ụzọ na Blood Flow Puzzle.",
          playDaily: "BỤRỤ NDI ỌRỤ (+100 XP!)",
          dailyCompletedMsg: "Ị rụchaala ọrụ taa! Ị rụsiela ọrụ ike. Na-aụ mmiri oge niile!",
          gameListTitle: "Họrọ Isi Ahụike Gị",
          gamesSub: "Soro ụdị egwuregwu ahụike rụọ ọrụ na nweta Akara Ike (XP)",
          btnPlay: "FALATA ỌRỤ SAA",
          closeGame: "PỤO NA EGWUREGWU",
          accSettings: "Nhazi Maka Ndị Nwere Mkpa Pụrụ Iche",
          optLang: "Asụsụ",
          optScale: "Gịnị ka gị na Maandishi ga-adị",
          optColorblind: "Ihe Na-atacha Agba"
        };
      default:
        return {
          title: "Warrior Knowledge & Quest Hub",
          sub: "Equip yourself with life-saving skills & test your cellular resilience",
          tabAcademy: "SCD Academy",
          tabGames: "Quest Missions",
          tabAnatomy: "Anatomy & Genetics",
          tabEmpathy: "Voice Empathy Tales",
          tabProgression: "Skins & Badges",
          tabAdvocacy: "Campaign Studio",
          dailyTile: "🛡️ SPECIAL DAILY CHALLENGE ACTIVATED",
          dailyMission: "Oxygen Flow booster: Clear deoxygenated sickle clusters in the Blood Flow Puzzle.",
          playDaily: "LAUNCH DAILY CHALLENGE (+100 XP!)",
          dailyCompletedMsg: "Daily challenge completed! Contribution rewarded. Keep hydrated!",
          gameListTitle: "Select Bio-Medical Chapter",
          gamesSub: "Interact with customized clinical models to earn Strength Points (XP)",
          btnPlay: "START SIMULATION",
          closeGame: "EXIT CHAPTER",
          accSettings: "Global Accessibility Panel",
          optLang: "Language",
          optScale: "Text Scale",
          optColorblind: "Color Filter"
        };
    }
  };

  const t = getLanguageStrings();

  const handleLaunchDaily = () => {
    setActiveGameId('blood-flow-puzzle');
    setIsDailyMode(true);
  };

  // Sizing adjustor
  const textSizeStyles = {
    normal: 'text-sm',
    large: 'text-base md:text-lg',
    xl: 'text-lg md:text-xl'
  };

  return (
    <div className={`space-y-6 ${textSizeStyles[textScale]}`}>
      
      {/* Dynamic Global Accessibility Bar */}
      <div className="bg-slate-50 border border-gray-150 p-4 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-700">
          <Settings size={18} className="translate-y-0.2" />
          <h4 className="text-xs font-black uppercase tracking-wider">{t.accSettings}</h4>
        </div>

        {/* Language selector */}
        <div className="flex items-center justify-between gap-1.5 overflow-hidden">
          <span className="text-[10px] font-black text-gray-500 uppercase">{t.optLang}</span>
          <div className="flex gap-1 flex-wrap justify-end">
            {['en', 'pidgin', 'yoruba', 'hausa', 'igbo'].map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`py-1 px-1.5 text-[9px] font-black rounded-lg uppercase ${
                  language === l ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-gray-50 text-slate-500'
                }`}
              >
                {l === 'pidgin' ? 'Pidgin' : l === 'yoruba' ? 'Yoruba' : l === 'hausa' ? 'Hausa' : l === 'igbo' ? 'Igbo' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Text Scale slider */}
        <div className="flex items-center justify-between gap-1.5 overflow-hidden">
          <span className="text-[10px] font-black text-gray-500 uppercase font-mono">{t.optScale}</span>
          <div className="flex gap-1">
            {(['normal', 'large', 'xl'] as const).map(scale => (
              <button
                key={scale}
                onClick={() => setTextScale(scale)}
                className={`py-1 px-2 text-[10px] font-black rounded-lg uppercase ${
                  textScale === scale ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-gray-50 text-slate-500'
                }`}
              >
                {scale === 'normal' ? 'Normal' : scale === 'large' ? 'Large' : 'XL'}
              </button>
            ))}
          </div>
        </div>

        {/* Color Blind mode slider */}
        <div className="flex items-center justify-between gap-1.5 overflow-hidden">
          <span className="text-[10px] font-black text-gray-500 uppercase leading-none">{t.optColorblind}</span>
          <div className="flex gap-1">
            {['normal', 'deuteranopia', 'tritanopia', 'contrast'].map(mode => (
              <button
                key={mode}
                onClick={() => setColorBlindMode(mode)}
                className={`py-1 px-1.5 text-[9px] font-black rounded-lg uppercase leading-none ${
                  colorBlindMode === mode ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-gray-50 text-slate-500'
                }`}
              >
                {mode.substring(0, 4)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Title & Strengths Indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight leading-none uppercase">
            {t.title}
          </h2>
          <p className="text-gray-400 text-xs font-semibold pt-1">
            {t.sub}
          </p>
        </div>
        <div className="bg-yellow-100 px-4 py-2 rounded-full flex items-center gap-2 border border-yellow-250 animate-pulse">
          <Trophy size={16} className="text-yellow-600 fill-yellow-500" />
          <span className="text-yellow-805 font-black text-xs uppercase tracking-wider">{totalXP.toLocaleString()} STRENGTH PTS</span>
        </div>
      </div>

      {/* Navigational Tabs row */}
      <div className="flex flex-wrap bg-gray-100/80 p-1.5 rounded-2xl w-full max-w-5xl border border-gray-150 gap-1 sm:gap-2">
        <button
          onClick={() => { setActiveHubTab('games'); setActiveGameId(null); }}
          className={`py-2.5 px-4 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'games' ? 'bg-white text-red-650 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Gamepad2 size={14} /> {t.tabGames}
        </button>

        <button
          onClick={() => { setActiveHubTab('anatomy'); setActiveGameId(null); }}
          className={`py-2.5 px-4 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'anatomy' ? 'bg-white text-red-650 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Heart size={14} /> {t.tabAnatomy}
        </button>

        <button
          onClick={() => { setActiveHubTab('empathy'); setActiveGameId(null); }}
          className={`py-2.5 px-4 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'empathy' ? 'bg-white text-red-650 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Volume2 size={14} /> {t.tabEmpathy}
        </button>

        <button
          onClick={() => { setActiveHubTab('progression'); setActiveGameId(null); }}
          className={`py-2.5 px-4 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'progression' ? 'bg-white text-red-650 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award size={14} /> {t.tabProgression}
        </button>

        <button
          onClick={() => { setActiveHubTab('advocacy'); setActiveGameId(null); }}
          className={`py-2.5 px-4 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'advocacy' ? 'bg-white text-red-650 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe size={14} /> {t.tabAdvocacy}
        </button>

        <button
          onClick={() => { setActiveHubTab('academy'); setActiveGameId(null); }}
          className={`py-2.5 px-4 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'academy' ? 'bg-white text-red-650 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <GraduationCap size={14} /> {t.tabAcademy}
        </button>
      </div>

      {/* RENDER ACTIVE SCREEN */}

      {/* 1. ACADEMY TAB SEAMLESS ORIGINAL REUSE */}
      {activeHubTab === 'academy' && (
        <SCDAcademy />
      )}

      {/* 2. ANA MEDICAL BODY MAP & GENETICS TAB */}
      {activeHubTab === 'anatomy' && (
        <LearnSection language={language} textScale={textScale} colorBlindMode={colorBlindMode} />
      )}

      {/* 3. VOCAL STORIES DISPATCH TAB */}
      {activeHubTab === 'empathy' && (
        <EmpathyStories language={language} textScale={textScale} />
      )}

      {/* 4. CHAR SKINS REWARDS TAB */}
      {activeHubTab === 'progression' && (
        <SkinsAndRewards 
          language={language} 
          textScale={textScale} 
          activeSkinId={activeSkinId}
          onEquipSkin={(id) => { setActiveSkinId(id); }}
        />
      )}

      {/* 5. ADVOCACY COMPOSE TAB */}
      {activeHubTab === 'advocacy' && (
        <AdvocacyAndImpact language={language} textScale={textScale} />
      )}

      {/* 6. GAMES & MISSIONS REVOLVER TABS */}
      {activeHubTab === 'games' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Daily Active Mission Banner */}
          <div className="bg-slate-900 border-4 border-slate-950 text-white rounded-[2rem] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest block font-mono">{t.dailyTile}</span>
              <h4 className="text-sm font-black uppercase leading-none">{t.dailyMission}</h4>
            </div>

            {dailyCompleted ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-slate-850 py-2.5 px-4 rounded-xl border border-slate-800">
                <CheckCircle2 size={14} />
                <span>{t.dailyCompletedMsg}</span>
              </div>
            ) : (
              <button
                onClick={handleLaunchDaily}
                className="py-3 px-6 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer leading-none"
              >
                {t.playDaily}
              </button>
            )}
          </div>

          {/* Games selections board */}
          {activeGameId === null ? (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">{t.gameListTitle}</h3>
                <p className="text-xs text-gray-500 font-semibold">{t.gamesSub}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                
                {/* GAME 1 CARD: BLOOD FLOW PUZZLE */}
                <div 
                  onClick={() => { setActiveGameId('blood-flow-puzzle'); setIsDailyMode(false); }}
                  className="bg-white rounded-[2rem] border border-gray-150 hover:border-red-300 transition-all cursor-pointer shadow-md overflow-hidden flex flex-col justify-between group active:scale-98"
                >
                  <div className="bg-gradient-to-tr from-green-500 to-emerald-600 h-32 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                    🧩
                  </div>
                  <div className="p-5 space-y-2">
                    <header className="flex justify-between items-center">
                      <h4 className="font-extrabold text-slate-800 text-md leading-none">Blood Flow Puzzle</h4>
                      <span className="text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-100 uppercase px-2.5 py-0.5 rounded-full">
                        Capillary Puzzle
                      </span>
                    </header>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                      Align capillary vessel pipes, deploy liquid water flasks & daily medications to dissolve rigid vaso-occlusive clumps. Restrict blockages & deliver oxygen!
                    </p>
                    <button className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                      {t.btnPlay}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* GAME 2 CARD: RED LIFE CELL RACER */}
                <div 
                  onClick={() => { setActiveGameId('red-cell-racer'); setIsDailyMode(false); }}
                  className="bg-white rounded-[2rem] border border-gray-150 hover:border-red-300 transition-all cursor-pointer shadow-md overflow-hidden flex flex-col justify-between group active:scale-98"
                >
                  <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 h-32 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                    🏎️
                  </div>
                  <div className="p-5 space-y-2">
                    <header className="flex justify-between items-center">
                      <h4 className="font-extrabold text-slate-800 text-md leading-none">Red Cell Racer</h4>
                      <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase px-2.5 py-0.5 rounded-full">
                        Action Side-scroller
                      </span>
                    </header>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                      Guide the flexible round avatar disc down 3 capillary channels. Collect daily folic acid & droplets while escaping icy drafts which narrow vascular tunnels!
                    </p>
                    <button className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                      {t.btnPlay}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* GAME 3 CARD: GENE JOURNEY DUPLEX */}
                <div 
                  onClick={() => { setActiveGameId('gene-journey'); setIsDailyMode(false); }}
                  className="bg-white rounded-[2rem] border border-gray-150 hover:border-red-300 transition-all cursor-pointer shadow-md overflow-hidden flex flex-col justify-between group active:scale-98"
                >
                  <div className="bg-gradient-to-tr from-indigo-500 to-purple-650 h-32 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                    🧬
                  </div>
                  <div className="p-5 space-y-2">
                    <header className="flex justify-between items-center">
                      <h4 className="font-extrabold text-slate-800 text-md leading-none">Gene Journey</h4>
                      <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase px-2.5 py-0.5 rounded-full">
                        Clinical Science
                      </span>
                    </header>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                      Ascend chromosomal double helices, test Punnett square family outcomes, and compose high-impact awareness posters in the nucleus creative studio!
                    </p>
                    <button className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                      {t.btnPlay}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            // ACTIVE INDIVIDUAL GAME SHELL CONTAINER
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border">
                <span className="text-xs font-black uppercase text-gray-500">Live Simulation Chapter Session</span>
                <button
                  onClick={() => { setActiveGameId(null); setIsDailyMode(false); }}
                  className="py-1.5 px-3 bg-white border hover:bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors select-none cursor-pointer"
                >
                  {t.closeGame}
                </button>
              </div>

              {activeGameId === 'blood-flow-puzzle' && (
                <BloodFlowPuzzle 
                  language={language}
                  textScale={textScale}
                  colorBlindMode={colorBlindMode}
                  onXPUnlocked={handleXPGained}
                  isDailyChallenge={isDailyMode}
                />
              )}

              {activeGameId === 'red-cell-racer' && (
                <RedCellRacer 
                  language={language}
                  textScale={textScale}
                  colorBlindMode={colorBlindMode}
                  onXPUnlocked={handleXPGained}
                  isDailyChallenge={isDailyMode}
                />
              )}

              {activeGameId === 'gene-journey' && (
                <GeneJourney 
                  language={language}
                  textScale={textScale}
                  colorBlindMode={colorBlindMode}
                  onXPUnlocked={handleXPGained}
                  isDailyChallenge={isDailyMode}
                />
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default GamesHub;
