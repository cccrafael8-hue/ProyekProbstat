/* ============================================================
   MiniStat - js/utils/data-helpers.js
   Fungsi pembantu pengolahan dan validasi data tabel
   ============================================================ */
"use strict";

function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function ada(v) {
  return v !== "" && v !== null && v !== undefined;
}

// Ubah nilai sel menjadi angka bila bentuknya angka
function norm(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : "";
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (s === "") return "";
  const t = /^-?\d+,\d+$/.test(s) ? s.replace(",", ".") : s;
  if (/^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return Number(t);
  return s;
}

function perluData() {
  if (!window.kolom || window.kolom.length === 0 || !window.baris || window.baris.length === 0) {
    if (typeof window.notif === "function") {
      window.notif(
        "Belum ada data. Buka menu Data lalu upload file terlebih dahulu.",
        "peringatan"
      );
    }
    return false;
  }
  return true;
}

function kolomNumerik() {
  if (!window.kolom || !window.baris) return [];
  return window.kolom.filter((k) => {
    let punya = false;
    for (const r of window.baris) {
      const v = r[k];
      if (!ada(v)) continue;
      if (!isNum(v)) return false;
      punya = true;
    }
    return punya;
  });
}

function nilai(k) {
  if (!window.baris) return [];
  return window.baris.map((r) => r[k]).filter(isNum);
}

function pasangan(kx, ky) {
  const x = [],
    y = [];
  if (!window.baris) return { x, y };
  for (const r of window.baris) {
    if (isNum(r[kx]) && isNum(r[ky])) {
      x.push(r[kx]);
      y.push(r[ky]);
    }
  }
  return { x, y };
}

// Kelompokkan nilai numerik kv berdasarkan kolom kg
function kelompokkan(kv, kg) {
  const peta = new Map();
  if (!window.baris) return [];
  for (const r of window.baris) {
    if (!isNum(r[kv]) || !ada(r[kg])) continue;
    const kunci = String(r[kg]);
    if (!peta.has(kunci)) peta.set(kunci, []);
    peta.get(kunci).push(r[kv]);
  }
  return [...peta.entries()].map(([nama, nilai]) => ({ nama, nilai }));
}

function urutkanKategori(daftar) {
  const unik = [...new Set(daftar)];
  if (unik.every(isNum)) unik.sort((a, b) => a - b);
  return unik.map(String);
}

window.isNum = isNum;
window.ada = ada;
window.norm = norm;
window.perluData = perluData;
window.kolomNumerik = kolomNumerik;
window.nilai = nilai;
window.pasangan = pasangan;
window.kelompokkan = kelompokkan;
window.urutkanKategori = urutkanKategori;
