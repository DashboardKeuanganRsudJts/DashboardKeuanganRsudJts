import * as XLSX from 'xlsx';

export const INVOICE_HUTANG_EXCEL_COLUMNS = [
  'NO',
  'PERUSAHAAN / VENDOR',
  'BIDANG',
  'JENIS PENGADAAN',
  'TANGGAL REKAP',
  'BULAN REKAP',
  'TANGGAL INVOICE',
  'BULAN INVOICE',
  'NOMOR INVOICE/SPK/PO',
  'TANGGAL JATUH TEMPO',
  'JUMLAH',
  'KOREKSI',
  'NILAI SPJ',
  'DIBAYAR',
  'JENIS ANGGARAN BLUD / APBD',
  'SISA',
  'A',
  'TANGGAL BAYAR',
  'BULAN BAYAR',
  'NOMOR SP2D',
  'UMUR HUTANG',
  'BELUM JT',
  '1-30 Hari',
  '31-60 Hari',
  '61-90 Hari',
  '>90 Hari'
];

export const downloadInvoiceHutangExcelTemplate = (year: number = 2026) => {
  const headers = INVOICE_HUTANG_EXCEL_COLUMNS;

  const sampleRows = [
    [
      1,
      'PT. RANAH MULTI SEMESTA',
      'Bidang Pelayanan Non Medik',
      'Belanja Bahan-Bahan Lainnya (Farmasi)',
      `08/08/${year - 1}`,
      'AGUSTUS',
      `10/09/${year - 1}`,
      'SEPTEMBER',
      `RS${year - 1}070246`,
      `30/08/${year - 1}`,
      45186093,
      0,
      45186093,
      45186093,
      'BLUD',
      0,
      'TRUE',
      `21/01/${year}`,
      'JANUARI',
      `SPD-LS/RSUD Jatisari/I/${year}/00028`,
      0,
      '',
      '',
      '',
      '',
      ''
    ],
    [
      2,
      'PT. BINA SAN PRIMA',
      'Bidang Pelayanan Non Medik',
      'Belanja Obat-Obatan-Obat',
      `15/01/${year}`,
      'JANUARI',
      `12/01/${year}`,
      'JANUARI',
      `FKKRW/${year}01/14587`,
      `15/02/${year}`,
      359363,
      0,
      359363,
      359363,
      'BLUD',
      0,
      'TRUE',
      `28/01/${year}`,
      'JANUARI',
      `SPD-LS/RSUD Jatisari/I/${year}/00033`,
      0,
      '',
      '',
      '',
      '',
      ''
    ],
    [
      3,
      'PT. BELANT PERSADA',
      'IT',
      'Belanja Jasa Konversi Aplikasi/Sistem Informasi',
      `05/02/${year}`,
      'FEBRUARI',
      `02/02/${year}`,
      'FEBRUARI',
      `400.728/067/PKS-RSUD Jatisari/${year}`,
      `15/03/${year}`,
      119700000,
      0,
      119700000,
      0,
      'BLUD',
      119700000,
      'FALSE',
      '',
      '',
      '',
      45,
      '',
      '',
      119700000,
      '',
      ''
    ],
    [
      4,
      'CV. SURYA MEDIKA UTAMA',
      'Bidang Pelayanan Medik',
      'Belanja Bahan Medis Habis Pakai (BMHP)',
      `10/02/${year}`,
      'FEBRUARI',
      `08/02/${year}`,
      'FEBRUARI',
      `INV-BMHP/${year}/02/089`,
      `25/03/${year}`,
      24500000,
      0,
      24500000,
      0,
      'BLUD',
      24500000,
      'FALSE',
      '',
      '',
      '',
      0,
      24500000,
      '',
      '',
      '',
      ''
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set explicit column widths for clarity
  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 32 }, // PERUSAHAAN / VENDOR
    { wch: 28 }, // BIDANG
    { wch: 35 }, // JENIS PENGADAAN
    { wch: 16 }, // TANGGAL REKAP
    { wch: 16 }, // BULAN REKAP
    { wch: 16 }, // TANGGAL INVOICE
    { wch: 16 }, // BULAN INVOICE
    { wch: 32 }, // NOMOR INVOICE/SPK/PO
    { wch: 18 }, // TANGGAL JATUH TEMPO
    { wch: 16 }, // JUMLAH
    { wch: 12 }, // KOREKSI
    { wch: 16 }, // NILAI SPJ
    { wch: 16 }, // DIBAYAR
    { wch: 18 }, // JENIS ANGGARAN BLUD / APBD
    { wch: 16 }, // SISA
    { wch: 8 },  // A
    { wch: 16 }, // TANGGAL BAYAR
    { wch: 16 }, // BULAN BAYAR
    { wch: 34 }, // NOMOR SP2D
    { wch: 14 }, // UMUR HUTANG
    { wch: 14 }, // BELUM JT
    { wch: 14 }, // 1-30 Hari
    { wch: 14 }, // 31-60 Hari
    { wch: 14 }, // 61-90 Hari
    { wch: 14 }  // >90 Hari
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Template Invoice ${year}`);
  XLSX.writeFile(wb, `TEMPLATE_IMPORT_INVOICE_HUTANG_${year}_RSUD.xlsx`);
};
