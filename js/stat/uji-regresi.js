/* ============================================================
   MiniStat - js/stat/uji-regresi.js
   Uji hipotesis Regresi Linear Sederhana
   ============================================================ */
"use strict";

window.Stat = window.Stat || {};

window.Stat.regresi = function (x, y) {
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
    n,
    b0,
    b1,
    r2,
    r: Math.sign(b1) * Math.sqrt(r2),
    df,
    seB0,
    seB1,
    t0,
    t1,
    p0: window.Stat.pDuaArah(t0, df),
    p1: window.Stat.pDuaArah(t1, df),
    F: t1 * t1,
    xmin: window.Stat.min(x),
    xmax: window.Stat.max(x),
  };
};

function ujiRegresi(alpha) {
  const kx = window.$("rg-x").value;
  const ky = window.$("rg-y").value;
  window.wajibPilih(kx, ky);
  if (kx === ky) throw new Error("Pilih dua variabel yang berbeda.");
  const { x, y } = window.pasangan(kx, ky);
  if (x.length < 3)
    throw new Error(
      "Butuh minimal 3 baris yang kedua variabelnya terisi angka."
    );
  const r = window.Stat.regresi(x, y);
  if (!Number.isFinite(r.b1) || !Number.isFinite(r.t1))
    throw new Error(
      "Regresi tidak bisa dihitung. Pastikan variabel X bervariasi dan data tidak membentuk garis sempurna."
    );
  const tolak = r.p1 < alpha;
  const persamaan = `${ky} = ${window.fmt(r.b0)} ${r.b1 >= 0 ? "+" : "-"} ${window.fmt(Math.abs(r.b1))} x ${kx}`;
  return {
    judul: "Regresi linear sederhana",
    h0: `koefisien ${kx} = 0 (${kx} tidak memengaruhi ${ky})`,
    h1: `koefisien ${kx} ≠ 0 (${kx} memengaruhi ${ky})`,
    p: r.p1,
    alpha,
    kepala: ["Statistik", "Nilai"],
    baris: [
      ["N", r.n],
      ["Persamaan", persamaan],
      ["Intersep (b0)", window.fmt(r.b0)],
      ["Koefisien (b1)", window.fmt(r.b1)],
      ["Std. error b1", window.fmt(r.seB1)],
      ["t hitung (b1)", window.fmt(r.t1)],
      ["p-value (b1)", window.fmtP(r.p1)],
      ["R kuadrat", window.fmt(r.r2)],
      ["F hitung", window.fmt(r.F)],
      ["Derajat bebas (df)", r.df],
    ],
    kesimpulan:
      `${window.kalimatKeputusan(r.p1, alpha)} ` +
      (tolak
        ? `${kx} berpengaruh signifikan terhadap ${ky}. Setiap kenaikan 1 satuan ${kx} diikuti perubahan ${ky} sebesar ${window.fmt(r.b1)} satuan, dan model menjelaskan ${window.fmt(r.r2 * 100, 1)}% variasi ${ky}.`
        : `Tidak ada bukti bahwa ${kx} memengaruhi ${ky}.`),
    grafik: window.konfigScatterGaris(x, y, {
      judul: `Regresi ${ky} terhadap ${kx}`,
      labelX: kx,
      labelY: ky,
      garis: [
        { x: r.xmin, y: r.b0 + r.b1 * r.xmin },
        { x: r.xmax, y: r.b0 + r.b1 * r.xmax },
      ],
    }),
  };
}

window.ujiRegresi = ujiRegresi;
