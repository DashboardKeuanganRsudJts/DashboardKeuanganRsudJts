import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ExternalLink, 
  X, 
  RefreshCw, 
  HardDrive, 
  ShieldCheck, 
  Clock, 
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  checkIsQuotaExceeded, 
  clearQuotaExceeded, 
  UPGRADE_URL, 
  PRICING_URL 
} from '../utils/firestoreErrorHandler';
import { db } from '../lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

export const FirestoreQuotaBanner: React.FC = () => {
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(() => checkIsQuotaExceeded());
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  useEffect(() => {
    const handleExceeded = () => {
      setIsQuotaExceeded(true);
      setIsDismissed(false);
    };
    const handleCleared = () => {
      setIsQuotaExceeded(false);
    };

    window.addEventListener('firestore_quota_exceeded', handleExceeded);
    window.addEventListener('firestore_quota_cleared', handleCleared);

    return () => {
      window.removeEventListener('firestore_quota_exceeded', handleExceeded);
      window.removeEventListener('firestore_quota_cleared', handleCleared);
    };
  }, []);

  if (!isQuotaExceeded || isDismissed) {
    return null;
  }

  const handleRetryCheck = async () => {
    setIsChecking(true);
    setCheckResult(null);
    try {
      // Test read from server to see if quota has reset
      await getDocFromServer(doc(db, 'test', 'connection'));
      clearQuotaExceeded();
      setIsQuotaExceeded(false);
      setCheckResult('Kuota Firestore sudah aktif kembali!');
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('Quota') || msg.includes('resource-exhausted')) {
        setCheckResult('Kuota harian masih mencapai batas. Silakan tunggu jadwal reset harian atau lakukan upgrade ke Blaze Plan.');
      } else {
        setCheckResult('Koneksi sedang offline atau sinkronisasi ditunda.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-3 sm:px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-950 dark:text-amber-100 text-xs sm:text-sm">
                Batas Kuota Harian Cloud Firestore (Spark Free Tier) Tercapai
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Mode Lokal Aktif (Data Tersimpan Aman)
              </span>
            </div>
            <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/90 text-[11px] sm:text-xs leading-relaxed">
              Batas gratis 20.000 penulisan per hari pada paket Spark telah tercapai. Kuota otomatis di-reset besok (00:00 UTC / ~07:00 WIB). Seluruh data, perhitungan, dan upload tetap berfungsi penuh di browser melalui penyimpanan IndexedDB.
            </p>

            {showDetails && (
              <div className="mt-2 p-2.5 rounded bg-amber-100/60 dark:bg-zinc-900/80 border border-amber-300/40 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-amber-900 dark:text-amber-200">
                  <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Proyek: <code className="font-mono bg-amber-200/50 dark:bg-zinc-800 px-1 rounded">gen-lang-client-0631502092</code></span>
                </div>
                <p className="text-amber-800 dark:text-amber-300">
                  Untuk kapasitas tanpa batas harian atau sinkronisasi multi-perangkat instan kapan saja, Anda dapat mengaktifkan paket Blaze (Pay-as-you-go) di Google Cloud / Firebase Console.
                </p>
                {checkResult && (
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                    {checkResult}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
          <a
            href={UPGRADE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded text-[11px] shadow-xs transition"
            title="Buka Firebase Console untuk upgrade atau melihat penggunaan kuota"
          >
            <span>Upgrade ke Blaze Plan</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 text-[11px] font-medium transition"
          >
            <span>{showDetails ? 'Tutup Detail' : 'Detail'}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={handleRetryCheck}
            disabled={isChecking}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 text-[11px] font-medium transition disabled:opacity-50"
            title="Cek ulang status kuota sekarang"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Mengecek...' : 'Cek Status'}</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition"
            title="Tutup banner pemberitahuan ini"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
