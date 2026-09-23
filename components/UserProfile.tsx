
import React, { useState, useEffect } from 'react';
import { User, Shield, Award, Edit2, Check, X, Camera, LogOut, Eye, Sun, Moon } from 'lucide-react';
import { auth, logout } from '../firebase-init';
import { firebaseService } from '../services/firebaseService';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('warrior_high_contrast') === 'true';
  });
  const [formData, setFormData] = useState({
    displayName: '',
    role: '',
    age: ''
  });

  const toggleHighContrast = () => {
    const nextVal = !highContrast;
    setHighContrast(nextVal);
    localStorage.setItem('warrior_high_contrast', nextVal ? 'true' : 'false');
    if (nextVal) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };


  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const p = await firebaseService.getUserProfile(auth.currentUser.uid);
        if (p) {
          setProfile(p);
          setFormData({
            displayName: p.displayName || '',
            role: p.role || '',
            age: p.age?.toString() || ''
          });
        } else {
          // Create initial profile if it doesn't exist
          const initial = {
            displayName: auth.currentUser.displayName || 'Warrior',
            role: 'Warrior',
            age: 25
          };
          await firebaseService.createUserProfile(auth.currentUser.uid, initial);
          setProfile(initial);
          setFormData({
            displayName: initial.displayName,
            role: initial.role,
            age: initial.age.toString()
          });
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    const updated = {
      ...profile,
      displayName: formData.displayName,
      role: formData.role,
      age: parseInt(formData.age) || profile.age
    };
    await firebaseService.updateUserProfile(auth.currentUser.uid, updated);
    setProfile(updated);
    setIsEditing(false);
    setLoading(false);
  };

  if (!auth.currentUser) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-0 z-[100] flex justify-end"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <header className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Warrior Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-32 h-32 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-600 border-4 border-white shadow-xl overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} />
                )}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2.5 bg-red-600 text-white rounded-2xl shadow-lg border-4 border-white hover:scale-110 active:scale-90 transition-all">
                <Camera size={18} />
              </button>
            </div>
            <div className="mt-6">
              <h3 className="text-2xl font-black text-gray-800">{profile?.displayName}</h3>
              <p className="text-xs font-bold text-red-600 uppercase tracking-widest mt-1">{profile?.role}</p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Rank" value={profile?.rank || 'Novice'} icon={<Shield className="text-blue-500" />} />
            <StatCard label="Warrior XP" value={profile?.xp || 0} icon={<Award className="text-yellow-500" />} />
          </div>

          {/* Details Form */}
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal Details</span>
               <button 
                 onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
                 className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${isEditing ? 'text-green-600' : 'text-red-600'}`}
               >
                 {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                 {isEditing ? 'Save' : 'Edit'}
               </button>
            </div>

            <div className="space-y-4">
              <ProfileField 
                label="Full Name" 
                value={formData.displayName} 
                isEditing={isEditing} 
                onChange={(v) => setFormData(p => ({...p, displayName: v}))}
              />
              <ProfileField 
                label="Role in Community" 
                value={formData.role} 
                isEditing={isEditing} 
                onChange={(v) => setFormData(p => ({...p, role: v}))}
                type="select"
                options={['Warrior', 'Advocate', 'Caregiver', 'Healthcare Professional']}
              />
              <ProfileField 
                label="Age" 
                value={formData.age} 
                isEditing={isEditing} 
                onChange={(v) => setFormData(p => ({...p, age: v}))}
                type="number"
              />
            </div>
          </div>

          {/* Accessibility & High Contrast Settings Section */}
          <div className="space-y-4">
             <span className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Accessibility & Visual Settings</span>
             <div className="bg-gray-50 dark:bg-slate-800/80 p-5 rounded-3xl border border-gray-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-2xl border border-yellow-500/30">
                      <Eye size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">High Contrast Mode</h4>
                      <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Enhances contrast & interactive borders</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={toggleHighContrast}
                    className={`w-14 h-8 rounded-full p-1 transition-all cursor-pointer flex items-center ${
                      highContrast ? 'bg-yellow-400 justify-end' : 'bg-gray-300 dark:bg-slate-600 justify-start'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-black shadow-md flex items-center justify-center text-yellow-400 font-black text-[10px]">
                      {highContrast ? 'ON' : 'OFF'}
                    </div>
                  </button>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
                  Increases color contrast, sharpens typography, and provides bold focus outlines for users with visual sensitivities or eye fatigue during VOC crises.
                </p>
             </div>
          </div>

          {/* Badges Section */}
          <div className="space-y-4">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Achieved Badges</span>
             <div className="flex flex-wrap gap-4">
                {(profile?.badges || []).length > 0 ? profile.badges.map((b: string) => (
                  <div key={b} className="w-16 h-16 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 shadow-sm">
                    <Award size={32} className="text-orange-400" />
                  </div>
                )) : (
                  <div className="w-full h-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
                     <Award size={24} className="mb-2 opacity-50" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">Complete missions to earn badges</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        <footer className="p-8 border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={logout}
            className="w-full py-4 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
          >
            <LogOut size={20} /> Logout
          </button>
        </footer>
      </div>
    </motion.div>
  );
};

const StatCard = ({ label, value, icon }: any) => (
  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</span>
    </div>
    <div className="text-xl font-black text-gray-800 tracking-tight">{value}</div>
  </div>
);

const ProfileField = ({ label, value, isEditing, onChange, type = 'text', options = [] }: any) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] ml-4">{label}</label>
    {isEditing ? (
      type === 'select' ? (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-5 py-3.5 bg-white border border-red-200 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-red-500/5 appearance-none"
        >
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-5 py-3.5 bg-white border border-red-200 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-red-500/5"
        />
      )
    ) : (
      <div className="px-5 py-3.5 bg-gray-50/30 border border-transparent rounded-2xl text-sm font-bold text-gray-700">
        {value || 'Not provided'}
      </div>
    )}
  </div>
);

export default UserProfile;
