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
  
  const strStart = line.indexOf("`");
  const strEnd = line.lastIndexOf("`");
  if (strStart !== -1 && strEnd !== -1 && strStart !== strEnd) {
    const rawData = line.substring(strStart + 1, strEnd);
    const cols = rawData.split(';');
    
    // Column 11: JUMLAH, 12: KOREKSI, 13: NILAI SPJ, 14: DIBAYAR, 16: SISA
    if (cols.length > 16) {
      // In the frontend code, we do: totalFix = (jumlah + koreksi), sisa = totalFix - pembayaran
      // But maybe we should parse directly from SISA column (index 16) or calculate it.
      const sisaCol = cols[16];
      let sisa = parseNum(sisaCol);
      
      const jumlah = parseNum(cols[11]);
      const koreksi = parseNum(cols[12]);
      const spj = parseNum(cols[13]) || (jumlah + koreksi);
      const dibayar = parseNum(cols[14]);
      const calculatedSisa = spj - dibayar;
      
      // We will sum the calculatedSisa
      totalSisa += calculatedSisa;
      validCount++;
    }
  }
}

console.log('Total Sisa Hutang: ', totalSisa, ' from ', validCount, ' records');
