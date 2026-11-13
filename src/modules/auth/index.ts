import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase";

export type Role = "relawan" | "koordinator" | "tamu";

export const roleOf = (user: User | null): Role =>
  !user ? "tamu" : user.isAnonymous ? "relawan" : "koordinator";

const auth = () => {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
};

export async function ensureVolunteer(): Promise<User | null> {
  const instance = auth();
  if (!instance) return null;
  if (instance.currentUser) return instance.currentUser;
  try {
    const result = await signInAnonymously(instance);
    return result.user;
  } catch {
    return null;
  }
}

export async function signInCoordinator(): Promise<void> {
  const instance = auth();
  if (!instance) return;
  await signInWithPopup(instance, new GoogleAuthProvider());
}

export async function signOut() {
  const instance = auth();
  if (instance) await firebaseSignOut(instance);
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    const instance = auth();
    if (!instance) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(instance, (next) => {
      setUser(next);
      setLoading(false);
    });
  }, []);

  return { user, loading, role: roleOf(user) };
}
