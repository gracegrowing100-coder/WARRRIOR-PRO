import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Award, Lock, Shield, Eye, Heart, Zap, 
  User, CheckCircle, Info, Trash2, HeartHandshake 
} from 'lucide-react';
import { motion } from 'motion/react';
import { firebaseService } from '../../services/firebaseService';
import { auth } from '../../firebase-init';

interface Skin {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  xpRequired: number;
  unlocked: boolean;
  color: string;
}

const CELL_SKINS: Skin[] = [
  { id: 'standard', name: 'Flexible Survivor', desc: 'A typical healthy biconcave disc designed to slide through microcapillaries.', emoji: '🔴', xpRequired: 0, unlocked: true, color: 'from-red-500 to-red-650' },
  { id: 'folic', name: 'Folic Defender', desc: 'Fortified with rapid vitamins, boosting continuous cellular reproduction.', emoji: '💊', xpRequired: 100, unlocked: false, color: 'from-emerald-500 to-teal-600' },
  { id: 'hydration', name: 'Hydration Knight', desc: 'Diluted with high fluid volumes, reducing adhesive microclot risks.', emoji: '💧', xpRequired: 250, unlocked: false, color: 'from-blue-500 to-indigo-600' },
  { id: 'crispr', name: 'CRISPR Commando', desc: 'Base edited with Vertex-targeted molecular therapy to retain stability.', emoji: '🧬', xpRequired: 450, unlocked: false, color: 'from-purple-500 to-pink-600' }
];

interface Badge {
  id: string;
  name: string;
  desc: string;
  task: string;
  emoji: string;
  unlocked: boolean;
}

const MEDICAL_BADGES: Badge[] = [
  { id: 'hydration_master', name: 'Water Mastery', desc: 'Maintained 100% hydration in racer levels', task: 'Reach 200m in racer tracks with high fluid stats.', emoji: '🏆', unlocked: true },
  { id: 'dna_doctor', name: 'DNA Doctor', desc: 'Aligned original nucleotide codon chains', task: 'Complete HBB sequencing in gene levels.', emoji: '🎖️', unlocked: false },
  { id: 'micro_architect', name: 'Capillary Architect', desc: 'Fully restored microcaps blockages', task: 'Remove all Sickle obstruction clusters in puzzles.', emoji: '🏅', unlocked: false },
  { id: 'warrior_shield', name: 'Warrior solidarity', desc: 'Supported campaigns of SCD activism', task: 'Compose a powerful advocacy awareness poster.', emoji: '🛡️', unlocked: false }
];

interface SkinsAndRewardsProps {
  language: string;
  textScale: 'normal' | 'large' | 'xl';
  onEquipSkin: (skinId: string) => void;
  activeSkinId: string;
}

const getLocalizedData = (lang: string) => {
  switch (lang) {
    case 'pidgin':
      return {
        rankTitle: "Unified Progression Rank",
        desc: "Increase your Strength Points (XP) by mastering quizzes, flow puzzles, and genomic adventure runs.",
        totalXP: "Total strength score",
        nextRank: "Next rank",
        avatarTitle: "Avatar selection locker",
        unlocksTitle: "Unlocks & Achievements",
        unlockedLabel: "Active/Unlocked",
        lockedLabel: "Locked",
        equipBtn: "Equip Avatar",
        equippedBtn: "Equipped",
        unlockAt: "Unlock at",
        challengeLabel: "Challenge",
        skins: [
          { id: 'standard', name: 'Flexible Survivor', desc: 'Typical healthy round cell wey dey slide well inside capillaries.' },
          { id: 'folic', name: 'Folic Defender', desc: 'Boosted with high vitamin levels to reproduce new cells quick' },
          { id: 'hydration', name: 'Hydration Knight', desc: 'Full of hydration water to prevent sticky microclots.' },
          { id: 'crispr', name: 'CRISPR Commando', desc: 'DNA edited model wey dey strong and stable.' }
        ],
        badges: [
          { id: 'hydration_master', name: 'Water Mastery', desc: 'Maintained 100% hydration in racer levels', task: 'Reach 200m in racer tracks with high fluid stats.' },
          { id: 'dna_doctor', name: 'DNA Doctor', desc: 'Aligned original nucleotide codon chains', task: 'Complete HBB sequencing in gene levels.' },
          { id: 'micro_architect', name: 'Capillary Architect', desc: 'Fully restored microcaps blockages', task: 'Remove all Sickle obstruction clusters in puzzles.' },
          { id: 'warrior_shield', name: 'Warrior solidarity', desc: 'Supported campaigns of SCD activism', task: 'Compose a powerful advocacy awareness poster.' }
        ],
        ranks: {
          general: '🎖️ Genome General',
          colonel: '🏅 Capillary Colonel',
          marshall: '🛡️ Microcirculation Marshall',
          novice: '🌱 Novice Cell Warrior'
        }
      };
    case 'yoruba':
      return {
        rankTitle: "Ipele Ipò Ìlọsíwájú Alágbára",
        desc: "Lọ́ títí kí o pọ̀ sí i ní Àmì Agbára (XP) nípa gbígbá àwọn ibeere, àpòpọ̀ eré, àti ìrìn-àjò apilẹ̀ṣe.",
        totalXP: "Àpapọ̀ Agbára",
        nextRank: "Ìpò Tókàn",
        avatarTitle: "Abẹ́rẹ́ Àṣàyàn Avatar",
        unlocksTitle: "Àwọn Àmì-ẹ̀yẹ & Àṣeyọrí",
        unlockedLabel: "Ṣíṣí",
        lockedLabel: "Títì",
        equipBtn: "Gbé Avatar Wọ̀",
        equippedBtn: "Ti Gbé Wọ̀",
        unlockAt: "Ṣíṣí ní",
        challengeLabel: "Ajáṣe",
        skins: [
          { id: 'standard', name: 'Olùgbàlà Sẹ́ẹ̀lì', desc: 'Sẹ́ẹ̀lì pupa tó dánmọ́ran látí máa ṣàn fásá láàárín kòbògì.' },
          { id: 'folic', name: 'Asòfin Vitamin', desc: 'Gba Vitamin tó pọ̀ fún ìmúpadàbọ̀ sẹ́ẹ̀lì kánkán.' },
          { id: 'hydration', name: 'Olùgbèjà Omi', desc: 'Kún fún omi tó dánmọ́ran láti dènà sẹ́ẹ̀lì dí mọ́ra.' },
          { id: 'crispr', name: 'Ajagun CRISPR', desc: 'Sẹ́ẹ̀lì atúnṣe tó lágbára láti dènà àrùn sẹ́ẹ̀lì rírẹ́.' }
        ],
        badges: [
          { id: 'hydration_master', name: 'Olùṣàkóso Omi', desc: 'O pa omi 100% mọ́ ninu eré dunjú', task: 'Tẹ 200m ninu eré ọ̀nà pẹlu omi pupọ.' },
          { id: 'dna_doctor', name: 'Dókítà DNA', desc: 'O tún àwọn apilẹ̀ṣe sẹ́ẹ̀lì ṣe dunjú rẹ', task: 'Parí atúnṣe HBB ninu ipele apilẹ̀ṣe.' },
          { id: 'micro_architect', name: 'Atúnṣe Kòbògì', desc: 'O sọ gbogbo kòbògì di tuntun láìsí ìdísí kankan', task: 'Palẹ̀ gbogbo sẹ́ẹ̀lì tó dí ọ̀nà kúrò ninu eré àpòpọ̀.' },
          { id: 'warrior_shield', name: 'Asà Àkọni', desc: 'O polongo ìpolongo agbára sẹ́ẹ̀lì rírẹ́ sínú fọ́nrán', task: 'Ṣe àpẹẹrẹ àwọn ìpolongo sẹ́ẹ̀lì rírẹ́.' }
        ],
        ranks: {
          general: '🎖️ Ọ̀gá Apilẹ̀ṣe',
          colonel: '🏅 Alákòóso Kòbògì',
          marshall: '🛡️ Atọ́nisọ́nà Ìṣàn',
          novice: '🌱 Akọni Sẹ́ẹ̀lì Tuntun'
        }
      };
    case 'hausa':
      return {
        rankTitle: "Babbar Darajar Jarumi",
        desc: "Kara Makin Karfi (XP) ta hanyar yin tambayoyi, wasan motsi, da gasar kwayoyin halitta.",
        totalXP: "Makin Karfi Gaba Daya",
        nextRank: "Daraja ta Gaba",
        avatarTitle: "Wurin Zabar Avatar",
        unlocksTitle: "Nasarori & Lambobin Yabo",
        unlockedLabel: "An Bude",
        lockedLabel: "A Toshe",
        equipBtn: "Sanya Avatar",
        equippedBtn: "An Sanya",
        unlockAt: "Bude a",
        challengeLabel: "Kalubale",
        skins: [
          { id: 'standard', name: 'Lafiyayyen Survivor', desc: 'Cikakkiyar lafiyayyar kwayar halitta wacce ke yawo a capillary.' },
          { id: 'folic', name: 'Mai Kare Folic', desc: 'An inganta shi da bitamin don sabunta kwayoyin halitta da sauri.' },
          { id: 'hydration', name: 'Jarumin Ruwa', desc: 'Yana rage hadarin toshewar hanyar jini ta hanyar ruwa.' },
          { id: 'crispr', name: 'Kwamandan CRISPR', desc: 'Samfurin da aka gyara kwayoyin halittarsa don tabbatar da kwanciyar hankali.' }
        ],
        badges: [
          { id: 'hydration_master', name: 'Kwararren Ruwa', desc: 'Tabbatar da 100% na ruwa a jiki yayin tseren jini', task: 'Isa mita 200 a tseren jini tare da maki mai yawa.' },
          { id: 'dna_doctor', name: 'Likitocin DNA', desc: 'Gyaran kwayoyin halittar codon chain yadda ya kamata', task: 'Kammala tsarin HBB a matakin kwayoyin halitta.' },
          { id: 'micro_architect', name: 'Ginin Hanyar Jini', desc: 'Gyara dukkan bututun jini da suka lalace', task: 'Cire dukkan toshewar sickle cell a wasan.' },
          { id: 'warrior_shield', name: 'Garkuwar Jarumi', desc: 'Tallafawa yakin neman zabe da wayar da kan mutane game da SCD', task: 'Tsara bango mai karfi don wayar da kai.' }
        ],
        ranks: {
          general: '🎖️ Janar din Kwayar Halitta',
          colonel: '🏅 Kanar din Hanyoyin Jini',
          marshall: '🛡️ Marshal din Zagayen Jini',
          novice: '🌱 Sabon Jarumin Kwayar Halitta'
        }
      };
    case 'igbo':
      return {
        rankTitle: "Ọkwá Ọganihu Ndị Dike",
        desc: "Mee ka Akara Ike gị (XP) rigo site na ịrụzu quizzes, flow puzzles, na egwuregwu gbasara jeni.",
        totalXP: "Akara Agbara Niile",
        nextRank: "Ọkwá na-abịa",
        avatarTitle: "Locker Nhọrọ Avatar",
        unlocksTitle: "Ihe Ndị E wezụgala & Ọrụ Ị Rụrụ",
        unlockedLabel: "Emepere",
        lockedLabel: "Emechiri",
        equipBtn: "Jiri Avatar a",
        equippedBtn: "Ejirila ya",
        unlockAt: "Mepee na",
        challengeLabel: "Ihe nlere anya",
        skins: [
          { id: 'standard', name: 'Flexible Survivor', desc: 'Ụdị sél pupa dị mma nke na-asọ site capillaries nwere nchebe.' },
          { id: 'folic', name: 'Folic Defender', desc: 'Ejiri vitamin kwadoo ya ka o mepụta sél ọhụrụ ngwa ngwa.' },
          { id: 'hydration', name: 'Hydration Knight', desc: 'Mmiri zuru ezu n\'ahụ na-egbochi mkpọchi ọbara.' },
          { id: 'crispr', name: 'CRISPR Commando', desc: 'Ụdị sél a gbanwere jeni ya maka ahụike dị mma.' }
        ],
        badges: [
          { id: 'hydration_master', name: 'Onye Na-achịkwa Mmiri', desc: 'Nọgide na mmiri 100% na racer egwuregwu', task: 'Gaa 200m na racer track nwere oke mmiri doro anya.' },
          { id: 'dna_doctor', name: 'Doctor DNA', desc: 'Haziri codon nucleotide nke ọma', task: 'Rụchaa nsogbu HBB na gene levels.' },
          { id: 'micro_architect', name: 'Capillary Architect', desc: 'Eweghachila mkpọchi ọbara niile n\'ọrụ', task: 'Kpochapụ mkpọmkpọ sél ahụ mechiri ụzọ.' },
          { id: 'warrior_shield', name: 'Garkuwa mberede', desc: 'Kwadoko mgbasa ozi mgbasa ozi SCD', task: 'Mepụta mgbasa ozi mkpọm sél dị egwu.' }
        ],
        ranks: {
          general: '🎖️ General Ndị Jeni',
          colonel: '🏅 Colonel Capillary',
          marshall: '🛡️ Marshall Mmiri Ọbara',
          novice: '🌱 Onye Ọhụrụ Okike Sél'
        }
      };
    default:
      return {
        rankTitle: "Unified Progression Rank",
        desc: "Increase your Strength Points (XP) by mastering quizzes, flow puzzles, and genomic adventure runs.",
        totalXP: "Total strength score",
        nextRank: "Next rank",
        avatarTitle: "Avatar selection locker",
        unlocksTitle: "Unlocks & Achievements",
        unlockedLabel: "Active",
        lockedLabel: "Locked",
        equipBtn: "Equip Avatar",
        equippedBtn: "Equipped",
        unlockAt: "Unlock at",
        challengeLabel: "Challenge",
        skins: [
          { id: 'standard', name: 'Flexible Survivor', desc: 'A typical healthy biconcave disc designed to slide through microcapillaries.' },
          { id: 'folic', name: 'Folic Defender', desc: 'Fortified with rapid vitamins, boosting continuous cellular reproduction.' },
          { id: 'hydration', name: 'Hydration Knight', desc: 'Diluted with high fluid volumes, reducing adhesive microclot risks.' },
          { id: 'crispr', name: 'CRISPR Commando', desc: 'Base edited with Vertex-targeted molecular therapy to retain stability.' }
        ],
        badges: [
          { id: 'hydration_master', name: 'Water Mastery', desc: 'Maintained 100% hydration in racer levels', task: 'Reach 200m in racer tracks with high fluid stats.' },
          { id: 'dna_doctor', name: 'DNA Doctor', desc: 'Aligned original nucleotide codon chains', task: 'Complete HBB sequencing in gene levels.' },
          { id: 'micro_architect', name: 'Capillary Architect', desc: 'Fully restored microcaps blockages', task: 'Remove all Sickle obstruction clusters in puzzles.' },
          { id: 'warrior_shield', name: 'Warrior solidarity', desc: 'Supported campaigns of SCD activism', task: 'Compose a powerful advocacy awareness poster.' }
        ],
        ranks: {
          general: '🎖️ Genome General',
          colonel: '🏅 Capillary Colonel',
          marshall: '🛡️ Microcirculation Marshall',
          novice: '🌱 Novice Cell Warrior'
        }
      };
  }
};

const SkinsAndRewards: React.FC<SkinsAndRewardsProps> = ({ 
  language, 
  textScale, 
  onEquipSkin, 
  activeSkinId 
}) => {
  const [xp, setXP] = useState<number>(0);
  const [skins, setSkins] = useState<Skin[]>(CELL_SKINS);
  const [badges, setBadges] = useState<Badge[]>(MEDICAL_BADGES);

  const locD = getLocalizedData(language);

  // Load XP from DB/Local storage on mount
  useEffect(() => {
    const fetchUserStats = async () => {
      const user = auth.currentUser;
      let userXP = 0;
      if (user) {
        const profile = await firebaseService.getUserProfile(user.uid);
        userXP = profile?.xp || 0;
      } else {
        userXP = Number(localStorage.getItem('warrior_xp') || '0');
      }

      setXP(userXP);

      // Map skins unlocking logic based on XP limits
      setSkins(prev => prev.map(s => ({
        ...s,
        unlocked: userXP >= s.xpRequired
      })));

      // Map badges unlock triggers
      setBadges(prev => prev.map(b => {
        if (b.id === 'dna_doctor' && userXP >= 150) return { ...b, unlocked: true };
        if (b.id === 'micro_architect' && userXP >= 300) return { ...b, unlocked: true };
        if (b.id === 'warrior_shield' && userXP >= 400) return { ...b, unlocked: true };
        return b;
      }));
    };

    fetchUserStats();
  }, [activeSkinId]);

  // Determine current active rank
  const getWarriorRank = (points: number) => {
    if (points >= 400) return { label: locD.ranks.general, limit: 1000 };
    if (points >= 250) return { label: locD.ranks.colonel, limit: 400 };
    if (points >= 100) return { label: locD.ranks.marshall, limit: 250 };
    return { label: locD.ranks.novice, limit: 100 };
  };

  const rankInfo = getWarriorRank(xp);
  const pointsToNext = Math.max(0, rankInfo.limit - xp);
  const progressPercent = Math.min(100, (xp / rankInfo.limit) * 100);

  return (
    <div className="space-y-6">
      
      {/* Upper rank progression visual card */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 relative border-4 border-slate-950 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl">🛡️</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">{locD.rankTitle}</span>
            <h3 className="text-2xl font-black">{rankInfo.label}</h3>
            <p className="text-xs text-gray-300">
              {locD.desc}
            </p>
          </div>

          <div className="space-y-3 bg-slate-850 p-4 rounded-3xl border border-slate-800">
            <div className="flex justify-between text-xs font-bold font-mono">
              <span className="text-indigo-300">{locD.totalXP}: {xp} XP</span>
              <span className="text-gray-400">{locD.nextRank}: {pointsToNext} XP</span>
            </div>
            {/* Level progression bar */}
            <div className="h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Customized skins selection LHS */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-slate-50 border border-gray-150 p-4 rounded-2xl flex gap-1.5 items-center">
            <Sparkles size={16} className="text-blue-500" />
            <span className="text-xs font-black uppercase text-slate-500">{locD.avatarTitle}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {skins.map((skin) => {
              const isEquipped = activeSkinId === skin.id;
              const mappedSkin = locD.skins.find(item => item.id === skin.id) || skin;
              
              return (
                <div 
                  key={skin.id}
                  className={`border rounded-3xl p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                    isEquipped 
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-4 ring-indigo-50' 
                      : skin.unlocked 
                        ? 'bg-white border-gray-200 hover:border-gray-300' 
                        : 'bg-gray-50 border-gray-150 opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-3xl bg-gray-100/50 w-12 h-12 rounded-xl flex items-center justify-center">
                        {skin.emoji}
                      </span>
                      {skin.unlocked ? (
                        <span className="text-[8px] bg-green-50 text-green-700 border border-green-200 font-extrabold uppercase px-2 py-0.5 rounded-full">
                          {locD.unlockedLabel}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-[8px] bg-slate-900 text-white font-extrabold uppercase px-2 py-0.5 rounded-full">
                          <Lock size={10} />
                          <span>{locD.unlockAt} {skin.xpRequired} XP</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-800 leading-none">{mappedSkin.name}</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-semibold mt-1">
                        {mappedSkin.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-55 mt-4">
                    {skin.unlocked ? (
                      <button
                        onClick={() => {
                          if (skin.unlocked) {
                            onEquipSkin(skin.id);
                            localStorage.setItem('warrior_active_skin', skin.id);
                            try {
                              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                              if (AudioCtx) {
                                const ctx = new AudioCtx();
                                const osc = ctx.createOscillator();
                                const gain = ctx.createGain();
                                osc.connect(gain); gain.connect(ctx.destination);
                                osc.frequency.setValueAtTime(440, ctx.currentTime);
                                gain.gain.setValueAtTime(0.04, ctx.currentTime);
                                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                                osc.start(); osc.stop(ctx.currentTime + 0.1);
                              }
                            } catch(e){}
                          }
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                          isEquipped 
                            ? 'bg-indigo-600 text-white font-black' 
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isEquipped ? locD.equippedBtn : locD.equipBtn}
                      </button>
                    ) : (
                      <div className="w-full py-2.5 bg-gray-200 text-center text-gray-400 font-black rounded-xl text-[10px] uppercase tracking-wider">
                        {locD.lockedLabel}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Accolades checklist RHS */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-50 border border-gray-150 p-4 rounded-2xl flex gap-1.5 items-center">
            <Award size={16} className="text-amber-500" />
            <span className="text-xs font-black uppercase text-slate-500">{locD.unlocksTitle}</span>
          </div>

          <div className="space-y-3">
            {badges.map((b) => {
              const mappedBadge = locD.badges.find(item => item.id === b.id) || b;
              
              return (
                <div 
                  key={b.id}
                  className={`p-4 rounded-3xl border flex gap-3.5 items-start ${
                    b.unlocked 
                      ? 'bg-amber-50/40 border-amber-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border text-2xl ${
                    b.unlocked 
                      ? 'bg-amber-100/50 border-amber-200 text-amber-600' 
                      : 'bg-gray-100 border-gray-150 text-gray-400'
                  }`}>
                    {b.unlocked ? b.emoji : '🔒'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-xs font-black text-slate-800">{mappedBadge.name}</h5>
                      {b.unlocked && (
                        <span className="text-[7px] font-black bg-amber-150 text-amber-700 border border-amber-200 px-1 py-0.2 rounded uppercase tracking-wider">
                          {locD.unlockedLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-normal font-semibold">
                      {b.unlocked ? mappedBadge.desc : `${locD.challengeLabel}: ${mappedBadge.task}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};

export default SkinsAndRewards;
