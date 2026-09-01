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

let total16 = 0;
let total13 = 0;
let total14 = 0;

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
      
      total16 += parseNum(cols[16]);
      total13 += parseNum(cols[13]); // Nilai SPJ
      total14 += parseNum(cols[14]); // Dibayar
    }
  }
}

console.log('Total Col 16 (SISA):', total16);
console.log('Total Col 13 (NILAI SPJ):', total13);
console.log('Total Col 14 (DIBAYAR):', total14);

