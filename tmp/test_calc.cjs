const fs = require('fs');

function extractCsv(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const idx = content.indexOf('`');
  const lastIdx = content.lastIndexOf('`');
  return content.slice(idx + 1, lastIdx);
}

const csv1 = extractCsv('src/data/rawInvoiceChunk1.ts');
const csv2 = extractCsv('src/data/rawInvoiceChunk2.ts');
const csv3 = extractCsv('src/data/rawInvoiceChunk3.ts');
const csv4 = extractCsv('src/data/rawInvoiceChunk4.ts');

const allLines = (csv1 + '\n' + csv2 + '\n' + csv3 + '\n' + csv4)
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 0);

console.log('Total raw lines:', allLines.length);

let totalJumlah = 0;
let totalKoreksi = 0;
let totalBayar = 0;
let totalSisa = 0;

for (const line of allLines) {
  const parts = [];
  let curr = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuote = !inQuote;
    else if (ch === ',' && !inQuote) {
      parts.push(curr.trim());
      curr = '';
    } else {
      curr += ch;
    }
  }
  parts.push(curr.trim());

  const parseN = (val) => {
    if (!val) return 0;
    const clean = val.replace(/[^0-9.-]/g, '');
    return parseFloat(clean) || 0;
  };

  const no = parseInt(parts[0]);
  const jumlah = parseN(parts[11]);
  const koreksi = parseN(parts[12]);
  const bayar = parseN(parts[14]);
  const sisa = parseN(parts[16]);

  totalJumlah += jumlah;
  totalKoreksi += koreksi;
  totalBayar += bayar;
  totalSisa += sisa;
}

console.log('RAW CSV Total Jumlah:', totalJumlah);
console.log('RAW CSV Total Koreksi:', totalKoreksi);
console.log('RAW CSV Total Bayar:', totalBayar);
console.log('RAW CSV Total Sisa:', totalSisa);
