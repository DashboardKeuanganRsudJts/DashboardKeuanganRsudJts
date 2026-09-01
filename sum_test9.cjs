const fs = require('fs');
const content = fs.readFileSync('src/data/invoiceHutang2025Data.ts', 'utf8');
const start = content.indexOf(' = [');
const end = content.lastIndexOf(']');
const dataStr = content.substring(start + 3, end + 1);
const data = JSON.parse(dataStr);

// Find rows where sisaHutang is very large
const large = data.filter(d => d.sisaHutang > 100000000);
console.log('Large rows:', large.map(d => ({ no: d.no, rekanan: d.rekanan, sisa: d.sisaHutang })));

