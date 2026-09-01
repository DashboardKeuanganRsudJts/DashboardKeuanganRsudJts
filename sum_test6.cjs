const fs = require('fs');

const content = fs.readFileSync('src/data/invoiceHutang2025Data.ts', 'utf8');

const start = content.indexOf(' = [');
const end = content.lastIndexOf(']');
const dataStr = content.substring(start + 3, end + 1);
const data = JSON.parse(dataStr);

let sisa1 = 0;
let sisa2 = 0;
let sisa3 = 0;
let sisa4 = 0;
let sisa5 = 0;

for (const row of data) {
  if (!row.sudahMasukBukuKas) {
    sisa1 += row.sisaHutang;
    sisa2 += (row.totalInvoiceFix - row.pembayaran);
  } else {
    sisa4 += row.sisaHutang;
  }
  
  if (row.sisaHutang > 0) {
     sisa3 += row.sisaHutang;
  }
  
  sisa5 += row.sisaHutang;
}

console.log('Sisa for A=FALSE:', sisa1);
console.log('Sisa (SPJ - Dibayar) for A=FALSE:', sisa2);
console.log('Sisa for A=TRUE:', sisa4);
console.log('Total Sisa:', sisa5);
