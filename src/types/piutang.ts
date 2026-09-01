export type JenisLayanan = 'Rawat Inap' | 'Rawat Jalan' | 'IGD' | 'Hemodialisa' | 'Kamar Operasi' | 'MCU';

export type KategoriPenjamin = 
  | 'BPJS Kesehatan - PBI'
  | 'BPJS Kesehatan - Non PBI'
  | 'Jamkesda / Karawang Sehat'
  | 'Asuransi Swasta'
  | 'Jasa Raharja (Laka Lantas)'
  | 'Kemitraan Perusahaan'
  | 'Pasien Umum / Jaminan';

export type StatusKlaim = 
  | 'Lunas / Cair'
  | 'Pengajuan Berkas'
  | 'Verifikasi Internal'
  | 'Dispute / Pending'
  | 'Klaim Ditolak'
  | 'Cicilan';

export type UmurPiutangCategory = 
  | '0-30 Hari (Lancar)'
  | '31-60 Hari (Kurang Lancar)'
  | '61-90 Hari (Diragukan)'
  | '>90 Hari (Macet / Kritis)';

export interface PiutangRecord {
  id: string;
  noInvoice?: string; // No Invoice / Surat Tagihan Resmi (e.g. INV-CORP-2026-0812)
  noBukti: string; // No Tagihan / Billing RSUD
  noSepKlaim: string; // No SEP BPJS atau No Klaim Asuransi
  noRm: string; // No Rekam Medis
  namaPasien: string;
  penjamin: KategoriPenjamin;
  namaDetailPenjamin?: string; // e.g., Mandiri Inhealth, Prudential, PT Pupuk Kujang
  jenisLayanan: JenisLayanan;
  tanggalPelayanan: string; // YYYY-MM-DD
  tanggalJatuhTempo: string; // YYYY-MM-DD
  nominalTagihan: number;
  nominalDibayar: number;
  sisaPiutang: number;
  statusKlaim: StatusKlaim;
  dpjp: string; // Dokter Penanggung Jawab Pelayanan
  keteranganDispute?: string;
  tanggalUpdateTerakhir: string;
  hariUmur: number;
  kategoriUmur: UmurPiutangCategory;
  ruangan?: string;
  documentUrl?: string; // base64 or URL for uploaded document
  createdBy?: string;
}

export interface HutangItem {
  id: string;
  namaPerusahaan: string;
  tahun: string;
  jenisSumber: 'BLUD' | 'APBD';
  noPoSpk: string;
  tanggalInvoice: string;
  totalTagihan: number;
  umurHutangHari: number;
  kodeRekening: string;
  kegiatan: string;
  createdBy?: string;
  bulan: string;
  jumlahBayar: number;
  sisaHutang: number;
  status: 'Belum Lunas' | 'Lunas' | 'Dalam Proses Verifikasi';
  noBukuKas?: string;
  noUrut?: number;
  koreksi?: number;
  isHighlighted?: boolean;
}

export interface ListrikKantinRecord {
  id: string;
  noInvoice: string; // e.g. INV-ELC-KNT-2608-01
  namaPenyewa: string; // e.g. Stand Kantin 01 (Ibu Eni - Nasi Rames)
  lokasiStand: string; // e.g. Stand Kantin Barat #01
  bulanTagihan: string; // e.g. Agustus 2026
  meterAwal: number; // Stand kWh Awal
  meterAkhir: number; // Stand kWh Akhir
  totalKwh: number; // kWh Terpakai
  tarifPerKwh: number; // Rp 1.500 / kWh
  biayaBeban: number; // Biaya Beban / Abonemen (Rp 25.000)
  totalTagihan: number;
  nominalDibayar: number;
  sisaPiutang: number;
  tanggalInvoice: string; // YYYY-MM-DD
  tanggalJatuhTempo: string; // YYYY-MM-DD
  statusPembayaran: 'Lunas' | 'Belum Lunas' | 'Menunggak' | 'Cicilan';
  hariUmur: number;
  kategoriUmur: UmurPiutangCategory;
  catatan?: string;
  tanggalBayar?: string;
  noKuitansi?: string;
}

export interface SyncStatusInfo {
  isConfigured: boolean;
  isConnected: boolean;
  spreadsheetId: string;
  spreadsheetName: string;
  sheetName: string;
  lastSyncedAt: string | null;
  autoSyncDaily: boolean;
  syncIntervalMinutes: number;
  isSyncing: boolean;
  error: string | null;
  totalRowsSynced: number;
}

export interface AgingSummary {
  kategori: UmurPiutangCategory;
  jumlahPasien: number;
  totalNominal: number;
  persentase: number;
  warna: string;
}

export interface PenjaminSummary {
  penjamin: KategoriPenjamin;
  jumlahKasus: number;
  totalTagihan: number;
  totalDibayar: number;
  sisaPiutang: number;
  recoveryRate: number;
}

export interface DisputeRecord {
  id: string;
  noSepKlaim: string;
  namaPasien: string;
  penjamin: string;
  nominal: number;
  alasanDispute: string;
  rekomendasiTindakan: string;
  hariTertahan: number;
}
