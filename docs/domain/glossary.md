# Glosarium Domain LENTERA

Satu istilah, satu makna. Sinonim dilarang di dalam kode.

| Istilah kode           | Definisi                                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Laporan`              | Catatan lapangan bebas dari seorang relawan yang telah atau akan diubah menjadi data terstruktur.                                                                                   |
| `Relawan`              | Pengguna yang mencatat laporan di lapangan dan hanya boleh membaca laporan dari posnya sendiri.                                                                                     |
| `Admin`                | Pengguna yang membaca laporan lintas pos dalam wilayahnya, menandai laporan bermasalah, dan menyusun SITREP, tetapi tidak menghapus laporan. Masuk lewat akun Google terverifikasi. |
| `Pos`                  | Titik kerja lapangan tempat seorang relawan bertugas, dipakai sebagai batas izin baca.                                                                                              |
| `Wilayah`              | Kabupaten atau kota yang menjadi batas agregasi peta dan SITREP.                                                                                                                    |
| `Kebutuhan Mendesak`   | Satu baris kebutuhan yang dapat dipenuhi, terdiri dari nama barang, jumlah, dan satuan.                                                                                             |
| `Tingkat Urgensi`      | Salah satu dari `critical`, `high`, `medium`, `low` yang menjelaskan seberapa cepat tindakan dibutuhkan.                                                                            |
| `Fingerprint Duplikat` | Pasangan laporan yang menggambarkan insiden yang sama, bukan sekadar lokasi yang sama, beserta skor keyakinan 0–1.                                                                  |
| `SITREP`               | Laporan situasi harian berbahasa Indonesia, maksimal 250 kata, yang setiap klaimnya dapat dibuka ke laporan sumber.                                                                 |
| `Antrean Lokal`        | Kumpulan laporan yang disimpan di perangkat dan belum tentu sudah terkirim ke Firestore.                                                                                            |
| `Konflik`              | Keadaan saat salinan laporan di server lebih baru daripada salinan lokal, sehingga penimpaan otomatis dicegah dan pengguna harus meninjau.                                          |

## Aturan penamaan

- Nama field JSON dan nilai enum selalu bahasa Inggris.
- Nilai yang dibaca manusia (ringkasan, nama kebutuhan) selalu bahasa Indonesia.
- Kode memakai istilah tabel ini; komentar boleh menjelaskan dalam bahasa
  Indonesia.
