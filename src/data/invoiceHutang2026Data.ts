import { InvoiceHutang2026Record } from '../types/invoiceHutang';
import { INITIAL_INVOICE_HUTANG_2025 } from './invoiceHutang2025Data';

// Initial data for TA 2026 initialized with proper 2026 defaults
export const INITIAL_INVOICE_HUTANG_2026: InvoiceHutang2026Record[] = INITIAL_INVOICE_HUTANG_2025.map((item, idx) => {
  // Convert 2025 references to 2026
  const updateYear = (str?: string) => {
    if (!str) return '';
    return str.replace(/2025/g, '2026').replace(/\/25\b/g, '/26');
  };

  return {
    ...item,
    id: `inv-2026-${idx + 1}`,
    no: idx + 1,
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
