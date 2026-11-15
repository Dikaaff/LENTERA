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
  setAdminLocal(true);
}

export async function signOut() {
  const instance = auth();
  if (instance) await firebaseSignOut(instance);
  clearAdminLocal();
}

const ADMIN_PIN = "12345678";
const ADMIN_MARKER = "lentera_admin_pin";

export { ADMIN_PIN };

export function setAdminLocal(ok: boolean) {
  if (typeof window === "undefined") return;
  if (ok) {
    try {
      localStorage.setItem(ADMIN_MARKER, "1");
    } catch {}
  } else {
    try {
      localStorage.removeItem(ADMIN_MARKER);
    } catch {}
  }
}

export function clearAdminLocal() {
  setAdminLocal(false);
}

export function isAdminLocal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ADMIN_MARKER) === "1";
  } catch {
    return false;
  }
}

export async function signInAdminWithPin(pin: string): Promise<boolean> {
  if (pin !== ADMIN_PIN) return false;
  setAdminLocal(true);
  const instance = auth();
  if (!instance) return true;
  if (!instance.currentUser) {
    try {
      await signInAnonymously(instance);
    } catch {
      // ignore
    }
  }
  return true;
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

  const localAdmin = isAdminLocal();
  const role = !user ? "tamu" : localAdmin || !user.isAnonymous ? "admin" : "relawan";
  return { user, loading, role };
}
