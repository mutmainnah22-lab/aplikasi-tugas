/* ============================================================
   logic.js — Logika murni (tanpa DOM) untuk Manajemen Proyek
   Tanggal, hari kerja, pohon tugas (parent-child), validasi,
   penyimpanan localStorage, dan data contoh.
   ============================================================ */

(function (global) {
  'use strict';

  var KUNCI_TUGAS = 'manajemenProyek.tugas.v1';
  var KUNCI_UI = 'manajemenProyek.ui.v1';
  var KUNCI_KALENDER = 'manajemenProyek.kalender.v1';
  var KUNCI_ANGGOTA = 'manajemenProyek.anggota.v1';

  var HARI_NAMA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var TIPE_PREDECESSOR = ['FS', 'SS'];

  var PRIORITAS = {
    rendah: { label: 'Rendah', teks: '#15803d', latar: '#dcfce7' },
    sedang: { label: 'Sedang', teks: '#b45309', latar: '#fef3c7' },
    tinggi: { label: 'Tinggi', teks: '#c2410c', latar: '#ffedd5' },
    kritis: { label: 'Kritis', teks: '#b91c1c', latar: '#fee2e2' }
  };

  var DAFTAR_PRIORITAS = ['rendah', 'sedang', 'tinggi', 'kritis'];

  var WARNA_PRESET = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#f59e0b', '#16a34a', '#0d9488', '#0891b2', '#64748b'
  ];

  /* ---------- Tanggal ---------- */

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /** Parse "YYYY-MM-DD" menjadi Date lokal (bukan UTC). */
  function parseTanggal(teks) {
    if (typeof teks !== 'string') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(teks.trim());
    if (!m) return null;
    var y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return dt;
  }

  function formatTanggal(dt) {
    return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
  }

  function hariIni() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function tambahHari(dt, n) {
    var c = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    c.setDate(c.getDate() + n);
    return c;
  }

  /* ---------- Kalender proyek ---------- */

  /** Bawaan: akhir pekan Sabtu & Minggu, tanpa hari libur khusus. */
  function kalenderBawaan() {
    return { akhirPekan: [0, 6], libur: [] };
  }

  var kalenderAktif = kalenderBawaan();
  var setLibur = Object.create(null);

  /** Validasi & normalisasi kalender (hari akhir pekan + hari libur khusus). */
  function validasiKalender(v) {
    v = v || {};

    var akhirPekan = [];
    if (Object.prototype.toString.call(v.akhirPekan) === '[object Array]') {
      v.akhirPekan.forEach(function (n) {
        var i = Math.floor(Number(n));
        if (isFinite(i) && i >= 0 && i <= 6 && akhirPekan.indexOf(i) < 0) akhirPekan.push(i);
      });
    } else {
      akhirPekan = [0, 6];
    }

    var libur = [];
    var pernah = Object.create(null);
    if (Object.prototype.toString.call(v.libur) === '[object Array]') {
      v.libur.forEach(function (x) {
        var teks = (typeof x === 'string') ? x : (x && x.tanggal);
        var d = parseTanggal(typeof teks === 'string' ? teks.trim() : '');
        if (!d) return;
        var kunci = formatTanggal(d);
        if (pernah[kunci]) return;
        pernah[kunci] = true;
        var nama = (x && typeof x.nama === 'string') ? x.nama.trim().slice(0, 60) : '';
        libur.push({ tanggal: kunci, nama: nama || 'Hari libur' });
      });
    }
    libur.sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : 1; });

    return { valid: true, pesan: '', nilai: { akhirPekan: akhirPekan, libur: libur } };
  }

  function terapkanKalender(kal) {
    kalenderAktif = kal;
    setLibur = Object.create(null);
    kal.libur.forEach(function (x) { setLibur[x.tanggal] = true; });
  }

  function setKalender(kal) {
    terapkanKalender(validasiKalender(kal).nilai);
  }

  function getKalender() {
    return {
      akhirPekan: kalenderAktif.akhirPekan.slice(),
      libur: kalenderAktif.libur.map(function (x) { return { tanggal: x.tanggal, nama: x.nama }; })
    };
  }

  function muatKalender() {
    try {
      var teks = global.localStorage.getItem(KUNCI_KALENDER);
      if (teks === null || teks === undefined) return null;
      return validasiKalender(JSON.parse(teks)).nilai;
    } catch (e) {
      return null;
    }
  }

  function simpanKalender(kal) {
    try {
      global.localStorage.setItem(KUNCI_KALENDER, JSON.stringify(validasiKalender(kal).nilai));
      return true;
    } catch (e) {
      return false;
    }
  }

  function hapusKalender() {
    try {
      global.localStorage.removeItem(KUNCI_KALENDER);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * true jika tanggal adalah hari kerja menurut kalender proyek
   * (bukan hari akhir pekan dan bukan hari libur khusus).
   */
  function hariKerja(dt) {
    if (kalenderAktif.akhirPekan.indexOf(dt.getDay()) >= 0) return false;
    if (setLibur[formatTanggal(dt)]) return false;
    return true;
  }

  /** Ringkasan hari kerja, contoh: "Senin, Selasa, ..., Jumat". */
  function ringkasHariKerja(kal) {
    var k = kal || kalenderAktif;
    var kerja = [];
    for (var i = 0; i < 7; i++) {
      if (k.akhirPekan.indexOf(i) < 0) kerja.push(HARI_NAMA[i]);
    }
    var teks;
    if (kerja.length === 7) teks = 'Semua hari';
    else if (kerja.length === 0) teks = 'Tanpa hari kerja';
    else if (kerja.length <= 3) teks = kerja.join(', ');
    else teks = kerja[0] + '\u2013' + kerja[kerja.length - 1];
    return teks + (k.libur.length ? ' + ' + k.libur.length + ' hari libur khusus' : '');
  }

  function selisihHari(a, b) {
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  /**
   * Hitung tanggal selesai dari tanggal mulai + durasi hari kerja.
   * Hari mulai dihitung sebagai hari pertama bila hari kerja;
   * bila jatuh di akhir pekan, penghitungan mulai dari hari kerja terdekat.
   */
  function hitungTanggalSelesai(mulaiTeks, durasi) {
    var mulai = parseTanggal(mulaiTeks);
    if (!mulai) return null;
    var sisa = Math.floor(Number(durasi));
    if (!isFinite(sisa) || sisa < 1) sisa = 1;
    var d = mulai;
    if (hariKerja(d)) sisa -= 1;
    var jaga = 0;
    while (sisa > 0 && jaga < 5000) {
      d = tambahHari(d, 1);
      if (hariKerja(d)) sisa -= 1;
      jaga += 1;
    }
    return formatTanggal(d);
  }

  /** Jumlah hari kerja inklusif antara dua tanggal. */
  function hitungHariKerja(mulaiTeks, selesaiTeks) {
    var a = parseTanggal(mulaiTeks);
    var b = parseTanggal(selesaiTeks);
    if (!a || !b || b < a) return 0;
    var n = selisihHari(a, b);
    var hitung = 0;
    for (var i = 0; i <= n; i++) {
      if (hariKerja(tambahHari(a, i))) hitung += 1;
    }
    return hitung;
  }

  /** Tambah n hari kerja (n >= 0) dari sebuah tanggal. */
  function tambahHariKerja(dt, n) {
    var d = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    var i = 0, jaga = 0;
    while (i < n && jaga < 5000) {
      d = tambahHari(d, 1);
      if (hariKerja(d)) i += 1;
      jaga += 1;
    }
    return d;
  }

  /** Mundur n hari kerja dari sebuah tanggal (n >= 0). */
  function mundurHariKerja(dt, n) {
    var d = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    var i = 0, jaga = 0;
    while (i < n && jaga < 5000) {
      d = tambahHari(d, -1);
      if (hariKerja(d)) i += 1;
      jaga += 1;
    }
    return d;
  }

  /** Hari kerja pertama pada atau setelah tanggal tsb. */
  function hariKerjaPertama(dasar) {
    var d = new Date(dasar.getFullYear(), dasar.getMonth(), dasar.getDate());
    var jaga = 0;
    while (!hariKerja(d) && jaga < 7) {
      d = tambahHari(d, 1);
      jaga += 1;
    }
    return d;
  }

  /* ---------- Pohon tugas ---------- */

  /**
   * Susun daftar tugas datar menjadi pohon.
   * Id induk yang yatim atau bersiklus ditampilkan sebagai tugas utama,
   * sehingga tidak ada tugas yang hilang dari tampilan.
   */
  function bangunPohon(tugas) {
    var map = new Map();
    (tugas || []).forEach(function (t) {
      if (t && t.id && !map.has(t.id)) map.set(t.id, { task: t, anak: [] });
    });
    var akar = [];
    map.forEach(function (entri) {
      var id = entri.task.id;
      var cur = entri.task.parentId || null;
      var kunjungan = new Set([id]);
      var induk = null;
      while (cur) {
        if (kunjungan.has(cur)) { induk = null; break; }
        kunjungan.add(cur);
        var p = map.get(cur);
        if (!p) { induk = null; break; }
        induk = p;
        cur = p.task.parentId || null;
      }
      if (induk) induk.anak.push(entri);
      else akar.push(entri);
    });
    return akar;
  }

  /** Bentuk daftar datar bertingkat (dengan info lipat). */
  function ratakan(pohon, terlipat) {
    var hasil = [];
    function jalan(nodes, level) {
      nodes.forEach(function (n) {
        var punyaAnak = n.anak.length > 0;
        var lipat = !!(terlipat && typeof terlipat.has === 'function' && terlipat.has(n.task.id));
        hasil.push({
          tugas: n.task,
          level: level,
          punyaAnak: punyaAnak,
          terlipat: lipat,
          jumlahAnak: n.anak.length
        });
        if (punyaAnak && !lipat) jalan(n.anak, level + 1);
      });
    }
    jalan(pohon || [], 0);
    return hasil;
  }

  /** Semua id turunan (sub-tugas berjenjang) dari sebuah tugas. */
  function turunan(tugas, id) {
    var anakDari = Object.create(null);
    (tugas || []).forEach(function (t) {
      if (t && t.parentId) {
        (anakDari[t.parentId] = anakDari[t.parentId] || []).push(t.id);
      }
    });
    var hasil = [];
    var antre = [id];
    var jaga = 0;
    while (antre.length && jaga < 5000) {
      var cur = antre.shift();
      var anak = anakDari[cur] || [];
      anak.forEach(function (x) {
        hasil.push(x);
        antre.push(x);
      });
      jaga += 1;
    }
    return hasil;
  }

  /**
   * true jika menjadikan parentIdBaru sebagai induk dari id akan membuat siklus.
   * parentIdBaru null/false dianggap tidak berisiko.
   */
  function punyaSiklus(tugas, id, parentIdBaru) {
    if (!parentIdBaru) return false;
    if (parentIdBaru === id) return true;
    var indukDari = Object.create(null);
    (tugas || []).forEach(function (t) {
      if (!t || !t.id) return;
      indukDari[t.id] = (t.id === id) ? parentIdBaru : (t.parentId || null);
    });
    var kunjungan = Object.create(null);
    var cur = parentIdBaru;
    var jaga = 0;
    while (cur && jaga < 1000) {
      if (kunjungan[cur]) return true;
      if (cur === id) return true;
      kunjungan[cur] = true;
      cur = indukDari[cur] || null;
      jaga += 1;
    }
    return false;
  }

  /* ---------- Validasi & normalisasi ---------- */

  var RE_WARNA = /^#[0-9a-fA-F]{6}$/;

  function validasiTugas(v) {
    v = v || {};
    var nama = typeof v.nama === 'string' ? v.nama.trim() : '';
    if (!nama) return { valid: false, pesan: 'Nama tugas wajib diisi.' };
    if (nama.length > 100) return { valid: false, pesan: 'Nama tugas maksimal 100 karakter.' };

    var mulai = parseTanggal(v.mulai);
    if (!mulai) return { valid: false, pesan: 'Tanggal mulai tidak valid.' };

    var durasi = Math.floor(Number(v.durasi));
    if (!isFinite(durasi)) return { valid: false, pesan: 'Durasi harus berupa angka.' };
    if (durasi < 1) return { valid: false, pesan: 'Durasi minimal 1 hari kerja.' };
    if (durasi > 365) return { valid: false, pesan: 'Durasi maksimal 365 hari kerja.' };

    var prioritas = v.prioritas;
    if (DAFTAR_PRIORITAS.indexOf(prioritas) < 0) prioritas = 'sedang';

    var warna = (typeof v.warna === 'string' && RE_WARNA.test(v.warna.trim()))
      ? v.warna.trim().toLowerCase()
      : '#3b82f6';

    var parentId = (typeof v.parentId === 'string' && v.parentId) ? v.parentId : null;

    return {
      valid: true,
      pesan: '',
      nilai: {
        nama: nama,
        mulai: formatTanggal(mulai),
        durasi: durasi,
        prioritas: prioritas,
        warna: warna,
        parentId: parentId
      }
    };
  }

  function buatId() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /**
   * Tugas yang sudah dinormalisasi, atau null bila tidak bisa dipakai
   * (nama kosong / bukan objek). Nilai rusak di sisi lain diperbaiki
   * ke nilai bawaan supaya satu data jelek tidak menghapus tugas lain.
   */
  function normalisasiTugas(t) {
    if (!t || typeof t !== 'object') return null;

    var nama = typeof t.nama === 'string' ? t.nama.trim().slice(0, 100) : '';
    if (!nama) return null;

    var mulai = parseTanggal(t.mulai);
    if (!mulai) mulai = hariIni();

    var durasi = Math.floor(Number(t.durasi));
    if (!isFinite(durasi) || durasi < 1) durasi = 1;
    if (durasi > 365) durasi = 365;

    var prioritas = (DAFTAR_PRIORITAS.indexOf(t.prioritas) >= 0) ? t.prioritas : 'sedang';
    var warna = (typeof t.warna === 'string' && RE_WARNA.test(t.warna.trim()))
      ? t.warna.trim().toLowerCase()
      : '#3b82f6';
    var parentId = (typeof t.parentId === 'string' && t.parentId) ? t.parentId : null;
    var predecessors = normalisasiPredecessors(t.predecessors);
    var anggota = normalisasiAlokasi(t.anggota);
    var id = (typeof t.id === 'string' && t.id) ? t.id : buatId();

    return {
      id: id,
      nama: nama,
      mulai: formatTanggal(mulai),
      durasi: durasi,
      prioritas: prioritas,
      warna: warna,
      parentId: parentId,
      predecessors: predecessors,
      anggota: anggota
    };
  }

  /* ---------- Penyimpanan ---------- */

  function muatTugas() {
    var teks;
    try {
      teks = global.localStorage.getItem(KUNCI_TUGAS);
    } catch (e) {
      return null;
    }
    if (teks === null || teks === undefined) return null;

    var data;
    try {
      data = JSON.parse(teks);
    } catch (e2) {
      return [];
    }
    if (!data || Object.prototype.toString.call(data) !== '[object Array]') return [];

    var hasil = [];
    data.forEach(function (x) {
      var n = normalisasiTugas(x);
      if (n) hasil.push(n);
    });

    var adaId = Object.create(null);
    hasil.forEach(function (x) { adaId[x.id] = true; });

    var unik = Object.create(null);
    hasil = hasil.filter(function (x) {
      if (unik[x.id]) return false;
      unik[x.id] = true;
      return true;
    });

    hasil.forEach(function (x) {
      if (x.parentId && (x.parentId === x.id || !adaId[x.parentId])) x.parentId = null;
      x.predecessors = normalisasiPredecessors(x.predecessors).filter(function (p) {
        return p.id !== x.id && adaId[p.id];
      });
    });

    return hasil;
  }

  function simpanTugas(tugas) {
    try {
      global.localStorage.setItem(KUNCI_TUGAS, JSON.stringify(tugas || []));
      return true;
    } catch (e) {
      return false;
    }
  }

  function hapusPenyimpanan() {
    try {
      global.localStorage.removeItem(KUNCI_TUGAS);
      return true;
    } catch (e) {
      return false;
    }
  }

  function muatUi() {
    try {
      var teks = global.localStorage.getItem(KUNCI_UI);
      if (!teks) return { terlipat: [] };
      var data = JSON.parse(teks);
      if (!data || Object.prototype.toString.call(data.terlipat) !== '[object Array]') {
        return { terlipat: [] };
      }
      return { terlipat: data.terlipat.filter(function (x) { return typeof x === 'string'; }) };
    } catch (e) {
      return { terlipat: [] };
    }
  }

  function simpanUi(terlipat) {
    try {
      var arr = [];
      if (terlipat && typeof terlipat.forEach === 'function') {
        terlipat.forEach(function (x) { arr.push(x); });
      }
      global.localStorage.setItem(KUNCI_UI, JSON.stringify({ terlipat: arr }));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- Predecessor & penjadwalan ulang ---------- */

  /**
   * Versi longgar untuk data tersimpan: buang entri rusak,
   * jeda dibatasi 0\u2013365, dan satu tugas hanya muncul sekali.
   */
  function normalisasiPredecessors(v) {
    if (Object.prototype.toString.call(v) !== '[object Array]') return [];
    var unik = Object.create(null);
    var hasil = [];
    v.forEach(function (p) {
      if (!p || typeof p !== 'object') return;
      var id = typeof p.id === 'string' ? p.id : '';
      if (!id || unik[id]) return;
      var type = (TIPE_PREDECESSOR.indexOf(p.type) >= 0) ? p.type : 'FS';
      var delay = Math.floor(Number(p.delay));
      if (!isFinite(delay) || delay < 0) delay = 0;
      if (delay > 365) delay = 365;
      unik[id] = true;
      hasil.push({ id: id, type: type, delay: delay });
    });
    return hasil;
  }

  /** Validasi ketat untuk input pengguna (pesan dalam bahasa Indonesia). */
  function validasiPredecessors(v) {
    if (v === null || v === undefined) return { valid: true, pesan: '', nilai: [] };
    if (Object.prototype.toString.call(v) !== '[object Array]') {
      return { valid: false, pesan: 'Daftar predecessor tidak valid.' };
    }
    var unik = Object.create(null);
    var hasil = [];
    for (var i = 0; i < v.length; i++) {
      var p = v[i] || {};
      var id = typeof p.id === 'string' ? p.id : '';
      if (!id) return { valid: false, pesan: 'Predecessor harus menunjuk ke tugas yang ada.' };
      if (unik[id]) return { valid: false, pesan: 'Ada predecessor ganda untuk tugas yang sama.' };
      if (TIPE_PREDECESSOR.indexOf(p.type) < 0) {
        return { valid: false, pesan: 'Jenis hubungan harus FS atau SS.' };
      }
      var delay = Math.floor(Number(p.delay));
      if (!isFinite(delay) || delay < 0) {
        return { valid: false, pesan: 'Jeda harus berupa angka 0 atau lebih.' };
      }
      if (delay > 365) return { valid: false, pesan: 'Jeda maksimal 365 hari kerja.' };
      unik[id] = true;
      hasil.push({ id: id, type: p.type, delay: delay });
    }
    return { valid: true, pesan: '', nilai: hasil };
  }

  /**
   * Urutkan tugas mengikuti hubungan predecessor (algoritma Kahn).
   * Mengembalikan daftar tugas terurut, atau null bila ada siklus.
   */
  function urutkanTopologi(daftar) {
    var peta = Object.create(null);
    var indeg = Object.create(null);
    var anak = Object.create(null);
    var semua = [];

    (daftar || []).forEach(function (t) {
      if (!t || !t.id || peta[t.id]) return;
      peta[t.id] = t;
      indeg[t.id] = 0;
      anak[t.id] = [];
      semua.push(t);
    });

    semua.forEach(function (t) {
      normalisasiPredecessors(t.predecessors).forEach(function (p) {
        if (!(p.id in indeg) || p.id === t.id) return;
        anak[p.id].push(t.id);
        indeg[t.id] += 1;
      });
    });

    var hasil = [];
    var antre = [];
    semua.forEach(function (t) { if (indeg[t.id] === 0) antre.push(t.id); });

    var pos = 0;
    while (pos < antre.length) {
      var id = antre[pos];
      pos += 1;
      hasil.push(peta[id]);
      anak[id].forEach(function (k) {
        indeg[k] -= 1;
        if (indeg[k] === 0) antre.push(k);
      });
    }

    if (hasil.length !== semua.length) return null;
    return hasil;
  }

  /**
   * Sesuaikan tanggal mulai tugas yang memiliki predecessor:
   *   FS : mulai = hari kerja setelah selesai prediksi, ditambah jeda hari kerja
   *   SS : mulai = hari kerja setelah mulai prediksi, ditambah jeda hari kerja
   * Bila ada beberapa predecessor, diambil batas yang paling akhir.
   * Tugas tanpa predecessor tidak digeser.
   * Mengembalikan { ok, pesan, diubah }.
   */
  function jadwalkanUlang(daftar) {
    var urut = urutkanTopologi(daftar);
    if (!urut) return { ok: false, pesan: 'Ditemukan siklus hubungan predecessor.', diubah: 0 };

    var peta = Object.create(null);
    (daftar || []).forEach(function (t) { peta[t.id] = t; });

    var tanggalMulai = Object.create(null);
    var tanggalSelesai = Object.create(null);
    var diubah = 0;

    urut.forEach(function (t) {
      var batas = null;
      normalisasiPredecessors(t.predecessors).forEach(function (p) {
        var pr = peta[p.id];
        if (!pr || !tanggalMulai[p.id]) return;
        var kandidat = (p.type === 'SS')
          ? tambahHariKerja(parseTanggal(tanggalMulai[p.id]), p.delay)
          : tambahHariKerja(parseTanggal(tanggalSelesai[p.id]), p.delay + 1);
        if (!batas || kandidat.getTime() > batas.getTime()) batas = kandidat;
      });

      if (batas) {
        var baru = formatTanggal(batas);
        if (baru !== t.mulai) {
          t.mulai = baru;
          diubah += 1;
        }
      }

      tanggalMulai[t.id] = t.mulai;
      tanggalSelesai[t.id] = hitungTanggalSelesai(t.mulai, t.durasi);
    });

    return { ok: true, pesan: '', diubah: diubah };
  }

  /* ---------- Anggota tim & alokasi ---------- */

  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function contohAnggota() {
    return [
      { id: 'a1', nama: 'Sari Wulandari', email: 'sari@example.com', peran: 'Analis Sistem', gaji: 9000000 },
      { id: 'a2', nama: 'Andi Pratama', email: 'andi@example.com', peran: 'UI/UX Designer', gaji: 8500000 },
      { id: 'a3', nama: 'Rina Kartika', email: 'rina@example.com', peran: 'Backend Developer', gaji: 11000000 },
      { id: 'a4', nama: 'Dimas Nugroho', email: 'dimas@example.com', peran: 'QA Engineer', gaji: 8000000 }
    ];
  }

  /** Versi longgar untuk data tersimpan: nilai rusak dibetulkan. */
  function normalisasiAnggota(a) {
    if (!a || typeof a !== 'object') return null;

    var nama = typeof a.nama === 'string' ? a.nama.trim().slice(0, 80) : '';
    if (!nama) return null;

    var email = typeof a.email === 'string' ? a.email.trim().toLowerCase() : '';
    if (!RE_EMAIL.test(email)) email = '';

    var peran = typeof a.peran === 'string' ? a.peran.trim().slice(0, 60) : '';
    if (!peran) peran = 'Anggota Tim';

    var gaji = Number(a.gaji);
    if (!isFinite(gaji) || gaji < 0) gaji = 0;
    if (gaji > 1000000000000) gaji = 1000000000000;
    gaji = Math.round(gaji);

    var id = (typeof a.id === 'string' && a.id) ? a.id : buatId();
    return { id: id, nama: nama, email: email, peran: peran, gaji: gaji };
  }

  /** Validasi ketat untuk input pengguna. */
  function validasiAnggota(v, semua, idEdit) {
    v = v || {};

    var nama = typeof v.nama === 'string' ? v.nama.trim() : '';
    if (!nama) return { valid: false, pesan: 'Nama anggota wajib diisi.' };
    if (nama.length > 80) return { valid: false, pesan: 'Nama anggota maksimal 80 karakter.' };

    var email = typeof v.email === 'string' ? v.email.trim().toLowerCase() : '';
    if (!email) return { valid: false, pesan: 'Email anggota wajib diisi.' };
    if (!RE_EMAIL.test(email)) return { valid: false, pesan: 'Format email tidak valid.' };

    var bentrok = (semua || []).some(function (x) {
      return !!(x && x.email && x.email === email && x.id !== idEdit);
    });
    if (bentrok) return { valid: false, pesan: 'Email tersebut sudah dipakai anggota lain.' };

    var peran = typeof v.peran === 'string' ? v.peran.trim().slice(0, 60) : '';
    if (!peran) peran = 'Anggota Tim';

    var gaji = Number(v.gaji);
    if (!isFinite(gaji) || gaji < 0) return { valid: false, pesan: 'Gaji harus berupa angka 0 atau lebih.' };
    if (gaji > 1000000000000) return { valid: false, pesan: 'Gaji terlalu besar.' };

    return {
      valid: true,
      pesan: '',
      nilai: { nama: nama, email: email, peran: peran, gaji: Math.round(gaji) }
    };
  }

  function muatAnggota() {
    try {
      var teks = global.localStorage.getItem(KUNCI_ANGGOTA);
      if (teks === null || teks === undefined) return null;
      var data = JSON.parse(teks);
      if (!data || Object.prototype.toString.call(data) !== '[object Array]') return [];
      var hasil = [];
      var unik = Object.create(null);
      data.forEach(function (x) {
        var n = normalisasiAnggota(x);
        if (!n || unik[n.id]) return;
        unik[n.id] = true;
        hasil.push(n);
      });
      return hasil;
    } catch (e) {
      return null;
    }
  }

  function simpanAnggota(list) {
    try {
      global.localStorage.setItem(KUNCI_ANGGOTA, JSON.stringify(list || []));
      return true;
    } catch (e) {
      return false;
    }
  }

  function hapusPenyimpananAnggota() {
    try {
      global.localStorage.removeItem(KUNCI_ANGGOTA);
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Daftar id anggota yang dialokasikan (unik, hanya string). */
  function normalisasiAlokasi(v) {
    if (Object.prototype.toString.call(v) !== '[object Array]') return [];
    var unik = Object.create(null);
    var hasil = [];
    v.forEach(function (x) {
      if (typeof x !== 'string' || !x || unik[x]) return;
      unik[x] = true;
      hasil.push(x);
    });
    return hasil;
  }

  /* ---------- Analisis proyek (Critical Path & PERT) ---------- */

  /**
   * Hitung waktu paling awal & paling akhir tiap tugas, slack, dan jalur kritis.
   * FS : mulai tugas = hari kerja setelah selesai prediksi + jeda
   * SS : mulai tugas = hari kerja setelah mulai prediksi + jeda
   * Mengembalikan { ok, pesan, proyekMulai, proyekSelesai, hariKerjaProyek,
   *                 tugas, jalurKritis, urutan }.
   */
  function hitungAnalisis(daftar) {
    var urut = urutkanTopologi(daftar);
    if (!urut) return { ok: false, pesan: 'Ditemukan siklus hubungan predecessor.' };

    var peta = Object.create(null);
    (daftar || []).forEach(function (t) { if (t && t.id) peta[t.id] = t; });

    /* Deret ke depan: waktu paling awal */
    var mulaiAwal = Object.create(null);
    var selesaiAwal = Object.create(null);
    var proyekMulai = null;
    var proyekSelesai = null;

    urut.forEach(function (t) {
      var batas = null;
      normalisasiPredecessors(t.predecessors).forEach(function (p) {
        if (!peta[p.id] || !mulaiAwal[p.id]) return;
        var kandidat = (p.type === 'SS')
          ? tambahHariKerja(parseTanggal(mulaiAwal[p.id]), p.delay)
          : tambahHariKerja(parseTanggal(selesaiAwal[p.id]), p.delay + 1);
        if (!batas || kandidat.getTime() > batas.getTime()) batas = kandidat;
      });

      mulaiAwal[t.id] = batas ? formatTanggal(batas) : t.mulai;
      selesaiAwal[t.id] = hitungTanggalSelesai(mulaiAwal[t.id], t.durasi);
      if (!proyekMulai || mulaiAwal[t.id] < proyekMulai) proyekMulai = mulaiAwal[t.id];
      if (!proyekSelesai || selesaiAwal[t.id] > proyekSelesai) proyekSelesai = selesaiAwal[t.id];
    });

    /* Deret ke belakang: waktu paling akhir */
    var selesaiAkhir = Object.create(null);
    urut.forEach(function (t) { selesaiAkhir[t.id] = proyekSelesai; });

    var i;
    for (i = urut.length - 1; i >= 0; i--) {
      var t = urut[i];
      var mulaiAkhir = mundurHariKerja(parseTanggal(selesaiAkhir[t.id]), t.durasi - 1);
      normalisasiPredecessors(t.predecessors).forEach(function (p) {
        if (!peta[p.id]) return;
        var kandidat;
        if (p.type === 'SS') {
          var mulaiPred = mundurHariKerja(mulaiAkhir, p.delay);
          kandidat = tambahHariKerja(mulaiPred, peta[p.id].durasi - 1);
        } else {
          kandidat = mundurHariKerja(mulaiAkhir, p.delay + 1);
        }
        if (kandidat.getTime() < parseTanggal(selesaiAkhir[p.id]).getTime()) {
          selesaiAkhir[p.id] = formatTanggal(kandidat);
        }
      });
    }

    var hasil = Object.create(null);
    urut.forEach(function (t) {
      if (selesaiAkhir[t.id] < selesaiAwal[t.id]) selesaiAkhir[t.id] = selesaiAwal[t.id];
      var mulaiAkhirTeks = formatTanggal(
        mundurHariKerja(parseTanggal(selesaiAkhir[t.id]), t.durasi - 1));
      if (mulaiAkhirTeks < mulaiAwal[t.id]) mulaiAkhirTeks = mulaiAwal[t.id];

      var slack = hitungHariKerja(mulaiAwal[t.id], mulaiAkhirTeks) - 1;
      if (slack < 0) slack = 0;

      hasil[t.id] = {
        mulai: mulaiAwal[t.id],
        selesai: selesaiAwal[t.id],
        mulaiAkhir: mulaiAkhirTeks,
        selesaiAkhir: selesaiAkhir[t.id],
        slack: slack,
        kritis: slack === 0
      };
    });

    var jalur = [];
    urut.forEach(function (t) { if (hasil[t.id].kritis) jalur.push(t.id); });

    return {
      ok: true,
      pesan: '',
      proyekMulai: proyekMulai,
      proyekSelesai: proyekSelesai,
      hariKerjaProyek: hitungHariKerja(proyekMulai, proyekSelesai),
      tugas: hasil,
      jalurKritis: jalur,
      urutan: urut.map(function (t) { return t.id; })
    };
  }

  /**
   * Tingkat (kolom) tiap tugas untuk diagram PERT:
   * 0 untuk tugas tanpa predecessor, selainnya = maksimum tingkat prediksi + 1.
   */
  function tingkatJaringan(daftar) {
    var urut = urutkanTopologi(daftar);
    if (!urut) {
      return { ok: false, pesan: 'Ditemukan siklus hubungan predecessor.', tingkat: {}, kolom: 0 };
    }

    var peta = Object.create(null);
    (daftar || []).forEach(function (t) { if (t && t.id) peta[t.id] = t; });

    var tingkat = Object.create(null);
    var kolomMaks = 0;

    urut.forEach(function (t) {
      var maks = 0;
      var punyaPred = false;
      normalisasiPredecessors(t.predecessors).forEach(function (p) {
        if (!peta[p.id] || tingkat[p.id] === undefined) return;
        punyaPred = true;
        if (tingkat[p.id] + 1 > maks) maks = tingkat[p.id] + 1;
      });
      tingkat[t.id] = punyaPred ? maks : 0;
      if (tingkat[t.id] > kolomMaks) kolomMaks = tingkat[t.id];
    });

    return { ok: true, pesan: '', tingkat: tingkat, kolom: kolomMaks + 1 };
  }

  /* ---------- Data contoh ---------- */

  function contohTugas() {
    var awal = hariKerjaPertama(hariIni());
    function h(n) { return formatTanggal(tambahHariKerja(awal, n)); }

    return [
      { id: 'c1', nama: 'Perencanaan Proyek', mulai: h(0), durasi: 5, prioritas: 'tinggi', warna: '#8b5cf6', parentId: null, anggota: [] },
      { id: 'c2', nama: 'Analisis kebutuhan', mulai: h(0), durasi: 2, prioritas: 'sedang', warna: '#3b82f6', parentId: 'c1', anggota: ['a1'] },
      { id: 'c3', nama: 'Penyusunan ruang lingkup', mulai: h(2), durasi: 3, prioritas: 'sedang', warna: '#3b82f6', parentId: 'c1', anggota: ['a1'] },
      { id: 'c4', nama: 'Desain Antarmuka', mulai: h(5), durasi: 6, prioritas: 'tinggi', warna: '#ec4899', parentId: null, anggota: ['a2'] },
      { id: 'c5', nama: 'Wireframe', mulai: h(5), durasi: 2, prioritas: 'rendah', warna: '#0d9488', parentId: 'c4', predecessors: [{ id: 'c4', type: 'SS', delay: 0 }], anggota: ['a2'] },
      { id: 'c6', nama: 'Desain UI', mulai: h(7), durasi: 4, prioritas: 'tinggi', warna: '#0d9488', parentId: 'c4', anggota: ['a2'] },
      { id: 'c7', nama: 'Pengembangan', mulai: h(8), durasi: 12, prioritas: 'kritis', warna: '#f97316', parentId: null, anggota: ['a3'] },
      { id: 'c8', nama: 'Penyiapan lingkungan', mulai: h(8), durasi: 2, prioritas: 'rendah', warna: '#64748b', parentId: 'c7', anggota: ['a3'] },
      { id: 'c9', nama: 'Halaman katalog', mulai: h(10), durasi: 5, prioritas: 'tinggi', warna: '#64748b', parentId: 'c7', anggota: ['a3'] },
      { id: 'c10', nama: 'Halaman pembayaran', mulai: h(13), durasi: 6, prioritas: 'kritis', warna: '#64748b', parentId: 'c7', anggota: ['a3'] },
      { id: 'c11', nama: 'Pengujian & Peluncuran', mulai: h(18), durasi: 5, prioritas: 'tinggi', warna: '#16a34a', parentId: null, predecessors: [{ id: 'c7', type: 'FS', delay: 0 }], anggota: ['a4'] },
      { id: 'c12', nama: 'Pengujian fungsional', mulai: h(18), durasi: 3, prioritas: 'sedang', warna: '#16a34a', parentId: 'c11', predecessors: [{ id: 'c11', type: 'FS', delay: 0 }], anggota: ['a4'] },
      { id: 'c13', nama: 'Peluncuran produksi', mulai: h(21), durasi: 1, prioritas: 'kritis', warna: '#16a34a', parentId: 'c11', predecessors: [{ id: 'c12', type: 'FS', delay: 0 }], anggota: ['a3', 'a4'] }
    ];
  }

  global.GanttLogika = {
    KUNCI_TUGAS: KUNCI_TUGAS,
    KUNCI_UI: KUNCI_UI,
    KUNCI_KALENDER: KUNCI_KALENDER,
    KUNCI_ANGGOTA: KUNCI_ANGGOTA,
    HARI_NAMA: HARI_NAMA,
    TIPE_PREDECESSOR: TIPE_PREDECESSOR,
    PRIORITAS: PRIORITAS,
    DAFTAR_PRIORITAS: DAFTAR_PRIORITAS,
    WARNA_PRESET: WARNA_PRESET,
    parseTanggal: parseTanggal,
    formatTanggal: formatTanggal,
    hariIni: hariIni,
    tambahHari: tambahHari,
    hariKerja: hariKerja,
    selisihHari: selisihHari,
    hitungTanggalSelesai: hitungTanggalSelesai,
    hitungHariKerja: hitungHariKerja,
    tambahHariKerja: tambahHariKerja,
    mundurHariKerja: mundurHariKerja,
    hariKerjaPertama: hariKerjaPertama,
    bangunPohon: bangunPohon,
    ratakan: ratakan,
    turunan: turunan,
    punyaSiklus: punyaSiklus,
    validasiTugas: validasiTugas,
    normalisasiTugas: normalisasiTugas,
    buatId: buatId,
    muatTugas: muatTugas,
    simpanTugas: simpanTugas,
    hapusPenyimpanan: hapusPenyimpanan,
    muatUi: muatUi,
    simpanUi: simpanUi,
    kalenderBawaan: kalenderBawaan,
    validasiKalender: validasiKalender,
    setKalender: setKalender,
    getKalender: getKalender,
    muatKalender: muatKalender,
    simpanKalender: simpanKalender,
    hapusKalender: hapusKalender,
    ringkasHariKerja: ringkasHariKerja,
    normalisasiPredecessors: normalisasiPredecessors,
    validasiPredecessors: validasiPredecessors,
    urutkanTopologi: urutkanTopologi,
    jadwalkanUlang: jadwalkanUlang,
    contohAnggota: contohAnggota,
    normalisasiAnggota: normalisasiAnggota,
    validasiAnggota: validasiAnggota,
    muatAnggota: muatAnggota,
    simpanAnggota: simpanAnggota,
    hapusPenyimpananAnggota: hapusPenyimpananAnggota,
    normalisasiAlokasi: normalisasiAlokasi,
    hitungAnalisis: hitungAnalisis,
    tingkatJaringan: tingkatJaringan,
    contohTugas: contohTugas
  };
})(typeof window !== 'undefined' ? window : this);
