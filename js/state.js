/* ============================================================
   MiniStat - js/state.js
   State global dan konstanta aplikasi
   ============================================================ */
"use strict";

window.$ = (id) => document.getElementById(id);

window.kolom = []; // nama kolom
window.baris = []; // data: array objek {namaKolom: nilai}
window.namaFile = "";
window.charts = { uji: null, grafik: null };

window.BATAS_TAMPIL = 500;

// Vibrant palette tuned for dark backgrounds
window.PALET = [
  "#7c5cfc",   // violet
  "#22d3ee",   // cyan
  "#f472b6",   // pink
  "#34d399",   // emerald
  "#fb923c",   // orange
  "#a78bfa",   // purple-light
  "#fbbf24",   // amber
  "#38bdf8",   // sky blue
];
