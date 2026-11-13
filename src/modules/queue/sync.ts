import { getAuth } from "firebase/auth";
import {
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
  const db = firestore();
  if (!db) return false;
  const user = getAuth(getFirebaseApp()!).currentUser;
  if (!user) return false;
  try {
    await setDoc(doc(db, "reports", report.id), toRemote(report), { merge: true });
    return true;
  } catch {
    return false;
  }
}

export function watchReport(id: string, onRemote: (updatedAt: number) => void): () => void {
  const db = firestore();
  if (!db) return () => undefined;
  return onSnapshot(doc(db, "reports", id), (snapshot) => {
    if (!snapshot.exists() || snapshot.metadata.fromCache) return;
    const value: unknown = snapshot.data().updatedAt;
    onRemote(typeof value === "number" ? value : 0);
  });
}
