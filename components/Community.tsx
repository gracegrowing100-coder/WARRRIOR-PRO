import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Heart, Share2, Tag, Plus, X, Search, Award, Shield, 
  Phone, Mail, MapPin, AlertCircle, Filter, ArrowUpDown, GraduationCap, Users, ShieldAlert 
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';

interface SupportCenter {
  id: string;
  center_name: string;
  category: 'NGOs' | 'Support Groups' | 'Specialized Clinics';
  phone: string;
  email: string;
  address: string;
  geocoordinates: {
    latitude: number;
    longitude: number;
  };
  city: 'Lagos' | 'Abuja' | 'London' | 'Houston';
}

const SUPPORT_CENTERS: SupportCenter[] = [
  {
    id: 'scfn-lagos',
    center_name: 'Sickle Cell Foundation of Nigeria (SCFN)',
    category: 'NGOs',
    phone: '+2348035846666',
    email: 'info@sicklecellfoundation.com',
    address: 'National Sickle Cell Centre, opposite LUTH, Idi-Araba, Surulere, Lagos, Nigeria',
    geocoordinates: { latitude: 6.5135, longitude: 3.3610 },
    city: 'Lagos'
  },
  {
    id: 'luth-clinic-lagos',
    center_name: 'Lagos University Teaching Hospital - Sickle Cell clinic',
    category: 'Specialized Clinics',
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
    phone: '+2348129994444',
    email: 'abujawarriors@gmail.com',
    address: 'Area 11 Community Center, Garki, Abuja, Nigeria',
    geocoordinates: { latitude: 9.0305, longitude: 7.4811 },
    city: 'Abuja'
  },
  {
    id: 'scs-london',
    center_name: 'Sickle Cell Society London',
    category: 'NGOs',
    phone: '+442077377711',
    email: 'info@sicklecellsociety.org',
    address: '54 Station Road, Harlesden, London, NW10 4UA, UK',
    geocoordinates: { latitude: 51.5312, longitude: -0.2513 },
    city: 'London'
  },
  {
    id: 'texas-childrens-houston',
    center_name: "Texas Children's Hematology Program",
    category: 'Specialized Clinics',
    phone: '+18328224263',
    email: 'hem@texaschildrens.org',
    address: '6701 Fannin St, Houston, TX 77030, USA',
    geocoordinates: { latitude: 29.7042, longitude: -95.4025 },
    city: 'Houston'
  },
  {
    id: 'sca-houston',
    center_name: 'The Sickle Cell Association of Houston',
    category: 'NGOs',
    phone: '+18323013569',
    email: 'reachout@scahouston.org',
    address: '8303 Southwest Fwy, Houston, TX 77074, USA',
    geocoordinates: { latitude: 29.6917, longitude: -95.5305 },
    city: 'Houston'
  }
];

// Major locations coordinates for relative distance calculation
const CITY_EPICENTERS = {
  Lagos: { latitude: 6.4550, longitude: 3.3840 },
  Abuja: { latitude: 9.0765, longitude: 7.3986 },
  London: { latitude: 51.5074, longitude: -0.1278 },
  Houston: { latitude: 29.7604, longitude: -95.3698 }
};

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forum' | 'support' | 'warrior_match'>('warrior_match');
  
  // --- Forum States ---
  const [posts, setPosts] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Warrior Match States ---
  const [selectedComorbidities, setSelectedComorbidities] = useState<string[]>([
    'Avascular Necrosis (AVN)',
    'Asthma'
  ]);
  const [activeJoinedGroup, setActiveJoinedGroup] = useState<string | null>(null);
  const [joinedMessageText, setJoinedMessageText] = useState('');
  const [groupChatMessages, setGroupChatMessages] = useState<Record<string, Array<{ sender: string; text: string; time: string }>>>({
    'wm-avn': [
      { sender: 'Dr. Folake A. (AVN Mentor)', text: 'Welcome Warriors! Today we are discussing joint-sparing physical therapy exercises and pool therapy.', time: '10:30 AM' },
      { sender: 'David O.', text: 'Pool hydrotherapy helped my hip range of motion immensely after my diagnosis.', time: '10:45 AM' }
    ],
    'wm-asthma': [
      { sender: 'Grace M. (Respiratory Lead)', text: 'Reminder for everyone: Keep your warm scarf ready during sudden cold drafts to avoid bronchospasm.', time: '09:15 AM' }
    ]
  });

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
      meetingSchedule: 'Tuesdays @ 7:00 PM WAT (Virtual Voice Call)',
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

  // --- Support Tab States ---
  const [selectedCity, setSelectedCity] = useState<'Lagos' | 'Abuja' | 'London' | 'Houston'>('Lagos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [fetchedPosts, profile] = await Promise.all([
      firebaseService.getPosts(),
      auth.currentUser ? firebaseService.getUserProfile(auth.currentUser.uid) : null
    ]);
    setPosts(fetchedPosts || []);
    setUserProfile(profile);
    setLoading(false);
  };

  const handleLike = async (id: string) => {
    await firebaseService.likePost(id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p));
  };

  const handleAddPost = async () => {
    if (!newPostTitle || !newPostContent) return;
    await firebaseService.createPost(newPostTitle, newPostContent, [activeCategory]);
    setNewPostTitle('');
    setNewPostContent('');
    setShowNewPost(false);
    fetchData(); // Refresh
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
    return R * c; // distance in km
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
    // City filter
    if (center.city !== selectedCity) return false;
    // Category filter
    if (selectedCategoryFilter !== 'All' && center.category !== selectedCategoryFilter) return false;
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        center.center_name.toLowerCase().includes(q) || 
        center.address.toLowerCase().includes(q)
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

  return (
    <div className="space-y-6">
      
      {/* Header Profile Section */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight leading-none mb-2">Community & Support</h2>
          <div className="flex items-center gap-3">
             <p className="text-gray-400 text-sm font-medium">Strength in connection, security in proximity.</p>
             {userProfile && (
               <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-500">
                  <Shield size={14} className="text-red-600" />
                  <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{userProfile.rank}</span>
               </div>
             )}
          </div>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-150">
          <button 
            type="button"
            onClick={() => setActiveTab('warrior_match')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'warrior_match' 
                ? 'bg-white text-red-600 shadow-sm border border-gray-200/50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🤝 Warrior Match
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'support' 
                ? 'bg-white text-red-600 shadow-sm border border-gray-200/50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📍 Find Support
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('forum')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'forum' 
                ? 'bg-white text-red-600 shadow-sm border border-gray-200/50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💬 Village Forum
          </button>
        </div>
      </div>

      {/* ----- WARRIOR MATCH MODE ----- */}
      {activeTab === 'warrior_match' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-red-600 to-rose-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                🤝 Peer Support & Comorbidity Matching
              </span>
              <h3 className="text-3xl font-black tracking-tight leading-none">
                Find Your Health Journey Peers
              </h3>
              <p className="text-xs text-red-100 font-medium leading-relaxed">
                Connect with warriors and medical mentors who truly understand your specific health challenges—from Avascular Necrosis (AVN) to Asthma, Leg Ulcers, or Stroke risk.
              </p>
            </div>
          </div>

          {/* Comorbidity Selection Chips */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">Select Your Comorbidities / Health Factors</h4>
                <p className="text-xs text-gray-400 font-medium">Toggle your conditions to filter peer groups with matching lived experiences.</p>
              </div>
              <span className="bg-red-50 text-red-600 text-xs font-black px-3 py-1 rounded-full border border-red-100">
                {selectedComorbidities.length} Selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {COMORBIDITIES_LIST.map((comorb) => {
                const isSelected = selectedComorbidities.includes(comorb);
                return (
                  <button
                    key={comorb}
                    type="button"
                    onClick={() => toggleComorbidity(comorb)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-md shadow-red-200 border border-red-500 scale-98'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/80'
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
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-widest px-2">Recommended Peer Circles</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MATCH_GROUPS.map((group) => {
                const isMatching = group.comorbidities.some(c => selectedComorbidities.includes(c));
                const matchScore = isMatching ? 98 : 45;
                const messages = groupChatMessages[group.id] || [];

                return (
                  <div 
                    key={group.id} 
                    className={`bg-white border p-6 rounded-[2rem] space-y-4 transition-all ${
                      isMatching ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-gray-150 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          isMatching ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {matchScore}% Peer Match
                        </span>
                        <h5 className="font-extrabold text-base text-gray-800 mt-2">{group.name}</h5>
                      </div>
                      <div className="bg-red-50 p-2.5 rounded-2xl text-red-600 shrink-0">
                        <Users size={20} />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed font-medium">{group.description}</p>

                    <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center text-gray-600 font-semibold">
                        <span>Lead Mentor:</span>
                        <span className="font-bold text-red-600">{group.mentor}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600 font-semibold">
                        <span>Meetups:</span>
                        <span className="text-gray-800">{group.meetingSchedule}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600 font-semibold">
                        <span>Active Members:</span>
                        <span className="text-gray-800">{group.membersCount} Warriors</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveJoinedGroup(group.id)}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={14} /> Join Peer Circle & Discussion ({messages.length} Posts)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Chat Modal */}
          {activeJoinedGroup && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h4 className="font-extrabold text-base text-gray-800">
                      {MATCH_GROUPS.find(g => g.id === activeJoinedGroup)?.name}
                    </h4>
                    <span className="text-xs text-emerald-600 font-bold">● Active Peer Circle Discussion</span>
                  </div>
                  <button 
                    onClick={() => setActiveJoinedGroup(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl h-64 overflow-y-auto space-y-3">
                  {(groupChatMessages[activeJoinedGroup] || []).map((msg, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-gray-150 shadow-xs space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400">
                        <span className="text-red-600">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinedMessageText}
                    onChange={(e) => setJoinedMessageText(e.target.value)}
                    placeholder="Ask a question or share your experience..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!joinedMessageText.trim()) return;
                      const newMsg = {
                        sender: 'You (Warrior)',
                        text: joinedMessageText.trim(),
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      };
                      setGroupChatMessages(prev => ({
                        ...prev,
                        [activeJoinedGroup]: [...(prev[activeJoinedGroup] || []), newMsg]
                      }));
                      setJoinedMessageText('');
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'support' ? (
        /* ----- FIND SUPPORT DIRECTORY MODE ----- */
        <div className="space-y-6">
          
          {/* Controls Bar: Search, City Epicenter, Sort, Filter */}
          <div className="bg-white p-5 rounded-[2rem] border border-gray-150 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Epicenter selector */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0 mr-1">Your Location:</span>
                {(['Lagos', 'Abuja', 'London', 'Houston'] as const).map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setSelectedCity(city);
                      setSearchQuery('');
                    }}
                    className={`px-3 py-2 border rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      selectedCity === city 
                        ? 'bg-red-50 text-red-600 border-red-200 shadow-2xs' 
                        : 'bg-gray-50 text-gray-500 border-gray-150 hover:bg-gray-100'
                    }`}
                  >
                    📍 {city}
                  </button>
                ))}
              </div>

              {/* Sorting and Filter options */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-150">
                  <Filter size={13} className="text-gray-400" />
                  <select 
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-transparent border-none text-xs text-gray-600 font-extrabold focus:ring-0 active:ring-0 outline-none cursor-pointer"
                  >
                    <option value="All">All Resources</option>
                    <option value="NGOs">NGOs</option>
                    <option value="Support Groups">Support Groups</option>
                    <option value="Specialized Clinics">Specialized Clinics</option>
                  </select>
                </div>

                <button 
                  type="button"
                  onClick={() => setSortBy(prev => prev === 'distance' ? 'name' : 'distance')}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-150 hover:bg-gray-100 p-2.5 rounded-xl text-xs font-bold text-gray-650 cursor-pointer"
                  title="Toggle Sorting Mode"
                >
                  <ArrowUpDown size={14} className="text-gray-400" />
                  <span>Sort: {sortBy === 'distance' ? 'Distance' : 'Name'}</span>
                </button>
              </div>
            </div>

            {/* Keyword search input */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search centers in ${selectedCity} (e.g. hematology, foundation)`} 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-200 transition-all"
              />
            </div>
          </div>

          {/* Directory Listings */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
              Showing {processedCenters.length} verified Care Networks near {selectedCity} epicenter
            </h3>

            {processedCenters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedCenters.map((center) => (
                  <div 
                    key={center.id}
                    className="bg-white border border-gray-150 rounded-[2rem] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
                  >
                    {/* Corner category tag */}
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-md font-black uppercase tracking-wider border ${
                        center.category === 'NGOs' ? 'bg-indigo-50 border-indigo-150 text-indigo-700' :
                        center.category === 'Support Groups' ? 'bg-green-50 border-green-150 text-green-700' :
                        'bg-red-50 border-red-150 text-red-700'
                      }`}>
                        {center.category}
                      </span>
                      
                      <span className="text-sm font-mono text-gray-400 font-extrabold flex items-center gap-1 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-100">
                        📍 {center.distance} km away
                      </span>
                    </div>

                    <div className="space-y-2 mb-6">
                      <h4 className="font-black text-lg text-gray-850 tracking-tight leading-snug">
                        {center.center_name}
                      </h4>
                      <p className="text-xs text-gray-500 flex items-start gap-1.5 leading-relaxed font-semibold">
                        <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <span>{center.address}</span>
                      </p>
                    </div>

                    {/* Action Elements Row: Tap-to-call, Tap-to-email, Map deep links */}
                    <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-4 mt-auto">
                      <a 
                        href={`tel:${center.phone}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold uppercase transition-all shadow-2xs text-center"
                      >
                        <Phone size={14} className="text-green-500" />
                        <span>Call</span>
                      </a>

                      <a 
                        href={`mailto:${center.email}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold uppercase transition-all shadow-2xs text-center"
                      >
                        <Mail size={14} className="text-blue-500" />
                        <span>Email</span>
                      </a>

                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.center_name + ' ' + center.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-2xs text-center"
                      >
                        <MapPin size={14} className="text-red-400 animate-pulse" />
                        <span>Route</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 bg-white rounded-3xl border border-gray-150 text-center space-y-3">
                <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  📭
                </div>
                <h4 className="font-extrabold text-gray-700">No centers match active filters</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto font-medium">Try choosing a different category filter, looking in a different city epicentre, or modifying your query.</p>
              </div>
            )}
          </div>

          {/* Sticky Emergency Assistance Box - crisis helpline persistent button */}
          <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-[2.5rem] p-6 text-white border border-rose-500 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden mt-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none"></div>
            <div className="flex gap-4">
              <div className="bg-white/20 p-3 text-white rounded-2xl h-fit w-fit shrink-0 mt-1 shadow-inner">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-black text-sm uppercase tracking-[0.2em]">CRITICAL ASSISTANCE HOTLINE</h4>
                <h3 className="text-lg font-black tracking-tight leading-none">Sickle Cell Emergency Help</h3>
                <p className="text-xs text-rose-100 max-w-md leading-relaxed font-semibold">
                  Facing a severe vaso-occlusive pain crisis, fever, or breathing difficulty? Access direct sickle cell specialist emergency routing.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0 w-full sm:w-auto relative z-10">
              <a 
                href="tel:+2348035846666" 
                className="py-4 px-6 bg-white hover:bg-gray-50 text-red-700 rounded-2xl text-xs font-black text-center uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                📞 SCD Crisis Helpline
              </a>
              <a 
                href="tel:112" 
                className="py-4 px-6 bg-rose-900 border border-rose-400 hover:bg-rose-950 text-white rounded-2xl text-xs font-bold text-center uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                🚨 Standard Medical (112 / 911)
              </a>
            </div>
          </div>

        </div>
      ) : (
        /* ----- ORIGINAL VILLAGE HUB FORUM MODE ----- */
        <div className="space-y-6">
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {['All', 'General', 'Medication', 'Nutrition', 'Mental Health', 'Advocacy'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200' : 'bg-white border-gray-100 text-gray-400 hover:border-red-100 hover:text-red-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {posts.map(post => (
              <div key={post.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4 hover:shadow-xl hover:shadow-gray-100/50 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center text-xs font-black text-red-600 border border-red-200 shadow-inner uppercase">
                      {(post.authorName || 'W')[0]}
                    </div>
                    <div>
                      <span className="text-sm font-black text-gray-800 tracking-tight">{post.authorName || 'Warrior'}</span>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-300 hover:text-red-500"><Tag size={18} /></button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-800 leading-snug group-hover:text-red-600 transition-colors">{post.title}</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{post.content}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {(post.tags || []).map((tag: string) => (
                    <span key={tag} className="text-[9px] bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 text-gray-400 font-black uppercase tracking-tighter">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-gray-50 mt-4">
                  <div className="flex items-center gap-8">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-2 transition-all text-gray-300 hover:text-red-500"
                    >
                      <Heart size={20} />
                      <span className="text-xs font-black">{post.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-300 hover:text-blue-500 transition-colors">
                      <MessageSquare size={20} />
                      <span className="text-xs font-black">0</span>
                    </button>
                  </div>
                  <button className="text-gray-300 hover:text-gray-600 transition-colors">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* New Post CTA Button at absolute bottom when in Forum tab */}
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => setShowNewPost(true)}
              className="flex items-center gap-2 bg-red-600 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-4 rounded-[1.5rem] shadow-xl hover:bg-red-700 active:scale-95 transition-all shadow-red-200"
            >
              <Plus size={16} /> New Forum Entry
            </button>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-end md:items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-t-[3rem] md:rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-gray-800 tracking-tight">Post Insight</h3>
                <button onClick={() => setShowNewPost(false)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Headline</label>
                  <input 
                    type="text" 
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="E.g. Transitioning to adult care..." 
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-red-500/5 font-black text-gray-800 placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Content</label>
                  <textarea 
                    rows={5}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share your experience or ask the village..." 
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-red-500/5 font-medium text-gray-600 resize-none placeholder:text-gray-300"
                  />
                </div>
                <button 
                  onClick={handleAddPost}
                  disabled={!newPostTitle || !newPostContent}
                  className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  Publish to Community
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Community;
