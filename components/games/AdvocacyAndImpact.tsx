import React, { useState } from 'react';
import { 
  Share2, Shield, HeartHandshake, BookOpen, Clock, 
  Sparkles, Check, Flame, MessageCircle, AlertCircle, Award 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CampaignTemplate {
  title: string;
  myth: string;
  reality: string;
  colorClass: string;
}

const getLocalizedAdvocacyData = (lang: string) => {
  switch (lang) {
    case 'pidgin':
      return {
        composerTag: "Activism Campaign Maker",
        chooseTopic: "1. Select awareness topic",
        stampBadge: "2. Select stamp icon",
        composerBorder: "3. Card border style",
        btnCopy: "COPY CAMPAIGN CONTENT",
        btnCopied: "CAMPAIGN COPIED FINE!",
        liveFeed: "Infographic live view",
        campaignHeader: "Warrior Support Campaign",
        verifiedLabel: "Checked by global medical guidelines",
        pledgeTag: "Donation & Love Portal",
        pledgeTitle: "Support a Warrior (Simulated Pledge)",
        pledgeDesc: "Give help to support medical care, sponsor screening kits, and break global stigmas by making a monthly clinical contribution pledge!",
        pledgeSuccessTitle: "Warrior Supporter Badge",
        pledgeSuccessDesc: "You committed to sponsoring:",
        monthLabel: "Month",
        makeRealImpact: "How to give real help",
        educationSimulationNotice: "This donation portal is an educational simulation. To help real warriors, visit official non-profits:",
        clinicalTag: "Clinical Sources & Medical Index",
        clinicalDisclaimer: "Disclaimer: This app is made for learning. All medical details are from standard global health materials:",
        sourceA: "Cerebral stroke prevention protocols — NIH",
        sourceB: "Autosomal inheritance charts — WHO",
        sourceC: "SCD Crisis Care & Hydroxyurea efficacy files — CDC",
        sourceD: "CRISPR gene therapy approvals — ASH",
        perks: {
          5: "Cold water flask bottles for small pickin",
          15: "Daily folic acid packets",
          45: "Brain vessel scans to prevent stroke"
        },
        templates: [
          {
            title: "De contagion lie don scatter! 🧬",
            myth: "DEM SAY: Person fit catch sickle cell by touching or playing together.",
            reality: "TRUTH: Sickle cell is only from parents genes. E no fit catch you by body contact!",
            colorClass: "from-blue-600 to-indigo-800"
          },
          {
            title: "How cold water squeeze vessels ❄️",
            myth: "DEM SAY: Cold weather no dey block blood pathways.",
            reality: "TRUTH: Cold breeze dey squeeze capillaries, trapping sickle cells inside vector pathways.",
            colorClass: "from-teal-600 to-emerald-800"
          },
          {
            title: "Water plasma garkuwa 💧",
            myth: "DEM SAY: Water is just ordinary drinking advice.",
            reality: "TRUTH: Drinking water expands blood volume to stop cell blockages.",
            colorClass: "from-purple-650 to-pink-700"
          }
        ]
      };
    case 'yoruba':
      return {
        composerTag: "Alákòso Ìpolongo Atògán",
        chooseTopic: "1. Yan àkòrí ìmọ̀ràn",
        stampBadge: "2. Tẹ bọ́tìnnì ohun àmì",
        composerBorder: "3. Irú tẹ́ńpìlì ara",
        btnCopy: "DA AWỌN Ọ̀RỌ̀ KỌ",
        btnCopied: "A TI DA KỌ!",
        liveFeed: "Ibi ìyàwò pẹpẹ gidi",
        campaignHeader: "Ìpolongo Atilẹ́yìn Akọni",
        verifiedLabel: "Gẹ́gẹ́ bí ìtọ́sọ́nà ìṣègùn àgbáyé",
        pledgeTag: "Ọ̀nà Atilẹ́yìn & Ìfẹ́ Àfarajìn",
        pledgeTitle: "Ṣe Atilẹ́yìn fún Akọni (Pledge)",
        pledgeDesc: "Fún àwọn ibùdó ìṣègùn ní agbára, ṣètọ́jú screening àwọn ọmọ ọwọ́, pèsè omi, kó o sì pa stigma run nípa pípinu àtinúdá lóòṣùṣù!",
        pledgeSuccessTitle: "Wàhálà Atilẹ́yìn Akọni Ti Parí",
        pledgeSuccessDesc: "O pinu láti ṣe atilẹ́yìn fún:",
        monthLabel: "Oṣù",
        makeRealImpact: "Ṣe Atilẹ́yìn Gidi ní Ayé",
        educationSimulationNotice: "Simulaṣion ẹran-ara ni portal yìí. Láti ràn wọ́n lọ́wọ́ gidi kàn sí àwọn àjọ wọ̀nyí:",
        clinicalTag: "Ìtọ́ka Ìṣáájú Ìṣègùn Rere",
        clinicalDisclaimer: "Àkíyèsí: Fún ètò ẹ̀kọ́ nìkan ni ohun èlò yìí wà. Àwọn ìtọ́sọ́nà ìṣègùn gidi wáyé láti:",
        sourceA: "Ìlànà ìdènà stroke ọpọlọ — NIH",
        sourceB: "Àtẹ jogún-bí-jogún — WHO",
        sourceC: "Ètò ìṣègùn Hydroxyurea sẹ́ẹ̀lì rírẹ́ — CDC",
        sourceD: "Atúnṣe jeni CRISPR ti a fọwọ́sí — ASH",
        perks: {
          5: "Igo omi dídùn fún àwọn ọmọdé",
          15: "Àpò egbògi folic acid ojoojúmọ́",
          45: "Àyẹ̀wò Doppler stroke ọpọlọ"
        },
        templates: [
          {
            title: "Pípa Irọ́ Ràn-mọ́-ràn Run 🧬",
            myth: "IRỌ́: O le gba àrùn sẹ́ẹ̀lì rírẹ́ nípa sísúnmọ́ ẹlòmíràn lọ́fẹ̀ẹ́.",
            reality: "ÒTÍTỌ́: Apilẹ̀ṣe jogún-bí-jogún ni sẹ́ẹ̀lì rírẹ́ — kò ní ràn mọ́ ènìyàn mọ́ lójúmọ́.",
            colorClass: "from-blue-600 to-indigo-800"
          },
          {
            title: "Ewu Òtútù sí Kòbògì Ẹ̀jẹ̀ ❄️",
            myth: "IRỌ́: Òtútù kò ní ipá kankan lórí kòbògì sẹ́ẹ̀lì.",
            reality: "ÒTÍTỌ́: Òtútù ń mú kòbògì sẹ́ẹ̀lì há mọ́ra, èyí ń dènà sísan ẹ̀jẹ̀, ó sì ń dá ìrora gidi sílẹ̀.",
            colorClass: "from-teal-600 to-emerald-800"
          },
          {
            title: "Omi gẹ́gẹ́ bí Aláàbò Ara 💧",
            myth: "IRỌ́: Mímu omi ojoojúmọ́ jẹ́ ọ̀rọ̀ ọ̀sán lásán.",
            reality: "ÒTÍTỌ́: Mímu omi tó pọ̀ ń jẹ́ kí ẹ̀jẹ̀ fẹ́rẹ́, tí ó sì ń dènà mímú sẹ́ẹ̀lì há nínú kòbògì.",
            colorClass: "from-purple-650 to-pink-700"
          }
        ]
      };
    case 'hausa':
      return {
        composerTag: "Tsarin Yakin Neman Wayar Da Kai",
        chooseTopic: "1. Zabi sashin wayar da kai",
        stampBadge: "2. Zabi Tambari",
        composerBorder: "3. Tsarin Gefen Kati",
        btnCopy: "KWAFI BAYANAN YAKIN",
        btnCopied: "AN KWAFA SAMMAI!",
        liveFeed: "Wurin Duba Kati",
        campaignHeader: "Yakin Neman Taimakon Jarumai",
        verifiedLabel: "Tabbatacce ne bisa ka'idojin asibiti na duniya",
        pledgeTag: "Hanyar Taimako da Hadin Kai",
        pledgeTitle: "Taimaki Jarumi (Gwajin Alkawari)",
        pledgeDesc: "Karfafa asibitoci, dauki nauyin gwajin jarirai, samar da kayan shan ruwa don nuna hadin kai!",
        pledgeSuccessTitle: "An Karbi Alkawarin Taimako",
        pledgeSuccessDesc: "Kun yi alkawarin bada nauyin:",
        monthLabel: "Wata",
        makeRealImpact: "Taimakawa a Gaske",
        educationSimulationNotice: "Wannan tsarin don koyarwa ne kawai. Don taimaka wa jarumai a gaske, tuntubi kungiyoyin asibiti na gaske:",
        clinicalTag: "Tushen Bayanan Lafiya",
        clinicalDisclaimer: "Disclaimer: Wannan manhaja don koyarwa ce. Duk bayanan magani sun fito ne daga amintattun hukumomin lafiya na duniya baki daya:",
        sourceA: "Kariya daga cutar shanyewar tsoka — NIH",
        sourceB: "Tsarin gado na kwayoyin halitta — WHO",
        sourceC: "Maganin Hydroxyurea na jini — CDC",
        sourceD: "Yarda da maganin CRISPR na kwayoyin halitta — ASH",
        perks: {
          5: "Kayan dumin ruwa domin kananan yara",
          15: "Maganin folic acid na kowace rana",
          45: "Gwajin Doppler don hana shanyewar jiki"
        },
        templates: [
          {
            title: "Karyata Tunanin cewa jini na Yaduwa 🧬",
            myth: "TASSARI: Ana iya daukar cutar Sickle Cell ta hanyar mu'amala da wani.",
            reality: "GINKI: Sickle Cell cuta ce ta gado daga kwayoyin iyaye, ba ta yaduwa ta hanyar taba juna.",
            colorClass: "from-blue-600 to-indigo-800"
          },
          {
            title: "Hadarin Sanyi ga Hanyoyin Jini ❄️",
            myth: "TASSARI: Sanyi ba shi da wani illa ga hanyoyin kwararar jini.",
            reality: "GINKI: Sanyi yana sanya hanyoyin jini matsewa, wanda ke daskare tsofaffin kwayoyin jini da haifar da ciwon gwiwa.",
            colorClass: "from-teal-605 to-emerald-705"
          },
          {
            title: "Yawan shan Ruwa garkuwar Jini 💧",
            myth: "TASSARI: Shan ruwa shawara ce ta kasashen waje kawai.",
            reality: "GINKI: Ruwa yana siranta jini sosai don hana tsofaffin kwayoyin jini daskarewa.",
            colorClass: "from-purple-650 to-pink-700"
          }
        ]
      };
    case 'igbo':
      return {
        composerTag: "Onye Nchịkọta Mgbasa Ozi",
        chooseTopic: "1. Họrọ isi okwu mgbasa ozi",
        stampBadge: "2. Họrọ akara",
        composerBorder: "3. Akara border kaadị",
        btnCopy: "KWAJIKWA AKAN AKWỤKWỌ",
        btnCopied: "AKWỤKWỌ COPIED ỌMA!",
        liveFeed: "Ihu nyocha mgbasa ozi",
        campaignHeader: "Mgbasa Ozi Nkwado Dike",
        verifiedLabel: "Enyochara site na ntuziaka ahụike ụwa",
        pledgeTag: "Portal nke Onyinye mmesapụ aka",
        pledgeTitle: "Kwado Onye Ọrịa Dike (Pledge)",
        pledgeDesc: "Nye Clinics ume, kwado infant screening n'efu, ma nyere ọrụ ebere aka site n'onyinye mmesapụ aka kwa ọnwa!",
        pledgeSuccessTitle: "Akwụkwọ Nkwado dọkịta nke Dike",
        pledgeSuccessDesc: "Ị kpebiri ịkwado:",
        monthLabel: "Ọnwa",
        makeRealImpact: "Mee Ezigbo Nkwado n'Ụwa",
        educationSimulationNotice: "Portal a bụ simulated maka agụmakwụkwọ. Iji kwado ndị ọrịa dike n'ezie, gaa na:",
        clinicalTag: "Isi mmalite Ahụike na Ntuziaka anyị",
        clinicalDisclaimer: "Àkíyèsí: Ngwa a bụ naanị maka agụmakwụkwọ. Ntuziaka ahụike niile sitere na:",
        sourceA: "Usoro mgbochi strok ụbụrụ — NIH",
        sourceB: "Chaati kachasị elu nke ketara eketa — WHO",
        sourceC: "Usoro nlekọta Hydroxyurea sickle cell — CDC",
        sourceD: "Nkwado mmezi CRISPR jeni — ASH",
        perks: {
          5: "Thermal Flask mmiri ọkụ maka ụmụaka",
          15: "Folic Acid ọgwụ maka ịmụ anya kwa ụbọchị",
          45: "Nyocha Transcranial Doppler Stroke"
        },
        templates: [
          {
            title: "Kpochapụ Ụgha anyị gbasara Infectious 🧬",
            myth: "ỤGHA: Ị nwere ike isi n'aka onye ọzọ rịa ọrịa sickle cell na mmekọrịta sọshal.",
            reality: "EZIOKWU: Ọrịa a dake efe efe, jeni ketara eketa site n'aka nne na nna.",
            colorClass: "from-blue-600 to-indigo-800"
          },
          {
            title: "Ewu nke Oyi pụta na capillaries ❄️",
            myth: "ỤGHA: Oyi adake afụ ụzọ ọbara capillary ọ bụla.",
            reality: "EZIOKWU: Oyi na-eme vasoconstriction nke na-enye mgbachigala capillary mberede ugbu a.",
            colorClass: "from-teal-605 to-emerald-705"
          },
          {
            title: "Nchebe Plasma site n'ịụ Mmiri 💧",
            myth: "ỤGHA: Ịụ mmiri bụ naanị ezi ndụmọdụ casually.",
            reality: "EZIOKWU: Mmiri na-eme ka ọbara na-asọ nke ọma ma na-ezere blockage ọbara.",
            colorClass: "from-purple-650 to-pink-700"
          }
        ]
      };
    default:
      return {
        composerTag: "Activism Campaign Composer",
        chooseTopic: "1. Choose awareness topic",
        stampBadge: "2. Stamp Badge",
        composerBorder: "3. Composer Card border",
        btnCopy: "COPY COMPILER WISE CONTENT",
        btnCopied: "COMPOSER BLOCK COPIED!",
        liveFeed: "Infographic live feed",
        campaignHeader: "Support & Warrior Campaign",
        verifiedLabel: "Verified by global medical guidelines",
        pledgeTag: "Donation & Solidarity Portal",
        pledgeTitle: "Support a Warrior (Simulated Pledge)",
        pledgeDesc: "Empower life-care clinics, sponsor infant screening, provide hydration kits, and break global stigmas by making a monthly clinical support contribution pledge!",
        pledgeSuccessTitle: "Warrior Sponsor Certificate Compiled",
        pledgeSuccessDesc: "You committed to sponsoring:",
        monthLabel: "Month",
        makeRealImpact: "Make Real-World Impact",
        educationSimulationNotice: "This donation portal is an educational simulation. To back active warrior funds, visit official non-profits:",
        clinicalTag: "Clinical Sources & Accuracy Index",
        clinicalDisclaimer: "Disclaimer: This application is built for interactive educational awareness purposes only. All therapeutic and physiological parameters are based on verified official materials from:",
        sourceA: "Cerebral stroke prevention protocols — National Institutes of Health (NIH)",
        sourceB: "Autosomal inheritance charts — World Health Organization (WHO)",
        sourceC: "SCD Crisis Care & Hydroxyurea efficacy files — Centers for Disease Control and Prevention (CDC)",
        sourceD: "CRISPR gene therapy approvals — American Society of Hematology (ASH)",
        perks: {
          5: "Hydration thermal flask kit for children",
          15: "Regular folic acid clinical packages",
          45: "Transcranial Doppler Stroke screenings"
        },
        templates: [
          {
            title: "The Contagious Myth Debunked 🧬",
            myth: "MYTH: You can contract Sickle Cell Disease socially from another person.",
            reality: "REALITY: SCD is strictly autosomal recessive—it resides entirely in genetics and is inherited from parents' carrier traits. It cannot transmit socially.",
            colorClass: "from-blue-600 to-indigo-800"
          },
          {
            title: "Capillary Narrowing Trigger ❄️",
            myth: "MYTH: Cold weather triggers aren't a concern for blood vessels.",
            reality: "REALITY: Cold drafts initiate vasoconstriction (narrowing of capillaries). This instantly traps rigid sickle shapes, creating severe pain crises.",
            colorClass: "from-teal-600 to-emerald-800"
          },
          {
            title: "Hydration Plasma Shield 💧",
            myth: "MYTH: Water consumption is just a casual hydration recommendation.",
            reality: "REALITY: Proactive hydration expands plasma volume. Thinned blood prevents sickle cells from adhering to capsule walls, averting VOC jams.",
            colorClass: "from-purple-650 to-pink-700"
          }
        ]
      };
  }
};

const NON_PROFITS = [
  { name: "Sickle Cell Disease Association of America (SCDAA)", link: "https://www.sicklecelldisease.org" },
  { name: "Sickle Cell 101", link: "https://www.sc101.org" },
  { name: "Gasali Sickle Cell Foundation", link: "http://gasalisicklecellfoundation.org" }
];

interface AdvocacyAndImpactProps {
  language: string;
  textScale: 'normal' | 'large' | 'xl';
}

const AdvocacyAndImpact: React.FC<AdvocacyAndImpactProps> = ({ language, textScale }) => {
  const locD = getLocalizedAdvocacyData(language);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const selectedTemplate = locD.templates[selectedTemplateIndex] || locD.templates[0];

  const [composerBorder, setComposerBorder] = useState<string>("rounded-[2rem]");
  const [composerIcon, setComposerIcon] = useState<string>("🤝");
  const [pledgeAmount, setPledgeAmount] = useState<number>(0);
  const [isPledgeMade, setIsPledgeMade] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const textScaleClasses = {
    normal: 'text-xs md:text-sm',
    large: 'text-sm md:text-base',
    xl: 'text-base md:text-lg'
  };

  const handleCopyWisdom = () => {
    try {
      const copyContent = `SICKLE CELL AWARENESS: ${selectedTemplate.title}\n${selectedTemplate.myth}\n${selectedTemplate.reality}\nLend support and break the stigma! 🧬`;
      navigator.clipboard.writeText(copyContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      
      {/* Top campaign introduction */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        
        {/* Infographic Composer Panel LHS */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-slate-50 border border-gray-150 p-4 rounded-2xl flex gap-1.5 items-center">
            <Share2 size={16} className="text-red-500" />
            <span className="text-xs font-black uppercase text-slate-500">{locD.composerTag}</span>
          </div>

          <div className="bg-white rounded-3xl border border-gray-150 p-6 space-y-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{locD.chooseTopic}</span>
            
            <div className="space-y-2">
              {locD.templates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTemplateIndex(i)}
                  className={`w-full text-left p-3.5 rounded-xl border font-extrabold text-xs transition-all leading-normal cursor-pointer select-none ${
                    selectedTemplate.title === tpl.title 
                      ? 'bg-red-50 border-red-400 text-red-900 shadow-sm' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tpl.title}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pb-1.5">{locD.stampBadge}</span>
                <div className="flex gap-1 bg-gray-50 border p-1 rounded-xl">
                  {['🤝', '🧬', '🛡️', '❤️'].map((stamp) => (
                    <button
                      key={stamp}
                      onClick={() => setComposerIcon(stamp)}
                      className={`flex-1 py-1.5 rounded-lg text-xs hover:bg-white transition-all cursor-pointer select-none ${
                        composerIcon === stamp ? 'bg-white shadow-sm' : ''
                      }`}
                    >
                      {stamp}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pb-1.5">{locD.composerBorder}</span>
                <div className="flex gap-1 bg-gray-50 border p-1 rounded-xl">
                  {['Sleek', 'Classic', 'Retro'].map((bLabel, idx) => {
                    const borderCls = idx === 0 ? "rounded-none" : idx === 1 ? "rounded-2xl" : "rounded-[2.5rem]";
                    return (
                      <button
                        key={bLabel}
                        onClick={() => setComposerBorder(borderCls)}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-white transition-all cursor-pointer select-none ${
                          composerBorder === borderCls ? 'bg-white shadow-sm' : ''
                        }`}
                      >
                        {bLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyWisdom}
              className="w-full py-4 bg-red-650 hover:bg-red-750 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <Share2 size={14} className="fill-white" />
              {isCopied ? locD.btnCopied : locD.btnCopy}
            </button>
          </div>
        </div>

        {/* Campaign Visual Infographic Card Preview RHS */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-50 border border-gray-150 p-4 rounded-2xl flex gap-1.5 items-center">
            <Award size={16} className="text-yellow-500" />
            <span className="text-xs font-black uppercase text-slate-500 font-mono">{locD.liveFeed}</span>
          </div>

          <div 
            id="advocacy-block-export" 
            className={`w-full bg-gradient-to-tr ${selectedTemplate.colorClass} shadow-2xl p-6 text-white text-center flex flex-col justify-between aspect-[3/4] border-4 border-slate-950 transition-all ${composerBorder}`}
          >
            <div className="border border-white/20 h-full w-full rounded-[1.5rem] p-4 flex flex-col justify-between items-center relative">
              <div className="text-[9px] uppercase tracking-widest opacity-60 font-black">{locD.campaignHeader}</div>

              <div className="space-y-4 my-auto">
                <div className="text-5xl animate-bounce" style={{ animationDuration: '4s' }}>{composerIcon}</div>
                <h4 className="text-sm font-black leading-snug tracking-tight uppercase">
                  {selectedTemplate.title}
                </h4>
                <div className="border-t border-white/10 pt-2" />
                <p className="text-[10px] leading-relaxed italic opacity-85 font-semibold text-red-50">
                  {selectedTemplate.myth}
                </p>
                <p className="text-xs font-bold leading-normal text-white/95">
                  {selectedTemplate.reality}
                </p>
              </div>

              <span className="text-[8px] opacity-75 uppercase tracking-widest font-black leading-none block">{locD.verifiedLabel}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Support a Warrior Donation Simulation */}
      <div className="bg-slate-900 border-4 border-slate-950 text-white rounded-[2.5rem] p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl">❤️</div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 max-w-md">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 font-mono">{locD.pledgeTag}</span>
            <h3 className="text-2xl font-black">{locD.pledgeTitle}</h3>
            <p className="text-xs text-slate-300 leading-normal">
              {locD.pledgeDesc}
            </p>
          </div>

          <div className="flex gap-2 bg-slate-850 p-1.5 rounded-2xl border border-slate-800">
            {[5, 15, 45].map((val) => (
              <button
                key={val}
                onClick={() => { setPledgeAmount(val); setIsPledgeMade(true); }}
                className={`py-3 px-5 text-xs font-black rounded-xl uppercase transition-all flex flex-col items-center select-none cursor-pointer ${
                  pledgeAmount === val ? 'bg-amber-500 text-slate-900 font-extrabold shadow-md' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>${val}</span>
                <span className="text-[8px] opacity-75 font-bold">{locD.monthLabel}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {isPledgeMade && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-850 border border-slate-800 rounded-3xl p-5 space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 text-lg">
                  🏆
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase">{locD.pledgeSuccessTitle}</h4>
                  <p className="text-[10px] text-gray-300 font-semibold leading-normal">
                    {locD.pledgeSuccessDesc} {(locD.perks as any)[pledgeAmount] || ""}. Thank you plenty!
                  </p>
                </div>
              </div>

              {/* non-profit directory integration */}
              <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs font-semibold leading-relaxed">
                <span className="text-[9px] uppercase tracking-wider text-amber-500 font-black block">{locD.makeRealImpact}</span>
                <p className="text-[10px] text-indigo-200">
                  {locD.educationSimulationNotice}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1 font-mono flex-wrap">
                  {NON_PROFITS.map(org => (
                    <a 
                      key={org.name}
                      href={org.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-green-400 hover:underline mr-3"
                    >
                      {org.name} &bull; link ↗
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reputable Sourcing citations index */}
      <div className="bg-amber-50/50 border border-amber-150 rounded-2xl p-5 space-y-3 leading-relaxed">
        <div className="flex items-center gap-1.5 text-amber-900">
          <BookOpen size={16} />
          <span className="text-xs font-black uppercase tracking-wider">{locD.clinicalTag}</span>
        </div>

        <p className="text-[10px] text-amber-950 font-semibold">
          {locD.clinicalDisclaimer}
        </p>

        <ul className="text-[9px] text-amber-900 font-bold list-disc pl-5 uppercase font-mono space-y-0.5">
          <li>{locD.sourceA}</li>
          <li>{locD.sourceB}</li>
          <li>{locD.sourceC}</li>
          <li>{locD.sourceD}</li>
        </ul>
      </div>

    </div>
  );
};

export default AdvocacyAndImpact;
