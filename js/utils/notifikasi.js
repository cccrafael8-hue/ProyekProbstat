/* ============================================================
   MiniStat - js/utils/notifikasi.js
   Fungsi menampilkan pesan toast notifikasi
   ============================================================ */
"use strict";

let timerNotif = null;

function notif(pesan, jenis = "info") {
  const el = window.$ ? window.$("notifikasi") : document.getElementById("notifikasi");
  if (!el) return;
  el.className = "notifikasi " + jenis;
  el.textContent = pesan;
  el.hidden = false;
  clearTimeout(timerNotif);
  timerNotif = setTimeout(() => {
    el.hidden = true;
  }, 7000);
}

window.notif = notif;
