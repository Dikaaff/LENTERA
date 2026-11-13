# LENTERA — 3-minute demo script

Language: English (English subtitles recommended). Screen recording at 9:16 or
square; large type; no background music.

## 0:00–0:20 — The problem

**Visual:** dark screen, one line at a time.

**VO:** "A volunteer writes a report during an outage. It lives in a private
chat. When signal returns, the details are gone or retyped three times. LENTERA
turns that note into a structured report while the phone is still offline."

## 0:20–1:00 — Capture in airplane mode

**Visual:** Airplane mode on. Isi Laporan. Type: "Ada 30 keluarga di balai desa
Sukamaju, butuh air bersih dan selimut. Jalan longsor." Tap **Proses laporan**.
Status bar changes to **Proses: perangkat**.

**VO:** "The submit tap initializes Gemini Nano through Firebase AI Logic. The
same schema is requested on both paths. On-device, nothing leaves the phone."

Point at the status bar: path + queue depth.

## 1:00–1:30 — Photo and a clean Network tab

**Visual:** Attach a photo; extraction card appears with editable summary,
category, urgency, location, and needs. Switch to DevTools Network, filter
`firebase`, show zero AI requests.

**VO:** "A photo is JPEG or PNG, inline, still local. The card is editable because
the human is the final validator. The Network tab is empty: no Firebase AI
request occurred."

## 1:30–2:10 — Queue and reconnect

**Visual:** Save, open Antrean. Held count ticks to 1, badge **menunggu**.
Reload the page with network off; the report remains. Turn airplane mode off;
badge becomes **terkirim** with the same ID. Show the export button.

**VO:** "Reports are written locally first, then mirrored to Firestore's
persistent cache with a client-generated ID. A retry updates the same document,
so reconnect cannot duplicate it. The export is the escape hatch if sync never
succeeds."

## 2:10–2:40 — Cloud SITREP and deduplication

**Visual:** SITREP screen. Consent panel wording visible. Approve. Run
**Deduplikasi**; two reports map to one canonical ID with a confidence score.
Run **Susun SITREP**; four sections, Indonesian, under 250 words. Tap a source
ID; the original report opens.

**VO:** "Cloud is used only for work that needs cross-report context. Low
confidence is flagged, not applied. Every claim carries a source ID, so a
coordinator can audit the narrative."

## 2:40–3:00 — What is next

**Visual:** repo tree, tests passing, README, license.

**VO:** "The local path is a bonus, not a single point of failure: a device
without Nano still gets a correct report via cloud. Next: measured local-vs-cloud
accuracy, emulator rules tests, and regency-level geometry. Apache-2.0, public
repo."

## Recording checklist

- [ ] Real device or Chrome profile with the Nano flag enabled.
- [ ] `.env.local` with a real project; App Check debug token registered.
- [ ] Network tab cleared before the local capture.
- [ ] Status bar visible in every shot.
- [ ] No fabricated numbers; if accuracy is unmeasured, do not show a metric.
