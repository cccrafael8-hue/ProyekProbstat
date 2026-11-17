/* ============================================================
   MiniStat - js/stat/uji-anova.js
   Uji hipotesis ANOVA One-Way
   ============================================================ */
"use strict";

window.Stat = window.Stat || {};

window.Stat.anova = function (groups) {
  const semua = [];
  for (const g of groups) for (const v of g) semua.push(v);
  const N = semua.length;
  const k = groups.length;
  const grand = window.Stat.rata(semua);
  let ssb = 0,
    ssw = 0;
  for (const g of groups) {
    const m = window.Stat.rata(g);
    ssb += g.length * (m - grand) * (m - grand);
    for (const v of g) ssw += (v - m) * (v - m);
  }
  const dfb = k - 1;
  const dfw = N - k;
  const msb = ssb / dfb;
  const msw = ssw / dfw;
  const F = msb / msw;
  const p = Number.isFinite(F)
    ? 1 - jStat.centralF.cdf(F, dfb, dfw)
    : F > 0
      ? 0
      : NaN;
  return {
    N,
    k,
    ssb,
    ssw,
    sst: ssb + ssw,
    dfb,
    dfw,
    dft: N - 1,
    msb,
    msw,
    F,
    p,
    eta2: ssb / (ssb + ssw),
  };
};

function ujiAnova(alpha) {
  const kv = window.$("an-var").value;
  const kg = window.$("an-kelompok").value;
  window.wajibPilih(kv, kg);
  if (kv === kg)
    throw new Error("Variabel nilai dan variabel kelompok harus berbeda.");
  const grup = window.kelompokkan(kv, kg);
  if (grup.length < 2) {
    throw new Error(
      "Butuh minimal 2 kelompok. Pilih variabel kelompok yang punya lebih dari satu kategori."
    );
  }
  const total = grup.reduce((s, g) => s + g.nilai.length, 0);
  if (total <= grup.length) {
    throw new Error(
      "Jumlah data harus lebih banyak daripada jumlah kelompok (tiap kelompok idealnya punya beberapa data)."
    );
  }
  const r = window.Stat.anova(grup.map((g) => g.nilai));
  if (!Number.isFinite(r.F))
    throw new Error(
      "Data dalam semua kelompok bernilai sama, uji tidak bisa dihitung."
    );
  const tolak = r.p < alpha;
  const namaGrup = grup.map((g) => g.nama);
  return {
    judul: "ANOVA one-way",
    h0: `rata-rata ${kv} sama di semua kelompok ${kg}`,
    h1: `minimal ada satu kelompok ${kg} dengan rata-rata ${kv} yang berbeda`,
    p: r.p,
    alpha,
    kepala: [
      "Sumber variasi",
      "Jumlah kuadrat",
      "df",
      "Rata-rata kuadrat",
      "F",
      "p-value",
    ],
    baris: [
      ["Antar kelompok", window.fmt(r.ssb), r.dfb, window.fmt(r.msb), window.fmt(r.F), window.fmtP(r.p)],
      ["Dalam kelompok", window.fmt(r.ssw), r.dfw, window.fmt(r.msw), "", ""],
      ["Total", window.fmt(r.sst), r.dft, "", "", ""],
    ],
    kesimpulan:
      `${window.kalimatKeputusan(r.p, alpha)} ` +
      (tolak
        ? `Ada perbedaan rata-rata ${kv} yang signifikan antar kelompok ${kg} (eta kuadrat = ${window.fmt(r.eta2, 3)}). Untuk mengetahui kelompok mana yang berbeda, diperlukan uji lanjut (post hoc). `
        : `Tidak ada bukti perbedaan rata-rata ${kv} antar kelompok ${kg}. `) +
      "ANOVA mengasumsikan data tiap kelompok berdistribusi normal dan varians antar kelompok sama.",
    grafik: window.konfigBatang(
      namaGrup,
      grup.map((g) => window.Stat.rata(g.nilai)),
      {
        judul: `Rata-rata ${kv} per ${kg}`,
        labelX: kg,
        labelY: `Rata-rata ${kv}`,
      }
    ),
  };
}

window.ujiAnova = ujiAnova;
