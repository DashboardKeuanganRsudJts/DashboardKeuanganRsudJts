import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { AddEditPiutangModal } from './components/AddEditPiutangModal';
import { UploadSpreadsheetModal } from './components/UploadSpreadsheetModal';
import { SettingsModal } from './components/SettingsModal';
import { PerusahaanAsuransiView } from './components/PerusahaanAsuransiView';
import { ListrikKantinView } from './components/ListrikKantinView';
import { SemuaRekapanView } from './components/SemuaRekapanView';
import { Dashboard2026View } from './components/Dashboard2026View';
import { PengeluaranBludView } from './components/PengeluaranBludView';
import { PendapatanBludView } from './components/PendapatanBludView';
import { HutangView } from './components/HutangView';
import { MonitoringPpnView } from './components/MonitoringPpnView';

import { PiutangRecord, SyncStatusInfo } from './types/piutang';
import { GoogleSheetsService } from './services/googleSheetsService';
import { 
  Building2, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Layers, 
  TrendingDown,
  TrendingUp,
  CreditCard,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronRight,
  ShieldCheck,
  Search,
  Bell,
  RefreshCw,
  Sparkles,
  Sun,
  Moon,
  Menu,
  Receipt
} from 'lucide-react';
import { formatRupiah } from './utils/formatters';
import { User } from 'firebase/auth';
import { initFaviconSync, updateAppFavicon } from './utils/faviconHelper';
import { useTheme } from './context/ThemeContext';
import { initFirestoreSync } from './services/firestoreSync';

interface AppProps {
  user: User | null;
  isAdmin: boolean;
  role: string;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export default function App({ user, isAdmin, role, isLoginModalOpen, openLoginModal, closeLoginModal }: AppProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [records, setRecords] = useState<PiutangRecord[]>(() => GoogleSheetsService.loadCachedData());
  const [syncConfig, setSyncConfig] = useState<SyncStatusInfo>(() => GoogleSheetsService.loadConfig());
  
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Sidebar visibility state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Active Menu & Submenu Navigation
  const [activeMenu, setActiveMenu] = useState<string>('dashboard_2026');
  const [activeSubmenu, setActiveSubmenu] = useState<string | undefined>(undefined);

  // Force navigate to Dashboard Utama when a user successfully logs in
  useEffect(() => {
    initFirestoreSync();
    if (user) {
      setActiveMenu('dashboard_2026');
      setActiveSubmenu(undefined);
    }
  }, [user]);

  // Synchronize Browser Favicon in real-time (default or custom uploaded logo)
  useEffect(() => {
    const cleanup = initFaviconSync();
    return cleanup;
  }, []);

  // Year & Month filter state
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedBulan, setSelectedBulan] = useState('Agustus');

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const isSuperAdmin = Boolean(isAdmin) || role === 'admin' || (user?.email === 'begegbayunugroho@gmail.com') || (user?.email?.toLowerCase().includes('admin') ?? false);
  const effectiveRole = isSuperAdmin ? 'admin' : role;

  const canEditPiutang = isSuperAdmin || role === 'pic_piutang';
  const canEditPendapatan = isSuperAdmin || role === 'pic_pendapatan';
  const canEditPengeluaran = isSuperAdmin || role === 'pic_pengeluaran';
  const canEditHutang = isSuperAdmin || role === 'pic_hutang';

  // Handle menu selection from Sidebar or Dashboard
  const handleSelectMenu = (menu: string, submenu?: string) => {
    setActiveMenu(menu);
    setActiveSubmenu(submenu);
  };

  // Sync with Google Sheets function
  const performSync = useCallback(async (isManual: boolean = false) => {
    const config = GoogleSheetsService.loadConfig();
    if (!config.spreadsheetId) {
      if (isManual) {
        setIsGoogleModalOpen(true);
        showToast('Silakan pilih atau hubungkan Google Spreadsheet terlebih dahulu.', 'info');
      }
      return;
    }

    const token = GoogleSheetsService.getStoredToken();
    if (!token) {
      if (isManual) {
        setIsGoogleModalOpen(true);
        showToast('Sesi Google OAuth diperlukan untuk membaca data spreadsheet.', 'info');
      }
      return;
    }

    setSyncConfig(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      const rows = await GoogleSheetsService.fetchSheetRows(
        token,
        config.spreadsheetId,
        config.sheetName || 'Data Piutang'
      );

      const parsed = GoogleSheetsService.parseSheetRowsToPiutang(rows);
      if (parsed.length > 0) {
        setRecords(parsed);
        GoogleSheetsService.saveCachedData(parsed);
      }

      const nowStr = new Date().toISOString();
      const updatedConfig: Partial<SyncStatusInfo> = {
        lastSyncedAt: nowStr,
        isConnected: true,
        isSyncing: false,
        totalRowsSynced: parsed.length,
        error: null,
      };

      setSyncConfig(prev => ({ ...prev, ...updatedConfig }));
      GoogleSheetsService.saveConfig(updatedConfig);
      GoogleSheetsService.markDailySyncCompleted();

      showToast(
        `Berhasil menyinkronkan ${parsed.length} data piutang dari Google Sheets!`,
        'success'
      );
    } catch (err: any) {
      console.error('Error during auto-sync:', err);
      const errMsg = err.message || 'Gagal sinkronisasi data dengan Google Sheets';
      setSyncConfig(prev => ({ ...prev, isSyncing: false, error: errMsg }));
      if (isManual) {
        showToast(`Sinkronisasi Gagal: ${errMsg}`, 'error');
      }
    }
  }, []);

  // Quick Action Modal Opener based on active section
  const handleOpenQuickAdd = () => {
    if (!user) {
      openLoginModal();
      showToast('Silakan masuk/login PIC terlebih dahulu untuk menambahkan data.', 'info');
      return;
    }

    if (activeMenu === 'dashboard_2026' || ['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(activeMenu)) {
      if (canEditPiutang) {
        setIsAddModalOpen(true);
      } else {
        showToast('Akses dibatasi: Anda bukan PIC Piutang / Admin.', 'error');
      }
    } else if (activeMenu === 'pendapatan_blud') {
      if (canEditPendapatan) {
        // Trigger event to open modal inside Pendapatan view
        showToast('Silakan gunakan tombol "+ Entri Penerimaan Baru" di atas tabel.', 'info');
      } else {
        showToast('Akses dibatasi: Anda bukan PIC Pendapatan / Admin.', 'error');
      }
    } else if (activeMenu === 'pengeluaran_blud') {
      if (canEditPengeluaran) {
        showToast('Silakan gunakan tombol "+ Entri Pengeluaran Baru" di atas tabel.', 'info');
      } else {
        showToast('Akses dibatasi: Anda bukan PIC Pengeluaran / Admin.', 'error');
      }
    } else if (activeMenu === 'hutang') {
      if (canEditHutang) {
        showToast('Silakan gunakan tombol "+ Entri Data Hutang" di atas tabel.', 'info');
      } else {
        showToast('Akses dibatasi: Anda bukan PIC Hutang / Admin.', 'error');
      }
    }
  };

  // Breadcrumb Resolver
  const getBreadcrumb = () => {
    switch (activeMenu) {
      case 'dashboard_2026': return { main: 'Dashboard Utama', sub: 'Overview Eksekutif 4 Pilar' };
      case 'pendapatan_blud': return { main: '1. Pendapatan BLUD', sub: activeSubmenu ? activeSubmenu.replace(/_/g, ' ').toUpperCase() : 'Rekap Penerimaan' };
      case 'pengeluaran_blud': return { main: '2. Pengeluaran BLUD', sub: activeSubmenu ? activeSubmenu.replace(/_/g, ' ').toUpperCase() : 'Rekap Belanja' };
      case 'hutang': return { main: '3. Hutang (BLUD & APBD)', sub: activeSubmenu ? activeSubmenu.replace(/_/g, ' ').toUpperCase() : 'Rekap Pengadaan' };
      case 'perusahaan_asuransi': return { main: '4. Piutang', sub: 'Perusahaan & Asuransi' };
      case 'listrik_kantin': return { main: '4. Piutang', sub: 'Listrik Kantin' };
      case 'semua_rekapan': return { main: '4. Piutang', sub: 'Semua Rekapan (10 Penjamin)' };
      case 'monitoring_ppn': return { main: '5. Monitoring PPN', sub: 'Coretax DJP & Data Hutang 2026' };
      default: return { main: 'Keuangan RSUD Jatisari', sub: 'Dashboard' };
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#080b0d] text-slate-100' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
            toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-700' :
            toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-700' :
            'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
             toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> :
             <Sparkles className="w-4 h-4 text-cyan-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. GOOGLE AI STUDIO STYLE SIDEBAR (With Login at Bottom-Left) */}
      <Sidebar
        activeMenu={activeMenu}
        activeSubmenu={activeSubmenu}
        onSelectMenu={handleSelectMenu}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        user={user}
        isAdmin={isSuperAdmin}
        role={effectiveRole}
        onOpenLoginModal={openLoginModal}
        onOpenQuickAddModal={handleOpenQuickAdd}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        syncConfig={syncConfig}
      />

      {/* 2. MAIN APPLICATION CONTENT VIEW AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Header Bar */}
        <header className={`h-14 px-3 sm:px-6 flex items-center justify-between shrink-0 z-10 border-b transition-colors duration-300 ${
          isDark 
            ? 'bg-[#0d1216]/95 border-emerald-950/70 shadow-md shadow-black/40 backdrop-blur-md' 
            : 'bg-white/95 border-slate-200 shadow-2xs backdrop-blur-md'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-xl transition md:hidden shrink-0 ${
                isDark ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Buka Menu Navigasi"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Open Button (when sidebar is collapsed) */}
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className={`hidden md:flex p-1.5 rounded-lg transition mr-1 ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Buka Menu Samping"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}

            {/* Responsive Breadcrumb */}
            <div className={`flex items-center gap-1.5 sm:gap-2 text-xs font-medium min-w-0 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <span className={`hidden sm:inline ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>RSUD Jatisari</span>
              <ChevronRight className="w-3 h-3 opacity-50 hidden sm:inline" />
              <span className={`hidden md:inline font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>{breadcrumb.main}</span>
              <ChevronRight className="w-3 h-3 opacity-50 hidden md:inline" />
              <span className={`font-bold px-2 sm:px-2.5 py-0.5 rounded-md border text-[11px] sm:text-xs truncate max-w-[140px] sm:max-w-none ${
                isDark 
                  ? 'text-emerald-300 bg-emerald-950/70 border-emerald-800/50 shadow-xs' 
                  : 'text-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300/80 shadow-xs'
              }`}>
                {breadcrumb.sub}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Year Selector */}
            <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl border ${
              isDark ? 'bg-[#12181f] border-emerald-950/80' : 'bg-slate-100 border-slate-200'
            }`}>
              <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-slate-500'}`} />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`bg-transparent text-[11px] sm:text-xs font-bold focus:outline-none cursor-pointer ${
                  isDark ? 'text-zinc-200' : 'text-slate-700'
                }`}
              >
                <option value="2026" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>2026</option>
                <option value="2025" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>2025</option>
              </select>
            </div>

            {/* Month Selector - hidden on very small screens or compact */}
            <div className={`hidden xs:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl border ${
              isDark ? 'bg-[#12181f] border-emerald-950/80' : 'bg-slate-100 border-slate-200'
            }`}>
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(e.target.value)}
                className={`bg-transparent text-[11px] sm:text-xs font-bold focus:outline-none cursor-pointer ${
                  isDark ? 'text-zinc-200' : 'text-slate-700'
                }`}
              >
                <option value="Semua Bulan" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>Semua Bulan</option>
                <option value="Agustus" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>Agustus (Aktif)</option>
                <option value="Juli" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>Juli</option>
                <option value="Juni" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>Juni</option>
                <option value="Mei" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>Mei</option>
                <option value="April" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>April</option>
                <option value="Maret" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>Maret</option>
                <option value="Februari" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>Februari</option>
                <option value="Januari" className={isDark ? 'bg-[#12181f] text-zinc-100' : 'bg-white text-slate-800'}>Januari</option>
              </select>
            </div>

            {/* Google Sheets Sync Trigger */}
            <button
              onClick={() => performSync(true)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 font-medium rounded-xl text-xs transition border ${
                isDark 
                  ? 'bg-[#12181f] hover:bg-[#182129] text-emerald-300 border-emerald-950/80' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Sinkronisasi Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${syncConfig.isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 font-semibold rounded-xl text-xs transition border ${
                isDark 
                  ? 'bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 text-amber-300 border-emerald-800/50 shadow-sm' 
                  : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 border-emerald-200 shadow-2xs'
              }`}
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden md:inline">Gelap</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Main Body Scroll Area */}
        <main className={`flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-24 md:pb-8 custom-scrollbar ${
          activeMenu === 'listrik_kantin' 
            ? (isDark ? '' : 'bg-gradient-to-br from-red-50/80 via-orange-50/50 to-orange-50/20') 
            : ''
        }`}>
          
          {/* 1. DASHBOARD UTAMA */}
          {activeMenu === 'dashboard_2026' && (
            <Dashboard2026View
              onNavigateTab={(menu, submenu) => handleSelectMenu(menu, submenu)}
              onOpenUploadModal={() => {
                if (!user) {
                  openLoginModal();
                  showToast('Silakan login terlebih dahulu untuk mengunggah data.', 'info');
                } else if (!canEditPiutang) {
                  showToast('Akses terbatas: Hanya PIC Piutang dan Super Admin yang dapat mengunggah data piutang.', 'error');
                } else {
                  setIsUploadModalOpen(true);
                }
              }}
              isAdmin={isSuperAdmin}
              currentUserEmail={user?.email || undefined}
              userRole={effectiveRole}
            />
          )}

          {/* 2. PENDAPATAN BLUD (With Submenus) */}
          {activeMenu === 'pendapatan_blud' && (
            <PendapatanBludView 
              isAdmin={isSuperAdmin}
              currentUserEmail={user?.email || undefined}
              userRole={effectiveRole}
              selectedBulan={selectedBulan}
              activeSubmenu={activeSubmenu}
              onOpenLoginModal={openLoginModal}
              onShowToast={showToast}
            />
          )}

          {/* 3. PENGELUARAN BLUD (With Submenus) */}
          {activeMenu === 'pengeluaran_blud' && (
            <PengeluaranBludView 
              isAdmin={isSuperAdmin}
              currentUserEmail={user?.email || undefined}
              userRole={effectiveRole}
              selectedBulan={selectedBulan}
              activeSubmenu={activeSubmenu}
              onOpenLoginModal={openLoginModal}
              onShowToast={showToast}
            />
          )}

          {/* 4. HUTANG (With 12 Submenus from Screenshots) */}
          {activeMenu === 'hutang' && (
            <HutangView 
              isAdmin={isSuperAdmin}
              activeSubmenu={activeSubmenu}
              user={user}
              role={effectiveRole}
              onOpenLoginModal={openLoginModal}
              onShowToast={showToast}
            />
          )}

          {/* 5. PIUTANG: PERUSAHAAN & ASURANSI */}
          {activeMenu === 'perusahaan_asuransi' && (
            <PerusahaanAsuransiView
              isAdmin={isSuperAdmin}
              currentUserEmail={user?.email || undefined}
              userRole={effectiveRole}
              selectedBulan={selectedBulan}
              onOpenUploadModal={() => {
                if (!user) {
                  openLoginModal();
                  showToast('Silakan login terlebih dahulu.', 'info');
                } else if (!canEditPiutang) {
                  showToast('Akses terbatas: Hanya PIC Piutang dan Admin yang dapat upload.', 'error');
                } else {
                  setIsUploadModalOpen(true);
                }
              }}
            />
          )}

          {/* 6. PIUTANG: LISTRIK KANTIN */}
          {activeMenu === 'listrik_kantin' && (
            <ListrikKantinView
              isAdmin={isSuperAdmin}
              currentUserEmail={user?.email || undefined}
              userRole={effectiveRole}
              selectedBulan={selectedBulan}
              onOpenUploadModal={() => {
                if (!user) {
                  openLoginModal();
                  showToast('Silakan login terlebih dahulu.', 'info');
                } else if (!canEditPiutang) {
                  showToast('Akses terbatas: Hanya PIC Piutang dan Admin yang dapat upload.', 'error');
                } else {
                  setIsUploadModalOpen(true);
                }
              }}
            />
          )}

          {/* 7. PIUTANG: SEMUA REKAPAN */}
          {activeMenu === 'semua_rekapan' && (
            <SemuaRekapanView
              isAdmin={isSuperAdmin}
              currentUserEmail={user?.email || undefined}
              userRole={effectiveRole}
              selectedBulan={selectedBulan}
              onOpenUploadModal={() => {
                if (!user) {
                  openLoginModal();
                  showToast('Silakan login terlebih dahulu.', 'info');
                } else if (!canEditPiutang) {
                  showToast('Akses terbatas: Hanya PIC Piutang dan Admin yang dapat upload.', 'error');
                } else {
                  setIsUploadModalOpen(true);
                }
              }}
            />
          )}

          {/* 8. MONITORING PPN (Coretax DJP & Data Hutang 2026) */}
          {activeMenu === 'monitoring_ppn' && (
            <MonitoringPpnView />
          )}

        </main>

        {/* Mobile Bottom Navigation Bar (Fixed for quick thumb navigation on small screens) */}
        <nav 
          aria-label="Navigasi Bawah Mobile" 
          className={`md:hidden fixed bottom-0 left-0 right-0 z-30 px-2 py-1.5 border-t backdrop-blur-md transition-colors duration-300 ${
            isDark 
              ? 'bg-[#090e12]/95 border-emerald-950/90 shadow-2xl shadow-black' 
              : 'bg-white/95 border-slate-200 shadow-lg shadow-slate-400/20'
          }`}
        >
          <div className="grid grid-cols-6 gap-1 max-w-lg mx-auto">
            {/* 1. Dashboard */}
            <button
              onClick={() => handleSelectMenu('dashboard_2026')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                activeMenu === 'dashboard_2026'
                  ? (isDark ? 'text-emerald-300 bg-emerald-950/80 font-bold' : 'text-emerald-700 bg-emerald-50 font-bold')
                  : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800')
              }`}
            >
              <Layers className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] leading-tight truncate">Home</span>
            </button>

            {/* 2. Pendapatan */}
            <button
              onClick={() => handleSelectMenu('pendapatan_blud')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                activeMenu === 'pendapatan_blud'
                  ? (isDark ? 'text-teal-300 bg-teal-950/80 font-bold' : 'text-teal-700 bg-teal-50 font-bold')
                  : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800')
              }`}
            >
              <TrendingUp className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] leading-tight truncate">Pendapatan</span>
            </button>

            {/* 3. Pengeluaran */}
            <button
              onClick={() => handleSelectMenu('pengeluaran_blud')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                activeMenu === 'pengeluaran_blud'
                  ? (isDark ? 'text-rose-300 bg-rose-950/80 font-bold' : 'text-rose-700 bg-rose-50 font-bold')
                  : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800')
              }`}
            >
              <TrendingDown className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] leading-tight truncate">Pengeluaran</span>
            </button>

            {/* 4. Hutang */}
            <button
              onClick={() => handleSelectMenu('hutang')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                activeMenu === 'hutang'
                  ? (isDark ? 'text-indigo-300 bg-indigo-950/80 font-bold' : 'text-indigo-700 bg-indigo-50 font-bold')
                  : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800')
              }`}
            >
              <CreditCard className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] leading-tight truncate">Hutang</span>
            </button>

            {/* 5. Piutang */}
            <button
              onClick={() => handleSelectMenu('perusahaan_asuransi')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                ['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(activeMenu)
                  ? (isDark ? 'text-emerald-300 bg-emerald-950/80 font-bold' : 'text-emerald-700 bg-emerald-50 font-bold')
                  : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800')
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] leading-tight truncate">Piutang</span>
            </button>

            {/* 6. PPN */}
            <button
              onClick={() => handleSelectMenu('monitoring_ppn')}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                activeMenu === 'monitoring_ppn'
                  ? (isDark ? 'text-emerald-300 bg-emerald-950/80 font-bold' : 'text-emerald-700 bg-emerald-50 font-bold')
                  : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800')
              }`}
            >
              <Receipt className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] leading-tight truncate">PPN</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Modals */}
      <GoogleSheetsModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        syncConfig={syncConfig}
        onSaveConfig={(cfg) => {
          setSyncConfig(prev => ({ ...prev, ...cfg }));
          GoogleSheetsService.saveConfig(cfg);
          showToast('Pengaturan Google Sheets berhasil disimpan!', 'success');
        }}
      />

      <UploadSpreadsheetModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccessImport={(summary) => {
          setRecords(GoogleSheetsService.loadCachedData());
          showToast(summary, 'success');
        }}
      />

      <AddEditPiutangModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(newRecord) => {
          const updated = [newRecord, ...records];
          setRecords(updated);
          GoogleSheetsService.saveCachedData(updated);
          showToast('Data piutang baru berhasil dicatat!', 'success');
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

    </div>
  );
}
