import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Receipt,
  UserCog
} from 'lucide-react';
import { RsudLogo } from './RsudLogo';
import { User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useUserProfile } from '../utils/userProfile';
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
  onOpenProfileModal?: () => void;
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
  onOpenProfileModal,
  syncConfig
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const profile = useUserProfile(user);

  // Collapsible states for main sections (Accordion mode: only one open at a time)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pendapatan: false,
    pengeluaran: false,
    hutang: false,
    piutang: false,
    monitoring_ppn: false,
  });

  // Helper to determine if a section is currently the active route/menu
  const isSectionActive = (section: 'pendapatan' | 'pengeluaran' | 'hutang' | 'piutang' | 'monitoring_ppn') => {
    if (section === 'pendapatan') return activeMenu === 'pendapatan_blud';
    if (section === 'pengeluaran') return activeMenu === 'pengeluaran_blud';
    if (section === 'hutang') return activeMenu === 'hutang';
    if (section === 'piutang') return ['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(activeMenu);
    if (section === 'monitoring_ppn') return activeMenu === 'monitoring_ppn';
    return false;
  };

  // Auto-expand active section and close all other sections (Accordion behavior)
  useEffect(() => {
    let currentSection = '';
    if (activeMenu === 'pendapatan_blud') currentSection = 'pendapatan';
    else if (activeMenu === 'pengeluaran_blud') currentSection = 'pengeluaran';
    else if (activeMenu === 'hutang') currentSection = 'hutang';
    else if (['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(activeMenu)) currentSection = 'piutang';
    else if (activeMenu === 'monitoring_ppn') currentSection = 'monitoring_ppn';

    setExpandedSections({
      pendapatan: currentSection === 'pendapatan',
      pengeluaran: currentSection === 'pengeluaran',
      hutang: currentSection === 'hutang',
      piutang: currentSection === 'piutang',
      monitoring_ppn: currentSection === 'monitoring_ppn',
    });
  }, [activeMenu, activeSubmenu]);

  // Accordion toggle: opening one section automatically closes all previous sections
  const toggleSection = (section: 'pendapatan' | 'pengeluaran' | 'hutang' | 'piutang' | 'monitoring_ppn', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedSections(prev => {
      const isCurrentlyOpen = !!prev[section];
      if (!isCurrentlyOpen) {
        return {
          pendapatan: section === 'pendapatan',
          pengeluaran: section === 'pengeluaran',
          hutang: section === 'hutang',
          piutang: section === 'piutang',
          monitoring_ppn: section === 'monitoring_ppn',
        };
      } else {
        return {
          ...prev,
          [section]: false,
        };
      }
    });
  };

  // Header click handler: opens dropdown, closes others, and selects menu
  const handleSectionHeaderClick = (
    section: 'pendapatan' | 'pengeluaran' | 'hutang' | 'piutang' | 'monitoring_ppn',
    targetMenu: string,
    targetSubmenu?: string
  ) => {
    setExpandedSections({
      pendapatan: section === 'pendapatan',
      pengeluaran: section === 'pengeluaran',
      hutang: section === 'hutang',
      piutang: section === 'piutang',
      monitoring_ppn: section === 'monitoring_ppn',
    });
    handleItemClick(targetMenu, targetSubmenu);
  };

  const handleItemClick = (menu: string, submenu?: string) => {
    let targetSection = '';
    if (menu === 'pendapatan_blud') targetSection = 'pendapatan';
    else if (menu === 'pengeluaran_blud') targetSection = 'pengeluaran';
    else if (menu === 'hutang') targetSection = 'hutang';
    else if (['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(menu)) targetSection = 'piutang';
    else if (menu === 'monitoring_ppn') targetSection = 'monitoring_ppn';

    // Accordion: ensure only target section is open
    setExpandedSections({
      pendapatan: targetSection === 'pendapatan',
      pengeluaran: targetSection === 'pengeluaran',
      hutang: targetSection === 'hutang',
      piutang: targetSection === 'piutang',
      monitoring_ppn: targetSection === 'monitoring_ppn',
    });

    onSelectMenu(menu, submenu);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggleSidebar();
    }
  };

  const getRoleBadge = (r?: string, admin?: boolean) => {
    if (admin || r === 'admin') return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-slate-950 uppercase">Admin</span>;
    if (r === 'pic_pajak' || r === 'pic_ppn') return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-600 text-white uppercase">PIC Pajak</span>;
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
    { id: 'rekap_pembelian_invoice', label: 'REKAP PEMBELIAN PERBULAN' },
    { id: 'bahan_lap_bulanan', label: 'BAHAN UNTUK LAP BULANAN' },
    { id: 'rekap_pembayaran_perbulan', label: 'REKAP PEMBAYARAN PERBULAN' },
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
    { id: 'semua_rekapan', label: 'Semua Rekapan' }
  ];

  
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
            onClick={onToggleSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r h-screen md:sticky md:top-0 transition-all duration-300 ease-in-out select-none shrink-0 font-sans shadow-2xl md:shadow-sm overflow-hidden ${
        isDark 
          ? 'bg-[#0a0d0e] text-zinc-300 border-emerald-950/70' 
          : 'bg-white text-slate-700 border-slate-200'
      } ${
        isOpen 
          ? 'w-72 max-w-[85vw] translate-x-0' 
          : 'w-0 -translate-x-full md:w-16 md:translate-x-0'
      }`}>
        <div className="relative w-full h-full">
          {/* Expanded Content */}
          <div className={`absolute top-0 left-0 w-72 max-w-[85vw] h-full flex flex-col transition-opacity duration-300 ${isOpen ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`}>
            
        
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
            className={`p-1.5 rounded-lg transition transform active:scale-90 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
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
            onClick={() => {
              setExpandedSections({
                pendapatan: false,
                pengeluaran: false,
                hutang: false,
                piutang: false,
                monitoring_ppn: false,
              });
              handleItemClick('dashboard_2026');
            }}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl text-xs font-bold transition group select-none ${
              activeMenu === 'dashboard_2026' 
                ? (isDark 
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60 shadow-xs' 
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs')
                : (isDark 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent font-medium' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-medium')
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                activeMenu === 'dashboard_2026'
                  ? (isDark ? 'bg-emerald-900/90 text-emerald-300' : 'bg-emerald-600 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight uppercase truncate">DASHBOARD UTAMA</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
              activeMenu === 'dashboard_2026'
                ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')
                : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500')
            }`}>
              Live
            </span>
          </button>
        </div>

        {/* SECTION 1: PENDAPATAN BLUD */}
        <div>
          <button
            type="button"
            onClick={() => handleSectionHeaderClick('pendapatan', 'pendapatan_blud')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl font-bold text-xs uppercase tracking-tight transition group select-none ${
              isSectionActive('pendapatan')
                ? (isDark 
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60 shadow-xs' 
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs')
                : (isDark 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent font-medium' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-medium')
            }`}
            title="Klik untuk membuka / memilih Pendapatan BLUD"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                isSectionActive('pendapatan')
                  ? (isDark ? 'bg-emerald-900/90 text-emerald-300' : 'bg-emerald-600 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight truncate whitespace-nowrap">1. PENDAPATAN BLUD</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className={`h-5 min-w-[20px] px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isSectionActive('pendapatan')
                  ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')
                  : (isDark ? 'bg-zinc-800/90 text-zinc-400' : 'bg-slate-100 text-slate-500')
              }`}>
                {pendapatanSubmenus.length + 1}
              </span>
              <span
                onClick={(e) => toggleSection('pendapatan', e)}
                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                title="Buka/Tutup Sub Menu"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedSections.pendapatan 
                    ? 'rotate-90 text-emerald-600 dark:text-emerald-400 font-bold' 
                    : (isSectionActive('pendapatan') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5')
                }`} />
              </span>
            </div>
          </button>

          {/* Submenus Dropdown */}
          <AnimatePresence initial={false}>
            {expandedSections.pendapatan && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className={`mt-1.5 pl-3 pr-1 py-1 space-y-0.5 border-l-2 ml-4 ${
                  isDark ? 'border-zinc-800' : 'border-slate-200'
                }`}>
                  {(() => {
                    const isRekapActive = activeMenu === 'pendapatan_blud' && !activeSubmenu;
                    return (
                      <button
                        onClick={() => handleItemClick('pendapatan_blud')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                          isRekapActive 
                            ? (isDark 
                                ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-[3px] border-emerald-500 shadow-2xs' 
                                : 'bg-emerald-50 text-emerald-800 font-bold border-l-[3px] border-emerald-600 shadow-2xs')
                            : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium')
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${isRekapActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                          <span className="truncate">Rekap Pendapatan BLUD</span>
                        </div>
                        <ChevronRight className={`w-3 h-3 ${isRekapActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-zinc-700'}`} />
                      </button>
                    );
                  })()}

                  {pendapatanSubmenus.map((sub) => {
                    const isSubActive = activeMenu === 'pendapatan_blud' && activeSubmenu === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleItemClick('pendapatan_blud', sub.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                          isSubActive 
                            ? (isDark ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-[3px] border-emerald-500 shadow-2xs' : 'bg-emerald-50 text-emerald-800 font-bold border-l-[3px] border-emerald-600 shadow-2xs')
                            : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium')
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${isSubActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                          <span className="truncate">{sub.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 2: PENGELUARAN BLUD */}
        <div>
          <button
            type="button"
            onClick={() => handleSectionHeaderClick('pengeluaran', 'pengeluaran_blud')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl font-bold text-xs uppercase tracking-tight transition group select-none ${
              isSectionActive('pengeluaran')
                ? (isDark 
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60 shadow-xs' 
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs')
                : (isDark 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent font-medium' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-medium')
            }`}
            title="Klik untuk membuka / memilih Pengeluaran BLUD"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                isSectionActive('pengeluaran')
                  ? (isDark ? 'bg-emerald-900/90 text-emerald-300' : 'bg-emerald-600 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight truncate whitespace-nowrap">2. PENGELUARAN BLUD</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className={`h-5 min-w-[20px] px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isSectionActive('pengeluaran')
                  ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')
                  : (isDark ? 'bg-zinc-800/90 text-zinc-400' : 'bg-slate-100 text-slate-500')
              }`}>
                {pengeluaranSubmenus.length + 1}
              </span>
              <span
                onClick={(e) => toggleSection('pengeluaran', e)}
                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                title="Buka/Tutup Sub Menu"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedSections.pengeluaran 
                    ? 'rotate-90 text-emerald-600 dark:text-emerald-400 font-bold' 
                    : (isSectionActive('pengeluaran') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5')
                }`} />
              </span>
            </div>
          </button>

          {/* Submenus Dropdown */}
          <AnimatePresence initial={false}>
            {expandedSections.pengeluaran && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className={`mt-1.5 pl-3 pr-1 py-1 space-y-0.5 border-l-2 ml-4 ${
                  isDark ? 'border-zinc-800' : 'border-slate-200'
                }`}>
                  {(() => {
                    const isRekapActive = activeMenu === 'pengeluaran_blud' && !activeSubmenu;
                    return (
                      <button
                        onClick={() => handleItemClick('pengeluaran_blud')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                          isRekapActive 
                            ? (isDark 
                                ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-[3px] border-emerald-500 shadow-2xs' 
                                : 'bg-emerald-50 text-emerald-800 font-bold border-l-[3px] border-emerald-600 shadow-2xs')
                            : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium')
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${isRekapActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                          <span className="truncate">Rekap Pengeluaran BLUD</span>
                        </div>
                        <ChevronRight className={`w-3 h-3 ${isRekapActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-zinc-700'}`} />
                      </button>
                    );
                  })()}

                  {pengeluaranSubmenus.map((sub) => {
                    const isSubActive = activeMenu === 'pengeluaran_blud' && activeSubmenu === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleItemClick('pengeluaran_blud', sub.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                          isSubActive 
                            ? (isDark ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-[3px] border-emerald-500 shadow-2xs' : 'bg-emerald-50 text-emerald-800 font-bold border-l-[3px] border-emerald-600 shadow-2xs')
                            : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium')
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${isSubActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                          <span className="truncate">{sub.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 3: HUTANG (BLUD & APBD) */}
        <div>
          <button
            type="button"
            onClick={() => handleSectionHeaderClick('hutang', 'hutang', 'semua_rekap_hutang')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl font-bold text-xs uppercase tracking-tight transition group select-none ${
              isSectionActive('hutang')
                ? (isDark 
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60 shadow-xs' 
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs')
                : (isDark 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent font-medium' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-medium')
            }`}
            title="Klik untuk membuka / memilih Hutang (BLUD & APBD)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                isSectionActive('hutang')
                  ? (isDark ? 'bg-emerald-900/90 text-emerald-300' : 'bg-emerald-600 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight truncate whitespace-nowrap">3. HUTANG (BLUD & APBD)</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className={`h-5 min-w-[20px] px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isSectionActive('hutang')
                  ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')
                  : (isDark ? 'bg-zinc-800/90 text-zinc-400' : 'bg-slate-100 text-slate-500')
              }`}>
                {hutangSubmenus.length}
              </span>
              <span
                onClick={(e) => toggleSection('hutang', e)}
                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                title="Buka/Tutup Sub Menu"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedSections.hutang 
                    ? 'rotate-90 text-emerald-600 dark:text-emerald-400 font-bold' 
                    : (isSectionActive('hutang') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5')
                }`} />
              </span>
            </div>
          </button>

          {/* Submenus Dropdown */}
          <AnimatePresence initial={false}>
            {expandedSections.hutang && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className={`mt-1.5 pl-3 pr-1 py-1 space-y-0.5 border-l-2 ml-4 ${
                  isDark ? 'border-zinc-800' : 'border-slate-200'
                }`}>
                  {hutangSubmenus.map((sub) => {
                    const isSubActive = activeMenu === 'hutang' && (activeSubmenu === sub.id || (!activeSubmenu && sub.id === 'semua_rekap_hutang'));
                    return (
                      <button
                        key={sub.id}
                        id={`sidebar-submenu-${sub.id}`}
                        onClick={() => handleItemClick('hutang', sub.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10.5px] transition truncate flex items-center justify-between ${
                          isSubActive 
                            ? (isDark ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-[3px] border-emerald-500 shadow-2xs' : 'bg-emerald-50 text-emerald-800 font-bold border-l-[3px] border-emerald-600 shadow-2xs')
                            : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium')
                        }`}
                        title={sub.label}
                      >
                        <div className="flex items-center min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${isSubActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                          <span className="truncate">{sub.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 4: PIUTANG & KLAIM */}
        <div>
          <button
            type="button"
            onClick={() => handleSectionHeaderClick('piutang', 'perusahaan_asuransi')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl font-bold text-xs uppercase tracking-tight transition group select-none ${
              isSectionActive('piutang')
                ? (isDark 
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60 shadow-xs' 
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs')
                : (isDark 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent font-medium' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-medium')
            }`}
            title="Klik untuk membuka / memilih Piutang & Klaim"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                isSectionActive('piutang')
                  ? (isDark ? 'bg-emerald-900/90 text-emerald-300' : 'bg-emerald-600 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight truncate whitespace-nowrap">4. PIUTANG & KLAIM</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className={`h-5 min-w-[20px] px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isSectionActive('piutang')
                  ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')
                  : (isDark ? 'bg-zinc-800/90 text-zinc-400' : 'bg-slate-100 text-slate-500')
              }`}>
                {piutangSubmenus.length}
              </span>
              <span
                onClick={(e) => toggleSection('piutang', e)}
                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                title="Buka/Tutup Sub Menu"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedSections.piutang 
                    ? 'rotate-90 text-emerald-600 dark:text-emerald-400 font-bold' 
                    : (isSectionActive('piutang') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5')
                }`} />
              </span>
            </div>
          </button>

          {/* Submenus Dropdown */}
          <AnimatePresence initial={false}>
            {expandedSections.piutang && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className={`mt-1.5 pl-3 pr-1 py-1 space-y-0.5 border-l-2 ml-4 ${
                  isDark ? 'border-zinc-800' : 'border-slate-200'
                }`}>
                  {piutangSubmenus.map((sub) => {
                    const isSubActive = activeMenu === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleItemClick(sub.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                          isSubActive 
                            ? (isDark ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-[3px] border-emerald-500 shadow-2xs' : 'bg-emerald-50 text-emerald-800 font-bold border-l-[3px] border-emerald-600 shadow-2xs')
                            : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium')
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${isSubActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                          <span className="truncate">{sub.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 5: MONITORING PPN (New Integrated Module) */}
        <div>
          <button
            type="button"
            onClick={() => handleSectionHeaderClick('monitoring_ppn', 'monitoring_ppn', 'monitoring')}
            className={`w-full h-11 flex items-center justify-between px-2.5 rounded-xl font-bold text-xs uppercase tracking-tight transition group select-none ${
              isSectionActive('monitoring_ppn')
                ? (isDark 
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60 shadow-xs' 
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs')
                : (isDark 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent font-medium' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-medium')
            }`}
            title="Klik untuk membuka / memilih Sistem Monitoring PPN 2026"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                isSectionActive('monitoring_ppn')
                  ? (isDark ? 'bg-emerald-900/90 text-emerald-300' : 'bg-emerald-600 text-white shadow-xs')
                  : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
              }`}>
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold tracking-tight truncate whitespace-nowrap">5. MONITORING PPN</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className={`h-5 min-w-[20px] px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isSectionActive('monitoring_ppn')
                  ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')
                  : (isDark ? 'bg-zinc-800/90 text-zinc-400' : 'bg-slate-100 text-slate-500')
              }`}>
                4
              </span>
              <span
                onClick={(e) => toggleSection('monitoring_ppn', e)}
                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                title="Buka/Tutup Sub Menu"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedSections.monitoring_ppn
                    ? 'rotate-90 text-emerald-600 dark:text-emerald-400 font-bold' 
                    : (isSectionActive('monitoring_ppn') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5')
                }`} />
              </span>
            </div>
          </button>
          
          {/* Submenus for MONITORING PPN */}
          <AnimatePresence initial={false}>
            {expandedSections.monitoring_ppn && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className={`mt-1.5 pl-3 pr-1 py-1 space-y-0.5 border-l-2 ml-4 ${
                  isDark ? 'border-zinc-800' : 'border-slate-200'
                }`}>
                  {(() => {
                    const isMonActive = activeMenu === 'monitoring_ppn' && (!activeSubmenu || activeSubmenu === 'monitoring');
                    return (
                      <button
                        type="button"
                        onClick={() => handleItemClick('monitoring_ppn', 'monitoring')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                          isMonActive
                            ? (isDark ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-[3px] border-emerald-500 shadow-2xs' : 'bg-emerald-50 text-emerald-800 font-bold border-l-[3px] border-emerald-600 shadow-2xs')
                            : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium')
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${isMonActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                          <span className="truncate">Dashboard Terintegrasi</span>
                        </div>
                        <ChevronRight className={`w-3 h-3 ${isMonActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-zinc-700'}`} />
                      </button>
                    );
                  })()}
                  
                  {(() => {
                    const isCoretaxActive = activeMenu === 'monitoring_ppn' && activeSubmenu === 'coretax';
                    return (
                      <button
                        type="button"
                        onClick={() => handleItemClick('monitoring_ppn', 'coretax')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                          isCoretaxActive
                            ? (isDark ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-[3px] border-emerald-500 shadow-2xs' : 'bg-emerald-50 text-emerald-800 font-bold border-l-[3px] border-emerald-600 shadow-2xs')
                            : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium')
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${isCoretaxActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                          <span className="truncate">Data Coretax</span>
                        </div>
                      </button>
                    );
                  })()}

                  {(() => {
                    const isHutangSubActive = activeMenu === 'monitoring_ppn' && activeSubmenu === 'hutang';
                    return (
                      <button
                        type="button"
                        onClick={() => handleItemClick('monitoring_ppn', 'hutang')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                          isHutangSubActive
                            ? (isDark ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-[3px] border-emerald-500 shadow-2xs' : 'bg-emerald-50 text-emerald-800 font-bold border-l-[3px] border-emerald-600 shadow-2xs')
                            : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium')
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${isHutangSubActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                          <span className="truncate">Data Hutang SP2D</span>
                        </div>
                      </button>
                    );
                  })()}

                  {(() => {
                    const isAuditActive = activeMenu === 'monitoring_ppn' && activeSubmenu === 'audit';
                    return (
                      <button
                        type="button"
                        onClick={() => handleItemClick('monitoring_ppn', 'audit')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition truncate flex items-center justify-between ${
                          isAuditActive
                            ? (isDark ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-[3px] border-emerald-500 shadow-2xs' : 'bg-emerald-50 text-emerald-800 font-bold border-l-[3px] border-emerald-600 shadow-2xs')
                            : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 font-medium' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium')
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 ${isAuditActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                          <span className="truncate">Audit & Selisih</span>
                        </div>
                      </button>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
          {user && (
            <button 
              onClick={onOpenProfileModal} 
              className={`p-1.5 rounded-lg transition ${
                isDark ? 'hover:bg-emerald-950/60 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-700'
              }`} 
              title="Pengaturan Profil Pengguna (Edit Foto, Nama, Email, Password)"
            >
              <UserCog className="w-4 h-4" />
            </button>
          )}

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
          <div className={`p-2 rounded-xl transition border space-y-2 ${
            isDark ? 'bg-zinc-900/80 border-emerald-950/60' : 'bg-white border-slate-200/80 shadow-2xs'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div 
                onClick={onOpenProfileModal}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                title="Buka Pengaturan Profil Pengguna"
              >
                <div className="relative shrink-0">
                  <img 
                    src={profile.photoURL} 
                    alt="Avatar" 
                    className="w-7 h-7 rounded-full bg-emerald-800 object-cover ring-1 ring-emerald-500/40 group-hover:ring-emerald-400 transition" 
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-black"></span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-xs font-semibold truncate block group-hover:text-emerald-400 transition ${
                    isDark ? 'text-zinc-100' : 'text-slate-900'
                  }`}>
                    {profile.displayName}
                  </span>
                  <span className={`text-[10px] truncate block ${
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

            {/* Profile Action & Role Row */}
            <div className={`flex items-center justify-between pt-1.5 border-t text-[11px] ${
              isDark ? 'border-zinc-800/80' : 'border-slate-100'
            }`}>
              <div>{getRoleBadge(role, isAdmin)}</div>

              <button
                type="button"
                onClick={onOpenProfileModal}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition ${
                  isDark 
                    ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50' 
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
                title="Edit Username, Foto, Email, dan Password"
              >
                <UserCog className="w-3 h-3" />
                <span>Edit Profil</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition transform active:scale-98 group"
          >
            <LogIn className="w-4 h-4 text-white group-hover:translate-x-0.5 transition" />
            <span>Login / Masuk PIC</span>
          </button>
        )}
      </div>

    
          </div>
          
          {/* Collapsed Content */}
          <div className={`absolute top-0 left-0 w-16 h-full flex-col items-center py-4 transition-opacity duration-300 hidden md:flex ${!isOpen ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`}>
            
        <button 
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg mb-6 transition transform active:scale-90 ${
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
                ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-sm' : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800')
            }`}
            title="Dashboard Utama"
          >
            <Layers className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleItemClick('pendapatan_blud')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              isSectionActive('pendapatan')
                ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-sm' : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800')
            }`}
            title="Pendapatan BLUD"
          >
            <TrendingUp className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleItemClick('pengeluaran_blud')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              isSectionActive('pengeluaran')
                ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-sm' : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800')
            }`}
            title="Pengeluaran BLUD"
          >
            <TrendingDown className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleItemClick('hutang')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              isSectionActive('hutang')
                ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-sm' : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800')
            }`}
            title="Hutang BLUD & APBD"
          >
            <CreditCard className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleItemClick('perusahaan_asuransi')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              isSectionActive('piutang')
                ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-sm' : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800')
            }`}
            title="Piutang & Klaim"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleItemClick('monitoring_ppn')}
            className={`p-3 rounded-xl transition w-full flex justify-center ${
              isSectionActive('monitoring_ppn')
                ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-sm' : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30')
                : (isDark ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800')
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
              onClick={onOpenProfileModal || onOpenSettingsModal}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-500/40 shadow-sm overflow-hidden"
              title={`${profile.displayName || user.email || 'Pengguna'} - Pengaturan Profil`}
            >
              <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
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
      
          </div>
        </div>
      </aside>
    </>
  );

};
