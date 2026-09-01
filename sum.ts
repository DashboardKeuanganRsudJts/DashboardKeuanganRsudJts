import { INITIAL_INVOICE_HUTANG_2025 } from './src/data/invoiceHutang2025Data.ts';

let totalSisa = 0;
INITIAL_INVOICE_HUTANG_2025.forEach(i => {
  totalSisa += i.sisaHutang;
});
console.log('Total Sisa:', totalSisa);
