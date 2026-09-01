import { ListrikKantinRecord, UmurPiutangCategory } from '../types/piutang';

export function calculateListrikUmur(tanggalJatuhTempo: string): { hari: number; kategori: UmurPiutangCategory } {
  const dueDate = new Date(tanggalJatuhTempo);
  const today = new Date('2026-08-25');
  
  // Diff from due date or billing date
  const diffTime = today.getTime() - dueDate.getTime();
  const hari = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let kategori: UmurPiutangCategory = '0-30 Hari (Lancar)';
  if (hari <= 30) {
    kategori = '0-30 Hari (Lancar)';
  } else if (hari <= 60) {
    kategori = '31-60 Hari (Kurang Lancar)';
  } else if (hari <= 90) {
    kategori = '61-90 Hari (Diragukan)';
  } else {
    kategori = '>90 Hari (Macet / Kritis)';
  }

  return { hari, kategori };
}

export const INITIAL_LISTRIK_KANTIN_DATA: ListrikKantinRecord[] = [
  {
    id: 'ELC-KNT-2026-001',
    noInvoice: 'INV-ELC-KNT-2608-01',
    namaPenyewa: 'Stand 01 - Bu Eni (Nasi Rames & Prasmanan)',
    lokasiStand: 'Kantin Utama - Stand No. 01',
    bulanTagihan: 'Agustus 2026',
    meterAwal: 1420,
    meterAkhir: 1785,
    totalKwh: 365,
    tarifPerKwh: 1550,
    biayaBeban: 25000,
    totalTagihan: 590750,
    nominalDibayar: 590750,
    sisaPiutang: 0,
    tanggalInvoice: '2026-08-05',
    tanggalJatuhTempo: '2026-08-15',
    statusPembayaran: 'Lunas',
    hariUmur: 10,
    kategoriUmur: '0-30 Hari (Lancar)',
    catatan: 'Lunas via transfer Kasir Keuangan RSUD',
    tanggalBayar: '2026-08-12',
    noKuitansi: 'KWT-ELC-2608-001'
  },
  {
    id: 'ELC-KNT-2026-002',
    noInvoice: 'INV-ELC-KNT-2608-02',
    namaPenyewa: 'Stand 02 - Pak Maman (Soto Kudus & Minuman)',
    lokasiStand: 'Kantin Utama - Stand No. 02',
    bulanTagihan: 'Agustus 2026',
    meterAwal: 2110,
    meterAkhir: 2490,
    totalKwh: 380,
    tarifPerKwh: 1550,
    biayaBeban: 25000,
    totalTagihan: 614000,
    nominalDibayar: 0,
    sisaPiutang: 614000,
    tanggalInvoice: '2026-08-05',
    tanggalJatuhTempo: '2026-08-15',
    statusPembayaran: 'Belum Lunas',
    hariUmur: 10,
    kategoriUmur: '0-30 Hari (Lancar)',
    catatan: 'Konfirmasi janji bayar akhir pekan ini'
  },
  {
    id: 'ELC-KNT-2026-003',
    noInvoice: 'INV-ELC-KNT-2608-03',
    namaPenyewa: 'Stand 03 - Ibu Yanti (Aneka Jus & Buah Segar)',
    lokasiStand: 'Kantin Utama - Stand No. 03 (Kulkas Besar)',
    bulanTagihan: 'Agustus 2026',
    meterAwal: 3450,
    meterAkhir: 3960,
    totalKwh: 510,
    tarifPerKwh: 1550,
    biayaBeban: 25000,
    totalTagihan: 815500,
    nominalDibayar: 400000,
    sisaPiutang: 415500,
    statusPembayaran: 'Cicilan',
    tanggalInvoice: '2026-08-05',
    tanggalJatuhTempo: '2026-08-15',
    hariUmur: 10,
    kategoriUmur: '0-30 Hari (Lancar)',
    catatan: 'Cicilan ke-1 sudah masuk Rp 400.000, sisa pelunasan tgl 28'
  },
  {
    id: 'ELC-KNT-2026-004',
    noInvoice: 'INV-ELC-KNT-2608-04',
    namaPenyewa: 'Stand 04 - Dapur Berkah (Ayam Geprek & Seafood)',
    lokasiStand: 'Kantin Utama - Stand No. 04',
    bulanTagihan: 'Agustus 2026',
    meterAwal: 980,
    meterAkhir: 1350,
    totalKwh: 370,
    tarifPerKwh: 1550,
    biayaBeban: 25000,
    totalTagihan: 598500,
    nominalDibayar: 598500,
    sisaPiutang: 0,
    statusPembayaran: 'Lunas',
    tanggalInvoice: '2026-08-05',
    tanggalJatuhTempo: '2026-08-15',
    hariUmur: 10,
    kategoriUmur: '0-30 Hari (Lancar)',
    catatan: 'Lunas kuitansi kasir',
    tanggalBayar: '2026-08-14',
    noKuitansi: 'KWT-ELC-2608-004'
  },
  {
    id: 'ELC-KNT-2026-005',
    noInvoice: 'INV-ELC-KNT-2607-05',
    namaPenyewa: 'Stand 05 - Kopi & Roti Bakar Sahabat',
    lokasiStand: 'Kantin Utama - Stand No. 05',
    bulanTagihan: 'Juli 2026',
    meterAwal: 1820,
    meterAkhir: 2310,
    totalKwh: 490,
    tarifPerKwh: 1550,
    biayaBeban: 25000,
    totalTagihan: 784500,
    nominalDibayar: 0,
    sisaPiutang: 784500,
    statusPembayaran: 'Menunggak',
    tanggalInvoice: '2026-07-05',
    tanggalJatuhTempo: '2026-07-15',
    hariUmur: 41,
    kategoriUmur: '31-60 Hari (Kurang Lancar)',
    catatan: 'Surat Peringatan 1 (SP-1) telah diterbitkan Pengelola Kantin'
  },
  {
    id: 'ELC-KNT-2026-006',
    noInvoice: 'INV-ELC-KNT-2608-06',
    namaPenyewa: 'Stand 06 - Bakso & Mie Ayam Mas Joko',
    lokasiStand: 'Kantin Utama - Stand No. 06',
    bulanTagihan: 'Agustus 2026',
    meterAwal: 870,
    meterAkhir: 1190,
    totalKwh: 320,
    tarifPerKwh: 1550,
    biayaBeban: 25000,
    totalTagihan: 521000,
    nominalDibayar: 521000,
    sisaPiutang: 0,
    statusPembayaran: 'Lunas',
    tanggalInvoice: '2026-08-05',
    tanggalJatuhTempo: '2026-08-15',
    hariUmur: 10,
    kategoriUmur: '0-30 Hari (Lancar)',
    catatan: 'Lunas',
    tanggalBayar: '2026-08-10',
    noKuitansi: 'KWT-ELC-2608-006'
  },
  {
    id: 'ELC-KNT-2026-007',
    noInvoice: 'INV-ELC-KOP-2608-07',
    namaPenyewa: 'Koperasi Pegawai RSUD Jatisari (Mart & Snack)',
    lokasiStand: 'Gedung Penunjang Lt. 1',
    bulanTagihan: 'Agustus 2026',
    meterAwal: 5400,
    meterAkhir: 6150,
    totalKwh: 750,
    tarifPerKwh: 1550,
    biayaBeban: 35000,
    totalTagihan: 1197500,
    nominalDibayar: 1197500,
    sisaPiutang: 0,
    statusPembayaran: 'Lunas',
    tanggalInvoice: '2026-08-05',
    tanggalJatuhTempo: '2026-08-20',
    hariUmur: 5,
    kategoriUmur: '0-30 Hari (Lancar)',
    catatan: 'Pembayaran potong kas bendahara koperasi',
    tanggalBayar: '2026-08-18',
    noKuitansi: 'KWT-ELC-2608-007'
  },
  {
    id: 'ELC-KNT-2026-008',
    noInvoice: 'INV-ELC-ATM-2606-08',
    namaPenyewa: 'Tenant Galeri ATM Bersama & Minimarket Vendor',
    lokasiStand: 'Lobi Depan RSUD Jatisari',
    bulanTagihan: 'Juni 2026',
    meterAwal: 4200,
    meterAkhir: 4980,
    totalKwh: 780,
    tarifPerKwh: 1550,
    biayaBeban: 50000,
    totalTagihan: 1259000,
    nominalDibayar: 0,
    sisaPiutang: 1259000,
    statusPembayaran: 'Menunggak',
    tanggalInvoice: '2026-06-05',
    tanggalJatuhTempo: '2026-06-15',
    hariUmur: 71,
    kategoriUmur: '61-90 Hari (Diragukan)',
    catatan: 'Menunggu proses approval transfer dari kantor cabang pusat perbankan'
  },
  {
    id: 'ELC-KNT-2026-009',
    noInvoice: 'INV-ELC-KNT-2608-08',
    namaPenyewa: 'Stand 07 - Warung Kopi & Camilan Tradisional',
    lokasiStand: 'Kantin Utama - Stand No. 07',
    bulanTagihan: 'Agustus 2026',
    meterAwal: 610,
    meterAkhir: 845,
    totalKwh: 235,
    tarifPerKwh: 1550,
    biayaBeban: 25000,
    totalTagihan: 389250,
    nominalDibayar: 0,
    sisaPiutang: 389250,
    statusPembayaran: 'Belum Lunas',
    tanggalInvoice: '2026-08-05',
    tanggalJatuhTempo: '2026-08-15',
    hariUmur: 10,
    kategoriUmur: '0-30 Hari (Lancar)',
    catatan: 'Invoice telah disampaikan ke penyewa'
  }
];
