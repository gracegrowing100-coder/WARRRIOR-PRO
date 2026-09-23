
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
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

export const firebaseService = {
  // --- User Profiles ---
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
  async getMedications(userId: string) {
    if (!userId) {
      const cached = localStorage.getItem('warrior_meds');
      return cached ? JSON.parse(cached) : [];
    }
    const path = `users/${userId}/medications`;
    try {
      const q = query(collection(db, path), orderBy('time', 'asc'));
      const snapshot = await getDocs(q);
      const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem('warrior_meds', JSON.stringify(meds));
      return meds;
    } catch (error) {
      console.warn("Firestore medications failed, using cache:", error);
      const cached = localStorage.getItem('warrior_meds');
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addMedication(userId: string, data: any) {
    if (!userId) {
      const cached = localStorage.getItem('warrior_meds');
      const meds = cached ? JSON.parse(cached) : [];
      const newMed = { id: Math.random().toString(36).substring(2, 9), ...data };
      meds.push(newMed);
      localStorage.setItem('warrior_meds', JSON.stringify(meds));
      return newMed;
    }
    const path = `users/${userId}/medications`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        createdAt: serverTimestamp()
      });
      const newMed = { id: docRef.id, ...data };
      const cached = localStorage.getItem('warrior_meds');
      const meds = cached ? JSON.parse(cached) : [];
      meds.push(newMed);
      localStorage.setItem('warrior_meds', JSON.stringify(meds));
      return newMed;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateMedication(userId: string, medId: string, data: any) {
    const cached = localStorage.getItem('warrior_meds');
    if (cached) {
      let meds = JSON.parse(cached);
      meds = meds.map((m: any) => m.id === medId ? { ...m, ...data } : m);
      localStorage.setItem('warrior_meds', JSON.stringify(meds));
    }
    if (!userId) return;
    const path = `users/${userId}/medications/${medId}`;
    try {
      await updateDoc(doc(db, path), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteMedication(userId: string, medId: string) {
    const cached = localStorage.getItem('warrior_meds');
    if (cached) {
      let meds = JSON.parse(cached);
      meds = meds.filter((m: any) => m.id !== medId);
      localStorage.setItem('warrior_meds', JSON.stringify(meds));
    }
    if (!userId) return;
    const path = `users/${userId}/medications/${medId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // --- Water Intake ---
  async getWaterLog(userId: string, dateStr: string) {
    if (!userId) {
      const cached = localStorage.getItem(`water_${dateStr}`);
      return cached ? JSON.parse(cached) : { amount: 0, goal: 3.0 };
    }
    const path = `users/${userId}/waterLogs/${dateStr}`;
    try {
      const docRef = doc(db, path);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        localStorage.setItem(`water_${dateStr}`, JSON.stringify(data));
        return { amount: data.amount || 0, goal: data.goal || 3.0 };
      }
      return { amount: 0, goal: 3.0 };
    } catch (error) {
      console.warn("Firestore hydration failed, using cache:", error);
      const cached = localStorage.getItem(`water_${dateStr}`);
      return cached ? JSON.parse(cached) : { amount: 0, goal: 3.0 };
    }
  },

  async saveWaterLog(userId: string, dateStr: string, amount: number, goal: number) {
    const data = { amount, goal, updatedAt: serverTimestamp() };
    localStorage.setItem(`water_${dateStr}`, JSON.stringify({ amount, goal }));
    if (!userId) {
      await this.updateStreak(userId);
      return;
    }
    const path = `users/${userId}/waterLogs/${dateStr}`;
    try {
      await setDoc(doc(db, path), data);
      await this.updateStreak(userId);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
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
          amount: log ? log.amount : 0,
          goal: log ? log.goal : 3.0
        };
      })());
    }
    return Promise.all(promises);
  },

  // --- Pain Logs (Trends) ---
  async getPainLogs(userId: string) {
    if (!userId) {
      const cached = localStorage.getItem('warrior_pain');
      return cached ? JSON.parse(cached) : [];
    }
    const path = `users/${userId}/painLogs`;
    try {
      const q = query(collection(db, path), orderBy('dateStr', 'asc'));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem('warrior_pain', JSON.stringify(logs));
      return logs;
    } catch (error) {
      console.warn("Firestore pain logs failed, using cache:", error);
      const cached = localStorage.getItem('warrior_pain');
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addPainLog(userId: string, painLevel: number, dateStr: string, triggers: string[] = []) {
    const data = { painLevel, dateStr, triggers, timestamp: serverTimestamp() };
    const cached = localStorage.getItem('warrior_pain');
    const logs = cached ? JSON.parse(cached) : [];
    
    // Check if entry for dateStr already exists, to update it, or add new
    const existingIndex = logs.findIndex((l: any) => l.dateStr === dateStr);
    if (existingIndex !== -1) {
      logs[existingIndex] = { ...logs[existingIndex], painLevel, triggers };
    } else {
      logs.push({ id: Math.random().toString(36).substring(2, 9), ...data, timestamp: new Date().toISOString() });
    }
    localStorage.setItem('warrior_pain', JSON.stringify(logs));

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
    if (!userId) {
      const cached = localStorage.getItem('warrior_symptom_logs');
      return cached ? JSON.parse(cached) : [];
    }
    const path = `users/${userId}/symptomLogs`;
    try {
      const q = query(collection(db, path), orderBy('dateStr', 'asc'));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem('warrior_symptom_logs', JSON.stringify(logs));
      return logs;
    } catch (error) {
      console.warn("Firestore symptom logs failed, using cache:", error);
      const cached = localStorage.getItem('warrior_symptom_logs');
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addSymptomLog(userId: string, painLevel: number, symptoms: string[], triggers: string[], waterIntake: number, dateStr: string) {
    const data = { 
      userId: userId || 'guest',
      painLevel, 
      symptoms, 
      triggers, 
      waterIntake, 
      dateStr, 
      timestamp: serverTimestamp() 
    };

    const cached = localStorage.getItem('warrior_symptom_logs');
    const logs = cached ? JSON.parse(cached) : [];
    const existingIndex = logs.findIndex((l: any) => l.dateStr === dateStr);
    
    const localData = { 
      ...data, 
      id: Math.random().toString(36).substring(2, 9), 
      timestamp: new Date().toISOString() 
    };

    if (existingIndex !== -1) {
      logs[existingIndex] = { ...logs[existingIndex], painLevel, symptoms, triggers, waterIntake };
    } else {
      logs.push(localData);
    }
    localStorage.setItem('warrior_symptom_logs', JSON.stringify(logs));

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
  async getEmergencyInfo(userId: string) {
    const defaultInfo = {
      bloodType: 'O+',
      genotype: 'SS',
      emergencyContactName: 'Dr. Amina Yusuf (Specialist)',
      emergencyContactPhone: '+234 812 345 6789',
      primaryCaregiverName: 'Sarah Smith (Mother)',
      primaryCaregiverPhone: '+234 803 111 2222',
      allergies: 'Penicillin, Sulfa medications',
      currentMeds: 'Hydroxyurea (500mg daily), Folic Acid (5mg)',
      customNotes: 'Keep well hydrated. Avoid extreme cold temperature triggers. Administer IV fluids quickly'
    };
    if (!userId) {
      const cached = localStorage.getItem('warrior_emergency');
      return cached ? JSON.parse(cached) : defaultInfo;
    }
    const path = `users/${userId}/emergencyInfo/summary`;
    try {
      const docRef = doc(db, path);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        localStorage.setItem('warrior_emergency', JSON.stringify(data));
        return data;
      }
      return defaultInfo;
    } catch (error) {
      console.warn("Firestore emergency info failed, fallback:", error);
      const cached = localStorage.getItem('warrior_emergency');
      return cached ? JSON.parse(cached) : defaultInfo;
    }
  },

  async saveEmergencyInfo(userId: string, data: any) {
    localStorage.setItem('warrior_emergency', JSON.stringify(data));
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
    if (!userId) {
      const cached = localStorage.getItem('warrior_appointments');
      return cached ? JSON.parse(cached) : [];
    }
    const path = `users/${userId}/appointments`;
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const apps = snapshot.docs.map(doc => {
        const data = doc.data();
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
          id: doc.id, 
          ...data,
          formattedCreatedAt: bookedAtStr
        };
      });
      localStorage.setItem('warrior_appointments', JSON.stringify(apps));
      return apps;
    } catch (error) {
      console.warn("Firestore appointments list failed, using cache:", error);
      const cached = localStorage.getItem('warrior_appointments');
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addAppointment(userId: string, data: any) {
    const localId = Math.random().toString(36).substring(2, 9);
    const appointmentObj = {
      ...data,
      createdAt: new Date().toISOString()
    };

    const cached = localStorage.getItem('warrior_appointments');
    const apps = cached ? JSON.parse(cached) : [];
    apps.unshift({ id: localId, ...appointmentObj });
    localStorage.setItem('warrior_appointments', JSON.stringify(apps));

    if (!userId) return { id: localId, ...appointmentObj };

    const path = `users/${userId}/appointments`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        createdAt: serverTimestamp()
      });
      const updatedApps = apps.map((a: any) => a.id === localId ? { ...a, id: docRef.id } : a);
      localStorage.setItem('warrior_appointments', JSON.stringify(updatedApps));
      return { id: docRef.id, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async cancelAppointment(userId: string, appId: string) {
    const cached = localStorage.getItem('warrior_appointments');
    if (cached) {
      let apps = JSON.parse(cached);
      apps = apps.map((a: any) => a.id === appId ? { ...a, status: 'Cancelled' } : a);
      localStorage.setItem('warrior_appointments', JSON.stringify(apps));
    }

    if (!userId) return;
    const path = `users/${userId}/appointments/${appId}`;
    try {
      await updateDoc(doc(db, path), { status: 'Cancelled' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // --- Care Vault Medical History ---
  async getCareVault(userId: string) {
    const defaultVault = {
      primaryDiagnosis: 'Sickle Cell Disease (HbSS)',
      otherConditions: ['Asthma'],
      allergies: 'Penicillin, Sulfa drugs',
      surgeries: [
        { id: 'surg-1', name: 'Splenectomy', date: '2021-04-12', hospital: 'St. Jude General Hospital' }
      ],
      hospitalizations: [
        { id: 'hosp-1', reason: 'Vaso-occlusive Crisis (VOC)', date: '2024-01-15', durationDays: 5, notes: 'Treated with IV fluids, oxygen, and continuous patient-controlled analgesia.' }
      ],
      transfusions: [
        { id: 'trans-1', date: '2023-11-20', volumeMl: 350, reactionNotes: 'None. Simple red blood cell exchange.' }
      ],
      immunizations: ['Pneumococcal Vaccine', 'Meningococcal Vaccine', 'Hepatitis B', 'Annual Influenza Nose Spray']
    };

    if (!userId) {
      const cached = localStorage.getItem('warrior_carevault');
      return cached ? JSON.parse(cached) : defaultVault;
    }
    const path = `users/${userId}/careVault/medicalHistory`;
    try {
      const docRef = doc(db, path);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        localStorage.setItem('warrior_carevault', JSON.stringify(data));
        return data;
      }
      return defaultVault;
    } catch (error) {
      console.warn("Firestore care vault failed, fallback:", error);
      const cached = localStorage.getItem('warrior_carevault');
      return cached ? JSON.parse(cached) : defaultVault;
    }
  },

  async saveCareVault(userId: string, data: any) {
    localStorage.setItem('warrior_carevault', JSON.stringify(data));
    if (!userId) return;
    const path = `users/${userId}/careVault/medicalHistory`;
    try {
      await setDoc(doc(db, path), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
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
    localStorage.setItem(`warrior_mood_logs_${userId || 'guest'}`, JSON.stringify(logs));

    if (!userId) return newLog;

    const path = `users/${userId}/moodLogs`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...entry,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...entry };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return newLog;
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

    localStorage.setItem(`warrior_daily_mood_${userId || 'guest'}_${dateStr}`, JSON.stringify(payload));

    // Also add to historical mood logs for holistic longitudinal tracking
    await this.saveMoodLog(userId, {
      emotion: `${moodData.emoji} ${moodData.emotion}`,
      intensity: moodData.score,
      symptoms: moodData.score <= 4 ? ['Low Energy / Discomfort'] : [],
      journalText: moodData.note || `Daily check-in: ${moodData.emotion} (${moodData.score}/10)`
    });

    if (!userId) {
      await this.updateStreak(userId);
      return payload;
    }

    const path = `users/${userId}/dailyMoodCheckIns/${dateStr}`;
    try {
      await setDoc(doc(db, path), {
        ...payload,
        serverTime: serverTimestamp()
      });
      await this.updateStreak(userId);
      return payload;
    } catch (error) {
      console.warn("Firestore saveDailyMoodCheckIn fallback:", error);
      handleFirestoreError(error, OperationType.WRITE, path);
      return payload;
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
        const cachedPain = localStorage.getItem('warrior_pain');
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
        waterAmount: waterLog ? parseFloat((waterLog.amount || 0).toFixed(2)) : 0,
        waterGoal: waterLog ? waterLog.goal || 3.0 : 3.0,
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
    const defaultReminders = [
      { id: 'rem-med-1', title: 'Hydroxyurea Daily Dose', type: 'medication', time: '08:00', enabled: true, details: '500mg with breakfast' },
      { id: 'rem-hyd-1', title: 'Mid-Morning Hydration Boost', type: 'hydration', time: '11:00', enabled: true, details: 'Drink 500ml of warm water' },
      { id: 'rem-chk-1', title: 'Afternoon Pain & Wellness Check-in', type: 'checkin', time: '14:30', enabled: true, details: 'Record symptoms & resting level' },
      { id: 'rem-med-2', title: 'Evening Folic Acid & Hydration', type: 'medication', time: '20:00', enabled: true, details: 'Folic acid 5mg + 350ml water' },
      { id: 'rem-chk-2', title: 'Nighttime Cellular Recovery', type: 'checkin', time: '22:00', enabled: false, details: 'Bedtime relaxation & warmth check' }
    ];

    const cached = localStorage.getItem(`warrior_reminders_${userId || 'guest'}`);
    if (cached) return JSON.parse(cached);

    if (!userId) return defaultReminders;

    const path = `users/${userId}/reminderSettings/config`;
    try {
      const docSnap = await getDoc(doc(db, path));
      if (docSnap.exists() && docSnap.data().reminders) {
        const data = docSnap.data().reminders;
        localStorage.setItem(`warrior_reminders_${userId}`, JSON.stringify(data));
        return data;
      }
      return defaultReminders;
    } catch (error) {
      console.warn("Firestore getScheduledReminders fallback:", error);
      return defaultReminders;
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

