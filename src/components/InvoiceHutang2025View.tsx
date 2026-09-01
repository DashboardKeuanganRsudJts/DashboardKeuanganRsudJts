import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { InvoiceHutang2025Record } from '../types/invoiceHutang';
import { INITIAL_INVOICE_HUTANG_2025 } from '../data/invoiceHutang2025Data';
import { ImportInvoiceExcelModal } from './ImportInvoiceExcelModal';
import { formatRupiah } from '../utils/formatters';
import { idbGet, idbSet, idbDelete, cleanupLargeLocalStorageKeys } from '../utils/indexedDbStorage';
import { MASTER_31_POS_BELANJA } from '../utils/rekapHutang2025Aggregator';
import { INITIAL_KODE_REKENING } from '../data/databaseKodeRekeningData';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  Download, 
  UploadCloud,
  Printer, 
  RotateCcw, 
  RefreshCw,
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Calendar,
  Layers,
  FileText,
  DollarSign
} from 'lucide-react';
import { User } from 'firebase/auth';

const IDB_KEY_INVOICE_2025 = 'rsud_invoice_hutang_2025';

// Helper to parse any date string (DD/MM/YYYY or YYYY-MM-DD) to YYYY-MM-DD for input[type="date"]
const toInputDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // If DD/MM/YYYY
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return '';
};

// Helper to convert from YYYY-MM-DD (from input) to display DD/MM/YYYY
const fromInputDate = (inputDateStr?: string): string => {
  if (!inputDateStr) return '';
  const trimmed = inputDateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-');
    return `${day}/${month}/${year}`;
  }
  return inputDateStr;
};

// Helper to get month name in Indonesian from date
const getMonthNameFromDate = (dateStr?: string): string => {
  if (!dateStr) return 'DESEMBER';
  const iso = toInputDate(dateStr);
  if (!iso) return 'DESEMBER';
  const parts = iso.split('-');
  const monthNum = parseInt(parts[1], 10);
  const months = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];
  return months[monthNum - 1] || 'DESEMBER';
};

export const INDONESIAN_MONTH_RANKS: Record<string, number> = {
  'JANUARI': 1, 'JAN': 1, '01': 1, '1': 1,
  'FEBRUARI': 2, 'FEB': 2, '02': 2, '2': 2,
  'MARET': 3, 'MAR': 3, '03': 3, '3': 3,
  'APRIL': 4, 'APR': 4, '04': 4, '4': 4,
  'MEI': 5, 'MAY': 5, '05': 5, '5': 5,
  'JUNI': 6, 'JUN': 6, '06': 6, '6': 6,
  'JULI': 7, 'JUL': 7, '07': 7, '7': 7,
  'AGUSTUS': 8, 'AGU': 8, 'AGT': 8, '08': 8, '8': 8,
  'SEPTEMBER': 9, 'SEP': 9, '09': 9, '9': 9,
  'OKTOBER': 10, 'OKT': 10, 'OCT': 10, '10': 10,
  'NOVEMBER': 11, 'NOV': 11, '11': 11,
  'DESEMBER': 12, 'DES': 12, 'DEC': 12, '12': 12
};

export const getMonthRank = (str?: string): number => {
  if (!str) return 999;
  const upper = str.toString().trim().toUpperCase();
  if (INDONESIAN_MONTH_RANKS[upper] !== undefined) {
    return INDONESIAN_MONTH_RANKS[upper];
  }
  for (const [mName, rank] of Object.entries(INDONESIAN_MONTH_RANKS)) {
    if (upper.includes(mName)) return rank;
  }
  return 999;
};

export const parseDateForSort = (dateStr?: string): number => {
  if (!dateStr) return 0;
  const iso = toInputDate(dateStr);
  if (!iso) return 0;
  return new Date(iso).getTime() || 0;
};

const BIDANG_OPTIONS = [
  'Bidang Pelayanan Medik',
  'Bidang Pelayanan Non Medik',
  'Bidang Pengadaan Sarana dan Prasarana',
  'IT',
  'Keperawatan',
  'Perencanaan',
  'Umum dan Kepegawaian'
];

const DEFAULT_SUB_BELANJA_OPTIONS = [
  'BELANJA BMHP',
  'BELANJA OBAT',
  'BELANJA JASA PELAYANAN',
  'BELANJA BAHAN LOGISTIK / ALAT',
  'BELANJA ALAT TULIS KANTOR',
  'BELANJA BAHAN CETAK',
  'BELANJA MAKANAN DAN MINUMAN',
  'BELANJA OPERASIONAL',
  'BELANJA PEMELIHARAAN ALAT MEDIS',
  'BELANJA PEMELIHARAAN GEDUNG & KANTOR',
  'BELANJA TAGIHAN LISTRIK / AIR / INTERNET',
  'BELANJA MODAL ALAT KESEHATAN',
  'BELANJA MODAL PERALATAN DAN MESIN',
  'BELANJA JASA TENAGA KEBERSIHAN & KEAMANAN',
  'BELANJA GAJI PEGAWAI BLUD'
];

interface InvoiceHutang2025ViewProps {
  user?: User | null;
  role?: string;
  isAdmin?: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

let inMemoryInvoice2025Cache: InvoiceHutang2025Record[] | null = null;

// Helper to ensure mathematical integrity, General format for invoice number, and preserve user edits
const sanitizeInvoiceRecord = (item: InvoiceHutang2025Record): InvoiceHutang2025Record => {
  let { jumlahInvoice, koreksi, pembayaran, noInvoice } = item;
  
  if (jumlahInvoice === 7122025 || jumlahInvoice === 16122025 || jumlahInvoice === 25122025) {
    if (item.no === 341) {
      jumlahInvoice = 112127370;
      koreksi = 500000;
    } else {
      jumlahInvoice = koreksi;
      koreksi = 0;
    }
  }

  // Sanitize noInvoice to General type (plain text/code, not currency/money format)
  let cleanNoInvoice = String(noInvoice || '').trim();
  if (cleanNoInvoice.startsWith('Rp') || cleanNoInvoice.startsWith('rp') || cleanNoInvoice.startsWith('RP')) {
    cleanNoInvoice = cleanNoInvoice.replace(/^Rp\.?\s*/i, '').replace(/,/g, '');
  }
  cleanNoInvoice = cleanNoInvoice.replace(/^['"]+|['"]+$/g, '');

  let numJumlah = Number(jumlahInvoice) || 0;
  const numKoreksi = Number(koreksi) || 0;
  const numPembayaran = Number(pembayaran) || 0;

  // Preserve user-specified totalInvoiceFix if already set, otherwise calculate
  let totalInvoiceFix = item.totalInvoiceFix !== undefined ? Number(item.totalInvoiceFix) : (numJumlah + numKoreksi);

  // If invoice has payment but zero amount recorded initially, synchronize total fix with payment
  if (numPembayaran > 0 && totalInvoiceFix === 0 && numJumlah === 0) {
    totalInvoiceFix = numPembayaran;
    numJumlah = numPembayaran;
  }

  // Preserve user-specified sisaHutang and sisaHutangRiil if explicitly saved
  let sisaHutang: number;
  let sisaHutangRiil: number;

  if (numPembayaran >= totalInvoiceFix && totalInvoiceFix > 0) {
    sisaHutang = 0;
    sisaHutangRiil = 0;
  } else if (item.sisaHutang === 0 || item.sisaHutangRiil === 0 || item.keterangan === 'Lunas') {
    sisaHutang = 0;
    sisaHutangRiil = 0;
  } else if (item.sisaHutang !== undefined) {
    sisaHutang = Number(item.sisaHutang);
    sisaHutangRiil = item.sisaHutangRiil !== undefined ? Number(item.sisaHutangRiil) : sisaHutang;
  } else {
    sisaHutang = Math.max(0, totalInvoiceFix - numPembayaran);
    sisaHutangRiil = sisaHutang;
  }

  const keterangan = (sisaHutang <= 0 || sisaHutangRiil <= 0) ? 'Lunas' : (item.keterangan || 'Belum Lunas');

  return {
    ...item,
    noInvoice: cleanNoInvoice,
    jumlahInvoice: numJumlah,
    koreksi: numKoreksi,
    totalInvoiceFix,
    pembayaran: numPembayaran,
    sisaHutang,
    sisaHutangRiil,
    keterangan
  };
};

export const InvoiceHutang2025View: React.FC<InvoiceHutang2025ViewProps> = ({
  user,
  role,
  isAdmin,
  onShowToast
}) => {
  const isSuperAdmin = Boolean(isAdmin) || role === 'admin';
  const isPicHutangOrAdmin = isSuperAdmin || role === 'pic_hutang';

  // State for dataset - initialize with in-memory singleton or localStorage cache first, then load from IndexedDB
  const [data, setData] = useState<InvoiceHutang2025Record[]>(() => {
    if (inMemoryInvoice2025Cache && Array.isArray(inMemoryInvoice2025Cache) && inMemoryInvoice2025Cache.length > 0) {
      return inMemoryInvoice2025Cache;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(IDB_KEY_INVOICE_2025);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleaned = parsed.map(sanitizeInvoiceRecord);
            inMemoryInvoice2025Cache = cleaned;
            return cleaned;
          }
        }
      }
    } catch (e) {
      console.warn('[Invoice2025] Initial localStorage read error:', e);
    }
    const init = INITIAL_INVOICE_HUTANG_2025.map(sanitizeInvoiceRecord);
    inMemoryInvoice2025Cache = init;
    return init;
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from IndexedDB on initial mount
  useEffect(() => {
    cleanupLargeLocalStorageKeys();

    let isMounted = true;
    idbGet<InvoiceHutang2025Record[]>(IDB_KEY_INVOICE_2025)
      .then(saved => {
        if (isMounted) {
          if (Array.isArray(saved) && saved.length > 0) {
            const cleaned = saved.map(sanitizeInvoiceRecord);
            inMemoryInvoice2025Cache = cleaned;
            setData(cleaned);
          }
          setIsLoaded(true);
        }
      })
      .catch(err => {
        console.warn('[IDB] Error reading invoice 2025:', err);
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Save to IndexedDB on change (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    inMemoryInvoice2025Cache = data;
    idbSet(IDB_KEY_INVOICE_2025, data).catch(err => {
      console.warn('[IDB] Error writing invoice 2025:', err);
    });
    window.dispatchEvent(new CustomEvent('rsud_invoice_hutang_2025_updated', { detail: data }));
  }, [data, isLoaded]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRekanan, setFilterRekanan] = useState('ALL');
  const [filterBulan, setFilterBulan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, LUNAS, BELUM_LUNAS
  const [filterSumber, setFilterSumber] = useState('ALL'); // ALL, BLUD, APBD

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Sorting
  const [sortField, setSortField] = useState<keyof InvoiceHutang2025Record>('no');
  const [sortAsc, setSortAsc] = useState(true);

  // Modal states
  const [selectedRecord, setSelectedRecord] = useState<InvoiceHutang2025Record | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formValues, setFormValues] = useState<Partial<InvoiceHutang2025Record>>({});
  const [isCustomSubBelanja, setIsCustomSubBelanja] = useState(false);
  const [isCustomPosBelanja, setIsCustomPosBelanja] = useState(false);

  // Unique list of Rekanan & Bulan for dropdown filters
  const uniqueRekanan = useMemo(() => {
    const set = new Set<string>();
    data.forEach(d => {
      if (d.rekanan) set.add(d.rekanan);
    });
    return Array.from(set).sort();
  }, [data]);

  const uniqueBulan = useMemo(() => {
    const set = new Set<string>();
    data.forEach(d => {
      if (d.bulanInvoice && d.bulanInvoice.trim()) {
        set.add(d.bulanInvoice.trim().toUpperCase());
      }
    });
    return Array.from(set).sort((a, b) => {
      const rankA = getMonthRank(a);
      const rankB = getMonthRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });
  }, [data]);

  // Unique Sub Belanja list for dropdown
  const availableSubBelanja = useMemo(() => {
    const set = new Set<string>(DEFAULT_SUB_BELANJA_OPTIONS);
    data.forEach(d => {
      if (d.subBelanja && d.subBelanja.trim()) {
        set.add(d.subBelanja.trim());
      }
    });
    return Array.from(set).sort();
  }, [data]);

  // List of Pos Belanja complete with Kode Rekening
  const availablePosBelanja = useMemo(() => {
    const map = new Map<string, { kodeRekening: string; uraian: string; label: string }>();

    MASTER_31_POS_BELANJA.forEach(p => {
      const key = `${p.kodeRekening} - ${p.uraian}`.trim();
      map.set(key, {
        kodeRekening: p.kodeRekening,
        uraian: p.uraian,
        label: `${p.kodeRekening && p.kodeRekening !== '-' ? p.kodeRekening : '[No Rek]'} - ${p.uraian}`
      });
    });

    INITIAL_KODE_REKENING.forEach(kr => {
      const key = `${kr.kodeRekening} - ${kr.uraian}`.trim();
      if (!map.has(key)) {
        map.set(key, {
          kodeRekening: kr.kodeRekening,
          uraian: kr.uraian,
          label: `${kr.kodeRekening} - ${kr.uraian}`
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.uraian.localeCompare(b.uraian));
  }, []);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return data.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSearch = 
          item.no.toString().includes(q) ||
          item.rekanan.toLowerCase().includes(q) ||
          item.noInvoice.toLowerCase().includes(q) ||
          item.uraian.toLowerCase().includes(q) ||
          item.subBelanja.toLowerCase().includes(q) ||
          item.noSpdBukuKas.toLowerCase().includes(q) ||
          item.keterangan.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      // Rekanan filter
      if (filterRekanan !== 'ALL' && item.rekanan !== filterRekanan) {
        return false;
      }

      // Bulan filter
      if (filterBulan !== 'ALL' && item.bulanInvoice.toUpperCase() !== filterBulan) {
        return false;
      }

      // Sumber Anggaran filter
      if (filterSumber !== 'ALL') {
        const itemSumber = (item.sumberAnggaran || '').toUpperCase();
        if (filterSumber === 'BLUD' && !itemSumber.includes('BLUD')) return false;
        if (filterSumber === 'APBD' && !itemSumber.includes('APBD')) return false;
      }

      // Status filter
      if (filterStatus === 'LUNAS') {
        if (item.sisaHutang > 0) return false;
      } else if (filterStatus === 'BELUM_LUNAS') {
        if (item.sisaHutang <= 0) return false;
      }

      return true;
    }).sort((a, b) => {
      // Month sorting (Bulan Invoice or Bulan SPD)
      if (sortField === 'bulanInvoice' || sortField === 'bulanSpd') {
        const valMonthA = (a[sortField] || (sortField === 'bulanInvoice' ? a.bulanSpd : a.bulanInvoice) || '') as string;
        const valMonthB = (b[sortField] || (sortField === 'bulanInvoice' ? b.bulanSpd : b.bulanInvoice) || '') as string;
        const rankA = getMonthRank(valMonthA);
        const rankB = getMonthRank(valMonthB);
        if (rankA !== rankB) {
          return sortAsc ? rankA - rankB : rankB - rankA;
        }
        return a.no - b.no;
      }

      // Date sorting
      if (['tglInvoice', 'tglRekap', 'tglTandaTerima', 'tglMasukSpj', 'tglSpbSpk', 'jatuhTempo', 'tglBayar', 'tglSpdBukuKas'].includes(String(sortField))) {
        const timeA = parseDateForSort(a[sortField as keyof InvoiceHutang2025Record] as string);
        const timeB = parseDateForSort(b[sortField as keyof InvoiceHutang2025Record] as string);
        if (timeA !== timeB) {
          return sortAsc ? timeA - timeB : timeB - timeA;
        }
        return a.no - b.no;
      }

      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc 
        ? String(valA || '').localeCompare(String(valB || ''))
        : String(valB || '').localeCompare(String(valA || ''));
    });
  }, [data, searchQuery, filterRekanan, filterBulan, filterStatus, filterSumber, sortField, sortAsc]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalInvoice = 0;
    let totalKoreksi = 0;
    let totalInvoiceFix = 0;
    let totalPembayaran = 0;
    let totalSisaHutang = 0;
    let totalSisaHutangRiil = 0;
    let totalBelumJt = 0;
    let totalH130 = 0;
    let totalH3160 = 0;
    let totalH6190 = 0;
    let totalH90plus = 0;
    let lunasCount = 0;
    let belumLunasCount = 0;

    filteredItems.forEach(i => {
      totalInvoice += i.jumlahInvoice || 0;
      totalKoreksi += i.koreksi || 0;
      totalInvoiceFix += i.totalInvoiceFix || ((i.jumlahInvoice || 0) + (i.koreksi || 0));
      totalPembayaran += i.pembayaran || 0;
      totalSisaHutang += i.sisaHutang || 0;
      totalSisaHutangRiil += i.sisaHutangRiil || 0;

      const sisa = i.sisaHutang || 0;
      const umur = i.lamaHariHutang || 0;
      if (sisa > 0) {
        if (umur <= 0) totalBelumJt += sisa;
        else if (umur <= 30) totalH130 += sisa;
        else if (umur <= 60) totalH3160 += sisa;
        else if (umur <= 90) totalH6190 += sisa;
        else totalH90plus += sisa;
      }

      if (i.sisaHutang <= 0) {
        lunasCount++;
      } else {
        belumLunasCount++;
      }
    });

    return {
      totalItems: filteredItems.length,
      totalInvoice,
      totalKoreksi,
      totalInvoiceFix,
      totalPembayaran,
      totalSisaHutang,
      totalSisaHutangRiil,
      totalBelumJt,
      totalH130,
      totalH3160,
      totalH6190,
      totalH90plus,
      lunasCount,
      belumLunasCount
    };
  }, [filteredItems]);

  // Paginated records
  const paginatedItems = useMemo(() => {
    if (pageSize === -1) return filteredItems;
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredItems.length / pageSize) || 1;

  const handleSort = (field: keyof InvoiceHutang2025Record) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // CRUD Handlers
  const handleOpenAdd = () => {
    const nextNo = data.length > 0 ? Math.max(...data.map(d => d.no)) + 1 : 1;
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const todayDisplay = fromInputDate(todayStr); // DD/MM/YYYY
    const currentMonth = getMonthNameFromDate(todayStr);

    setIsCustomSubBelanja(false);
    setIsCustomPosBelanja(false);
    setFormValues({
      no: nextNo,
      rekanan: '',
      bagian: 'Bidang Pelayanan Non Medik',
      bidang: 'Bidang Pelayanan Non Medik',
      uraian: 'Belanja Bahan-Bahan Lainnya (Farmasi)',
      kodeRekening: '5.1.02.01.01.0012',
      subBelanja: 'BELANJA BMHP',
      tglTandaTerima: todayDisplay, // TGL REKAP
      tglRekap: todayDisplay,
      tglSpbSpk: '', // TGL MASUK SPJ
      tglMasukSpj: '',
      tglInvoice: todayDisplay,
      bulanInvoice: currentMonth,
      noInvoice: '',
      jatuhTempo: '',
      tglBayar: '',
      jumlahInvoice: 0,
      koreksi: 0,
      totalInvoiceFix: 0,
      pembayaran: 0,
      sumberAnggaran: 'BLUD',
      sisaHutang: 0,
      sudahMasukBukuKas: true,
      tglSpdBukuKas: '',
      bulanSpd: '',
      noSpdBukuKas: '',
      lamaHariHutang: 0,
      keterangan: '',
      koreksiPlusMinus: 0,
      koreksiMinusBlud: 0,
      koreksiMinusApbd: 0,
      sisaHutangRiil: 0
    });
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: InvoiceHutang2025Record) => {
    setIsCustomSubBelanja(!availableSubBelanja.includes(record.subBelanja || ''));
    setIsCustomPosBelanja(false);
    setFormValues({ 
      ...record,
      bidang: record.bidang || record.bagian || 'Bidang Pelayanan Non Medik',
      tglRekap: record.tglRekap || record.tglTandaTerima || '',
      tglMasukSpj: record.tglMasukSpj || record.tglSpbSpk || '',
      tglBayar: record.tglBayar || record.tglSpdBukuKas || ''
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (record: InvoiceHutang2025Record) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const handleDeleteRecord = (id: string, no: number) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data Invoice No. ${no}?`)) {
      const nextData = data.filter(item => item.id !== id);
      inMemoryInvoice2025Cache = nextData;
      setData(nextData);
      idbSet(IDB_KEY_INVOICE_2025, nextData).catch(err => console.warn('[IDB] error on delete:', err));
      window.dispatchEvent(new CustomEvent('rsud_invoice_hutang_2025_updated', { detail: nextData }));
      if (onShowToast) onShowToast(`Data Invoice #${no} berhasil dihapus`, 'info');
    }
  };

  const handleToggleLunasInvoice = (item: InvoiceHutang2025Record) => {
    const isCurrentlyLunas = item.sisaHutang <= 0;
    const fix = Number(item.totalInvoiceFix) || ((Number(item.jumlahInvoice) || 0) + (Number(item.koreksi) || 0));
    
    const nextData = data.map(record => {
      if (record.id === item.id) {
        if (isCurrentlyLunas) {
          // Reset to Belum Lunas
          return {
            ...record,
            pembayaran: 0,
            sisaHutang: fix,
            sisaHutangRiil: fix,
            keterangan: 'Belum Lunas'
          };
        } else {
          // Mark as Lunas
          return {
            ...record,
            pembayaran: fix,
            sisaHutang: 0,
            sisaHutangRiil: 0,
            sudahMasukBukuKas: true,
            keterangan: 'Lunas'
          };
        }
      }
      return record;
    });

    inMemoryInvoice2025Cache = nextData;
    setData(nextData);
    idbSet(IDB_KEY_INVOICE_2025, nextData).catch(err => console.warn('[IDB] error on toggle:', err));
    window.dispatchEvent(new CustomEvent('rsud_invoice_hutang_2025_updated', { detail: nextData }));
    if (onShowToast) {
      onShowToast(`Status Invoice #${item.no} (${item.rekanan}) diubah menjadi ${isCurrentlyLunas ? 'Belum Lunas' : 'Lunas'}`, 'success');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.rekanan || !formValues.noInvoice) {
      alert('Nama Rekanan dan No Invoice wajib diisi.');
      return;
    }

    let jumlah = Number(formValues.jumlahInvoice) || 0;
    const koreksi = Number(formValues.koreksi) || 0;
    let totalFix = formValues.totalInvoiceFix !== undefined && formValues.totalInvoiceFix !== '' 
      ? Number(formValues.totalInvoiceFix) 
      : (jumlah + koreksi);
    let pembayaran = Number(formValues.pembayaran) || 0;

    // Auto-adjust if user entered payment on an invoice that had zero tagihan
    if (pembayaran > 0 && totalFix === 0 && jumlah === 0) {
      totalFix = pembayaran;
      jumlah = pembayaran;
    }

    // Sisa hutang calculation and user preference
    let sisa: number;
    let sisaRiil: number;

    // If user explicitly set sisaHutang or sisaHutangRiil to 0 or payment covers total
    if (formValues.sisaHutang === 0 || formValues.sisaHutangRiil === 0 || (pembayaran >= totalFix && totalFix > 0)) {
      sisa = 0;
      sisaRiil = 0;
      if (pembayaran === 0 && totalFix > 0) {
        pembayaran = totalFix;
      }
    } else if (formValues.sisaHutang !== undefined && formValues.sisaHutang !== '') {
      sisa = Number(formValues.sisaHutang);
      sisaRiil = formValues.sisaHutangRiil !== undefined && formValues.sisaHutangRiil !== '' ? Number(formValues.sisaHutangRiil) : sisa;
    } else if (formValues.sisaHutangRiil !== undefined && formValues.sisaHutangRiil !== '') {
      sisaRiil = Number(formValues.sisaHutangRiil);
      sisa = sisaRiil;
    } else {
      sisa = Math.max(0, totalFix - pembayaran);
      sisaRiil = sisa;
    }

    const finalBidang = formValues.bidang || formValues.bagian || '';
    const finalTglRekap = formValues.tglRekap || formValues.tglTandaTerima || '';
    const finalTglSpj = formValues.tglMasukSpj || formValues.tglSpbSpk || '';
    const finalTglBayar = formValues.tglBayar || formValues.tglSpdBukuKas || '';

    let nextData: InvoiceHutang2025Record[];

    if (isEditMode && formValues.id) {
      // Update existing record
      nextData = data.map(item => {
        if (item.id === formValues.id) {
          return {
            ...item,
            ...(formValues as InvoiceHutang2025Record),
            bagian: finalBidang,
            bidang: finalBidang,
            tglTandaTerima: finalTglRekap,
            tglRekap: finalTglRekap,
            tglSpbSpk: finalTglSpj,
            tglMasukSpj: finalTglSpj,
            tglSpdBukuKas: finalTglBayar,
            tglBayar: finalTglBayar,
            jumlahInvoice: jumlah,
            koreksi,
            totalInvoiceFix: totalFix,
            pembayaran,
            sisaHutang: sisa,
            sisaHutangRiil: sisaRiil,
            keterangan: sisa <= 0 ? 'Lunas' : 'Belum Lunas'
          };
        }
        return item;
      });
      if (onShowToast) onShowToast(`Invoice #${formValues.no} (${formValues.rekanan}) berhasil diperbarui & disimpan`, 'success');
    } else {
      // Insert new record
      const newId = `INV-2025-${(formValues.no || data.length + 1).toString().padStart(4, '0')}`;
      const newRecord: InvoiceHutang2025Record = {
        id: newId,
        no: formValues.no || (data.length + 1),
        rekanan: formValues.rekanan || '',
        bagian: finalBidang,
        bidang: finalBidang,
        uraian: formValues.uraian || '',
        kodeRekening: formValues.kodeRekening || '',
        subBelanja: formValues.subBelanja || '',
        tglTandaTerima: finalTglRekap,
        tglRekap: finalTglRekap,
        tglSpbSpk: finalTglSpj,
        tglMasukSpj: finalTglSpj,
        tglInvoice: formValues.tglInvoice || '',
        tglBayar: finalTglBayar,
        bulanInvoice: formValues.bulanInvoice || '',
        noInvoice: formValues.noInvoice || '',
        jatuhTempo: formValues.jatuhTempo || '',
        jumlahInvoice: jumlah,
        koreksi,
        totalInvoiceFix: totalFix,
        pembayaran,
        sumberAnggaran: formValues.sumberAnggaran || '',
        sisaHutang: sisa,
        sudahMasukBukuKas: Boolean(formValues.sudahMasukBukuKas),
        tglSpdBukuKas: finalTglBayar,
        bulanSpd: formValues.bulanSpd || '',
        noSpdBukuKas: formValues.noSpdBukuKas || '',
        lamaHariHutang: Number(formValues.lamaHariHutang) || 0,
        keterangan: sisa <= 0 ? 'Lunas' : 'Belum Lunas',
        koreksiPlusMinus: Number(formValues.koreksiPlusMinus) || 0,
        koreksiMinusBlud: Number(formValues.koreksiMinusBlud) || 0,
        koreksiMinusApbd: Number(formValues.koreksiMinusApbd) || 0,
        sisaHutangRiil: sisaRiil
      };
      nextData = [newRecord, ...data];
      if (onShowToast) onShowToast(`Invoice baru berhasil ditambahkan`, 'success');
    }

    inMemoryInvoice2025Cache = nextData;
    setData(nextData);
    setIsFormOpen(false);

    // Save immediately and synchronously across storage layers
    idbSet(IDB_KEY_INVOICE_2025, nextData).catch(err => {
      console.warn('[IDB] Error persisting invoice 2025:', err);
    });
    window.dispatchEvent(new CustomEvent('rsud_invoice_hutang_2025_updated', { detail: nextData }));
  };

  const handleRefreshNominal = () => {
    const nextData = data.map(sanitizeInvoiceRecord);
    inMemoryInvoice2025Cache = nextData;
    setData(nextData);
    idbSet(IDB_KEY_INVOICE_2025, nextData).catch(err => {
      console.warn('[IDB] Error persisting refresh:', err);
    });
    window.dispatchEvent(new CustomEvent('rsud_invoice_hutang_2025_updated', { detail: nextData }));
    
    if (onShowToast) {
      onShowToast('Nominal seluruh Invoice berhasil disinkronkan & diperbarui!', 'success');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'NO',
      'PERUSAHAAN / VENDOR',
      'BIDANG',
      'JENIS PENGADAAN',
      'KETERANGAN PENGADAAN',
      'TANGGAL REKAP',
      'TANGGAL MASUK SPJ',
      'TANGGAL INVOICE',
      'BULAN',
      'NOMOR INVOICE/SPK/PO',
      'TANGGAL JATUH TEMPO',
      'JUMLAH',
      'KOREKSI',
      'NILAI SPJ',
      'DIBAYAR',
      'JENIS ANGGARAN BLUD / APBD',
      'SISA',
      'A',
      'TANGGAL BAYAR',
      'BULAN BAYAR',
      'NOMOR SP2D',
      'UMUR HUTANG',
      'BELUM JT',
      '1-30 Hari',
      '31-60 Hari',
      '61-90 Hari',
      '>90 Hari'
    ];

    const rows = filteredItems.map(item => {
      const sisa = item.sisaHutang;
      const umur = item.lamaHariHutang;
      const belumJt = sisa > 0 && umur <= 0 ? sisa : '';
      const h130 = sisa > 0 && umur > 0 && umur <= 30 ? sisa : '';
      const h3160 = sisa > 0 && umur > 30 && umur <= 60 ? sisa : '';
      const h6190 = sisa > 0 && umur > 60 && umur <= 90 ? sisa : '';
      const h90plus = sisa > 0 && umur > 90 ? sisa : '';

      return [
        item.no,
        `"${(item.rekanan || '').replace(/"/g, '""')}"`,
        `"${(item.bagian || '').replace(/"/g, '""')}"`,
        `"${(item.uraian || '').replace(/"/g, '""')}"`,
        `"${(item.subBelanja || '').replace(/"/g, '""')}"`,
        `"${item.tglTandaTerima || ''}"`,
        `"${item.tglSpbSpk || ''}"`,
        `"${item.tglInvoice || ''}"`,
        `"${item.bulanInvoice || ''}"`,
        `"${(item.noInvoice || '').replace(/"/g, '""')}"`,
        `"${item.jatuhTempo || ''}"`,
        item.jumlahInvoice,
        item.koreksi || '',
        item.totalInvoiceFix,
        item.pembayaran,
        `"${item.sumberAnggaran || 'BLUD'}"`,
        item.sisaHutang,
        item.sudahMasukBukuKas ? 'TRUE' : 'FALSE',
        `"${item.tglSpdBukuKas || ''}"`,
        `"${item.bulanSpd || ''}"`,
        `"${(item.noSpdBukuKas || '').replace(/"/g, '""')}"`,
        item.lamaHariHutang || 0,
        belumJt,
        h130,
        h3160,
        h6190,
        h90plus
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `INVOICE_HUTANG_2025_RSUD_JATISARI_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const headers = [
      'NO',
      'PERUSAHAAN / VENDOR',
      'BIDANG',
      'JENIS PENGADAAN',
      'KETERANGAN PENGADAAN',
      'TANGGAL REKAP',
      'TANGGAL MASUK SPJ',
      'TANGGAL INVOICE',
      'BULAN',
      'NOMOR INVOICE/SPK/PO',
      'TANGGAL JATUH TEMPO',
      'JUMLAH',
      'KOREKSI',
      'NILAI SPJ',
      'DIBAYAR',
      'JENIS ANGGARAN BLUD / APBD',
      'SISA',
      'A',
      'TANGGAL BAYAR',
      'BULAN BAYAR',
      'NOMOR SP2D',
      'UMUR HUTANG',
      'BELUM JT',
      '1-30 Hari',
      '31-60 Hari',
      '61-90 Hari',
      '>90 Hari'
    ];

    const rows = filteredItems.map(item => {
      const sisa = item.sisaHutang;
      const umur = item.lamaHariHutang;
      const belumJt = sisa > 0 && umur <= 0 ? sisa : '';
      const h130 = sisa > 0 && umur > 0 && umur <= 30 ? sisa : '';
      const h3160 = sisa > 0 && umur > 30 && umur <= 60 ? sisa : '';
      const h6190 = sisa > 0 && umur > 60 && umur <= 90 ? sisa : '';
      const h90plus = sisa > 0 && umur > 90 ? sisa : '';

      return [
        item.no,
        item.rekanan,
        item.bagian,
        item.uraian,
        item.subBelanja,
        item.tglTandaTerima,
        item.tglSpbSpk,
        item.tglInvoice,
        item.bulanInvoice,
        item.noInvoice,
        item.jatuhTempo,
        item.jumlahInvoice,
        item.koreksi || 0,
        item.totalInvoiceFix,
        item.pembayaran,
        item.sumberAnggaran,
        item.sisaHutang,
        item.sudahMasukBukuKas ? 'TRUE' : 'FALSE',
        item.tglSpdBukuKas,
        item.bulanSpd,
        item.noSpdBukuKas,
        item.lamaHariHutang,
        belumJt,
        h130,
        h3160,
        h6190,
        h90plus
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice Hutang 2025');
    XLSX.writeFile(wb, `INVOICE_HUTANG_2025_RSUD_JATISARI_${new Date().toISOString().slice(0, 10)}.xlsx`);

    if (onShowToast) {
      onShowToast(`Berhasil mengekspor ${filteredItems.length} data invoice ke file Excel (.xlsx)`, 'success');
    }
  };

  const handleImportSuccess = (importedRecords: InvoiceHutang2025Record[], mode: 'replace' | 'append') => {
    let finalData: InvoiceHutang2025Record[] = [];
    if (mode === 'replace') {
      finalData = importedRecords;
    } else {
      // Append mode, re-number
      const existingInvoices = new Set(data.map(d => d.noInvoice.trim().toLowerCase()));
      const newItems = importedRecords.filter(r => !existingInvoices.has(r.noInvoice.trim().toLowerCase()));
      finalData = [...data, ...newItems].map((item, idx) => ({
        ...item,
        no: idx + 1
      }));
    }

    inMemoryInvoice2025Cache = finalData;
    setData(finalData);
    idbSet(IDB_KEY_INVOICE_2025, finalData).catch(err => console.warn('[IDB] error on import:', err));
    window.dispatchEvent(new CustomEvent('rsud_invoice_hutang_2025_updated', { detail: finalData }));
    if (onShowToast) {
      onShowToast(
        mode === 'replace'
          ? `Berhasil mengimpor ${importedRecords.length} data invoice dari Excel (Mode Ganti).`
          : `Berhasil menambahkan data invoice dari Excel (Total kini ${finalData.length} data).`,
        'success'
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-950 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-teal-700/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2 border border-teal-400/30">
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" /> DATA MASTER INVOICE 2025
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            INVOICE HUTANG TAHUN 2025
          </h2>
          <p className="text-teal-100/80 text-xs mt-1 max-w-2xl leading-relaxed">
            Data detail buku register faktur/invoice pengadaan barang, obat-obatan, BMHP, dan jasa Rumah Sakit Umum Daerah Jatisari TA 2025. Total tercatat {data.length} transaksi invoice.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Import Excel */}
          {isPicHutangOrAdmin && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-emerald-400/50"
              title="Import Data dari File Excel (.xlsx, .xls, .csv)"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Import Excel
            </button>
          )}

          {/* Export Excel (.xlsx) */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700/90 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-emerald-500/50"
            title="Download Format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-slate-600"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-slate-600"
            title="Cetak Tabel"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak
          </button>

          {isPicHutangOrAdmin && (
            <>
              <button
                onClick={handleRefreshNominal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-950/80 hover:bg-sky-900 text-sky-200 font-semibold rounded-xl text-xs shadow-md transition border border-sky-800/60"
                title="Kalkulasi ulang (refresh) nominal seluruh invoice"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Nominal
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" /> Entri Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Nilai Invoice ({data.length} Item)</div>
          <div className="text-xl font-black text-slate-900 dark:text-zinc-100 mt-2 font-mono">{formatRupiah(stats.totalInvoice)}</div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
            Koreksi: <span className="font-mono">{formatRupiah(stats.totalKoreksi)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Pembayaran / Realisasi</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">{formatRupiah(stats.totalPembayaran)}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {stats.lunasCount} Invoice Lunas
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Sisa Hutang (Belum Lunas)</div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono">{formatRupiah(stats.totalSisaHutang)}</div>
          <div className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {stats.belumLunasCount} Invoice Masih Tertagih
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Rekanan & Filter Aktif</div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{uniqueRekanan.length} Vendor</div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Menampilkan <span className="font-bold text-slate-800 dark:text-zinc-200">{filteredItems.length}</span> dari {data.length} baris
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-4 border border-slate-200 dark:border-emerald-950/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama rekanan, nomor invoice, uraian belanja, nomor SPD/Buku Kas..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Rekanan */}
          <select
            value={filterRekanan}
            onChange={(e) => {
              setFilterRekanan(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 max-w-[180px] truncate"
          >
            <option value="ALL">Semua Rekanan ({uniqueRekanan.length})</option>
            {uniqueRekanan.map((r, i) => (
              <option key={i} value={r}>{r}</option>
            ))}
          </select>

          {/* Filter Bulan */}
          <select
            value={filterBulan}
            onChange={(e) => {
              setFilterBulan(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300"
          >
            <option value="ALL">Semua Bulan</option>
            {uniqueBulan.map((b, i) => (
              <option key={i} value={b}>{b}</option>
            ))}
          </select>

          {/* Filter Sumber */}
          <select
            value={filterSumber}
            onChange={(e) => {
              setFilterSumber(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300"
          >
            <option value="ALL">Semua Sumber</option>
            <option value="BLUD">BLUD</option>
            <option value="APBD">APBD</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300"
          >
            <option value="ALL">Semua Status</option>
            <option value="LUNAS">Lunas (Sisa Rp 0)</option>
            <option value="BELUM_LUNAS">Belum Lunas</option>
          </select>

          {/* Sortir Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <select
              value={`${String(sortField)}_${sortAsc ? 'asc' : 'desc'}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('_');
                setSortField(field as keyof InvoiceHutang2025Record);
                setSortAsc(dir === 'asc');
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              title="Pilih Pengurutan Data"
            >
              <option value="no_asc">Urutkan: No (1 - 999)</option>
              <option value="no_desc">Urutkan: No (999 - 1)</option>
              <option value="bulanInvoice_asc">Urutkan: Bulan (Januari - Desember)</option>
              <option value="bulanInvoice_desc">Urutkan: Bulan (Desember - Januari)</option>
              <option value="tglInvoice_asc">Urutkan: Tgl Invoice (Terlama - Terbaru)</option>
              <option value="tglInvoice_desc">Urutkan: Tgl Invoice (Terbaru - Terlama)</option>
              <option value="jatuhTempo_asc">Urutkan: Tgl Jatuh Tempo (Terdekat)</option>
              <option value="rekanan_asc">Urutkan: Vendor (A - Z)</option>
              <option value="rekanan_desc">Urutkan: Vendor (Z - A)</option>
              <option value="jumlahInvoice_desc">Urutkan: Nilai Invoice (Terbesar)</option>
              <option value="jumlahInvoice_asc">Urutkan: Nilai Invoice (Terkecil)</option>
              <option value="sisaHutang_desc">Urutkan: Sisa Hutang (Terbesar)</option>
              <option value="sisaHutang_asc">Urutkan: Sisa Hutang (Terkecil)</option>
              <option value="lamaHariHutang_desc">Urutkan: Umur Hutang (Tertinggi)</option>
            </select>
          </div>

          {/* Page size */}
          <select
            id="invoice-2025-page-size-select"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300"
          >
            <option value={10}>10 baris/hal</option>
            <option value={25}>25 baris/hal</option>
            <option value={50}>50 baris/hal</option>
            <option value={100}>100 baris/hal</option>
            <option value={200}>200 baris/hal</option>
            <option value={-1}>Tampilkan Semua</option>
          </select>
        </div>
      </div>

      {/* 4. Complete Data Table */}
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl border border-slate-200 dark:border-emerald-950/80 shadow-sm overflow-hidden p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Daftar Lengkap Invoice Hutang 2025 ({filteredItems.length} Data)
          </div>
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            Halaman {currentPage} dari {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-[#f0f9f6] dark:bg-[#132720] text-[#0d4a36] dark:text-[#a2f0d4] font-bold border-b border-teal-200 dark:border-emerald-900 uppercase text-[10px] tracking-wider select-none">
              <tr>
                <th onClick={() => handleSort('no')} className="px-3 py-3 text-center w-12 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]">
                  <div className="flex items-center justify-center gap-1">NO <ArrowUpDown className="w-2.5 h-2.5" /></div>
                </th>
                <th onClick={() => handleSort('rekanan')} className="px-4 py-3 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]">
                  <div className="flex items-center gap-1">PERUSAHAAN / VENDOR <ArrowUpDown className="w-2.5 h-2.5" /></div>
                </th>
                <th className="px-3 py-3">BIDANG</th>
                <th className="px-4 py-3">JENIS PENGADAAN</th>
                <th className="px-3 py-3">KETERANGAN PENGADAAN</th>
                <th onClick={() => handleSort('tglRekap')} className="px-3 py-3 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]" title="Klik untuk sortir Tanggal Rekap">
                  <div className="flex items-center gap-1">TANGGAL REKAP <ArrowUpDown className={`w-2.5 h-2.5 ${sortField === 'tglRekap' ? 'text-teal-600 dark:text-teal-300 font-bold' : ''}`} /></div>
                </th>
                <th onClick={() => handleSort('tglMasukSpj')} className="px-3 py-3 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]" title="Klik untuk sortir Tanggal Masuk SPJ">
                  <div className="flex items-center gap-1">TANGGAL MASUK SPJ <ArrowUpDown className={`w-2.5 h-2.5 ${sortField === 'tglMasukSpj' ? 'text-teal-600 dark:text-teal-300 font-bold' : ''}`} /></div>
                </th>
                <th onClick={() => handleSort('tglInvoice')} className="px-3 py-3 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]" title="Klik untuk sortir Tanggal Invoice">
                  <div className="flex items-center gap-1">TANGGAL INVOICE <ArrowUpDown className={`w-2.5 h-2.5 ${sortField === 'tglInvoice' ? 'text-teal-600 dark:text-teal-300 font-bold' : ''}`} /></div>
                </th>
                <th onClick={() => handleSort('bulanInvoice')} className="px-3 py-3 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e] bg-teal-50/50 dark:bg-emerald-950/40" title="Klik untuk sortir berdasarkan Bulan Invoice">
                  <div className="flex items-center gap-1 text-teal-900 dark:text-teal-200">BULAN <ArrowUpDown className={`w-3 h-3 ${sortField === 'bulanInvoice' ? 'text-teal-600 dark:text-teal-300 font-black' : 'text-slate-400'}`} /></div>
                </th>
                <th onClick={() => handleSort('noInvoice')} className="px-3 py-3 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]">
                  <div className="flex items-center gap-1">NOMOR INVOICE/SPK/PO <ArrowUpDown className="w-2.5 h-2.5" /></div>
                </th>
                <th onClick={() => handleSort('jatuhTempo')} className="px-3 py-3 cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]" title="Klik untuk sortir Tanggal Jatuh Tempo">
                  <div className="flex items-center gap-1">TANGGAL JATUH TEMPO <ArrowUpDown className={`w-2.5 h-2.5 ${sortField === 'jatuhTempo' ? 'text-teal-600 dark:text-teal-300 font-bold' : ''}`} /></div>
                </th>
                <th onClick={() => handleSort('jumlahInvoice')} className="px-4 py-3 text-right cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]">
                  <div className="flex items-center justify-end gap-1">JUMLAH <ArrowUpDown className="w-2.5 h-2.5" /></div>
                </th>
                <th className="px-3 py-3 text-right">KOREKSI</th>
                <th className="px-4 py-3 text-right">NILAI SPJ</th>
                <th onClick={() => handleSort('pembayaran')} className="px-4 py-3 text-right cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]">
                  <div className="flex items-center justify-end gap-1">DIBAYAR <ArrowUpDown className="w-2.5 h-2.5" /></div>
                </th>
                <th className="px-3 py-3 text-center">JENIS ANGGARAN BLUD / APBD</th>
                <th onClick={() => handleSort('sisaHutang')} className="px-4 py-3 text-right cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]">
                  <div className="flex items-center justify-end gap-1">SISA <ArrowUpDown className="w-2.5 h-2.5" /></div>
                </th>
                <th className="px-3 py-3 text-center">A</th>
                <th className="px-3 py-3">TANGGAL BAYAR</th>
                <th className="px-3 py-3"></th>
                <th className="px-4 py-3">NOMOR SP2D</th>
                <th onClick={() => handleSort('lamaHariHutang')} className="px-3 py-3 text-center cursor-pointer hover:bg-teal-100/50 dark:hover:bg-[#1a382e]">
                  <div className="flex items-center justify-center gap-1">UMUR HUTANG <ArrowUpDown className="w-2.5 h-2.5" /></div>
                </th>
                <th className="px-3 py-3 text-right text-amber-700 dark:text-amber-500">BELUM JT</th>
                <th className="px-3 py-3 text-right text-orange-600 dark:text-orange-400">1-30 Hari</th>
                <th className="px-3 py-3 text-right text-rose-600 dark:text-rose-400">31-60 Hari</th>
                <th className="px-3 py-3 text-right text-red-600 dark:text-red-400">61-90 Hari</th>
                <th className="px-3 py-3 text-right text-rose-700 dark:text-rose-300 font-bold">&gt;90 Hari</th>
                <th className="px-3 py-3 text-center w-24 border-l border-teal-200 dark:border-emerald-900">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={28} className="px-6 py-12 text-center text-slate-500 dark:text-zinc-400">
                    Tidak ada data invoice yang sesuai dengan kriteria pencarian/filter.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isLunas = item.sisaHutang <= 0;
                  const sisa = item.sisaHutang;
                  const umur = item.lamaHariHutang;
                  const belumJt = sisa > 0 && umur <= 0 ? sisa : 0;
                  const h130 = sisa > 0 && umur > 0 && umur <= 30 ? sisa : 0;
                  const h3160 = sisa > 0 && umur > 30 && umur <= 60 ? sisa : 0;
                  const h6190 = sisa > 0 && umur > 60 && umur <= 90 ? sisa : 0;
                  const h90plus = sisa > 0 && umur > 90 ? sisa : 0;

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-teal-50/40 dark:hover:bg-[#131f1c] transition ${
                        isLunas ? 'bg-white dark:bg-[#0d1216]' : 'bg-rose-50/20 dark:bg-rose-950/10'
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-600 dark:text-zinc-400 border-r border-slate-100 dark:border-zinc-800/60">
                        {item.no}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-zinc-100 max-w-[200px] truncate border-r border-slate-100 dark:border-zinc-800/60">
                        {item.rekanan}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-zinc-400 text-[11px] max-w-[140px] truncate">
                        {item.bagian || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-zinc-300 text-[11px] max-w-[220px] truncate">
                        {item.uraian || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-zinc-400 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-medium">
                          {item.subBelanja || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                        {item.tglTandaTerima || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                        {item.tglSpbSpk || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                        {item.tglInvoice || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-zinc-300 font-semibold text-[10px]">
                        {item.bulanInvoice || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-indigo-700 dark:text-indigo-300 font-medium text-[11px]">
                        {item.noInvoice || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                        {item.jatuhTempo || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-800 dark:text-zinc-200">
                        {formatRupiah(item.jumlahInvoice)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-500 dark:text-zinc-400">
                        {item.koreksi > 0 ? formatRupiah(item.koreksi) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100">
                        {formatRupiah(item.totalInvoiceFix)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.pembayaran > 0 ? formatRupiah(item.pembayaran) : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {item.sumberAnggaran ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.sumberAnggaran.includes('BLUD') 
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' 
                              : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                          }`}>
                            {item.sumberAnggaran}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800 dark:text-zinc-200 border-l border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-[#11181f]">
                        {item.sisaHutang > 0 ? formatRupiah(item.sisaHutang) : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {item.sudahMasukBukuKas ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                            TRUE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                            FALSE
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                        {item.tglSpdBukuKas || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-zinc-400 text-[10px] font-semibold">
                        {item.bulanSpd || '-'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10.5px] text-slate-700 dark:text-zinc-300 max-w-[200px] truncate" title={item.noSpdBukuKas}>
                        {item.noSpdBukuKas || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-medium text-slate-600 dark:text-zinc-400">
                        {item.lamaHariHutang > 0 ? `${item.lamaHariHutang}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[10.5px] text-amber-700 dark:text-amber-500">
                        {belumJt > 0 ? formatRupiah(belumJt) : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[10.5px] text-orange-600 dark:text-orange-400">
                        {h130 > 0 ? formatRupiah(h130) : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[10.5px] text-rose-600 dark:text-rose-400">
                        {h3160 > 0 ? formatRupiah(h3160) : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[10.5px] text-red-600 dark:text-red-400">
                        {h6190 > 0 ? formatRupiah(h6190) : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[10.5px] font-bold text-rose-700 dark:text-rose-300">
                        {h90plus > 0 ? formatRupiah(h90plus) : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center border-l border-slate-200 dark:border-zinc-800">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="p-1 rounded text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition cursor-pointer"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isPicHutangOrAdmin && (
                            <>
                              <button
                                onClick={() => handleToggleLunasInvoice(item)}
                                className={`p-1 rounded transition cursor-pointer ${
                                  item.sisaHutang <= 0
                                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                                    : 'text-amber-500 hover:text-emerald-600 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                                }`}
                                title={item.sisaHutang <= 0 ? 'Status Lunas (Klik untuk ubah jadi Belum Lunas)' : 'Klik untuk Set Lunas (Sisa Rp 0)'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                                title="Edit Baris Invoice"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(item.id, item.no)}
                                className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                title="Hapus Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* TOTALS FOOTER */}
            <tfoot className="bg-[#e4f4ed] dark:bg-[#10231c] font-bold text-slate-900 dark:text-white border-t-2 border-teal-400 dark:border-teal-800">
              <tr>
                <td colSpan={11} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                  TOTAL TERFILTER ({filteredItems.length} BARIS):
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-slate-900 dark:text-zinc-100">
                  {formatRupiah(stats.totalInvoice)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-slate-600 dark:text-zinc-400">
                  {stats.totalKoreksi > 0 ? formatRupiah(stats.totalKoreksi) : '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-teal-900 dark:text-teal-300">
                  {formatRupiah(stats.totalInvoiceFix)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-emerald-700 dark:text-emerald-300">
                  {stats.totalPembayaran > 0 ? formatRupiah(stats.totalPembayaran) : '-'}
                </td>
                <td></td>
                <td className="px-4 py-3 text-right font-mono text-xs text-rose-700 dark:text-rose-300">
                  {stats.totalSisaHutang > 0 ? formatRupiah(stats.totalSisaHutang) : '-'}
                </td>
                <td colSpan={5}></td>
                <td className="px-3 py-3 text-right font-mono text-xs text-amber-700 dark:text-amber-400">
                  {stats.totalBelumJt > 0 ? formatRupiah(stats.totalBelumJt) : '-'}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-orange-600 dark:text-orange-400">
                  {stats.totalH130 > 0 ? formatRupiah(stats.totalH130) : '-'}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-rose-600 dark:text-rose-400">
                  {stats.totalH3160 > 0 ? formatRupiah(stats.totalH3160) : '-'}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-red-600 dark:text-red-400">
                  {stats.totalH6190 > 0 ? formatRupiah(stats.totalH6190) : '-'}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs font-black text-rose-800 dark:text-rose-200">
                  {stats.totalH90plus > 0 ? formatRupiah(stats.totalH90plus) : '-'}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination controls */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredItems.length)} dari {filteredItems.length} data invoice
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
              </button>

              <div className="flex items-center gap-1">
                {(() => {
                  const maxVisible = 5;
                  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let end = start + maxVisible - 1;
                  if (end > totalPages) {
                    end = totalPages;
                    start = Math.max(1, end - maxVisible + 1);
                  }
                  const pages: number[] = [];
                  for (let p = start; p <= end; p++) {
                    pages.push(p);
                  }
                  return pages.map((pageNum) => (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                        currentPage === pageNum
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ));
                })()}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                Berikutnya <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Detail Modal */}
      {isDetailOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f171d] rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between border-b border-teal-800">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-teal-300" /> Detail Tagihan Invoice #{selectedRecord.no} - {selectedRecord.noInvoice}
                </h3>
                <p className="text-xs text-teal-200/80">{selectedRecord.rekanan}</p>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Identitas Dokumen & Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block font-medium">Rekanan / Vendor:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedRecord.rekanan}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block font-medium">Nomor Invoice:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{selectedRecord.noInvoice}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block font-medium">Bidang / Bagian Penanggung Jawab:</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedRecord.bidang || selectedRecord.bagian || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block font-medium">Sumber Anggaran:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200 inline-block px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300">{selectedRecord.sumberAnggaran || 'BLUD'}</span>
                </div>
              </div>

              {/* Klasifikasi Belanja & Kode Rekening */}
              <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs text-teal-800 dark:text-teal-300">
                  <Layers className="w-3.5 h-3.5" /> Pos Belanja & Klasifikasi Anggaran
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block font-medium">Uraian / Pos Belanja:</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedRecord.uraian || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block font-medium">Kode Rekening:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedRecord.kodeRekening || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block font-medium">Sub Belanja:</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedRecord.subBelanja || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block font-medium">Bulan Invoice:</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedRecord.bulanInvoice || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Tanggal-Tanggal Kalender */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-zinc-400 block">Tgl Invoice:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{selectedRecord.tglInvoice || '-'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-zinc-400 block">Jatuh Tempo:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{selectedRecord.jatuhTempo || '-'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-zinc-400 block">Tgl Rekap:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{selectedRecord.tglRekap || selectedRecord.tglTandaTerima || '-'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-zinc-400 block">Tgl Masuk SPJ:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{selectedRecord.tglMasukSpj || selectedRecord.tglSpbSpk || '-'}</span>
                </div>
              </div>

              {/* Finansial */}
              <div className="bg-teal-50 dark:bg-teal-950/30 p-4 rounded-xl border border-teal-200 dark:border-teal-900 space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-teal-100 dark:border-teal-900/50">
                  <span className="text-teal-900 dark:text-teal-200">Jumlah Tagihan Invoice:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(selectedRecord.jumlahInvoice)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-teal-100 dark:border-teal-900/50">
                  <span className="text-teal-900 dark:text-teal-200">Koreksi:</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">{formatRupiah(selectedRecord.koreksi)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-teal-100 dark:border-teal-900/50">
                  <span className="text-teal-900 dark:text-teal-200">Total Tagihan Fix / Nilai SPJ:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(selectedRecord.totalInvoiceFix)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-teal-100 dark:border-teal-900/50">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Total Pembayaran / Realisasi:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(selectedRecord.pembayaran)}</span>
                </div>
                <div className="flex justify-between items-center py-1 font-bold text-sm">
                  <span className="text-rose-900 dark:text-rose-300">Sisa Hutang Riil:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(selectedRecord.sisaHutangRiil)}</span>
                </div>
              </div>

              {/* Status Buku Kas, SPD & Tgl Bayar */}
              <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Informasi Buku Kas & Pembayaran:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 dark:text-zinc-300">
                  <div>Status Kas: <span className="font-bold text-teal-700 dark:text-teal-400">{selectedRecord.sudahMasukBukuKas ? 'Sudah Masuk (TRUE)' : 'Belum (FALSE)'}</span></div>
                  <div>Tgl Bayar: <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{selectedRecord.tglBayar || selectedRecord.tglSpdBukuKas || '-'}</span></div>
                  <div>Umur Hutang: <span className="font-semibold">{selectedRecord.lamaHariHutang || 0} hari</span></div>
                  <div className="col-span-2 sm:col-span-3">No SPD / Buku Kas: <span className="font-mono font-medium">{selectedRecord.noSpdBukuKas || '-'}</span></div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-100 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Form Modal (Create / Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f171d] rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between border-b border-teal-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-800 flex items-center justify-center text-teal-300 border border-teal-700">
                  {isEditMode ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {isEditMode ? `Edit Invoice No. ${formValues.no}` : 'Tambah Data Invoice Baru'}
                  </h3>
                  <p className="text-xs text-teal-200/80">Input data tagihan dengan dropdown otomatis & kalender terpadu</p>
                </div>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* SECTION 1: IDENTITAS DOKUMEN & VENDOR */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-zinc-800">
                  <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    1. Identitas Dokumen & Vendor
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">Nomor Urut</label>
                    <input
                      type="number"
                      value={formValues.no || ''}
                      onChange={(e) => setFormValues({ ...formValues, no: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl"
                      required
                    />
                  </div>

                  <div className="sm:col-span-9">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">Nama Rekanan / Vendor *</label>
                    <input
                      type="text"
                      list="rekanan-options"
                      value={formValues.rekanan || ''}
                      onChange={(e) => setFormValues({ ...formValues, rekanan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-medium"
                      placeholder="Pilih atau ketik nama rekanan..."
                      required
                    />
                    <datalist id="rekanan-options">
                      {uniqueRekanan.map((rek, idx) => (
                        <option key={idx} value={rek} />
                      ))}
                    </datalist>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">No Invoice / Kwitansi *</label>
                    <input
                      type="text"
                      value={formValues.noInvoice || ''}
                      onChange={(e) => setFormValues({ ...formValues, noInvoice: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-indigo-600 dark:text-indigo-400 font-semibold"
                      placeholder="Contoh: T.HCA.0180.25.MDP"
                      required
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">Bidang / Bagian Penanggung Jawab</label>
                    <select
                      value={formValues.bidang || formValues.bagian || 'Bidang Pelayanan Non Medik'}
                      onChange={(e) => setFormValues({ ...formValues, bidang: e.target.value, bagian: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-medium"
                    >
                      {BIDANG_OPTIONS.map((bid, idx) => (
                        <option key={idx} value={bid}>{bid}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: KLASIFIKASI BELANJA & KODE REKENING */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-zinc-800">
                  <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    2. Klasifikasi & Pos Belanja (Otomatis Dropdown)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Pos Belanja Dropdown lengkap dengan Kode Rekening */}
                  <div className="sm:col-span-8">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 dark:text-zinc-300 font-bold">
                        Pos Belanja (Lengkap Kode Rekening)
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomPosBelanja(!isCustomPosBelanja)}
                        className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                      >
                        {isCustomPosBelanja ? 'Pilih dari Master Pos' : '+ Input Manual'}
                      </button>
                    </div>

                    {isCustomPosBelanja ? (
                      <input
                        type="text"
                        value={formValues.uraian || ''}
                        onChange={(e) => setFormValues({ ...formValues, uraian: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl"
                        placeholder="Ketik uraian pos belanja kustom..."
                      />
                    ) : (
                      <select
                        value={
                          availablePosBelanja.find(p => p.uraian === formValues.uraian)?.label ||
                          (formValues.uraian ? `${formValues.kodeRekening || '[No Rek]'} - ${formValues.uraian}` : '')
                        }
                        onChange={(e) => {
                          const selected = availablePosBelanja.find(p => p.label === e.target.value);
                          if (selected) {
                            setFormValues({
                              ...formValues,
                              uraian: selected.uraian,
                              kodeRekening: selected.kodeRekening
                            });
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-medium"
                      >
                        <option value="">-- Pilih Pos Belanja Lengkap Kode Rekening --</option>
                        {availablePosBelanja.map((pos, idx) => (
                          <option key={idx} value={pos.label}>
                            {pos.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Kode Rekening */}
                  <div className="sm:col-span-4">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">Kode Rekening</label>
                    <input
                      type="text"
                      value={formValues.kodeRekening || ''}
                      onChange={(e) => setFormValues({ ...formValues, kodeRekening: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-indigo-600 dark:text-indigo-400 font-semibold"
                      placeholder="5.1.02.01.01.0012"
                    />
                  </div>

                  {/* Sub Belanja Dropdown */}
                  <div className="sm:col-span-6">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 dark:text-zinc-300 font-bold">
                        Sub Belanja (Dropdown Otomatis)
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomSubBelanja(!isCustomSubBelanja)}
                        className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                      >
                        {isCustomSubBelanja ? 'Pilih dari List' : '+ Input Manual'}
                      </button>
                    </div>

                    {isCustomSubBelanja ? (
                      <input
                        type="text"
                        value={formValues.subBelanja || ''}
                        onChange={(e) => setFormValues({ ...formValues, subBelanja: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl uppercase font-semibold"
                        placeholder="Contoh: BELANJA BMHP"
                      />
                    ) : (
                      <select
                        value={formValues.subBelanja || 'BELANJA BMHP'}
                        onChange={(e) => setFormValues({ ...formValues, subBelanja: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-semibold"
                      >
                        {availableSubBelanja.map((sub, idx) => (
                          <option key={idx} value={sub}>{sub}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Sumber Anggaran */}
                  <div className="sm:col-span-6">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">Sumber Anggaran</label>
                    <select
                      value={formValues.sumberAnggaran || 'BLUD'}
                      onChange={(e) => setFormValues({ ...formValues, sumberAnggaran: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-semibold"
                    >
                      <option value="BLUD">BLUD</option>
                      <option value="APBD">APBD</option>
                      <option value="BLUD / APBD">BLUD / APBD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: KALENDER & JADWAL OTOMATIS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-zinc-800">
                  <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    3. Tanggal & Kalender Otomatis (Picker Kalender)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Tanggal Invoice (Kalender) */}
                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold">
                      Tanggal Invoice (Kalender)
                    </label>
                    <input
                      type="date"
                      value={toInputDate(formValues.tglInvoice)}
                      onChange={(e) => {
                        const iso = e.target.value;
                        const display = fromInputDate(iso);
                        const month = getMonthNameFromDate(iso);
                        setFormValues({
                          ...formValues,
                          tglInvoice: display,
                          bulanInvoice: month
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-xs"
                    />
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>Bulan: <strong className="text-teal-600 dark:text-teal-400">{formValues.bulanInvoice || 'DESEMBER'}</strong></span>
                      <span className="font-mono">{formValues.tglInvoice || '-'}</span>
                    </div>
                  </div>

                  {/* Jatuh Tempo (Kalender) */}
                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold">
                      Jatuh Tempo (Kalender)
                    </label>
                    <input
                      type="date"
                      value={toInputDate(formValues.jatuhTempo)}
                      onChange={(e) => {
                        const iso = e.target.value;
                        const display = fromInputDate(iso);
                        // Hitung hari jika ada tgl invoice
                        let diffDays = formValues.lamaHariHutang || 0;
                        if (iso) {
                          const jtTime = new Date(iso).getTime();
                          const nowTime = new Date().getTime();
                          diffDays = Math.max(0, Math.floor((nowTime - jtTime) / (1000 * 60 * 60 * 24)));
                        }
                        setFormValues({
                          ...formValues,
                          jatuhTempo: display,
                          lamaHariHutang: diffDays
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-xs"
                    />
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>Umur: <strong>{formValues.lamaHariHutang || 0} hari</strong></span>
                      <span className="font-mono">{formValues.jatuhTempo || '-'}</span>
                    </div>
                  </div>

                  {/* TGL REKAP (Kalender) */}
                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold">
                      Tgl Rekap (Kalender)
                    </label>
                    <input
                      type="date"
                      value={toInputDate(formValues.tglRekap || formValues.tglTandaTerima)}
                      onChange={(e) => {
                        const display = fromInputDate(e.target.value);
                        setFormValues({
                          ...formValues,
                          tglRekap: display,
                          tglTandaTerima: display
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-xs"
                    />
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 text-right font-mono">
                      {formValues.tglRekap || formValues.tglTandaTerima || '-'}
                    </div>
                  </div>

                  {/* TGL MASUK SPJ (Kalender) */}
                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold">
                      Tgl Masuk SPJ (Kalender)
                    </label>
                    <input
                      type="date"
                      value={toInputDate(formValues.tglMasukSpj || formValues.tglSpbSpk)}
                      onChange={(e) => {
                        const display = fromInputDate(e.target.value);
                        setFormValues({
                          ...formValues,
                          tglMasukSpj: display,
                          tglSpbSpk: display
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-xs"
                    />
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 text-right font-mono">
                      {formValues.tglMasukSpj || formValues.tglSpbSpk || '-'}
                    </div>
                  </div>

                  {/* TGL BAYAR (Kalender) */}
                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold">
                      Tgl Bayar (Kalender)
                    </label>
                    <input
                      type="date"
                      value={toInputDate(formValues.tglBayar || formValues.tglSpdBukuKas)}
                      onChange={(e) => {
                        const display = fromInputDate(e.target.value);
                        setFormValues({
                          ...formValues,
                          tglBayar: display,
                          tglSpdBukuKas: display
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-xs"
                    />
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 text-right font-mono">
                      {formValues.tglBayar || formValues.tglSpdBukuKas || '-'}
                    </div>
                  </div>

                  {/* Bulan Invoice Select */}
                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold">
                      Bulan Pembukuan
                    </label>
                    <select
                      value={formValues.bulanInvoice || 'DESEMBER'}
                      onChange={(e) => setFormValues({ ...formValues, bulanInvoice: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-semibold"
                    >
                      <option value="JANUARI">JANUARI</option>
                      <option value="FEBRUARI">FEBRUARI</option>
                      <option value="MARET">MARET</option>
                      <option value="APRIL">APRIL</option>
                      <option value="MEI">MEI</option>
                      <option value="JUNI">JUNI</option>
                      <option value="JULI">JULI</option>
                      <option value="AGUSTUS">AGUSTUS</option>
                      <option value="SEPTEMBER">SEPTEMBER</option>
                      <option value="OKTOBER">OKTOBER</option>
                      <option value="NOVEMBER">NOVEMBER</option>
                      <option value="DESEMBER">DESEMBER</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: NILAI FINANSIAL & REALISASI */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-zinc-800">
                  <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    4. Nilai Finansial, Realisasi & Buku Kas
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">Jumlah Tagihan Invoice (Rp) *</label>
                    <input
                      type="number"
                      value={formValues.jumlahInvoice || 0}
                      onChange={(e) => {
                        const j = Number(e.target.value);
                        const k = Number(formValues.koreksi) || 0;
                        const p = Number(formValues.pembayaran) || 0;
                        const fix = j + k;
                        const sisa = Math.max(0, fix - p);
                        setFormValues({ 
                          ...formValues, 
                          jumlahInvoice: j,
                          totalInvoiceFix: fix,
                          sisaHutang: sisa,
                          sisaHutangRiil: sisa
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">Koreksi (Rp)</label>
                    <input
                      type="number"
                      value={formValues.koreksi || 0}
                      onChange={(e) => {
                        const k = Number(e.target.value);
                        const j = Number(formValues.jumlahInvoice) || 0;
                        const p = Number(formValues.pembayaran) || 0;
                        const fix = j + k;
                        const sisa = Math.max(0, fix - p);
                        setFormValues({ 
                          ...formValues, 
                          koreksi: k,
                          totalInvoiceFix: fix,
                          sisaHutang: sisa,
                          sisaHutangRiil: sisa
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">Nilai SPJ / Tagihan Fix (Rp)</label>
                    <input
                      type="number"
                      value={formValues.totalInvoiceFix !== undefined ? formValues.totalInvoiceFix : ''}
                      onChange={(e) => {
                        const fix = Number(e.target.value);
                        const p = Number(formValues.pembayaran) || 0;
                        const sisa = Math.max(0, fix - p);
                        setFormValues({ 
                          ...formValues, 
                          totalInvoiceFix: fix,
                          sisaHutang: sisa,
                          sisaHutangRiil: sisa
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-blue-600 dark:text-blue-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">Pembayaran / Realisasi (Rp)</label>
                    <input
                      type="number"
                      value={formValues.pembayaran || 0}
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        let fix = Number(formValues.totalInvoiceFix) !== undefined && formValues.totalInvoiceFix !== '' 
                          ? Number(formValues.totalInvoiceFix) 
                          : ((Number(formValues.jumlahInvoice) || 0) + (Number(formValues.koreksi) || 0));
                        let j = Number(formValues.jumlahInvoice) || 0;
                        if (p > 0 && fix === 0 && j === 0) {
                          fix = p;
                          j = p;
                        }
                        const sisa = Math.max(0, fix - p);
                        setFormValues({ 
                          ...formValues, 
                          pembayaran: p,
                          totalInvoiceFix: fix,
                          jumlahInvoice: j,
                          sisaHutang: sisa,
                          sisaHutangRiil: sisa
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">Sisa Hutang (Rp)</label>
                    <input
                      type="number"
                      value={formValues.sisaHutang !== undefined ? formValues.sisaHutang : (formValues.sisaHutangRiil || 0)}
                      onChange={(e) => {
                        const s = Number(e.target.value);
                        const fix = Number(formValues.totalInvoiceFix) || ((Number(formValues.jumlahInvoice) || 0) + (Number(formValues.koreksi) || 0));
                        setFormValues({ 
                          ...formValues, 
                          sisaHutang: s,
                          sisaHutangRiil: s,
                          pembayaran: s === 0 ? fix : (Number(formValues.pembayaran) || 0)
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-rose-600 dark:text-rose-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">No SPD / Buku Kas</label>
                    <input
                      type="text"
                      value={formValues.noSpdBukuKas || ''}
                      onChange={(e) => setFormValues({ ...formValues, noSpdBukuKas: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono"
                      placeholder="SPD-LS/RSUD Jatisari/V/2026/00281"
                    />
                  </div>
                </div>

                {/* Quick actions for setting Lunas or recalculating */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      let fix = Number(formValues.totalInvoiceFix) || ((Number(formValues.jumlahInvoice) || 0) + (Number(formValues.koreksi) || 0));
                      let j = Number(formValues.jumlahInvoice) || 0;
                      let p = Number(formValues.pembayaran) || 0;
                      if (fix === 0 && p > 0) {
                        fix = p;
                        j = p;
                      } else if (fix === 0 && j > 0) {
                        fix = j;
                        p = j;
                      } else if (fix > 0 && p === 0) {
                        p = fix;
                      }
                      setFormValues({
                        ...formValues,
                        jumlahInvoice: j > 0 ? j : fix,
                        totalInvoiceFix: fix,
                        pembayaran: p > 0 ? p : fix,
                        sisaHutang: 0,
                        sisaHutangRiil: 0,
                        sudahMasukBukuKas: true,
                        keterangan: 'Lunas'
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-300 dark:border-emerald-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Set Lunas (Realisasi Penuh / Sisa Rp 0)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const j = Number(formValues.jumlahInvoice) || 0;
                      const k = Number(formValues.koreksi) || 0;
                      const fix = j + k;
                      setFormValues({
                        ...formValues,
                        totalInvoiceFix: fix,
                        pembayaran: 0,
                        sisaHutang: fix,
                        sisaHutangRiil: fix,
                        keterangan: 'Belum Lunas'
                      });
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" /> Reset Belum Bayar
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2 bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <input
                    type="checkbox"
                    id="masukBukuKas"
                    checked={formValues.sudahMasukBukuKas || false}
                    onChange={(e) => setFormValues({ ...formValues, sudahMasukBukuKas: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="masukBukuKas" className="font-semibold text-slate-800 dark:text-zinc-200 cursor-pointer select-none">
                    Sudah Masuk Buku Kas & Dicatat dalam Realisasi Pembukuan
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-100 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-2 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                >
                  <Save className="w-4 h-4" /> Simpan Data Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      <ImportInvoiceExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        existingCount={data.length}
      />

    </div>
  );
};
