import React, { useState } from 'react';
import { 
  Building2, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  PlusCircle, 
  Calendar,
  Sparkles,
  UploadCloud,
  LogOut,
  Settings,
  LogIn,
  ShieldAlert
} from 'lucide-react';
import { SyncStatusInfo } from '../types/piutang';
import { formatDateTimeIndo } from '../utils/formatters';
import { RsudLogo } from './RsudLogo';
import { User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { SettingsModal } from './SettingsModal';

interface NavbarProps { 
  isAdmin?: boolean;
  role?: string;
  syncConfig: SyncStatusInfo;
  totalRecordsCount: number;
  user: User | null;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  syncConfig,
  totalRecordsCount,
  user,
  isAdmin,
  role,
  onOpenLoginModal
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getRoleBadge = (r?: string, admin?: boolean) => {
    if (admin || r === 'admin') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-900">Admin</span>;
    if (r === 'pic_piutang') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500 text-white uppercase">PIC Piutang</span>;
    if (r === 'pic_pendapatan') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white uppercase">PIC Pendapatan</span>;
    if (r === 'pic_pengeluaran') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white uppercase">PIC Pengeluaran</span>;
    if (r === 'pic_hutang') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase">PIC Hutang</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-200">Viewer</span>;
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200">
        {/* Top hospital announcement bar */}
        <div className="bg-emerald-900 text-emerald-100 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-200 font-medium">
              SIM-RS Terpadu
            </span>
            <span className="font-medium text-white">RSUD Jatisari Kabupaten Karawang</span>
            <span className="text-emerald-300 hidden sm:inline">•</span>
            <span className="text-emerald-200 hidden sm:inline">Sub Bagian Keuangan & Klaim Piutang</span>
          </div>
          
          <div className="flex items-center gap-4 ml-auto text-xs">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${syncConfig.autoSyncDaily ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${syncConfig.autoSyncDaily ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              </span>
              <span className="text-emerald-200 font-medium">
                {syncConfig.autoSyncDaily ? 'Auto-Sync Google Sheets: Aktif' : 'Auto-Sync: Nonaktif'}
              </span>
            </div>
            
            {user ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-emerald-800">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=047857&color=fff`} alt={user.displayName || 'User'} className="w-5 h-5 rounded-full bg-emerald-800" />
                <span className="font-medium text-emerald-100 hidden sm:inline">{user.displayName || user.email}</span>
                {getRoleBadge(role, isAdmin)}
                
                {(isAdmin || role === 'admin') && (
                  <button 
                    onClick={() => setIsSettingsOpen(true)} 
                    className="text-emerald-400 hover:text-white transition ml-1" 
                    title="Pengaturan"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}

                <button 
                  onClick={() => {
                    signOut(auth).then(() => {
                      onOpenLoginModal();
                    });
                  }} 
                  className="text-emerald-400 hover:text-white transition ml-1" 
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 pl-3 border-l border-emerald-800">
                <span className="text-emerald-300 text-[11px] italic hidden md:inline">Mode Publik (Viewer)</span>
                <button
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-sm transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login / Masuk</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Logo & Title */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200">
                <RsudLogo className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Dashboard Piutang RSUD Jatisari
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live Sheets API
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span>Monitoring Tagihan Pelayanan, Khusus Piutang</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-medium text-slate-600">{totalRecordsCount} Berkas Terdaftar</span>
                </p>
              </div>
            </div>
          </div>

          {/* Sync Status Banner */}
          {syncConfig.lastSyncedAt && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Sinkronisasi Terakhir:</span>
                <span className="font-medium text-slate-700">{formatDateTimeIndo(syncConfig.lastSyncedAt)}</span>
                {syncConfig.spreadsheetName && (
                  <span className="hidden sm:inline text-slate-400">
                    via file: <span className="font-medium text-slate-600">{syncConfig.spreadsheetName}</span> (Sheet: {syncConfig.sheetName})
                  </span>
                )}
              </div>
              <div className="text-emerald-700 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Otomatis diperbarui setiap hari</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};
