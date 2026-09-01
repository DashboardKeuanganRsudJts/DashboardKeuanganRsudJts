const fs = require('fs');

const c1 = fs.readFileSync('./src/data/rawInvoiceChunk1.ts', 'utf8');
const c2 = fs.readFileSync('./src/data/rawInvoiceChunk2.ts', 'utf8');
const c3 = fs.readFileSync('./src/data/rawInvoiceChunk3.ts', 'utf8');
const c4 = fs.readFileSync('./src/data/rawInvoiceChunk4.ts', 'utf8');

function extractCsv(content) {
  const match = content.match(/\`([\s\S]*?)\`/);
  return match ? match[1] : '';
}

const allText = [extractCsv(c1), extractCsv(c2), extractCsv(c3), extractCsv(c4)].join('\n');
const lines = allText.split('\n').map(l => l.trim()).filter(Boolean);

console.log('Total parsed lines in all chunks:', lines.length);

const rekananSet = new Set();
lines.forEach((l, idx) => {
  const parts = l.split(',');
  if (parts.length > 1 && parts[1].trim()) {
    rekananSet.add(parts[1].trim());
  }
});

console.log('Total unique rekanan/perusahaan count:', rekananSet.size);
console.log('List of all unique rekanan:', Array.from(rekananSet).sort());

if (rekananSet.size === 69 && lines.length === 471) {
  console.log('=== VERIFICATION PASSED: EXACTLY 471 ROWS AND 69 REKANAN ===');
} else {
  console.error('=== VERIFICATION FAILED: count is ' + rekananSet.size + ', lines: ' + lines.length + ' ===');
}
