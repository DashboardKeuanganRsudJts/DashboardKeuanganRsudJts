import * as XLSX from 'xlsx';

export const INVOICE_HUTANG_EXCEL_COLUMNS_2025 = [
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

export const INVOICE_HUTANG_EXCEL_COLUMNS_2026 = [
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
  'DIBAYAR',
  'JENIS ANGGARAN BLUD / APBD',
  'SISA',
  'A',
  'TANGGAL BAYAR',
  'BULAN BAYAR',
  'NOMOR SP2D',
  'UMUR HUTANG'
];

export const INVOICE_HUTANG_EXCEL_COLUMNS = INVOICE_HUTANG_EXCEL_COLUMNS_2026;

export const downloadInvoiceHutangExcelTemplate = (year: number = 2026) => {
  if (year === 2026) {
    const headers = INVOICE_HUTANG_EXCEL_COLUMNS_2026;
    const sampleRows = [
      [
        1,
        'PT. RANAH MULTI SEMESTA',
        'Bidang Pelayanan Non Medik',
        'Belanja Bahan-Bahan Lainnya (Farmasi)',
        '08/01/2026',
        'JANUARI',
        '15/01/2026',
        'JANUARI',
        'RS2026010001',
        '15/02/2026',
        45186093,
        45186093,
        'BLUD',
        0,
        'TRUE',
        '21/01/2026',
        'JANUARI',
        'SPD-LS/RSUD Jatisari/I/2026/00028',
        0
      ],
      [
        2,
        'PT. BINA SAN PRIMA',
        'Bidang Pelayanan Non Medik',
        'Belanja Obat-Obatan-Obat',
        '15/01/2026',
        'JANUARI',
        '12/01/2026',
        'JANUARI',
        'FKKRW/202601/14587',
        '15/02/2026',
        359363,
        359363,
        'BLUD',
        0,
        'TRUE',
        '28/01/2026',
        'JANUARI',
        'SPD-LS/RSUD Jatisari/I/2026/00033',
        0
      ],
      [
        3,
        'PT. BELANT PERSADA',
        'IT',
        'Belanja Jasa Konversi Aplikasi/Sistem Informasi',
        '05/02/2026',
        'FEBRUARI',
        '02/02/2026',
        'FEBRUARI',
        '400.728/067/PKS-RSUD Jatisari/2026',
        '15/03/2026',
        119700000,
        0,
        'BLUD',
        119700000,
        'FALSE',
        '',
        '',
        '',
        45
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
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
      { wch: 16 }, // DIBAYAR
      { wch: 18 }, // JENIS ANGGARAN BLUD / APBD
      { wch: 16 }, // SISA
      { wch: 8 },  // A
      { wch: 16 }, // TANGGAL BAYAR
      { wch: 16 }, // BULAN BAYAR
      { wch: 34 }, // NOMOR SP2D
      { wch: 14 }  // UMUR HUTANG
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Template Invoice ${year}`);
    XLSX.writeFile(wb, `TEMPLATE_IMPORT_INVOICE_HUTANG_${year}_RSUD.xlsx`);
    return;
  }

  // 2025 template
  const headers = INVOICE_HUTANG_EXCEL_COLUMNS_2025;
  const sampleRows = [
    [
      1,
      'PT. RANAH MULTI SEMESTA',
      'Bidang Pelayanan Non Medik',
      'Belanja Bahan-Bahan Lainnya (Farmasi)',
      '08/08/2025',
      'AGUSTUS',
      '10/09/2025',
      'SEPTEMBER',
      'RS2025070246',
      '30/08/2025',
      45186093,
      0,
      45186093,
      45186093,
      'BLUD',
      0,
      'TRUE',
      '21/01/2026',
      'JANUARI',
      'SPD-LS/RSUD Jatisari/I/2026/00028',
      0,
      '',
      '',
      '',
      '',
      ''
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Template Invoice ${year}`);
  XLSX.writeFile(wb, `TEMPLATE_IMPORT_INVOICE_HUTANG_${year}_RSUD.xlsx`);
};
