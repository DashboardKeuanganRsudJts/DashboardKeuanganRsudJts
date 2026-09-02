import React, { useState, useEffect, useMemo } from 'react';
import { formatRupiah } from '../utils/formatters';
import { syncDocumentToFirestore } from '../services/firestoreSync';
import { 
  TrendingDown, 
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
  CreditCard,
  Briefcase,
  Activity,
  Filter,
  CheckSquare
} from 'lucide-react';

export interface PengeluaranItem {
  id: string;
  bulan: string;
  tanggal: string;
  uraian: string;
  kodeRekening: string;
  kategori: string;
  jumlah: number;
  penerima: string;
  status: 'Lunas' | 'Dalam Proses SPJ' | 'Draft SPP';
  createdBy?: string;
}

const INITIAL_PENGELUARAN: PengeluaranItem[] = [
  { id: 'PENG-001', bulan: 'Agustus', tanggal: '28-08-2026', uraian: 'Belanja Gaji, Tunjangan & Insentif Nakes BLUD', kodeRekening: '5.1.01.01.01.0001', kategori: 'Belanja Pegawai & Nakes', jumlah: 1850000000, penerima: 'Pegawai & Nakes RSUD', status: 'Lunas' },
  { id: 'PENG-002', bulan: 'Agustus', tanggal: '27-08-2026', uraian: 'Pengadaan Obat-obatan & Bahan Habis Pakai Medis', kodeRekening: '5.1.02.01.01.0019', kategori: 'Belanja Barang & Jasa (Obat/BMHP)', jumlah: 685000000, penerima: 'PT. Farma Medika Nusantara', status: 'Lunas' },
  { id: 'PENG-003', bulan: 'Agustus', tanggal: '25-08-2026', uraian: 'Pemeliharaan Alat Kesehatan RS & Kalibrasi', kodeRekening: '5.1.02.02.01.0025', kategori: 'Belanja Pemeliharaan & Kalibrasi', jumlah: 145000000, penerima: 'CV. Medika Teknik Utama', status: 'Lunas' },
  { id: 'PENG-004', bulan: 'Agustus', tanggal: '22-08-2026', uraian: 'Belanja Listrik PLN, PDAM, dan Internet RSUD', kodeRekening: '5.1.02.02.01.0004', kategori: 'Belanja Operasional (Listrik/Air)', jumlah: 85500000, penerima: 'PLN & PDAM Karawang', status: 'Lunas' },
  { id: 'PENG-005', bulan: 'Agustus', tanggal: '20-08-2026', uraian: 'Pengadaan Alat Penunjang Laboratorium & Radiologi', kodeRekening: '5.1.02.03.02.0001', kategori: 'Belanja Modal Alkes/Sarpras', jumlah: 218787838, penerima: 'PT. Diagnostik Sejahtera', status: 'Dalam Proses SPJ' },
  { id: 'PENG-006', bulan: 'Agustus', tanggal: '15-08-2026', uraian: 'Pengadaan Reagensia Laboratorium Cito & Strip Tes', kodeRekening: '5.1.02.01.01.0019', kategori: 'Belanja Barang & Jasa (Obat/BMHP)', jumlah: 76500000, penerima: 'PT. Anugrah Argon Medika', status: 'Lunas' },
];

interface PengeluaranBludViewProps {
  isAdmin?: boolean;
  currentUserEmail?: string;
  userRole?: string;
  selectedBulan?: string;
  activeSubmenu?: string;
  onOpenLoginModal?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

// Module-level singleton memory cache to prevent resets on tab switching
let inMemoryPengeluaranCache: PengeluaranItem[] | null = null;

const PENGELUARAN_STORAGE_KEY = 'rsud_pengeluaran_blud_data';

const getInitialPengeluaranData = (): PengeluaranItem[] => {
  if (inMemoryPengeluaranCache && inMemoryPengeluaranCache.length > 0) {
    return inMemoryPengeluaranCache;
  }
  try {
    const saved = localStorage.getItem(PENGELUARAN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryPengeluaranCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse pengeluaran data from localStorage', e);
  }
  inMemoryPengeluaranCache = INITIAL_PENGELUARAN;
  return INITIAL_PENGELUARAN;
};

export const PengeluaranBludView: React.FC<PengeluaranBludViewProps> = ({ 
  isAdmin, 
  currentUserEmail, 
  userRole, 
  selectedBulan = 'AGUSTUS',
  activeSubmenu = 'belanja_pegawai',
  onOpenLoginModal,
  onShowToast
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<string>(activeSubmenu || 'belanja_pegawai');

  // Role permissions check
  const isUserLoggedIn = Boolean(currentUserEmail);
  const isSuperAdmin = isUserLoggedIn && ((userRole === 'admin') || Boolean(isAdmin));
  const isPicPengeluaranOrAdmin = isUserLoggedIn && (isSuperAdmin || (userRole === 'pic_pengeluaran'));

  const canModifyRecord = (record: any) => {
    if (!isUserLoggedIn) return false;
    if (isSuperAdmin) return true;
    if (userRole === 'pic_pengeluaran') {
      if (!record?.createdBy || record?.createdBy === currentUserEmail) return true;
    }
    return false;
  };

  useEffect(() => {
    if (activeSubmenu) {
      setCurrentSubTab(activeSubmenu);
    }
  }, [activeSubmenu]);

  const [items, setItems] = useState<PengeluaranItem[]>(getInitialPengeluaranData);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PengeluaranItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PengeluaranItem | null>(null);

  // Form states
  const [formUraian, setFormUraian] = useState('');
  const [formKategori, setFormKategori] = useState('Belanja Pegawai & Nakes');
  const [formKode, setFormKode] = useState('5.1.01.01.01.0001');
  const [formJumlah, setFormJumlah] = useState('');
  const [formPenerima, setFormPenerima] = useState('');
  const [formStatus, setFormStatus] = useState<'Lunas' | 'Dalam Proses SPJ' | 'Draft SPP'>('Lunas');

  // Synchronize with other components & storage
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(PENGELUARAN_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryPengeluaranCache = parsed;
            setItems(parsed);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener('rsud_pengeluaran_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('rsud_pengeluaran_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const savePengeluaranData = (updated: PengeluaranItem[]) => {
    inMemoryPengeluaranCache = updated;
    setItems(updated);
    try {
      localStorage.setItem(PENGELUARAN_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save pengeluaran data', e);
    }
    // Sync directly to Firebase Firestore
    syncDocumentToFirestore('pengeluaran_blud_data', updated);

    window.dispatchEvent(new CustomEvent('rsud_pengeluaran_data_updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('rsud_data_updated'));
  };

  const submenus = [
    { id: 'belanja_pegawai', label: 'Belanja Pegawai & Nakes', category: 'Belanja Pegawai & Nakes' },
    { id: 'belanja_barang_jasa', label: 'Belanja Barang & Jasa (Obat/BMHP)', category: 'Belanja Barang & Jasa (Obat/BMHP)' },
    { id: 'belanja_pemeliharaan', label: 'Belanja Pemeliharaan & Kalibrasi', category: 'Belanja Pemeliharaan & Kalibrasi' },
    { id: 'belanja_operasional', label: 'Belanja Operasional (Listrik/Air)', category: 'Belanja Operasional (Listrik/Air)' },
    { id: 'belanja_modal', label: 'Belanja Modal Alkes/Sarpras', category: 'Belanja Modal Alkes/Sarpras' },
    { id: 'rekap_spj', label: 'Rekap SPJ & Realisasi Belanja', category: 'Semua' }
  ];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const activeObj = submenus.find(s => s.id === currentSubTab);
      if (activeObj && activeObj.category !== 'Semua') {
        if (item.kategori !== activeObj.category) return false;
      }

      const matchSearch = item.uraian.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.penerima.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.kodeRekening.includes(searchQuery);
      return matchSearch;
    });
  }, [items, currentSubTab, searchQuery]);

  const totalPengeluaran = useMemo(() => filteredItems.reduce((acc, curr) => acc + curr.jumlah, 0), [filteredItems]);
  const totalLunas = useMemo(() => filteredItems.filter(i => i.status === 'Lunas').reduce((acc, curr) => acc + curr.jumlah, 0), [filteredItems]);

  const handleOpenAdd = () => {
    setFormUraian('');
    setFormKategori('Belanja Pegawai & Nakes');
    setFormKode('5.1.01.01.01.0001');
    setFormJumlah('');
    setFormPenerima('');
    setFormStatus('Lunas');
    setIsAddOpen(true);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUraian || !formJumlah || !formPenerima) return;

    const newItem: PengeluaranItem = {
      id: `PENG-${Date.now().toString().slice(-4)}`,
      bulan: 'Agustus',
      tanggal: new Date().toLocaleDateString('id-ID'),
      uraian: formUraian.trim(),
      kodeRekening: formKode.trim(),
      kategori: formKategori,
      jumlah: parseFloat(formJumlah) || 0,
      penerima: formPenerima.trim(),
      status: formStatus,
      createdBy: currentUserEmail
    };

    savePengeluaranData([newItem, ...items]);
    setIsAddOpen(false);
    if (onShowToast) onShowToast('Pos pengeluaran belanja berhasil ditambahkan!', 'success');
  };

  const handleOpenEdit = (item: PengeluaranItem) => {
    setEditingItem(item);
    setFormUraian(item.uraian);
    setFormKategori(item.kategori);
    setFormKode(item.kodeRekening);
    setFormJumlah(item.jumlah.toString());
    setFormPenerima(item.penerima);
    setFormStatus(item.status);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !formUraian || !formJumlah || !formPenerima) return;

    const updated = items.map(i => {
      if (i.id === editingItem.id) {
        return {
          ...i,
          uraian: formUraian.trim(),
          kodeRekening: formKode.trim(),
          kategori: formKategori,
          jumlah: parseFloat(formJumlah) || 0,
          penerima: formPenerima.trim(),
          status: formStatus
        };
      }
      return i;
    });

    savePengeluaranData(updated);
    setIsEditOpen(false);
    setEditingItem(null);
    if (onShowToast) onShowToast('Perubahan pos belanja berhasil disimpan!', 'success');
  };

  const handlePromptDelete = (item: PengeluaranItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const deletedName = itemToDelete.uraian;
    const updated = items.filter(i => i.id !== itemToDelete.id);
    savePengeluaranData(updated);
    if (onShowToast) {
      onShowToast(`Pos belanja "${deletedName}" berhasil dihapus.`, 'info');
    }
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-red-50/70 to-pink-50 dark:from-slate-950 dark:via-[#1a0a0f] dark:to-rose-950 text-slate-900 dark:text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-rose-200 dark:border-rose-900/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 text-xs font-semibold mb-2 border border-rose-300 dark:border-rose-500/30">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Sub Bagian Keuangan • Pengeluaran Belanja BLUD
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Laporan Pengeluaran BLUD RSUD Jatisari
          </h2>
          <p className="text-slate-600 dark:text-rose-200/80 text-xs mt-1 max-w-2xl leading-relaxed">
            Realisasi pengeluaran kas belanja pegawai, obat-obatan/BMHP, utilitas operasional, dan belanja modal alkes.
          </p>
        </div>

        {isPicPengeluaranOrAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-rose-500/40"
          >
            <Plus className="w-4 h-4" /> Entri Pengeluaran Baru
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
                ? 'bg-rose-600 text-white shadow-sm' 
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
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Realisasi Belanja</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{formatRupiah(totalPengeluaran)}</div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-2 font-medium">Beban Kas BLUD 2026</div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Belanja Terbayar (SPJ Lunas)</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{formatRupiah(totalLunas)}</div>
          <div className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> SP2D Kasda / BKU Selesai
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Pos Transaksi</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{filteredItems.length} Transaksi</div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-2">Tertib Administrasi SPJ</div>
        </div>
      </div>

      {/* 4. Table of Data */}
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl border border-slate-200 dark:border-emerald-950/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-emerald-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#12181f]/80">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari uraian / penerima / kode rekening..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0d1216] border border-slate-200 dark:border-emerald-950/80 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {filteredItems.length} Pos Belanja
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-emerald-950/80 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Uraian Belanja & Kode</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Penerima / Rekanan</th>
                <th className="px-4 py-3 text-right font-bold text-rose-700 dark:text-rose-300">Jumlah (Rp)</th>
                <th className="px-4 py-3 text-center">Status SPJ</th>
                {isPicPengeluaranOrAdmin && <th className="px-4 py-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredItems.map((item) => {
                const canModify = canModifyRecord(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-[#141c24]/80 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-zinc-100">{item.uraian}</div>
                      <div className="font-mono text-[10px] text-rose-700 dark:text-rose-400 font-medium mt-0.5">{item.kodeRekening}</div>
                      {item.createdBy && (
                        <div className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">PIC: {item.createdBy}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-semibold border border-rose-100 dark:border-rose-800/40">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-zinc-200 font-medium">{item.penerima}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-700 dark:text-rose-300">{formatRupiah(item.jumlah)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === 'Lunas' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    {isPicPengeluaranOrAdmin && (
                      <td className="px-4 py-3 text-center">
                        {canModify ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
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

      {/* Modal Add Pengeluaran */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-emerald-950/80 text-slate-800 dark:text-zinc-100">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Entri Pengeluaran Belanja BLUD</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">Catat realisasi pembayaran kas operasional RSUD</p>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Uraian Belanja</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Belanja Obat Generik & BMHP Farmasi"
                  value={formUraian}
                  onChange={(e) => setFormUraian(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kategori Belanja</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  >
                    <option value="Belanja Pegawai & Nakes">Belanja Pegawai & Nakes</option>
                    <option value="Belanja Barang & Jasa (Obat/BMHP)">Belanja Barang & Jasa (Obat/BMHP)</option>
                    <option value="Belanja Pemeliharaan & Kalibrasi">Belanja Pemeliharaan & Kalibrasi</option>
                    <option value="Belanja Operasional (Listrik/Air)">Belanja Operasional (Listrik/Air)</option>
                    <option value="Belanja Modal Alkes/Sarpras">Belanja Modal Alkes/Sarpras</option>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Penerima / Rekanan</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama penerima..."
                    value={formPenerima}
                    onChange={(e) => setFormPenerima(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Jumlah Belanja (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Nilai belanja..."
                    value={formJumlah}
                    onChange={(e) => setFormJumlah(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Status SPJ</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                >
                  <option value="Lunas">Lunas (SP2D Terbit)</option>
                  <option value="Dalam Proses SPJ">Dalam Proses SPJ</option>
                  <option value="Draft SPP">Draft SPP</option>
                </select>
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
                >
                  Simpan Belanja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Pengeluaran */}
      {isEditOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-emerald-950/80 text-slate-800 dark:text-zinc-100">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Edit Pengeluaran Belanja BLUD</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">Perbarui pos pengeluaran kas belanja</p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Uraian Belanja</label>
                <input
                  type="text"
                  required
                  value={formUraian}
                  onChange={(e) => setFormUraian(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kategori Belanja</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  >
                    <option value="Belanja Pegawai & Nakes">Belanja Pegawai & Nakes</option>
                    <option value="Belanja Barang & Jasa (Obat/BMHP)">Belanja Barang & Jasa (Obat/BMHP)</option>
                    <option value="Belanja Pemeliharaan & Kalibrasi">Belanja Pemeliharaan & Kalibrasi</option>
                    <option value="Belanja Operasional (Listrik/Air)">Belanja Operasional (Listrik/Air)</option>
                    <option value="Belanja Modal Alkes/Sarpras">Belanja Modal Alkes/Sarpras</option>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Penerima / Rekanan</label>
                  <input
                    type="text"
                    required
                    value={formPenerima}
                    onChange={(e) => setFormPenerima(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Jumlah Belanja (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formJumlah}
                    onChange={(e) => setFormJumlah(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Status SPJ</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                >
                  <option value="Lunas">Lunas (SP2D Terbit)</option>
                  <option value="Dalam Proses SPJ">Dalam Proses SPJ</option>
                  <option value="Draft SPP">Draft SPP</option>
                </select>
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
                >
                  Perbarui Belanja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pengeluaran */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-zinc-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Konfirmasi Hapus Pengeluaran</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/40 mb-5 text-xs space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white text-sm">{itemToDelete.uraian}</div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Penerima:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-100">{itemToDelete.penerima}</span>
              </div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Nominal:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{formatRupiah(itemToDelete.jumlah)}</span>
              </div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Status SPJ:</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">{itemToDelete.status}</span>
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
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus Pos Belanja
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
