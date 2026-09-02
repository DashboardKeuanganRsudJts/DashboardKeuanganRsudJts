import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  SEMUA_REKAPAN_REAL_GROUPS, 
  SemuaRekapanRow, 
  SemuaRekapanGroup 
} from '../data/spreadsheetData2026';
import { syncSemuaRekapanFromSources } from '../services/rekapanSyncService';
import { syncDocumentToFirestore } from '../services/firestoreSync';
import { formatRupiah } from '../utils/formatters';
import { 
  Layers, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  Building,
  DollarSign,
  TrendingUp,
  UploadCloud,
  Edit2,
  X,
  Save
} from 'lucide-react';

interface SemuaRekapanViewProps { 
  isAdmin?: boolean;
  currentUserEmail?: string;
  userRole?: string;
  selectedBulan?: string;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
  onOpenUploadModal?: () => void;
}

export const SemuaRekapanView: React.FC<SemuaRekapanViewProps> = ({ 
  isAdmin, 
  currentUserEmail, 
  userRole, 
  selectedBulan,
  onShowToast, 
  onOpenUploadModal 
}) => {
  const [selectedBulanGroup, setSelectedBulanGroup] = useState<string>('AGUSTUS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  const [editingRow, setEditingRow] = useState<SemuaRekapanRow | null>(null);
  const [editForm, setEditForm] = useState<Partial<SemuaRekapanRow>>({});

  const BULAN_LIST = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];

  const [rekapanGroups, setRekapanGroups] = useState<Record<string, SemuaRekapanGroup>>(() => {
    try {
      return syncSemuaRekapanFromSources();
    } catch (e) {
      console.warn('Error initial sync:', e);
      return SEMUA_REKAPAN_REAL_GROUPS;
    }
  });

  useEffect(() => {
    if (selectedBulan && selectedBulan !== 'Semua Bulan') {
      const upper = selectedBulan.toUpperCase();
      if (BULAN_LIST.includes(upper)) {
        setSelectedBulanGroup(upper);
      }
    }
  }, [selectedBulan]);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const synced = syncSemuaRekapanFromSources();
        setRekapanGroups(synced);
      } catch (e) {
        console.warn('Error on sync update:', e);
      }
    };

    // Run initial sync check
    handleUpdate();

    window.addEventListener('rsud_semua_rekapan_updated', handleUpdate);
    window.addEventListener('rsud_perusahaan_data_updated', handleUpdate);
    window.addEventListener('rsud_listrik_data_updated', handleUpdate);
    window.addEventListener('rsud_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('rsud_semua_rekapan_updated', handleUpdate);
      window.removeEventListener('rsud_perusahaan_data_updated', handleUpdate);
      window.removeEventListener('rsud_listrik_data_updated', handleUpdate);
      window.removeEventListener('rsud_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleResetToMaster = () => {
    try {
      localStorage.setItem('rsud_semua_rekapan_2026', JSON.stringify(SEMUA_REKAPAN_REAL_GROUPS));
      const resynced = syncSemuaRekapanFromSources();
      setRekapanGroups(resynced);
      window.dispatchEvent(new Event('rsud_semua_rekapan_updated'));
      if (onShowToast) onShowToast('Data Semua Rekapan berhasil diperbarui ke data master dan disinkronkan.', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const currentGroup: SemuaRekapanGroup = rekapanGroups[selectedBulanGroup] || rekapanGroups['AGUSTUS'] || SEMUA_REKAPAN_REAL_GROUPS['AGUSTUS'];

  // Filter rows
  const filteredRows = useMemo(() => {
    return currentGroup.rows.filter(row => {
      const matchSearch = searchQuery === '' || 
        row.namaPenjamin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.keterangan.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'Semua' || row.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [currentGroup, searchQuery, statusFilter]);

  const handleExportExcel = () => {
    const headers = [
      'Grup Bulan',
      'No',
      'Nama Penjamin',
      'Piutang Bulan Lalu / Tahun Lalu (Rp)',
      'Piutang Bulan Ini (Rp)',
      'Piutang s.d Bulan Ini (Rp)',
      'Pembayaran (Rp)',
      'Sisa Piutang (Rp)',
      'Status',
      'Keterangan'
    ];

    const rows = filteredRows.map(r => [
      r.bulan,
      r.no,
      r.namaPenjamin,
      r.piutangBulanLalu,
      r.piutangBulanIni,
      r.piutangSdBulanIni,
      r.pembayaran,
      r.sisaPiutang,
      r.status,
      r.keterangan
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Semua Rekapan");
    XLSX.writeFile(wb, `Semua_Rekapan_Piutang_${selectedBulanGroup}_2026.xlsx`);

    if (onShowToast) onShowToast('File Excel Semua Rekapan berhasil diunduh.', 'success');
  };

  const handleEditClick = (row: SemuaRekapanRow) => {
    setEditingRow(row);
    setEditForm({ ...row });
  };

  const handleSaveEdit = () => {
    if (!editingRow) return;
    
    // Calculate dependent values
    const piutangBulanLalu = editForm.piutangBulanLalu || 0;
    const piutangBulanIni = editForm.piutangBulanIni || 0;
    const piutangSdBulanIni = piutangBulanLalu + piutangBulanIni;
    const pembayaran = editForm.pembayaran || 0;
    const sisaPiutang = piutangSdBulanIni - pembayaran;
    const status = sisaPiutang <= 0 ? 'Lunas' : 'Belum Lunas';

    const updatedRow: SemuaRekapanRow = {
      ...editingRow,
      ...editForm,
      piutangBulanLalu,
      piutangBulanIni,
      piutangSdBulanIni,
      pembayaran,
      sisaPiutang,
      status
    };

    const updatedGroups = { ...rekapanGroups };
    const group = updatedGroups[selectedBulanGroup];
    if (group) {
      const rowIndex = group.rows.findIndex(r => r.no === editingRow.no);
      if (rowIndex !== -1) {
        group.rows[rowIndex] = updatedRow;
        
        // Recalculate group totals
        group.totalPiutangSdBulanIni = group.rows.reduce((sum, r) => sum + r.piutangSdBulanIni, 0);
        group.totalPembayaran = group.rows.reduce((sum, r) => sum + r.pembayaran, 0);
        group.totalSisaPiutang = group.rows.reduce((sum, r) => sum + r.sisaPiutang, 0);
      }
    }

    setRekapanGroups(updatedGroups);
    localStorage.setItem('rsud_semua_rekapan_2026', JSON.stringify(updatedGroups));
    syncDocumentToFirestore('semua_rekapan_2026', updatedGroups);
    window.dispatchEvent(new Event('rsud_semua_rekapan_updated'));
    
    setEditingRow(null);
    setEditForm({});
    if (onShowToast) onShowToast('Data berhasil diperbarui.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const isUserLoggedIn = Boolean(currentUserEmail);
  const isSuperAdmin = isUserLoggedIn && (Boolean(isAdmin) || userRole === 'admin');
  const isPicPiutangOrAdmin = isUserLoggedIn && (isSuperAdmin || userRole === 'pic_piutang');

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Group Selector Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-teal-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Sheet: Semua_Rekapan</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Semua Rekapan Piutang Pelayanan RSUD 2026
            </h1>
            <p className="text-xs text-teal-100/80 mt-1">
              Rekapitulasi 10 kelompok penjamin: BPJS, Kemenkes, Karawang Sehat, Global Fund, Skrining TB/TCM, Perusahaan & Asuransi, Sewa Lahan, dan Utilitas Listrik.
            </p>
          </div>

          {/* Month Group Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-xs border border-white/10 max-w-full">
            <span className="text-xs font-bold text-teal-200 shrink-0">Pilih Bulan:</span>
            <div className="flex flex-wrap gap-1 max-w-full">
              {BULAN_LIST.map((b) => (
                <button
                  key={`rekapan-group-btn-${b}`}
                  onClick={() => setSelectedBulanGroup(b)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    selectedBulanGroup === b
                      ? 'bg-teal-600 text-white shadow-sm ring-1 ring-white/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {b.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Group Total KPI Banner - Exact matching Screenshot 4 */}
      <div className="bg-teal-900 text-white rounded-xl p-4 shadow-sm border border-teal-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wider bg-teal-800 px-3 py-1.5 rounded-lg border border-teal-700">
              GRUP BULAN: {selectedBulanGroup} 2026
            </span>
            {isAdmin && (
              <button
                onClick={handleResetToMaster}
                title="Perbarui / Muat Ulang Data 12 Bulan"
                className="text-[11px] font-medium text-teal-300 hover:text-white bg-teal-800/60 hover:bg-teal-800 px-2.5 py-1 rounded-md border border-teal-700/60 transition"
              >
                Sinkronkan Data Master
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 text-right">
            <div>
              <div className="text-[11px] text-teal-200 font-semibold uppercase">Piutang S/D Bulan Ini</div>
              <div className="text-lg md:text-xl font-extrabold font-mono text-white">
                {formatRupiah(currentGroup.totalPiutangSdBulanIni)}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-teal-200 font-semibold uppercase">Pembayaran</div>
              <div className="text-lg md:text-xl font-extrabold font-mono text-emerald-300">
                {formatRupiah(currentGroup.totalPembayaran)}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-teal-200 font-semibold uppercase">Sisa Piutang</div>
              <div className="text-lg md:text-xl font-extrabold font-mono text-rose-300">
                {formatRupiah(currentGroup.totalSisaPiutang)}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="bg-white dark:bg-[#0d1216] rounded-xl border border-slate-200 dark:border-emerald-950/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama penjamin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12181f] text-slate-800 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Opsi Pilih Bulan Dropdown */}
          <div className="flex items-center gap-1.5 bg-teal-50/80 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800/60">
            <Calendar className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" />
            <span className="text-xs text-teal-950 dark:text-teal-200 font-bold">Pilih Bulan:</span>
            <select
              value={selectedBulanGroup}
              onChange={(e) => setSelectedBulanGroup(e.target.value)}
              className="bg-white dark:bg-[#12181f] rounded-md border border-teal-300 dark:border-teal-800 px-2.5 py-1 text-xs text-teal-900 dark:text-teal-200 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
            >
              {BULAN_LIST.map((b) => (
                <option key={`opt-bulan-${b}`} value={b}>
                  {b} 2026
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12181f] px-2.5 py-1.5 text-xs text-slate-700 dark:text-zinc-200 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="Semua">Semua Status ({currentGroup.rows.length})</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </select>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* 4. Table Rekapan Per Bulan - Exact Format Screenshot 4 */}
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl border border-slate-200 dark:border-emerald-950/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-teal-900 text-white font-semibold border-b border-teal-800">
                <th className="py-2.5 px-3">Bulan</th>
                <th className="py-2.5 px-2 text-center">No</th>
                <th className="py-2.5 px-3">Nama Penjamin</th>
                <th className="py-2.5 px-3 text-right" style={{ width: '145.453px' }}>Piutang Bulan Lalu / Tahun Lalu</th>
                <th className="py-2.5 px-3 text-right">Piutang Bulan Ini</th>
                <th className="py-2.5 px-3 text-right font-bold">Piutang s.d Bulan Ini</th>
                <th className="py-2.5 px-3 text-right">Pembayaran</th>
                <th className="py-2.5 px-3 text-right font-bold">Sisa Piutang</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Keterangan</th>
                {isPicPiutangOrAdmin && (
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={isPicPiutangOrAdmin ? 11 : 10} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                    Tidak ada data rekapan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isEditing = editingRow?.no === row.no;
                  
                  return (
                  <tr 
                    key={`rekapan-row-${row.bulan}-${row.no}-${row.namaPenjamin}-${idx}`}
                    className={`hover:bg-slate-50/80 dark:hover:bg-[#141c24]/80 transition ${
                      row.sisaPiutang > 0 ? 'bg-rose-50/20 dark:bg-rose-950/20' : ''
                    } ${isEditing ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                      {row.bulan}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-500 dark:text-zinc-400 font-mono">
                      {row.no}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-zinc-100">
                      {row.namaPenjamin}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-zinc-300">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.piutangBulanLalu ?? 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, piutangBulanLalu: parseFloat(e.target.value) || 0 }))}
                          className="w-full min-w-[120px] text-right px-2 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-zinc-100"
                        />
                      ) : (
                        formatRupiah(row.piutangBulanLalu)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-900 dark:text-blue-300 font-medium">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.piutangBulanIni ?? 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, piutangBulanIni: parseFloat(e.target.value) || 0 }))}
                          className="w-full min-w-[120px] text-right px-2 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-zinc-100"
                        />
                      ) : (
                        formatRupiah(row.piutangBulanIni)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                      {isEditing ? (
                        formatRupiah((editForm.piutangBulanLalu || 0) + (editForm.piutangBulanIni || 0))
                      ) : (
                        formatRupiah(row.piutangSdBulanIni)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.pembayaran ?? 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, pembayaran: parseFloat(e.target.value) || 0 }))}
                          className="w-full min-w-[120px] text-right px-2 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-zinc-100"
                        />
                      ) : (
                        formatRupiah(row.pembayaran)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                      {isEditing ? (
                        formatRupiah(((editForm.piutangBulanLalu || 0) + (editForm.piutangBulanIni || 0)) - (editForm.pembayaran || 0))
                      ) : (
                        formatRupiah(row.sisaPiutang)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          (((editForm.piutangBulanLalu || 0) + (editForm.piutangBulanIni || 0)) - (editForm.pembayaran || 0)) <= 0
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200'
                        }`}>
                          {(((editForm.piutangBulanLalu || 0) + (editForm.piutangBulanIni || 0)) - (editForm.pembayaran || 0)) <= 0 ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          row.status === 'Lunas'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                        }`}>
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 text-[11px] max-w-xs truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.keterangan || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, keterangan: e.target.value }))}
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-zinc-100"
                        />
                      ) : (
                        row.keterangan || '-'
                      )}
                    </td>
                    {isPicPiutangOrAdmin && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 rounded bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800/60 transition"
                              title="Simpan"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingRow(null); setEditForm({}); }}
                              className="p-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(row)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 dark:bg-[#12181f] font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-zinc-800">
              <tr>
                <td colSpan={3} className="py-3 px-3 text-right uppercase text-slate-700 dark:text-zinc-300">
                  Total Grup {selectedBulanGroup}:
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-800 dark:text-zinc-200">
                  {formatRupiah(filteredRows.reduce((s, r) => s + r.piutangBulanLalu, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-blue-900 dark:text-blue-300">
                  {formatRupiah(filteredRows.reduce((s, r) => s + r.piutangBulanIni, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatRupiah(filteredRows.reduce((s, r) => s + r.piutangSdBulanIni, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-800 dark:text-emerald-400">
                  {formatRupiah(filteredRows.reduce((s, r) => s + r.pembayaran, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-800 dark:text-rose-400">
                  {formatRupiah(filteredRows.reduce((s, r) => s + r.sisaPiutang, 0))}
                </td>
                <td colSpan={isPicPiutangOrAdmin ? 3 : 2} className="py-3 px-3 text-center text-xs text-slate-500 dark:text-zinc-400">
                  {filteredRows.filter(r => r.status === 'Belum Lunas').length} Belum Lunas
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
