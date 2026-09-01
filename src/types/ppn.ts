export interface CoretaxPPNRecord {
  id: string;
  npwpPenjual?: string;
  namaPenjual?: string;
  nomorFaktur: string;
  tanggalFaktur: string;
  masaPajak?: number;
  tahun?: number;
  statusFaktur?: string;
  hargaJual?: number;
  dpp: number;
  ppn: number;
  nilaiInvoice?: number;
  nilaiInvoiceCoretax?: number;
  perekam?: string;
  nomorInvoice?: string;
  keterangan?: string;

  // Aliases for compatibility
  namaVendor?: string;
  npwpVendor?: string;
  periodeBulan?: number;
}

export interface DataHutangRecord {
  id: string;
  nomorInvoice: string;
  tanggalInvoice: string;
  vendor: string;
  nilaiInvoice: number;
  statusPembayaran: 'SUDAH DIBAYAR' | 'BELUM DIBAYAR' | 'DIBAYAR SEBAGIAN' | 'PROSES SP2D';
  tanggalPembayaran?: string;
  nomorSP2D?: string;
  jenisHutang?: string;
  keterangan?: string;
}

export type MatchingStatusType =
  | 'SUDAH_DIBAYAR'
  | 'BELUM_DIBAYAR'
  | 'TIDAK_DITEMUKAN_DI_HUTANG'
  | 'INVOICE_KOSONG'
  | 'HUTANG_TANPA_FAKTUR';

export type DiscrepancyItem = LinkedMonitoringItem;


export interface LinkedMonitoringItem {
  id: string;
  periodeBulan: number;
  nomorFaktur: string;
  tanggalFaktur: string;
  namaVendorCoretax: string;
  npwpVendor?: string;
  dpp: number;
  ppn: number;
  hargaJual?: number;
  nilaiInvoiceCoretax?: number;
  perekam?: string;
  statusFaktur?: string;

  nomorInvoice: string;

  hutangId?: string;
  namaVendorHutang?: string;
  nilaiInvoice: number;
  statusPembayaranHutang?: string;
  nomorSP2D?: string;
  tanggalPembayaran?: string;
  jenisHutang?: string;
  notes?: string;

  status: MatchingStatusType;
  statusLabel: string;
  statusBadgeColor: string;
}

export interface MonthlySummary {
  bulan: number;
  namaBulan: string;
  jumlahFaktur: number;
  totalDPP: number;
  totalPPN: number;
  sudahDibayarCount: number;
  sudahDibayarPPN: number;
  belumDibayarCount: number;
  belumDibayarPPN: number;
  tidakDitemukanCount: number;
  tidakDitemukanPPN: number;
  persentaseSelesai: number;
}

export interface OverallStats {
  totalFaktur: number;
  totalDPP: number;
  totalPPN: number;
  sudahDibayarCount: number;
  sudahDibayarPPN: number;
  belumDibayarCount: number;
  belumDibayarPPN: number;
  tidakDitemukanCount: number;
  tidakDitemukanPPN: number;
  hutangTanpaFakturCount: number;
}
