/* ============================================================
   MiniStat - js/app.js
   Inisialisasi aplikasi, navigasi panel, dan registrasi event
   ============================================================ */
"use strict";

function pindahPanel(id) {
  document.querySelectorAll(".menu-btn").forEach((b) => {
    b.classList.toggle("aktif", b.dataset.target === id);
  });
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("aktif", p.id === id);
  });
  const notifEl = window.$("notifikasi");
  if (notifEl) notifEl.hidden = true;
}

window.pindahPanel = pindahPanel;

async function init() {
  // Muat komponen HTML modular terlebih dahulu
  if (typeof window.loadComponents === "function") {
    await window.loadComponents();
  }

  // Inisialisasi sidebar hamburger
  if (typeof window.initSidebar === "function") {
    window.initSidebar();
  }

  // Navigasi menu
  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.addEventListener("click", () => pindahPanel(btn.dataset.target));
  });

  // Upload file
  const input = window.$("input-file");
  const zona = window.$("dropzone");
  if (input && zona) {
    input.addEventListener("change", () => {
      if (input.files[0]) window.bacaFile(input.files[0]);
      input.value = "";
    });
    ["dragenter", "dragover"].forEach((ev) =>
      zona.addEventListener(ev, (e) => {
        e.preventDefault();
        zona.classList.add("dragover");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      zona.addEventListener(ev, (e) => {
        e.preventDefault();
        zona.classList.remove("dragover");
      })
    );
    zona.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files[0];
      if (file) window.bacaFile(file);
    });
  }

  // Operasi Data View
  window.$("btn-tambah-baris")?.addEventListener("click", window.tambahBaris);
  window.$("btn-hapus-baris")?.addEventListener("click", window.hapusBarisTerakhir);
  window.$("btn-hapus-data")?.addEventListener("click", window.hapusSemuaData);

  // Statistik Deskriptif
  window.$("btn-deskriptif")?.addEventListener("click", window.hitungDeskriptif);
  window.$("pilih-kategori")?.addEventListener("change", window.renderFrekuensi);

  // Uji Hipotesis
  window.$("pilih-metode")?.addEventListener("change", window.aturGrupUji);
  window.$("btn-jalankan")?.addEventListener("click", window.jalankanUji);
  if (typeof window.aturGrupUji === "function") window.aturGrupUji();

  // Visualisasi Grafik
  window.$("jenis-grafik")?.addEventListener("change", window.aturFormGrafik);
  window.$("sumbu-x")?.addEventListener("change", () => {
    const sx = window.$("sumbu-x");
    if (sx) sx.dataset.disentuh = "1";
  });
  window.$("btn-buat-grafik")?.addEventListener("click", window.buatGrafikPengguna);
  window.$("btn-unduh-grafik")?.addEventListener("click", window.unduhGrafik);
  if (typeof window.aturFormGrafik === "function") window.aturFormGrafik();

  // Render awal data
  if (typeof window.dataBerubah === "function") window.dataBerubah(true);
}

// Jalankan ketika DOM sudah siap
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
