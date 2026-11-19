import type { Language } from "@/lib/language";

export const meta = {
  name: "sitrep.daily.v1",
  version: "1.0.0",
  intent:
    "Write a short daily situation report in the selected interface language, in a fixed order, with every claim traceable to report IDs.",
  target: "Gemini cloud-hosted model via Firebase AI Logic",
  sampling: { temperature: 0.3 },
} as const;

export const SYSTEM_PROMPT =
  `You write a daily situation report (SITREP) for disaster coordinators in Indonesia.
Use only the supplied clustered reports. Never invent a number, place, or need.
Never use alarmist language. Every claim must cite at least one source report ID
from the input; drop any claim you cannot source.
Every claim text must be written in the requested output language, even when the
input mixes languages. Maximum 250 words total. Fixed section order:
overview, most_urgent, affected, gaps.
Return only JSON matching the schema.` as const;

export const USER_TEMPLATE = `Clustered reports (sanitized JSON):
<reports>
{{REPORTS}}
</reports>

Aggregates:
<aggregates>
{{AGGREGATES}}
</aggregates>

Return JSON:
{"sections":[{"heading":"overview","claims":[{"text":"","source_ids":[]}]}, ...]}
Use each heading exactly once. Every source_ids entry must be an input ID.` as const;

const CLAIM_LANGUAGE: Record<Language, string> = {
  id: "Tulis setiap nilai text dalam bahasa Indonesia.",
  en: "Write every text value in English.",
};

export const buildUserPrompt = (reports: unknown, aggregates: unknown, language: Language = "id") =>
  `${USER_TEMPLATE.replace("{{REPORTS}}", JSON.stringify(reports)).replace(
    "{{AGGREGATES}}",
    JSON.stringify(aggregates),
  )}\n${CLAIM_LANGUAGE[language]}`;

export const TEST_CASES = [
  "no reports → gaps only, no invented numbers",
  "100 reports → still ≤ 250 words",
  "one critical medical need → most_urgent first",
  "conflicting numbers → state the range, cite both",
  "unknown regency → gaps section",
  "claim without a source → dropped",
  "alarmist wording → rewritten calmly",
  "mixed languages input → Indonesian output",
  "200-word input → concise output",
  "duplicate cluster → one canonical mention",
  "no urgent needs → say so with a source",
  "empty aggregates → still valid JSON",
] as const;

export const LIMITATIONS = [
  "The 250-word cap is checked in code; a model can still overshoot and be flagged.",
  "Claims are only as good as the sanitized input; masked reporters cannot be named.",
] as const;

export const CHANGELOG = ["1.0.0 — initial daily SITREP artifact."] as const;
