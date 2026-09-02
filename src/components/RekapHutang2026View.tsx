import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Building2, 
  RefreshCw, 
  Eye, 
  X, 
  FileSpreadsheet 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User } from 'firebase/auth';
import { syncHighlightsToFirestore } from '../services/firestoreSync';
import { ImportInvoiceExcelModal } from './ImportInvoiceExcelModal';
import { 
  aggregateRekapHutang2026, 
  PosBelanja2026Item, 
  MASTER_31_POS_BELANJA_2026 
} from '../utils/rekapHutang2026Aggregator';
import { InvoiceHutang2026Record } from '../types/invoiceHutang';
import { INITIAL_INVOICE_HUTANG_2026 } from '../data/invoiceHutang2026Data';
import { idbGet, idbSet } from '../utils/indexedDbStorage';
import { formatRupiah } from '../utils/formatters';

const STORAGE_KEY = 'rsud_rekap_pengadaan_hutang_2026_master_v3';
const IDB_KEY_INVOICE_2026 = 'rsud_invoice_hutang_2026';

// Module-level singleton cache
let inMemoryRekap2026Cache: PosBelanja2026Item[] | null = null;

const getInitialRekap2026Data = (): PosBelanja2026Item[] => {
  if (inMemoryRekap2026Cache && inMemoryRekap2026Cache.length > 0) {
    return inMemoryRekap2026Cache;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryRekap2026Cache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load Rekap Hutang 2026 storage', e);
  }
  const init = aggregateRekapHutang2026(INITIAL_INVOICE_HUTANG_2026);
  inMemoryRekap2026Cache = init;
  return init;
};

interface RekapHutang2026ViewProps {
  user?: User | null;
  role?: string;
  isAdmin?: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const RekapHutang2026View: React.FC<RekapHutang2026ViewProps> = ({
  user,
  role,
  isAdmin,
  onShowToast,
}) => {
  const isUserLoggedIn = Boolean(user);
  const isSuperAdmin = isUserLoggedIn && ((role === 'admin') || Boolean(isAdmin));
  const isPicHutangOrAdmin = isUserLoggedIn && (isSuperAdmin || (role === 'pic_hutang'));

  const canModifyRecord = (record: any) => {
    if (!isUserLoggedIn) return false;
    if (isSuperAdmin) return true;
    if (role === 'pic_hutang') {
      if (!record?.createdBy || record?.createdBy === user?.email) return true;
    }
    return false;
  };

  const [items, setItems] = useState<PosBelanja2026Item[]>(getInitialRekap2026Data);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncingNominal, setIsSyncingNominal] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PosBelanja2026Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PosBelanja2026Item | null>(null);
  const [selectedPosBelanjaDetail, setSelectedPosBelanjaDetail] = useState<PosBelanja2026Item | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState('');

  // Form states
  const [formNoUrut, setFormNoUrut] = useState<string>('1');
  const [formKode, setFormKode] = useState('5.1.02.01.01.0019');
  const [formKegiatan, setFormKegiatan] = useState('');
  const [formTotal, setFormTotal] = useState('');
  const [formKoreksi, setFormKoreksi] = useState('0');
  const [formPembayaran, setFormPembayaran] = useState('0');
  const [formIsHighlighted, setFormIsHighlighted] = useState(false);

  // Core Sync from Invoice Hutang 2026 Data (IndexedDB / fallback)
  const refreshRekap2026 = useCallback(async (forcedInvoices?: InvoiceHutang2026Record[], showToastMessage = true) => {
    setIsSyncingNominal(true);
    try {
      let invoices: InvoiceHutang2026Record[] = forcedInvoices || INITIAL_INVOICE_HUTANG_2026;
      if (!forcedInvoices) {
        const saved = await idbGet<InvoiceHutang2026Record[]>(IDB_KEY_INVOICE_2026);
        if (saved && Array.isArray(saved) && saved.length > 0) {
          invoices = saved;
        }
      }

      const aggregated = aggregateRekapHutang2026(invoices);
      let customHighlights: Record<number, boolean> = {};
      try {
        customHighlights = JSON.parse(localStorage.getItem('rsud_rekap_2026_highlights') || '{}');
      } catch (e) {}

      const adjusted = aggregated.map(item => {
        if (item.noUrut && typeof customHighlights[item.noUrut] === 'boolean') {
          return { ...item, isHighlighted: customHighlights[item.noUrut] };
        }
        return item;
      });

      inMemoryRekap2026Cache = adjusted;
      setItems(adjusted);
      
      try {
        idbSet(STORAGE_KEY, adjusted);
      } catch (err) {
        console.warn('Failed to save aggregated rekap 2026 to localStorage', err);
      }

      if (showToastMessage && onShowToast) {
        onShowToast('Data Rekap Pengadaan Hutang 2026 berhasil disinkronkan dengan data Invoice Hutang 2026 berdasarkan Jenis Pengadaan!', 'success');
      }
    } catch (err) {
      console.warn('Failed to sync Rekap Hutang 2026 from Invoices:', err);
      if (showToastMessage && onShowToast) {
        onShowToast('Gagal menyinkronkan data rekap 2026', 'error');
      }
    } finally {
      setIsSyncingNominal(false);
    }
  }, [onShowToast]);

  // Initial mount sync from IndexedDB
  useEffect(() => {
    refreshRekap2026(undefined, false);
  }, [refreshRekap2026]);

  // Listen to update events from Invoice Hutang 2026
  useEffect(() => {
    const handleInvoiceUpdate = (e: any) => {
      const updatedInvoices = e.detail;
      if (Array.isArray(updatedInvoices)) {
        refreshRekap2026(updatedInvoices, false);
      } else {
        refreshRekap2026(undefined, false);
      }
    };

    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === IDB_KEY_INVOICE_2026) {
        refreshRekap2026(undefined, false);
      }
    };

    window.addEventListener('rsud_invoice_hutang_2026_updated', handleInvoiceUpdate);
    window.addEventListener('rsud_rekap_hutang_2026_updated', () => refreshRekap2026(undefined, false));
    window.addEventListener('rsud_data_updated', () => refreshRekap2026(undefined, false));
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('rsud_invoice_hutang_2026_updated', handleInvoiceUpdate);
      window.removeEventListener('rsud_rekap_hutang_2026_updated', () => refreshRekap2026(undefined, false));
      window.removeEventListener('rsud_data_updated', () => refreshRekap2026(undefined, false));
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [refreshRekap2026]);

  const saveRekapData = (updated: PosBelanja2026Item[]) => {
    inMemoryRekap2026Cache = updated;
    setItems(updated);
    try {
      idbSet(STORAGE_KEY, updated);
    } catch (e) {
      console.error('Failed to save Rekap 2026 data', e);
    }
    window.dispatchEvent(new CustomEvent('rsud_rekap_hutang_2026_updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('rsud_data_updated'));
  };

  // Filtered items
  const displayedItems = useMemo(() => {
    return items.filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.kegiatan || '').toLowerCase().includes(q) ||
        (item.kodeRekening || '').toLowerCase().includes(q) ||
        String(item.noUrut || '').includes(q)
      );
    });
  }, [items, searchQuery]);

  // Aggregate statistics
  const totalSaldoAwal = useMemo(() => {
    return displayedItems.reduce((acc, curr) => acc + (curr.totalTagihan || 0), 0);
  }, [displayedItems]);

  const totalKoreksi = useMemo(() => {
    return displayedItems.reduce((acc, curr) => acc + (curr.koreksi || 0), 0);
  }, [displayedItems]);

  const totalFix = useMemo(() => {
    return totalSaldoAwal + totalKoreksi;
  }, [totalSaldoAwal, totalKoreksi]);

  const totalSudahDibayar = useMemo(() => {
    return displayedItems.reduce((acc, curr) => acc + (curr.jumlahBayar || 0), 0);
  }, [displayedItems]);

  const totalHutangAktif = useMemo(() => {
    return displayedItems.reduce((acc, curr) => {
      const akhir = curr.sisaHutang !== undefined ? curr.sisaHutang : ((curr.totalTagihan || 0) + (curr.koreksi || 0) - (curr.jumlahBayar || 0));
      return acc + akhir;
    }, 0);
  }, [displayedItems]);

  const lunasCount = useMemo(() => {
    return displayedItems.filter(i => {
      const sisa = i.sisaHutang !== undefined ? i.sisaHutang : ((i.totalTagihan || 0) + (i.koreksi || 0) - (i.jumlahBayar || 0));
      return sisa <= 0;
    }).length;
  }, [displayedItems]);

  const belumLunasCount = useMemo(() => {
    return displayedItems.length - lunasCount;
  }, [displayedItems, lunasCount]);

  const totalInvoicesCount = useMemo(() => {
    return displayedItems.reduce((acc, curr) => acc + (curr.invoiceCount || 0), 0);
  }, [displayedItems]);

  // Handlers
  const handleOpenAdd = () => {
    const nextNo = items.length > 0 ? Math.max(...items.map(i => i.noUrut || 0)) + 1 : 1;
    setFormNoUrut(String(nextNo));
    setFormKode('5.1.02.01.01.0019');
    setFormKegiatan('');
    setFormTotal('');
    setFormKoreksi('0');
    setFormPembayaran('0');
    setFormIsHighlighted(false);
    setIsAddOpen(true);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const tagihan = parseFloat(formTotal) || 0;
    const koreksi = parseFloat(formKoreksi) || 0;
    const bayar = parseFloat(formPembayaran) || 0;
    const sisa = Math.max(0, tagihan + koreksi - bayar);

    const newItem: PosBelanja2026Item = {
      id: `HUT-26-${Date.now()}`,
      noUrut: parseInt(formNoUrut, 10) || (items.length + 1),
      kodeRekening: formKode.trim(),
      kegiatan: formKegiatan.trim(),
      totalTagihan: tagihan,
      koreksi: koreksi,
      jumlahBayar: bayar,
      sisaHutang: sisa,
      invoiceCount: 0,
      invoices: [],
      isHighlighted: formIsHighlighted,
      createdBy: user?.email || undefined,
      updatedAt: new Date().toISOString()
    };

    saveRekapData([newItem, ...items]);
    setIsAddOpen(false);
    if (onShowToast) onShowToast('Data pengadaan hutang 2026 berhasil ditambahkan!', 'success');
  };

  const handleOpenEdit = (item: PosBelanja2026Item) => {
    setEditingItem(item);
    setFormNoUrut(String(item.noUrut || ''));
    setFormKode(item.kodeRekening || '');
    setFormKegiatan(item.kegiatan || '');
    setFormTotal(String(item.totalTagihan || 0));
    setFormKoreksi(String(item.koreksi || 0));
    setFormPembayaran(String(item.jumlahBayar || 0));
    setFormIsHighlighted(Boolean(item.isHighlighted));
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const tagihan = parseFloat(formTotal) || 0;
    const koreksi = parseFloat(formKoreksi) || 0;
    const bayar = parseFloat(formPembayaran) || 0;
    const sisa = Math.max(0, tagihan + koreksi - bayar);

    const targetNo = parseInt(formNoUrut, 10) || editingItem.noUrut;
    if (targetNo) {
      try {
        const customHighlights = JSON.parse(localStorage.getItem('rsud_rekap_2026_highlights') || '{}');
        customHighlights[targetNo] = formIsHighlighted;
        localStorage.setItem('rsud_rekap_2026_highlights', JSON.stringify(customHighlights));
        syncHighlightsToFirestore('2026', customHighlights);
      } catch (e) {
        console.warn('Failed to save highlight preference', e);
      }
    }

    const updated = items.map(i => {
      if (i.id === editingItem.id) {
        return {
          ...i,
          noUrut: parseInt(formNoUrut, 10) || i.noUrut,
          kodeRekening: formKode.trim(),
          kegiatan: formKegiatan.trim(),
          totalTagihan: tagihan,
          koreksi: koreksi,
          jumlahBayar: bayar,
          sisaHutang: sisa,
          isHighlighted: formIsHighlighted,
          updatedAt: new Date().toISOString()
        };
      }
      return i;
    });

    saveRekapData(updated);
    setIsEditOpen(false);
    setEditingItem(null);
    if (onShowToast) onShowToast('Data rekap pengadaan hutang 2026 berhasil diperbarui!', 'success');
  };

  const handlePromptDelete = (item: PosBelanja2026Item) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const name = itemToDelete.kegiatan;
    const updated = items.filter(i => i.id !== itemToDelete.id);
    saveRekapData(updated);
    if (onShowToast) onShowToast(`Pos Belanja "${name}" berhasil dihapus`, 'info');
    setItemToDelete(null);
  };

  const handleExportRekap2026Excel = () => {
    const rows = displayedItems.map((item, idx) => {
      const saldoAwal = item.totalTagihan || 0;
      const koreksi = item.koreksi || 0;
      const pembayaran = item.jumlahBayar || 0;
      const saldoAkhir = item.sisaHutang !== undefined ? item.sisaHutang : (saldoAwal + koreksi - pembayaran);
      return {
        'NO': item.noUrut || (idx + 1),
        'KODE REKENING': item.kodeRekening || '',
        'URAIAN / JENIS PENGADAAN': item.kegiatan,
        'SALDO AWAL (HUTANG 2026)': saldoAwal,
        'KOREKSI': koreksi,
        'PEMBAYARAN': pembayaran,
        'SALDO AKHIR': saldoAkhir,
        'JUMLAH INVOICE': item.invoiceCount || 0,
        'STATUS': saldoAkhir <= 0 ? 'LUNAS' : 'BELUM LUNAS'
      };
    });

    rows.push({
      'NO': 'TOTAL' as any,
      'KODE REKENING': '',
      'URAIAN / JENIS PENGADAAN': 'TOTAL KESELURUHAN',
      'SALDO AWAL (HUTANG 2026)': totalSaldoAwal,
      'KOREKSI': totalKoreksi,
      'PEMBAYARAN': totalSudahDibayar,
      'SALDO AKHIR': totalHutangAktif,
      'JUMLAH INVOICE': totalInvoicesCount,
      'STATUS': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Hutang_2026');
    XLSX.writeFile(workbook, `REKAP_PENGADAAN_HUTANG_2026_${new Date().toISOString().slice(0, 10)}.xlsx`);
    if (onShowToast) onShowToast('Data Rekap Pengadaan Hutang 2026 berhasil diexport ke Excel', 'success');
  };

  const handlePrintRekap2026 = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50/70 to-slate-50 dark:from-slate-950 dark:via-[#0e1222] dark:to-indigo-950 text-slate-900 dark:text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-200 dark:border-indigo-900/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs font-semibold mb-2 border border-indigo-300 dark:border-indigo-500/30">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Sub Bagian Keuangan & Pengadaan
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            REKAP PENGADAAN HUTANG 2026
          </h2>
          <p className="text-slate-600 dark:text-indigo-200/80 text-xs mt-1 max-w-2xl leading-relaxed">
            Data tersinkronisasi langsung dari sub menu <strong className="font-semibold text-indigo-800 dark:text-indigo-300">INVOICE HUTANG 2026</strong> berdasarkan Jenis Pengadaan & Pos Belanja RSUD Jatisari TA 2026.
          </p>
        </div>

        {isPicHutangOrAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-emerald-500/40"
            >
              <FileSpreadsheet className="w-4 h-4" /> Import Excel
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-indigo-500/40"
            >
              <Plus className="w-4 h-4" /> ENTRI PENGADAAN
            </button>
          </div>
        )}
      </div>

      {isUploadOpen && (
        <ImportInvoiceExcelModal 
          isOpen={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)} 
          year={2026}
          existingCount={0}
          onImportSuccess={async (records, mode) => {
            let newRecords = records;
            if (mode === 'append') {
               const existing = await idbGet<InvoiceHutang2026Record[]>('rsud_invoice_hutang_2026') || [];
               newRecords = [...existing, ...records];
            }
            await idbSet('rsud_invoice_hutang_2026', newRecords);
            window.dispatchEvent(new CustomEvent('rsud_invoice_hutang_2026_updated', { detail: newRecords }));
            if (onShowToast) onShowToast(`Berhasil mengimpor ${records.length} data Invoice Hutang 2026!`, 'success');
          }}
        />
      )}

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Saldo Awal (2026)</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2">{formatRupiah(totalSaldoAwal)}</div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 font-medium">
            Total Fix (+Koreksi): <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatRupiah(totalFix)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Realisasi Pembayaran</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{formatRupiah(totalSudahDibayar)}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {lunasCount} Pos Belanja Lunas
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Saldo Akhir (Sisa Hutang)</div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2">{formatRupiah(totalHutangAktif)}</div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {belumLunasCount} Pos Belum Lunas
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Pos Belanja 2026</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2">{displayedItems.length} Pos Belanja</div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 font-medium">
            Total Koreksi: <span className="font-semibold text-amber-600 dark:text-amber-400">{formatRupiah(totalKoreksi)}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Data Table */}
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl border border-slate-200 dark:border-emerald-950/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Tersinkronisasi Otomatis Dari Invoice Hutang 2026
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500">•</span>
              <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                {displayedItems.length} Pos Belanja TA 2026 • {totalInvoicesCount} Total Invoice
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              REKAP PENGADAAN HUTANG TAHUN ANGGARAN 2026
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Semua nominal teragregasi otomatis dari sub menu <strong className="text-emerald-700 dark:text-emerald-300">INVOICE HUTANG 2026</strong> berdasarkan Jenis Pengadaan.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari uraian / kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
              />
            </div>

            <button
              onClick={() => refreshRekap2026(undefined, true)}
              disabled={isSyncingNominal}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition transform active:scale-95 cursor-pointer disabled:opacity-50"
              title="Update nominal dan sinkronkan dengan sub menu INVOICE HUTANG 2026"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNominal ? 'animate-spin' : ''}`} />
              <span>UPDATE NOMINAL</span>
            </button>

            <button
              onClick={handleExportRekap2026Excel}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              title="Export data Rekap ke Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export Excel</span>
            </button>

            <button
              onClick={handlePrintRekap2026}
              className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Cetak Rekapitulasi"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {isPicHutangOrAdmin && (
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> ENTRI PENGADAAN
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#a8dbc0] dark:border-[#2b5a45]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#e6f4ea] dark:bg-[#1a382b] text-[#13422d] dark:text-[#a6ecc8] font-bold border-b border-[#a8dbc0] dark:border-[#2b5a45] uppercase text-[10.5px] tracking-wide">
              <tr>
                <th className="px-3 py-3 text-center w-12 border-r border-[#c2e5d2] dark:border-[#2b5a45]">NO</th>
                <th className="px-4 py-3 border-r border-[#c2e5d2] dark:border-[#2b5a45]">URAIAN / JENIS PENGADAAN</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">SALDO AWAL (HUTANG 2026)</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">KOREKSI</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">PEMBAYARAN</th>
                <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">SALDO AKHIR</th>
                <th className="px-3 py-3 text-center w-24">DETAIL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80">
              {displayedItems.map((item, idx) => {
                const saldoAwal = item.totalTagihan || 0;
                const koreksi = item.koreksi || 0;
                const pembayaran = item.jumlahBayar || 0;
                const saldoAkhir = item.sisaHutang !== undefined ? item.sisaHutang : (saldoAwal + koreksi - pembayaran);
                const isHigh = Boolean(item.isHighlighted);
                const canModify = canModifyRecord(item);
                const invCount = item.invoiceCount ?? 0;

                const handleOpenDetailModal = () => {
                  setSelectedPosBelanjaDetail(item);
                };

                return (
                  <tr 
                    key={item.id || `pos-${item.noUrut}-${idx}`} 
                    className={`transition ${
                      isHigh 
                        ? 'bg-[#ffff00] hover:bg-[#f6ee00] text-black font-semibold dark:bg-[#c9a600] dark:text-black' 
                        : 'hover:bg-slate-50/90 dark:hover:bg-[#141c24]/90 bg-white dark:bg-[#0d1216]'
                    }`}
                  >
                    <td className="px-3 py-2.5 text-center font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                      {item.noUrut || (idx + 1)}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-200 dark:border-zinc-800">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-xs leading-snug">{item.kegiatan}</div>
                          <div className={`text-[10px] font-mono mt-0.5 ${isHigh ? 'text-black/80 font-medium' : 'text-slate-500 dark:text-zinc-400'}`}>
                            {item.kodeRekening || '-'}
                          </div>
                        </div>
                        {invCount > 0 ? (
                          <button
                            onClick={handleOpenDetailModal}
                            className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition flex items-center gap-1 cursor-pointer"
                            title="Klik untuk melihat rincian invoice vendor"
                          >
                            <Eye className="w-3 h-3" />
                            {invCount} Inv
                          </button>
                        ) : (
                          <button
                            onClick={handleOpenDetailModal}
                            className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 transition flex items-center gap-1 cursor-pointer"
                            title="Pos Belanja Operasional / Jasa Langsung"
                          >
                            0 Inv
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                      {formatRupiah(saldoAwal)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                      {koreksi > 0 ? formatRupiah(koreksi) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                      {pembayaran > 0 ? formatRupiah(pembayaran) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold border-r border-slate-200 dark:border-zinc-800">
                      {saldoAkhir > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-[#d7a9be] dark:bg-[#722c4d] text-slate-900 dark:text-pink-100 font-bold">
                          {formatRupiah(saldoAkhir)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={handleOpenDetailModal}
                          className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition cursor-pointer"
                          title="Lihat Rincian Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isPicHutangOrAdmin && canModify && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                              title="Edit Baris Rekap"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePromptDelete(item)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* TOTAL FOOTER */}
            <tfoot className="bg-[#dbe7e1] dark:bg-[#1a2e24] font-bold border-t-2 border-[#8dbba5] dark:border-[#2b5a45] text-[#123827] dark:text-white">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                  TOTAL KESELURUHAN:
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                  {formatRupiah(totalSaldoAwal)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                  {formatRupiah(totalKoreksi)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                  {formatRupiah(totalSudahDibayar)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-rose-900 dark:text-pink-300 border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                  {formatRupiah(totalHutangAktif)}
                </td>
                <td className="px-3 py-3 text-center font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
                  {totalInvoicesCount} Inv
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Add Hutang Item */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-emerald-950/80 text-slate-800 dark:text-zinc-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Tambah Baris Rekap Pengadaan 2026
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">Tambahkan data kewajiban/belanja pengadaan RSUD Jatisari TA 2026</p>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">No. Urut</label>
                  <input
                    type="number"
                    placeholder="No"
                    value={formNoUrut}
                    onChange={(e) => setFormNoUrut(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Uraian / Nama Belanja</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Belanja Bahan-Bahan Lainnya"
                    value={formKegiatan}
                    onChange={(e) => setFormKegiatan(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kode Rekening Belanja</label>
                <input
                  type="text"
                  placeholder="Contoh: 5.1.02.01.01.0019"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Koreksi (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formKoreksi}
                    onChange={(e) => setFormKoreksi(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Pembayaran (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formPembayaran}
                    onChange={(e) => setFormPembayaran(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100 text-emerald-600 dark:text-emerald-400 font-semibold"
                  />
                </div>
              </div>

              {/* Saldo Akhir Auto Calc Box */}
              <div className="p-3 bg-slate-50 dark:bg-[#12181f] rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Estimasi Saldo Akhir (Kalkulasi):</div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500">Saldo Awal + Koreksi - Pembayaran</div>
                </div>
                <div className="text-sm font-bold font-mono text-rose-700 dark:text-rose-400">
                  {formatRupiah(Math.max(0, (parseFloat(formTotal) || 0) + (parseFloat(formKoreksi) || 0) - (parseFloat(formPembayaran) || 0)))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="add-2026-highlight-check"
                  checked={formIsHighlighted}
                  onChange={(e) => setFormIsHighlighted(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <label htmlFor="add-2026-highlight-check" className="text-xs text-slate-700 dark:text-zinc-300 select-none cursor-pointer">
                  Tandai baris dengan highlight kuning
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Hutang Item */}
      {isEditOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-emerald-950/80 text-slate-800 dark:text-zinc-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Edit Baris Rekap Pengadaan 2026
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">Perbarui rincian data baris tabel pos belanja RSUD TA 2026</p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">No. Urut</label>
                  <input
                    type="number"
                    value={formNoUrut}
                    onChange={(e) => setFormNoUrut(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Uraian / Kegiatan Belanja</label>
                  <input
                    type="text"
                    required
                    value={formKegiatan}
                    onChange={(e) => setFormKegiatan(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kode Rekening Belanja</label>
                <input
                  type="text"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Koreksi (Rp)</label>
                  <input
                    type="number"
                    value={formKoreksi}
                    onChange={(e) => setFormKoreksi(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Pembayaran (Rp)</label>
                  <input
                    type="number"
                    value={formPembayaran}
                    onChange={(e) => setFormPembayaran(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100 text-emerald-600 dark:text-emerald-400 font-semibold"
                  />
                </div>
              </div>

              {/* Saldo Akhir Auto Calc Box */}
              <div className="p-3 bg-slate-50 dark:bg-[#12181f] rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Estimasi Saldo Akhir:</div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500">Saldo Awal + Koreksi - Pembayaran</div>
                </div>
                <div className="text-sm font-bold font-mono text-rose-700 dark:text-rose-400">
                  {formatRupiah(Math.max(0, (parseFloat(formTotal) || 0) + (parseFloat(formKoreksi) || 0) - (parseFloat(formPembayaran) || 0)))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-2026-highlight-check"
                  checked={formIsHighlighted}
                  onChange={(e) => setFormIsHighlighted(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <label htmlFor="edit-2026-highlight-check" className="text-xs text-slate-700 dark:text-zinc-300 select-none cursor-pointer">
                  Tandai baris dengan highlight kuning
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold"
                >
                  Perbarui Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Hutang */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-zinc-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Konfirmasi Hapus Data</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/40 mb-5 text-xs space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white text-sm">{itemToDelete.kegiatan}</div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Kode Rekening:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-100">{itemToDelete.kodeRekening || '-'}</span>
              </div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Total Tagihan:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{formatRupiah(itemToDelete.totalTagihan)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Invoices Per Pos Belanja 2026 */}
      {selectedPosBelanjaDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-[#12181f]/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                    Pos #{selectedPosBelanjaDetail.noUrut}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400">
                    {selectedPosBelanjaDetail.kodeRekening || '-'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedPosBelanjaDetail.kegiatan}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Rincian invoice dari sub menu INVOICE HUTANG 2026 yang terkelompok pada pos belanja ini ({(selectedPosBelanjaDetail.invoices || []).length} invoice).
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedPosBelanjaDetail(null);
                  setDrilldownSearch('');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/60 dark:bg-[#10151b] border-b border-slate-200 dark:border-zinc-800">
              <div className="bg-white dark:bg-[#151c24] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase">Saldo Awal (Invoice)</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatRupiah(selectedPosBelanjaDetail.totalTagihan)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#151c24] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase">Total Koreksi</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatRupiah(selectedPosBelanjaDetail.koreksi)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#151c24] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase">Total Terbayar</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {formatRupiah(selectedPosBelanjaDetail.jumlahBayar)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#151c24] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase">Sisa Hutang</div>
                <div className="text-sm font-bold text-rose-600 dark:text-pink-400 font-mono mt-0.5">
                  {formatRupiah(selectedPosBelanjaDetail.sisaHutang !== undefined ? selectedPosBelanjaDetail.sisaHutang : (selectedPosBelanjaDetail.totalTagihan + selectedPosBelanjaDetail.koreksi - selectedPosBelanjaDetail.jumlahBayar))}
                </div>
              </div>
            </div>

            {/* Filter Search Bar */}
            <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nomor invoice / vendor / tanggal..."
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>

              <button
                onClick={() => {
                  const invs = selectedPosBelanjaDetail.invoices || [];
                  const rows = invs.map((inv, idx) => {
                    const rawJumlah = inv.jumlahInvoice || 0;
                    const rawKoreksi = inv.koreksi || 0;
                    const fix = inv.totalInvoiceFix || (rawJumlah + rawKoreksi);
                    const bayar = inv.pembayaran || 0;
                    const sisa = inv.sisaHutang !== undefined ? inv.sisaHutang : Math.max(0, fix - bayar);
                    return {
                      'NO': idx + 1,
                      'NO INVOICE URUT': inv.no,
                      'NOMOR INVOICE / SPK / PO': inv.noInvoice || '-',
                      'TANGGAL INVOICE': inv.tglInvoice || '-',
                      'NAMA REKANAN / VENDOR': inv.rekanan || '-',
                      'KODE REKENING': inv.kodeRekening || selectedPosBelanjaDetail.kodeRekening,
                      'POS BELANJA': selectedPosBelanjaDetail.kegiatan,
                      'JUMLAH TAGIHAN': rawJumlah,
                      'KOREKSI': rawKoreksi,
                      'PEMBAYARAN': bayar,
                      'SISA HUTANG': sisa,
                      'STATUS': sisa <= 0 ? 'LUNAS' : 'BELUM LUNAS'
                    };
                  });

                  const worksheet = XLSX.utils.json_to_sheet(rows);
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rincian_Invoice_2026');
                  XLSX.writeFile(workbook, `RINCIAN_INVOICE_${selectedPosBelanjaDetail.noUrut}_${new Date().toISOString().slice(0, 10)}.xlsx`);
                  if (onShowToast) onShowToast('Rincian invoice berhasil diexport ke Excel', 'success');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Rincian Excel</span>
              </button>
            </div>

            {/* Invoices List Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const filteredInvoices = (selectedPosBelanjaDetail.invoices || []).filter(inv => {
                  if (!drilldownSearch) return true;
                  const q = drilldownSearch.toLowerCase();
                  return (
                    (inv.noInvoice || '').toLowerCase().includes(q) ||
                    (inv.rekanan || '').toLowerCase().includes(q) ||
                    (inv.tglInvoice || '').toLowerCase().includes(q) ||
                    String(inv.no || '').includes(q)
                  );
                });

                if ((selectedPosBelanjaDetail.invoices || []).length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 dark:bg-[#12181f] rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 my-4 space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                        Beban Operasional / Jasa Langsung BLUD TA 2026
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                        Pos Belanja ini dicatat langsung pada buku rekapitulasi hutang master tanpa lembaran invoice vendor pihak ketiga atau belum ada rincian invoice terkait.
                      </p>
                    </div>
                  );
                }

                if (filteredInvoices.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                      Tidak ada invoice yang sesuai dengan pencarian "{drilldownSearch}".
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800 uppercase text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5 text-center w-10">No</th>
                          <th className="px-3 py-2.5">No. Invoice / SPK</th>
                          <th className="px-3 py-2.5">Tanggal</th>
                          <th className="px-3 py-2.5">Nama Vendor / Rekanan</th>
                          <th className="px-3 py-2.5 text-right">Tagihan</th>
                          <th className="px-3 py-2.5 text-right">Koreksi</th>
                          <th className="px-3 py-2.5 text-right">Pembayaran</th>
                          <th className="px-3 py-2.5 text-right">Sisa Hutang</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                        {filteredInvoices.map((inv, idx) => {
                          const rawJumlah = inv.jumlahInvoice || 0;
                          const rawKoreksi = inv.koreksi || 0;
                          const fix = inv.totalInvoiceFix || (rawJumlah + rawKoreksi);
                          const bayar = inv.pembayaran || 0;
                          const sisa = inv.sisaHutang !== undefined ? inv.sisaHutang : Math.max(0, fix - bayar);
                          const isLunas = sisa <= 0;

                          return (
                            <tr key={inv.id || idx} className="hover:bg-slate-50 dark:hover:bg-[#141c24]">
                              <td className="px-3 py-2 text-center font-mono text-slate-500">#{inv.no}</td>
                              <td className="px-3 py-2 font-mono font-medium">{inv.noInvoice || '-'}</td>
                              <td className="px-3 py-2 text-slate-500">{inv.tglInvoice || '-'}</td>
                              <td className="px-3 py-2 font-medium">{inv.rekanan || '-'}</td>
                              <td className="px-3 py-2 text-right font-mono">{formatRupiah(rawJumlah)}</td>
                              <td className="px-3 py-2 text-right font-mono">{rawKoreksi > 0 ? formatRupiah(rawKoreksi) : '-'}</td>
                              <td className="px-3 py-2 text-right font-mono text-emerald-600">{bayar > 0 ? formatRupiah(bayar) : '-'}</td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-rose-600">{sisa > 0 ? formatRupiah(sisa) : '-'}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  isLunas ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                }`}>
                                  {isLunas ? 'LUNAS' : 'BELUM LUNAS'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RekapHutang2026View;
