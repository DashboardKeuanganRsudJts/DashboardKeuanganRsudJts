const fs = require('fs');

const chunks = [
  './src/data/rawInvoiceChunk1.ts',
  './src/data/rawInvoiceChunk2.ts',
  './src/data/rawInvoiceChunk3.ts',
  './src/data/rawInvoiceChunk4.ts'
];

let totalSisa = 0;

for (let chunk of chunks) {
  const content = fs.readFileSync(chunk, 'utf8');
  // It's enclosed in backticks
  const strStart = content.indexOf("`");
  const strEnd = content.lastIndexOf("`");
  if (strStart !== -1 && strEnd !== -1) {
    const rawData = content.substring(strStart + 1, strEnd);
    const lines = rawData.split('\n');
    for (let line of lines) {
      if (!line.trim()) continue;
      const cols = line.split(','); // Wait, is it comma separated?
      // Ah, wait! The CSV I saved in rawInvoiceChunk1.ts is actually COMMA separated!
      // In the `head` output it says: `1,PT. RANAH MULTI SEMESTA,...`
      // But my `parse_user_csv.cjs` used `line.split(';')`!
      // Let's verify the delimiter.
    }
  }
}
