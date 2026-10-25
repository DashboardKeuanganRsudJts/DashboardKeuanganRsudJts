import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  X, 
  RefreshCw, 
  Plus, 
  HelpCircle,
  Table,
  Check,
  Globe,
  FileUp,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info
} from 'lucide-react';
import { InvoiceHutang2025Record } from '../types/invoiceHutang';
import { formatRupiah, getMonthNameIndo } from '../utils/formatters';
import { downloadInvoiceHutangExcelTemplate, INVOICE_HUTANG_EXCEL_COLUMNS } from '../utils/invoiceExcelTemplate';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { InvoiceImportMode, ParsedInvoiceImportRecord } from '../utils/invoiceImportUpdate';
import { getDeterministicInvoiceId, deduplicateInvoiceRecords } from '../utils/invoiceDeduplicator';

interface ImportInvoiceExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (records: ParsedInvoiceImportRecord[], mode: InvoiceImportMode) => void | Promise<void>;
  existingCount: number;
  year?: number;
}

export const ImportInvoiceExcelModal: React.FC<ImportInvoiceExcelModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  existingCount,
  year = 2025
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'google_sheets'>('upload');
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [isFetchingGoogleSheets, setIsFetchingGoogleSheets] = useState(false);
  const [showColumnGuide, setShowColumnGuide] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRecords, setParsedRecords] = useState<ParsedInvoiceImportRecord[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbookObj, setWorkbookObj] = useState<XLSX.WorkBook | null>(null);
  
  const [importMode, setImportMode] = useState<InvoiceImportMode>('update');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to check if a cell actually has content (non-empty)
  const hasCellValue = (val: any): boolean => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'number') return !isNaN(val);
    if (typeof val === 'boolean') return true;
    const str = String(val).trim();
    if (str === '' || str === '-' || str === '#REF!' || str === 'null') return false;
    return true;
  };

  // Helper parser number with full Indonesian accounting support (dots as thousands, commas as decimals)
  const parseNum = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const str = String(val).trim();
    if (str === '-' || str === 'Rp-' || str.startsWith('Rp-') || str.includes('#REF!') || str.toLowerCase() === 'null') return 0;
    
    let clean = str.replace(/[^0-9,.-]/g, '');
    if (!clean) return 0;

    if (clean.includes('.') && clean.includes(',')) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastComma > lastDot) {
        // e.g. 7.325.086,50 -> dot is thousand separator, comma is decimal
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        // e.g. 7,325,086.50 -> comma is thousand separator, dot is decimal
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes('.')) {
      const dotCount = (clean.match(/\./g) || []).length;
      if (dotCount > 1) {
        // Multiple dots: 7.325.086.936 -> pure thousand separators
        clean = clean.replace(/\./g, '');
      } else {
        const parts = clean.split('.');
        if (parts[1].length === 3) {
          // Single thousand separator: 1.000 or 359.363
          clean = clean.replace(/\./g, '');
        }
      }
    } else if (clean.includes(',')) {
      const commaCount = (clean.match(/,/g) || []).length;
      if (commaCount > 1) {
        clean = clean.replace(/,/g, '');
      } else {
        const parts = clean.split(',');
        if (parts[1].length === 3) {
          clean = clean.replace(/,/g, '');
        } else {
          clean = clean.replace(',', '.');
        }
      }
    }

    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Helper parser date
  const parseDateStr = (val: any): string => {
    if (!val) return '-';
    if (typeof val === 'number') {
      try {
        const parsedDate = new Date((val - (25567 + 2)) * 86400 * 1000);
        if (!isNaN(parsedDate.getTime())) {
          const d = String(parsedDate.getDate()).padStart(2, '0');
          const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const y = parsedDate.getFullYear();
          return `${d}/${m}/${y}`;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    const str = String(val).trim();
    if (!str || str === '-' || str === 'null' || str === '#REF!') return '-';
    return str;
  };

  // Helper parser boolean
  const parseBool = (val: any): boolean => {
    if (typeof val === 'boolean') return val;
    const s = String(val).trim().toUpperCase();
    return s === 'TRUE' || s === '1' || s === 'YA' || s === 'SUDAH' || s === 'YES' || s === 'LUNAS' || s === 'A';
  };

  const parseSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) return;

      // Read raw array of arrays to handle title banners, merged headers, and irregular rows
      const aoa = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
      if (!aoa || aoa.length === 0) {
        throw new Error(`Sheet "${sheetName}" kosong atau tidak memiliki data.`);
      }

      // 1. Detect the actual header row (scanning first 20 rows)
      const HEADER_KEY_CLUES = [
        'rekanan', 'vendor', 'perusahaan', 'penyedia', 'mitra',
        'jumlah', 'tagihan', 'nominal', 'bruto', 'invoice',
        'dibayar', 'pembayaran', 'realisasi', 'bayar',
        'sisa', 'kurang bayar', 'jatuh tempo', 'tempo',
        'pengadaan', 'uraian', 'kegiatan', 'belanja', 'bidang',
        'sp2d', 'spd', 'buku kas'
      ];

      let headerRowIdx = -1;
      let highestClueScore = 0;

      for (let r = 0; r < Math.min(20, aoa.length); r++) {
        const row = aoa[r];
        if (!Array.isArray(row)) continue;
        let clueCount = 0;
        for (let c = 0; c < row.length; c++) {
          const cellStr = String(row[c] || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cellStr.length >= 2 && HEADER_KEY_CLUES.some(kw => cellStr.includes(kw) || kw.includes(cellStr))) {
            clueCount++;
          }
        }
        if (clueCount > highestClueScore) {
          highestClueScore = clueCount;
          headerRowIdx = r;
        }
      }

      if (headerRowIdx === -1 || highestClueScore < 2) {
        headerRowIdx = 0;
      }

      const headerRow = (aoa[headerRowIdx] || []).map(c => String(c || '').trim().toLowerCase().replace(/[^a-z0-9/]/g, ''));
      const colCount = headerRow.length;

      // Helper to find column index by synonyms with strict priority against false substring collisions
      const findCol = (...matchers: string[]): number => {
        // 1. Exact match
        for (const m of matchers) {
          const mClean = m.trim().toLowerCase().replace(/[^a-z0-9/]/g, '');
          for (let c = 0; c < headerRow.length; c++) {
            if (headerRow[c] === mClean) return c;
          }
        }
        // 2. Token / word match with collision guard
        for (const m of matchers) {
          const mClean = m.trim().toLowerCase().replace(/[^a-z0-9/]/g, '');
          if (mClean.length >= 2) {
            for (let c = 0; c < headerRow.length; c++) {
              const h = headerRow[c];
              if (mClean === 'jumlah' && (h.includes('pembayaran') || h.includes('bayar') || h.includes('sisa'))) continue;
              if (mClean === 'dibayar' && h.includes('jumlah') && !h.includes('dibayar')) continue;
              if (mClean === 'sisa' && h.includes('jumlah')) continue;
              if (h.includes(mClean) || mClean.includes(h)) return c;
            }
          }
        }
        return -1;
      };

      // Column mapping
      const cNo = findCol('no', 'nomor', 'no.');
      const cRekanan = findCol('perusahaan / vendor', 'perusahaan/vendor', 'perusahaan', 'vendor', 'nama rekanan / vendor', 'rekanan / vendor', 'nama rekanan', 'rekanan', 'mitra', 'penyedia');
      const cBidang = findCol('bidang', 'bagian / bidang', 'bagian', 'unit', 'instalasi', 'ruangan');
      const cUraian = findCol('jenis pengadaan', 'uraian / kegiatan', 'uraian / pos belanja', 'pos belanja', 'uraian', 'rincian', 'nama barang', 'kegiatan', 'belanja', 'sub belanja', 'keterangan pengadaan', 'sub_belanja', 'jenis belanja', 'kategori');
      const cTglRekap = findCol('tanggal rekap', 'tgl rekap', 'tanggal tanda terima', 'tgl tanda terima', 'tanda terima', 'tgl_terima', 'terima');
      const cBulanRekap = findCol('bulan rekap', 'bln rekap');
      const cTglInvoice = findCol('tanggal invoice', 'tgl invoice', 'tgl faktur', 'tanggal faktur', 'tanggal');
      const cBulanInvoice = findCol('bulan invoice', 'bulan', 'bln');
      const cNoInvoice = findCol('nomor invoice/spk/po', 'nomor invoice', 'no invoice', 'no faktur', 'faktur', 'kwitansi', 'no kwitansi', 'inv');
      const cJatuhTempo = findCol('tanggal jatuh tempo', 'tgl jatuh tempo', 'jatuh tempo', 'due date', 'tempo', 'tgl tempo');
      const cJumlah = findCol('jumlah', 'jumlah invoice', 'nilai tagihan (rp)', 'nilai tagihan', 'nilai invoice', 'nominal', 'bruto', 'tagihan', 'total tagihan');
      const cKoreksi = findCol('koreksi', 'nilai koreksi');
      const cNilaiSpj = findCol('nilai spj', 'total invoice fix', 'total fix', 'setelah koreksi', 'total_fix', 'netto');
      const cPembayaran = findCol(
        'dibayar', 'pembayaran (rp)', 'pembayaran', 'sudah dibayar', 'realisasi', 
        'realisasi pembayaran', 'bayar', 'jumlah bayar', 'total bayar', 'nilai bayar', 
        'spd dibayar', 'realisasi (rp)', 'pembayaran rp', 'jumlah pembayaran'
      );
      const cSumber = findCol('jenis anggaran blud / apbd', 'jenis anggaran', 'sumber anggaran', 'sumber dana', 'sumber', 'anggaran');
      const cSisa = findCol('sisa', 'sisa hutang (rp)', 'sisa hutang', 'kurang bayar', 'outstanding', 'sisa tagihan');
      const cSudahMasukKas = findCol('a', 'sudah masuk buku kas', 'buku kas', 'kas', 'masuk kas');
      const cTglBayar = findCol('tanggal bayar', 'tgl bayar', 'tanggal pembayaran', 'tgl pembayaran', 'tanggal spd', 'tgl spd', 'tgl_spd');
      const cBulanBayar = findCol('bulan bayar', 'bulan spd', 'bln spd', 'bln bayar');
      const cNoSpd = findCol('nomor sp2d', 'no sp2d', 'sp2d', 'nomor spd', 'no spd', 'no_spd', 'no spd kas', 'spd buku kas', 'buku kas', 'spd kas');
      const cUmur = findCol('umur hutang', 'lama hari hutang', 'lama hari', 'lama hutang', 'hari');
      const cKeterangan = findCol('keterangan', 'status', 'ket', 'catatan');
      const cTglMasukSpj = findCol('tanggal masuk spj', 'masuk spj', 'tgl spb', 'spk', 'po', 'spb/spk/po', 'tgl spj', 'tgl po');

      // Adaptive positional fallback based on column structure (26-column vs 19-column)
      const isLegacy26Cols = cKoreksi !== -1 || cNilaiSpj !== -1 || colCount >= 22;

      const finalColNo = cNo !== -1 ? cNo : 0;
      const finalColRekanan = cRekanan !== -1 ? cRekanan : 1;
      const finalColBidang = cBidang !== -1 ? cBidang : 2;
      const finalColUraian = cUraian !== -1 ? cUraian : 3;
      const finalColTglRekap = cTglRekap !== -1 ? cTglRekap : 4;
      const finalColBulanRekap = cBulanRekap !== -1 ? cBulanRekap : 5;
      const finalColTglInvoice = cTglInvoice !== -1 ? cTglInvoice : 6;
      const finalColBulanInvoice = cBulanInvoice !== -1 ? cBulanInvoice : 7;
      const finalColNoInvoice = cNoInvoice !== -1 ? cNoInvoice : 8;
      const finalColJatuhTempo = cJatuhTempo !== -1 ? cJatuhTempo : 9;
      const finalColJumlah = cJumlah !== -1 ? cJumlah : 10;
      
      const finalColKoreksi = isLegacy26Cols ? (cKoreksi !== -1 ? cKoreksi : 11) : -1;
      const finalColNilaiSpj = isLegacy26Cols ? (cNilaiSpj !== -1 ? cNilaiSpj : 12) : -1;
      
      // CRITICAL: In 19-col template (without Koreksi/Nilai SPJ), DIBAYAR is column 11!
      const finalColPembayaran = cPembayaran !== -1 
        ? cPembayaran 
        : (isLegacy26Cols ? 13 : 11);

      const finalColSumber = cSumber !== -1 ? cSumber : (isLegacy26Cols ? 14 : 12);
      const finalColSisa = cSisa !== -1 ? cSisa : (isLegacy26Cols ? 15 : 13);
      const finalColSudahMasukKas = cSudahMasukKas !== -1 ? cSudahMasukKas : (isLegacy26Cols ? 16 : 14);
      const finalColTglBayar = cTglBayar !== -1 ? cTglBayar : (isLegacy26Cols ? 17 : 15);
      const finalColBulanBayar = cBulanBayar !== -1 ? cBulanBayar : (isLegacy26Cols ? 18 : 16);
      const finalColNoSpd = cNoSpd !== -1 ? cNoSpd : (isLegacy26Cols ? 19 : 17);
      const finalColUmur = cUmur !== -1 ? cUmur : (isLegacy26Cols ? 20 : 18);

      const records: ParsedInvoiceImportRecord[] = [];

      for (let r = headerRowIdx + 1; r < aoa.length; r++) {
        const row = aoa[r];
        if (!row || row.length === 0) continue;

        const rawRekanan = String(row[finalColRekanan] ?? '')
          .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
          .replace(/^['"]+|['"]+$/g, '')
          .trim()
          .replace(/\s+/g, ' ');
        const rawUraian = String(row[finalColUraian] ?? '').trim();
        const rawNo = row[finalColNo];

        // Skip blank rows or summary/total rows
        if (!rawRekanan && !rawUraian && !hasCellValue(rawNo)) continue;
        if (rawRekanan.toLowerCase().startsWith('total') || rawUraian.toLowerCase().startsWith('total') || String(rawNo).toLowerCase().startsWith('total')) continue;
        if (rawRekanan.toLowerCase().includes('rekapitulasi') || rawUraian.toLowerCase().includes('rekapitulasi')) continue;

        const parsedNo = parseNum(rawNo);
        const no = parsedNo || (records.length + 1);
        const bagian = String(row[finalColBidang] || 'Bidang Pelayanan Non Medik').trim();
        const subBelanja = String(rawUraian || 'BELANJA OBAT').trim();
        const rekanan = rawRekanan || (rawUraian ? 'Penyedia Barang/Jasa' : '');
        if (!rekanan && !rawUraian) continue;

        const tglTandaTerima = parseDateStr(row[finalColTglRekap]);
        const tglRekap = tglTandaTerima;
        const rawBulanRekap = String(row[finalColBulanRekap] || '').trim();
        const derivedBulanRekap = getMonthNameIndo(tglRekap);
        const bulanRekap = derivedBulanRekap || rawBulanRekap || '';

        const tglSpbSpk = parseDateStr(cTglMasukSpj !== -1 ? row[cTglMasukSpj] : '');
        const tglInvoice = parseDateStr(row[finalColTglInvoice]);
        const rawBulanInvoice = String(row[finalColBulanInvoice] || '').trim();
        const derivedBulanInvoice = getMonthNameIndo(tglInvoice);
        const bulanInvoice = derivedBulanInvoice || rawBulanInvoice || '-';

        const cellNoInvoice = row[finalColNoInvoice];
        const rawNoInvoice = String(hasCellValue(cellNoInvoice) ? cellNoInvoice : (no ? `INV/${no}/${year}` : '')).trim();
        let noInvoice = rawNoInvoice;
        if (noInvoice.startsWith('Rp') || noInvoice.startsWith('rp') || noInvoice.startsWith('RP')) {
          noInvoice = noInvoice.replace(/^Rp\.?\s*/i, '').replace(/,/g, '');
        }
        noInvoice = noInvoice.replace(/^['"]+|['"]+$/g, '');
        const hasExplicitNoInvoice = hasCellValue(cellNoInvoice) && String(cellNoInvoice).trim() !== '-';

        const jatuhTempo = parseDateStr(row[finalColJatuhTempo]);
        const jumlahInvoice = parseNum(row[finalColJumlah]);

        // TA 2026: Koreksi & Nilai SPJ are removed (koreksi = 0, totalInvoiceFix = jumlahInvoice)
        const koreksi = (year === 2026 || finalColKoreksi === -1) ? 0 : parseNum(row[finalColKoreksi]);
        const totalInvoiceFix = (year === 2026 || finalColNilaiSpj === -1)
          ? jumlahInvoice
          : (hasCellValue(row[finalColNilaiSpj]) ? parseNum(row[finalColNilaiSpj]) : (jumlahInvoice + koreksi));

        // Exact payment parsing
        const pembayaran = parseNum(row[finalColPembayaran]);
        const sumberAnggaran = String(row[finalColSumber] || 'BLUD').trim();

        // SISA strictly calculated as Max(0, Jumlah - Pembayaran)
        const calculatedSisa = Math.max(0, totalInvoiceFix - pembayaran);
        const sisaHutang = (pembayaran >= totalInvoiceFix && totalInvoiceFix > 0)
          ? 0
          : (year === 2026 ? calculatedSisa : (hasCellValue(row[finalColSisa]) ? parseNum(row[finalColSisa]) : calculatedSisa));

        const sudahMasukBukuKas = hasCellValue(row[finalColSudahMasukKas])
          ? parseBool(row[finalColSudahMasukKas])
          : (sisaHutang <= 0 || pembayaran > 0);

        const tglSpdBukuKas = parseDateStr(row[finalColTglBayar]);
        const tglBayar = tglSpdBukuKas;
        const rawBulanBayar = String(row[finalColBulanBayar] || '').trim();
        const derivedBulanBayar = getMonthNameIndo(tglBayar);
        const bulanSpd = derivedBulanBayar || rawBulanBayar || '-';

        const noSpdBukuKas = String(row[finalColNoSpd] || '-').trim();
        const lamaHariHutang = parseNum(row[finalColUmur]);
        const keterangan = String((cKeterangan !== -1 ? row[cKeterangan] : '') || (sisaHutang <= 0 ? 'Lunas' : 'Belum Lunas')).trim();
        const sisaHutangRiil = sisaHutang;

        records.push({
          id: getDeterministicInvoiceId(year, { rekanan, noInvoice, no, jumlahInvoice }, records.length),
          no: no || (records.length + 1),
          rekanan,
          bagian,
          bidang: bagian,
          uraian: rawUraian || 'Pengadaan Barang & Jasa',
          subBelanja,
          tglTandaTerima,
          tglRekap,
          bulanRekap,
          tglSpbSpk,
          tglMasukSpj: tglSpbSpk,
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
          tglBayar,
          bulanSpd,
          noSpdBukuKas,
          lamaHariHutang,
          keterangan,
          koreksiPlusMinus: 0,
          koreksiMinusBlud: 0,
          koreksiMinusApbd: 0,
          sisaHutangRiil,
          _isImported: true,
          _hasExplicitNoInvoice: hasExplicitNoInvoice,
          _presentFields: {
            no: hasCellValue(row[finalColNo]),
            rekanan: hasCellValue(row[finalColRekanan]),
            bidang: hasCellValue(row[finalColBidang]),
            bagian: hasCellValue(row[finalColBidang]),
            uraian: hasCellValue(row[finalColUraian]),
            subBelanja: hasCellValue(row[finalColUraian]),
            tglRekap: hasCellValue(row[finalColTglRekap]),
            tglTandaTerima: hasCellValue(row[finalColTglRekap]),
            bulanRekap: hasCellValue(row[finalColBulanRekap]),
            tglMasukSpj: cTglMasukSpj !== -1 && hasCellValue(row[cTglMasukSpj]),
            tglSpbSpk: cTglMasukSpj !== -1 && hasCellValue(row[cTglMasukSpj]),
            tglInvoice: hasCellValue(row[finalColTglInvoice]),
            bulanInvoice: hasCellValue(row[finalColBulanInvoice]),
            noInvoice: hasExplicitNoInvoice,
            jatuhTempo: hasCellValue(row[finalColJatuhTempo]),
            jumlahInvoice: finalColJumlah !== -1,
            koreksi: finalColKoreksi !== -1,
            totalInvoiceFix: finalColNilaiSpj !== -1 || finalColJumlah !== -1,
            pembayaran: finalColPembayaran !== -1,
            sumberAnggaran: hasCellValue(row[finalColSumber]),
            sisaHutang: finalColSisa !== -1 || finalColJumlah !== -1,
            sudahMasukBukuKas: hasCellValue(row[finalColSudahMasukKas]),
            tglBayar: hasCellValue(row[finalColTglBayar]),
            tglSpdBukuKas: hasCellValue(row[finalColTglBayar]),
            bulanSpd: hasCellValue(row[finalColBulanBayar]),
            noSpdBukuKas: hasCellValue(row[finalColNoSpd]),
            lamaHariHutang: hasCellValue(row[finalColUmur]),
            keterangan: cKeterangan !== -1 && hasCellValue(row[cKeterangan]),
            koreksiPlusMinus: false,
            koreksiMinusBlud: false,
            koreksiMinusApbd: false,
            sisaHutangRiil: true
          }
        });
      }

      if (records.length === 0) {
        throw new Error('Tidak ditemukan data baris transaksi invoice yang valid pada file Spreadsheet.');
      }

      setParsedRecords(records);
      const totalBayar = records.reduce((acc, r) => acc + (r.pembayaran || 0), 0);
      setSuccessMessage(
        `Berhasil membaca ${records.length} baris invoice (Total Pembayaran: ${formatRupiah(totalBayar)}) dari sheet "${sheetName}". Smart Column Mapping berhasil memetakan seluruh kolom.`
      );
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal memproses sheet data Spreadsheet.');
      setParsedRecords([]);
    }
  };

  const processFile = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv', '.tsv', '.ods'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Format file tidak didukung. Harap upload file Excel (.xlsx, .xls) atau CSV (.csv).');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      setWorkbookObj(wb);
      setSheetNames(wb.SheetNames);
      
      const firstSheet = wb.SheetNames[0];
      setSelectedSheet(firstSheet);
      parseSheetData(wb, firstSheet);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal membaca file Spreadsheet.');
      setParsedRecords([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFetchGoogleSheets = async () => {
    if (!googleSheetsUrl.trim()) {
      setErrorMessage('Harap masukkan Link URL atau ID Google Spreadsheet.');
      return;
    }

    const trimmed = googleSheetsUrl.trim();
    const idMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/) || trimmed.match(/^([a-zA-Z0-9-_]{20,})$/);
    if (!idMatch) {
      setErrorMessage('Format link atau ID Google Spreadsheet tidak valid. Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs.../edit');
      return;
    }

    const spreadsheetId = idMatch[1];
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gidParam = gidMatch && gidMatch[1] ? `&gid=${gidMatch[1]}` : '';

    setIsFetchingGoogleSheets(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gidParam}`;
      const res = await fetch(exportUrl);
      
      if (!res.ok) {
        // Try fallback with token if authenticated
        const token = GoogleSheetsService.getStoredToken();
        if (token) {
          const authRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z1000`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (authRes.ok) {
            const data = await authRes.json();
            if (data.values && data.values.length > 1) {
              const ws = XLSX.utils.aoa_to_sheet(data.values);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'GoogleSheet');
              setWorkbookObj(wb);
              setSheetNames(['GoogleSheet']);
              setSelectedSheet('GoogleSheet');
              parseSheetData(wb, 'GoogleSheet');
              setSuccessMessage(`Berhasil menarik data Google Spreadsheet via Google API (${data.values.length - 1} baris).`);
              setIsFetchingGoogleSheets(false);
              return;
            }
          }
        }
        throw new Error(
          `Gagal mengambil data dari Google Spreadsheet (${res.status}). Pastikan hak akses spreadsheet diatur ke "Siapa saja yang memiliki link (Anyone with link can view)" di menu Bagikan (Share) Google Spreadsheet.`
        );
      }

      const csvText = await res.text();
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('Google Spreadsheet kosong atau tidak memiliki data.');
      }

      const wb = XLSX.read(csvText, { type: 'string' });
      setWorkbookObj(wb);
      setSheetNames(wb.SheetNames);
      const firstSheet = wb.SheetNames[0] || 'Sheet1';
      setSelectedSheet(firstSheet);
      parseSheetData(wb, firstSheet);
      setSuccessMessage(`Berhasil mengambil dan memproses data dari Google Spreadsheet langsung!`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal mengambil data dari Google Spreadsheet.');
      setParsedRecords([]);
    } finally {
      setIsFetchingGoogleSheets(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    downloadInvoiceHutangExcelTemplate(year);
  };

  const handleApplyImport = () => {
    if (parsedRecords.length === 0) return;
    onImportSuccess(parsedRecords, importMode);
    onClose();
  };

  const totalTagihanParsed = parsedRecords.reduce((acc, r) => acc + (r.totalInvoiceFix || r.jumlahInvoice || 0), 0);
  const totalBayarParsed = parsedRecords.reduce((acc, r) => acc + (r.pembayaran || 0), 0);
  const totalSisaParsed = parsedRecords.reduce((acc, r) => acc + (r.sisaHutang || 0), 0);

  const getAgingDisplay = (row: InvoiceHutang2025Record, type: 'belum_jt' | '1-30' | '31-60' | '61-90' | '>90') => {
    if (row.sisaHutang <= 0) return '-';
    const age = row.lamaHariHutang || 0;
    if (type === 'belum_jt' && age <= 0) return formatRupiah(row.sisaHutang);
    if (type === '1-30' && age >= 1 && age <= 30) return formatRupiah(row.sisaHutang);
    if (type === '31-60' && age >= 31 && age <= 60) return formatRupiah(row.sisaHutang);
    if (type === '61-90' && age >= 61 && age <= 90) return formatRupiah(row.sisaHutang);
    if (type === '>90' && age > 90) return formatRupiah(row.sisaHutang);
    return '-';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c1216] border border-slate-200 dark:border-teal-900/60 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-900/50 via-emerald-950/40 to-slate-900/60 border-b border-slate-200 dark:border-teal-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  Import Spreadsheet Invoice Hutang {year}
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> PIC Hutang
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Sinkronkan atau unggah data buku register invoice hutang RSUD ({existingCount} transaksi saat ini)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Source Selection */}
        <div className="px-6 pt-3 pb-0 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                activeTab === 'upload'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-[#0c1216]'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>Unggah File Spreadsheet (.xlsx / .csv)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('google_sheets')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                activeTab === 'google_sheets'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#0c1216]'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Tautan Google Spreadsheet</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowColumnGuide(!showColumnGuide)}
            className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 mb-2 sm:mb-0"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Apakah nama kolom harus sama?</span>
            {showColumnGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Smart Column Mapping Guide Card */}
          {showColumnGuide && (
            <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-700/50 text-xs text-slate-300 space-y-2 animate-in fade-in duration-150">
              <div className="font-bold text-teal-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Kolom TIDAK harus persis sama! Smart Column Mapping Aktif
              </div>
              <p className="text-[11px] text-teal-100/90 leading-relaxed">
                Aplikasi telah dilengkapi pencocokan kolom cerdas (*fuzzy keyword matching*). Anda dapat menggunakan nama kolom yang berbeda dari template:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[10px] mt-2 font-mono">
                <div className="p-2 rounded-lg bg-teal-900/40 border border-teal-800/40">
                  <span className="text-teal-400 font-bold block mb-0.5">Rekanan / Vendor:</span>
                  rekanan, vendor, perusahaan, penyedia, mitra
                </div>
                <div className="p-2 rounded-lg bg-teal-900/40 border border-teal-800/40">
                  <span className="text-teal-400 font-bold block mb-0.5">Uraian / Kegiatan:</span>
                  uraian, pos belanja, kegiatan, nama barang, belanja
                </div>
                <div className="p-2 rounded-lg bg-teal-900/40 border border-teal-800/40">
                  <span className="text-teal-400 font-bold block mb-0.5">Nomor Invoice:</span>
                  no invoice, nomor invoice, no faktur, faktur, kwitansi
                </div>
                <div className="p-2 rounded-lg bg-teal-900/40 border border-teal-800/40">
                  <span className="text-teal-400 font-bold block mb-0.5">Tagihan (Rp):</span>
                  nilai tagihan, jumlah invoice, nominal, total, tagihan
                </div>
                <div className="p-2 rounded-lg bg-teal-900/40 border border-teal-800/40">
                  <span className="text-teal-400 font-bold block mb-0.5">Pembayaran:</span>
                  pembayaran, dibayar, realisasi, sudah dibayar, bayar
                </div>
                <div className="p-2 rounded-lg bg-teal-900/40 border border-teal-800/40">
                  <span className="text-teal-400 font-bold block mb-0.5">Sisa &amp; Tanggal:</span>
                  sisa hutang, sisa, kurang bayar, tgl invoice, tempo
                </div>
              </div>
            </div>
          )}

          {/* Top Info & Download Template */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-teal-950/20 border border-slate-200 dark:border-teal-800/40">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Format master register Invoice Hutang {year} mendukung file Excel (.xlsx), CSV (.csv), atau tautan Google Spreadsheet langsung.
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600/90 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition shrink-0 border border-teal-400/40"
            >
              <Download className="w-3.5 h-3.5" /> Download Template Resmi (.xlsx)
            </button>
          </div>

          {/* TAB 1: UPLOAD LOCAL FILE */}
          {activeTab === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                isDragging 
                  ? 'border-teal-400 bg-teal-500/10' 
                  : 'border-slate-300 dark:border-zinc-800 hover:border-teal-500/60 bg-slate-50/50 dark:bg-zinc-900/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx, .xls, .csv, .tsv, .ods" 
                className="hidden" 
              />
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  {selectedFile ? selectedFile.name : 'Klik atau Tarik File Spreadsheet Disini'}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                  Mendukung Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
                </div>
              </div>
              {selectedFile && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-950/60 border border-teal-700/50 text-teal-300 text-[11px] rounded-full font-mono">
                  Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE SPREADSHEET URL */}
          {activeTab === 'google_sheets' && (
            <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-300 dark:border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>Masukkan Link atau ID Google Spreadsheet:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5n.../edit"
                  className="flex-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={handleFetchGoogleSheets}
                  disabled={isFetchingGoogleSheets || !googleSheetsUrl.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                  {isFetchingGoogleSheets ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Mengunduh...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" /> Tarik Data Spreadsheet
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-start gap-1.5 leading-relaxed bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Pastikan file Google Spreadsheet telah disetel dengan akses <strong>"Siapa saja yang memiliki link dapat melihat"</strong> (Anyone with link can view) pada tombol <em>Bagikan / Share</em> di Google Spreadsheet.
                </span>
              </div>
            </div>
          )}

          {/* Error / Success Feedback */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* If Workbook has multiple sheets */}
          {sheetNames.length > 1 && workbookObj && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Pilih Lembar Kerja (Sheet):</label>
              <div className="flex flex-wrap gap-2">
                {sheetNames.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSelectedSheet(s);
                      parseSheetData(workbookObj, s);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                      selectedSheet === s 
                        ? 'bg-teal-500 text-slate-950 font-bold shadow' 
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parsed Metrics Summary */}
          {parsedRecords.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Nilai Tagihan</div>
                <div className="text-sm font-black font-mono text-slate-900 dark:text-zinc-100 mt-1">{formatRupiah(totalTagihanParsed)}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Pembayaran</div>
                <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">{formatRupiah(totalBayarParsed)}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Sisa Hutang</div>
                <div className="text-sm font-black font-mono text-rose-600 dark:text-rose-400 mt-1">{formatRupiah(totalSisaParsed)}</div>
              </div>
            </div>
          )}

          {/* Import Mode Options */}
          {parsedRecords.length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Pilih Mode Penyimpanan Data ({parsedRecords.length} Baris Data Terbaca):
                </div>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800/60">
                  Tersedia 3 Mode Import
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Mode Update / Timpa Parsial (Direkomendasikan) */}
                <label 
                  onClick={() => setImportMode('update')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    importMode === 'update'
                      ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200 ring-2 ring-teal-500/30'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="update"
                    checked={importMode === 'update'}
                    onChange={() => setImportMode('update')}
                    className="mt-1 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        Perbarui / Timpa Data Cocok (Kolom Kosong Dipertahankan)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/40 font-bold uppercase tracking-wider">
                        Direkomendasikan
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">
                      Mencocokkan baris data invoice dan <strong>hanya mengupdate kolom yang terisi di Excel</strong> (misal: Jumlah &amp; Pembayaran). Jika kolom dalam file Excel itu kosong, <strong>maka data yang ada pada dashboard ini TIDAK akan diubah atau dihapus</strong>.
                    </p>
                  </div>
                </label>

                {/* 2. Mode Replace Total */}
                <label 
                  onClick={() => setImportMode('replace')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    importMode === 'replace'
                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/30'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Ganti Seluruh Data (Replace Total)</div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      Menghapus {existingCount} data sebelumnya dan menggantikannya secara total dengan {parsedRecords.length} data dari spreadsheet ini (kolom kosong di Excel akan menjadi default/kosong).
                    </p>
                  </div>
                </label>

                {/* 3. Mode Append */}
                <label 
                  onClick={() => setImportMode('append')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    importMode === 'append'
                      ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Tambahkan ke Data yang Ada (Append Mode)</div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      Menambahkan {parsedRecords.length} baris baru ke bawah daftar tanpa menghapus atau menimpa data yang sudah ada sebelumnya.
                    </p>
                  </div>
                </label>
              </div>

              {/* Informative banner when update mode is active */}
              {importMode === 'update' && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-[11px] text-teal-800 dark:text-teal-200">
                  <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Proteksi Data Aktif:</strong> Kolom kosong pada file Excel Anda TIDAK akan mengubah atau menghapus data yang tersimpan di dashboard ini. Hanya kolom dengan nilai terisi di Excel yang akan menimpa baris yang cocok.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Preview Table */}
          {parsedRecords.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-teal-400" /> Pratinjau Kolom (Sesuai Format Template):
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                    26 Kolom Template Excel Resmi
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  Menampilkan 5 dari total {parsedRecords.length} baris data terbaca
                </span>
              </div>

              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-x-auto max-h-72 bg-white dark:bg-slate-900/95 text-[11px] shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-emerald-100/90 dark:bg-slate-950 text-emerald-950 dark:text-slate-300 font-semibold border-b border-emerald-300 dark:border-zinc-800 sticky top-0 z-10 text-[10px] uppercase tracking-wider">
                    <tr>
                      {INVOICE_HUTANG_EXCEL_COLUMNS.map((colName, cIdx) => (
                        <th 
                          key={cIdx} 
                          className={`px-3 py-2.5 whitespace-nowrap border-r border-emerald-200/60 dark:border-zinc-800/80 last:border-r-0 ${
                            colName.includes('BULAN') ? 'text-teal-700 dark:text-teal-300' :
                            colName.includes('JUMLAH') || colName.includes('NILAI') || colName.includes('DIBAYAR') || colName.includes('SISA') || colName.includes('KOREKSI') || colName.includes('Hari') || colName.includes('JT') ? 'text-right' : ''
                          }`}
                        >
                          {colName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-800 dark:text-slate-200">
                    {parsedRecords.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-800/50 transition">
                        {/* 1. NO */}
                        <td className="px-3 py-2 font-mono text-center text-zinc-400 border-r border-zinc-800/60">{row.no}</td>
                        {/* 2. PERUSAHAAN / VENDOR */}
                        <td className="px-3 py-2 font-bold text-zinc-100 whitespace-nowrap border-r border-zinc-800/60">{row.rekanan || '-'}</td>
                        {/* 3. BIDANG */}
                        <td className="px-3 py-2 whitespace-nowrap text-zinc-300 border-r border-zinc-800/60">{row.bidang || row.bagian || '-'}</td>
                        {/* 4. JENIS PENGADAAN */}
                        <td className="px-3 py-2 min-w-[200px] text-zinc-300 border-r border-zinc-800/60" title={row.subBelanja || row.uraian}>{row.subBelanja || row.uraian || '-'}</td>
                        {/* 5. TANGGAL REKAP */}
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-zinc-300 border-r border-zinc-800/60">{row.tglRekap || row.tglTandaTerima || '-'}</td>
                        {/* 6. BULAN REKAP */}
                        <td className="px-3 py-2 whitespace-nowrap font-semibold text-teal-300 uppercase border-r border-zinc-800/60">{row.bulanRekap || '-'}</td>
                        {/* 7. TANGGAL INVOICE */}
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-zinc-300 border-r border-zinc-800/60">{row.tglInvoice || '-'}</td>
                        {/* 8. BULAN INVOICE */}
                        <td className="px-3 py-2 whitespace-nowrap font-semibold text-teal-300 uppercase border-r border-zinc-800/60">{row.bulanInvoice || '-'}</td>
                        {/* 9. NOMOR INVOICE/SPK/PO */}
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-teal-400 font-medium border-r border-zinc-800/60">{row.noInvoice || '-'}</td>
                        {/* 10. TANGGAL JATUH TEMPO */}
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-zinc-300 border-r border-zinc-800/60">{row.jatuhTempo || '-'}</td>
                        {/* 11. JUMLAH */}
                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-zinc-100 border-r border-zinc-800/60">{formatRupiah(row.jumlahInvoice)}</td>
                        {/* 12. KOREKSI */}
                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-amber-400 border-r border-zinc-800/60">{row.koreksi ? formatRupiah(row.koreksi) : 'Rp 0'}</td>
                        {/* 13. NILAI SPJ */}
                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono font-bold text-teal-300 border-r border-zinc-800/60">{formatRupiah(row.totalInvoiceFix)}</td>
                        {/* 14. DIBAYAR */}
                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-emerald-400 border-r border-zinc-800/60">{formatRupiah(row.pembayaran)}</td>
                        {/* 15. JENIS ANGGARAN BLUD / APBD */}
                        <td className="px-3 py-2 whitespace-nowrap text-center font-bold text-sky-400 border-r border-zinc-800/60">{row.sumberAnggaran || 'BLUD'}</td>
                        {/* 16. SISA */}
                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono font-bold text-rose-400 border-r border-zinc-800/60">{formatRupiah(row.sisaHutang)}</td>
                        {/* 17. A */}
                        <td className="px-3 py-2 whitespace-nowrap text-center font-mono font-bold text-xs border-r border-zinc-800/60">
                          <span className={row.sudahMasukBukuKas ? 'text-emerald-400' : 'text-slate-500'}>
                            {row.sudahMasukBukuKas ? 'TRUE' : 'FALSE'}
                          </span>
                        </td>
                        {/* 18. TANGGAL BAYAR */}
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-zinc-300 border-r border-zinc-800/60">{row.tglBayar || row.tglSpdBukuKas || '-'}</td>
                        {/* 19. BULAN BAYAR */}
                        <td className="px-3 py-2 whitespace-nowrap font-semibold text-teal-300 uppercase border-r border-zinc-800/60">{row.bulanSpd || '-'}</td>
                        {/* 20. NOMOR SP2D */}
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-zinc-300 border-r border-zinc-800/60">{row.noSpdBukuKas || '-'}</td>
                        {/* 21. UMUR HUTANG */}
                        <td className="px-3 py-2 whitespace-nowrap text-center font-mono text-zinc-300 border-r border-zinc-800/60">{row.lamaHariHutang || 0}</td>
                        {/* 22. BELUM JT */}
                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-zinc-400 border-r border-zinc-800/60">{getAgingDisplay(row, 'belum_jt')}</td>
                        {/* 23. 1-30 Hari */}
                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-emerald-400 border-r border-zinc-800/60">{getAgingDisplay(row, '1-30')}</td>
                        {/* 24. 31-60 Hari */}
                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-amber-400 border-r border-zinc-800/60">{getAgingDisplay(row, '31-60')}</td>
                        {/* 25. 61-90 Hari */}
                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-orange-400 border-r border-zinc-800/60">{getAgingDisplay(row, '61-90')}</td>
                        {/* 26. >90 Hari */}
                        <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-rose-500 font-bold">{getAgingDisplay(row, '>90')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-100 dark:bg-zinc-950/80 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold rounded-xl text-xs transition"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={parsedRecords.length === 0 || isProcessing || isFetchingGoogleSheets}
            onClick={handleApplyImport}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />{' '}
                {importMode === 'update'
                  ? `Perbarui Data Cocok (${parsedRecords.length} Baris)`
                  : importMode === 'replace'
                  ? `Ganti Seluruh Data (${parsedRecords.length} Baris)`
                  : `Tambahkan (${parsedRecords.length} Baris Baru)`}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
