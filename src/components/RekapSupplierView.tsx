import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, 
  Search, 
  Download, 
  Printer, 
  RefreshCw, 
  FileSpreadsheet, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  ExternalLink, 
  X,
  TrendingUp,
  Receipt,
  Layers,
  ArrowUpDown,
  DollarSign
} from 'lucide-react';
import { User } from 'firebase/auth';
import { InvoiceHutang2025Record, InvoiceHutang2026Record } from '../types/invoiceHutang';
import { INITIAL_INVOICE_HUTANG_2025 } from '../data/invoiceHutang2025Data';
import { INITIAL_INVOICE_HUTANG_2026 } from '../data/invoiceHutang2026Data';
import { formatRupiah, formatRupiahShort, formatDateDDMMYYYY } from '../utils/formatters';
import { idbGet } from '../utils/indexedDbStorage';
import { useTheme } from '../context/ThemeContext';
import * as XLSX from 'xlsx';

export interface SupplierRekapItem {
  id: string;
  namaVendor: string;
  jumlahInvoice: number;
  totalTagihan: number;
  totalKoreksi: number;
  totalPembayaran: number;
  totalSisaHutang: number;
  persenBayar: number;
  status: 'Lunas' | 'Sebagian' | 'Belum Bayar';
  bidang: string;
  subBelanjaList: string[];
  sumberAnggaran: string;
  belumJatuhTempo: number;
  aging1_30: number;
  aging31_60: number;
  aging61_90: number;
  agingLebih90: number;
  invoices: InvoiceHutang2025Record[];
}

interface RekapSupplierViewProps {
  year: 2025 | 2026;
  user?: User | null;
  role?: string;
  isAdmin?: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onNavigateSubmenu?: (subTab: string) => void;
}

export const RekapSupplierView: React.FC<RekapSupplierViewProps> = ({
  year,
  user,
  role,
  isAdmin,
  onShowToast,
  onNavigateSubmenu
}) => {
  const { isDark } = useTheme();
  const idbKey = year === 2026 ? 'rsud_invoice_hutang_2026' : 'rsud_invoice_hutang_2025';
  const initialFallback = year === 2026 ? INITIAL_INVOICE_HUTANG_2026 : INITIAL_INVOICE_HUTANG_2025;
  const updateEventName = year === 2026 ? 'rsud_invoice_hutang_2026_updated' : 'rsud_invoice_hutang_2025_updated';

  // Raw invoices loaded automatically from INVOICE HUTANG
  const [invoices, setInvoices] = useState<InvoiceHutang2025Record[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(idbKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn(`[RekapSupplier ${year}] Initial localStorage read error:`, e);
    }
    return initialFallback;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'belum_lunas' | 'sebagian' | 'lunas'>('semua');
  const [sumberFilter, setSumberFilter] = useState<'semua' | 'BLUD' | 'APBD'>('semua');
  const [sortBy, setSortBy] = useState<'sisa_desc' | 'tagihan_desc' | 'nama_asc' | 'invoice_desc' | 'bayar_desc'>('sisa_desc');

  // Drilldown Modal
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRekapItem | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  // Synchronize data from IndexedDB
  const syncData = useCallback(async (showNotification = false) => {
    setIsLoading(true);
    try {
      let data: InvoiceHutang2025Record[] = initialFallback;
      const saved = await idbGet<InvoiceHutang2025Record[]>(idbKey);
      if (saved && Array.isArray(saved) && saved.length > 0) {
        data = saved;
      } else {
        // Fallback to localStorage if idb was empty
        const lsSaved = localStorage.getItem(idbKey);
        if (lsSaved) {
          const parsed = JSON.parse(lsSaved);
          if (Array.isArray(parsed) && parsed.length > 0) data = parsed;
        }
      }
      setInvoices(data);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

      if (showNotification && onShowToast) {
        onShowToast(`Data Rekap Persupplier Tahun ${year} berhasil disinkronkan otomatis (${data.length} invoice).`, 'success');
      }
    } catch (err) {
      console.error(`[RekapSupplier ${year}] Sync error:`, err);
      if (showNotification && onShowToast) {
        onShowToast(`Gagal menyinkronkan data supplier dari Invoice Hutang ${year}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [idbKey, initialFallback, year, onShowToast]);

  // Real-time event listeners for automatic updates whenever INVOICE HUTANG is updated/imported
  useEffect(() => {
    syncData(false);

    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setInvoices(customEvt.detail);
        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      } else {
        syncData(false);
      }
    };

    window.addEventListener(updateEventName, handleUpdate);
    window.addEventListener('rsud_data_updated', () => syncData(false));
    window.addEventListener('storage', () => syncData(false));

    return () => {
      window.removeEventListener(updateEventName, handleUpdate);
      window.removeEventListener('rsud_data_updated', () => syncData(false));
      window.removeEventListener('storage', () => syncData(false));
    };
  }, [syncData, updateEventName]);

  // Automatic grouping by vendor name from INVOICE HUTANG dataset
  const supplierList = useMemo<SupplierRekapItem[]>(() => {
    const map = new Map<string, {
      namaVendor: string;
      invoices: InvoiceHutang2025Record[];
      totalTagihan: number;
      totalKoreksi: number;
      totalPembayaran: number;
      totalSisaHutang: number;
      bidangSet: Set<string>;
      subBelanjaSet: Set<string>;
      sumberSet: Set<string>;
      belumJatuhTempo: number;
      aging1_30: number;
      aging31_60: number;
      aging61_90: number;
      agingLebih90: number;
    }>();

    invoices.forEach((inv) => {
      const rawName = (inv.rekanan || '').trim() || 'Vendor Tanpa Nama';
      const key = rawName.toUpperCase().replace(/\s+/g, ' ');

      let group = map.get(key);
      if (!group) {
        group = {
          namaVendor: rawName,
          invoices: [],
          totalTagihan: 0,
          totalKoreksi: 0,
          totalPembayaran: 0,
          totalSisaHutang: 0,
          bidangSet: new Set(),
          subBelanjaSet: new Set(),
          sumberSet: new Set(),
          belumJatuhTempo: 0,
          aging1_30: 0,
          aging31_60: 0,
          aging61_90: 0,
          agingLebih90: 0,
        };
        map.set(key, group);
      }

      group.invoices.push(inv);

      const tagihan = (inv.totalInvoiceFix !== undefined && inv.totalInvoiceFix !== null)
        ? Number(inv.totalInvoiceFix)
        : Number(inv.jumlahInvoice || 0);
      const koreksi = Number(inv.koreksi || 0);
      const pembayaran = Number(inv.pembayaran || 0);
      const sisa = (inv.sisaHutang !== undefined && inv.sisaHutang !== null)
        ? Number(inv.sisaHutang)
        : Math.max(0, tagihan - pembayaran);

      group.totalTagihan += tagihan;
      group.totalKoreksi += koreksi;
      group.totalPembayaran += pembayaran;
      group.totalSisaHutang += sisa;

      const bidang = inv.bagian || inv.bidang;
      if (bidang) group.bidangSet.add(bidang.trim());
      if (inv.subBelanja) group.subBelanjaSet.add(inv.subBelanja.trim());
      if (inv.sumberAnggaran) group.sumberSet.add(inv.sumberAnggaran.trim());

      const umur = Number(inv.lamaHariHutang || 0);
      if (sisa > 0) {
        if (umur <= 0) {
          group.belumJatuhTempo += sisa;
        } else if (umur <= 30) {
          group.aging1_30 += sisa;
        } else if (umur <= 60) {
          group.aging31_60 += sisa;
        } else if (umur <= 90) {
          group.aging61_90 += sisa;
        } else {
          group.agingLebih90 += sisa;
        }
      }
    });

    const items: SupplierRekapItem[] = Array.from(map.entries()).map(([key, g], idx) => {
      const persenBayar = g.totalTagihan > 0
        ? Math.min(100, Math.round((g.totalPembayaran / g.totalTagihan) * 100))
        : (g.totalSisaHutang === 0 ? 100 : 0);

      let status: 'Lunas' | 'Sebagian' | 'Belum Bayar' = 'Belum Bayar';
      if (g.totalSisaHutang <= 0) {
        status = 'Lunas';
      } else if (g.totalPembayaran > 0) {
        status = 'Sebagian';
      }

      const sumberAnggaran = Array.from(g.sumberSet).filter(Boolean).join(', ') || 'BLUD';
      const bidang = Array.from(g.bidangSet).filter(Boolean).join(', ') || '-';

      return {
        id: `sup-${year}-${idx + 1}-${key}`,
        namaVendor: g.namaVendor,
        jumlahInvoice: g.invoices.length,
        totalTagihan: g.totalTagihan,
        totalKoreksi: g.totalKoreksi,
        totalPembayaran: g.totalPembayaran,
        totalSisaHutang: g.totalSisaHutang,
        persenBayar,
        status,
        bidang,
        subBelanjaList: Array.from(g.subBelanjaSet).filter(Boolean),
        sumberAnggaran,
        belumJatuhTempo: g.belumJatuhTempo,
        aging1_30: g.aging1_30,
        aging31_60: g.aging31_60,
        aging61_90: g.aging61_90,
        agingLebih90: g.agingLebih90,
        invoices: g.invoices.sort((a, b) => (a.no || 0) - (b.no || 0)),
      };
    });

    return items;
  }, [invoices, year]);

  // Filtered and sorted items
  const filteredSuppliers = useMemo(() => {
    let list = supplierList.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.namaVendor.toLowerCase().includes(q);
        const matchBidang = item.bidang.toLowerCase().includes(q);
        const matchSub = item.subBelanjaList.some(s => s.toLowerCase().includes(q));
        const matchInvoice = item.invoices.some(inv => (inv.noInvoice || '').toLowerCase().includes(q));
        if (!matchName && !matchBidang && !matchSub && !matchInvoice) return false;
      }

      // Status
      if (statusFilter === 'belum_lunas') {
        if (item.status === 'Lunas') return false;
      } else if (statusFilter === 'lunas') {
        if (item.status !== 'Lunas') return false;
      } else if (statusFilter === 'sebagian') {
        if (item.status !== 'Sebagian') return false;
      }

      // Sumber Anggaran
      if (sumberFilter !== 'semua') {
        if (!item.sumberAnggaran.toUpperCase().includes(sumberFilter)) return false;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'sisa_desc') return b.totalSisaHutang - a.totalSisaHutang;
      if (sortBy === 'tagihan_desc') return b.totalTagihan - a.totalTagihan;
      if (sortBy === 'bayar_desc') return b.totalPembayaran - a.totalPembayaran;
      if (sortBy === 'invoice_desc') return b.jumlahInvoice - a.jumlahInvoice;
      if (sortBy === 'nama_asc') return a.namaVendor.localeCompare(b.namaVendor);
      return 0;
    });

    return list;
  }, [supplierList, searchQuery, statusFilter, sumberFilter, sortBy]);

  // Overall statistics
  const summaryStats = useMemo(() => {
    const totalVendor = supplierList.length;
    const vendorLunas = supplierList.filter(s => s.status === 'Lunas').length;
    const vendorSebagian = supplierList.filter(s => s.status === 'Sebagian').length;
    const vendorBelum = supplierList.filter(s => s.status === 'Belum Bayar').length;
    const totalInvoicesCount = invoices.length;

    const totalTagihan = supplierList.reduce((acc, curr) => acc + curr.totalTagihan, 0);
    const totalKoreksi = supplierList.reduce((acc, curr) => acc + curr.totalKoreksi, 0);
    const totalTerbayar = supplierList.reduce((acc, curr) => acc + curr.totalPembayaran, 0);
    const totalSisaHutang = supplierList.reduce((acc, curr) => acc + curr.totalSisaHutang, 0);

    const totalBelumJT = supplierList.reduce((acc, curr) => acc + curr.belumJatuhTempo, 0);
    const total1_30 = supplierList.reduce((acc, curr) => acc + curr.aging1_30, 0);
    const total31_60 = supplierList.reduce((acc, curr) => acc + curr.aging31_60, 0);
    const total61_90 = supplierList.reduce((acc, curr) => acc + curr.aging61_90, 0);
    const totalLebih90 = supplierList.reduce((acc, curr) => acc + curr.agingLebih90, 0);

    const persentaseBayar = totalTagihan > 0 ? ((totalTerbayar / totalTagihan) * 100).toFixed(1) : '100';

    return {
      totalVendor,
      vendorLunas,
      vendorSebagian,
      vendorBelum,
      totalInvoicesCount,
      totalTagihan,
      totalKoreksi,
      totalTerbayar,
      totalSisaHutang,
      persentaseBayar,
      totalBelumJT,
      total1_30,
      total31_60,
      total61_90,
      totalLebih90,
    };
  }, [supplierList, invoices]);

  // Export to Excel: Complete Summary + All Invoices Sheet
  const handleExportExcel = () => {
    const summaryRows = supplierList.map((sup, index) => ({
      'NO': index + 1,
      'NAMA SUPPLIER / VENDOR REKANAN': sup.namaVendor,
      'BIDANG': sup.bidang,
      'SUMBER ANGGARAN': sup.sumberAnggaran,
      'JUMLAH INVOICE': sup.jumlahInvoice,
      'TOTAL TAGIHAN / NILAI SPJ (RP)': sup.totalTagihan,
      'KOREKSI (RP)': sup.totalKoreksi,
      'REALISASI PEMBAYARAN (RP)': sup.totalPembayaran,
      'SISA HUTANG (RP)': sup.totalSisaHutang,
      '% TERBAYAR': `${sup.persenBayar}%`,
      'STATUS': sup.status,
      'BELUM JATUH TEMPO (RP)': sup.belumJatuhTempo,
      '1 - 30 HARI (RP)': sup.aging1_30,
      '31 - 60 HARI (RP)': sup.aging31_60,
      '61 - 90 HARI (RP)': sup.aging61_90,
      '> 90 HARI (RP)': sup.agingLebih90,
    }));

    // Add total row
    summaryRows.push({
      'NO': 'TOTAL' as any,
      'NAMA SUPPLIER / VENDOR REKANAN': `TOTAL ${summaryStats.totalVendor} VENDOR REKANAN`,
      'BIDANG': '',
      'SUMBER ANGGARAN': '',
      'JUMLAH INVOICE': summaryStats.totalInvoicesCount,
      'TOTAL TAGIHAN / NILAI SPJ (RP)': summaryStats.totalTagihan,
      'KOREKSI (RP)': summaryStats.totalKoreksi,
      'REALISASI PEMBAYARAN (RP)': summaryStats.totalTerbayar,
      'SISA HUTANG (RP)': summaryStats.totalSisaHutang,
      '% TERBAYAR': `${summaryStats.persentaseBayar}%`,
      'STATUS': (summaryStats.totalSisaHutang <= 0 ? 'Lunas' : 'Belum Bayar') as any,
      'BELUM JATUH TEMPO (RP)': summaryStats.totalBelumJT,
      '1 - 30 HARI (RP)': summaryStats.total1_30,
      '31 - 60 HARI (RP)': summaryStats.total31_60,
      '61 - 90 HARI (RP)': summaryStats.total61_90,
      '> 90 HARI (RP)': summaryStats.totalLebih90,
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [
      { wch: 6 },
      { wch: 34 },
      { wch: 24 },
      { wch: 18 },
      { wch: 16 },
      { wch: 22 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    // Detail sheet of all invoices
    const allDetailRows = invoices.map((inv, idx) => ({
      'NO': inv.no || (idx + 1),
      'PERUSAHAAN / VENDOR': inv.rekanan,
      'BIDANG': inv.bagian || inv.bidang || '',
      'JENIS PENGADAAN': inv.subBelanja || inv.uraian,
      'TANGGAL REKAP': inv.tglRekap || inv.tglTandaTerima || '',
      'BULAN REKAP': inv.bulanRekap || '',
      'TANGGAL INVOICE': inv.tglInvoice || '',
      'BULAN INVOICE': inv.bulanInvoice || '',
      'NOMOR INVOICE/SPK/PO': inv.noInvoice || '',
      'TANGGAL JATUH TEMPO': inv.jatuhTempo || '',
      'JUMLAH': inv.jumlahInvoice || 0,
      'KOREKSI': inv.koreksi || 0,
      'NILAI SPJ': inv.totalInvoiceFix || inv.jumlahInvoice || 0,
      'DIBAYAR': inv.pembayaran || 0,
      'JENIS ANGGARAN': inv.sumberAnggaran || 'BLUD',
      'SISA': inv.sisaHutang !== undefined ? inv.sisaHutang : Math.max(0, (inv.totalInvoiceFix || inv.jumlahInvoice || 0) - (inv.pembayaran || 0)),
      'STATUS BUKU KAS (A)': inv.sudahMasukBukuKas ? 'TRUE' : 'FALSE',
      'TANGGAL BAYAR': inv.tglSpdBukuKas || inv.tglBayar || '',
      'BULAN BAYAR': inv.bulanSpd || '',
      'NOMOR SP2D / SPD': inv.noSpdBukuKas || '',
      'UMUR HUTANG (HARI)': inv.lamaHariHutang || 0,
      'KETERANGAN': inv.keterangan || (inv.sisaHutang <= 0 ? 'Lunas' : 'Belum Lunas')
    }));

    const wsDetail = XLSX.utils.json_to_sheet(allDetailRows);
    wsDetail['!cols'] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 24 },
      { wch: 32 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 28 },
      { wch: 18 },
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 10 },
      { wch: 16 },
      { wch: 14 },
      { wch: 32 },
      { wch: 14 },
      { wch: 16 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, `Rekap Persupplier ${year}`);
    XLSX.utils.book_append_sheet(wb, wsDetail, `Rincian Invoice ${year}`);

    XLSX.writeFile(wb, `REKAP_PERSUPLIER_TAHUN_${year}_RSUD_JATISARI.xlsx`);

    if (onShowToast) {
      onShowToast(`Laporan Rekap Persupplier ${year} berhasil diekspor ke Excel`, 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter invoices inside vendor detail modal
  const filteredModalInvoices = useMemo(() => {
    if (!selectedSupplier) return [];
    if (!modalSearch.trim()) return selectedSupplier.invoices;
    const q = modalSearch.toLowerCase().trim();
    return selectedSupplier.invoices.filter(inv => 
      (inv.noInvoice || '').toLowerCase().includes(q) ||
      (inv.subBelanja || '').toLowerCase().includes(q) ||
      (inv.uraian || '').toLowerCase().includes(q) ||
      (inv.noSpdBukuKas || '').toLowerCase().includes(q)
    );
  }, [selectedSupplier, modalSearch]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/30">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Rekapitulasi Kewajiban Hutang Vendor Rekanan RSUD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-indigo-400 shrink-0" />
            REKAP PERSUPLIER TAHUN {year}
          </h2>
          <p className="text-indigo-200/90 text-xs sm:text-sm mt-1.5 max-w-3xl leading-relaxed">
            Data otomatis terakumulasi berdasarkan nama vendor pada <strong>INVOICE HUTANG {year}</strong>. 
            Menampilkan total tagihan per rekanan, realisasi pembayaran, saldo sisa hutang, dan rincian umur hutang secara real-time.
          </p>

          <div className="flex items-center gap-3 mt-3 text-xs text-indigo-300/80">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Tersinkronisasi otomatis dengan {invoices.length} baris invoice
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Pembaruan terakhir: {lastSyncTime} WIB
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => syncData(true)}
            disabled={isLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition transform active:scale-95 flex items-center gap-2 border border-indigo-400/40 disabled:opacity-50 cursor-pointer"
            title={`Sinkronkan ulang data dari INVOICE HUTANG ${year}`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>SINKRONKAN DATA</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition transform active:scale-95 flex items-center gap-2 border border-emerald-400/40 cursor-pointer"
            title="Export Excel Rekap Persupplier"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT EXCEL</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: TOTAL VENDOR */}
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-indigo-950/80 shadow-sm relative overflow-hidden group hover:border-indigo-400 dark:hover:border-indigo-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Total Vendor Rekanan
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {summaryStats.totalVendor}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">Vendor</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {summaryStats.vendorLunas} Lunas
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {summaryStats.vendorSebagian} Sebagian
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {summaryStats.vendorBelum} Belum
            </span>
          </div>
        </div>

        {/* CARD 2: TOTAL TAGIHAN */}
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-indigo-950/80 shadow-sm relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Total Tagihan SPJ ({year})
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatRupiah(summaryStats.totalTagihan)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Jumlah Berkas Invoice:</span>
            <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono">{summaryStats.totalInvoicesCount} berkas</span>
          </div>
        </div>

        {/* CARD 3: REALISASI PEMBAYARAN */}
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-indigo-950/80 shadow-sm relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Realisasi Pembayaran
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              {formatRupiah(summaryStats.totalTerbayar)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] flex items-center justify-between">
            <span className="text-slate-500 dark:text-zinc-400">Persentase Lunas:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{summaryStats.persentaseBayar}%</span>
          </div>
        </div>

        {/* CARD 4: SISA HUTANG AKTIF */}
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-indigo-950/80 shadow-sm relative overflow-hidden group hover:border-rose-400 dark:hover:border-rose-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Sisa Hutang Aktif
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
              {formatRupiah(summaryStats.totalSisaHutang)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] flex items-center justify-between">
            <span className="text-slate-500 dark:text-zinc-400">Status Kewajiban:</span>
            <span className={`font-bold ${summaryStats.totalSisaHutang <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {summaryStats.totalSisaHutang <= 0 ? 'Semua Lunas' : 'Ada Kewajiban'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. AGING MINI BREAKDOWN BAR */}
      <div className="bg-slate-50 dark:bg-[#0f141a] rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-zinc-300 shrink-0">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>Distribusi Umur Sisa Hutang ({year}):</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full max-w-4xl text-center">
          <div className="p-2 rounded-xl bg-white dark:bg-[#151c24] border border-slate-200/80 dark:border-zinc-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Belum JT</div>
            <div className="font-mono font-bold text-slate-800 dark:text-zinc-200 mt-0.5">{formatRupiahShort(summaryStats.totalBelumJT)}</div>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#151c24] border border-slate-200/80 dark:border-zinc-800">
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">1-30 Hari</div>
            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatRupiahShort(summaryStats.total1_30)}</div>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#151c24] border border-slate-200/80 dark:border-zinc-800">
            <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold">31-60 Hari</div>
            <div className="font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">{formatRupiahShort(summaryStats.total31_60)}</div>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#151c24] border border-slate-200/80 dark:border-zinc-800">
            <div className="text-[10px] text-orange-600 dark:text-orange-400 uppercase font-semibold">61-90 Hari</div>
            <div className="font-mono font-bold text-orange-600 dark:text-orange-400 mt-0.5">{formatRupiahShort(summaryStats.total61_90)}</div>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#151c24] border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold">&gt;90 Hari (Kritis)</div>
            <div className="font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatRupiahShort(summaryStats.totalLebih90)}</div>
          </div>
        </div>
      </div>

      {/* 4. MAIN SUPPLIER TABLE CONTAINER */}
      <div className="bg-white dark:bg-[#0d1216] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        
        {/* Toolbar: Search, Filters, Sorting, Count */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#12181f]/80">
          
          {/* Search box */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama vendor / rekanan, nomor invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0d1216] border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-[#0d1216] border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="semua">Semua Status Pelunasan</option>
              <option value="belum_lunas">Belum Lunas (Masih Ada Sisa)</option>
              <option value="sebagian">Bayar Sebagian</option>
              <option value="lunas">Lunas Sepenuhnya</option>
            </select>

            {/* Sumber Dana Filter */}
            <select
              value={sumberFilter}
              onChange={(e) => setSumberFilter(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-[#0d1216] border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="semua">Semua Sumber Dana</option>
              <option value="BLUD">Sumber Dana BLUD</option>
              <option value="APBD">Sumber Dana APBD</option>
            </select>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-[#0d1216] border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sisa_desc">Sort: Sisa Hutang Terbesar</option>
              <option value="tagihan_desc">Sort: Total Tagihan Terbesar</option>
              <option value="bayar_desc">Sort: Realisasi Bayar Terbesar</option>
              <option value="invoice_desc">Sort: Invoice Terbanyak</option>
              <option value="nama_asc">Sort: Nama Vendor (A-Z)</option>
            </select>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Cetak Tabel Rekap Supplier"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 pl-1">
              {filteredSuppliers.length} dari {supplierList.length} Vendor
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#e6f4ea] dark:bg-[#1a382b] text-[#13422d] dark:text-[#a6ecc8] font-bold border-b border-[#a8dbc0] dark:border-[#2b5a45] uppercase text-[10px] tracking-wide">
              <tr>
                <th className="px-3 py-3 text-center w-12 border-r border-[#c2e5d2] dark:border-[#2b5a45]">NO</th>
                <th className="px-4 py-3 border-r border-[#c2e5d2] dark:border-[#2b5a45]">NAMA SUPPLIER / VENDOR REKANAN</th>
                <th className="px-3 py-3 text-center border-r border-[#c2e5d2] dark:border-[#2b5a45]">JML INVOICE</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">TOTAL TAGIHAN (SPJ)</th>
                <th className="px-3 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">KOREKSI</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">REALISASI BAYAR</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">SISA HUTANG</th>
                <th className="px-3 py-3 text-center border-r border-[#c2e5d2] dark:border-[#2b5a45]">% TERBAYAR</th>
                <th className="px-3 py-3 text-center border-r border-[#c2e5d2] dark:border-[#2b5a45]">STATUS</th>
                <th className="px-3 py-3 text-center w-28">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/70">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 dark:text-zinc-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada data vendor rekanan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup, index) => {
                  const isLunas = sup.status === 'Lunas';
                  return (
                    <tr 
                      key={sup.id}
                      className="hover:bg-slate-50/90 dark:hover:bg-[#141c24]/90 bg-white dark:bg-[#0d1216] transition group"
                    >
                      <td className="px-3 py-3 text-center font-mono font-medium text-slate-500 dark:text-zinc-400 border-r border-slate-200 dark:border-zinc-800">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 border-r border-slate-200 dark:border-zinc-800">
                        <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                          <span>{sup.namaVendor}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                            {sup.sumberAnggaran}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-sm mt-0.5">
                          {sup.bidang} • {sup.subBelanjaList.slice(0, 2).join(', ')}{sup.subBelanjaList.length > 2 ? '...' : ''}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center font-mono border-r border-slate-200 dark:border-zinc-800">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          {sup.jumlahInvoice} berkas
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100 border-r border-slate-200 dark:border-zinc-800">
                        {formatRupiah(sup.totalTagihan)}
                      </td>

                      <td className="px-3 py-3 text-right font-mono text-slate-500 dark:text-zinc-400 border-r border-slate-200 dark:border-zinc-800">
                        {sup.totalKoreksi > 0 ? formatRupiah(sup.totalKoreksi) : '-'}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-zinc-800">
                        {sup.totalPembayaran > 0 ? formatRupiah(sup.totalPembayaran) : '-'}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold border-r border-slate-200 dark:border-zinc-800">
                        {sup.totalSisaHutang > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/40">
                            {formatRupiah(sup.totalSisaHutang)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">LUNAS</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center border-r border-slate-200 dark:border-zinc-800">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-12 bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${isLunas ? 'bg-emerald-500' : sup.persenBayar > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${sup.persenBayar}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[10px] text-slate-600 dark:text-zinc-400">
                            {sup.persenBayar}%
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center border-r border-slate-200 dark:border-zinc-800">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isLunas 
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60'
                            : sup.status === 'Sebagian'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/60'
                        }`}>
                          {sup.status}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedSupplier(sup);
                            setModalSearch('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg text-[10.5px] transition shadow-xs border border-indigo-200 dark:border-indigo-800/40 active:scale-95 cursor-pointer"
                          title="Lihat semua invoice milik rekanan ini"
                        >
                          <Eye className="w-3 h-3" /> Rincian
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Footer Row */}
            {filteredSuppliers.length > 0 && (
              <tfoot className="bg-[#f0f9f3] dark:bg-[#12281e] font-bold text-slate-900 dark:text-white border-t-2 border-[#a8dbc0] dark:border-[#2b5a45] text-xs">
                <tr>
                  <td colSpan={2} className="px-4 py-3.5 text-center uppercase tracking-wide border-r border-[#c2e5d2] dark:border-[#2b5a45]">
                    TOTAL ({filteredSuppliers.length} VENDOR TERFILTER)
                  </td>
                  <td className="px-3 py-3.5 text-center font-mono border-r border-[#c2e5d2] dark:border-[#2b5a45]">
                    {filteredSuppliers.reduce((a, b) => a + b.jumlahInvoice, 0)} berkas
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-950 dark:text-indigo-200 border-r border-[#c2e5d2] dark:border-[#2b5a45]">
                    {formatRupiah(filteredSuppliers.reduce((a, b) => a + b.totalTagihan, 0))}
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono border-r border-[#c2e5d2] dark:border-[#2b5a45]">
                    {formatRupiah(filteredSuppliers.reduce((a, b) => a + b.totalKoreksi, 0))}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 border-r border-[#c2e5d2] dark:border-[#2b5a45]">
                    {formatRupiah(filteredSuppliers.reduce((a, b) => a + b.totalPembayaran, 0))}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-black text-rose-700 dark:text-rose-400 border-r border-[#c2e5d2] dark:border-[#2b5a45]">
                    {formatRupiah(filteredSuppliers.reduce((a, b) => a + b.totalSisaHutang, 0))}
                  </td>
                  <td colSpan={3} className="px-4 py-3.5 text-center text-slate-500 dark:text-zinc-400 text-[11px]">
                    {filteredSuppliers.filter(s => s.status === 'Lunas').length} Lunas • {filteredSuppliers.filter(s => s.status !== 'Lunas').length} Belum Lunas
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 5. DRILLDOWN MODAL: RINCIAN SEMUA INVOICE PER VENDOR */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-[#0e1318] rounded-3xl max-w-5xl w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-[#12181f] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 rounded-2xl shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                      {selectedSupplier.namaVendor}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedSupplier.status === 'Lunas' 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {selectedSupplier.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Daftar {selectedSupplier.invoices.length} berkas invoice pada <strong>INVOICE HUTANG {year}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateSubmenu && (
                  <button
                    id="btn-buka-invoice-hutang-modal"
                    onClick={() => {
                      const vendorName = selectedSupplier.namaVendor;
                      try {
                        sessionStorage.setItem(`rsud_filter_rekanan_${year}`, vendorName);
                      } catch (e) {}
                      setSelectedSupplier(null);
                      onNavigateSubmenu(`invoice_hutang_${year}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition border border-indigo-200 dark:border-indigo-800/40 cursor-pointer shadow-xs active:scale-95"
                    title={`Buka lembar kerja Invoice Hutang ${year}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka di Invoice Hutang {year}
                  </button>
                )}
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal KPI Mini Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/50 dark:bg-[#10161d] border-b border-slate-200 dark:border-zinc-800">
              <div className="p-3 bg-white dark:bg-[#141b22] rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Tagihan (SPJ)</span>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatRupiah(selectedSupplier.totalTagihan)}
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-[#141b22] rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Total Terbayar</span>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {formatRupiah(selectedSupplier.totalPembayaran)}
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-[#141b22] rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Sisa Hutang Aktif</span>
                <div className="text-base font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                  {formatRupiah(selectedSupplier.totalSisaHutang)}
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-[#141b22] rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Persentase Lunas</span>
                <div className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                  {selectedSupplier.persenBayar}%
                </div>
              </div>
            </div>

            {/* Modal Invoice Search */}
            <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari no invoice, pos belanja, SP2D..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">
                Menampilkan {filteredModalInvoices.length} invoice
              </div>
            </div>

            {/* Modal Invoices Table */}
            <div className="overflow-x-auto flex-1 p-0">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-[#141c24] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800 uppercase text-[10px] sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-center">No</th>
                    <th className="px-3 py-2.5">No Invoice / SPK</th>
                    <th className="px-3 py-2.5">Pos Belanja / Uraian</th>
                    <th className="px-3 py-2.5">Tgl Rekap</th>
                    <th className="px-3 py-2.5">Tgl Invoice</th>
                    <th className="px-3 py-2.5">Jatuh Tempo</th>
                    <th className="px-3 py-2.5 text-right">Nilai SPJ</th>
                    <th className="px-3 py-2.5 text-right">Dibayar</th>
                    <th className="px-3 py-2.5 text-right">Sisa</th>
                    <th className="px-3 py-2.5 text-center">No SP2D</th>
                    <th className="px-3 py-2.5 text-center">Umur</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {filteredModalInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada invoice yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredModalInvoices.map((inv, idx) => {
                      const tagihan = inv.totalInvoiceFix || inv.jumlahInvoice || 0;
                      const sisa = inv.sisaHutang !== undefined ? inv.sisaHutang : Math.max(0, tagihan - (inv.pembayaran || 0));
                      const isInvoiceLunas = sisa <= 0;

                      return (
                        <tr key={inv.id || idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                          <td className="px-3 py-2 text-center font-mono text-slate-400">
                            {inv.no || (idx + 1)}
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                            {inv.noInvoice || '-'}
                          </td>
                          <td className="px-3 py-2 max-w-xs text-slate-700 dark:text-zinc-200">
                            <div className="font-semibold text-xs leading-snug truncate" title={inv.subBelanja || inv.uraian}>
                              {inv.subBelanja || inv.uraian || '-'}
                            </div>
                            {inv.kodeRekening && (
                              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                                <span className="opacity-70 text-[9px] uppercase font-sans">Kode:</span>
                                <span>{inv.kodeRekening}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-slate-500 dark:text-zinc-400 font-mono">
                            {inv.tglRekap || inv.tglTandaTerima || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-slate-500 dark:text-zinc-400 font-mono">
                            {inv.tglInvoice || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-slate-500 dark:text-zinc-400 font-mono">
                            {inv.jatuhTempo || '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                            {formatRupiah(tagihan)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {inv.pembayaran ? formatRupiah(inv.pembayaran) : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                            {sisa > 0 ? formatRupiah(sisa) : '-'}
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-500 dark:text-zinc-400 max-w-[150px] truncate" title={inv.noSpdBukuKas}>
                            {inv.noSpdBukuKas || '-'}
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-slate-500 dark:text-zinc-400">
                            {inv.lamaHariHutang ? `${inv.lamaHariHutang}h` : '0h'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              isInvoiceLunas 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {isInvoiceLunas ? 'Lunas' : 'Belum'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-[#12181f] flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-zinc-400">
                Total Nilai Sisa: <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatRupiah(selectedSupplier.totalSisaHutang)}</strong>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
