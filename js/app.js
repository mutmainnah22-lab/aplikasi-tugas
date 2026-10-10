/* ============================================================
   app.js — Antarmuka Manajemen Proyek (Gantt Chart)
   Render daftar tugas bertingkat + timeline Gantt + CRUD.
   ============================================================ */

(function () {
  'use strict';

  var L = window.GanttLogika;
  if (!L) {
    var s0 = document.getElementById('statInfo');
    if (s0) s0.textContent = 'Gagal memuat js/logic.js';
    return;
  }

  function $(id) { return document.getElementById(id); }

  var elStat = $('statInfo');
  var elBtnTambah = $('btnTambah');
  var elBtnBuka = $('btnBukaSemua');
  var elBtnLipat = $('btnLipatSemua');
  var elBtnHapusSemua = $('btnHapusSemua');
  var elDalam = $('ganttDalam');
  var elBarisBulan = $('barisBulan');
  var elBarisHari = $('barisHari');
  var elPenanda = $('penandaHariIni');
  var elGaris = $('garisHariIni');
  var elLatar = $('latarTimeline');
  var elWadah = $('wadahBaris');
  var elModalLatar = $('modalLatar');
  var elModalJudul = $('modalJudul');
  var elForm = $('formTugas');
  var elFNama = $('fNama');
  var elFMulai = $('fMulai');
  var elFDurasi = $('fDurasi');
  var elFPrioritas = $('fPrioritas');
  var elFInduk = $('fInduk');
  var elFWarna = $('fWarna');
  var elPreset = $('presetWarna');
  var elPratinjau = $('pratinjauSelesai');
  var elGalat = $('pesanGalat');
  var elBtnBatal = $('btnBatal');
  var elBtnSimpan = $('btnSimpan');
  var elBtnKalender = $('btnKalender');
  var elSvgPanah = $('svgPanah');
  var elFPredTugas = $('fPredTugas');
  var elFPredTipe = $('fPredTipe');
  var elFPredJeda = $('fPredJeda');
  var elBtnTambahPred = $('btnTambahPred');
  var elDaftarPred = $('daftarPred');
  var elCatatanPred = $('catatanPred');
  var elModalKalender = $('modalKalenderLatar');
  var elFormKalender = $('formKalender');
  var elPilihanHari = $('pilihanHari');
  var elFLiburTanggal = $('fLiburTanggal');
  var elFLiburNama = $('fLiburNama');
  var elBtnTambahLibur = $('btnTambahLibur');
  var elDaftarLibur = $('daftarLibur');
  var elRingkasKalender = $('ringkasKalender');
  var elGalatKalender = $('galatKalender');
  var elBtnKalenderBawaan = $('btnKalenderBawaan');
  var elBtnKalenderBatal = $('btnKalenderBatal');
  var elBtnAnggota = $('btnAnggota');
  var elBtnPert = $('btnPert');
  var elModalAnggota = $('modalAnggotaLatar');
  var elFormAnggota = $('formAnggota');
  var elFAnggotaNama = $('fAnggotaNama');
  var elFAnggotaEmail = $('fAnggotaEmail');
  var elFAnggotaPeran = $('fAnggotaPeran');
  var elFAnggotaGaji = $('fAnggotaGaji');
  var elGalatAnggota = $('galatAnggota');
  var elDaftarAnggota = $('daftarAnggota');
  var elBtnAnggotaBatal = $('btnAnggotaBatal');
  var elBtnAnggotaSimpan = $('btnAnggotaSimpan');
  var elModalPert = $('modalPertLatar');
  var elRingkasAnalisis = $('ringkasAnalisis');
  var elWadahPert = $('wadahPert');
  var elBtnPertTutup = $('btnPertTutup');
  var elDaftarAlokasi = $('daftarAlokasi');
  var elCatatanBiaya = $('catatanBiaya');

  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
    'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  var ICON_UBAH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
  var ICON_HAPUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';

  var daftar = [];
  var terlipat = new Set();
  var sedangEdit = null;
  var predSementara = [];
  var kalSementara = null;
  var petaBaris = {};
  var timerStat = null;
  var anggota = [];
  var idAnggotaEdit = null;
  var alokasiSementara = [];
  var analisisAktif = null;

  var TINGGI_BARIS = (function () {
    var v = parseInt(window.getComputedStyle(document.documentElement)
      .getPropertyValue('--tinggi-baris'), 10);
    return isFinite(v) && v > 0 ? v : 40;
  })();

  /* ---------- Utilitas tampilan ---------- */

  function esc(teks) {
    return String(teks).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtTanggal(teks) {
    var d = L.parseTanggal(teks);
    if (!d) return '\u2014';
    return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }

  function fmtTanggalPanjang(dt) {
    return dt.getDate() + ' ' + BULAN_PANJANG[dt.getMonth()] + ' ' + dt.getFullYear() +
      ' (' + HARI_PENDEK[dt.getDay()] + ')';
  }

  function cariTugas(id) {
    for (var i = 0; i < daftar.length; i++) {
      if (daftar[i].id === id) return daftar[i];
    }
    return null;
  }

  /* ---------- State ---------- */

  function muatState() {
    var tersimpan = L.muatTugas();
    if (tersimpan === null) {
      daftar = L.contohTugas();
      L.simpanTugas(daftar);
    } else {
      daftar = tersimpan;
    }
    var ui = L.muatUi();
    var ada = new Set(daftar.map(function (t) { return t.id; }));
    terlipat = new Set((ui.terlipat || []).filter(function (id) { return ada.has(id); }));
  }

  function muatAnggotaState() {
    var tersimpan = L.muatAnggota();
    if (tersimpan === null) {
      anggota = L.contohAnggota();
      L.simpanAnggota(anggota);
    } else {
      anggota = tersimpan;
    }
    var ada = new Set(anggota.map(function (a) { return a.id; }));
    daftar.forEach(function (t) {
      t.anggota = L.normalisasiAlokasi(t.anggota).filter(function (id) { return ada.has(id); });
    });
  }

  function cariAnggota(id) {
    for (var i = 0; i < anggota.length; i++) {
      if (anggota[i].id === id) return anggota[i];
    }
    return null;
  }

  function fmtRupiah(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function simpanSemua() {
    L.simpanTugas(daftar);
    L.simpanUi(terlipat);
  }

  /* ---------- Rentang timeline ---------- */

  function pilihLebarHari(n) {
    if (n <= 45) return 34;
    if (n <= 90) return 26;
    if (n <= 180) return 20;
    if (n <= 366) return 16;
    return 12;
  }

  function hitungRentang() {
    var kini = L.hariIni();
    var min, max;

    if (daftar.length === 0) {
      min = new Date(kini.getFullYear(), kini.getMonth(), 1);
      max = new Date(kini.getFullYear(), kini.getMonth() + 1, 0);
    } else {
      min = null;
      max = null;
      daftar.forEach(function (t) {
        var s = L.parseTanggal(t.mulai);
        if (!s) return;
        var selesaiTeks = L.hitungTanggalSelesai(t.mulai, t.durasi);
        var e = L.parseTanggal(selesaiTeks) || s;
        if (!min || s.getTime() < min.getTime()) min = new Date(s.getTime());
        if (!max || e.getTime() > max.getTime()) max = new Date(e.getTime());
      });
      if (!min || !max) {
        min = new Date(kini.getTime());
        max = new Date(kini.getTime());
      }
    }

    if (kini.getTime() < min.getTime()) min = new Date(kini.getTime());
    if (kini.getTime() > max.getTime()) max = new Date(kini.getTime());

    min = L.tambahHari(min, -3);
    max = L.tambahHari(max, 3);

    var jumlahHari = L.selisihHari(min, max) + 1;
    if (jumlahHari < 21) {
      max = L.tambahHari(min, 20);
      jumlahHari = 21;
    }

    var lebarHari = pilihLebarHari(jumlahHari);
    return {
      mulai: min,
      selesai: max,
      jumlahHari: jumlahHari,
      lebarHari: lebarHari,
      timelineW: jumlahHari * lebarHari,
      offsetSenin: (min.getDay() + 6) % 7 /* Senin = 0 */
    };
  }

  /* ---------- Render kepala timeline ---------- */

  function renderKepala(rentang) {
    var i, frag, k;

    elBarisBulan.innerHTML = '';
    frag = document.createDocumentFragment();
    i = 0;
    while (i < rentang.jumlahHari) {
      var d0 = L.tambahHari(rentang.mulai, i);
      var bulan = d0.getMonth();
      var tahun = d0.getFullYear();
      var hitung = 0;
      while (i + hitung < rentang.jumlahHari) {
        var dd = L.tambahHari(rentang.mulai, i + hitung);
        if (dd.getMonth() !== bulan || dd.getFullYear() !== tahun) break;
        hitung += 1;
      }
      var el = document.createElement('div');
      el.className = 'bulan';
      el.style.width = (hitung * rentang.lebarHari) + 'px';
      el.textContent = BULAN_PANJANG[bulan] + ' ' + tahun;
      el.title = BULAN_PANJANG[bulan] + ' ' + tahun;
      frag.appendChild(el);
      i += hitung;
    }
    elBarisBulan.appendChild(frag);

    elBarisHari.innerHTML = '';
    frag = document.createDocumentFragment();
    var sempit = rentang.lebarHari < 18;
    for (k = 0; k < rentang.jumlahHari; k++) {
      var dt = L.tambahHari(rentang.mulai, k);
      var cell = document.createElement('div');
      cell.className = 'hari' +
        (L.hariKerja(dt) ? '' : ' akhir-pekan') +
        (sempit ? ' sempit' : '');
      cell.style.width = rentang.lebarHari + 'px';
      cell.title = fmtTanggalPanjang(dt);
      var s1 = document.createElement('span');
      s1.className = 'huruf';
      s1.textContent = HARI_PENDEK[dt.getDay()].charAt(0);
      var s2 = document.createElement('span');
      s2.className = 'angka';
      s2.textContent = String(dt.getDate());
      cell.appendChild(s1);
      cell.appendChild(s2);
      frag.appendChild(cell);
    }
    elBarisHari.appendChild(frag);
  }

  function renderLatar(rentang) {
    var dw = rentang.lebarHari;
    elLatar.style.width = rentang.timelineW + 'px';
    elLatar.style.backgroundImage =
      'repeating-linear-gradient(to right, rgba(100,116,139,.20) 0 1px, transparent 1px ' + dw + 'px),' +
      'repeating-linear-gradient(to right, transparent 0, transparent ' + (5 * dw) + 'px, ' +
      '#f1f5f9 ' + (5 * dw) + 'px, #f1f5f9 ' + (7 * dw) + 'px)';
    elLatar.style.backgroundPosition =
      '0px 0px, ' + (-rentang.offsetSenin * dw) + 'px 0px';
    elLatar.style.backgroundRepeat = 'repeat, repeat';
  }

  function renderPenandaHariIni(rentang) {
    var idx = L.selisihHari(rentang.mulai, L.hariIni());
    if (idx < 0 || idx >= rentang.jumlahHari) {
      elGaris.hidden = true;
      elPenanda.hidden = true;
      return;
    }
    var x = idx * rentang.lebarHari;
    elGaris.hidden = false;
    elGaris.style.left = 'calc(var(--lebar-label) + ' + x + 'px)';
    elPenanda.hidden = false;
    elPenanda.style.left = (x + rentang.lebarHari / 2) + 'px';
  }

  /* ---------- Render baris tugas ---------- */

  function elemenBaris(b, rentang) {
    var t = b.tugas;
    var p = L.PRIORITAS[t.prioritas] || L.PRIORITAS.sedang;
    var selesaiTeks = L.hitungTanggalSelesai(t.mulai, t.durasi) || t.mulai;
    var info = (analisisAktif && analisisAktif.ok) ? analisisAktif.tugas[t.id] : null;
    var kritis = !!(info && info.kritis);
    var teksAlokasi = namaAlokasi(t);

    var row = document.createElement('div');
    row.className = 'baris';
    row.setAttribute('data-id', t.id);

    var label = document.createElement('div');
    label.className = 'baris-label grid-kolom' + (kritis ? ' kritis' : '');
    label.style.setProperty('--tingkat', String(b.level));

    var lipatHtml = '';
    if (b.punyaAnak) {
      var kata = b.terlipat ? 'Perluas' : 'Ciutkan';
      lipatHtml = '<button type="button" class="lipat" data-aksi="lipat" title="' + kata +
        ' sub-tugas" aria-label="' + kata + ' sub-tugas">' +
        (b.terlipat ? '\u25B8' : '\u25BE') + '</button>';
    }

    var pillHtml = (b.punyaAnak && b.terlipat)
      ? '<span class="pill" title="' + b.jumlahAnak + ' sub-tugas tertutup">' + b.jumlahAnak + '</span>'
      : '';

    var chipHtml = '';
    var alokasi = L.normalisasiAlokasi(t.anggota);
    if (alokasi.length) {
      alokasi.slice(0, 3).forEach(function (id) {
        var a = cariAnggota(id);
        if (a) {
          chipHtml += '<span class="chip-kecil" title="' + esc(a.nama) + ' (' + esc(a.peran) +
            ')">' + esc(inisial(a.nama)) + '</span>';
        }
      });
      if (alokasi.length > 3) {
        chipHtml += '<span class="chip-lebih" title="' + esc(teksAlokasi) + '">+' +
          (alokasi.length - 3) + '</span>';
      }
    }

    label.innerHTML =
      '<div class="kolom-lipat">' + lipatHtml + '</div>' +
      '<div class="kolom-warna"><span class="titik-warna" style="background:' + t.warna + '"></span></div>' +
      '<div class="kolom-nama"><span class="nama" title="' + esc(t.nama) + '">' + esc(t.nama) + '</span>' +
        chipHtml + pillHtml + '</div>' +
      '<div class="kolom-mulai">' + fmtTanggal(t.mulai) + '</div>' +
      '<div class="kolom-durasi">' + t.durasi + ' hari</div>' +
      '<div class="kolom-selesai">' + fmtTanggal(selesaiTeks) + '</div>' +
      '<div class="kolom-prioritas"><span class="badge" style="background:' + p.latar +
        ';color:' + p.teks + '">' + p.label + '</span></div>' +
      '<div class="kolom-aksi">' +
        '<button type="button" class="aksi-btn" data-aksi="edit" title="Edit tugas" aria-label="Edit tugas">' + ICON_UBAH + '</button>' +
        '<button type="button" class="aksi-btn hapus" data-aksi="hapus" title="Hapus tugas" aria-label="Hapus tugas">' + ICON_HAPUS + '</button>' +
      '</div>';

    row.appendChild(label);

    var track = document.createElement('div');
    track.className = 'baris-track';

    var m = L.parseTanggal(t.mulai);
    var s = L.parseTanggal(selesaiTeks);
    if (m && s) {
      var i0 = L.selisihHari(rentang.mulai, m);
      var i1 = L.selisihHari(rentang.mulai, s);
      if (i1 >= 0 && i0 <= rentang.jumlahHari - 1) {
        var awal = Math.max(0, i0);
        var akhir = Math.min(rentang.jumlahHari - 1, i1);
        var kiri = awal * rentang.lebarHari;
        var lebarBar = Math.max(rentang.lebarHari * 0.7, (akhir - awal + 1) * rentang.lebarHari - 4);

        var bar = document.createElement('button');
        bar.type = 'button';
        bar.className = kritis ? 'bar kritis' : 'bar';
        bar.setAttribute('data-aksi', 'edit');
        bar.style.left = kiri + 'px';
        bar.style.width = lebarBar + 'px';
        bar.style.background = t.warna;
        var rincianBar = t.nama + ' \u2014 ' + fmtTanggal(t.mulai) + ' s/d ' + fmtTanggal(selesaiTeks) +
          ' (' + t.durasi + ' hari kerja, prioritas ' + p.label.toLowerCase() + ')';
        if (info) {
          rincianBar += ' \u2022 slack ' + info.slack + ' hari' +
            (kritis ? ' \u2022 JALUR KRITIS' : '');
        }
        if (teksAlokasi) rincianBar += ' \u2022 ' + teksAlokasi;
        bar.title = rincianBar;
        if (lebarBar >= 70) {
          bar.innerHTML = '<span class="teks-bar">' + t.durasi + ' hari</span>';
        }
        track.appendChild(bar);
      }
    }

    row.appendChild(track);
    return row;
  }

  function daftarRata() {
    return L.ratakan(L.bangunPohon(daftar), new Set());
  }

  function renderBaris(rentang) {
    elWadah.innerHTML = '';

    if (daftar.length === 0) {
      var kosong = document.createElement('div');
      kosong.className = 'kosong';
      kosong.innerHTML =
        '<h3>Belum ada tugas</h3>' +
        '<p>Klik tombol <strong>Tambah Tugas</strong> untuk membuat tugas pertama,<br>' +
        'atau muat data contoh untuk langsung melihat tampilan Gantt Chart.</p>' +
        '<button type="button" class="btn utama" data-aksi="contoh">Muat Data Contoh</button>';
      petaBaris = {};
      elWadah.appendChild(kosong);
      return;
    }

    var pohon = L.bangunPohon(daftar);
    var baris = L.ratakan(pohon, terlipat);
    var frag = document.createDocumentFragment();
    petaBaris = {};
    baris.forEach(function (b, i) {
      petaBaris[b.tugas.id] = i;
      frag.appendChild(elemenBaris(b, rentang));
    });
    elWadah.appendChild(frag);
  }

  function renderStatistik() {
    var total = daftar.length;
    var sub = daftar.filter(function (t) { return !!t.parentId; }).length;
    var totalHari = daftar.reduce(function (a, t) { return a + t.durasi; }, 0);

    if (!total) {
      elStat.textContent = 'Belum ada tugas';
    } else {
      var teksStat = total + ' tugas \u2022 ' + sub + ' sub-tugas \u2022 ' + anggota.length +
        ' anggota \u2022 total ' + totalHari + ' hari kerja';
      if (analisisAktif && analisisAktif.ok && analisisAktif.jalurKritis.length) {
        teksStat += ' \u2022 jalur kritis ' + analisisAktif.jalurKritis.length + ' tugas (' +
          analisisAktif.hariKerjaProyek + ' hari)';
      }
      elStat.textContent = teksStat;
    }

    elBtnLipat.disabled = !total;
    elBtnBuka.disabled = !total;
    elBtnHapusSemua.disabled = !total;
  }

  function renderSemua() {
    var rentang = hitungRentang();
    analisisAktif = L.hitungAnalisis(daftar);
    elDalam.style.setProperty('--lebar-timeline', rentang.timelineW + 'px');
    elDalam.style.setProperty('--lebar-hari', rentang.lebarHari + 'px');
    renderKepala(rentang);
    renderLatar(rentang);
    renderBaris(rentang);
    renderPanah(rentang);
    renderPenandaHariIni(rentang);
    renderStatistik();
  }

  /* ---------- Modal ---------- */

  function tampilkanGalat(pesan) {
    elGalat.textContent = pesan;
    elGalat.hidden = false;
  }

  function sembunyikanGalat() {
    elGalat.hidden = true;
    elGalat.textContent = '';
  }

  function bangunPreset() {
    var html = '';
    L.WARNA_PRESET.forEach(function (w) {
      html += '<button type="button" class="swatch" data-warna="' + w + '" style="background:' + w +
        '" title="' + w + '" aria-label="Pilih warna ' + w + '"></button>';
    });
    elPreset.innerHTML = html;
  }

  function updatePresetAktif() {
    var nilai = (elFWarna.value || '').toLowerCase();
    var semua = elPreset.querySelectorAll('.swatch');
    for (var i = 0; i < semua.length; i++) {
      if (semua[i].getAttribute('data-warna').toLowerCase() === nilai) {
        semua[i].classList.add('aktif');
      } else {
        semua[i].classList.remove('aktif');
      }
    }
  }

  function updatePratinjau() {
    if (predSementara.length > 0) {
      elPratinjau.textContent = 'Tanggal mulai dan selesai dihitung otomatis dari predecessor saat disimpan.';
      return;
    }
    var mulai = elFMulai.value;
    var durasi = parseInt(elFDurasi.value, 10);
    if (!L.parseTanggal(mulai) || !isFinite(durasi) || durasi < 1) {
      elPratinjau.textContent = 'Tanggal selesai: \u2014';
      return;
    }
    var selesai = L.hitungTanggalSelesai(mulai, durasi);
    var hk = L.hitungHariKerja(mulai, selesai);
    elPratinjau.innerHTML = 'Tanggal selesai: <strong>' + fmtTanggal(selesai) +
      '</strong> \u2022 ' + hk + ' hari kerja (hari kerja menurut kalender proyek)';
  }

  function isiSelectInduk(idEdit) {
    var kecuali = new Set();
    if (idEdit) {
      kecuali.add(idEdit);
      L.turunan(daftar, idEdit).forEach(function (x) { kecuali.add(x); });
    }
    var baris = daftarRata();
    var html = '<option value="">&mdash; Tanpa induk (tugas utama) &mdash;</option>';
    baris.forEach(function (b) {
      if (kecuali.has(b.tugas.id)) return;
      var indent = '';
      for (var i = 0; i < b.level; i++) indent += '\u00A0\u00A0\u00A0';
      html += '<option value="' + esc(b.tugas.id) + '">' + indent + esc(b.tugas.nama) + '</option>';
    });
    elFInduk.innerHTML = html;
  }

  function bukaModal(id) {
    var t = id ? cariTugas(id) : null;
    sedangEdit = t ? t.id : null;
    predSementara = salinPred(t);
    alokasiSementara = salinAlokasi(t);

    isiSelectInduk(sedangEdit);

    elModalJudul.textContent = t ? 'Edit Tugas' : 'Tambah Tugas';
    elBtnSimpan.textContent = t ? 'Simpan Perubahan' : 'Simpan';
    elFNama.value = t ? t.nama : '';
    elFMulai.value = t ? t.mulai : L.formatTanggal(L.hariIni());
    elFDurasi.value = t ? String(t.durasi) : '3';
    elFPrioritas.value = t ? t.prioritas : 'sedang';
    elFWarna.value = t ? t.warna : '#3b82f6';
    if (t && t.parentId) elFInduk.value = t.parentId;

    updatePresetAktif();
    updatePredUI();
    updateAlokasiUI();
    sembunyikanGalat();
    elModalLatar.hidden = false;

    setTimeout(function () { elFNama.focus(); }, 0);
  }

  function tutupModal() {
    elModalLatar.hidden = true;
    sedangEdit = null;
    sembunyikanGalat();
  }

  /* ---------- Aksi ---------- */

  function toggleLipat(id) {
    if (terlipat.has(id)) terlipat.delete(id);
    else terlipat.add(id);
    simpanSemua();
    renderSemua();
  }

  /** Buka kembali seluruh induk agar tugas hasil simpan selalu terlihat. */
  function lebarkanLeluhur(id) {
    var cur = id;
    var jaga = 0;
    while (cur && jaga < 1000) {
      terlipat.delete(cur);
      var t = cariTugas(cur);
      if (!t) break;
      cur = t.parentId;
      jaga += 1;
    }
  }

  function hapusTugas(id) {
    var t = cariTugas(id);
    if (!t) return;
    var anak = L.turunan(daftar, id);
    var pesan = anak.length > 0
      ? 'Hapus tugas "' + t.nama + '"?\n' + anak.length +
        ' sub-tugas di bawahnya akan dipromosikan ke tingkat yang lebih atas.'
      : 'Hapus tugas "' + t.nama + '"?';
    if (!window.confirm(pesan)) return;

    daftar = daftar.filter(function (x) { return x.id !== id; });
    daftar.forEach(function (x) {
      if (x.parentId === id) x.parentId = t.parentId || null;
      x.predecessors = L.normalisasiPredecessors(x.predecessors).filter(function (p) { return p.id !== id; });
    });
    terlipat.delete(id);
    jadwalkanDanRender();
  }

  function hapusSemua() {
    if (!daftar.length) return;
    if (!window.confirm('Hapus SEMUA tugas dan data proyek?\nTindakan ini tidak bisa dibatalkan.')) return;
    daftar = [];
    terlipat = new Set();
    simpanSemua();
    renderSemua();
  }

  function muatContoh() {
    if (daftar.length && !window.confirm('Ganti tugas saat ini dengan data contoh?')) return;
    daftar = L.contohTugas();
    terlipat = new Set();
    jadwalkanDanRender();
  }

  /* ---------- Predecessor ---------- */

  function salinPred(t) {
    return L.normalisasiPredecessors(t ? t.predecessors : null).map(function (p) {
      return { id: p.id, type: p.type, delay: p.delay };
    });
  }

  function updatePredUI() {
    var dipakai = Object.create(null);
    predSementara.forEach(function (p) { dipakai[p.id] = true; });

    var html = '<option value="">&mdash; Pilih tugas &mdash;</option>';
    daftarRata().forEach(function (b) {
      if (b.tugas.id === sedangEdit || dipakai[b.tugas.id]) return;
      var indent = '';
      for (var i = 0; i < b.level; i++) indent += '\u00A0\u00A0\u00A0';
      html += '<option value="' + esc(b.tugas.id) + '">' + indent + esc(b.tugas.nama) + '</option>';
    });
    elFPredTugas.innerHTML = html;

    var item = '';
    predSementara.forEach(function (p, i) {
      var t = cariTugas(p.id);
      var nama = t ? t.nama : p.id;
      var penjelasan = (p.type === 'FS') ? 'Finish-to-Start' : 'Start-to-Start';
      item += '<li>' +
        '<span class="pred-nama" title="' + esc(nama) + '">' + esc(nama) + '</span>' +
        '<span class="pred-tipe" title="' + penjelasan + '">' + p.type + '</span>' +
        '<span class="pred-jeda">jeda ' + p.delay + ' hari</span>' +
        '<button type="button" class="aksi-btn hapus" data-hapus-pred="' + i +
        '" title="Hapus hubungan" aria-label="Hapus hubungan">&#10005;</button>' +
        '</li>';
    });
    elDaftarPred.innerHTML = item ||
      '<li class="kosong-pred">Belum ada predecessor. Tugas ini dijadwalkan manual.</li>';

    var otomatis = predSementara.length > 0;
    elCatatanPred.hidden = !otomatis;
    elFMulai.disabled = otomatis;
    updatePratinjau();
  }

  /** Simpan, jadwalkan ulang, lalu render; tampilkan umpan balik pergeseran. */
  function jadwalkanDanRender() {
    var r = L.jadwalkanUlang(daftar);
    L.simpanTugas(daftar);
    L.simpanUi(terlipat);
    renderSemua();

    if (timerStat) {
      clearTimeout(timerStat);
      timerStat = null;
    }
    if (!r.ok) {
      elStat.textContent = '\u26A0 ' + r.pesan;
      return;
    }
    if (r.diubah > 0) {
      elStat.textContent = r.diubah + ' tugas digeser otomatis mengikuti predecessor';
      timerStat = setTimeout(function () {
        timerStat = null;
        renderStatistik();
      }, 3500);
    }
  }

  /* ---------- Panah predecessor ---------- */

  function koordinatBar(t, rentang) {
    var m = L.parseTanggal(t.mulai);
    var s = L.parseTanggal(L.hitungTanggalSelesai(t.mulai, t.durasi));
    if (!m || !s) return null;
    var i0 = L.selisihHari(rentang.mulai, m);
    var i1 = L.selisihHari(rentang.mulai, s);
    if (i1 < 0 || i0 > rentang.jumlahHari - 1) return null;
    var awal = Math.max(0, i0);
    var akhir = Math.min(rentang.jumlahHari - 1, i1);
    return { x0: awal * rentang.lebarHari, x1: (akhir + 1) * rentang.lebarHari };
  }

  function renderPanah(rentang) {
    var svg = elSvgPanah;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var jumlahBaris = Object.keys(petaBaris).length;
    if (!jumlahBaris) {
      svg.style.width = '0px';
      svg.style.height = '0px';
      return;
    }

    svg.setAttribute('width', rentang.timelineW);
    svg.setAttribute('height', jumlahBaris * TINGGI_BARIS);
    svg.style.width = rentang.timelineW + 'px';
    svg.style.height = (jumlahBaris * TINGGI_BARIS) + 'px';

    var ns = 'http://www.w3.org/2000/svg';
    var defs = document.createElementNS(ns, 'defs');
    var marker = document.createElementNS(ns, 'marker');
    marker.setAttribute('id', 'ujungPanah');
    marker.setAttribute('markerWidth', '7');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    var kepala = document.createElementNS(ns, 'path');
    kepala.setAttribute('d', 'M0,0 L6,3 L0,6 Z');
    kepala.setAttribute('fill', '#64748b');
    marker.appendChild(kepala);
    defs.appendChild(marker);
    svg.appendChild(defs);

    daftar.forEach(function (t) {
      var barisSucc = petaBaris[t.id];
      if (barisSucc === undefined) return;
      var preds = L.normalisasiPredecessors(t.predecessors);
      if (!preds.length) return;
      var kooSucc = koordinatBar(t, rentang);
      if (!kooSucc) return;

      var y2 = barisSucc * TINGGI_BARIS + TINGGI_BARIS / 2;
      var x2 = kooSucc.x0;

      preds.forEach(function (p) {
        var barisPred = petaBaris[p.id];
        if (barisPred === undefined) return;
        var pr = cariTugas(p.id);
        if (!pr) return;
        var kooPred = koordinatBar(pr, rentang);
        if (!kooPred) return;

        var y1 = barisPred * TINGGI_BARIS + TINGGI_BARIS / 2;
        var x1 = (p.type === 'SS') ? kooPred.x0 : kooPred.x1;

        var titik;
        if (x2 - x1 >= 14) {
          var siku = x1 + (x2 - x1) / 2;
          titik = [[x1, y1], [siku, y1], [siku, y2], [x2 - 5, y2]];
        } else {
          var gx = Math.min(x1, x2) - 10;
          titik = [[x1, y1], [gx, y1], [gx, y2], [Math.max(2, x2 - 5), y2]];
        }

        var garisKritis = !!(analisisAktif && analisisAktif.ok &&
          analisisAktif.tugas[p.id] && analisisAktif.tugas[t.id] &&
          analisisAktif.tugas[p.id].kritis && analisisAktif.tugas[t.id].kritis);

        var garis = document.createElementNS(ns, 'polyline');
        garis.setAttribute('points', titik.map(function (q) { return q[0] + ',' + q[1]; }).join(' '));
        garis.setAttribute('fill', 'none');
        garis.setAttribute('stroke', garisKritis ? '#dc2626' : '#64748b');
        garis.setAttribute('stroke-width', '1.6');
        garis.setAttribute('stroke-linejoin', 'round');
        garis.setAttribute('marker-end', 'url(#ujungPanah)');
        svg.appendChild(garis);
      });
    });
  }

  /* ---------- Kalender proyek ---------- */

  function salinKalender(kal) {
    return {
      akhirPekan: kal.akhirPekan.slice(),
      libur: kal.libur.map(function (x) { return { tanggal: x.tanggal, nama: x.nama }; })
    };
  }

  function tampilkanGalatKalender(pesan) {
    elGalatKalender.textContent = pesan;
    elGalatKalender.hidden = false;
  }

  function sembunyikanGalatKalender() {
    elGalatKalender.hidden = true;
    elGalatKalender.textContent = '';
  }

  function renderKalenderSementara() {
    var html = '';
    for (var i = 0; i < 7; i++) {
      var d = (i + 1) % 7; /* Senin .. Minggu */
      var cek = kalSementara.akhirPekan.indexOf(d) >= 0;
      html += '<label class="hari-check"><input type="checkbox" value="' + d + '"' +
        (cek ? ' checked' : '') + '> ' + L.HARI_NAMA[d] + '</label>';
    }
    elPilihanHari.innerHTML = html;

    var lh = '';
    kalSementara.libur.forEach(function (x, i) {
      lh += '<li>' +
        '<span class="libur-tgl">' + fmtTanggal(x.tanggal) + '</span>' +
        '<span class="libur-nama" title="' + esc(x.nama) + '">' + esc(x.nama) + '</span>' +
        '<button type="button" class="aksi-btn hapus" data-hapus-libur="' + i +
        '" title="Hapus hari libur" aria-label="Hapus hari libur">&#10005;</button>' +
        '</li>';
    });
    elDaftarLibur.innerHTML = lh || '<li class="kosong-pred">Belum ada hari libur khusus.</li>';

    elRingkasKalender.textContent = 'Hari kerja: ' + L.ringkasHariKerja(kalSementara);
  }

  function bukaKalender() {
    kalSementara = salinKalender(L.getKalender());
    elFLiburTanggal.value = '';
    elFLiburNama.value = '';
    sembunyikanGalatKalender();
    renderKalenderSementara();
    elModalKalender.hidden = false;
  }

  function tutupKalender() {
    elModalKalender.hidden = true;
  }

  /* ---------- Alokasi anggota ---------- */

  function inisial(nama) {
    var kata = String(nama).trim().split(/\s+/);
    var s = '';
    for (var i = 0; i < kata.length && i < 2; i++) {
      if (kata[i]) s += kata[i].charAt(0).toUpperCase();
    }
    return s || '?';
  }

  function namaAlokasi(t) {
    var daftarId = L.normalisasiAlokasi(t ? t.anggota : null);
    if (!daftarId.length) return '';
    var nama = [];
    daftarId.forEach(function (id) {
      var a = cariAnggota(id);
      if (a) nama.push(a.nama);
    });
    return nama.length ? 'Anggota: ' + nama.join(', ') : '';
  }

  function salinAlokasi(t) {
    return L.normalisasiAlokasi(t ? t.anggota : null).slice();
  }

  function updateBiaya() {
    if (!alokasiSementara.length) {
      elCatatanBiaya.hidden = true;
      elCatatanBiaya.textContent = '';
      return;
    }
    var durasi = parseInt(elFDurasi.value, 10);
    if (!isFinite(durasi) || durasi < 1) durasi = 1;
    var biaya = 0;
    alokasiSementara.forEach(function (id) {
      var a = cariAnggota(id);
      if (a) biaya += (a.gaji / 22) * durasi;
    });
    elCatatanBiaya.hidden = false;
    elCatatanBiaya.textContent = 'Estimasi biaya tenaga kerja: Rp ' + fmtRupiah(Math.round(biaya)) +
      ' (' + alokasiSementara.length + ' anggota \u00D7 ' + durasi +
      ' hari kerja, asumsi gaji bulanan \u00F7 22 hari kerja).';
  }

  function updateAlokasiUI() {
    var dipakai = Object.create(null);
    alokasiSementara.forEach(function (id) { dipakai[id] = true; });

    var html = '';
    if (!anggota.length) {
      html = '<li class="kosong-pred">Belum ada anggota tim. Tambahkan lewat menu Anggota Tim.</li>';
    } else {
      anggota.forEach(function (a) {
        html += '<li>' +
          '<label class="cek-anggota">' +
            '<input type="checkbox" data-anggota="' + esc(a.id) + '"' +
              (dipakai[a.id] ? ' checked' : '') + '>' +
            '<span class="nama-anggota">' + esc(a.nama) + '</span>' +
            '<span class="peran-anggota">' + esc(a.peran) + '</span>' +
          '</label>' +
          '</li>';
      });
    }
    elDaftarAlokasi.innerHTML = html;
    updateBiaya();
  }

  /* ---------- Anggota tim ---------- */

  function tampilkanGalatAnggota(pesan) {
    elGalatAnggota.textContent = pesan;
    elGalatAnggota.hidden = false;
  }

  function sembunyikanGalatAnggota() {
    elGalatAnggota.hidden = true;
    elGalatAnggota.textContent = '';
  }

  function resetFormAnggota() {
    elFAnggotaNama.value = '';
    elFAnggotaEmail.value = '';
    elFAnggotaPeran.value = '';
    elFAnggotaGaji.value = '0';
    elBtnAnggotaSimpan.textContent = 'Simpan Anggota';
    idAnggotaEdit = null;
  }

  function renderDaftarAnggota() {
    var jumlahTugas = Object.create(null);
    daftar.forEach(function (t) {
      L.normalisasiAlokasi(t.anggota).forEach(function (id) {
        jumlahTugas[id] = (jumlahTugas[id] || 0) + 1;
      });
    });

    var totalGaji = anggota.reduce(function (s, a) { return s + a.gaji; }, 0);
    var html = '<li class="ringkas-anggota">' + anggota.length +
      ' anggota \u2022 total gaji bulanan Rp ' + fmtRupiah(totalGaji) + '</li>';

    if (!anggota.length) {
      html += '<li class="kosong-pred">Belum ada anggota tim.</li>';
    } else {
      anggota.forEach(function (a) {
        html += '<li>' +
          '<span class="anggota-nama" title="' + esc(a.nama) + '">' + esc(a.nama) + '</span>' +
          '<span class="anggota-email" title="' + esc(a.email) + '">' + esc(a.email) + '</span>' +
          '<span class="anggota-peran" title="' + esc(a.peran) + '">' + esc(a.peran) + '</span>' +
          '<span class="anggota-gaji">Rp ' + fmtRupiah(a.gaji) + '</span>' +
          '<span class="pill" title="Jumlah tugas yang dipegang">' +
            (jumlahTugas[a.id] || 0) + ' tugas</span>' +
          '<button type="button" class="aksi-btn" data-edit-anggota="' + esc(a.id) +
            '" title="Edit anggota" aria-label="Edit anggota">' + ICON_UBAH + '</button>' +
          '<button type="button" class="aksi-btn hapus" data-hapus-anggota="' + esc(a.id) +
            '" title="Hapus anggota" aria-label="Hapus anggota">' + ICON_HAPUS + '</button>' +
          '</li>';
      });
    }
    elDaftarAnggota.innerHTML = html;
  }

  function bukaAnggota() {
    resetFormAnggota();
    sembunyikanGalatAnggota();
    renderDaftarAnggota();
    elModalAnggota.hidden = false;
    setTimeout(function () { elFAnggotaNama.focus(); }, 0);
  }

  function tutupAnggota() {
    elModalAnggota.hidden = true;
    resetFormAnggota();
  }

  function editAnggota(id) {
    var a = cariAnggota(id);
    if (!a) return;
    idAnggotaEdit = id;
    elFAnggotaNama.value = a.nama;
    elFAnggotaEmail.value = a.email;
    elFAnggotaPeran.value = a.peran;
    elFAnggotaGaji.value = String(a.gaji);
    elBtnAnggotaSimpan.textContent = 'Simpan Perubahan';
    sembunyikanGalatAnggota();
    elFAnggotaNama.focus();
  }

  function hapusAnggota(id) {
    var a = cariAnggota(id);
    if (!a) return;
    var dipakai = 0;
    daftar.forEach(function (t) {
      if (L.normalisasiAlokasi(t.anggota).indexOf(id) >= 0) dipakai += 1;
    });
    var pesan = dipakai > 0
      ? 'Hapus anggota "' + a.nama + '"?\nAnggota ini dialokasikan ke ' + dipakai +
        ' tugas dan akan dilepas dari tugas tersebut.'
      : 'Hapus anggota "' + a.nama + '"?';
    if (!window.confirm(pesan)) return;

    anggota = anggota.filter(function (x) { return x.id !== id; });
    daftar.forEach(function (t) {
      t.anggota = L.normalisasiAlokasi(t.anggota).filter(function (x) { return x !== id; });
    });
    L.simpanAnggota(anggota);
    simpanSemua();
    if (idAnggotaEdit === id) resetFormAnggota();
    renderDaftarAnggota();
    renderSemua();
  }

  /* ---------- Diagram PERT ---------- */

  function potongTeks(teks, panjang) {
    var s = String(teks);
    return s.length > panjang ? s.slice(0, panjang - 1) + '\u2026' : s;
  }

  function bukaPert() {
    renderPert();
    elModalPert.hidden = false;
  }

  function tutupPert() {
    elModalPert.hidden = true;
  }

  function renderPert() {
    elWadahPert.innerHTML = '';

    if (!daftar.length) {
      elRingkasAnalisis.textContent = 'Belum ada tugas untuk dianalisis.';
      return;
    }

    var a = L.hitungAnalisis(daftar);
    var j = L.tingkatJaringan(daftar);
    if (!a.ok || !j.ok) {
      elRingkasAnalisis.textContent = a.pesan || j.pesan || 'Analisis gagal dihitung.';
      return;
    }

    elRingkasAnalisis.textContent = 'Durasi proyek: ' + a.hariKerjaProyek + ' hari kerja (' +
      fmtTanggal(a.proyekMulai) + ' s/d ' + fmtTanggal(a.proyekSelesai) + ') \u2022 jalur kritis: ' +
      a.jalurKritis.length + ' dari ' + daftar.length + ' tugas';

    var ns = 'http://www.w3.org/2000/svg';
    var LEBAR = 196;
    var TINGGI = 62;
    var JARAK_X = 84;
    var JARAK_Y = 18;
    var MARGIN = 16;

    var perKolom = [];
    daftar.forEach(function (t) {
      var l = j.tingkat[t.id] || 0;
      if (!perKolom[l]) perKolom[l] = [];
      perKolom[l].push(t);
    });

    perKolom.forEach(function (list) {
      list.sort(function (x, y) {
        var mx = a.tugas[x.id] ? a.tugas[x.id].mulai : x.mulai;
        var my = a.tugas[y.id] ? a.tugas[y.id].mulai : y.mulai;
        return mx < my ? -1 : (mx > my ? 1 : 0);
      });
    });

    var barisMaks = 1;
    perKolom.forEach(function (list) {
      if (list.length > barisMaks) barisMaks = list.length;
    });

    var lebarTotal = MARGIN * 2 + j.kolom * LEBAR + Math.max(0, j.kolom - 1) * JARAK_X;
    var tinggiTotal = MARGIN * 2 + barisMaks * TINGGI + (barisMaks - 1) * JARAK_Y;

    var posisi = Object.create(null);
    perKolom.forEach(function (list, l) {
      list.forEach(function (t, r) {
        posisi[t.id] = {
          x: MARGIN + l * (LEBAR + JARAK_X),
          y: MARGIN + r * (TINGGI + JARAK_Y)
        };
      });
    });

    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', lebarTotal);
    svg.setAttribute('height', tinggiTotal);
    svg.setAttribute('viewBox', '0 0 ' + lebarTotal + ' ' + tinggiTotal);

    var defs = document.createElementNS(ns, 'defs');
    var marker = document.createElementNS(ns, 'marker');
    marker.setAttribute('id', 'ujungPanahPert');
    marker.setAttribute('markerWidth', '7');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    var kepala = document.createElementNS(ns, 'path');
    kepala.setAttribute('d', 'M0,0 L6,3 L0,6 Z');
    kepala.setAttribute('fill', '#94a3b8');
    marker.appendChild(kepala);
    defs.appendChild(marker);
    svg.appendChild(defs);

    daftar.forEach(function (t) {
      var p2 = posisi[t.id];
      if (!p2) return;
      L.normalisasiPredecessors(t.predecessors).forEach(function (p) {
        var pp = posisi[p.id];
        if (!pp) return;
        var x1 = pp.x + LEBAR;
        var y1 = pp.y + TINGGI / 2;
        var x2 = p2.x;
        var y2 = p2.y + TINGGI / 2;
        var siku = x1 + Math.max(12, (x2 - x1) / 2);
        var kritis = !!(a.tugas[p.id] && a.tugas[t.id] &&
          a.tugas[p.id].kritis && a.tugas[t.id].kritis);

        var garis = document.createElementNS(ns, 'path');
        garis.setAttribute('d', 'M' + x1 + ',' + y1 + ' L' + siku + ',' + y1 +
          ' L' + siku + ',' + y2 + ' L' + (x2 - 6) + ',' + y2);
        garis.setAttribute('class', 'garis-pert' + (kritis ? ' kritis' : ''));
        garis.setAttribute('marker-end', 'url(#ujungPanahPert)');
        svg.appendChild(garis);
      });
    });

    daftar.forEach(function (t) {
      var pp = posisi[t.id];
      if (!pp) return;
      var info = a.tugas[t.id] || {};
      var kritis = !!info.kritis;

      var kotak = document.createElementNS(ns, 'rect');
      kotak.setAttribute('x', pp.x);
      kotak.setAttribute('y', pp.y);
      kotak.setAttribute('width', LEBAR);
      kotak.setAttribute('height', TINGGI);
      kotak.setAttribute('rx', 8);
      kotak.setAttribute('class', 'kotak-pert' + (kritis ? ' kritis' : ''));
      svg.appendChild(kotak);

      var judul = document.createElementNS(ns, 'text');
      judul.setAttribute('x', pp.x + 10);
      judul.setAttribute('y', pp.y + 19);
      judul.setAttribute('class', 'teks-pert');
      judul.textContent = potongTeks(t.nama, 25);
      svg.appendChild(judul);

      var baris2 = document.createElementNS(ns, 'text');
      baris2.setAttribute('x', pp.x + 10);
      baris2.setAttribute('y', pp.y + 38);
      baris2.setAttribute('class', 'teks-pert kecil');
      baris2.textContent = t.durasi + ' hari \u2022 slack ' + (info.slack || 0) +
        (kritis ? ' \u2022 KRITIS' : '');
      svg.appendChild(baris2);

      var baris3 = document.createElementNS(ns, 'text');
      baris3.setAttribute('x', pp.x + 10);
      baris3.setAttribute('y', pp.y + 54);
      baris3.setAttribute('class', 'teks-pert kecil');
      baris3.textContent = (info.mulai ? fmtTanggal(info.mulai) : '-') + ' s/d ' +
        (info.selesai ? fmtTanggal(info.selesai) : '-');
      svg.appendChild(baris3);
    });

    elWadahPert.appendChild(svg);
  }

  /* ---------- Event ---------- */

  function pasangEvent() {
    elBtnTambah.addEventListener('click', function () { bukaModal(null); });

    elBtnBuka.addEventListener('click', function () {
      terlipat.clear();
      simpanSemua();
      renderSemua();
    });

    elBtnLipat.addEventListener('click', function () {
      daftarRata().forEach(function (b) {
        if (b.punyaAnak) terlipat.add(b.tugas.id);
      });
      simpanSemua();
      renderSemua();
    });

    elBtnHapusSemua.addEventListener('click', hapusSemua);

    elBtnKalender.addEventListener('click', bukaKalender);

    elBtnAnggota.addEventListener('click', bukaAnggota);
    elBtnPert.addEventListener('click', bukaPert);

    elBtnAnggotaBatal.addEventListener('click', tutupAnggota);
    elBtnPertTutup.addEventListener('click', tutupPert);

    elModalAnggota.addEventListener('click', function (e) {
      if (e.target === elModalAnggota) tutupAnggota();
    });

    elModalPert.addEventListener('click', function (e) {
      if (e.target === elModalPert) tutupPert();
    });

    elDaftarAnggota.addEventListener('click', function (e) {
      var b = (e.target && e.target.closest)
        ? e.target.closest('[data-edit-anggota], [data-hapus-anggota]') : null;
      if (!b) return;
      var idEdit = b.getAttribute('data-edit-anggota');
      var idHapus = b.getAttribute('data-hapus-anggota');
      if (idEdit) editAnggota(idEdit);
      else if (idHapus) hapusAnggota(idHapus);
    });

    elDaftarAlokasi.addEventListener('change', function (e) {
      var cb = e.target;
      if (!cb || cb.type !== 'checkbox') return;
      var id = cb.getAttribute('data-anggota');
      if (!id) return;
      var idx = alokasiSementara.indexOf(id);
      if (cb.checked && idx < 0) alokasiSementara.push(id);
      if (!cb.checked && idx >= 0) alokasiSementara.splice(idx, 1);
      updateBiaya();
    });

    elFormAnggota.addEventListener('submit', function (e) {
      e.preventDefault();

      var hasil = L.validasiAnggota({
        nama: elFAnggotaNama.value,
        email: elFAnggotaEmail.value,
        peran: elFAnggotaPeran.value,
        gaji: elFAnggotaGaji.value
      }, anggota, idAnggotaEdit);

      if (!hasil.valid) {
        tampilkanGalatAnggota(hasil.pesan);
        return;
      }

      var n = hasil.nilai;
      if (idAnggotaEdit) {
        var a = cariAnggota(idAnggotaEdit);
        if (a) {
          a.nama = n.nama;
          a.email = n.email;
          a.peran = n.peran;
          a.gaji = n.gaji;
        }
      } else {
        anggota.push({
          id: L.buatId(),
          nama: n.nama,
          email: n.email,
          peran: n.peran,
          gaji: n.gaji
        });
      }

      L.simpanAnggota(anggota);
      resetFormAnggota();
      sembunyikanGalatAnggota();
      renderDaftarAnggota();
      renderSemua();
    });

    elBtnTambahPred.addEventListener('click', function () {
      var id = elFPredTugas.value;
      if (!id) { tampilkanGalat('Pilih tugas pendahulu terlebih dahulu.'); return; }
      if (id === sedangEdit) { tampilkanGalat('Tugas tidak bisa menjadi predecessor dirinya sendiri.'); return; }
      var sudah = predSementara.some(function (p) { return p.id === id; });
      if (sudah) { tampilkanGalat('Tugas tersebut sudah ada di daftar predecessor.'); return; }
      var delay = parseInt(elFPredJeda.value, 10);
      if (!isFinite(delay) || delay < 0) { tampilkanGalat('Jeda harus berupa angka 0 atau lebih.'); return; }
      if (delay > 365) { tampilkanGalat('Jeda maksimal 365 hari kerja.'); return; }
      predSementara.push({
        id: id,
        type: (elFPredTipe.value === 'SS') ? 'SS' : 'FS',
        delay: delay
      });
      sembunyikanGalat();
      updatePredUI();
    });

    elDaftarPred.addEventListener('click', function (e) {
      var b = (e.target && e.target.closest) ? e.target.closest('[data-hapus-pred]') : null;
      if (!b) return;
      var i = parseInt(b.getAttribute('data-hapus-pred'), 10);
      if (isFinite(i)) {
        predSementara.splice(i, 1);
        updatePredUI();
      }
    });

    elPilihanHari.addEventListener('change', function (e) {
      var cb = e.target;
      if (!cb || cb.type !== 'checkbox' || !kalSementara) return;
      var d = parseInt(cb.value, 10);
      var idx = kalSementara.akhirPekan.indexOf(d);
      if (cb.checked && idx < 0) kalSementara.akhirPekan.push(d);
      if (!cb.checked && idx >= 0) kalSementara.akhirPekan.splice(idx, 1);
      kalSementara.akhirPekan.sort(function (a, b) { return a - b; });
      elRingkasKalender.textContent = 'Hari kerja: ' + L.ringkasHariKerja(kalSementara);
    });

    elBtnTambahLibur.addEventListener('click', function () {
      if (!kalSementara) return;
      var tgl = elFLiburTanggal.value;
      if (!L.parseTanggal(tgl)) {
        tampilkanGalatKalender('Pilih tanggal hari libur terlebih dahulu.');
        return;
      }
      var ada = kalSementara.libur.some(function (x) { return x.tanggal === tgl; });
      if (ada) {
        tampilkanGalatKalender('Tanggal tersebut sudah ada di daftar hari libur.');
        return;
      }
      kalSementara.libur.push({ tanggal: tgl, nama: elFLiburNama.value.trim() || 'Hari libur' });
      kalSementara.libur.sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : 1; });
      elFLiburTanggal.value = '';
      elFLiburNama.value = '';
      sembunyikanGalatKalender();
      renderKalenderSementara();
    });

    elDaftarLibur.addEventListener('click', function (e) {
      var b = (e.target && e.target.closest) ? e.target.closest('[data-hapus-libur]') : null;
      if (!b || !kalSementara) return;
      var i = parseInt(b.getAttribute('data-hapus-libur'), 10);
      if (isFinite(i)) {
        kalSementara.libur.splice(i, 1);
        renderKalenderSementara();
      }
    });

    elBtnKalenderBatal.addEventListener('click', tutupKalender);

    elModalKalender.addEventListener('click', function (e) {
      if (e.target === elModalKalender) tutupKalender();
    });

    elBtnKalenderBawaan.addEventListener('click', function () {
      if (kalSementara && kalSementara.libur.length) {
        if (!window.confirm('Kembalikan kalender ke bawaan?\nAkhir pekan Sabtu/Minggu dan seluruh hari libur khusus akan dihapus.')) return;
      }
      kalSementara = L.kalenderBawaan();
      renderKalenderSementara();
    });

    elFormKalender.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!kalSementara) return;
      var hasilKal = L.validasiKalender(kalSementara);
      if (!hasilKal.valid) {
        tampilkanGalatKalender(hasilKal.pesan);
        return;
      }
      L.simpanKalender(hasilKal.nilai);
      L.setKalender(hasilKal.nilai);
      tutupKalender();
      jadwalkanDanRender();
    });

    elWadah.addEventListener('click', function (e) {
      var target = (e.target && e.target.closest) ? e.target.closest('[data-aksi]') : null;
      if (!target) return;
      var aksi = target.getAttribute('data-aksi');
      var row = target.closest('[data-id]');
      var id = row ? row.getAttribute('data-id') : null;

      if (aksi === 'edit' && id) bukaModal(id);
      else if (aksi === 'hapus' && id) hapusTugas(id);
      else if (aksi === 'lipat' && id) toggleLipat(id);
      else if (aksi === 'contoh') muatContoh();
    });

    elBtnBatal.addEventListener('click', tutupModal);

    elModalLatar.addEventListener('click', function (e) {
      if (e.target === elModalLatar) tutupModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!elModalPert.hidden) { tutupPert(); return; }
      if (!elModalAnggota.hidden) { tutupAnggota(); return; }
      if (!elModalKalender.hidden) { tutupKalender(); return; }
      if (!elModalLatar.hidden) tutupModal();
    });

    elForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var hasil = L.validasiTugas({
        nama: elFNama.value,
        mulai: elFMulai.value,
        durasi: elFDurasi.value,
        prioritas: elFPrioritas.value,
        warna: elFWarna.value,
        parentId: elFInduk.value
      });

      if (!hasil.valid) {
        tampilkanGalat(hasil.pesan);
        return;
      }

      var nilai = hasil.nilai;

      if (sedangEdit && L.punyaSiklus(daftar, sedangEdit, nilai.parentId)) {
        tampilkanGalat('Pilihan tugas induk tidak valid: tidak boleh memilih tugasnya sendiri atau salah satu sub-tugasnya.');
        return;
      }

      var vp = L.validasiPredecessors(predSementara);
      if (!vp.valid) { tampilkanGalat(vp.pesan); return; }
      var preds = vp.nilai;

      var idTarget = sedangEdit || L.buatId();
      var kandidat = daftar.map(function (x) {
        return { id: x.id, predecessors: (x.id === idTarget) ? preds : x.predecessors };
      });
      if (!sedangEdit) kandidat.push({ id: idTarget, predecessors: preds });
      if (!L.urutkanTopologi(kandidat)) {
        tampilkanGalat('Hubungan predecessor membuat siklus. Periksa kembali daftar tugas pendahulu.');
        return;
      }

      if (sedangEdit) {
        var t = cariTugas(sedangEdit);
        if (t) {
          t.nama = nilai.nama;
          t.mulai = nilai.mulai;
          t.durasi = nilai.durasi;
          t.prioritas = nilai.prioritas;
          t.warna = nilai.warna;
          t.parentId = nilai.parentId;
          t.predecessors = preds;
          t.anggota = alokasiSementara.slice();
          lebarkanLeluhur(t.id);
        }
      } else {
        daftar.push({
          id: idTarget,
          nama: nilai.nama,
          mulai: nilai.mulai,
          durasi: nilai.durasi,
          prioritas: nilai.prioritas,
          warna: nilai.warna,
          parentId: nilai.parentId,
          predecessors: preds,
          anggota: alokasiSementara.slice()
        });
        lebarkanLeluhur(idTarget);
      }

      tutupModal();
      jadwalkanDanRender();
    });

    elFMulai.addEventListener('change', updatePratinjau);
    elFDurasi.addEventListener('input', function () {
      updatePratinjau();
      updateBiaya();
    });
    elFWarna.addEventListener('input', updatePresetAktif);

    elPreset.addEventListener('click', function (e) {
      var sw = (e.target && e.target.closest) ? e.target.closest('.swatch') : null;
      if (!sw) return;
      elFWarna.value = sw.getAttribute('data-warna');
      updatePresetAktif();
    });
  }

  /* ---------- Mulai ---------- */

  L.setKalender(L.muatKalender() || L.kalenderBawaan());
  muatState();
  muatAnggotaState();

  var jadwalAwal = L.jadwalkanUlang(daftar);
  if (jadwalAwal.ok && jadwalAwal.diubah > 0) L.simpanTugas(daftar);

  bangunPreset();
  pasangEvent();
  renderSemua();

  if (!jadwalAwal.ok) {
    elStat.textContent = '\u26A0 ' + jadwalAwal.pesan;
  }
})();
