/* ============================================================
   MiniStat - js/utils/tabel-dom.js
   Fungsi pembantu manipulasi elemen tabel dan dropdown DOM
   ============================================================ */
"use strict";

function isiBody(tabel, rows) {
  if (!tabel) return;
  const tbody = tabel.querySelector("tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");
    for (const sel of r) {
      const td = document.createElement("td");
      td.textContent = sel;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function isiTabel(tabel, kepala, rows) {
  if (!tabel) return;
  const thead = tabel.querySelector("thead");
  if (thead) {
    thead.innerHTML = "";
    const tr = document.createElement("tr");
    for (const h of kepala) {
      const th = document.createElement("th");
      th.textContent = h;
      tr.appendChild(th);
    }
    thead.appendChild(tr);
  }
  isiBody(tabel, rows);
}

function isiSelect(sel, daftar, opsi = {}) {
  if (!sel) return;
  const lama = sel.value;
  sel.innerHTML = "";
  if (opsi.kosong) {
    const o = document.createElement("option");
    o.value = "";
    o.textContent = "(tidak ada)";
    sel.appendChild(o);
  }
  daftar.forEach((nama) => {
    const o = document.createElement("option");
    o.value = nama;
    o.textContent = nama;
    sel.appendChild(o);
  });
  const nilaiAda = (v) => [...sel.options].some((o) => o.value === v);
  if (lama !== "" && nilaiAda(lama)) sel.value = lama;
  else if (opsi.awal !== undefined && nilaiAda(opsi.awal))
    sel.value = opsi.awal;
}

function isiSemuaSelect() {
  const num = window.kolomNumerik();
  const kat = window.kolom.filter((k) => !num.includes(k));
  const awalKat = kat[0] !== undefined ? kat[0] : window.kolom[0];
  const kedua = (daftar) => (daftar[1] !== undefined ? daftar[1] : daftar[0]);

  document.querySelectorAll(".pilih-numerik").forEach((s) => isiSelect(s, num));
  document.querySelectorAll(".pilih-semua").forEach((s) => isiSelect(s, window.kolom));
  document
    .querySelectorAll(".pilih-semua-opsional")
    .forEach((s) => isiSelect(s, window.kolom, { kosong: true }));
  isiSelect(window.$("pilih-kategori"), window.kolom, { awal: awalKat });

  // Nilai awal yang masuk akal untuk pasangan variabel
  const pasanganId = { "tp-var2": "tp-var1", "kr-y": "kr-x", "rg-y": "rg-x" };
  Object.keys(pasanganId).forEach((id) => {
    const s = window.$(id);
    if (s && window.$(pasanganId[id]) && s.value === window.$(pasanganId[id]).value && num.length > 1) {
      s.value = kedua(num);
    }
  });
  ["t2-kelompok", "an-kelompok"].forEach((id) => {
    const s = window.$(id);
    if (s && kat.length && !kat.includes(s.value)) s.value = awalKat;
  });
  const sx = window.$("sumbu-x");
  if (sx && kat.length && !kat.includes(sx.value) && sx.dataset.disentuh !== "1") {
    sx.value = awalKat;
  }
  const c1 = window.$("ch-var1"),
    c2 = window.$("ch-var2");
  if (c1 && c2 && c1.value === c2.value && window.kolom.length > 1) {
    c1.value = awalKat;
    const sisa = window.kolom.filter((k) => k !== awalKat);
    c2.value = kedua(sisa.length ? sisa : window.kolom);
  }
}

function wajibPilih(...nilaiPilih) {
  if (nilaiPilih.some((v) => !v)) {
    throw new Error(
      "Pilih variabel terlebih dahulu. Pastikan data punya kolom numerik."
    );
  }
}

window.isiBody = isiBody;
window.isiTabel = isiTabel;
window.isiSelect = isiSelect;
window.isiSemuaSelect = isiSemuaSelect;
window.wajibPilih = wajibPilih;
