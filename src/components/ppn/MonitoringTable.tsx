import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertOctagon,
  HelpCircle,
  FileQuestion,
  Eye,
  ArrowUpDown,
  Calendar,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { LinkedMonitoringItem, MatchingStatusType } from '../../types/ppn';
import { formatRupiah, formatDate, NAMA_BULAN, RAINBOW_MONTH_COLORS, getVendorColor } from '../../utils/ppnFormatters';

interface MonitoringTableProps {
  items: LinkedMonitoringItem[];
  selectedMonth: number | null;
  onSelectMonth: (month: number | null) => void;
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  onViewDetail: (item: LinkedMonitoringItem) => void;
}

export const MonitoringTable: React.FC<MonitoringTableProps> = ({
  items,
  selectedMonth,
  onSelectMonth,
  statusFilter,
  setStatusFilter,
  onViewDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'tanggalFaktur' | 'ppn' | 'nomorInvoice' | 'status' | 'periodeBulan'>('periodeBulan');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const uniqueVendors = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.namaVendorCoretax) set.add(it.namaVendorCoretax);
    });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedMonth !== null && item.periodeBulan !== selectedMonth) {
        return false;
      }

      if (statusFilter && statusFilter !== 'ALL') {
        if (item.status !== statusFilter) {
          return false;
        }
      }

      if (vendorFilter !== 'ALL') {
        if (item.namaVendorCoretax !== vendorFilter && item.namaVendorHutang !== vendorFilter) {
          return false;
        }
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesFaktur = item.nomorFaktur?.toLowerCase().includes(q);
        const matchesInvoice = item.nomorInvoice?.toLowerCase().includes(q);
        const matchesVendor = item.namaVendorCoretax?.toLowerCase().includes(q) || item.namaVendorHutang?.toLowerCase().includes(q);
        const matchesNPWP = item.npwpVendor?.toLowerCase().includes(q);
        const matchesSP2D = item.nomorSP2D?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);

        if (!matchesFaktur && !matchesInvoice && !matchesVendor && !matchesNPWP && !matchesSP2D && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedMonth, statusFilter, vendorFilter, searchQuery]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'periodeBulan') {
        comparison = a.periodeBulan - b.periodeBulan;
      } else if (sortField === 'ppn') {
        comparison = a.ppn - b.ppn;
      } else if (sortField === 'tanggalFaktur') {
        comparison = (a.tanggalFaktur || '').localeCompare(b.tanggalFaktur || '');
      } else if (sortField === 'nomorInvoice') {
        comparison = (a.nomorInvoice || '').localeCompare(b.nomorInvoice || '');
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, currentPage, itemsPerPage]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderStatusBadge = (status: MatchingStatusType) => {
    switch (status) {
      case 'SUDAH_DIBAYAR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>SUDAH DIBAYAR</span>
          </span>
        );
      case 'BELUM_DIBAYAR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>BELUM DIBAYAR</span>
          </span>
        );
      case 'TIDAK_DITEMUKAN_DI_HUTANG':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shadow-2xs">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>TIDAK DI HUTANG</span>
          </span>
        );
      case 'INVOICE_KOSONG':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
            <span>NO INVOICE KOSONG</span>
          </span>
        );
      case 'HUTANG_TANPA_FAKTUR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 shadow-2xs">
            <FileQuestion className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>TANPA FAKTUR PAJAK</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f1418] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-md overflow-hidden">
      {/* Rainbow Spectrum Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 via-cyan-400 via-blue-500 to-purple-500"></div>

      {/* Search & Filter Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-pink-50/20 dark:from-zinc-900/80 dark:via-indigo-950/20 dark:to-zinc-900/80 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>DATA REKONSILIASI PPN & STATUS HUTANG 2026</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Rainbow Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Pencocokan otomatis nomor invoice antara DJP Coretax (PPN Master) & Data Hutang RSUD
              </p>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xs">
            Menampilkan <span className="text-indigo-700 dark:text-indigo-400 font-black">{filteredItems.length}</span> dari {items.length} Data
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Faktur, Invoice, Vendor, SP2D..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter || 'ALL'}
              onChange={(e) => {
                setStatusFilter(e.target.value === 'ALL' ? null : e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
            >
              <option value="ALL">Semua Status Pembayaran</option>
              <option value="SUDAH_DIBAYAR">🟢 Sudah Dibayar (Lunas SP2D)</option>
              <option value="BELUM_DIBAYAR">🟡 Belum Dibayar (Hutang Masih Ada)</option>
              <option value="TIDAK_DITEMUKAN_DI_HUTANG">🔴 Belum Ada di Data Hutang</option>
              <option value="INVOICE_KOSONG">⚠️ No Invoice Kosong di Coretax</option>
              <option value="HUTANG_TANPA_FAKTUR">🟣 Invoice Hutang Tanpa Faktur</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth !== null ? String(selectedMonth) : 'ALL'}
              onChange={(e) => {
                onSelectMonth(e.target.value === 'ALL' ? null : parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
            >
              <option value="ALL">Semua Masa Pajak 2026 (Jan–Des)</option>
              {NAMA_BULAN.map((m, idx) => (
                <option key={`opt-month-${idx + 1}`} value={idx + 1}>
                  Bulan {idx + 1} - {m} 2026
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Filter */}
          <div>
            <select
              value={vendorFilter}
              onChange={(e) => {
                setVendorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 truncate shadow-2xs"
            >
              <option value="ALL">Semua Rekanan / Vendor ({uniqueVendors.length})</option>
              {uniqueVendors.map((v) => (
                <option key={`opt-v-${v}`} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Status Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mr-1">Filter Cepat:</span>
          
          <button
            onClick={() => setStatusFilter(null)}
            className={`text-[11px] px-3 py-1 rounded-full font-bold border transition-all shadow-2xs ${
              !statusFilter
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
            }`}
          >
            Semua ({items.length})
          </button>

          <button
            onClick={() => setStatusFilter('SUDAH_DIBAYAR')}
            className={`text-[11px] px-3 py-1 rounded-full font-bold border transition-all flex items-center gap-1.5 shadow-2xs ${
              statusFilter === 'SUDAH_DIBAYAR'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/70'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Sudah Dibayar ({items.filter((i) => i.status === 'SUDAH_DIBAYAR').length})
          </button>

          <button
            onClick={() => setStatusFilter('BELUM_DIBAYAR')}
            className={`text-[11px] px-3 py-1 rounded-full font-bold border transition-all flex items-center gap-1.5 shadow-2xs ${
              statusFilter === 'BELUM_DIBAYAR'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/70'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Belum Dibayar ({items.filter((i) => i.status === 'BELUM_DIBAYAR').length})
          </button>

          <button
            onClick={() => setStatusFilter('TIDAK_DITEMUKAN_DI_HUTANG')}
            className={`text-[11px] px-3 py-1 rounded-full font-bold border transition-all flex items-center gap-1.5 shadow-2xs ${
              statusFilter === 'TIDAK_DITEMUKAN_DI_HUTANG'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/70'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Belum di Hutang ({items.filter((i) => i.status === 'TIDAK_DITEMUKAN_DI_HUTANG').length})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700 text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-3.5 text-center">Bulan</th>
              
              <th
                onClick={() => handleSort('tanggalFaktur')}
                className="py-3.5 px-3 cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-400"
              >
                <div className="flex items-center gap-1">
                  <span>Faktur Pajak (Coretax)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3.5 px-3">Vendor / Rekanan</th>
              <th className="py-3.5 px-3 text-right">DPP (Rp)</th>

              <th
                onClick={() => handleSort('ppn')}
                className="py-3.5 px-3 text-right cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 font-black text-slate-900 dark:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>PPN (Coretax)</span>
                  <ArrowUpDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('nomorInvoice')}
                className="py-3.5 px-3 cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-300 font-black"
              >
                <div className="flex items-center gap-1">
                  <span>No. Invoice (Penghubung)</span>
                  <ArrowUpDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('status')}
                className="py-3.5 px-3 cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-400"
              >
                <div className="flex items-center gap-1">
                  <span>Status Pembayaran</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3.5 px-3">SP2D / Tgl Bayar</th>
              <th className="py-3.5 px-3 text-right">Nilai Tagihan Hutang</th>
              <th className="py-3.5 px-3 text-center">Rincian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => {
                const rainbow = RAINBOW_MONTH_COLORS[item.periodeBulan] || RAINBOW_MONTH_COLORS[1];
                const vendorColor = getVendorColor(item.namaVendorCoretax || 'Rekanan');

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors group cursor-pointer"
                    onClick={() => onViewDetail(item)}
                  >
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-black ${rainbow.badgeBg} ${rainbow.badgeText} shadow-2xs`}
                        title={`Masa Pajak Bulan ${item.periodeBulan}`}
                      >
                        Bln {item.periodeBulan}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-zinc-100 font-mono text-[11px]">
                        {item.nomorFaktur}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(item.tanggalFaktur)}
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg ${vendorColor.bg} ${vendorColor.text} font-black text-[11px] flex items-center justify-center shrink-0 border ${vendorColor.border}`}
                        >
                          {(item.namaVendorCoretax || 'V').charAt(0)}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 dark:text-zinc-100 truncate" title={item.namaVendorCoretax}>
                            {item.namaVendorCoretax}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                            NPWP: {item.npwpVendor || '-'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-zinc-400 font-medium">
                      {formatRupiah(item.dpp)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs">
                      {formatRupiah(item.ppn)}
                    </td>

                    <td className="py-3 px-3 bg-indigo-50/30 dark:bg-indigo-950/20">
                      {item.nomorInvoice ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                          {item.nomorInvoice}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500 italic">
                          (Kosong di Coretax)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {renderStatusBadge(item.status)}
                    </td>

                    <td className="py-3 px-3">
                      {item.nomorSP2D ? (
                        <div>
                          <div className="font-mono text-[11px] text-emerald-800 dark:text-emerald-300 font-bold truncate max-w-[140px]" title={item.nomorSP2D}>
                            {item.nomorSP2D}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                            {formatDate(item.tanggalPembayaran)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-500 text-[11px] italic">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-zinc-300 font-medium">
                      {item.nilaiInvoice ? (
                        <div>
                          <div className="font-bold">{formatRupiah(item.nilaiInvoice)}</div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                            {item.jenisHutang || 'Hutang 2026'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-500 text-[11px] italic">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onViewDetail(item)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-slate-600 dark:text-zinc-400 hover:text-white dark:hover:text-white border border-slate-200 dark:border-zinc-700 transition-all shadow-2xs"
                        title="Lihat Rincian Rekonsiliasi"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-zinc-400">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <FileSpreadsheet className="w-10 h-10 text-indigo-300 dark:text-indigo-600 mb-2" />
                    <div className="font-bold text-slate-700 dark:text-zinc-300">Tidak ada data rekonsiliasi yang cocok</div>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                      Coba ganti kata kunci pencarian atau sesuaikan filter status / bulan.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter(null);
                        onSelectMonth(null);
                        setVendorFilter('ALL');
                      }}
                      className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-zinc-400">
        <div className="font-medium">
          Halaman <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> dari{' '}
          <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span> (Total {sortedItems.length} data)
        </div>

        <div className="flex items-center gap-1.5 font-bold">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
          >
            Sebelumnya
          </button>
          
          <span className="px-2.5 text-slate-600 dark:text-zinc-400">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};
