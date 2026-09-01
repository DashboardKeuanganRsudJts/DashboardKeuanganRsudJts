import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  FileQuestion,
  HelpCircle,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Search,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { DiscrepancyItem, LinkedMonitoringItem } from '../../types/ppn';
import { formatRupiah, formatDate } from '../../utils/ppnFormatters';

interface DiscrepancyAuditViewProps {
  discrepancies: DiscrepancyItem[];
  unlinkedCoretax: LinkedMonitoringItem[];
  unlinkedHutang: LinkedMonitoringItem[];
  onViewDetail: (item: LinkedMonitoringItem) => void;
}

export const DiscrepancyAuditView: React.FC<DiscrepancyAuditViewProps> = ({
  discrepancies,
  unlinkedCoretax,
  unlinkedHutang,
  onViewDetail,
}) => {
  const [activeTab, setActiveTab] = useState<'discrepancies' | 'unlinked_coretax' | 'unlinked_hutang'>('discrepancies');
  const [search, setSearch] = useState('');

  const filteredDiscrepancies = discrepancies.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.nomorInvoice.toLowerCase().includes(q) ||
      d.nomorFaktur.toLowerCase().includes(q) ||
      d.vendor.toLowerCase().includes(q) ||
      d.notes.toLowerCase().includes(q)
    );
  });

  const filteredUnlinkedCoretax = unlinkedCoretax.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.nomorFaktur.toLowerCase().includes(q) ||
      (u.nomorInvoice && u.nomorInvoice.toLowerCase().includes(q)) ||
      u.namaVendorCoretax.toLowerCase().includes(q)
    );
  });

  const filteredUnlinkedHutang = unlinkedHutang.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.nomorInvoice && u.nomorInvoice.toLowerCase().includes(q)) ||
      (u.namaVendorHutang && u.namaVendorHutang.toLowerCase().includes(q)) ||
      (u.nomorSP2D && u.nomorSP2D.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header Audit Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-5 shadow-lg border border-slate-800">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-purple-500"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  AUDIT & ANALISIS SELISIH REKONSILIASI
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Deteksi Anomali
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Pemeriksaan perbedaan nominal, faktur pajak tanpa data hutang, dan invoice hutang yang belum diterbitkan faktur pajaknya.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700 text-xs flex items-center gap-3">
              <div>
                <div className="text-[10px] text-slate-400">Total Selisih Nominal</div>
                <div className="text-sm font-extrabold text-amber-300 font-mono">
                  {formatRupiah(discrepancies.reduce((a, b) => a + Math.abs(b.selisih), 0))}
                </div>
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <div>
                <div className="text-[10px] text-slate-400">Total Anomali</div>
                <div className="text-sm font-extrabold text-rose-400">
                  {discrepancies.length + unlinkedCoretax.length + unlinkedHutang.length} Kasus
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#0f1418] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-zinc-800 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('discrepancies')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'discrepancies'
                  ? 'bg-white dark:bg-zinc-700 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Selisih Nominal ({discrepancies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('unlinked_coretax')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'unlinked_coretax'
                  ? 'bg-white dark:bg-zinc-700 text-amber-800 dark:text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
              <span>Faktur Tanpa Data Hutang ({unlinkedCoretax.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('unlinked_hutang')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'unlinked_hutang'
                  ? 'bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5 text-purple-500" />
              <span>Hutang Tanpa Faktur ({unlinkedHutang.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari dalam audit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>
        </div>

        {/* Tab 1: Selisih Nominal Nilai Coretax vs Hutang */}
        {activeTab === 'discrepancies' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5">No Invoice</th>
                  <th className="py-3 px-3">No Faktur (Coretax)</th>
                  <th className="py-3 px-3">Vendor / Rekanan</th>
                  <th className="py-3 px-3 text-right">Nilai Coretax (DPP+PPN)</th>
                  <th className="py-3 px-3 text-right">Nilai Data Hutang</th>
                  <th className="py-3 px-3 text-right bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 font-black">
                    Selisih Nominal (Rp)
                  </th>
                  <th className="py-3 px-3">Catatan Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredDiscrepancies.length > 0 ? (
                  filteredDiscrepancies.map((item) => (
                    <tr key={`disc-${item.id}`} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700">
                          {item.nomorInvoice}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                        {item.nomorFaktur}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-zinc-100 max-w-xs truncate">
                        {item.vendor}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-zinc-300">
                        {formatRupiah(item.nilaiCoretax)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-zinc-300">
                        {formatRupiah(item.nilaiHutang)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30">
                        {item.selisih > 0 ? `+${formatRupiah(item.selisih)}` : formatRupiah(item.selisih)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 text-[11px]">
                        <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {item.notes}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-zinc-500">
                      <div className="flex flex-col items-center gap-1.5">
                        <Sparkles className="w-6 h-6 text-emerald-500" />
                        <p className="font-bold text-slate-700 dark:text-zinc-300">Tidak ada perbedaan nominal ditemukan</p>
                        <p className="text-xs">Seluruh nilai dokumen Coretax dan data Hutang sesuai 100%.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Faktur Coretax Tanpa Data Hutang */}
        {activeTab === 'unlinked_coretax' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5">Masa</th>
                  <th className="py-3 px-3">Nomor Faktur (Coretax)</th>
                  <th className="py-3 px-3">Tanggal Faktur</th>
                  <th className="py-3 px-3">Vendor / Rekanan</th>
                  <th className="py-3 px-3 text-right">DPP (Rp)</th>
                  <th className="py-3 px-3 text-right text-emerald-800 dark:text-emerald-300 font-black">PPN Coretax</th>
                  <th className="py-3 px-3">No. Invoice di Coretax</th>
                  <th className="py-3 px-3">Status Masalah</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredUnlinkedCoretax.length > 0 ? (
                  filteredUnlinkedCoretax.map((item) => (
                    <tr key={`u-ctx-${item.id}`} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        Bln {item.periodeBulan}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {item.nomorFaktur}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-400">
                        {formatDate(item.tanggalFaktur)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-zinc-100 max-w-xs truncate">
                        {item.namaVendorCoretax}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-zinc-400">
                        {formatRupiah(item.dpp)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(item.ppn)}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                        {item.nomorInvoice || <span className="text-rose-500 italic">Tidak terisi</span>}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800">
                          <AlertOctagon className="w-3 h-3" />
                          Belum dicatat di Hutang RSUD
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onViewDetail(item)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white font-bold border border-indigo-200 dark:border-zinc-700 transition-colors"
                        >
                          Rincian
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 dark:text-zinc-500">
                      <div className="flex flex-col items-center gap-1.5">
                        <Sparkles className="w-6 h-6 text-emerald-500" />
                        <p className="font-bold text-slate-700 dark:text-zinc-300">Semua faktur Coretax terhubung</p>
                        <p className="text-xs">Tidak ada faktur pajak yang hilang dari catatan hutang.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Hutang Tanpa Faktur Pajak */}
        {activeTab === 'unlinked_hutang' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5">Nomor Invoice</th>
                  <th className="py-3 px-3">Vendor / Rekanan</th>
                  <th className="py-3 px-3 text-right">Nilai Tagihan Hutang</th>
                  <th className="py-3 px-3 text-center">Status Pembayaran</th>
                  <th className="py-3 px-3">Nomor SP2D</th>
                  <th className="py-3 px-3">Tanggal Bayar</th>
                  <th className="py-3 px-3">Status Masalah</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredUnlinkedHutang.length > 0 ? (
                  filteredUnlinkedHutang.map((item) => (
                    <tr key={`u-htg-${item.id}`} className="hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-indigo-950 dark:text-indigo-200">
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-zinc-800 rounded border border-indigo-200 dark:border-indigo-800">
                          {item.nomorInvoice}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-zinc-100 max-w-xs truncate">
                        {item.namaVendorHutang || item.namaVendorCoretax}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(item.nilaiInvoice || 0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                          {item.statusPembayaranHutang || 'BELUM DIBAYAR'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                        {item.nomorSP2D || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-400">
                        {item.tanggalPembayaran ? formatDate(item.tanggalPembayaran) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800">
                          <FileQuestion className="w-3 h-3" />
                          Faktur Pajak Belum Terbit di DJP
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onViewDetail(item)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white font-bold border border-indigo-200 dark:border-zinc-700 transition-colors"
                        >
                          Rincian
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-zinc-500">
                      <div className="flex flex-col items-center gap-1.5">
                        <Sparkles className="w-6 h-6 text-emerald-500" />
                        <p className="font-bold text-slate-700 dark:text-zinc-300">Semua transaksi hutang memiliki faktur</p>
                        <p className="text-xs">Tidak ada tagihan hutang yang belum terbit faktur pajaknya.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
