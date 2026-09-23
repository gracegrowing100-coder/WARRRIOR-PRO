import React, { useState, useEffect } from 'react';
import { 
  Users, Key, QrCode, ShieldCheck, HeartPulse, Droplets, Pill, 
  Activity, AlertTriangle, Eye, EyeOff, Sparkles, Copy, Check, 
  Clock, UserPlus, RefreshCw, X, ChevronRight, Lock, Bell, 
  MessageSquare, Shield, CheckCircle2, ChevronDown, ChevronUp,
  Share2, ArrowRight, Zap, Info, Smartphone, HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [maxUses, setMaxUses] = useState<number>(1);
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
      details: 'Accessed today\'s 2.8L water logs and morning Hydroxyurea log.'
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

  // AI Insights State
  const [aiPeerNudge, setAiPeerNudge] = useState<string>(
    "Grace hasn't received a hydration check-in from you in 6 hours. AI suggestion: A gentle 1-tap ping keeps your support circle reassured."
  );

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
    <div id="peer-support-option-section" className="mt-8 border-t border-slate-800 pt-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <HeartHandshake size={140} className="text-indigo-400" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/80 border border-indigo-700/50 rounded-full text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-2.5">
              <ShieldCheck size={13} className="text-indigo-400" />
              <span>Peer Support Option & Care Stream</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Trusted Companion Health Linking</span>
              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full font-mono font-medium">LIVE</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Securely stream selected vitals, hydration milestones, and wellness status to trusted family, caregivers, or fellow warriors via encrypted, time-limited code pairing.
            </p>
          </div>

          {/* Quick Warrior Status Pill */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl min-w-[240px]">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" />
              <span>My Broadcasted Status</span>
            </span>
            <select
              value={warriorStatus}
              onChange={(e) => setWarriorStatus(e.target.value)}
              aria-label="Broadcasted Warrior Status"
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
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
        <div className="flex flex-wrap items-center gap-2 mt-6 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveTab('my-peers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'my-peers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users size={14} />
            <span>Active Peers ({peers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('share-code')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'share-code'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Key size={14} />
            <span>Generate Link Code</span>
          </button>

          <button
            onClick={() => setActiveTab('join-peer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'join-peer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserPlus size={14} />
            <span>Connect as Peer</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-insights')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai-insights'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>AI Care Nudges</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Shield size={14} />
            <span>Privacy Audit Log</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-lg">
        {/* Tab 1: Active Peers & Granular Permissions */}
        {activeTab === 'my-peers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-indigo-400" />
                  <span>Linked Companions & Care Stream Permissions</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  You have 100% control over what each linked person can see. Revoke or modify at any time.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('share-code')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition cursor-pointer self-start"
              >
                <UserPlus size={13} />
                <span>Link New Peer</span>
              </button>
            </div>

            {peers.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
                <Users size={36} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No peers linked yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Share a secure link code with a trusted loved one or friend to allow them to support you.
                </p>
                <button
                  onClick={() => setActiveTab('share-code')}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
                >
                  Generate First Code
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {peers.map((peer) => {
                  const isEditing = editingPeerId === peer.id;
                  return (
                    <div 
                      key={peer.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 transition hover:border-slate-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-xl shrink-0 shadow-inner">
                            {peer.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{peer.peerName}</h4>
                              <span className="text-[10px] font-semibold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-md">
                                {peer.relation}
                              </span>
                              {peer.isTemporary && (
                                <span className="text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock size={10} />
                                  {peer.expiresIn || 'Temporary'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                              <span>Linked since: {peer.linkedSince}</span>
                              <span>•</span>
                              <span className="text-slate-400">Last viewed stream: <strong className="text-slate-300">{peer.lastViewed}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setEditingPeerId(isEditing ? null : peer.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Permissions</span>
                            {isEditing ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                          <button
                            onClick={() => handleRevokePeer(peer.id)}
                            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                          >
                            Revoke / Unlink
                          </button>
                        </div>
                      </div>

                      {/* Last Peer Support Activity / Ping */}
                      {peer.lastPing && (
                        <div className="mt-3 p-2.5 bg-indigo-950/40 border border-indigo-900/30 rounded-lg text-xs text-indigo-200 flex items-center gap-2">
                          <HeartPulse size={14} className="text-indigo-400 shrink-0" />
                          <span><strong>Latest Support Ping:</strong> {peer.lastPing}</span>
                        </div>
                      )}

                      {/* Expandable Granular Permission Toggles */}
                      <AnimatePresence>
                        {isEditing && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-slate-800 overflow-hidden"
                          >
                            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-3">
                              ACTIVE DATA STREAM SHARING PERMISSIONS
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {[
                                { key: 'hydration', label: 'Hydration Intake Stream', icon: Droplets, color: 'text-sky-400' },
                                { key: 'painLogs', label: 'Pain & Crisis Logs', icon: AlertTriangle, color: 'text-amber-400' },
                                { key: 'medications', label: 'Medication Adherence', icon: Pill, color: 'text-emerald-400' },
                                { key: 'vitals', label: 'Real-time Heart & SpO2', icon: Activity, color: 'text-rose-400' },
                                { key: 'moodNotes', label: 'Mood & Energy Notes', icon: Sparkles, color: 'text-purple-400' },
                                { key: 'emergencyAlerts', label: 'Emergency Crisis Override', icon: Bell, color: 'text-red-400' },
                              ].map(({ key, label, icon: Icon, color }) => {
                                const isGranted = peer.permissions[key as keyof PeerConnection['permissions']];
                                return (
                                  <button
                                    key={key}
                                    onClick={() => handleTogglePermission(peer.id, key as keyof PeerConnection['permissions'])}
                                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                                      isGranted
                                        ? 'bg-slate-900 border-indigo-700/60 shadow-sm'
                                        : 'bg-slate-950 border-slate-800 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Icon size={14} className={color} />
                                      <span className="text-xs font-semibold text-slate-200 truncate">{label}</span>
                                    </div>
                                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                                      isGranted ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
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
              <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                <Key size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">Generate Secure Peer Linking Code</h3>
              <p className="text-xs text-slate-400 mt-1">
                Give this code or show the QR code to your companion. Once they enter it, you will get a prompt to approve their access.
              </p>
            </div>

            {/* Code Display Card */}
            <div className="bg-slate-950 border-2 border-dashed border-indigo-700/60 rounded-2xl p-6 text-center space-y-4 shadow-inner">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold block">
                YOUR ENCRYPTED LINK CODE
              </span>

              <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-white bg-slate-900 py-3 px-6 rounded-xl border border-slate-800 inline-block shadow-md">
                {generatedCode}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={() => setShowQRModal(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode size={14} />
                  <span>Show QR Code</span>
                </button>

                <button
                  onClick={handleGenerateNewCode}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                  title="Generate Fresh Code"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Code Security Configuration */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <span className="text-xs font-bold text-white block">Link Settings & Expiration</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'persistent', label: 'Persistent Link', desc: 'Long-term caregiver / family' },
                  { id: 'temporary-24h', label: '24-Hour Pass', desc: 'Single-day outing / travel' },
                  { id: 'crisis-72h', label: '72-Hour Hospital Link', desc: 'Emergency clinical stay' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setCodeType(opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      codeType === opt.id
                        ? 'bg-indigo-950/60 border-indigo-600 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold block text-slate-200">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-emerald-400" />
                  <span>Explicit patient authorization required before any data is sent</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">Max Uses: 1 Device</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Connect as Peer */}
        {activeTab === 'join-peer' && (
          <div className="max-w-md mx-auto space-y-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center mx-auto text-indigo-400">
              <UserPlus size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Enter a Warrior's Companion Code</h3>
              <p className="text-xs text-slate-400 mt-1">
                If a family member or friend gave you their Sickle Cell companion code, enter it below to request linking.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="e.g. WARRIOR-8942"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500 rounded-xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-white uppercase placeholder:text-slate-600 outline-none transition"
              />

              <button
                onClick={handleJoinPeer}
                disabled={!inputCode.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <CheckCircle2 size={16} />
                <span>Submit Connection Request</span>
              </button>
            </div>

            {joinSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs text-left"
              >
                {joinSuccess}
              </motion.div>
            )}

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 text-left space-y-1">
              <span className="font-bold text-slate-300 block">How it works for companions:</span>
              <p>1. The patient receives a notification on their device to approve your request.</p>
              <p>2. Once approved, you can view their hydration level, pain status, and send supportive check-in pings.</p>
            </div>
          </div>
        )}

        {/* Tab 4: AI Care Nudges & Supportive Insights */}
        {activeTab === 'ai-insights' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <span>AI-Assisted Peer Guidance & SCD Lived-Experience Nudges</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Gentle AI recommendations designed to help companions provide timely, empowering support without being overbearing.
              </p>
            </div>

            {/* AI Daily Companion Briefing Card */}
            <div className="bg-gradient-to-r from-indigo-950/70 to-slate-950 border border-indigo-800/50 rounded-2xl p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-400" />
                  <span>AI DAILY COMPANION BRIEFING</span>
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  Generated Today
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                "Your Warrior has maintained <strong>2.8L of hydration</strong> today (93% of goal) and logged low baseline discomfort (VAS 2/10). However, sudden evening temperature drops are forecast in your region. A comforting text suggesting warm herbal tea or layering up is recommended."
              </p>

              <div className="border-t border-indigo-900/40 pt-3 flex flex-wrap gap-2">
                <span className="text-[11px] font-semibold text-slate-400 self-center">Suggested 1-Tap Messages:</span>
                {[
                  "Hey, super proud of your hydration today! 💧",
                  "Getting chilly tonight—stay cozy and warm! 🍵",
                  "Checking in on you! Let me know if you need anything 🌟"
                ].map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      alert(`Support ping sent to Warrior: "${msg}"`);
                    }}
                    className="px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50 rounded-lg text-[11px] transition cursor-pointer"
                  >
                    "{msg}"
                  </button>
                ))}
              </div>
            </div>

            {/* Anomaly Detection Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 size={15} />
                  <span>Baseline Stability Score: 94%</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No concerning physiological deviations detected over the past 7 days. Routine peer check-ins remain optimal.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <ShieldCheck size={15} />
                  <span>Crisis Protocol Ready</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Emergency contacts and peer broadcast are linked. If the Warrior logs severe pain (VAS &gt;= 8), companions receive a high-priority ping.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Privacy Audit Log */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield size={18} className="text-indigo-400" />
                  <span>Real-Time Privacy & Access Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every instance of a peer viewing your health logs or vitals is cryptographically recorded below.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded-full">
                HIPAA / GDPR Compliant
              </span>
            </div>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{log.peerName}</span>
                      <span className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 self-start sm:self-center">
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-indigo-700/60 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <QrCode size={16} className="text-indigo-400" />
                  <span>Scan Companion Link Code</span>
                </h4>
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* High Contrast Visual QR Representation */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
                <div className="w-48 h-48 bg-slate-950 rounded-xl p-2.5 flex flex-col items-center justify-between">
                  <div className="flex justify-between w-full">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg border-2 border-white"></div>
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg border-2 border-white"></div>
                  </div>
                  <div className="text-center font-mono font-black text-white text-xs tracking-wider">
                    {generatedCode}
                  </div>
                  <div className="flex justify-between w-full">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg border-2 border-white"></div>
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg border-2 border-white"></div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Point any smartphone camera or companion app scanner at this code to request a secure link.
              </p>

              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
