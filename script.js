/* ============================================================
   MiniStat - script.js
   Bagian 1: fungsi statistik (tanpa DOM)
   Bagian 2: data, tampilan, uji hipotesis, dan grafik
   Library: PapaParse, SheetJS (XLSX), jStat, Chart.js
   ============================================================ */
'use strict';

/* ============================================================
   BAGIAN 1: FUNGSI STATISTIK
   ============================================================ */
// MULAI-STAT
const Stat = {
  jumlah(a) {
    let s = 0;
    for (const v of a) s += v;
    return s;
  },
  rata(a) {
    return Stat.jumlah(a) / a.length;
  },
  median(a) {
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  },
  varian(a) {
    if (a.length < 2) return NaN;
    const m = Stat.rata(a);
    let s = 0;
    for (const v of a) s += (v - m) * (v - m);
    return s / (a.length - 1);
  },
  sd(a) {
    return Math.sqrt(Stat.varian(a));
  },
  min(a) {
    let m = Infinity;
    for (const v of a) if (v < m) m = v;
    return m;
  },
  max(a) {
    let m = -Infinity;
    for (const v of a) if (v > m) m = v;
    return m;
  },
  momen(a, k) {
    const m = Stat.rata(a);
    let s = 0;
    for (const v of a) s += Math.pow(v - m, k);
    return s / a.length;
  },
  skewness(a) {
    return Stat.momen(a, 3) / Math.pow(Stat.momen(a, 2), 1.5);
  },
  kurtosisBerlebih(a) {
    const m2 = Stat.momen(a, 2);
    return Stat.momen(a, 4) / (m2 * m2) - 3;
  },

  // p-value dua arah dari distribusi t
  pDuaArah(t, df) {
    if (Number.isNaN(t)) return NaN;
    if (!Number.isFinite(t)) return 0;
    return 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
  },

  // One sample t-test
  tSatu(x, mu, alpha) {
    const n = x.length;
    const rata = Stat.rata(x);
    const sd = Stat.sd(x);
    const se = sd / Math.sqrt(n);
    const df = n - 1;
    const t = (rata - mu) / se;
    const p = Stat.pDuaArah(t, df);
    const kritis = jStat.studentt.inv(1 - alpha / 2, df);
    return { n, rata, sd, se, df, t, p, ciBawah: rata - kritis * se, ciAtas: rata + kritis * se };
  },

  // Independent t-test (Welch)
  tWelch(a, b, alpha) {
    const n1 = a.length, n2 = b.length;
    const m1 = Stat.rata(a), m2 = Stat.rata(b);
    const v1 = Stat.varian(a), v2 = Stat.varian(b);
    const se2 = v1 / n1 + v2 / n2;
    const se = Math.sqrt(se2);
    const t = (m1 - m2) / se;
    const df = (se2 * se2) / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
    const p = Stat.pDuaArah(t, df);
    const kritis = jStat.studentt.inv(1 - alpha / 2, df);
    const selisih = m1 - m2;
    return {
      n1, n2, m1, m2, s1: Math.sqrt(v1), s2: Math.sqrt(v2),
      selisih, se, t, df, p,
      ciBawah: selisih - kritis * se, ciAtas: selisih + kritis * se
    };
  },

  // ANOVA one-way; groups = array berisi array angka
  anova(groups) {
    const semua = [];
    for (const g of groups) for (const v of g) semua.push(v);
    const N = semua.length;
    const k = groups.length;
    const grand = Stat.rata(semua);
    let ssb = 0, ssw = 0;
    for (const g of groups) {
      const m = Stat.rata(g);
      ssb += g.length * (m - grand) * (m - grand);
      for (const v of g) ssw += (v - m) * (v - m);
    }
    const dfb = k - 1;
    const dfw = N - k;
    const msb = ssb / dfb;
    const msw = ssw / dfw;
    const F = msb / msw;
    const p = Number.isFinite(F) ? 1 - jStat.centralF.cdf(F, dfb, dfw) : (F > 0 ? 0 : NaN);
    return { N, k, ssb, ssw, sst: ssb + ssw, dfb, dfw, dft: N - 1, msb, msw, F, p, eta2: ssb / (ssb + ssw) };
  },

  // Shapiro-Wilk (algoritma Royston, n = 3 sampai 5000)
  shapiro(data) {
    const x = [...data].sort((a, b) => a - b);
    const n = x.length;
    const nn2 = Math.floor(n / 2);
    const poly = (cc, v) => {
      let r = 0;
      for (let j = cc.length - 1; j >= 0; j--) r = r * v + cc[j];
      return r;
    };
    const m = [];
    for (let i = 1; i <= nn2; i++) m[i] = jStat.normal.inv((i - 0.375) / (n + 0.25), 0, 1);
    const a = [];
    if (n === 3) {
      a[1] = Math.SQRT1_2;
    } else {
      let summ2 = 0;
      for (let i = 1; i <= nn2; i++) summ2 += m[i] * m[i];
      summ2 *= 2;
      const ssumm2 = Math.sqrt(summ2);
      const rsn = 1 / Math.sqrt(n);
      const c1 = [0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056];
      const c2 = [0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633];
      const a1 = poly(c1, rsn) - m[1] / ssumm2;
      let i1, fac;
      if (n > 5) {
        i1 = 3;
        const a2 = -m[2] / ssumm2 + poly(c2, rsn);
        fac = Math.sqrt((summ2 - 2 * m[1] * m[1] - 2 * m[2] * m[2]) / (1 - 2 * a1 * a1 - 2 * a2 * a2));
        a[2] = a2;
      } else {
        i1 = 2;
        fac = Math.sqrt((summ2 - 2 * m[1] * m[1]) / (1 - 2 * a1 * a1));
      }
      a[1] = a1;
      for (let i = i1; i <= nn2; i++) a[i] = -m[i] / fac;
    }
    const mean = Stat.rata(x);
    let ss = 0;
    for (const v of x) ss += (v - mean) * (v - mean);
    if (ss === 0) return { W: NaN, p: NaN };
    let b = 0;
    for (let i = 1; i <= nn2; i++) b += a[i] * (x[n - i] - x[i - 1]);
    const W = Math.min(1, (b * b) / ss);

    let p;
    if (n === 3) {
      p = (6 / Math.PI) * (Math.asin(Math.sqrt(W)) - Math.PI / 3);
      if (p < 0) p = 0;
    } else {
      const y = Math.log(1 - W);
      const lnn = Math.log(n);
      let yy = y, mu, sigma;
      if (n <= 11) {
        const gamma = poly([-2.273, 0.459], n);
        if (y >= gamma) return { W, p: 1e-99 };
        yy = -Math.log(gamma - y);
        mu = poly([0.544, -0.39978, 0.025054, -6.714e-4], n);
        sigma = Math.exp(poly([1.3822, -0.77857, 0.062767, -0.0020322], n));
      } else {
        mu = poly([-1.5861, -0.31082, -0.083751, 0.0038915], lnn);
        sigma = Math.exp(poly([-0.4803, -0.082676, 0.0030302], lnn));
      }
      p = 1 - jStat.normal.cdf(yy, mu, sigma);
    }
    return { W, p };
  },

  // Korelasi Pearson
  pearson(x, y) {
    const n = x.length;
    const mx = Stat.rata(x), my = Stat.rata(y);
    let sxx = 0, syy = 0, sxy = 0;
    for (let i = 0; i < n; i++) {
      sxx += (x[i] - mx) ** 2;
      syy += (y[i] - my) ** 2;
      sxy += (x[i] - mx) * (y[i] - my);
    }
    const r = sxy / Math.sqrt(sxx * syy);
    const df = n - 2;
    const t = r * Math.sqrt(df / (1 - r * r));
    return { n, r, r2: r * r, df, t, p: Stat.pDuaArah(t, df) };
  },

  // Chi-square independensi; tabel = matriks frekuensi
  chiKuadrat(tabel) {
    const R = tabel.length, C = tabel[0].length;
    const rowSum = tabel.map((r) => Stat.jumlah(r));
    const colSum = [];
    for (let j = 0; j < C; j++) {
      let s = 0;
      for (let i = 0; i < R; i++) s += tabel[i][j];
      colSum.push(s);
    }
    const total = Stat.jumlah(rowSum);
    let chi2 = 0, minE = Infinity, kurang5 = 0;
    for (let i = 0; i < R; i++) {
      for (let j = 0; j < C; j++) {
        const e = (rowSum[i] * colSum[j]) / total;
        chi2 += (tabel[i][j] - e) ** 2 / e;
        if (e < minE) minE = e;
        if (e < 5) kurang5++;
      }
    }
    const df = (R - 1) * (C - 1);
    const p = 1 - jStat.chisquare.cdf(chi2, df);
    const V = Math.sqrt(chi2 / (total * Math.min(R - 1, C - 1)));
    return { R, C, total, chi2, df, p, V, minE, kurang5, sel: R * C };
  },

  // Regresi linear sederhana
  regresi(x, y) {
    const n = x.length;
    const mx = Stat.rata(x), my = Stat.rata(y);
    let sxx = 0, syy = 0, sxy = 0;
    for (let i = 0; i < n; i++) {
      sxx += (x[i] - mx) ** 2;
      syy += (y[i] - my) ** 2;
      sxy += (x[i] - mx) * (y[i] - my);
    }
    const b1 = sxy / sxx;
    const b0 = my - b1 * mx;
    const ssr = b1 * sxy;
    const sse = syy - ssr;
    const df = n - 2;
    const mse = sse / df;
    const seB1 = Math.sqrt(mse / sxx);
    const seB0 = Math.sqrt(mse * (1 / n + (mx * mx) / sxx));
    const t1 = b1 / seB1;
    const t0 = b0 / seB0;
    const r2 = ssr / syy;
    return {
      n, b0, b1, r2, r: Math.sign(b1) * Math.sqrt(r2), df, seB0, seB1,
      t0, t1, p0: Stat.pDuaArah(t0, df), p1: Stat.pDuaArah(t1, df), F: t1 * t1,
      xmin: Stat.min(x), xmax: Stat.max(x)
    };
  }
};
// SELESAI-STAT

/* ============================================================
   BAGIAN 2: APLIKASI
   ============================================================ */
const $ = (id) => document.getElementById(id);

let kolom = [];       // nama kolom
let baris = [];       // data: array objek {namaKolom: nilai}
let namaFile = '';
const charts = { uji: null, grafik: null };

const BATAS_TAMPIL = 500;
const PALET = ['#4d8a77', '#d98e3f', '#4f7cac', '#b5566e', '#8a6fc0', '#6aa84f', '#c2a12b', '#3aa6b0'];

/* ---------- Pembantu umum ---------- */
function fmt(n, d = 4) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '-';
  return Number(n).toLocaleString('id-ID', { maximumFractionDigits: d });
}

function fmtP(p) {
  if (!Number.isFinite(p)) return '-';
  return p < 0.0001 ? '< 0,0001' : fmt(p, 4);
}

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function ada(v) {
  return v !== '' && v !== null && v !== undefined;
}

// Ubah nilai sel menjadi angka bila bentuknya angka
function norm(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : '';
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  if (s === '') return '';
  const t = /^-?\d+,\d+$/.test(s) ? s.replace(',', '.') : s;
  if (/^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return Number(t);
  return s;
}

let timerNotif = null;
function notif(pesan, jenis = 'info') {
  const el = $('notifikasi');
  el.className = 'notifikasi ' + jenis;
  el.textContent = pesan;
  el.hidden = false;
  clearTimeout(timerNotif);
  timerNotif = setTimeout(() => { el.hidden = true; }, 7000);
}

function perluData() {
  if (kolom.length === 0 || baris.length === 0) {
    notif('Belum ada data. Buka menu Data lalu upload file terlebih dahulu.', 'peringatan');
    return false;
  }
  return true;
}

function kolomNumerik() {
  return kolom.filter((k) => {
    let punya = false;
    for (const r of baris) {
      const v = r[k];
      if (!ada(v)) continue;
      if (!isNum(v)) return false;
      punya = true;
    }
    return punya;
  });
}

function nilai(k) {
  return baris.map((r) => r[k]).filter(isNum);
}

function pasangan(kx, ky) {
  const x = [], y = [];
  for (const r of baris) {
    if (isNum(r[kx]) && isNum(r[ky])) {
      x.push(r[kx]);
      y.push(r[ky]);
    }
  }
  return { x, y };
}

// Kelompokkan nilai numerik kv berdasarkan kolom kg
function kelompokkan(kv, kg) {
  const peta = new Map();
  for (const r of baris) {
    if (!isNum(r[kv]) || !ada(r[kg])) continue;
    const kunci = String(r[kg]);
    if (!peta.has(kunci)) peta.set(kunci, []);
    peta.get(kunci).push(r[kv]);
  }
  return [...peta.entries()].map(([nama, nilai]) => ({ nama, nilai }));
}

function urutkanKategori(daftar) {
  const unik = [...new Set(daftar)];
  if (unik.every(isNum)) unik.sort((a, b) => a - b);
  return unik.map(String);
}

function isiBody(tabel, rows) {
  const tbody = tabel.querySelector('tbody');
  tbody.innerHTML = '';
  for (const r of rows) {
    const tr = document.createElement('tr');
    for (const sel of r) {
      const td = document.createElement('td');
      td.textContent = sel;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function isiTabel(tabel, kepala, rows) {
  const thead = tabel.querySelector('thead');
  thead.innerHTML = '';
  const tr = document.createElement('tr');
  for (const h of kepala) {
    const th = document.createElement('th');
    th.textContent = h;
    tr.appendChild(th);
  }
  thead.appendChild(tr);
  isiBody(tabel, rows);
}

/* ---------- Navigasi menu ---------- */
function pindahPanel(id) {
  document.querySelectorAll('.menu-btn').forEach((b) => {
    b.classList.toggle('aktif', b.dataset.target === id);
  });
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('aktif', p.id === id);
  });
  $('notifikasi').hidden = true;
}

/* ---------- Baca file ---------- */
function bacaFile(file) {
  const nama = file.name.toLowerCase();
  if (nama.endsWith('.csv')) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (hasil) => muatData(hasil.data, hasil.meta.fields || [], file.name),
      error: () => notif('File CSV tidak bisa dibaca.', 'error')
    });
  } else if (nama.endsWith('.xlsx') || nama.endsWith('.xls')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const set = new Set();
        json.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
        muatData(json, [...set], file.name);
      } catch (err) {
        notif('File Excel tidak bisa dibaca.', 'error');
      }
    };
    reader.onerror = () => notif('File Excel tidak bisa dibaca.', 'error');
    reader.readAsArrayBuffer(file);
  } else {
    notif('Format file tidak didukung. Gunakan CSV, XLSX, atau XLS.', 'error');
  }
}

function muatData(rows, fields, nama) {
  const kolomBaru = fields.filter((f) => f !== '' && f !== undefined);
  if (rows.length === 0 || kolomBaru.length === 0) {
    notif('File kosong atau baris pertama (nama kolom) tidak ditemukan.', 'error');
    return;
  }
  kolom = kolomBaru;
  baris = rows.map((r) => {
    const o = {};
    kolom.forEach((k) => { o[k] = norm(r[k]); });
    return o;
  });
  namaFile = nama;
  dataBerubah(true);
  notif(`Data dimuat: ${baris.length} baris dan ${kolom.length} kolom.`, 'sukses');
}

/* ---------- Tampilan data ---------- */
function dataBerubah(renderTabel) {
  const punya = kolom.length > 0;
  $('area-data').hidden = !punya;
  $('status-data').textContent = punya
    ? `${namaFile || 'Data'}: ${baris.length} baris, ${kolom.length} kolom`
    : 'Belum ada data';
  $('info-file').textContent = punya && namaFile ? `File aktif: ${namaFile}` : '';
  if (renderTabel) {
    renderTabelData();
    $('hasil-uji').hidden = true;
  }
  renderVariabel();
  isiSemuaSelect();
  renderDaftarNumerik();
  renderFrekuensi();
}

function renderTabelData() {
  const tabel = $('tabel-data');
  const thead = tabel.querySelector('thead');
  const tbody = tabel.querySelector('tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';
  if (kolom.length === 0) return;

  const trh = document.createElement('tr');
  const thNo = document.createElement('th');
  thNo.textContent = '#';
  trh.appendChild(thNo);
  kolom.forEach((k) => {
    const th = document.createElement('th');
    th.textContent = k;
    trh.appendChild(th);
  });
  thead.appendChild(trh);

  const tampil = Math.min(baris.length, BATAS_TAMPIL);
  for (let i = 0; i < tampil; i++) {
    const tr = document.createElement('tr');
    const tdNo = document.createElement('td');
    tdNo.textContent = i + 1;
    tr.appendChild(tdNo);
    kolom.forEach((k) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.value = ada(baris[i][k]) ? String(baris[i][k]) : '';
      input.addEventListener('change', () => {
        baris[i][k] = norm(input.value);
        dataBerubah(false);
      });
      td.appendChild(input);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
}

function renderVariabel() {
  const numerik = kolomNumerik();
  const rows = kolom.map((k) => {
    const terisi = baris.filter((r) => ada(r[k])).length;
    return [k, numerik.includes(k) ? 'Numerik' : 'Kategori', terisi, baris.length - terisi];
  });
  isiBody($('tabel-variabel'), rows);
  let teks = '';
  if (baris.length) {
    teks = `${baris.length} baris, ${kolom.length} kolom. Klik sel untuk mengedit nilainya.`;
    if (baris.length > BATAS_TAMPIL) {
      teks += ` Tabel hanya menampilkan ${BATAS_TAMPIL} baris pertama, tetapi seluruh data tetap dipakai dalam perhitungan.`;
    }
  }
  $('ringkasan-data').textContent = teks;
}

function tambahBaris() {
  if (kolom.length === 0) return;
  const o = {};
  kolom.forEach((k) => { o[k] = ''; });
  baris.push(o);
  dataBerubah(true);
}

function hapusBarisTerakhir() {
  if (baris.length === 0) return;
  baris.pop();
  dataBerubah(true);
}

function hapusSemuaData() {
  if (kolom.length === 0) return;
  if (!window.confirm('Hapus semua data?')) return;
  kolom = [];
  baris = [];
  namaFile = '';
  dataBerubah(true);
  notif('Semua data sudah dihapus.', 'info');
}

/* ---------- Isi dropdown variabel ---------- */
function isiSelect(sel, daftar, opsi = {}) {
  const lama = sel.value;
  sel.innerHTML = '';
  if (opsi.kosong) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = '(tidak ada)';
    sel.appendChild(o);
  }
  daftar.forEach((nama) => {
    const o = document.createElement('option');
    o.value = nama;
    o.textContent = nama;
    sel.appendChild(o);
  });
  const nilaiAda = (v) => [...sel.options].some((o) => o.value === v);
  if (lama !== '' && nilaiAda(lama)) sel.value = lama;
  else if (opsi.awal !== undefined && nilaiAda(opsi.awal)) sel.value = opsi.awal;
}

function isiSemuaSelect() {
  const num = kolomNumerik();
  const kat = kolom.filter((k) => !num.includes(k));
  const awalKat = kat[0] !== undefined ? kat[0] : kolom[0];
  const kedua = (daftar) => (daftar[1] !== undefined ? daftar[1] : daftar[0]);

  document.querySelectorAll('.pilih-numerik').forEach((s) => isiSelect(s, num));
  document.querySelectorAll('.pilih-semua').forEach((s) => isiSelect(s, kolom));
  document.querySelectorAll('.pilih-semua-opsional').forEach((s) => isiSelect(s, kolom, { kosong: true }));
  isiSelect($('pilih-kategori'), kolom, { awal: awalKat });

  // Nilai awal yang masuk akal untuk pasangan variabel
  const pasanganId = { 'tp-var2': 'tp-var1', 'kr-y': 'kr-x', 'rg-y': 'rg-x' };
  Object.keys(pasanganId).forEach((id) => {
    const s = $(id);
    if (s.value === $(pasanganId[id]).value && num.length > 1) s.value = kedua(num);
  });
  ['t2-kelompok', 'an-kelompok'].forEach((id) => {
    const s = $(id);
    if (kat.length && !kat.includes(s.value)) s.value = awalKat;
  });
  const sx = $('sumbu-x');
  if (kat.length && !kat.includes(sx.value) && sx.dataset.disentuh !== '1') sx.value = awalKat;
  const c1 = $('ch-var1'), c2 = $('ch-var2');
  if (c1.value === c2.value && kolom.length > 1) {
    c1.value = awalKat;
    const sisa = kolom.filter((k) => k !== awalKat);
    c2.value = kedua(sisa.length ? sisa : kolom);
  }
}

/* ============================================================
   MENU: STATISTIK DESKRIPTIF
   ============================================================ */
function renderDaftarNumerik() {
  const wadah = $('daftar-numerik');
  const tidakDipilih = new Set(
    [...wadah.querySelectorAll('input:not(:checked)')].map((i) => i.value)
  );
  wadah.innerHTML = '';
  kolomNumerik().forEach((k) => {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = k;
    cb.checked = !tidakDipilih.has(k);
    label.appendChild(cb);
    label.appendChild(document.createTextNode(k));
    wadah.appendChild(label);
  });
}

function hitungDeskriptif() {
  if (!perluData()) return;
  const dipilih = [...$('daftar-numerik').querySelectorAll('input:checked')].map((i) => i.value);
  if (dipilih.length === 0) {
    notif('Pilih minimal satu variabel numerik.', 'peringatan');
    return;
  }
  const rows = dipilih.map((k) => {
    const x = nilai(k);
    return [k, x.length, fmt(Stat.rata(x)), fmt(Stat.median(x)), fmt(Stat.sd(x)), fmt(Stat.min(x)), fmt(Stat.max(x))];
  });
  isiBody($('tabel-deskriptif'), rows);
}

function renderFrekuensi() {
  const k = $('pilih-kategori').value;
  if (!k || baris.length === 0) {
    isiBody($('tabel-frekuensi'), []);
    return;
  }
  const hitung = new Map();
  let total = 0;
  for (const r of baris) {
    if (!ada(r[k])) continue;
    hitung.set(r[k], (hitung.get(r[k]) || 0) + 1);
    total++;
  }
  const kunci = [...hitung.keys()];
  if (kunci.every(isNum)) kunci.sort((a, b) => a - b);
  else kunci.sort((a, b) => String(a).localeCompare(String(b), 'id'));
  const rows = kunci.map((v) => [String(v), hitung.get(v), fmt((hitung.get(v) / total) * 100, 2)]);
  rows.push(['Total', total, '100']);
  isiBody($('tabel-frekuensi'), rows);
}

/* ============================================================
   GRAFIK: PEMBANTU
   ============================================================ */
const pluginLatarPutih = {
  id: 'latarPutih',
  afterDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

// Garis vertikal pada histogram (sumbu x berupa kategori interval)
const pluginGarisVertikal = {
  id: 'garisVertikal',
  afterDatasetsDraw(chart, args, opsi) {
    if (!opsi || !opsi.garis) return;
    const ctx = chart.ctx;
    const area = chart.chartArea;
    const x = chart.scales.x;
    const p0 = x.getPixelForValue(0);
    const lebar = x.getPixelForValue(1) - p0;
    opsi.garis.forEach((g, i) => {
      const px = p0 - lebar / 2 + ((g.nilai - opsi.awal) / opsi.lebarBin) * lebar;
      const kanan = px > (area.left + area.right) / 2;
      ctx.save();
      ctx.strokeStyle = g.warna;
      ctx.lineWidth = 2;
      ctx.setLineDash(g.putus ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(px, area.top);
      ctx.lineTo(px, area.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = g.warna;
      ctx.font = '12px sans-serif';
      ctx.textAlign = kanan ? 'right' : 'left';
      ctx.fillText(g.label, px + (kanan ? -5 : 5), area.top + 14 + i * 15);
      ctx.restore();
    });
  }
};

if (typeof Chart !== 'undefined') {
  Chart.register(pluginLatarPutih, pluginGarisVertikal);
}

function warnaKe(i, dasar) {
  if (i === 0) return dasar || PALET[0];
  if (i < PALET.length) return PALET[i];
  return `hsl(${(i * 47) % 360} 40% 55%)`;
}

function buatChart(slot, canvasId, konfigurasi) {
  if (charts[slot]) charts[slot].destroy();
  charts[slot] = new Chart($(canvasId), konfigurasi);
}

function opsiDasar({ judul, labelX, labelY, legenda = true, mulaiNol = false }) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      title: { display: !!judul, text: judul || '', font: { size: 15 } },
      legend: { display: legenda }
    },
    scales: {
      x: { title: { display: !!labelX, text: labelX || '' } },
      y: { beginAtZero: mulaiNol, title: { display: !!labelY, text: labelY || '' } }
    }
  };
}

function binSturges(n) {
  return Math.max(5, Math.min(12, Math.ceil(Math.log2(n) + 1)));
}

function dataHistogram(arr, nBin, batasMin, batasMaks) {
  let awal = batasMin !== undefined ? Math.min(Stat.min(arr), batasMin) : Stat.min(arr);
  let akhir = batasMaks !== undefined ? Math.max(Stat.max(arr), batasMaks) : Stat.max(arr);
  if (awal === akhir) {
    awal -= 0.5;
    akhir += 0.5;
  }
  const lebar = (akhir - awal) / nBin;
  const hitung = new Array(nBin).fill(0);
  for (const v of arr) {
    hitung[Math.min(Math.floor((v - awal) / lebar), nBin - 1)]++;
  }
  const label = [];
  for (let i = 0; i < nBin; i++) {
    label.push(`${fmt(awal + i * lebar, 2)} - ${fmt(awal + (i + 1) * lebar, 2)}`);
  }
  return { awal, akhir, lebar, hitung, label };
}

function konfigHistogram(arr, o) {
  const h = dataHistogram(arr, o.nBin, o.batasMin, o.batasMaks);
  const warna = o.warna || PALET[0];
  const datasets = [{
    type: 'bar',
    label: 'Frekuensi',
    data: h.hitung,
    backgroundColor: warna + 'cc',
    borderColor: warna,
    borderWidth: 1,
    barPercentage: 1,
    categoryPercentage: 1,
    order: 2
  }];
  if (o.kurvaNormal) {
    const m = Stat.rata(arr), s = Stat.sd(arr);
    const harapan = h.hitung.map((_, i) => {
      const a = h.awal + i * h.lebar, b = a + h.lebar;
      return arr.length * (jStat.normal.cdf(b, m, s) - jStat.normal.cdf(a, m, s));
    });
    datasets.push({
      type: 'line',
      label: 'Kurva normal (harapan)',
      data: harapan,
      borderColor: PALET[1],
      backgroundColor: PALET[1],
      pointRadius: 3,
      tension: 0.3,
      order: 1
    });
  }
  const opsi = opsiDasar({ judul: o.judul, labelX: o.labelX, labelY: o.labelY || 'Frekuensi', legenda: o.legenda !== false, mulaiNol: true });
  if (o.garis) {
    opsi.plugins.garisVertikal = { garis: o.garis, awal: h.awal, lebarBin: h.lebar };
  }
  return { type: 'bar', data: { labels: h.label, datasets }, options: opsi };
}

function konfigBatang(labels, nilaiData, o) {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: o.namaSeri || 'Rata-rata',
        data: nilaiData,
        backgroundColor: labels.map((_, i) => warnaKe(i, PALET[0]) + 'cc'),
        borderColor: labels.map((_, i) => warnaKe(i, PALET[0])),
        borderWidth: 1
      }]
    },
    options: opsiDasar({ judul: o.judul, labelX: o.labelX, labelY: o.labelY, legenda: false, mulaiNol: true })
  };
}

function konfigScatterGaris(x, y, o) {
  const titik = x.map((v, i) => ({ x: v, y: y[i] }));
  const datasets = [{
    type: 'scatter',
    label: 'Data',
    data: titik,
    backgroundColor: PALET[0] + 'cc',
    borderColor: PALET[0],
    pointRadius: 5
  }];
  if (o.garis) {
    datasets.push({
      type: 'scatter',
      label: 'Garis regresi',
      data: o.garis,
      showLine: true,
      borderColor: PALET[1],
      backgroundColor: PALET[1],
      pointRadius: 0,
      borderWidth: 2
    });
  }
  return {
    type: 'scatter',
    data: { datasets },
    options: opsiDasar({ judul: o.judul, labelX: o.labelX, labelY: o.labelY, legenda: !!o.garis })
  };
}

/* ============================================================
   MENU: UJI HIPOTESIS
   ============================================================ */
function aturGrupUji() {
  const metode = $('pilih-metode').value;
  document.querySelectorAll('.grup-uji').forEach((g) => {
    g.hidden = g.dataset.metode !== metode;
  });
}

function kalimatKeputusan(p, alpha) {
  return p < alpha
    ? `Karena p-value (${fmtP(p)}) lebih kecil dari α (${fmt(alpha, 2)}), H0 ditolak.`
    : `Karena p-value (${fmtP(p)}) lebih besar atau sama dengan α (${fmt(alpha, 2)}), H0 gagal ditolak.`;
}

function jalankanUji() {
  if (!perluData()) return;
  const alpha = parseFloat($('alpha').value);
  const peta = {
    't-satu': ujiTSatu,
    't-independen': ujiTIndependen,
    't-berpasangan': ujiTBerpasangan,
    anova: ujiAnova,
    normalitas: ujiNormalitas,
    korelasi: ujiKorelasi,
    'chi-square': ujiChiSquare,
    regresi: ujiRegresi
  };
  try {
    const hasil = peta[$('pilih-metode').value](alpha);
    tampilHasil(hasil);
  } catch (err) {
    notif(err.message, 'error');
  }
}

function tampilHasil(h) {
  $('hasil-uji').hidden = false;
  $('hasil-judul').textContent = 'Hasil: ' + h.judul;
  $('hasil-h0').textContent = h.h0;
  $('hasil-h1').textContent = h.h1;
  isiTabel($('tabel-hasil'), h.kepala, h.baris);

  const tolak = h.p < h.alpha;
  const kep = $('hasil-keputusan');
  const teksP = h.p < 0.0001 ? 'p-value < 0,0001' : `p-value = ${fmtP(h.p)}`;
  kep.textContent = `${teksP}, ${tolak ? 'lebih kecil dari' : 'lebih besar atau sama dengan'} α = ${fmt(h.alpha, 2)}, sehingga ${tolak ? 'H0 ditolak' : 'H0 gagal ditolak'}`;
  kep.className = 'keputusan ' + (tolak ? 'signifikan' : 'tidak-signifikan');
  $('hasil-kesimpulan').textContent = h.kesimpulan;

  buatChart('uji', 'kanvas-uji', h.grafik);
  $('hasil-uji').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function wajibPilih(...nilaiPilih) {
  if (nilaiPilih.some((v) => !v)) {
    throw new Error('Pilih variabel terlebih dahulu. Pastikan data punya kolom numerik.');
  }
}

/* ----- One sample t-test ----- */
function ujiTSatu(alpha) {
  const kv = $('t1-var').value;
  wajibPilih(kv);
  const mu = parseFloat($('t1-mu').value);
  if (Number.isNaN(mu)) throw new Error('Isi nilai pembanding (μ₀) dengan angka.');
  const x = nilai(kv);
  if (x.length < 2) throw new Error('Variabel harus punya minimal 2 data angka.');
  const r = Stat.tSatu(x, mu, alpha);
  if (!Number.isFinite(r.t)) throw new Error('Semua data bernilai sama, uji tidak bisa dihitung.');
  const tolak = r.p < alpha;
  const pct = fmt((1 - alpha) * 100, 0);
  return {
    judul: 'One sample t-test',
    h0: `rata-rata ${kv} = ${fmt(mu)}`,
    h1: `rata-rata ${kv} ≠ ${fmt(mu)}`,
    p: r.p,
    alpha,
    kepala: ['Statistik', 'Nilai'],
    baris: [
      ['N', r.n],
      ['Rata-rata sampel', fmt(r.rata)],
      ['Std. deviasi', fmt(r.sd)],
      ['Std. error', fmt(r.se)],
      ['Nilai pembanding (μ₀)', fmt(mu)],
      ['t hitung', fmt(r.t)],
      ['Derajat bebas (df)', r.df],
      ['p-value (dua arah)', fmtP(r.p)],
      [`CI ${pct}% rata-rata`, `${fmt(r.ciBawah)} sampai ${fmt(r.ciAtas)}`]
    ],
    kesimpulan: `${kalimatKeputusan(r.p, alpha)} Rata-rata ${kv} (${fmt(r.rata)}) ${tolak ? 'berbeda' : 'tidak berbeda'} secara signifikan dari ${fmt(mu)}. Uji ini mengasumsikan data berdistribusi normal; cek lewat menu Uji normalitas.`,
    grafik: konfigHistogram(x, {
      nBin: binSturges(x.length),
      batasMin: Math.min(mu, r.rata),
      batasMaks: Math.max(mu, r.rata),
      judul: `Sebaran ${kv}`,
      labelX: kv,
      garis: [
        { nilai: r.rata, warna: PALET[0], label: `Rata-rata ${fmt(r.rata, 2)}` },
        { nilai: mu, warna: PALET[3], label: `μ₀ ${fmt(mu, 2)}`, putus: true }
      ]
    })
  };
}

/* ----- Independent t-test ----- */
function ujiTIndependen(alpha) {
  const kv = $('t2-var').value;
  const kg = $('t2-kelompok').value;
  wajibPilih(kv, kg);
  if (kv === kg) throw new Error('Variabel nilai dan variabel kelompok harus berbeda.');
  const grup = kelompokkan(kv, kg);
  if (grup.length !== 2) {
    throw new Error(`Variabel kelompok harus punya tepat 2 kategori (saat ini ${grup.length}). Untuk 3 kategori atau lebih, gunakan ANOVA.`);
  }
  const [g1, g2] = grup;
  if (g1.nilai.length < 2 || g2.nilai.length < 2) throw new Error('Tiap kelompok harus punya minimal 2 data angka.');
  const r = Stat.tWelch(g1.nilai, g2.nilai, alpha);
  if (!Number.isFinite(r.t)) throw new Error('Data tidak bervariasi sehingga uji tidak bisa dihitung.');
  const tolak = r.p < alpha;
  const pct = fmt((1 - alpha) * 100, 0);
  return {
    judul: 'Independent t-test (Welch)',
    h0: `rata-rata ${kv} kelompok ${g1.nama} = rata-rata ${kv} kelompok ${g2.nama}`,
    h1: `rata-rata ${kv} kelompok ${g1.nama} ≠ rata-rata ${kv} kelompok ${g2.nama}`,
    p: r.p,
    alpha,
    kepala: ['Statistik', 'Nilai'],
    baris: [
      [`N (${g1.nama})`, r.n1],
      [`Rata-rata (${g1.nama})`, fmt(r.m1)],
      [`Std. deviasi (${g1.nama})`, fmt(r.s1)],
      [`N (${g2.nama})`, r.n2],
      [`Rata-rata (${g2.nama})`, fmt(r.m2)],
      [`Std. deviasi (${g2.nama})`, fmt(r.s2)],
      ['Selisih rata-rata', fmt(r.selisih)],
      [`CI ${pct}% selisih`, `${fmt(r.ciBawah)} sampai ${fmt(r.ciAtas)}`],
      ['t hitung', fmt(r.t)],
      ['Derajat bebas (df)', fmt(r.df, 2)],
      ['p-value (dua arah)', fmtP(r.p)]
    ],
    kesimpulan: `${kalimatKeputusan(r.p, alpha)} Rata-rata ${kv} antara kelompok ${g1.nama} dan ${g2.nama} ${tolak ? 'berbeda' : 'tidak berbeda'} secara signifikan. Uji ini memakai metode Welch, sehingga varians kedua kelompok tidak perlu sama.`,
    grafik: konfigBatang([g1.nama, g2.nama], [r.m1, r.m2], {
      judul: `Rata-rata ${kv} per ${kg}`,
      labelX: kg,
      labelY: `Rata-rata ${kv}`
    })
  };
}

/* ----- Paired t-test ----- */
function ujiTBerpasangan(alpha) {
  const k1 = $('tp-var1').value;
  const k2 = $('tp-var2').value;
  wajibPilih(k1, k2);
  if (k1 === k2) throw new Error('Pilih dua variabel yang berbeda.');
  const { x, y } = pasangan(k1, k2);
  if (x.length < 2) throw new Error('Butuh minimal 2 baris yang kedua variabelnya terisi angka.');
  const selisih = x.map((v, i) => v - y[i]);
  const r = Stat.tSatu(selisih, 0, alpha);
  if (!Number.isFinite(r.t)) throw new Error('Semua selisih bernilai sama, uji tidak bisa dihitung.');
  const tolak = r.p < alpha;
  const pct = fmt((1 - alpha) * 100, 0);
  return {
    judul: 'Paired t-test',
    h0: `rata-rata selisih ${k1} dan ${k2} = 0`,
    h1: `rata-rata selisih ${k1} dan ${k2} ≠ 0`,
    p: r.p,
    alpha,
    kepala: ['Statistik', 'Nilai'],
    baris: [
      ['Pasangan data (N)', r.n],
      [`Rata-rata ${k1}`, fmt(Stat.rata(x))],
      [`Rata-rata ${k2}`, fmt(Stat.rata(y))],
      ['Rata-rata selisih', fmt(r.rata)],
      ['Std. deviasi selisih', fmt(r.sd)],
      ['Std. error', fmt(r.se)],
      [`CI ${pct}% selisih`, `${fmt(r.ciBawah)} sampai ${fmt(r.ciAtas)}`],
      ['t hitung', fmt(r.t)],
      ['Derajat bebas (df)', r.df],
      ['p-value (dua arah)', fmtP(r.p)]
    ],
    kesimpulan: `${kalimatKeputusan(r.p, alpha)} Rata-rata ${k1} dan ${k2} ${tolak ? 'berbeda' : 'tidak berbeda'} secara signifikan.`,
    grafik: konfigBatang([k1, k2], [Stat.rata(x), Stat.rata(y)], {
      judul: `Rata-rata ${k1} dan ${k2}`,
      labelY: 'Rata-rata'
    })
  };
}

/* ----- ANOVA one-way ----- */
function ujiAnova(alpha) {
  const kv = $('an-var').value;
  const kg = $('an-kelompok').value;
  wajibPilih(kv, kg);
  if (kv === kg) throw new Error('Variabel nilai dan variabel kelompok harus berbeda.');
  const grup = kelompokkan(kv, kg);
  if (grup.length < 2) throw new Error('Butuh minimal 2 kelompok. Pilih variabel kelompok yang punya lebih dari satu kategori.');
  const total = grup.reduce((s, g) => s + g.nilai.length, 0);
  if (total <= grup.length) throw new Error('Jumlah data harus lebih banyak daripada jumlah kelompok (tiap kelompok idealnya punya beberapa data).');
  const r = Stat.anova(grup.map((g) => g.nilai));
  if (!Number.isFinite(r.F)) throw new Error('Data dalam semua kelompok bernilai sama, uji tidak bisa dihitung.');
  const tolak = r.p < alpha;
  const namaGrup = grup.map((g) => g.nama);
  return {
    judul: 'ANOVA one-way',
    h0: `rata-rata ${kv} sama di semua kelompok ${kg}`,
    h1: `minimal ada satu kelompok ${kg} dengan rata-rata ${kv} yang berbeda`,
    p: r.p,
    alpha,
    kepala: ['Sumber variasi', 'Jumlah kuadrat', 'df', 'Rata-rata kuadrat', 'F', 'p-value'],
    baris: [
      ['Antar kelompok', fmt(r.ssb), r.dfb, fmt(r.msb), fmt(r.F), fmtP(r.p)],
      ['Dalam kelompok', fmt(r.ssw), r.dfw, fmt(r.msw), '', ''],
      ['Total', fmt(r.sst), r.dft, '', '', '']
    ],
    kesimpulan: `${kalimatKeputusan(r.p, alpha)} ` +
      (tolak
        ? `Ada perbedaan rata-rata ${kv} yang signifikan antar kelompok ${kg} (eta kuadrat = ${fmt(r.eta2, 3)}). Untuk mengetahui kelompok mana yang berbeda, diperlukan uji lanjut (post hoc). `
        : `Tidak ada bukti perbedaan rata-rata ${kv} antar kelompok ${kg}. `) +
      'ANOVA mengasumsikan data tiap kelompok berdistribusi normal dan varians antar kelompok sama.',
    grafik: konfigBatang(namaGrup, grup.map((g) => Stat.rata(g.nilai)), {
      judul: `Rata-rata ${kv} per ${kg}`,
      labelX: kg,
      labelY: `Rata-rata ${kv}`
    })
  };
}

/* ----- Uji normalitas (Shapiro-Wilk) ----- */
function ujiNormalitas(alpha) {
  const kv = $('nm-var').value;
  wajibPilih(kv);
  const x = nilai(kv);
  if (x.length < 3) throw new Error('Uji normalitas butuh minimal 3 data angka.');
  if (x.length > 5000) throw new Error('Shapiro-Wilk dibatasi sampai 5000 data.');
  const r = Stat.shapiro(x);
  if (!Number.isFinite(r.W)) throw new Error('Semua data bernilai sama, uji tidak bisa dihitung.');
  const tolak = r.p < alpha;
  return {
    judul: 'Uji normalitas Shapiro-Wilk',
    h0: `data ${kv} berdistribusi normal`,
    h1: `data ${kv} tidak berdistribusi normal`,
    p: r.p,
    alpha,
    kepala: ['Statistik', 'Nilai'],
    baris: [
      ['N', x.length],
      ['Rata-rata', fmt(Stat.rata(x))],
      ['Std. deviasi', fmt(Stat.sd(x))],
      ['Skewness', fmt(Stat.skewness(x))],
      ['Kurtosis (berlebih)', fmt(Stat.kurtosisBerlebih(x))],
      ['Statistik W', fmt(r.W)],
      ['p-value', fmtP(r.p)]
    ],
    kesimpulan: `${kalimatKeputusan(r.p, alpha)} Data ${kv} ${tolak ? 'tidak berdistribusi normal' : 'dapat dianggap berdistribusi normal'}. ` +
      (x.length < 20 ? 'Jumlah data masih sedikit, jadi uji ini kurang peka; lihat juga bentuk histogramnya.' : ''),
    grafik: konfigHistogram(x, {
      nBin: binSturges(x.length),
      judul: `Sebaran ${kv} dan kurva normal`,
      labelX: kv,
      kurvaNormal: true
    })
  };
}

/* ----- Korelasi Pearson ----- */
function ujiKorelasi(alpha) {
  const kx = $('kr-x').value;
  const ky = $('kr-y').value;
  wajibPilih(kx, ky);
  if (kx === ky) throw new Error('Pilih dua variabel yang berbeda.');
  const { x, y } = pasangan(kx, ky);
  if (x.length < 3) throw new Error('Butuh minimal 3 baris yang kedua variabelnya terisi angka.');
  const r = Stat.pearson(x, y);
  if (!Number.isFinite(r.r)) throw new Error('Salah satu variabel bernilai sama semua, korelasi tidak bisa dihitung.');
  const tolak = r.p < alpha;
  const a = Math.abs(r.r);
  const kekuatan = a < 0.2 ? 'sangat lemah' : a < 0.4 ? 'lemah' : a < 0.6 ? 'sedang' : a < 0.8 ? 'kuat' : 'sangat kuat';
  return {
    judul: 'Korelasi Pearson',
    h0: `tidak ada korelasi linear antara ${kx} dan ${ky} (ρ = 0)`,
    h1: `ada korelasi linear antara ${kx} dan ${ky} (ρ ≠ 0)`,
    p: r.p,
    alpha,
    kepala: ['Statistik', 'Nilai'],
    baris: [
      ['N', r.n],
      ['Koefisien korelasi (r)', fmt(r.r)],
      ['r kuadrat', fmt(r.r2)],
      ['t hitung', fmt(r.t)],
      ['Derajat bebas (df)', r.df],
      ['p-value (dua arah)', fmtP(r.p)]
    ],
    kesimpulan: `${kalimatKeputusan(r.p, alpha)} ` +
      (tolak
        ? `Terdapat korelasi ${r.r > 0 ? 'positif' : 'negatif'} yang ${kekuatan} dan signifikan antara ${kx} dan ${ky}.`
        : `Tidak ada korelasi linear yang signifikan antara ${kx} dan ${ky} (r = ${fmt(r.r)}).`),
    grafik: konfigScatterGaris(x, y, { judul: `${ky} terhadap ${kx}`, labelX: kx, labelY: ky })
  };
}

/* ----- Chi-square ----- */
function ujiChiSquare(alpha) {
  const k1 = $('ch-var1').value;
  const k2 = $('ch-var2').value;
  wajibPilih(k1, k2);
  if (k1 === k2) throw new Error('Pilih dua variabel yang berbeda.');
  const lengkap = baris.filter((r) => ada(r[k1]) && ada(r[k2]));
  const nama1 = urutkanKategori(lengkap.map((r) => r[k1]));
  const nama2 = urutkanKategori(lengkap.map((r) => r[k2]));
  if (nama1.length < 2 || nama2.length < 2) throw new Error('Kedua variabel harus punya minimal 2 kategori.');
  if (nama1.length * nama2.length > 400) throw new Error('Kategori terlalu banyak. Pilih variabel dengan kategori yang lebih sedikit.');
  const tabel = nama1.map(() => nama2.map(() => 0));
  for (const r of lengkap) {
    tabel[nama1.indexOf(String(r[k1]))][nama2.indexOf(String(r[k2]))]++;
  }
  const r = Stat.chiKuadrat(tabel);
  const tolak = r.p < alpha;
  const peringatan = r.kurang5 > 0
    ? ` Perhatian: ${r.kurang5} dari ${r.sel} sel punya frekuensi harapan di bawah 5, sehingga hasil kurang andal.`
    : '';
  return {
    judul: 'Chi-square independensi',
    h0: `${k1} dan ${k2} saling bebas (tidak berhubungan)`,
    h1: `${k1} dan ${k2} berhubungan`,
    p: r.p,
    alpha,
    kepala: ['Statistik', 'Nilai'],
    baris: [
      ['N', r.total],
      ['Ukuran tabel', `${r.R} x ${r.C}`],
      ['Chi-square', fmt(r.chi2)],
      ['Derajat bebas (df)', r.df],
      ['p-value', fmtP(r.p)],
      ['Cramér V', fmt(r.V)],
      ['Frekuensi harapan terkecil', fmt(r.minE, 2)]
    ],
    kesimpulan: `${kalimatKeputusan(r.p, alpha)} ${tolak ? `Ada hubungan yang signifikan antara ${k1} dan ${k2}.` : `Tidak ada bukti hubungan antara ${k1} dan ${k2}.`}${peringatan}`,
    grafik: {
      type: 'bar',
      data: {
        labels: nama1,
        datasets: nama2.map((n2, j) => ({
          label: n2,
          data: tabel.map((baris1) => baris1[j]),
          backgroundColor: warnaKe(j) + 'cc',
          borderColor: warnaKe(j),
          borderWidth: 1
        }))
      },
      options: opsiDasar({ judul: `${k1} berdasarkan ${k2}`, labelX: k1, labelY: 'Frekuensi', mulaiNol: true })
    }
  };
}

/* ----- Regresi linear sederhana ----- */
function ujiRegresi(alpha) {
  const kx = $('rg-x').value;
  const ky = $('rg-y').value;
  wajibPilih(kx, ky);
  if (kx === ky) throw new Error('Pilih dua variabel yang berbeda.');
  const { x, y } = pasangan(kx, ky);
  if (x.length < 3) throw new Error('Butuh minimal 3 baris yang kedua variabelnya terisi angka.');
  const r = Stat.regresi(x, y);
  if (!Number.isFinite(r.b1) || !Number.isFinite(r.t1)) throw new Error('Regresi tidak bisa dihitung. Pastikan variabel X bervariasi dan data tidak membentuk garis sempurna.');
  const tolak = r.p1 < alpha;
  const persamaan = `${ky} = ${fmt(r.b0)} ${r.b1 >= 0 ? '+' : '-'} ${fmt(Math.abs(r.b1))} x ${kx}`;
  return {
    judul: 'Regresi linear sederhana',
    h0: `koefisien ${kx} = 0 (${kx} tidak memengaruhi ${ky})`,
    h1: `koefisien ${kx} ≠ 0 (${kx} memengaruhi ${ky})`,
    p: r.p1,
    alpha,
    kepala: ['Statistik', 'Nilai'],
    baris: [
      ['N', r.n],
      ['Persamaan', persamaan],
      ['Intersep (b0)', fmt(r.b0)],
      ['Koefisien (b1)', fmt(r.b1)],
      ['Std. error b1', fmt(r.seB1)],
      ['t hitung (b1)', fmt(r.t1)],
      ['p-value (b1)', fmtP(r.p1)],
      ['R kuadrat', fmt(r.r2)],
      ['F hitung', fmt(r.F)],
      ['Derajat bebas (df)', r.df]
    ],
    kesimpulan: `${kalimatKeputusan(r.p1, alpha)} ` +
      (tolak
        ? `${kx} berpengaruh signifikan terhadap ${ky}. Setiap kenaikan 1 satuan ${kx} diikuti perubahan ${ky} sebesar ${fmt(r.b1)} satuan, dan model menjelaskan ${fmt(r.r2 * 100, 1)}% variasi ${ky}.`
        : `Tidak ada bukti bahwa ${kx} memengaruhi ${ky}.`),
    grafik: konfigScatterGaris(x, y, {
      judul: `Regresi ${ky} terhadap ${kx}`,
      labelX: kx,
      labelY: ky,
      garis: [
        { x: r.xmin, y: r.b0 + r.b1 * r.xmin },
        { x: r.xmax, y: r.b0 + r.b1 * r.xmax }
      ]
    })
  };
}

/* ============================================================
   MENU: VISUALISASI
   ============================================================ */
function agregasi(arr, jenis) {
  if (arr.length === 0) return null;
  switch (jenis) {
    case 'sum': return Stat.jumlah(arr);
    case 'count': return arr.length;
    case 'min': return Stat.min(arr);
    case 'max': return Stat.max(arr);
    default: return Stat.rata(arr);
  }
}

const NAMA_AGREGASI = { mean: 'Rata-rata', sum: 'Jumlah', count: 'Banyak data', min: 'Minimum', max: 'Maksimum' };

function aturFormGrafik() {
  const jenis = $('jenis-grafik').value;
  $('field-agregasi').hidden = !['bar', 'line', 'pie'].includes(jenis);
  $('field-kelompok').hidden = !['bar', 'line', 'scatter'].includes(jenis);
  $('field-bin').hidden = jenis !== 'histogram';
  $('sumbu-x').closest('.field').hidden = jenis === 'histogram';
  document.querySelector('label[for="sumbu-y"]').textContent = jenis === 'histogram' ? 'Variabel' : 'Sumbu Y';
}

function buatGrafikPengguna() {
  if (!perluData()) return;
  try {
    const jenis = $('jenis-grafik').value;
    const kx = $('sumbu-x').value;
    const ky = $('sumbu-y').value;
    const kg = $('pilih-kelompok').value;
    const fn = $('agregasi').value;
    const warna = $('warna-grafik').value;
    const legenda = $('tampil-legenda').checked;
    const judulIsian = $('judul-grafik').value.trim();
    const labelXIsian = $('label-x').value.trim();
    const labelYIsian = $('label-y').value.trim();

    if (!ky) throw new Error('Pilih variabel numerik untuk sumbu Y. Pastikan data punya kolom numerik.');
    let konfigurasi;

    if (jenis === 'histogram') {
      const arr = nilai(ky);
      if (arr.length < 2) throw new Error('Histogram butuh minimal 2 data angka.');
      const nBin = Math.max(2, Math.min(50, parseInt($('jumlah-bin').value, 10) || 8));
      konfigurasi = konfigHistogram(arr, {
        nBin,
        warna,
        judul: judulIsian || `Histogram ${ky}`,
        labelX: labelXIsian || ky,
        labelY: labelYIsian || 'Frekuensi',
        legenda
      });
    } else if (jenis === 'scatter') {
      if (!kx) throw new Error('Pilih variabel untuk sumbu X.');
      if (!kolomNumerik().includes(kx)) throw new Error('Untuk scatter, sumbu X harus variabel numerik.');
      const sumberGrup = kg ? [...new Set(baris.filter((r) => ada(r[kg])).map((r) => String(r[kg])))] : [null];
      const datasets = sumberGrup.map((g, i) => {
        const titik = baris
          .filter((r) => isNum(r[kx]) && isNum(r[ky]) && (g === null || String(r[kg]) === g))
          .map((r) => ({ x: r[kx], y: r[ky] }));
        const w = warnaKe(i, warna);
        return { label: g === null ? `${ky} terhadap ${kx}` : g, data: titik, backgroundColor: w + 'cc', borderColor: w, pointRadius: 5 };
      });
      konfigurasi = {
        type: 'scatter',
        data: { datasets },
        options: opsiDasar({ judul: judulIsian || `${ky} terhadap ${kx}`, labelX: labelXIsian || kx, labelY: labelYIsian || ky, legenda })
      };
    } else {
      // bar, line, pie
      if (!kx) throw new Error('Pilih variabel untuk sumbu X.');
      if (kx === ky) throw new Error('Sumbu X dan sumbu Y harus variabel yang berbeda.');
      const kategori = urutkanKategori(baris.filter((r) => ada(r[kx])).map((r) => r[kx]));
      if (kategori.length === 0) throw new Error('Variabel sumbu X belum berisi data.');
      if (kategori.length > 200) throw new Error('Kategori sumbu X terlalu banyak (lebih dari 200). Pilih variabel lain.');
      const ambil = (kat, grup) => baris
        .filter((r) => String(r[kx]) === kat && isNum(r[ky]) && (grup === null || String(r[kg]) === grup))
        .map((r) => r[ky]);
      const namaAgg = NAMA_AGREGASI[fn];
      const judul = judulIsian || `${namaAgg} ${ky} berdasarkan ${kx}`;
      const labelX = labelXIsian || kx;
      const labelY = labelYIsian || `${namaAgg} ${ky}`;

      if (jenis === 'pie') {
        const data = kategori.map((k) => agregasi(ambil(k, null), fn));
        konfigurasi = {
          type: 'pie',
          data: {
            labels: kategori,
            datasets: [{ data, backgroundColor: kategori.map((_, i) => warnaKe(i, warna)), borderColor: '#ffffff', borderWidth: 2 }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: judul, font: { size: 15 } },
              legend: { display: legenda }
            }
          }
        };
      } else {
        const sumberGrup = kg && kg !== kx ? [...new Set(baris.filter((r) => ada(r[kg])).map((r) => String(r[kg])))] : [null];
        const datasets = sumberGrup.map((g, i) => {
          const w = warnaKe(i, warna);
          const data = kategori.map((k) => agregasi(ambil(k, g), fn));
          const dasar = { label: g === null ? `${namaAgg} ${ky}` : g, data };
          return jenis === 'bar'
            ? { ...dasar, backgroundColor: w + 'cc', borderColor: w, borderWidth: 1 }
            : { ...dasar, borderColor: w, backgroundColor: w, tension: 0.2, spanGaps: true, pointRadius: 4 };
        });
        konfigurasi = {
          type: jenis,
          data: { labels: kategori, datasets },
          options: opsiDasar({ judul, labelX, labelY, legenda, mulaiNol: jenis === 'bar' })
        };
      }
    }

    buatChart('grafik', 'kanvas-grafik', konfigurasi);
    $('kosong-grafik').hidden = true;
    $('btn-unduh-grafik').hidden = false;
  } catch (err) {
    notif(err.message, 'error');
  }
}

function unduhGrafik() {
  if (!charts.grafik) return;
  const a = document.createElement('a');
  a.href = charts.grafik.toBase64Image('image/png', 1);
  a.download = 'grafik-ministat.png';
  a.click();
}

/* ============================================================
   INISIALISASI
   ============================================================ */
function init() {
  if (typeof window.initSidebar === 'function') {
    window.initSidebar();
  }

  // Menu
  document.querySelectorAll('.menu-btn').forEach((btn) => {
    btn.addEventListener('click', () => pindahPanel(btn.dataset.target));
  });

  // Upload
  const input = $('input-file');
  const zona = $('dropzone');
  input.addEventListener('change', () => {
    if (input.files[0]) bacaFile(input.files[0]);
    input.value = '';
  });
  ['dragenter', 'dragover'].forEach((ev) => zona.addEventListener(ev, (e) => {
    e.preventDefault();
    zona.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach((ev) => zona.addEventListener(ev, (e) => {
    e.preventDefault();
    zona.classList.remove('dragover');
  }));
  zona.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) bacaFile(file);
  });

  // Data
  $('btn-tambah-baris').addEventListener('click', tambahBaris);
  $('btn-hapus-baris').addEventListener('click', hapusBarisTerakhir);
  $('btn-hapus-data').addEventListener('click', hapusSemuaData);

  // Deskriptif
  $('btn-deskriptif').addEventListener('click', hitungDeskriptif);
  $('pilih-kategori').addEventListener('change', renderFrekuensi);

  // Uji
  $('pilih-metode').addEventListener('change', aturGrupUji);
  $('btn-jalankan').addEventListener('click', jalankanUji);
  aturGrupUji();

  // Grafik
  $('jenis-grafik').addEventListener('change', aturFormGrafik);
  $('sumbu-x').addEventListener('change', () => { $('sumbu-x').dataset.disentuh = '1'; });
  $('btn-buat-grafik').addEventListener('click', buatGrafikPengguna);
  $('btn-unduh-grafik').addEventListener('click', unduhGrafik);
  aturFormGrafik();

  dataBerubah(true);
}

init();