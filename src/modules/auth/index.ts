import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase";

export type Role = "relawan" | "admin" | "tamu";

export const roleOf = (user: User | null): Role =>
  !user ? "tamu" : user.isAnonymous ? "relawan" : "admin";

let emulatorConnected = false;

const auth = () => {
  const app = getFirebaseApp();
  if (!app) return null;
  const instance = getAuth(app);
  if (import.meta.env.VITE_USE_EMULATORS === "1" && !emulatorConnected) {
    connectAuthEmulator(instance, "http://127.0.0.1:9099", { disableWarnings: true });
    emulatorConnected = true;
  }
  return instance;
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

export async function signInAdmin(): Promise<void> {
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

  const role = !user ? "tamu" : user.isAnonymous ? "relawan" : "admin";
  return { user, loading, role } satisfies { user: User | null; loading: boolean; role: Role };
}
