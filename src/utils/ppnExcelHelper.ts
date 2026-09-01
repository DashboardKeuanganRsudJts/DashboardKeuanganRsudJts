import * as XLSX from 'xlsx';
import { CoretaxPPNRecord, DataHutangRecord, LinkedMonitoringItem, MonthlySummary } from '../types/ppn';

export function exportMonitoringToExcel(
  items: LinkedMonitoringItem[],
  summaries: MonthlySummary[]
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Master Rekonsiliasi PPN & Hutang 2026
  const dataRows = items.map((it, idx) => ({
    'No': idx + 1,
    'Masa Pajak': it.periodeBulan,
    'Nomor Faktur (Coretax)': it.nomorFaktur,
    'Tanggal Faktur': it.tanggalFaktur,
    'NPWP Penjual': it.npwpVendor || '-',
    'Nama Penjual / Vendor': it.namaVendorCoretax,
    'DPP (Rp)': it.dpp,
    'PPN (Rp)': it.ppn,
    'Nomor Invoice (Penghubung)': it.nomorInvoice || '-',
    'Status Pembayaran Hutang': it.statusLabel,
    'Nomor SP2D': it.nomorSP2D || '-',
    'Tanggal Bayar SP2D': it.tanggalPembayaran || '-',
    'Nilai Tagihan Hutang (Rp)': it.nilaiInvoice || 0,
    'Keterangan': it.notes || '-'
  }));

  const ws1 = XLSX.utils.json_to_sheet(dataRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Rekonsiliasi PPN 2026');

  // Sheet 2: Rekap Bulanan 12 Masa Pajak
  const summaryRows = summaries.map((s) => ({
    'Bulan': s.namaBulan,
    'Jumlah Faktur': s.jumlahFaktur,
    'Total DPP (Rp)': s.totalDPP,
    'Total PPN Coretax (Rp)': s.totalPPN,
    'Faktur Sudah Dibayar': s.sudahDibayarCount,
    'PPN Sudah Dibayar (Rp)': s.sudahDibayarPPN,
    'Faktur Belum Dibayar': s.belumDibayarCount,
    'PPN Belum Dibayar (Rp)': s.belumDibayarPPN,
    'Faktur Tidak Ada di Hutang': s.tidakDitemukanCount,
    'PPN Tidak Ada di Hutang (Rp)': s.tidakDitemukanPPN,
    '% Realisasi': `${s.persentaseSelesai}%`
  }));

  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Rekap Bulanan');

  XLSX.writeFile(wb, `Laporan_Monitoring_PPN_RSUD_Jatisari_2026.xlsx`);
}

export function downloadCoretaxTemplate() {
  const wb = XLSX.utils.book_new();
  const templateRows = [
    {
      'NPWP Penjual': '01.892.456.7-408.000',
      'Nama Penjual': 'PT. Contoh Rekanan Farmasi',
      'Nomor Faktur': '010.000-26.00000001',
      'Tanggal Faktur': '2026-01-15',
      'Masa Pajak': 1,
      'Tahun': 2026,
      'Status Faktur': 'Normal',
      'Harga Jual/Penggantian': 100000000,
      'DPP Nilai Lain/DPP': 100000000,
      'PPN': 11000000,
      'Nilai Invoice': 111000000,
      'Perekam': 'DJP-Coretax',
      'Nomor Invoice': 'INV-2026-001',
      'Keterangan': 'Belanja Obat BLUD'
    }
  ];
  const ws = XLSX.utils.json_to_sheet(templateRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Template Coretax 13 Kolom');
  XLSX.writeFile(wb, 'Template_Coretax_13_Kolom_2026.xlsx');
}

export function downloadHutangTemplate() {
  const wb = XLSX.utils.book_new();
  const templateRows = [
    {
      'Nomor Invoice': 'INV-2026-001',
      'Tanggal Invoice': '2026-01-10',
      'Vendor': 'PT. Contoh Rekanan Farmasi',
      'Nilai Invoice': 111000000,
      'Status Pembayaran': 'SUDAH DIBAYAR',
      'Nomor SP2D': 'SPD-LS/RSUD Jatisari/I/2026/00001',
      'Tanggal Pembayaran': '2026-01-28',
      'Jenis Hutang': 'Belanja Obat-Obatan-Obat',
      'Keterangan': 'Lunas Bank BJB BLUD'
    }
  ];
  const ws = XLSX.utils.json_to_sheet(templateRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Template Data Hutang');
  XLSX.writeFile(wb, 'Template_Data_Hutang_2026.xlsx');
}

export async function parseCoretaxFile(file: File): Promise<CoretaxPPNRecord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

  const records: CoretaxPPNRecord[] = [];

  rawRows.forEach((row, idx) => {
    // Look up columns flexible names
    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        const foundKey = Object.keys(row).find(
          rk => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          return row[foundKey];
        }
      }
      return '';
    };

    const nomorFaktur = String(getVal('nomorfaktur', 'nofaktur', 'faktur', 'nomor_faktur') || `010.000-26.${String(idx + 1).padStart(8, '0')}`);
    const dppRaw = parseFloat(String(getVal('dpp', 'dppnilailain', 'dasarpengenaanpajak')).replace(/[^0-9.-]+/g, '')) || 0;
    const ppnRaw = parseFloat(String(getVal('ppn', 'pajak', 'ppntertera')).replace(/[^0-9.-]+/g, '')) || Math.round(dppRaw * 0.11);
    const hargaJualRaw = parseFloat(String(getVal('hargajual', 'hargapenggantian', 'hargajualpenggantian')).replace(/[^0-9.-]+/g, '')) || dppRaw;
    const nilaiInvoiceRaw = parseFloat(String(getVal('nilaiinvoice', 'totalinvoice', 'nilaitagihan')).replace(/[^0-9.-]+/g, '')) || (dppRaw + ppnRaw);

    const npwp = String(getVal('npwppenjual', 'npwp', 'npwpvendor') || '-');
    const namaPenjual = String(getVal('namapenjual', 'penjual', 'vendor', 'namavendor') || 'Vendor Coretax');
    const tanggalFaktur = String(getVal('tanggalfaktur', 'tglfaktur', 'tanggal') || '2026-01-15');
    const masaPajak = parseInt(String(getVal('masapajak', 'masa', 'bulan') || '1'), 10) || 1;
    const tahun = parseInt(String(getVal('tahun', 'tahunpajak') || '2026'), 10) || 2026;
    const statusFaktur = String(getVal('statusfaktur', 'status') || 'Normal');
    const perekam = String(getVal('perekam', 'petugas') || 'DJP-Coretax');
    const nomorInvoice = String(getVal('nomorinvoice', 'noinvoice', 'invoice', 'kunci') || '');
    const keterangan = String(getVal('keterangan', 'uraian', 'catatan') || '');

    records.push({
      id: `CTX-IMP-${Date.now()}-${idx}`,
      npwpPenjual: npwp,
      namaPenjual,
      nomorFaktur,
      tanggalFaktur,
      masaPajak,
      tahun,
      statusFaktur,
      hargaJual: hargaJualRaw,
      dpp: dppRaw,
      ppn: ppnRaw,
      nilaiInvoice: nilaiInvoiceRaw,
      nilaiInvoiceCoretax: nilaiInvoiceRaw,
      perekam,
      nomorInvoice,
      keterangan,
      namaVendor: namaPenjual,
      npwpVendor: npwp,
      periodeBulan: masaPajak,
    });
  });

  return records;
}

export async function parseHutangFile(file: File): Promise<DataHutangRecord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

  return parseHutangJson(rawRows);
}

export function parseHutangText(text: string): DataHutangRecord[] {
  const workbook = XLSX.read(text, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  return parseHutangJson(rawRows);
}

function parseHutangJson(rawRows: any[]): DataHutangRecord[] {
  const records: DataHutangRecord[] = [];

  rawRows.forEach((row, idx) => {
    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        const foundKey = Object.keys(row).find(
          rk => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          return row[foundKey];
        }
      }
      return '';
    };

    const nomorInvoice = String(getVal('nomorinvoice', 'noinvoice', 'invoice') || `INV-${idx + 1}`);
    const tanggalInvoice = String(getVal('tanggalinvoice', 'tglinvoice', 'tanggal') || '2026-01-10');
    const vendor = String(getVal('vendor', 'rekanan', 'namaperusahaan', 'penjual') || 'Vendor RSUD Jatisari');
    const nilai = parseFloat(String(getVal('nilaiinvoice', 'nilai', 'nominal', 'tagihan')).replace(/[^0-9.-]+/g, '')) || 0;
    
    const statusRaw = String(getVal('statuspembayaran', 'status', 'keteranganbayar') || '').toUpperCase();
    let statusPembayaran: DataHutangRecord['statusPembayaran'] = 'BELUM DIBAYAR';
    if (statusRaw.includes('SUDAH') || statusRaw.includes('LUNAS') || statusRaw.includes('DIBAYAR')) {
      statusPembayaran = 'SUDAH DIBAYAR';
    } else if (statusRaw.includes('SEBAGIAN')) {
      statusPembayaran = 'DIBAYAR SEBAGIAN';
    }

    const nomorSP2D = String(getVal('nomorsp2d', 'sp2d', 'nosp2d') || '');
    const tanggalPembayaran = String(getVal('tanggalpembayaran', 'tglbayar', 'tglpembayaran') || '');
    const jenisHutang = String(getVal('jenishutang', 'jenis', 'kategori') || 'Barjas 2026');
    const keterangan = String(getVal('keterangan', 'uraian') || '');

    records.push({
      id: `HTG-IMP-${Date.now()}-${idx}`,
      nomorInvoice,
      tanggalInvoice,
      vendor,
      nilaiInvoice: nilai,
      statusPembayaran,
      tanggalPembayaran: tanggalPembayaran || undefined,
      nomorSP2D: nomorSP2D || undefined,
      jenisHutang,
      keterangan,
    });
  });

  return records;
}
