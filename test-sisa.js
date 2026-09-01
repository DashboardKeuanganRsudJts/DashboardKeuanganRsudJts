const fs = require('fs');

function parseNum(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val || '').trim();
  if (str === '-' || str === 'Rp-' || str.startsWith('Rp-') || str.includes('#REF!')) return 0;
  let clean = str.replace(/[^0-9,.-]/g, '');
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(/,/g, '.');
  }
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

const content = fs.readFileSync('./src/data/rawInvoiceChunk1.ts', 'utf8');
const lines = content.split('\n');

let totalSisa = 0;
let validCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('[') || line.includes(']') || !line.trim()) continue;
  
  // Extracting from `...`
  const strStart = line.indexOf("`");
  const strEnd = line.lastIndexOf("`");
  if (strStart !== -1 && strEnd !== -1 && strStart !== strEnd) {
    const rawData = line.substring(strStart + 1, strEnd);
    const cols = rawData.split(';');
    
    // According to template, column 12 is JUMLAH, column 13 is KOREKSI, 14 is NILAI SPJ, 15 is DIBAYAR, 16 is SISA
    // Wait, indices:
    // 0: NO
    // 1: PERUSAHAAN / VENDOR
    // 11: JUMLAH
    // 12: KOREKSI
    // 13: NILAI SPJ
    // 14: DIBAYAR
    // 16: SISA
    
    if (cols.length > 16) {
      const sisaStr = cols[16];
      totalSisa += parseNum(sisaStr);
      validCount++;
    }
  }
}

console.log('Total Sisa Hutang: ', totalSisa, ' from ', validCount, ' records');
