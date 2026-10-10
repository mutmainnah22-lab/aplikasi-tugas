# Riwayat Chat — Aplikasi Manajemen Proyek (Gantt Chart)

Dokumen ini merangkum permintaan, keputusan implementasi, dan status verifikasi dari
seluruh sesi pengembangan aplikasi **Manajemen Proyek berbasis Gantt Chart**.

- **Jenis aplikasi:** website statis (HTML + CSS + JavaScript murni, tanpa framework, tanpa backend)
- **Penyimpanan:** `localStorage`
- **Bahasa antarmuka:** Indonesia
- **Berkas proyek:** `index.html`, `styles.css`, `js/logic.js`, `js/app.js`, `uji.html`

---

## Tahap 1 — Task Management & Tampilan Gantt Chart

**Permintaan:**
- Tambah/edit/hapus tugas dengan field: nama, durasi (hari kerja), tanggal mulai, prioritas, warna indikator.
- Sub-tugas (parent-child) dengan tampilan bertingkat.
- Tampilan Gantt Chart visual pada timeline.
- Simpan data di localStorage, langsung bisa dibuka di browser.

**Implementasi:**
- `js/logic.js` — logika murni tanpa DOM: parse tanggal lokal (bukan UTC), hari kerja,
  `hitungTanggalSelesai` (Sabtu/Minggu dilewati), pohon tugas (`bangunPohon`, `ratakan`),
  validasi, normalisasi, penyimpanan, dan data contoh (13 tugas).
- `js/app.js` — render daftar bertingkat (indentasi, tombol ciutkan/perluas, pill jumlah sub-tugas),
  modal form tugas, CRUD, penyimpanan.
- Gantt Chart: kepala timeline bulan + hari (sticky), bar berwarna tugas, kolom akhir pekan
  diberi abu-abu, garis merah "Hari ini", klik bar = edit, scroll dua arah,
  lebar kolom hari menyesuaikan rentang proyek.

**Perbaikan saat review:** data rusak di localStorage sempat berpotensi menghapus tugas
(diperbaiki: nilai rusak dikembalikan ke default), hover baris menutupi grid akhir pekan,
kepala bulan bisa menyusut (flex), dan tugas baru bisa tersimpan dalam kondisi terlipat.

---

## Tahap 2 — Predecessors & Kalender Proyek

**Permintaan:**
- Predecessors: hubungan Finish-to-Start (FS) dan Start-to-Start (SS) beserta jeda hari (delay),
  tanggal tugas ikut menyesuaikan di Gantt Chart.
- Kalender Proyek: pengaturan hari akhir pekan dan hari libur khusus yang tidak dihitung hari kerja.

**Implementasi:**
- Model tugas bertambah field `predecessors: [{ id, type: 'FS'|'SS', delay }]`.
- Penjadwalan otomatis `jadwalkanUlang()`: urut topologi (algoritma Kahn), lalu
  - FS: mulai = hari kerja setelah selesai prediksi + jeda
  - SS: mulai = hari kerja setelah mulai prediksi + jeda
  - Bila ada beberapa predecessor, diambil batas paling akhir.
  - Tugas tanpa predecessor tidak digeser; siklus ditolak (`urutkanTopologi` → null).
- Dijalankan saat simpan/hapus tugas, ganti kalender, muat contoh, dan saat aplikasi dibuka.
- Panah penghubung SVG di Gantt (merah bila jalur kritis pada Tahap 3).
- Kalender proyek: `{ akhirPekan: [0..6], libur: [{tanggal, nama}] }`, kunci
  `manajemenProyek.kalender.v1`; dipakai seluruh perhitungan hari kerja (durasi, batas
  predecessor, warna kolom akhir pekan).
- Modal "Kalender Proyek": checkbox 7 hari, daftar hari libur (tanggal + keterangan),
  ringkasan hari kerja, tombol Kembalikan Bawaan.
- Data contoh diberi rantai FS (Pengembangan → Pengujian → Peluncuran) dan satu SS (Wireframe).

---

## Tahap 3 — Resource Management & Analisis Proyek

**Permintaan:**
- Resource Management: pendaftaran anggota tim (nama, email, peran, gaji) dan alokasi ke tugas.
- Analisis Proyek: tampilkan Critical Path dan diagram PERT.
- Uji semua fitur Tahap 1–3.

**Implementasi:**
- Anggota tim: `{ id, nama, email, peran, gaji }`, kunci `manajemenProyek.anggota.v1`;
  validasi nama wajib, format email, gaji ≥ 0, dan email ganda ditolak.
- Alokasi: `task.anggota: [idAnggota]` — checkbox di form tugas, chip inisial di daftar tugas,
  nama anggota di tooltip bar, dan estimasi biaya tenaga kerja (gaji ÷ 22 hari × durasi).
  Menghapus anggota otomatis melepasnya dari semua tugas.
- Critical Path: `hitungAnalisis()` — deret ke depan (ES/EF) dan ke belakang (LS/LF),
  slack dalam hari kerja, jalur kritis = slack 0. Ditandai dengan bar berbingkai merah,
  baris bertanda merah, panah Gantt merah, dan ringkasan di header.
- Diagram PERT: modal berisi jaringan SVG (`tingkatJaringan()` menentukan kolom per tugas),
  kotak berisi nama, durasi, slack, dan jadwal awal–akhir; panah = predecessor;
  kotak/panah merah = jalur kritis.

---

## Struktur File

```
index.html      Halaman utama: toolbar, area Gantt, 4 modal (tugas, kalender, anggota, PERT)
styles.css      Seluruh gaya (layout sticky, timeline, bar, modal, jalur kritis, PERT)
js/logic.js     Logika murni tanpa DOM: tanggal/kalender, pohon tugas, predecessor,
                penjadwalan, analisis (critical path), jaringan PERT, anggota, penyimpanan
js/app.js       Antarmuka & interaksi (render, CRUD, modal, panah SVG, PERT)
uji.html        Harness uji otomatis di browser — 81 pemeriksaan
chat-history.md Dokumen ini
```

## Model Data & Kunci localStorage

| Kunci | Isi |
|---|---|
| `manajemenProyek.tugas.v1` | Array tugas: `id, nama, mulai, durasi, prioritas, warna, parentId, predecessors[], anggota[]` |
| `manajemenProyek.kalender.v1` | `{ akhirPekan: [0-6], libur: [{tanggal, nama}] }` |
| `manajemenProyek.anggota.v1` | Array anggota: `id, nama, email, peran, gaji` |
| `manajemenProyek.ui.v1` | Status ciutkan/perluas baris |

## Konvensi Penjadwalan

- Semua durasi dan jeda dihitung dalam **hari kerja** menurut kalender proyek.
- `0 = Minggu … 6 = Sabtu` (sesuai `Date.getDay()`), bawaan akhir pekan Sabtu & Minggu.
- FS delay 0 → tugas mulai tepat pada hari kerja berikutnya setelah prediksi selesai.
- SS delay 0 → tugas mulai pada hari yang sama dengan prediksi.
- Tugas **tanpa** predecessor mempertahankan tanggal mulai pilihan pengguna (manual),
  meski jatuh di hari libur; hanya tugas ber-predecessor yang digeser otomatis.

## Cara Menjalankan & Menguji

1. Klik ganda `index.html` — langsung terbuka di browser (tanpa server, tanpa internet).
2. Klik ganda `uji.html` — harus muncul banner hijau **"SEMUA UJI LULUS — 81 pengujian berhasil"**.
3. Opsional: `python -m http.server` lalu buka `http://localhost:8000`.

## Status Verifikasi & Keterbatasan

- Host pengembangan **tidak memiliki Bash/Git for Windows**, sehingga tidak ada eksekusi
  perintah yang bisa dijalankan dari sesi (tidak ada Node/browser CLI).
- Sebagai gantinya: harness `uji.html` (81 cek) + review silang statis menyeluruh
  (pencocokan seluruh ID elemen HTML ↔ JS, kelas CSS, hook render, dan penelusuran
  harian tanggal pada setiap ekspektasi uji).
- Belum ada hasil "lulus" yang berasal dari eksekusi program — hasil `uji.html` harus
  diverifikasi dengan membukanya di browser.

## Ide Lanjutan (belum dikerjakan)

- Ekspor laporan CSV (jadwal, anggota, jalur kritis) dan cetak PDF.
- Deteksi anggota yang kelebihan alokasi (over-allocation) berdasarkan jadwal.
- Pelacakan jalur kritis & total float yang bisa ditampilkan sebagai laporan terpisah.
- Drag bar untuk penyesuaian jadwal manual.
