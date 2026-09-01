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
  Check
} from 'lucide-react';
import { InvoiceHutang2025Record } from '../types/invoiceHutang';
import { formatRupiah } from '../utils/formatters';

interface ImportInvoiceExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (records: InvoiceHutang2025Record[], mode: 'replace' | 'append') => void;
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

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRecords, setParsedRecords] = useState<InvoiceHutang2025Record[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbookObj, setWorkbookObj] = useState<XLSX.WorkBook | null>(null);
  
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper parser number
  const parseNum = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const str = String(val).trim();
    if (str === '-' || str === 'Rp-' || str.startsWith('Rp-') || str.includes('#REF!')) return 0;
    let clean = str.replace(/[^0-9,.-]/g, '');
    
    if (clean.includes('.') && clean.includes(',')) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastComma > lastDot) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(/,/g, '');
    } else if (clean.includes('.')) {
      clean = clean.replace(/\./g, '');
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

      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      if (!rawJson || rawJson.length === 0) {
        throw new Error(`Sheet "${sheetName}" kosong atau tidak memiliki data.`);
      }

      const records: InvoiceHutang2025Record[] = [];

      rawJson.forEach((row, idx) => {
        // Find keys case-insensitively
        const keys = Object.keys(row);
        const getVal = (...matchers: string[]): any => {
          for (const m of matchers) {
            const foundKey = keys.find(k => {
              const cleanedKey = k.trim().toLowerCase().replace(/[^a-z0-9/]/g, '');
              const cleanedMatcher = m.toLowerCase().replace(/[^a-z0-9/]/g, '');
              return cleanedKey === cleanedMatcher || cleanedKey.includes(cleanedMatcher);
            });
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
              return row[foundKey];
            }
          }
          return '';
        };

        const rekanan = String(
          getVal('perusahaan / vendor', 'perusahaan', 'vendor', 'rekanan', 'mitra', 'nama rekanan') || row[keys[1]] || ''
        ).trim();
        const uraian = String(
          getVal('jenis pengadaan', 'uraian / pos belanja', 'pos belanja', 'uraian', 'rincian', 'nama barang', 'kegiatan') || row[keys[3]] || ''
        ).trim();

        // Skip rows that look like empty headers/summaries
        if (!rekanan && !uraian && !row[keys[0]]) return;
        if (rekanan.toLowerCase().includes('total') || uraian.toLowerCase().includes('total')) return;

        const no = parseNum(getVal('no', 'nomor', 'no.') || (idx + 1));
        const bagian = String(getVal('bidang', 'bagian', 'unit', 'instalasi') || 'Bidang Pelayanan Non Medik').trim();
        const subBelanja = String(getVal('keterangan pengadaan', 'sub belanja', 'sub_belanja', 'jenis belanja', 'kategori') || 'BELANJA OBAT').trim();
        
        const tglTandaTerima = parseDateStr(getVal('tanggal rekap', 'tgl tanda terima', 'tanda terima', 'tgl_terima', 'terima'));
        const tglSpbSpk = parseDateStr(getVal('tanggal masuk spj', 'masuk spj', 'tgl spb', 'spk', 'po', 'spb/spk/po', 'tgl spj'));
        const tglInvoice = parseDateStr(getVal('tanggal invoice', 'tgl invoice', 'tgl faktur', 'tanggal faktur'));
        const bulanInvoice = String(getVal('bulan', 'bulan invoice', 'bln') || '-').trim();
        const rawNoInvoice = String(getVal('nomor invoice/spk/po', 'nomor invoice', 'no invoice', 'no faktur', 'kwitansi', 'no kwitansi') || `INV/${no}/2025`).trim();
        let noInvoice = rawNoInvoice;
        if (noInvoice.startsWith('Rp') || noInvoice.startsWith('rp') || noInvoice.startsWith('RP')) {
          noInvoice = noInvoice.replace(/^Rp\.?\s*/i, '').replace(/,/g, '');
        }
        noInvoice = noInvoice.replace(/^['"]+|['"]+$/g, '');
        const jatuhTempo = parseDateStr(getVal('tanggal jatuh tempo', 'jatuh tempo', 'due date', 'tempo'));

        const jumlahInvoice = parseNum(getVal('jumlah', 'jumlah invoice', 'nilai invoice', 'nominal', 'bruto', 'tagihan'));
        const koreksi = parseNum(getVal('koreksi', 'nilai koreksi'));
        
        const rawSpj = getVal('nilai spj', 'total invoice fix', 'total fix', 'setelah koreksi', 'total_fix');
        const parsedSpj = parseNum(rawSpj);
        const totalInvoiceFix = (rawSpj !== undefined && rawSpj !== '' && rawSpj !== null) ? parsedSpj : (jumlahInvoice + koreksi);
        
        const pembayaran = parseNum(getVal('dibayar', 'pembayaran', 'sudah dibayar', 'realisasi', 'bayar'));
        const sumberAnggaran = String(getVal('jenis anggaran blud / apbd', 'jenis anggaran', 'sumber anggaran', 'sumber dana', 'sumber', 'anggaran') || 'BLUD').trim();
        
        const rawSisa = getVal('sisa', 'sisa hutang', 'kurang bayar', 'outstanding');
        const parsedSisa = parseNum(rawSisa);
        const sisaHutang = (rawSisa !== undefined && rawSisa !== '' && rawSisa !== null) ? parsedSisa : Math.max(0, totalInvoiceFix - pembayaran);
        const sudahMasukBukuKas = parseBool(getVal('a', 'sudah masuk buku kas', 'buku kas', 'kas', 'masuk kas'));
        const tglSpdBukuKas = parseDateStr(getVal('tanggal bayar', 'tgl spd', 'tanggal spd', 'tgl_spd'));
        const bulanSpd = String(getVal('bulan bayar', 'bulan spd', 'bln spd', 'bln bayar') || row[keys[19]] || '-').trim();
        const noSpdBukuKas = String(getVal('nomor sp2d', 'nomor spd', 'no spd', 'no_spd', 'sp2d') || '-').trim();
        const lamaHariHutang = parseNum(getVal('umur hutang', 'lama hari', 'lama hutang', 'hari'));
        const keterangan = String(getVal('keterangan', 'status', 'ket', 'catatan') || (sisaHutang <= 0 ? 'Lunas' : 'Belum Lunas')).trim();
        
        const koreksiPlusMinus = parseNum(getVal('koreksi plus minus', 'koreksi (+/-)', 'koreksi +/-'));
        const koreksiMinusBlud = parseNum(getVal('koreksi minus blud', 'koreksi blud', 'minus blud'));
        const koreksiMinusApbd = parseNum(getVal('koreksi minus apbd', 'koreksi apbd', 'minus apbd'));
        const sisaHutangRiil = parseNum(getVal('sisa hutang riil', 'sisa riil', 'riil')) || sisaHutang;

        records.push({
          id: `inv-excel-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          no: no || (records.length + 1),
          rekanan: rekanan || 'Penyedia Barang/Jasa',
          bagian,
          uraian: uraian || 'Pengadaan Barang & Jasa',
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
          koreksiPlusMinus,
          koreksiMinusBlud,
          koreksiMinusApbd,
          sisaHutangRiil
        });
      });

      if (records.length === 0) {
        throw new Error('Tidak ditemukan data baris valid pada file Excel.');
      }

      setParsedRecords(records);
      setSuccessMessage(`Berhasil membaca ${records.length} baris invoice dari sheet "${sheetName}". Siap diimpor!`);
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal memproses sheet data Excel.');
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
      setErrorMessage(err.message || 'Gagal membaca file Excel.');
      setParsedRecords([]);
    } finally {
      setIsProcessing(false);
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
    const headers = [
      'NO',
      'PERUSAHAAN / VENDOR',
      'BIDANG',
      'JENIS PENGADAAN',
      'KETERANGAN PENGADAAN',
      'TANGGAL REKAP',
      'TANGGAL MASUK SPJ',
      'TANGGAL INVOICE',
      'BULAN',
      'NOMOR INVOICE/SPK/PO',
      'TANGGAL JATUH TEMPO',
      'JUMLAH',
      'KOREKSI',
      'NILAI SPJ',
      'DIBAYAR',
      'JENIS ANGGARAN BLUD / APBD',
      'SISA',
      'A',
      'TANGGAL BAYAR',
      '',
      'NOMOR SP2D',
      'UMUR HUTANG',
      'BELUM JT',
      '1-30 Hari',
      '31-60 Hari',
      '61-90 Hari',
      '>90 Hari'
    ];

    const sampleRows = [
      [
        1,
        'PT. RANAH MULTI SEMESTA',
        'Bidang Pelayanan Non Medik',
        'Belanja Bahan-Bahan Lainnya (Farmasi)',
        'BELANJA BMHP',
        '08/08/2025',
        '10/09/2025',
        '31/07/2025',
        'Juli',
        'RS2025070246',
        '30/08/2025',
        45186093,
        0,
        45186093,
        45186093,
        'BLUD',
        0,
        'TRUE',
        '21/01/2026',
        'JANUARI',
        'SPD-LS/RSUD Jatisari/I/2026/00028',
        0,
        '',
        '',
        '',
        '',
        ''
      ],
      [
        2,
        'PT. BINA SAN PRIMA',
        'Bidang Pelayanan Non Medik',
        'Belanja Obat-Obatan-Obat',
        'BELANJA OBAT',
        '08/08/2025',
        '',
        '30/07/2025',
        'Juli',
        'FKKRW/202507/14587',
        '13/09/2025',
        359363,
        0,
        359363,
        359363,
        'BLUD',
        0,
        'TRUE',
        '21/01/2026',
        'JANUARI',
        'SPD-LS/RSUD Jatisari/I/2026/00033',
        0,
        '',
        '',
        '',
        '',
        ''
      ],
      [
        3,
        'PT. BELANT PERSADA',
        'IT',
        'Belanja Jasa Konversi Aplikasi/Sistem Informasi',
        'BELANJA APLIKASI SIM RS',
        '08/08/2025',
        '',
        '31/12/2025',
        'Desember',
        '400.728/067/PKS-RSUD Jatisari/2024',
        '',
        119700000,
        0,
        119700000,
        0,
        'BLUD',
        119700000,
        'FALSE',
        '01/01/2026',
        'JANUARI',
        '',
        60,
        '',
        '',
        119700000,
        '',
        ''
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    // Set auto column width
    ws['!cols'] = headers.map(() => ({ wch: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Template Invoice ${year}`);

    XLSX.writeFile(wb, `TEMPLATE_IMPORT_INVOICE_HUTANG_${year}_RSUD.xlsx`);
  };

  const handleApplyImport = () => {
    if (parsedRecords.length === 0) return;
    onImportSuccess(parsedRecords, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c1216] border border-slate-200 dark:border-teal-900/60 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-900/40 via-emerald-950/30 to-slate-900/50 border-b border-slate-200 dark:border-teal-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                Import Data Invoice Hutang {year}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase tracking-wider">
                  Excel / CSV
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Unggah file spreadsheet (.xlsx, .xls, .csv) untuk memperbarui atau menambah data register invoice
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Top Info & Download Template */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-teal-950/30 border border-teal-800/40">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                Gunakan template resmi untuk hasil import yang presisi. Sistem otomatis memetakan nama kolom rekanan, nominal, tanggal, dan status.
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600/90 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition shrink-0 border border-teal-400/40"
            >
              <Download className="w-3.5 h-3.5" /> Download Format Excel
            </button>
          </div>

          {/* Upload Dropzone */}
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
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                {selectedFile ? selectedFile.name : 'Klik atau Tarik File Excel / CSV ke Sini'}
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
              </div>
            </div>
            {selectedFile && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-950/60 border border-teal-700/50 text-teal-300 text-[11px] rounded-full font-mono">
                Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            )}
          </div>

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

          {/* Import Mode Options */}
          {parsedRecords.length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800">
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Pilih Mode Penyimpanan ({parsedRecords.length} Baris Data):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label 
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    importMode === 'replace' 
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300' 
                      : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="importMode" 
                    value="replace" 
                    checked={importMode === 'replace'} 
                    onChange={() => setImportMode('replace')}
                    className="mt-1 accent-teal-500" 
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Ganti Seluruh Data (Replace)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      Menimpa {existingCount} data invoice yang ada saat ini dengan {parsedRecords.length} baris data dari file Excel.
                    </div>
                  </div>
                </label>

                <label 
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    importMode === 'append' 
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300' 
                      : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="importMode" 
                    value="append" 
                    checked={importMode === 'append'} 
                    onChange={() => setImportMode('append')}
                    className="mt-1 accent-teal-500" 
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Tambahkan ke Data yang Ada (Append)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      Menambahkan {parsedRecords.length} baris baru ke akhir data yang sudah ada (Total menjadi {existingCount + parsedRecords.length} baris).
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRecords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 px-1">
                <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-teal-400" /> Pratinjau 5 Baris Pertama:
                </span>
                <span>Total: {parsedRecords.length} data terbaca</span>
              </div>

              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-x-auto max-h-56 bg-slate-900/90 text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-zinc-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">No</th>
                      <th className="px-3 py-2">Rekanan</th>
                      <th className="px-3 py-2">Uraian / Pos Belanja</th>
                      <th className="px-3 py-2">No Invoice</th>
                      <th className="px-3 py-2 text-right">Nilai Total</th>
                      <th className="px-3 py-2 text-right">Pembayaran</th>
                      <th className="px-3 py-2 text-right">Sisa Hutang</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-slate-200">
                    {parsedRecords.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-800/40">
                        <td className="px-3 py-2 font-mono text-zinc-400">{row.no}</td>
                        <td className="px-3 py-2 font-bold text-zinc-100 whitespace-nowrap">{row.rekanan}</td>
                        <td className="px-3 py-2 max-w-xs truncate text-zinc-300">{row.uraian}</td>
                        <td className="px-3 py-2 font-mono text-teal-400">{row.noInvoice}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-zinc-100">{formatRupiah(row.totalInvoiceFix)}</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-400">{formatRupiah(row.pembayaran)}</td>
                        <td className="px-3 py-2 text-right font-mono text-rose-400 font-bold">{formatRupiah(row.sisaHutang)}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.sisaHutang <= 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {row.keterangan || (row.sisaHutang <= 0 ? 'Lunas' : 'Belum Lunas')}
                          </span>
                        </td>
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
            disabled={parsedRecords.length === 0 || isProcessing}
            onClick={handleApplyImport}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Simpan & Perbarui Data ({parsedRecords.length} Baris)
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
