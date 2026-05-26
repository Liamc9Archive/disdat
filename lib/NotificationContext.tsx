import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

type NotificationState = Record<string, boolean>;

type NotificationContextValue = {
  notifications: NotificationState;
  addNotification: (key: string) => Promise<void>;
  clearNotification: (key: string) => Promise<void>;
};

const emptyNotifications = {
  home: false,
  search: false,
  profile: false,
  settings: false
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider.");
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationState>(emptyNotifications);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      if (!currentUser) {
        setNotifications(emptyNotifications);
        return;
      }

      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (cancelled) {
        return;
      }

      if (userDoc.exists()) {
        setNotifications(userDoc.data().notifications ?? emptyNotifications);
        return;
      }

      await setDoc(userRef, { notifications: emptyNotifications }, { merge: true });
      setNotifications(emptyNotifications);
    }

    loadNotifications().catch((error) => {
      console.error("Loading notifications failed:", error);
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const save = useCallback(
    async (nextNotifications: NotificationState) => {
      setNotifications(nextNotifications);
      if (!currentUser) {
        return;
      }
      await setDoc(doc(db, "users", currentUser.uid), { notifications: nextNotifications }, { merge: true });
    },
    [currentUser]
  );

  const addNotification = useCallback(
    async (key: string) => {
      await save({ ...notifications, [key]: true });
    },
    [notifications, save]
  );

  const clearNotification = useCallback(
    async (key: string) => {
      await save({ ...notifications, [key]: false });
    },
    [notifications, save]
  );

  const value = useMemo(
    () => ({ notifications, addNotification, clearNotification }),
    [notifications, addNotification, clearNotification]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
