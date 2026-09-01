import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Search,
  HelpCircle,
  Sparkles,
  Layers,
  Key,
  UserCheck,
} from 'lucide-react';
import { CoretaxPPNRecord } from '../../types/ppn';
import { formatRupiah, formatDate, formatNumber, NAMA_BULAN } from '../../utils/ppnFormatters';
import { downloadCoretaxTemplate } from '../../utils/ppnExcelHelper';

interface CoretaxDataViewProps {
  data: CoretaxPPNRecord[];
  onAddRecord: () => void;
  onEditRecord: (record: CoretaxPPNRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenUpload: () => void;
}

export const CoretaxDataView: React.FC<CoretaxDataViewProps> = ({
  data,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onOpenUpload,
}) => {
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredData = data.filter((item) => {
    const masa = item.masaPajak || item.periodeBulan;
    if (selectedMonth !== null && masa !== selectedMonth) {
      return false;
    }
    if (selectedStatus !== 'ALL') {
      const status = item.statusFaktur || 'Normal';
      if (status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
    }
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const npwp = (item.npwpPenjual || item.npwpVendor || '').toLowerCase();
      const nama = (item.namaPenjual || item.namaVendor || '').toLowerCase();
      const faktur = item.nomorFaktur.toLowerCase();
      const inv = (item.nomorInvoice || '').toLowerCase();
      const perekam = (item.perekam || '').toLowerCase();
      const ket = (item.keterangan || '').toLowerCase();

      return (
        npwp.includes(q) ||
        nama.includes(q) ||
        faktur.includes(q) ||
        inv.includes(q) ||
        perekam.includes(q) ||
        ket.includes(q)
      );
    }
    return true;
  });

  const totalDPP = data.reduce((acc, it) => acc + (it.dpp || 0), 0);
  const totalPPN = data.reduce((acc, it) => acc + (it.ppn || 0), 0);
  const totalHargaJual = data.reduce((acc, it) => acc + (it.hargaJual || it.dpp || 0), 0);
  const totalNilaiInvoice = data.reduce(
    (acc, it) => acc + (it.nilaiInvoiceCoretax || (it.dpp || 0) + (it.ppn || 0)),
    0
  );
  const totalInvoiceTerisi = data.filter((it) => it.nomorInvoice && it.nomorInvoice.trim() !== '').length;

  const getMonthRainbowBadge = (m: number) => {
    const rainbowColors = [
      'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
      'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      'bg-lime-100 dark:bg-lime-950/60 text-lime-800 dark:text-lime-300 border-lime-200 dark:border-lime-800',
      'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    ];
    return rainbowColors[(m - 1) % rainbowColors.length] || 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700';
  };

  const getStatusFakturBadge = (status?: string) => {
    const s = (status || 'Normal').toLowerCase();
    if (s.includes('normal') || s.includes('setuju')) {
      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
    }
    if (s.includes('ganti')) {
      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    }
    if (s.includes('batal')) {
      return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    }
    return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-lg border border-slate-800">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-400 via-emerald-400 via-cyan-400 via-blue-500 to-purple-500"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  DATA PPN DARI CORETax
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  13 Kolom Standar Coretax DJP
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Data master faktur pajak dari Coretax DJP 2026. Nilai PPN menjadi sumber acuan utama kebenaran pajak.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadCoretaxTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Format 13 Kolom Excel</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload / Paste Coretax</span>
            </button>

            <button
              onClick={onAddRecord}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tambah Faktur</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#0f1418] p-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-950/60 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center justify-between">
            <span>Total Dokumen Faktur</span>
            <Receipt className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{formatNumber(data.length)} <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Faktur</span></div>
          <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold mt-1">
            {totalInvoiceTerisi} terhubung Nomor Invoice
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1418] p-4 rounded-2xl border-2 border-amber-100 dark:border-amber-950/60 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center justify-between">
            <span>Total DPP (Dasar Pajak)</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-mono">{formatRupiah(totalDPP)}</div>
          <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 truncate">
            Harga Jual: {formatRupiah(totalHargaJual)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1418] p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          <div className="text-xs text-emerald-900 dark:text-emerald-300 font-bold flex items-center justify-between">
            <span>Total PPN (Master Kebenaran)</span>
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 font-mono">{formatRupiah(totalPPN)}</div>
          <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold mt-1">
            PPN Coretax Mutlak Tidak Dihitung Ulang
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1418] p-4 rounded-2xl border-2 border-blue-100 dark:border-blue-950/60 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-500"></div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center justify-between">
            <span>Total Nilai Invoice (Coretax)</span>
            <Key className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-mono">{formatRupiah(totalNilaiInvoice)}</div>
          <div className="text-[11px] text-blue-700 dark:text-blue-400 font-medium mt-1">
            DPP + PPN Tagihan Dokumen
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-[#0f1418] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Controls & Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari NPWP, Nama Penjual, No Faktur, No Invoice, Perekam..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedMonth !== null ? String(selectedMonth) : 'ALL'}
              onChange={(e) => setSelectedMonth(e.target.value === 'ALL' ? null : parseInt(e.target.value, 10))}
              className="py-1.5 px-3 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Masa Pajak (1 - 12)</option>
              {NAMA_BULAN.map((m, idx) => (
                <option key={`m-${idx + 1}`} value={idx + 1}>
                  Masa {idx + 1} - {m} 2026
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-3 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status Faktur</option>
              <option value="Normal">Normal</option>
              <option value="Pengganti">Pengganti</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>

            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 px-2 py-1 bg-slate-200/70 dark:bg-zinc-800 rounded-lg">
              {filteredData.length} baris
            </span>
          </div>
        </div>

        {/* 13 Kolom Table Display */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white font-bold text-[11px] uppercase tracking-wider select-none">
                <th className="py-3.5 px-3 text-center w-12 text-slate-300">No</th>
                <th className="py-3.5 px-3 whitespace-nowrap">1. NPWP Penjual</th>
                <th className="py-3.5 px-3 whitespace-nowrap">2. Nama Penjual</th>
                <th className="py-3.5 px-3 whitespace-nowrap">3. Nomor Faktur</th>
                <th className="py-3.5 px-3 whitespace-nowrap">4. Tanggal Faktur</th>
                <th className="py-3.5 px-2.5 text-center whitespace-nowrap">5. Masa</th>
                <th className="py-3.5 px-2.5 text-center whitespace-nowrap">6. Tahun</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">7. Status Faktur</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap">8. Harga Jual/Penggantian</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap">9. DPP Nilai Lain/DPP</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap bg-emerald-700/80 text-white font-extrabold shadow-inner">
                  10. PPN (Master)
                </th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap">11. Nilai Invoice</th>
                <th className="py-3.5 px-3 whitespace-nowrap">12. Perekam</th>
                <th className="py-3.5 px-3.5 whitespace-nowrap bg-indigo-700/80 text-white font-extrabold shadow-inner">
                  13. Nomor invoice
                </th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => {
                  const masa = item.masaPajak || item.periodeBulan || 1;
                  const npwp = item.npwpPenjual || item.npwpVendor || '-';
                  const nama = item.namaPenjual || item.namaVendor || 'Vendor Coretax';
                  const tahun = item.tahun || 2026;
                  const status = item.statusFaktur || 'Normal';
                  const hargaJual = item.hargaJual || item.dpp || 0;
                  const dpp = item.dpp || 0;
                  const ppn = item.ppn || 0;
                  const nilaiInvoice = item.nilaiInvoiceCoretax || (dpp + ppn);
                  const perekam = item.perekam || 'DJP-Coretax';
                  const noInvoice = item.nomorInvoice || '';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-zinc-800/60 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 dark:text-zinc-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                        {npwp}
                      </td>

                      <td className="py-3 px-3 text-slate-900 dark:text-zinc-100 font-bold max-w-xs truncate" title={nama}>
                        {nama}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700">
                          {item.nomorFaktur}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatDate(item.tanggalFaktur)}
                      </td>

                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getMonthRainbowBadge(
                            masa
                          )}`}
                        >
                          Masa {masa}
                        </span>
                      </td>

                      <td className="py-3 px-2.5 text-center font-semibold text-slate-700 dark:text-zinc-300 text-[11px]">
                        {tahun}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusFakturBadge(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatRupiah(hargaJual)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                        {formatRupiah(dpp)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 whitespace-nowrap border-x border-emerald-100 dark:border-emerald-900/40">
                        {formatRupiah(ppn)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-900 dark:text-blue-300 whitespace-nowrap">
                        {formatRupiah(nilaiInvoice)}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap flex items-center gap-1.5 pt-3.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                        <span className="truncate max-w-[120px]">{perekam}</span>
                      </td>

                      <td className="py-3 px-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 whitespace-nowrap border-x border-indigo-100 dark:border-indigo-900/40">
                        {noInvoice ? (
                          <div className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                              {noInvoice}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800">
                            ⚠️ Belum Terisi
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditRecord(item)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit Faktur"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                            title="Hapus Faktur"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HelpCircle className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
                        Tidak ada data faktur Coretax yang cocok dengan filter
                      </p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">
                        Coba ubah kata kunci pencarian atau reset filter masa pajak
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
            <span className="font-bold text-slate-900 dark:text-white">{filteredData.length} dari {data.length} Faktur</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-500 dark:text-zinc-400">Total DPP: </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatRupiah(filteredData.reduce((acc, it) => acc + (it.dpp || 0), 0))}
              </span>
            </div>
            <div>
              <span className="text-emerald-800 dark:text-emerald-400 font-medium">Total PPN Coretax: </span>
              <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                {formatRupiah(filteredData.reduce((acc, it) => acc + (it.ppn || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
