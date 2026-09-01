import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import type { UserProfile, AccountType } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<ConfirmationResult>;
  verifyPhoneCode: (confirmation: ConfirmationResult, code: string) => Promise<void>;
  completeProfile: (data: {
    displayName: string;
    photoFile: File | null;
    accountType: AccountType;
    community: string;
    lat?: number;
    lng?: number;
  }) => Promise<void>;
  updateMyProfile: (data: Partial<UserProfile> & { photoFile?: File | null }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const ensureProfileDoc = async (u: User) => {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const data: UserProfile = {
        uid: u.uid,
        displayName: u.displayName || '',
        photoURL: u.photoURL || '',
        accountType: 'Buyer',
        community: '',
        location: null,
        safetyAccepted: false,
        createdAt: Date.now(),
      };
      await setDoc(ref, data);
      setProfile(data);
    } else {
      setProfile(snap.data() as UserProfile);
    }
  };

  useEffect(() => {
    let mounted = true;

    getRedirectResult(auth)
      .then(async (result) => {
        if (!mounted) return;
        if (result) await ensureProfileDoc(result.user);
      })
      .catch((err) => {
        if (!mounted) return;
        setAuthError(err?.message || 'Google sign-in redirect failed');
        setLoading(false);
      });

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!mounted) return;
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) setProfile(snap.data() as UserProfile);
        } catch {
          // Firestore might fail if Firebase isn't configured — keep app usable
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  const signInWithPhone = async (phone: string) => {
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal',
    });
    const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
    return confirmation;
  };

  const verifyPhoneCode = async (confirmation: ConfirmationResult, code: string) => {
    const result = await confirmation.confirm(code);
    await ensureProfileDoc(result.user);
  };

  const completeProfile: AuthContextType['completeProfile'] = async (data) => {
    if (!user) return;
    let photoURL = user.photoURL || '';
    if (data.photoFile) {
      const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}`);
      await uploadBytes(storageRef, data.photoFile);
      photoURL = await getDownloadURL(storageRef);
    }
    const update: UserProfile = {
      uid: user.uid,
      displayName: data.displayName,
      photoURL,
      accountType: data.accountType,
      community: data.community,
      location: data.lat && data.lng ? { lat: data.lat, lng: data.lng } : null,
      safetyAccepted: profile?.safetyAccepted ?? false,
      createdAt: profile?.createdAt ?? Date.now(),
    };
    await setDoc(doc(db, 'users', user.uid), update);
    setProfile(update);
  };

  const updateMyProfile: AuthContextType['updateMyProfile'] = async (data) => {
    if (!user || !profile) return;
    let photoURL = data.photoURL ?? profile.photoURL;
    if (data.photoFile) {
      const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}`);
      await uploadBytes(storageRef, data.photoFile);
      photoURL = await getDownloadURL(storageRef);
    }
    const update: UserProfile = {
      ...profile,
      displayName: data.displayName ?? profile.displayName,
      accountType: data.accountType ?? profile.accountType,
      community: data.community ?? profile.community,
      location: data.location ?? profile.location,
      photoURL,
    };
    await updateDoc(doc(db, 'users', user.uid), { ...update });
    setProfile(update);
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        signInWithGoogle,
        signInWithPhone,
        verifyPhoneCode,
        completeProfile,
        updateMyProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
