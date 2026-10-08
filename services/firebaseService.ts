import { isRecord, mergeMedicalRecords, type MedicalRecordData } from './medicalRecords';

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  addDoc,
  increment,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { ref as storageRef, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase-init';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  const errMsg = error instanceof Error ? error.message : String(error);
  // Only throw unhandled exceptions if the request is forbidden due to security rules (TDD compliance)
  if (errMsg.includes('permission-denied') || errMsg.includes('insufficient permissions')) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export type HealthHistoryReadState = 'recorded' | 'cached' | 'missing' | 'unavailable';

export type UserProfileReadState = 'recorded' | 'cached' | 'missing' | 'unavailable';

export interface UserProfileReadResult {
  state: UserProfileReadState;
  data: DocumentData | null;
}

export interface HealthHistoryRecord<T> {
  dateStr: string;
  state: HealthHistoryReadState;
  data: T | null;
}

export interface HealthHistoryCollection<T> {
  state: HealthHistoryReadState;
  data: T[];
}

export type PersistenceWriteState = 'recorded' | 'device-only';

export interface PersistenceWriteResult<T> {
  state: PersistenceWriteState;
  data: T;
}

export interface HydrationReadResult {
  state: HealthHistoryReadState;
  data: HydrationHistoryData | null;
}

export interface HydrationHistoryData {
  amount: number;
  goal: number;
}

export interface DailyCheckInHistoryData {
  emoji?: string;
  emotion?: string;
  note?: string;
  dateStr?: string;
  timestamp?: string;
  updatedAt?: string;
  score?: number;
}

export interface SymptomHistoryData {
  id?: string;
  userId?: string;
  painLevel: number;
  symptoms?: string[];
  triggers?: string[];
  waterIntake?: number;
  dateStr: string;
  timestamp?: unknown;
  updatedAt?: unknown;
}

export interface PainHistoryData {
  id?: string;
  userId?: string;
  painLevel: number;
  triggers?: string[];
  dateStr: string;
  timestamp?: unknown;
  updatedAt?: unknown;
}

export interface MedicationScheduleData {
  id?: string;
  name?: unknown;
  dosage?: unknown;
  time?: unknown;
  frequency?: unknown;
  lastTakenDate?: unknown;
  active?: unknown;
  isActive?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  [key: string]: unknown;
}

export interface HydrationContextData {
  amount?: unknown;
  goal?: unknown;
  timestamp?: unknown;
  updatedAt?: unknown;
}

export type AppointmentReadState = 'recorded' | 'cached' | 'empty' | 'unavailable';

export interface AppointmentRecord {
  id: string;
  bookedDate?: string;
  bookedTime?: string;
  patientNote?: string;
  status?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  formattedCreatedAt?: string;
  createdAt?: unknown;
  [key: string]: unknown;
}

export interface AppointmentCollectionResult {
  state: AppointmentReadState;
  data: AppointmentRecord[];
}

const LEGACY_APPOINTMENT_CACHE_KEY = 'warrior_appointments';

function getAppointmentCacheKey(userId: string) {
  return userId ? `${LEGACY_APPOINTMENT_CACHE_KEY}_${userId}` : LEGACY_APPOINTMENT_CACHE_KEY;
}

// Patient health caches are scoped by authenticated UID so two accounts on one
// device can never read or overwrite each other's cached clinical values.
// Guest (signed-out) sessions keep the legacy unscoped keys for compatibility.
// Legacy unscoped data is never attached to an authenticated account and never
// deleted: its ownership cannot be proven, so it stays quarantined.
function getHealthCacheKey(baseKey: string, userId: string) {
  return userId ? `${baseKey}_${userId}` : baseKey;
}

function getWaterCacheKey(userId: string, dateStr: string) {
  return userId ? `water_${userId}_${dateStr}` : `water_${dateStr}`;
}

// Same-date upserts may only match an entry owned by the acting account.
// A bare date match once let account B update account A's cached clinical
// values while retaining account A's identity.
function getCacheEntryOwner(userId: string) {
  return userId || 'guest';
}

function isOwnedCacheEntry(entry: any, owner: string) {
  return (entry?.userId || 'guest') === owner;
}

function readAppointmentCache(cacheKey: string): AppointmentRecord[] | null {
  const cached = localStorage.getItem(cacheKey);
  if (cached === null) return null;

  try {
    const parsed: unknown = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed as AppointmentRecord[] : null;
  } catch {
    return null;
  }
}

async function loadAppointments(userId: string): Promise<AppointmentCollectionResult> {
  const cacheKey = getAppointmentCacheKey(userId);

  if (!userId) {
    const cached = readAppointmentCache(cacheKey) ?? [];
    return { state: cached.length > 0 ? 'recorded' : 'empty', data: cached };
  }

  const path = `users/${userId}/appointments`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map((appointmentDocument) => {
      const data = appointmentDocument.data();
      let bookedAtStr = '';
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          bookedAtStr = data.createdAt.toDate().toLocaleDateString();
        } else if (data.createdAt.seconds) {
          bookedAtStr = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
        } else {
          bookedAtStr = String(data.createdAt);
        }
      }
      return {
        id: appointmentDocument.id,
        ...data,
        formattedCreatedAt: bookedAtStr,
      } as AppointmentRecord;
    });
    localStorage.setItem(cacheKey, JSON.stringify(appointments));
    return {
      state: appointments.length > 0 ? 'recorded' : 'empty',
      data: appointments,
    };
  } catch (error) {
    console.warn('Firestore appointments list failed, using UID-scoped cache:', error);
    const cached = readAppointmentCache(cacheKey);
    return cached === null
      ? { state: 'unavailable', data: [] }
      : { state: 'cached', data: cached };
  }
}

export const firebaseService = {
  // --- User Profiles ---
  async getUserProfileState(userId: string): Promise<UserProfileReadResult> {
    if (!userId) return { state: 'unavailable', data: null };

    const path = `users/${userId}`;
    const cacheKey = `user_profile_${userId}`;
    const profileRef = doc(db, path);
    try {
      const profileSnapshot = await getDocFromServer(profileRef);
      if (!profileSnapshot.exists()) {
        return { state: 'missing', data: null };
      }

      const data = profileSnapshot.data();
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return { state: 'recorded', data };
    } catch (error) {
      console.warn('Firestore profile verification failed, checking the UID-scoped cache:', error);
      try {
        const cachedSnapshot = await getDoc(profileRef);
        if (cachedSnapshot.exists()) {
          const data = cachedSnapshot.data();
          localStorage.setItem(cacheKey, JSON.stringify(data));
          return { state: 'cached', data };
        }
      } catch {
        // Continue to the existing UID-scoped local fallback below.
      }

      const cached = localStorage.getItem(cacheKey);
      if (!cached) return { state: 'unavailable', data: null };

      try {
        return { state: 'cached', data: JSON.parse(cached) as DocumentData };
      } catch {
        localStorage.removeItem(cacheKey);
        return { state: 'unavailable', data: null };
      }
    }
  },

  async getUserProfile(userId: string) {
    if (!userId) return null;
    const path = `users/${userId}`;
    try {
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        localStorage.setItem(`user_profile_${userId}`, JSON.stringify(data));
        return data;
      }
      return null;
    } catch (error) {
      console.warn("Firestore getUserProfile failed, using cache fallback:", error);
      const cached = localStorage.getItem(`user_profile_${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createUserProfile(userId: string, data: any) {
    const path = `users/${userId}`;
    const initialProfile = {
      ...data,
      xp: 0,
      rank: 'Novice Warrior',
      badges: [],
      createdAt: new Date().toISOString(),
      stats: { postsCount: 0, completedGames: 0 }
    };
    localStorage.setItem(`user_profile_${userId}`, JSON.stringify(initialProfile));
    try {
      await setDoc(doc(db, path), {
        ...data,
        xp: 0,
        rank: 'Novice Warrior',
        badges: [],
        createdAt: serverTimestamp(),
        stats: { postsCount: 0, completedGames: 0 }
      });
    } catch (error) {
      console.warn("Firestore createUserProfile failed, using cache fallback:", error);
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateUserProfile(userId: string, data: any) {
    const path = `users/${userId}`;
    localStorage.setItem(`user_profile_${userId}`, JSON.stringify(data));
    try {
      // Clean up fields that should not be directly overwritten as string/object timestamp types on Firestore
      const { createdAt, ...payload } = data;
      await updateDoc(doc(db, path), payload);
    } catch (error) {
      console.warn("Firestore updateUserProfile failed, using cache fallback:", error);
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // --- Real-time Chat ---
  subscribeToMessages(chatId: string, callback: (messages: any[]) => void) {
    const path = `chats/${chatId}/messages`;
    const q = query(collection(db, path), orderBy('timestamp', 'asc'));
    
    // Check if we need to seed initial friendly conversation if cache and cloud are empty
    const cached = localStorage.getItem(`warrior_chat_${chatId}`);
    if (!cached) {
      const defaultSeeds = this.getDefaultChatSeeds(chatId);
      if (defaultSeeds.length > 0) {
        localStorage.setItem(`warrior_chat_${chatId}`, JSON.stringify(defaultSeeds));
        callback(defaultSeeds);
      }
    }

    try {
      return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        if (!snapshot.empty) {
          const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          localStorage.setItem(`warrior_chat_${chatId}`, JSON.stringify(messages));
          callback(messages);
        } else {
          // If Firestore is empty, use stored or seeded local messages
          const existing = localStorage.getItem(`warrior_chat_${chatId}`);
          if (existing) {
            callback(JSON.parse(existing));
          } else {
            const seeds = this.getDefaultChatSeeds(chatId);
            localStorage.setItem(`warrior_chat_${chatId}`, JSON.stringify(seeds));
            callback(seeds);
          }
        }
      }, (error) => {
        console.warn("onSnapshot messages list failed, using cache fallback:", error);
        const cached = localStorage.getItem(`warrior_chat_${chatId}`);
        if (cached) {
          callback(JSON.parse(cached));
        } else {
          const seeds = this.getDefaultChatSeeds(chatId);
          callback(seeds);
        }
        handleFirestoreError(error, OperationType.LIST, path);
      });
    } catch (error) {
      console.warn("Failed to subscribe to chat onSnapshot (client offline):", error);
      const cached = localStorage.getItem(`warrior_chat_${chatId}`);
      if (cached) {
        callback(JSON.parse(cached));
      } else {
        const seeds = this.getDefaultChatSeeds(chatId);
        callback(seeds);
      }
      return () => {};
    }
  },

  getDefaultChatSeeds(chatId: string) {
    const now = Date.now();
    const timeAgo = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();

    if (chatId === 'lagos-warriors') {
      return [
        {
          id: 'seed-lw-1',
          text: 'Good morning warriors! 🌅 Remember that harmattan / cold drafts are picking up in the evenings. Wear your warm layers and keep a water flask handy.',
          senderId: 'dr-sarah-uid',
          senderName: 'Dr. Sarah (Hematology)',
          timestamp: timeAgo(120),
          reactions: { '❤️': ['dr-sarah-uid', 'tunde-uid'], '💧': ['grace-uid'] }
        },
        {
          id: 'seed-lw-2',
          text: 'Logged my 3.0 Liters already! Drinking warm water with lemon helps so much with joint circulation.',
          senderId: 'tunde-uid',
          senderName: 'Tunde (Warrior)',
          timestamp: timeAgo(95),
          reactions: { '👏': ['dr-sarah-uid', 'faith-uid'], '🔥': ['tunde-uid'] }
        },
        {
          id: 'seed-lw-3',
          text: 'Stay hydrated everyone! Remember to log your water today in your dashboard tracker.',
          senderId: 'faith-uid',
          senderName: 'Faith (Warrior)',
          timestamp: timeAgo(25),
          reactions: { '💧': ['tunde-uid', 'dr-sarah-uid'] }
        }
      ];
    } else if (chatId === 'hematology-dr-sarah') {
      return [
        {
          id: 'seed-ds-1',
          text: 'Hello Warrior! Welcome to your direct consultation channel. Please share any changes in your pain intensity or medication tolerance.',
          senderId: 'dr-sarah-uid',
          senderName: 'Dr. Sarah (Hematology Consultant)',
          timestamp: timeAgo(300),
          reactions: { '🩺': ['dr-sarah-uid'] }
        },
        {
          id: 'seed-ds-2',
          text: 'Your haematology panel results are uploaded and stable. Baseline Hb is sitting nicely at 8.4 g/dL. Keep up your Hydroxyurea and hydration routine!',
          senderId: 'dr-sarah-uid',
          senderName: 'Dr. Sarah (Hematology Consultant)',
          timestamp: timeAgo(60),
          reactions: { '🙌': ['dr-sarah-uid'] }
        }
      ];
    } else if (chatId === 'global-scd-network') {
      return [
        {
          id: 'seed-gn-1',
          text: 'Exciting news from the European Hematology Association: New clinical trial data on gene-editing therapies shows 94% reduction in vaso-occlusive hospitalizations!',
          senderId: 'prof-adebayo-uid',
          senderName: 'Prof. Adebayo (UK)',
          timestamp: timeAgo(500),
          reactions: { '🧬': ['prof-adebayo-uid', 'marie-uid'], '🔥': ['nabil-uid'] }
        },
        {
          id: 'seed-gn-2',
          text: 'Global assembly link is ready. We will discuss affordable Hydroxyurea access across developing regions.',
          senderId: 'marie-uid',
          senderName: 'Marie (Paris, Warrior)',
          timestamp: timeAgo(40),
          reactions: { '🤝': ['prof-adebayo-uid'] }
        }
      ];
    } else if (chatId === 'caregivers-circle') {
      return [
        {
          id: 'seed-cc-1',
          text: 'Welcome fellow parents & caregivers! What thermals or heating pads work best for your warriors during cooler school mornings?',
          senderId: 'grace-mom-uid',
          senderName: 'Grace (Caregiver Mother)',
          timestamp: timeAgo(180),
          reactions: { '❤️': ['grace-mom-uid'] }
        },
        {
          id: 'seed-cc-2',
          text: 'We pack a thermos with warm bone broth and warm electrolyte water. The school nurse also has his crisis protocol card saved!',
          senderId: 'nabil-uid',
          senderName: 'Nabil (Cairo, Parent)',
          timestamp: timeAgo(80),
          reactions: { '👍': ['grace-mom-uid', 'nabil-uid'], '🍲': ['grace-mom-uid'] }
        }
      ];
    } else if (chatId === 'crisis-rapid-response') {
      return [
        {
          id: 'seed-cr-1',
          text: '🚨 TRIAGE DISPATCH CHANNEL: For immediate advice during acute VOC pain onset, finding nearby oxygen-equipped ERs, or blood matching.',
          senderId: 'system-bot',
          senderName: 'Emergency Coordination Bot',
          timestamp: timeAgo(400),
          reactions: { '🛡️': ['system-bot'] }
        }
      ];
    }
    return [];
  },

  async sendMessage(
    chatId: string, 
    text: string, 
    mediaUrl: string | null = null, 
    mediaType: 'image' | 'video' | 'audio' | 'document' | null = null,
    replyTo: { id: string; senderName: string; text: string } | null = null,
    audioDuration?: number
  ) {
    const path = `chats/${chatId}/messages`;
    const user = auth.currentUser;
    const senderName = user ? (user.displayName || user.email?.split('@')[0] || 'Warrior') : 'Warrior';
    
    const msgObj = {
      id: 'msg-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      text,
      senderId: user ? user.uid : 'current-user-uid',
      senderName,
      timestamp: new Date().toISOString(),
      mediaUrl,
      mediaType,
      replyTo: replyTo || null,
      audioDuration: audioDuration || 0,
      reactions: {}
    };

    const cachedChat = localStorage.getItem(`warrior_chat_${chatId}`);
    const messages = cachedChat ? JSON.parse(cachedChat) : [];
    messages.push(msgObj);
    localStorage.setItem(`warrior_chat_${chatId}`, JSON.stringify(messages));

    if (!user) return msgObj;

    try {
      const payload: any = {
        text,
        senderId: user.uid,
        senderName,
        timestamp: serverTimestamp(),
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        replyTo: replyTo || null,
        audioDuration: audioDuration || 0,
        reactions: {}
      };
      const docRef = await addDoc(collection(db, path), payload);
      return { ...msgObj, id: docRef.id };
    } catch (error) {
      console.warn("Firestore sendMessage fallback to cache:", error);
      handleFirestoreError(error, OperationType.CREATE, path);
      return msgObj;
    }
  },

  async toggleMessageReaction(chatId: string, messageId: string, emoji: string, userId: string = 'current-user-uid') {
    // Update local cache first
    const cachedChat = localStorage.getItem(`warrior_chat_${chatId}`);
    if (cachedChat) {
      const messages = JSON.parse(cachedChat);
      const target = messages.find((m: any) => m.id === messageId);
      if (target) {
        target.reactions = target.reactions || {};
        const currentList: string[] = target.reactions[emoji] || [];
        if (currentList.includes(userId)) {
          target.reactions[emoji] = currentList.filter(u => u !== userId);
          if (target.reactions[emoji].length === 0) {
            delete target.reactions[emoji];
          }
        } else {
          target.reactions[emoji] = [...currentList, userId];
        }
        localStorage.setItem(`warrior_chat_${chatId}`, JSON.stringify(messages));
      }
    }

    if (!auth.currentUser) return;
    const path = `chats/${chatId}/messages/${messageId}`;
    try {
      const docRef = doc(db, path);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const reactions = data.reactions || {};
        const currentList: string[] = reactions[emoji] || [];
        if (currentList.includes(userId)) {
          reactions[emoji] = currentList.filter(u => u !== userId);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          reactions[emoji] = [...currentList, userId];
        }
        await updateDoc(docRef, { reactions });
      }
    } catch (error) {
      console.warn("Firestore toggleMessageReaction fallback:", error);
    }
  },

  async deleteChatMessage(chatId: string, messageId: string) {
    const cachedChat = localStorage.getItem(`warrior_chat_${chatId}`);
    if (cachedChat) {
      let messages = JSON.parse(cachedChat);
      messages = messages.filter((m: any) => m.id !== messageId);
      localStorage.setItem(`warrior_chat_${chatId}`, JSON.stringify(messages));
    }

    if (!auth.currentUser) return;
    const path = `chats/${chatId}/messages/${messageId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      console.warn("Firestore deleteChatMessage fallback:", error);
    }
  },

  // --- Admin Moderation: Remove Inappropriate Message ---
  async removeMessageAsAdmin(chatId: string, messageId: string, adminName: string, reason: string = 'Violation of community guidelines') {
    const placeholderText = `🚫 [Message removed by Admin (${adminName}): ${reason}]`;
    
    // Update local cache
    const cachedChat = localStorage.getItem(`warrior_chat_${chatId}`);
    if (cachedChat) {
      let messages = JSON.parse(cachedChat);
      messages = messages.map((m: any) => {
        if (m.id === messageId) {
          return {
            ...m,
            text: placeholderText,
            mediaUrl: null,
            mediaType: null,
            removedByAdmin: true,
            adminReason: reason
          };
        }
        return m;
      });
      localStorage.setItem(`warrior_chat_${chatId}`, JSON.stringify(messages));
    }

    if (!auth.currentUser) return;
    const path = `chats/${chatId}/messages/${messageId}`;
    try {
      await updateDoc(doc(db, path), {
        text: placeholderText,
        mediaUrl: null,
        mediaType: null,
        removedByAdmin: true,
        adminReason: reason,
        adminName
      });
    } catch (error) {
      console.warn("Firestore removeMessageAsAdmin fallback:", error);
    }
  },

  // --- Firebase Storage Image & Camera Upload ---
  async uploadChatMedia(chatId: string, fileOrDataUrl: string | File | Blob, prefix: string = 'camera'): Promise<string> {
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
    const fullPath = `chats/${chatId}/images/${filename}`;

    try {
      const fileRef = storageRef(storage, fullPath);
      if (typeof fileOrDataUrl === 'string') {
        // Upload Base64 data URL to Firebase Storage
        await uploadString(fileRef, fileOrDataUrl, 'data_url');
      } else {
        // Upload File or Blob to Firebase Storage
        await uploadBytes(fileRef, fileOrDataUrl, { contentType: 'image/jpeg' });
      }
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (error) {
      console.warn("Firebase Storage upload fallback (using compressed Base64 inline):", error);
      if (typeof fileOrDataUrl === 'string') {
        return fileOrDataUrl;
      }
      // Convert File/Blob to base64 fallback
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
      });
    }
  },

  // --- Real-time Typing Indicator ---
  async setTypingStatus(chatId: string, userId: string, userName: string, isTyping: boolean) {
    if (!chatId || !userId) return;

    // Cache local typing status
    const cacheKey = `typing_${chatId}_${userId}`;
    if (!isTyping) {
      localStorage.removeItem(cacheKey);
    } else {
      localStorage.setItem(cacheKey, JSON.stringify({ userId, userName, isTyping, time: Date.now() }));
    }

    if (!auth.currentUser) return;
    const path = `chats/${chatId}/typing/${userId}`;
    try {
      await setDoc(doc(db, path), {
        userId,
        userName,
        isTyping,
        updatedAt: Date.now(),
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      // Safe fallback
    }
  },

  subscribeToTypingStatus(chatId: string, currentUserId: string, callback: (typingUserNames: string[]) => void) {
    const path = `chats/${chatId}/typing`;
    try {
      return onSnapshot(collection(db, path), (snapshot) => {
        const now = Date.now();
        const activeTypers: string[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.userId !== currentUserId && data.isTyping) {
            // Typing status is valid for 6 seconds
            if (!data.updatedAt || (now - data.updatedAt < 6000)) {
              activeTypers.push(data.userName || 'Someone');
            }
          }
        });
        callback(activeTypers);
      }, (err) => {
        console.warn("Typing subscription error (fallback):", err);
      });
    } catch (error) {
      return () => {};
    }
  },

  // --- Group Settings & Admin Roles Management ---
  subscribeToGroupSettings(chatId: string, callback: (settings: { admins: string[]; mutedUsers: string[] }) => void) {
    const defaultAdmins = ['dr-sarah-uid', 'current-user-uid'];
    const cachedSettings = localStorage.getItem(`group_settings_${chatId}`);
    const local = cachedSettings ? JSON.parse(cachedSettings) : { admins: defaultAdmins, mutedUsers: [] };
    callback(local);

    const path = `chats/${chatId}`;
    try {
      return onSnapshot(doc(db, path), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const settings = {
            admins: data.admins || defaultAdmins,
            mutedUsers: data.mutedUsers || []
          };
          localStorage.setItem(`group_settings_${chatId}`, JSON.stringify(settings));
          callback(settings);
        }
      }, (err) => {
        console.warn("Group settings subscription fallback:", err);
      });
    } catch (error) {
      return () => {};
    }
  },

  async toggleGroupAdmin(chatId: string, targetUserId: string, isAdmin: boolean) {
    const cached = localStorage.getItem(`group_settings_${chatId}`);
    let settings = cached ? JSON.parse(cached) : { admins: ['dr-sarah-uid', 'current-user-uid'], mutedUsers: [] };
    
    if (isAdmin) {
      if (!settings.admins.includes(targetUserId)) settings.admins.push(targetUserId);
    } else {
      settings.admins = settings.admins.filter((id: string) => id !== targetUserId);
    }
    localStorage.setItem(`group_settings_${chatId}`, JSON.stringify(settings));

    if (!auth.currentUser) return;
    const path = `chats/${chatId}`;
    try {
      await setDoc(doc(db, path), { admins: settings.admins }, { merge: true });
    } catch (error) {
      console.warn("toggleGroupAdmin online sync fallback:", error);
    }
  },

  async toggleMuteUserInGroup(chatId: string, targetUserId: string, isMuted: boolean) {
    const cached = localStorage.getItem(`group_settings_${chatId}`);
    let settings = cached ? JSON.parse(cached) : { admins: ['dr-sarah-uid', 'current-user-uid'], mutedUsers: [] };
    
    if (isMuted) {
      if (!settings.mutedUsers.includes(targetUserId)) settings.mutedUsers.push(targetUserId);
    } else {
      settings.mutedUsers = settings.mutedUsers.filter((id: string) => id !== targetUserId);
    }
    localStorage.setItem(`group_settings_${chatId}`, JSON.stringify(settings));

    if (!auth.currentUser) return;
    const path = `chats/${chatId}`;
    try {
      await setDoc(doc(db, path), { mutedUsers: settings.mutedUsers }, { merge: true });
    } catch (error) {
      console.warn("toggleMuteUserInGroup online sync fallback:", error);
    }
  },

  // --- Custom Groups Persistence ---
  getCustomGroups(userId: string) {
    const cached = localStorage.getItem(`warrior_custom_groups_${userId || 'guest'}`);
    return cached ? JSON.parse(cached) : [];
  },

  saveCustomGroup(userId: string, group: any) {
    const current = this.getCustomGroups(userId);
    const updated = [group, ...current.filter((g: any) => g.id !== group.id)];
    localStorage.setItem(`warrior_custom_groups_${userId || 'guest'}`, JSON.stringify(updated));
    return updated;
  },

  // --- Community Posts ---
  async getPosts() {
    const path = 'posts';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem('warrior_posts', JSON.stringify(posts));
      return posts;
    } catch (error) {
      console.warn("Firestore getPosts failed, using cache fallback:", error);
      const cached = localStorage.getItem('warrior_posts');
      if (cached) {
        return JSON.parse(cached);
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async createPost(title: string, content: string, tags: string[]) {
    const path = 'posts';
    const user = auth.currentUser;
    const authorName = user ? (user.displayName || 'Warrior') : 'Warrior';
    
    const postObj = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      content,
      authorId: user ? user.uid : 'guest',
      authorName,
      tags,
      likes: 0,
      createdAt: new Date().toISOString()
    };

    const cachedPosts = localStorage.getItem('warrior_posts');
    const postsList = cachedPosts ? JSON.parse(cachedPosts) : [];
    postsList.unshift(postObj);
    localStorage.setItem('warrior_posts', JSON.stringify(postsList));

    if (!user) return postObj;

    try {
      await addDoc(collection(db, path), {
        title,
        content,
        authorId: user.uid,
        authorName,
        tags,
        likes: 0,
        createdAt: serverTimestamp()
      });

      // Optimistically update personal statistics
      const userProfileKey = `user_profile_${user.uid}`;
      const cachedProfile = localStorage.getItem(userProfileKey);
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.stats = parsed.stats || { postsCount: 0 };
        parsed.stats.postsCount = (parsed.stats.postsCount || 0) + 1;
        parsed.xp = (parsed.xp || 0) + 50;
        localStorage.setItem(userProfileKey, JSON.stringify(parsed));
      }

      try {
        await updateDoc(doc(db, `users/${user.uid}`), {
          'stats.postsCount': increment(1),
          xp: increment(50)
        });
      } catch (err) {
        console.warn("Failed to increment profile stats online, cache updated:", err);
      }
      return postObj;
    } catch (error) {
      console.warn("Firestore createPost failed, using cache fallback:", error);
      handleFirestoreError(error, OperationType.CREATE, path);
      return postObj;
    }
  },

  async likePost(postId: string) {
    const path = `posts/${postId}`;
    const cachedPosts = localStorage.getItem('warrior_posts');
    if (cachedPosts) {
      let postsList = JSON.parse(cachedPosts);
      postsList = postsList.map((p: any) => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p);
      localStorage.setItem('warrior_posts', JSON.stringify(postsList));
    }
    try {
      await updateDoc(doc(db, path), {
        likes: increment(1)
      });
    } catch (error) {
      console.warn("Firestore likePost failed, using cache fallback:", error);
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // --- Medications ---
  async getMedicationScheduleResult(userId: string): Promise<HealthHistoryCollection<MedicationScheduleData>> {
    const cacheKey = getHealthCacheKey('warrior_meds', userId);
    let cached: MedicationScheduleData[] = [];
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      cached = Array.isArray(parsed) ? parsed as MedicationScheduleData[] : [];
    } catch {
      cached = [];
    }

    if (!userId) {
      return cached.length > 0
        ? { state: 'cached', data: cached }
        : { state: 'missing', data: [] };
    }

    const path = `users/${userId}/medications`;
    try {
      const q = query(collection(db, path), orderBy('time', 'asc'));
      const snapshot = await getDocs(q);
      const medications = snapshot.docs.map(entry => ({
        id: entry.id,
        ...entry.data(),
      } as MedicationScheduleData));
      localStorage.setItem(cacheKey, JSON.stringify(medications));
      return medications.length > 0
        ? { state: 'recorded', data: medications }
        : { state: 'missing', data: [] };
    } catch (error) {
      console.warn('Firestore medication schedule failed, using matching cache:', error);
      return cached.length > 0
        ? { state: 'cached', data: cached }
        : { state: 'unavailable', data: [] };
    }
  },

  async getMedications(userId: string) {
    const cacheKey = getHealthCacheKey('warrior_meds', userId);
    if (!userId) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
    const path = `users/${userId}/medications`;
    try {
      const q = query(collection(db, path), orderBy('time', 'asc'));
      const snapshot = await getDocs(q);
      const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem(cacheKey, JSON.stringify(meds));
      return meds;
    } catch (error) {
      console.warn("Firestore medications failed, using cache:", error);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addMedication(userId: string, data: any) {
    const cacheKey = getHealthCacheKey('warrior_meds', userId);
    if (!userId) {
      const cached = localStorage.getItem(cacheKey);
      const meds = cached ? JSON.parse(cached) : [];
      const newMed = { id: Math.random().toString(36).substring(2, 9), ...data };
      meds.push(newMed);
      localStorage.setItem(cacheKey, JSON.stringify(meds));
      return { state: 'device-only' as const, data: newMed };
    }
    const path = `users/${userId}/medications`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        createdAt: serverTimestamp()
      });
      const newMed = { id: docRef.id, ...data };
      const cached = localStorage.getItem(cacheKey);
      const meds = cached ? JSON.parse(cached) : [];
      meds.push(newMed);
      localStorage.setItem(cacheKey, JSON.stringify(meds));
      return { state: 'recorded' as const, data: newMed };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateMedication(userId: string, medId: string, data: any) {
    const cacheKey = getHealthCacheKey('warrior_meds', userId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      let meds = JSON.parse(cached);
      meds = meds.map((m: any) => m.id === medId ? { ...m, ...data } : m);
      localStorage.setItem(cacheKey, JSON.stringify(meds));
    }
    if (!userId) {
      if (cached) return { state: 'device-only' as const, data: { id: medId, ...data } };
      throw new Error('Medication update could not be saved');
    }
    const path = `users/${userId}/medications/${medId}`;
    try {
      await updateDoc(doc(db, path), data);
      return { state: 'recorded' as const, data: { id: medId, ...data } };
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } catch { /* A confirmed local update is still device-only. */ }
      if (cached) return { state: 'device-only' as const, data: { id: medId, ...data } };
      throw error;
    }
  },

  async deleteMedication(userId: string, medId: string) {
    const cacheKey = getHealthCacheKey('warrior_meds', userId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      let meds = JSON.parse(cached);
      meds = meds.filter((m: any) => m.id !== medId);
      localStorage.setItem(cacheKey, JSON.stringify(meds));
    }
    if (!userId) {
      if (cached) return { state: 'device-only' as const, data: { id: medId } };
      throw new Error('Medication removal could not be saved');
    }
    const path = `users/${userId}/medications/${medId}`;
    try {
      await deleteDoc(doc(db, path));
      return { state: 'recorded' as const, data: { id: medId } };
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, path);
      } catch { /* A confirmed local removal is still device-only. */ }
      if (cached) return { state: 'device-only' as const, data: { id: medId } };
      throw error;
    }
  },

  // --- Water Intake ---
  async getHydrationContextHistory(
    userId: string,
    dateStrs: string[],
  ): Promise<Array<HealthHistoryRecord<HydrationContextData>>> {
    return Promise.all(dateStrs.map(async (dateStr) => {
      const cacheKey = getWaterCacheKey(userId, dateStr);
      let cached: HydrationContextData | null = null;
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(cacheKey) || 'null');
        cached = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? parsed as HydrationContextData
          : null;
      } catch {
        cached = null;
      }

      if (!userId) {
        return cached
          ? { dateStr, state: 'cached' as const, data: cached }
          : { dateStr, state: 'missing' as const, data: null };
      }

      const path = `users/${userId}/waterLogs/${dateStr}`;
      try {
        const snapshot = await getDoc(doc(db, path));
        if (!snapshot.exists()) return { dateStr, state: 'missing' as const, data: null };
        const data = snapshot.data() as HydrationContextData;
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return { dateStr, state: 'recorded' as const, data };
      } catch (error) {
        console.warn(`Firestore hydration context failed for ${dateStr}:`, error);
        return cached
          ? { dateStr, state: 'cached' as const, data: cached }
          : { dateStr, state: 'unavailable' as const, data: null };
      }
    }));
  },

  async getWaterLog(userId: string, dateStr: string): Promise<HydrationReadResult> {
    const cacheKey = getWaterCacheKey(userId, dateStr);
    if (!userId) {
      const cached = localStorage.getItem(cacheKey);
      return cached
        ? { state: 'recorded', data: JSON.parse(cached) }
        : { state: 'missing', data: null };
    }
    const path = `users/${userId}/waterLogs/${dateStr}`;
    try {
      const docRef = doc(db, path);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return {
          state: 'recorded',
          data: {
            amount: typeof data.amount === 'number' ? data.amount : 0,
            goal: typeof data.goal === 'number' ? data.goal : 3.0,
          },
        };
      }
      return { state: 'missing', data: null };
    } catch (error) {
      console.warn("Firestore hydration failed, using cache:", error);
      const cached = localStorage.getItem(cacheKey);
      return cached
        ? { state: 'cached', data: JSON.parse(cached) }
        : { state: 'unavailable', data: null };
    }
  },

  async saveWaterLog(userId: string, dateStr: string, amount: number, goal: number) {
    const data = { amount, goal, updatedAt: serverTimestamp() };
    const resultData = { amount, goal };
    let savedLocally = false;
    try {
      localStorage.setItem(getWaterCacheKey(userId, dateStr), JSON.stringify(resultData));
      savedLocally = true;
    } catch (error) {
      console.warn('Hydration local save failed:', error);
    }
    if (!userId) {
      try { await this.updateStreak(userId); } catch { /* Optional streak update. */ }
      if (savedLocally) return { state: 'device-only' as const, data: resultData };
      throw new Error('Hydration could not be saved');
    }
    const path = `users/${userId}/waterLogs/${dateStr}`;
    try {
      await setDoc(doc(db, path), data);
      try { await this.updateStreak(userId); } catch { /* Hydration is already confirmed. */ }
      return { state: 'recorded' as const, data: resultData };
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch { /* A confirmed local write remains device-only. */ }
      if (savedLocally) return { state: 'device-only' as const, data: resultData };
      throw error;
    }
  },

  async getWaterLogs7Days(userId: string) {
    const promises = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('sv');
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      promises.push((async () => {
        const log = await this.getWaterLog(userId, dateStr);
        return {
          dateStr,
          label,
          state: log.state,
          amount: log.data?.amount ?? null,
          goal: log.data?.goal ?? null
        };
      })());
    }
    return Promise.all(promises);
  },

  async getHydrationHistory(userId: string, dateStrs: string[]): Promise<Array<HealthHistoryRecord<HydrationHistoryData>>> {
    return Promise.all(dateStrs.map(async (dateStr) => {
      const cacheKey = getWaterCacheKey(userId, dateStr);
      const historyCacheKey = userId ? `health_history_water_${userId}_${dateStr}` : cacheKey;
      let cached: HydrationHistoryData | null = null;
      try {
        const cachedValue = localStorage.getItem(historyCacheKey);
        cached = cachedValue ? JSON.parse(cachedValue) : null;
      } catch {
        cached = null;
      }

      if (!userId) {
        return cached
          ? { dateStr, state: 'recorded' as const, data: cached }
          : { dateStr, state: 'missing' as const, data: null };
      }

      const path = `users/${userId}/waterLogs/${dateStr}`;
      try {
        const snapshot = await getDoc(doc(db, path));
        if (snapshot.exists()) {
          const value = snapshot.data();
          const data = {
            amount: typeof value.amount === 'number' ? value.amount : 0,
            goal: typeof value.goal === 'number' ? value.goal : 3.0,
          };
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(historyCacheKey, JSON.stringify(data));
          return { dateStr, state: 'recorded' as const, data };
        }
        return { dateStr, state: 'missing' as const, data: null };
      } catch (error) {
        console.warn(`Firestore hydration history failed for ${dateStr}:`, error);
        return cached
          ? { dateStr, state: 'cached' as const, data: cached }
          : { dateStr, state: 'unavailable' as const, data: null };
      }
    }));
  },

  // --- Pain Logs (Trends) ---
  async getPainHistory(userId: string, startDateStr?: string): Promise<HealthHistoryCollection<PainHistoryData>> {
    const cacheKey = getHealthCacheKey('warrior_pain', userId);
    let cached: PainHistoryData[] = [];
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      cached = Array.isArray(parsed) ? parsed as PainHistoryData[] : [];
    } catch {
      cached = [];
    }
    const inWindow = (entry: PainHistoryData) => !startDateStr || entry.dateStr >= startDateStr;
    const cachedWindow = cached.filter(inWindow);

    if (!userId) {
      return cachedWindow.length > 0
        ? { state: 'cached', data: cachedWindow }
        : { state: 'missing', data: [] };
    }

    const path = `users/${userId}/painLogs`;
    try {
      const constraints = startDateStr
        ? [where('dateStr', '>=', startDateStr), orderBy('dateStr', 'asc')]
        : [orderBy('dateStr', 'asc')];
      const q = query(collection(db, path), ...constraints);
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() } as PainHistoryData));
      localStorage.setItem(cacheKey, JSON.stringify(startDateStr
        ? [...cached.filter(entry => !inWindow(entry)), ...logs]
        : logs));
      return logs.length > 0
        ? { state: 'recorded', data: logs }
        : { state: 'missing', data: [] };
    } catch (error) {
      console.warn('Firestore pain history failed, using matching cache:', error);
      return cachedWindow.length > 0
        ? { state: 'cached', data: cachedWindow }
        : { state: 'unavailable', data: [] };
    }
  },

  async getPainLogs(userId: string) {
    const cacheKey = getHealthCacheKey('warrior_pain', userId);
    if (!userId) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
    const path = `users/${userId}/painLogs`;
    try {
      const q = query(collection(db, path), orderBy('dateStr', 'asc'));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem(cacheKey, JSON.stringify(logs));
      return logs;
    } catch (error) {
      console.warn("Firestore pain logs failed, using cache:", error);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addPainLog(userId: string, painLevel: number, dateStr: string, triggers: string[] = []) {
    const owner = getCacheEntryOwner(userId);
    const data = { painLevel, dateStr, triggers, timestamp: serverTimestamp() };
    const cacheKey = getHealthCacheKey('warrior_pain', userId);
    const cached = localStorage.getItem(cacheKey);
    const logs = cached ? JSON.parse(cached) : [];

    // Check if an entry for dateStr already exists for THIS account, to update
    // it, or add a new one. Date-only matching once allowed one account's write
    // to overwrite another account's cached same-day pain values.
    const existingIndex = logs.findIndex((l: any) => l.dateStr === dateStr && isOwnedCacheEntry(l, owner));
    if (existingIndex !== -1) {
      logs[existingIndex] = { ...logs[existingIndex], userId: owner, painLevel, triggers };
    } else {
      logs.push({ id: Math.random().toString(36).substring(2, 9), userId: owner, ...data, timestamp: new Date().toISOString() });
    }
    localStorage.setItem(cacheKey, JSON.stringify(logs));

    if (!userId) {
      await this.updateStreak(userId);
      return;
    }
    const path = `users/${userId}/painLogs`;
    try {
      // Find if we already have a record with this dateStr to merge/overwrite
      const q = query(collection(db, path), where('dateStr', '==', dateStr));
      const res = await getDocs(q);
      if (!res.empty) {
        const docId = res.docs[0].id;
        await setDoc(doc(db, `${path}/${docId}`), { painLevel, dateStr, triggers, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await addDoc(collection(db, path), data);
      }
      await this.updateStreak(userId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // --- Symptom Logs ---
  async getSymptomLogs(userId: string) {
    const cacheKey = getHealthCacheKey('warrior_symptom_logs', userId);
    if (!userId) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
    const path = `users/${userId}/symptomLogs`;
    try {
      const q = query(collection(db, path), orderBy('dateStr', 'asc'));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem(cacheKey, JSON.stringify(logs));
      return logs;
    } catch (error) {
      console.warn("Firestore symptom logs failed, using cache:", error);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async getSymptomHistory(userId: string, startDateStr?: string): Promise<HealthHistoryCollection<SymptomHistoryData>> {
    let cached: SymptomHistoryData[] = [];
    try {
      const cachedValue = localStorage.getItem(getHealthCacheKey('warrior_symptom_logs', userId));
      const parsed = cachedValue ? JSON.parse(cachedValue) : [];
      // Authenticated caches are already isolated by UID. Do not reject older
      // legitimate records solely because they predate the userId field.
      cached = Array.isArray(parsed) ? parsed : [];
    } catch {
      cached = [];
    }

    const inWindow = (entry: SymptomHistoryData) => !startDateStr || entry.dateStr >= startDateStr;
    const cachedWindow = cached.filter(inWindow);

    if (!userId) {
      return cachedWindow.length > 0
        ? { state: 'recorded', data: cachedWindow }
        : { state: 'missing', data: [] };
    }

    const path = `users/${userId}/symptomLogs`;
    try {
      const constraints = startDateStr
        ? [where('dateStr', '>=', startDateStr), orderBy('dateStr', 'asc')]
        : [orderBy('dateStr', 'asc')];
      const q = query(collection(db, path), ...constraints);
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() } as SymptomHistoryData));
      localStorage.setItem(getHealthCacheKey('warrior_symptom_logs', userId), JSON.stringify(startDateStr
        ? [...cached.filter(entry => !inWindow(entry)), ...logs]
        : logs));
      return logs.length > 0
        ? { state: 'recorded', data: logs }
        : { state: 'missing', data: [] };
    } catch (error) {
      console.warn('Firestore symptom history failed, using matching cache:', error);
      return cachedWindow.length > 0
        ? { state: 'cached', data: cachedWindow }
        : { state: 'unavailable', data: [] };
    }
  },

  async addSymptomLog(userId: string, painLevel: number, symptoms: string[], triggers: string[], waterIntake: number, dateStr: string) {
    const owner = getCacheEntryOwner(userId);
    const data = { 
      userId: owner,
      painLevel, 
      symptoms, 
      triggers, 
      waterIntake, 
      dateStr, 
      timestamp: serverTimestamp() 
    };

    const cacheKey = getHealthCacheKey('warrior_symptom_logs', userId);
    const cached = localStorage.getItem(cacheKey);
    const logs = cached ? JSON.parse(cached) : [];

    // Same-date upserts must only match an entry owned by the acting account.
    // Date-only matching once let account B update account A's cached clinical
    // values while the cache kept attributing them to account A.
    const existingIndex = logs.findIndex((l: any) => l.dateStr === dateStr && isOwnedCacheEntry(l, owner));
    
    const localData = { 
      ...data, 
      id: Math.random().toString(36).substring(2, 9), 
      timestamp: new Date().toISOString() 
    };

    if (existingIndex !== -1) {
      logs[existingIndex] = { ...logs[existingIndex], userId: owner, painLevel, symptoms, triggers, waterIntake };
    } else {
      logs.push(localData);
    }
    localStorage.setItem(cacheKey, JSON.stringify(logs));

    if (!userId) {
      await this.updateStreak(userId);
      return;
    }
    const path = `users/${userId}/symptomLogs`;
    try {
      const q = query(collection(db, path), where('dateStr', '==', dateStr));
      const res = await getDocs(q);
      if (!res.empty) {
        const docId = res.docs[0].id;
        await setDoc(doc(db, `${path}/${docId}`), { 
          painLevel, 
          symptoms, 
          triggers, 
          waterIntake, 
          dateStr, 
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } else {
        await addDoc(collection(db, path), data);
      }
      
      // Sync into pain logs as well so 30-day pain visualization is always updated
      await this.addPainLog(userId, painLevel, dateStr, triggers);
      await this.saveWaterLog(userId, dateStr, waterIntake, 3.0);
      await this.updateStreak(userId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // --- Daily Streak Tracking ---
  async updateStreak(userId: string) {
    const todayStr = new Date().toLocaleDateString('sv');
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('sv');

    if (!userId) {
      // LocalStorage fallback for offline/guest
      const cached = localStorage.getItem('warrior_streak_info');
      let streakInfo = cached ? JSON.parse(cached) : { streak: 0, lastActiveDate: '' };
      
      if (streakInfo.lastActiveDate === todayStr) {
        return streakInfo.streak;
      } else if (streakInfo.lastActiveDate === yesterdayStr) {
        streakInfo.streak += 1;
        // Increase user XP as a reward!
        const xp = Number(localStorage.getItem('warrior_xp') || '0') + 25;
        localStorage.setItem('warrior_xp', String(xp));
      } else {
        streakInfo.streak = 1;
      }
      streakInfo.lastActiveDate = todayStr;
      localStorage.setItem('warrior_streak_info', JSON.stringify(streakInfo));
      return streakInfo.streak;
    }

    const path = `users/${userId}`;
    try {
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        let currentStreak = userData.streak || 0;
        const lastActiveDate = userData.lastActiveDate || '';
        
        let nextStreak = currentStreak;
        let shouldUpdate = false;
        
        if (lastActiveDate === todayStr) {
          return currentStreak;
        } else if (lastActiveDate === yesterdayStr) {
          nextStreak += 1;
          shouldUpdate = true;
        } else {
          nextStreak = 1;
          shouldUpdate = true;
        }
        
        if (shouldUpdate) {
          await updateDoc(docRef, {
            streak: nextStreak,
            lastActiveDate: todayStr,
            xp: increment(25) // Gain points for consistency!
          });
        }
        return nextStreak;
      }
      return 0;
    } catch (error) {
      console.warn("Streak calculation error (safe fallback):", error);
      return 0;
    }
  },

  // --- Award XP ---
  async awardXP(userId: string, amount: number) {
    const currentLocalXP = Number(localStorage.getItem('warrior_xp') || '0');
    localStorage.setItem('warrior_xp', String(currentLocalXP + amount));
    if (!userId) return;
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, path), {
        xp: increment(amount)
      });
    } catch (error) {
      console.warn("Failed to award XP online, using local cache", error);
    }
  },

  // --- Emergency Info ---
  // Missing emergency information stays missing: no seeded contacts, allergies,
  // medications or clinical notes are invented for real Patient flows. Cached
  // emergency data is UID-scoped for authenticated accounts; guest sessions keep
  // the legacy unscoped key. Legacy unscoped data is never attached to an
  // authenticated account and never deleted.
  async getEmergencyInfo(userId: string) {
    const cacheKey = getHealthCacheKey('warrior_emergency', userId);
    if (!userId) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : {};
    }
    const path = `users/${userId}/emergencyInfo/summary`;
    try {
      const docRef = doc(db, path);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      }
      return {};
    } catch (error) {
      console.warn("Firestore emergency info failed, fallback:", error);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : {};
    }
  },

  async saveEmergencyInfo(userId: string, data: any) {
    localStorage.setItem(getHealthCacheKey('warrior_emergency', userId), JSON.stringify(data));
    if (!userId) return;
    const path = `users/${userId}/emergencyInfo/summary`;
    try {
      await setDoc(doc(db, path), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // --- Doctor Appointments ---
  async getAppointments(userId: string) {
    const result = await loadAppointments(userId);
    return result.data;
  },

  async getAppointmentRequests(userId: string) {
    return loadAppointments(userId);
  },

  async addAppointment(userId: string, data: any) {
    const localId = Math.random().toString(36).substring(2, 9);
    const appointmentObj = {
      ...data,
      createdAt: new Date().toISOString()
    };

    const cacheKey = getAppointmentCacheKey(userId);
    const apps = readAppointmentCache(cacheKey) ?? [];
    apps.unshift({ id: localId, ...appointmentObj });
    localStorage.setItem(cacheKey, JSON.stringify(apps));

    if (!userId) return { id: localId, ...appointmentObj };

    const path = `users/${userId}/appointments`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        createdAt: serverTimestamp()
      });
      const updatedApps = apps.map((a: any) => a.id === localId ? { ...a, id: docRef.id } : a);
      localStorage.setItem(cacheKey, JSON.stringify(updatedApps));
      return { id: docRef.id, ...data };
    } catch (error) {
      // The local write already succeeded, including when cloud permission is denied.
      console.warn('Appointment request saved on this device; cloud recording failed:', error);
    }
  },

  async cancelAppointment(userId: string, appId: string) {
    const cacheKey = getAppointmentCacheKey(userId);
    const cached = readAppointmentCache(cacheKey);
    if (cached) {
      const apps = cached.map((appointment) => appointment.id === appId
        ? { ...appointment, status: 'Cancelled' }
        : appointment);
      localStorage.setItem(cacheKey, JSON.stringify(apps));
    }

    const savedLocally = Boolean(cached?.some((appointment) => appointment.id === appId));
    if (!userId) {
      if (!savedLocally) throw new Error('Appointment request not found on this device');
      return { state: 'device-only' as const };
    }
    const path = `users/${userId}/appointments/${appId}`;
    try {
      await updateDoc(doc(db, path), { status: 'Cancelled' });
      return { state: 'recorded' as const };
    } catch (error) {
      if (!savedLocally) throw error;
      console.warn('Appointment cancellation saved on this device; cloud update failed:', error);
      return { state: 'device-only' as const };
    }
  },

  // --- Care Vault Medical History ---
  // Authenticated reads NEVER consume the ambiguous legacy global cache.
  async getCareVaultResult(userId: string): Promise<{
    data: MedicalRecordData;
    state: 'recorded' | 'cached' | 'empty' | 'unavailable';
  }> {
    const cacheKey = userId ? 'warrior_carevault_' + userId : 'warrior_carevault';
    const readCache = (): MedicalRecordData | null => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(cacheKey) || 'null');
        return isRecord(parsed) ? parsed : null;
      } catch { return null; }
    };
    if (!userId) {
      const cached = readCache();
      return { data: cached ?? {}, state: cached ? 'cached' : 'empty' };
    }
    try {
      const snapshot = await getDoc(doc(db, 'users/' + userId + '/careVault/medicalHistory'));
      const data = snapshot.exists() ? snapshot.data() : {};
      if (!isRecord(data)) throw new Error('Invalid medical records');
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* Cloud read remains usable. */ }
      return { data, state: snapshot.exists() ? 'recorded' : 'empty' };
    } catch {
      const cached = readCache();
      return cached ? { data: cached, state: 'cached' } : { data: {}, state: 'unavailable' };
    }
  },

  async getCareVault(userId: string) {
    const result = await this.getCareVaultResult(userId);
    if (result.state === 'unavailable') throw new Error('Medical records unavailable');
    return result.data;
  },

  async saveCareVault(userId: string, patch: MedicalRecordData): Promise<{ state: 'recorded' | 'device-only' }> {
    const cacheKey = userId ? 'warrior_carevault_' + userId : 'warrior_carevault';
    let savedLocally = false;
    try {
      const cached: unknown = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      localStorage.setItem(cacheKey, JSON.stringify(mergeMedicalRecords(isRecord(cached) ? cached : {}, patch)));
      savedLocally = true;
    } catch { /* Still attempt the cloud write if device storage is unavailable. */ }
    if (userId) {
      try {
        await setDoc(doc(db, 'users/' + userId + '/careVault/medicalHistory'), {
          ...patch, updatedAt: serverTimestamp(),
        }, { merge: true });
        return { state: 'recorded' };
      } catch { /* Return only the storage outcome we can confirm. */ }
    }
    if (savedLocally) return { state: 'device-only' };
    throw new Error('Medical records could not be saved');
  },

  // --- Mood & Mental Wellness Logs ---
  async saveMoodLog(userId: string, entry: {
    emotion: string;
    intensity: number;
    symptoms: string[];
    journalText: string;
    aiResponse?: string;
  }) {
    const newLog = {
      id: Date.now().toString(),
      ...entry,
      createdAt: new Date().toISOString()
    };

    const cachedStr = localStorage.getItem(`warrior_mood_logs_${userId || 'guest'}`);
    let logs = cachedStr ? JSON.parse(cachedStr) : [];
    logs = [newLog, ...logs];
    let savedLocally = false;
    try {
      localStorage.setItem(`warrior_mood_logs_${userId || 'guest'}`, JSON.stringify(logs));
      savedLocally = true;
    } catch (error) {
      console.warn('Mood history local save failed:', error);
    }

    if (!userId) {
      if (savedLocally) return { state: 'device-only' as const, data: newLog };
      throw new Error('Mood history could not be saved');
    }

    const path = `users/${userId}/moodLogs`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...entry,
        createdAt: serverTimestamp()
      });
      return { state: 'recorded' as const, data: { id: docRef.id, ...entry } };
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, path);
      } catch { /* A confirmed local history write remains device-only. */ }
      if (savedLocally) return { state: 'device-only' as const, data: newLog };
      throw error;
    }
  },

  async getMoodLogs(userId: string) {
    const cachedStr = localStorage.getItem(`warrior_mood_logs_${userId || 'guest'}`);
    const localLogs = cachedStr ? JSON.parse(cachedStr) : [];

    if (!userId) return localLogs;

    const path = `users/${userId}/moodLogs`;
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (docs.length > 0) {
        localStorage.setItem(`warrior_mood_logs_${userId}`, JSON.stringify(docs));
        return docs;
      }
      return localLogs;
    } catch (error) {
      console.warn("Firestore getMoodLogs fallback:", error);
      return localLogs;
    }
  },

  // --- Daily Mood Check-In on Dashboard ---
  async saveDailyMoodCheckIn(userId: string, dateStr: string, moodData: {
    emoji: string;
    emotion: string;
    score: number; // 1 to 10 scale (e.g. 8 for Good, 3 for Pain Flare)
    note?: string;
    timestamp?: string;
  }) {
    const payload = {
      ...moodData,
      dateStr,
      timestamp: moodData.timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let savedLocally = false;
    try {
      localStorage.setItem(`warrior_daily_mood_${userId || 'guest'}_${dateStr}`, JSON.stringify(payload));
      savedLocally = true;
    } catch (error) {
      console.warn('Daily check-in local save failed:', error);
    }

    // Also add to historical mood logs for holistic longitudinal tracking
    let historyState: PersistenceWriteState | 'failed' = 'failed';
    try {
      const historyResult = await this.saveMoodLog(userId, {
        emotion: `${moodData.emoji} ${moodData.emotion}`,
        intensity: moodData.score,
        symptoms: moodData.score <= 4 ? ['Low Energy / Discomfort'] : [],
        journalText: moodData.note || `Daily check-in: ${moodData.emotion} (${moodData.score}/10)`
      });
      historyState = historyResult.state;
    } catch (error) {
      console.warn('Daily check-in history copy failed:', error);
    }

    if (!userId) {
      try { await this.updateStreak(userId); } catch { /* Optional streak update. */ }
      if (savedLocally) return { state: 'device-only' as const, data: payload, historyState };
      throw new Error('Daily check-in could not be saved');
    }

    const path = `users/${userId}/dailyMoodCheckIns/${dateStr}`;
    try {
      await setDoc(doc(db, path), {
        ...payload,
        serverTime: serverTimestamp()
      });
      try { await this.updateStreak(userId); } catch { /* Check-in is already confirmed. */ }
      return { state: 'recorded' as const, data: payload, historyState };
    } catch (error) {
      console.warn("Firestore saveDailyMoodCheckIn fallback:", error);
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch { /* A confirmed local check-in remains device-only. */ }
      if (savedLocally) return { state: 'device-only' as const, data: payload, historyState };
      throw error;
    }
  },

  async getDailyMoodCheckIn(userId: string, dateStr: string) {
    const cached = localStorage.getItem(`warrior_daily_mood_${userId || 'guest'}_${dateStr}`);
    const localData = cached ? JSON.parse(cached) : null;

    if (!userId) return localData;

    const path = `users/${userId}/dailyMoodCheckIns/${dateStr}`;
    try {
      const docSnap = await getDoc(doc(db, path));
      if (docSnap.exists()) {
        const data = docSnap.data();
        localStorage.setItem(`warrior_daily_mood_${userId}_${dateStr}`, JSON.stringify(data));
        return data;
      }
      return localData;
    } catch (error) {
      console.warn("Firestore getDailyMoodCheckIn fallback:", error);
      return localData;
    }
  },

  async getDailyCheckInHistory(userId: string, dateStrs: string[]): Promise<Array<HealthHistoryRecord<DailyCheckInHistoryData>>> {
    return Promise.all(dateStrs.map(async (dateStr) => {
      const cacheKey = `warrior_daily_mood_${userId || 'guest'}_${dateStr}`;
      let cached: DailyCheckInHistoryData | null = null;
      try {
        const cachedValue = localStorage.getItem(cacheKey);
        cached = cachedValue ? JSON.parse(cachedValue) : null;
      } catch {
        cached = null;
      }

      if (!userId) {
        return cached
          ? { dateStr, state: 'recorded' as const, data: cached }
          : { dateStr, state: 'missing' as const, data: null };
      }

      const path = `users/${userId}/dailyMoodCheckIns/${dateStr}`;
      try {
        const snapshot = await getDoc(doc(db, path));
        if (snapshot.exists()) {
          const data = snapshot.data() as DailyCheckInHistoryData;
          localStorage.setItem(cacheKey, JSON.stringify(data));
          return { dateStr, state: 'recorded' as const, data };
        }
        return { dateStr, state: 'missing' as const, data: null };
      } catch (error) {
        console.warn(`Firestore daily check-in history failed for ${dateStr}:`, error);
        return cached
          ? { dateStr, state: 'cached' as const, data: cached }
          : { dateStr, state: 'unavailable' as const, data: null };
      }
    }));
  },

  // --- 7-Day Mood & Hydration Trends Aggregator ---
  async getMoodAndHydrationTrends7Days(userId: string) {
    const results = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('sv');
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

      // Fetch water log
      const waterLog = await this.getWaterLog(userId, dateStr);
      // Fetch daily mood
      const moodLog = await this.getDailyMoodCheckIn(userId, dateStr);

      // Default baseline mood score if not logged that day is null or estimated from pain logs
      let moodScore = moodLog ? moodLog.score : null;
      let moodEmoji = moodLog ? moodLog.emoji : '⚪';
      let moodLabel = moodLog ? moodLog.emotion : 'No Check-in';

      // If no explicit mood checkin, check if there's a pain log for that day to infer wellness (10 - painLevel)
      if (moodScore === null) {
        const cachedPain = localStorage.getItem(getHealthCacheKey('warrior_pain', userId));
        const painLogs = cachedPain ? JSON.parse(cachedPain) : [];
        const foundPain = painLogs.find((p: any) => p.dateStr === dateStr);
        if (foundPain) {
          const estimatedWellness = Math.max(1, 10 - foundPain.painLevel);
          moodScore = estimatedWellness;
          moodEmoji = estimatedWellness >= 7 ? '😊' : estimatedWellness >= 4 ? '😐' : '⚡';
          moodLabel = `Pain: ${foundPain.painLevel}/10`;
        }
      }

      results.push({
        dateStr,
        dayLabel,
        displayDate,
        waterAmount: waterLog.data ? parseFloat(waterLog.data.amount.toFixed(2)) : null,
        waterGoal: waterLog.data?.goal ?? null,
        hydrationState: waterLog.state,
        moodScore: moodScore !== null ? moodScore : 7.0, // baseline placeholder for smooth chart rendering if unlogged
        hasMoodLogged: moodScore !== null,
        moodEmoji,
        moodLabel
      });
    }

    return results;
  },

  // --- Scheduled Reminders Persistence ---
  async getScheduledReminders(userId: string) {
    const cached = localStorage.getItem(`warrior_reminders_${userId || 'guest'}`);
    if (cached) return JSON.parse(cached);

    if (!userId) return [];

    const path = `users/${userId}/reminderSettings/config`;
    try {
      const docSnap = await getDoc(doc(db, path));
      if (docSnap.exists() && docSnap.data().reminders) {
        const data = docSnap.data().reminders;
        localStorage.setItem(`warrior_reminders_${userId}`, JSON.stringify(data));
        return data;
      }
      return [];
    } catch (error) {
      console.warn("Firestore getScheduledReminders fallback:", error);
      return [];
    }
  },

  async saveScheduledReminders(userId: string, reminders: any[]) {
    localStorage.setItem(`warrior_reminders_${userId || 'guest'}`, JSON.stringify(reminders));
    if (!userId) return;

    const path = `users/${userId}/reminderSettings/config`;
    try {
      await setDoc(doc(db, path), {
        reminders,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.warn("Firestore saveScheduledReminders error:", error);
    }
  }
};
