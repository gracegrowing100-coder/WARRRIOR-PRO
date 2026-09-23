import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, AlertTriangle, Edit3, ShieldAlert, Check, X, UserCheck, Heart, Send, ExternalLink } from 'lucide-react';

interface CaregiverInfo {
  name: string;
  relationship: string;
  phone: string;
  altPhone: string;
  hospitalHotline: string;
  notes: string;
  customSosText: string;
}

const DEFAULT_CAREGIVER: CaregiverInfo = {
  name: "Dr. Evelyn Vance",
  relationship: "Primary Caregiver / Hematology Lead",
  phone: "+1 555-019-2834",
  altPhone: "+1 555-019-9900",
  hospitalHotline: "+1 555-911-SICKLE",
  notes: "Holds Clinical Care Passport, blood group info (O+), and emergency hydrotherapy protocol.",
  customSosText: "URGENT SICKLE CELL CRISIS: I need immediate assistance or transportation to the nearest ER. Please call me back right away!"
};

interface DesignatedCaregiverWidgetProps {
  userId?: string;
  currentPainLevel?: number;
}

export const DesignatedCaregiverWidget: React.FC<DesignatedCaregiverWidgetProps> = ({ currentPainLevel = 3 }) => {
  const [caregiver, setCaregiver] = useState<CaregiverInfo>(DEFAULT_CAREGIVER);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CaregiverInfo>(DEFAULT_CAREGIVER);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSentStatus, setSosSentStatus] = useState<string | null>(null);

  // Load saved caregiver info from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('warrior_designated_caregiver');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCaregiver(parsed);
        setFormData(parsed);
      }
    } catch (e) {
      console.warn("Failed to parse caregiver details from storage:", e);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCaregiver(formData);
    try {
      localStorage.setItem('warrior_designated_caregiver', JSON.stringify(formData));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const cleanPhone = (phoneStr: string) => phoneStr.replace(/[^0-9+]/g, '');

  const triggerSosBroadcast = () => {
    const text = encodeURIComponent(
      `🚨 [EMERGENCY SCD SOS ALERT] 🚨\nFrom: Sickle Cell Care Platform\nCurrent Pain Level: ${currentPainLevel}/10\nMessage: ${caregiver.customSosText}\nTimestamp: ${new Date().toLocaleTimeString()}`
    );
    const smsUrl = `sms:${cleanPhone(caregiver.phone)}?body=${text}`;
    window.location.href = smsUrl;
    setSosSentStatus("Emergency SMS draft dispatched to primary caregiver!");
    setTimeout(() => {
      setShowSosModal(false);
      setSosSentStatus(null);
    }, 2500);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-rose-950/80 to-slate-900 rounded-[2.5rem] p-6 border-2 border-rose-500/30 shadow-xl text-white relative overflow-hidden transition-all duration-300">
      {/* Background glow graphics */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/20 p-3 rounded-2xl border border-rose-500/30 text-rose-400 shadow-inner">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <h4 className="font-black text-white text-sm uppercase tracking-wider">Designated Caregiver</h4>
            </div>
            <p className="text-[10px] text-rose-200/80 font-bold uppercase tracking-widest mt-0.5">
              One-Tap Emergency Assist & Contact
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormData(caregiver);
            setIsEditing(true);
          }}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-rose-200 text-xs font-bold rounded-xl border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit Info
        </button>
      </div>

      {/* Main Caregiver Info Card */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-rose-500/20 mb-5 relative z-10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800/50">
              Primary Contact
            </span>
            <h5 className="text-lg font-black text-white mt-1 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" /> {caregiver.name}
            </h5>
            <p className="text-xs text-rose-200/90 font-semibold">{caregiver.relationship}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone Number</span>
            <a 
              href={`tel:${cleanPhone(caregiver.phone)}`} 
              className="text-sm font-black text-yellow-300 hover:underline flex items-center gap-1 sm:justify-end"
            >
              <Phone className="w-3.5 h-3.5" /> {caregiver.phone}
            </a>
          </div>
        </div>

        {caregiver.notes && (
          <p className="text-xs text-slate-300 italic leading-relaxed font-medium bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">
            "{caregiver.notes}"
          </p>
        )}
      </div>

      {/* ONE-TAP ACTION BUTTONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
        {/* 1. Direct Phone Call */}
        <a
          href={`tel:${cleanPhone(caregiver.phone)}`}
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg shadow-emerald-950/40 transition-all active:scale-95 group cursor-pointer border border-emerald-400/30"
        >
          <Phone className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-wider">Call Now</span>
          <span className="text-[9px] text-emerald-100 opacity-80">Direct Phone Dial</span>
        </a>

        {/* 2. SMS Direct Alert */}
        <a
          href={`sms:${cleanPhone(caregiver.phone)}?body=${encodeURIComponent("URGENT: Sickle Cell Pain Crisis Assistance Needed!")}`}
          className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg shadow-blue-950/40 transition-all active:scale-95 group cursor-pointer border border-blue-400/30"
        >
          <MessageSquare className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-wider">SMS Alert</span>
          <span className="text-[9px] text-blue-100 opacity-80">Quick Message</span>
        </a>

        {/* 3. WhatsApp Direct Chat */}
        <a
          href={`https://wa.me/${cleanPhone(caregiver.phone)}?text=${encodeURIComponent("URGENT: Sickle Cell Crisis Assistance Needed!")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg shadow-teal-950/40 transition-all active:scale-95 group cursor-pointer border border-teal-400/30"
        >
          <ExternalLink className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-wider">WhatsApp</span>
          <span className="text-[9px] text-teal-100 opacity-80">Instant Chat</span>
        </a>

        {/* 4. One-Tap Emergency SOS Broadcast */}
        <button
          type="button"
          onClick={() => setShowSosModal(true)}
          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg shadow-rose-950/60 transition-all active:scale-95 group cursor-pointer border border-rose-400/40"
        >
          <AlertTriangle className="w-5 h-5 mb-1 text-yellow-300 animate-bounce" />
          <span className="text-[11px] font-black uppercase tracking-wider text-yellow-200">SOS Broadcast</span>
          <span className="text-[9px] text-rose-100 opacity-90">Send Crisis Alert</span>
        </button>
      </div>

      {/* EDIT CAREGIVER MODAL */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[2.5rem] p-6 text-white space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h4 className="font-extrabold text-base text-white">Edit Caregiver & Emergency Contact</h4>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Caregiver Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Evelyn Vance"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Relationship</label>
                  <input
                    type="text"
                    required
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    placeholder="e.g. Spouse / Primary Support"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Primary Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +1 555-019-2834"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Hospital ER Hotline / Alternate Contact</label>
                <input
                  type="text"
                  value={formData.altPhone}
                  onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                  placeholder="e.g. City Hospital ER: +1 555-911-SICKLE"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Care Notes & Medical Guidance</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes about blood type, clinical passport location, or key house access..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Custom Emergency SOS Message</label>
                <textarea
                  rows={2}
                  value={formData.customSosText}
                  onChange={(e) => setFormData({ ...formData, customSosText: e.target.value })}
                  placeholder="Default text sent during SOS trigger..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-950/40"
                >
                  <Check size={16} /> Save Caregiver Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOS CONFIRMATION MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-500 w-full max-w-md rounded-[2.5rem] p-6 text-white space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600 rounded-2xl text-white">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h4 className="font-black text-lg text-white">Confirm Emergency SOS</h4>
                <p className="text-xs text-rose-300 font-bold">Primary Caregiver: {caregiver.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              Sending crisis alert to <strong className="text-white">{caregiver.phone}</strong> with current pain level ({currentPainLevel}/10).
            </p>

            {sosSentStatus ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-bold text-center animate-in fade-in">
                ✓ {sosSentStatus}
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={triggerSosBroadcast}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/60"
                >
                  <Send size={16} /> Send SOS Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
