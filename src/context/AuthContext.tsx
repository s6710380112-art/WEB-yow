import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, BOOTSTRAP_ADMIN_EMAIL, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isSuspended: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync or create user profile in Firestore
  const syncUserProfile = async (user: FirebaseUser): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      const isBootstrapAdmin = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Check if user is bootstrap admin but role isn't admin yet
        if (isBootstrapAdmin && data.role !== 'admin') {
          await updateDoc(userDocRef, {
            role: 'admin',
            updatedAt: serverTimestamp(),
          });
          // Also write to admins collection
          await setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            role: 'admin',
            addedAt: serverTimestamp(),
          });
          data.role = 'admin';
        }
        setUserProfile(data);
        return data;
      } else {
        // Create initial profile
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
          email: user.email || '',
          photoURL: user.photoURL || '',
          role: isBootstrapAdmin ? 'admin' : 'member',
          status: 'active',
          bio: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userDocRef, newProfile);

        if (isBootstrapAdmin) {
          await setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            role: 'admin',
            addedAt: serverTimestamp(),
          });
        }

        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await syncUserProfile(user);
        } catch (e) {
          console.error('Failed to sync profile', e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      await syncUserProfile(currentUser);
    }
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    if (cred.user) {
      await syncUserProfile(cred.user);
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name.trim() });
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Verification email send notice:', e);
      }
      await syncUserProfile(cred.user);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerification = async () => {
    if (currentUser) {
      await sendEmailVerification(currentUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setCurrentUser(null);
  };

  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('กรุณาเข้าสู่ระบบ');
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      if (data.displayName && currentUser) {
        await updateProfile(currentUser, { displayName: data.displayName });
      }
      await refreshProfile();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const isAdmin =
    userProfile?.role === 'admin' ||
    currentUser?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

  const isModerator = isAdmin || userProfile?.role === 'moderator';
  const isSuspended = userProfile?.status === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isModerator,
        isSuspended,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        resendVerification,
        logout,
        updateUserProfileData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
