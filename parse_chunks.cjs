const fs = require('fs');

function parseNum(val) {
  if (val == null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (str === '-' || str === 'Rp-' || str.startsWith('Rp-') || str.includes('#REF!')) return 0;
  
  // Indonesian format often uses dots for thousands (1.000.000) and commas for decimals (1,5)
  // US format uses commas for thousands (1,000,000) and dots for decimals (1.5)
  // Let's look at the actual string to decide:
  let clean = str.replace(/[^0-9,.-]/g, '');
  
  // If it has both dots and commas:
  if (clean.includes('.') && clean.includes(',')) {
    // Determine which one is the decimal separator (the one that appears last and only once)
    const lastDot = clean.lastIndexOf('.');
    const lastComma = clean.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Comma is decimal: 1.000.000,50
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal: 1,000,000.50
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    // Only commas. Are they thousands or decimals?
    // In Indonesian Excel exports, if it's an integer like 1,000,000 it might just have commas. Wait.
    // In the raw chunk: " Rp 45,186,093 "
    // This is clearly US-style thousands separators! Let's remove commas if they are thousands.
    // If a comma has 3 digits after it, it's likely a thousands separator, unless it's just 1 comma at the end...
    // Safest bet for "45,186,093": remove all commas.
    clean = clean.replace(/,/g, '');
  } else if (clean.includes('.')) {
    // Only dots. Indonesian thousands: 4.304.354.949
    // Wait, is it decimals or thousands?
    // Let's remove all dots.
    clean = clean.replace(/\./g, '');
  }
  
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

function parseBool(val) {
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YA' || s === 'SUDAH' || s === 'YES' || s === 'LUNAS' || s === 'A';
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

const records = [];
let totalSisa = 0;

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
      
      const rekanan = cols[1]?.trim() || '';
      const uraian = cols[3]?.trim() || '';
      const bagian = cols[2]?.trim() || '';
      const subBelanja = cols[4]?.trim() || '';
      const tglTandaTerima = cols[5]?.trim() || '';
      const tglSpbSpk = cols[6]?.trim() || '';
      const tglInvoice = cols[7]?.trim() || '';
      const bulanInvoice = cols[8]?.trim() || '';
      const noInvoice = cols[9]?.trim() || `INV/${no}/2025`;
      const jatuhTempo = cols[10]?.trim() || '';
      
      const jumlahInvoice = parseNum(cols[11]);
      const koreksi = parseNum(cols[12]);
      const totalInvoiceFix = parseNum(cols[13]) || (jumlahInvoice + koreksi);
      const pembayaran = parseNum(cols[14]);
      const sumberAnggaran = cols[15]?.trim() || 'BLUD';
      
      const sisaColText = cols[16]?.trim();
      let sisaHutang = parseNum(sisaColText);
      
      if (sisaColText === 'Rp -' || sisaColText === 'Rp -   ' || sisaColText === '-' || sisaColText === '0') {
        sisaHutang = 0;
      } else if (sisaColText === '' || sisaColText === undefined) {
         sisaHutang = 0;
      }

      const sudahMasukBukuKas = parseBool(cols[17]);
      const tglSpdBukuKas = cols[18]?.trim() || '';
      const bulanSpd = cols[19]?.trim() || '';
      const noSpdBukuKas = cols[20]?.trim() || '';
      const lamaHariHutang = parseNum(cols[21]);
      const keterangan = (sisaHutang <= 0 ? 'Lunas' : 'Belum Lunas');

      records.push({
        id: `inv-new-${no}`,
        no,
        rekanan,
        bagian,
        uraian,
        subBelanja,
        tglTandaTerima,
        tglSpbSpk,
        tglInvoice,
        bulanInvoice,
        noInvoice,
        jatuhTempo,
        jumlahInvoice,
        koreksi,
        totalInvoiceFix,
        pembayaran,
        sumberAnggaran,
        sisaHutang,
        sudahMasukBukuKas,
        tglSpdBukuKas,
        bulanSpd,
        noSpdBukuKas,
        lamaHariHutang,
        keterangan,
        koreksiPlusMinus: 0,
        koreksiMinusBlud: 0,
        koreksiMinusApbd: 0,
        sisaHutangRiil: sisaHutang
      });
      totalSisa += sisaHutang;
    }
  }
}

const fileContent = `import { InvoiceHutang2025Record } from '../types/invoiceHutang';

export const INITIAL_INVOICE_HUTANG_2025: InvoiceHutang2025Record[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync('src/data/invoiceHutang2025Data.ts', fileContent);

console.log(`Generated ${records.length} records. Total Sisa Hutang: Rp ${totalSisa}`);

