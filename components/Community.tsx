import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Heart, Share2, Plus, X, Search, 
  Phone, Mail, MapPin, Filter, ArrowUpDown, Users, 
  ShieldAlert, ShieldCheck, VolumeX, Check, Sparkles, Clock, 
  ExternalLink, Building2, CheckCircle2, ChevronRight, Bookmark, AlertTriangle, MessagesSquare
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';
import ChatSystem from './ChatSystem';

interface SupportCenter {
  id: string;
  center_name: string;
  category: 'Specialized Clinics' | 'Support Groups' | 'NGOs';
  description?: string;
  address: string;
  city: 'Lagos' | 'Abuja' | 'Ogun';
}

const SUPPORT_CENTERS: SupportCenter[] = [
  {
    id: 'scfn-lagos',
    center_name: 'Sickle Cell Foundation of Nigeria (SCFN)',
    category: 'NGOs',
    description: 'Pioneering non-governmental organization dedicated to sickle cell care, newborn screening, prenatal diagnosis, and genetic counseling across West Africa.',
    address: 'National Sickle Cell Centre, opposite LUTH, Idi-Araba, Surulere, Lagos, Nigeria',
    city: 'Lagos'
  },
  {
    id: 'luth-clinic-lagos',
    center_name: 'LUTH Sickle Cell Specialized Center',
    category: 'Specialized Clinics',
    description: 'Premier academic hematology day-care and inpatient emergency facility offering hydroxyurea optimization, transfusion medicine, and VOC rapid management.',
    address: 'LUTH Complex, Ishaga Rd, Idi-Araba, Surulere, Lagos, Nigeria',
    city: 'Lagos'
  },
  {
    id: 'garki-abuja',
    center_name: 'Abuja National Hospital Hematology Unit',
    category: 'Specialized Clinics',
    description: 'Federal tertiary clinical referral center equipped with apheresis, routine hemoglobin surveillance, pediatric hematology, and emergency VOC crisis bays.',
    address: 'Plot 242, Garki-II, Abuja, Nigeria',
    city: 'Abuja'
  },
  {
    id: 'abuja-mutual-help',
    center_name: 'Abuja Warriors Mutual Help Circle',
    category: 'Support Groups',
    description: 'Community-led peer collective providing lived-experience crisis buddy systems, nutrition workshops, hospital visitation, and mutual warrior aid.',
    address: 'Area 11 Community Center, Garki, Abuja, Nigeria',
    city: 'Abuja'
  },
  {
    id: 'fmc-abeokuta',
    center_name: 'FMC Abeokuta Sickle Cell Specialized Center',
    category: 'Specialized Clinics',
    description: 'Regional tertiary referral center providing dedicated hematology clinics, pediatric crisis stabilization, hydroxyurea monitoring, and comprehensive care for Ogun State.',
    address: 'Bisi Onabanjo Way, Idi-Aba, Abeokuta, Ogun State, Nigeria',
    city: 'Ogun'
  },
  {
    id: 'oouth-sagamu',
    center_name: 'OOUTH Sagamu Hematology & Day-Care Clinic',
    category: 'Specialized Clinics',
    description: 'University teaching hospital delivering comprehensive sickle cell clinical management, newborn screening, day-care hydration, and emergency VOC pain protocol management.',
    address: 'Hospital Complex, Sagamu - Ikenne Rd, Sagamu, Ogun State, Nigeria',
    city: 'Ogun'
  },
  {
    id: 'ogun-warriors-support',
    center_name: 'Ogun State Sickle Cell Warriors Support Network',
    category: 'Support Groups',
    description: 'Grassroots patient and caregiver mutual support community offering monthly support circles, peer hydration buddies, caregiver relief, and crisis transport aid across Ogun State.',
    address: 'Community Health Wing, Sacred Heart Hospital, Lantoro, Abeokuta, Ogun State, Nigeria',
    city: 'Ogun'
  },
  {
    id: 'scaf-ogun',
    center_name: 'Sickle Cell Aid Foundation (SCAF) - Ogun',
    category: 'NGOs',
    description: 'Advocacy and compassionate care NGO coordinating free genotype testing, educational awareness campaigns, and subsidized routine medications for vulnerable warriors.',
    address: 'Kuto Area Civic Center, Abeokuta, Ogun State, Nigeria',
    city: 'Ogun'
  }
];

const CATEGORY_LABELS: Record<SupportCenter['category'], string> = {
  'Specialized Clinics': 'Clinic',
  'Support Groups': 'Support group',
  NGOs: 'NGO',
};

interface ForumPost {
  id: string;
  authorName: string;
  title: string;
  content: string;
  tags?: string[];
  likes?: number;
  createdAt?: any;
}

const DEFAULT_FORUM_POSTS: ForumPost[] = [
  {
    id: 'seed-post-1',
    authorName: 'Tunde O. (HbSS Warrior)',
    title: 'How I manage hydration during long lecture hours',
    content: 'Carrying a 1L insulated thermos with warm electrolyte water has made a massive difference for me. I set 45-minute silent vibration pings on my watch so I never miss a sip even during exams.',
    tags: ['Hydration', 'School', 'DailyHabits'],
    likes: 24,
    createdAt: new Date(Date.now() - 3600000 * 5)
  },
  {
    id: 'seed-post-2',
    authorName: 'Grace M. (Caregiver Mother)',
    title: 'Warm bone broth and thermal layers for cold evenings',
    content: 'Whenever harmattan or rainy weather sets in, we pack warm bone broth and ensure thermal innerwear under school uniforms. Staying ahead of the chill prevents VOC triggers before they start.',
    tags: ['Caregivers', 'Nutrition', 'ColdWeather'],
    likes: 18,
    createdAt: new Date(Date.now() - 3600000 * 24)
  },
  {
    id: 'seed-post-3',
    authorName: 'David K. (Advocate)',
    title: 'Advocating for prompt analgesia in local emergency rooms',
    content: 'Always carry a printed copy of your individualized crisis protocol card signed by your hematologist. Showing this immediately at triage helps the ER nurse understand that sickle cell pain requires rapid, weight-appropriate analgesia.',
    tags: ['Advocacy', 'Emergency', 'Hospital'],
    likes: 31,
    createdAt: new Date(Date.now() - 3600000 * 48)
  }
];

export const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'support' | 'chat' | 'forum' | 'warrior_match'>('support');
  
  // --- Support Directory States ---
  const [selectedCity, setSelectedCity] = useState<'Lagos' | 'Abuja' | 'Ogun'>('Lagos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- Forum States ---
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // --- Warrior Match States ---
  const [selectedComorbidities, setSelectedComorbidities] = useState<string[]>([
    'Avascular Necrosis (AVN)',
    'Asthma'
  ]);
  const [selectedCircleDetail, setSelectedCircleDetail] = useState<any | null>(null);
  const [joinedCircleIds, setJoinedCircleIds] = useState<string[]>(['wm-avn']);

  const COMORBIDITIES_LIST = [
    'Avascular Necrosis (AVN)',
    'Asthma',
    'Leg Ulcers',
    'Stroke / Silent Infarct',
    'Retinopathy / Vision Changes',
    'Gallstones / Cholecystectomy',
    'Priapism Support',
    'Chronic Kidney Disease (CKD)',
    'Splenic Sequestration'
  ];

  const MATCH_GROUPS = [
    {
      id: 'wm-avn',
      name: 'Avascular Necrosis (AVN) & Joint Preservation Circle',
      comorbidities: ['Avascular Necrosis (AVN)'],
      description: 'Peer support, mobility tips, hydrotherapy protocols, and orthopedic consultation discussions for Warriors managing hip, shoulder, or knee AVN.',
      mentor: 'Dr. Folake A. (AVN Hematology Mentor)',
      membersCount: 142,
      meetingSchedule: 'Tuesdays @ 7:00 PM WAT (Virtual Call)',
      recentTopics: ['Pool Hydrotherapy', 'Core Decompression vs. Conservative Care', 'Joint Sparing Pain Management']
    },
    {
      id: 'wm-asthma',
      name: 'Asthma & Acute Chest Defense Network',
      comorbidities: ['Asthma'],
      description: 'Focused peer group sharing respiratory protection, incentive spirometry habits, allergen control, and early acute chest syndrome prevention.',
      mentor: 'Grace M., RN (Respiratory Specialist)',
      membersCount: 218,
      meetingSchedule: 'Thursdays @ 6:00 PM WAT',
      recentTopics: ['Peak Flow Meter Tracking', 'Incentive Spirometer 10-Breath Habit', 'Cold Draft Precautions']
    },
    {
      id: 'wm-ulcer',
      name: 'Leg Ulcer Healing & Vascular Wellness',
      comorbidities: ['Leg Ulcers'],
      description: 'Compassionate space discussing compression therapy, zinc supplementation, modern wound dressings, and vascular pain relief.',
      mentor: 'Nurse Chiamaka E. (Wound Care Lead)',
      membersCount: 89,
      meetingSchedule: 'Wednesdays @ 5:30 PM WAT',
      recentTopics: ['Unna Boot Applications', 'Zinc & Vitamin C Synergies', 'Elevating Lower Extremities']
    },
    {
      id: 'wm-stroke',
      name: 'Stroke Prevention & TCD Surveillance Circle',
      comorbidities: ['Stroke / Silent Infarct'],
      description: 'Support network for families and individuals navigating Transcranial Doppler (TCD) scans, chronic exchange transfusions, and cognitive recovery.',
      mentor: 'Prof. Ibrahim K. (Pediatric Hematology)',
      membersCount: 165,
      meetingSchedule: 'Saturdays @ 4:00 PM WAT',
      recentTopics: ['Understanding TCD Velocities (>200 cm/s)', 'Exchange Transfusion Schedules', 'Cognitive Empowerment']
    },
    {
      id: 'wm-retino',
      name: 'Ocular Health & Retinopathy Warriors',
      comorbidities: ['Retinopathy / Vision Changes'],
      description: 'Dedicated group addressing proliferative sickle retinopathy, laser photocoagulation experiences, and routine dilated eye exam reminders.',
      mentor: 'Dr. Samuel T. (Ophthalmology Specialist)',
      membersCount: 74,
      meetingSchedule: 'Bi-weekly Mondays @ 6:30 PM WAT',
      recentTopics: ['Annual Dilated Eye Exams', 'Laser Photocoagulation Recovery', 'Managing Floaters']
    },
    {
      id: 'wm-gall',
      name: 'Gallstones & Cholecystectomy Recovery Circle',
      comorbidities: ['Gallstones / Cholecystectomy'],
      description: 'Guidance on managing bilirubin gallstones, laparoscopic cholecystectomy surgical prep, and post-surgery dietary adjustments.',
      mentor: 'Amina B. (Peer Survivor Lead)',
      membersCount: 110,
      meetingSchedule: 'Fridays @ 7:00 PM WAT',
      recentTopics: ['Post-Laparoscopic Care', 'Low-Fat Nutrition Options', 'Bilirubin Spikes']
    }
  ];

  const toggleComorbidity = (comorb: string) => {
    setSelectedComorbidities(prev => 
      prev.includes(comorb) ? prev.filter(c => c !== comorb) : [...prev, comorb]
    );
  };

  const toggleJoinCircle = (circleId: string) => {
    setJoinedCircleIds(prev => 
      prev.includes(circleId) ? prev.filter(id => id !== circleId) : [...prev, circleId]
    );
  };

  useEffect(() => {
    fetchForumData();
  }, []);

  const fetchForumData = async () => {
    try {
      const fetched = await firebaseService.getPosts();
      if (fetched && fetched.length > 0) {
        setPosts(fetched);
      } else {
        setPosts(DEFAULT_FORUM_POSTS);
      }
    } catch {
      setPosts(DEFAULT_FORUM_POSTS);
    }
  };

  const handleLike = async (id: string) => {
    try {
      await firebaseService.likePost(id);
    } catch {
      // optimistic update still proceeds
    }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p));
  };

  const handleSharePost = (post: ForumPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`"${post.title}" - Warrior AI Community Forum: ${post.content}`);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2000);
    }
  };

  // Moderation, Reporting, Mute & Guardian Safe Mode state
  const [guardianSafeMode, setGuardianSafeMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('warrior_guardian_safe_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [reportedPostIds, setReportedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('warrior_reported_forum_posts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mutedAuthors, setMutedAuthors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('warrior_muted_forum_authors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [moderationNotice, setModerationNotice] = useState<string | null>(null);

  const hasUnverifiedRemedyClaim = (text?: string): boolean => {
    if (!text) return false;
    return /stop\s+hydroxyurea|miracle\s+cure|herbal\s+cure|cures?\s+sickle\s+cell|skip\s+(the\s+)?(doctor|hospital)/i.test(text);
  };

  const toggleGuardianMode = () => {
    const next = !guardianSafeMode;
    setGuardianSafeMode(next);
    try {
      localStorage.setItem('warrior_guardian_safe_mode', String(next));
    } catch {
      // ignore storage errors
    }
    setModerationNotice(
      next
        ? 'Guardian / Minor Safe Mode enabled: flagged posts and unverified medical claims are hidden.'
        : 'Guardian / Minor Safe Mode turned off.'
    );
  };

  const handleReportPost = (postId: string, title: string) => {
    const next = Array.from(new Set([...reportedPostIds, postId]));
    setReportedPostIds(next);
    try {
      localStorage.setItem('warrior_reported_forum_posts', JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    setModerationNotice(`Reported "${title}" for clinical & community safety review.`);
  };

  const handleMuteAuthor = (authorName: string) => {
    if (!authorName) return;
    const next = Array.from(new Set([...mutedAuthors, authorName]));
    setMutedAuthors(next);
    try {
      localStorage.setItem('warrior_muted_forum_authors', JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    setModerationNotice(`Muted posts from ${authorName}.`);
  };

  const handleRestoreModeration = () => {
    setReportedPostIds([]);
    setMutedAuthors([]);
    try {
      localStorage.removeItem('warrior_reported_forum_posts');
      localStorage.removeItem('warrior_muted_forum_authors');
    } catch {
      // ignore storage errors
    }
    setModerationNotice('Restored hidden posts and muted authors.');
  };

  const handleAddPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    const authorName = auth.currentUser?.displayName || 'Fellow Warrior';
    const newEntry: ForumPost = {
      id: 'post-' + Date.now().toString(36),
      authorName,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      tags: [activeCategory === 'All' ? 'General' : activeCategory],
      likes: 1,
      createdAt: new Date()
    };

    setPosts(prev => [newEntry, ...prev]);
    try {
      await firebaseService.createPost(newPostTitle.trim(), newPostContent.trim(), [activeCategory]);
    } catch (e) {
      console.warn('Failed to publish post to remote database:', e);
    }

    setNewPostTitle('');
    setNewPostContent('');
    setShowNewPost(false);
  };

  // Directory entries carry no phone numbers or distances: neither was verified, and the
  // distance was measured from a fixed city point, not from the patient.
  const processedCenters = SUPPORT_CENTERS
    .filter(center => {
      if (center.city !== selectedCity) return false;
      if (selectedCategoryFilter !== 'All' && center.category !== selectedCategoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          center.center_name.toLowerCase().includes(q) ||
          center.address.toLowerCase().includes(q) ||
          (center.description && center.description.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => a.center_name.localeCompare(b.center_name));


  return (
    <div className="space-y-5" data-semantic>
      {/* Header */}
      <header className="space-y-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-wa-plum sm:text-3xl">Community &amp; Support</h1>
          <p className="mt-0.5 text-[13px] text-wa-plum-muted sm:text-sm">Find care, and talk with other warriors and families.</p>
        </div>

        {/* Tabs: equal-width segments so labels never wrap on a phone */}
        <div role="tablist" aria-label="Community destinations" className="grid grid-cols-4 gap-1 rounded-full border border-wa-line bg-wa-surface p-1">
          {([
            { id: 'support', label: 'Find care', icon: MapPin },
            { id: 'chat', label: 'Chat', icon: MessagesSquare },
            { id: 'forum', label: 'Forum', icon: MessageSquare },
            { id: 'warrior_match', label: 'Groups', icon: Users },
          ] as const).map(tab => {
            const selected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-1 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
                  selected ? 'bg-wa-rose text-wa-crimson' : 'text-wa-plum-muted hover:bg-wa-ground hover:text-wa-plum'
                }`}
              >
                <Icon size={15} className="hidden sm:block" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ============================================================== */}
      {/* 1. CARE DIRECTORY TAB                                           */}
      {/* ============================================================== */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="space-y-3 rounded-[22px] border border-wa-line bg-wa-surface p-4">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="City">
              {(['Lagos', 'Abuja', 'Ogun'] as const).map(city => (
                <button
                  key={city}
                  type="button"
                  aria-pressed={selectedCity === city}
                  onClick={() => {
                    setSelectedCity(city);
                    setSearchQuery('');
                  }}
                  className={`inline-flex min-h-11 items-center rounded-full px-4 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
                    selectedCity === city
                      ? 'bg-wa-hero text-white'
                      : 'border border-wa-line bg-wa-surface text-wa-plum hover:bg-wa-ground'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-wa-plum-muted" size={16} aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={`Search centres in ${selectedCity}`}
                  placeholder={`Search ${selectedCity}`}
                  className="h-11 w-full rounded-full border border-wa-line bg-wa-ground pl-10 pr-4 text-base text-wa-plum placeholder:text-wa-plum-muted/70 focus:border-wa-crimson focus:outline-none focus:ring-2 focus:ring-wa-crimson/30 sm:text-sm"
                />
              </div>
              <div className="relative">
                <Filter size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-wa-plum-muted" aria-hidden="true" />
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  aria-label="Filter resource categories"
                  className="h-11 w-full appearance-none rounded-full border border-wa-line bg-wa-ground pl-10 pr-8 text-[13px] font-bold text-wa-plum focus:border-wa-crimson focus:outline-none sm:w-auto"
                >
                  <option value="All">All types</option>
                  <option value="Specialized Clinics">Clinics</option>
                  <option value="Support Groups">Support groups</option>
                  <option value="NGOs">NGOs</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-[18px] border border-wa-sun/40 bg-wa-sun-soft p-3.5 text-[13px] text-wa-plum">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-wa-sun-ink" aria-hidden="true" />
            <p>Confirm opening hours and services before you travel. In an emergency, call <a href="tel:112" className="font-bold underline">112</a>.</p>
          </div>

          {/* Listings */}
          <div className="space-y-3">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-wa-plum-muted">
              {processedCenters.length} {processedCenters.length === 1 ? 'place' : 'places'} in {selectedCity}
            </h2>

            {processedCenters.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {processedCenters.map((center) => {
                  const isGroup = center.category === 'Support Groups';
                  return (
                    <li key={center.id} className="flex flex-col rounded-[22px] border border-wa-line bg-wa-surface p-4">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            isGroup ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-wa-rose text-wa-crimson'
                          }`}
                        >
                          {isGroup ? <Users size={20} /> : <Building2 size={20} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-wa-plum-muted">{CATEGORY_LABELS[center.category]}</p>
                          <h3 className="font-display text-[15px] font-bold leading-snug text-wa-plum">{center.center_name}</h3>
                        </div>
                      </div>
                      {center.description && (
                        <p className="mt-2.5 text-[13px] leading-relaxed text-wa-plum">{center.description}</p>
                      )}
                      <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-wa-plum-muted">
                        <MapPin size={14} className="mt-px shrink-0 text-wa-crimson" aria-hidden="true" />
                        <span>{center.address}</span>
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.center_name + ' ' + center.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-full border border-wa-line bg-wa-surface px-4 text-[13px] font-bold text-wa-plum transition-colors hover:bg-wa-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
                      >
                        <ExternalLink size={14} aria-hidden="true" />
                        Contact &amp; directions
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="space-y-2 rounded-[22px] border border-wa-line bg-wa-surface p-6 text-center">
                <Building2 size={28} className="mx-auto text-wa-plum-muted/60" aria-hidden="true" />
                <h3 className="text-sm font-bold text-wa-plum">No places match your search</h3>
                <p className="mx-auto max-w-xs text-xs text-wa-plum-muted">Try a different word or show all types.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategoryFilter('All'); }}
                  className="mt-1 inline-flex min-h-11 items-center rounded-full bg-wa-ground px-4 text-[13px] font-bold text-wa-plum transition hover:bg-wa-rose/40"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Crisis help: calm surface, one clear action */}
          <section aria-labelledby="crisis-help-heading" className="flex items-start gap-3 rounded-[22px] border border-wa-crimson/25 bg-wa-rose/40 p-4 dark:bg-wa-rose/10">
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wa-surface text-wa-crimson">
              <ShieldAlert size={20} />
            </span>
            <div className="min-w-0 flex-1 space-y-2.5">
              <div>
                <h2 id="crisis-help-heading" className="font-display text-[15px] font-bold text-wa-plum">In a pain crisis right now?</h2>
                <p className="text-[13px] text-wa-plum-muted">If pain is severe or not easing, or you have fever, chest pain or trouble breathing, get emergency help.</p>
              </div>
              <a
                href="tel:112"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-wa-crimson px-5 text-[13px] font-bold text-white transition-colors hover:bg-wa-crimson-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson focus-visible:ring-offset-2"
              >
                <Phone size={15} aria-hidden="true" /> Call 112
              </a>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'chat' && <ChatSystem />}

      {/* ============================================================== */}
      {/* 2. GROUPS TAB (was Peer Circles) (COMORBIDITY & LIVED EXPERIENCE MATCHING)    */}
      {/* ============================================================== */}
      {activeTab === 'warrior_match' && (
        <div className="space-y-5">
          {/* Intro Card */}
          <div className="flex items-start gap-3 rounded-[22px] border border-wa-line bg-wa-rose/40 p-4 dark:bg-wa-rose/10">
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wa-surface text-wa-crimson">
              <Sparkles size={20} />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="font-display text-[17px] font-bold leading-snug text-wa-plum">
                Find warriors who understand
              </h2>
              <p className="text-[13px] leading-relaxed text-wa-plum-muted">
                Join circles for people living with the same extra conditions, such as AVN, asthma, leg ulcers or stroke risk.
              </p>
            </div>
          </div>

          {/* Comorbidity Selection Chips */}
          <div className="bg-wa-surface p-4 sm:p-5 rounded-[24px] border border-wa-line shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-wa-plum uppercase tracking-wider">
                  Your health factors
                </h3>
                <p className="text-xs text-wa-plum-muted mt-0.5">Pick any that apply to see matching circles.</p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs font-bold bg-wa-rose text-wa-crimson px-2.5 py-1 rounded-full">
                {selectedComorbidities.length} Active
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {COMORBIDITIES_LIST.map((comorb) => {
                const isSelected = selectedComorbidities.includes(comorb);
                return (
                  <button
                    key={comorb}
                    type="button"
                    onClick={() => toggleComorbidity(comorb)}
                    aria-pressed={isSelected}
                    className={`min-h-11 px-4 rounded-full text-[13px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
                      isSelected
                        ? 'border-2 border-wa-crimson bg-wa-rose text-wa-crimson'
                        : 'bg-wa-surface hover:bg-wa-ground text-wa-plum border border-wa-line'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{comorb}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matched Groups List */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-wa-plum-muted uppercase tracking-wider px-1">
              Suggested groups
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {MATCH_GROUPS.map((group) => {
                const isMatching = group.comorbidities.some(c => selectedComorbidities.includes(c));
                const isJoined = joinedCircleIds.includes(group.id);

                return (
                  <div 
                    key={group.id} 
                    className={`bg-wa-surface border rounded-2xl p-5 space-y-3.5 transition-all shadow-2xs ${
                      isMatching ? 'border-wa-crimson/40 ring-1 ring-wa-crimson/20' : 'border-wa-line'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isMatching ? 'bg-wa-rose text-wa-crimson' : 'bg-wa-ground text-wa-plum-muted border border-wa-line'
                        }`}>
                          {isMatching ? '98% Comorbidity Match' : 'Open Circle'}
                        </span>
                        <h4 className="font-display font-bold text-sm sm:text-base text-wa-plum mt-1.5 leading-snug">
                          {group.name}
                        </h4>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-wa-rose/60 text-wa-crimson flex items-center justify-center shrink-0">
                        <Users size={18} />
                      </div>
                    </div>

                    <p className="text-xs text-wa-plum-muted leading-relaxed font-medium">
                      {group.description}
                    </p>

                    <div className="space-y-1.5 text-xs border-t border-wa-line-soft pt-2.5 text-wa-plum-muted">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Mentor:</span>
                        <span className="font-bold text-wa-crimson">{group.mentor}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Sessions:</span>
                        <span className="text-wa-plum font-medium">{group.meetingSchedule}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Active Warriors:</span>
                        <span className="text-wa-plum font-bold">{group.membersCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCircleDetail(group)}
                        className="flex-1 min-h-10 py-2 bg-wa-ground hover:bg-wa-rose text-wa-plum text-xs font-bold rounded-full transition cursor-pointer border border-wa-line flex items-center justify-center gap-1.5"
                      >
                        <span>Focus Topics</span>
                        <ChevronRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleJoinCircle(group.id)}
                        className={`min-h-10 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isJoined 
                            ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:text-emerald-300' 
                            : 'bg-wa-crimson hover:bg-wa-crimson-press text-white shadow-xs'
                        }`}
                      >
                        {isJoined ? <CheckCircle2 size={14} /> : <Bookmark size={14} />}
                        <span>{isJoined ? 'Joined' : 'Join group'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Focus Topics Modal */}
          {selectedCircleDetail && (
            <div className="fixed inset-0 bg-[#3B0F2C]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-wa-surface border border-wa-line rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-start border-b border-wa-line-soft pb-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-wa-crimson font-bold">
                      Specialized Peer Circle
                    </span>
                    <h3 className="font-display font-bold text-base text-wa-plum mt-0.5">
                      {selectedCircleDetail.name}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedCircleDetail(null)}
                    className="p-1 rounded-full text-wa-plum-muted hover:text-wa-plum transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-wa-plum-muted mb-1.5">
                      Weekly Clinical Focus Topics
                    </h4>
                    <div className="space-y-1.5">
                      {selectedCircleDetail.recentTopics.map((topic: string, i: number) => (
                        <div key={i} className="p-2.5 bg-wa-ground border border-wa-line rounded-xl text-xs font-semibold text-wa-plum flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-wa-crimson"></span>
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[#FDF9FB] border border-wa-line rounded-xl text-xs text-wa-plum-muted space-y-1">
                    <span className="font-bold text-wa-plum block">Schedule & Format:</span>
                    <p className="flex items-center gap-1.5">
                      <Clock size={12} className="text-wa-crimson" />
                      <span>{selectedCircleDetail.meetingSchedule}</span>
                    </p>
                    <p>Facilitated by {selectedCircleDetail.mentor}. Peer discussions provide lived experience and complement your personal hematology care plan.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCircleDetail(null)}
                  className="w-full min-h-11 py-2.5 bg-wa-hero hover:bg-wa-hero/90 text-white rounded-full text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. VILLAGE FORUM TAB (COMMUNITY DISCUSSIONS & LIVED TIPS)      */}
      {/* ============================================================== */}
      {activeTab === 'forum' && (
        <div className="space-y-5">
          {/* Community Moderation, Unverified Advice Filter & Guardian Mode Banner */}
          <div className="bg-wa-surface p-4 sm:p-5 rounded-[24px] border border-wa-line shadow-2xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-wa-rose text-wa-crimson">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-display font-bold text-wa-plum">
                    Community Safety &amp; Guardian Protection
                  </h3>
                  <p className="text-xs text-wa-plum-muted">
                    Peer stories offer lived encouragement—never replace your hematologist&apos;s plan or Hydroxyurea regimen.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleGuardianMode}
                  aria-pressed={guardianSafeMode}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer border ${
                    guardianSafeMode
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-wa-ground text-wa-plum border-wa-line hover:border-wa-crimson'
                  }`}
                >
                  <ShieldCheck size={13} />
                  <span>{guardianSafeMode ? 'Guardian / Minor Mode: ON' : 'Guardian / Minor Mode'}</span>
                </button>
                {(reportedPostIds.length > 0 || mutedAuthors.length > 0) && (
                  <button
                    type="button"
                    onClick={handleRestoreModeration}
                    className="inline-flex items-center gap-1 rounded-full bg-wa-ground border border-wa-line px-3 py-1.5 text-xs font-bold text-wa-plum-muted hover:text-wa-plum cursor-pointer"
                  >
                    <span>Restore hidden ({reportedPostIds.length + mutedAuthors.length})</span>
                  </button>
                )}
              </div>
            </div>
            {moderationNotice && (
              <div role="status" className="flex items-center justify-between gap-2 rounded-xl bg-wa-rose/60 px-3 py-2 text-xs font-semibold text-wa-plum border border-wa-line-soft">
                <span>{moderationNotice}</span>
                <button
                  type="button"
                  onClick={() => setModerationNotice(null)}
                  className="text-wa-plum-muted hover:text-wa-plum font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Category Filter Pills & Create Button Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-wa-surface p-3.5 rounded-[24px] border border-wa-line shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {['All', 'General', 'Medication', 'Nutrition', 'Mental Health', 'Advocacy'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`min-h-11 px-4 rounded-full text-[13px] font-bold transition cursor-pointer whitespace-nowrap ${
                    activeCategory === cat 
                      ? 'bg-wa-hero text-white shadow-xs' 
                      : 'bg-wa-ground text-wa-plum-muted border border-wa-line hover:text-wa-plum'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowNewPost(true)}
              className="min-h-11 px-4 py-2 bg-wa-crimson hover:bg-wa-crimson-press text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
            >
              <Plus size={14} />
              <span>New Entry</span>
            </button>
          </div>

          {/* Posts List */}
          <div className="space-y-3.5">
            {posts
              .filter(p => !reportedPostIds.includes(p.id) && !mutedAuthors.includes(p.authorName || ''))
              .filter(p => !guardianSafeMode || !hasUnverifiedRemedyClaim(`${p.title} ${p.content}`))
              .filter(p => activeCategory === 'All' || p.tags?.includes(activeCategory))
              .map(post => {
                const flaggedForAdvice = hasUnverifiedRemedyClaim(`${post.title} ${post.content}`);
                return (
                <div 
                  key={post.id} 
                  className="bg-wa-surface p-5 rounded-2xl shadow-2xs border border-wa-line space-y-3 hover:border-wa-crimson/30 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-wa-rose/60 text-wa-crimson rounded-xl flex items-center justify-center text-xs font-bold border border-wa-line-soft">
                        {(post.authorName || 'W')[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-wa-plum">{post.authorName || 'Warrior'}</span>
                        <p className="text-xs text-wa-plum-muted">
                          {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Community member'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(post.tags || []).map((tag: string) => (
                        <span key={tag} className="text-xs font-bold bg-wa-rose text-wa-crimson px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold font-display text-wa-plum leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-wa-plum-muted leading-relaxed font-normal">
                      {post.content}
                    </p>
                  </div>

                  {flaggedForAdvice && (
                    <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <ShieldAlert size={14} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>
                        Safety Notice: This post mentions unverified remedies or medication changes. Consult your hematologist before altering your care plan.
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-wa-line-soft">
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-wa-plum-muted hover:text-wa-crimson transition cursor-pointer"
                      >
                        <Heart size={15} className={post.likes && post.likes > 0 ? 'text-wa-crimson fill-wa-crimson' : ''} />
                        <span>{post.likes || 0} Helpful</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleSharePost(post)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-wa-plum-muted hover:text-wa-plum transition cursor-pointer"
                      >
                        <Share2 size={14} />
                        <span>{copiedPostId === post.id ? 'Copied!' : 'Share'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleMuteAuthor(post.authorName || 'Warrior')}
                        className="flex min-h-11 items-center gap-1 px-2 text-xs font-semibold text-wa-plum-muted hover:text-wa-plum transition cursor-pointer"
                        title="Mute posts from this author"
                      >
                        <VolumeX size={13} />
                        <span>Mute user</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReportPost(post.id, post.title)}
                        className="flex min-h-11 items-center gap-1 px-2 text-xs font-semibold text-wa-plum-muted hover:text-wa-crimson transition cursor-pointer"
                        title="Report post for moderation review"
                      >
                        <ShieldAlert size={13} />
                        <span>Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
          </div>

          {/* New Post Modal */}
          {showNewPost && (
            <div className="fixed inset-0 bg-[#3B0F2C]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-wa-surface border border-wa-line rounded-[28px] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-wa-plum">
                <div className="flex justify-between items-center border-b border-wa-line-soft pb-3">
                  <div>
                    <h3 className="text-base font-display font-bold text-wa-plum">Share Community Insight</h3>
                    <p className="text-xs text-wa-plum-muted">Post tips, coping stories, or questions for fellow warriors</p>
                  </div>
                  <button 
                    onClick={() => setShowNewPost(false)} 
                    className="p-1 rounded-full text-wa-plum-muted hover:text-wa-plum transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-wa-plum-muted block mb-1">
                      Category
                    </label>
                    <select
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value)}
                      className="w-full bg-wa-ground border border-wa-line rounded-xl px-3.5 py-2 text-base text-wa-plum font-semibold focus:outline-none focus:border-wa-crimson"
                    >
                      {['General', 'Medication', 'Nutrition', 'Mental Health', 'Advocacy'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-wa-plum-muted block mb-1">
                      Title
                    </label>
                    <input 
                      type="text" 
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="e.g. Tips for navigating long lecture days..." 
                      className="w-full bg-wa-ground border border-wa-line rounded-xl px-3.5 py-2.5 text-base text-wa-plum font-semibold focus:outline-none focus:border-wa-crimson"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-wa-plum-muted block mb-1">
                      Insight / Question
                    </label>
                    <textarea 
                      rows={4}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share what worked for you or ask the community..." 
                      className="w-full bg-wa-ground border border-wa-line rounded-xl px-3.5 py-2.5 text-base text-wa-plum font-medium resize-none focus:outline-none focus:border-wa-crimson"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-wa-line-soft">
                  <button
                    type="button"
                    onClick={() => setShowNewPost(false)}
                    className="px-4 py-2 bg-wa-ground hover:bg-[#E6D8E0] text-wa-plum-muted rounded-full text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddPost}
                    disabled={!newPostTitle.trim() || !newPostContent.trim()}
                    className="min-h-11 px-5 py-2 bg-wa-crimson hover:bg-wa-crimson-press disabled:opacity-50 text-white rounded-full text-xs font-bold transition shadow-xs"
                  >
                    Publish Post
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Community;
