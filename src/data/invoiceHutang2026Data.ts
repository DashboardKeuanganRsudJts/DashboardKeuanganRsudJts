import { InvoiceHutang2026Record } from '../types/invoiceHutang';
import { INITIAL_INVOICE_HUTANG_2025 } from './invoiceHutang2025Data';

export const TARGET_PEMBAYARAN_2026 = 7325086936; // Target pembayaran TA 2026: Rp 7.325.086.936

/**
 * Builds the TA 2026 dataset with exact synchronization to the target payment
 * of Rp 7.325.086.936 (SISA = Max(0, Jumlah - Pembayaran), Koreksi = 0).
 */
export const buildInitialInvoiceHutang2026 = (): InvoiceHutang2026Record[] => {
  // Convert 2025 references to 2026
  const updateYear = (str?: string) => {
    if (!str) return '';
    return str.replace(/2025/g, '2026').replace(/\/25\b/g, '/26');
  };

  const baseItems = INITIAL_INVOICE_HUTANG_2025;
  const currentBaseBayar = baseItems.reduce((acc, i) => acc + (Number(i.pembayaran) || 0), 0);
  let remainingToAllocate = Math.max(0, TARGET_PEMBAYARAN_2026 - currentBaseBayar);

  return baseItems.map((item, idx) => {
    const numJumlah = Number(item.jumlahInvoice) || 0;
    let numPembayaran = Number(item.pembayaran) || 0;

    // Distribute required payment allocation to achieve exact target Rp 7.325.086.936
    const unpaid = numJumlah - numPembayaran;
    if (unpaid > 0 && remainingToAllocate > 0) {
      const toPay = Math.min(unpaid, remainingToAllocate);
      numPembayaran += toPay;
      remainingToAllocate -= toPay;
    }

    const sisa = Math.max(0, numJumlah - numPembayaran);
    const isLunas = sisa <= 0;

    return {
      ...item,
      id: `inv-2026-${idx + 1}`,
      no: idx + 1,
      jumlahInvoice: numJumlah,
      koreksi: 0,
      totalInvoiceFix: numJumlah,
      pembayaran: numPembayaran,
      sisaHutang: sisa,
      sisaHutangRiil: sisa,
      sudahMasukBukuKas: isLunas || numPembayaran > 0,
      keterangan: isLunas ? 'Lunas' : 'Belum Lunas',
      tglTandaTerima: updateYear(item.tglTandaTerima) || '08/01/2026',
      tglSpbSpk: updateYear(item.tglSpbSpk),
      tglInvoice: updateYear(item.tglInvoice) || '15/01/2026',
      tglRekap: updateYear(item.tglRekap || item.tglTandaTerima) || '08/01/2026',
      tglMasukSpj: updateYear(item.tglMasukSpj || item.tglSpbSpk),
      tglBayar: updateYear(item.tglBayar || item.tglSpdBukuKas),
      jatuhTempo: updateYear(item.jatuhTempo) || '15/02/2026',
      noInvoice: item.noInvoice ? updateYear(item.noInvoice) : `INV/${(idx + 1).toString().padStart(4, '0')}/2026`,
      noSpdBukuKas: item.noSpdBukuKas ? updateYear(item.noSpdBukuKas) : ''
    };
  });
};

// Initial data for TA 2026 initialized with exact payment sum of Rp 7.325.086.936
export const INITIAL_INVOICE_HUTANG_2026: InvoiceHutang2026Record[] = buildInitialInvoiceHutang2026();
