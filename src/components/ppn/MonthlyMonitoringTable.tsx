import React, { useState } from 'react';
import {
  Calendar,
  Table as TableIcon,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertOctagon,
} from 'lucide-react';
import { MonthlySummary } from '../../types/ppn';
import { formatRupiah, formatNumber, RAINBOW_MONTH_COLORS } from '../../utils/ppnFormatters';

interface MonthlyMonitoringTableProps {
  summaries: MonthlySummary[];
  selectedMonth: number | null;
  onSelectMonth: (month: number | null) => void;
}

export const MonthlyMonitoringTable: React.FC<MonthlyMonitoringTableProps> = ({
  summaries,
  selectedMonth,
  onSelectMonth,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'visual'>('table');

  const grandTotal = summaries.reduce(
    (acc, m) => {
      acc.jumlahFaktur += m.jumlahFaktur;
      acc.totalDPP += m.totalDPP;
      acc.totalPPN += m.totalPPN;
      acc.sudahDibayarCount += m.sudahDibayarCount;
      acc.sudahDibayarPPN += m.sudahDibayarPPN;
      acc.belumDibayarCount += m.belumDibayarCount;
      acc.belumDibayarPPN += m.belumDibayarPPN;
      acc.tidakDitemukanCount += m.tidakDitemukanCount;
      acc.tidakDitemukanPPN += m.tidakDitemukanPPN;
      return acc;
    },
    {
      jumlahFaktur: 0,
      totalDPP: 0,
      totalPPN: 0,
      sudahDibayarCount: 0,
      sudahDibayarPPN: 0,
      belumDibayarCount: 0,
      belumDibayarPPN: 0,
      tidakDitemukanCount: 0,
      tidakDitemukanPPN: 0,
    }
  );

  const grandPersentase =
    grandTotal.jumlahFaktur > 0
      ? Math.round((grandTotal.sudahDibayarCount / grandTotal.jumlahFaktur) * 100)
      : 0;

  return (
    <div className="bg-white dark:bg-[#0f1418] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-md overflow-hidden">
      {/* Rainbow Spectrum Ribbon Header */}
      <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-orange-400 via-amber-400 via-lime-500 via-emerald-500 via-teal-500 via-cyan-500 via-sky-500 via-blue-500 via-indigo-500 via-purple-500 to-pink-500"></div>

      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-pink-50/20 dark:from-zinc-900/80 dark:via-indigo-950/20 dark:to-zinc-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 text-white flex items-center justify-center shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
              <span>MONITORING BULANAN PPN 2026</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700">
                12 Masa Pajak 🌈
              </span>
              {selectedMonth !== null && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                  Filter: {summaries[selectedMonth - 1]?.namaBulan} 2026
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Rekapitulasi progres penyelesaian PPN per masa pajak Coretax terhubung Data Hutang
            </p>
          </div>
        </div>

        {/* View Switcher & Clear Filter */}
        <div className="flex items-center gap-2">
          {selectedMonth !== null && (
            <button
              onClick={() => onSelectMonth(null)}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors shadow-2xs"
            >
              Reset Filter Bulan
            </button>
          )}

          <div className="flex items-center bg-slate-200/90 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel Rainbow</span>
            </button>
            <button
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'visual'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Grafik Spektrum</span>
            </button>
          </div>
        </div>
      </div>

      {/* View: Table Mode */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700 text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Bulan Pajak</th>
                <th className="py-3.5 px-3 text-center">Faktur</th>
                <th className="py-3.5 px-3 text-right">Total DPP</th>
                <th className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-white">Total PPN (Coretax)</th>
                <th className="py-3.5 px-3 text-right text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 font-bold">
                  <span className="flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Sudah Dibayar
                  </span>
                </th>
                <th className="py-3.5 px-3 text-right text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 font-bold">
                  <span className="flex items-center justify-end gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Belum Dibayar
                  </span>
                </th>
                <th className="py-3.5 px-3 text-right text-rose-800 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/30 font-bold">
                  <span className="flex items-center justify-end gap-1">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Belum Terhubung
                  </span>
                </th>
                <th className="py-3.5 px-4 text-center">Realisasi Pelunasan</th>
                <th className="py-3.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {summaries.map((m) => {
                const isSelected = selectedMonth === m.bulan;
                const hasData = m.jumlahFaktur > 0;
                const rainbow = RAINBOW_MONTH_COLORS[m.bulan] || RAINBOW_MONTH_COLORS[1];

                return (
                  <tr
                    key={`month-${m.bulan}`}
                    className={`hover:bg-slate-50/90 dark:hover:bg-zinc-800/60 transition-colors ${
                      isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold' : ''
                    } ${!hasData ? 'opacity-40' : ''}`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-lg ${rainbow.badgeBg} ${rainbow.badgeText} text-xs flex items-center justify-center font-black shadow-xs`}
                      >
                        {m.bulan}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-zinc-100">{m.namaBulan} 2026</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${rainbow.bg} ${rainbow.text} border ${rainbow.border}`}>
                        {formatNumber(m.jumlahFaktur)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-zinc-400 font-mono font-medium">
                      {formatRupiah(m.totalDPP)}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white font-mono text-xs">
                      {formatRupiah(m.totalPPN)}
                    </td>
                    
                    {/* Sudah Dibayar */}
                    <td className="py-3 px-3 text-right bg-emerald-50/30 dark:bg-emerald-950/20 font-mono">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300">
                        {formatRupiah(m.sudahDibayarPPN)}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {m.sudahDibayarCount} Faktur
                      </div>
                    </td>

                    {/* Belum Dibayar */}
                    <td className="py-3 px-3 text-right bg-amber-50/30 dark:bg-amber-950/20 font-mono">
                      <div className="font-bold text-amber-800 dark:text-amber-300">
                        {formatRupiah(m.belumDibayarPPN)}
                      </div>
                      <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        {m.belumDibayarCount} Faktur
                      </div>
                    </td>

                    {/* Belum Terhubung */}
                    <td className="py-3 px-3 text-right bg-rose-50/30 dark:bg-rose-950/20 font-mono">
                      <div className="font-bold text-rose-800 dark:text-rose-300">
                        {formatRupiah(m.tidakDitemukanPPN)}
                      </div>
                      <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                        {m.tidakDitemukanCount} Faktur
                      </div>
                    </td>

                    {/* Realisasi Progress Bar */}
                    <td className="py-3 px-4 text-center">
                      {hasData ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-20 bg-slate-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden shadow-inner">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${m.persentaseSelesai}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-black text-slate-800 dark:text-zinc-200 w-9 text-right">
                            {m.persentaseSelesai}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">-</span>
                      )}
                    </td>

                    {/* Aksi Filter */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onSelectMonth(isSelected ? null : m.bulan)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all shadow-2xs ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-zinc-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-zinc-700'
                        }`}
                        title={`Filter data bulan ${m.namaBulan}`}
                      >
                        {isSelected ? '✓ Aktif' : 'Filter'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Footer Row */}
            <tfoot>
              <tr className="bg-slate-900 dark:bg-[#080b0d] text-white font-bold text-xs border-t-2 border-slate-700 dark:border-zinc-700">
                <td className="py-4 px-4 uppercase tracking-wider font-black text-amber-300">
                  🌟 TOTAL REKAPITULASI 2026
                </td>
                <td className="py-4 px-3 text-center text-white font-bold">
                  {formatNumber(grandTotal.jumlahFaktur)}
                </td>
                <td className="py-4 px-3 text-right font-mono text-slate-200 dark:text-zinc-300">
                  {formatRupiah(grandTotal.totalDPP)}
                </td>
                <td className="py-4 px-3 text-right font-mono text-emerald-300 font-black text-sm">
                  {formatRupiah(grandTotal.totalPPN)}
                </td>
                <td className="py-4 px-3 text-right font-mono text-emerald-400 bg-slate-800/90 dark:bg-zinc-900 font-bold">
                  <div>{formatRupiah(grandTotal.sudahDibayarPPN)}</div>
                  <div className="text-[10px] text-emerald-300 font-normal">
                    {grandTotal.sudahDibayarCount} Faktur
                  </div>
                </td>
                <td className="py-4 px-3 text-right font-mono text-amber-300 bg-slate-800/90 dark:bg-zinc-900 font-bold">
                  <div>{formatRupiah(grandTotal.belumDibayarPPN)}</div>
                  <div className="text-[10px] text-amber-200 font-normal">
                    {grandTotal.belumDibayarCount} Faktur
                  </div>
                </td>
                <td className="py-4 px-3 text-right font-mono text-rose-300 bg-slate-800/90 dark:bg-zinc-900 font-bold">
                  <div>{formatRupiah(grandTotal.tidakDitemukanPPN)}</div>
                  <div className="text-[10px] text-rose-200 font-normal">
                    {grandTotal.tidakDitemukanCount} Faktur
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/40 to-teal-500/40 text-emerald-300 border border-emerald-400/50 font-bold text-xs">
                    {grandPersentase}% Pelunasan
                  </span>
                </td>
                <td className="py-4 px-3 text-center">
                  {selectedMonth !== null && (
                    <button
                      onClick={() => onSelectMonth(null)}
                      className="text-xs text-amber-300 underline hover:text-white font-bold"
                    >
                      Reset
                    </button>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* View: Visual 12-Month Rainbow Spectrum Grid */
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-[#0a0d10]">
          {summaries.map((m) => {
            const hasData = m.jumlahFaktur > 0;
            const isSelected = selectedMonth === m.bulan;
            const rainbow = RAINBOW_MONTH_COLORS[m.bulan] || RAINBOW_MONTH_COLORS[1];

            return (
              <div
                key={`card-month-${m.bulan}`}
                onClick={() => onSelectMonth(isSelected ? null : m.bulan)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs hover:shadow-lg hover:scale-[1.01] ${
                  isSelected
                    ? `bg-white dark:bg-zinc-900 ${rainbow.border} ring-4 ring-indigo-500/20 shadow-md`
                    : hasData
                    ? `bg-white dark:bg-zinc-900 ${rainbow.border} hover:border-slate-400`
                    : 'bg-slate-100/60 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-xl ${rainbow.badgeBg} ${rainbow.badgeText} font-black text-xs flex items-center justify-center shadow-xs`}
                    >
                      {m.bulan}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {m.namaBulan} 2026
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${rainbow.bg} ${rainbow.text} border ${rainbow.border}`}
                  >
                    {m.jumlahFaktur} Faktur
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Total PPN Coretax:</div>
                  <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {formatRupiah(m.totalPPN)}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    <span>Pelunasan PPN</span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {m.persentaseSelesai}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden flex shadow-inner">
                    <div
                      style={{
                        width: `${
                          m.totalPPN > 0
                            ? (m.sudahDibayarPPN / m.totalPPN) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-emerald-500 h-full"
                      title={`Sudah Dibayar: ${formatRupiah(m.sudahDibayarPPN)}`}
                    ></div>
                    <div
                      style={{
                        width: `${
                          m.totalPPN > 0
                            ? (m.belumDibayarPPN / m.totalPPN) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-amber-500 h-full"
                      title={`Belum Dibayar: ${formatRupiah(m.belumDibayarPPN)}`}
                    ></div>
                    <div
                      style={{
                        width: `${
                          m.totalPPN > 0
                            ? (m.tidakDitemukanPPN / m.totalPPN) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-rose-500 h-full"
                      title={`Belum Terhubung: ${formatRupiah(m.tidakDitemukanPPN)}`}
                    ></div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-3 gap-1.5 text-[10px] text-center">
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-1.5 rounded-xl text-emerald-900 dark:text-emerald-300">
                    <div className="font-black text-xs">{m.sudahDibayarCount}</div>
                    <div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">Lunas</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-1.5 rounded-xl text-amber-900 dark:text-amber-300">
                    <div className="font-black text-xs">{m.belumDibayarCount}</div>
                    <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400">Hutang</div>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-1.5 rounded-xl text-rose-900 dark:text-rose-300">
                    <div className="font-black text-xs">{m.tidakDitemukanCount}</div>
                    <div className="text-[9px] font-bold text-rose-700 dark:text-rose-400">Unlinked</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
