import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Trash2, Link as LinkIcon, RefreshCw, Cloud, CheckCircle2 } from 'lucide-react';
import { RsudLogo } from './RsudLogo';
import defaultBgImg from '../assets/images/rsud_jatisari_bg_1787917665665.jpg';
import { pushAllLocalDataToFirestore } from '../services/firestoreSync';
import { auth } from '../lib/firebase';
import { updateAppFavicon } from '../utils/faviconHelper';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(localStorage.getItem('rsud_custom_logo'));
  const [bgPreview, setBgPreview] = useState<string | null>(localStorage.getItem('rsud_custom_login_bg'));
  const [urlInput, setUrlInput] = useState<string>('');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncCloudSuccess, setSyncCloudSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSyncToFirestore = async () => {
    setIsSyncingCloud(true);
    setSyncCloudSuccess(null);
    try {
      await pushAllLocalDataToFirestore();
      setSyncCloudSuccess('Seluruh data (Pendapatan, Pengeluaran, Hutang, dan Piutang) berhasil disinkronkan ke Cloud Firestore!');
    } catch (e: any) {
      alert(e.message || 'Gagal sinkronisasi ke cloud.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        localStorage.setItem('rsud_custom_logo', base64String);
        updateAppFavicon(base64String);
        window.dispatchEvent(new Event('rsud_logo_updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setLogoPreview(null);
    localStorage.removeItem('rsud_custom_logo');
    updateAppFavicon(null);
    window.dispatchEvent(new Event('rsud_logo_updated'));
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setBgPreview(base64String);
        localStorage.setItem('rsud_custom_login_bg', base64String);
        window.dispatchEvent(new Event('rsud_bg_updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgUrlApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setBgPreview(urlInput.trim());
      localStorage.setItem('rsud_custom_login_bg', urlInput.trim());
      window.dispatchEvent(new Event('rsud_bg_updated'));
      setUrlInput('');
    }
  };

  const handleResetBg = () => {
    setBgPreview(null);
    localStorage.removeItem('rsud_custom_login_bg');
    window.dispatchEvent(new Event('rsud_bg_updated'));
  };

  const currentBg = bgPreview || defaultBgImg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-emerald-950/80 text-slate-800 dark:text-zinc-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#12181f]/60 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pengaturan Aplikasi</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          {/* Logo Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-1">Logo Instansi (RSUD)</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
              Ubah logo rumah sakit yang ditampilkan pada halaman login dan dashboard. Anda dapat menggunakan logo default atau mengunggah gambar baru.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-[#12181f]">
              <div className="w-20 h-20 bg-white dark:bg-[#161f28] rounded-xl shadow-sm border border-slate-200 dark:border-zinc-700 p-2 flex items-center justify-center shrink-0">
                <RsudLogo className="w-16 h-16" />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Ganti Logo
                  </button>
                  {logoPreview && (
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-medium rounded-lg text-sm transition-colors border border-rose-200 dark:border-rose-800/60"
                      title="Kembalikan ke logo awal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-zinc-800" />

          {/* Login Background Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-1">Background Halaman Login</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
              Sesuaikan latar belakang halaman login dengan foto gedung rumah sakit atau gambar pilihan Anda.
            </p>

            <div className="space-y-4 p-4 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-[#12181f]">
              <div 
                className="w-full h-32 rounded-xl bg-cover bg-center border border-slate-200 dark:border-zinc-700 relative shadow-inner overflow-hidden"
                style={{ backgroundImage: `url("${currentBg}")` }}
              >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="text-white text-xs font-semibold px-3 py-1 bg-black/50 rounded-full backdrop-blur-md">
                    {bgPreview ? 'Background Kustom Aktif' : 'Background Default (RSUD Jatisari)'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/*"
                  ref={bgFileInputRef}
                  className="hidden"
                  onChange={handleBgFileChange}
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => bgFileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Background Baru
                  </button>
                  {bgPreview && (
                    <button
                      onClick={handleResetBg}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-medium rounded-lg text-sm transition-colors border border-rose-200 dark:border-rose-800/60"
                      title="Reset ke background default"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset
                    </button>
                  )}
                </div>

                <form onSubmit={handleBgUrlApply} className="flex gap-2 pt-1">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      placeholder="Atau masukkan URL gambar (https://...)"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#0d1216] border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!urlInput.trim()}
                    className="px-3 py-2 bg-slate-800 dark:bg-emerald-600 hover:bg-slate-900 dark:hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition"
                  >
                    Terapkan
                  </button>
                </form>
              </div>
            </div>

            {/* Cloud Firestore Synchronization Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 mb-1 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-500" />
                Sinkronisasi Cloud Firestore
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
                Sinkronkan seluruh data lokal (Pendapatan, Pengeluaran, Hutang, Piutang, dan Rekapan) ke server Firebase Firestore agar selalu tersinkronisasi saat dibuka di hosting (Netlify/Domain).
              </p>

              {syncCloudSuccess && (
                <div className="mb-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{syncCloudSuccess}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSyncToFirestore}
                disabled={isSyncingCloud}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                {isSyncingCloud ? 'Menyinkronkan ke Cloud...' : 'Sinkronkan Semua Data Lokal ke Cloud Firestore'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#12181f]/60 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 dark:bg-emerald-600 hover:bg-slate-900 dark:hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
