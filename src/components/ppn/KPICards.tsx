import React from 'react';
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileQuestion,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { OverallStats } from '../../types/ppn';
import { formatRupiah, formatNumber } from '../../utils/ppnFormatters';

interface KPICardsProps {
  stats: OverallStats;
  onFilterStatus?: (statusKey: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats, onFilterStatus }) => {
  const percentPaid =
    stats.totalFaktur > 0
      ? Math.round((stats.sudahDibayarCount / stats.totalFaktur) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* SECTION 1: TOTAL DATA CORETAX (Master PPN Truth) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50/70 to-cyan-50 dark:from-teal-950 dark:via-[#061914] dark:to-emerald-950 text-slate-900 dark:text-white shadow-md border border-teal-200 dark:border-teal-900/60">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-tl from-cyan-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Rainbow Spectrum Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 via-cyan-400 via-blue-500 to-emerald-500"></div>

        <div className="p-5 sm:p-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-teal-200/80 dark:border-slate-700/60 pb-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 p-0.5 shadow-md shadow-emerald-500/20">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center text-teal-700 dark:text-emerald-300">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide">
                    TOTAL DATA CORETAX 2026
                  </h2>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-emerald-500/30 text-teal-800 dark:text-emerald-300 font-bold border border-teal-300 dark:border-emerald-400/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600 dark:text-amber-300" />
                    Master Data PPN
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Sumber kebenaran resmi nilai DPP dan PPN Faktur Pajak dari DJP Coretax 2026
                </p>
              </div>
            </div>

            {/* Realisasi Pelunasan Gauge */}
            <div className="flex items-center gap-3 text-xs bg-white/90 dark:bg-slate-800/90 px-4 py-2 rounded-xl border border-teal-200 dark:border-slate-700 shadow-2xs">
              <TrendingUp className="w-5 h-5 text-teal-600 dark:text-emerald-400" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Realisasi Pelunasan:</span>
                  <span className="font-extrabold text-teal-800 dark:text-emerald-300 text-sm">
                    {percentPaid}%
                  </span>
                </div>
                <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ({stats.sudahDibayarCount}/{stats.totalFaktur} Faktur)
              </span>
            </div>
          </div>

          {/* 3 Main Metrics for Coretax */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/90 dark:bg-slate-800/80 rounded-xl p-4 border border-teal-200 dark:border-cyan-500/30 hover:border-teal-400 dark:hover:border-cyan-400/60 transition-all shadow-xs group">
              <div className="flex items-center justify-between text-xs font-bold text-teal-800 dark:text-cyan-300">
                <span>Jumlah Faktur Pajak Coretax</span>
                <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-cyan-400 group-hover:animate-ping"></span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {formatNumber(stats.totalFaktur)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">dokumen</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Periode Tahun:</span>
                <span className="font-bold font-mono text-teal-800 dark:text-cyan-200">Jan – Des 2026</span>
              </div>
            </div>

            <div className="bg-white/90 dark:bg-slate-800/80 rounded-xl p-4 border border-amber-200 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-400/60 transition-all shadow-xs group">
              <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                <span>Total DPP (Dasar Pengenaan Pajak)</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 group-hover:animate-ping"></span>
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {formatRupiah(stats.totalDPP)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Dasar Nilai Transaksi:</span>
                <span className="font-bold text-amber-800 dark:text-amber-200">DPP Coretax</span>
              </div>
            </div>

            <div className="bg-emerald-50/80 dark:bg-gradient-to-br dark:from-emerald-950/60 dark:via-slate-800 dark:to-teal-950/60 rounded-xl p-4 border border-emerald-300 dark:border-emerald-500/40 hover:border-emerald-400 dark:hover:border-emerald-400/80 transition-all shadow-xs group">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                <span>Total PPN Tertera (Coretax)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 group-hover:animate-ping"></span>
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-700 dark:text-emerald-300">
                  {formatRupiah(stats.totalPPN)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-emerald-200/80 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-400/90 flex items-center justify-between">
                <span>Kebenaran PPN:</span>
                <span className="font-bold text-emerald-900 dark:text-emerald-200">100% Coretax DJP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: STATUS PEMBAYARAN SUMMARY */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 tracking-tight uppercase flex items-center gap-1.5">
              <span>Status Pembayaran & Rekonsiliasi Data Hutang</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                Live Status
              </span>
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            💡 Klik kartu untuk filter
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* SUDAH DIBAYAR */}
          <div
            onClick={() => onFilterStatus && onFilterStatus('SUDAH_DIBAYAR')}
            className="group cursor-pointer bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-teal-950/20 rounded-2xl p-4 border-2 border-emerald-400 dark:border-emerald-700/60 shadow-xs hover:shadow-lg hover:shadow-emerald-500/15 hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SUDAH DIBAYAR
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {stats.sudahDibayarCount}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 font-sans">Faktur Pajak</span>
              </div>
              <div className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-1 rounded-lg inline-block">
                PPN: {formatRupiah(stats.sudahDibayarPPN)}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
              <span>Status SP2D Terbit</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Lihat <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* BELUM DIBAYAR */}
          <div
            onClick={() => onFilterStatus && onFilterStatus('BELUM_DIBAYAR')}
            className="group cursor-pointer bg-gradient-to-br from-amber-50 via-white to-orange-50/40 dark:from-amber-950/30 dark:via-zinc-900 dark:to-orange-950/20 rounded-2xl p-4 border-2 border-amber-400 dark:border-amber-700/60 shadow-xs hover:shadow-lg hover:shadow-amber-500/15 hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-xs">
                <Clock className="w-3.5 h-3.5" />
                BELUM DIBAYAR
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {stats.belumDibayarCount}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 font-sans">Faktur Pajak</span>
              </div>
              <div className="text-xs font-bold font-mono text-amber-800 dark:text-amber-300 mt-1 bg-amber-100/70 dark:bg-amber-900/40 px-2 py-1 rounded-lg inline-block">
                PPN: {formatRupiah(stats.belumDibayarPPN)}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-amber-100 dark:border-amber-900/40 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
              <span>Saldo Hutang 2026</span>
              <span className="font-bold text-amber-800 dark:text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Lihat <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* TIDAK DITEMUKAN DI DATA HUTANG */}
          <div
            onClick={() => onFilterStatus && onFilterStatus('TIDAK_DITEMUKAN_DI_HUTANG')}
            className="group cursor-pointer bg-gradient-to-br from-rose-50 via-white to-pink-50/40 dark:from-rose-950/30 dark:via-zinc-900 dark:to-pink-950/20 rounded-2xl p-4 border-2 border-rose-400 dark:border-rose-700/60 shadow-xs hover:shadow-lg hover:shadow-rose-500/15 hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-xs">
                <AlertOctagon className="w-3.5 h-3.5" />
                BELUM DI DATA HUTANG
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {stats.tidakDitemukanCount}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 font-sans">Faktur Pajak</span>
              </div>
              <div className="text-xs font-bold font-mono text-rose-700 dark:text-rose-300 mt-1 bg-rose-100/70 dark:bg-rose-900/40 px-2 py-1 rounded-lg inline-block">
                PPN: {formatRupiah(stats.tidakDitemukanPPN)}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-rose-100 dark:border-rose-900/40 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
              <span>Invoice Belum Tercatat</span>
              <span className="font-bold text-rose-700 dark:text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Cek <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* INVOICE TANPA FAKTUR PAJAK */}
          <div
            onClick={() => onFilterStatus && onFilterStatus('HUTANG_TANPA_FAKTUR')}
            className="group cursor-pointer bg-gradient-to-br from-purple-50 via-white to-indigo-50/40 dark:from-purple-950/30 dark:via-zinc-900 dark:to-indigo-950/20 rounded-2xl p-4 border-2 border-purple-400 dark:border-purple-700/60 shadow-xs hover:shadow-lg hover:shadow-purple-500/15 hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-purple-600 text-white shadow-xs">
                <FileQuestion className="w-3.5 h-3.5" />
                HUTANG TANPA FAKTUR
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <FileQuestion className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {stats.hutangTanpaFakturCount}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 font-sans">Invoice</span>
              </div>
              <div className="text-xs font-bold font-mono text-purple-700 dark:text-purple-300 mt-1 bg-purple-100/70 dark:bg-purple-900/40 px-2 py-1 rounded-lg inline-block">
                Di Data Hutang 2026
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
              <span>Faktur Belum Terbit</span>
              <span className="font-bold text-purple-700 dark:text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Audit <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
