import { Plus, Trash2 } from "lucide-react";
import type { Category, Extraction, Urgency } from "@/modules/reports";
import { Button } from "./ui/button";
import { Card, CardBody, CardHeader } from "./ui/card";
import { Input, Label, Select, Textarea } from "./ui/field";

const CATEGORY_LABEL: Record<Category, string> = {
  evacuation: "evakuasi",
  medical: "medis",
  food_water: "pangan & air",
  shelter: "tempat tinggal",
  infrastructure: "infrastruktur",
  logistics: "logistik",
  missing_person: "orang hilang",
  other: "lainnya",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  critical: "kritis",
  high: "tinggi",
  medium: "sedang",
  low: "rendah",
};

interface Props {
  value: Extraction;
  onChange: (next: Extraction) => void;
}

export function ExtractionCard({ value, onChange }: Props) {
  const location = value.location ?? { name: null, regency: null, confidence: "low" as const };
  const people = value.people_affected ?? { min: null, max: null };

  const patch = (next: Partial<Extraction>) => onChange({ ...value, ...next });

  return (
    <Card className="border-amber/40">
      <CardHeader>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
          Hasil ekstraksi — periksa dulu
        </h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <label className="block">
          <Label>Ringkasan</Label>
          <Textarea
            value={value.summary ?? ""}
            onChange={(event) => patch({ summary: event.target.value || null })}
            placeholder="Ringkasan laporan dalam bahasa Indonesia"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <Label>Kategori</Label>
            <Select
              value={value.category ?? ""}
              onChange={(event) =>
                patch({ category: (event.target.value || null) as Category | null })
              }
            >
              <option value="">—</option>
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <Label>Urgensi</Label>
            <Select
              value={value.urgency ?? ""}
              onChange={(event) =>
                patch({ urgency: (event.target.value || null) as Urgency | null })
              }
            >
              <option value="">—</option>
              {Object.entries(URGENCY_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <Label>Lokasi</Label>
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
            <Label>Kabupaten / kota</Label>
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
            <Label>Jiwa (min)</Label>
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
            <Label>Jiwa (maks)</Label>
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
            <Label>Keyakinan lokasi</Label>
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
              <option value="high">tinggi</option>
              <option value="medium">sedang</option>
              <option value="low">rendah</option>
            </Select>
          </label>
        </div>

        <fieldset className="space-y-2">
          <Label>Kebutuhan</Label>
          {value.needs.map((need, index) => (
            <div key={index} className="grid grid-cols-[1fr_80px_80px_44px] gap-2">
              <Input
                aria-label={`Nama kebutuhan ${index + 1}`}
                value={need.item}
                onChange={(event) => {
                  const needs = [...value.needs];
                  needs[index] = { ...need, item: event.target.value };
                  patch({ needs });
                }}
              />
              <Input
                aria-label={`Jumlah kebutuhan ${index + 1}`}
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
                aria-label={`Satuan kebutuhan ${index + 1}`}
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
                aria-label="Hapus kebutuhan"
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
            <Plus className="size-4" /> Tambah kebutuhan
          </Button>
        </fieldset>

        {value.note_anomaly && (
          <p className="border border-emergency/50 p-3 text-xs text-emergency">
            Catatan mencurigakan (disimpan apa adanya, tidak dijalankan): {value.note_anomaly}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
