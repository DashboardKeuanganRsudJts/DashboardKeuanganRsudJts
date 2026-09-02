import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Download,
  Plus,
  Upload,
  Sparkles,
  ExternalLink,
  Table as TableIcon,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { CoretaxPPNRecord, DataHutangRecord, LinkedMonitoringItem } from '../types/ppn';
import { initialCoretaxData, initialHutangData } from '../data/ppnInitialData';
import {
  reconcileData,
  calculateMonthlySummaries,
  calculateOverallStats,
  findDiscrepancies,
} from '../utils/reconciliation';
import { syncHutangFromGoogleSheets, DEFAULT_GOOGLE_SHEETS_URL } from '../utils/googleSheetsSync';
import { exportMonitoringToExcel } from '../utils/ppnExcelHelper';

import { KPICards } from './ppn/KPICards';
import { MonthlyMonitoringTable } from './ppn/MonthlyMonitoringTable';
import { MonitoringTable } from './ppn/MonitoringTable';
import { CoretaxDataView } from './ppn/CoretaxDataView';
import { HutangDataView } from './ppn/HutangDataView';
import { DiscrepancyAuditView } from './ppn/DiscrepancyAuditView';
import { DetailModal } from './ppn/DetailModal';
import { AddRecordModal } from './ppn/AddRecordModal';
import { ImportModal } from './ppn/ImportModal';

interface MonitoringPpnViewProps {
  user?: any;
  role?: string;
  isAdmin?: boolean;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeSubmenu?: string | null;
}

export const MonitoringPpnView: React.FC<MonitoringPpnViewProps> = ({
  user,
  role,
  isAdmin,
  onShowToast,
  activeSubmenu,
}) => {
  const isUserLoggedIn = Boolean(user);
  const isSuperAdmin = isUserLoggedIn && ((role === 'admin') || Boolean(isAdmin));
  const isPicPajakOrHutangOrAdmin = isUserLoggedIn && (isSuperAdmin || (role === 'pic_pajak') || (role === 'pic_hutang'));

  // State for data
  const [coretaxData, setCoretaxData] = useState<CoretaxPPNRecord[]>(() => {
    const saved = localStorage.getItem('rsud_ppn_coretax_data_2026');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialCoretaxData;
  });

  const [hutangData, setHutangData] = useState<DataHutangRecord[]>(() => {
    const saved = localStorage.getItem('rsud_ppn_hutang_data_2026');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialHutangData;
  });

  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('rsud_ppn_sheet_url_2026') || DEFAULT_GOOGLE_SHEETS_URL;
  });

  // UI state
  const activeTab = (activeSubmenu as 'monitoring' | 'coretax' | 'hutang' | 'audit') || 'monitoring';
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>(() => {
    return localStorage.getItem('rsud_ppn_last_synced') || undefined;
  });

  // Modals state
  const [detailItem, setDetailItem] = useState<LinkedMonitoringItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'coretax' | 'hutang'>('coretax');
  const [editItem, setEditItem] = useState<CoretaxPPNRecord | DataHutangRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importModalType, setImportModalType] = useState<'coretax' | 'hutang'>('coretax');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('rsud_ppn_coretax_data_2026', JSON.stringify(coretaxData));
  }, [coretaxData]);

  useEffect(() => {
    localStorage.setItem('rsud_ppn_hutang_data_2026', JSON.stringify(hutangData));
  }, [hutangData]);

  useEffect(() => {
    localStorage.setItem('rsud_ppn_sheet_url_2026', sheetUrl);
  }, [sheetUrl]);

  // Reconciled Data & Analytics
  const reconciliationResult = useMemo(() => {
    return reconcileData(coretaxData, hutangData);
  }, [coretaxData, hutangData]);

  const linkedItems = reconciliationResult.linkedItems;
  const monthlySummaries = reconciliationResult.monthlySummaries;
  const overallStats = reconciliationResult.overallStats;
  const unlinkedHutang = reconciliationResult.hutangWithoutFaktur;

  const discrepancies = useMemo(() => {
    return findDiscrepancies(linkedItems);
  }, [linkedItems]);

  const unlinkedCoretax = useMemo(() => {
    return linkedItems.filter(
      (it) => it.status === 'TIDAK_DITEMUKAN_DI_HUTANG' || it.status === 'INVOICE_KOSONG'
    );
  }, [linkedItems]);

  // Google Sheets Auto/Manual Sync
  const handleGoogleSheetsSync = async (customUrl?: string) => {
    setIsSyncing(true);
    try {
      const urlToUse = customUrl || sheetUrl;
      const fetchedRecords = await syncHutangFromGoogleSheets(urlToUse);
      if (fetchedRecords.length > 0) {
        setHutangData(fetchedRecords);
        const now = new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        setLastSyncedAt(now);
        localStorage.setItem('rsud_ppn_last_synced', now);
      }
    } catch (err) {
      console.error('Failed to sync Google Sheets', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Export
  const handleExportExcel = () => {
    exportMonitoringToExcel(linkedItems, monthlySummaries);
  };

  // Handlers for Coretax CRUD
  const handleSaveCoretax = (record: CoretaxPPNRecord) => {
    setCoretaxData((prev) => {
      const idx = prev.findIndex((i) => i.id === record.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [record, ...prev];
    });
  };

  const handleDeleteCoretax = (id: string) => {
    if (window.confirm('Hapus baris faktur Coretax ini?')) {
      setCoretaxData((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // Handlers for Hutang CRUD
  const handleSaveHutang = (record: DataHutangRecord) => {
    setHutangData((prev) => {
      const idx = prev.findIndex((i) => i.id === record.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [record, ...prev];
    });
  };

  const handleDeleteHutang = (id: string) => {
    if (window.confirm('Hapus baris data hutang ini?')) {
      setHutangData((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // Imports
  const handleImportCoretax = (newRecords: CoretaxPPNRecord[]) => {
    setCoretaxData((prev) => [...newRecords, ...prev]);
  };

  const handleImportHutang = (newRecords: DataHutangRecord[]) => {
    setHutangData((prev) => [...newRecords, ...prev]);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner Navigation & App Bar */}
      <div className="bg-white dark:bg-[#0f1418] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-md p-5 sm:p-6 overflow-hidden relative">
        <div className="h-1.5 absolute top-0 left-0 right-0 bg-gradient-to-r from-rose-500 via-orange-400 via-amber-400 via-lime-500 via-emerald-500 via-cyan-400 via-blue-500 to-purple-500"></div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Left Title & Identity */}
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  MONITORING PPN 2026
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-indigo-500/20 text-slate-800 dark:text-zinc-200 font-extrabold border border-slate-300 dark:border-zinc-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Coretax DJP & Data Hutang RSUD Jatisari
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Sistem Rekonsiliasi Otomatis & Pelacakan Status Pelunasan SP2D Faktur Pajak Tahun Anggaran 2026
              </p>
            </div>
          </div>

          {/* Right Master Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sync Google Sheets */}
            {isPicPajakOrHutangOrAdmin && (
              <button
                onClick={() => handleGoogleSheetsSync()}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                title="Sinkronisasi Data Hutang Real-time dari Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sync Google Sheets'}</span>
              </button>
            )}

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Unduh Laporan Excel Lengkap Rekonsiliasi & Rekap Bulanan"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Laporan Excel</span>
            </button>

            {/* Quick Upload */}
            {isPicPajakOrHutangOrAdmin && (
              <>
                <button
                  onClick={() => {
                    setImportModalType('coretax');
                    setIsImportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-all hover:scale-[1.02]"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Upload Data</span>
                </button>

                {/* Quick Add */}
                <button
                  onClick={() => {
                    setEditItem(null);
                    setAddModalType(activeTab === 'hutang' ? 'hutang' : 'coretax');
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span>Tambah Faktur</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Top KPI Cards (Coretax Master Truth & Status Hutang) */}
          <KPICards
            stats={overallStats}
            onFilterStatus={(statusKey) => {
              setStatusFilter(statusKey);
              // Scroll to table smoothly
              const el = document.getElementById('monitoring-table-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* 12-Month Rainbow Spectrum Table */}
          <MonthlyMonitoringTable
            summaries={monthlySummaries}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />

          {/* Reconciled Search & Filtering Table */}
          <div id="monitoring-table-section">
            <MonitoringTable
              items={linkedItems}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onViewDetail={(item) => setDetailItem(item)}
            />
          </div>
        </div>
      )}

      {activeTab === 'coretax' && (
        <CoretaxDataView
          data={coretaxData}
          canEdit={isPicPajakOrHutangOrAdmin}
          onAddRecord={() => {
            setEditItem(null);
            setAddModalType('coretax');
            setIsAddModalOpen(true);
          }}
          onEditRecord={(record) => {
            setEditItem(record);
            setAddModalType('coretax');
            setIsAddModalOpen(true);
          }}
          onDeleteRecord={handleDeleteCoretax}
          onOpenUpload={() => {
            setImportModalType('coretax');
            setIsImportModalOpen(true);
          }}
        />
      )}

      {activeTab === 'hutang' && (
        <HutangDataView
          data={hutangData}
          canEdit={isPicPajakOrHutangOrAdmin}
          onAddRecord={() => {
            setEditItem(null);
            setAddModalType('hutang');
            setIsAddModalOpen(true);
          }}
          onEditRecord={(record) => {
            setEditItem(record);
            setAddModalType('hutang');
            setIsAddModalOpen(true);
          }}
          onDeleteRecord={handleDeleteHutang}
          onOpenUpload={() => {
            setImportModalType('hutang');
            setIsImportModalOpen(true);
          }}
          onSyncGoogleSheets={() => handleGoogleSheetsSync()}
          isSyncing={isSyncing}
          lastSyncedAt={lastSyncedAt}
          sheetUrl={sheetUrl}
          onUpdateSheetUrl={(newUrl) => {
            setSheetUrl(newUrl);
            handleGoogleSheetsSync(newUrl);
          }}
        />
      )}

      {activeTab === 'audit' && (
        <DiscrepancyAuditView
          discrepancies={discrepancies}
          unlinkedCoretax={unlinkedCoretax}
          unlinkedHutang={unlinkedHutang}
          onViewDetail={(item) => setDetailItem(item)}
        />
      )}

      {/* Modals */}
      <DetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />

      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        type={addModalType}
        editItem={editItem}
        onSaveCoretax={handleSaveCoretax}
        onSaveHutang={handleSaveHutang}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type={importModalType}
        onImportCoretax={handleImportCoretax}
        onImportHutang={handleImportHutang}
      />
    </div>
  );
};
