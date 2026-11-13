import fs from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let env: RulesTestEnvironment;

const report = (reporterId: string, region: string, status: string) => ({
  reporterId,
  region,
  status,
  needsReview: false,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "lentera-demo",
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "coordinators/coord-1"), { region: "Jawa Barat" });
    await setDoc(doc(db, "reports/report-a"), report("vol-a", "Jawa Barat", "queued"));
    await setDoc(doc(db, "reports/report-synced"), report("vol-a", "Jawa Barat", "synced"));
    await setDoc(doc(db, "reports/report-aceh"), report("vol-b", "Aceh", "queued"));
  });
});

describe("firestore.rules — reports", () => {
  it("lets volunteer A read their own report", async () => {
    const db = env.authenticatedContext("vol-a").firestore();
    await assertSucceeds(getDoc(doc(db, "reports/report-a")));
  });

  it("denies volunteer B reading volunteer A's report", async () => {
    const db = env.authenticatedContext("vol-b").firestore();
    await assertFails(getDoc(doc(db, "reports/report-a")));
  });

  it("denies an unauthenticated client", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "reports/report-a")));
  });

  it("allows creating an own report without local-only fields", async () => {
    const db = env.authenticatedContext("vol-a").firestore();
    await assertSucceeds(setDoc(doc(db, "reports/new-a"), report("vol-a", "Jawa Barat", "queued")));
  });

  it("rejects a report created for another volunteer", async () => {
    const db = env.authenticatedContext("vol-b").firestore();
    await assertFails(setDoc(doc(db, "reports/forged"), report("vol-a", "Jawa Barat", "queued")));
  });

  it("rejects raw notes and photos leaving the device", async () => {
    const db = env.authenticatedContext("vol-a").firestore();
    await assertFails(
      setDoc(doc(db, "reports/leaky"), {
        ...report("vol-a", "Jawa Barat", "queued"),
        rawNote: "Nama saya Budi",
      }),
    );
  });

  it("denies a volunteer editing a synced report", async () => {
    const db = env.authenticatedContext("vol-a").firestore();
    await assertFails(updateDoc(doc(db, "reports/report-synced"), { needsReview: true }));
  });

  it("denies deletion even for the owner", async () => {
    const db = env.authenticatedContext("vol-a").firestore();
    await assertFails(deleteDoc(doc(db, "reports/report-a")));
  });

  it("lets a coordinator read their region only", async () => {
    const db = env.authenticatedContext("coord-1", { email_verified: true }).firestore();
    await assertSucceeds(getDoc(doc(db, "reports/report-a")));
    await assertFails(getDoc(doc(db, "reports/report-aceh")));
  });

  it("lets a coordinator flag but not rewrite a report", async () => {
    const db = env.authenticatedContext("coord-1", { email_verified: true }).firestore();
    await assertSucceeds(updateDoc(doc(db, "reports/report-a"), { needsReview: true }));
    await assertFails(updateDoc(doc(db, "reports/report-a"), { region: "Aceh" }));
  });

  it("denies an unverified coordinator token", async () => {
    const db = env.authenticatedContext("coord-1", { email_verified: false }).firestore();
    await assertFails(getDoc(doc(db, "reports/report-a")));
  });
});
