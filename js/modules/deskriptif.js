/* ============================================================
   MiniStat - js/modules/deskriptif.js
   Modul perhitungan statistik deskriptif dan tabel frekuensi
   ============================================================ */
"use strict";

function renderDaftarNumerik() {
  const wadah = window.$("daftar-numerik");
  if (!wadah) return;
  const tidakDipilih = new Set(
    [...wadah.querySelectorAll("input:not(:checked)")].map((i) => i.value)
  );
  wadah.innerHTML = "";
  window.kolomNumerik().forEach((k) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = k;
    cb.checked = !tidakDipilih.has(k);
    label.appendChild(cb);
    label.appendChild(document.createTextNode(k));
    wadah.appendChild(label);
  });
}

function hitungDeskriptif() {
  if (!window.perluData()) return;
  const wadah = window.$("daftar-numerik");
  if (!wadah) return;
  const dipilih = [
    ...wadah.querySelectorAll("input:checked"),
  ].map((i) => i.value);
  if (dipilih.length === 0) {
    window.notif("Pilih minimal satu variabel numerik.", "peringatan");
    return;
  }
  const rows = dipilih.map((k) => {
    const x = window.nilai(k);
    return [
      k,
      x.length,
      window.fmt(window.Stat.rata(x)),
      window.fmt(window.Stat.median(x)),
      window.fmt(window.Stat.sd(x)),
      window.fmt(window.Stat.min(x)),
      window.fmt(window.Stat.max(x)),
    ];
  });
  window.isiBody(window.$("tabel-deskriptif"), rows);
}

function renderFrekuensi() {
  const pilihKat = window.$("pilih-kategori");
  if (!pilihKat) return;
  const k = pilihKat.value;
  if (!k || !window.baris || window.baris.length === 0) {
    window.isiBody(window.$("tabel-frekuensi"), []);
    return;
  }
  const hitung = new Map();
  let total = 0;
  for (const r of window.baris) {
    if (!window.ada(r[k])) continue;
    hitung.set(r[k], (hitung.get(r[k]) || 0) + 1);
    total++;
  }
  const kunci = [...hitung.keys()];
  if (kunci.every(window.isNum)) kunci.sort((a, b) => a - b);
  else kunci.sort((a, b) => String(a).localeCompare(String(b), "id"));
  const rows = kunci.map((v) => [
    String(v),
    hitung.get(v),
    window.fmt((hitung.get(v) / total) * 100, 2),
  ]);
  rows.push(["Total", total, "100"]);
  window.isiBody(window.$("tabel-frekuensi"), rows);
}

window.renderDaftarNumerik = renderDaftarNumerik;
window.hitungDeskriptif = hitungDeskriptif;
window.renderFrekuensi = renderFrekuensi;
