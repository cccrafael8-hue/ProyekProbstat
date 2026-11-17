/* ============================================================
   MiniStat - js/stat/uji-t-independen.js
   Uji hipotesis Independent t-test (Welch)
   ============================================================ */
"use strict";

window.Stat = window.Stat || {};

window.Stat.tWelch = function (a, b, alpha) {
  const n1 = a.length,
    n2 = b.length;
  const m1 = window.Stat.rata(a),
    m2 = window.Stat.rata(b);
  const v1 = window.Stat.varian(a),
    v2 = window.Stat.varian(b);
  const se2 = v1 / n1 + v2 / n2;
  const se = Math.sqrt(se2);
  const t = (m1 - m2) / se;
  const df =
    (se2 * se2) / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
  const p = window.Stat.pDuaArah(t, df);
  const kritis = jStat.studentt.inv(1 - alpha / 2, df);
  const selisih = m1 - m2;
  return {
    n1,
    n2,
    m1,
    m2,
    s1: Math.sqrt(v1),
    s2: Math.sqrt(v2),
    selisih,
    se,
    t,
    df,
    p,
    ciBawah: selisih - kritis * se,
    ciAtas: selisih + kritis * se,
  };
};

function ujiTIndependen(alpha) {
  const kv = window.$("t2-var").value;
  const kg = window.$("t2-kelompok").value;
  window.wajibPilih(kv, kg);
  if (kv === kg)
    throw new Error("Variabel nilai dan variabel kelompok harus berbeda.");
  const grup = window.kelompokkan(kv, kg);
  if (grup.length !== 2) {
    throw new Error(
      `Variabel kelompok harus punya tepat 2 kategori (saat ini ${grup.length}). Untuk 3 kategori atau lebih, gunakan ANOVA.`
    );
  }
  const [g1, g2] = grup;
  if (g1.nilai.length < 2 || g2.nilai.length < 2)
    throw new Error("Tiap kelompok harus punya minimal 2 data angka.");
  const r = window.Stat.tWelch(g1.nilai, g2.nilai, alpha);
  if (!Number.isFinite(r.t))
    throw new Error("Data tidak bervariasi sehingga uji tidak bisa dihitung.");
  const tolak = r.p < alpha;
  const pct = window.fmt((1 - alpha) * 100, 0);
  return {
    judul: "Independent t-test (Welch)",
    h0: `rata-rata ${kv} kelompok ${g1.nama} = rata-rata ${kv} kelompok ${g2.nama}`,
    h1: `rata-rata ${kv} kelompok ${g1.nama} ≠ rata-rata ${kv} kelompok ${g2.nama}`,
    p: r.p,
    alpha,
    kepala: ["Statistik", "Nilai"],
    baris: [
      [`N (${g1.nama})`, r.n1],
      [`Rata-rata (${g1.nama})`, window.fmt(r.m1)],
      [`Std. deviasi (${g1.nama})`, window.fmt(r.s1)],
      [`N (${g2.nama})`, r.n2],
      [`Rata-rata (${g2.nama})`, window.fmt(r.m2)],
      [`Std. deviasi (${g2.nama})`, window.fmt(r.s2)],
      ["Selisih rata-rata", window.fmt(r.selisih)],
      [`CI ${pct}% selisih`, `${window.fmt(r.ciBawah)} sampai ${window.fmt(r.ciAtas)}`],
      ["t hitung", window.fmt(r.t)],
      ["Derajat bebas (df)", window.fmt(r.df, 2)],
      ["p-value (dua arah)", window.fmtP(r.p)],
    ],
    kesimpulan: `${window.kalimatKeputusan(r.p, alpha)} Rata-rata ${kv} antara kelompok ${g1.nama} dan ${g2.nama} ${tolak ? "berbeda" : "tidak berbeda"} secara signifikan. Uji ini memakai metode Welch, sehingga varians kedua kelompok tidak perlu sama.`,
    grafik: window.konfigBatang([g1.nama, g2.nama], [r.m1, r.m2], {
      judul: `Rata-rata ${kv} per ${kg}`,
      labelX: kg,
      labelY: `Rata-rata ${kv}`,
    }),
  };
}

window.ujiTIndependen = ujiTIndependen;
