const fs = require('fs');

function parseNum(val) {
  if (val == null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
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

function parseBool(val) {
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YA' || s === 'SUDAH' || s === 'YES' || s === 'LUNAS' || s === 'A';
}

const csvData = fs.readFileSync('user_data.csv', 'utf8');
const lines = csvData.split('\n');

const records = [];
let idCounter = 1;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const cols = line.split(';');
  
  if (cols.length < 20) continue;
  
  const no = parseInt(cols[0], 10);
  if (isNaN(no) || no === 0) continue; // Skip empty rows

  const rekanan = cols[1]?.trim() || '';
  const uraian = cols[3]?.trim() || '';
  if (!rekanan && !uraian) continue;

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
  
  const sisaHutang = parseNum(cols[16]) || (totalInvoiceFix - pembayaran);
  const sudahMasukBukuKas = parseBool(cols[17]);
  const tglSpdBukuKas = cols[18]?.trim() || '';
  const bulanSpd = cols[19]?.trim() || '';
  const noSpdBukuKas = cols[20]?.trim() || '';
  const lamaHariHutang = parseNum(cols[21]);
  const keterangan = (sisaHutang <= 0 ? 'Lunas' : 'Belum Lunas');

  records.push({
    id: `inv-${idCounter++}`,
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
}

const fileContent = `import { InvoiceHutang2025Record } from '../types/invoiceHutang';

export const INITIAL_INVOICE_HUTANG_2025: InvoiceHutang2025Record[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync('src/data/invoiceHutang2025Data.ts', fileContent);

let total = 0;
for (const r of records) total += r.sisaHutang;
console.log(`Generated ${records.length} records. Total Sisa Hutang: Rp ${total}`);

