import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  OAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User
} from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db } from "./firebase";
import type { UserProfile } from "../types";

type AuthContextValue = {
  currentUser: User | null;
  userData: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<unknown>;
  signup: (email: string, password: string, username: string) => Promise<unknown>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<unknown>;
  loginWithApple: () => Promise<unknown>;
  updateUserData: (data: Partial<UserProfile>) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  explicitSignInAnonymously: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}

async function ensureUserDocument(user: User, data: Partial<UserProfile> = {}) {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      id: user.uid,
      email: user.email ?? "",
      username: user.displayName ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      isAnonymous: user.isAnonymous,
      createdAt: new Date(),
      ...data
    });
    return;
  }

  await setDoc(
    userDocRef,
    {
      id: user.uid,
      email: user.email ?? userDoc.data().email ?? "",
      isAnonymous: user.isAnonymous,
      ...data
    },
    { merge: true }
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signInAnonymouslyUser = useCallback(async () => {
    const credential = await signInAnonymously(auth);
    await ensureUserDocument(credential.user, {
      isAnonymous: true
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (!user) {
        try {
          await signInAnonymouslyUser();
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
        }
      }
    });

    return unsubscribe;
  }, [signInAnonymouslyUser]);

  useEffect(() => {
    if (!currentUser) {
      setUserData(null);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", currentUser.uid),
      (snapshot) => {
        setUserData(snapshot.exists() ? ({ id: currentUser.uid, ...snapshot.data() } as UserProfile) : null);
      },
      (error) => {
        console.error("User snapshot failed:", error);
        setUserData(null);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (currentUser?.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        const linked = await linkWithCredential(currentUser, credential);
        await sendEmailVerification(linked.user);
        await ensureUserDocument(linked.user, {
          email,
          isAnonymous: false
        });
        return linked;
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDocument(credential.user, { isAnonymous: false });
      return credential;
    },
    [currentUser]
  );

  const signup = useCallback(
    async (email: string, password: string, username: string) => {
      const profile = {
        email,
        username,
        displayName: username,
        isAnonymous: false
      };

      if (currentUser?.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        const linked = await linkWithCredential(currentUser, credential);
        await updateProfile(linked.user, { displayName: username });
        await sendEmailVerification(linked.user);
        await ensureUserDocument(linked.user, profile);
        return linked;
      }

      const created = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(created.user, { displayName: username });
      await sendEmailVerification(created.user);
      await ensureUserDocument(created.user, profile);
      return created;
    },
    [currentUser]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const loginWithProvider = useCallback(
    async (provider: GoogleAuthProvider | OAuthProvider) => {
      if (Platform.OS !== "web") {
        throw new Error("Provider sign-in is currently available on web only. Use email sign-in on mobile.");
      }

      const result = await signInWithPopup(auth, provider);
      await ensureUserDocument(result.user, {
        email: result.user.email ?? "",
        username: result.user.displayName ?? "",
        displayName: result.user.displayName ?? "",
        photoURL: result.user.photoURL ?? "",
        isAnonymous: false
      });
      return result;
    },
    []
  );

  const loginWithGoogle = useCallback(() => loginWithProvider(new GoogleAuthProvider()), [loginWithProvider]);

  const loginWithApple = useCallback(() => loginWithProvider(new OAuthProvider("apple.com")), [loginWithProvider]);

  const updateUserData = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!currentUser) {
        throw new Error("No user is currently signed in.");
      }

      await updateDoc(doc(db, "users", currentUser.uid), data);
      setUserData((previous) => ({ ...previous, ...data }));
    },
    [currentUser]
  );

  const deleteAccount = useCallback(
    async (password?: string) => {
      if (!currentUser) {
        throw new Error("No user is currently signed in.");
      }

      const providerId = currentUser.providerData[0]?.providerId;
      if (providerId === "password") {
        if (!password || !currentUser.email) {
          throw new Error("Password is required for email account deletion.");
        }
        await reauthenticateWithCredential(
          currentUser,
          EmailAuthProvider.credential(currentUser.email, password)
        );
      }

      await deleteDoc(doc(db, "users", currentUser.uid));
      await deleteUser(currentUser);
    },
    [currentUser]
  );

  const explicitSignInAnonymously = useCallback(async () => {
    if (currentUser) {
      await signOut(auth);
    }
    await signInAnonymouslyUser();
  }, [currentUser, signInAnonymouslyUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      userData,
      loading,
      login,
      signup,
      logout,
      resetPassword,
      loginWithGoogle,
      loginWithApple,
      updateUserData,
      deleteAccount,
      explicitSignInAnonymously
    }),
    [
      currentUser,
      userData,
      loading,
      login,
      signup,
      logout,
      resetPassword,
      loginWithGoogle,
      loginWithApple,
      updateUserData,
      deleteAccount,
      explicitSignInAnonymously
    ]
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
