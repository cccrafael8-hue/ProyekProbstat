/* ============================================================
   MiniStat - js/modules/data-view.js
   Modul pembacaan file, manipulasi data tabel, dan variable view
   ============================================================ */
"use strict";

function bacaFile(file) {
  const nama = file.name.toLowerCase();
  if (nama.endsWith(".csv")) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (hasil) =>
        muatData(hasil.data, hasil.meta.fields || [], file.name),
      error: () => window.notif("File CSV tidak bisa dibaca.", "error"),
    });
  } else if (nama.endsWith(".xlsx") || nama.endsWith(".xls")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const set = new Set();
        json.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
        muatData(json, [...set], file.name);
      } catch (err) {
        window.notif("File Excel tidak bisa dibaca.", "error");
      }
    };
    reader.onerror = () => window.notif("File Excel tidak bisa dibaca.", "error");
    reader.readAsArrayBuffer(file);
  } else {
    window.notif("Format file tidak didukung. Gunakan CSV, XLSX, atau XLS.", "error");
  }
}

function muatData(rows, fields, nama) {
  const kolomBaru = fields.filter((f) => f !== "" && f !== undefined);
  if (rows.length === 0 || kolomBaru.length === 0) {
    window.notif(
      "File kosong atau baris pertama (nama kolom) tidak ditemukan.",
      "error"
    );
    return;
  }
  window.kolom = kolomBaru;
  window.baris = rows.map((r) => {
    const o = {};
    window.kolom.forEach((k) => {
      o[k] = window.norm(r[k]);
    });
    return o;
  });
  window.namaFile = nama;
  dataBerubah(true);
  window.notif(
    `Data dimuat: ${window.baris.length} baris dan ${window.kolom.length} kolom.`,
    "sukses"
  );
}

function dataBerubah(renderTabel) {
  const punya = window.kolom.length > 0;
  const areaData = window.$("area-data");
  if (areaData) areaData.hidden = !punya;
  const statusData = window.$("status-data");
  if (statusData) {
    statusData.textContent = punya
      ? `${window.namaFile || "Data"}: ${window.baris.length} baris, ${window.kolom.length} kolom`
      : "Belum ada data";
  }
  const infoFile = window.$("info-file");
  if (infoFile) {
    infoFile.textContent =
      punya && window.namaFile ? `File aktif: ${window.namaFile}` : "";
  }
  if (renderTabel) {
    renderTabelData();
    const hasilUji = window.$("hasil-uji");
    if (hasilUji) hasilUji.hidden = true;
  }
  renderVariabel();
  window.isiSemuaSelect();
  if (typeof window.renderDaftarNumerik === "function") window.renderDaftarNumerik();
  if (typeof window.renderFrekuensi === "function") window.renderFrekuensi();
}

function renderTabelData() {
  const tabel = window.$("tabel-data");
  if (!tabel) return;
  const thead = tabel.querySelector("thead");
  const tbody = tabel.querySelector("tbody");
  if (!thead || !tbody) return;
  thead.innerHTML = "";
  tbody.innerHTML = "";
  if (window.kolom.length === 0) return;

  const trh = document.createElement("tr");
  const thNo = document.createElement("th");
  thNo.textContent = "#";
  trh.appendChild(thNo);
  window.kolom.forEach((k) => {
    const th = document.createElement("th");
    th.textContent = k;
    trh.appendChild(th);
  });
  thead.appendChild(trh);

  const tampil = Math.min(window.baris.length, window.BATAS_TAMPIL);
  for (let i = 0; i < tampil; i++) {
    const tr = document.createElement("tr");
    const tdNo = document.createElement("td");
    tdNo.textContent = i + 1;
    tr.appendChild(tdNo);
    window.kolom.forEach((k) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.value = window.ada(window.baris[i][k]) ? String(window.baris[i][k]) : "";
      input.addEventListener("change", () => {
        window.baris[i][k] = window.norm(input.value);
        dataBerubah(false);
      });
      td.appendChild(input);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
}

function renderVariabel() {
  const tabelVar = window.$("tabel-variabel");
  if (!tabelVar) return;
  const numerik = window.kolomNumerik();
  const rows = window.kolom.map((k) => {
    const terisi = window.baris.filter((r) => window.ada(r[k])).length;
    return [
      k,
      numerik.includes(k) ? "Numerik" : "Kategori",
      terisi,
      window.baris.length - terisi,
    ];
  });
  window.isiBody(tabelVar, rows);
  let teks = "";
  if (window.baris.length) {
    teks = `${window.baris.length} baris, ${window.kolom.length} kolom. Klik sel untuk mengedit nilainya.`;
    if (window.baris.length > window.BATAS_TAMPIL) {
      teks += ` Tabel hanya menampilkan ${window.BATAS_TAMPIL} baris pertama, tetapi seluruh data tetap dipakai dalam perhitungan.`;
    }
  }
  const ringkasan = window.$("ringkasan-data");
  if (ringkasan) ringkasan.textContent = teks;
}

function tambahBaris() {
  if (window.kolom.length === 0) return;
  const o = {};
  window.kolom.forEach((k) => {
    o[k] = "";
  });
  window.baris.push(o);
  dataBerubah(true);
}

function hapusBarisTerakhir() {
  if (window.baris.length === 0) return;
  window.baris.pop();
  dataBerubah(true);
}

function hapusSemuaData() {
  if (window.kolom.length === 0) return;
  if (!window.confirm("Hapus semua data?")) return;
  window.kolom = [];
  window.baris = [];
  window.namaFile = "";
  dataBerubah(true);
  window.notif("Semua data sudah dihapus.", "info");
}

window.bacaFile = bacaFile;
window.muatData = muatData;
window.dataBerubah = dataBerubah;
window.renderTabelData = renderTabelData;
window.renderVariabel = renderVariabel;
window.tambahBaris = tambahBaris;
window.hapusBarisTerakhir = hapusBarisTerakhir;
window.hapusSemuaData = hapusSemuaData;
