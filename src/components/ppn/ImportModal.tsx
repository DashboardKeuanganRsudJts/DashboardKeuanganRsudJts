import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { CoretaxPPNRecord, DataHutangRecord } from '../../types/ppn';
import { parseCoretaxFile, parseHutangFile, parseHutangText, downloadCoretaxTemplate, downloadHutangTemplate } from '../../utils/ppnExcelHelper';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'coretax' | 'hutang';
  onImportCoretax?: (records: CoretaxPPNRecord[]) => void;
  onImportHutang?: (records: DataHutangRecord[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onImportCoretax,
  onImportHutang,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (type === 'coretax') {
        const records = await parseCoretaxFile(file);
        if (records.length === 0) {
          setErrorMsg('Tidak ada baris data yang berhasil dibaca. Pastikan format kolom sesuai.');
        } else {
          setSuccessMsg(`Berhasil membaca ${records.length} faktur pajak Coretax!`);
          if (onImportCoretax) {
            onImportCoretax(records);
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        }
      } else {
        const records = await parseHutangFile(file);
        if (records.length === 0) {
          setErrorMsg('Tidak ada baris data yang berhasil dibaca. Pastikan format kolom sesuai.');
        } else {
          setSuccessMsg(`Berhasil membaca ${records.length} baris data hutang!`);
          if (onImportHutang) {
            onImportHutang(records);
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Gagal memproses file: ${err.message || 'Format tidak valid'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Teks inputan tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (type === 'hutang') {
        const records = parseHutangText(pastedText);
        if (records.length === 0) {
          setErrorMsg('Tidak ada data yang berhasil diproses dari teks yang ditempel.');
        } else {
          setSuccessMsg(`Berhasil mengimpor ${records.length} data hutang!`);
          if (onImportHutang) {
            onImportHutang(records);
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        }
      } else {
        const records = parseHutangText(pastedText) as any;
        if (records.length === 0) {
          setErrorMsg('Tidak ada data yang berhasil diproses dari teks yang ditempel.');
        } else {
          setSuccessMsg(`Berhasil mengimpor ${records.length} data Coretax!`);
          if (onImportCoretax) {
            onImportCoretax(records);
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(`Gagal memproses teks: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f1418] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-zinc-900 dark:to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Import Data {type === 'coretax' ? 'Faktur Pajak Coretax' : 'Data Hutang & SP2D'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Mendukung file Excel (.xlsx, .xls), CSV, atau Paste langsung dari Spreadsheet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 bg-slate-100/70 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unggah File Excel / CSV</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Data Teks (TSV / CSV)</span>
            </button>
          </div>

          <button
            onClick={type === 'coretax' ? downloadCoretaxTemplate : downloadHutangTemplate}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Template</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'file' ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-8 text-center hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-zinc-900/40">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Pilih atau seret file ke sini
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Format file: Excel (.xlsx, .xls) atau CSV
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {isLoading ? 'Sedang Memproses...' : 'Pilih File dari Komputer'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-slate-700 dark:text-zinc-300 font-bold">
                Salin & Tempel Baris dari Excel / Google Sheets:
              </label>
              <textarea
                rows={7}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Salin baris tabel dari spreadsheet dan tempel (Ctrl+V) di sini..."
                className="w-full p-3 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {isLoading ? 'Memproses Data...' : 'Impor Data Tempel'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
