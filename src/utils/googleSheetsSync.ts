import * as XLSX from 'xlsx';
import { DataHutangRecord } from '../types/ppn';

export const DEFAULT_GOOGLE_SHEETS_URL =
  'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';

export async function fetchHutangFromGoogleSheets(sheetUrl: string): Promise<{
  records: DataHutangRecord[];
  syncedAt: string;
}> {
  if (!sheetUrl || !sheetUrl.includes('docs.google.com/spreadsheets')) {
    throw new Error('Format link Google Sheets tidak valid.');
  }

  // Extract Spreadsheet ID
  const matches = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!matches || !matches[1]) {
    throw new Error('Tidak dapat menemukan Spreadsheet ID dari link yang diberikan.');
  }

  const spreadsheetId = matches[1];
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new Error(
      `Gagal mengunduh Google Sheets (${response.status}). Pastikan hak akses spreadsheet diatur ke "Siapa saja yang memiliki link (Anyone with link can view)".`
    );
  }

  const csvText = await response.text();
  const workbook = XLSX.read(csvText, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (rawRows.length < 2) {
    throw new Error('Spreadsheet kosong atau tidak memiliki baris data.');
  }

  // Find header row and column indices
  let headerRowIndex = 0;
  let headers: string[] = [];
  
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    if (Array.isArray(row) && row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('invoice') || cell.toLowerCase().includes('vendor')))) {
      headerRowIndex = i;
      headers = row.map(h => String(h || '').trim().toLowerCase());
      break;
    }
  }

  if (headers.length === 0 && rawRows.length > 0) {
    headers = (rawRows[0] || []).map((h: any) => String(h || '').trim().toLowerCase());
  }

  const invIdx = headers.findIndex(h => h.includes('invoice') || h.includes('no. inv') || h.includes('nomor invoice'));
  const vendorIdx = headers.findIndex(h => h.includes('vendor') || h.includes('rekanan') || h.includes('nama perusahaan') || h.includes('penjual'));
  const nilaiIdx = headers.findIndex(h => h.includes('nilai') || h.includes('nominal') || h.includes('tagihan') || h.includes('jumlah'));
  const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('keterangan bayar') || h.includes('bayar'));
  const sp2dIdx = headers.findIndex(h => h.includes('sp2d') || h.includes('no sp2d') || h.includes('nomor sp2d'));
  const tglBayarIdx = headers.findIndex(h => h.includes('tgl bayar') || h.includes('tanggal bayar') || h.includes('tgl realisasi'));
  const tglInvIdx = headers.findIndex(h => h.includes('tgl invoice') || h.includes('tanggal') || h.includes('tgl'));
  const jenisIdx = headers.findIndex(h => h.includes('jenis') || h.includes('kategori') || h.includes('pengadaan') || h.includes('pos'));
  const ketIdx = headers.findIndex(h => h.includes('keterangan') || h.includes('uraian') || h.includes('catatan'));

  const records: DataHutangRecord[] = [];

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !Array.isArray(row)) continue;

    const noInvoice = invIdx >= 0 && row[invIdx] ? String(row[invIdx]).trim() : '';
    const vendor = vendorIdx >= 0 && row[vendorIdx] ? String(row[vendorIdx]).trim() : 'Vendor RSUD Jatisari';
    
    // Parse numeric value
    let nilai = 0;
    if (nilaiIdx >= 0 && row[nilaiIdx] !== undefined) {
      const rawVal = String(row[nilaiIdx]).replace(/[^0-9.-]+/g, '');
      nilai = parseFloat(rawVal) || 0;
    }

    if (!noInvoice && nilai === 0) continue; // Skip empty row

    const statusRaw = statusIdx >= 0 && row[statusIdx] ? String(row[statusIdx]).trim().toUpperCase() : 'BELUM DIBAYAR';
    let statusPembayaran: DataHutangRecord['statusPembayaran'] = 'BELUM DIBAYAR';
    if (statusRaw.includes('SUDAH') || statusRaw.includes('LUNAS') || statusRaw.includes('DIBAYAR') || statusRaw.includes('SELESAI')) {
      statusPembayaran = 'SUDAH DIBAYAR';
    } else if (statusRaw.includes('SEBAGIAN')) {
      statusPembayaran = 'DIBAYAR SEBAGIAN';
    }

    const nomorSP2D = sp2dIdx >= 0 && row[sp2dIdx] ? String(row[sp2dIdx]).trim() : undefined;
    const tanggalPembayaran = tglBayarIdx >= 0 && row[tglBayarIdx] ? String(row[tglBayarIdx]).trim() : undefined;
    const tanggalInvoice = tglInvIdx >= 0 && row[tglInvIdx] ? String(row[tglInvIdx]).trim() : '2026-01-01';
    const jenisHutang = jenisIdx >= 0 && row[jenisIdx] ? String(row[jenisIdx]).trim() : 'Barjas BLUD';
    const keterangan = ketIdx >= 0 && row[ketIdx] ? String(row[ketIdx]).trim() : '';

    records.push({
      id: `HTG-GS-${i}`,
      nomorInvoice: noInvoice || `INV-GS-${i}`,
      tanggalInvoice,
      vendor,
      nilaiInvoice: nilai,
      statusPembayaran,
      tanggalPembayaran,
      nomorSP2D,
      jenisHutang,
      keterangan,
    });
  }

  const now = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  return {
    records,
    syncedAt: now,
  };
}

export async function syncHutangFromGoogleSheets(sheetUrl: string): Promise<DataHutangRecord[]> {
  const result = await fetchHutangFromGoogleSheets(sheetUrl);
  return result.records;
}

