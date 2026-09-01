import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Building, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Download, 
  CreditCard, 
  X, 
  FileText, 
  Clock, 
  Plus,
  Receipt,
  DollarSign,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  UserPlus,
  Tag,
  Briefcase,
  Shield,
  Phone,
  User,
  Info,
  Edit,
  Trash2,
  UploadCloud,
  Sliders,
  Wallet,
  ShieldCheck
} from 'lucide-react';
import { 
  PERUSAHAAN_ASURANSI_REAL_DATA, 
  MASTER_PARTNER_COMPANIES,
  MasterPartnerInfo,
  PerusahaanAsuransiRow,
  InvoicePerusahaan,
  generateDefaultInvoices,
  generateAllMonthsPerusahaanData,
  getCompanyCode
} from '../data/spreadsheetData2026';
import { syncSemuaRekapanFromSources, rollForwardPerusahaanRows } from '../services/rekapanSyncService';
import { syncDocumentToFirestore } from '../services/firestoreSync';
import { formatRupiah, formatDateDDMMYYYY } from '../utils/formatters';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../lib/firebase';

interface PerusahaanAsuransiViewProps { 
  isAdmin?: boolean;
  currentUserEmail?: string;
  userRole?: string;
  selectedBulan?: string;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
  onOpenUploadModal?: () => void;
}

const BULAN_OPTIONS = [
  'Semua Bulan',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const MONTH_NAMES_UPPER = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

export const parseDateFlexible = (tanggal: string | undefined | null): Date | null => {
  if (!tanggal || tanggal === '-' || tanggal.trim() === '') return null;
  const trimmed = tanggal.trim();

  // Pattern: DD/MM/YYYY or DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = parseInt(dmy[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Pattern: YYYY-MM-DD
  const ymd = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1;
    const day = parseInt(ymd[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  return null;
};

const calculateUmurPiutang = (tanggal: string | undefined | null): number | null => {
  const d = parseDateFlexible(tanggal);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? 0 : diffDays;
};

export const getEffectiveInvoiceStatus = (
  inv: { 
    status?: string; 
    nominalTagihan?: number; 
    pembayaran?: number; 
    sisaPiutang?: number; 
    tanggalJatuhTempo?: string; 
    tanggalInvoice?: string 
  },
  fallbackTanggalPengajuan?: string,
  fallbackTanggalJatuhTempo?: string
): { label: 'Lunas' | 'Jatuh Tempo' | 'Belum Jatuh Tempo' | 'Saldo Negatif/Koreksi' | 'Belum Ada Tgl JT' | 'Sebagian'; badgeClass: string } => {
  const nominal = inv.nominalTagihan || 0;
  const sisa = inv.sisaPiutang !== undefined ? inv.sisaPiutang : (nominal - (inv.pembayaran || 0));
  
  if (sisa <= 0 && (nominal > 0 || (inv.pembayaran || 0) > 0)) {
    return {
      label: 'Lunas',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
    };
  }

  if (sisa < 0 || inv.status === 'Saldo Negatif/Koreksi') {
    return {
      label: 'Saldo Negatif/Koreksi',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
    };
  }

  // 1. Check Tanggal Jatuh Tempo
  const tglJT = inv.tanggalJatuhTempo || fallbackTanggalJatuhTempo;
  const parsedJT = parseDateFlexible(tglJT);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsedJT) {
    parsedJT.setHours(0, 0, 0, 0);
    // If today is on or past due date -> Jatuh Tempo
    if (today.getTime() >= parsedJT.getTime()) {
      return {
        label: 'Jatuh Tempo',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
      };
    } else {
      return {
        label: 'Belum Jatuh Tempo',
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
      };
    }
  }

  // 2. If no Tanggal Jatuh Tempo, check Tanggal Invoice / Pengajuan (Standard 30 days term)
  const tglInv = inv.tanggalInvoice || fallbackTanggalPengajuan;
  const parsedInv = parseDateFlexible(tglInv);
  if (parsedInv) {
    parsedInv.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - parsedInv.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return {
        label: 'Jatuh Tempo',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
      };
    } else {
      return {
        label: 'Belum Jatuh Tempo',
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
      };
    }
  }

  if (inv.status === 'Jatuh Tempo' || inv.status === 'Lewat Jatuh Tempo') {
    return {
      label: 'Jatuh Tempo',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
    };
  }

  if (inv.status === 'Sebagian') {
    return {
      label: 'Sebagian',
      badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300'
    };
  }

  return {
    label: 'Belum Ada Tgl JT',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
  };
};

export const getEffectiveRowStatus = (row: PerusahaanAsuransiRow): { label: 'Lunas' | 'Jatuh Tempo' | 'Belum Jatuh Tempo' | 'Saldo Negatif/Koreksi' | 'Belum Ada Tgl JT'; badgeClass: string } => {
  if (row.sisaPiutang <= 0 && row.piutangSdBulanIni > 0) {
    return {
      label: 'Lunas',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
    };
  }
  if (row.sisaPiutang < 0 || row.status === 'Saldo Negatif/Koreksi') {
    return {
      label: 'Saldo Negatif/Koreksi',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
    };
  }
  
  const rowInvoices = (row.invoices && row.invoices.length > 0) ? row.invoices : [];
  if (rowInvoices.length > 0) {
    const hasUnpaidJatuhTempo = rowInvoices.some(inv => {
      const st = getEffectiveInvoiceStatus(inv, row.tanggalPengajuan, row.tanggalJatuhTempo);
      const isUnpaid = (inv.sisaPiutang !== undefined ? inv.sisaPiutang > 0 : (inv.nominalTagihan || 0) > (inv.pembayaran || 0));
      return st.label === 'Jatuh Tempo' && isUnpaid;
    });
    if (hasUnpaidJatuhTempo) {
      return {
        label: 'Jatuh Tempo',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300'
      };
    }
  }

  const parsedJT = parseDateFlexible(row.tanggalJatuhTempo);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsedJT) {
    parsedJT.setHours(0, 0, 0, 0);
    if (today.getTime() >= parsedJT.getTime()) {
      return {
        label: 'Jatuh Tempo',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300'
      };
    }
    return {
      label: 'Belum Jatuh Tempo',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
    };
  }

  const parsedPengajuan = parseDateFlexible(row.tanggalPengajuan);
  if (parsedPengajuan) {
    parsedPengajuan.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - parsedPengajuan.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return {
        label: 'Jatuh Tempo',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300'
      };
    }
    return {
      label: 'Belum Jatuh Tempo',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
    };
  }

  return {
    label: (row.status as any) || 'Belum Ada Tgl JT',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
  };
};

const renderUmurPiutang = (row: PerusahaanAsuransiRow, invoices: InvoicePerusahaan[]) => {
  if (row.sisaPiutang === 0) return '-'; 
  
  if (invoices.length === 0) {
    const umur = calculateUmurPiutang(row.tanggalPengajuan);
    return umur !== null ? `${umur} Hari` : '-';
  }
  
  const umurs = invoices
    .filter(inv => inv.sisaPiutang > 0)
    .map(inv => calculateUmurPiutang(inv.tanggalInvoice || row.tanggalPengajuan))
    .filter(u => u !== null) as number[];
    
  if (umurs.length === 0) return '-';
  
  if (umurs.length === 1) return `${umurs[0]} Hari`;
  
  const min = Math.min(...umurs);
  const max = Math.max(...umurs);
  
  if (min === max) return `${min} Hari`;
  return `${min} - ${max} Hari`;
};

const MONTH_NUMBER_MAP: Record<string, string> = {
  JANUARI: '01', FEBRUARI: '02', MARET: '03', APRIL: '04',
  MEI: '05', JUNI: '06', JULI: '07', AGUSTUS: '08',
  SEPTEMBER: '09', OKTOBER: '10', NOVEMBER: '11', DESEMBER: '12'
};

const KATEGORI_OPTIONS: MasterPartnerInfo['kategori'][] = [
  'Asuransi Swasta',
  'Perusahaan / Korporasi',
  'Rumah Sakit / Faskes',
  'BUMN / Instansi Pemerintah'
];

const LAYANAN_OPTIONS = [
  'Rawat Jalan',
  'Rawat Inap',
  'Laboratorium',
  'MCU',
  'IGD',
  'RADIOLOGI',
  'Lab & Sterilisasi Alat',
  'MOW'
];

// Module-level singleton memory caches
let inMemoryPerusahaanCache: PerusahaanAsuransiRow[] | null = null;
let inMemoryMasterPartnersCache: MasterPartnerInfo[] | null = null;

export const PerusahaanAsuransiView: React.FC<PerusahaanAsuransiViewProps> = ({ isAdmin, onShowToast, onOpenUploadModal, currentUserEmail, userRole }) => {
  const isSuperAdmin = (userRole === 'admin') || Boolean(isAdmin);
  const isPicPiutangOrAdmin = isSuperAdmin || (userRole === 'pic_piutang');

  const canModifyRecord = (record: any) => {
    if (isSuperAdmin) return true;
    if (userRole === 'pic_piutang') {
      if (!record?.createdBy || record?.createdBy === currentUserEmail) return true;
    }
    return false;
  };

  // 1. MASTER PARTNER DIRECTORY (Initialized with 40 partners, extensible by user)
  const [masterPartners, setMasterPartners] = useState<MasterPartnerInfo[]>(() => {
    if (inMemoryMasterPartnersCache && inMemoryMasterPartnersCache.length > 0) {
      return inMemoryMasterPartnersCache;
    }
    try {
      const saved = localStorage.getItem('rsud_master_partner_companies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge to ensure no missing defaults
          const existingNames = new Set(parsed.map((p: MasterPartnerInfo) => p.namaPerusahaan.toLowerCase()));
          const missingDefaults = MASTER_PARTNER_COMPANIES.filter(p => !existingNames.has(p.namaPerusahaan.toLowerCase()));
          const merged = [...parsed, ...missingDefaults];
          inMemoryMasterPartnersCache = merged;
          return merged;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    inMemoryMasterPartnersCache = MASTER_PARTNER_COMPANIES;
    return MASTER_PARTNER_COMPANIES;
  });

  // 2. DATA PERUSAHAAN DI SEMUA BULAN (Januari - Desember)
  const [dataList, setDataList] = useState<PerusahaanAsuransiRow[]>(() => {
    if (inMemoryPerusahaanCache && inMemoryPerusahaanCache.length > 0) {
      return inMemoryPerusahaanCache;
    }
    try {
      const saved = localStorage.getItem('rsud_perusahaan_asuransi_2026');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if data contains old nonzero sample data that should be cleared
          const hasOldSampleData = parsed.some((r: PerusahaanAsuransiRow) => 
            (r.namaPerusahaan === 'Fullerton Health Indonesia - SOMPO' && r.piutangSdBulanIni === 3039921) ||
            (r.namaPerusahaan === 'RS PURI ASIH' && r.piutangSdBulanIni === 22294200) ||
            (r.namaPerusahaan === 'PT PLUMPANG RAYA ANUGRAH' && r.piutangSdBulanIni === 57939829)
          );

          if (!hasOldSampleData) {
            const monthsInSaved = new Set(parsed.map((r: PerusahaanAsuransiRow) => r.bulan.toUpperCase()));
            if (monthsInSaved.size >= 10 && parsed.length >= 100) {
              const res = parsed.map((row: PerusahaanAsuransiRow) => ({
                ...row,
                invoices: row.invoices !== undefined ? row.invoices : []
              }));
              const rolled = rollForwardPerusahaanRows(res);
              inMemoryPerusahaanCache = rolled;
              return rolled;
            }
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }
    // Generate all 12 months clean empty data for all 40 partners
    const fresh = rollForwardPerusahaanRows(generateAllMonthsPerusahaanData());
    try {
      localStorage.setItem('rsud_perusahaan_asuransi_2026', JSON.stringify(fresh));
    } catch (e) {}
    inMemoryPerusahaanCache = fresh;
    return fresh;
  });

  // Synchronize across components
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('rsud_perusahaan_asuransi_2026');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryPerusahaanCache = parsed;
            setDataList(parsed);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener('rsud_perusahaan_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('rsud_perusahaan_data_updated', handleUpdate);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBulan, setSelectedBulan] = useState('Agustus'); // Default to current month Agustus or Semua Bulan
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedJenis, setSelectedJenis] = useState('Semua');
  const [selectedKategori, setSelectedKategori] = useState('Semua');

  // Active Dropdown Menu state: key is `no-namaPerusahaan-bulan`
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<Set<string>>(new Set());
  const [copiedInvoiceNo, setCopiedInvoiceNo] = useState<string | null>(null);

  // --- MODAL 1: TAMBAH REKANAN BARU (NEW PARTNER COMPANY / INSURANCE) ---
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [partnerNama, setPartnerNama] = useState('');
  const [partnerKategori, setPartnerKategori] = useState<MasterPartnerInfo['kategori']>('Asuransi Swasta');
  const [partnerLayanan, setPartnerLayanan] = useState('Rawat Jalan');
  const [partnerPic, setPartnerPic] = useState('');
  const [partnerTelepon, setPartnerTelepon] = useState('');
  const [partnerKeterangan, setPartnerKeterangan] = useState('');
  const [applyToAllMonths, setApplyToAllMonths] = useState(true);

  // --- MODAL 2: ENTRI TAGIHAN INVOICE BARU (NEW INVOICE ENTRY) ---
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [newNamaPerusahaan, setNewNamaPerusahaan] = useState('PT Pupuk Kujang Cikampek');
  const [newNoInvoice, setNewNoInvoice] = useState('');
  const [newTglInvoice, setNewTglInvoice] = useState(new Date().toISOString().split('T')[0]);
  const [newTglJatuhTempo, setNewTglJatuhTempo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [newNominalTagihan, setNewNominalTagihan] = useState<number | ''>('');
  const [newJenisPengobatan, setNewJenisPengobatan] = useState('Rawat Inap');
  const [newBulanTagihan, setNewBulanTagihan] = useState('Agustus');
  const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);
  const [newDocumentUrl, setNewDocumentUrl] = useState<string>('');
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('Ukuran file terlalu besar. Maksimal 2MB.');
        return;
      }
      setNewDocumentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDocumentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- MODAL 3: INPUT PEMBAYARAN INVOICE / MANUAL ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<PerusahaanAsuransiRow | null>(null);
  const [selectedSpecificInvoice, setSelectedSpecificInvoice] = useState<InvoicePerusahaan | null>(null);
  const [payMode, setPayMode] = useState<'invoice' | 'manual'>('manual');
  const [manualPayType, setManualPayType] = useState<'tambah' | 'set_total'>('tambah');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payBukti, setPayBukti] = useState<string>('');
  const [payKeterangan, setPayKeterangan] = useState<string>('');

  // --- MODAL 4: SURAT PENAGIHAN / INVOICE CETAK ---
  const [suratRow, setSuratRow] = useState<PerusahaanAsuransiRow | null>(null);
  const [suratInvoiceDetail, setSuratInvoiceDetail] = useState<InvoicePerusahaan | null>(null);

  // --- MODAL 5: EDIT INVOICE ---
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PerusahaanAsuransiRow | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<InvoicePerusahaan | null>(null);
  const [editNoInvoice, setEditNoInvoice] = useState('');
  const [editTglInvoice, setEditTglInvoice] = useState('');
  const [editTglJatuhTempo, setEditTglJatuhTempo] = useState('');
  const [editNominalTagihan, setEditNominalTagihan] = useState<number | ''>('');
  const [editPembayaran, setEditPembayaran] = useState<number | ''>('');
  const [editJenisPengobatan, setEditJenisPengobatan] = useState('Rawat Inap');
  const [editStatus, setEditStatus] = useState<InvoicePerusahaan['status']>('Belum Jatuh Tempo');
  const [editKeterangan, setEditKeterangan] = useState('');

  // --- MODAL 6: HAPUS INVOICE (KONFIRMASI) ---
  const [isDeleteInvoiceOpen, setIsDeleteInvoiceOpen] = useState(false);
  const [deletingRow, setDeletingRow] = useState<PerusahaanAsuransiRow | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<InvoicePerusahaan | null>(null);

  // --- MODAL 7: EDIT SALDO PIUTANG LALU & ROLL-FORWARD ---
  const [isEditPiutangLaluOpen, setIsEditPiutangLaluOpen] = useState(false);
  const [editingPiutangLaluRow, setEditingPiutangLaluRow] = useState<PerusahaanAsuransiRow | null>(null);
  const [newPiutangLaluVal, setNewPiutangLaluVal] = useState<number | ''>('');

  // Close dropdown on click outside
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const saveData = (updated: PerusahaanAsuransiRow[]) => {
    // Automatically apply monthly sequential roll-forward across all 12 months for each company
    const rolledForward = rollForwardPerusahaanRows(updated);
    inMemoryPerusahaanCache = rolledForward;
    setDataList(rolledForward);
    try {
      localStorage.setItem('rsud_perusahaan_asuransi_2026', JSON.stringify(rolledForward));
    } catch (e) {
      console.error(e);
    }
    // Sync directly to Firebase Firestore for cross-domain persistence (Netlify, etc.)
    syncDocumentToFirestore('perusahaan_asuransi_2026', rolledForward);

    // Automatically synchronize with Semua Rekapan (10 Penjamin)
    try {
      syncSemuaRekapanFromSources(rolledForward);
    } catch (e) {
      console.warn('Error syncing Semua Rekapan:', e);
    }
    window.dispatchEvent(new CustomEvent('rsud_perusahaan_data_updated', { detail: rolledForward }));
    window.dispatchEvent(new CustomEvent('rsud_semua_rekapan_updated'));
    window.dispatchEvent(new CustomEvent('rsud_data_updated'));
  };

  const handleOpenEditPiutangLalu = (row: PerusahaanAsuransiRow, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPiutangLaluRow(row);
    setNewPiutangLaluVal(row.piutangLalu || 0);
    setIsEditPiutangLaluOpen(true);
    setOpenDropdownKey(null);
  };

  const handleSaveEditPiutangLalu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPiutangLaluRow) return;

    const nominalNum = typeof newPiutangLaluVal === 'number' ? newPiutangLaluVal : 0;
    const targetComp = (editingPiutangLaluRow.namaPerusahaan || '').trim().toLowerCase();
    const targetMonth = (editingPiutangLaluRow.bulan || '').toUpperCase();

    const updated = dataList.map(r => {
      if ((r.namaPerusahaan || '').trim().toLowerCase() === targetComp && (r.bulan || '').toUpperCase() === targetMonth) {
        const sdBulanIni = nominalNum + (r.piutangBulanIni || 0);
        const sisa = Math.max(0, sdBulanIni - (r.pembayaran || 0));
        return {
          ...r,
          piutangLalu: nominalNum,
          piutangSdBulanIni: sdBulanIni,
          sisaPiutang: sisa,
          status: (sisa === 0 && sdBulanIni > 0) ? 'Lunas' : (sisa === 0 ? 'Lunas' : r.status)
        };
      }
      return r;
    });

    saveData(updated);
    setIsEditPiutangLaluOpen(false);

    if (onShowToast) {
      onShowToast(`Saldo Piutang Lalu "${editingPiutangLaluRow.namaPerusahaan}" (${editingPiutangLaluRow.bulan}) sebesar ${formatRupiah(nominalNum)} berhasil disimpan dan di-roll forward ke bulan berikutnya!`, 'success');
    }
  };

  const saveMasterPartners = (updatedPartners: MasterPartnerInfo[]) => {
    inMemoryMasterPartnersCache = updatedPartners;
    setMasterPartners(updatedPartners);
    try {
      localStorage.setItem('rsud_master_partner_companies', JSON.stringify(updatedPartners));
    } catch (e) {
      console.error(e);
    }
    window.dispatchEvent(new CustomEvent('rsud_master_partners_updated', { detail: updatedPartners }));
  };

  const handleCopyInvoice = (noInvoice: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(noInvoice);
    setCopiedInvoiceNo(noInvoice);
    setTimeout(() => setCopiedInvoiceNo(null), 2000);
    if (onShowToast) {
      onShowToast(`Nomor invoice ${noInvoice} berhasil disalin!`, 'info');
    }
  };

  const toggleRowAccordion = (rowKey: string) => {
    setExpandedRowKeys(prev => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  // Helper to generate Invoice Number dynamically
  const generateInvoiceNumberForCompany = (compName: string, targetMonth: string) => {
    const code = getCompanyCode(compName);
    const upperMonth = targetMonth.toUpperCase();
    const mm = MONTH_NUMBER_MAP[upperMonth] || '08';
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `INV/2026/${mm}/${code}-${randomNum}`;
  };

  // Helper to reliably obtain active invoices for a company row (empty if no invoices or deleted)
  const getRowInvoices = (row: PerusahaanAsuransiRow): InvoicePerusahaan[] => {
    if (row.invoices !== undefined) {
      return row.invoices.filter(inv => (inv.nominalTagihan || 0) > 0 || (inv.noInvoice && !inv.noInvoice.endsWith('-000')));
    }
    if (row.piutangSdBulanIni > 0 || row.piutangBulanIni > 0) {
      return generateDefaultInvoices(row).filter(inv => (inv.nominalTagihan || 0) > 0 || (inv.noInvoice && !inv.noInvoice.endsWith('-000')));
    }
    return [];
  };

  // Filtered Data based on selected month, search query, status, and category
  const filteredData = useMemo(() => {
    return dataList.filter(row => {
      const q = searchQuery.toLowerCase();
      const rowInvoices = getRowInvoices(row);
      const matchSearch = q === '' ||
        row.namaPerusahaan.toLowerCase().includes(q) ||
        row.jenisPengobatan.toLowerCase().includes(q) ||
        row.keterangan.toLowerCase().includes(q) ||
        rowInvoices.some(inv => inv.noInvoice.toLowerCase().includes(q));

      const matchBulan = selectedBulan === 'Semua Bulan' || 
        row.bulan.toUpperCase() === selectedBulan.toUpperCase();
      
      const effectiveRowStatus = getEffectiveRowStatus(row);
      const matchStatus = selectedStatus === 'Semua' || 
        effectiveRowStatus.label === selectedStatus || 
        row.status === selectedStatus ||
        (selectedStatus === 'Jatuh Tempo' && rowInvoices.some(inv => getEffectiveInvoiceStatus(inv, row.tanggalPengajuan, row.tanggalJatuhTempo).label === 'Jatuh Tempo')) ||
        (selectedStatus === 'Belum Jatuh Tempo' && effectiveRowStatus.label === 'Belum Jatuh Tempo');
      const matchJenis = selectedJenis === 'Semua' || row.jenisPengobatan === selectedJenis;

      // Category matching via master directory
      let matchKategori = true;
      if (selectedKategori !== 'Semua') {
        const foundMaster = masterPartners.find(p => p.namaPerusahaan.toLowerCase() === row.namaPerusahaan.toLowerCase());
        matchKategori = foundMaster ? foundMaster.kategori === selectedKategori : true;
      }

      return matchSearch && matchBulan && matchStatus && matchJenis && matchKategori;
    });
  }, [dataList, searchQuery, selectedBulan, selectedStatus, selectedJenis, selectedKategori, masterPartners]);

  // Aggregate Metrics for currently filtered data
  const metrics = useMemo(() => {
    const totalPiutangSdBulanIni = filteredData.reduce((s, r) => s + r.piutangSdBulanIni, 0);
    const totalPembayaran = filteredData.reduce((s, r) => s + r.pembayaran, 0);
    const totalSisa = filteredData.reduce((s, r) => s + r.sisaPiutang, 0);
    const belumLunasCount = filteredData.filter(r => r.sisaPiutang > 0).length;
    const lunasCount = filteredData.filter(r => r.status === 'Lunas').length;

    return {
      totalPiutangSdBulanIni,
      totalPembayaran,
      totalSisa,
      belumLunasCount,
      lunasCount
    };
  }, [filteredData]);

  // =========================================================================
  // HANDLER: TAMBAH REKANAN PERUSAHAAN / ASURANSI BARU
  // =========================================================================
  const handleOpenAddPartner = () => {
    setPartnerNama('');
    setPartnerKategori('Asuransi Swasta');
    setPartnerLayanan('Rawat Jalan');
    setPartnerPic('');
    setPartnerTelepon('');
    setPartnerKeterangan('');
    setApplyToAllMonths(true);
    setIsAddPartnerOpen(true);
  };

  const handleSaveNewPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerNama.trim()) {
      alert('Harap masukkan nama perusahaan atau asuransi rekanan.');
      return;
    }

    const trimmedNama = partnerNama.trim();
    const existing = masterPartners.find(p => p.namaPerusahaan.toLowerCase() === trimmedNama.toLowerCase());
    if (existing) {
      alert(`Perusahaan / Asuransi "${trimmedNama}" sudah terdaftar dalam daftar rekanan.`);
      return;
    }

    const newPartnerInfo: MasterPartnerInfo = {
      namaPerusahaan: trimmedNama,
      kategori: partnerKategori,
      jenisPengobatan: partnerLayanan,
      kontakPic: partnerPic.trim(),
      telepon: partnerTelepon.trim(),
      keterangan: partnerKeterangan.trim()
    };

    const updatedMasters = [newPartnerInfo, ...masterPartners];
    saveMasterPartners(updatedMasters);

    // Add rows to dataList for all months or selected month
    const targetMonths = applyToAllMonths 
      ? MONTH_NAMES_UPPER 
      : [selectedBulan === 'Semua Bulan' ? 'AGUSTUS' : selectedBulan.toUpperCase()];

    const newRowsToAdd: PerusahaanAsuransiRow[] = [];
    const code = getCompanyCode(trimmedNama);

    targetMonths.forEach(m => {
      const mm = MONTH_NUMBER_MAP[m] || '08';
      const rowNo = dataList.filter(r => r.bulan.toUpperCase() === m).length + 1;
      const initialInvoice: InvoicePerusahaan = {
        id: `inv-${code}-${mm}-00`,
        noInvoice: `INV/2026/${mm}/${code}-001`,
        tanggalInvoice: `01/${mm}/2026`,
        tanggalJatuhTempo: `01/${String(Math.min(12, Number(mm) + 1)).padStart(2, '0')}/2026`,
        nominalTagihan: 0,
        pembayaran: 0,
        sisaPiutang: 0,
        status: 'Lunas',
        jenisPengobatan: partnerLayanan,
        keterangan: 'Rekanan baru terdaftar / Siap entri invoice'
      };

      const newRow: PerusahaanAsuransiRow = {
        bulan: m,
        no: rowNo,
        namaPerusahaan: trimmedNama,
        jenisPengobatan: partnerLayanan,
        tanggalPengajuan: '-',
        tanggalJatuhTempo: '-',
        piutangLalu: 0,
        piutangBulanIni: 0,
        piutangSdBulanIni: 0,
        pajakPph23: 0,
        tanggalPembayaran: '-',
        pembayaran: 0,
        sisaPiutang: 0,
        status: 'Lunas',
        keterangan: partnerKeterangan || `Rekanan Baru: ${partnerKategori}`,
        invoices: [initialInvoice]
      };
      newRowsToAdd.push(newRow);
    });

    const updatedDataList = [...dataList, ...newRowsToAdd];
    saveData(updatedDataList);
    setIsAddPartnerOpen(false);

    if (onShowToast) {
      onShowToast(`Mitra Rekanan "${trimmedNama}" (${partnerKategori}) berhasil ditambahkan ke ${applyToAllMonths ? 'seluruh 12 bulan' : selectedBulan}!`, 'success');
    }
  };

  // =========================================================================
  // HANDLER: ENTRI TAGIHAN INVOICE BARU (DENGAN PILIHAN REKANAN LENGKAP)
  // =========================================================================
  const handleOpenAddInvoice = (companyName?: string, jenis?: string, bulan?: string) => {
    const targetBulan = bulan || (selectedBulan !== 'Semua Bulan' ? selectedBulan : 'Agustus');
    const comp = companyName || masterPartners[0]?.namaPerusahaan || 'Admedika - BANK BRI';
    
    // Find service type from master list if available
    const partnerInfo = masterPartners.find(p => p.namaPerusahaan.toLowerCase() === comp.toLowerCase());
    const targetJenis = jenis || (partnerInfo ? partnerInfo.jenisPengobatan : 'Rawat Inap');

    setNewNamaPerusahaan(comp);
    setNewBulanTagihan(targetBulan);
    setNewJenisPengobatan(targetJenis);
    setNewNoInvoice(generateInvoiceNumberForCompany(comp, targetBulan));

    const today = new Date().toISOString().split('T')[0];
    setNewTglInvoice(today);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setNewTglJatuhTempo(d.toISOString().split('T')[0]);
    setNewNominalTagihan('');
    setIsAddInvoiceOpen(true);
    setOpenDropdownKey(null);
  };

  // When user changes company in the invoice creation modal
  const handleSelectCompanyInInvoiceModal = (compName: string) => {
    setNewNamaPerusahaan(compName);
    const foundMaster = masterPartners.find(p => p.namaPerusahaan.toLowerCase() === compName.toLowerCase());
    if (foundMaster) {
      setNewJenisPengobatan(foundMaster.jenisPengobatan);
    }
    setNewNoInvoice(generateInvoiceNumberForCompany(compName, newBulanTagihan));
  };

  const handleSelectMonthInInvoiceModal = (monthName: string) => {
    setNewBulanTagihan(monthName);
    setNewNoInvoice(generateInvoiceNumberForCompany(newNamaPerusahaan, monthName));
  };

  const handleSaveNewInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoInvoice.trim() || !newNominalTagihan) {
      alert('Harap isi Nomor Invoice dan Nominal Tagihan.');
      return;
    }

    setIsUploadingInvoice(true);
    let uploadedUrl = '';
    try {
      if (newDocumentFile) {
        const fileRef = ref(storage, `perusahaan_invoices/${auth.currentUser?.uid}/${Date.now()}_${newDocumentFile.name}`);
        await uploadBytes(fileRef, newDocumentFile);
        uploadedUrl = await getDownloadURL(fileRef);
      }
    } catch (err) {
      console.error('Error uploading invoice:', err);
      alert('Gagal mengupload dokumen invoice.');
      setIsUploadingInvoice(false);
      return;
    }

    const tagihan = Number(newNominalTagihan) || 0;
    const invNumber = newNoInvoice.trim();
    const upperMonth = newBulanTagihan.toUpperCase();

    // Check if company row already exists for that month
    const existingIndex = dataList.findIndex(r => 
      r.namaPerusahaan.toLowerCase() === newNamaPerusahaan.trim().toLowerCase() &&
      r.bulan.toUpperCase() === upperMonth
    );

    const initialEffStatus = getEffectiveInvoiceStatus({
      nominalTagihan: tagihan,
      pembayaran: 0,
      sisaPiutang: tagihan,
      tanggalJatuhTempo: newTglJatuhTempo,
      tanggalInvoice: newTglInvoice
    });

    const newInvoiceItem: InvoicePerusahaan = {
      id: `inv-${Date.now()}`,
      noInvoice: invNumber,
      tanggalInvoice: newTglInvoice,
      tanggalJatuhTempo: newTglJatuhTempo,
      nominalTagihan: tagihan,
      pembayaran: 0,
      sisaPiutang: tagihan,
      status: initialEffStatus.label as any,
      jenisPengobatan: newJenisPengobatan,
      keterangan: `Tagihan masuk ${newTglInvoice}`,
      documentUrl: uploadedUrl || undefined
    };

    let updated: PerusahaanAsuransiRow[];

    if (existingIndex >= 0) {
      const existing = dataList[existingIndex];
      const prevInvoices = existing.invoices && existing.invoices.length > 0 
        ? existing.invoices.filter(inv => inv.nominalTagihan > 0 || inv.sisaPiutang > 0)
        : [];
      
      const newInvoices = [newInvoiceItem, ...prevInvoices];
      const newPiutangBulanIni = existing.piutangBulanIni + tagihan;
      const newPiutangSdBulanIni = existing.piutangSdBulanIni + tagihan;
      const newSisa = existing.sisaPiutang + tagihan;

      const updatedRow: PerusahaanAsuransiRow = {
        ...existing,
        tanggalPengajuan: newTglInvoice,
        tanggalJatuhTempo: newTglJatuhTempo,
        piutangBulanIni: newPiutangBulanIni,
        piutangSdBulanIni: newPiutangSdBulanIni,
        sisaPiutang: newSisa,
        status: 'Belum Jatuh Tempo',
        keterangan: `Invoice terbaru ${invNumber} (${formatRupiah(tagihan)})`,
        invoices: newInvoices
      };

      updated = [...dataList];
      updated[existingIndex] = updatedRow;
    } else {
      const monthRows = dataList.filter(r => r.bulan.toUpperCase() === upperMonth);
      const nextNo = monthRows.length + 1;
      const newRow: PerusahaanAsuransiRow = {
        bulan: newBulanTagihan,
        no: nextNo,
        namaPerusahaan: newNamaPerusahaan.trim(),
        jenisPengobatan: newJenisPengobatan,
        tanggalPengajuan: newTglInvoice,
        tanggalJatuhTempo: newTglJatuhTempo,
        piutangLalu: 0,
        piutangBulanIni: tagihan,
        piutangSdBulanIni: tagihan,
        pajakPph23: 0,
        tanggalPembayaran: '-',
        pembayaran: 0,
        sisaPiutang: tagihan,
        status: 'Belum Jatuh Tempo',
        keterangan: `Invoice ${invNumber} per ${newTglInvoice}`,
        invoices: [newInvoiceItem]
      };
      updated = [newRow, ...dataList];
    }

    saveData(updated);
    setIsAddInvoiceOpen(false);
    
    // Clear all new invoice form states
    setNewNoInvoice('');
    setNewTglInvoice('');
    setNewTglJatuhTempo('');
    setNewNominalTagihan('');
    setNewDocumentFile(null);
    setNewDocumentUrl('');
    
    if (onShowToast) {
      onShowToast(`Nomor invoice ${invNumber} (${newNamaPerusahaan}) sebesar ${formatRupiah(tagihan)} berhasil disimpan ke bulan ${newBulanTagihan}!`, 'success');
    }
  };

  // =========================================================================
  // HANDLER: EDIT INVOICE
  // =========================================================================
  const handleOpenEditInvoice = (row: PerusahaanAsuransiRow, inv: InvoicePerusahaan, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRow(row);
    setEditingInvoice(inv);
    setEditNoInvoice(inv.noInvoice);
    setEditTglInvoice(inv.tanggalInvoice || row.tanggalPengajuan || '');
    setEditTglJatuhTempo(inv.tanggalJatuhTempo || row.tanggalJatuhTempo || '');
    setEditNominalTagihan(inv.nominalTagihan || 0);
    setEditPembayaran(inv.pembayaran || 0);
    setEditJenisPengobatan(inv.jenisPengobatan || row.jenisPengobatan || 'Rawat Inap');
    setEditStatus(inv.status || 'Belum Jatuh Tempo');
    setEditKeterangan(inv.keterangan || '');
    setIsEditInvoiceOpen(true);
    setOpenDropdownKey(null);
  };

  const handleSaveEditInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow || !editingInvoice || !editNoInvoice.trim()) {
      alert('Harap masukkan nomor invoice.');
      return;
    }

    const nominalNum = Number(editNominalTagihan) || 0;
    const bayarNum = Number(editPembayaran) || 0;
    const sisaNum = Math.max(0, nominalNum - bayarNum);
    const effStatus = getEffectiveInvoiceStatus(
      { nominalTagihan: nominalNum, pembayaran: bayarNum, sisaPiutang: sisaNum, tanggalJatuhTempo: editTglJatuhTempo, tanggalInvoice: editTglInvoice, status: editStatus },
      editingRow.tanggalPengajuan,
      editingRow.tanggalJatuhTempo
    );
    const autoStatus: InvoicePerusahaan['status'] = sisaNum === 0 && nominalNum > 0 ? 'Lunas' : (effStatus.label as any);

    const updated = dataList.map(r => {
      if (r.no === editingRow.no && 
          r.namaPerusahaan === editingRow.namaPerusahaan && 
          r.bulan.toUpperCase() === editingRow.bulan.toUpperCase()) {
        
        const currentInvoices = getRowInvoices(r);

        const updatedInvoices = currentInvoices.map(inv => {
          if (inv.id === editingInvoice.id || inv.noInvoice === editingInvoice.noInvoice) {
            return {
              ...inv,
              noInvoice: editNoInvoice.trim(),
              tanggalInvoice: editTglInvoice,
              tanggalJatuhTempo: editTglJatuhTempo,
              nominalTagihan: nominalNum,
              pembayaran: bayarNum,
              sisaPiutang: sisaNum,
              status: autoStatus,
              jenisPengobatan: editJenisPengobatan,
              keterangan: editKeterangan.trim()
            };
          }
          return inv;
        });

        // Recalculate row aggregations
        const totalNominal = updatedInvoices.reduce((acc, curr) => acc + (curr.nominalTagihan || 0), 0);
        const totalBayar = updatedInvoices.reduce((acc, curr) => acc + (curr.pembayaran || 0), 0);
        const totalSisa = Math.max(0, (r.piutangLalu + totalNominal) - totalBayar);
        
        const candidateRow: PerusahaanAsuransiRow = {
          ...r,
          tanggalPengajuan: editTglInvoice || r.tanggalPengajuan,
          tanggalJatuhTempo: editTglJatuhTempo || r.tanggalJatuhTempo,
          piutangBulanIni: totalNominal,
          piutangSdBulanIni: r.piutangLalu + totalNominal,
          pembayaran: totalBayar,
          sisaPiutang: totalSisa,
          invoices: updatedInvoices
        };
        const rowStatus = getEffectiveRowStatus(candidateRow).label as any;

        return {
          ...candidateRow,
          status: rowStatus
        };
      }
      return r;
    });

    saveData(updated);
    setIsEditInvoiceOpen(false);
    if (onShowToast) {
      onShowToast(`Invoice ${editNoInvoice} (${editingRow.namaPerusahaan}) berhasil diperbarui!`, 'success');
    }
  };

  // =========================================================================
  // HANDLER: HAPUS INVOICE
  // =========================================================================
  const handleOpenDeleteInvoice = (row: PerusahaanAsuransiRow, inv: InvoicePerusahaan, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingRow(row);
    setDeletingInvoice(inv);
    setIsDeleteInvoiceOpen(true);
    setOpenDropdownKey(null);
  };

  const handleConfirmDeleteInvoice = () => {
    if (!deletingRow || !deletingInvoice) return;

    const targetNoInv = deletingInvoice.noInvoice;
    const compName = deletingRow.namaPerusahaan;

    const updated = dataList.map(r => {
      if (r.no === deletingRow.no && 
          r.namaPerusahaan === deletingRow.namaPerusahaan && 
          r.bulan.toUpperCase() === deletingRow.bulan.toUpperCase()) {
        
        const currentInvoices = getRowInvoices(r);

        const filteredInvoices = currentInvoices.filter(inv => 
          inv.id !== deletingInvoice.id && inv.noInvoice !== deletingInvoice.noInvoice
        );

        // Recalculate row aggregations
        const totalNominal = filteredInvoices.reduce((acc, curr) => acc + (curr.nominalTagihan || 0), 0);
        const totalBayar = filteredInvoices.reduce((acc, curr) => acc + (curr.pembayaran || 0), 0);
        const totalSisa = Math.max(0, (r.piutangLalu + totalNominal) - totalBayar);
        const rowStatus: PerusahaanAsuransiRow['status'] = totalSisa === 0 && totalNominal > 0 ? 'Lunas' : 'Belum Jatuh Tempo';

        return {
          ...r,
          piutangBulanIni: totalNominal,
          piutangSdBulanIni: r.piutangLalu + totalNominal,
          pembayaran: totalBayar,
          sisaPiutang: totalSisa,
          status: rowStatus,
          invoices: filteredInvoices
        };
      }
      return r;
    });

    saveData(updated);
    setIsDeleteInvoiceOpen(false);
    if (onShowToast) {
      onShowToast(`Invoice ${targetNoInv} (${compName}) berhasil dihapus!`, 'success');
    }
  };

  // =========================================================================
  // HANDLER: INPUT PEMBAYARAN INVOICE & PEMBAYARAN MANUAL
  // =========================================================================
  const handleOpenPayment = (
    row?: PerusahaanAsuransiRow, 
    specificInvoice?: InvoicePerusahaan, 
    defaultMode?: 'invoice' | 'manual'
  ) => {
    const target = row || filteredData.find(r => r.sisaPiutang > 0) || dataList[0];
    setSelectedInvoiceForPay(target || null);
    setSelectedSpecificInvoice(specificInvoice || null);

    const initialMode = defaultMode || (specificInvoice ? 'invoice' : 'manual');
    setPayMode(initialMode);
    setManualPayType('tambah');
    setPayKeterangan('');

    if (specificInvoice) {
      setPayAmount(specificInvoice.sisaPiutang > 0 ? specificInvoice.sisaPiutang : specificInvoice.nominalTagihan);
      setPayBukti(`TRF-BJB-${Math.floor(100000 + Math.random() * 900000)}`);
    } else if (target) {
      setPayAmount(target.sisaPiutang > 0 ? target.sisaPiutang : target.piutangSdBulanIni);
      setPayBukti(`TRF-BJB-${Math.floor(100000 + Math.random() * 900000)}`);
    } else {
      setPayAmount('');
      setPayBukti('');
    }

    setPayDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
    setOpenDropdownKey(null);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;

    const nominalInput = typeof payAmount === 'number' ? payAmount : 0;
    const isManualMode = payMode === 'manual';
    const isSetTotal = isManualMode && manualPayType === 'set_total';

    const updated = dataList.map(r => {
      if (r.no === selectedInvoiceForPay.no && 
          r.namaPerusahaan === selectedInvoiceForPay.namaPerusahaan && 
          r.bulan.toUpperCase() === selectedInvoiceForPay.bulan.toUpperCase()) {
        
        let totalBayarSekarang = isSetTotal ? nominalInput : (r.pembayaran || 0) + nominalInput;
        if (totalBayarSekarang < 0) totalBayarSekarang = 0;

        const newSisa = Math.max(0, r.piutangSdBulanIni - totalBayarSekarang);
        const autoStatus: PerusahaanAsuransiRow['status'] = newSisa === 0 ? 'Lunas' : 'Belum Jatuh Tempo';
        const formattedDate = payDate ? payDate.split('-').reverse().join('/') : new Date().toLocaleDateString('en-GB');

        // Invoice updates if applicable:
        // PENTING: Pembayaran manual TIDAK MENGUBAH / MENGGANGGU rincian invoice sama sekali.
        // Invoice hanya berubah status & pembayarannya jika dibayar secara spesifik pada mode "Sesuai Invoice".
        let updatedInvoices = getRowInvoices(r);
        if (!isManualMode && selectedSpecificInvoice) {
          // Specific invoice payment
          updatedInvoices = updatedInvoices.map(inv => {
            if (inv.noInvoice === selectedSpecificInvoice.noInvoice || inv.id === selectedSpecificInvoice.id) {
              const invBayar = (inv.pembayaran || 0) + nominalInput;
              const invSisa = Math.max(0, inv.nominalTagihan - invBayar);
              return {
                ...inv,
                pembayaran: invBayar,
                sisaPiutang: invSisa,
                status: invSisa === 0 && inv.nominalTagihan > 0 ? 'Lunas' : (invBayar > 0 ? 'Sebagian' : inv.status)
              };
            }
            return inv;
          });
        }

        // Generate memo / note
        let note = r.keterangan || '';
        const prefix = isManualMode ? '[Bayar Manual/Non-Invoice]' : '[Bayar Invoice]';
        const detailNote = payKeterangan ? ` - ${payKeterangan}` : '';
        const buktiNote = payBukti ? ` (Ref: ${payBukti})` : '';
        const dateNote = payDate ? ` tgl ${payDate}` : '';
        const newNote = `${prefix} ${formatRupiah(nominalInput)}${detailNote}${buktiNote}${dateNote}`;
        
        note = note ? `${newNote}; ${note}` : newNote;

        return {
          ...r,
          pembayaran: totalBayarSekarang,
          sisaPiutang: newSisa,
          status: autoStatus,
          tanggalPembayaran: formattedDate,
          keterangan: note,
          invoices: updatedInvoices
        };
      }
      return r;
    });

    saveData(updated);
    setIsPaymentModalOpen(false);
    if (onShowToast) {
      onShowToast(`Pembayaran ${isManualMode ? 'manual' : 'invoice'} mitra "${selectedInvoiceForPay.namaPerusahaan}" (${selectedInvoiceForPay.bulan}) sebesar ${formatRupiah(nominalInput)} berhasil disimpan & di-roll forward!`, 'success');
    }
  };

  const handleOpenSuratInvoice = (row: PerusahaanAsuransiRow, specificInvoice?: InvoicePerusahaan) => {
    setSuratRow(row);
    setSuratInvoiceDetail(specificInvoice || (row.invoices && row.invoices[0]) || null);
    setOpenDropdownKey(null);
  };

  const handleResetToEmptyAllMonths = () => {
    if (window.confirm('Kosongkan semua data sample tagihan di seluruh bulan (Januari s.d. Desember)? Semua saldo piutang & invoice sample akan direset menjadi Rp 0 (Lunas).')) {
      const fresh = generateAllMonthsPerusahaanData();
      setDataList(fresh);
      try {
        localStorage.setItem('rsud_perusahaan_asuransi_2026', JSON.stringify(fresh));
      } catch (e) {}
      
      // Reset form states
      setNewTglInvoice('');
      setNewTglJatuhTempo('');
      setNewNoInvoice('');
      setNewNominalTagihan('');
      setNewDocumentFile(null);
      setNewDocumentUrl('');
      
      if (onShowToast) {
        onShowToast('Semua sample tagihan (Januari - Desember) berhasil dikosongkan!', 'success');
      }
    }
  };

  const handleExportExcel = () => {
    const headers = [
      'Bulan',
      'No',
      'Nama Perusahaan',
      'Nomor Invoice',
      'Jenis Pengobatan',
      'Tanggal Pengajuan',
      'Tanggal Jatuh Tempo',
      'Piutang Lalu (Rp)',
      'Piutang Bulan Ini (Rp)',
      'Piutang s.d Bulan Ini (Rp)',
      'Pajak PPH23 (Rp)',
      'Tanggal Pembayaran',
      'Pembayaran (Rp)',
      'Sisa Piutang (Rp)',
      'Status',
      'Keterangan'
    ];

    const rows = filteredData.map(r => {
      const invList = r.invoices && r.invoices.length > 0 
        ? r.invoices.map(i => i.noInvoice).join('; ')
        : '-';

      return [
        r.bulan,
        r.no,
        r.namaPerusahaan,
        invList,
        r.jenisPengobatan,
        r.tanggalPengajuan,
        r.tanggalJatuhTempo,
        r.piutangLalu,
        r.piutangBulanIni,
        r.piutangSdBulanIni,
        r.pajakPph23,
        r.tanggalPembayaran,
        r.pembayaran,
        r.sisaPiutang,
        r.status,
        r.keterangan || '-'
      ];
    });

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Piutang Perusahaan");
    XLSX.writeFile(wb, `Daftar_Piutang_Perusahaan_Asuransi_${selectedBulan}_2026.xlsx`);

    if (onShowToast) {
      onShowToast(`Data piutang perusahaan & invoice bulan ${selectedBulan} berhasil diekspor ke Excel (.xlsx)!`, 'success');
    }
  };

  return (
    <div className="space-y-4 pb-12" ref={dropdownRef}>
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-teal-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-semibold mb-2">
              <Building className="w-3.5 h-3.5" />
              <span>Sheet: Perusahaan_Asuransi (Januari - Desember 2026)</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Daftar Piutang Perusahaan & Asuransi 2026</span>
            </h1>
            <p className="text-xs text-teal-100/80 mt-1 max-w-3xl">
              Memantau <strong>{masterPartners.length} mitra korporasi & asuransi</strong> di <strong>semua 12 bulan (Januari s.d. Desember)</strong>. Dilengkapi fitur <strong>Pendaftaran Rekanan Baru</strong>, <strong>Pilihan Daftar Rekanan saat Entri Invoice</strong>, dan <strong>Drop Down Nomor Invoice Masuk</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Upload Spreadsheet Quick Action */}
            {onOpenUploadModal && isPicPiutangOrAdmin && (
              <button
                onClick={onOpenUploadModal}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-emerald-500/40"
                title="Upload file spreadsheet untuk memperbarui data piutang perusahaan & asuransi"
              >
                <UploadCloud className="w-4 h-4 text-emerald-300" />
                <span>Upload Spreadsheet</span>
              </button>
            )}

            {/* Primary Action 1: Tambah Rekanan Baru */}
            {isPicPiutangOrAdmin && (
              <button
                onClick={handleOpenAddPartner}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-teal-400/30"
                title="Daftarkan mitra perusahaan atau asuransi baru ke direktori RSUD"
              >
                <UserPlus className="w-4 h-4" />
                <span>🏢 + Rekanan Baru</span>
              </button>
            )}

            {/* Primary Action 2: Entri Tagihan Baru */}
            {isPicPiutangOrAdmin && (
              <button
                onClick={() => handleOpenAddInvoice()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-emerald-400/30"
                title="Entri tagihan invoice baru dengan memilih mitra dari daftar"
              >
                <Plus className="w-4 h-4" />
                <span>📝 + Entri Tagihan</span>
              </button>
            )}

            {/* Primary Action 3: Input Pembayaran Invoice */}
            {isPicPiutangOrAdmin && (
              <button
                onClick={() => handleOpenPayment()}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-amber-400/30"
                title="Input pembayaran pelunasan tagihan invoice"
              >
                <CreditCard className="w-4 h-4" />
                <span>💸 Bayar Invoice</span>
              </button>
            )}

            {userRole === 'admin' && (
              <button
                onClick={handleResetToEmptyAllMonths}
                className="px-3 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-700/50"
                title="Kosongkan seluruh data tagihan contoh di semua bulan (Jan - Des)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset 1 Tahun</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-600"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Responsive for selected month) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#0d1216] rounded-xl p-4 border border-slate-200 dark:border-emerald-950/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
            Total Piutang ({selectedBulan})
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
            {formatRupiah(metrics.totalPiutangSdBulanIni)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">{filteredData.length} baris mitra ditampilkan</div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-xl p-4 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Total Pembayaran Cair</div>
          <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono mt-1">
            {formatRupiah(metrics.totalPembayaran)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">{metrics.lunasCount} Instansi Lunas ({selectedBulan})</div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-xl p-4 border border-rose-200 dark:border-rose-950/60 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase">Total Sisa Piutang</div>
          <div className="text-xl font-extrabold text-rose-700 dark:text-rose-400 font-mono mt-1">
            {formatRupiah(metrics.totalSisa)}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400/80 mt-1">{metrics.belumLunasCount} Perlu Ditagih</div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-xl p-4 border border-teal-200 dark:border-teal-900/60 shadow-2xs">
          <div className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase">Direktori Rekanan RSUD</div>
          <div className="text-xl font-extrabold text-teal-800 dark:text-teal-300 font-mono mt-1">
            {masterPartners.length} Rekanan
          </div>
          <div className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">Aktif di Seluruh 12 Bulan</div>
        </div>
      </div>

      {/* 3. Filter Bar with Dedicated MONTH SELECTOR & Kategori Filter */}
      <div className="bg-white dark:bg-[#0d1216] rounded-xl border border-slate-200 dark:border-emerald-950/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* SEARCH */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari perusahaan / No Invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* OPSI PILIH BULAN */}
          <div className="flex items-center gap-1.5 bg-emerald-50/90 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
            <Calendar className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />
            <span className="text-xs text-emerald-950 dark:text-emerald-300 font-bold">Bulan:</span>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="bg-white dark:bg-[#12181f] rounded-md border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 text-xs text-emerald-900 dark:text-emerald-300 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {BULAN_OPTIONS.map((b, idx) => (
                <option key={`pa-filter-bulan-${b}-${idx}`} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* KATEGORI REKANAN FILTER */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Kategori:</span>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] px-2.5 py-1.5 text-xs text-slate-700 dark:text-zinc-300 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Semua">Semua Kategori</option>
              {KATEGORI_OPTIONS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* STATUS FILTER */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] px-2.5 py-1.5 text-xs text-slate-700 dark:text-zinc-300 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Jatuh Tempo">Jatuh Tempo</option>
              <option value="Belum Jatuh Tempo">Belum Jatuh Tempo</option>
              <option value="Belum Ada Tgl JT">Belum Ada Tgl JT</option>
              <option value="Saldo Negatif/Koreksi">Saldo Negatif/Koreksi</option>
            </select>
          </div>

          {/* LAYANAN FILTER */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Layanan:</span>
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] px-2.5 py-1.5 text-xs text-slate-700 dark:text-zinc-300 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Semua">Semua Layanan</option>
              {LAYANAN_OPTIONS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Menampilkan <strong>{filteredData.length}</strong> dari <strong>{dataList.length}</strong> baris ({selectedBulan})
          </span>
        </div>
      </div>

      {/* 4. Complete Table with Interactive INVOICE DROPDOWN MENU for each company */}
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl border border-slate-200 dark:border-emerald-950/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto min-h-[480px] max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-emerald-950 dark:bg-[#081b22] text-white font-semibold border-b-2 border-emerald-800 dark:border-emerald-900/60 text-[11px]">
                <th className="py-3 px-2 text-center w-12 border-r border-emerald-900/60">No</th>
                <th className="py-3 px-3.5 min-w-[290px] max-w-[350px] border-r border-emerald-900/60">Nama Perusahaan / Asuransi & No. Invoice</th>
                <th className="py-3 px-3 border-r border-emerald-900/60">Jenis Layanan</th>
                <th className="py-3 px-3 text-right border-r border-emerald-900/60">Piutang Lalu</th>
                <th className="py-3 px-3 text-right border-r border-emerald-900/60">Piutang Bulan Ini</th>
                <th className="py-3 px-3 text-right font-bold border-r border-teal-800 bg-teal-950 text-teal-100">Piutang s.d Bulan Ini</th>
                <th className="py-3 px-3 border-r border-emerald-900/60">Tgl Bayar</th>
                <th className="py-3 px-3 text-right border-r border-emerald-900/60">Pembayaran</th>
                <th className="py-3 px-3 text-right font-bold border-r border-rose-900 bg-rose-950 text-rose-100">Sisa Piutang</th>
                <th className="py-3 px-2 text-center sticky right-0 bg-emerald-950 dark:bg-[#081b22] z-10">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                    Tidak ada data piutang untuk filter bulan <strong>{selectedBulan}</strong>.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const rowKey = `${row.no}-${row.namaPerusahaan}-${row.bulan}`;
                  const isLunas = row.status === 'Lunas';
                  const isNegative = row.status === 'Saldo Negatif/Koreksi';
                  const hasSisa = row.sisaPiutang > 0;
                  const isExpanded = expandedRowKeys.has(rowKey);
                  const invoices = getRowInvoices(row);
                  const hasInvoices = invoices.length > 0;
                  const isMultipleInvoices = invoices.length > 1;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={rowKey}
                      className={`border-b-2 border-slate-300/80 dark:border-zinc-800/80 transition-colors ${
                        isExpanded 
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30' 
                          : isEven 
                          ? 'bg-white dark:bg-[#0d1216] hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20' 
                          : 'bg-slate-50/75 dark:bg-[#12181f]/80 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20'
                      }`}
                    >


                      {/* 2. NO */}
                      <td className="py-3 px-2 text-center text-slate-500 dark:text-zinc-400 font-mono font-medium align-top bg-slate-100/60 dark:bg-zinc-900/60 border-r border-slate-200/80 dark:border-zinc-800/80">
                        {row.no}
                      </td>

                      {/* 3. NAMA PERUSAHAAN & INVOICE */}
                      <td className="py-3 px-3.5 align-top min-w-[290px] max-w-[350px] border-r border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#0d1216]">
                        <div className="flex items-start justify-between gap-2 group/header">
                          <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                            {row.namaPerusahaan}
                          </div>
                          {/* Tombol "+" Pojok Kanan Atas Perusahaan untuk Memudahkan PIC Piutang Membuat Invoice Baru */}
                          <button
                            type="button"
                            onClick={() => handleOpenAddInvoice(row.namaPerusahaan, row.jenisPengobatan, row.bulan)}
                            className="p-1 rounded-md text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border border-emerald-200/90 dark:border-emerald-800/80 hover:border-emerald-300 transition-all shadow-2xs hover:scale-105 shrink-0 flex items-center justify-center cursor-pointer"
                            title={`Buat Invoice Baru untuk ${row.namaPerusahaan}`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        {/* LOGIKA TAMPILAN INVOICE: */}
                        {/* CASE A: BELUM ADA INVOICE (ATAU SEMUA INVOICE TELAH DIHAPUS) */}
                        {!hasInvoices ? (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500 italic">
                            <span>Belum ada invoice</span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleOpenAddInvoice(row.namaPerusahaan, row.jenisPengobatan, row.bulan)}
                              className="text-[10px] font-semibold not-italic text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                              title={`Buat invoice untuk ${row.namaPerusahaan}`}
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                              Buat Invoice
                            </button>
                          </div>
                        ) : invoices.length === 1 ? (
                          /* CASE B: TEPAT 1 INVOICE -> TAMPILKAN LANGSUNG KARTU INVOICE TUNGGAL */
                          <div className="mt-1.5">
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#12181f] border border-slate-200/90 dark:border-zinc-800 text-[11px] space-y-1 shadow-2xs">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1 font-mono font-bold text-emerald-950 dark:text-emerald-300 truncate">
                                  <Receipt className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                  <span className="truncate">{invoices[0].noInvoice}</span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyInvoice(invoices[0].noInvoice, e)}
                                    className="p-1 rounded text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition"
                                    title="Salin Nomor Invoice"
                                  >
                                    {copiedInvoiceNo === invoices[0].noInvoice ? (
                                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  {canModifyRecord(invoices[0]) && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditInvoice(row, invoices[0], e)}
                                    className="p-1 rounded text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 transition"
                                    title="Edit Data Invoice"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                )}
                                  {canModifyRecord(invoices[0]) && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenDeleteInvoice(row, invoices[0], e)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                                    title="Hapus Invoice"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                                </div>
                              </div>

                              {/* DETAIL INVOICE VERTIKAL */}
                              <div className="space-y-0.5 pt-1 border-t border-slate-200/80 dark:border-zinc-800 text-[10px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 dark:text-zinc-400">Tgl Pengajuan:</span>
                                  <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">
                                    {formatDateDDMMYYYY(invoices[0].tanggalInvoice || row.tanggalPengajuan || '-')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 dark:text-zinc-400">Tgl Jatuh Tempo:</span>
                                  <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">
                                    {formatDateDDMMYYYY(invoices[0].tanggalJatuhTempo || row.tanggalJatuhTempo || '-')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 dark:text-zinc-400">Nominal:</span>
                                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-300">
                                    {formatRupiah(invoices[0].nominalTagihan || row.piutangSdBulanIni || 0)}
                                  </span>
                                </div>
                                {invoices[0].documentUrl && (
                                  <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-zinc-800">
                                    <span className="text-slate-500 dark:text-zinc-400">Dokumen:</span>
                                    <a
                                      href={invoices[0].documentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-bold text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
                                    >
                                      <FileText className="w-3 h-3" />
                                      Lihat Lampiran
                                    </a>
                                  </div>
                                )}
                                <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-zinc-800 mt-1">
                                  <span className="text-slate-500 dark:text-zinc-400">Umur Piutang:</span>
                                  <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">
                                    {(() => {
                                      const u = calculateUmurPiutang(invoices[0].tanggalInvoice || row.tanggalPengajuan);
                                      return u !== null ? `${u} Hari` : '-';
                                    })()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 dark:text-zinc-400">Status:</span>
                                  {(() => {
                                    const effectiveStatus = getEffectiveInvoiceStatus(invoices[0], row.tanggalPengajuan, row.tanggalJatuhTempo);
                                    return (
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${effectiveStatus.badgeClass}`}>
                                        {effectiveStatus.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* CASE C: LEBIH DARI 1 INVOICE -> SEDIAKAN TOMBOL BUKA/TUTUP YANG BENAR-BENAR MENYEMBUNYIKAN/MENAMPILKAN */
                          <div className="mt-1.5 space-y-1.5">
                            <button
                              type="button"
                              onClick={() => toggleRowAccordion(rowKey)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition shadow-2xs ${
                                isExpanded 
                                  ? 'bg-emerald-800 dark:bg-emerald-900 text-white border-emerald-900 hover:bg-emerald-900 ring-2 ring-emerald-300 dark:ring-emerald-700' 
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:border-emerald-300'
                              }`}
                              title={isExpanded ? 'Tutup rincian invoice' : `Buka dan lihat ${invoices.length} nomor invoice`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Receipt className="w-3.5 h-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                                <span className="truncate">{isExpanded ? 'Tutup Daftar Invoice' : `Buka ${invoices.length} Invoice`}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isExpanded ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-200 font-bold'}`}>
                                  {invoices.length}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </button>

                            {/* DAFTAR INVOICE YANG HANYA TAMPIL KETIKA BUKA (isExpanded = true) */}
                            {isExpanded && (
                              <div className="space-y-1.5 pt-1">
                                {invoices.map((inv, i) => (
                                  <div 
                                    key={inv.id || i}
                                    className="p-2 rounded-lg bg-emerald-50/40 dark:bg-[#12181f] border border-emerald-200 dark:border-emerald-900/60 text-[11px] space-y-1 shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between gap-1.5">
                                      <div className="flex items-center gap-1 font-mono font-bold text-emerald-950 dark:text-emerald-300 truncate">
                                        <Receipt className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                        <span className="truncate">{inv.noInvoice}</span>
                                      </div>
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={(e) => handleCopyInvoice(inv.noInvoice, e)}
                                          className="p-1 rounded text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition"
                                          title="Salin Nomor Invoice"
                                        >
                                          {copiedInvoiceNo === inv.noInvoice ? (
                                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                        {canModifyRecord(inv) && (
                                        <button
                                          type="button"
                                          onClick={(e) => handleOpenEditInvoice(row, inv, e)}
                                          className="p-1 rounded text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 transition"
                                          title="Edit Data Invoice"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                      )}
                                        {canModifyRecord(inv) && (
                                        <button
                                          type="button"
                                          onClick={(e) => handleOpenDeleteInvoice(row, inv, e)}
                                          className="p-1 rounded text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                                          title="Hapus Invoice"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                      </div>
                                    </div>

                                    <div className="space-y-0.5 pt-1 border-t border-emerald-200/70 dark:border-zinc-800 text-[10px]">
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-zinc-400">Tgl Pengajuan:</span>
                                        <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">
                                          {formatDateDDMMYYYY(inv.tanggalInvoice || row.tanggalPengajuan || '-')}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-zinc-400">Tgl Jatuh Tempo:</span>
                                        <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">
                                          {formatDateDDMMYYYY(inv.tanggalJatuhTempo || row.tanggalJatuhTempo || '-')}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-zinc-400">Nominal:</span>
                                        <span className="font-mono font-bold text-emerald-900 dark:text-emerald-300">
                                          {formatRupiah(inv.nominalTagihan || row.piutangSdBulanIni || 0)}
                                        </span>
                                      </div>
                                      {inv.documentUrl && (
                                        <div className="flex items-center justify-between pt-0.5 border-t border-emerald-200/50 dark:border-zinc-800">
                                          <span className="text-slate-500 dark:text-zinc-400">Dokumen:</span>
                                          <a
                                            href={inv.documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
                                          >
                                            <FileText className="w-3 h-3" />
                                            Lihat Lampiran
                                          </a>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between pt-0.5 border-t border-emerald-200/50 dark:border-zinc-800 mt-1">
                                        <span className="text-slate-500 dark:text-zinc-400">Umur Piutang:</span>
                                        <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">
                                          {(() => {
                                            const u = calculateUmurPiutang(inv.tanggalInvoice || row.tanggalPengajuan);
                                            return u !== null ? `${u} Hari` : '-';
                                          })()}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-zinc-400">Status:</span>
                                        {(() => {
                                          const effectiveStatus = getEffectiveInvoiceStatus(inv, row.tanggalPengajuan, row.tanggalJatuhTempo);
                                          return (
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${effectiveStatus.badgeClass}`}>
                                              {effectiveStatus.label}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                <div className="flex items-center justify-between pt-0.5">
                                  {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddInvoice(row.namaPerusahaan, row.jenisPengobatan, row.bulan)}
                                    className="p-1 rounded text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition shrink-0"
                                    title={"Tambah Invoice Baru"}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                  <button
                                    type="button"
                                    onClick={() => toggleRowAccordion(rowKey)}
                                    className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-0.5 font-semibold"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                    <span>Tutup</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 4. JENIS PENGOBATAN */}
                      <td className="py-3 px-3 whitespace-nowrap align-top border-r border-slate-200/80 dark:border-zinc-800/80">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-medium border border-slate-200 dark:border-zinc-700">
                          {row.jenisPengobatan}
                        </span>
                      </td>

                      {/* 5. PIUTANG LALU */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-zinc-300 align-top border-r border-slate-200/80 dark:border-zinc-800/80">
                        {isPicPiutangOrAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleOpenEditPiutangLalu(row)}
                            className="group inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-zinc-300 hover:text-teal-900 dark:hover:text-teal-200 transition border border-transparent hover:border-teal-300 dark:hover:border-teal-700/60 text-right w-full justify-end cursor-pointer"
                            title="Klik untuk Edit Saldo Piutang Lalu (Otomatis update berantai ke bulan berikutnya)"
                          >
                            <span>{formatRupiah(row.piutangLalu)}</span>
                            <Edit className="w-3 h-3 opacity-30 group-hover:opacity-100 text-teal-600 dark:text-teal-400 transition shrink-0" />
                          </button>
                        ) : (
                          formatRupiah(row.piutangLalu)
                        )}
                      </td>

                      {/* 8. PIUTANG BULAN INI */}
                      <td className="py-3 px-3 text-right font-mono text-blue-900 dark:text-blue-300 font-medium align-top border-r border-slate-200/80 dark:border-zinc-800/80">
                        {formatRupiah(row.piutangBulanIni)}
                      </td>

                      {/* 9. PIUTANG S.D BULAN INI (KOLOM HIGHLIGHT KHUSUS) */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-teal-200 align-top bg-teal-50/40 dark:bg-teal-950/40 border-r border-slate-200 dark:border-zinc-800">
                        {formatRupiah(row.piutangSdBulanIni)}
                      </td>

                      {/* 10. TGL BAYAR */}
                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap font-mono text-[11px] align-top border-r border-slate-200/80 dark:border-zinc-800/80">
                        {row.tanggalPembayaran}
                      </td>

                      {/* 11. PEMBAYARAN */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400 align-top border-r border-slate-200/80 dark:border-zinc-800/80">
                        {isPicPiutangOrAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(row, undefined, 'manual')}
                            className="group inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/60 text-emerald-700 dark:text-emerald-400 hover:text-amber-800 dark:hover:text-amber-300 transition border border-transparent hover:border-amber-300 dark:hover:border-amber-700/60 text-right w-full justify-end cursor-pointer"
                            title="Klik untuk Input Pembayaran (Sesuai Invoice atau Manual Bebas)"
                          >
                            <span>{formatRupiah(row.pembayaran)}</span>
                            <CreditCard className="w-3 h-3 opacity-30 group-hover:opacity-100 text-amber-600 dark:text-amber-400 transition shrink-0" />
                          </button>
                        ) : (
                          formatRupiah(row.pembayaran)
                        )}
                      </td>

                      {/* 12. SISA PIUTANG (KOLOM HIGHLIGHT KHUSUS) */}
                      <td className={`py-3 px-3 text-right font-mono font-bold align-top border-r border-slate-200 dark:border-zinc-800 ${
                        isNegative 
                          ? 'bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' 
                          : hasSisa 
                          ? 'bg-rose-50/40 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400' 
                          : 'bg-slate-50/40 dark:bg-zinc-900/40 text-slate-500 dark:text-zinc-500'
                      }`}>
                        {formatRupiah(row.sisaPiutang)}
                      </td>

                      {/* 14. AKSI */}
                      <td className="py-3 px-2 text-center whitespace-nowrap sticky right-0 bg-white/95 dark:bg-[#0d1216]/95 backdrop-blur-xs z-10 align-top shadow-xs">
                        <div className="flex items-center justify-center gap-1">
                          {/* TOMBOL EDIT PIUTANG LALU */}
                          {isPicPiutangOrAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditPiutangLalu(row)}
                              className="p-1.5 rounded bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 transition"
                              title="Edit Saldo Piutang Lalu (Roll-Forward Berantai)"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* TOMBOL BAYAR INVOICE / MANUAL */}
                          {isPicPiutangOrAdmin && (
                            <button
                              onClick={() => handleOpenPayment(row)}
                              className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition"
                              title="Input Pembayaran (Invoice atau Manual Bebas)"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* CETAK SURAT TAGIHAN */}
                          <button
                            onClick={() => handleOpenSuratInvoice(row)}
                            className="p-1.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition"
                            title="Cetak Surat Penagihan / Invoice Resmi"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DAFTAR REKANAN BARU (TAMBAH PERUSAHAAN / ASURANSI BARU) */}
      {/* ========================================================================= */}
      {isAddPartnerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-emerald-950/80 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Tambah Rekanan / Asuransi Baru</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Daftarkan mitra korporasi / asuransi baru ke sistem RSUD</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPartnerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPartner} className="space-y-3.5 text-xs">
              
              {/* NAMA PERUSAHAAN */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Nama Perusahaan / Asuransi Rekanan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Kalbe Farma Tbk / Asuransi Sinarmas"
                    value={partnerNama}
                    onChange={(e) => setPartnerNama(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* KATEGORI & JENIS LAYANAN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Kategori Mitra <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={partnerKategori}
                    onChange={(e) => setPartnerKategori(e.target.value as MasterPartnerInfo['kategori'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {KATEGORI_OPTIONS.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Layanan Utama <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={partnerLayanan}
                    onChange={(e) => setPartnerLayanan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {LAYANAN_OPTIONS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* KONTAK PIC & NO TELEPON */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Nama PIC / Bagian Klaim
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Contoh: Ibu Rina (HRD)"
                      value={partnerPic}
                      onChange={(e) => setPartnerPic(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    No. Telepon / Hotline Klaim
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Contoh: (0267) 845xxxx / 0812xxxx"
                      value={partnerTelepon}
                      onChange={(e) => setPartnerTelepon(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* KETERANGAN TAMBAHAN */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Catatan Kemitraan / No. PKS
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Perjanjian Kerjasama Pelayanan Kesehatan Rawat Inap & MCU No. 445/PKS/2026"
                  value={partnerKeterangan}
                  onChange={(e) => setPartnerKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* OPSI TERAPKAN KE SEMUA 12 BULAN */}
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900/60 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="apply-all-months"
                  checked={applyToAllMonths}
                  onChange={(e) => setApplyToAllMonths(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <label htmlFor="apply-all-months" className="cursor-pointer text-slate-700 dark:text-zinc-300">
                  <span className="font-bold block text-teal-950 dark:text-teal-300">Terapkan ke Semua Bulan (Januari s.d. Desember 2026)</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    Mitra akan otomatis muncul di tabel setiap bulan dan tersedia saat entri tagihan baru.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddPartnerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 transition shadow-2xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Daftarkan Rekanan</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ENTRI TAGIHAN INVOICE BARU (DENGAN PILIHAN REKANAN DARI DAFTAR) */}
      {/* ========================================================================= */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-emerald-950/80 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Entri Tagihan Invoice Baru</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Pilih mitra dari daftar rekanan dan catat nomor invoice masuk</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddInvoiceOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewInvoice} className="space-y-3.5 text-xs">
              
              {/* PILIHAN DAFTAR PERUSAHAAN / ASURANSI */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-zinc-300">
                    Pilih Mitra Perusahaan / Asuransi <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddInvoiceOpen(false);
                      handleOpenAddPartner();
                    }}
                    className="text-[11px] text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Tambah Rekanan Baru</span>
                  </button>
                </div>
                
                <select
                  value={newNamaPerusahaan}
                  onChange={(e) => handleSelectCompanyInInvoiceModal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#12181f] font-bold text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {KATEGORI_OPTIONS.map(kat => {
                    const partnersInKat = masterPartners.filter(p => p.kategori === kat);
                    if (partnersInKat.length === 0) return null;
                    return (
                      <optgroup key={kat} label={`--- ${kat.toUpperCase()} ---`}>
                        {partnersInKat.map(p => (
                          <option key={p.namaPerusahaan} value={p.namaPerusahaan}>
                            {p.namaPerusahaan} ({p.jenisPengobatan})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 block">
                  Tersedia {masterPartners.length} mitra rekanan aktif dalam daftar RSUD.
                </span>
              </div>

              {/* BULAN & JENIS LAYANAN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Bulan Pencatatan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newBulanTagihan}
                    onChange={(e) => handleSelectMonthInInvoiceModal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] font-bold text-emerald-950 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {BULAN_OPTIONS.filter(b => b !== 'Semua Bulan').map((b, idx) => (
                      <option key={`pa-modal-bulan-${b}-${idx}`} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Jenis Layanan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newJenisPengobatan}
                    onChange={(e) => setNewJenisPengobatan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {LAYANAN_OPTIONS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4 DATA POKOK UTAMA */}
              
              {/* FIELD 1: NOMOR INVOICE */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  1. Nomor Invoice Tagihan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Receipt className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: INV/2026/08/SOMPO-001"
                    value={newNoInvoice}
                    onChange={(e) => setNewNoInvoice(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#12181f] font-mono font-bold text-emerald-950 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* FIELD 2: TANGGAL INVOICE */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    2. Tanggal Invoice <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newTglInvoice}
                    onChange={(e) => {
                      setNewTglInvoice(e.target.value);
                      if (e.target.value) {
                        const d = new Date(e.target.value);
                        d.setDate(d.getDate() + 30);
                        setNewTglJatuhTempo(d.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                {/* FIELD 3: TANGGAL JATUH TEMPO */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    3. Tanggal Jatuh Tempo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newTglJatuhTempo}
                    onChange={(e) => setNewTglJatuhTempo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* FIELD 4: NOMINAL TAGIHAN */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  4. Nominal Tagihan Piutang (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">Rp</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Contoh: 15000000"
                    value={newNominalTagihan}
                    onChange={(e) => setNewNominalTagihan(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#12181f] font-mono font-bold text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>
                {newNominalTagihan !== '' && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                    Format: {formatRupiah(Number(newNominalTagihan))}
                  </div>
                )}
              </div>

              {/* FIELD 5: UPLOAD DOKUMEN INVOICE */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Upload Dokumen Invoice / Tagihan (Opsional)</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 dark:text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 dark:file:bg-emerald-950/80 file:text-emerald-700 dark:file:text-emerald-300 hover:file:bg-emerald-100 border border-slate-200 dark:border-zinc-700 rounded-xl p-1 bg-white dark:bg-[#12181f]"
                  />
                </div>
                {newDocumentFile && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Berhasil memilih: {newDocumentFile.name} ({(newDocumentFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingInvoice}
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition shadow-2xs flex items-center gap-1.5 disabled:opacity-70"
                >
                  {isUploadingInvoice ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : <Check className="w-4 h-4" />}
                  <span>{isUploadingInvoice ? 'Menyimpan...' : 'Simpan Invoice Baru'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INPUT PEMBAYARAN INVOICE & PEMBAYARAN MANUAL */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-amber-950/80 space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Input Pembayaran Piutang & Klaim</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Pilih pembayaran sesuai nomor invoice atau input pembayaran manual bebas</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB OPSI: SESUAI INVOICE VS PEMBAYARAN MANUAL */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setPayMode('invoice');
                  if (selectedInvoiceForPay) {
                    const invs = getRowInvoices(selectedInvoiceForPay).filter(i => i.sisaPiutang > 0);
                    if (invs.length > 0) {
                      setSelectedSpecificInvoice(invs[0]);
                      setPayAmount(invs[0].sisaPiutang);
                    }
                  }
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                  payMode === 'invoice'
                    ? 'bg-white dark:bg-[#12181f] text-amber-900 dark:text-amber-300 shadow-xs border border-slate-200 dark:border-zinc-700'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>1. Sesuai Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPayMode('manual');
                  if (selectedInvoiceForPay) {
                    setPayAmount(selectedInvoiceForPay.sisaPiutang > 0 ? selectedInvoiceForPay.sisaPiutang : 0);
                  }
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                  payMode === 'manual'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>2. Pembayaran Manual (Bebas)</span>
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs">
              
              {/* PILIH INVOICE / PERUSAHAAN */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Pilih Rekanan Perusahaan & Bulan Tagihan
                </label>
                <select
                  value={`${selectedInvoiceForPay?.no || ''}-${selectedInvoiceForPay?.namaPerusahaan || ''}-${selectedInvoiceForPay?.bulan || ''}`}
                  onChange={(e) => {
                    const [noStr, name, bulan] = e.target.value.split('-');
                    const found = dataList.find(r => r.no === Number(noStr) && r.namaPerusahaan === name && r.bulan === bulan);
                    setSelectedInvoiceForPay(found || null);
                    setSelectedSpecificInvoice(null);
                    if (found) {
                      setPayAmount(found.sisaPiutang > 0 ? found.sisaPiutang : found.piutangSdBulanIni);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {dataList.filter(r => selectedBulan === 'Semua Bulan' || r.bulan.toUpperCase() === selectedBulan.toUpperCase()).map(r => (
                    <option key={`${r.no}-${r.namaPerusahaan}-${r.bulan}`} value={`${r.no}-${r.namaPerusahaan}-${r.bulan}`}>
                      {r.namaPerusahaan} ({r.bulan}) - Sisa: {formatRupiah(r.sisaPiutang)}
                    </option>
                  ))}
                </select>
              </div>

              {/* MODE MANUAL BANNER & OPTIONS */}
              {payMode === 'manual' ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-200 font-bold">
                    <Sliders className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>Mode Pembayaran Manual / Bebas Aktif</span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                    Digunakan untuk mencatat penerimaan kas titipan, uang muka (DP), pembayaran gelondongan rekening, atau setoran kasir dengan nominal bebas yang <strong>tidak harus sama dengan invoice yang terdaftar</strong>.
                  </p>

                  <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/60">
                    <span className="block font-bold text-slate-700 dark:text-zinc-300 mb-1.5 text-[11px]">
                      Tipe Perlakuan Pembayaran Manual:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-[11px] font-semibold ${
                        manualPayType === 'tambah'
                          ? 'bg-white dark:bg-zinc-800 border-amber-500 text-amber-950 dark:text-amber-200 shadow-2xs'
                          : 'border-amber-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                      }`}>
                        <input
                          type="radio"
                          name="manualPayType"
                          checked={manualPayType === 'tambah'}
                          onChange={() => setManualPayType('tambah')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span>(+) Tambah ke Pembayaran Berjalan</span>
                      </label>

                      <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-[11px] font-semibold ${
                        manualPayType === 'set_total'
                          ? 'bg-white dark:bg-zinc-800 border-amber-500 text-amber-950 dark:text-amber-200 shadow-2xs'
                          : 'border-amber-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                      }`}>
                        <input
                          type="radio"
                          name="manualPayType"
                          checked={manualPayType === 'set_total'}
                          onChange={() => setManualPayType('set_total')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span>(=) Tetapkan Total Pembayaran</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* MODE SESUAI INVOICE */
                selectedInvoiceForPay && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Pilih Invoice Tertagih (Belum Lunas)
                    </label>
                    {getRowInvoices(selectedInvoiceForPay).length > 0 ? (
                      <select
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        value={selectedSpecificInvoice?.id || selectedSpecificInvoice?.noInvoice || ''}
                        onChange={(e) => {
                          const targetInv = getRowInvoices(selectedInvoiceForPay).find(
                            i => i.id === e.target.value || i.noInvoice === e.target.value
                          );
                          setSelectedSpecificInvoice(targetInv || null);
                          if (targetInv) {
                            setPayAmount(targetInv.sisaPiutang > 0 ? targetInv.sisaPiutang : targetInv.nominalTagihan);
                          }
                        }}
                      >
                        {getRowInvoices(selectedInvoiceForPay).map(inv => (
                          <option key={inv.id || inv.noInvoice} value={inv.id || inv.noInvoice}>
                            {inv.noInvoice} - Tagihan: {formatRupiah(inv.nominalTagihan)} (Sisa: {formatRupiah(inv.sisaPiutang)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 text-xs italic">
                        Belum ada rincian invoice terdaftar. Gunakan tab &quot;Pembayaran Manual&quot; untuk input langsung.
                      </div>
                    )}
                  </div>
                )
              )}

              {/* INFO SALDO PERUSAHAAN SAAT INI */}
              {selectedInvoiceForPay && (
                <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-zinc-400">Total Piutang s.d Bulan Ini:</span>
                    <strong className="font-mono text-slate-900 dark:text-zinc-100">{formatRupiah(selectedInvoiceForPay.piutangSdBulanIni)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-zinc-400">Sudah Pernah Dibayar Sebelumnya:</span>
                    <strong className="font-mono text-emerald-700 dark:text-emerald-400">{formatRupiah(selectedInvoiceForPay.pembayaran)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-zinc-800 pt-1">
                    <span className="font-bold text-slate-800 dark:text-zinc-200">Sisa Piutang Berjalan:</span>
                    <strong className="font-mono text-rose-700 dark:text-rose-400 font-bold">{formatRupiah(selectedInvoiceForPay.sisaPiutang)}</strong>
                  </div>
                </div>
              )}

              {/* NOMINAL PEMBAYARAN */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1 flex justify-between items-center">
                  <span>Nominal Pembayaran (Rp) <span className="text-rose-500">*</span></span>
                  {selectedInvoiceForPay && selectedInvoiceForPay.sisaPiutang > 0 && (
                    <span className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                      Sisa: {formatRupiah(selectedInvoiceForPay.sisaPiutang)}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Masukkan nominal pembayaran..."
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-[#12181f] font-mono font-bold text-emerald-900 dark:text-emerald-300 focus:ring-2 focus:ring-amber-500 focus:outline-none text-base"
                    autoFocus
                  />
                </div>

                {/* SHORTCUT PRESETS NOMINAL */}
                {selectedInvoiceForPay && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedInvoiceForPay.sisaPiutang > 0 && (
                      <button
                        type="button"
                        onClick={() => setPayAmount(selectedInvoiceForPay.sisaPiutang)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 text-emerald-900 dark:text-emerald-300 text-[11px] font-bold transition"
                      >
                        Lunas Sisa ({formatRupiah(selectedInvoiceForPay.sisaPiutang)})
                      </button>
                    )}
                    {selectedInvoiceForPay.sisaPiutang > 0 && (
                      <button
                        type="button"
                        onClick={() => setPayAmount(Math.round(selectedInvoiceForPay.sisaPiutang / 2))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 text-[11px] font-medium transition"
                      >
                        50% ({formatRupiah(Math.round(selectedInvoiceForPay.sisaPiutang / 2))})
                      </button>
                    )}
                    {selectedInvoiceForPay.sisaPiutang > 0 && (
                      <button
                        type="button"
                        onClick={() => setPayAmount(Math.round(selectedInvoiceForPay.sisaPiutang / 4))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 text-[11px] font-medium transition"
                      >
                        25% ({formatRupiah(Math.round(selectedInvoiceForPay.sisaPiutang / 4))})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPayAmount(0)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-400 text-[11px] font-medium transition"
                    >
                      Reset Rp 0
                    </button>
                  </div>
                )}
              </div>

              {/* TANGGAL PEMBAYARAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Tanggal Pembayaran / Cair <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  />
                </div>

                {/* NOMOR REFERENSI / BUKTI */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    No. Ref Bank / Bukti Setor
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: TRF-BJB-89212 / Kasir RSUD"
                    value={payBukti}
                    onChange={(e) => setPayBukti(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* KETERANGAN KHUSUS PEMBAYARAN */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Catatan / Keterangan Pembayaran (Opsional)
                </label>
                <input
                  type="text"
                  placeholder={payMode === 'manual' ? 'Contoh: Titipan pembayaran kasir non-invoice, uang muka MCU, pelunasan sebagian' : 'Contoh: Pelunasan klaim rawat inap'}
                  value={payKeterangan}
                  onChange={(e) => setPayKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* BANNER PERLINDUNGAN INVOICE PADA MODE MANUAL */}
              {payMode === 'manual' && selectedInvoiceForPay && (
                <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-blue-950 dark:text-blue-200 block">
                      Rincian Tagihan Invoice Tetap Aman & Terjaga
                    </span>
                    <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 leading-relaxed">
                      Pembayaran manual ini dicatat pada saldo piutang perusahaan dan <strong>tidak akan mengganggu atau merubah</strong> tagihan invoice yang belum terbayar. Invoice yang telah dibuat hanya akan lunas jika dibayar sesuai nomor &amp; nominalnya melalui tab <strong>&quot;1. Sesuai Invoice&quot;</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* SIMULASI PERHITUNGAN LIVE AKHIR */}
              {selectedInvoiceForPay && (
                <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5 text-xs">
                  <span className="font-bold text-amber-950 dark:text-amber-200 block text-[11px]">
                    Simulasi Saldo Akhir Bulan {selectedInvoiceForPay.bulan}:
                  </span>
                  
                  {(() => {
                    const inputVal = typeof payAmount === 'number' ? payAmount : 0;
                    const finalBayar = (payMode === 'manual' && manualPayType === 'set_total')
                      ? inputVal
                      : (selectedInvoiceForPay.pembayaran || 0) + inputVal;
                    const finalSisa = Math.max(0, (selectedInvoiceForPay.piutangSdBulanIni || 0) - finalBayar);
                    const isLunas = finalSisa === 0 && (selectedInvoiceForPay.piutangSdBulanIni || 0) > 0;

                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-zinc-400">Total Pembayaran Baru:</span>
                          <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">
                            {formatRupiah(finalBayar)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-amber-200 dark:border-amber-900/60 pt-1.5 bg-white dark:bg-zinc-800/80 p-2 rounded-lg">
                          <span className="font-bold text-slate-800 dark:text-zinc-200">
                            Sisa Piutang Setelah Bayar:
                          </span>
                          <span className={`font-mono font-extrabold text-sm ${
                            isLunas ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                          }`}>
                            {formatRupiah(finalSisa)} {isLunas && '✓ (LUNAS)'}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pembayaran & Roll-Forward</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SURAT PENAGIHAN / INVOICE CETAK RESMI */}
      {/* ========================================================================= */}
      {suratRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-emerald-950/80 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Format Cetak Surat Penagihan & Invoice Resmi</h3>
              </div>
              <button
                onClick={() => setSuratRow(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PREVIEW SURAT TAGIHAN RESMI (kept as white sheet for printing fidelity) */}
            <div className="border border-slate-300 dark:border-zinc-600 rounded-xl p-6 bg-slate-50/50 dark:bg-white space-y-4 text-xs font-serif text-slate-900 leading-relaxed shadow-xs">
              
              {/* KOP SURAT */}
              <div className="text-center border-b-2 border-emerald-950 pb-3 font-sans">
                <h2 className="text-base font-extrabold text-emerald-950 uppercase tracking-wide">
                  PEMERINTAH KABUPATEN KARAWANG
                </h2>
                <h3 className="text-sm font-bold text-slate-800">
                  RUMAH SAKIT UMUM DAERAH (RSUD) KARAWANG
                </h3>
                <p className="text-[10px] text-slate-600 font-serif">
                  Jl. Galuh Mas Raya No. 1, Sukaharja, Telukjambe Timur, Karawang 41361 • Telp: (0267) 8452445
                </p>
              </div>

              {/* DETAIL INVOICE & MITRA */}
              <div className="grid grid-cols-2 gap-4 font-sans text-xs pt-1">
                <div>
                  <span className="text-slate-500 block text-[10px]">KEPADA YTH:</span>
                  <strong className="text-sm text-slate-900 block">{suratRow.namaPerusahaan}</strong>
                  <span className="text-slate-600 block">Bagian Keuangan / Klaim Kemitraan</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">NOMOR SURAT / INVOICE:</span>
                  <strong className="text-sm font-mono text-emerald-950 block">
                    {suratInvoiceDetail ? suratInvoiceDetail.noInvoice : `INV/2026/08/${getCompanyCode(suratRow.namaPerusahaan)}-001`}
                  </strong>
                  <span className="text-slate-600 block">Tanggal: {suratInvoiceDetail ? suratInvoiceDetail.tanggalInvoice : suratRow.tanggalPengajuan || '26 Agustus 2026'}</span>
                </div>
              </div>

              {/* ISI PERNYATAAN */}
              <div className="pt-2">
                <p>
                  Dengan hormat, sehubungan dengan pelayanan kesehatan <strong>{suratRow.jenisPengobatan}</strong> yang telah diberikan kepada peserta/karyawan instansi Bapak/Ibu pada periode bulan <strong>{suratRow.bulan} 2026</strong>, bersama ini kami sampaikan tagihan klaim biaya pelayanan sebagai berikut:
                </p>
              </div>

              {/* TABEL RINCIAN TAGIHAN */}
              <table className="w-full text-left font-sans border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-emerald-900 text-white font-bold">
                    <th className="p-2 border border-slate-300">Deskripsi Pelayanan</th>
                    <th className="p-2 border border-slate-300">No. Invoice</th>
                    <th className="p-2 border border-slate-300 text-right">Jumlah Tagihan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-slate-300">
                      Klaim Pelayanan Pasien Rekanan ({suratRow.jenisPengobatan})
                    </td>
                    <td className="p-2 border border-slate-300 font-mono">
                      {suratInvoiceDetail ? suratInvoiceDetail.noInvoice : '-'}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                      {formatRupiah(suratInvoiceDetail ? suratInvoiceDetail.nominalTagihan : suratRow.piutangSdBulanIni)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50 font-bold">
                    <td colSpan={2} className="p-2 border border-slate-300 text-right">
                      TOTAL TAGIHAN KLAIM:
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono text-emerald-950">
                      {formatRupiah(suratInvoiceDetail ? suratInvoiceDetail.nominalTagihan : suratRow.piutangSdBulanIni)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* REKENING PEMBAYARAN */}
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 font-sans text-xs space-y-1">
                <span className="font-bold text-emerald-950 block">Rekening Resmi Penerimaan RSUD Karawang:</span>
                <div className="flex justify-between">
                  <span>Bank Penerima: <strong>Bank BJB Cabang Karawang</strong></span>
                  <span>No. Rekening: <strong className="font-mono">001.021.009.8123</strong></span>
                </div>
                <div>Atas Nama: <strong>Bendahara Penerimaan BLUD RSUD Karawang</strong></div>
              </div>

              {/* TANDA TANGAN */}
              <div className="flex justify-between pt-4 font-sans text-xs">
                <div></div>
                <div className="text-center w-64">
                  <p>Karawang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold">Ka. Bagian Keuangan RSUD Karawang</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">H. AHMAD HIDAYAT, SE., MM.</p>
                  <p className="text-[10px] text-slate-500">NIP. 19780512 200501 1 008</p>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSuratRow(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Surat</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT DATA INVOICE */}
      {/* ========================================================================= */}
      {isEditInvoiceOpen && editingRow && editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-emerald-950/80 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Edit Data Invoice</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {editingRow.namaPerusahaan} • Bulan {editingRow.bulan} 2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditInvoiceOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="space-y-3.5 text-xs">
              
              {/* NOMOR INVOICE */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Nomor Invoice <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Receipt className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editNoInvoice}
                    onChange={(e) => setEditNoInvoice(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-[#12181f] font-mono font-bold text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* TANGGAL PENGAJUAN & TANGGAL JATUH TEMPO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Tanggal Pengajuan / Invoice <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editTglInvoice}
                    onChange={(e) => {
                      setEditTglInvoice(e.target.value);
                      if (e.target.value) {
                        const d = new Date(e.target.value);
                        d.setDate(d.getDate() + 30);
                        setEditTglJatuhTempo(d.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Tanggal Jatuh Tempo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editTglJatuhTempo}
                    onChange={(e) => setEditTglJatuhTempo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* NOMINAL TAGIHAN & PEMBAYARAN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Nominal Tagihan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">Rp</span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editNominalTagihan}
                      onChange={(e) => setEditNominalTagihan(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#12181f] font-mono font-bold text-emerald-900 dark:text-emerald-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Pembayaran Terbayar (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={editPembayaran}
                      onChange={(e) => setEditPembayaran(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] font-mono font-bold text-blue-900 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* RINGKASAN SISA PIUTANG & STATUS */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">Sisa Piutang Invoice:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    {formatRupiah(Math.max(0, (Number(editNominalTagihan) || 0) - (Number(editPembayaran) || 0)))}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    Math.max(0, (Number(editNominalTagihan) || 0) - (Number(editPembayaran) || 0)) === 0 && (Number(editNominalTagihan) || 0) > 0
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                  }`}>
                    {Math.max(0, (Number(editNominalTagihan) || 0) - (Number(editPembayaran) || 0)) === 0 && (Number(editNominalTagihan) || 0) > 0 ? 'Lunas' : editStatus}
                  </span>
                </div>
              </div>

              {/* JENIS LAYANAN & STATUS MANUAL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Jenis Layanan
                  </label>
                  <select
                    value={editJenisPengobatan}
                    onChange={(e) => setEditJenisPengobatan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {LAYANAN_OPTIONS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Status Invoice
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Belum Jatuh Tempo">Belum Jatuh Tempo</option>
                    <option value="Jatuh Tempo">Jatuh Tempo</option>
                    <option value="Sebagian">Sebagian</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Koreksi/Diskon">Koreksi/Diskon</option>
                  </select>
                </div>
              </div>

              {/* KETERANGAN */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Catatan / Keterangan Invoice
                </label>
                <input
                  type="text"
                  placeholder="Catatan penagihan atau verifikasi klaim..."
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditInvoiceOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: KONFIRMASI HAPUS INVOICE */}
      {/* ========================================================================= */}
      {isDeleteInvoiceOpen && deletingRow && deletingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-emerald-950/80 space-y-4">
            
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Hapus Nomor Invoice?</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Tindakan ini akan menghapus data invoice dari daftar tagihan.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">No. Invoice:</span>
                <span className="font-mono font-bold text-rose-950 dark:text-rose-300">{deletingInvoice.noInvoice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Perusahaan / Mitra:</span>
                <span className="font-bold text-slate-900 dark:text-zinc-100">{deletingRow.namaPerusahaan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Bulan:</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">{deletingRow.bulan} 2026</span>
              </div>
              <div className="flex justify-between border-t border-rose-200/80 dark:border-rose-900/60 pt-1.5">
                <span className="text-slate-500 dark:text-zinc-400">Nominal Tagihan:</span>
                <span className="font-mono font-bold text-rose-900 dark:text-rose-400">{formatRupiah(deletingInvoice.nominalTagihan)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Setelah dihapus, total piutang dan sisa tagihan untuk <strong>{deletingRow.namaPerusahaan}</strong> di bulan <strong>{deletingRow.bulan}</strong> akan otomatis disesuaikan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsDeleteInvoiceOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteInvoice}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-white transition flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Invoice</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: EDIT SALDO PIUTANG LALU & ROLL-FORWARD BERANTAI */}
      {/* ========================================================================= */}
      {isEditPiutangLaluOpen && editingPiutangLaluRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-teal-900/60 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Edit Saldo Piutang Lalu</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {editingPiutangLaluRow.namaPerusahaan} • Bulan {editingPiutangLaluRow.bulan} 2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditPiutangLaluOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 text-xs text-teal-900 dark:text-teal-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Roll-Forward Otomatis Antar Bulan Aktif</span>
              </div>
              <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 leading-relaxed">
                Sisa piutang bulan <strong>{editingPiutangLaluRow.bulan}</strong> akan otomatis menjadi <strong>Piutang Lalu</strong> untuk bulan-bulan berikutnya secara berkesinambungan (Januari &rarr; Februari &rarr; Maret, dst).
              </p>
            </div>

            <form onSubmit={handleSaveEditPiutangLalu} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Nominal Piutang Lalu Bulan {editingPiutangLaluRow.bulan} (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPiutangLaluVal}
                    onChange={(e) => setNewPiutangLaluVal(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-teal-300 dark:border-teal-700 bg-white dark:bg-[#12181f] font-mono font-bold text-teal-950 dark:text-teal-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setNewPiutangLaluVal(0)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[11px] font-medium text-slate-700 dark:text-zinc-300 transition"
                  >
                    Set Rp 0 (Nol)
                  </button>
                </div>
              </div>

              {/* SIMULASI PERHITUNGAN LIVE */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-zinc-200 block text-[11px]">
                  Simulasi Rekalkulasi Bulan {editingPiutangLaluRow.bulan}:
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Piutang Lalu (Baru):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                    {formatRupiah(Number(newPiutangLaluVal) || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">(+) Piutang Bulan Ini:</span>
                  <span className="font-mono text-blue-900 dark:text-blue-300 font-semibold">
                    {formatRupiah(editingPiutangLaluRow.piutangBulanIni || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-zinc-800 pt-1">
                  <span className="text-slate-600 dark:text-zinc-300 font-semibold">(=) Piutang s.d Bulan Ini:</span>
                  <span className="font-mono font-bold text-teal-800 dark:text-teal-300">
                    {formatRupiah((Number(newPiutangLaluVal) || 0) + (editingPiutangLaluRow.piutangBulanIni || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">(-) Pembayaran Bulan Ini:</span>
                  <span className="font-mono text-emerald-800 dark:text-emerald-400 font-semibold">
                    {formatRupiah(editingPiutangLaluRow.pembayaran || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-zinc-800 pt-1.5 bg-white dark:bg-zinc-800/80 p-2 rounded-lg">
                  <span className="font-bold text-rose-900 dark:text-rose-300">(=) Sisa Piutang Baru:</span>
                  <span className="font-mono font-extrabold text-rose-900 dark:text-rose-300 text-sm">
                    {formatRupiah(Math.max(0, ((Number(newPiutangLaluVal) || 0) + (editingPiutangLaluRow.piutangBulanIni || 0)) - (editingPiutangLaluRow.pembayaran || 0)))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditPiutangLaluOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan & Roll-Forward</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
