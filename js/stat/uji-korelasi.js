/* ============================================================
   MiniStat - js/stat/uji-korelasi.js
   Uji hipotesis Korelasi Pearson
   ============================================================ */
"use strict";

window.Stat = window.Stat || {};

window.Stat.pearson = function (x, y) {
  const n = x.length;
  const mx = window.Stat.rata(x),
    my = window.Stat.rata(y);
  let sxx = 0,
    syy = 0,
    sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
    sxy += (x[i] - mx) * (y[i] - my);
  }
  const r = sxy / Math.sqrt(sxx * syy);
  const df = n - 2;
  const t = r * Math.sqrt(df / (1 - r * r));
  return { n, r, r2: r * r, df, t, p: window.Stat.pDuaArah(t, df) };
};

function ujiKorelasi(alpha) {
  const kx = window.$("kr-x").value;
  const ky = window.$("kr-y").value;
  window.wajibPilih(kx, ky);
  if (kx === ky) throw new Error("Pilih dua variabel yang berbeda.");
  const { x, y } = window.pasangan(kx, ky);
  if (x.length < 3)
    throw new Error(
      "Butuh minimal 3 baris yang kedua variabelnya terisi angka."
    );
  const r = window.Stat.pearson(x, y);
  if (!Number.isFinite(r.r))
    throw new Error(
      "Salah satu variabel bernilai sama semua, korelasi tidak bisa dihitung."
    );
  const tolak = r.p < alpha;
  const a = Math.abs(r.r);
  const kekuatan =
    a < 0.2
      ? "sangat lemah"
      : a < 0.4
        ? "lemah"
        : a < 0.6
          ? "sedang"
          : a < 0.8
            ? "kuat"
            : "sangat kuat";
  return {
    judul: "Korelasi Pearson",
    h0: `tidak ada korelasi linear antara ${kx} dan ${ky} (ρ = 0)`,
    h1: `ada korelasi linear antara ${kx} dan ${ky} (ρ ≠ 0)`,
    p: r.p,
    alpha,
    kepala: ["Statistik", "Nilai"],
    baris: [
      ["N", r.n],
      ["Koefisien korelasi (r)", window.fmt(r.r)],
      ["r kuadrat", window.fmt(r.r2)],
      ["t hitung", window.fmt(r.t)],
      ["Derajat bebas (df)", r.df],
      ["p-value (dua arah)", window.fmtP(r.p)],
    ],
    kesimpulan:
      `${window.kalimatKeputusan(r.p, alpha)} ` +
      (tolak
        ? `Terdapat korelasi ${r.r > 0 ? "positif" : "negatif"} yang ${kekuatan} dan signifikan antara ${kx} dan ${ky}.`
        : `Tidak ada korelasi linear yang signifikan antara ${kx} dan ${ky} (r = ${window.fmt(r.r)}).`),
    grafik: window.konfigScatterGaris(x, y, {
      judul: `${ky} terhadap ${kx}`,
      labelX: kx,
      labelY: ky,
    }),
  };
}

window.ujiKorelasi = ujiKorelasi;
