import React, { useState } from 'react';
import {
  Plus,
  Upload,
  ExternalLink,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  Clock,
  FileCheck2,
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { DataHutangRecord } from '../../types/ppn';
import { formatRupiah, formatDate, formatNumber } from '../../utils/ppnFormatters';
import { DEFAULT_GOOGLE_SHEETS_URL } from '../../utils/googleSheetsSync';

interface HutangDataViewProps {
  data: DataHutangRecord[];
  onAddRecord: () => void;
  onEditRecord: (record: DataHutangRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenUpload: () => void;
  onSyncGoogleSheets?: () => Promise<void> | void;
  isSyncing?: boolean;
  lastSyncedAt?: string;
  sheetUrl?: string;
  onUpdateSheetUrl?: (newUrl: string) => void;
  canEdit?: boolean;
}

export const HutangDataView: React.FC<HutangDataViewProps> = ({
  data,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onOpenUpload,
  onSyncGoogleSheets,
  isSyncing = false,
  lastSyncedAt,
  sheetUrl = DEFAULT_GOOGLE_SHEETS_URL,
  onUpdateSheetUrl,
  canEdit = false,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showUrlEditor, setShowUrlEditor] = useState(false);
  const [inputUrl, setInputUrl] = useState(sheetUrl);

  const filteredData = data.filter((item) => {
    if (statusFilter !== 'ALL' && item.statusPembayaran !== statusFilter) {
      return false;
    }
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      return (
        item.nomorInvoice.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q) ||
        (item.nomorSP2D && item.nomorSP2D.toLowerCase().includes(q)) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
        (item.jenisHutang && item.jenisHutang.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalNilaiInvoice = data.reduce((acc, it) => acc + (it.nilaiInvoice || 0), 0);
  const sudahDibayarList = data.filter((it) => it.statusPembayaran === 'SUDAH DIBAYAR');
  const belumDibayarList = data.filter((it) => it.statusPembayaran !== 'SUDAH DIBAYAR');

  const totalSudahDibayar = sudahDibayarList.reduce((acc, it) => acc + (it.nilaiInvoice || 0), 0);
  const totalBelumDibayar = belumDibayarList.reduce((acc, it) => acc + (it.nilaiInvoice || 0), 0);
  const totalWithSP2D = data.filter((it) => it.nomorSP2D && it.nomorSP2D.trim() !== '').length;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSheetUrl && inputUrl.trim()) {
      onUpdateSheetUrl(inputUrl.trim());
      setShowUrlEditor(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Live Google Sheets Integration Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 shadow-lg border border-slate-800">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 via-emerald-400 via-amber-400 to-purple-500"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  DATA HUTANG & REALISASI SP2D (GOOGLE SHEETS)
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Sync Connected
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Data master pembayaran hutang RSUD Jatisari 2026. Nomor Invoice & SP2D otomatis disinkronkan dari Google Sheets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSyncGoogleSheets && canEdit && (
              <button
                onClick={() => onSyncGoogleSheets()}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Google Sheets'}</span>
              </button>
            )}

            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-[1.02]"
              title="Buka Spreadsheet di Google Sheets"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Buka Sheet</span>
            </a>

            {canEdit && (
              <>
                <button
                  onClick={onOpenUpload}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all hover:scale-[1.02]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload / Paste</span>
                </button>

                <button
                  onClick={onAddRecord}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tambah Manual</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sync Info Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">Link Terhubung:</span>
            <span className="font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 truncate max-w-xs sm:max-w-md">
              {sheetUrl}
            </span>
            <button
              onClick={() => setShowUrlEditor(!showUrlEditor)}
              className="text-[11px] text-cyan-400 hover:underline font-semibold"
            >
              {showUrlEditor ? 'Tutup' : 'Ubah Link'}
            </button>
          </div>

          {lastSyncedAt && (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Terakhir disinkronkan: <b className="text-slate-200">{lastSyncedAt}</b></span>
            </div>
          )}
        </div>

        {/* URL Editor Drawer */}
        {showUrlEditor && (
          <form onSubmit={handleSaveUrl} className="mt-3 p-3 bg-slate-800/90 rounded-xl border border-slate-700 flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:ring-2 focus:ring-cyan-500 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Simpan & Sinkron
            </button>
          </form>
        )}
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#0f1418] p-4 rounded-2xl border-2 border-blue-100 dark:border-blue-950/60 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center justify-between">
            <span>Total Baris Invoice Hutang</span>
            <FileCheck2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{formatNumber(data.length)} <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Invoice</span></div>
          <div className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-1">Total: {formatRupiah(totalNilaiInvoice)}</div>
        </div>

        <div className="bg-white dark:bg-[#0f1418] p-4 rounded-2xl border-2 border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between">
            <span>Sudah Dibayar (Lunas)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-1 font-mono">{formatRupiah(totalSudahDibayar)}</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">{sudahDibayarList.length} Tagihan Lunas</div>
        </div>

        <div className="bg-white dark:bg-[#0f1418] p-4 rounded-2xl border-2 border-purple-100 dark:border-purple-950/60 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-500"></div>
          <div className="text-xs text-purple-900 dark:text-purple-300 font-semibold flex items-center justify-between">
            <span>Terbit Nomor SP2D</span>
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-900 dark:text-purple-300 mt-1">{formatNumber(totalWithSP2D)} <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">SP2D</span></div>
          <div className="text-xs text-purple-700 dark:text-purple-400 font-medium mt-1">Siap verifikasi pencocokan PPN</div>
        </div>

        <div className="bg-white dark:bg-[#0f1418] p-4 rounded-2xl border-2 border-amber-100 dark:border-amber-950/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center justify-between">
            <span>Sisa Saldo Belum Dibayar</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-800 dark:text-amber-300 mt-1 font-mono">{formatRupiah(totalBelumDibayar)}</div>
          <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">{belumDibayarList.length} Tagihan Menunggu Realisasi</div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-[#0f1418] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. Invoice, Vendor, SP2D, Jenis Pengadaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status ({data.length})</option>
              <option value="SUDAH DIBAYAR">🟢 SUDAH DIBAYAR ({sudahDibayarList.length})</option>
              <option value="BELUM DIBAYAR">🟡 BELUM DIBAYAR ({belumDibayarList.length})</option>
              <option value="DIBAYAR SEBAGIAN">🔵 DIBAYAR SEBAGIAN ({data.filter((i) => i.statusPembayaran === 'DIBAYAR SEBAGIAN').length})</option>
            </select>

            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 px-2.5 py-1 bg-slate-200/70 dark:bg-zinc-800 rounded-lg">
              {filteredData.length} baris
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white font-bold text-[11px] uppercase tracking-wider select-none">
                <th className="py-3.5 px-3 text-center w-12 text-slate-300">No</th>
                <th className="py-3.5 px-3.5 bg-indigo-800/80 text-white font-extrabold shadow-inner whitespace-nowrap">
                  Nomor Invoice (Kunci Rekonsiliasi)
                </th>
                <th className="py-3.5 px-3 whitespace-nowrap">Tanggal Invoice</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Vendor / Rekanan</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap">Nilai Invoice (Rp)</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Status Pembayaran</th>
                <th className="py-3.5 px-3.5 bg-blue-800/80 text-white font-extrabold shadow-inner whitespace-nowrap">
                  Nomor SP2D
                </th>
                <th className="py-3.5 px-3 whitespace-nowrap">Tanggal Bayar</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Keterangan / Pengadaan</th>
                {canEdit && (
                  <th className="py-3.5 px-3 text-center whitespace-nowrap w-20">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-blue-50/40 dark:hover:bg-zinc-800/60 transition-colors group">
                    <td className="py-3 px-3 text-center text-slate-400 dark:text-zinc-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 font-mono font-bold text-indigo-950 dark:text-indigo-200 whitespace-nowrap border-x border-indigo-100 dark:border-indigo-900/40">
                      <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                        {item.nomorInvoice}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {formatDate(item.tanggalInvoice)}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-zinc-100 max-w-xs truncate" title={item.vendor}>
                      {item.vendor}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatRupiah(item.nilaiInvoice)}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {item.statusPembayaran === 'SUDAH DIBAYAR' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          SUDAH DIBAYAR
                        </span>
                      ) : item.statusPembayaran === 'DIBAYAR SEBAGIAN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                          <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          DIBAYAR SEBAGIAN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          BELUM DIBAYAR
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 bg-blue-50/50 dark:bg-blue-950/20 font-mono text-slate-800 dark:text-zinc-200 font-semibold whitespace-nowrap border-x border-blue-100 dark:border-blue-900/40">
                      {item.nomorSP2D ? (
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs text-[11px]">
                          {item.nomorSP2D}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-500 italic text-[11px]">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {item.tanggalPembayaran ? formatDate(item.tanggalPembayaran) : '-'}
                    </td>

                    <td className="py-3 px-3 max-w-xs truncate text-slate-600 dark:text-zinc-400 text-[11px]" title={item.keterangan || item.jenisHutang}>
                      {item.keterangan || item.jenisHutang || 'Barjas BLUD'}
                    </td>

                    {canEdit && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditRecord(item)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit Data Hutang"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                            title="Hapus Data Hutang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HelpCircle className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
                        Tidak ada data invoice hutang yang cocok dengan pencarian
                      </p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">
                        Coba periksa kata kunci pencarian atau reset filter status
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-zinc-400 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-zinc-300">Total Ditampilkan:</span>
            <span className="font-bold text-slate-900 dark:text-white">{filteredData.length} dari {data.length} Invoice</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-500 dark:text-zinc-400">Total Nilai: </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatRupiah(filteredData.reduce((acc, it) => acc + (it.nilaiInvoice || 0), 0))}
              </span>
            </div>
            <div>
              <span className="text-emerald-800 dark:text-emerald-400 font-medium">Realisasi SP2D: </span>
              <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                {formatRupiah(
                  filteredData
                    .filter((it) => it.statusPembayaran === 'SUDAH DIBAYAR')
                    .reduce((acc, it) => acc + (it.nilaiInvoice || 0), 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
