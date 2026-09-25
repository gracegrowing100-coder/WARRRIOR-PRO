import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Phone, X, Edit2, Check, Info, Heart, 
  Activity, Award, User, AlertOctagon, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebaseService';

interface EmergencyButtonProps {
  userId: string;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [emergencyInfo, setEmergencyInfo] = useState({
    bloodType: 'O+',
    genotype: 'SS',
    emergencyContactName: 'Dr. Amina Yusuf (Specialist)',
    emergencyContactPhone: '+234 812 345 6789',
    primaryCaregiverName: 'Sarah Smith (Mother)',
    primaryCaregiverPhone: '+234 803 111 2222',
    allergies: 'Penicillin, Sulfa medications',
    currentMeds: 'Hydroxyurea (500mg daily), Folic Acid (5mg)',
    customNotes: 'Keep well hydrated. Avoid extreme cold temperature triggers. Administer IV fluids quickly.'
  });

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      const data = await firebaseService.getEmergencyInfo(userId);
      if (data) {
        setEmergencyInfo(prev => ({ ...prev, ...data }));
      }
      setLoading(false);
    };
    fetchInfo();
  }, [userId, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await firebaseService.saveEmergencyInfo(userId, emergencyInfo);
    setIsEditing(false);
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmergencyInfo(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="emergency-fab"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[calc(6rem+var(--safe-area-bottom))] right-4 md:bottom-8 md:right-8 z-50 flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl shadow-red-500/50 hover:shadow-red-600/60 transition-all active:scale-95 border-2 border-white focus:outline-none group cursor-pointer"
      >
        <div className="relative">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        </div>
        <span className="font-black text-xs uppercase tracking-widest">Emergency HUD</span>
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border-4 border-red-500 relative flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-red-600 to-red-800 text-white px-6 py-6 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                    <AlertOctagon className="text-white w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl tracking-tight leading-none">MEDICAL RESPONDER INFO</h3>
                    <p className="text-[10px] uppercase font-bold text-red-200 tracking-widest mt-1">SCD Critical Health Profile</p>
                  </div>
                </div>
                <button
                  id="close-emergency-modal"
                  onClick={() => {
                    setIsOpen(false);
                    setIsEditing(false);
                  }}
                  className="bg-black/20 hover:bg-black/30 p-2 rounded-full text-white transition-all outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                {!isEditing ? (
                  <>
                    {/* First Responder Info Visual Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/35 rounded-3xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black text-red-600 dark:text-red-400 tracking-wider uppercase mb-1">Blood Type</span>
                        <div className="text-3xl font-black text-gray-800 dark:text-white">{emergencyInfo.bloodType || 'N/A'}</div>
                      </div>
                      <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/35 rounded-3xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black text-red-600 dark:text-red-400 tracking-wider uppercase mb-1">SCD Genotype</span>
                        <div className="text-3xl font-black text-gray-800 dark:text-white">{emergencyInfo.genotype || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Medical Metrics Cards */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800 rounded-2xl p-4">
                        <h4 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" /> High-Severity Allergies
                        </h4>
                        <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{emergencyInfo.allergies || 'None reported'}</p>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800 rounded-2xl p-4">
                        <h4 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" /> Daily Medications
                        </h4>
                        <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{emergencyInfo.currentMeds || 'None reported'}</p>
                      </div>

                      <div className="bg-red-500/10 border border-red-200/50 rounded-2xl p-4">
                        <h4 className="text-[10px] font-black text-red-700 dark:text-red-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                          <AlertOctagon className="w-3.5 h-3.5 text-red-650 dark:text-red-400" /> Crisis & Responding Guidance
                        </h4>
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300 leading-relaxed bg-white/60 dark:bg-slate-800/80 p-3 rounded-xl border border-red-100 dark:border-red-950 shadow-inner">
                          {emergencyInfo.customNotes || 'No custom notes provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Emergency Contacts with Tap to Call */}
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-black text-gray-900 dark:text-slate-400 uppercase tracking-widest">Emergency Contacts</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a
                          href={`tel:${emergencyInfo.emergencyContactPhone}`}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer group"
                        >
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-red-100 uppercase tracking-wider block">Hematologist / Doc</span>
                            <span className="font-extrabold text-xs block truncate mt-0.5">{emergencyInfo.emergencyContactName}</span>
                          </div>
                          <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                            <Phone className="w-4 h-4 text-white fill-white" />
                          </div>
                        </a>

                        <a
                          href={`tel:${emergencyInfo.primaryCaregiverPhone}`}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer group"
                        >
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-blue-100 uppercase tracking-wider block">Caregiver / Relative</span>
                            <span className="font-extrabold text-xs block truncate mt-0.5">{emergencyInfo.primaryCaregiverName}</span>
                          </div>
                          <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                            <Phone className="w-4 h-4 text-white fill-white" />
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Edit Trigger */}
                    <button
                      id="edit-emergency-info"
                      onClick={() => setIsEditing(true)}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-200 font-extrabold text-xs uppercase tracking-widest py-4.5 rounded-2xl transition-all cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Medical Emergency Info
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Blood Type</label>
                        <input
                          type="text"
                          name="bloodType"
                          value={emergencyInfo.bloodType}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-800 dark:text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                          placeholder="e.g. O+, A-"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">SCD Genotype</label>
                        <input
                          type="text"
                          name="genotype"
                          value={emergencyInfo.genotype}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-800 dark:text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                          placeholder="e.g. SS, SC"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Specialist Name</label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={emergencyInfo.emergencyContactName}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-800 dark:text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                        placeholder="Hematologist Name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Specialist Phone</label>
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        value={emergencyInfo.emergencyContactPhone}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-800 dark:text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                        placeholder="Hematologist phone"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Caregiver Name</label>
                        <input
                          type="text"
                          name="primaryCaregiverName"
                          value={emergencyInfo.primaryCaregiverName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-800 dark:text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                          placeholder="Mom, Dad, Partner"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Caregiver Phone</label>
                        <input
                          type="tel"
                          name="primaryCaregiverPhone"
                          value={emergencyInfo.primaryCaregiverPhone}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-800 dark:text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Allergies</label>
                      <input
                        type="text"
                        name="allergies"
                        value={emergencyInfo.allergies}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-800 dark:text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                        placeholder="e.g. Penicillin, Lactose"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Current Medications</label>
                      <input
                        type="text"
                        name="currentMeds"
                        value={emergencyInfo.currentMeds}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-800 dark:text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                        placeholder="e.g. Hydroxyurea"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Responder Instruction Notes</label>
                      <textarea
                        name="customNotes"
                        value={emergencyInfo.customNotes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-800 dark:text-white text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
                        placeholder="Guidance for EMTs and ER clinicians..."
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-350 font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {loading ? 'Saving...' : <><Check className="w-4 h-4" /> Save Profile</>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
