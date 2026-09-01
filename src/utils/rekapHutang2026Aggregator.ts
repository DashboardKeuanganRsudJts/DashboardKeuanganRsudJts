import { InvoiceHutang2026Record } from '../types/invoiceHutang';
import { INITIAL_KODE_REKENING } from '../data/databaseKodeRekeningData';

export interface PosBelanja2026Item {
  id: string;
  noUrut: number;
  kodeRekening: string;
  kegiatan: string; // Uraian / Jenis Pengadaan
  totalTagihan: number; // Saldo Awal Hutang 2026 (Jumlah Invoice)
  koreksi: number; // Koreksi
  jumlahBayar: number; // Realisasi Pembayaran
  sisaHutang: number; // Saldo Akhir (Sisa Hutang)
  invoiceCount: number;
  invoices: InvoiceHutang2026Record[];
  isHighlighted?: boolean;
  createdBy?: string;
  updatedAt?: string;
}

export const MASTER_31_POS_BELANJA_2026: {
  noUrut: number;
  kodeRekening: string;
  uraian: string;
  isHighlighted?: boolean;
}[] = [
  { noUrut: 1, kodeRekening: '5.1.02.01.01.0010', uraian: 'Belanja Bahan-Isi Tabung Gas' },
  { noUrut: 2, kodeRekening: '5.1.02.01.01.0012', uraian: 'Belanja Bahan-Bahan Lainnya (APD)' },
  { noUrut: 3, kodeRekening: '5.1.02.01.01.0012', uraian: 'Belanja Bahan-Bahan Lainnya (Dialisis)' },
  { noUrut: 4, kodeRekening: '5.1.02.01.01.0012', uraian: 'Belanja Bahan-Bahan Lainnya (Farmasi)' },
  { noUrut: 7, kodeRekening: '5.1.02.01.01.0012', uraian: 'Belanja Bahan-Bahan Lainnya - Sparepart Perbaikan Alat Kesehatan (Elektromedik)', isHighlighted: true },
  { noUrut: 8, kodeRekening: '5.1.02.01.01.0016', uraian: 'Belanja Suku Cadang-Suku Cadang Alat Laboratorium' },
  { noUrut: 9, kodeRekening: '5.1.02.01.01.0024', uraian: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Alat Tulis Kantor' },
  { noUrut: 10, kodeRekening: '5.1.02.01.01.0026', uraian: 'Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak' },
  { noUrut: 14, kodeRekening: '5.1.02.01.01.0036', uraian: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Alat/Bahan untuk Kegiatan Kantor Lainnya' },
  { noUrut: 15, kodeRekening: '5.1.02.01.01.0037', uraian: 'Belanja Obat-Obatan-Obat' },
  { noUrut: 18, kodeRekening: '5.1.02.01.01.0056', uraian: 'Belanja Makanan dan Minuman pada Fasilitas Pelayanan Urusan Kesehatan' },
  { noUrut: 20, kodeRekening: '5.1.02.01.01.0081', uraian: 'Belanja Peralatan Kebersihan dan Bahan Pembersih' },
  { noUrut: 32, kodeRekening: '5.1.02.02.01.0030', uraian: 'Belanja Jasa Tenaga Kebersihan' },
  { noUrut: 33, kodeRekening: '5.1.02.02.01.0031', uraian: 'Belanja Jasa Tenaga Keamanan' },
  { noUrut: 36, kodeRekening: '5.1.02.02.01.0046', uraian: 'Belanja Jasa Konversi Aplikasi/Sistem Informasi' },
  { noUrut: 42, kodeRekening: '-', uraian: 'Belanja Tagihan Air' },
  { noUrut: 43, kodeRekening: '5.1.02.02.01.0061', uraian: 'Belanja Tagihan Listrik' },
  { noUrut: 44, kodeRekening: '5.1.02.02.01.0063', uraian: 'Belanja Kawat/Faksimili/Internet/TV Berlangganan' },
  { noUrut: 46, kodeRekening: '5.1.02.02.01.0067', uraian: 'Belanja Pembayaran Pajak, Bea, dan Perizinan' },
  { noUrut: 47, kodeRekening: '5.1.02.02.01.0069', uraian: 'Belanja Pengolahan Air Limbah' },
  { noUrut: 57, kodeRekening: '5.1.02.03.02.0035', uraian: 'Belanja Pemeliharaan Alat Angkutan-Alat Angkutan Darat Bermotor-Kendaraan Dinas Bermotor Perorangan', isHighlighted: true },
  { noUrut: 58, kodeRekening: '5.1.02.03.02.0081', uraian: 'Belanja Pemeliharaan Alat Bengkel dan Alat Ukur-Alat Bengkel Tak Bermesin-Alat Bengkel Tak Bermesin Lainnya' },
  { noUrut: 64, kodeRekening: '5.1.02.03.03.0001', uraian: 'Belanja Pemeliharaan Bangunan Gedung-Bangunan Gedung Tempat Kerja-Bangunan Gedung Kantor', isHighlighted: true },
  { noUrut: 65, kodeRekening: '5.1.02.03.04.0126', uraian: 'Belanja Pemeliharaan Jaringan-Jaringan Listrik-Jaringan Listrik Lainnya' },
  { noUrut: 73, kodeRekening: '5.2.02.05.02.0006', uraian: 'Belanja Modal Alat Rumah Tangga Lainnya (Home Use)' },
  { noUrut: 74, kodeRekening: '5.2.02.06.01.0006', uraian: 'Belanja Modal Alat Studio Lainnya' },
  { noUrut: 75, kodeRekening: '5.2.02.07.02.0005', uraian: 'Belanja Modal Alat Kesehatan Umum Lainnya' },
  { noUrut: 78, kodeRekening: '5.1.02.02.09.0018', uraian: 'Beban Jasa Konsultansi Pengawasan Arsitektur', isHighlighted: true },
  { noUrut: 79, kodeRekening: '5.1.02.03.04.0103', uraian: 'Belanja Pemeliharaan Instalasi-Instalasi Pembangkit Listrik-Instalasi Pembangkit Listrik Lainnya' },
  { noUrut: 80, kodeRekening: '5.1.01.01.01.0001', uraian: 'Belanja Gaji Pegawai BLUD TA 2026' },
  { noUrut: 81, kodeRekening: '5.1.01.01.01.0001', uraian: 'Jasa Pelayanan Medis Dokter TA 2026' }
];

export function matchInvoice2026ToPosBelanja(inv: InvoiceHutang2026Record): {
  kodeRekening: string;
  uraian: string;
  noUrut?: number;
  isHighlighted?: boolean;
} {
  const sub = (inv.subBelanja || '').trim();
  const uraian = (inv.uraian || '').trim();

  // 1. Direct match against 31 master categories by full uraian or sub
  for (const master of MASTER_31_POS_BELANJA_2026) {
    if (
      master.uraian.toLowerCase() === uraian.toLowerCase() ||
      master.uraian.toLowerCase() === sub.toLowerCase()
    ) {
      return master;
    }
  }

  // 2. Keyword & Alias matches
  const combined = `${uraian} ${sub}`.toLowerCase();

  if (combined.includes('bmhp') || combined.includes('farmasi')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Farmasi'));
    if (found) return found;
  }

  if (combined.includes('obat') || combined.includes('vaksin') || combined.includes('antibiotik')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian === 'Belanja Obat-Obatan-Obat');
    if (found) return found;
  }

  if (combined.includes('aplikasi') || combined.includes('simrs') || combined.includes('sim rs') || combined.includes('konversi')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Konversi Aplikasi'));
    if (found) return found;
  }

  if (combined.includes('sparepart') || combined.includes('elektromedik') || combined.includes('alat kesehatan (elektromedik)')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Sparepart Perbaikan Alat Kesehatan'));
    if (found) return found;
  }

  if (combined.includes('(apd)') || combined.includes('handscoon') || combined.includes('masker bedah') || combined.includes('infus set')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('(APD)'));
    if (found) return found;
  }

  if (combined.includes('pemeliharaan gedung') || combined.includes('bangunan gedung')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Pemeliharaan Bangunan Gedung'));
    if (found) return found;
  }

  if (combined.includes('konsultansi') || combined.includes('arsitektur')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Konsultansi Pengawasan Arsitektur'));
    if (found) return found;
  }

  if (combined.includes('modal alat studio') || combined.includes('alat studio')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Modal Alat Studio'));
    if (found) return found;
  }

  if (combined.includes('modal alat rumah tangga') || combined.includes('home use')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Modal Alat Rumah Tangga'));
    if (found) return found;
  }

  if (combined.includes('modal alat kesehatan') || combined.includes('alat kesehatan umum')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Modal Alat Kesehatan Umum'));
    if (found) return found;
  }

  if (combined.includes('kebersihan') || combined.includes('laundry') || combined.includes('pembersih') || combined.includes('desinfektan')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Peralatan Kebersihan'));
    if (found) return found;
  }

  if (combined.includes('dialisis') || combined.includes('hemodialisa')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Dialisis'));
    if (found) return found;
  }

  if (combined.includes('laboratorium') || combined.includes('reagen')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Alat Laboratorium'));
    if (found) return found;
  }

  if (combined.includes('bahan cetak') || combined.includes('cetakan') || combined.includes('rekam medis')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Bahan Cetak'));
    if (found) return found;
  }

  if (combined.includes('alat tulis kantor') || combined.includes('atk') || combined.includes('thermal')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Alat Tulis Kantor'));
    if (found) return found;
  }

  if (combined.includes('jaringan listrik') || combined.includes('genset') || combined.includes('kelistrikan')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Jaringan-Jaringan Listrik'));
    if (found) return found;
  }

  if (combined.includes('gaji pegawai')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Gaji Pegawai'));
    if (found) return found;
  }

  if (combined.includes('pelayanan medis') || combined.includes('dokter')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Pelayanan Medis Dokter'));
    if (found) return found;
  }

  if (combined.includes('kawat') || combined.includes('faksimili') || combined.includes('internet') || combined.includes('langganan')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Kawat/Faksimili'));
    if (found) return found;
  }

  if (combined.includes('tabung gas')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Tabung Gas'));
    if (found) return found;
  }

  if (combined.includes('tenaga kebersihan')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Tenaga Kebersihan'));
    if (found) return found;
  }

  if (combined.includes('tenaga keamanan')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Tenaga Keamanan'));
    if (found) return found;
  }

  if (combined.includes('tagihan air')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Tagihan Air'));
    if (found) return found;
  }

  if (combined.includes('tagihan listrik')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Tagihan Listrik'));
    if (found) return found;
  }

  if (combined.includes('pajak')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Pajak'));
    if (found) return found;
  }

  if (combined.includes('air limbah')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Air Limbah'));
    if (found) return found;
  }

  if (combined.includes('alat angkutan') || combined.includes('kendaraan')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Alat Angkutan'));
    if (found) return found;
  }

  if (combined.includes('alat bengkel')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Alat Bengkel'));
    if (found) return found;
  }

  if (combined.includes('pembangkit listrik')) {
    const found = MASTER_31_POS_BELANJA_2026.find(p => p.uraian.includes('Pembangkit Listrik'));
    if (found) return found;
  }

  // 3. Fallback to INITIAL_KODE_REKENING
  for (const kd of INITIAL_KODE_REKENING) {
    if (kd.uraian.toLowerCase() === uraian.toLowerCase() || kd.uraian.toLowerCase() === sub.toLowerCase()) {
      return {
        kodeRekening: kd.kodeRekening,
        uraian: kd.uraian
      };
    }
  }

  // 4. Default fallback to invoice uraian
  const label = uraian || sub || 'Belanja Lainnya TA 2026';
  return {
    kodeRekening: inv.kodeRekening || '-',
    uraian: label
  };
}

/**
 * Aggregates all 2026 invoices into summary pos belanja items according to their Jenis Pengadaan.
 */
export function aggregateRekapHutang2026(invoices: InvoiceHutang2026Record[]): PosBelanja2026Item[] {
  // Initialize map with all 31 master pos belanja
  const posMap = new Map<string, PosBelanja2026Item>();

  MASTER_31_POS_BELANJA_2026.forEach(master => {
    posMap.set(master.uraian, {
      id: `rekap-2026-master-${master.noUrut}`,
      noUrut: master.noUrut,
      kodeRekening: master.kodeRekening,
      kegiatan: master.uraian,
      totalTagihan: 0,
      koreksi: 0,
      jumlahBayar: 0,
      sisaHutang: 0,
      invoiceCount: 0,
      invoices: [],
      isHighlighted: Boolean(master.isHighlighted)
    });
  });

  // Aggregate all invoices into the map based on Jenis Pengadaan
  invoices.forEach(inv => {
    const matched = matchInvoice2026ToPosBelanja(inv);
    const key = matched.uraian;

    if (!posMap.has(key)) {
      posMap.set(key, {
        id: `rekap-2026-extra-${posMap.size + 1}`,
        noUrut: matched.noUrut || (posMap.size + 1),
        kodeRekening: matched.kodeRekening || inv.kodeRekening || '-',
        kegiatan: matched.uraian,
        totalTagihan: 0,
        koreksi: 0,
        jumlahBayar: 0,
        sisaHutang: 0,
        invoiceCount: 0,
        invoices: [],
        isHighlighted: Boolean(matched.isHighlighted)
      });
    }

    const item = posMap.get(key)!;
    const invJumlah = Number(inv.jumlahInvoice) || 0;
    const invKoreksi = Number(inv.koreksi) || 0;
    const invBayar = Number(inv.pembayaran) || 0;
    const invSisa = inv.sisaHutang !== undefined && inv.sisaHutang !== null 
      ? Number(inv.sisaHutang) 
      : Math.max(0, invJumlah + invKoreksi - invBayar);

    item.totalTagihan += invJumlah;
    item.koreksi += invKoreksi;
    item.jumlahBayar += invBayar;
    item.sisaHutang += invSisa;
    item.invoiceCount += 1;
    item.invoices.push(inv);
  });

  // Convert to array
  const results = Array.from(posMap.values());

  // Sort by noUrut ascending
  return results.sort((a, b) => (a.noUrut || 999) - (b.noUrut || 999));
}
