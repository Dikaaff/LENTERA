import { Camera, Loader2, ShieldAlert } from "lucide-react";
import { useRef, useState } from "react";
import { ExtractionCard } from "@/components/ExtractionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { isFirebaseConfigured } from "@/lib/firebase";
import { deviceId } from "@/lib/device";
import { useLanguage } from "@/lib/i18n";
import { ensureVolunteer, useAuthUser } from "@/modules/auth";
import { runTask, type InferenceResult } from "@/modules/inference";
import { regions } from "@/modules/map/geometry";
import { saveReport } from "@/modules/queue";
import {
  EMPTY_EXTRACTION,
  maskReporterPII,
  type Extraction,
  type InferenceMeta,
} from "@/modules/reports";
import { setConsent, useConsent } from "@/modules/sitrep";

const MAX_PHOTO = 1_400_000;

export function CaptureScreen() {
  const { language, t } = useLanguage();
  const consent = useConsent();
  const { user } = useAuthUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [region, setRegion] = useState(regions[0]?.name ?? "");
  const [post, setPost] = useState(() => t("capture.defaultPost"));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [askConsent, setAskConsent] = useState(false);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [inference, setInference] = useState<InferenceMeta | null>(null);
  const [needsReview, setNeedsReview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const readPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!/image\/(jpeg|png)/.test(file.type)) {
      setMessage(t("capture.photoTypeError"));
      return;
    }
    if (file.size > MAX_PHOTO) {
      setMessage(t("capture.photoSizeError"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const process = async (allowCloud: boolean) => {
    setAskConsent(false);
    setBusy(true);
    setMessage(null);
    setSavedId(null);
    setProgress(0);
    const { masked } = maskReporterPII(note);
    let result: InferenceResult<Extraction>;
    try {
      result = await runTask(
        "report.extract.v1",
        { note: masked, photoDataUrl: photo },
        { consentToCloud: allowCloud, onProgress: setProgress, language },
      );
    } catch {
      result = {
        status: "unavailable",
        data: null,
        meta: {
          path: "unavailable",
          durationMs: 0,
          artifact: "report.extract.v1",
          version: "1.0.0",
          reason: t("capture.processFailed"),
          retried: false,
        },
        error: t("capture.processFailed"),
      };
    }
    setInference(result.meta);
    if (result.status === "ok" && result.data) {
      setExtraction(result.data);
      setNeedsReview(false);
      setMessage(t("capture.extractionDone"));
    } else {
      setExtraction(EMPTY_EXTRACTION);
      setNeedsReview(true);
      setMessage(result.error ?? t("capture.extractionUnverified"));
    }
    setBusy(false);
  };

  const submit = () => {
    if (!note.trim()) {
      setMessage(t("capture.noteRequired"));
      return;
    }
    if (!consent && isFirebaseConfigured) {
      setAskConsent(true);
      return;
    }
    void process(consent);
  };

  const save = async () => {
    if (!extraction) return;
    const meta: InferenceMeta = inference ?? {
      path: "unavailable",
      durationMs: 0,
      artifact: "report.extract.v1",
      version: "1.0.0",
      reason: t("capture.manualReason"),
      retried: false,
    };
    const volunteer = isFirebaseConfigured ? await ensureVolunteer() : null;
    const record = saveReport({
      rawNote: note,
      photo,
      post,
      region,
      reporterId: volunteer?.uid ?? user?.uid ?? deviceId(),
      extraction,
      inference: meta,
      needsReview,
    });
    setSavedId(record.id);
    setNote("");
    setPhoto(null);
    setExtraction(null);
    setInference(null);
    setMessage(t("capture.savedMessage"));
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight">{t("capture.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("capture.subtitle")}</p>
      </header>

      {!isFirebaseConfigured && (
        <p className="flex items-start gap-2 border border-amber/50 p-3 text-xs text-amber">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          {t("capture.firebaseWarning")}
        </p>
      )}

      <Card>
        <CardBody className="space-y-3">
          <label className="block">
            <Label>{t("capture.noteLabel")}</Label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("capture.notePlaceholder")}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <Label>{t("capture.postLabel")}</Label>
              <Input value={post} onChange={(event) => setPost(event.target.value)} />
            </label>
            <label className="block">
              <Label>{t("capture.regionLabel")}</Label>
              <Select value={region} onChange={(event) => setRegion(event.target.value)}>
                {regions.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(event) => readPhoto(event.target.files?.[0])}
          />
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera className="size-4" /> {t("capture.photo")}
            </Button>
            {photo && (
              <>
                <img
                  src={photo}
                  alt={t("capture.photoPreviewAlt")}
                  className="size-11 object-cover"
                />
                <Button variant="ghost" size="sm" onClick={() => setPhoto(null)}>
                  {t("capture.removePhoto")}
                </Button>
              </>
            )}
          </div>

          <Button className="w-full" disabled={busy} onClick={submit}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {busy
              ? t("capture.processing", { percent: Math.round(progress * 100) })
              : t("capture.submit")}
          </Button>
        </CardBody>
      </Card>

      {askConsent && (
        <Card className="border-amber/60">
          <CardBody className="space-y-3">
            <p className="text-sm">{t("capture.consentText")}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void process(true)}>
                {t("capture.consentAllow")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setConsent(false);
                  void process(false);
                }}
              >
                {t("capture.consentLocal")}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {message && (
        <p role="status" className="border border-line bg-surface p-3 text-xs text-muted">
          {message}
        </p>
      )}
      {savedId && <Badge tone="synced">{t("capture.saved", { id: savedId.slice(0, 8) })}</Badge>}

      {extraction && (
        <>
          <ExtractionCard value={extraction} onChange={setExtraction} />
          <Button className="w-full" onClick={() => void save()}>
            {t("capture.save")}
          </Button>
        </>
      )}
    </div>
  );
}
