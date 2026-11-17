/* ============================================================
   MiniStat - js/modules/grafik-helpers.js
   Plugin Chart.js dan pembantu konfigurasi grafik statistik
   ============================================================ */
"use strict";

const pluginLatarPutih = {
  id: "latarPutih",
  afterDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

// Garis vertikal pada histogram (sumbu x berupa kategori interval)
const pluginGarisVertikal = {
  id: "garisVertikal",
  afterDatasetsDraw(chart, args, opsi) {
    if (!opsi || !opsi.garis) return;
    const ctx = chart.ctx;
    const area = chart.chartArea;
    const x = chart.scales.x;
    const p0 = x.getPixelForValue(0);
    const lebar = x.getPixelForValue(1) - p0;
    opsi.garis.forEach((g, i) => {
      const px =
        p0 - lebar / 2 + ((g.nilai - opsi.awal) / opsi.lebarBin) * lebar;
      const kanan = px > (area.left + area.right) / 2;
      ctx.save();
      ctx.strokeStyle = g.warna;
      ctx.lineWidth = 2;
      ctx.setLineDash(g.putus ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(px, area.top);
      ctx.lineTo(px, area.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = g.warna;
      ctx.font = "12px sans-serif";
      ctx.textAlign = kanan ? "right" : "left";
      ctx.fillText(g.label, px + (kanan ? -5 : 5), area.top + 14 + i * 15);
      ctx.restore();
    });
  },
};

if (typeof Chart !== "undefined") {
  Chart.register(pluginLatarPutih, pluginGarisVertikal);
}

function warnaKe(i) {
  if (i < window.PALET.length) return window.PALET[i];
  return `hsl(${(i * 47) % 360} 45% 50%)`;
}

function buatChart(slot, canvasId, konfigurasi) {
  if (window.charts[slot]) window.charts[slot].destroy();
  window.charts[slot] = new Chart(window.$(canvasId), konfigurasi);
}

function opsiDasar({
  judul,
  labelX,
  labelY,
  legenda = true,
  mulaiNol = false,
}) {
  const fontFamily = '"Segoe UI", system-ui, -apple-system, sans-serif';
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      title: {
        display: !!judul,
        text: judul || "",
        font: { size: 15, weight: "700", family: fontFamily },
        color: "#1c2925",
        padding: { bottom: 15 },
      },
      legend: {
        display: legenda,
        labels: {
          font: { family: fontFamily, size: 12 },
          color: "#5c7069",
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: "#1f2a26",
        titleColor: "#ffffff",
        bodyColor: "#e1eee9",
        cornerRadius: 8,
        padding: 10,
        titleFont: { size: 13, weight: "bold", family: fontFamily },
        bodyFont: { size: 12, family: fontFamily },
      },
    },
    scales: {
      x: {
        title: {
          display: !!labelX,
          text: labelX || "",
          color: "#5c7069",
          font: { family: fontFamily, size: 12, weight: "600" },
        },
        grid: { display: false },
        ticks: { color: "#5c7069", font: { family: fontFamily, size: 11 } },
      },
      y: {
        beginAtZero: mulaiNol,
        title: {
          display: !!labelY,
          text: labelY || "",
          color: "#5c7069",
          font: { family: fontFamily, size: 12, weight: "600" },
        },
        grid: { color: "rgba(226, 235, 231, 0.7)" },
        ticks: { color: "#5c7069", font: { family: fontFamily, size: 11 } },
      },
    },
  };
}

function binSturges(n) {
  return Math.max(5, Math.min(12, Math.ceil(Math.log2(n) + 1)));
}

function dataHistogram(arr, nBin, batasMin, batasMaks) {
  let awal =
    batasMin !== undefined ? Math.min(window.Stat.min(arr), batasMin) : window.Stat.min(arr);
  let akhir =
    batasMaks !== undefined
      ? Math.max(window.Stat.max(arr), batasMaks)
      : window.Stat.max(arr);
  if (awal === akhir) {
    awal -= 0.5;
    akhir += 0.5;
  }
  const lebar = (akhir - awal) / nBin;
  const hitung = new Array(nBin).fill(0);
  for (const v of arr) {
    hitung[Math.min(Math.floor((v - awal) / lebar), nBin - 1)]++;
  }
  const label = [];
  for (let i = 0; i < nBin; i++) {
    label.push(
      `${window.fmt(awal + i * lebar, 2)} - ${window.fmt(awal + (i + 1) * lebar, 2)}`
    );
  }
  return { awal, akhir, lebar, hitung, label };
}

function konfigHistogram(arr, o) {
  const h = dataHistogram(arr, o.nBin, o.batasMin, o.batasMaks);
  const datasets = [
    {
      type: "bar",
      label: "Frekuensi",
      data: h.hitung,
      backgroundColor: h.label.map((_, i) => warnaKe(i) + "cc"),
      borderColor: h.label.map((_, i) => warnaKe(i)),
      borderWidth: 1,
      borderRadius: 8,
      barPercentage: 1,
      categoryPercentage: 1,
      order: 2,
    },
  ];
  if (o.kurvaNormal) {
    const m = window.Stat.rata(arr),
      s = window.Stat.sd(arr);
    const harapan = h.hitung.map((_, i) => {
      const a = h.awal + i * h.lebar,
        b = a + h.lebar;
      return (
        arr.length * (jStat.normal.cdf(b, m, s) - jStat.normal.cdf(a, m, s))
      );
    });
    datasets.push({
      type: "line",
      label: "Kurva normal (harapan)",
      data: harapan,
      borderColor: window.PALET[1],
      backgroundColor: window.PALET[1],
      pointRadius: 3,
      tension: 0.3,
      order: 1,
    });
  }
  const opsi = opsiDasar({
    judul: o.judul,
    labelX: o.labelX,
    labelY: o.labelY || "Frekuensi",
    legenda: o.legenda !== false,
    mulaiNol: true,
  });
  if (o.garis) {
    opsi.plugins.garisVertikal = {
      garis: o.garis,
      awal: h.awal,
      lebarBin: h.lebar,
    };
  }
  return { type: "bar", data: { labels: h.label, datasets }, options: opsi };
}

function konfigBatang(labels, nilaiData, o) {
  return {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: o.namaSeri || "Rata-rata",
          data: nilaiData,
          backgroundColor: labels.map((_, i) => warnaKe(i) + "cc"),
          borderColor: labels.map((_, i) => warnaKe(i)),
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    },
    options: opsiDasar({
      judul: o.judul,
      labelX: o.labelX,
      labelY: o.labelY,
      legenda: false,
      mulaiNol: true,
    }),
  };
}

function konfigScatterGaris(x, y, o) {
  const titik = x.map((v, i) => ({ x: v, y: y[i] }));
  const datasets = [
    {
      type: "scatter",
      label: "Data",
      data: titik,
      backgroundColor: window.PALET[0] + "cc",
      borderColor: window.PALET[0],
      pointRadius: 5,
    },
  ];
  if (o.garis) {
    datasets.push({
      type: "scatter",
      label: "Garis regresi",
      data: o.garis,
      showLine: true,
      borderColor: window.PALET[1],
      backgroundColor: window.PALET[1],
      pointRadius: 0,
      borderWidth: 2,
    });
  }
  return {
    type: "scatter",
    data: { datasets },
    options: opsiDasar({
      judul: o.judul,
      labelX: o.labelX,
      labelY: o.labelY,
      legenda: !!o.garis,
    }),
  };
}

window.pluginLatarPutih = pluginLatarPutih;
window.pluginGarisVertikal = pluginGarisVertikal;
window.warnaKe = warnaKe;
window.buatChart = buatChart;
window.opsiDasar = opsiDasar;
window.binSturges = binSturges;
window.dataHistogram = dataHistogram;
window.konfigHistogram = konfigHistogram;
window.konfigBatang = konfigBatang;
window.konfigScatterGaris = konfigScatterGaris;
