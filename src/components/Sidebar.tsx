import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  FileSpreadsheet, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  LogIn, 
  LogOut, 
  Settings, 
  Sparkles, 
  ShieldCheck, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Search, 
  Bell, 
  RefreshCw,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  PieChart,
  Zap,
  Users,
  Briefcase,
  Database,
  Sun,
  Moon,
  Receipt
} from 'lucide-react';
import { RsudLogo } from './RsudLogo';
import { User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { SyncStatusInfo } from '../types/piutang';
import { useTheme } from '../context/ThemeContext';

export interface SidebarProps {
  activeMenu: string;
  activeSubmenu?: string;
  onSelectMenu: (menu: string, submenu?: string) => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
  user: User | null;
  isAdmin: boolean;
  role: string;
  onOpenLoginModal: () => void;
  onOpenQuickAddModal?: () => void;
  onOpenSettingsModal?: () => void;
  syncConfig?: SyncStatusInfo;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  activeSubmenu,
  onSelectMenu,
  isOpen,
  onToggleSidebar,
  user,
  isAdmin,
  role,
  onOpenLoginModal,
  onOpenQuickAddModal,
  onOpenSettingsModal,
  syncConfig
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  // Collapsible states for main sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pendapatan: false,
    pengeluaran: false,
    hutang: false,
    piutang: false,
  });

  // Auto-expand section on mount or when activeMenu changes
  useEffect(() => {
    if (activeMenu === 'pendapatan_blud') {
      setExpandedSections(prev => ({ ...prev, pendapatan: true }));
    } else if (activeMenu === 'pengeluaran_blud') {
      setExpandedSections(prev => ({ ...prev, pengeluaran: true }));
    } else if (activeMenu === 'hutang') {
      setExpandedSections(prev => ({ ...prev, hutang: true }));
    } else if (['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(activeMenu)) {
      setExpandedSections(prev => ({ ...prev, piutang: true }));
    }
  }, [activeMenu]);

  const toggleSection = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleItemClick = (menu: string, submenu?: string) => {
    onSelectMenu(menu, submenu);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggleSidebar();
    }
  };

  const getRoleBadge = (r?: string, admin?: boolean) => {
    if (admin || r === 'admin') return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-slate-950 uppercase">Admin</span>;
    if (r === 'pic_piutang') return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500 text-white uppercase">PIC Piutang</span>;
    if (r === 'pic_pendapatan') return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-white uppercase">PIC Pendapatan</span>;
    if (r === 'pic_pengeluaran') return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white uppercase">PIC Pengeluaran</span>;
    if (r === 'pic_hutang') return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500 text-white uppercase">PIC Hutang</span>;
    return <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>Viewer</span>;
  };

  // Hutang submenu items according to user screenshots
  const hutangSubmenus = [
    { id: 'semua_rekap_hutang', label: 'SEMUA REKAP HUTANG (2025 & 2026)' },
    { id: 'rekap_hutang_2025', label: 'REKAP PENGADAAN HUTANG 2025' },
    { id: 'rekap_hutang_2026', label: 'REKAP PENGADAAN HUTANG 2026' },
    { id: 'rekap_apbd_2026', label: 'REKAP PENGADAAN APBD 2026' },
    { id: 'rekap_supplier_2026', label: 'REKAP PERSUPLIER TAHUN 2026' },
    { id: 'rekap_supplier_2025', label: 'REKAP PERSUPLIER TAHUN 2025' },
    { id: 'verifikasi_po', label: 'VERIFIKASI PO' },
    { id: 'rekap_pembelian_invoice', label: 'REKAP PEMBELIAN INVOICE PERBULAN' },
    { id: 'bahan_lap_bulanan', label: 'BAHAN UNTUK LAP BULANAN' },
    { id: 'rekap_pembayaran_perbulan', label: 'REKAPAN PEMBAYARAN PERBULAN' },
    { id: 'invoice_hutang_2025', label: 'INVOICE HUTANG 2025' },
    { id: 'invoice_hutang_2026', label: 'INVOICE HUTANG 2026' },
    { id: 'database_kode_rekening', label: 'DATA BASE KODE REKENING' }
  ];

  // Pendapatan submenu items
  const pendapatanSubmenus = [
    { id: 'fungsional_rs', label: 'Pendapatan Fungsional RS' },
    { id: 'rawat_inap_jalan', label: 'Pelayanan Rawat Inap & Jalan' },
    { id: 'kerjasama_jkn', label: 'Kerjasama Pihak Ketiga & JKN' },
    { id: 'target_realisasi_pendapatan', label: 'Target vs Realisasi Bulanan' },
    { id: 'sewa_penunjang', label: 'Sewa Lahan & Penunjang Medis' }
  ];

  // Pengeluaran submenu items
  const pengeluaranSubmenus = [
    { id: 'belanja_pegawai', label: 'Belanja Pegawai & Nakes' },
    { id: 'belanja_barang_jasa', label: 'Belanja Barang & Jasa (Obat/BMHP)' },
    { id: 'belanja_pemeliharaan', label: 'Belanja Pemeliharaan & Kalibrasi' },
    { id: 'belanja_operasional', label: 'Belanja Operasional (Listrik/Air)' },
    { id: 'belanja_modal', label: 'Belanja Modal Alkes/Sarpras' },
    { id: 'rekap_spj', label: 'Rekap SPJ & Realisasi Belanja' }
  ];

  // Piutang submenu items
  const piutangSubmenus = [
    { id: 'perusahaan_asuransi', label: 'Perusahaan & Asuransi' },
    { id: 'listrik_kantin', label: 'Listrik Kantin' },
    { id: 'semua_rekapan', label: 'Semua Rekapan (10 Penjamin)' }
  ];

  if (!isOpen) {
    return (
      <aside className={`hidden md:flex w-16 flex-col items-center py-4 border-r transition-all duration-300 z-30 shrink-0 select-none ${
        isDark 
          ? 'bg-[#0a0d0e] text-zinc-300 border-emerald-950/60 shadow-xl' 
          : 'bg-white text-slate-700 border-slate-200 shadow-sm'
      }`}>
        <button 
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg mb-6 transition ${
            isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
          }`}
          title="Buka Sidebar"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-3 items-center flex-1 w-full px-2">
          {/* Dashboard Icon */}
          <button
            onClick={() => handleItemClick('dashboard_2026')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              activeMenu === 'dashboard_2026' 
                ? (isDark ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-950' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400' : 'hover:bg-slate-100 text-slate-600')
            }`}
            title="Dashboard Utama"
          >
            <Layers className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleItemClick('pendapatan_blud')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              activeMenu === 'pendapatan_blud' 
                ? (isDark ? 'bg-teal-950/60 text-teal-400 border border-teal-500/40 shadow-sm shadow-teal-950' : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400' : 'hover:bg-slate-100 text-slate-600')
            }`}
            title="Pendapatan BLUD"
          >
            <TrendingUp className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleItemClick('pengeluaran_blud')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              activeMenu === 'pengeluaran_blud' 
                ? (isDark ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-950' : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400' : 'hover:bg-slate-100 text-slate-600')
            }`}
            title="Pengeluaran BLUD"
          >
            <TrendingDown className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleItemClick('hutang')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              activeMenu === 'hutang' 
                ? (isDark ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/40 shadow-sm shadow-indigo-950' : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400' : 'hover:bg-slate-100 text-slate-600')
            }`}
            title="Hutang BLUD & APBD"
          >
            <CreditCard className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleItemClick('perusahaan_asuransi')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              ['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(activeMenu) 
                ? (isDark ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-950' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400' : 'hover:bg-slate-100 text-slate-600')
            }`}
            title="Piutang & Klaim"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleItemClick('monitoring_ppn')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              activeMenu === 'monitoring_ppn' 
                ? (isDark ? 'bg-gradient-to-tr from-emerald-950 to-indigo-950 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-950' : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-md shadow-emerald-500/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400' : 'hover:bg-slate-100 text-slate-600')
            }`}
            title="Monitoring PPN 2026"
          >
            <Receipt className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Toggle Mini */}
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl mb-3 transition ${
            isDark ? 'text-amber-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-700'
          }`}
          title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Bottom Profile / Login Icon */}
        <div className={`pt-3 border-t flex flex-col items-center gap-2 ${isDark ? 'border-emerald-950/60' : 'border-slate-200'}`}>
          {user ? (
            <button 
              onClick={onOpenSettingsModal}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-500/40 shadow-sm"
              title={user.displayName || user.email || 'User Profile'}
            >
              {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
            </button>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition shadow-sm"
              title="Masuk / Login"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        onClick={onToggleSidebar}
        aria-hidden="true"
      />

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:w-72 md:relative flex flex-col border-r h-screen md:sticky md:top-0 transition-transform duration-300 ease-in-out select-none shrink-0 font-sans shadow-2xl md:shadow-sm ${
        isDark 
          ? 'bg-[#0a0d0e] text-zinc-300 border-emerald-950/70' 
          : 'bg-white text-slate-700 border-slate-200'
      }`}>
        
        {/* 1. Header with Logo & Brand Accent */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-emerald-950/80 bg-[#070b0c]' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center p-1.5 transition ${
              isDark 
                ? 'bg-gradient-to-br from-[#061e16] to-[#040e0b] border border-emerald-500/30 shadow-xs' 
                : 'bg-white border border-slate-200/90 shadow-xs ring-1 ring-emerald-500/20'
            }`}>
              <RsudLogo className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold text-sm tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  RSUD Jatisari
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 font-bold rounded ${
                  isDark 
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' 
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-300/80'
                }`}>
                  BLUD
                </span>
              </div>
              <div className={`text-[11px] font-medium ${isDark ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                Sub Bagian Keuangan
              </div>
            </div>
          </div>

          <button 
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg transition ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Tutup Menu"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>



      {/* 3. Navigation List (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 custom-scrollbar">
        
        {/* SECTION: UTAMA / DASHBOARD */}
        <div>
          <button
            onClick={() => handleItemClick('dashboard_2026')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl text-xs font-bold transition group select-none ${
              activeMenu === 'dashboard_2026' 
                ? (isDark 
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 shadow-xs' 
                    : 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/20')
                : (isDark 
                    ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent')
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                activeMenu === 'dashboard_2026'
                  ? (isDark ? 'bg-emerald-900/80 text-emerald-300' : 'bg-white/20 text-white')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight uppercase truncate">DASHBOARD UTAMA</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
              activeMenu === 'dashboard_2026'
                ? (isDark ? 'bg-emerald-900/80 text-emerald-300' : 'bg-white/20 text-white')
                : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-600')
            }`}>
              Live
            </span>
          </button>
        </div>

        {/* SECTION 1: PENDAPATAN BLUD */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('pendapatan')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl font-bold text-xs uppercase tracking-tight transition group select-none ${
              expandedSections.pendapatan || activeMenu === 'pendapatan_blud'
                ? (isDark 
                    ? 'bg-teal-950/50 text-teal-300 border border-teal-800/50 shadow-xs' 
                    : 'bg-teal-50 text-teal-900 border border-teal-200/90 shadow-xs')
                : (isDark 
                    ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent')
            }`}
            title="Klik untuk membuka / menutup sub menu Pendapatan BLUD"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                expandedSections.pendapatan || activeMenu === 'pendapatan_blud'
                  ? (isDark ? 'bg-teal-900/80 text-teal-300' : 'bg-teal-600 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight truncate whitespace-nowrap">1. PENDAPATAN BLUD</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className={`h-5 min-w-[20px] px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isDark ? 'bg-zinc-800/90 text-zinc-400' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {pendapatanSubmenus.length + 1}
              </span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                expandedSections.pendapatan 
                  ? 'rotate-90 text-teal-600 dark:text-teal-400 font-bold' 
                  : 'text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5'
              }`} />
            </div>
          </button>

          {/* Submenus Dropdown */}
          {expandedSections.pendapatan && (
            <div className={`mt-1.5 pl-3 pr-1 py-1 space-y-1 border-l-2 ml-4 ${
              isDark ? 'border-teal-900/60' : 'border-teal-200'
            }`}>
              <button
                onClick={() => handleItemClick('pendapatan_blud')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                  activeMenu === 'pendapatan_blud' && !activeSubmenu 
                    ? (isDark 
                        ? 'bg-teal-950/80 text-teal-200 font-bold border border-teal-700/50' 
                        : 'bg-teal-600 text-white font-bold shadow-xs')
                    : (isDark ? 'text-zinc-300 hover:text-teal-300 hover:bg-zinc-800/60' : 'text-slate-600 hover:text-teal-800 hover:bg-teal-50/70')
                }`}
              >
                <span className="truncate">Rekap Pendapatan BLUD</span>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>

              {pendapatanSubmenus.map((sub) => {
                const isSubActive = activeMenu === 'pendapatan_blud' && activeSubmenu === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleItemClick('pendapatan_blud', sub.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                      isSubActive 
                        ? (isDark ? 'bg-teal-950/60 text-teal-300 font-bold border-l-2 border-teal-500' : 'bg-teal-50 text-teal-800 font-bold border-l-2 border-teal-600')
                        : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60')
                    }`}
                  >
                    <span className="truncate">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: PENGELUARAN BLUD */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('pengeluaran')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl font-bold text-xs uppercase tracking-tight transition group select-none ${
              expandedSections.pengeluaran || activeMenu === 'pengeluaran_blud'
                ? (isDark 
                    ? 'bg-rose-950/50 text-rose-300 border border-rose-800/50 shadow-xs' 
                    : 'bg-rose-50 text-rose-900 border border-rose-200/90 shadow-xs')
                : (isDark 
                    ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent')
            }`}
            title="Klik untuk membuka / menutup sub menu Pengeluaran BLUD"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                expandedSections.pengeluaran || activeMenu === 'pengeluaran_blud'
                  ? (isDark ? 'bg-rose-900/80 text-rose-300' : 'bg-rose-600 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight truncate whitespace-nowrap">2. PENGELUARAN BLUD</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className={`h-5 min-w-[20px] px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isDark ? 'bg-zinc-800/90 text-zinc-400' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {pengeluaranSubmenus.length + 1}
              </span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                expandedSections.pengeluaran 
                  ? 'rotate-90 text-rose-600 dark:text-rose-400 font-bold' 
                  : 'text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5'
              }`} />
            </div>
          </button>

          {/* Submenus Dropdown */}
          {expandedSections.pengeluaran && (
            <div className={`mt-1.5 pl-3 pr-1 py-1 space-y-1 border-l-2 ml-4 ${
              isDark ? 'border-rose-900/60' : 'border-rose-200'
            }`}>
              <button
                onClick={() => handleItemClick('pengeluaran_blud')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                  activeMenu === 'pengeluaran_blud' && !activeSubmenu 
                    ? (isDark 
                        ? 'bg-rose-950/80 text-rose-200 font-bold border border-rose-700/50' 
                        : 'bg-rose-600 text-white font-bold shadow-xs')
                    : (isDark ? 'text-zinc-300 hover:text-rose-300 hover:bg-zinc-800/60' : 'text-slate-600 hover:text-rose-800 hover:bg-rose-50/70')
                }`}
              >
                <span className="truncate">Rekap Pengeluaran BLUD</span>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>

              {pengeluaranSubmenus.map((sub) => {
                const isSubActive = activeMenu === 'pengeluaran_blud' && activeSubmenu === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleItemClick('pengeluaran_blud', sub.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                      isSubActive 
                        ? (isDark ? 'bg-rose-950/60 text-rose-300 font-bold border-l-2 border-rose-500' : 'bg-rose-50 text-rose-800 font-bold border-l-2 border-rose-600')
                        : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60')
                    }`}
                  >
                    <span className="truncate">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: HUTANG (BLUD & APBD) */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('hutang')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl font-bold text-xs uppercase tracking-tight transition group select-none ${
              expandedSections.hutang || activeMenu === 'hutang'
                ? (isDark 
                    ? 'bg-indigo-950/50 text-indigo-300 border border-indigo-800/50 shadow-xs' 
                    : 'bg-indigo-50 text-indigo-900 border border-indigo-200/90 shadow-xs')
                : (isDark 
                    ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent')
            }`}
            title="Klik untuk membuka / menutup sub menu Hutang (BLUD & APBD)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                expandedSections.hutang || activeMenu === 'hutang'
                  ? (isDark ? 'bg-indigo-900/80 text-indigo-300' : 'bg-indigo-600 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight truncate whitespace-nowrap">3. HUTANG (BLUD & APBD)</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className={`h-5 min-w-[20px] px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isDark ? 'bg-zinc-800/90 text-zinc-400' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {hutangSubmenus.length}
              </span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                expandedSections.hutang 
                  ? 'rotate-90 text-indigo-600 dark:text-indigo-400 font-bold' 
                  : 'text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5'
              }`} />
            </div>
          </button>

          {/* Submenus Dropdown */}
          {expandedSections.hutang && (
            <div className={`mt-1.5 pl-3 pr-1 py-1 space-y-0.5 border-l-2 ml-4 max-h-64 overflow-y-auto custom-scrollbar ${
              isDark ? 'border-indigo-900/60' : 'border-indigo-200'
            }`}>
              {hutangSubmenus.map((sub) => {
                const isSubActive = activeMenu === 'hutang' && (activeSubmenu === sub.id || (!activeSubmenu && sub.id === 'semua_rekap_hutang'));
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleItemClick('hutang', sub.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10.5px] transition truncate flex items-center justify-between ${
                      isSubActive 
                        ? (isDark ? 'bg-indigo-950/60 text-indigo-300 font-bold border-l-2 border-indigo-500' : 'bg-indigo-50 text-indigo-800 font-bold border-l-2 border-indigo-600')
                        : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60')
                    }`}
                    title={sub.label}
                  >
                    <span className="truncate">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 4: PIUTANG & KLAIM */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('piutang')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl font-bold text-xs uppercase tracking-tight transition group select-none ${
              expandedSections.piutang || ['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(activeMenu)
                ? (isDark 
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 shadow-xs' 
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200/90 shadow-xs')
                : (isDark 
                    ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent')
            }`}
            title="Klik untuk membuka / menutup sub menu Piutang & Klaim"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                expandedSections.piutang || ['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(activeMenu)
                  ? (isDark ? 'bg-emerald-900/80 text-emerald-300' : 'bg-emerald-600 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight truncate whitespace-nowrap">4. PIUTANG & KLAIM</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className={`h-5 min-w-[20px] px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isDark ? 'bg-zinc-800/90 text-zinc-400' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {piutangSubmenus.length}
              </span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                expandedSections.piutang 
                  ? 'rotate-90 text-emerald-600 dark:text-emerald-400 font-bold' 
                  : 'text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5'
              }`} />
            </div>
          </button>

          {/* Submenus Dropdown */}
          {expandedSections.piutang && (
            <div className={`mt-1.5 pl-3 pr-1 py-1 space-y-1 border-l-2 ml-4 ${
              isDark ? 'border-emerald-900/60' : 'border-emerald-200'
            }`}>
              {piutangSubmenus.map((sub) => {
                const isSubActive = activeMenu === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleItemClick(sub.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                      isSubActive 
                        ? (isDark ? 'bg-emerald-950/60 text-emerald-300 font-bold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-600')
                        : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60')
                    }`}
                  >
                    <span className="truncate">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 5: MONITORING PPN (New Integrated Module) */}
        <div>
          <button
            type="button"
            onClick={() => handleItemClick('monitoring_ppn')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl font-bold text-xs uppercase tracking-tight transition group select-none ${
              activeMenu === 'monitoring_ppn'
                ? (isDark 
                    ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-indigo-950/80 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/50' 
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-black shadow-md shadow-emerald-600/30')
                : (isDark 
                    ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent')
            }`}
            title="Sistem Monitoring PPN 2026 (Coretax DJP & Data Hutang)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                activeMenu === 'monitoring_ppn'
                  ? (isDark ? 'bg-emerald-900/80 text-emerald-300' : 'bg-white/20 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight truncate whitespace-nowrap">5. MONITORING PPN</span>
            </div>
          </button>
        </div>

      </div>

      {/* 4. Bottom Info Banner */}
      <div className="px-3 pt-2 pb-2">
        <div className={`p-3 rounded-xl border relative overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-b from-[#061510] to-[#030d09] border-emerald-950/80 shadow-inner' 
            : 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-blue-50/40 border-emerald-200/80 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" /> RSUD Jatisari
            </span>
            <span className={`text-[9px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>v2026.8</span>
          </div>
          <div className={`text-xs font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
            Sistem Keuangan BLUD
          </div>
          <p className={`text-[10px] mt-0.5 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Sinkronisasi otomatis real-time Google Sheets & database terpadu.
          </p>
        </div>
      </div>

      {/* 5. Bottom Icons Bar & Theme Switcher */}
      <div className={`px-3 py-1.5 flex items-center justify-between border-t ${
        isDark ? 'border-emerald-950/80 text-zinc-400' : 'border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-1">
          <button 
            onClick={onOpenSettingsModal} 
            className={`p-1.5 rounded-lg transition ${
              isDark ? 'hover:bg-zinc-800 hover:text-zinc-200' : 'hover:bg-slate-100 hover:text-slate-800'
            }`} 
            title="Pengaturan Sistem & Tema"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button 
            onClick={() => window.dispatchEvent(new Event('rsud_data_updated'))} 
            className={`p-1.5 rounded-lg transition ${
              isDark ? 'hover:bg-zinc-800 hover:text-zinc-200' : 'hover:bg-slate-100 hover:text-slate-800'
            }`} 
            title="Muat Ulang Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Quick Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
              isDark 
                ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-amber-300 border border-emerald-800/40' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
            title={isDark ? 'Beralih ke Mode Terang (RSUD Green-Blue)' : 'Beralih ke Mode Gelap (Hitam-Hijau)'}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px]">Gelap</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-[10px]">Terang</span>
              </>
            )}
          </button>
        </div>

        <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border ${
          isDark 
            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' 
            : 'text-emerald-700 bg-emerald-50 border-emerald-200'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online</span>
        </div>
      </div>

      {/* 6. BOTTOM-LEFT USER PROFILE / LOGIN BUTTON */}
      <div className={`p-3 border-t ${isDark ? 'border-emerald-950/90 bg-[#070b0c]' : 'border-slate-200 bg-slate-50'}`}>
        {user ? (
          <div className={`flex items-center justify-between gap-2 p-1.5 rounded-xl transition ${
            isDark ? 'bg-zinc-900/80 hover:bg-zinc-800 border border-emerald-950/60' : 'bg-white hover:bg-slate-100/80 border border-slate-200/80 shadow-2xs'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=059669&color=fff`} 
                alt="Avatar" 
                className="w-7 h-7 rounded-full bg-emerald-800 object-cover shrink-0 ring-1 ring-emerald-500/40" 
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold truncate block max-w-[100px] ${
                    isDark ? 'text-zinc-100' : 'text-slate-900'
                  }`}>
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  {getRoleBadge(role, isAdmin)}
                </div>
                <span className={`text-[10px] truncate block max-w-[130px] ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                signOut(auth).then(() => {
                  onOpenLoginModal();
                });
              }}
              className={`p-1.5 rounded-lg transition shrink-0 ${
                isDark ? 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-700/50' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="Keluar / Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/30 transition transform active:scale-98 group"
          >
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4 text-emerald-100 group-hover:translate-x-0.5 transition" />
              <span>Login / Masuk PIC</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white">Auth</span>
          </button>
        )}
      </div>

    </aside>
    </>
  );
};

