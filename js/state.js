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
window.PALET = [
  "#4d8a77",
  "#d98e3f",
  "#4f7cac",
  "#b5566e",
  "#8a6fc0",
  "#6aa84f",
  "#c2a12b",
  "#3aa6b0",
];
