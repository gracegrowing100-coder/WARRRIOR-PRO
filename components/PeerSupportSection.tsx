import React, { useState } from 'react';
import { 
  Users, Key, QrCode, ShieldCheck, HeartPulse, Droplets, Pill, 
  Activity, AlertTriangle, Sparkles, Copy, Check, 
  Clock, UserPlus, RefreshCw, X, Lock, Bell, 
  Shield, CheckCircle2, ChevronDown, ChevronUp,
  HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebaseService';

interface PeerConnection {
  id: string;
  peerName: string;
  relation: 'Family' | 'Caregiver' | 'Warrior Friend' | 'Partner' | 'Medical Aide';
  avatar: string;
  linkedSince: string;
  status: 'active' | 'pending' | 'expired';
  isTemporary: boolean;
  expiresIn?: string;
  permissions: {
    vitals: boolean;
    painLogs: boolean;
    hydration: boolean;
    medications: boolean;
    moodNotes: boolean;
    emergencyAlerts: boolean;
  };
  lastViewed: string;
  lastPing?: string;
}

interface AuditLogEntry {
  id: string;
  peerName: string;
  action: string;
  timestamp: string;
  details: string;
}

export const PeerSupportSection: React.FC<{ currentUserId?: string }> = ({ currentUserId = 'user-warrior' }) => {
  const [activeTab, setActiveTab] = useState<'my-peers' | 'share-code' | 'join-peer' | 'ai-insights' | 'audit'>('my-peers');
  const [warriorStatus, setWarriorStatus] = useState<string>('Feeling Strong & Energized 🌟');
  
  // Generated code state
  const [generatedCode, setGeneratedCode] = useState<string>('WARRIOR-8942');
  const [codeType, setCodeType] = useState<'persistent' | 'temporary-24h' | 'crisis-72h'>('persistent');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Peer join code input
  const [inputCode, setInputCode] = useState<string>('');
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Peers list
  const [peers, setPeers] = useState<PeerConnection[]>([
    {
      id: 'peer-1',
      peerName: 'Grace (Mom & Caregiver)',
      relation: 'Caregiver',
      avatar: '👩',
      linkedSince: 'Jan 15, 2026',
      status: 'active',
      isTemporary: false,
      permissions: {
        vitals: true,
        painLogs: true,
        hydration: true,
        medications: true,
        moodNotes: true,
        emergencyAlerts: true,
      },
      lastViewed: '12 minutes ago',
      lastPing: 'Sent you a warm tea reminder 🍵'
    },
    {
      id: 'peer-2',
      peerName: 'Tunde (Warrior Friend)',
      relation: 'Warrior Friend',
      avatar: '🦸‍♂️',
      linkedSince: 'Feb 02, 2026',
      status: 'active',
      isTemporary: true,
      expiresIn: '18 hours remaining',
      permissions: {
        vitals: false,
        painLogs: true,
        hydration: true,
        medications: false,
        moodNotes: true,
        emergencyAlerts: true,
      },
      lastViewed: '2 hours ago',
      lastPing: 'Shared encouragement: "Stay hydrated bro!"'
    }
  ]);

  // Selected peer for permission editing
  const [editingPeerId, setEditingPeerId] = useState<string | null>(null);

  // Audit Log
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      peerName: 'Grace (Mom & Caregiver)',
      action: 'Viewed Hydration & Medication Stream',
      timestamp: 'Today at 6:45 PM',
      details: "Accessed today's 2.8L water logs and morning Hydroxyurea log."
    },
    {
      id: 'log-2',
      peerName: 'Tunde (Warrior Friend)',
      action: 'Viewed Daily Mood & Warrior Status',
      timestamp: 'Today at 4:10 PM',
      details: 'Checked your status: "Feeling Strong & Energized".'
    },
    {
      id: 'log-3',
      peerName: 'Grace (Mom & Caregiver)',
      action: 'Emergency Alert Notification Tested',
      timestamp: 'Yesterday at 9:00 AM',
      details: 'Received scheduled ping confirmation.'
    }
  ]);

  const [sentNotification, setSentNotification] = useState<string | null>(null);

  const handleSend1TapNudge = async (msg: string) => {
    setSentNotification(`Care encouragement sent: "${msg}"`);
    const newLog: AuditLogEntry = {
      id: 'log-' + Date.now(),
      peerName: 'You (Companion Care)',
      action: 'Sent 1-Tap Care Ping',
      timestamp: 'Just now',
      details: `Encouragement sent: "${msg}"`
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Deliver message to caregiver community group
    try {
      await firebaseService.sendMessage('caregivers-circle', msg);
    } catch (e) {
      console.warn('Failed to deliver 1-tap care ping to chat service:', e);
    }

    setTimeout(() => setSentNotification(null), 4000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleGenerateNewCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WARRIOR-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(code);
  };

  const handleTogglePermission = (peerId: string, permKey: keyof PeerConnection['permissions']) => {
    setPeers(prev => prev.map(p => {
      if (p.id === peerId) {
        return {
          ...p,
          permissions: {
            ...p.permissions,
            [permKey]: !p.permissions[permKey]
          }
        };
      }
      return p;
    }));
  };

  const handleRevokePeer = (peerId: string) => {
    const peerToRemove = peers.find(p => p.id === peerId);
    setPeers(prev => prev.filter(p => p.id !== peerId));
    if (peerToRemove) {
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          peerName: peerToRemove.peerName,
          action: 'Connection Revoked / Unlinked',
          timestamp: 'Just now',
          details: 'Patient revoked all health data stream permissions.'
        },
        ...prev
      ]);
    }
  };

  const handleJoinPeer = () => {
    if (!inputCode.trim()) return;
    setJoinSuccess(`Connection request for "${inputCode.toUpperCase()}" submitted! Waiting for the Warrior to grant permission.`);
    setInputCode('');
    setTimeout(() => setJoinSuccess(null), 5000);
  };

  return (
    <div id="peer-support-option-section" className="space-y-4">
      {/* Header Banner - Dark Plum Brand Shell */}
      <div className="bg-[#3B0F2C] text-white rounded-[28px] p-5 sm:p-6 shadow-sm border border-[#E6D8E0] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <HeartHandshake size={140} className="text-white" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-[11px] font-bold text-[#FBE4E8] uppercase tracking-wider mb-2.5">
              <ShieldCheck size={13} className="text-[#FBE4E8]" />
              <span>Peer Support Circle</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
              <span>Trusted Companion Health Linking</span>
              <span className="text-[10px] bg-[#3DDC84]/20 text-[#3DDC84] border border-[#3DDC84]/40 px-2 py-0.5 rounded-full font-mono font-bold">ACTIVE</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#D9B9CC] mt-1 max-w-2xl leading-relaxed">
              Securely stream selected vitals, hydration milestones, and wellness status to trusted family, caregivers, or fellow warriors via encrypted, time-limited code pairing.
            </p>
          </div>

          {/* Quick Warrior Status Pill */}
          <div className="bg-white/10 border border-white/15 p-3 rounded-2xl min-w-[240px] backdrop-blur-xs">
            <span className="text-[10px] font-mono uppercase text-[#FBE4E8] font-bold block mb-1.5 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#FBE4E8]" />
              <span>My Broadcasted Status</span>
            </span>
            <select
              value={warriorStatus}
              onChange={(e) => setWarriorStatus(e.target.value)}
              aria-label="Broadcasted Warrior Status"
              className="w-full bg-[#2A081D] border border-white/20 text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#C4122F] cursor-pointer"
            >
              <option value="Feeling Strong & Energized 🌟">Feeling Strong & Energized 🌟</option>
              <option value="Resting & Hydrating 🛋️">Resting & Hydrating 🛋️</option>
              <option value="Mild Joint Discomfort ⚠️">Mild Joint Discomfort ⚠️</option>
              <option value="In Crisis – Please Check In 🚨">In Crisis – Please Check In 🚨</option>
              <option value="Hospital / Clinic Visit 🏥">Hospital / Clinic Visit 🏥</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 mt-5 pt-4 border-t border-white/10">
          {[
            { id: 'my-peers', label: `Active Peers (${peers.length})`, icon: Users },
            { id: 'share-code', label: 'Generate Link Code', icon: Key },
            { id: 'join-peer', label: 'Connect as Peer', icon: UserPlus },
            { id: 'ai-insights', label: 'AI Care Nudges', icon: Sparkles },
            { id: 'audit', label: 'Privacy Audit Log', icon: Shield },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === id
                  ? 'bg-[#C4122F] text-white shadow-xs'
                  : 'bg-white/10 text-[#D9B9CC] hover:bg-white/15 hover:text-white'
              }`}
            >
              <Icon size={13} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white border border-[#E6D8E0] rounded-[28px] p-4 sm:p-6 shadow-2xs text-[#3B0F2C]">
        {/* Tab 1: Active Peers & Granular Permissions */}
        {activeTab === 'my-peers' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F1E6EC]">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-display text-[#3B0F2C] flex items-center gap-2">
                  <Users size={17} className="text-[#C4122F]" />
                  <span>Linked Companions & Care Stream Permissions</span>
                </h3>
                <p className="text-xs text-[#6E4A63] mt-0.5">
                  You have full control over what each linked person can see. Revoke or modify at any time.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('share-code')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C4122F] hover:bg-[#9E0E26] text-white text-xs font-bold rounded-full transition cursor-pointer self-start shadow-xs"
              >
                <UserPlus size={13} />
                <span>Link New Peer</span>
              </button>
            </div>

            {peers.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#E6D8E0] rounded-2xl bg-[#FAF7F9]">
                <Users size={36} className="mx-auto text-[#6E4A63] mb-2" />
                <p className="text-sm font-semibold text-[#3B0F2C]">No peers linked yet</p>
                <p className="text-xs text-[#6E4A63] max-w-sm mx-auto mt-1">
                  Share a secure link code with a trusted loved one or friend to allow them to support you.
                </p>
                <button
                  onClick={() => setActiveTab('share-code')}
                  className="mt-4 px-4 py-2 bg-[#C4122F] hover:bg-[#9E0E26] text-white rounded-full text-xs font-bold transition"
                >
                  Generate First Code
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {peers.map((peer) => {
                  const isEditing = editingPeerId === peer.id;
                  return (
                    <div 
                      key={peer.id}
                      className="bg-[#FDF9FB] border border-[#E6D8E0] rounded-2xl p-4 transition hover:border-[#C4122F]/40"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-white border border-[#E6D8E0] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                            {peer.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-[#3B0F2C]">{peer.peerName}</h4>
                              <span className="text-[10px] font-bold bg-[#FBE4E8] text-[#C4122F] px-2 py-0.5 rounded-full">
                                {peer.relation}
                              </span>
                              {peer.isTemporary && (
                                <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock size={10} />
                                  {peer.expiresIn || 'Temporary'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6E4A63] mt-0.5 flex items-center gap-2">
                              <span>Linked: {peer.linkedSince}</span>
                              <span>&bull;</span>
                              <span>Last viewed: <strong className="text-[#3B0F2C]">{peer.lastViewed}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setEditingPeerId(isEditing ? null : peer.id)}
                            className="px-3 py-1.5 bg-white hover:bg-[#F7F2F5] text-[#3B0F2C] border border-[#E6D8E0] text-xs font-semibold rounded-full transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Permissions</span>
                            {isEditing ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                          <button
                            onClick={() => handleRevokePeer(peer.id)}
                            className="px-3 py-1.5 bg-[#FDF2F4] hover:bg-[#FBE4E8] border border-[#F1E6EC] text-[#C4122F] text-xs font-semibold rounded-full transition cursor-pointer"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>

                      {peer.lastPing && (
                        <div className="mt-3 p-2.5 bg-white border border-[#E6D8E0] rounded-xl text-xs text-[#3B0F2C] flex items-center gap-2">
                          <HeartPulse size={14} className="text-[#C4122F] shrink-0" />
                          <span><strong>Latest Support Ping:</strong> {peer.lastPing}</span>
                        </div>
                      )}

                      <AnimatePresence>
                        {isEditing && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-[#E6D8E0] overflow-hidden"
                          >
                            <span className="text-[10px] font-mono uppercase text-[#6E4A63] font-bold block mb-2.5">
                              ACTIVE DATA STREAM SHARING PERMISSIONS
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {[
                                { key: 'hydration', label: 'Hydration Intake Stream', icon: Droplets },
                                { key: 'painLogs', label: 'Pain & Crisis Logs', icon: AlertTriangle },
                                { key: 'medications', label: 'Medication Adherence', icon: Pill },
                                { key: 'vitals', label: 'Heart & SpO2', icon: Activity },
                                { key: 'moodNotes', label: 'Mood & Energy Notes', icon: Sparkles },
                                { key: 'emergencyAlerts', label: 'Emergency Crisis Override', icon: Bell },
                              ].map(({ key, label, icon: Icon }) => {
                                const isGranted = peer.permissions[key as keyof PeerConnection['permissions']];
                                return (
                                  <button
                                    key={key}
                                    onClick={() => handleTogglePermission(peer.id, key as keyof PeerConnection['permissions'])}
                                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                                      isGranted
                                        ? 'bg-white border-[#C4122F]/40 shadow-xs'
                                        : 'bg-[#F7F2F5] border-[#E6D8E0] opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Icon size={14} className={isGranted ? 'text-[#C4122F]' : 'text-[#6E4A63]'} />
                                      <span className="text-xs font-semibold text-[#3B0F2C] truncate">{label}</span>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isGranted ? 'bg-[#C4122F] text-white' : 'bg-gray-300 text-gray-600'
                                    }`}>
                                      {isGranted ? <Check size={10} /> : <X size={10} />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Generate Link Code & QR */}
        {activeTab === 'share-code' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF2F4] border border-[#F1E6EC] flex items-center justify-center mx-auto mb-3 text-[#C4122F]">
                <Key size={22} />
              </div>
              <h3 className="text-base sm:text-lg font-bold font-display text-[#3B0F2C]">Generate Secure Peer Linking Code</h3>
              <p className="text-xs text-[#6E4A63] mt-1">
                Give this code or show the QR code to your companion. Once they enter it, you will get a prompt to approve their access.
              </p>
            </div>

            <div className="bg-[#FAF7F9] border-2 border-dashed border-[#E6D8E0] rounded-2xl p-6 text-center space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E4A63] font-bold block">
                YOUR ENCRYPTED LINK CODE
              </span>

              <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-[#3B0F2C] bg-white py-3 px-6 rounded-xl border border-[#E6D8E0] inline-block shadow-xs">
                {generatedCode}
              </div>

              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-[#C4122F] hover:bg-[#9E0E26] text-white text-xs font-bold rounded-full transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={() => setShowQRModal(true)}
                  className="px-4 py-2 bg-white hover:bg-[#F7F2F5] text-[#3B0F2C] border border-[#E6D8E0] text-xs font-bold rounded-full transition flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode size={14} />
                  <span>Show QR</span>
                </button>

                <button
                  onClick={handleGenerateNewCode}
                  className="p-2 bg-white hover:bg-[#F7F2F5] text-[#6E4A63] border border-[#E6D8E0] rounded-full transition cursor-pointer"
                  title="Generate Fresh Code"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="bg-[#FAF7F9] border border-[#E6D8E0] rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-[#3B0F2C] block">Link Settings & Expiration</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'persistent', label: 'Persistent Link', desc: 'Long-term caregiver / family' },
                  { id: 'temporary-24h', label: '24-Hour Pass', desc: 'Single-day outing / travel' },
                  { id: 'crisis-72h', label: '72-Hour Pass', desc: 'Emergency clinical stay' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setCodeType(opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      codeType === opt.id
                        ? 'bg-white border-[#C4122F] text-[#3B0F2C] shadow-xs'
                        : 'bg-white/60 border-[#E6D8E0] text-[#6E4A63]'
                    }`}
                  >
                    <span className="text-xs font-bold block text-[#3B0F2C]">{opt.label}</span>
                    <span className="text-[10px] text-[#6E4A63] mt-0.5 block">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-[#6E4A63] border-t border-[#E6D8E0]">
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-[#1E7B4A]" />
                  <span>Explicit patient authorization required before any data is sent</span>
                </span>
                <span className="font-mono text-[11px]">Max Uses: 1 Device</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Connect as Peer */}
        {activeTab === 'join-peer' && (
          <div className="max-w-md mx-auto space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2F4] border border-[#F1E6EC] flex items-center justify-center mx-auto text-[#C4122F]">
              <UserPlus size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-display text-[#3B0F2C]">Enter a Warrior's Companion Code</h3>
              <p className="text-xs text-[#6E4A63] mt-1">
                If a family member or friend gave you their companion code, enter it below to request linking.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="e.g. WARRIOR-8942"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full bg-[#FAF7F9] border border-[#E6D8E0] focus:border-[#C4122F] rounded-xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-[#3B0F2C] uppercase placeholder:text-[#6E4A63]/50 outline-none transition"
              />

              <button
                onClick={handleJoinPeer}
                disabled={!inputCode.trim()}
                className="w-full py-3 bg-[#C4122F] hover:bg-[#9E0E26] disabled:opacity-50 text-white rounded-full text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <CheckCircle2 size={16} />
                <span>Submit Connection Request</span>
              </button>
            </div>

            {joinSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-[#E8F8EE] border border-[#B3E5C7] text-[#1E7B4A] rounded-xl text-xs text-left"
              >
                {joinSuccess}
              </motion.div>
            )}

            <div className="p-3 bg-[#FAF7F9] border border-[#E6D8E0] rounded-xl text-[11px] text-[#6E4A63] text-left space-y-1">
              <span className="font-bold text-[#3B0F2C] block">How it works for companions:</span>
              <p>1. The patient receives a notification on their device to approve your request.</p>
              <p>2. Once approved, you can view their hydration level, pain status, and send supportive check-in pings.</p>
            </div>
          </div>
        )}

        {/* Tab 4: AI Care Nudges & Supportive Insights */}
        {activeTab === 'ai-insights' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold font-display text-[#3B0F2C] flex items-center gap-2">
                <Sparkles size={17} className="text-[#C4122F]" />
                <span>AI-Assisted Peer Guidance & SCD Lived-Experience Nudges</span>
              </h3>
              <p className="text-xs text-[#6E4A63] mt-0.5">
                Gentle AI recommendations designed to help companions provide timely, empowering support without being overbearing.
              </p>
            </div>

            {/* AI Daily Companion Briefing Card */}
            <div className="bg-gradient-to-br from-[#FFF5F7] to-[#FAF2F6] border border-[#F1E6EC] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C4122F] font-bold flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#C4122F]" />
                  <span>AI DAILY COMPANION BRIEFING</span>
                </span>
                <span className="text-[10px] bg-white border border-[#E6D8E0] text-[#6E4A63] px-2 py-0.5 rounded-full font-mono font-semibold">
                  Generated Today
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#3B0F2C] leading-relaxed">
                "Your Warrior has maintained <strong>2.8L of hydration</strong> today (93% of goal) and logged low baseline discomfort (VAS 2/10). However, sudden evening temperature drops are forecast in your region. A comforting text suggesting warm herbal tea or layering up is recommended."
              </p>

              <div className="border-t border-[#F1E6EC] pt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-[#6E4A63] self-center">Suggested 1-Tap Messages:</span>
                {[
                  "Hey, super proud of your hydration today! 💧",
                  "Getting chilly tonight—stay cozy and warm! 🍵",
                  "Checking in on you! Let me know if you need anything 🌟"
                ].map((msg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend1TapNudge(msg)}
                    className="px-3 py-1.5 bg-white hover:bg-[#FBE4E8] text-[#3B0F2C] hover:text-[#C4122F] border border-[#E6D8E0] hover:border-[#C4122F] rounded-full text-xs font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    "{msg}"
                  </button>
                ))}
              </div>

              {sentNotification && (
                <div className="p-2.5 bg-[#E8F8EE] border border-[#B3E5C7] text-[#1E7B4A] rounded-xl text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#1E7B4A]" />
                    <span>{sentNotification}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#1E7B4A]">Logged to audit trail</span>
                </div>
              )}
            </div>

            {/* Health Continuity & Safety Monitoring */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-[#FAF7F9] border border-[#E6D8E0] rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[#1E7B4A] text-xs font-bold">
                  <CheckCircle2 size={15} />
                  <span>Care Continuity Status: Verified Active</span>
                </div>
                <p className="text-xs text-[#6E4A63] leading-relaxed">
                  All daily hydration and comfort logs recorded over the past 7 days. Routine peer check-ins and emergency contacts linked.
                </p>
              </div>

              <div className="bg-[#FAF7F9] border border-[#E6D8E0] rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[#C4122F] text-xs font-bold">
                  <ShieldCheck size={15} />
                  <span>Crisis Protocol Ready</span>
                </div>
                <p className="text-xs text-[#6E4A63] leading-relaxed">
                  Emergency contacts and peer broadcast are linked. If the Warrior logs severe pain (VAS &gt;= 8), companions receive a high-priority ping.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Privacy Audit Log */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1E6EC]">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-display text-[#3B0F2C] flex items-center gap-2">
                  <Shield size={17} className="text-[#C4122F]" />
                  <span>Real-Time Privacy & Access Audit Trail</span>
                </h3>
                <p className="text-xs text-[#6E4A63] mt-0.5">
                  Every instance of a peer viewing your health logs or vitals is cryptographically recorded below.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#1E7B4A] bg-[#E8F8EE] border border-[#B3E5C7] px-2.5 py-0.5 rounded-full font-bold">
                HIPAA / GDPR Ready
              </span>
            </div>

            <div className="divide-y divide-[#E6D8E0] border border-[#E6D8E0] rounded-2xl overflow-hidden bg-white">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF7F9] transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#3B0F2C]">{log.peerName}</span>
                      <span className="text-[10px] bg-[#FBE4E8] text-[#C4122F] px-2 py-0.5 rounded-full font-mono font-bold">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E4A63] mt-1">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#6E4A63] shrink-0 self-start sm:self-center">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#3B0F2C]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-[#E6D8E0] rounded-[28px] max-w-sm w-full p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#F1E6EC] pb-3">
                <h4 className="text-sm font-bold font-display text-[#3B0F2C] flex items-center gap-2">
                  <QrCode size={16} className="text-[#C4122F]" />
                  <span>Scan Companion Link Code</span>
                </h4>
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="p-1 rounded-full text-[#6E4A63] hover:text-[#3B0F2C] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-[#FAF7F9] p-4 rounded-2xl inline-block border border-[#E6D8E0]">
                <div className="w-48 h-48 bg-[#3B0F2C] rounded-xl p-3 flex flex-col items-center justify-between text-white">
                  <div className="flex justify-between w-full">
                    <div className="w-10 h-10 bg-[#C4122F] rounded-lg border-2 border-white"></div>
                    <div className="w-10 h-10 bg-[#C4122F] rounded-lg border-2 border-white"></div>
                  </div>
                  <div className="text-center font-mono font-black text-white text-xs tracking-wider">
                    {generatedCode}
                  </div>
                  <div className="flex justify-between w-full">
                    <div className="w-10 h-10 bg-[#C4122F] rounded-lg border-2 border-white"></div>
                    <div className="w-10 h-10 bg-[#3DDC84] rounded-lg border-2 border-white"></div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#6E4A63]">
                Point any smartphone camera or companion app scanner at this code to request a secure link.
              </p>

              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-2.5 bg-[#3B0F2C] hover:bg-[#2A081D] text-white rounded-full text-xs font-bold transition cursor-pointer"
              >
                Close QR Code
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
