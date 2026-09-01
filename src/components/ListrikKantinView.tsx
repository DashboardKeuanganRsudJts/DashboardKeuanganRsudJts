import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Zap, 
  Search, 
  Filter, 
  Calendar,
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Download, 
  CreditCard, 
  X, 
  FileText, 
  Store, 
  Clock,
  UploadCloud,
  Edit,
  Plus,
  RotateCcw,
  PlusCircle,
  Save,
  Trash2
} from 'lucide-react';
import { 
  LISTRIK_KANTIN_REAL_DATA, 
  ListrikKantinStandGroup, 
  ListrikKantinStandMonthRow 
} from '../data/spreadsheetData2026';
import { syncSemuaRekapanFromSources } from '../services/rekapanSyncService';
import { syncDocumentToFirestore } from '../services/firestoreSync';
import { formatRupiah } from '../utils/formatters';

interface ListrikKantinViewProps { isAdmin?: boolean;
  currentUserEmail?: string;
  userRole?: string;
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

// Module-level singleton cache
let inMemoryListrikKantinCache: ListrikKantinStandGroup[] | null = null;

const getInitialListrikKantinData = (): ListrikKantinStandGroup[] => {
  if (inMemoryListrikKantinCache && inMemoryListrikKantinCache.length > 0) {
    return inMemoryListrikKantinCache;
  }
  try {
    const saved = localStorage.getItem('rsud_listrik_kantin_2026');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter((s: ListrikKantinStandGroup) => 
          s && s.namaStand && 
          s.namaStand.toUpperCase() !== 'STAND KANTIN RSUD' &&
          s.namaStand.toUpperCase() !== 'STAND KANTIN'
        );
        if (filtered.length !== parsed.length) {
          localStorage.setItem('rsud_listrik_kantin_2026', JSON.stringify(filtered));
        }
        if (filtered.length >= 7) {
          inMemoryListrikKantinCache = filtered;
          return filtered;
        }
        // If parsed exists but has fewer stands, merge with real 7 stands
        const existingNames = new Set(filtered.map((s: ListrikKantinStandGroup) => s.namaStand.toUpperCase()));
        const missingStands = LISTRIK_KANTIN_REAL_DATA.filter(s => 
          !existingNames.has(s.namaStand.toUpperCase()) &&
          s.namaStand.toUpperCase() !== 'STAND KANTIN RSUD' &&
          s.namaStand.toUpperCase() !== 'STAND KANTIN'
        );
        const merged = [...filtered, ...missingStands];
        localStorage.setItem('rsud_listrik_kantin_2026', JSON.stringify(merged));
        inMemoryListrikKantinCache = merged;
        return merged;
      }
    }
  } catch (e) {
    console.warn(e);
  }
  const initial = LISTRIK_KANTIN_REAL_DATA.filter(s => 
    s.namaStand.toUpperCase() !== 'STAND KANTIN RSUD' &&
    s.namaStand.toUpperCase() !== 'STAND KANTIN'
  );
  inMemoryListrikKantinCache = initial;
  return initial;
};

export const ListrikKantinView: React.FC<ListrikKantinViewProps> = ({ 
  isAdmin, 
  currentUserEmail, 
  userRole,
  onShowToast, 
  onOpenUploadModal 
}) => {
  const isSuperAdmin = (userRole === 'admin') || Boolean(isAdmin);
  const isPicPiutangOrAdmin = isSuperAdmin || (userRole === 'pic_piutang');

  const canModifyRecord = (row?: any) => {
    if (isSuperAdmin) return true;
    if (userRole === 'pic_piutang') {
      if (!row || !row.createdBy || row.createdBy === currentUserEmail) return true;
    }
    return false;
  };
  const [stands, setStands] = useState<ListrikKantinStandGroup[]>(getInitialListrikKantinData);

  useEffect(() => {
    // Immediate cleanup of "STAND KANTIN RSUD" on mount
    try {
      const saved = localStorage.getItem('rsud_listrik_kantin_2026');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((s: ListrikKantinStandGroup) => 
            s && s.namaStand && 
            s.namaStand.toUpperCase() !== 'STAND KANTIN RSUD' &&
            s.namaStand.toUpperCase() !== 'STAND KANTIN'
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('rsud_listrik_kantin_2026', JSON.stringify(cleaned));
            setStands(cleaned);
            window.dispatchEvent(new CustomEvent('rsud_listrik_data_updated', { detail: cleaned }));
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }

    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('rsud_listrik_kantin_2026');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleaned = parsed.filter((s: ListrikKantinStandGroup) => 
              s && s.namaStand && 
              s.namaStand.toUpperCase() !== 'STAND KANTIN RSUD' &&
              s.namaStand.toUpperCase() !== 'STAND KANTIN'
            );
            setStands(cleaned);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener('rsud_listrik_data_updated', handleUpdate);
    window.addEventListener('rsud_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('rsud_listrik_data_updated', handleUpdate);
      window.removeEventListener('rsud_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const [selectedBulan, setSelectedBulan] = useState<string>('Semua Bulan');
  const [selectedStandName, setSelectedStandName] = useState<string>('semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  // Quick Payment modal
  const [payingMonth, setPayingMonth] = useState<{ standNama: string; monthRow: ListrikKantinStandMonthRow } | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');

  // Edit / Input Tagihan Modal (Comprehensive like Perusahaan & Asuransi)
  const [isUpdateTagihanOpen, setIsUpdateTagihanOpen] = useState<boolean>(false);
  const [formStandNama, setFormStandNama] = useState<string>(LISTRIK_KANTIN_REAL_DATA[0].namaStand);
  const [formIsCustomStand, setFormIsCustomStand] = useState<boolean>(false);
  const [formCustomStandNama, setFormCustomStandNama] = useState<string>('');
  const [formBulan, setFormBulan] = useState<string>('JANUARI');
  const [formTanggalBulan, setFormTanggalBulan] = useState<string>('01/01/2026');
  const [formPiutang, setFormPiutang] = useState<number>(0);
  const [formPembayaran, setFormPembayaran] = useState<number>(0);
  const [formTanggalPembayaran, setFormTanggalPembayaran] = useState<string>('-');
  const [formTanggalJatuhTempo, setFormTanggalJatuhTempo] = useState<string>('15/02/2026');
  const [formStatus, setFormStatus] = useState<'Lunas' | 'Lewat Tempo' | 'Belum Ada Tagihan'>('Lunas');
  const [formKeterangan, setFormKeterangan] = useState<string>('-');

  // Kwitansi modal
  const [kwitansiRow, setKwitansiRow] = useState<{ standNama: string; monthRow: ListrikKantinStandMonthRow } | null>(null);

  const saveStands = (updated: ListrikKantinStandGroup[]) => {
    inMemoryListrikKantinCache = updated;
    setStands(updated);
    try {
      localStorage.setItem('rsud_listrik_kantin_2026', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    // Sync directly to Firebase Firestore
    syncDocumentToFirestore('listrik_kantin_2026', updated);

    // Automatically synchronize with Semua Rekapan (10 Penjamin)
    try {
      syncSemuaRekapanFromSources(undefined, updated);
    } catch (e) {
      console.warn('Error syncing Semua Rekapan:', e);
    }
    window.dispatchEvent(new CustomEvent('rsud_listrik_data_updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('rsud_semua_rekapan_updated'));
    window.dispatchEvent(new CustomEvent('rsud_data_updated'));
  };

  // Delete Stand Function
  const handleDeleteStand = (standNama: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Stand "${standNama}" beserta seluruh riwayat tagihannya?`)) {
      const updated = stands.filter(s => s.namaStand.toUpperCase() !== standNama.toUpperCase());
      saveStands(updated);
      if (selectedStandName.toUpperCase() === standNama.toUpperCase()) {
        setSelectedStandName('semua');
      }
      if (onShowToast) {
        onShowToast(`Stand "${standNama}" berhasil dihapus dari data Listrik Kantin.`, 'success');
      }
    }
  };

  // Reset to screenshot default master data
  const handleResetToScreenshots = () => {
    if (window.confirm('Reset data Listrik Kantin kembali ke data awal sesuai 7 Screenshot resmi? Perubahan manual akan ditimpa.')) {
      saveStands(LISTRIK_KANTIN_REAL_DATA);
      if (onShowToast) onShowToast('Data Listrik Kantin berhasil di-reset sesuai 7 stand spreadsheet!', 'info');
    }
  };

  // Open edit modal for specific row
  const handleOpenEditRow = (standNama: string, row: ListrikKantinStandMonthRow) => {
    setFormStandNama(standNama);
    setFormIsCustomStand(false);
    setFormCustomStandNama('');
    setFormBulan(row.bulan);
    setFormTanggalBulan(row.tanggalBulan);
    setFormPiutang(row.piutang);
    setFormPembayaran(row.pembayaran);
    setFormTanggalPembayaran(row.tanggalPembayaran);
    setFormTanggalJatuhTempo(row.tanggalJatuhTempo);
    setFormStatus(row.status);
    setFormKeterangan(row.keterangan);
    setIsUpdateTagihanOpen(true);
  };

  // Open new tagihan modal
  const handleOpenNewTagihan = () => {
    const defaultStand = stands[0]?.namaStand || 'AYAM GEPREK';
    setFormStandNama(defaultStand);
    setFormIsCustomStand(false);
    setFormCustomStandNama('');
    setFormBulan(selectedBulan !== 'Semua Bulan' ? selectedBulan.toUpperCase() : 'JULI');
    setFormTanggalBulan('01/07/2026');
    setFormPiutang(250000);
    setFormPembayaran(0);
    setFormTanggalPembayaran('-');
    setFormTanggalJatuhTempo('15/08/2026');
    setFormStatus('Lewat Tempo');
    setFormKeterangan('Tagihan listrik periode berjalan');
    setIsUpdateTagihanOpen(true);
  };

  // Save tagihan edit or new
  const handleSaveUpdateTagihan = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStandNama = formIsCustomStand && formCustomStandNama.trim() 
      ? formCustomStandNama.trim().toUpperCase() 
      : formStandNama;

    if (!finalStandNama) {
      if (onShowToast) onShowToast('Mohon tentukan nama stand kantin.', 'error');
      return;
    }

    const piutangNum = Number(formPiutang) || 0;
    const bayarNum = Number(formPembayaran) || 0;
    const sisaNum = Math.max(0, piutangNum - bayarNum);

    let calculatedStatus = formStatus;
    if (piutangNum === 0 && bayarNum === 0) {
      calculatedStatus = 'Belum Ada Tagihan';
    } else if (sisaNum === 0 && piutangNum > 0) {
      calculatedStatus = 'Lunas';
    } else if (sisaNum > 0) {
      calculatedStatus = 'Lewat Tempo';
    }

    const monthIndex = MONTH_NAMES_UPPER.indexOf(formBulan.toUpperCase());
    const monthNo = monthIndex >= 0 ? monthIndex + 1 : 1;

    let targetStand = stands.find(s => s.namaStand.toUpperCase() === finalStandNama.toUpperCase());
    let updatedStands: ListrikKantinStandGroup[];

    if (!targetStand) {
      // Create new stand with 12 months
      const defaultRows: ListrikKantinStandMonthRow[] = MONTH_NAMES_UPPER.map((mName, idx) => {
        const no = idx + 1;
        const mm = String(no).padStart(2, '0');
        const nextMm = String(no === 12 ? 1 : no + 1).padStart(2, '0');
        const nextYr = no === 12 ? '2027' : '2026';
        if (mName === formBulan.toUpperCase()) {
          return {
            no,
            tanggalBulan: formTanggalBulan || `01/${mm}/2026`,
            bulan: mName,
            piutang: piutangNum,
            pembayaran: bayarNum,
            sisaPiutang: sisaNum,
            tanggalPembayaran: bayarNum > 0 ? (formTanggalPembayaran !== '-' ? formTanggalPembayaran : new Date().toLocaleDateString('en-GB')) : '-',
            tanggalJatuhTempo: formTanggalJatuhTempo || `15/${nextMm}/${nextYr}`,
            status: calculatedStatus,
            keterangan: formKeterangan || '-',
            createdBy: currentUserEmail
          };
        }
        return {
          no,
          tanggalBulan: `01/${mm}/2026`,
          bulan: mName,
          piutang: 0,
          pembayaran: 0,
          sisaPiutang: 0,
          tanggalPembayaran: '-',
          tanggalJatuhTempo: `15/${nextMm}/${nextYr}`,
          status: 'Belum Ada Tagihan',
          keterangan: '-',
          createdBy: currentUserEmail
        };
      });

      const newStandGroup: ListrikKantinStandGroup = {
        namaStand: finalStandNama,
        totalTagihan: defaultRows.reduce((s, r) => s + r.piutang, 0),
        pembayaran: defaultRows.reduce((s, r) => s + r.pembayaran, 0),
        sisaPiutang: defaultRows.reduce((s, r) => s + r.sisaPiutang, 0),
        belumLunasCount: defaultRows.filter(r => r.sisaPiutang > 0 && r.piutang > 0).length,
        rows: defaultRows
      };

      updatedStands = [...stands, newStandGroup];
    } else {
      updatedStands = stands.map(st => {
        if (st.namaStand.toUpperCase() === finalStandNama.toUpperCase()) {
          const updatedRows = st.rows.map(r => {
            if (r.bulan.toUpperCase() === formBulan.toUpperCase()) {
              return {
                ...r,
                tanggalBulan: formTanggalBulan || r.tanggalBulan,
                piutang: piutangNum,
                pembayaran: bayarNum,
                sisaPiutang: sisaNum,
                tanggalPembayaran: bayarNum > 0 ? (formTanggalPembayaran !== '-' ? formTanggalPembayaran : new Date().toLocaleDateString('en-GB')) : '-',
                tanggalJatuhTempo: formTanggalJatuhTempo || r.tanggalJatuhTempo,
                status: calculatedStatus,
                keterangan: formKeterangan || '-',
                createdBy: r.createdBy || currentUserEmail
              };
            }
            return r;
          });

          return {
            ...st,
            totalTagihan: updatedRows.reduce((s, r) => s + r.piutang, 0),
            pembayaran: updatedRows.reduce((s, r) => s + r.pembayaran, 0),
            sisaPiutang: updatedRows.reduce((s, r) => s + r.sisaPiutang, 0),
            belumLunasCount: updatedRows.filter(r => r.sisaPiutang > 0 && r.piutang > 0).length,
            rows: updatedRows
          };
        }
        return st;
      });
    }

    saveStands(updatedStands);
    setIsUpdateTagihanOpen(false);
    if (onShowToast) onShowToast(`Tagihan listrik ${finalStandNama} bulan ${formBulan} berhasil diperbarui!`, 'success');
  };

  // Grand totals across all stands, filtered by month if selected
  const grandTotal = useMemo(() => {
    let totalTagihan = 0;
    let totalPembayaran = 0;
    let totalSisa = 0;
    let totalBelumLunas = 0;

    stands.forEach(st => {
      st.rows.forEach(m => {
        const matchBulan = selectedBulan === 'Semua Bulan' || m.bulan.toLowerCase() === selectedBulan.toLowerCase();
        if (matchBulan) {
          totalTagihan += m.piutang;
          totalPembayaran += m.pembayaran;
          totalSisa += m.sisaPiutang;
          if (m.sisaPiutang > 0 && m.piutang > 0) {
            totalBelumLunas += 1;
          }
        }
      });
    });

    return {
      totalTagihan,
      totalPembayaran,
      totalSisa,
      totalBelumLunas
    };
  }, [stands, selectedBulan]);

  // Handle save payment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingMonth) return;

    const updated = stands.map(st => {
      if (st.namaStand === payingMonth.standNama) {
        const updatedRows = st.rows.map(m => {
          if (m.bulan === payingMonth.monthRow.bulan) {
            const newBayar = Number(payAmount);
            const newSisa = Math.max(0, m.piutang - newBayar);
            const newStatus = newSisa === 0 ? 'Lunas' : (m.piutang === 0 ? 'Belum Ada Tagihan' : 'Lewat Tempo');
            return {
              ...m,
              pembayaran: newBayar,
              sisaPiutang: newSisa,
              tanggalPembayaran: newBayar > 0 ? payDate : '-',
              status: newStatus as any,
              keterangan: payNote || '-'
            };
          }
          return m;
        });

        const newTotalTagihan = updatedRows.reduce((s, r) => s + r.piutang, 0);
        const newTotalBayar = updatedRows.reduce((s, r) => s + r.pembayaran, 0);
        const newTotalSisa = updatedRows.reduce((s, r) => s + r.sisaPiutang, 0);
        const newBelumLunasCount = updatedRows.filter(r => r.sisaPiutang > 0 && r.piutang > 0).length;

        return {
          ...st,
          totalTagihan: newTotalTagihan,
          pembayaran: newTotalBayar,
          sisaPiutang: newTotalSisa,
          belumLunasCount: newBelumLunasCount,
          rows: updatedRows
        };
      }
      return st;
    });

    saveStands(updated);
    setPayingMonth(null);
    if (onShowToast) onShowToast(`Pembayaran listrik ${payingMonth.standNama} bulan ${payingMonth.monthRow.bulan} berhasil disimpan!`, 'success');
  };

  const handleOpenPay = (standNama: string, monthRow: ListrikKantinStandMonthRow) => {
    setPayingMonth({ standNama, monthRow });
    setPayAmount(monthRow.sisaPiutang > 0 ? monthRow.sisaPiutang : monthRow.piutang);
    setPayDate(monthRow.tanggalPembayaran !== '-' ? monthRow.tanggalPembayaran : new Date().toLocaleDateString('en-GB'));
    setPayNote(monthRow.keterangan !== '-' ? monthRow.keterangan : '');
  };

  const handleExportExcel = () => {
    const headers = [
      'Nama Stand Kantin',
      'No',
      'Tanggal / Bulan',
      'Bulan',
      'Piutang Tagihan (Rp)',
      'Pembayaran (Rp)',
      'Sisa Piutang (Rp)',
      'Tanggal Pembayaran',
      'Tanggal Jatuh Tempo',
      'Status',
      'Keterangan'
    ];

    const rows: (string | number)[][] = [];

    stands.forEach(st => {
      st.rows.forEach(m => {
        const matchBulan = selectedBulan === 'Semua Bulan' || m.bulan.toLowerCase() === selectedBulan.toLowerCase();
        if (matchBulan) {
          rows.push([
            st.namaStand,
            m.no,
            m.tanggalBulan,
            m.bulan,
            m.piutang,
            m.pembayaran,
            m.sisaPiutang,
            m.tanggalPembayaran,
            m.tanggalJatuhTempo,
            m.status,
            m.keterangan
          ]);
        }
      });
    });

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Listrik Kantin");
    XLSX.writeFile(wb, `Piutang_Listrik_Kantin_${selectedBulan.replace(/\s+/g, '_')}_2026.xlsx`);

    if (onShowToast) onShowToast('File Excel Piutang Listrik Kantin berhasil diunduh.', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#4a1111] via-[#3a0d0d] to-[#260606] dark:from-[#2a0808] dark:via-[#1c0404] dark:to-[#0f0202] text-white rounded-2xl p-6 shadow-md border border-red-900/50 dark:border-red-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/50 dark:bg-red-950/80 text-amber-200 border border-amber-500/30 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Sheet: Listrik_Kantin ({stands.length} Stand Terdaftar)</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-medium">
                Aktif Sinkron 2026
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Monitoring & Pengelolaan Piutang Listrik Kantin RSUD
            </h1>
            <p className="text-xs text-red-100/80 mt-1 max-w-2xl">
              Pencatatan pemakaian listrik bulanan seluruh penyewa stand kantin food court RSUD: Ayam Geprek, Bu Aas, Bu Nenden, Teh Dewi, Pak Suan, Bu Rini, Pak Riska.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Update / Input Tagihan Button (like Perusahaan Asuransi) */}
            {isPicPiutangOrAdmin && (
              <button
                onClick={handleOpenNewTagihan}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Update / Input Tagihan</span>
              </button>
            )}

            {/* Upload Spreadsheet modal trigger */}
            {onOpenUploadModal && isPicPiutangOrAdmin && (
              <button
                onClick={onOpenUploadModal}
                className="px-3 py-2 bg-amber-900/90 hover:bg-amber-800 text-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-amber-700/60 shadow-2xs"
                title="Upload spreadsheet file XLSX / CSV"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Sheet</span>
              </button>
            )}

            {userRole === 'admin' && (
              <button
                onClick={handleResetToScreenshots}
                className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
                title="Reset ke data asli 7 Screenshot"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-amber-900 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-amber-700 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-white dark:bg-[#1f100a] text-slate-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-[#2b170e] dark:border dark:border-amber-900/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stand Summary Cards Grid (All 7 Stands) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-amber-50 flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-700" />
            <span>Ringkasan 7 Stand Kantin RSUD ({stands.length} Stand Terdata)</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Klik stand untuk memfilter tabel di bawah</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {stands.map((stand, sIdx) => {
            const isSelected = selectedStandName === stand.namaStand;
            
            // Calculate filtered numbers for this stand card if a month is chosen
            const standFilteredRows = stand.rows.filter(m => 
              selectedBulan === 'Semua Bulan' || m.bulan.toLowerCase() === selectedBulan.toLowerCase()
            );
            const cardTagihan = standFilteredRows.reduce((s, r) => s + r.piutang, 0);
            const cardBayar = standFilteredRows.reduce((s, r) => s + r.pembayaran, 0);
            const cardSisa = standFilteredRows.reduce((s, r) => s + r.sisaPiutang, 0);
            const cardBelumLunas = standFilteredRows.filter(r => r.sisaPiutang > 0 && r.piutang > 0).length;

            return (
              <div
                key={`stand-card-${stand.namaStand}-${sIdx}`}
                onClick={() => setSelectedStandName(isSelected ? 'semua' : stand.namaStand)}
                className={`bg-white dark:bg-[#140b07] rounded-xl p-4 border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected 
                    ? 'border-amber-500 ring-2 ring-amber-400/30 shadow-md bg-amber-50/20 dark:bg-amber-950/20' 
                    : 'border-slate-200 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[9px] font-extrabold uppercase border border-amber-200 dark:border-amber-800 mb-1">
                        <Store className="w-2.5 h-2.5 text-amber-700" />
                        <span>Food Court RSUD</span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-amber-50 leading-snug">{stand.namaStand}</h3>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                        cardBelumLunas > 0 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {cardBelumLunas > 0 ? `${cardBelumLunas} Bln Nunggak` : 'Lunas'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-xs">
                  <div>
                    <div className="text-[9px] text-slate-400 font-semibold uppercase">Tagihan</div>
                    <div className="font-bold text-slate-800 dark:text-white font-mono text-[11px] mt-0.5 truncate">{formatRupiah(cardTagihan)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-semibold uppercase">Setoran</div>
                    <div className="font-bold text-emerald-700 font-mono text-[11px] mt-0.5 truncate">{formatRupiah(cardBayar)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-semibold uppercase">Sisa</div>
                    <div className="font-bold text-rose-700 font-mono text-[11px] mt-0.5 truncate">{formatRupiah(cardSisa)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Filter Bar with Dedicated MONTH SELECTOR */}
      <div className="bg-white dark:bg-[#140b07] rounded-xl border border-slate-200 dark:border-amber-900/40 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* OPSI PILIH BULAN */}
          <div className="flex items-center gap-1.5 bg-amber-50/80 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
            <Calendar className="w-3.5 h-3.5 text-amber-800 dark:text-amber-500" />
            <span className="text-xs text-amber-950 dark:text-amber-200 font-bold">Pilih Bulan:</span>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="bg-white dark:bg-[#2b170e] rounded-md border border-amber-300 dark:border-amber-800 px-2.5 py-1 text-xs text-amber-900 dark:text-amber-100 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              {BULAN_OPTIONS.map((b, bIdx) => (
                <option key={`listrik-bulan-filter-${b}-${bIdx}`} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* FILTER STAND */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filter Stand:</span>
            <select
              value={selectedStandName}
              onChange={(e) => setSelectedStandName(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-amber-900/50 dark:bg-[#2b170e] px-2.5 py-1.5 text-xs text-slate-700 dark:text-amber-100 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="semua">Semua Stand Kantin ({stands.length} Stand)</option>
              {stands.map((st, stIdx) => (
                <option key={`listrik-stand-filter-${st.namaStand}-${stIdx}`} value={st.namaStand}>{st.namaStand}</option>
              ))}
            </select>
          </div>

          {/* FILTER STATUS */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-amber-900/50 dark:bg-[#2b170e] px-2.5 py-1.5 text-xs text-slate-700 dark:text-amber-100 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Lewat Tempo">Lewat Tempo / Belum Lunas</option>
            </select>
          </div>

        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono font-bold text-slate-700 dark:text-amber-100">
            Akumulasi Sisa ({selectedBulan}): <span className="text-rose-700 dark:text-rose-500 text-sm font-extrabold">{formatRupiah(grandTotal.totalSisa)}</span>
          </div>
          {isAdmin && (
            <button
              onClick={handleOpenNewTagihan}
              className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Update Tagihan</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Detailed Tables for Each Stand */}
      <div className="space-y-6">
        {stands
          .filter(st => selectedStandName === 'semua' || st.namaStand === selectedStandName)
          .map((stand, sIdx) => {
            const displayedMonths = stand.rows.filter(m => {
              const matchBulan = selectedBulan === 'Semua Bulan' || m.bulan.toLowerCase() === selectedBulan.toLowerCase();
              const matchStatus = selectedStatus === 'Semua' || 
                (selectedStatus === 'Lunas' && m.status === 'Lunas') ||
                (selectedStatus === 'Lewat Tempo' && m.status === 'Lewat Tempo');
              return matchBulan && matchStatus;
            });

            const subtotalTagihan = displayedMonths.reduce((s, r) => s + r.piutang, 0);
            const subtotalBayar = displayedMonths.reduce((s, r) => s + r.pembayaran, 0);
            const subtotalSisa = displayedMonths.reduce((s, r) => s + r.sisaPiutang, 0);

            return (
              <div key={`stand-section-${stand.namaStand}-${sIdx}`} className="bg-white dark:bg-[#140b07] rounded-2xl border border-slate-200 dark:border-amber-900/40 shadow-2xs overflow-hidden">
                
                {/* Stand Header */}
                <div className="bg-amber-950 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-800/80 flex items-center justify-center text-amber-200">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white tracking-wide uppercase">
                          Stand: {stand.namaStand}
                        </h3>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded">
                          12 Bulan Rekap
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">
                        Food Court RSUD Jatisari • Tagihan Listrik Berjalan ({selectedBulan})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 text-right text-xs">
                    <div>
                      <span className="text-amber-300/80 text-[10px] block">Total Tagihan</span>
                      <strong className="font-mono">{formatRupiah(subtotalTagihan)}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-300 text-[10px] block">Terbayar</span>
                      <strong className="font-mono text-emerald-300">{formatRupiah(subtotalBayar)}</strong>
                    </div>
                    <div>
                      <span className="text-rose-300 text-[10px] block">Sisa Piutang</span>
                      <strong className="font-mono text-rose-300">{formatRupiah(subtotalSisa)}</strong>
                    </div>

                    {/* Delete Stand Button */}
                    <button
                      onClick={() => handleDeleteStand(stand.namaStand)}
                      disabled={userRole !== 'admin'}
                      className="ml-1 p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/60 transition flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
                      title={`Hapus stand ${stand.namaStand} dari sistem`}
                      style={{ opacity: userRole !== 'admin' ? 0.5 : 1, cursor: userRole !== 'admin' ? 'not-allowed' : 'pointer' }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden sm:inline">Hapus Stand</span>
                    </button>
                  </div>
                </div>

                {/* Monthly Breakdown Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-amber-950/40 text-slate-700 dark:text-amber-100 font-semibold border-b border-slate-200 dark:border-amber-900/40">
                        <th className="py-2.5 px-3">Bulan</th>
                        <th className="py-2.5 px-2 text-center">No</th>
                        <th className="py-2.5 px-3">Tanggal / Bulan</th>
                        <th className="py-2.5 px-3 text-right">Piutang Tagihan</th>
                        <th className="py-2.5 px-3">Tgl Pembayaran</th>
                        <th className="py-2.5 px-3 text-right">Pembayaran</th>
                        <th className="py-2.5 px-3 text-right font-bold">Sisa Piutang</th>
                        <th className="py-2.5 px-3">Tgl Jatuh Tempo</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">Keterangan</th>
                        <th className="py-2.5 px-3 text-center">Aksi / Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-amber-900/20">
                      {displayedMonths.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-slate-400">
                            Tidak ada baris tagihan untuk filter bulan <strong>{selectedBulan}</strong> pada stand {stand.namaStand}.
                          </td>
                        </tr>
                      ) : (
                        displayedMonths.map((m, mIdx) => {
                          const isLunas = m.status === 'Lunas';
                          const isBelumAda = m.status === 'Belum Ada Tagihan';
                          const hasSisa = m.sisaPiutang > 0;

                          return (
                            <tr 
                              key={`stand-month-row-${stand.namaStand}-${m.bulan}-${m.no}-${mIdx}`}
                              className={`hover:bg-slate-50/80 dark:hover:bg-[#1a0f0a] transition ${
                                hasSisa ? 'bg-rose-50/20 dark:bg-rose-950/20' : (isBelumAda ? 'opacity-70' : '')
                              }`}
                            >
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-amber-50 whitespace-nowrap">
                                {m.bulan}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-slate-500 dark:text-slate-400">
                                {m.no}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                {m.tanggalBulan}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-amber-100">
                                {formatRupiah(m.piutang)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                                {m.tanggalPembayaran}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                {formatRupiah(m.pembayaran)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-500">
                                {formatRupiah(m.sisaPiutang)}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {m.tanggalJatuhTempo}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  isLunas
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : isBelumAda
                                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                  {m.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                                {m.keterangan || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Edit / Update Tagihan Button */}
                                  {canModifyRecord(m) && (
                                    <button
                                      onClick={() => handleOpenEditRow(stand.namaStand, m)}
                                      className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-100 transition"
                                      title="Edit Tagihan/Pembayaran Bulan Ini"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                  )}

                                  {/* Fast Bayar */}
                                  {canModifyRecord(m) && (
                                    <button
                                      onClick={() => handleOpenPay(stand.namaStand, m)}
                                      className="p-1 rounded-md hover:bg-amber-50 text-amber-800 border border-amber-200 transition"
                                      title="Catat Pembayaran Cepat"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Kwitansi */}
                                  <button
                                    onClick={() => setKwitansiRow({ standNama: stand.namaStand, monthRow: m })}
                                    className="p-1 rounded-md hover:bg-teal-50 text-teal-700 border border-teal-200 transition"
                                    title="Cetak Kwitansi Listrik"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {displayedMonths.length > 0 && (
                      <tfoot className="bg-slate-50 dark:bg-amber-950/40 font-bold text-slate-900 dark:text-amber-100 border-t border-slate-200 dark:border-amber-900/40">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[11px]">
                            Subtotal {stand.namaStand} ({selectedBulan}):
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-amber-100">
                            {formatRupiah(subtotalTagihan)}
                          </td>
                          <td></td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-800 dark:text-emerald-400">
                            {formatRupiah(subtotalBayar)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-800 dark:text-rose-400">
                            {formatRupiah(subtotalSisa)}
                          </td>
                          <td colSpan={4} className="py-2.5 px-3 text-center text-slate-500 dark:text-slate-400 text-xs">
                            {displayedMonths.filter(r => r.sisaPiutang > 0 && r.piutang > 0).length} Bulan Belum Lunas
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

              </div>
            );
          })}
      </div>

      {/* 5. Comprehensive UPDATE / INPUT TAGIHAN MODAL (Matching Perusahaan & Asuransi module) */}
      {isUpdateTagihanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#1a0f0a] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-amber-900/40 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Form Update / Input Tagihan Listrik Kantin
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perbarui tagihan bulanan stand kantin atau daftarkan stand baru
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUpdateTagihanOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdateTagihan} className="space-y-3.5 text-xs">
              
              {/* Stand Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stand Kantin</label>
                {!formIsCustomStand ? (
                  <div className="space-y-1.5">
                    <select
                      value={formStandNama}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setFormIsCustomStand(true);
                          setFormCustomStandNama('');
                        } else {
                          setFormStandNama(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {stands.map((st, stIdx) => (
                        <option key={`modal-select-stand-${st.namaStand}-${stIdx}`} value={st.namaStand}>{st.namaStand}</option>
                      ))}
                      <option value="__NEW__">+ Tambah Stand Kantin Baru...</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nama Stand Baru (Contoh: STAND KOPI KANTIN)"
                        value={formCustomStandNama}
                        onChange={(e) => setFormCustomStandNama(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 font-bold uppercase text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setFormIsCustomStand(false)}
                        className="px-3 py-2 border rounded-xl hover:bg-slate-50 text-slate-600"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bulan & Tanggal Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bulan Tagihan</label>
                  <select
                    value={formBulan}
                    onChange={(e) => {
                      const newB = e.target.value;
                      setFormBulan(newB);
                      const idx = MONTH_NAMES_UPPER.indexOf(newB);
                      if (idx >= 0) {
                        const mm = String(idx + 1).padStart(2, '0');
                        setFormTanggalBulan(`01/${mm}/2026`);
                        const nextMm = String(idx === 11 ? 1 : idx + 2).padStart(2, '0');
                        const nextYr = idx === 11 ? '2027' : '2026';
                        setFormTanggalJatuhTempo(`15/${nextMm}/${nextYr}`);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {MONTH_NAMES_UPPER.map((m, mIdx) => (
                      <option key={`modal-select-month-${m}-${mIdx}`} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal / Bulan Tagihan</label>
                  <input
                    type="text"
                    placeholder="01/01/2026"
                    value={formTanggalBulan}
                    onChange={(e) => setFormTanggalBulan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Piutang Tagihan & Pembayaran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Piutang Tagihan Listrik (Rp)</label>
                  <input
                    type="number"
                    value={formPiutang}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormPiutang(val);
                      if (formPembayaran > val) {
                        setFormPembayaran(val);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pembayaran / Setoran (Rp)</label>
                  <input
                    type="number"
                    value={formPembayaran}
                    onChange={(e) => setFormPembayaran(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick helper for full payment */}
              <div className="flex items-center justify-between text-[11px] px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setFormPembayaran(formPiutang);
                    setFormTanggalPembayaran(new Date().toLocaleDateString('en-GB'));
                    setFormStatus('Lunas');
                  }}
                  className="text-amber-800 font-bold hover:underline"
                >
                  ⚡ Set Lunas Penuh ({formatRupiah(formPiutang)})
                </button>
                <span className="font-mono text-slate-600">
                  Sisa: <strong className="text-rose-700">{formatRupiah(Math.max(0, formPiutang - formPembayaran))}</strong>
                </span>
              </div>

              {/* Tanggal Bayar & Jatuh Tempo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembayaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: 20/04/2026 atau -"
                    value={formTanggalPembayaran}
                    onChange={(e) => setFormTanggalPembayaran(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Jatuh Tempo</label>
                  <input
                    type="text"
                    placeholder="Contoh: 15/02/2026"
                    value={formTanggalJatuhTempo}
                    onChange={(e) => setFormTanggalJatuhTempo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status & Keterangan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Tagihan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="Lewat Tempo">Lewat Tempo / Belum Lunas</option>
                    <option value="Belum Ada Tagihan">Belum Ada Tagihan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Keterangan / Catatan Meter</label>
                  <input
                    type="text"
                    placeholder="Contoh: Menunggak / Selesai bayar"
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpdateTagihanOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold hover:bg-amber-900 transition shadow-2xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Tagihan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Payment Modal (Quick payment) */}
      {payingMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a0f0a] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-amber-900/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-700" />
                <span>Penerimaan Pembayaran Listrik Kantin</span>
              </h3>
              <button
                onClick={() => setPayingMonth(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 space-y-1 text-xs">
              <div className="font-bold text-amber-950">{payingMonth.standNama}</div>
              <div className="text-amber-800">Tagihan Periode: <span className="font-bold">{payingMonth.monthRow.bulan}</span></div>
              <div className="text-slate-600">Total Kewajiban: <span className="font-mono font-bold text-slate-900">{formatRupiah(payingMonth.monthRow.piutang)}</span></div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Disetorkan (Rp)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <button
                    type="button"
                    onClick={() => setPayAmount(payingMonth.monthRow.piutang)}
                    className="text-amber-800 hover:underline font-semibold"
                  >
                    Bayar Lunas Penuh ({formatRupiah(payingMonth.monthRow.piutang)})
                  </button>
                  <span>Sisa: {formatRupiah(Math.max(0, payingMonth.monthRow.piutang - payAmount))}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembayaran</label>
                <input
                  type="text"
                  placeholder="Contoh: 12/08/2026"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Catatan Kasir</label>
                <input
                  type="text"
                  placeholder="Contoh: Setor tunai ke Bagian Keuangan RSUD"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingMonth(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold hover:bg-amber-900 transition shadow-2xs"
                >
                  Simpan Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Kwitansi Modal */}
      {kwitansiRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a0f0a] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-amber-900/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Kwitansi Resmi Pemakaian Listrik Kantin</span>
              </h3>
              <button
                onClick={() => setKwitansiRow(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Kwitansi */}
            <div className="p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 space-y-4 text-xs">
              <div className="text-center border-b pb-2 border-slate-200">
                <div className="font-bold text-xs uppercase text-slate-500">BLUD RSUD JATISARI KARAWANG</div>
                <div className="text-base font-black text-slate-900">BUKTI PEMBAYARAN LISTRIK KANTIN</div>
                <div className="text-[10px] text-slate-500">No: KW-LST-2026-{kwitansiRow.monthRow.bulan.slice(0,3).toUpperCase()}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Nama Penyewa/Stand:</span>
                  <strong className="text-slate-900">{kwitansiRow.standNama}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Bulan Tagihan:</span>
                  <strong className="text-slate-900">{kwitansiRow.monthRow.bulan} 2026</strong>
                </div>
              </div>

              <div className="bg-white dark:bg-[#2b170e] p-3 rounded-lg border border-slate-200 dark:border-amber-900/40 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Tagihan:</span>
                  <span className="font-mono font-bold">{formatRupiah(kwitansiRow.monthRow.piutang)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pembayaran Diterima:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatRupiah(kwitansiRow.monthRow.pembayaran)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold text-slate-900">
                  <span>Sisa Tagihan:</span>
                  <span className="font-mono text-rose-700">{formatRupiah(kwitansiRow.monthRow.sisaPiutang)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Status:</span>
                  <span className={`px-2 py-0.5 font-bold rounded text-[11px] ${
                    kwitansiRow.monthRow.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {kwitansiRow.monthRow.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block">Tanggal Pembayaran:</span>
                  <span className="font-mono font-bold text-slate-800">{kwitansiRow.monthRow.tanggalPembayaran}</span>
                </div>
              </div>

              <div className="text-right pt-4 text-[10px] text-slate-500">
                Pengelola Utilitas & Kasir Kantin RSUD Jatisari
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setKwitansiRow(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition text-xs"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold hover:bg-amber-900 transition text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Kwitansi</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
