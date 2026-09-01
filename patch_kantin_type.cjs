const fs = require('fs');
let code = fs.readFileSync('src/data/spreadsheetData2026.ts', 'utf8');
code = code.replace(
  "  status: 'Lunas' | 'Lewat Tempo' | 'Belum Ada Tagihan';\n  keterangan: string;",
  "  status: 'Lunas' | 'Lewat Tempo' | 'Belum Ada Tagihan';\n  keterangan: string;\n  createdBy?: string;"
);
fs.writeFileSync('src/data/spreadsheetData2026.ts', code);
