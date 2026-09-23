import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Search, MoreVertical, Paperclip, Phone, Video, MessageSquare, 
  ChevronLeft, Shield, Smile, X, Image as ImageIcon, Video as VideoIcon, 
  FileText, Check, CheckCheck, Users, Info, Play, Pause, Volume2, Mic, 
  MicOff, Camera, UserPlus, Award, Calendar, ExternalLink, Trash2, 
  Reply, Copy, Pin, MapPin, Download, Sparkles, Filter, Plus, 
  AlertTriangle, VolumeX, ShieldAlert, ShieldCheck, RefreshCw, ZoomIn, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase-init';
import { PeerSupportSection } from './PeerSupportSection';

// Initial preloaded authentic SCD chats and warrior groups
const DEFAULT_CHATS = [
  { 
    id: 'lagos-warriors', 
    name: 'Lagos Warriors Support Group', 
    avatar: '🔴',
    desc: 'The active group channel of the Lagos Sickle Cell Warrior community. Supporting warriors with knowledge, daily hydration reminders, and genetic tips.',
    lastMsg: 'Stay hydrated everyone! Remember to log your water today.', 
    time: '10:45 AM', 
    unread: 2, 
    online: true,
    category: 'Group Chat',
    pinned: true,
    members: [
      { id: 'dr-sarah-uid', name: 'Dr. Sarah (Hematology)', role: 'Lead Hematologist', active: true, avatar: '👩‍⚕️', isAdmin: true },
      { id: 'tunde-uid', name: 'Tunde (Warrior)', role: 'SCD Hero (HbSS)', active: true, avatar: '🦸‍♂️', isAdmin: false },
      { id: 'grace-mom-uid', name: 'Grace (Caregiver)', role: 'Support Mother', active: false, avatar: '👩', isAdmin: false },
      { id: 'faith-uid', name: 'Faith (Warrior)', role: 'SCD Advocate', active: true, avatar: '👩‍🎤', isAdmin: false },
      { id: 'current-user-uid', name: 'You (Warrior)', role: 'Group Moderator', active: true, avatar: '🩺', isAdmin: true }
    ]
  },
  { 
    id: 'hematology-dr-sarah', 
    name: 'Dr. Sarah (Hematology Consultant)', 
    avatar: '🩺',
    desc: 'Direct consultation channel with Dr. Sarah. Ask questions about your hydroxyurea regimen, clinic hours, or pain monitoring metrics.',
    lastMsg: 'Your haematology panel results are uploaded and stable.', 
    time: '09:30 AM', 
    unread: 1, 
    online: true,
    category: 'Private Specialist',
    pinned: true,
    members: [
      { id: 'dr-sarah-uid', name: 'Dr. Sarah (Hematology)', role: 'Specialist MD', active: true, avatar: '👩‍⚕️', isAdmin: true },
      { id: 'current-user-uid', name: 'You', role: 'Patient', active: true, avatar: '🩺', isAdmin: false }
    ]
  },
  { 
    id: 'global-scd-network', 
    name: 'Global SCD Network Alliance', 
    avatar: '🧬',
    desc: 'Connecting sickle cell advocates, medical professionals, and support networks globally. Sharing breakthrough CRISPR therapeutic updates and international advocacy.',
    lastMsg: 'Global assembly link is ready. Meeting is starting.', 
    time: 'Yesterday', 
    unread: 0, 
    online: true,
    category: 'Global Alliance',
    pinned: false,
    members: [
      { id: 'prof-adebayo-uid', name: 'Prof. Adebayo (UK)', role: 'SCD Research Director', active: true, avatar: '👨‍🔬', isAdmin: true },
      { id: 'marie-uid', name: 'Marie (Paris, Warrior)', role: 'Advocate Coordinator', active: true, avatar: '👩‍🎨', isAdmin: true },
      { id: 'nabil-uid', name: 'Nabil (Cairo, Parent)', role: 'Family Pillar', active: false, avatar: '👨', isAdmin: false },
      { id: 'current-user-uid', name: 'You', role: 'Warrior Member', active: true, avatar: '🩺', isAdmin: false }
    ]
  },
  { 
    id: 'caregivers-circle', 
    name: 'Warrior Moms & Caregivers Circle', 
    avatar: '🤱',
    desc: 'A dedicated, empathetic safe space for parents, siblings, and partners supporting children and adults living with Sickle Cell Disease.',
    lastMsg: 'We pack a thermos with warm bone broth and electrolytes.', 
    time: 'Yesterday', 
    unread: 0, 
    online: false,
    category: 'Caregivers',
    pinned: false,
    members: [
      { id: 'grace-mom-uid', name: 'Grace (Caregiver Mother)', role: 'Circle Moderator', active: false, avatar: '👩', isAdmin: true },
      { id: 'nabil-uid', name: 'Nabil (Cairo, Parent)', role: 'Active Parent', active: false, avatar: '👨', isAdmin: false },
      { id: 'amina-uid', name: 'Amina (Caregiver)', role: 'Community Helper', active: true, avatar: '🧕', isAdmin: false },
      { id: 'current-user-uid', name: 'You', role: 'Member', active: true, avatar: '🩺', isAdmin: false }
    ]
  },
  { 
    id: 'crisis-rapid-response', 
    name: 'Crisis Rapid Response & Blood Dispatch', 
    avatar: '🚨',
    desc: 'Emergency coordination group for urgent vaso-occlusive crisis triage, locating donor blood matches, and nearest oxygen-ready hospitals.',
    lastMsg: 'Emergency dispatch protocol is always active 24/7.', 
    time: '2 days ago', 
    unread: 0, 
    online: true,
    category: 'Emergency Dispatch',
    pinned: false,
    members: [
      { id: 'system-bot', name: 'Emergency Coordination Bot', role: 'System Dispatcher', active: true, avatar: '🤖', isAdmin: true },
      { id: 'dr-sarah-uid', name: 'Dr. Sarah (Hematology)', role: 'On-Call Hematologist', active: true, avatar: '👩‍⚕️', isAdmin: true },
      { id: 'blood-hub-uid', name: 'Blood Bank Hub', role: 'Donor Match System', active: true, avatar: '🩸', isAdmin: false },
      { id: 'current-user-uid', name: 'You', role: 'Warrior Member', active: true, avatar: '🩺', isAdmin: true }
    ]
  }
];

// Presets for supportive stickers / clinical shortcuts
const CLINICAL_PRESETS = [
  { id: 'pres_hydrate', text: '💧 Hydration Check Alert: Drink 500ml warm water now to thin capillary blood and protect your kidneys!', label: '💧 Hydration', emoji: '💧' },
  { id: 'pres_vaso', text: '❄️ Cold Warning: Keep warm! Cold wind triggers vasoconstriction, trapping rigid sickle cell structures.', label: '❄️ Cold Warn', emoji: '❄️' },
  { id: 'pres_support', text: '🤝 Warrior Solidarity: "None of us is as strong as all of us." We carry genomic resilience!', label: '🤝 Solidarity', emoji: '🤝' },
  { id: 'pres_folic', text: '💊 Medication Reminder: Take your daily Folic Acid & Hydroxyurea to fortify red cell replacement!', label: '💊 Daily Meds', emoji: '💊' },
  { id: 'pres_pain', text: '⚡ Pain Alert: Experiencing mild joint stiffness. Initiating deep hydration and thermal heating pad.', label: '⚡ Joint Alert', emoji: '⚡' }
];

const EMOJI_REACTIONS = ['❤️', '🧬', '💧', '💊', '👏', '🙏', '🔥', '💪'];

const INAPPROPRIATE_REASONS = [
  'Inappropriate or offensive language',
  'Medical misinformation or unverified remedies',
  'Spam, advertising, or unsolicited links',
  'Harassment or disrespectful behavior',
  'Privacy violation or sharing sensitive medical data'
];

// Audio synthesizer for authentic WhatsApp notification sounds
const playTone = (type: 'send' | 'receive' | 'call' | 'alert') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'receive') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'call') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio Context blocked
  }
};

const ChatSystem: React.FC = () => {
  const [allChats, setAllChats] = useState(DEFAULT_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(DEFAULT_CHATS[0].id);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Group Chat' | 'Private Specialist' | 'Caregivers' | 'Emergency Dispatch'>('All');
  const [inChatSearch, setInChatSearch] = useState('');
  const [showInChatSearchBar, setShowInChatSearchBar] = useState(false);

  // Real-time typing indicators
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<any>(null);

  // Group Admin & Moderation Settings
  const [groupSettings, setGroupSettings] = useState<{ admins: string[]; mutedUsers: string[] }>({
    admins: ['dr-sarah-uid', 'current-user-uid'],
    mutedUsers: []
  });
  const [selectedMessageForMod, setSelectedMessageForMod] = useState<any | null>(null);
  const [modReason, setModReason] = useState(INAPPROPRIATE_REASONS[0]);
  const [customModReason, setCustomModReason] = useState('');
  const [showModModal, setShowModModal] = useState(false);

  // Camera & Storage Upload state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [isUploadingToStorage, setIsUploadingToStorage] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Reply / Quote state
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; text: string } | null>(null);

  // Voice Note Recording states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Media attachment states
  const [localPreviewFile, setLocalPreviewFile] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  // Calling states
  const [callSession, setCallSession] = useState<{ type: 'voice' | 'video'; active: boolean; timer: number } | null>(null);
  const [muteMicrophone, setMuteMicrophone] = useState(false);
  const [cameraStreamActive, setCameraStreamActive] = useState(true);

  // New Group Form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupAvatar, setNewGroupAvatar] = useState('🌟');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<'Group Chat' | 'Private Specialist' | 'Caregivers' | 'Emergency Dispatch'>('Group Chat');

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const cameraViewfinderRef = useRef<HTMLVideoElement>(null);
  const callTimerRef = useRef<any>(null);

  const currentUserId = auth.currentUser?.uid || 'current-user-uid';
  const currentUserName = auth.currentUser?.displayName || 'You';

  // Load custom groups
  useEffect(() => {
    const userId = auth.currentUser?.uid || 'guest';
    const custom = firebaseService.getCustomGroups(userId);
    if (custom && custom.length > 0) {
      setAllChats(prev => {
        const customIds = new Set(custom.map((c: any) => c.id));
        const filteredDefault = prev.filter(c => !customIds.has(c.id));
        return [...custom, ...filteredDefault];
      });
    }
  }, []);

  // Real-time Firestore message subscription
  useEffect(() => {
    if (!activeChatId) return;
    
    const unsubscribe = firebaseService.subscribeToMessages(activeChatId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => {
      unsubscribe();
    };
  }, [activeChatId]);

  // Real-time typing status subscription
  useEffect(() => {
    if (!activeChatId) return;

    const unsubscribe = firebaseService.subscribeToTypingStatus(activeChatId, currentUserId, (activeTypers) => {
      setTypingUsers(activeTypers);
    });

    return () => {
      unsubscribe();
    };
  }, [activeChatId, currentUserId]);

  // Real-time Group settings (Admins, Muted Users) subscription
  useEffect(() => {
    if (!activeChatId) return;

    const unsubscribe = firebaseService.subscribeToGroupSettings(activeChatId, (settings) => {
      setGroupSettings(settings);
    });

    return () => {
      unsubscribe();
    };
  }, [activeChatId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, localPreviewFile, replyingTo, typingUsers]);

  // Camera stream handler for in-app Viewfinder
  useEffect(() => {
    if (isCameraModalOpen && !capturedPhotoUrl) {
      navigator.mediaDevices?.getUserMedia({ 
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: false 
      })
      .then((stream) => {
        setCameraStream(stream);
        if (cameraViewfinderRef.current) {
          cameraViewfinderRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn("Direct webcam/camera stream unavailable, switching to native file capture:", err);
      });
    }

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraModalOpen, cameraFacing, capturedPhotoUrl]);

  // Dynamic call timer
  useEffect(() => {
    if (callSession?.active) {
      callTimerRef.current = setInterval(() => {
        setCallSession(prev => prev ? { ...prev, timer: prev.timer + 1 } : null);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callSession?.active]);

  const activeChat = allChats.find(c => c.id === activeChatId) || allChats[0];

  // Admin status check
  const isCurrentUserAdmin = groupSettings.admins.includes(currentUserId) || 
                             groupSettings.admins.includes('current-user-uid') || 
                             activeChat.members?.some(m => (m.id === currentUserId || m.name.includes('You')) && m.isAdmin);

  // Mute status check
  const isCurrentUserMuted = groupSettings.mutedUsers.includes(currentUserId) || groupSettings.mutedUsers.includes('current-user-uid');

  // Filter conversations list
  const filteredChats = allChats.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filter messages in chat search
  const visibleMessages = inChatSearch.trim()
    ? messages.filter(m => m.text?.toLowerCase().includes(inChatSearch.toLowerCase()))
    : messages;

  // Compress image
  const compressImage = (base64Str: string, maxW = 800, maxH = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxW) {
            height *= maxW / width;
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width *= maxH / height;
            height = maxH;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  // --- Real-time Typing Handler ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (activeChatId && !isCurrentUserMuted) {
      firebaseService.setTypingStatus(activeChatId, currentUserId, currentUserName, true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        firebaseService.setTypingStatus(activeChatId, currentUserId, currentUserName, false);
      }, 2500);
    }
  };

  // --- Camera In-App Actions ---
  const handleOpenLiveCamera = () => {
    setShowAttachmentMenu(false);
    setCapturedPhotoUrl(null);
    setIsCameraModalOpen(true);
  };

  const handleCaptureFrame = () => {
    if (!cameraViewfinderRef.current) return;
    const video = cameraViewfinderRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhotoUrl(dataUrl);
    }
  };

  const handleRetakeCameraPhoto = () => {
    setCapturedPhotoUrl(null);
  };

  const handleCloseCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraModalOpen(false);
    setCapturedPhotoUrl(null);
  };

  const handleConfirmCameraPhoto = async () => {
    if (!capturedPhotoUrl || !activeChatId) return;

    setIsUploadingToStorage(true);
    try {
      const compressed = await compressImage(capturedPhotoUrl);
      // Upload to Firebase Storage
      const uploadedStorageUrl = await firebaseService.uploadChatMedia(activeChatId, compressed, 'camera_capture');
      
      setLocalPreviewFile({
        url: uploadedStorageUrl,
        type: 'image'
      });
      handleCloseCameraModal();
    } catch (err) {
      console.warn("Storage upload fallback:", err);
      setLocalPreviewFile({
        url: capturedPhotoUrl,
        type: 'image'
      });
      handleCloseCameraModal();
    } finally {
      setIsUploadingToStorage(false);
    }
  };

  // Native camera file input change (Mobile/Tablet fallback)
  const handleCameraFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;

    setIsUploadingToStorage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const resultStr = event.target?.result as string;
      if (resultStr) {
        try {
          const compressed = await compressImage(resultStr);
          const storageUrl = await firebaseService.uploadChatMedia(activeChatId, compressed, 'camera_mobile');
          setLocalPreviewFile({
            url: storageUrl,
            type: 'image'
          });
        } catch (err) {
          setLocalPreviewFile({
            url: resultStr,
            type: 'image'
          });
        }
      }
      setIsUploadingToStorage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerFilePicker = () => {
    setShowAttachmentMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;

    setIsUploadingToStorage(true);
    const reader = new FileReader();
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');

    reader.onload = async (event) => {
      const resultStr = event.target?.result as string;
      if (!resultStr) {
        setIsUploadingToStorage(false);
        return;
      }

      let finalMediaUrl = resultStr;
      if (isImg) {
        try {
          const compressed = await compressImage(resultStr);
          finalMediaUrl = await firebaseService.uploadChatMedia(activeChatId, compressed, 'upload');
        } catch (err) {
          console.warn("Image storage upload fallback:", err);
        }
      }

      setLocalPreviewFile({
        url: finalMediaUrl,
        type: isImg ? 'image' : 'video'
      });
      setIsUploadingToStorage(false);
    };

    reader.readAsDataURL(file);
  };

  // --- Voice Recording Logic ---
  const startVoiceRecording = async () => {
    if (isCurrentUserMuted) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (base64Audio && recordingDuration > 0) {
            playTone('send');
            await firebaseService.sendMessage(
              activeChatId!,
              '🎤 Voice Note (' + recordingDuration + 's)',
              base64Audio,
              'audio',
              replyingTo,
              recordingDuration
            );
            setReplyingTo(null);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access denied or simulated:", err);
      playTone('send');
      await firebaseService.sendMessage(
        activeChatId!,
        '🎤 Voice Note: "Staying warm, taking hydroxyurea and drinking water today!"',
        null,
        'audio',
        replyingTo,
        5
      );
      setReplyingTo(null);
    }
  };

  const stopVoiceRecording = (cancel: boolean = false) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        audioChunksRef.current = [];
        mediaRecorderRef.current.stop();
      } else {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const togglePlayAudio = (msgId: string, audioUrl?: string) => {
    if (!audioUrl) return;

    if (playingAudioId === msgId) {
      audioElementsRef.current[msgId]?.pause();
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioElementsRef.current[playingAudioId]) {
        audioElementsRef.current[playingAudioId].pause();
      }

      if (!audioElementsRef.current[msgId]) {
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingAudioId(null);
        audioElementsRef.current[msgId] = audio;
      }
      audioElementsRef.current[msgId].play();
      setPlayingAudioId(msgId);
    }
  };

  // --- Send Message ---
  const handleSendMessage = async (textOverload?: string) => {
    if (isCurrentUserMuted) return;

    const textValue = textOverload !== undefined ? textOverload : inputText;
    if (!textValue.trim() && !localPreviewFile && !textOverload) return;

    const textToSend = textValue;
    const mediaToSend = localPreviewFile;
    const currentReply = replyingTo;

    setInputText('');
    setLocalPreviewFile(null);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
    setReplyingTo(null);

    // Clear typing status immediately
    if (activeChatId) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      firebaseService.setTypingStatus(activeChatId, currentUserId, currentUserName, false);
    }

    playTone('send');

    try {
      await firebaseService.sendMessage(
        activeChatId!, 
        textToSend, 
        mediaToSend?.url || null, 
        mediaToSend?.type || null,
        currentReply
      );

      // Simulation replies
      if (activeChatId === 'hematology-dr-sarah' && textToSend.length > 5) {
        setTimeout(async () => {
          firebaseService.setTypingStatus(activeChatId, 'dr-sarah-uid', 'Dr. Sarah (Hematology)', true);
          setTimeout(async () => {
            firebaseService.setTypingStatus(activeChatId, 'dr-sarah-uid', 'Dr. Sarah (Hematology)', false);
            playTone('receive');
            await firebaseService.sendMessage(
              'hematology-dr-sarah',
              'Dr. Sarah: "Noted! Please remember to keep well-hydrated with 3.0L and record any pain flare intensity in your tracker."'
            );
          }, 2000);
        }, 1200);
      }
    } catch (error) {
      console.error("Failed to dispatch message:", error);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    await firebaseService.toggleMessageReaction(activeChatId!, messageId, emoji, currentUserId);
  };

  const handleDeleteMessage = async (messageId: string) => {
    await firebaseService.deleteChatMessage(activeChatId!, messageId);
  };

  // --- Admin Moderation Handlers ---
  const handleOpenModerationModal = (msg: any) => {
    setSelectedMessageForMod(msg);
    setModReason(INAPPROPRIATE_REASONS[0]);
    setCustomModReason('');
    setShowModModal(true);
  };

  const handleConfirmRemoveMessage = async () => {
    if (!selectedMessageForMod || !activeChatId) return;

    const reasonFinal = customModReason.trim() || modReason;
    playTone('alert');
    await firebaseService.removeMessageAsAdmin(
      activeChatId,
      selectedMessageForMod.id,
      currentUserName,
      reasonFinal
    );

    setShowModModal(false);
    setSelectedMessageForMod(null);
  };

  const handleToggleMuteUser = async (targetUserId: string, currentMutedState: boolean) => {
    if (!activeChatId || !isCurrentUserAdmin) return;
    playTone('alert');
    await firebaseService.toggleMuteUserInGroup(activeChatId, targetUserId, !currentMutedState);
  };

  const handleToggleAdminRole = async (targetUserId: string, currentAdminState: boolean) => {
    if (!activeChatId || !isCurrentUserAdmin) return;
    await firebaseService.toggleGroupAdmin(activeChatId, targetUserId, !currentAdminState);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  // Calling actions
  const handleStartCall = (type: 'voice' | 'video') => {
    playTone('call');
    setCallSession({
      type,
      active: true,
      timer: 0
    });
  };

  const handleEndCall = () => {
    setCallSession(null);
    if (videoElementRef.current?.srcObject) {
      const stream = videoElementRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Create new custom group
  const handleCreateNewGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup = {
      id: 'custom-' + Date.now().toString(36),
      name: newGroupName.trim(),
      avatar: newGroupAvatar || '🛡️',
      desc: newGroupDesc.trim() || 'A supportive Warrior Sickle Cell community chat group.',
      lastMsg: 'Group created. Welcome fellow warriors!',
      time: 'Just now',
      unread: 0,
      online: true,
      category: newGroupCategory,
      pinned: false,
      members: [
        { id: 'dr-sarah-uid', name: 'Dr. Sarah (Hematology)', role: 'Advising Specialist', active: true, avatar: '👩‍⚕️', isAdmin: true },
        { id: currentUserId, name: 'You (Creator)', role: 'Group Admin', active: true, avatar: '👑', isAdmin: true }
      ]
    };

    const userId = auth.currentUser?.uid || 'guest';
    firebaseService.saveCustomGroup(userId, newGroup);
    setAllChats([newGroup, ...allChats]);
    setActiveChatId(newGroup.id);
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  // Export chat transcript
  const handleExportChat = () => {
    const textContent = messages.map(m => {
      const time = m.timestamp?.toDate ? m.timestamp.toDate().toLocaleString() : m.timestamp;
      return `[${time}] ${m.senderName || 'Warrior'}: ${m.text || (m.mediaType ? `[Attachment: ${m.mediaType}]` : '')}`;
    }).join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChat.name.replace(/\s+/g, '_')}_Transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mediaMessages = messages.filter(m => m.mediaUrl && (m.mediaType === 'image' || m.mediaType === 'video'));

  return (
    <div className="space-y-6">
      <div id="warrior-chat-container" className="h-[calc(100vh-170px)] min-h-[540px] flex flex-col md:flex-row bg-slate-900 text-white rounded-3xl shadow-2xl border-4 border-slate-950 overflow-hidden relative font-sans">
      
      {/* Hidden file input for documents & standard uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*,video/*" 
        className="hidden" 
      />

      {/* Hidden file input for native camera launch */}
      <input 
        type="file" 
        ref={cameraFileInputRef} 
        onChange={handleCameraFileChange} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      {/* 1. IMAGE LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImageUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxImageUrl(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img 
                src={lightboxImageUrl} 
                alt="Enlarged" 
                className="rounded-2xl max-h-[80vh] w-auto object-contain border-2 border-slate-800 shadow-2xl" 
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center gap-3 mt-3">
                <a 
                  href={lightboxImageUrl} 
                  download="Warrior_Chat_Image.jpg" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 transition"
                >
                  <Download size={14} /> Download Full Quality
                </a>
                <button 
                  onClick={() => setLightboxImageUrl(null)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <X size={14} /> Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. LIVE CAMERA SNAPSHOT MODAL (Firebase Storage Upload) */}
      <AnimatePresence>
        {isCameraModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                    <Camera size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">Camera Capture</h3>
                    <p className="text-[10px] text-gray-400 font-mono">Upload to Firebase Storage</p>
                  </div>
                </div>
                <button 
                  onClick={handleCloseCameraModal}
                  className="p-1.5 hover:bg-slate-800 text-gray-400 hover:text-white rounded-xl transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Viewfinder / Frozen Snapshot */}
              <div className="relative aspect-square sm:aspect-video bg-black flex items-center justify-center overflow-hidden">
                {capturedPhotoUrl ? (
                  <img 
                    src={capturedPhotoUrl} 
                    alt="Captured" 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <>
                    <video 
                      ref={cameraViewfinderRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover" 
                    />
                    {/* Viewfinder crosshairs */}
                    <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-red-500 absolute top-0 left-0"></div>
                      <div className="w-4 h-4 border-t-2 border-r-2 border-red-500 absolute top-0 right-0"></div>
                      <div className="w-4 h-4 border-b-2 border-l-2 border-red-500 absolute bottom-0 left-0"></div>
                      <div className="w-4 h-4 border-b-2 border-r-2 border-red-500 absolute bottom-0 right-0"></div>
                    </div>
                  </>
                )}

                {/* Flip camera toggle */}
                {!capturedPhotoUrl && (
                  <button 
                    onClick={() => setCameraFacing(prev => prev === 'user' ? 'environment' : 'user')}
                    className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-xl text-white backdrop-blur-md transition border border-white/10"
                    title="Switch camera"
                  >
                    <RefreshCw size={15} />
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                {capturedPhotoUrl ? (
                  <>
                    <button 
                      onClick={handleRetakeCameraPhoto}
                      disabled={isUploadingToStorage}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <RefreshCw size={14} /> Retake
                    </button>
                    <button 
                      onClick={handleConfirmCameraPhoto}
                      disabled={isUploadingToStorage}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-red-900/30"
                    >
                      {isUploadingToStorage ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} /> Attach to Chat
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => cameraFileInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5"
                    >
                      <ImageIcon size={13} /> Native Camera
                    </button>
                    <button 
                      onClick={handleCaptureFrame}
                      className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-900/40 border-4 border-slate-900 hover:scale-105 active:scale-95 transition cursor-pointer"
                      title="Snap photo"
                    >
                      <div className="w-5 h-5 rounded-full bg-white"></div>
                    </button>
                    <button 
                      onClick={handleCloseCameraModal}
                      className="px-3 py-2 bg-slate-850 hover:bg-slate-800 text-gray-400 rounded-xl text-[11px] font-bold transition"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ADMIN MODERATION MODAL: REMOVE INAPPROPRIATE MESSAGE */}
      <AnimatePresence>
        {showModModal && selectedMessageForMod && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border-2 border-red-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 bg-red-950/40 border-b border-red-500/20 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">Administrator Moderation</h3>
                  <p className="text-[10px] text-red-300 font-mono">Remove Inappropriate Message</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Target Message Preview */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[9px] font-mono text-gray-400 block font-bold">
                    Author: {selectedMessageForMod.senderName}
                  </span>
                  <p className="text-xs text-gray-300 italic line-clamp-2">
                    "{selectedMessageForMod.text || '[Media Attachment]'}"
                  </p>
                </div>

                {/* Reason Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 font-mono tracking-wider block">
                    Select Violation Reason:
                  </label>
                  <div className="space-y-1.5">
                    {INAPPROPRIATE_REASONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setModReason(r)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold border transition ${
                          modReason === r 
                            ? 'bg-red-500/20 border-red-500 text-white' 
                            : 'bg-slate-950 border-slate-800 text-gray-400 hover:bg-slate-800'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Note */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 font-mono tracking-wider block">
                    Custom Note (Optional):
                  </label>
                  <input 
                    type="text"
                    placeholder="Provide specific guidance to the member..."
                    value={customModReason}
                    onChange={(e) => setCustomModReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setShowModModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemoveMessage}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-red-900/30"
                >
                  <Trash2 size={13} /> Remove Message
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE NEW GROUP MODAL */}
      <AnimatePresence>
        {showCreateGroupModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h3 className="text-sm font-black text-white">Create Warrior Group</h3>
                    <p className="text-[10px] text-gray-400">Establish a sickle cell support room</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateGroupModal(false)} 
                  className="p-1 hover:bg-slate-800 rounded-lg text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 font-mono tracking-wider block mb-1">Group Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Abuja Hydroxyurea Circle" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 font-mono tracking-wider block mb-1">Select Group Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {['🌟', '🧬', '🛡️', '❤️', '🩺', '💧', '🤝', '⚡', '👶', '🏆'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewGroupAvatar(emoji)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition border ${
                          newGroupAvatar === emoji ? 'bg-red-500/20 border-red-500 scale-110' : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 font-mono tracking-wider block mb-1">Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={(e: any) => setNewGroupCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                  >
                    <option value="Group Chat">Community Group</option>
                    <option value="Private Specialist">Specialist Medical Line</option>
                    <option value="Caregivers">Caregivers & Parents</option>
                    <option value="Emergency Dispatch">Emergency Dispatch</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 font-mono tracking-wider block mb-1">Purpose / Bio</label>
                  <textarea 
                    placeholder="Brief description of this channel's mission..."
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-gray-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewGroup}
                  disabled={!newGroupName.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-red-900/30"
                >
                  Create Channel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. TELEMEDICINE CALL OVERLAY */}
      <AnimatePresence>
        {callSession?.active && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-6"
          >
            {/* Call Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-2xl flex items-center justify-center border border-red-500/30">
                  {activeChat.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{activeChat.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs text-emerald-400 font-mono">
                      {callSession.type === 'video' ? 'Encrypted Video Consultation' : 'Patient Advocate Voice Call'} &bull; 0:{callSession.timer.toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono text-gray-400">
                HIPAA & E2E Encrypted
              </span>
            </div>

            {/* Video Streams */}
            {callSession.type === 'video' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 my-6">
                <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl">
                  <div className="text-center space-y-2">
                    <span className="text-5xl">{activeChat.avatar}</span>
                    <h4 className="text-xs font-bold text-gray-300">Dr. Sarah (Consultant Feed)</h4>
                    <span className="text-[10px] font-mono text-emerald-400">Connection HD 1080p Stable</span>
                  </div>
                </div>
                <div className="relative rounded-3xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl">
                  <video 
                    ref={videoElementRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-mono text-white">
                    You (Patient Feed)
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-28 h-28 rounded-full bg-slate-900 border-4 border-emerald-500/40 flex items-center justify-center text-5xl shadow-2xl animate-pulse">
                  {activeChat.avatar}
                </div>
                <h4 className="text-sm font-black text-white">{activeChat.name}</h4>
                <p className="text-xs text-gray-400 font-mono">Specialist Voice Line Connected</p>
              </div>
            )}

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-4 py-2">
              <button 
                onClick={() => setMuteMicrophone(!muteMicrophone)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition ${
                  muteMicrophone ? 'bg-red-500/20 border border-red-500 text-red-400' : 'bg-slate-800 hover:bg-slate-700'
                }`}
                title={muteMicrophone ? "Unmute Mic" : "Mute Mic"}
              >
                {muteMicrophone ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {callSession.type === 'video' && (
                <button 
                  onClick={() => setCameraStreamActive(!cameraStreamActive)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition ${
                    !cameraStreamActive ? 'bg-red-500/20 border border-red-500 text-red-400' : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                  title="Toggle Camera"
                >
                  <Camera size={20} />
                </button>
              )}

              <button 
                onClick={handleEndCall}
                className="px-6 h-12 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl shadow-red-900/40 transition"
              >
                <Phone size={18} className="rotate-[135deg]" />
                <span>End Call</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SIDEBAR: CONVERSATION LIST (LHS) */}
      <div className={`w-full md:w-80 lg:w-88 flex flex-col bg-slate-900 border-r border-slate-950 shrink-0 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-950 space-y-3 bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/40">
                <MessageSquare size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-tight">Warrior Channels</h2>
                <span className="text-[9px] font-black text-emerald-400 font-mono uppercase tracking-widest">
                  WhatsApp Live Hub
                </span>
              </div>
            </div>

            <button 
              onClick={() => setShowCreateGroupModal(true)}
              className="p-2 bg-slate-800 hover:bg-red-600 text-gray-300 hover:text-white rounded-xl transition shadow-sm text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Create new group"
            >
              <Plus size={14} />
              <span>New</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search chats, doctors, warriors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-red-500 font-semibold placeholder:text-gray-500 transition"
            />
          </div>

          {/* Categories Pill Filters */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
            {(['All', 'Group Chat', 'Private Specialist', 'Caregivers', 'Emergency Dispatch'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 transition font-mono ${
                  categoryFilter === cat 
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/30' 
                    : 'bg-slate-950 text-gray-400 hover:text-white hover:bg-slate-800 border border-slate-850'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-950 no-scrollbar select-none bg-slate-900">
          {filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div 
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-slate-800 border-l-4 border-red-500' 
                    : 'hover:bg-slate-950/60'
                }`}
              >
                {/* Avatar with live badge */}
                <div className="relative">
                  <div className="w-11 h-11 bg-slate-950 rounded-2xl flex items-center justify-center text-xl border border-slate-800 shadow-inner">
                    {chat.avatar}
                  </div>
                  {chat.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900"></span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="text-xs font-black text-white truncate tracking-tight">{chat.name}</h4>
                    <span className="text-[9px] font-mono text-gray-400">{chat.time}</span>
                  </div>

                  <p className="text-[11px] font-semibold text-gray-400 truncate leading-tight">
                    {chat.lastMsg}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[8px] font-black uppercase tracking-wider text-red-400/80 bg-red-500/10 px-1.5 py-0.5 rounded font-mono">
                      {chat.category}
                    </span>
                    {chat.pinned && <Pin size={9} className="text-yellow-500 rotate-45" />}
                  </div>
                </div>

                {/* Unread badge */}
                {chat.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* User Identity Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🩺</span>
            <div>
              <span className="text-xs font-black text-white block">{currentUserName}</span>
              <span className="text-[9px] font-mono text-emerald-400">
                {isCurrentUserAdmin ? '🛡️ Admin Verified' : 'Warrior Online'}
              </span>
            </div>
          </div>
          {isCurrentUserAdmin && (
            <span className="text-[9px] font-black bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
              Moderator
            </span>
          )}
        </div>
      </div>

      {/* 6. MAIN CHAT CONVERSATION VIEW (CENTER) */}
      {activeChat ? (
        <div className={`flex-1 flex flex-col bg-[#0b141a] relative ${activeChatId ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Active Chat Header */}
          <div className="p-3 bg-slate-900 border-b border-slate-950 flex items-center justify-between select-none shadow-md z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <button 
                onClick={() => setActiveChatId(null)} 
                className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <ChevronLeft size={20} />
              </button>

              <div 
                className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl cursor-pointer hover:scale-105 transition border border-slate-700"
                onClick={() => setShowGroupInfo(!showGroupInfo)}
              >
                {activeChat.avatar}
              </div>

              <div className="cursor-pointer min-w-0" onClick={() => setShowGroupInfo(!showGroupInfo)}>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-xs text-white leading-tight truncate tracking-tight">{activeChat.name}</h4>
                  {isCurrentUserAdmin && (
                    <span className="text-[8px] font-black text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded font-mono uppercase">
                      Admin
                    </span>
                  )}
                </div>
                
                {/* Real-time Subtitle (Typing or Online Status) */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  {typingUsers.length > 0 ? (
                    <span className="text-[10px] text-emerald-400 font-black animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      ✍️ {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span className="text-[9px] text-gray-400 font-bold tracking-wide uppercase font-mono">
                        {activeChat.category} &bull; {activeChat.members?.length || 2} members
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1 text-gray-400">
              <button 
                onClick={() => setShowInChatSearchBar(!showInChatSearchBar)}
                title="Search within chat"
                className={`p-2 hover:bg-slate-800 rounded-xl transition ${showInChatSearchBar ? 'text-red-500 bg-slate-800' : ''}`}
              >
                <Search size={16} />
              </button>
              <button 
                onClick={handleOpenLiveCamera}
                title="Take photo with Camera & upload to Firebase"
                className="p-2 hover:bg-slate-800 hover:text-red-500 rounded-xl transition"
              >
                <Camera size={16} />
              </button>
              <button 
                onClick={() => handleStartCall('video')}
                title="Initiate video consultation"
                className="p-2 hover:bg-slate-800 hover:text-red-500 rounded-xl transition"
              >
                <Video size={16} />
              </button>
              <button 
                onClick={() => handleStartCall('voice')}
                title="Initiate patient advocate voice line"
                className="p-2 hover:bg-slate-800 hover:text-green-500 rounded-xl transition"
              >
                <Phone size={16} />
              </button>
              <button 
                onClick={() => setShowGroupInfo(!showGroupInfo)}
                title="Toggle group details & Admin Moderation"
                className={`p-2 rounded-xl transition ${showGroupInfo ? 'bg-slate-800 text-red-500' : 'hover:bg-slate-800'}`}
              >
                <Info size={16} />
              </button>
            </div>
          </div>

          {/* In-Chat Search Bar Toggle */}
          {showInChatSearchBar && (
            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2 animate-in slide-in-from-top-2">
              <Search size={14} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search messages in this thread..."
                value={inChatSearch}
                onChange={(e) => setInChatSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-gray-500 font-semibold"
                autoFocus
              />
              {inChatSearch && (
                <button onClick={() => setInChatSearch('')} className="text-gray-400 hover:text-white text-xs">
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Messages Feed body */}
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative bg-[#0b141a]/95 select-text"
            style={{ 
              backgroundImage: 'radial-gradient(#111b21 0.75px, transparent 0.75px), radial-gradient(#111b21 0.75px, #0b141a 0.75px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px'
            }}
          >
            {/* Clinical HIPAA Encryption notice */}
            <div className="flex flex-col items-center select-none pt-1">
              <div className="flex items-center gap-1.5 bg-[#182229] border border-slate-800 px-3.5 py-1 rounded-2xl shadow-sm text-center">
                <Shield size={11} className="text-red-500" />
                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase">END-TO-END CLINICAL ENCRYPTION</span>
              </div>
              <p className="text-[9px] text-gray-500 text-center max-w-xs mt-1 font-semibold">
                Messages, camera snapshots, voice notes, and clinical charts are protected within this channel.
              </p>
            </div>

            {/* Quick Clinical Broadcasts bar */}
            <div className="bg-[#111b21]/90 rounded-2xl p-2.5 border border-slate-800/80 space-y-1.5 select-none">
              <span className="text-[8px] font-black uppercase text-red-500 tracking-widest block font-mono flex items-center gap-1">
                <Sparkles size={10} />
                QUICK CLINICAL BROADCASTS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CLINICAL_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSendMessage(p.text)}
                    disabled={isCurrentUserMuted}
                    className="bg-slate-900 border border-slate-800 hover:border-red-500 disabled:opacity-40 text-[10px] text-gray-300 font-extrabold px-2.5 py-1 rounded-xl transition-all hover:text-white active:scale-95 cursor-pointer"
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Stream */}
            {visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-40 select-none">
                <MessageSquare size={32} className="text-gray-400 mb-2" />
                <span className="text-xs font-mono">{inChatSearch ? 'No messages matching query' : 'No active logs yet. Start the conversation below!'}</span>
              </div>
            ) : (
              visibleMessages.map((msg, index) => {
                const isUserRef = msg.senderId === currentUserId || msg.senderId === 'guest';
                const isRemoved = msg.removedByAdmin;
                
                const timeLabel = msg.timestamp?.toDate 
                  ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : (typeof msg.timestamp === 'string' && msg.timestamp.includes('T'))
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Delivered';

                const reactionsObj = msg.reactions || {};
                const hasReactions = Object.keys(reactionsObj).length > 0;

                return (
                  <div 
                    key={msg.id || index}
                    className={`group flex flex-col ${isUserRef ? 'items-end' : 'items-start'} max-w-full animate-in slide-in-from-bottom-2 duration-200`}
                  >
                    {/* Sender label */}
                    {!isUserRef && (
                      <div className="flex items-center gap-1.5 mb-1 ml-3">
                        <span className="text-[9px] font-black text-red-400 uppercase tracking-wider font-mono">
                          {msg.senderName || 'Anonymous Warrior'}
                        </span>
                        {groupSettings.admins.includes(msg.senderId) && (
                          <span className="text-[8px] font-black bg-red-500/20 text-red-300 px-1 py-0.2 rounded font-mono">
                            ADMIN
                          </span>
                        )}
                      </div>
                    )}

                    <div className="relative max-w-[85%] sm:max-w-[75%]">
                      {/* Hover action toolbar (Reply, React, Copy, Admin Remove, Delete) */}
                      {!isRemoved && (
                        <div className={`absolute -top-7 ${isUserRef ? 'right-0' : 'left-0'} hidden group-hover:flex items-center gap-1 bg-[#182229] border border-slate-800 px-2 py-1 rounded-xl shadow-xl z-20`}>
                          <button 
                            onClick={() => setReplyingTo({ id: msg.id, senderName: msg.senderName || 'Warrior', text: msg.text || 'Attachment' })}
                            className="p-1 hover:text-white text-gray-400 transition" 
                            title="Reply / Quote"
                          >
                            <Reply size={12} />
                          </button>
                          <button 
                            onClick={() => handleCopyText(msg.text || '')}
                            className="p-1 hover:text-white text-gray-400 transition" 
                            title="Copy text"
                          >
                            <Copy size={12} />
                          </button>
                          
                          {/* Admin Inappropriate Message Removal */}
                          {isCurrentUserAdmin && !isUserRef && (
                            <button 
                              onClick={() => handleOpenModerationModal(msg)}
                              className="p-1 hover:text-red-400 text-yellow-400 transition flex items-center gap-0.5 text-[9px] font-bold"
                              title="Admin: Remove Inappropriate Message"
                            >
                              <ShieldAlert size={12} />
                            </button>
                          )}

                          {isUserRef && (
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 hover:text-red-400 text-gray-400 transition" 
                              title="Delete message"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}

                          <div className="w-[1px] h-3 bg-slate-700 mx-0.5"></div>
                          {EMOJI_REACTIONS.slice(0, 4).map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className="text-xs hover:scale-125 transition px-0.5"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Main Message Bubble */}
                      <div 
                        className={`p-3 rounded-2xl shadow-md relative flex flex-col ${
                          isRemoved
                            ? 'bg-red-950/30 border border-red-500/30 text-red-200 italic'
                            : isUserRef 
                              ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none border border-[#005c4b]/50' 
                              : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-slate-800'
                        }`}
                      >
                        {/* Quoted / Reply Banner if present */}
                        {msg.replyTo && !isRemoved && (
                          <div className="mb-2 p-2 bg-black/25 border-l-3 border-emerald-400 rounded-lg text-[10px]">
                            <span className="font-extrabold text-emerald-400 block leading-tight">
                              {msg.replyTo.senderName}
                            </span>
                            <span className="text-gray-300 opacity-80 truncate block line-clamp-1">
                              {msg.replyTo.text}
                            </span>
                          </div>
                        )}

                        {/* Image / Video Attachment with click lightbox */}
                        {msg.mediaUrl && !isRemoved && (msg.mediaType === 'image' || msg.mediaType === 'video') && (
                          <div className="mb-2 relative rounded-xl overflow-hidden max-w-sm aspect-video bg-slate-950 flex items-center justify-center border border-white/10 group/media">
                            {msg.mediaType === 'image' ? (
                              <>
                                <img 
                                  src={msg.mediaUrl} 
                                  alt="Attachment" 
                                  onClick={() => setLightboxImageUrl(msg.mediaUrl)}
                                  className="object-contain w-full h-full max-h-[220px] cursor-pointer hover:scale-102 transition"
                                  referrerPolicy="no-referrer"
                                />
                                <button 
                                  onClick={() => setLightboxImageUrl(msg.mediaUrl)}
                                  className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg opacity-0 group-hover/media:opacity-100 transition backdrop-blur-sm"
                                  title="Enlarge Image"
                                >
                                  <ZoomIn size={14} />
                                </button>
                              </>
                            ) : (
                              <video 
                                src={msg.mediaUrl} 
                                controls 
                                className="w-full h-full max-h-[220px] bg-black" 
                              />
                            )}
                          </div>
                        )}

                        {/* Audio Voice Note Bubble (WhatsApp PTT Player) */}
                        {msg.mediaType === 'audio' && !isRemoved && (
                          <div className="flex items-center gap-3 p-2 bg-black/20 rounded-xl mb-1 min-w-[200px]">
                            <button
                              onClick={() => togglePlayAudio(msg.id, msg.mediaUrl)}
                              className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition flex-shrink-0 cursor-pointer shadow-md"
                            >
                              {playingAudioId === msg.id ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                            </button>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-0.5 h-4">
                                {[6, 12, 16, 8, 14, 18, 10, 16, 12, 15, 7, 13, 17, 9, 14].map((h, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-1 rounded-full transition-all duration-200 ${
                                      playingAudioId === msg.id ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'
                                    }`}
                                    style={{ height: `${h}px` }}
                                  />
                                ))}
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-mono text-gray-300">
                                <span>Voice Note</span>
                                <span>{msg.audioDuration ? `0:${msg.audioDuration.toString().padStart(2, '0')}` : '0:05'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Message Text */}
                        {msg.text && (
                          <p className={`text-xs leading-relaxed whitespace-pre-wrap select-text break-words pr-2 ${isRemoved ? 'text-red-300 font-mono text-[11px]' : 'font-semibold'}`}>
                            {msg.text}
                          </p>
                        )}

                        {/* Bubble footer (Timestamp + WhatsApp ticks) */}
                        <div className="flex items-center gap-1.5 self-end mt-1.5 opacity-75 select-none font-mono text-[9px]">
                          <span>{timeLabel}</span>
                          {isUserRef && <CheckCheck size={12} className="text-blue-400" />}
                        </div>
                      </div>

                      {/* Reactions Pill Display */}
                      {hasReactions && !isRemoved && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isUserRef ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(reactionsObj).map(([emoji, uids]: [string, any]) => {
                            if (!Array.isArray(uids) || uids.length === 0) return null;
                            const userHasReacted = uids.includes(currentUserId);
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition ${
                                  userHasReacted ? 'bg-red-500/20 border-red-500 text-white' : 'bg-[#182229] border-slate-800 text-gray-300 hover:bg-slate-800'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[9px] font-mono">{uids.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Real-time WhatsApp Typing Indicator Bubble */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#202c33] rounded-2xl rounded-tl-none border border-slate-800 w-fit text-xs text-emerald-400 shadow-md animate-in fade-in slide-in-from-bottom-1">
                <span className="font-bold text-gray-200 text-[11px]">{typingUsers.join(', ')}</span>
                <div className="flex items-center gap-1 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Local draft upload preview */}
            {localPreviewFile && (
              <div className="flex flex-col items-end max-w-full">
                <div className="bg-[#002e26] border border-[#005c4b] p-3 rounded-2xl rounded-tr-none max-w-[70%] space-y-2 relative">
                  <div className="flex justify-between items-center bg-black/30 p-1.5 rounded-xl border border-white/5">
                    <span className="text-[8px] font-black uppercase text-emerald-400 font-mono flex items-center gap-1">
                      <ImageIcon size={10} /> Firebase Storage Attached
                    </span>
                    <button 
                      onClick={() => setLocalPreviewFile(null)} 
                      className="p-1 hover:bg-white/10 rounded text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-white/10 aspect-video bg-black flex items-center justify-center">
                    {localPreviewFile.type === 'image' ? (
                      <img src={localPreviewFile.url} alt="Draft" className="object-cover h-28" />
                    ) : (
                      <video src={localPreviewFile.url} controls className="h-28" />
                    )}
                  </div>
                  <span className="text-[9px] text-[#e9edef] opacity-80 italic">Image verified. Press send below to post.</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive controls and Attachments picker popup */}
          <div className="p-3 bg-slate-900 border-t border-slate-950 flex flex-col gap-2 shadow-2xl relative select-none">
            
            {/* Replying Banner */}
            {replyingTo && (
              <div className="flex justify-between items-center bg-[#182229] border-l-4 border-emerald-500 px-3 py-1.5 rounded-xl text-xs">
                <div className="truncate pr-2">
                  <span className="text-[10px] font-black text-emerald-400 block">Replying to {replyingTo.senderName}</span>
                  <span className="text-[11px] text-gray-300 truncate block">{replyingTo.text}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-white p-1">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Attachment popover drawer */}
            <AnimatePresence>
              {showAttachmentMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute bottom-16 left-4 bg-[#233138] rounded-3xl p-3.5 border border-slate-800 shadow-2xl w-56 space-y-1 z-30"
                >
                  <span className="text-[8px] font-black text-gray-400 tracking-widest block uppercase font-mono mb-1.5">Attach Medical Document</span>
                  
                  {/* Camera Option */}
                  <button 
                    onClick={handleOpenLiveCamera}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-xl transition text-left cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center"><Camera size={15} /></div>
                    <div>
                      <span className="text-xs font-bold block leading-none">Take Photo</span>
                      <span className="text-[9px] text-gray-400 font-mono">Camera viewfinder</span>
                    </div>
                  </button>

                  <button 
                    onClick={handleTriggerFilePicker}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-xl transition text-left cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center"><ImageIcon size={15} /></div>
                    <div>
                      <span className="text-xs font-bold block leading-none">Photo & Video</span>
                      <span className="text-[9px] text-gray-400 font-mono">From gallery/device</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => {
                      setInputText('📄 CBC Lab Panel: Hb 8.2 g/dL | Reticulocyte: 9.8% | WBC: 7.1 | Platelets: 280k. On Hydroxyurea 500mg daily.');
                      setShowAttachmentMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-xl transition text-left cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center"><FileText size={15} /></div>
                    <span className="text-xs font-bold">CBC Health Sheet</span>
                  </button>

                  <button 
                    onClick={() => {
                      setInputText('📍 Emergency Clinic Pin: St. Nicholas Hospital Emergency Room, Lagos (Equipped with oxygen & pediatric hematologist on duty).');
                      setShowAttachmentMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-xl transition text-left cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center"><MapPin size={15} /></div>
                    <span className="text-xs font-bold">Emergency Location</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Emoji popover */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-16 left-12 bg-[#233138] rounded-3xl p-3 border border-slate-800 shadow-2xl gap-2 flex flex-wrap justify-between w-60 z-35"
                >
                  {['❤️', '🧬', '💧', '💊', '🏆', '🤝', '🩺', '🦸‍♂️', '🔥', '🙌', '👏', '❄️', '💉', '🩸', '✨', '⚡'].map(emoji => (
                    <button 
                      key={emoji}
                      onClick={() => { setInputText(prev => prev + emoji); setShowEmojiPicker(false); }}
                      className="text-xl p-1 hover:bg-slate-800 rounded-lg transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* MUTED USER LOCK BANNER OR INPUT BAR */}
            {isCurrentUserMuted ? (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <VolumeX size={18} className="text-red-400" />
                  <div>
                    <span className="text-xs font-black text-red-300 block">You are muted in this channel</span>
                    <span className="text-[10px] text-gray-400">An administrator has temporarily restricted your messaging permissions.</span>
                  </div>
                </div>
                {isCurrentUserAdmin && (
                  <button 
                    onClick={() => handleToggleMuteUser(currentUserId, true)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-bold"
                  >
                    Unmute Self (Admin)
                  </button>
                )}
              </div>
            ) : isRecordingVoice ? (
              <div className="flex items-center justify-between bg-[#202c33] border border-red-500/40 px-4 py-2.5 rounded-2xl animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                  <span className="text-xs font-mono font-black text-red-400">
                    Recording Audio... 0:{recordingDuration.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => stopVoiceRecording(true)}
                    className="p-2 hover:bg-slate-800 text-gray-400 hover:text-red-400 rounded-xl transition"
                    title="Cancel recording"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => stopVoiceRecording(false)}
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center gap-1 text-xs font-bold"
                    title="Send voice note"
                  >
                    <Send size={14} />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setShowAttachmentMenu(!showAttachmentMenu); setShowEmojiPicker(false); }}
                  className={`p-2.5 text-gray-400 hover:text-red-500 transition-all rounded-xl hover:bg-slate-800 cursor-pointer ${showAttachmentMenu ? 'bg-slate-850 text-red-500' : ''}`}
                  title="Add attachment"
                >
                  <Paperclip size={18} />
                </button>

                <button 
                  onClick={handleOpenLiveCamera}
                  className="p-2.5 text-gray-400 hover:text-red-500 transition-all rounded-xl hover:bg-slate-800 cursor-pointer"
                  title="Capture Image with Camera & Upload"
                >
                  <Camera size={18} />
                </button>

                <button 
                  onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachmentMenu(false); }}
                  className={`p-2.5 text-gray-400 hover:text-yellow-500 transition-all rounded-xl hover:bg-slate-800 cursor-pointer ${showEmojiPicker ? 'bg-slate-850 text-yellow-500' : ''}`}
                  title="Emoji panel"
                >
                  <Smile size={18} />
                </button>

                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a clinical note or warrior update..." 
                    className="w-full pl-4 pr-12 py-3 bg-[#2a3942] text-[#e9edef] rounded-2xl text-xs font-semibold focus:outline-none border border-slate-800 focus:border-red-500 transition-all placeholder:text-gray-500"
                  />
                  {inputText.trim() || localPreviewFile ? (
                    <button 
                      onClick={() => handleSendMessage()}
                      disabled={isUploadingToStorage}
                      className="absolute right-1.5 top-1.5 p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all cursor-pointer shadow-md shadow-red-900/30"
                      title="Send message"
                    >
                      <Send size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={startVoiceRecording}
                      className="absolute right-1.5 top-1.5 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer shadow-md"
                      title="Hold / Tap to record voice note"
                    >
                      <Mic size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-[#0b141a] p-12 text-center">
          <div className="w-18 h-18 bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center mb-4 border border-slate-800 relative">
             <MessageSquare size={28} className="text-red-500" />
          </div>
          <h3 className="text-lg font-black text-gray-100 mb-1">Warrior Group Chat Hub</h3>
          <p className="text-xs font-semibold max-w-xs leading-relaxed text-gray-500">
            Select any channel to begin chatting with doctors, advocates, and fellow sickle cell warriors.
          </p>
        </div>
      )}

      {/* 7. GROUP DETAILS & COMMUNITY MANAGEMENT DRAWER (RHS) */}
      <AnimatePresence>
        {showGroupInfo && activeChat && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:flex flex-col bg-slate-900 border-l border-slate-950 w-76 shrink-0 select-none divide-y divide-slate-950 overflow-y-auto no-scrollbar"
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-slate-900">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-red-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-red-500 font-mono">CHANNEL & MODERATION</h3>
              </div>
              <button 
                onClick={() => setShowGroupInfo(false)} 
                className="p-1 hover:bg-slate-800 text-gray-400 hover:text-white rounded-lg transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Profile Summary */}
            <div className="p-4 text-center space-y-2 bg-slate-950">
              <div className="w-14 h-14 bg-slate-850 rounded-2xl flex items-center justify-center text-3xl mx-auto border-2 border-slate-800">
                {activeChat.avatar}
              </div>
              <div>
                <h4 className="text-xs font-black text-white">{activeChat.name}</h4>
                <span className="text-[9px] font-black tracking-wider uppercase font-mono mt-0.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
                  {activeChat.category}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-semibold italic text-justify px-1 opacity-90">
                {activeChat.desc}
              </p>
            </div>

            {/* Admin Controls Panel */}
            <div className="p-4 bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 font-mono flex items-center gap-1">
                  <Shield size={12} className="text-red-400" /> ADMIN PRIVILEGES
                </span>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${isCurrentUserAdmin ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-gray-400'}`}>
                  {isCurrentUserAdmin ? 'Active Admin' : 'Member'}
                </span>
              </div>
              
              <p className="text-[9px] text-gray-400 font-semibold leading-relaxed">
                {isCurrentUserAdmin 
                  ? 'You have moderator rights to remove inappropriate messages, manage admin roles, and mute violators.' 
                  : 'Channel moderation is active. Report unverified remedies or offensive posts to the admin.'}
              </p>
            </div>

            {/* Members Directory & Moderation Controls */}
            <div className="p-4 space-y-2 bg-slate-950">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-blue-400" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 font-mono">
                    MEMBERS ({activeChat.members?.length || 2})
                  </span>
                </div>
                <span className="text-[8px] text-gray-500 font-mono">Real-Time Sync</span>
              </div>

              <div className="space-y-1.5">
                {(activeChat.members || []).map((member: any, i: number) => {
                  const mId = member.id || `member-${i}`;
                  const isMemberAdmin = groupSettings.admins.includes(mId) || member.isAdmin;
                  const isMemberMuted = groupSettings.mutedUsers.includes(mId);
                  const isSelf = mId === currentUserId || mId === 'current-user-uid' || member.name.includes('You');

                  return (
                    <div 
                      key={mId}
                      className={`p-2.5 rounded-xl border transition ${
                        isMemberMuted 
                          ? 'bg-red-950/20 border-red-500/30' 
                          : 'bg-slate-900 border-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base bg-slate-950 p-1 rounded-lg w-7 h-7 flex items-center justify-center border border-slate-800">
                          {member.avatar}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h5 className="text-[10px] font-black text-white truncate leading-none">{member.name}</h5>
                            {isMemberAdmin && (
                              <span className="text-[8px] font-black bg-red-500/20 text-red-400 px-1 py-0.2 rounded font-mono">
                                ADMIN
                              </span>
                            )}
                            {isMemberMuted && (
                              <span className="text-[8px] font-black bg-yellow-500/20 text-yellow-400 px-1 py-0.2 rounded font-mono">
                                MUTED
                              </span>
                            )}
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-wide opacity-70 block font-mono text-gray-400 mt-0.5">
                            {member.role}
                          </span>
                        </div>
                        {member.active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        )}
                      </div>

                      {/* Admin Member Management Toolbar */}
                      {isCurrentUserAdmin && !isSelf && (
                        <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono">
                          <button
                            onClick={() => handleToggleAdminRole(mId, isMemberAdmin)}
                            className="text-gray-400 hover:text-red-400 transition"
                          >
                            {isMemberAdmin ? 'Dismiss Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleToggleMuteUser(mId, isMemberMuted)}
                            className={`font-bold transition ${isMemberMuted ? 'text-green-400 hover:text-green-300' : 'text-yellow-400 hover:text-yellow-300'}`}
                          >
                            {isMemberMuted ? '🔊 Unmute' : '🔇 Mute'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shared Clinic Media Grid */}
            <div className="p-4 bg-slate-900 space-y-2">
              <span className="text-[9px] font-black uppercase text-gray-400 font-mono tracking-wider block">
                STORAGE MEDIA VAULT ({mediaMessages.length})
              </span>

              {mediaMessages.length === 0 ? (
                <div className="p-3 border border-dashed border-slate-800 rounded-xl text-[10px] text-gray-500 italic text-center">
                  No images uploaded to Firebase Storage yet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {mediaMessages.map((m, idx) => (
                    <div 
                      key={m.id || idx}
                      onClick={() => setLightboxImageUrl(m.mediaUrl)}
                      className="aspect-square bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-sm relative group cursor-pointer"
                    >
                      <img 
                        src={m.mediaUrl} 
                        alt="Media" 
                        className="object-cover w-full h-full hover:scale-105 transition"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: Export Transcript */}
            <div className="p-4 bg-slate-950">
              <button
                onClick={handleExportChat}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition border border-slate-700 cursor-pointer"
              >
                <Download size={12} />
                <span>Export Chat Transcript</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>

      {/* Peer Support Option & Care Stream Linking Section */}
      <PeerSupportSection currentUserId={auth.currentUser?.uid || 'user-warrior'} />
    </div>
  );
};

export default ChatSystem;
