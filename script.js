/* ============================================================
   MiniStat - script.js
   
   File ini sebelumnya berisi seluruh logika aplikasi secara monolitik (1870+ baris).
   Sesuai prinsip modularitas dan "1 file untuk 1 fungsi", seluruh kode telah
   dipecah menjadi berkas-berkas modular di dalam direktori `js/`:

   1. State & Utilitas:
      - js/state.js                  : State global (kolom, baris, charts, palet, dll.)
      - js/utils/format.js           : Format angka desimal dan p-value (fmt, fmtP)
      - js/utils/notifikasi.js       : Sistem notifikasi toast (notif)
      - js/utils/data-helpers.js     : Helper data tabel (isNum, ada, norm, nilai, kelompokkan, dll.)
      - js/utils/tabel-dom.js        : Helper DOM tabel dan select (isiBody, isiTabel, isiSelect, dll.)

   2. Statistik & Uji Hipotesis (1 file untuk 1 fungsi / jenis uji):
      - js/stat/stat-dasar.js        : Rumus dasar statistik (rata, median, varian, sd, skewness, kurtosis, dll.)
      - js/stat/uji-t-satu.js         : One Sample t-test (Stat.tSatu & ujiTSatu)
      - js/stat/uji-t-independen.js   : Independent t-test Welch (Stat.tWelch & ujiTIndependen)
      - js/stat/uji-t-berpasangan.js  : Paired t-test (ujiTBerpasangan)
      - js/stat/uji-anova.js          : One-Way ANOVA (Stat.anova & ujiAnova)
      - js/stat/uji-normalitas.js     : Uji Normalitas Shapiro-Wilk (Stat.shapiro & ujiNormalitas)
      - js/stat/uji-korelasi.js       : Korelasi Pearson (Stat.pearson & ujiKorelasi)
      - js/stat/uji-chi-square.js     : Chi-Square Independensi (Stat.chiKuadrat & ujiChiSquare)
      - js/stat/uji-regresi.js        : Regresi Linear Sederhana (Stat.regresi & ujiRegresi)

   3. Modul Tampilan, Data & Visualisasi:
      - js/sidebar.js                : Navigasi sidebar drawer & responsif
      - js/modules/data-view.js      : Pembacaan file CSV/Excel, data view & variable view
      - js/modules/deskriptif.js     : Tampilan tabel deskriptif dan tabel frekuensi
      - js/modules/grafik-helpers.js  : Plugin Chart.js & generator konfigurasi chart
      - js/modules/hipotesis-runner.js: Pengatur form & penampil hasil uji hipotesis
      - js/modules/visualisasi.js    : Generator grafik kustom & ekspor PNG

   4. Loader & Inisialisasi:
      - js/component-loader.js       : Pemuat modular file HTML components/
      - js/app.js                    : Entry point inisialisasi aplikasi dan event listener
   ============================================================ */
"use strict";

console.log("MiniStat: Mode modular aktif. Komponen dan modul dimuat dari direktori js/ dan components/.");
