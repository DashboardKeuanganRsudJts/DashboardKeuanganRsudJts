import React, { useState, useEffect, useMemo } from 'react';
import { formatRupiah } from '../utils/formatters';
import { syncDocumentToFirestore } from '../services/firestoreSync';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Trash2, 
  Edit,
  Layers,
  Building,
  Filter,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell
} from 'recharts';

export interface PendapatanItem {
  id: string;
  bulan: string;
  tanggal: string;
  sumber: string;
  kategori: string;
  kodeRekening?: string;
  jumlahTarget: number;
  jumlahRealisasi: number;
  keterangan: string;
  createdBy?: string;
}

const INITIAL_PENDAPATAN: PendapatanItem[] = [
  { id: 'PEND-001', bulan: 'Agustus', tanggal: '28-08-2026', sumber: 'Pelayanan Rawat Inap BPJS & Umum', kategori: 'Pendapatan Fungsional RS', kodeRekening: '4.1.04.16.01.0001', jumlahTarget: 2100000000, jumlahRealisasi: 1845000000, keterangan: 'Optimal' },
  { id: 'PEND-002', bulan: 'Agustus', tanggal: '27-08-2026', sumber: 'Pelayanan Rawat Jalan & Poliklinik Spesialis', kategori: 'Pendapatan Fungsional RS', kodeRekening: '4.1.04.16.01.0002', jumlahTarget: 1400000000, jumlahRealisasi: 1285129960, keterangan: 'Optimal' },
  { id: 'PEND-003', bulan: 'Agustus', tanggal: '26-08-2026', sumber: 'Instalasi Gawat Darurat (IGD) & Bedah Sentral', kategori: 'Pendapatan Fungsional RS', kodeRekening: '4.1.04.16.01.0003', jumlahTarget: 950000000, jumlahRealisasi: 820000000, keterangan: 'Stabil' },
  { id: 'PEND-004', bulan: 'Agustus', tanggal: '25-08-2026', sumber: 'Kerjasama Asuransi Swasta & Perusahaan', kategori: 'Kerjasama Pihak Ketiga & JKN', kodeRekening: '4.1.04.16.02.0001', jumlahTarget: 650000000, jumlahRealisasi: 580000000, keterangan: 'Proses Piutang Berjalan' },
  { id: 'PEND-005', bulan: 'Agustus', tanggal: '24-08-2026', sumber: 'Klaim JKN BPJS Kesehatan (Ina-CBGs)', kategori: 'Kerjasama Pihak Ketiga & JKN', kodeRekening: '4.1.04.16.02.0002', jumlahTarget: 3200000000, jumlahRealisasi: 2950000000, keterangan: 'Verifikasi BPJS Selesai' },
  { id: 'PEND-006', bulan: 'Agustus', tanggal: '20-08-2026', sumber: 'Sewa Lahan & Stand Kantin RSUD', kategori: 'Sewa Lahan & Penunjang Medis', kodeRekening: '4.1.04.16.03.0001', jumlahTarget: 45000000, jumlahRealisasi: 42500000, keterangan: 'Lunas' },
  { id: 'PEND-007', bulan: 'Agustus', tanggal: '18-08-2026', sumber: 'Parkir RSUD & Jasa Penunjang Ambulans', kategori: 'Sewa Lahan & Penunjang Medis', kodeRekening: '4.1.04.16.03.0002', jumlahTarget: 35000000, jumlahRealisasi: 31200000, keterangan: 'Optimal' },
];

interface PendapatanBludViewProps {
  isAdmin?: boolean;
  currentUserEmail?: string;
  userRole?: string;
  selectedBulan?: string;
  activeSubmenu?: string;
  onOpenLoginModal?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

// Module-level singleton memory cache to prevent resets on tab switching
let inMemoryPendapatanCache: PendapatanItem[] | null = null;

const PENDAPATAN_STORAGE_KEY = 'rsud_pendapatan_blud_data';

const getInitialPendapatanData = (): PendapatanItem[] => {
  if (inMemoryPendapatanCache && inMemoryPendapatanCache.length > 0) {
    return inMemoryPendapatanCache;
  }
  try {
    const saved = localStorage.getItem(PENDAPATAN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryPendapatanCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse pendapatan data from localStorage', e);
  }
  inMemoryPendapatanCache = INITIAL_PENDAPATAN;
  return INITIAL_PENDAPATAN;
};

export const PendapatanBludView: React.FC<PendapatanBludViewProps> = ({ 
  isAdmin, 
  currentUserEmail, 
  userRole, 
  selectedBulan = 'AGUSTUS',
  activeSubmenu = 'fungsional_rs',
  onOpenLoginModal,
  onShowToast
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<string>(activeSubmenu || 'fungsional_rs');

  // Role permissions check
  const isSuperAdmin = (userRole === 'admin') || Boolean(isAdmin);
  const isPicPendapatanOrAdmin = isSuperAdmin || (userRole === 'pic_pendapatan');

  const canModifyRecord = (record: any) => {
    if (isSuperAdmin) return true;
    if (userRole === 'pic_pendapatan') {
      if (!record?.createdBy || record?.createdBy === currentUserEmail) return true;
    }
    return false;
  };

  useEffect(() => {
    if (activeSubmenu) {
      setCurrentSubTab(activeSubmenu);
    }
  }, [activeSubmenu]);

  const [items, setItems] = useState<PendapatanItem[]>(getInitialPendapatanData);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PendapatanItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PendapatanItem | null>(null);

  // Form State for Add / Edit
  const [formSumber, setFormSumber] = useState('');
  const [formKategori, setFormKategori] = useState('Pendapatan Fungsional RS');
  const [formTarget, setFormTarget] = useState('');
  const [formRealisasi, setFormRealisasi] = useState('');
  const [formKode, setFormKode] = useState('4.1.04.16.01.0001');
  const [formKeterangan, setFormKeterangan] = useState('Optimal');

  // Synchronize with other components & storage
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(PENDAPATAN_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryPendapatanCache = parsed;
            setItems(parsed);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener('rsud_pendapatan_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('rsud_pendapatan_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const savePendapatanData = (updated: PendapatanItem[]) => {
    inMemoryPendapatanCache = updated;
    setItems(updated);
    try {
      localStorage.setItem(PENDAPATAN_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save pendapatan data', e);
    }
    // Sync directly to Firebase Firestore
    syncDocumentToFirestore('pendapatan_blud_data', updated);

    window.dispatchEvent(new CustomEvent('rsud_pendapatan_data_updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('rsud_data_updated'));
  };

  const submenus = [
    { id: 'fungsional_rs', label: 'Pendapatan Fungsional RS', category: 'Pendapatan Fungsional RS' },
    { id: 'rawat_inap_jalan', label: 'Pelayanan Rawat Inap & Jalan', category: 'Pendapatan Fungsional RS' },
    { id: 'kerjasama_jkn', label: 'Kerjasama Pihak Ketiga & JKN', category: 'Kerjasama Pihak Ketiga & JKN' },
    { id: 'target_realisasi_pendapatan', label: 'Target vs Realisasi Bulanan', category: 'Semua' },
    { id: 'sewa_penunjang', label: 'Sewa Lahan & Penunjang Medis', category: 'Sewa Lahan & Penunjang Medis' }
  ];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Subtab filtering
      const activeObj = submenus.find(s => s.id === currentSubTab);
      if (activeObj && activeObj.category !== 'Semua') {
        if (currentSubTab === 'rawat_inap_jalan') {
          if (!item.sumber.toLowerCase().includes('rawat')) return false;
        } else if (item.kategori !== activeObj.category) {
          return false;
        }
      }

      const matchSearch = item.sumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.kodeRekening && item.kodeRekening.includes(searchQuery));
      return matchSearch;
    });
  }, [items, currentSubTab, searchQuery]);

  const totalTarget = useMemo(() => filteredItems.reduce((acc, curr) => acc + curr.jumlahTarget, 0), [filteredItems]);
  const totalRealisasi = useMemo(() => filteredItems.reduce((acc, curr) => acc + curr.jumlahRealisasi, 0), [filteredItems]);
  const persentasePencapaian = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;

  const handleOpenAddModal = () => {
    setFormSumber('');
    setFormKategori('Pendapatan Fungsional RS');
    setFormTarget('');
    setFormRealisasi('');
    setFormKode('4.1.04.16.01.0001');
    setFormKeterangan('Optimal');
    setIsAddOpen(true);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSumber || !formTarget || !formRealisasi) return;

    const newItem: PendapatanItem = {
      id: `PEND-${Date.now().toString().slice(-4)}`,
      bulan: 'Agustus',
      tanggal: new Date().toLocaleDateString('id-ID'),
      sumber: formSumber.trim(),
      kategori: formKategori,
      kodeRekening: formKode.trim(),
      jumlahTarget: parseFloat(formTarget) || 0,
      jumlahRealisasi: parseFloat(formRealisasi) || 0,
      keterangan: formKeterangan.trim(),
      createdBy: currentUserEmail
    };

    savePendapatanData([newItem, ...items]);
    setIsAddOpen(false);
    if (onShowToast) onShowToast('Item pendapatan baru berhasil ditambahkan!', 'success');
  };

  const handleOpenEdit = (item: PendapatanItem) => {
    setEditingItem(item);
    setFormSumber(item.sumber);
    setFormKategori(item.kategori);
    setFormTarget(item.jumlahTarget.toString());
    setFormRealisasi(item.jumlahRealisasi.toString());
    setFormKode(item.kodeRekening || '4.1.04.16.01.0001');
    setFormKeterangan(item.keterangan);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !formSumber || !formTarget || !formRealisasi) return;

    const updatedList = items.map(i => {
      if (i.id === editingItem.id) {
        return {
          ...i,
          sumber: formSumber.trim(),
          kategori: formKategori,
          kodeRekening: formKode.trim(),
          jumlahTarget: parseFloat(formTarget) || 0,
          jumlahRealisasi: parseFloat(formRealisasi) || 0,
          keterangan: formKeterangan.trim()
        };
      }
      return i;
    });

    savePendapatanData(updatedList);
    setIsEditOpen(false);
    setEditingItem(null);
    if (onShowToast) onShowToast('Perubahan pendapatan berhasil disimpan!', 'success');
  };

  const handlePromptDelete = (item: PendapatanItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const deletedName = itemToDelete.sumber;
    const updated = items.filter(i => i.id !== itemToDelete.id);
    savePendapatanData(updated);
    if (onShowToast) {
      onShowToast(`Item pendapatan "${deletedName}" berhasil dihapus.`, 'info');
    }
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50/70 to-cyan-50 dark:from-teal-950 dark:via-[#061914] dark:to-emerald-950 text-slate-900 dark:text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-teal-200 dark:border-teal-900/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 text-xs font-semibold mb-2 border border-teal-300 dark:border-teal-500/30">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Sub Bagian Keuangan • Penerimaan BLUD
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Laporan Pendapatan BLUD RSUD Jatisari
          </h2>
          <p className="text-slate-600 dark:text-teal-200/80 text-xs mt-1 max-w-2xl leading-relaxed">
            Pencatatan realisasi pendapatan fungsional pelayanan kesehatan, klaim JKN BPJS, asuransi swasta, dan penunjang medis.
          </p>
        </div>

        {isPicPendapatanOrAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-teal-500/40"
          >
            <Plus className="w-4 h-4" /> Entri Penerimaan Baru
          </button>
        )}
      </div>

      {/* 2. Submenu Navigation Tabs */}
      <div className="bg-white dark:bg-[#0d1216] p-2 rounded-2xl border border-slate-200 dark:border-emerald-950/80 shadow-sm overflow-x-auto custom-scrollbar flex items-center gap-1.5">
        {submenus.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentSubTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              currentSubTab === tab.id 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Target Penerimaan</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{formatRupiah(totalTarget)}</div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-2 font-medium">Pagu Anggaran 2026</div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Realisasi Penerimaan</div>
          <div className="text-2xl font-black text-teal-700 dark:text-emerald-400 mt-2">{formatRupiah(totalRealisasi)}</div>
          <div className="text-xs text-teal-600 dark:text-emerald-400 mt-2 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Masuk Kas BLUD RSUD
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Rasio Pencapaian</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{persentasePencapaian.toFixed(1)}%</div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-2">Kinerja Keuangan Optimal</div>
        </div>
      </div>

      {/* 4. Table of Data */}
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl border border-slate-200 dark:border-emerald-950/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-emerald-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#12181f]/80">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari sumber pendapatan / rekening..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0d1216] border border-slate-200 dark:border-emerald-950/80 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {filteredItems.length} Sumber Pendapatan
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-emerald-950/80 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Sumber Pendapatan & Kode</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Target (Rp)</th>
                <th className="px-4 py-3 text-right font-bold text-teal-800 dark:text-emerald-300">Realisasi (Rp)</th>
                <th className="px-4 py-3 text-center">Capaian</th>
                <th className="px-4 py-3 text-center">Status</th>
                {isPicPendapatanOrAdmin && <th className="px-4 py-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredItems.map((item) => {
                const pct = item.jumlahTarget > 0 ? (item.jumlahRealisasi / item.jumlahTarget) * 100 : 0;
                const canModify = canModifyRecord(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-[#141c24]/80 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-zinc-100">{item.sumber}</div>
                      <div className="font-mono text-[10px] text-teal-700 dark:text-emerald-400 font-medium mt-0.5">{item.kodeRekening || '4.1.04.16.01'}</div>
                      {item.createdBy && (
                        <div className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">PIC: {item.createdBy}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">
                      <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-emerald-950/80 text-teal-800 dark:text-emerald-300 text-[10px] font-semibold border border-teal-100 dark:border-emerald-800/40">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600 dark:text-zinc-400">{formatRupiah(item.jumlahTarget)}</td>
                    <td className="px-4 py-3 text-right font-bold text-teal-700 dark:text-emerald-300">{formatRupiah(item.jumlahRealisasi)}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-zinc-300">{pct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                        {item.keterangan}
                      </span>
                    </td>
                    {isPicPendapatanOrAdmin && (
                      <td className="px-4 py-3 text-center">
                        {canModify ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 text-slate-400 hover:text-teal-600 transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePromptDelete(item)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Terkunci</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Pendapatan */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-emerald-950/80 text-slate-800 dark:text-zinc-100">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Entri Penerimaan Pendapatan BLUD</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">Tambahkan pos target dan realisasi pendapatan</p>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Nama Sumber Penerimaan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pelayanan Poliklinik Gigi & Mulut"
                  value={formSumber}
                  onChange={(e) => setFormSumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kategori</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  >
                    <option value="Pendapatan Fungsional RS">Pendapatan Fungsional RS</option>
                    <option value="Kerjasama Pihak Ketiga & JKN">Kerjasama Pihak Ketiga & JKN</option>
                    <option value="Sewa Lahan & Penunjang Medis">Sewa Lahan & Penunjang Medis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kode Rekening</label>
                  <input
                    type="text"
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Target Anggaran (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Nilai target..."
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Realisasi (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Nilai realisasi..."
                    value={formRealisasi}
                    onChange={(e) => setFormRealisasi(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Keterangan Capaian</label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                />
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
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
                >
                  Simpan Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Pendapatan */}
      {isEditOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-emerald-950/80 text-slate-800 dark:text-zinc-100">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Edit Penerimaan Pendapatan</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">Perbarui pos target atau realisasi pendapatan</p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Nama Sumber Penerimaan</label>
                <input
                  type="text"
                  required
                  value={formSumber}
                  onChange={(e) => setFormSumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kategori</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  >
                    <option value="Pendapatan Fungsional RS">Pendapatan Fungsional RS</option>
                    <option value="Kerjasama Pihak Ketiga & JKN">Kerjasama Pihak Ketiga & JKN</option>
                    <option value="Sewa Lahan & Penunjang Medis">Sewa Lahan & Penunjang Medis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kode Rekening</label>
                  <input
                    type="text"
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Target Anggaran (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Realisasi (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formRealisasi}
                    onChange={(e) => setFormRealisasi(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Keterangan Capaian</label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                />
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
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
                >
                  Perbarui Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pendapatan */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-teal-200 dark:border-teal-900/50 text-slate-800 dark:text-zinc-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Konfirmasi Hapus Pendapatan</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-teal-50/70 dark:bg-teal-950/30 p-3.5 rounded-2xl border border-teal-100 dark:border-teal-900/40 mb-5 text-xs space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white text-sm">{itemToDelete.sumber}</div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Kategori:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-100">{itemToDelete.kategori}</span>
              </div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Target:</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">{formatRupiah(itemToDelete.jumlahTarget)}</span>
              </div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Realisasi:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{formatRupiah(itemToDelete.jumlahRealisasi)}</span>
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
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus Item Pendapatan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
