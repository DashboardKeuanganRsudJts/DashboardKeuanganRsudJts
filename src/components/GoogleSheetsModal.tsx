import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Link, 
  FolderDown, 
  Sparkles, 
  Clock, 
  RefreshCw, 
  ExternalLink, 
  X, 
  Database,
  HelpCircle,
  Check,
  Plus
} from 'lucide-react';
import { SyncStatusInfo, PiutangRecord } from '../types/piutang';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { SpreadsheetImportService } from '../services/spreadsheetImportService';
import { formatDateTimeIndo } from '../utils/formatters';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SyncStatusInfo;
  onSaveConfig: (config: Partial<SyncStatusInfo>, freshData?: PiutangRecord[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onSaveConfig,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [sheetName, setSheetName] = useState('Data Piutang');
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [autoSyncDaily, setAutoSyncDaily] = useState(true);
  const [syncInterval, setSyncInterval] = useState(60);

  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string; modifiedTime: string }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [createdSpreadsheet, setCreatedSpreadsheet] = useState<{
    id: string;
    url: string;
    title: string;
    sheets: string[];
  } | null>(null);
  
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const storedToken = GoogleSheetsService.getStoredToken();
      setToken(storedToken);
      setSpreadsheetInput(syncConfig.spreadsheetId || '');
      setSheetName(syncConfig.sheetName || 'Data Piutang');
      setAutoSyncDaily(syncConfig.autoSyncDaily);
      setSyncInterval(syncConfig.syncIntervalMinutes || 60);

      if (storedToken) {
        fetchDriveFiles(storedToken);
      }
    }
  }, [isOpen, syncConfig]);

  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const accessToken = await GoogleSheetsService.requestGoogleAuth();
      setToken(accessToken);
      setSuccessMessage('Berhasil terhubung dengan Google Account!');
      await fetchDriveFiles(accessToken);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghubungkan akun Google.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const fetchDriveFiles = async (accessToken: string) => {
    setIsLoadingFiles(true);
    try {
      const files = await GoogleSheetsService.listSpreadsheetsFromDrive(accessToken);
      setDriveFiles(files);
    } catch (err: any) {
      console.warn('Could not list drive files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleCreateTemplate = async () => {
    let currentToken = token || GoogleSheetsService.getStoredToken();
    if (!currentToken) {
      try {
        currentToken = await GoogleSheetsService.requestGoogleAuth();
        setToken(currentToken);
      } catch (err: any) {
        setErrorMessage('Silakan hubungkan akun Google terlebih dahulu untuk membuat Spreadsheet di Google Drive.');
        return;
      }
    }

    setIsCreatingTemplate(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setCreatedSpreadsheet(null);

    try {
      const currentYear = new Date().getFullYear();
      const title = `SIM-RS RSUD Jatisari - Master Data Keuangan & Piutang ${currentYear}`;
      const result = await GoogleSheetsService.createRsudTemplateSpreadsheet(currentToken, title);
      
      setCreatedSpreadsheet({
        id: result.spreadsheetId,
        url: result.spreadsheetUrl,
        title,
        sheets: result.sheetNames || [
          'Data Piutang Pasien',
          'Perusahaan & Asuransi',
          'Listrik Kantin',
          'Semua Rekapan Penjamin',
          'Data Hutang 2026',
          'Rekap Bulanan 2026'
        ]
      });

      setSuccessMessage(`Google Spreadsheet baru berhasil dibuat di Google Drive Anda! Klik tombol "Buka Spreadsheet" untuk melihat dan mengedit.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat Google Spreadsheet baru di Google Drive.');
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleDownloadMasterTemplate = () => {
    try {
      const blob = SpreadsheetImportService.generateMasterWorkbook();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MASTER_FORMAT_RSUD_JATISARI_${new Date().getFullYear()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMessage('Gagal mengunduh template Excel: ' + (err.message || 'Unknown error'));
    }
  };

  const handleTestConnection = async (
    targetSpreadsheetId?: string,
    targetSheetName?: string,
    explicitToken?: string
  ) => {
    const rawId = targetSpreadsheetId || spreadsheetInput;
    const cleanId = GoogleSheetsService.extractSpreadsheetId(rawId);
    const targetSheet = targetSheetName || sheetName;
    const activeToken = explicitToken || token || GoogleSheetsService.getStoredToken();

    if (!cleanId) {
      setErrorMessage('Harap masukkan ID atau Link Google Spreadsheet.');
      return;
    }

    if (!activeToken) {
      setErrorMessage('Harap hubungkan akun Google terlebih dahulu.');
      return;
    }

    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const info = await GoogleSheetsService.getSpreadsheetInfo(activeToken, cleanId);
      setAvailableSheets(info.sheets);
      
      const chosenSheet = info.sheets.includes(targetSheet) ? targetSheet : (info.sheets[0] || 'Sheet1');
      setSheetName(chosenSheet);

      const rows = await GoogleSheetsService.fetchSheetRows(activeToken, cleanId, chosenSheet);
      setPreviewRows(rows.slice(0, 4));

      const parsed = GoogleSheetsService.parseSheetRowsToPiutang(rows);
      setSuccessMessage(`Koneksi Sukses! Terbaca ${parsed.length} baris data piutang dari spreadsheet "${info.title}".`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal terhubung ke Google Sheet tersebut.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndSync = async () => {
    const cleanId = GoogleSheetsService.extractSpreadsheetId(spreadsheetInput);
    if (!cleanId) {
      setErrorMessage('Harap masukkan ID atau Link Google Spreadsheet.');
      return;
    }

    const activeToken = token || GoogleSheetsService.getStoredToken();
    let parsedRecords: PiutangRecord[] | undefined;

    if (activeToken) {
      try {
        const rows = await GoogleSheetsService.fetchSheetRows(activeToken, cleanId, sheetName);
        parsedRecords = GoogleSheetsService.parseSheetRowsToPiutang(rows);
      } catch (err) {
        console.warn('Could not immediately fetch rows on save:', err);
      }
    }

    onSaveConfig({
      isConfigured: true,
      isConnected: !!activeToken,
      spreadsheetId: cleanId,
      spreadsheetName: driveFiles.find(f => f.id === cleanId)?.name || 'Google Sheet RSUD Jatisari',
      sheetName: sheetName || 'Data Piutang',
      autoSyncDaily,
      syncIntervalMinutes: syncInterval,
      lastSyncedAt: new Date().toISOString(),
      error: null
    }, parsedRecords);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-emerald-950/80 overflow-hidden my-auto text-slate-800 dark:text-zinc-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#12181f]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Integrasi & Sinkronisasi Google Sheets
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Hubungkan file spreadsheet piutang RSUD Jatisari untuk pembaruan harian otomatis
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-zinc-300">
          
          {/* Notification Banners */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed font-medium">{successMessage}</div>
            </div>
          )}

          {/* Step 1: Google Account Authentication */}
          <div className="bg-slate-50/70 dark:bg-[#12181f] p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Langkah 1</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Status Autentikasi Akun Google</span>
              </div>
              <div>
                {token ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                    <Check className="w-3.5 h-3.5" />
                    <span>Akun Terhubung</span>
                  </span>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isAuthenticating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 dark:bg-emerald-600 text-white font-semibold hover:bg-emerald-800 dark:hover:bg-emerald-500 transition shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAuthenticating ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Spreadsheet Selection Options */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Langkah 2: Pilih atau Buat Spreadsheet</span>

            {/* Quick Action: 1-Click Create RSUD Template */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Buat Google Spreadsheet Baru (Sesuai Seluruh Kolom Aplikasi)</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-400/80 mt-0.5 max-w-md">
                  Membuat spreadsheet baru langsung di Google Drive Anda lengkap dengan 6 lembar kerja dan semua kolom aplikasi: Piutang Pasien (18 kolom), Perusahaan (15 kolom), Listrik Kantin (10 kolom), Semua Rekapan (10 kolom), Hutang 2026 (10 kolom), dan Rekap Bulanan (8 kolom).
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadMasterTemplate}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline cursor-pointer"
                  >
                    <FolderDown className="w-3.5 h-3.5" />
                    <span>Atau unduh template file Excel (.xlsx)</span>
                  </button>
                </div>
              </div>
              <button
                onClick={handleCreateTemplate}
                disabled={isCreatingTemplate}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs tracking-wide shadow-md hover:shadow-emerald-600/25 transition-all whitespace-nowrap self-start sm:self-center disabled:opacity-60 cursor-pointer"
                title="Buat Google Spreadsheet baru dengan seluruh kolom aplikasi ini di Google Drive Anda"
              >
                {isCreatingTemplate ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                )}
                <span>{isCreatingTemplate ? 'Membuat Spreadsheet...' : 'Buat Google Spreadsheet Baru'}</span>
              </button>
            </div>

            {/* Created Spreadsheet Success Card */}
            {createdSpreadsheet && (
              <div className="p-4 rounded-xl bg-emerald-50/95 dark:bg-emerald-950/40 border-2 border-emerald-500/80 dark:border-emerald-500/60 shadow-md space-y-3 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        {createdSpreadsheet.title}
                      </h4>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                        Spreadsheet berhasil dibuat di Google Drive dengan {createdSpreadsheet.sheets.length} lembar kerja lengkap.
                      </p>
                    </div>
                  </div>
                  <a
                    href={createdSpreadsheet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition shrink-0"
                  >
                    <span>Buka Spreadsheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-1.5">
                    Kolom & Lembar Kerja yang Dibuat:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                    <div className="p-1.5 rounded bg-white/80 dark:bg-[#12181f] border border-emerald-200 dark:border-emerald-900/50">
                      <span className="font-semibold block text-slate-800 dark:text-zinc-200">1. Data Piutang Pasien</span>
                      <span className="text-[10px] text-slate-500">18 Kolom Terstandar</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/80 dark:bg-[#12181f] border border-emerald-200 dark:border-emerald-900/50">
                      <span className="font-semibold block text-slate-800 dark:text-zinc-200">2. Perusahaan & Asuransi</span>
                      <span className="text-[10px] text-slate-500">15 Kolom Mitra</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/80 dark:bg-[#12181f] border border-emerald-200 dark:border-emerald-900/50">
                      <span className="font-semibold block text-slate-800 dark:text-zinc-200">3. Listrik Kantin</span>
                      <span className="text-[10px] text-slate-500">10 Kolom Stand</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/80 dark:bg-[#12181f] border border-emerald-200 dark:border-emerald-900/50">
                      <span className="font-semibold block text-slate-800 dark:text-zinc-200">4. Semua Rekapan</span>
                      <span className="text-[10px] text-slate-500">10 Kolom Penjamin</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/80 dark:bg-[#12181f] border border-emerald-200 dark:border-emerald-900/50">
                      <span className="font-semibold block text-slate-800 dark:text-zinc-200">5. Data Hutang 2026</span>
                      <span className="text-[10px] text-slate-500">10 Kolom Pengadaan</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/80 dark:bg-[#12181f] border border-emerald-200 dark:border-emerald-900/50">
                      <span className="font-semibold block text-slate-800 dark:text-zinc-200">6. Rekap Bulanan</span>
                      <span className="text-[10px] text-slate-500">8 Kolom Rekapitulasi</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 dark:text-zinc-400 text-[11px]">Ingin menggunakan spreadsheet baru ini untuk sinkronisasi otomatis?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSpreadsheetInput(createdSpreadsheet.id);
                      setSheetName('Data Piutang Pasien');
                      handleTestConnection(createdSpreadsheet.id, 'Data Piutang Pasien');
                    }}
                    className="px-2.5 py-1 rounded bg-white dark:bg-[#18222c] border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-[11px] font-semibold transition self-start sm:self-auto cursor-pointer"
                  >
                    Gunakan untuk Sinkronisasi
                  </button>
                </div>
              </div>
            )}

            {/* If files from Drive available */}
            {driveFiles.length > 0 && (
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-semibold mb-1">
                  Pilih dari Google Drive Anda:
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-zinc-800 rounded-xl divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-[#12181f]">
                  {driveFiles.map((file) => {
                    const isSelected = spreadsheetInput.includes(file.id);
                    return (
                      <div
                        key={file.id}
                        onClick={() => {
                          setSpreadsheetInput(file.id);
                          handleTestConnection(file.id);
                        }}
                        className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition ${
                          isSelected ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate text-slate-800 dark:text-zinc-200">{file.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono shrink-0 ml-2">
                          ID: {file.id.substring(0, 8)}...
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input URL or Spreadsheet ID directly */}
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-semibold mb-1">
                Atau Masukkan Link / ID Google Spreadsheet:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    value={spreadsheetInput}
                    onChange={(e) => setSpreadsheetInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <button
                  onClick={() => handleTestConnection()}
                  disabled={isTesting || !spreadsheetInput}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 dark:bg-zinc-800 text-white font-semibold hover:bg-slate-900 dark:hover:bg-zinc-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Uji Koneksi</span>
                </button>
              </div>
            </div>

            {/* Sheet Tab Picker */}
            {availableSheets.length > 0 && (
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-semibold mb-1">
                  Nama Lembar Kerja (Sheet Tab):
                </label>
                <select
                  value={sheetName}
                  onChange={(e) => {
                    setSheetName(e.target.value);
                    handleTestConnection(undefined, e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs font-semibold bg-white dark:bg-[#12181f] text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                >
                  {availableSheets.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

          </div>

          {/* Step 3: Daily Auto-Sync Settings */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
              Langkah 3: Pengaturan Pembaruan Otomatis Setiap Hari
            </span>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Sinkronisasi Otomatis Setiap Hari</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Dashboard akan secara berkala mengambil data piutang terbaru dari Google Sheets saat aplikasi dibuka atau di latar belakang.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncDaily}
                  onChange={(e) => setAutoSyncDaily(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {autoSyncDaily && (
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-zinc-400 font-medium">Frekuensi Cek Pembaruan:</span>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(Number(e.target.value))}
                  className="px-2.5 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs font-semibold bg-white dark:bg-[#161f28] text-slate-800 dark:text-zinc-200"
                >
                  <option value={30}>Setiap 30 Menit</option>
                  <option value={60}>Setiap 1 Jam</option>
                  <option value={360}>Setiap 6 Jam</option>
                  <option value={1440}>Setiap Hari (24 Jam Sekali)</option>
                </select>
              </div>
            )}
          </div>

          {/* Preview of rows if available */}
          {previewRows.length > 0 && (
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-semibold mb-1">
                Pratinjau Data yang Terbaca ({previewRows.length - 1} contoh baris):
              </label>
              <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-lg">
                <table className="w-full text-[10px] text-left">
                  <thead className="bg-slate-100 dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      {previewRows[0]?.slice(0, 6).map((h, i) => (
                        <th key={i} className="p-2 whitespace-nowrap">{String(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {previewRows.slice(1, 4).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                        {row.slice(0, 6).map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 whitespace-nowrap truncate max-w-[120px] font-mono text-slate-700 dark:text-zinc-300">
                            {String(cell || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-[#12181f]/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            Tutup
          </button>
          
          <button
            onClick={handleSaveAndSync}
            disabled={!spreadsheetInput}
            className="px-5 py-2 rounded-lg bg-emerald-700 dark:bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-800 dark:hover:bg-emerald-500 transition shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan & Sinkronkan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
