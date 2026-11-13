export const META = {
  id: "sitrep.cluster.v1",
  version: "1.0.0",
  kind: "sitrep_cluster",
  model: "gemini-3.5-flash-lite",
  input: "Validated report extractions only; no raw note and no reporter identifier.",
  output: "Canonical clusters, weak clusters, and unresolved report IDs.",
};

export const SYSTEM_PROMPT = `
Anda membantu penyusunan laporan keadaan (SITREP). Masukan berisi hasil ekstraksi
tervalidasi dari laporan lapangan. Tugas Anda memadankan laporan yang menyebut kejadian
yang sama, memilih satu ID sebagai kepala klaster, dan menandai laporan yang tidak
mencukupi sebagai belum selesai.

Kepala klaster adalah ID laporan yang paling lengkap: paling banyak butuh, paling jelas
lokasi dan jumlah orang, atau yang paling awal dikirim jika setara.

Klaster wajib memuat semua ID laporan yang menyebut kejadian sama, termasuk laporan yang
mengandung angka yang bertentangan. Jangan drop laporan hanya karena nilainya berbeda;
tetap satukan, beri confidence rendah jika perbedaan tidak bisa diselesaikan.

Laporan yang tidak ada kata kunci kejadian yang cukup atau tidak memiliki data yang bisa
dipadankan harus dimasukkan ke unresolved_ids. Jangan pindahkan laporan ke klaster jika
tidak ada dasar pemadanan.

Setiap klaster wajib memuat minimal satu laporan. Jangan buat klaster kosong atau duplikat
kepala klaster di klaster lain.

Confidence merupakan kecocokan klaster sejak awal:
- high: satu atau lebih laporan dengan lokasi sama atau deskripsi sama yang saling
  memperkuat, tanpa pertentangan angka.
- medium: beberapa laporan sama-sama menyebut kejadian dengan detail parsial yang
  kembali pada satu kejadian, atau ada pertentangan ringan yang bisa dijelaskan.
- low: laporan berbeda dengan lokasi atau butuh yang tumpang tindih halus atau angka yang
  bertentangan dan tidak bisa diselesaikan; perlu tinjau manual.

Penilaian ini membantu: klaster dengan confidence di bawah 0.6 tidak diterapkan otomatis
dan diserahkan untuk tinjau. Kalau klaster hanya sementara, masih dikembalikan dengan
confidence rendah; jangan hapus hasil dan jangan pilih angka secara sembarangan.

Contoh pola yang biasanya sama-sama menyebut satu kejadian:
- Nama lokasi sama, atau nama desa/kelurahan sama meski penyebutan berbeda.
- Ringkasan dengan kata kunci kejadian sama meski urutan berbeda.
- Daftar butuh yang hampir sama.
- Jumlah orang yang hampir sama untuk satu kejadian, meski sedikit berbeda.

Contoh pola yang biasanya berbeda kejadian:
- Lokasi berbeda.
- Kategori kebutuhan sangat berbeda.
- Tidak ada kata kunci kejadian yang sama dan tidak ada data yang bisa disatukan.

Return only JSON matching the provided schema. Never invent IDs; only use the input
report IDs exactly as given. If a cluster is weak, keep it and mark confidence low; do
not remove the cluster and do not invent numbers to pretend the cluster is clean.
`;

export const USER_TEMPLATE = `Laporan tervalidasi (JSON):
<reports>
{{REPORTS}}
</reports>

Kembalikan JSON:
{"clusters":[{"canonical_id":"","duplicate_ids":[],"confidence":0,"reason":""}], "unresolved_ids":[]}
Gunakan hanya ID dari input. Satukan laporan yang menyebut kejadian sama. Jangan invent ID.`;

export const buildUserPrompt = (reports: unknown) =>
  USER_TEMPLATE.replace("{{REPORTS}}", JSON.stringify(reports));

export const TEST_CASES = [
  {
    id: "cluster_same_event",
    title: "Laporan sama dikelompokkan",
    notes: ["30 orang di desa X butuh selimut.", "Selimut untuk 30 orang di desa X."],
    schedule: null,
  },
  {
    id: "cluster_conflicting_count",
    title: "Laporan sama dengan angka bertentangan",
    notes: ["28 keluarga mengungsi di balai X.", "30 keluarga di balai X mengungsi."],
    schedule: null,
  },
  {
    id: "cluster_different_event",
    title: "Laporan berbeda tidak disatukan",
    notes: ["Air bersih dibutuhkan di desa A.", "Obat-obatan dibutuhkan di desa B."],
    schedule: null,
  },
  {
    id: "cluster_empty_note",
    title: "Laporan tanpa detail tidak disatukan",
    notes: ["Laporan tanpa detail lokasi atau kebutuhan."],
    schedule: null,
  },
  {
    id: "cluster_single_report",
    title: "Satu laporan tetap jadi klaster sendiri",
    notes: ["Satu laporan yang jelas."],
    schedule: null,
  },
  {
    id: "cluster_partial_overlap",
    title: "Tumpang tindih parsial tetap dikelompokkan",
    notes: [
      "Laporan dari desa X, butuh makanan dan air.",
      "Air bersih dibutuhkan di sekitar desa X.",
    ],
    schedule: null,
  },
  {
    id: "cluster_multi_event_mix",
    title: "Campuran beberapa kejadian dipisah",
    notes: [
      "Air bersih di desa A.",
      "Selimut di desa X.",
      "Obat-obatan di desa B.",
      "Selimut untuk 30 orang di desa X.",
    ],
    schedule: null,
  },
];
