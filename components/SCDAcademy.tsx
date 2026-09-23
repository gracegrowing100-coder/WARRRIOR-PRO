import React, { useState, useEffect } from 'react';
import { BookOpen, Award, CheckCircle2, AlertCircle, ArrowRight, Sparkles, RefreshCw, Check, X, ShieldAlert, HeartHandshake } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Article {
  id: string;
  title: string;
  subtitle: string;
  content: string[];
  readTime: string;
  organization: string;
}

interface LearningTrack {
  id: string;
  category: 'Understanding SCD' | 'Daily Management' | 'Crisis Prevention' | 'Myth vs. Fact';
  title: string;
  description: string;
  icon: string;
  color: string;
  hoverColor: string;
  article: Article;
  quiz: QuizQuestion;
}

// WHO & International SCD guidelines based articles and quizzes
const ACADEMY_DATA: LearningTrack[] = [
  {
    id: 'understanding-scd',
    category: 'Understanding SCD',
    title: 'The Cellular Science of SCD',
    description: 'Learn how genetic inheritance affects red blood cell structure and blood circulation.',
    icon: '🧬',
    color: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    hoverColor: 'hover:border-indigo-300',
    article: {
      id: 'art-understanding-scd',
      title: 'Decoding Sickle Cell Genetics and Biology',
      subtitle: 'World Health Organization (WHO) Foundation Guidelines',
      readTime: '3 min read',
      organization: 'WHO / NIH',
      content: [
        'Sickle Cell Disease (SCD) is a group of inherited red blood cell disorders. Healthy red blood cells are disc-shaped and highly flexible, allowing them to pass through microscopic blood vessels effortlessly to deliver vital oxygen to your whole body.',
        'In people with SCD, the genetic blueprint contains instructions to create abnormal hemoglobin S. Under low oxygen states, these abnormal proteins stiffen, crowd together, and pull the red cell into rigid C-shapes resembling a farming sickle.',
        'These rigid cells have two major drawbacks: (1) they break down easily, living only 10–20 days compared to 120 days for normal cells, causing severe chronic fatigue and anemia; and (2) they stick to blood vessel walls, creating catastrophic blockages that restrict blood and oxygen supply, giving rise to intense bone or organ pain.',
        'SCD is purely a genetic condition inherited when an offspring receives two sickle cell genes—one from each parent. Inheriting just one sickle gene from one parent is known as "Sickle Cell Trait", which usually causes no symptoms but can be passed to children.'
      ]
    },
    quiz: {
      question: 'What is the underlying biological cause of sickle cell shape deformation?',
      options: [
        'Iron deficiency in daily nutrition',
        'Acquired virus that alters cellular walls',
        'Abnormal hemoglobin S molecules joining together and stiffening when oxygen is low',
        'Exposure to high-altitude pressure'
      ],
      correctIndex: 2,
      explanation: 'Sickle cell deformation is caused by inherited abnormal hemoglobin S. Under deoxygenated conditions, these hemoglobin molecules polymerize (link together) into long, rigid fibers that physically distort the red blood cell into a stiff sickle shape.'
    }
  },
  {
    id: 'daily-management',
    category: 'Daily Management',
    title: 'Proactive Hydration & Nutrition',
    description: 'Master self-care strategies, hydration guidelines, and essential nutrients.',
    icon: '💧',
    color: 'bg-cyan-50 border-cyan-100 text-cyan-700',
    hoverColor: 'hover:border-cyan-300',
    article: {
      id: 'art-daily-management',
      title: 'The Life-Saving Power of Continuous Hydration',
      subtitle: 'Global SCD Coalition Consensus Care',
      readTime: '4 min read',
      organization: 'American Society of Hematology',
      content: [
        'For individuals living with sickle cell, water and fluids are not just standard hydration—they are a critical shield against vaso-occlusive crisis (VOC).',
        'When you drink generous amounts of water, your plasma volume expands, diluting the concentration of sickle-shaped cells inside your bloodstream. This significantly reduces blood viscosity (density), allowing even compromised sickle cells to circulate freely through narrow capillaries without stacking and forming microclots.',
        'Folic acid supplementation is another mandatory daily pillar. Because sickle red blood cells perish incredibly fast (every 10 to 20 days), your bone marrow works double-time to manufacture new cells. Folic acid acts as an essential fuel ingredient for rapid red cell regeneration.',
        'Health organizations recommend a baseline fluid intake of at least 3 liters daily for adolescents and adults. It is vital to hydrate proactively and consistently throughout the day, even before any thirst sensors are triggered.'
      ]
    },
    quiz: {
      question: 'How does high hydration prevent sickle cells from blocking blood flow?',
      options: [
        'It converts sickle cells back into healthy double-concave discs permanently',
        'It expands plasma volume, diluting cell density and keeping blood flowing smoothly',
        'It multiplies the oxygen density of normal cells tenfold',
        'It cools the core body temperature to halt cell breakdown'
      ],
      correctIndex: 1,
      explanation: 'Consuming high volumes of liquids dilutes the density of blood cells in the microvasculature. Larger plasma volume means cells remain separated and slide through tiny vessels rather than aggregating, anchoring, and causing blockages.'
    }
  },
  {
    id: 'crisis-prevention',
    category: 'Crisis Prevention',
    title: 'Preventing Crises & VOC Triggers',
    description: 'Learn how to avoid sudden vasoconstriction and identify early signs of a crisis.',
    icon: '🧣',
    color: 'bg-amber-50 border-amber-100 text-amber-700',
    hoverColor: 'hover:border-amber-300',
    article: {
      id: 'art-crisis-prevention',
      title: 'Identifying and Defending Against Vaso-Occlusive Triggers',
      subtitle: 'CDC Crisis Shield Framework',
      readTime: '4 min read',
      organization: 'Centers for Disease Control (CDC)',
      content: [
        'A vaso-occlusive crisis (VOC) is the hallmark medical emergency of SCD, characterized by severe, throbbing pain in bones, chest, and organs.',
        'Identifying environmental and physical triggers before they initiate sickling is the key to prevention. One of the strongest triggers is sudden cold exposure. Severe cold winds, cold water immersion, or cold rain trigger rapid reflex vasoconstriction (vessels narrow to preserve core body heat). Narrowed vessels block sickle-shaped cells instantly.',
        'Physical overexertion is another prominent trigger. Intense aerobic strain deprives the blood of oxygen. This localized deoxygenation (hypoxia) instantly initiates severe sickling cascades inside the muscles.',
        'Other triggers include high altitudes (low oxygen levels), untreated infections (which spark inflammatory proteins that make vessels "sticky"), and severe psychological stress. Staying warm, choosing moderate exercise, washing hands diligently to avoid infections, and practicing stress relief are proven shields.'
      ]
    },
    quiz: {
      question: 'Why does sudden exposure to severe cold weather frequently spark a pain crisis?',
      options: [
        'It freezes the bone marrow, halting cell production',
        'It triggers vascular narrowing, locking rigid sickle cells in confined capillaries',
        'It destroys folic acid compounds in the liver',
        'It increases the immune system response to fight safe tissues'
      ],
      correctIndex: 1,
      explanation: 'Sudden cold temperatures cause vasoconstriction—the reflex narrowing of blood vessels. As the pipelines contract, the flow of rigid, sickle-shaped cells is instantly obstructed, causing vascular traffic jams and immediate tissue pain.'
    }
  },
  {
    id: 'myth-fact',
    category: 'Myth vs. Fact',
    title: 'SCD Truths & Misconceptions',
    description: 'Demolish stereotypes and find medically grounded truths about sickle cell.',
    icon: '💬',
    color: 'bg-rose-50 border-rose-105 text-rose-700',
    hoverColor: 'hover:border-rose-300',
    article: {
      id: 'art-myth-fact',
      title: 'Shedding Light on Medical Truths',
      subtitle: 'Demystifying Misbeliefs and Dispelling Stigma',
      readTime: '3 min read',
      organization: 'SCD Association of America',
      content: [
        'Due to historical neglect, sickle cell disease is surrounded by major myths that impact care and raise social stigmas.',
        'MYTH #1: "Sickle Cell Disease is contagious." FACT: SCD is strictly an inherited genetic condition. It is mathematically impossible to catch it from another person like a flu or virus. It is only passed through genes from parents.',
        'MYTH #2: "Pain crises are emotional or exaggerated." FACT: Vaso-occlusive pain is a physical medical emergency comparable to the intense pain of a heart attack or bone fracture. Blocked blood flow starves tissues of oxygen, causing rapid, localized ischemia.',
        'MYTH #3: "SCD only affects black individuals." FACT: While highly prevalent in people of sub-Saharan African descent, the trait is heavily linked to malaria-endemic regions. It actively affects people of Mediterranean, Middle Eastern, Hispanic, and Indian descent, cutting across geographic backgrounds.'
      ]
    },
    quiz: {
      question: 'Which of the following statements about Sickle Cell Disease inheritance is medically accurate?',
      options: [
        'It is highly contagious and spreads in close social circles',
        'It can be contracted via close proximity to someone during cold season',
        'It is inherited solely if both parents pass on a sickle cell gene to their child',
        'It can develop later in life due to extreme iron deficiency'
      ],
      correctIndex: 2,
      explanation: 'Sickle cell is an autosomal recessive genetic disorder. A child can only develop the disease if they inherit two copies of the abnormal hemoglobin gene (one from mother and one from father). It is genetically impossible to contract or develop from environmental factors alone.'
    }
  }
];

export const SCDAcademy: React.FC = () => {
  const [progress, setProgress] = useState<{ readArticles: string[]; passedQuizzes: string[] }>({
    readArticles: [],
    passedQuizzes: []
  });
  const [selectedTrack, setSelectedTrack] = useState<LearningTrack | null>(null);
  const [activeTab, setActiveTab] = useState<'article' | 'quiz'>('article');
  
  // Interactive Quiz State
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [earnedXPMessage, setEarnedXPMessage] = useState<string | null>(null);

  // Initialize progress from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem('warrior_academy_progress');
    if (cached) {
      try {
        setProgress(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to parse progress cache', e);
      }
    }
  }, []);

  const saveProgress = (newProg: typeof progress) => {
    setProgress(newProg);
    localStorage.setItem('warrior_academy_progress', JSON.stringify(newProg));
  };

  const getTrackProgress = (trackId: string) => {
    let pct = 0;
    if (progress.readArticles.includes(trackId)) pct += 50;
    if (progress.passedQuizzes.includes(trackId)) pct += 50;
    return pct;
  };

  const overallCompletion = Math.round(
    ((progress.readArticles.length + progress.passedQuizzes.length) / (ACADEMY_DATA.length * 2)) * 100
  );

  const handleMarkAsRead = async (trackId: string) => {
    if (!progress.readArticles.includes(trackId)) {
      const updatedRead = [...progress.readArticles, trackId];
      const newProg = { ...progress, readArticles: updatedRead };
      saveProgress(newProg);

      // Reward points!
      setEarnedXPMessage('+15 XP Earned for reading verified guidelines!');
      const userId = auth.currentUser?.uid || '';
      await firebaseService.awardXP(userId, 15);
      
      // Post event for global updates
      window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
      
      setTimeout(() => setEarnedXPMessage(null), 3000);
    }
    setActiveTab('quiz'); // Auto switch to Encourage testing knowledge
  };

  const handleAnswerClick = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !selectedTrack) return;
    
    setIsAnswerSubmitted(true);
    
    const isCorrect = selectedAnswer === selectedTrack.quiz.correctIndex;
    if (isCorrect) {
      // Celebrate with subtle high-quality web audio oscillator beep
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 (bright positive chord)
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
      } catch (e) {}

      if (!progress.passedQuizzes.includes(selectedTrack.id)) {
        const updatedQuizzes = [...progress.passedQuizzes, selectedTrack.id];
        const newProg = { ...progress, passedQuizzes: updatedQuizzes };
        saveProgress(newProg);

        // Reward points!
        setEarnedXPMessage('+30 Academic XP Awarded!');
        const userId = auth.currentUser?.uid || '';
        await firebaseService.awardXP(userId, 30);
        
        // Dispatch synchronizing event
        window.dispatchEvent(new CustomEvent('warrior-streak-updated'));
        setTimeout(() => setEarnedXPMessage(null), 3000);
      }
    } else {
      // Incorrect tone
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(220, ctx.currentTime); // Low buzz
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch (e) {}
    }
  };

  const resetQuiz = () => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
  };

  const handleSelectTrack = (track: LearningTrack) => {
    setSelectedTrack(track);
    setActiveTab('article');
    resetQuiz();
  };

  return (
    <div className="space-y-6">
      {/* Academy Overview & Overall Progress */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 md:p-8 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-[0.05] text-[10rem] font-bold select-none pointer-events-none">
          🎓
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 w-fit">
              <Sparkles size={14} className="text-yellow-400" />
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Medical Knowledge Hub</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">SCD Academy</h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-lg leading-relaxed">
              Empower yourself and your caregivers with WHO-guided scientific facts, preventative shield guidelines, and diagnostic awareness criteria.
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-3xl min-w-[180px] w-full sm:w-auto text-center space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span className="uppercase tracking-widest">Village Progress</span>
              <span>{overallCompletion}%</span>
            </div>
            <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${overallCompletion}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
              {overallCompletion === 100 ? '🎓 Grand Scholar Active!' : 'Read & Test your cellular mastery'}
            </span>
          </div>
        </div>
      </div>

      {earnedXPMessage && (
        <div className="bg-green-500 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg justify-center font-black uppercase text-xs tracking-wider animate-bounce">
          <Award size={18} />
          {earnedXPMessage}
        </div>
      )}

      {/* Grid Layout Categories */}
      {!selectedTrack ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACADEMY_DATA.map((track) => {
            const pct = getTrackProgress(track.id);
            const isFinished = pct === 100;
            
            return (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className={`flex flex-col bg-white rounded-[2rem] border-2 border-gray-100 p-6 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-gray-100 cursor-pointer ${track.hoverColor} group`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border ${track.color}`}>
                    {track.icon}
                  </div>
                  {isFinished ? (
                    <span className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-150 text-[10px] font-black uppercase tracking-wider">
                      <CheckCircle2 size={12} className="fill-green-200" /> Completed
                    </span>
                  ) : (
                    <span className="text-[10px] bg-gray-50 text-gray-400 px-2.5 py-1 rounded-full border border-gray-100 font-bold uppercase tracking-wider">
                      {pct}% Progress
                    </span>
                  )}
                </div>

                <div className="space-y-1 mb-4 flex-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{track.category}</span>
                  <h3 className="text-lg font-black text-gray-800 tracking-tight leading-snug group-hover:text-red-600 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    {track.description}
                  </p>
                </div>

                {/* Progress bar inside the card */}
                <div className="space-y-2 pt-3 border-t border-gray-50 mt-auto">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <span>{pct === 0 ? 'START LAB' : pct === 50 ? 'QUIZ PENDING' : 'COMPLETED'}</span>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Module Screen - Tabs of Article Content vs Quiz */
        <div className="bg-white rounded-[2.5rem] border border-gray-150 shadow-sm overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-150 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-4 items-center">
              <button 
                onClick={() => setSelectedTrack(null)}
                className="px-4 py-2 border border-gray-200 text-xs font-black uppercase tracking-wider bg-white hover:bg-gray-50 text-gray-600 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                ← Back
              </button>
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">{selectedTrack.category}</span>
                <h4 className="text-xl font-black text-gray-800 tracking-tight">{selectedTrack.title}</h4>
              </div>
            </div>

            {/* Read/Quiz Tab Selection */}
            <div className="flex bg-gray-150 p-1 rounded-2xl w-full md:w-auto">
              <button
                onClick={() => setActiveTab('article')}
                className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'article' 
                    ? 'bg-white text-gray-850 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                1. WHO Guidelines
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'quiz' 
                    ? 'bg-white text-gray-850 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                2. interactive Quiz
              </button>
            </div>
          </div>

          {/* Module Tab Content */}
          <div className="p-6 md:p-8 min-h-[300px]">
            {activeTab === 'article' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <BookOpen size={16} className="text-red-500" />
                    <span>{selectedTrack.article.readTime}</span>
                    <span className="text-gray-300">•</span>
                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-black text-[10px]">
                      {selectedTrack.article.organization}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-gray-400">Section Guidelines</span>
                </div>

                <div className="space-y-4 max-w-3xl">
                  <h3 className="text-2xl font-black text-gray-850 tracking-tight leading-snug">
                    {selectedTrack.article.title}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-600/90 italic">
                    {selectedTrack.article.subtitle}
                  </p>

                  <div className="space-y-4 pt-4 text-sm md:text-base text-gray-650 leading-relaxed font-semibold">
                    {selectedTrack.article.content.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                {/* Mark as read action */}
                <div className="pt-6 border-t border-gray-100 flex justify-end">
                  {progress.readArticles.includes(selectedTrack.id) ? (
                    <button
                      onClick={() => setActiveTab('quiz')}
                      className="px-6 py-4 bg-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 transition-all cursor-pointer hover:bg-gray-150"
                    >
                      <Check size={18} /> Lesson Read! Take the Quiz →
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkAsRead(selectedTrack.id)}
                      className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-red-200 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Verify Guidance Read & Earn 15 XP
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Interactive Quiz Section */
              <div className="space-y-6 max-w-xl mx-auto">
                <div className="space-y-2 text-center mb-6">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl border border-amber-100 text-amber-500 flex items-center justify-center mx-auto mb-2 text-2xl">
                    ⚡
                  </div>
                  <h4 className="font-black text-lg text-gray-800 tracking-tight">Interactive Knowledge Check</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Answer correctly to unlock 30 XP & Lesson badge</p>
                </div>

                {/* Reusable Quiz Card Component */}
                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xs">
                  <h3 className="text-base md:text-lg font-black text-gray-850 leading-snug">
                    {selectedTrack.quiz.question}
                  </h3>

                  {/* Multiple Choice Options */}
                  <div className="space-y-3">
                    {selectedTrack.quiz.options.map((option, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === selectedTrack.quiz.correctIndex;
                      
                      let selectStyle = 'bg-white text-gray-700 border-gray-200 hover:border-gray-300';
                      
                      if (isAnswerSubmitted) {
                        if (isCorrect) {
                          selectStyle = 'bg-green-100 text-green-900 border-green-400 font-bold';
                        } else if (isSelected) {
                          selectStyle = 'bg-red-100 text-red-900 border-red-400 font-bold';
                        } else {
                          selectStyle = 'bg-white opacity-60 text-gray-400 border-gray-150';
                        }
                      } else if (isSelected) {
                        selectStyle = 'bg-red-50 text-red-800 border-red-400 font-black shadow-xs';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAnswerSubmitted}
                          onClick={() => handleAnswerClick(idx)}
                          className={`w-full text-left p-4 rounded-2xl border-2 text-sm leading-relaxed transition-all cursor-pointer flex items-start gap-3 ${selectStyle}`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isAnswerSubmitted && isCorrect ? 'bg-green-600 border-green-600 text-white' :
                            isAnswerSubmitted && isSelected && !isCorrect ? 'bg-red-600 border-red-600 text-white' :
                            isSelected ? 'bg-red-600 border-red-600 text-white' : 'bg-transparent border-gray-300'
                          }`}>
                            {isAnswerSubmitted && (isCorrect || isSelected) ? (
                              isCorrect ? <Check size={12} strokeWidth={4} /> : <X size={12} strokeWidth={4} />
                            ) : (
                              <span className="text-[10px] font-black uppercase text-gray-400 select-none">
                                {String.fromCharCode(65 + idx)}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit / Action button */}
                  {!isAnswerSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className="w-full py-4 bg-red-600 disabled:opacity-40 disabled:pointer-events-none hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all cursor-pointer"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    /* Explanation Text of Medical Truth */
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className={`p-5 rounded-2xl border flex gap-3 ${
                        selectedAnswer === selectedTrack.quiz.correctIndex
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        <div className="shrink-0 mt-0.5">
                          {selectedAnswer === selectedTrack.quiz.correctIndex ? (
                            <div className="bg-green-600 p-1 text-white rounded-lg">
                              <Check size={16} />
                            </div>
                          ) : (
                            <div className="bg-red-600 p-1 text-white rounded-lg">
                              <ShieldAlert size={16} />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-black text-xs uppercase tracking-wider">
                            {selectedAnswer === selectedTrack.quiz.correctIndex ? 'EXCELLENT! THAT IS CORRECT' : 'INCORRECT MATCH'}
                          </h5>
                          <p className="text-xs font-semibold leading-relaxed">
                            {selectedTrack.quiz.explanation}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {selectedAnswer !== selectedTrack.quiz.correctIndex && (
                          <button
                            type="button"
                            onClick={resetQuiz}
                            className="flex-1 py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <RefreshCw size={12} /> Try Again
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTrack(null);
                          }}
                          className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                        >
                          Return to Track Grid
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Supportive medical fact reference note */}
                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 flex gap-3.5">
                  <div className="text-blue-500 shrink-0 mt-0.5">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h6 className="font-black text-xs text-blue-900 uppercase tracking-wide">Supportive Health Guideline</h6>
                    <p className="text-xs text-blue-700 leading-relaxed font-semibold">
                      Answers are strictly curated from the American Society of Hematology and the World Health Organization peer studies, providing caregivers and warriors with precision knowledge.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
