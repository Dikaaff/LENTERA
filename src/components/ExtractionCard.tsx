import { Plus, Trash2 } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import type { Category, Extraction, Urgency } from "@/modules/reports";
import { Button } from "./ui/button";
import { Card, CardBody, CardHeader } from "./ui/card";
import { Input, Label, Select, Textarea } from "./ui/field";

const CATEGORY_KEY: Record<Category, TranslationKey> = {
  evacuation: "category.evacuation",
  medical: "category.medical",
  food_water: "category.food_water",
  shelter: "category.shelter",
  infrastructure: "category.infrastructure",
  logistics: "category.logistics",
  missing_person: "category.missing_person",
  other: "category.other",
};

const URGENCY_KEY: Record<Urgency, TranslationKey> = {
  critical: "urgency.critical",
  high: "urgency.high",
  medium: "urgency.medium",
  low: "urgency.low",
};

const CONFIDENCE_KEY = {
  high: "confidence.high",
  medium: "confidence.medium",
  low: "confidence.low",
} as const;

interface Props {
  value: Extraction;
  onChange: (next: Extraction) => void;
}

export function ExtractionCard({ value, onChange }: Props) {
  const { t } = useLanguage();
  const location = value.location ?? { name: null, regency: null, confidence: "low" as const };
  const people = value.people_affected ?? { min: null, max: null };

  const patch = (next: Partial<Extraction>) => onChange({ ...value, ...next });

  return (
    <Card className="border-amber/40">
      <CardHeader>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
          {t("extraction.title")}
        </h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <label className="block">
          <Label>{t("extraction.summary")}</Label>
          <Textarea
            value={value.summary ?? ""}
            onChange={(event) => patch({ summary: event.target.value || null })}
            placeholder={t("extraction.summaryPlaceholder")}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <Label>{t("extraction.category")}</Label>
            <Select
              value={value.category ?? ""}
              onChange={(event) =>
                patch({ category: (event.target.value || null) as Category | null })
              }
            >
              <option value="">—</option>
              {Object.entries(CATEGORY_KEY).map(([key, labelKey]) => (
                <option key={key} value={key}>
                  {t(labelKey)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <Label>{t("extraction.urgency")}</Label>
            <Select
              value={value.urgency ?? ""}
              onChange={(event) =>
                patch({ urgency: (event.target.value || null) as Urgency | null })
              }
            >
              <option value="">—</option>
              {Object.entries(URGENCY_KEY).map(([key, labelKey]) => (
                <option key={key} value={key}>
                  {t(labelKey)}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <Label>{t("extraction.location")}</Label>
            <Input
              value={location.name ?? ""}
              onChange={(event) =>
                patch({
                  location: { ...location, name: event.target.value || null },
                })
              }
            />
          </label>
          <label className="block">
            <Label>{t("extraction.regency")}</Label>
            <Input
              value={location.regency ?? ""}
              onChange={(event) =>
                patch({
                  location: { ...location, regency: event.target.value || null },
                })
              }
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <Label>{t("extraction.peopleMin")}</Label>
            <Input
              type="number"
              min={0}
              value={people.min ?? ""}
              onChange={(event) =>
                patch({
                  people_affected: {
                    ...people,
                    min: event.target.value === "" ? null : Number(event.target.value),
                  },
                })
              }
            />
          </label>
          <label className="block">
            <Label>{t("extraction.peopleMax")}</Label>
            <Input
              type="number"
              min={0}
              value={people.max ?? ""}
              onChange={(event) =>
                patch({
                  people_affected: {
                    ...people,
                    max: event.target.value === "" ? null : Number(event.target.value),
                  },
                })
              }
            />
          </label>
          <label className="block">
            <Label>{t("extraction.confidence")}</Label>
            <Select
              value={location.confidence}
              onChange={(event) =>
                patch({
                  location: {
                    ...location,
                    confidence: event.target.value as typeof location.confidence,
                  },
                })
              }
            >
              {Object.entries(CONFIDENCE_KEY).map(([key, labelKey]) => (
                <option key={key} value={key}>
                  {t(labelKey)}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <fieldset className="space-y-2">
          <Label>{t("extraction.needs")}</Label>
          {value.needs.map((need, index) => (
            <div key={index} className="grid grid-cols-[1fr_80px_80px_44px] gap-2">
              <Input
                aria-label={t("extraction.needName", { index: index + 1 })}
                value={need.item}
                onChange={(event) => {
                  const needs = [...value.needs];
                  needs[index] = { ...need, item: event.target.value };
                  patch({ needs });
                }}
              />
              <Input
                aria-label={t("extraction.needQuantity", { index: index + 1 })}
                type="number"
                min={0}
                value={need.quantity ?? ""}
                onChange={(event) => {
                  const needs = [...value.needs];
                  needs[index] = {
                    ...need,
                    quantity: event.target.value === "" ? null : Number(event.target.value),
                  };
                  patch({ needs });
                }}
              />
              <Input
                aria-label={t("extraction.needUnit", { index: index + 1 })}
                value={need.unit ?? ""}
                onChange={(event) => {
                  const needs = [...value.needs];
                  needs[index] = { ...need, unit: event.target.value || null };
                  patch({ needs });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("extraction.removeNeed")}
                onClick={() => patch({ needs: value.needs.filter((_, i) => i !== index) })}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              patch({ needs: [...value.needs, { item: "", quantity: null, unit: null }] })
            }
          >
            <Plus className="size-4" /> {t("extraction.addNeed")}
          </Button>
        </fieldset>

        {value.note_anomaly && (
          <p className="border border-emergency/50 p-3 text-xs text-emergency">
            {t("extraction.anomaly", { note: value.note_anomaly })}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
