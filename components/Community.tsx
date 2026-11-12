import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Heart, Share2, Plus, X, Search, 
  Phone, Mail, MapPin, Filter, ArrowUpDown, Users, 
  ShieldAlert, Check, Sparkles, Clock, 
  ExternalLink, Building2, CheckCircle2, ChevronRight, Bookmark
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';

interface SupportCenter {
  id: string;
  center_name: string;
  category: 'Specialized Clinics' | 'Support Groups' | 'NGOs';
  description?: string;
  phone: string;
  email: string;
  address: string;
  geocoordinates: {
    latitude: number;
    longitude: number;
  };
  city: 'Lagos' | 'Abuja' | 'Ogun';
}

const SUPPORT_CENTERS: SupportCenter[] = [
  {
    id: 'scfn-lagos',
    center_name: 'Sickle Cell Foundation of Nigeria (SCFN)',
    category: 'NGOs',
    description: 'Pioneering non-governmental organization dedicated to sickle cell care, newborn screening, prenatal diagnosis, and genetic counseling across West Africa.',
    phone: '+2348035846666',
    email: 'info@sicklecellfoundation.com',
    address: 'National Sickle Cell Centre, opposite LUTH, Idi-Araba, Surulere, Lagos, Nigeria',
    geocoordinates: { latitude: 6.5135, longitude: 3.3610 },
    city: 'Lagos'
  },
  {
    id: 'luth-clinic-lagos',
    center_name: 'LUTH Sickle Cell Specialized Center',
    category: 'Specialized Clinics',
    description: 'Premier academic hematology day-care and inpatient emergency facility offering hydroxyurea optimization, transfusion medicine, and VOC rapid management.',
    phone: '+23412703333',
    email: 'clinical@luth.org.ng',
    address: 'LUTH Complex, Ishaga Rd, Idi-Araba, Surulere, Lagos, Nigeria',
    geocoordinates: { latitude: 6.5152, longitude: 3.3639 },
    city: 'Lagos'
  },
  {
    id: 'garki-abuja',
    center_name: 'Abuja National Hospital Hematology Unit',
    category: 'Specialized Clinics',
    description: 'Federal tertiary clinical referral center equipped with apheresis, routine hemoglobin surveillance, pediatric hematology, and emergency VOC crisis bays.',
    phone: '+23492901561',
    email: 'contact@nationalhospital.gov.ng',
    address: 'Plot 242, Garki-II, Abuja, Nigeria',
    geocoordinates: { latitude: 9.0223, longitude: 7.4722 },
    city: 'Abuja'
  },
  {
    id: 'abuja-mutual-help',
    center_name: 'Abuja Warriors Mutual Help Circle',
    category: 'Support Groups',
    description: 'Community-led peer collective providing lived-experience crisis buddy systems, nutrition workshops, hospital visitation, and mutual warrior aid.',
    phone: '+2348129994444',
    email: 'abujawarriors@gmail.com',
    address: 'Area 11 Community Center, Garki, Abuja, Nigeria',
    geocoordinates: { latitude: 9.0305, longitude: 7.4811 },
    city: 'Abuja'
  },
  {
    id: 'fmc-abeokuta',
    center_name: 'FMC Abeokuta Sickle Cell Specialized Center',
    category: 'Specialized Clinics',
    description: 'Regional tertiary referral center providing dedicated hematology clinics, pediatric crisis stabilization, hydroxyurea monitoring, and comprehensive care for Ogun State.',
    phone: '+2348037213456',
    email: 'clinical@fmcabeokuta.org.ng',
    address: 'Bisi Onabanjo Way, Idi-Aba, Abeokuta, Ogun State, Nigeria',
    geocoordinates: { latitude: 7.1557, longitude: 3.3458 },
    city: 'Ogun'
  },
  {
    id: 'oouth-sagamu',
    center_name: 'OOUTH Sagamu Hematology & Day-Care Clinic',
    category: 'Specialized Clinics',
    description: 'University teaching hospital delivering comprehensive sickle cell clinical management, newborn screening, day-care hydration, and emergency VOC pain protocol management.',
    phone: '+2348033451290',
    email: 'hematology@oouth.org.ng',
    address: 'Hospital Complex, Sagamu - Ikenne Rd, Sagamu, Ogun State, Nigeria',
    geocoordinates: { latitude: 6.8402, longitude: 3.6521 },
    city: 'Ogun'
  },
  {
    id: 'ogun-warriors-support',
    center_name: 'Ogun State Sickle Cell Warriors Support Network',
    category: 'Support Groups',
    description: 'Grassroots patient and caregiver mutual support community offering monthly support circles, peer hydration buddies, caregiver relief, and crisis transport aid across Ogun State.',
    phone: '+2348028887766',
    email: 'ogunwarriors@gmail.com',
    address: 'Community Health Wing, Sacred Heart Hospital, Lantoro, Abeokuta, Ogun State, Nigeria',
    geocoordinates: { latitude: 7.1475, longitude: 3.3520 },
    city: 'Ogun'
  },
  {
    id: 'scaf-ogun',
    center_name: 'Sickle Cell Aid Foundation (SCAF) - Ogun',
    category: 'NGOs',
    description: 'Advocacy and compassionate care NGO coordinating free genotype testing, educational awareness campaigns, and subsidized routine medications for vulnerable warriors.',
    phone: '+2348123456780',
    email: 'contact@scaf.org.ng',
    address: 'Kuto Area Civic Center, Abeokuta, Ogun State, Nigeria',
    geocoordinates: { latitude: 7.1412, longitude: 3.3475 },
    city: 'Ogun'
  }
];

// Major location coordinates for relative distance calculation
const CITY_EPICENTERS = {
  Lagos: { latitude: 6.4550, longitude: 3.3840 },
  Abuja: { latitude: 9.0765, longitude: 7.3986 },
  Ogun: { latitude: 7.1557, longitude: 3.3458 }
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
  const [activeTab, setActiveTab] = useState<'support' | 'warrior_match' | 'forum'>('support');
  
  // --- Support Directory States ---
  const [selectedCity, setSelectedCity] = useState<'Lagos' | 'Abuja' | 'Ogun'>('Lagos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');
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

  // --- Haversine Formula for Real-Time distance calculation ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const currentEpicenter = CITY_EPICENTERS[selectedCity];

  // Process centers list: add distances, filter, sort
  const processedCenters = SUPPORT_CENTERS.map(center => {
    const dist = calculateDistance(
      currentEpicenter.latitude, 
      currentEpicenter.longitude, 
      center.geocoordinates.latitude, 
      center.geocoordinates.longitude
    );
    return { ...center, distance: parseFloat(dist.toFixed(1)) };
  })
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
  .sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance - b.distance;
    } else {
      return a.center_name.localeCompare(b.center_name);
    }
  });

  const featuredCenter = processedCenters[0];
  const remainingCenters = processedCenters.slice(1);

  return (
    <div className="space-y-5" data-semantic>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6D8E0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#3B0F2C] tracking-tight">Community & Support</h1>
          <p className="text-xs sm:text-sm text-[#6E4A63] mt-0.5">Strength in connection, verified care in proximity.</p>
        </div>

        {/* Tab Switcher Pills */}
        <div role="tablist" aria-label="Community destinations" className="flex items-center gap-1 p-1 rounded-full bg-white border border-[#E6D8E0] shadow-2xs max-w-fit">
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'support'}
            onClick={() => setActiveTab('support')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'support' 
                ? 'bg-[#3B0F2C] text-white shadow-xs' 
                : 'text-[#6E4A63] hover:text-[#3B0F2C] hover:bg-[#F7F2F5]'
            }`}
          >
            <MapPin size={13} className={activeTab === 'support' ? 'text-[#FBE4E8]' : 'text-[#C4122F]'} />
            <span>Care Directory</span>
          </button>
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'warrior_match'}
            onClick={() => setActiveTab('warrior_match')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'warrior_match' 
                ? 'bg-[#3B0F2C] text-white shadow-xs' 
                : 'text-[#6E4A63] hover:text-[#3B0F2C] hover:bg-[#F7F2F5]'
            }`}
          >
            <Users size={13} className={activeTab === 'warrior_match' ? 'text-[#FBE4E8]' : 'text-[#C4122F]'} />
            <span>Peer Circles</span>
          </button>
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'forum'}
            onClick={() => setActiveTab('forum')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'forum' 
                ? 'bg-[#3B0F2C] text-white shadow-xs' 
                : 'text-[#6E4A63] hover:text-[#3B0F2C] hover:bg-[#F7F2F5]'
            }`}
          >
            <MessageSquare size={13} className={activeTab === 'forum' ? 'text-[#FBE4E8]' : 'text-[#C4122F]'} />
            <span>Village Forum</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. CARE DIRECTORY TAB (DESIGN.MD 8.13 PRIMARY SPEC)            */}
      {/* ============================================================== */}
      {activeTab === 'support' && (
        <div className="space-y-5">
          {/* Controls Bar: Search, City Epicenter, Sort, Filter */}
          <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-[#E6D8E0] shadow-2xs space-y-3.5">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
              
              {/* City selector */}
              <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                <span className="text-[10px] font-mono font-bold text-[#6E4A63] uppercase tracking-wider shrink-0 mr-1">Location:</span>
                {(['Lagos', 'Abuja', 'Ogun'] as const).map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setSelectedCity(city);
                      setSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedCity === city 
                        ? 'bg-[#3B0F2C] text-white shadow-xs' 
                        : 'bg-[#F7F2F5] text-[#6E4A63] border border-[#E6D8E0] hover:text-[#3B0F2C]'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              {/* Category filter & Sort by */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                <div className="flex items-center gap-1.5 bg-[#F7F2F5] px-3 py-1.5 rounded-full border border-[#E6D8E0]">
                  <Filter size={13} className="text-[#6E4A63]" />
                  <select 
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    aria-label="Filter resource categories"
                    className="bg-transparent border-none text-xs text-[#3B0F2C] font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Resources</option>
                    <option value="Specialized Clinics">Specialized Clinics</option>
                    <option value="Support Groups">Support Groups</option>
                    <option value="NGOs">NGOs</option>
                  </select>
                </div>

                <button 
                  type="button"
                  onClick={() => setSortBy(prev => prev === 'distance' ? 'name' : 'distance')}
                  className="flex items-center gap-1.5 bg-[#F7F2F5] border border-[#E6D8E0] hover:bg-[#FBE4E8] px-3 py-1.5 rounded-full text-xs font-bold text-[#3B0F2C] cursor-pointer transition"
                  title="Toggle Sorting Mode"
                >
                  <ArrowUpDown size={13} className="text-[#C4122F]" />
                  <span>Sort: {sortBy === 'distance' ? 'Distance' : 'Name'}</span>
                </button>
              </div>
            </div>

            {/* Keyword search input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-[#6E4A63]" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search centers in ${selectedCity} (e.g. hematology, foundation, emergency)`} 
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F9] rounded-full border border-[#E6D8E0] text-xs font-medium text-[#3B0F2C] placeholder:text-[#6E4A63]/60 focus:outline-none focus:border-[#C4122F] transition"
              />
            </div>
          </div>

          {/* Directory Listings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold font-mono text-[#6E4A63] uppercase tracking-wider">
                {processedCenters.length} Verified Facilities & Networks in {selectedCity}
              </h2>
            </div>

            {processedCenters.length > 0 ? (
              <div className="space-y-4">
                {/* 1. First result as Plum Feature Card (DESIGN.md 8.13) */}
                {featuredCenter && (
                  <div className="bg-[#3B0F2C] text-white rounded-[28px] p-5 sm:p-6 shadow-md border border-[#E6D8E0] relative overflow-hidden space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C4122F] text-white px-3 py-0.5 rounded-full shadow-2xs">
                          Featured &bull; {featuredCenter.category}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#FBE4E8] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                        📍 {featuredCenter.distance} km from center
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">
                        {featuredCenter.center_name}
                      </h3>
                      {featuredCenter.description && (
                        <p className="text-xs sm:text-sm text-[#D9B9CC] mt-1.5 leading-relaxed font-medium max-w-3xl">
                          {featuredCenter.description}
                        </p>
                      )}
                      <p className="text-xs text-[#FBE4E8] flex items-center gap-1.5 mt-2.5">
                        <MapPin size={14} className="text-[#C4122F] shrink-0" />
                        <span>{featuredCenter.address}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                      <a 
                        href={`tel:${featuredCenter.phone}`}
                        className="min-h-11 px-5 py-2.5 bg-[#C4122F] hover:bg-[#9E0E26] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Phone size={14} />
                        <span>Call {featuredCenter.phone}</span>
                      </a>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(featuredCenter.center_name + ' ' + featuredCenter.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-11 px-5 py-2.5 bg-white hover:bg-[#FAF7F9] text-[#3B0F2C] rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <ExternalLink size={14} />
                        <span>Directions</span>
                      </a>
                      <a 
                        href={`mailto:${featuredCenter.email}`}
                        className="min-h-11 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Mail size={14} />
                        <span>Email</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* 2. Remaining results as clean white cards (DESIGN.md 8.13) */}
                {remainingCenters.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {remainingCenters.map((center) => {
                      const isClinicOrNgo = center.category === 'Specialized Clinics' || center.category === 'NGOs';
                      return (
                        <div 
                          key={center.id}
                          className="bg-white border border-[#E6D8E0] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isClinicOrNgo ? 'bg-[#FDF2F4] text-[#C4122F]' : 'bg-[#E8F8EE] text-[#1E7B4A]'
                                }`}>
                                  <Building2 size={16} />
                                </div>
                                <div>
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E4A63] block">
                                    {center.category} &bull; {center.city}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-[#6E4A63] bg-[#FAF7F9] px-2 py-0.5 rounded-full border border-[#E6D8E0]">
                                {center.distance} km
                              </span>
                            </div>

                            <h3 className="font-display font-bold text-sm sm:text-base text-[#3B0F2C] tracking-tight leading-snug mb-1">
                              {center.center_name}
                            </h3>
                            <p className="text-xs text-[#6E4A63] flex items-start gap-1.5 leading-relaxed mb-3">
                              <MapPin size={13} className="text-[#C4122F] shrink-0 mt-0.5" />
                              <span className="truncate">{center.address}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-3 border-t border-[#F1E6EC] mt-auto">
                            <a 
                              href={`tel:${center.phone}`}
                              className="min-h-10 flex-1 px-3 py-2 bg-[#C4122F] hover:bg-[#9E0E26] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-2xs transition"
                            >
                              <Phone size={13} />
                              <span>Call</span>
                            </a>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.center_name + ' ' + center.address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="min-h-10 px-3.5 py-2 bg-[#FAF7F9] hover:bg-[#F7F2F5] text-[#3B0F2C] border border-[#E6D8E0] rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition"
                            >
                              <ExternalLink size={13} />
                              <span>Route</span>
                            </a>
                            <a 
                              href={`mailto:${center.email}`}
                              className="min-h-10 px-3 py-2 bg-[#FAF7F9] hover:bg-[#F7F2F5] text-[#6E4A63] border border-[#E6D8E0] rounded-full text-xs font-semibold flex items-center justify-center"
                              title="Send Email"
                            >
                              <Mail size={13} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 bg-white rounded-2xl border border-[#E6D8E0] text-center space-y-2 p-6">
                <Building2 size={32} className="mx-auto text-[#6E4A63]/60 mb-2" />
                <h3 className="font-bold text-sm text-[#3B0F2C]">No facilities match active filters</h3>
                <p className="text-xs text-[#6E4A63] max-w-xs mx-auto">
                  Try clearing your search query or selecting a different category filter.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategoryFilter('All'); }}
                  className="mt-2 px-4 py-2 bg-[#F7F2F5] text-[#3B0F2C] hover:bg-[#FBE4E8] rounded-full text-xs font-bold transition cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Sticky Emergency Assistance Box */}
          <div className="bg-[#3B0F2C] text-white rounded-[24px] p-5 sm:p-6 shadow-sm border border-[#E6D8E0] flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#C4122F] flex items-center justify-center text-white shrink-0 shadow-xs">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FBE4E8] block">
                  Critical Sickle Cell Helpline
                </span>
                <h3 className="text-base sm:text-lg font-bold font-display text-white tracking-tight">
                  Facing an Acute Vaso-Occlusive Crisis?
                </h3>
                <p className="text-xs text-[#D9B9CC] mt-0.5 max-w-md">
                  Connect with the National Sickle Cell Hotline or standard emergency services.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <a 
                href="tel:+2348035846666" 
                className="flex-1 md:flex-none min-h-10 px-4 py-2.5 bg-[#C4122F] hover:bg-[#9E0E26] text-white rounded-full text-xs font-bold text-center uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-2"
              >
                <Phone size={14} />
                <span>SCFN Hotline</span>
              </a>
              <a 
                href="tel:112" 
                className="flex-1 md:flex-none min-h-10 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full text-xs font-bold text-center uppercase tracking-wider transition flex items-center justify-center gap-1.5"
              >
                <span>Call 112 / 911</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PEER CIRCLES TAB (COMORBIDITY & LIVED EXPERIENCE MATCHING)    */}
      {/* ============================================================== */}
      {activeTab === 'warrior_match' && (
        <div className="space-y-5">
          {/* Intro Card */}
          <div className="bg-[#3B0F2C] text-white rounded-[28px] p-5 sm:p-6 shadow-sm border border-[#E6D8E0]">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[11px] font-bold text-[#FBE4E8] uppercase tracking-wider">
                <Sparkles size={12} className="text-[#FBE4E8]" />
                <span>Comorbidity Lived-Experience Matching</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
                Find Your Health Journey Peer Circles
              </h2>
              <p className="text-xs sm:text-sm text-[#D9B9CC] leading-relaxed">
                Connect with mentors and warriors managing specific secondary conditions—such as Avascular Necrosis (AVN), Asthma, Leg Ulcers, or Stroke surveillance.
              </p>
            </div>
          </div>

          {/* Comorbidity Selection Chips */}
          <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-[#E6D8E0] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono text-[#3B0F2C] uppercase tracking-wider">
                  Select Your Health Factors & Comorbidities
                </h3>
                <p className="text-xs text-[#6E4A63] mt-0.5">Filter specialized peer circles by your specific diagnosis:</p>
              </div>
              <span className="text-[10px] font-bold bg-[#FBE4E8] text-[#C4122F] px-2.5 py-1 rounded-full">
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
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#C4122F] text-white shadow-xs'
                        : 'bg-[#F7F2F5] hover:bg-[#FBE4E8] text-[#3B0F2C] border border-[#E6D8E0]'
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
            <h3 className="text-xs font-bold font-mono text-[#6E4A63] uppercase tracking-wider px-1">
              Recommended Peer Circles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {MATCH_GROUPS.map((group) => {
                const isMatching = group.comorbidities.some(c => selectedComorbidities.includes(c));
                const isJoined = joinedCircleIds.includes(group.id);

                return (
                  <div 
                    key={group.id} 
                    className={`bg-white border rounded-2xl p-5 space-y-3.5 transition-all shadow-2xs ${
                      isMatching ? 'border-[#C4122F]/40 ring-1 ring-[#C4122F]/20' : 'border-[#E6D8E0]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isMatching ? 'bg-[#FBE4E8] text-[#C4122F]' : 'bg-[#FAF7F9] text-[#6E4A63] border border-[#E6D8E0]'
                        }`}>
                          {isMatching ? '98% Comorbidity Match' : 'Open Circle'}
                        </span>
                        <h4 className="font-display font-bold text-sm sm:text-base text-[#3B0F2C] mt-1.5 leading-snug">
                          {group.name}
                        </h4>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-[#FDF2F4] text-[#C4122F] flex items-center justify-center shrink-0">
                        <Users size={18} />
                      </div>
                    </div>

                    <p className="text-xs text-[#6E4A63] leading-relaxed font-medium">
                      {group.description}
                    </p>

                    <div className="space-y-1.5 text-xs border-t border-[#F1E6EC] pt-2.5 text-[#6E4A63]">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Mentor:</span>
                        <span className="font-bold text-[#C4122F]">{group.mentor}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Sessions:</span>
                        <span className="text-[#3B0F2C] font-medium">{group.meetingSchedule}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Active Warriors:</span>
                        <span className="text-[#3B0F2C] font-mono font-bold">{group.membersCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCircleDetail(group)}
                        className="flex-1 min-h-10 py-2 bg-[#F7F2F5] hover:bg-[#FBE4E8] text-[#3B0F2C] text-xs font-bold rounded-full transition cursor-pointer border border-[#E6D8E0] flex items-center justify-center gap-1.5"
                      >
                        <span>Focus Topics</span>
                        <ChevronRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleJoinCircle(group.id)}
                        className={`min-h-10 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isJoined 
                            ? 'bg-[#E8F8EE] text-[#1E7B4A] border border-[#B3E5C7]' 
                            : 'bg-[#C4122F] hover:bg-[#9E0E26] text-white shadow-xs'
                        }`}
                      >
                        {isJoined ? <CheckCircle2 size={14} /> : <Bookmark size={14} />}
                        <span>{isJoined ? 'Joined' : 'Join Circle'}</span>
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
              <div className="bg-white border border-[#E6D8E0] rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-start border-b border-[#F1E6EC] pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C4122F] font-bold">
                      Specialized Peer Circle
                    </span>
                    <h3 className="font-display font-bold text-base text-[#3B0F2C] mt-0.5">
                      {selectedCircleDetail.name}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedCircleDetail(null)}
                    className="p-1 rounded-full text-[#6E4A63] hover:text-[#3B0F2C] transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E4A63] mb-1.5 font-mono">
                      Weekly Clinical Focus Topics
                    </h4>
                    <div className="space-y-1.5">
                      {selectedCircleDetail.recentTopics.map((topic: string, i: number) => (
                        <div key={i} className="p-2.5 bg-[#FAF7F9] border border-[#E6D8E0] rounded-xl text-xs font-semibold text-[#3B0F2C] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C4122F]"></span>
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[#FDF9FB] border border-[#E6D8E0] rounded-xl text-xs text-[#6E4A63] space-y-1">
                    <span className="font-bold text-[#3B0F2C] block">Schedule & Format:</span>
                    <p className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#C4122F]" />
                      <span>{selectedCircleDetail.meetingSchedule}</span>
                    </p>
                    <p>Facilitated by {selectedCircleDetail.mentor}. Peer discussions provide lived experience and complement your personal hematology care plan.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCircleDetail(null)}
                  className="w-full py-2.5 bg-[#3B0F2C] hover:bg-[#2A081D] text-white rounded-full text-xs font-bold transition cursor-pointer"
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
          {/* Category Filter Pills & Create Button Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-[24px] border border-[#E6D8E0] shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {['All', 'General', 'Medication', 'Nutrition', 'Mental Health', 'Advocacy'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    activeCategory === cat 
                      ? 'bg-[#3B0F2C] text-white shadow-xs' 
                      : 'bg-[#F7F2F5] text-[#6E4A63] border border-[#E6D8E0] hover:text-[#3B0F2C]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowNewPost(true)}
              className="px-4 py-2 bg-[#C4122F] hover:bg-[#9E0E26] text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
            >
              <Plus size={14} />
              <span>New Entry</span>
            </button>
          </div>

          {/* Posts List */}
          <div className="space-y-3.5">
            {posts
              .filter(p => activeCategory === 'All' || p.tags?.includes(activeCategory))
              .map(post => (
                <div 
                  key={post.id} 
                  className="bg-white p-5 rounded-2xl shadow-2xs border border-[#E6D8E0] space-y-3 hover:border-[#C4122F]/30 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-[#FDF2F4] text-[#C4122F] rounded-xl flex items-center justify-center text-xs font-bold border border-[#F1E6EC]">
                        {(post.authorName || 'W')[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#3B0F2C]">{post.authorName || 'Warrior'}</span>
                        <p className="text-[10px] font-mono text-[#6E4A63]">
                          {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Community member'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(post.tags || []).map((tag: string) => (
                        <span key={tag} className="text-[10px] font-bold bg-[#FBE4E8] text-[#C4122F] px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold font-display text-[#3B0F2C] leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6E4A63] leading-relaxed font-normal">
                      {post.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#F1E6EC]">
                    <button 
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#6E4A63] hover:text-[#C4122F] transition cursor-pointer"
                    >
                      <Heart size={15} className={post.likes && post.likes > 0 ? 'text-[#C4122F] fill-[#C4122F]' : ''} />
                      <span>{post.likes || 0} Helpful</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleSharePost(post)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#6E4A63] hover:text-[#3B0F2C] transition cursor-pointer"
                    >
                      <Share2 size={14} />
                      <span>{copiedPostId === post.id ? 'Copied!' : 'Share'}</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* New Post Modal */}
          {showNewPost && (
            <div className="fixed inset-0 bg-[#3B0F2C]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-[#E6D8E0] rounded-[28px] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-[#3B0F2C]">
                <div className="flex justify-between items-center border-b border-[#F1E6EC] pb-3">
                  <div>
                    <h3 className="text-base font-display font-bold text-[#3B0F2C]">Share Community Insight</h3>
                    <p className="text-xs text-[#6E4A63]">Post tips, coping stories, or questions for fellow warriors</p>
                  </div>
                  <button 
                    onClick={() => setShowNewPost(false)} 
                    className="p-1 rounded-full text-[#6E4A63] hover:text-[#3B0F2C] transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E4A63] block mb-1">
                      Category
                    </label>
                    <select
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value)}
                      className="w-full bg-[#FAF7F9] border border-[#E6D8E0] rounded-xl px-3.5 py-2 text-xs text-[#3B0F2C] font-semibold focus:outline-none focus:border-[#C4122F]"
                    >
                      {['General', 'Medication', 'Nutrition', 'Mental Health', 'Advocacy'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E4A63] block mb-1">
                      Title
                    </label>
                    <input 
                      type="text" 
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="e.g. Tips for navigating long lecture days..." 
                      className="w-full bg-[#FAF7F9] border border-[#E6D8E0] rounded-xl px-3.5 py-2.5 text-xs text-[#3B0F2C] font-semibold focus:outline-none focus:border-[#C4122F]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E4A63] block mb-1">
                      Insight / Question
                    </label>
                    <textarea 
                      rows={4}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share what worked for you or ask the community..." 
                      className="w-full bg-[#FAF7F9] border border-[#E6D8E0] rounded-xl px-3.5 py-2.5 text-xs text-[#3B0F2C] font-medium resize-none focus:outline-none focus:border-[#C4122F]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#F1E6EC]">
                  <button
                    type="button"
                    onClick={() => setShowNewPost(false)}
                    className="px-4 py-2 bg-[#F7F2F5] hover:bg-[#E6D8E0] text-[#6E4A63] rounded-full text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddPost}
                    disabled={!newPostTitle.trim() || !newPostContent.trim()}
                    className="px-5 py-2 bg-[#C4122F] hover:bg-[#9E0E26] disabled:opacity-50 text-white rounded-full text-xs font-bold transition shadow-xs"
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
