const fs = require('fs');

const content = fs.readFileSync('src/data/invoiceHutang2025Data.ts', 'utf8');

const start = content.indexOf(' = [');
const end = content.lastIndexOf(']');
const dataStr = content.substring(start + 3, end + 1);
const data = JSON.parse(dataStr);

let sisaAll = 0;
let sisaNotPaid = 0;

for (const row of data) {
  sisaAll += row.sisaHutang;
  if (!row.sudahMasukBukuKas) {
    sisaNotPaid += row.sisaHutang;
  }
}

console.log(sisaAll, sisaNotPaid);
