import { getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase";
import type { ReportRecord } from "@/modules/reports";

let database: Firestore | null = null;

export function firestore(): Firestore | null {
  if (!isFirebaseConfigured) return null;
  if (database) return database;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    database = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    database = getFirestore(app);
  }
  if (import.meta.env.VITE_USE_EMULATORS === "1") {
    connectFirestoreEmulator(database, "127.0.0.1", 8080);
  }
  return database;
}

/** Reporter PII and the photo stay local; only the validated report leaves. */
const toRemote = (report: ReportRecord) => ({
  id: report.id,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
  status: report.status,
  needsReview: report.needsReview,
  post: report.post,
  region: report.region,
  reporterId: report.reporterId,
  extraction: report.extraction,
  inference: report.inference,
});

export async function pushReport(report: ReportRecord): Promise<boolean> {
  let db: Firestore | null = null;
  try {
    db = firestore();
  } catch (error) {
    console.error("[lentera] firestore init gagal", error);
    return false;
  }
  if (!db) return false;
  const user = getAuth(getFirebaseApp()!).currentUser;
  if (!user) {
    console.error("[lentera] sync dilewati: belum ada pengguna auth");
    return false;
  }
  try {
    await setDoc(doc(db, "reports", report.id), toRemote(report), { merge: true });
    return true;
  } catch (error) {
    console.error("[lentera] push gagal", error);
    return false;
  }
}

export function watchReport(id: string, onRemote: (updatedAt: number) => void): () => void {
  const db = firestore();
  if (!db) return () => undefined;
  return onSnapshot(
    doc(db, "reports", id),
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!snapshot.exists() || snapshot.metadata.fromCache) return;
      const value: unknown = snapshot.data().updatedAt;
      onRemote(typeof value === "number" ? value : 0);
    },
    (error) => console.error("[lentera] watch gagal", error),
  );
}
