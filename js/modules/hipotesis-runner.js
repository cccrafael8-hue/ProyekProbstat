/* ============================================================
   MiniStat - js/modules/hipotesis-runner.js
   Modul eksekusi uji hipotesis dan penampilan hasil
   ============================================================ */
"use strict";

function aturGrupUji() {
  const metode = window.$("pilih-metode").value;
  document.querySelectorAll(".grup-uji").forEach((g) => {
    g.hidden = g.dataset.metode !== metode;
  });
}

function kalimatKeputusan(p, alpha) {
  return p < alpha
    ? `Karena p-value (${window.fmtP(p)}) lebih kecil dari α (${window.fmt(alpha, 2)}), H0 ditolak.`
    : `Karena p-value (${window.fmtP(p)}) lebih besar atau sama dengan α (${window.fmt(alpha, 2)}), H0 gagal ditolak.`;
}

function jalankanUji() {
  if (!window.perluData()) return;
  const alpha = parseFloat(window.$("alpha").value);
  const peta = {
    "t-satu": window.ujiTSatu,
    "t-independen": window.ujiTIndependen,
    "t-berpasangan": window.ujiTBerpasangan,
    anova: window.ujiAnova,
    normalitas: window.ujiNormalitas,
    korelasi: window.ujiKorelasi,
    "chi-square": window.ujiChiSquare,
    regresi: window.ujiRegresi,
  };
  try {
    const fn = peta[window.$("pilih-metode").value];
    if (typeof fn !== "function") {
      throw new Error("Metode uji belum siap atau tidak ditemukan.");
    }
    const hasil = fn(alpha);
    tampilHasil(hasil);
  } catch (err) {
    window.notif(err.message, "error");
  }
}

function tampilHasil(h) {
  window.$("hasil-uji").hidden = false;
  window.$("hasil-judul").textContent = "Hasil: " + h.judul;
  window.$("hasil-h0").textContent = h.h0;
  window.$("hasil-h1").textContent = h.h1;
  window.isiTabel(window.$("tabel-hasil"), h.kepala, h.baris);

  const tolak = h.p < h.alpha;
  const kep = window.$("hasil-keputusan");
  const teksP = h.p < 0.0001 ? "p-value < 0,0001" : `p-value = ${window.fmtP(h.p)}`;
  kep.textContent = `${teksP}, ${tolak ? "lebih kecil dari" : "lebih besar atau sama dengan"} α = ${window.fmt(h.alpha, 2)}, sehingga ${tolak ? "H0 ditolak" : "H0 gagal ditolak"}`;
  kep.className = "keputusan " + (tolak ? "signifikan" : "tidak-signifikan");
  window.$("hasil-kesimpulan").textContent = h.kesimpulan;

  window.buatChart("uji", "kanvas-uji", h.grafik);
  window.$("hasil-uji").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

window.aturGrupUji = aturGrupUji;
window.kalimatKeputusan = kalimatKeputusan;
window.jalankanUji = jalankanUji;
window.tampilHasil = tampilHasil;
