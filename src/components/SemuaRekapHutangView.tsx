import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CreditCard, 
  Building2, 
  Search, 
  Download, 
  Printer, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Layers, 
  PieChart as PieChartIcon, 
  BarChart3, 
  ShieldAlert, 
  ChevronRight, 
  X, 
  FileSpreadsheet, 
  Filter, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import * as XLSX from 'xlsx';
import { User } from 'firebase/auth';
import { formatRupiah } from '../utils/formatters';
import { idbGet } from '../utils/indexedDbStorage';
import { InvoiceHutang2025Record } from '../types/invoiceHutang';
import { INITIAL_INVOICE_HUTANG_2025 } from '../data/invoiceHutang2025Data';
import { INITIAL_INVOICE_HUTANG_2026 } from '../data/invoiceHutang2026Data';
import { 
  aggregateRekapHutang2025, 
  RekapPosBelanjaItem 
} from '../utils/rekapHutang2025Aggregator';
import { 
  aggregateRekapHutang2026, 
  PosBelanja2026Item 
} from '../utils/rekapHutang2026Aggregator';
import { useTheme } from '../context/ThemeContext';

interface SemuaRekapHutangViewProps {
  user?: User | null;
  role?: string;
  isAdmin?: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onNavigateSubmenu?: (subTab: string) => void;
}

interface TopHutangAgingItem {
  id: string;
  rank: number;
  rekanan: string;
  noInvoice: string;
  tglInvoice: string;
  jatuhTempo: string;
  tahun: string;
  uraian: string;
  kodeRekening?: string;
  lamaHariHutang: number;
  jumlahInvoice: number;
  pembayaran: number;
  sisaHutang: number;
  status: string;
  sumberAnggaran: string;
}

export const SemuaRekapHutangView: React.FC<SemuaRekapHutangViewProps> = ({
  user,
  role,
  isAdmin,
  onShowToast,
  onNavigateSubmenu
}) => {
  const { isDark } = useTheme();
  const isUserLoggedIn = Boolean(user);
  const isSuperAdmin = isUserLoggedIn && ((role === 'admin') || Boolean(isAdmin));
  const isPicHutangOrAdmin = isUserLoggedIn && (isSuperAdmin || (role === 'pic_hutang'));

  // States for raw invoice records
  const [invoices2025, setInvoices2025] = useState<InvoiceHutang2025Record[]>(() => {
    try {
      const saved = localStorage.getItem('rsud_invoice_hutang_2025');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_INVOICE_HUTANG_2025;
  });

  const [invoices2026, setInvoices2026] = useState<InvoiceHutang2025Record[]>(() => {
    try {
      const saved = localStorage.getItem('rsud_invoice_hutang_2026');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_INVOICE_HUTANG_2026;
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Filters & Tabs
  const [activeYearTab, setActiveYearTab] = useState<'semua' | '2025' | '2026'>('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'belum_lunas' | 'lunas'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [topAgingFilter, setTopAgingFilter] = useState<'semua' | 'belum_lunas'>('belum_lunas');

  // Drilldown modal state
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<any | null>(null);

  // Synchronize data from IndexedDB
  const syncAllHutangData = useCallback(async (showNotification = true) => {
    setIsSyncing(true);
    try {
      // 1. Fetch 2025 invoices
      let inv2025 = INITIAL_INVOICE_HUTANG_2025;
      const saved2025 = await idbGet<InvoiceHutang2025Record[]>('rsud_invoice_hutang_2025');
      if (saved2025 && Array.isArray(saved2025) && saved2025.length > 0) {
        inv2025 = saved2025;
      }
      setInvoices2025(inv2025);

      // 2. Fetch 2026 invoices
      let inv2026 = INITIAL_INVOICE_HUTANG_2026;
      const saved2026 = await idbGet<InvoiceHutang2025Record[]>('rsud_invoice_hutang_2026');
      if (saved2026 && Array.isArray(saved2026) && saved2026.length > 0) {
        inv2026 = saved2026;
      }
      setInvoices2026(inv2026);

      if (showNotification && onShowToast) {
        onShowToast('Data Semua Rekap Hutang (2025 & 2026) berhasil disinkronkan!', 'success');
      }
    } catch (e) {
      console.warn('Sync error in SemuaRekapHutangView:', e);
      if (showNotification && onShowToast) {
        onShowToast('Gagal menyinkronkan data hutang', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    syncAllHutangData(false);

    const handleUpdate = () => syncAllHutangData(false);
    window.addEventListener('rsud_invoice_hutang_2025_updated', handleUpdate);
    window.addEventListener('rsud_invoice_hutang_2026_updated', handleUpdate);
    window.addEventListener('rsud_rekap_hutang_2026_updated', handleUpdate);
    window.addEventListener('rsud_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('rsud_invoice_hutang_2025_updated', handleUpdate);
      window.removeEventListener('rsud_invoice_hutang_2026_updated', handleUpdate);
      window.removeEventListener('rsud_rekap_hutang_2026_updated', handleUpdate);
      window.removeEventListener('rsud_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [syncAllHutangData]);

  // Aggregated Pos Belanja
  const rekap2025List: RekapPosBelanjaItem[] = useMemo(() => {
    const raw = aggregateRekapHutang2025(invoices2025);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const customHighlights = JSON.parse(localStorage.getItem('rsud_rekap_2025_highlights') || '{}');
        return raw.map(item => {
          if (item.noUrut && typeof customHighlights[item.noUrut] === 'boolean') {
            return { ...item, isHighlighted: customHighlights[item.noUrut] };
          }
          return item;
        });
      }
    } catch (e) {}
    return raw;
  }, [invoices2025]);

  const rekap2026List: PosBelanja2026Item[] = useMemo(() => {
    const raw = aggregateRekapHutang2026(invoices2026);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const customHighlights = JSON.parse(localStorage.getItem('rsud_rekap_2026_highlights') || '{}');
        return raw.map(item => {
          if (item.noUrut && typeof customHighlights[item.noUrut] === 'boolean') {
            return { ...item, isHighlighted: customHighlights[item.noUrut] };
          }
          return item;
        });
      }
    } catch (e) {}
    return raw;
  }, [invoices2026]);

  // 1. Calculations for 2025
  const saldoAwal2025 = useMemo(() => {
    return rekap2025List.reduce((acc, curr) => acc + (curr.totalTagihan || 0), 0);
  }, [rekap2025List]);

  const koreksi2025 = useMemo(() => {
    return rekap2025List.reduce((acc, curr) => acc + (curr.koreksi || 0), 0);
  }, [rekap2025List]);

  const pembayaran2025 = useMemo(() => {
    return rekap2025List.reduce((acc, curr) => acc + (curr.jumlahBayar || 0), 0);
  }, [rekap2025List]);

  const saldoAkhir2025 = useMemo(() => {
    return rekap2025List.reduce((acc, curr) => {
      const sisa = curr.sisaHutang !== undefined ? curr.sisaHutang : ((curr.totalTagihan || 0) + (curr.koreksi || 0) - (curr.jumlahBayar || 0));
      return acc + sisa;
    }, 0);
  }, [rekap2025List]);

  // 2. Calculations for 2026 (Penambahan Barjas 2026)
  const saldoAwal2026 = useMemo(() => {
    return rekap2026List.reduce((acc, curr) => acc + (curr.totalTagihan || 0), 0);
  }, [rekap2026List]);

  const koreksi2026 = useMemo(() => {
    return rekap2026List.reduce((acc, curr) => acc + (curr.koreksi || 0), 0);
  }, [rekap2026List]);

  const pembayaran2026 = useMemo(() => {
    return rekap2026List.reduce((acc, curr) => acc + (curr.jumlahBayar || 0), 0);
  }, [rekap2026List]);

  const saldoAkhir2026 = useMemo(() => {
    return rekap2026List.reduce((acc, curr) => {
      const sisa = curr.sisaHutang !== undefined ? curr.sisaHutang : ((curr.totalTagihan || 0) + (curr.koreksi || 0) - (curr.jumlahBayar || 0));
      return acc + sisa;
    }, 0);
  }, [rekap2026List]);

  // Combined metrics
  const totalPembayaranTahun2026 = useMemo(() => {
    // Total realisasi pembayaran yang dicairkan (pembayaran hutang 2025 + pembayaran 2026)
    return pembayaran2025 + pembayaran2026;
  }, [pembayaran2025, pembayaran2026]);

  const totalSaldoAkhirSemuaTahun = useMemo(() => {
    return saldoAkhir2025 + saldoAkhir2026;
  }, [saldoAkhir2025, saldoAkhir2026]);

  const totalSaldoAwalGabungan = useMemo(() => {
    return saldoAwal2025 + saldoAwal2026;
  }, [saldoAwal2025, saldoAwal2026]);

  const totalKoreksiGabungan = useMemo(() => {
    return koreksi2025 + koreksi2026;
  }, [koreksi2025, koreksi2026]);

  // 3. TOP 10 HUTANG DENGAN UMUR TERLAMA
  const top10AgingList: TopHutangAgingItem[] = useMemo(() => {
    const list2025: TopHutangAgingItem[] = invoices2025.map((inv, idx) => {
      const sisa = inv.sisaHutang !== undefined ? inv.sisaHutang : (inv.jumlahInvoice - (inv.pembayaran || 0));
      return {
        id: `2025-${inv.id || idx}`,
        rank: 0,
        rekanan: inv.rekanan || 'REKANAN BLUD',
        noInvoice: inv.noInvoice || `INV-2025-${idx + 1}`,
        tglInvoice: inv.tglInvoice || inv.tglTandaTerima || '31/07/2025',
        jatuhTempo: inv.jatuhTempo || '-',
        tahun: '2025',
        uraian: inv.uraian || inv.subBelanja || 'Pengadaan Belanja Barang/Jasa',
        kodeRekening: inv.kodeRekening,
        lamaHariHutang: inv.lamaHariHutang || 395,
        jumlahInvoice: inv.jumlahInvoice || 0,
        pembayaran: inv.pembayaran || 0,
        sisaHutang: sisa,
        status: sisa <= 0 ? 'Lunas' : 'Belum Lunas',
        sumberAnggaran: inv.sumberAnggaran || 'BLUD'
      };
    });

    const list2026: TopHutangAgingItem[] = invoices2026.map((inv, idx) => {
      const sisa = inv.sisaHutang !== undefined ? inv.sisaHutang : (inv.jumlahInvoice - (inv.pembayaran || 0));
      return {
        id: `2026-${inv.id || idx}`,
        rank: 0,
        rekanan: inv.rekanan || 'REKANAN BLUD',
        noInvoice: inv.noInvoice || `INV-2026-${idx + 1}`,
        tglInvoice: inv.tglInvoice || inv.tglTandaTerima || '16/01/2026',
        jatuhTempo: inv.jatuhTempo || '-',
        tahun: '2026',
        uraian: inv.uraian || inv.subBelanja || 'Pengadaan Belanja Barang/Jasa',
        kodeRekening: inv.kodeRekening,
        lamaHariHutang: inv.lamaHariHutang || 224,
        jumlahInvoice: inv.jumlahInvoice || 0,
        pembayaran: inv.pembayaran || 0,
        sisaHutang: sisa,
        status: sisa <= 0 ? 'Lunas' : 'Belum Lunas',
        sumberAnggaran: inv.sumberAnggaran || 'BLUD'
      };
    });

    let combined = [...list2025, ...list2026];

    if (topAgingFilter === 'belum_lunas') {
      const unpaidOnly = combined.filter(i => i.sisaHutang > 0);
      if (unpaidOnly.length > 0) {
        combined = unpaidOnly;
      }
    }

    // Sort by lamaHariHutang descending, then by sisaHutang descending
    combined.sort((a, b) => {
      if (b.lamaHariHutang !== a.lamaHariHutang) {
        return b.lamaHariHutang - a.lamaHariHutang;
      }
      return b.sisaHutang - a.sisaHutang;
    });

    return combined.slice(0, 10).map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }, [invoices2025, invoices2026, topAgingFilter]);

  // 4. CHART DATA: Komparasi 2025 vs 2026
  const chartKomparasiData = useMemo(() => {
    return [
      {
        kategori: 'Saldo Awal / Pengadaan',
        'Tahun 2025': saldoAwal2025,
        'Tahun 2026': saldoAwal2026,
      },
      {
        kategori: 'Koreksi Pembukuan',
        'Tahun 2025': koreksi2025,
        'Tahun 2026': koreksi2026,
      },
      {
        kategori: 'Realisasi Pembayaran',
        'Tahun 2025': pembayaran2025,
        'Tahun 2026': pembayaran2026,
      },
      {
        kategori: 'Saldo Akhir (Sisa Hutang)',
        'Tahun 2025': saldoAkhir2025,
        'Tahun 2026': saldoAkhir2026,
      }
    ];
  }, [saldoAwal2025, saldoAwal2026, koreksi2025, koreksi2026, pembayaran2025, pembayaran2026, saldoAkhir2025, saldoAkhir2026]);

  // 5. CHART DATA: Komposisi Saldo Akhir Hutang Per Kategori Terbesar (Top 5 Pos Belanja)
  const chartPieKomposisiData = useMemo(() => {
    const mapPos = new Map<string, number>();

    // Combine 2025 & 2026 pos sisa hutang
    rekap2025List.forEach(item => {
      const sisa = item.sisaHutang !== undefined ? item.sisaHutang : ((item.totalTagihan || 0) + (item.koreksi || 0) - (item.jumlahBayar || 0));
      if (sisa > 0) {
        const key = item.kegiatan.replace(/^Belanja\s+/i, '').slice(0, 26);
        mapPos.set(key, (mapPos.get(key) || 0) + sisa);
      }
    });

    rekap2026List.forEach(item => {
      const sisa = item.sisaHutang !== undefined ? item.sisaHutang : ((item.totalTagihan || 0) + (item.koreksi || 0) - (item.jumlahBayar || 0));
      if (sisa > 0) {
        const key = item.kegiatan.replace(/^Belanja\s+/i, '').slice(0, 26);
        mapPos.set(key, (mapPos.get(key) || 0) + sisa);
      }
    });

    const entries = Array.from(mapPos.entries()).map(([name, value]) => ({ name, value }));
    entries.sort((a, b) => b.value - a.value);

    const top4 = entries.slice(0, 4);
    const othersValue = entries.slice(4).reduce((acc, curr) => acc + curr.value, 0);

    if (othersValue > 0) {
      top4.push({ name: 'Pos Lainnya', value: othersValue });
    }

    return top4;
  }, [rekap2025List, rekap2026List]);

  const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4'];

  // 6. FILTERED TABLE ITEMS FOR COMBINED REKAP
  const combinedTableRows = useMemo(() => {
    type UnifiedRow = {
      id: string;
      tahun: string;
      noUrut: number;
      kodeRekening: string;
      kegiatan: string;
      totalTagihan: number;
      koreksi: number;
      jumlahBayar: number;
      sisaHutang: number;
      invoiceCount: number;
      status: string;
      isHighlighted?: boolean;
    };

    let list: UnifiedRow[] = [];

    if (activeYearTab === 'semua' || activeYearTab === '2025') {
      rekap2025List.forEach((i, idx) => {
        const saldoAwal = i.totalTagihan || 0;
        const koreksi = i.koreksi || 0;
        const pembayaran = i.jumlahBayar || 0;
        const sisa = i.sisaHutang !== undefined ? i.sisaHutang : (saldoAwal + koreksi - pembayaran);
        list.push({
          id: `2025-${i.id || idx}`,
          tahun: '2025',
          noUrut: i.noUrut || (idx + 1),
          kodeRekening: i.kodeRekening || '-',
          kegiatan: i.kegiatan,
          totalTagihan: saldoAwal,
          koreksi: koreksi,
          jumlahBayar: pembayaran,
          sisaHutang: sisa,
          invoiceCount: i.invoiceCount || 0,
          status: sisa <= 0 ? 'Lunas' : 'Belum Lunas',
          isHighlighted: i.isHighlighted
        });
      });
    }

    if (activeYearTab === 'semua' || activeYearTab === '2026') {
      rekap2026List.forEach((i, idx) => {
        const saldoAwal = i.totalTagihan || 0;
        const koreksi = i.koreksi || 0;
        const pembayaran = i.jumlahBayar || 0;
        const sisa = i.sisaHutang !== undefined ? i.sisaHutang : (saldoAwal + koreksi - pembayaran);
        list.push({
          id: `2026-${i.id || idx}`,
          tahun: '2026',
          noUrut: i.noUrut || (idx + 1),
          kodeRekening: i.kodeRekening || '-',
          kegiatan: i.kegiatan,
          totalTagihan: saldoAwal,
          koreksi: koreksi,
          jumlahBayar: pembayaran,
          sisaHutang: sisa,
          invoiceCount: i.invoiceCount || 0,
          status: sisa <= 0 ? 'Lunas' : 'Belum Lunas',
          isHighlighted: i.isHighlighted
        });
      });
    }

    return list.filter(item => {
      // Status filter
      if (statusFilter === 'belum_lunas' && item.sisaHutang <= 0) return false;
      if (statusFilter === 'lunas' && item.sisaHutang > 0) return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.kegiatan.toLowerCase().includes(q) ||
          item.kodeRekening.toLowerCase().includes(q) ||
          item.tahun.includes(q) ||
          String(item.noUrut).includes(q)
        );
      }
      return true;
    });
  }, [activeYearTab, statusFilter, searchQuery, rekap2025List, rekap2026List]);

  // Export Excel
  const handleExportCombinedExcel = () => {
    const rows = combinedTableRows.map((item, idx) => ({
      'NO': item.noUrut || (idx + 1),
      'TAHUN ANGGARAN': item.tahun,
      'KODE REKENING': item.kodeRekening,
      'URAIAN / POS BELANJA': item.kegiatan,
      'SALDO AWAL (TAGIHAN)': item.totalTagihan,
      'KOREKSI': item.koreksi,
      'REALISASI PEMBAYARAN': item.jumlahBayar,
      'SALDO AKHIR (SISA HUTANG)': item.sisaHutang,
      'JUMLAH INVOICE': item.invoiceCount,
      'STATUS': item.status
    }));

    rows.push({
      'NO': 'TOTAL' as any,
      'TAHUN ANGGARAN': 'SEMUA TAHUN',
      'KODE REKENING': '',
      'URAIAN / POS BELANJA': 'TOTAL KESELURUHAN REKAP HUTANG',
      'SALDO AWAL (TAGIHAN)': totalSaldoAwalGabungan,
      'KOREKSI': totalKoreksiGabungan,
      'REALISASI PEMBAYARAN': totalPembayaranTahun2026,
      'SALDO AKHIR (SISA HUTANG)': totalSaldoAkhirSemuaTahun,
      'JUMLAH INVOICE': combinedTableRows.reduce((a, b) => a + b.invoiceCount, 0),
      'STATUS': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Semua_Rekap_Hutang');
    XLSX.writeFile(workbook, `SEMUA_REKAP_HUTANG_RSUD_JATISARI_${new Date().toISOString().slice(0, 10)}.xlsx`);

    if (onShowToast) onShowToast('Data Semua Rekap Hutang berhasil diekspor ke Excel', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/30">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Sub Bagian Keuangan & Pengadaan BLUD
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-indigo-400 shrink-0" />
            SEMUA REKAP HUTANG (TA 2025 & 2026)
          </h2>
          <p className="text-indigo-200/90 text-xs sm:text-sm mt-1.5 max-w-3xl leading-relaxed">
            Ringkasan konsolidasi kewajiban belanja RSUD Jatisari: Saldo Awal Hutang 2025, Penambahan Pengadaan Barjas 2026, Realisasi Pembayaran 2026, Saldo Akhir Per Tahun, serta Analisis Umur Hutang Terlama (Aging).
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {isPicHutangOrAdmin && (
            <button
              onClick={() => syncAllHutangData(true)}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition transform active:scale-95 flex items-center gap-2 border border-indigo-400/40 disabled:opacity-50 cursor-pointer"
              title="Sinkronkan data dari Invoice Hutang 2025 & 2026"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>SINKRONISASI DATA</span>
            </button>
          )}

          <button
            onClick={handleExportCombinedExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition transform active:scale-95 flex items-center gap-2 border border-emerald-400/40 cursor-pointer"
            title="Export Excel Rekap Hutang"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT EXCEL</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN MANDATORY KPI STATS PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: SALDO AWAL HUTANG 2025 */}
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-indigo-950/80 shadow-sm relative overflow-hidden group hover:border-indigo-400 dark:hover:border-indigo-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              SALDO AWAL HUTANG 2025
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
              TA 2025
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            {formatRupiah(saldoAwal2025)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-zinc-400">Koreksi: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{formatRupiah(koreksi2025)}</strong></span>
            <span className="text-slate-500 dark:text-zinc-400">Fix: <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{formatRupiah(saldoAwal2025 + koreksi2025)}</strong></span>
          </div>
        </div>

        {/* CARD 2: SALDO AWAL HUTANG 2026 / PENAMBAHAN BARJAS 2026 */}
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-indigo-950/80 shadow-sm relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              SALDO AWAL HUTANG 2026 / PENAMBAHAN BARJAS 2026
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              TA 2026
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">
            {formatRupiah(saldoAwal2026)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-zinc-400">Koreksi: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{formatRupiah(koreksi2026)}</strong></span>
            <span className="text-slate-500 dark:text-zinc-400">Fix: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatRupiah(saldoAwal2026 + koreksi2026)}</strong></span>
          </div>
        </div>

        {/* CARD 3: PEMBAYARAN HUTANG 2026 */}
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-indigo-950/80 shadow-sm relative overflow-hidden group hover:border-teal-400 dark:hover:border-teal-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              PEMBAYARAN HUTANG 2026
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Realisasi
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-2 tracking-tight">
            {formatRupiah(totalPembayaranTahun2026)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-zinc-400">Bayar Hutang '25: <strong className="text-slate-700 dark:text-zinc-200">{formatRupiah(pembayaran2025)}</strong></span>
            <span className="text-slate-500 dark:text-zinc-400">Bayar '26: <strong className="text-slate-700 dark:text-zinc-200">{formatRupiah(pembayaran2026)}</strong></span>
          </div>
        </div>

        {/* CARD 4: SALDO AKHIR HUTANG PER TAHUN (2025 & 2026) */}
        <div className="bg-gradient-to-br from-rose-50 to-pink-50/60 dark:from-[#1a0c14] dark:to-[#260f1e] rounded-2xl p-5 border border-rose-200 dark:border-rose-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              SALDO AKHIR HUTANG (TOTAL)
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-200 dark:bg-rose-950 text-rose-900 dark:text-rose-200">
              Sisa Kewajiban
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 tracking-tight">
            {formatRupiah(totalSaldoAkhirSemuaTahun)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-rose-200 dark:border-rose-900/60 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white/80 dark:bg-black/40 px-2 py-1 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
              <span className="text-slate-500 dark:text-zinc-400 block text-[9.5px]">Sisa TA 2025:</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">{formatRupiah(saldoAkhir2025)}</span>
            </div>
            <div className="bg-white/80 dark:bg-black/40 px-2 py-1 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
              <span className="text-slate-500 dark:text-zinc-400 block text-[9.5px]">Sisa TA 2026:</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">{formatRupiah(saldoAkhir2026)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SECTION GRAFIK (CHARTS SECTION) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAFIK 1: Komparasi Antar Tahun (BarChart) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0d1216] rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-lg">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  GRAFIK KOMPARASI KEUANGAN HUTANG (2025 vs 2026)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Perbandingan Saldo Awal, Koreksi, Realisasi Pembayaran, dan Saldo Akhir (Sisa Hutang).
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#6366f1]"></span>
                <span className="text-slate-700 dark:text-zinc-300">Tahun 2025</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#10b981]"></span>
                <span className="text-slate-700 dark:text-zinc-300">Tahun 2026</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartKomparasiData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} />
                <XAxis 
                  dataKey="kategori" 
                  tick={{ fill: isDark ? '#a1a1aa' : '#64748b', fontSize: 11 }} 
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fill: isDark ? '#a1a1aa' : '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}Jt`}
                />
                <Tooltip 
                  formatter={(val: any) => [formatRupiah(val), '']}
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: isDark ? '#3f3f46' : '#e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: isDark ? '#f4f4f5' : '#0f172a'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Tahun 2025" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tahun 2026" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAFIK 2: Komposisi Sisa Hutang Per Pos Belanja Terbesar */}
        <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded-lg">
                <PieChartIcon className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                KOMPOSISI SALDO AKHIR HUTANG
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Proporsi sisa hutang per pos belanja terbesar RSUD.
            </p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartPieKomposisiData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartPieKomposisiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [formatRupiah(val), 'Sisa']}
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: isDark ? '#3f3f46' : '#e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: isDark ? '#f4f4f5' : '#0f172a'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Sisa</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {(totalSaldoAkhirSemuaTahun / 1000000000).toFixed(1)} Miliar
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
            {chartPieKomposisiData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span className="text-slate-700 dark:text-zinc-300 truncate">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white shrink-0 font-mono">
                  {formatRupiah(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. TOP 10 HUTANG DENGAN UMUR TERLAMA */}
      <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-wide uppercase">
                TOP 10 HUTANG DENGAN UMUR TERLAMA (AGING TERBESAR)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Daftar 10 kewajiban/invoice dengan umur penagihan terpanjang yang memerlukan perhatian khusus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-zinc-800 p-1 text-xs">
              <button
                onClick={() => setTopAgingFilter('belum_lunas')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  topAgingFilter === 'belum_lunas'
                    ? 'bg-white dark:bg-[#0d1216] text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                Hanya Belum Lunas
              </button>
              <button
                onClick={() => setTopAgingFilter('semua')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  topAgingFilter === 'semua'
                    ? 'bg-white dark:bg-[#0d1216] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                Semua Invoice
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100/90 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="px-3 py-3 text-center w-14">PERINGKAT</th>
                <th className="px-4 py-3">REKANAN / NAMA VENDOR</th>
                <th className="px-4 py-3">NO. INVOICE & POS BELANJA</th>
                <th className="px-3 py-3 text-center">TAHUN</th>
                <th className="px-3 py-3 text-center">UMUR HUTANG</th>
                <th className="px-4 py-3 text-right">TAGIHAN AWAL</th>
                <th className="px-4 py-3 text-right">SUDAH DIBAYAR</th>
                <th className="px-4 py-3 text-right">SISA HUTANG</th>
                <th className="px-3 py-3 text-center">STATUS</th>
                <th className="px-3 py-3 text-center w-14">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {top10AgingList.map((item) => {
                const isCritical = item.lamaHariHutang > 365;
                const isWarning = item.lamaHariHutang > 180;

                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#141c24] transition bg-white dark:bg-[#0d1216]"
                  >
                    {/* Rank Badge */}
                    <td className="px-3 py-3 text-center">
                      {item.rank === 1 && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-sm ring-2 ring-amber-300/60">
                          #1
                        </span>
                      )}
                      {item.rank === 2 && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs shadow-sm ring-2 ring-slate-200">
                          #2
                        </span>
                      )}
                      {item.rank === 3 && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-black text-xs shadow-sm ring-2 ring-amber-500/40">
                          #3
                        </span>
                      )}
                      {item.rank > 3 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold text-[11px]">
                          #{item.rank}
                        </span>
                      )}
                    </td>

                    {/* Rekanan */}
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{item.rekanan}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                        Sumber: {item.sumberAnggaran} • Tgl: {item.tglInvoice}
                      </div>
                    </td>

                    {/* Invoice & Uraian */}
                    <td className="px-4 py-3">
                      <div className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                        {item.noInvoice}
                      </div>
                      <div className="text-[10.5px] text-slate-600 dark:text-zinc-300 truncate max-w-xs mt-0.5">
                        {item.uraian}
                      </div>
                    </td>

                    {/* Tahun */}
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.tahun === '2025'
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {item.tahun}
                      </span>
                    </td>

                    {/* Umur Hutang */}
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono ${
                        isCritical
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : isWarning
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {item.lamaHariHutang} Hari
                      </span>
                    </td>

                    {/* Nominal */}
                    <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-zinc-300">
                      {formatRupiah(item.jumlahInvoice)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      {item.pembayaran > 0 ? formatRupiah(item.pembayaran) : '-'}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {item.sisaHutang > 0 ? formatRupiah(item.sisaHutang) : <span className="text-emerald-500 font-bold">LUNAS</span>}
                    </td>

                    {/* Status Badge */}
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => setSelectedRecordDetail(item)}
                        className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                        title="Lihat Detail Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. TABEL KONSOLIDASI LENGKAP PER POS BELANJA (2025 & 2026) */}
      <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-lg">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                TABEL REKAPITULASI POS BELANJA KONSOLIDASI (2025 & 2026)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Rincian pos belanja dan realisasi pembayaran seluruh tahun anggaran RSUD Jatisari.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Year Tab */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-zinc-800 p-1 text-xs">
              <button
                onClick={() => setActiveYearTab('semua')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  activeYearTab === 'semua'
                    ? 'bg-white dark:bg-[#0d1216] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                Semua Tahun
              </button>
              <button
                onClick={() => setActiveYearTab('2025')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  activeYearTab === '2025'
                    ? 'bg-white dark:bg-[#0d1216] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                TA 2025
              </button>
              <button
                onClick={() => setActiveYearTab('2026')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  activeYearTab === '2026'
                    ? 'bg-white dark:bg-[#0d1216] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                TA 2026
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
            >
              <option value="semua">Semua Status</option>
              <option value="belum_lunas">Hanya Belum Lunas</option>
              <option value="lunas">Hanya Lunas</option>
            </select>

            {/* Search Input */}
            <div className="relative w-44 sm:w-52">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari uraian / kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
              />
            </div>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              title="Cetak Tabel"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#e6f4ea] dark:bg-[#1a382b] text-[#13422d] dark:text-[#a6ecc8] font-bold border-b border-[#a8dbc0] dark:border-[#2b5a45] uppercase text-[10.5px] tracking-wide">
              <tr>
                <th className="px-3 py-3 text-center w-12 border-r border-[#c2e5d2] dark:border-[#2b5a45]">NO</th>
                <th className="px-3 py-3 text-center w-20 border-r border-[#c2e5d2] dark:border-[#2b5a45]">TAHUN</th>
                <th className="px-4 py-3 border-r border-[#c2e5d2] dark:border-[#2b5a45]">URAIAN / POS BELANJA</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">SALDO AWAL (TAGIHAN)</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">KOREKSI</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">PEMBAYARAN</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">SALDO AKHIR</th>
                <th className="px-3 py-3 text-center w-24">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80">
              {combinedTableRows.map((item, idx) => {
                const isHigh = item.isHighlighted;
                return (
                  <tr 
                    key={item.id}
                    className={`transition ${
                      isHigh 
                        ? 'bg-[#ffff00] hover:bg-[#f6ee00] text-black font-semibold dark:bg-[#c9a600] dark:text-black' 
                        : 'hover:bg-slate-50/90 dark:hover:bg-[#141c24]/90 bg-white dark:bg-[#0d1216]'
                    }`}
                  >
                    <td className="px-3 py-2.5 text-center font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                      {item.noUrut || (idx + 1)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold border-r border-slate-200 dark:border-zinc-800">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        item.tahun === '2025'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {item.tahun}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-200 dark:border-zinc-800">
                      <div className="font-semibold text-xs leading-snug">{item.kegiatan}</div>
                      <div className={`text-[10px] font-mono mt-0.5 ${isHigh ? 'text-black/80 font-medium' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {item.kodeRekening} • {item.invoiceCount} Invoice
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                      {formatRupiah(item.totalTagihan)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                      {item.koreksi > 0 ? formatRupiah(item.koreksi) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium border-r border-slate-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400">
                      {item.jumlahBayar > 0 ? formatRupiah(item.jumlahBayar) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold border-r border-slate-200 dark:border-zinc-800">
                      {item.sisaHutang > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-[#d7a9be] dark:bg-[#722c4d] text-slate-900 dark:text-pink-100 font-bold">
                          {formatRupiah(item.sisaHutang)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase ${
                        item.status === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* TOTAL FOOTER */}
            <tfoot className="bg-[#dbe7e1] dark:bg-[#1a2e24] font-bold border-t-2 border-[#8dbba5] dark:border-[#2b5a45] text-[#123827] dark:text-white">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                  TOTAL KESELURUHAN:
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                  {formatRupiah(combinedTableRows.reduce((a, b) => a + b.totalTagihan, 0))}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                  {formatRupiah(combinedTableRows.reduce((a, b) => a + b.koreksi, 0))}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                  {formatRupiah(combinedTableRows.reduce((a, b) => a + b.jumlahBayar, 0))}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-rose-900 dark:text-pink-300 border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                  {formatRupiah(combinedTableRows.reduce((a, b) => a + b.sisaHutang, 0))}
                </td>
                <td className="px-3 py-3 text-center font-mono text-[10.5px]">
                  {combinedTableRows.reduce((a, b) => a + b.invoiceCount, 0)} Inv
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL DRILLDOWN SINGLE INVOICE */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Ranking #{selectedRecordDetail.rank || 1}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                  TA {selectedRecordDetail.tahun}
                </span>
              </div>
              <button 
                onClick={() => setSelectedRecordDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-semibold">Nama Rekanan / Perusahaan:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedRecordDetail.rekanan}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-[#12181f] p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">No. Invoice:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedRecordDetail.noInvoice}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">Umur Hutang:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{selectedRecordDetail.lamaHariHutang} Hari</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-semibold">Uraian / Pos Belanja:</span>
                <span className="font-medium text-slate-700 dark:text-zinc-200">{selectedRecordDetail.uraian}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-center">
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">Total Tagihan</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(selectedRecordDetail.jumlahInvoice)}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">Realisasi Bayar</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{formatRupiah(selectedRecordDetail.pembayaran)}</span>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/40">
                  <span className="text-[10px] text-rose-700 dark:text-rose-300 block">Sisa Hutang</span>
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-300">{formatRupiah(selectedRecordDetail.sisaHutang)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
