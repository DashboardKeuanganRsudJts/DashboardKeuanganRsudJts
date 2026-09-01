const fs = require('fs');
const content = fs.readFileSync('src/data/invoiceHutang2025Data.ts', 'utf8');
const start = content.indexOf(' = [');
const end = content.lastIndexOf(']');
const dataStr = content.substring(start + 3, end + 1);
const data = JSON.parse(dataStr);

const TARGET = 4304354949;

// group by bulan
const byBulan = {};
data.forEach(r => {
  byBulan[r.bulanInvoice] = (byBulan[r.bulanInvoice] || 0) + r.sisaHutang;
});
console.log('By Bulan:', byBulan);

// group by bagian
const byBagian = {};
data.forEach(r => {
  byBagian[r.bagian] = (byBagian[r.bagian] || 0) + r.sisaHutang;
});
console.log('By Bagian:', byBagian);

