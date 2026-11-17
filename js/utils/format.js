/* ============================================================
   MiniStat - js/utils/format.js
   Fungsi pembantu pemformatan angka dan teks
   ============================================================ */
"use strict";

function fmt(n, d = 4) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "-";
  return Number(n).toLocaleString("id-ID", { maximumFractionDigits: d });
}

function fmtP(p) {
  if (!Number.isFinite(p)) return "-";
  return p < 0.0001 ? "< 0,0001" : fmt(p, 4);
}

window.fmt = fmt;
window.fmtP = fmtP;
