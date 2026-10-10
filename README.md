# Manajemen Proyek — Gantt Chart

Aplikasi manajemen proyek berbasis **Gantt Chart** yang berjalan sepenuhnya di browser:
HTML + CSS + JavaScript murni, tanpa framework, tanpa backend, dan tanpa dependensi.
Data disimpan di `localStorage` browser Anda.

## Fitur

### Tahap 1 — Task Management & Gantt Chart
- Tambah, edit, dan hapus tugas: nama, durasi (hari kerja), tanggal mulai, prioritas, dan warna indikator.
- Sub-tugas berjenjang (parent–child) dengan tampilan indentasi, tombol ciutkan/perluas, dan pill jumlah sub-tugas.
- Gantt Chart visual pada timeline: kepala bulan + hari (sticky), bar berwarna, kolom akhir pekan disorot, garis merah "Hari ini", klik bar untuk mengedit.
- Penyimpanan otomatis di `localStorage` — tanpa tombol simpan.

### Tahap 2 — Predecessors & Kalender Proyek
- Hubungan antar tugas **Finish-to-Start (FS)** dan **Start-to-Start (SS)** beserta **jeda hari kerja (delay)**.
- Jadwal tugas digeser otomatis (urut topologi, siklus ditolak) — bar dan tanggal di Gantt Chart ikut menyesuaikan, lengkap dengan panah penghubung SVG.
- **Kalender Proyek**: pengaturan hari akhir pekan (mis. Sabtu/Minggu) dan hari libur khusus yang tidak dihitung sebagai hari kerja; dipakai oleh seluruh perhitungan durasi dan jadwal.

### Tahap 3 — Resource Management & Analisis Proyek
- **Anggota Tim**: pendaftaran nama, email, peran, dan gaji/bulan (divalidasi, edit/hapus).
- **Alokasi anggota ke tugas**: chip inisial di daftar tugas, nama di tooltip bar, dan estimasi biaya tenaga kerja (gaji ÷ 22 hari × durasi).
- **Critical Path**: deret ke depan & ke belakang (ES/EF/LS/LF), slack (hari kerja), penanda merah pada bar/baris/panah jalur kritis, ringkasan durasi proyek.
- **Diagram PERT**: modal jaringan SVG — kotak per tugas (durasi, slack, jadwal), panah predecessor, jalur kritis ditandai merah.

### Uji
- `uji.html` menjalankan **81 pemeriksaan otomatis** (tanggal, hari kerja, pohon tugas, kalender, predecessor, penjadwalan, anggota, alokasi, critical path, PERT, dan penyimpanan).

## Cara Install

Tidak ada dependensi atau proses build — tidak perlu `npm install`.

1. **Unduh / clone** proyek ini:
   ```bash
   git clone <url-repositori>
   cd <nama-folder>
   ```
2. Pastikan struktur berkasnya seperti ini:
   ```
   index.html      Halaman utama (buka ini)
   styles.css      Gaya
   js/logic.js     Logika murni (tanggal, kalender, predecessor, analisis)
   js/app.js       Antarmuka & interaksi
   uji.html        Harness uji otomatis
   chat-history.md Riwayat pengembangan
   ```

## Cara Menjalankan

**Cara termudah — buka langsung:**
- Klik ganda `index.html` → terbuka di browser (Chrome/Firefox/Edge), tanpa server dan tanpa internet.

**Cara opsional — lewat server lokal** (misalnya untuk akses dari perangkat lain di jaringan):
```bash
# Python 3
python -m http.server 8000
# lalu buka http://localhost:8000
```

**Menjalankan uji:**
- Klik ganda `uji.html`. Bila semua lulus, muncul banner hijau:
  **"SEMUA UJI LULUS — 81 pengujian berhasil"**.

## Data & Penyimpanan

| Kunci `localStorage` | Isi |
|---|---|
| `manajemenProyek.tugas.v1` | Daftar tugas (termasuk predecessor & alokasi) |
| `manajemenProyek.kalender.v1` | Akhir pekan & hari libur khusus |
| `manajemenProyek.anggota.v1` | Anggota tim |
| `manajemenProyek.ui.v1` | Status ciutkan/perluas baris |

> Hapus kunci-kunci tersebut (atau data situs di browser) untuk mengembalikan aplikasi ke kondisi awal.

## Keamanan

Proyek ini murni frontend — tidak ada API key, token, kredensial, atau file `.env`.
`.gitignore` telah disiapkan untuk mengecualikan `node_modules/`, `dist/`, dan file rahasia (`.env`, kunci, credentials) bila suatu saat ditambahkan.

## Teknologi

- HTML5, CSS3 (sticky layout, grid/flex), JavaScript ES5-compatible tanpa dependensi.
- SVG untuk panah Gantt dan diagram PERT.
