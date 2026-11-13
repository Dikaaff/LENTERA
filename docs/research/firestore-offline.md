# Firestore offline persistence and conflict behaviour

Accessed: 2026-11-13.

Source: https://firebase.google.com/docs/firestore/manage-data/enable-offline

## Verified facts

- Web persistence is enabled with `initializeFirestore(app, { localCache:
persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`.
- Pending writes survive a page reload and are replayed when connectivity
  returns.
- The SDK resolves concurrent writes per document with last-write-wins by
  default. Firestore does not merge field-level edits automatically.

## Design consequences

- Report IDs are client-generated (UUID) so a retried write updates the same
  document instead of creating a duplicate.
- The queue stamps `updatedAt` on every local write and compares it with the
  remote document. A newer remote copy marks the local row `conflict` instead of
  silently overwriting it.
- Last-write-wins is documented as a limitation, not hidden.
- The emergency JSON export exists because sync may never succeed.

## Unverified here

Live multi-client conflict behaviour was not executed: no Firebase project was
available in this session. The comparison logic is covered by unit tests against
the store adapter, not against a live Firestore instance.
