/* ============================================================
   MiniStat - js/stat/stat-dasar.js
   Fungsi matematika dasar statistik dan distribusi
   ============================================================ */
"use strict";

const Stat = window.Stat || {};

Stat.jumlah = function (a) {
  let s = 0;
  for (const v of a) s += v;
  return s;
};

Stat.rata = function (a) {
  return Stat.jumlah(a) / a.length;
};

Stat.median = function (a) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

Stat.varian = function (a) {
  if (a.length < 2) return NaN;
  const m = Stat.rata(a);
  let s = 0;
  for (const v of a) s += (v - m) * (v - m);
  return s / (a.length - 1);
};

Stat.sd = function (a) {
  return Math.sqrt(Stat.varian(a));
};

Stat.min = function (a) {
  let m = Infinity;
  for (const v of a) if (v < m) m = v;
  return m;
};

Stat.max = function (a) {
  let m = -Infinity;
  for (const v of a) if (v > m) m = v;
  return m;
};

Stat.momen = function (a, k) {
  const m = Stat.rata(a);
  let s = 0;
  for (const v of a) s += Math.pow(v - m, k);
  return s / a.length;
};

Stat.skewness = function (a) {
  return Stat.momen(a, 3) / Math.pow(Stat.momen(a, 2), 1.5);
};

Stat.kurtosisBerlebih = function (a) {
  const m2 = Stat.momen(a, 2);
  return Stat.momen(a, 4) / (m2 * m2) - 3;
};

// p-value dua arah dari distribusi t
Stat.pDuaArah = function (t, df) {
  if (Number.isNaN(t)) return NaN;
  if (!Number.isFinite(t)) return 0;
  return 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
};

window.Stat = Stat;
