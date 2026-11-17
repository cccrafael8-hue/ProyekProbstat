/* ============================================================
   MiniStat - js/modules/visualisasi.js
   Modul pembuatan grafik kustom dan ekspor gambar PNG
   ============================================================ */
"use strict";

const NAMA_AGREGASI = {
  mean: "Rata-rata",
  sum: "Jumlah",
  count: "Banyak data",
  min: "Minimum",
  max: "Maksimum",
};

function agregasi(arr, jenis) {
  if (arr.length === 0) return null;
  switch (jenis) {
    case "sum":
      return window.Stat.jumlah(arr);
    case "count":
      return arr.length;
    case "min":
      return window.Stat.min(arr);
    case "max":
      return window.Stat.max(arr);
    default:
      return window.Stat.rata(arr);
  }
}

function aturFormGrafik() {
  const jenisEl = window.$("jenis-grafik");
  if (!jenisEl) return;
  const jenis = jenisEl.value;
  const fieldAgg = window.$("field-agregasi");
  const fieldKel = window.$("field-kelompok");
  const fieldBin = window.$("field-bin");
  const fieldX = window.$("sumbu-x");

  if (fieldAgg) fieldAgg.hidden = !["bar", "line", "pie"].includes(jenis);
  if (fieldKel) fieldKel.hidden = !["bar", "line", "scatter"].includes(jenis);
  if (fieldBin) fieldBin.hidden = jenis !== "histogram";
  if (fieldX && fieldX.closest(".field")) {
    fieldX.closest(".field").hidden = jenis === "histogram";
  }
  const labelY = document.querySelector('label[for="sumbu-y"]');
  if (labelY) {
    labelY.textContent = jenis === "histogram" ? "Variabel" : "Sumbu Y";
  }
}

function buatGrafikPengguna() {
  if (!window.perluData()) return;
  try {
    const jenis = window.$("jenis-grafik").value;
    const kx = window.$("sumbu-x").value;
    const ky = window.$("sumbu-y").value;
    const kg = window.$("pilih-kelompok").value;
    const fn = window.$("agregasi").value;
    const legenda = window.$("tampil-legenda").checked;
    const judulIsian = window.$("judul-grafik").value.trim();
    const labelXIsian = window.$("label-x").value.trim();
    const labelYIsian = window.$("label-y").value.trim();

    if (!ky)
      throw new Error(
        "Pilih variabel numerik untuk sumbu Y. Pastikan data punya kolom numerik."
      );
    let konfigurasi;

    if (jenis === "histogram") {
      const arr = window.nilai(ky);
      if (arr.length < 2)
        throw new Error("Histogram butuh minimal 2 data angka.");
      const nBin = Math.max(
        2,
        Math.min(50, parseInt(window.$("jumlah-bin").value, 10) || 8)
      );
      konfigurasi = window.konfigHistogram(arr, {
        nBin,
        judul: judulIsian || `Histogram ${ky}`,
        labelX: labelXIsian || ky,
        labelY: labelYIsian || "Frekuensi",
        legenda,
      });
    } else if (jenis === "scatter") {
      if (!kx) throw new Error("Pilih variabel untuk sumbu X.");
      if (!window.kolomNumerik().includes(kx))
        throw new Error("Untuk scatter, sumbu X harus variabel numerik.");
      const sumberGrup = kg
        ? [
            ...new Set(
              window.baris.filter((r) => window.ada(r[kg])).map((r) => String(r[kg]))
            ),
          ]
        : [null];
      const datasets = sumberGrup.map((g, i) => {
        const titik = window.baris
          .filter(
            (r) =>
              window.isNum(r[kx]) &&
              window.isNum(r[ky]) &&
              (g === null || String(r[kg]) === g)
          )
          .map((r) => ({ x: r[kx], y: r[ky] }));
        const w = window.warnaKe(i);
        return {
          label: g === null ? `${ky} terhadap ${kx}` : g,
          data: titik,
          backgroundColor: w + "cc",
          borderColor: w,
          pointRadius: 5,
        };
      });
      konfigurasi = {
        type: "scatter",
        data: { datasets },
        options: window.opsiDasar({
          judul: judulIsian || `${ky} terhadap ${kx}`,
          labelX: labelXIsian || kx,
          labelY: labelYIsian || ky,
          legenda,
        }),
      };
    } else {
      // bar, line, pie
      if (!kx) throw new Error("Pilih variabel untuk sumbu X.");
      if (kx === ky)
        throw new Error("Sumbu X dan sumbu Y harus variabel yang berbeda.");
      const kategori = window.urutkanKategori(
        window.baris.filter((r) => window.ada(r[kx])).map((r) => r[kx])
      );
      if (kategori.length === 0)
        throw new Error("Variabel sumbu X belum berisi data.");
      if (kategori.length > 200)
        throw new Error(
          "Kategori sumbu X terlalu banyak (lebih dari 200). Pilih variabel lain."
        );
      const ambil = (kat, grup) =>
        window.baris
          .filter(
            (r) =>
              String(r[kx]) === kat &&
              window.isNum(r[ky]) &&
              (grup === null || String(r[kg]) === grup)
          )
          .map((r) => r[ky]);
      const namaAgg = NAMA_AGREGASI[fn];
      const judul = judulIsian || `${namaAgg} ${ky} berdasarkan ${kx}`;
      const labelX = labelXIsian || kx;
      const labelY = labelYIsian || `${namaAgg} ${ky}`;

      if (jenis === "pie") {
        const data = kategori.map((k) => agregasi(ambil(k, null), fn));
        konfigurasi = {
          type: "pie",
          data: {
            labels: kategori,
            datasets: [
              {
                data,
                backgroundColor: kategori.map((_, i) => window.warnaKe(i)),
                borderColor: "#ffffff",
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: judul, font: { size: 15 } },
              legend: { display: legenda },
            },
          },
        };
      } else {
        const sumberGrup =
          kg && kg !== kx
            ? [
                ...new Set(
                  window.baris.filter((r) => window.ada(r[kg])).map((r) => String(r[kg]))
                ),
              ]
            : [null];
        const datasets = sumberGrup.map((g, i) => {
          const data = kategori.map((k) => agregasi(ambil(k, g), fn));
          if (jenis === "bar") {
            if (sumberGrup.length === 1) {
              return {
                label: `${namaAgg} ${ky}`,
                data,
                backgroundColor: kategori.map((_, j) => window.warnaKe(j) + "cc"),
                borderColor: kategori.map((_, j) => window.warnaKe(j)),
                borderWidth: 1,
                borderRadius: 8,
              };
            } else {
              const w = window.warnaKe(i);
              return {
                label: g,
                data,
                backgroundColor: w + "cc",
                borderColor: w,
                borderWidth: 1,
                borderRadius: 8,
              };
            }
          } else {
            const w = window.warnaKe(i);
            return {
              label: g === null ? `${namaAgg} ${ky}` : g,
              data,
              borderColor: w,
              backgroundColor: w,
              tension: 0.2,
              spanGaps: true,
              pointRadius: 4,
            };
          }
        });
        konfigurasi = {
          type: jenis,
          data: { labels: kategori, datasets },
          options: window.opsiDasar({
            judul,
            labelX,
            labelY,
            legenda,
            mulaiNol: jenis === "bar",
          }),
        };
      }
    }

    window.buatChart("grafik", "kanvas-grafik", konfigurasi);
    window.$("kosong-grafik").hidden = true;
    window.$("btn-unduh-grafik").hidden = false;
  } catch (err) {
    window.notif(err.message, "error");
  }
}

function unduhGrafik() {
  if (!window.charts.grafik) return;

  const popup = window.$("popup-unduh");
  const spinner = window.$("popup-unduh-spinner");
  const success = window.$("popup-unduh-success");
  const teks = window.$("popup-unduh-teks");
  const sub = window.$("popup-unduh-sub");

  if (popup) {
    if (spinner) spinner.hidden = false;
    if (success) success.hidden = true;
    if (teks) teks.textContent = "Mengunduh grafik PNG...";
    if (sub) sub.textContent = "File gambar sedang disiapkan";
    popup.hidden = false;
  }

  setTimeout(() => {
    const a = document.createElement("a");
    a.href = window.charts.grafik.toBase64Image("image/png", 1);
    a.download = "grafik-ministat.png";
    a.click();

    if (popup) {
      if (spinner) spinner.hidden = true;
      if (success) success.hidden = false;
      if (teks) teks.textContent = "Grafik berhasil diunduh!";
      if (sub) sub.textContent = "Tersimpan ke perangkat Anda";

      setTimeout(() => {
        popup.hidden = true;
      }, 1400);
    }
  }, 400);
}

window.agregasi = agregasi;
window.NAMA_AGREGASI = NAMA_AGREGASI;
window.aturFormGrafik = aturFormGrafik;
window.buatGrafikPengguna = buatGrafikPengguna;
window.unduhGrafik = unduhGrafik;
