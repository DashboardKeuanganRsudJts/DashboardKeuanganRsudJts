const { INITIAL_INVOICE_HUTANG_2025 } = require('./dist/server.cjs').INITIAL_INVOICE_HUTANG_2025 || {};
// wait I can't require TS. Let's use fs to count occurrences of 'id: "inv-new-' in src/data/invoiceHutang2025Data.ts
const fs = require('fs');
const content = fs.readFileSync('src/data/invoiceHutang2025Data.ts', 'utf8');
const ids = content.match(/id: "inv-new-(\d+)"/g);
console.log('Total records:', ids ? ids.length : 0);
