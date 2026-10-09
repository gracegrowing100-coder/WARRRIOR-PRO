
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  linkWithCredential,
  type AuthCredential
} from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Standard custom prompts to avoid caching wrong credentials
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

let pendingGoogleLink: { credential: AuthCredential; email: string | null } | null = null;

export const configureAuthPersistence = (rememberUser: boolean) => {
  return setPersistence(
    auth,
    rememberUser ? browserLocalPersistence : browserSessionPersistence
  );
};

export const loginWithGoogle = async (useRedirect: boolean = false) => {
  try {
    if (useRedirect) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error) {
    const authError = error as { code?: string; customData?: { email?: string } };
    if (authError.code === 'auth/account-exists-with-different-credential') {
      const credential = GoogleAuthProvider.credentialFromError(error as any);
      if (credential) {
        pendingGoogleLink = {
          credential,
          email: authError.customData?.email || null,
        };
      }
    }
    throw error;
  }
};

export const linkPendingGoogleCredential = async (user: FirebaseUser) => {
  if (!pendingGoogleLink) return false;

  const pending = pendingGoogleLink;
  const signedInEmail = user.email?.trim().toLowerCase() || null;
  const pendingEmail = pending.email?.trim().toLowerCase() || null;
  if (signedInEmail && pendingEmail && signedInEmail !== pendingEmail) {
    pendingGoogleLink = null;
    throw Object.assign(
      new Error('The Google account does not match the signed-in account.'),
      { code: 'auth/account-link-email-mismatch' },
    );
  }

  await linkWithCredential(user, pending.credential);
  pendingGoogleLink = null;
  return true;
};

export const registerWithEmail = async (email: string, psw: string) => {
  const creds = await createUserWithEmailAndPassword(auth, email, psw);
  return creds.user;
};

export const loginWithEmail = async (email: string, psw: string) => {
  const creds = await signInWithEmailAndPassword(auth, email, psw);
  return creds.user;
};

export const sendPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const triggerEmailVerification = async () => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
};

export const updateUserDisplayNameAndPhoto = async (name: string, photoURL?: string) => {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      displayName: name,
      photoURL: photoURL || ''
    });
  }
};

export const logout = () => auth.signOut();

async function testConnection() {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore connection test timeout")), 3000)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise
    ]);
    console.log("Firestore connection test: Online, fully reached Cloud database.");
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.info(
      "Firestore cloud connection check unavailable. " +
      "Local fallback features may remain available; cloud sync was not verified."
    );
  }
}

// Check for auth state changes
export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { getRedirectResult };

testConnection();
