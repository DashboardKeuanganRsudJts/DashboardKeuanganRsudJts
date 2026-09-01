// Data resmi dan riil sesuai Google Spreadsheet "DASHBOARD PIUTANG 2026" RSUD Jatisari Kabupaten Karawang

export interface RekapBulanan2026Row {
  bulan: string;
  piutangLalu: number;
  piutangBulanIni: number;
  totalPiutang: number;
  pembayaran: number;
  sisaPiutang: number;
  persenTertagih: number;
  barisBelumLunas: number;
  kpi: {
    totalSisaPiutang: number;
    piutangBulanIni: number;
    pembayaran: number;
    rasioTertagih: number;
    belumLunasCount: number;
    sisaPerusahaanAsuransi: number;
    sisaListrikKantin: number;
    sisaPiutangLainnya: number;
  };
}

export const REKAP_BULANAN_2026_DATA: Record<string, RekapBulanan2026Row> = {
  JANUARI: {
    bulan: 'JANUARI',
    piutangLalu: 102183256,
    piutangBulanIni: 3725795723,
    totalPiutang: 3827978979,
    pembayaran: 3724115914,
    sisaPiutang: 103863065,
    persenTertagih: 97.3,
    barisBelumLunas: 19,
    kpi: {
      totalSisaPiutang: 103863065,
      piutangBulanIni: 3725795723,
      pembayaran: 3724115914,
      rasioTertagih: 97.3,
      belumLunasCount: 19,
      sisaPerusahaanAsuransi: 42150000,
      sisaListrikKantin: 1250000,
      sisaPiutangLainnya: 60463065,
    }
  },
  FEBRUARI: {
    bulan: 'FEBRUARI',
    piutangLalu: 103863065,
    piutangBulanIni: 3030764233,
    totalPiutang: 3134627298,
    pembayaran: 3080695437,
    sisaPiutang: 53931861,
    persenTertagih: 98.3,
    barisBelumLunas: 21,
    kpi: {
      totalSisaPiutang: 53931861,
      piutangBulanIni: 3030764233,
      pembayaran: 3080695437,
      rasioTertagih: 98.3,
      belumLunasCount: 21,
      sisaPerusahaanAsuransi: 35000000,
      sisaListrikKantin: 1540000,
      sisaPiutangLainnya: 17391861,
    }
  },
  MARET: {
    bulan: 'MARET',
    piutangLalu: 53931861,
    piutangBulanIni: 937852452,
    totalPiutang: 991784313,
    pembayaran: 926544391,
    sisaPiutang: 65239922,
    persenTertagih: 93.4,
    barisBelumLunas: 23,
    kpi: {
      totalSisaPiutang: 65239922,
      piutangBulanIni: 937852452,
      pembayaran: 926544391,
      rasioTertagih: 93.4,
      belumLunasCount: 23,
      sisaPerusahaanAsuransi: 48120000,
      sisaListrikKantin: 1850000,
      sisaPiutangLainnya: 15269922,
    }
  },
  APRIL: {
    bulan: 'APRIL',
    piutangLalu: 65239922,
    piutangBulanIni: 2637705355,
    totalPiutang: 2702945277,
    pembayaran: 2610617329,
    sisaPiutang: 92327948,
    persenTertagih: 96.6,
    barisBelumLunas: 22,
    kpi: {
      totalSisaPiutang: 92327948,
      piutangBulanIni: 2637705355,
      pembayaran: 2610617329,
      rasioTertagih: 96.6,
      belumLunasCount: 22,
      sisaPerusahaanAsuransi: 54872510,
      sisaListrikKantin: 2150000,
      sisaPiutangLainnya: 35305438,
    }
  },
  MEI: {
    bulan: 'MEI',
    piutangLalu: 92327948,
    piutangBulanIni: 3851697365,
    totalPiutang: 3944025313,
    pembayaran: 3864479945,
    sisaPiutang: 79545368,
    persenTertagih: 98.0,
    barisBelumLunas: 22,
    kpi: {
      totalSisaPiutang: 79545368,
      piutangBulanIni: 3851697365,
      pembayaran: 3864479945,
      rasioTertagih: 98.0,
      belumLunasCount: 22,
      sisaPerusahaanAsuransi: 54872510,
      sisaListrikKantin: 5066024,
      sisaPiutangLainnya: 19606834,
    }
  },
  JUNI: {
    bulan: 'JUNI',
    piutangLalu: 79545368,
    piutangBulanIni: 2827979439,
    totalPiutang: 2907524807,
    pembayaran: 2799021297,
    sisaPiutang: 108503510,
    persenTertagih: 96.3,
    barisBelumLunas: 20,
    kpi: {
      totalSisaPiutang: 108503510,
      piutangBulanIni: 2827979439,
      pembayaran: 2799021297,
      rasioTertagih: 96.3,
      belumLunasCount: 20,
      sisaPerusahaanAsuransi: 86064456,
      sisaListrikKantin: 1752310,
      sisaPiutangLainnya: 20686744,
    }
  },
  JULI: {
    bulan: 'JULI',
    piutangLalu: 108503510,
    piutangBulanIni: 3696000869,
    totalPiutang: 3804504379,
    pembayaran: 3597845386,
    sisaPiutang: 206658993,
    persenTertagih: 94.6,
    barisBelumLunas: 24,
    kpi: {
      totalSisaPiutang: 206658993,
      piutangBulanIni: 3696000869,
      pembayaran: 3596765476,
      rasioTertagih: 94.6,
      belumLunasCount: 24,
      sisaPerusahaanAsuransi: 162854645,
      sisaListrikKantin: 3757348,
      sisaPiutangLainnya: 40047000,
    }
  },
  AGUSTUS: {
    bulan: 'AGUSTUS',
    piutangLalu: 206658993,
    piutangBulanIni: 148358956,
    totalPiutang: 355017949,
    pembayaran: 178128710,
    sisaPiutang: 176889239,
    persenTertagih: 92.7,
    barisBelumLunas: 23,
    kpi: {
      totalSisaPiutang: 176889239,
      piutangBulanIni: 148358956,
      pembayaran: 178128710,
      rasioTertagih: 92.7,
      belumLunasCount: 23,
      sisaPerusahaanAsuransi: 132554829,
      sisaListrikKantin: 4287410,
      sisaPiutangLainnya: 40047000,
    }
  },
  SEPTEMBER: {
    bulan: 'SEPTEMBER',
    piutangLalu: 176889239,
    piutangBulanIni: 0,
    totalPiutang: 176889239,
    pembayaran: 0,
    sisaPiutang: 176889239,
    persenTertagih: 0,
    barisBelumLunas: 0,
    kpi: {
      totalSisaPiutang: 0,
      piutangBulanIni: 0,
      pembayaran: 0,
      rasioTertagih: 0,
      belumLunasCount: 0,
      sisaPerusahaanAsuransi: 0,
      sisaListrikKantin: 0,
      sisaPiutangLainnya: 0,
    }
  },
  OKTOBER: {
    bulan: 'OKTOBER',
    piutangLalu: 0,
    piutangBulanIni: 0,
    totalPiutang: 0,
    pembayaran: 0,
    sisaPiutang: 0,
    persenTertagih: 0,
    barisBelumLunas: 0,
    kpi: {
      totalSisaPiutang: 0,
      piutangBulanIni: 0,
      pembayaran: 0,
      rasioTertagih: 0,
      belumLunasCount: 0,
      sisaPerusahaanAsuransi: 0,
      sisaListrikKantin: 0,
      sisaPiutangLainnya: 0,
    }
  },
  NOVEMBER: {
    bulan: 'NOVEMBER',
    piutangLalu: 0,
    piutangBulanIni: 0,
    totalPiutang: 0,
    pembayaran: 0,
    sisaPiutang: 0,
    persenTertagih: 0,
    barisBelumLunas: 0,
    kpi: {
      totalSisaPiutang: 0,
      piutangBulanIni: 0,
      pembayaran: 0,
      rasioTertagih: 0,
      belumLunasCount: 0,
      sisaPerusahaanAsuransi: 0,
      sisaListrikKantin: 0,
      sisaPiutangLainnya: 0,
    }
  },
  DESEMBER: {
    bulan: 'DESEMBER',
    piutangLalu: 0,
    piutangBulanIni: 0,
    totalPiutang: 0,
    pembayaran: 0,
    sisaPiutang: 0,
    persenTertagih: 0,
    barisBelumLunas: 0,
    kpi: {
      totalSisaPiutang: 0,
      piutangBulanIni: 0,
      pembayaran: 0,
      rasioTertagih: 0,
      belumLunasCount: 0,
      sisaPerusahaanAsuransi: 0,
      sisaListrikKantin: 0,
      sisaPiutangLainnya: 0,
    }
  }
};

export const LIST_BULAN_2026 = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER'
];

// --- 2. DATA PERUSAHAAN & ASURANSI (Exact 40 rows dari Screenshot 2 & Multi-Month Generator) ---
export interface InvoicePerusahaan {
  id: string;
  noInvoice: string;
  tanggalInvoice: string;
  tanggalJatuhTempo: string;
  nominalTagihan: number;
  pembayaran: number;
  sisaPiutang: number;
  status: 'Lunas' | 'Belum Jatuh Tempo' | 'Belum Ada Tgl JT' | 'Saldo Negatif/Koreksi' | 'Lewat Jatuh Tempo' | 'Sebagian';
  jenisPengobatan: string;
  keterangan?: string;
  documentUrl?: string;
  createdBy?: string;
}

export interface MasterPartnerInfo {
  namaPerusahaan: string;
  jenisPengobatan: string;
  kategori: 'Asuransi Swasta' | 'Perusahaan / Korporasi' | 'Rumah Sakit / Faskes' | 'BUMN / Instansi Pemerintah';
  kontakPic?: string;
  telepon?: string;
  keterangan?: string;
}

export interface PerusahaanAsuransiRow {
  bulan: string;
  no: number;
  namaPerusahaan: string;
  jenisPengobatan: string;
  tanggalPengajuan: string;
  tanggalJatuhTempo: string;
  piutangLalu: number;
  piutangBulanIni: number;
  piutangSdBulanIni: number;
  pajakPph23: number;
  tanggalPembayaran: string;
  pembayaran: number;
  sisaPiutang: number;
  status: 'Lunas' | 'Belum Jatuh Tempo' | 'Belum Ada Tgl JT' | 'Saldo Negatif/Koreksi' | 'Lewat Jatuh Tempo';
  keterangan: string;
  invoices?: InvoicePerusahaan[];
}

export const MASTER_PARTNER_COMPANIES: MasterPartnerInfo[] = [
  { namaPerusahaan: 'Admedika - BANK BRI', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Admedika - JASAMARGA', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Fullerton Health Indonesia - SOMPO', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Fullerton Health Indonesia - PT. YPMI', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Rumah Sakit Karya Husada', jenisPengobatan: 'Laboratorium', kategori: 'Rumah Sakit / Faskes' },
  { namaPerusahaan: 'PT HPPM', jenisPengobatan: 'Rawat Jalan', kategori: 'Perusahaan / Korporasi' },
  { namaPerusahaan: 'Admedika - Takaful Keluarga', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Admedika - PT FWD Insurance Indonesia', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'YKP BANK BJB', jenisPengobatan: 'Rawat Jalan', kategori: 'Perusahaan / Korporasi' },
  { namaPerusahaan: 'RS PURI ASIH', jenisPengobatan: 'Laboratorium', kategori: 'Rumah Sakit / Faskes' },
  { namaPerusahaan: 'PT HINO MOTORS MANUFACTURING INDONESIA', jenisPengobatan: 'Rawat Inap', kategori: 'Perusahaan / Korporasi' },
  { namaPerusahaan: 'RS CITRA SARI HUSADA / RS INTAN BAROKAH', jenisPengobatan: 'Laboratorium', kategori: 'Rumah Sakit / Faskes' },
  { namaPerusahaan: 'RS HASTIEN RENGASDENGKLOK', jenisPengobatan: 'Laboratorium', kategori: 'Rumah Sakit / Faskes' },
  { namaPerusahaan: 'PT PLUMPANG RAYA ANUGRAH', jenisPengobatan: 'MCU', kategori: 'Perusahaan / Korporasi' },
  { namaPerusahaan: 'Admedika - KSK INSURANCE Indonesia', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Admedika - Sompo Insurance Indonesia', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Admedika - Asuransi Cakrawala Proteksi', jenisPengobatan: 'Rawat Inap', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'PT INDOTURBINE', jenisPengobatan: 'Rawat Jalan', kategori: 'Perusahaan / Korporasi' },
  { namaPerusahaan: 'RS IZZA CKP', jenisPengobatan: 'Lab & Sterilisasi Alat', kategori: 'Rumah Sakit / Faskes' },
  { namaPerusahaan: 'RS PAMANUKAN MEDICAL CENTER', jenisPengobatan: 'Laboratorium', kategori: 'Rumah Sakit / Faskes' },
  { namaPerusahaan: 'Admedika - Hanwha Life', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'PT PENJALINDO NUSANTARA', jenisPengobatan: 'MCU', kategori: 'Perusahaan / Korporasi' },
  { namaPerusahaan: 'KLINIK UTAMA PUPUK KUJANG', jenisPengobatan: 'Laboratorium', kategori: 'Rumah Sakit / Faskes' },
  { namaPerusahaan: 'Admedika - PT Bridgestone Tire Indonesia', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'DPPKB', jenisPengobatan: 'MOW', kategori: 'BUMN / Instansi Pemerintah' },
  { namaPerusahaan: 'Admedika - PERUM JASA TIRTA II', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Admedika - SUNDAY CARE INSURANCE', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Admedika - PT TOKIO MARINE LIFE INSURANCE IND', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Admedika - Asuransi JMA Syariah', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'CV. WIWAN SUKSES BERSAMA', jenisPengobatan: 'MCU', kategori: 'Perusahaan / Korporasi' },
  { namaPerusahaan: 'Admedika - BOSOWA ASURANSI', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'Admedika - MEGA INSURANCE', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'BRI life', jenisPengobatan: 'Rawat Jalan', kategori: 'Asuransi Swasta' },
  { namaPerusahaan: 'PT. ALTOM', jenisPengobatan: 'MCU', kategori: 'Perusahaan / Korporasi' },
  { namaPerusahaan: 'RS LIRA MEDIKA', jenisPengobatan: 'IGD', kategori: 'Rumah Sakit / Faskes' },
  { namaPerusahaan: 'PT SUMI INDO WIRING SYSTEMS', jenisPengobatan: 'MCU', kategori: 'Perusahaan / Korporasi' },
  { namaPerusahaan: 'RS HELSA CIKAMPEK', jenisPengobatan: 'RADIOLOGI', kategori: 'Rumah Sakit / Faskes' },
  { namaPerusahaan: 'PT OVALANGGA CITRA SAMUDRA', jenisPengobatan: 'MCU', kategori: 'Perusahaan / Korporasi' },
  { namaPerusahaan: 'BPJS TK & TASPEN', jenisPengobatan: 'RAWAT INAP', kategori: 'BUMN / Instansi Pemerintah' },
  { namaPerusahaan: 'JASA RAHARJA', jenisPengobatan: 'RAWAT INAP', kategori: 'BUMN / Instansi Pemerintah' },
];

export function getCompanyCode(namaPerusahaan: string): string {
  const clean = namaPerusahaan.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  const words = clean.split(' ').filter(w => !['PT', 'RS', 'RSUD', 'DAN', 'INDONESIA', 'HEALTH', 'ADMEDIKA'].includes(w));
  if (words.length > 0) {
    const first = words[0];
    return first.slice(0, 6);
  }
  return 'INV';
}

export function generateDefaultInvoices(row: PerusahaanAsuransiRow): InvoicePerusahaan[] {
  const code = getCompanyCode(row.namaPerusahaan);
  const monthMap: Record<string, string> = {
    JANUARI: '01', FEBRUARI: '02', MARET: '03', APRIL: '04',
    MEI: '05', JUNI: '06', JULI: '07', AGUSTUS: '08',
    SEPTEMBER: '09', OKTOBER: '10', NOVEMBER: '11', DESEMBER: '12'
  };
  const mm = monthMap[row.bulan.toUpperCase()] || '08';
  const year = '2026';

  const list: InvoicePerusahaan[] = [];

  if (row.piutangBulanIni > 0) {
    list.push({
      id: `inv-${row.no}-${mm}-01`,
      noInvoice: `INV/${year}/${mm}/${code}-001`,
      tanggalInvoice: row.tanggalPengajuan && row.tanggalPengajuan !== '-' ? row.tanggalPengajuan : `10/${mm}/${year}`,
      tanggalJatuhTempo: row.tanggalJatuhTempo && row.tanggalJatuhTempo !== '-' ? row.tanggalJatuhTempo : `10/${String(Number(mm) + 1).padStart(2, '0')}/${year}`,
      nominalTagihan: row.piutangBulanIni,
      pembayaran: row.pembayaran > row.piutangLalu ? row.pembayaran - row.piutangLalu : 0,
      sisaPiutang: row.sisaPiutang,
      status: row.sisaPiutang === 0 ? 'Lunas' : (row.status as any),
      jenisPengobatan: row.jenisPengobatan,
      keterangan: `Tagihan masuk bulan ${row.bulan}`
    });
  }

  if (row.piutangLalu > 0) {
    const prevMM = String(Math.max(1, Number(mm) - 1)).padStart(2, '0');
    list.push({
      id: `inv-${row.no}-${prevMM}-02`,
      noInvoice: `INV/${year}/${prevMM}/${code}-099`,
      tanggalInvoice: `15/${prevMM}/${year}`,
      tanggalJatuhTempo: `15/${mm}/${year}`,
      nominalTagihan: row.piutangLalu,
      pembayaran: Math.min(row.pembayaran, row.piutangLalu),
      sisaPiutang: Math.max(0, row.piutangLalu - row.pembayaran),
      status: row.pembayaran >= row.piutangLalu ? 'Lunas' : 'Sebagian',
      jenisPengobatan: row.jenisPengobatan,
      keterangan: `Sisa tagihan carry-over periode lalu`
    });
  }

  return list;
}

// Generate data across ALL 12 MONTHS (Januari - Desember) for all partner companies (Clean 0 / Empty State)
export function generateAllMonthsPerusahaanData(): PerusahaanAsuransiRow[] {
  const months = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];

  const allRows: PerusahaanAsuransiRow[] = [];

  for (const m of months) {
    MASTER_PARTNER_COMPANIES.forEach((partner, idx) => {
      const no = idx + 1;
      const row: PerusahaanAsuransiRow = {
        bulan: m,
        no,
        namaPerusahaan: partner.namaPerusahaan,
        jenisPengobatan: partner.jenisPengobatan,
        tanggalPengajuan: '-',
        tanggalJatuhTempo: '-',
        piutangLalu: 0,
        piutangBulanIni: 0,
        piutangSdBulanIni: 0,
        pajakPph23: 0,
        tanggalPembayaran: '-',
        pembayaran: 0,
        sisaPiutang: 0,
        status: 'Lunas',
        keterangan: '-',
        invoices: []
      };
      allRows.push(row);
    });
  }

  return allRows;
}

export const PERUSAHAAN_ASURANSI_REAL_DATA: PerusahaanAsuransiRow[] = MASTER_PARTNER_COMPANIES.map((partner, idx) => ({
  bulan: 'AGUSTUS',
  no: idx + 1,
  namaPerusahaan: partner.namaPerusahaan,
  jenisPengobatan: partner.jenisPengobatan,
  tanggalPengajuan: '-',
  tanggalJatuhTempo: '-',
  piutangLalu: 0,
  piutangBulanIni: 0,
  piutangSdBulanIni: 0,
  pajakPph23: 0,
  tanggalPembayaran: '-',
  pembayaran: 0,
  sisaPiutang: 0,
  status: 'Lunas',
  keterangan: '-',
  invoices: []
}));

// --- 3. DATA PIUTANG LISTRIK KANTIN 2026 PER STAND (Screenshot 3) ---
export interface ListrikKantinStandMonthRow {
  no: number;
  tanggalBulan: string;
  bulan: string;
  piutang: number;
  pembayaran: number;
  sisaPiutang: number;
  tanggalPembayaran: string;
  tanggalJatuhTempo: string;
  status: 'Lunas' | 'Lewat Tempo' | 'Belum Ada Tagihan';
  keterangan: string;
  createdBy?: string;
}

export interface ListrikKantinStandGroup {
  namaStand: string;
  totalTagihan: number;
  pembayaran: number;
  sisaPiutang: number;
  belumLunasCount: number;
  rows: ListrikKantinStandMonthRow[];
}

export const LISTRIK_KANTIN_REAL_DATA: ListrikKantinStandGroup[] = [
  {
    namaStand: 'AYAM GEPREK',
    totalTagihan: 1637572,
    pembayaran: 1637572,
    sisaPiutang: 0,
    belumLunasCount: 0,
    rows: [
      { no: 1, tanggalBulan: '01/01/2026', bulan: 'JANUARI', piutang: 295336, pembayaran: 295336, sisaPiutang: 0, tanggalPembayaran: '20/04/2026', tanggalJatuhTempo: '15/02/2026', status: 'Lunas', keterangan: '-' },
      { no: 2, tanggalBulan: '01/02/2026', bulan: 'FEBRUARI', piutang: 147668, pembayaran: 147668, sisaPiutang: 0, tanggalPembayaran: '20/04/2026', tanggalJatuhTempo: '15/03/2026', status: 'Lunas', keterangan: '-' },
      { no: 3, tanggalBulan: '01/03/2026', bulan: 'MARET', piutang: 44080, pembayaran: 44080, sisaPiutang: 0, tanggalPembayaran: '20/04/2026', tanggalJatuhTempo: '15/04/2026', status: 'Lunas', keterangan: '-' },
      { no: 4, tanggalBulan: '01/04/2026', bulan: 'APRIL', piutang: 309662, pembayaran: 309662, sisaPiutang: 0, tanggalPembayaran: '05/06/2026', tanggalJatuhTempo: '15/05/2026', status: 'Lunas', keterangan: '-' },
      { no: 5, tanggalBulan: '01/05/2026', bulan: 'MEI', piutang: 221502, pembayaran: 221502, sisaPiutang: 0, tanggalPembayaran: '08/07/2026', tanggalJatuhTempo: '15/06/2026', status: 'Lunas', keterangan: '-' },
      { no: 6, tanggalBulan: '01/06/2026', bulan: 'JUNI', piutang: 279908, pembayaran: 279908, sisaPiutang: 0, tanggalPembayaran: '08/07/2026', tanggalJatuhTempo: '15/07/2026', status: 'Lunas', keterangan: '-' },
      { no: 7, tanggalBulan: '01/07/2026', bulan: 'JULI', piutang: 339416, pembayaran: 339416, sisaPiutang: 0, tanggalPembayaran: '12/08/2026', tanggalJatuhTempo: '15/08/2026', status: 'Lunas', keterangan: '-' },
      { no: 8, tanggalBulan: '01/08/2026', bulan: 'AGUSTUS', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/09/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 9, tanggalBulan: '01/09/2026', bulan: 'SEPTEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/10/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 10, tanggalBulan: '01/10/2026', bulan: 'OKTOBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/11/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 11, tanggalBulan: '01/11/2026', bulan: 'NOVEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/12/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 12, tanggalBulan: '01/12/2026', bulan: 'DESEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/01/2027', status: 'Belum Ada Tagihan', keterangan: '-' },
    ]
  },
  {
    namaStand: 'BU AAS/ SAMPING GEPREK',
    totalTagihan: 2215020,
    pembayaran: 1283830,
    sisaPiutang: 931190,
    belumLunasCount: 3,
    rows: [
      { no: 1, tanggalBulan: '01/01/2026', bulan: 'JANUARI', piutang: 320682, pembayaran: 320682, sisaPiutang: 0, tanggalPembayaran: '04/06/2026', tanggalJatuhTempo: '15/02/2026', status: 'Lunas', keterangan: '-' },
      { no: 2, tanggalBulan: '01/02/2026', bulan: 'FEBRUARI', piutang: 305254, pembayaran: 305254, sisaPiutang: 0, tanggalPembayaran: '04/06/2026', tanggalJatuhTempo: '15/03/2026', status: 'Lunas', keterangan: '-' },
      { no: 3, tanggalBulan: '01/03/2026', bulan: 'MARET', piutang: 320682, pembayaran: 320682, sisaPiutang: 0, tanggalPembayaran: '04/06/2026', tanggalJatuhTempo: '15/04/2026', status: 'Lunas', keterangan: '-' },
      { no: 4, tanggalBulan: '01/04/2026', bulan: 'APRIL', piutang: 337212, pembayaran: 337212, sisaPiutang: 0, tanggalPembayaran: '04/06/2026', tanggalJatuhTempo: '15/05/2026', status: 'Lunas', keterangan: '-' },
      { no: 5, tanggalBulan: '01/05/2026', bulan: 'MEI', piutang: 256766, pembayaran: 0, sisaPiutang: 256766, tanggalPembayaran: '-', tanggalJatuhTempo: '15/06/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 6, tanggalBulan: '01/06/2026', bulan: 'JUNI', piutang: 305254, pembayaran: 0, sisaPiutang: 305254, tanggalPembayaran: '-', tanggalJatuhTempo: '15/07/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 7, tanggalBulan: '01/07/2026', bulan: 'JULI', piutang: 369170, pembayaran: 0, sisaPiutang: 369170, tanggalPembayaran: '-', tanggalJatuhTempo: '15/08/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 8, tanggalBulan: '01/08/2026', bulan: 'AGUSTUS', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/09/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 9, tanggalBulan: '01/09/2026', bulan: 'SEPTEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/10/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 10, tanggalBulan: '01/10/2026', bulan: 'OKTOBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/11/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 11, tanggalBulan: '01/11/2026', bulan: 'NOVEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/12/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 12, tanggalBulan: '01/12/2026', bulan: 'DESEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/01/2027', status: 'Belum Ada Tagihan', keterangan: '-' },
    ]
  },
  {
    namaStand: 'BU NENDEN',
    totalTagihan: 1099796,
    pembayaran: 622630,
    sisaPiutang: 477166,
    belumLunasCount: 3,
    rows: [
      { no: 1, tanggalBulan: '01/01/2026', bulan: 'JANUARI', piutang: 160892, pembayaran: 160892, sisaPiutang: 0, tanggalPembayaran: '04/06/2026', tanggalJatuhTempo: '15/02/2026', status: 'Lunas', keterangan: '-' },
      { no: 2, tanggalBulan: '01/02/2026', bulan: 'FEBRUARI', piutang: 145464, pembayaran: 145464, sisaPiutang: 0, tanggalPembayaran: '04/06/2026', tanggalJatuhTempo: '15/03/2026', status: 'Lunas', keterangan: '-' },
      { no: 3, tanggalBulan: '01/03/2026', bulan: 'MARET', piutang: 160892, pembayaran: 160892, sisaPiutang: 0, tanggalPembayaran: '04/06/2026', tanggalJatuhTempo: '15/04/2026', status: 'Lunas', keterangan: '-' },
      { no: 4, tanggalBulan: '01/04/2026', bulan: 'APRIL', piutang: 155382, pembayaran: 155382, sisaPiutang: 0, tanggalPembayaran: '04/06/2026', tanggalJatuhTempo: '15/05/2026', status: 'Lunas', keterangan: '-' },
      { no: 5, tanggalBulan: '01/05/2026', bulan: 'MEI', piutang: 160892, pembayaran: 0, sisaPiutang: 160892, tanggalPembayaran: '-', tanggalJatuhTempo: '15/06/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 6, tanggalBulan: '01/06/2026', bulan: 'JUNI', piutang: 155382, pembayaran: 0, sisaPiutang: 155382, tanggalPembayaran: '-', tanggalJatuhTempo: '15/07/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 7, tanggalBulan: '01/07/2026', bulan: 'JULI', piutang: 160892, pembayaran: 0, sisaPiutang: 160892, tanggalPembayaran: '-', tanggalJatuhTempo: '15/08/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 8, tanggalBulan: '01/08/2026', bulan: 'AGUSTUS', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/09/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 9, tanggalBulan: '01/09/2026', bulan: 'SEPTEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '10/15/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 10, tanggalBulan: '01/10/2026', bulan: 'OKTOBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/11/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 11, tanggalBulan: '01/11/2026', bulan: 'NOVEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/12/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 12, tanggalBulan: '01/12/2026', bulan: 'DESEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/01/2027', status: 'Belum Ada Tagihan', keterangan: '-' },
    ]
  },
  {
    namaStand: 'TEH DEWI',
    totalTagihan: 915762,
    pembayaran: 562020,
    sisaPiutang: 353742,
    belumLunasCount: 2,
    rows: [
      { no: 1, tanggalBulan: '01/01/2026', bulan: 'JANUARI', piutang: 153178, pembayaran: 153178, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/02/2026', status: 'Lunas', keterangan: '-' },
      { no: 2, tanggalBulan: '01/02/2026', bulan: 'FEBRUARI', piutang: 80446, pembayaran: 80446, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/03/2026', status: 'Lunas', keterangan: '-' },
      { no: 3, tanggalBulan: '01/03/2026', bulan: 'MARET', piutang: 63916, pembayaran: 63916, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/04/2026', status: 'Lunas', keterangan: '-' },
      { no: 4, tanggalBulan: '01/04/2026', bulan: 'APRIL', piutang: 168606, pembayaran: 0, sisaPiutang: 168606, tanggalPembayaran: '-', tanggalJatuhTempo: '15/05/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 5, tanggalBulan: '01/05/2026', bulan: 'MEI', piutang: 144362, pembayaran: 144362, sisaPiutang: 0, tanggalPembayaran: '20/07/2026', tanggalJatuhTempo: '15/06/2026', status: 'Lunas', keterangan: '-' },
      { no: 6, tanggalBulan: '01/06/2026', bulan: 'JUNI', piutang: 120118, pembayaran: 120118, sisaPiutang: 0, tanggalPembayaran: '20/07/2026', tanggalJatuhTempo: '15/07/2026', status: 'Lunas', keterangan: '-' },
      { no: 7, tanggalBulan: '01/07/2026', bulan: 'JULI', piutang: 185136, pembayaran: 0, sisaPiutang: 185136, tanggalPembayaran: '-', tanggalJatuhTempo: '15/08/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 8, tanggalBulan: '01/08/2026', bulan: 'AGUSTUS', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/09/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 9, tanggalBulan: '01/09/2026', bulan: 'SEPTEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/10/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 10, tanggalBulan: '01/10/2026', bulan: 'OKTOBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/11/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 11, tanggalBulan: '01/11/2026', bulan: 'NOVEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/12/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 12, tanggalBulan: '01/12/2026', bulan: 'DESEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/01/2027', status: 'Belum Ada Tagihan', keterangan: '-' },
    ]
  },
  {
    namaStand: 'PAK SUAN',
    totalTagihan: 1592390,
    pembayaran: 1592390,
    sisaPiutang: 0,
    belumLunasCount: 0,
    rows: [
      { no: 1, tanggalBulan: '01/01/2026', bulan: 'JANUARI', piutang: 241338, pembayaran: 241338, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/02/2026', status: 'Lunas', keterangan: '-' },
      { no: 2, tanggalBulan: '01/02/2026', bulan: 'FEBRUARI', piutang: 180728, pembayaran: 180728, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/03/2026', status: 'Lunas', keterangan: '-' },
      { no: 3, tanggalBulan: '01/03/2026', bulan: 'MARET', piutang: 241338, pembayaran: 241338, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/04/2026', status: 'Lunas', keterangan: '-' },
      { no: 4, tanggalBulan: '01/04/2026', bulan: 'APRIL', piutang: 253460, pembayaran: 253460, sisaPiutang: 0, tanggalPembayaran: '04/06/2026', tanggalJatuhTempo: '15/05/2026', status: 'Lunas', keterangan: '-' },
      { no: 5, tanggalBulan: '01/05/2026', bulan: 'MEI', piutang: 180728, pembayaran: 180728, sisaPiutang: 0, tanggalPembayaran: '13/08/2026', tanggalJatuhTempo: '15/06/2026', status: 'Lunas', keterangan: '-' },
      { no: 6, tanggalBulan: '01/06/2026', bulan: 'JUNI', piutang: 217094, pembayaran: 217094, sisaPiutang: 0, tanggalPembayaran: '17/07/2026', tanggalJatuhTempo: '15/07/2026', status: 'Lunas', keterangan: '-' },
      { no: 7, tanggalBulan: '01/07/2026', bulan: 'JULI', piutang: 277704, pembayaran: 277704, sisaPiutang: 0, tanggalPembayaran: '13/08/2026', tanggalJatuhTempo: '15/08/2026', status: 'Lunas', keterangan: '-' },
      { no: 8, tanggalBulan: '01/08/2026', bulan: 'AGUSTUS', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/09/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 9, tanggalBulan: '01/09/2026', bulan: 'SEPTEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/10/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 10, tanggalBulan: '01/10/2026', bulan: 'OKTOBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/11/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 11, tanggalBulan: '01/11/2026', bulan: 'NOVEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/12/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 12, tanggalBulan: '01/12/2026', bulan: 'DESEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/01/2027', status: 'Belum Ada Tagihan', keterangan: '-' },
    ]
  },
  {
    namaStand: 'BU RINI',
    totalTagihan: 1353256,
    pembayaran: 958740,
    sisaPiutang: 394516,
    belumLunasCount: 1,
    rows: [
      { no: 1, tanggalBulan: '01/01/2026', bulan: 'JANUARI', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/02/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 2, tanggalBulan: '01/02/2026', bulan: 'FEBRUARI', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/03/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 3, tanggalBulan: '01/03/2026', bulan: 'MARET', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/04/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 4, tanggalBulan: '01/04/2026', bulan: 'APRIL', piutang: 359252, pembayaran: 359252, sisaPiutang: 0, tanggalPembayaran: '20/06/2026', tanggalJatuhTempo: '15/05/2026', status: 'Lunas', keterangan: '-' },
      { no: 5, tanggalBulan: '01/05/2026', bulan: 'MEI', piutang: 274398, pembayaran: 274398, sisaPiutang: 0, tanggalPembayaran: '23/07/2026', tanggalJatuhTempo: '15/06/2026', status: 'Lunas', keterangan: '-' },
      { no: 6, tanggalBulan: '01/06/2026', bulan: 'JUNI', piutang: 325090, pembayaran: 325090, sisaPiutang: 0, tanggalPembayaran: '12/08/2026', tanggalJatuhTempo: '15/07/2026', status: 'Lunas', keterangan: '-' },
      { no: 7, tanggalBulan: '01/07/2026', bulan: 'JULI', piutang: 394516, pembayaran: 0, sisaPiutang: 394516, tanggalPembayaran: '-', tanggalJatuhTempo: '15/08/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 8, tanggalBulan: '01/08/2026', bulan: 'AGUSTUS', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/09/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 9, tanggalBulan: '01/09/2026', bulan: 'SEPTEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/10/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 10, tanggalBulan: '01/10/2026', bulan: 'OKTOBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/11/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 11, tanggalBulan: '01/11/2026', bulan: 'NOVEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/12/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 12, tanggalBulan: '01/12/2026', bulan: 'DESEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/01/2027', status: 'Belum Ada Tagihan', keterangan: '-' },
    ]
  },
  {
    namaStand: 'PAK RISKA',
    totalTagihan: 1212200,
    pembayaran: 542184,
    sisaPiutang: 670016,
    belumLunasCount: 3,
    rows: [
      { no: 1, tanggalBulan: '01/01/2026', bulan: 'JANUARI', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/02/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 2, tanggalBulan: '01/02/2026', bulan: 'FEBRUARI', piutang: 103588, pembayaran: 103588, sisaPiutang: 0, tanggalPembayaran: '22/04/2026', tanggalJatuhTempo: '15/03/2026', status: 'Lunas', keterangan: '-' },
      { no: 3, tanggalBulan: '01/03/2026', bulan: 'MARET', piutang: 196156, pembayaran: 196156, sisaPiutang: 0, tanggalPembayaran: '22/04/2026', tanggalJatuhTempo: '15/04/2026', status: 'Lunas', keterangan: '-' },
      { no: 4, tanggalBulan: '01/04/2026', bulan: 'APRIL', piutang: 242440, pembayaran: 242440, sisaPiutang: 0, tanggalPembayaran: '29/06/2026', tanggalJatuhTempo: '15/05/2026', status: 'Lunas', keterangan: '-' },
      { no: 5, tanggalBulan: '01/05/2026', bulan: 'MEI', piutang: 219298, pembayaran: 0, sisaPiutang: 219298, tanggalPembayaran: '-', tanggalJatuhTempo: '15/06/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 6, tanggalBulan: '01/06/2026', bulan: 'JUNI', piutang: 185136, pembayaran: 0, sisaPiutang: 185136, tanggalPembayaran: '-', tanggalJatuhTempo: '15/07/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 7, tanggalBulan: '01/07/2026', bulan: 'JULI', piutang: 265582, pembayaran: 0, sisaPiutang: 265582, tanggalPembayaran: '-', tanggalJatuhTempo: '15/08/2026', status: 'Lewat Tempo', keterangan: 'Menunggak' },
      { no: 8, tanggalBulan: '01/08/2026', bulan: 'AGUSTUS', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/09/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 9, tanggalBulan: '01/09/2026', bulan: 'SEPTEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/10/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 10, tanggalBulan: '01/10/2026', bulan: 'OKTOBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/11/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 11, tanggalBulan: '01/11/2026', bulan: 'NOVEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/12/2026', status: 'Belum Ada Tagihan', keterangan: '-' },
      { no: 12, tanggalBulan: '01/12/2026', bulan: 'DESEMBER', piutang: 0, pembayaran: 0, sisaPiutang: 0, tanggalPembayaran: '-', tanggalJatuhTempo: '15/01/2027', status: 'Belum Ada Tagihan', keterangan: '-' },
    ]
  }
];

// --- 4. DATA SEMUA REKAPAN BULANAN (Screenshot 4) ---
export interface SemuaRekapanRow {
  bulan: string;
  no: number;
  namaPenjamin: string;
  piutangBulanLalu: number;
  piutangBulanIni: number;
  piutangSdBulanIni: number;
  pembayaran: number;
  sisaPiutang: number;
  status: 'Lunas' | 'Belum Lunas';
  keterangan: string;
}

export interface SemuaRekapanGroup {
  bulan: string;
  totalPiutangSdBulanIni: number;
  totalPembayaran: number;
  totalSisaPiutang: number;
  rows: SemuaRekapanRow[];
}

export const SEMUA_REKAPAN_REAL_GROUPS: Record<string, SemuaRekapanGroup> = {
  JANUARI: {
    bulan: 'JANUARI',
    totalPiutangSdBulanIni: 3827978979,
    totalPembayaran: 3724115914,
    totalSisaPiutang: 103863065,
    rows: [
      { bulan: 'JANUARI', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JANUARI', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 3715402074, piutangSdBulanIni: 3715402074, pembayaran: 3715402074, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JANUARI', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JANUARI', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'JANUARI', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JANUARI', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JANUARI', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 82630614, piutangBulanIni: 1626727, piutangSdBulanIni: 84257341, pembayaran: 1751122, sisaPiutang: 82506219, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'JANUARI', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 10000000, piutangBulanIni: 5218200, piutangSdBulanIni: 15218200, pembayaran: 0, sisaPiutang: 15218200, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'JANUARI', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 0, piutangBulanIni: 2450848, piutangSdBulanIni: 2450848, pembayaran: 2450848, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JANUARI', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 6012642, piutangBulanIni: 1097874, piutangSdBulanIni: 7110516, pembayaran: 4511870, sisaPiutang: 2598646, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  FEBRUARI: {
    bulan: 'FEBRUARI',
    totalPiutangSdBulanIni: 3134627298,
    totalPembayaran: 3080695437,
    totalSisaPiutang: 53931861,
    rows: [
      { bulan: 'FEBRUARI', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'FEBRUARI', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 3024110010, piutangSdBulanIni: 3024110010, pembayaran: 3024110010, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'FEBRUARI', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'FEBRUARI', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'FEBRUARI', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'FEBRUARI', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'FEBRUARI', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 82506219, piutangBulanIni: 4843637, piutangSdBulanIni: 87349856, pembayaran: 44002339, sisaPiutang: 43347517, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'FEBRUARI', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 15218200, piutangBulanIni: 0, piutangSdBulanIni: 15218200, pembayaran: 10000000, sisaPiutang: 5218200, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'FEBRUARI', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 0, piutangBulanIni: 1810586, piutangSdBulanIni: 1810586, pembayaran: 1810586, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'FEBRUARI', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 2598646, piutangBulanIni: 0, piutangSdBulanIni: 2598646, pembayaran: 772502, sisaPiutang: 1826144, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  MARET: {
    bulan: 'MARET',
    totalPiutangSdBulanIni: 991784313,
    totalPembayaran: 926544391,
    totalSisaPiutang: 65239922,
    rows: [
      { bulan: 'MARET', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MARET', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 917685567, piutangSdBulanIni: 917685567, pembayaran: 917685567, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MARET', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MARET', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'MARET', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MARET', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MARET', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 43347517, piutangBulanIni: 18697919, piutangSdBulanIni: 62045436, pembayaran: 7389858, sisaPiutang: 54655578, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'MARET', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 5218200, piutangBulanIni: 0, piutangSdBulanIni: 5218200, pembayaran: 0, sisaPiutang: 5218200, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'MARET', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 0, piutangBulanIni: 1468966, piutangSdBulanIni: 1468966, pembayaran: 1468966, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MARET', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 1826144, piutangBulanIni: 0, piutangSdBulanIni: 1826144, pembayaran: 0, sisaPiutang: 1826144, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  APRIL: {
    bulan: 'APRIL',
    totalPiutangSdBulanIni: 2702945277,
    totalPembayaran: 2610617329,
    totalSisaPiutang: 92327948,
    rows: [
      { bulan: 'APRIL', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'APRIL', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 2594284400, piutangSdBulanIni: 2594284400, pembayaran: 2594284400, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'APRIL', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'APRIL', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'APRIL', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'APRIL', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'APRIL', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 54655578, piutangBulanIni: 28951149, piutangSdBulanIni: 83606727, pembayaran: 13247329, sisaPiutang: 70359398, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'APRIL', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 5218200, piutangBulanIni: 9672800, piutangSdBulanIni: 14891000, pembayaran: 0, sisaPiutang: 14891000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'APRIL', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 0, piutangBulanIni: 1635368, piutangSdBulanIni: 1635368, pembayaran: 1635368, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'APRIL', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 1826144, piutangBulanIni: 3161638, piutangSdBulanIni: 4987782, pembayaran: 1450232, sisaPiutang: 3537550, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  MEI: {
    bulan: 'MEI',
    totalPiutangSdBulanIni: 3944025313,
    totalPembayaran: 3864479945,
    totalSisaPiutang: 79545368,
    rows: [
      { bulan: 'MEI', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MEI', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 3848099574, piutangSdBulanIni: 3848099574, pembayaran: 3848099574, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MEI', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MEI', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'MEI', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MEI', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'MEI', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 70359398, piutangBulanIni: 595943, piutangSdBulanIni: 70955341, pembayaran: 16082831, sisaPiutang: 54872510, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'MEI', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 14891000, piutangBulanIni: 0, piutangSdBulanIni: 14891000, pembayaran: 0, sisaPiutang: 14891000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'MEI', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 0, piutangBulanIni: 1175834, piutangSdBulanIni: 1175834, pembayaran: 0, sisaPiutang: 1175834, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'MEI', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 3537550, piutangBulanIni: 1826014, piutangSdBulanIni: 5363564, pembayaran: 297540, sisaPiutang: 5066024, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  JUNI: {
    bulan: 'JUNI',
    totalPiutangSdBulanIni: 2907524807,
    totalPembayaran: 2800101207,
    totalSisaPiutang: 107423600,
    rows: [
      { bulan: 'JUNI', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JUNI', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 2781680700, piutangSdBulanIni: 2781680700, pembayaran: 2781680700, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JUNI', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JUNI', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'JUNI', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JUNI', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JUNI', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 54872510, piutangBulanIni: 45641947, piutangSdBulanIni: 100514457, pembayaran: 14450001, sisaPiutang: 86064456, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'JUNI', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 14891000, piutangBulanIni: 0, piutangSdBulanIni: 14891000, pembayaran: 0, sisaPiutang: 14891000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'JUNI', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 1175834, piutangBulanIni: 656792, piutangSdBulanIni: 1832626, pembayaran: 656792, sisaPiutang: 1175834, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'JUNI', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 5066024, piutangBulanIni: 0, piutangSdBulanIni: 5066024, pembayaran: 3313714, sisaPiutang: 1752310, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  JULI: {
    bulan: 'JULI',
    totalPiutangSdBulanIni: 3803424469,
    totalPembayaran: 3596765476,
    totalSisaPiutang: 206658993,
    rows: [
      { bulan: 'JULI', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JULI', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 3445931228, piutangSdBulanIni: 3445931228, pembayaran: 3445931228, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JULI', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JULI', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'JULI', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JULI', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JULI', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 86064456, piutangBulanIni: 109523909, piutangSdBulanIni: 195588365, pembayaran: 32733720, sisaPiutang: 162854645, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'JULI', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 14891000, piutangBulanIni: 136616000, piutangSdBulanIni: 151507000, pembayaran: 115000000, sisaPiutang: 36507000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'JULI', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 1175834, piutangBulanIni: 883804, piutangSdBulanIni: 2059638, pembayaran: 2059638, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'JULI', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 1752310, piutangBulanIni: 3045928, piutangSdBulanIni: 4798238, pembayaran: 1040890, sisaPiutang: 3757348, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  AGUSTUS: {
    bulan: 'AGUSTUS',
    totalPiutangSdBulanIni: 367881107,
    totalPembayaran: 178128710,
    totalSisaPiutang: 189752397,
    rows: [
      { bulan: 'AGUSTUS', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'AGUSTUS', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 110770200, piutangSdBulanIni: 110770200, pembayaran: 110770200, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'AGUSTUS', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'AGUSTUS', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'AGUSTUS', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'AGUSTUS', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'AGUSTUS', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 162854645, piutangBulanIni: 47648426, piutangSdBulanIni: 210503071, pembayaran: 65085084, sisaPiutang: 145417987, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'AGUSTUS', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 36507000, piutangBulanIni: 0, piutangSdBulanIni: 36507000, pembayaran: 0, sisaPiutang: 36507000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'AGUSTUS', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 0, piutangBulanIni: 811072, piutangSdBulanIni: 811072, pembayaran: 811072, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'AGUSTUS', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 3757348, piutangBulanIni: 1992416, piutangSdBulanIni: 5749764, pembayaran: 1462354, sisaPiutang: 4287410, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  SEPTEMBER: {
    bulan: 'SEPTEMBER',
    totalPiutangSdBulanIni: 189752397,
    totalPembayaran: 0,
    totalSisaPiutang: 189752397,
    rows: [
      { bulan: 'SEPTEMBER', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'SEPTEMBER', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'SEPTEMBER', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'SEPTEMBER', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'SEPTEMBER', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'SEPTEMBER', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'SEPTEMBER', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 145417987, piutangBulanIni: 0, piutangSdBulanIni: 145417987, pembayaran: 0, sisaPiutang: 145417987, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'SEPTEMBER', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 36507000, piutangBulanIni: 0, piutangSdBulanIni: 36507000, pembayaran: 0, sisaPiutang: 36507000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'SEPTEMBER', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'SEPTEMBER', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 4287410, piutangBulanIni: 0, piutangSdBulanIni: 4287410, pembayaran: 0, sisaPiutang: 4287410, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  OKTOBER: {
    bulan: 'OKTOBER',
    totalPiutangSdBulanIni: 189752397,
    totalPembayaran: 0,
    totalSisaPiutang: 189752397,
    rows: [
      { bulan: 'OKTOBER', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'OKTOBER', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'OKTOBER', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'OKTOBER', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'OKTOBER', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'OKTOBER', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'OKTOBER', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 145417987, piutangBulanIni: 0, piutangSdBulanIni: 145417987, pembayaran: 0, sisaPiutang: 145417987, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'OKTOBER', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 36507000, piutangBulanIni: 0, piutangSdBulanIni: 36507000, pembayaran: 0, sisaPiutang: 36507000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'OKTOBER', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'OKTOBER', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 4287410, piutangBulanIni: 0, piutangSdBulanIni: 4287410, pembayaran: 0, sisaPiutang: 4287410, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  NOVEMBER: {
    bulan: 'NOVEMBER',
    totalPiutangSdBulanIni: 189752397,
    totalPembayaran: 0,
    totalSisaPiutang: 189752397,
    rows: [
      { bulan: 'NOVEMBER', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'NOVEMBER', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'NOVEMBER', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'NOVEMBER', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'NOVEMBER', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'NOVEMBER', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'NOVEMBER', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 145417987, piutangBulanIni: 0, piutangSdBulanIni: 145417987, pembayaran: 0, sisaPiutang: 145417987, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'NOVEMBER', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 36507000, piutangBulanIni: 0, piutangSdBulanIni: 36507000, pembayaran: 0, sisaPiutang: 36507000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'NOVEMBER', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'NOVEMBER', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 4287410, piutangBulanIni: 0, piutangSdBulanIni: 4287410, pembayaran: 0, sisaPiutang: 4287410, status: 'Belum Lunas', keterangan: '' },
    ]
  },
  DESEMBER: {
    bulan: 'DESEMBER',
    totalPiutangSdBulanIni: 189752397,
    totalPembayaran: 0,
    totalSisaPiutang: 189752397,
    rows: [
      { bulan: 'DESEMBER', no: 1, namaPenjamin: 'KEMENKES', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'DESEMBER', no: 2, namaPenjamin: 'BPJS', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'DESEMBER', no: 3, namaPenjamin: 'KARAWANG SEHAT', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'DESEMBER', no: 4, namaPenjamin: 'GLOBAL FUND', piutangBulanLalu: 3540000, piutangBulanIni: 0, piutangSdBulanIni: 3540000, pembayaran: 0, sisaPiutang: 3540000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'DESEMBER', no: 5, namaPenjamin: 'SKRINING TB DM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'DESEMBER', no: 6, namaPenjamin: 'SKRINING TCM', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'DESEMBER', no: 7, namaPenjamin: 'PERUSAHAAN DAN ASURANSI', piutangBulanLalu: 145417987, piutangBulanIni: 0, piutangSdBulanIni: 145417987, pembayaran: 0, sisaPiutang: 145417987, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'DESEMBER', no: 8, namaPenjamin: 'SEWA LAHAN', piutangBulanLalu: 36507000, piutangBulanIni: 0, piutangSdBulanIni: 36507000, pembayaran: 0, sisaPiutang: 36507000, status: 'Belum Lunas', keterangan: '' },
      { bulan: 'DESEMBER', no: 9, namaPenjamin: 'LISTRIK BJB', piutangBulanLalu: 0, piutangBulanIni: 0, piutangSdBulanIni: 0, pembayaran: 0, sisaPiutang: 0, status: 'Lunas', keterangan: '' },
      { bulan: 'DESEMBER', no: 10, namaPenjamin: 'LISTRIK KANTIN JAWARA', piutangBulanLalu: 4287410, piutangBulanIni: 0, piutangSdBulanIni: 4287410, pembayaran: 0, sisaPiutang: 4287410, status: 'Belum Lunas', keterangan: '' },
    ]
  }
};
