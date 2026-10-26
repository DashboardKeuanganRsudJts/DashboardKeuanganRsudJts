/**
 * RSUD Jatisari - Klasifikasi Jenis Pengadaan Rekap Hutang:
 * 1. PENGADAAN BARANG & JASA (BARJAS): Pengadaan obat, APD, BMHP, suku cadang, ATK, modal, pemeliharaan, IT & konsultansi
 * 2. OPERASIONAL: Beban operasional rutin (utilitas air, listrik, internet, pajak, limbah, outsourcing keamanan/kebersihan, gaji, jaspel)
 */

export type JenisPengadaanCategory = 'SEMUA' | 'BARANG_JASA' | 'OPERASIONAL';

export const OPERASIONAL_POS_NO_URUT = [18, 20, 32, 33, 42, 43, 44, 46, 47, 80, 81];

export function getPosBelanjaCategory(item: { noUrut?: number | string; kegiatan?: string; uraian?: string }): 'BARANG_JASA' | 'OPERASIONAL' {
  if (item.noUrut !== undefined && item.noUrut !== null) {
    const no = Number(item.noUrut);
    if (OPERASIONAL_POS_NO_URUT.includes(no)) {
      return 'OPERASIONAL';
    }
  }

  const text = (item.kegiatan || item.uraian || '').toLowerCase();
  if (
    text.includes('tagihan air') ||
    text.includes('tagihan listrik') ||
    text.includes('kawat/faksimili') ||
    text.includes('internet') ||
    text.includes('tv berlangganan') ||
    text.includes('pajak, bea') ||
    text.includes('air limbah') ||
    text.includes('tenaga kebersihan') ||
    text.includes('tenaga keamanan') ||
    text.includes('gaji pegawai') ||
    text.includes('pelayanan medis dokter') ||
    text.includes('makanan dan minuman') ||
    (text.includes('kebersihan') && text.includes('pembersih'))
  ) {
    return 'OPERASIONAL';
  }

  return 'BARANG_JASA';
}

export function getCategoryBadge(category: 'BARANG_JASA' | 'OPERASIONAL') {
  if (category === 'BARANG_JASA') {
    return {
      label: 'Barang & Jasa',
      fullLabel: 'PENGADAAN BARANG & JASA (BARJAS)',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      headerBg: 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60',
      subtotalBg: 'bg-emerald-50/60 dark:bg-emerald-950/30'
    };
  }
  return {
    label: 'Operasional',
    fullLabel: 'BELANJA OPERASIONAL',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    headerBg: 'bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800/60',
    subtotalBg: 'bg-amber-50/60 dark:bg-amber-950/30'
  };
}
