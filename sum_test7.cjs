const fs = require('fs');

const content = fs.readFileSync('src/data/invoiceHutang2025Data.ts', 'utf8');

const start = content.indexOf(' = [');
const end = content.lastIndexOf(']');
const dataStr = content.substring(start + 3, end + 1);
const data = JSON.parse(dataStr);

let sum1 = 0;
let sum2 = 0;

for (const row of data) {
  if (row.lamaHariHutang > 0) {
     sum1 += row.sisaHutang;
  }
  if (row.lamaHariHutang <= 0) {
     sum2 += row.sisaHutang;
  }
}

console.log('Sisa for UMUR > 0:', sum1);
console.log('Sisa for UMUR <= 0:', sum2);

