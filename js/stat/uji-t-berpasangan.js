/* ============================================================
   MiniStat - js/stat/uji-t-berpasangan.js
   Uji hipotesis Paired t-test
   ============================================================ */
"use strict";

function ujiTBerpasangan(alpha) {
  const k1 = window.$("tp-var1").value;
  const k2 = window.$("tp-var2").value;
  window.wajibPilih(k1, k2);
  if (k1 === k2) throw new Error("Pilih dua variabel yang berbeda.");
  const { x, y } = window.pasangan(k1, k2);
  if (x.length < 2)
    throw new Error(
      "Butuh minimal 2 baris yang kedua variabelnya terisi angka."
    );
  const selisih = x.map((v, i) => v - y[i]);
  const r = window.Stat.tSatu(selisih, 0, alpha);
  if (!Number.isFinite(r.t))
    throw new Error("Semua selisih bernilai sama, uji tidak bisa dihitung.");
  const tolak = r.p < alpha;
  const pct = window.fmt((1 - alpha) * 100, 0);
  return {
    judul: "Paired t-test",
    h0: `rata-rata selisih ${k1} dan ${k2} = 0`,
    h1: `rata-rata selisih ${k1} dan ${k2} ≠ 0`,
    p: r.p,
    alpha,
    kepala: ["Statistik", "Nilai"],
    baris: [
      ["Pasangan data (N)", r.n],
      [`Rata-rata ${k1}`, window.fmt(window.Stat.rata(x))],
      [`Rata-rata ${k2}`, window.fmt(window.Stat.rata(y))],
      ["Rata-rata selisih", window.fmt(r.rata)],
      ["Std. deviasi selisih", window.fmt(r.sd)],
      ["Std. error", window.fmt(r.se)],
      [`CI ${pct}% selisih`, `${window.fmt(r.ciBawah)} sampai ${window.fmt(r.ciAtas)}`],
      ["t hitung", window.fmt(r.t)],
      ["Derajat bebas (df)", r.df],
      ["p-value (dua arah)", window.fmtP(r.p)],
    ],
    kesimpulan: `${window.kalimatKeputusan(r.p, alpha)} Rata-rata ${k1} dan ${k2} ${tolak ? "berbeda" : "tidak berbeda"} secara signifikan.`,
    grafik: window.konfigBatang([k1, k2], [window.Stat.rata(x), window.Stat.rata(y)], {
      judul: `Rata-rata ${k1} dan ${k2}`,
      labelY: "Rata-rata",
    }),
  };
}

window.ujiTBerpasangan = ujiTBerpasangan;
