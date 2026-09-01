import React from 'react';
import {
  X,
  Receipt,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileQuestion,
  Sparkles,
  Calendar,
  Building,
  CreditCard,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { LinkedMonitoringItem } from '../../types/ppn';
import { formatRupiah, formatDate, NAMA_BULAN, RAINBOW_MONTH_COLORS } from '../../utils/ppnFormatters';

interface DetailModalProps {
  item: LinkedMonitoringItem | null;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const rainbow = RAINBOW_MONTH_COLORS[item.periodeBulan] || RAINBOW_MONTH_COLORS[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f1418] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Rainbow Spectrum Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 via-cyan-400 via-blue-500 to-purple-500"></div>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Rincian Rekonsiliasi Faktur & Hutang
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${rainbow.badgeBg} ${rainbow.badgeText}`}>
                  Masa {item.periodeBulan} - {NAMA_BULAN[item.periodeBulan - 1]}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Pencocokan data Coretax DJP & Data Hutang RSUD Jatisari 2026
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              item.status === 'SUDAH_DIBAYAR'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : item.status === 'BELUM_DIBAYAR'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.status === 'SUDAH_DIBAYAR' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : item.status === 'BELUM_DIBAYAR' ? (
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <AlertOctagon className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <div>
                <div className="text-xs font-black uppercase tracking-wide">
                  Status: {item.statusLabel}
                </div>
                <p className="text-[11px] opacity-90 mt-0.5">{item.notes}</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-[10px] uppercase font-bold opacity-75">PPN Coretax</div>
              <div className="text-base font-extrabold">{formatRupiah(item.ppn)}</div>
            </div>
          </div>

          {/* Side-by-Side: Coretax vs Hutang */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coretax Block */}
            <div className="bg-slate-50 dark:bg-zinc-900/80 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Data Faktur Coretax (Master)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded">
                  100% DJP
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Nomor Faktur:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{item.nomorFaktur}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Tanggal Faktur:</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">{formatDate(item.tanggalFaktur)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Vendor / Penjual:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[160px]">{item.namaVendorCoretax}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">NPWP Penjual:</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">{item.npwpVendor || '-'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">DPP:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(item.dpp)}</span>
                </div>

                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-zinc-700">
                  <span className="text-emerald-800 dark:text-emerald-400 font-bold">PPN Coretax:</span>
                  <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                    {formatRupiah(item.ppn)}
                  </span>
                </div>
              </div>
            </div>

            {/* Hutang Block */}
            <div className="bg-slate-50 dark:bg-zinc-900/80 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span>Data Hutang RSUD</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded">
                  Google Sheets
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Nomor Invoice:</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                    {item.nomorInvoice || <span className="text-rose-500 italic">Tidak Terisi</span>}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Status Bayar Hutang:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {item.statusPembayaranHutang || <span className="text-rose-500">Belum Ada Data</span>}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Nomor SP2D:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {item.nomorSP2D || '-'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Tanggal Pembayaran:</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">
                    {item.tanggalPembayaran ? formatDate(item.tanggalPembayaran) : '-'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Jenis Belanja:</span>
                  <span className="text-slate-700 dark:text-zinc-300">{item.jenisHutang || 'Belanja BLUD'}</span>
                </div>

                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-zinc-700">
                  <span className="text-slate-600 dark:text-zinc-400 font-bold">Total Nilai Tagihan:</span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                    {formatRupiah(item.nilaiInvoice || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
};
