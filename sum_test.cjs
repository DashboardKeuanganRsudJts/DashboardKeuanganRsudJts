const fs = require('fs');

function parseNum(val) {
  if (!val) return 0;
  const str = String(val).trim();
  if (str === '-' || str === 'Rp-' || str.startsWith('Rp-') || str.includes('#REF!')) return 0;
  let clean = str.replace(/[^0-9,.-]/g, '');
  if (clean.includes('.') && clean.includes(',')) {
    const lastDot = clean.lastIndexOf('.');
    const lastComma = clean.lastIndexOf(',');
    if (lastComma > lastDot) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    clean = clean.replace(/,/g, '');
  } else if (clean.includes('.')) {
    clean = clean.replace(/\./g, '');
  }
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

function parseCSVLine(text) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

const chunks = [
  './src/data/rawInvoiceChunk1.ts',
  './src/data/rawInvoiceChunk2.ts',
  './src/data/rawInvoiceChunk3.ts',
  './src/data/rawInvoiceChunk4.ts'
];

let totalJumlah = 0;
let totalDibayar = 0;
let totalSPJ = 0;
let totalSisa = 0;
let totalSisa2 = 0;

for (const chunk of chunks) {
  if (!fs.existsSync(chunk)) continue;
  const content = fs.readFileSync(chunk, 'utf8');
  const strStart = content.indexOf("\`");
  const strEnd = content.lastIndexOf("\`");
  if (strStart !== -1 && strEnd !== -1) {
    const rawData = content.substring(strStart + 1, strEnd);
    const lines = rawData.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = parseCSVLine(line);
      if (cols.length < 20) continue;
      const no = parseInt(cols[0], 10);
      if (isNaN(no) || no === 0) continue;
      
      const jumlah = parseNum(cols[11]);
      const koreksi = parseNum(cols[12]);
      let spj = parseNum(cols[13]);
      if (spj === 0 && jumlah > 0) spj = jumlah + koreksi;
      const dibayar = parseNum(cols[14]);
      
      let sisa = parseNum(cols[16]);
      
      let calculatedSisa = spj - dibayar;

      totalJumlah += jumlah;
      totalDibayar += dibayar;
      totalSPJ += spj;
      totalSisa += sisa;
      totalSisa2 += calculatedSisa;
    }
  }
}

console.log('Total Jumlah:', totalJumlah);
console.log('Total SPJ:', totalSPJ);
console.log('Total Dibayar:', totalDibayar);
console.log('Total Sisa (Col 16):', totalSisa);
console.log('Total Sisa (SPJ - Dibayar):', totalSisa2);
console.log('Total Sisa (Jumlah - Dibayar):', totalJumlah - totalDibayar);

