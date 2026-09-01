import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  X, 
  Layers, 
  RefreshCw, 
  Sparkles, 
  Check, 
  FileText,
  Building,
  Zap,
  LayoutDashboard,
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  SpreadsheetImportService, 
  ParsedSheetInfo, 
  TargetImportModule 
} from '../services/spreadsheetImportService';
import { PiutangRecord } from '../types/piutang';
import { PerusahaanAsuransiRow, ListrikKantinStandGroup, SemuaRekapanGroup, RekapBulanan2026Row } from '../data/spreadsheetData2026';
import { syncSemuaRekapanFromSources } from '../services/rekapanSyncService';
import { syncDocumentToFirestore } from '../services/firestoreSync';
import { formatRupiah } from '../utils/formatters';

interface UploadSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessImport: (summary: string) => void;
  onUpdatePiutangPasien?: (records: PiutangRecord[]) => void;
}

export const UploadSpreadsheetModal: React.FC<UploadSpreadsheetModalProps> = ({
  isOpen,
  onClose,
  onSuccessImport,
  onUpdatePiutangPasien
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedSheets, setParsedSheets] = useState<ParsedSheetInfo[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [selectedTargetType, setSelectedTargetType] = useState<TargetImportModule>('auto_detect');
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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
      const { sheets } = await SpreadsheetImportService.parseSpreadsheetFile(file);
      if (sheets.length === 0) {
        throw new Error('File tidak memiliki baris data atau kosong.');
      }

      setParsedSheets(sheets);
      setActiveSheetIndex(0);
      setSuccessMessage(`File "${file.name}" berhasil dibaca! Ditemukan ${sheets.length} sheet.`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal memproses file spreadsheet.');
      setParsedSheets([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const blob = SpreadsheetImportService.generateMasterWorkbook();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Template_Master_Spreadsheet_RSUD_Jatisari_2026.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download template error:', e);
    }
  };

  const handleExecuteImport = () => {
    if (parsedSheets.length === 0) return;

    try {
      let totalUpdatedModules = 0;
      let detailedSummary: string[] = [];

      // Determine which sheets to process
      parsedSheets.forEach((sheet) => {
        const targetType = selectedTargetType === 'auto_detect' ? sheet.detectedType : selectedTargetType;
        
        switch (targetType) {
          case 'piutang_pasien': {
            const parsed = SpreadsheetImportService.parseRowsToPiutangPasien(sheet.headers, sheet.rawJson);
            if (parsed.length > 0) {
              let finalRecords = parsed;
              if (importMode === 'append') {
                try {
                  const existing = JSON.parse(localStorage.getItem('rsud_piutang_data_cache') || '[]');
                  finalRecords = [...existing, ...parsed];
                } catch (e) {
                  console.warn(e);
                }
              }
              localStorage.setItem('rsud_piutang_data_cache', JSON.stringify(finalRecords));
              if (onUpdatePiutangPasien) {
                onUpdatePiutangPasien(finalRecords);
              }
              window.dispatchEvent(new CustomEvent('rsud_data_updated'));
              detailedSummary.push(`${parsed.length} Rincian Klaim Pasien`);
              totalUpdatedModules++;
            }
            break;
          }

          case 'perusahaan_asuransi': {
            const parsed = SpreadsheetImportService.parseRowsToPerusahaanAsuransi(sheet.headers, sheet.rawJson);
            if (parsed.length > 0) {
              let finalRows = parsed;
              if (importMode === 'append') {
                try {
                  const existing = JSON.parse(localStorage.getItem('rsud_perusahaan_asuransi_2026') || '[]');
                  finalRows = [...existing, ...parsed];
                } catch (e) {
                  console.warn(e);
                }
              }
              localStorage.setItem('rsud_perusahaan_asuransi_2026', JSON.stringify(finalRows));
              syncDocumentToFirestore('perusahaan_asuransi_2026', finalRows);
              try {
                syncSemuaRekapanFromSources(finalRows);
              } catch (e) {
                console.warn(e);
              }
              window.dispatchEvent(new CustomEvent('rsud_perusahaan_data_updated'));
              window.dispatchEvent(new CustomEvent('rsud_semua_rekapan_updated'));
              window.dispatchEvent(new CustomEvent('rsud_data_updated'));
              detailedSummary.push(`${parsed.length} Baris Piutang Perusahaan & Asuransi`);
              totalUpdatedModules++;
            }
            break;
          }

          case 'listrik_kantin': {
            const parsed = SpreadsheetImportService.parseRowsToListrikKantin(sheet.headers, sheet.rawJson);
            if (parsed.length > 0) {
              localStorage.setItem('rsud_listrik_kantin_2026', JSON.stringify(parsed));
              syncDocumentToFirestore('listrik_kantin_2026', parsed);
              try {
                syncSemuaRekapanFromSources(undefined, parsed);
              } catch (e) {
                console.warn(e);
              }
              window.dispatchEvent(new CustomEvent('rsud_listrik_data_updated'));
              window.dispatchEvent(new CustomEvent('rsud_semua_rekapan_updated'));
              window.dispatchEvent(new CustomEvent('rsud_data_updated'));
              detailedSummary.push(`${parsed.length} Stand Listrik Kantin`);
              totalUpdatedModules++;
            }
            break;
          }

          case 'semua_rekapan': {
            const parsed = SpreadsheetImportService.parseRowsToSemuaRekapan(sheet.headers, sheet.rawJson);
            if (Object.keys(parsed).length > 0) {
              localStorage.setItem('rsud_semua_rekapan_2026', JSON.stringify(parsed));
              syncDocumentToFirestore('semua_rekapan_2026', parsed);
              window.dispatchEvent(new CustomEvent('rsud_semua_rekapan_updated'));
              window.dispatchEvent(new CustomEvent('rsud_data_updated'));
              detailedSummary.push(`Semua Rekapan (${Object.keys(parsed).length} Bulan)`);
              totalUpdatedModules++;
            }
            break;
          }

          case 'rekap_bulanan_2026': {
            const parsed = SpreadsheetImportService.parseRowsToRekapBulanan(sheet.headers, sheet.rawJson);
            if (Object.keys(parsed).length > 0) {
              localStorage.setItem('rsud_rekap_bulanan_2026', JSON.stringify(parsed));
              window.dispatchEvent(new CustomEvent('rsud_data_updated'));
              detailedSummary.push(`Dashboard Rekap Bulanan 2026`);
              totalUpdatedModules++;
            }
            break;
          }

          case 'hutang': {
            const parsed = SpreadsheetImportService.parseRowsToHutang(sheet.headers, sheet.rawJson);
            if (parsed.length > 0) {
              let finalItems = parsed;
              if (importMode === 'append') {
                try {
                  const existing = JSON.parse(localStorage.getItem('rsud_hutang_blud_apbd') || '[]');
                  finalItems = [...existing, ...parsed];
                } catch (e) {
                  console.warn(e);
                }
              }
              localStorage.setItem('rsud_hutang_blud_apbd', JSON.stringify(finalItems));
              window.dispatchEvent(new CustomEvent('rsud_hutang_data_updated'));
              window.dispatchEvent(new CustomEvent('rsud_data_updated'));
              detailedSummary.push(`${parsed.length} Data Hutang Pengadaan`);
              totalUpdatedModules++;
            }
            break;
          }
        }
      });

      const summaryText = detailedSummary.length > 0 
        ? `Berhasil memperbarui data: ${detailedSummary.join(', ')}!`
        : `Data spreadsheet berhasil diimpor ke dashboard!`;

      onSuccessImport(summaryText);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal menyimpan data hasil impor spreadsheet.');
    }
  };

  const activeSheet = parsedSheets[activeSheetIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 dark:border-emerald-950/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-zinc-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Upload & Update Data dari Spreadsheet
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Excel (.xlsx) / CSV
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Unggah file Google Spreadsheet atau Excel Anda untuk memperbarui seluruh data dashboard secara instan
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-zinc-300">
          
          {/* Notification Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Quick Template Download Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800/60">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  Download Template Spreadsheet Master RSUD Jatisari
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Workbook 5-Sheet lengkap: Rekap Bulanan 2026, 40 Mitra Asuransi, Listrik Kantin, Semua Rekapan, & Klaim Pasien.
                </div>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#161f28] border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition shadow-2xs whitespace-nowrap self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
              <span>Unduh Template .xlsx</span>
            </button>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20 hover:bg-emerald-50/40'
                : 'border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-[#12181f] hover:bg-slate-100 dark:hover:bg-[#151e28] hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv, .tsv, .ods"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs border border-emerald-300 dark:border-emerald-800/60">
              <UploadCloud className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedFile ? selectedFile.name : 'Tarik & Letakkan File Spreadsheet Disini'}
              </div>
              <p className="text-slate-500 dark:text-zinc-400 text-[11px] mt-0.5">
                Mendukung file hasil unduh Google Sheets (.xlsx, .csv) atau file Excel Microsoft (.xlsx, .xls)
              </p>
            </div>

            <button
              type="button"
              className="px-4 py-1.5 rounded-lg bg-emerald-700 dark:bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-800 dark:hover:bg-emerald-500 transition shadow-2xs"
            >
              {selectedFile ? 'Pilih File Lain' : 'Telusuri File Komputer'}
            </button>
          </div>

          {/* If file is processed and sheets detected */}
          {parsedSheets.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-zinc-800">
              
              {/* Sheet Selection Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-900 dark:text-white text-xs">
                    Lembar Kerja (Sheets) yang Ditemukan ({parsedSheets.length}):
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Klik sheet untuk melihat pratinjau kolom & data
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {parsedSheets.map((sheet, idx) => {
                    const isSelected = activeSheetIndex === idx;
                    return (
                      <button
                        key={sheet.sheetName}
                        onClick={() => setActiveSheetIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <FileSpreadsheet className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400 dark:text-white' : 'text-slate-500 dark:text-zinc-400'}`} />
                        <span>{sheet.sheetName}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isSelected ? 'bg-slate-700 dark:bg-emerald-800 text-emerald-300 dark:text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}>
                          {sheet.rowCount} baris
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sheet Properties & Target Mapping */}
              {activeSheet && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Pratinjau Sheet: <span className="text-slate-800 dark:text-zinc-200 font-bold">{activeSheet.sheetName}</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
                        Terdeteksi Otomatis Sebagai:{' '}
                        <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
                          {activeSheet.detectedType === 'perusahaan_asuransi' && 'Piutang Perusahaan & Asuransi'}
                          {activeSheet.detectedType === 'listrik_kantin' && 'Listrik Kantin'}
                          {activeSheet.detectedType === 'semua_rekapan' && 'Semua Rekapan (10 Penjamin)'}
                          {activeSheet.detectedType === 'rekap_bulanan_2026' && 'Dashboard Rekap Bulanan 2026'}
                          {activeSheet.detectedType === 'piutang_pasien' && 'Rincian Klaim & BPJS Pasien'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-zinc-400">Tujuan Target:</span>
                      <select
                        value={selectedTargetType}
                        onChange={(e) => setSelectedTargetType(e.target.value as TargetImportModule)}
                        className="px-2.5 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-[#0d1216] font-semibold text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="auto_detect">Deteksi Otomatis Sesuai Sheet</option>
                        <option value="dashboard_2026">Dashboard Rekap Bulanan 2026</option>
                        <option value="perusahaan_asuransi">Piutang Perusahaan & Asuransi</option>
                        <option value="listrik_kantin">Listrik Kantin</option>
                        <option value="semua_rekapan">Semua Rekapan (10 Penjamin)</option>
                        <option value="piutang_pasien">Rincian Pasien & BPJS</option>
                      </select>
                    </div>
                  </div>

                  {/* Sample Rows Table Preview */}
                  <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#0d1216]">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800">
                        <tr>
                          {activeSheet.headers.map((h, i) => (
                            <th key={i} className="p-2 whitespace-nowrap border-r border-slate-200 dark:border-zinc-800 last:border-0">
                              {h || `Kolom ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                        {activeSheet.sampleRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                            {activeSheet.headers.map((_, cIdx) => (
                              <td key={cIdx} className="p-2 whitespace-nowrap truncate max-w-[140px] font-mono text-slate-700 dark:text-zinc-300 border-r border-slate-100 dark:border-zinc-800/60 last:border-0">
                                {String(row[cIdx] !== undefined ? row[cIdx] : '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

              {/* Import Options (Replace vs Append) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Metode Penulisan Data:</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Pilih apakah ingin menimpa seluruh data atau menggabungkan dengan entri sebelumnya.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      importMode === 'replace'
                        ? 'bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-700 dark:border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-[#161f28] text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Ganti Semua Data (Replace)
                  </button>
                  <button
                    onClick={() => setImportMode('append')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      importMode === 'append'
                        ? 'bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-700 dark:border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-[#161f28] text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Tambahkan / Merge
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-[#12181f]/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            Batal
          </button>
          
          <button
            onClick={handleExecuteImport}
            disabled={parsedSheets.length === 0 || isProcessing}
            className="px-5 py-2 rounded-lg bg-emerald-700 dark:bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-800 dark:hover:bg-emerald-500 transition shadow-2xs disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Update Dashboard Sekarang ({parsedSheets.reduce((sum, s) => sum + s.rowCount, 0)} Baris)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
