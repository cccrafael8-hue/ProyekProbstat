/* ============================================================
   MiniStat - js/stat/uji-t-satu.js
   Uji hipotesis One Sample t-test
   ============================================================ */
"use strict";

window.Stat = window.Stat || {};

window.Stat.tSatu = function (x, mu, alpha) {
  const n = x.length;
  const rata = window.Stat.rata(x);
  const sd = window.Stat.sd(x);
  const se = sd / Math.sqrt(n);
  const df = n - 1;
  const t = (rata - mu) / se;
  const p = window.Stat.pDuaArah(t, df);
  const kritis = jStat.studentt.inv(1 - alpha / 2, df);
  return {
    n,
    rata,
    sd,
    se,
    df,
    t,
    p,
    ciBawah: rata - kritis * se,
    ciAtas: rata + kritis * se,
  };
};

function ujiTSatu(alpha) {
  const kv = window.$("t1-var").value;
  window.wajibPilih(kv);
  const mu = parseFloat(window.$("t1-mu").value);
  if (Number.isNaN(mu))
    throw new Error("Isi nilai pembanding (μ₀) dengan angka.");
  const x = window.nilai(kv);
  if (x.length < 2)
    throw new Error("Variabel harus punya minimal 2 data angka.");
  const r = window.Stat.tSatu(x, mu, alpha);
  if (!Number.isFinite(r.t))
    throw new Error("Semua data bernilai sama, uji tidak bisa dihitung.");
  const tolak = r.p < alpha;
  const pct = window.fmt((1 - alpha) * 100, 0);
  return {
    judul: "One sample t-test",
    h0: `rata-rata ${kv} = ${window.fmt(mu)}`,
    h1: `rata-rata ${kv} ≠ ${window.fmt(mu)}`,
    p: r.p,
    alpha,
    kepala: ["Statistik", "Nilai"],
    baris: [
      ["N", r.n],
      ["Rata-rata sampel", window.fmt(r.rata)],
      ["Std. deviasi", window.fmt(r.sd)],
      ["Std. error", window.fmt(r.se)],
      ["Nilai pembanding (μ₀)", window.fmt(mu)],
      ["t hitung", window.fmt(r.t)],
      ["Derajat bebas (df)", r.df],
      ["p-value (dua arah)", window.fmtP(r.p)],
      [`CI ${pct}% rata-rata`, `${window.fmt(r.ciBawah)} sampai ${window.fmt(r.ciAtas)}`],
    ],
    kesimpulan: `${window.kalimatKeputusan(r.p, alpha)} Rata-rata ${kv} (${window.fmt(r.rata)}) ${tolak ? "berbeda" : "tidak berbeda"} secara signifikan dari ${window.fmt(mu)}. Uji ini mengasumsikan data berdistribusi normal; cek lewat menu Uji normalitas.`,
    grafik: window.konfigHistogram(x, {
      nBin: window.binSturges(x.length),
      batasMin: Math.min(mu, r.rata),
      batasMaks: Math.max(mu, r.rata),
      judul: `Sebaran ${kv}`,
      labelX: kv,
      garis: [
        {
          nilai: r.rata,
          warna: window.PALET[0],
          label: `Rata-rata ${window.fmt(r.rata, 2)}`,
        },
        { nilai: mu, warna: window.PALET[3], label: `μ₀ ${window.fmt(mu, 2)}`, putus: true },
      ],
    }),
  };
}

window.ujiTSatu = ujiTSatu;
