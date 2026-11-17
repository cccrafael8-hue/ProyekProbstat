/* ============================================================
   MiniStat - js/stat/uji-chi-square.js
   Uji hipotesis Chi-Square Independensi
   ============================================================ */
"use strict";

window.Stat = window.Stat || {};

window.Stat.chiKuadrat = function (tabel) {
  const R = tabel.length,
    C = tabel[0].length;
  const rowSum = tabel.map((r) => window.Stat.jumlah(r));
  const colSum = [];
  for (let j = 0; j < C; j++) {
    let s = 0;
    for (let i = 0; i < R; i++) s += tabel[i][j];
    colSum.push(s);
  }
  const total = window.Stat.jumlah(rowSum);
  let chi2 = 0,
    minE = Infinity,
    kurang5 = 0;
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      const e = (rowSum[i] * colSum[j]) / total;
      chi2 += (tabel[i][j] - e) ** 2 / e;
      if (e < minE) minE = e;
      if (e < 5) kurang5++;
    }
  }
  const df = (R - 1) * (C - 1);
  const p = 1 - jStat.chisquare.cdf(chi2, df);
  const V = Math.sqrt(chi2 / (total * Math.min(R - 1, C - 1)));
  return { R, C, total, chi2, df, p, V, minE, kurang5, sel: R * C };
};

function ujiChiSquare(alpha) {
  const k1 = window.$("ch-var1").value;
  const k2 = window.$("ch-var2").value;
  window.wajibPilih(k1, k2);
  if (k1 === k2) throw new Error("Pilih dua variabel yang berbeda.");
  const lengkap = window.baris.filter((r) => window.ada(r[k1]) && window.ada(r[k2]));
  const nama1 = window.urutkanKategori(lengkap.map((r) => r[k1]));
  const nama2 = window.urutkanKategori(lengkap.map((r) => r[k2]));
  if (nama1.length < 2 || nama2.length < 2)
    throw new Error("Kedua variabel harus punya minimal 2 kategori.");
  if (nama1.length * nama2.length > 400)
    throw new Error(
      "Kategori terlalu banyak. Pilih variabel dengan kategori yang lebih sedikit."
    );
  const tabel = nama1.map(() => nama2.map(() => 0));
  for (const r of lengkap) {
    tabel[nama1.indexOf(String(r[k1]))][nama2.indexOf(String(r[k2]))]++;
  }
  const r = window.Stat.chiKuadrat(tabel);
  const tolak = r.p < alpha;
  const peringatan =
    r.kurang5 > 0
      ? ` Perhatian: ${r.kurang5} dari ${r.sel} sel punya frekuensi harapan di bawah 5, sehingga hasil kurang andal.`
      : "";
  return {
    judul: "Chi-square independensi",
    h0: `${k1} dan ${k2} saling bebas (tidak berhubungan)`,
    h1: `${k1} dan ${k2} berhubungan`,
    p: r.p,
    alpha,
    kepala: ["Statistik", "Nilai"],
    baris: [
      ["N", r.total],
      ["Ukuran tabel", `${r.R} x ${r.C}`],
      ["Chi-square", window.fmt(r.chi2)],
      ["Derajat bebas (df)", r.df],
      ["p-value", window.fmtP(r.p)],
      ["Cramér V", window.fmt(r.V)],
      ["Frekuensi harapan terkecil", window.fmt(r.minE, 2)],
    ],
    kesimpulan: `${window.kalimatKeputusan(r.p, alpha)} ${tolak ? `Ada hubungan yang signifikan antara ${k1} dan ${k2}.` : `Tidak ada bukti hubungan antara ${k1} dan ${k2}.`}${peringatan}`,
    grafik: {
      type: "bar",
      data: {
        labels: nama1,
        datasets: nama2.map((n2, j) => ({
          label: n2,
          data: tabel.map((baris1) => baris1[j]),
          backgroundColor: window.warnaKe(j) + "cc",
          borderColor: window.warnaKe(j),
          borderWidth: 1,
        })),
      },
      options: window.opsiDasar({
        judul: `${k1} berdasarkan ${k2}`,
        labelX: k1,
        labelY: "Frekuensi",
        mulaiNol: true,
      }),
    },
  };
}

window.ujiChiSquare = ujiChiSquare;
