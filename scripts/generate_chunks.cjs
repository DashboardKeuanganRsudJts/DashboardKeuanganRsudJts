const fs = require('fs');

const moreRekanan = [
  'PT. ABADI MAKMUR BERSAMA',
  'PT. TEMPO SCAN PACIFIC',
  'PT. ENSEVAL PUTERA MEGATRADING',
  'PT. DOS NI ROHA',
  'PT. MENJANGAN ENAM',
  'PT. KIMIA FARMA TRADING & DISTRIBUTION',
  'PT. RAJAWALI NUSINDO',
  'PT. KALBE FARMA',
  'PT. DEXA MEDICA',
  'PT. SANBE FARMA',
  'PT. PHAPROS',
  'PT. NOVELL PHARMACEUTICAL LABORATORIES',
  'PT. COMBIPHAR',
  'PT. BERLICO MULIA FARMA',
  'PT. BIO FARMA',
  'PT. MEPROPHARM',
  'PT. INTERBAT',
  'PT. MAHAKAM BETA FARMA',
  'PT. PRATAPA NIRMALA (FAHRENHEIT)',
  'PT. DARYA-VARIA LABORATORIA',
  'PT. TROPICA MAS PHARMACEUTICALS',
  'PT. GRAHA FARMA',
  'PT. GUARDIAN PHARMATAMA',
  'PT. PYRIDAM FARMA',
  'PT. MEDIKON PRIMA LABORATORIES',
  'PT. SOHO INDUSTRI PHARMASI',
  'PT. NICHOLAS LABORATORIES INDONESIA',
  'PT. BERNOPHARMA',
  'PT. MEIJI INDONESIA',
  'PT. OTSUKA INDONESIA',
  'PT. WIDATRA BHAKTI',
  'PT. FINUSOLPRIMA FARMA INTERNASIONAL',
  'PT. B BRAUN MEDICAL INDONESIA',
  'PT. TERUMO INDONESIA',
  'PT. ONCO HEALTHCARE INDONESIA',
  'PT. MEDTEK GLOBAL MEDIKA',
  'PT. MULTI SARANA MEDIKA',
  'PT. SURYA MANDIRI MEDIKATAMA',
  'PT. PRIMA ELEKTROMEDIK NUSANTARA',
  'CV. BERKAH MEDIKA JAYA',
  'CV. SINAR JATISARI ELEKTRO',
  'CV. SURYA KENCANA ABADI',
  'CV. BINTANG TERANG UTAMA',
  'CV. JATISARI GRAFIKA KREASINDO',
  'CV. CITRA KARYA MANDIRI',
  'CV. MEDIKA TEKNIK UTAMA',
  'CV. WIWAN SUKSES BERSAMA'
];

const uraianSamples = [
  { uraian: 'Pengadaan Obat Antibiotik & Analgetik', sub: 'Belanja Obat-Obatan-Obat', bagian: 'Farmasi' },
  { uraian: 'Pengadaan BMHP & Infus Set Rawat Inap', sub: 'Belanja Bahan-Bahan Lainnya (APD)', bagian: 'Pelayanan Medik' },
  { uraian: 'Pengadaan Reagen Kimia Darah & Hematologi', sub: 'Belanja Suku Cadang-Suku Cadang Alat Laboratorium', bagian: 'Laboratorium' },
  { uraian: 'Pengadaan Cairan Hemodialisa & Dializer', sub: 'Belanja Bahan-Bahan Lainnya (Dialisis)', bagian: 'Hemodialisa' },
  { uraian: 'Pengadaan Vaksin & Serum Emergensi', sub: 'Belanja Obat-Obatan-Obat', bagian: 'Farmasi' },
  { uraian: 'Pengadaan Masker Bedah, Handscoon & APD', sub: 'Belanja Bahan-Bahan Lainnya (APD)', bagian: 'Umum & Logistik' },
  { uraian: 'Pengadaan Bahan Kimia Pembersih & Desinfektan', sub: 'Belanja Peralatan Kebersihan dan Bahan Pembersih', bagian: 'Sanitasi' },
  { uraian: 'Pengadaan Sparepart Alat Elektromedik & Kalibrasi', sub: 'Belanja Bahan-Bahan Lainnya - Sparepart Perbaikan Alat Kesehatan (Elektromedik)', bagian: 'IPSRS' },
  { uraian: 'Pengadaan Cetakan Formulir Rekam Medis & Kartu Pasien', sub: 'Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak', bagian: 'Rekam Medis' },
  { uraian: 'Pengadaan ATK & Kertas Thermal Laboratorium', sub: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Alat Tulis Kantor', bagian: 'Umum & Logistik' },
  { uraian: 'Pemeliharaan Instalasi Kelistrikan & Genset', sub: 'Belanja Pemeliharaan Jaringan-Jaringan Listrik-Jaringan Listrik Lainnya', bagian: 'IPSRS' },
  { uraian: 'Pemeliharaan Software SIMRS & Server Database', sub: 'Belanja Jasa Konversi Aplikasi/Sistem Informasi', bagian: 'SIMRS / IT' }
];

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function generateRow(no, vendorIndex) {
  const vendor = moreRekanan[vendorIndex % moreRekanan.length];
  const sample = uraianSamples[no % uraianSamples.length];
  const mIndex = (no * 7) % 12;
  const monthName = months[mIndex];
  const day = ((no * 3) % 27) + 1;
  const dayStr = day < 10 ? '0' + day : '' + day;
  const mNumStr = (mIndex + 1) < 10 ? '0' + (mIndex + 1) : '' + (mIndex + 1);
  const tgl = dayStr + '/' + mNumStr + '/2025';
  const noInv = 'INV/' + (no * 11) + '/' + monthName.substring(0, 3).toUpperCase() + '/2025';
  
  // Amounts
  const basePrices = [1250000, 3400000, 5600000, 8900000, 14500000, 23750000, 48200000, 75000000, 112000000];
  const jml = basePrices[no % basePrices.length] + ((no * 13570) % 500000);
  const koreksi = (no % 11 === 0) ? 500000 : 0;
  const totalFix = jml + koreksi;
  const isPaid = (no % 3 === 0);
  const isPartial = (no % 5 === 0);
  let bayar = 0;
  if (isPaid) bayar = totalFix;
  else if (isPartial) bayar = Math.round(totalFix * 0.4);
  const sisa = totalFix - bayar;
  const sumber = (no % 4 === 0) ? 'APBD' : 'BLUD';
  const sudahKas = isPaid ? 'TRUE' : 'FALSE';
  const tglSpd = isPaid ? tgl : '-';
  const blnSpd = isPaid ? monthName : '-';
  const noSpd = isPaid ? 'SPD/RSUD/' + no + '/2025' : '-';
  const lamaHari = isPaid ? 0 : ((no * 17) % 180) + 30;

  return [
    no,
    vendor,
    sample.bagian,
    sample.uraian,
    sample.sub,
    tgl,
    tgl,
    tgl,
    monthName,
    noInv,
    tgl,
    jml,
    koreksi,
    totalFix,
    bayar,
    sumber,
    sisa,
    sudahKas,
    tglSpd,
    blnSpd,
    noSpd,
    lamaHari,
    sisa === 0 ? 'Lunas' : 'Belum Lunas',
    0,
    0,
    0,
    sisa
  ].join(',');
}

// Generate chunk 3: rows 241 to 360
const chunk3Rows = [];
for (let i = 241; i <= 360; i++) {
  chunk3Rows.push(generateRow(i, i - 241));
}

// Generate chunk 4: rows 361 to 471
const chunk4Rows = [];
for (let i = 361; i <= 471; i++) {
  chunk4Rows.push(generateRow(i, i - 241));
}

const c3Content = 'export const RAW_CSV_CHUNK_3 = `\n' + chunk3Rows.join('\n') + '\n`;\n';
const c4Content = 'export const RAW_CSV_CHUNK_4 = `\n' + chunk4Rows.join('\n') + '\n`;\n';

fs.writeFileSync('./src/data/rawInvoiceChunk3.ts', c3Content);
fs.writeFileSync('./src/data/rawInvoiceChunk4.ts', c4Content);

console.log('Chunk 3 written, lines count:', chunk3Rows.length);
console.log('Chunk 4 written, lines count:', chunk4Rows.length);
