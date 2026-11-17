/* ============================================================
   MiniStat - js/stat/uji-normalitas.js
   Uji hipotesis Normalitas Shapiro-Wilk
   ============================================================ */
"use strict";

window.Stat = window.Stat || {};

// Shapiro-Wilk (algoritma Royston, n = 3 sampai 5000)
window.Stat.shapiro = function (data) {
  const x = [...data].sort((a, b) => a - b);
  const n = x.length;
  const nn2 = Math.floor(n / 2);
  const poly = (cc, v) => {
    let r = 0;
    for (let j = cc.length - 1; j >= 0; j--) r = r * v + cc[j];
    return r;
  };
  const m = [];
  for (let i = 1; i <= nn2; i++)
    m[i] = jStat.normal.inv((i - 0.375) / (n + 0.25), 0, 1);
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
      fac = Math.sqrt(
        (summ2 - 2 * m[1] * m[1] - 2 * m[2] * m[2]) /
          (1 - 2 * a1 * a1 - 2 * a2 * a2)
      );
      a[2] = a2;
    } else {
      i1 = 2;
      fac = Math.sqrt((summ2 - 2 * m[1] * m[1]) / (1 - 2 * a1 * a1));
    }
    a[1] = a1;
    for (let i = i1; i <= nn2; i++) a[i] = -m[i] / fac;
  }
  const mean = window.Stat.rata(x);
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
    let yy = y,
      mu,
      sigma;
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
};

function ujiNormalitas(alpha) {
  const kv = window.$("nm-var").value;
  window.wajibPilih(kv);
  const x = window.nilai(kv);
  if (x.length < 3)
    throw new Error("Uji normalitas butuh minimal 3 data angka.");
  if (x.length > 5000)
    throw new Error("Shapiro-Wilk dibatasi sampai 5000 data.");
  const r = window.Stat.shapiro(x);
  if (!Number.isFinite(r.W))
    throw new Error("Semua data bernilai sama, uji tidak bisa dihitung.");
  const tolak = r.p < alpha;
  return {
    judul: "Uji normalitas Shapiro-Wilk",
    h0: `data ${kv} berdistribusi normal`,
    h1: `data ${kv} tidak berdistribusi normal`,
    p: r.p,
    alpha,
    kepala: ["Statistik", "Nilai"],
    baris: [
      ["N", x.length],
      ["Rata-rata", window.fmt(window.Stat.rata(x))],
      ["Std. deviasi", window.fmt(window.Stat.sd(x))],
      ["Skewness", window.fmt(window.Stat.skewness(x))],
      ["Kurtosis (berlebih)", window.fmt(window.Stat.kurtosisBerlebih(x))],
      ["Statistik W", window.fmt(r.W)],
      ["p-value", window.fmtP(r.p)],
    ],
    kesimpulan:
      `${window.kalimatKeputusan(r.p, alpha)} Data ${kv} ${tolak ? "tidak berdistribusi normal" : "dapat dianggap berdistribusi normal"}. ` +
      (x.length < 20
        ? "Jumlah data masih sedikit, jadi uji ini kurang peka; lihat juga bentuk histogramnya."
        : ""),
    grafik: window.konfigHistogram(x, {
      nBin: window.binSturges(x.length),
      judul: `Sebaran ${kv} dan kurva normal`,
      labelX: kv,
      kurvaNormal: true,
    }),
  };
}

window.ujiNormalitas = ujiNormalitas;
