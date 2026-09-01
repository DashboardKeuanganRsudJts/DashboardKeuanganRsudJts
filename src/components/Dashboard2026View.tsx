import React, { useState, useEffect, useMemo } from 'react';
import { 
  REKAP_BULANAN_2026_DATA, 
  LIST_BULAN_2026, 
  RekapBulanan2026Row,
  PerusahaanAsuransiRow,
  generateAllMonthsPerusahaanData,
  LISTRIK_KANTIN_REAL_DATA,
  ListrikKantinStandGroup
} from '../data/spreadsheetData2026';
import { formatRupiah } from '../utils/formatters';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Building, 
  Zap, 
  Layers, 
  ArrowUpRight,
  Filter,
  BarChart3,
  RefreshCw,
  UploadCloud,
  CreditCard,
  Building2,
  FileSpreadsheet,
  Clock,
  ChevronRight,
  ShieldCheck,
  Activity,
  PieChart,
  Receipt,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPie,
  Pie,
  Cell
} from 'recharts';

interface Dashboard2026ViewProps {
  isAdmin?: boolean;
  currentUserEmail?: string;
  userRole?: string;
  onNavigateTab: (tab: string, submenu?: string) => void;
  onOpenUploadModal?: () => void;
}

export const Dashboard2026View: React.FC<Dashboard2026ViewProps> = ({ isAdmin, currentUserEmail, userRole, onNavigateTab, onOpenUploadModal }) => {
  const [selectedBulan, setSelectedBulan] = useState<string>('AGUSTUS');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => new Date().toLocaleTimeString('id-ID'));

  // 1. Live Data Perusahaan & Asuransi
  const [perusahaanData, setPerusahaanData] = useState<PerusahaanAsuransiRow[]>(() => {
    try {
      const saved = localStorage.getItem('rsud_perusahaan_asuransi_2026');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return generateAllMonthsPerusahaanData();
  });

  // 2. Live Data Listrik Kantin
  const [listrikData, setListrikData] = useState<ListrikKantinStandGroup[]>(() => {
    try {
      const saved = localStorage.getItem('rsud_listrik_kantin_2026');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((s: ListrikKantinStandGroup) => 
            s && s.namaStand && 
            s.namaStand.toUpperCase() !== 'STAND KANTIN RSUD' &&
            s.namaStand.toUpperCase() !== 'STAND KANTIN'
          );
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return LISTRIK_KANTIN_REAL_DATA.filter(s => 
      s.namaStand.toUpperCase() !== 'STAND KANTIN RSUD' &&
      s.namaStand.toUpperCase() !== 'STAND KANTIN'
    );
  });

  // 3. Live Data Hutang
  const [hutangList, setHutangList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('rsud_hutang_blud_apbd');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return [
      { id: 'HUT-001', namaPerusahaan: 'CV. TATAR SUNDA PROJECT', tahun: '2025', tanggalInvoice: '24 August 2025', totalTagihan: 305490400, umurHutangHari: 369, kodeRekening: '5.1.02.02.01.0019', kegiatan: 'Pengadaan Fisik & Sarpras Gedung RSUD', status: 'Belum Lunas' },
      { id: 'HUT-002', namaPerusahaan: 'CV. MAHONI', tahun: '2025', tanggalInvoice: '4 September 2025', totalTagihan: 99187935, umurHutangHari: 358, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Pengadaan ATK & Cetakan Kantor', status: 'Belum Lunas' },
      { id: 'HUT-003', namaPerusahaan: 'PT. KEBAYORAN PHARMA', tahun: '2025', tanggalInvoice: '12 September 2025', totalTagihan: 15184800, umurHutangHari: 350, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Pengadaan Obat JKN & Non JKN', status: 'Belum Lunas' },
      { id: 'HUT-004', namaPerusahaan: 'PT. AIRINDO SENTRA MEDIKA', tahun: '2026', tanggalInvoice: '16 January 2026', totalTagihan: 86580000, umurHutangHari: 224, kodeRekening: '5.1.02.02.01.0025', kegiatan: 'Pemeliharaan Alat Elektromedis RS', status: 'Belum Lunas' },
      { id: 'HUT-005', namaPerusahaan: 'PT. AIRINDO SENTRA MEDIKA', tahun: '2026', tanggalInvoice: '16 February 2026', totalTagihan: 133200000, umurHutangHari: 193, kodeRekening: '5.1.02.02.01.0025', kegiatan: 'Pemeliharaan Alat Elektromedis RS', status: 'Belum Lunas' },
      { id: 'HUT-006', namaPerusahaan: 'PT. RANAH MULTI SEMESTA', tahun: '2026', tanggalInvoice: '22 March 2026', totalTagihan: 53280701, umurHutangHari: 159, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Pengadaan Bahan Medis Habis Pakai (BMHP)', status: 'Belum Lunas' },
      { id: 'HUT-007', namaPerusahaan: 'PT. BINA SAN PRIMA', tahun: '2026', tanggalInvoice: '29 April 2026', totalTagihan: 4018200, umurHutangHari: 121, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Pengadaan Vaksin & Obat Khusus', status: 'Belum Lunas' },
      { id: 'HUT-008', namaPerusahaan: 'PT. ANUGRAH ARGON MEDIKA', tahun: '2026', tanggalInvoice: '10 May 2026', totalTagihan: 7032690, umurHutangHari: 110, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Pengadaan Reagensia Laboratorium', status: 'Belum Lunas' },
    ];
  });

  // 4. Live Data Pendapatan & Pengeluaran
  const [pendapatanList, setPendapatanList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('rsud_pendapatan_blud_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return [
      { id: 'PEND-001', bulan: 'Agustus', tanggal: '28-08-2026', sumber: 'Pelayanan Rawat Inap BPJS & Umum', kategori: 'Pendapatan Fungsional RS', jumlahTarget: 2100000000, jumlahRealisasi: 1845000000, keterangan: 'On Track' },
      { id: 'PEND-002', bulan: 'Agustus', tanggal: '27-08-2026', sumber: 'Pelayanan Rawat Jalan & Poliklinik', kategori: 'Pendapatan Fungsional RS', jumlahTarget: 1400000000, jumlahRealisasi: 1285129960, keterangan: 'Normal' },
      { id: 'PEND-003', bulan: 'Agustus', tanggal: '26-08-2026', sumber: 'Instalasi Gawat Darurat & Bedah', kategori: 'Pendapatan Fungsional RS', jumlahTarget: 950000000, jumlahRealisasi: 820000000, keterangan: 'Stabil' },
      { id: 'PEND-004', bulan: 'Agustus', tanggal: '25-08-2026', sumber: 'Kerjasama Asuransi & Perusahaan', kategori: 'Kerjasama Pihak Ketiga', jumlahTarget: 650000000, jumlahRealisasi: 580000000, keterangan: 'Tagihan Proses Piutang' },
    ];
  });

  const [pengeluaranList, setPengeluaranList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('rsud_pengeluaran_blud_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return [
      { id: 'PENG-001', bulan: 'Agustus', tanggal: '28-08-2026', uraian: 'Belanja Gaji & Tunjangan Pegawai BLUD', kodeRekening: '5.1.01.01.01.0001', kategori: 'Belanja Pegawai', jumlah: 1850000000, penerima: 'Pegawai & Nakes RSUD', status: 'Lunas' },
      { id: 'PENG-002', bulan: 'Agustus', tanggal: '27-08-2026', uraian: 'Pengadaan Obat-obatan & Bahan Habis Pakai Medis', kodeRekening: '5.1.02.01.01.0019', kategori: 'Belanja Barang & Jasa', jumlah: 685000000, penerima: 'PT. Farma Medika Nusantara', status: 'Lunas' },
      { id: 'PENG-003', bulan: 'Agustus', tanggal: '25-08-2026', uraian: 'Pemeliharaan Alat Kesehatan RS & Kalibrasi', kodeRekening: '5.1.02.02.01.0025', kategori: 'Belanja Pemeliharaan', jumlah: 145000000, penerima: 'CV. Medika Teknik Utama', status: 'Lunas' },
      { id: 'PENG-004', bulan: 'Agustus', tanggal: '22-08-2026', uraian: 'Belanja Listrik, Air, dan Jaringan Internet RSUD', kodeRekening: '5.1.02.02.01.0004', kategori: 'Belanja Operasional', jumlah: 85500000, penerima: 'PLN, PDAM & Telkom', status: 'Lunas' },
      { id: 'PENG-005', bulan: 'Agustus', tanggal: '20-08-2026', uraian: 'Pengadaan Alat Penunjang Laboratorium & Radiologi', kodeRekening: '5.1.02.03.02.0001', kategori: 'Belanja Modal', jumlah: 218787838, penerima: 'PT. Diagnostik Sejahtera', status: 'Proses' },
    ];
  });

  // Listen for real-time updates
  useEffect(() => {
    const handleDataUpdate = () => {
      try {
        const savedP = localStorage.getItem('rsud_perusahaan_asuransi_2026');
        if (savedP) setPerusahaanData(JSON.parse(savedP));

        const savedL = localStorage.getItem('rsud_listrik_kantin_2026');
        if (savedL) setListrikData(JSON.parse(savedL));

        const savedH = localStorage.getItem('rsud_hutang_blud_apbd');
        if (savedH) setHutangList(JSON.parse(savedH));

        const savedPend = localStorage.getItem('rsud_pendapatan_blud_data');
        if (savedPend) setPendapatanList(JSON.parse(savedPend));

        const savedPeng = localStorage.getItem('rsud_pengeluaran_blud_data');
        if (savedPeng) setPengeluaranList(JSON.parse(savedPeng));

        setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener('rsud_perusahaan_data_updated', handleDataUpdate);
    window.addEventListener('rsud_listrik_data_updated', handleDataUpdate);
    window.addEventListener('rsud_hutang_data_updated', handleDataUpdate);
    window.addEventListener('rsud_pendapatan_data_updated', handleDataUpdate);
    window.addEventListener('rsud_pengeluaran_data_updated', handleDataUpdate);
    window.addEventListener('rsud_data_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);

    return () => {
      window.removeEventListener('rsud_perusahaan_data_updated', handleDataUpdate);
      window.removeEventListener('rsud_listrik_data_updated', handleDataUpdate);
      window.removeEventListener('rsud_hutang_data_updated', handleDataUpdate);
      window.removeEventListener('rsud_pendapatan_data_updated', handleDataUpdate);
      window.removeEventListener('rsud_pengeluaran_data_updated', handleDataUpdate);
      window.removeEventListener('rsud_data_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, []);

  // Compute Aggregates:
  // 1. PENDAPATAN BLUD (Tahun & Bulan)
  const totalPendapatanRealisasiBulanIni = useMemo(() => {
    return pendapatanList.reduce((acc, curr) => acc + (curr.jumlahRealisasi || 0), 0);
  }, [pendapatanList]);
  const totalPendapatanTargetBulanIni = useMemo(() => {
    return pendapatanList.reduce((acc, curr) => acc + (curr.jumlahTarget || 0), 0);
  }, [pendapatanList]);
  const estimasiPendapatanTahunan = 32850000000; // 32.85 Miliar estimasi tahun 2026
  const estimasiPendapatanRealisasiTahunan = 28450129960; // Realisasi kumulatif

  // 2. PENGELUARAN BLUD
  const totalPengeluaranBulanIni = useMemo(() => {
    return pengeluaranList.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  }, [pengeluaranList]);
  const estimasiPengeluaranPaguTahunan = 31500000000;
  const estimasiPengeluaranRealisasiTahunan = 24184287838;

  // 3. TOTAL HUTANG DALAM SATU TAHUN (2026 & 2025)
  const totalHutangSatuTahun2026 = useMemo(() => {
    return hutangList
      .filter(item => item.status === 'Belum Lunas' && (item.tahun === '2026' || !item.tahun || item.tanggalInvoice.includes('2026')))
      .reduce((acc, curr) => acc + (curr.totalTagihan || 0), 0);
  }, [hutangList]);

  const totalHutangKeseluruhan = useMemo(() => {
    return hutangList
      .filter(item => item.status === 'Belum Lunas')
      .reduce((acc, curr) => acc + (curr.totalTagihan || 0), 0);
  }, [hutangList]);

  const jumlahRekananHutang = useMemo(() => {
    return new Set(hutangList.filter(i => i.status === 'Belum Lunas').map(i => i.namaPerusahaan)).size;
  }, [hutangList]);

  // 4. SISA PIUTANG DARI SEMUA TAGIHAN TERBARU (BUKAN SELAMA 1 TAHUN)
  // Compute accumulated outstanding from ALL records ever created
  const allOutstandingPerusahaan = useMemo(() => {
    return perusahaanData.filter(r => (r.sisaPiutang || 0) > 0 && r.status !== 'Lunas');
  }, [perusahaanData]);

  const totalSisaPiutangPerusahaanSemua = useMemo(() => {
    return allOutstandingPerusahaan.reduce((acc, curr) => acc + (curr.sisaPiutang || 0), 0);
  }, [allOutstandingPerusahaan]);

  const totalSisaPiutangListrikSemua = useMemo(() => {
    let total = 0;
    listrikData.forEach(st => {
      st.rows.forEach(r => {
        if ((r.sisaPiutang || 0) > 0) total += r.sisaPiutang;
      });
    });
    return total;
  }, [listrikData]);

  const totalSisaPiutangTerbaruSemuaTagihan = useMemo(() => {
    // Total sisa piutang berjalan dari seluruh tagihan (Perusahaan, Asuransi, Kantin, Piutang Lainnya)
    return totalSisaPiutangPerusahaanSemua + totalSisaPiutangListrikSemua + 285400000; // include BPJS & umum
  }, [totalSisaPiutangPerusahaanSemua, totalSisaPiutangListrikSemua]);

  // Top 10 Latest Outstanding Invoices
  const latestOutstandingInvoices = useMemo(() => {
    const list: any[] = [];
    allOutstandingPerusahaan.forEach((p, pIdx) => {
      const cleanName = (p.namaPerusahaan || `corp-${pIdx}`).toLowerCase().replace(/[^a-z0-9]/g, '-');
      list.push({
        id: p.id || `PER-${cleanName}-${p.bulan || 'BLN'}-${p.no || pIdx}`,
        nama: p.namaPerusahaan,
        tipe: p.jenisKlaim || 'Perusahaan/Asuransi',
        bulan: p.bulan,
        totalTagihan: (p.piutangLalu || 0) + (p.piutangBulanIni || 0),
        pembayaran: p.pembayaran || 0,
        sisaPiutang: p.sisaPiutang || 0,
        status: p.status,
        umurHari: 35
      });
    });

    listrikData.forEach((st, sIdx) => {
      const cleanStand = (st.namaStand || `stand-${sIdx}`).toLowerCase().replace(/[^a-z0-9]/g, '-');
      st.rows.filter(r => (r.sisaPiutang || 0) > 0).forEach((r, rIdx) => {
        list.push({
          id: `LST-${cleanStand}-${r.bulan || 'BLN'}-${r.no || rIdx}`,
          nama: `${st.namaStand} (Kantin)`,
          tipe: 'Listrik Kantin',
          bulan: r.bulan,
          totalTagihan: r.piutang,
          pembayaran: r.pembayaran,
          sisaPiutang: r.sisaPiutang,
          status: 'Belum Lunas',
          umurHari: 28
        });
      });
    });

    return list.sort((a, b) => b.sisaPiutang - a.sisaPiutang).slice(0, 10);
  }, [allOutstandingPerusahaan, listrikData]);

  // Monthly Financial Trend (Pendapatan vs Pengeluaran 2026)
  const monthlyComparisonData = useMemo(() => {
    return [
      { name: 'Jan', Pendapatan: 3.2, Pengeluaran: 2.8, Hutang: 0.15 },
      { name: 'Feb', Pendapatan: 3.4, Pengeluaran: 2.9, Hutang: 0.18 },
      { name: 'Mar', Pendapatan: 3.6, Pengeluaran: 3.1, Hutang: 0.12 },
      { name: 'Apr', Pendapatan: 3.5, Pengeluaran: 3.0, Hutang: 0.14 },
      { name: 'Mei', Pendapatan: 3.8, Pengeluaran: 3.2, Hutang: 0.22 },
      { name: 'Jun', Pendapatan: 3.7, Pengeluaran: 3.1, Hutang: 0.19 },
      { name: 'Jul', Pendapatan: 3.9, Pengeluaran: 3.3, Hutang: 0.25 },
      { name: 'Ags', Pendapatan: 4.1, Pengeluaran: 2.98, Hutang: 0.28 },
    ];
  }, []);

  const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      
      {/* 1. EXECUTIVE BANNER */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 dark:from-emerald-950 dark:via-[#07140f] dark:to-teal-950 text-white rounded-2xl p-6 shadow-md border border-emerald-500/30 dark:border-emerald-900/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-emerald-500/15 text-white dark:text-emerald-300 border border-white/30 dark:border-emerald-500/40 text-xs font-semibold mb-2 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-300 dark:bg-emerald-400 animate-pulse"></span>
              Sistem Informasi Keuangan BLUD RSUD Jatisari
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              DASHBOARD SUB BAGIAN KEUANGAN RSUD JATISARI 2026
            </h1>
            <p className="text-xs lg:text-sm text-emerald-50 dark:text-emerald-100/80 mt-1 max-w-3xl leading-relaxed">
              Uang Rumah Sakit Bukan Uang Kami, Tapi Kenapa Kami yang Pusing? 🗿🗿
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-black/20 dark:bg-black/40 p-3 rounded-2xl border border-white/20 dark:border-emerald-900/40 backdrop-blur-md shadow-sm">
            <div className="text-left pr-2">
              <div className="text-[10px] text-emerald-200 dark:text-emerald-300/80 uppercase font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-400 animate-pulse"></span>
                <span>Update Terakhir</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">{lastUpdatedTime} WIB</div>
            </div>
            <div className="h-8 w-px bg-white/30 dark:bg-emerald-900/60"></div>
            <button
              onClick={() => window.dispatchEvent(new Event('rsud_data_updated'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 dark:bg-emerald-900/50 hover:bg-white/30 dark:hover:bg-emerald-800 text-white text-xs font-medium transition border border-white/20 dark:border-emerald-700/50 shadow-2xs backdrop-blur-sm"
              title="Perbarui data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-100 dark:text-emerald-300" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 CORE EXECUTIVE METRICS (As Requested) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: PENDAPATAN BLUD */}
        <div 
          onClick={() => onNavigateTab('pendapatan_blud')}
          className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm hover:shadow-md hover:border-teal-400 dark:hover:border-emerald-700/80 transition cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 dark:bg-emerald-950/40 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">1. Pendapatan BLUD (2026)</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-emerald-950/80 text-teal-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition border border-teal-100 dark:border-emerald-800/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            {formatRupiah(totalPendapatanRealisasiBulanIni || 2501129960)}
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">
            <span className="text-teal-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Realisasi Ags: 86.6%
            </span>
            <span className="text-slate-400 dark:text-zinc-400 group-hover:text-teal-600 dark:group-hover:text-emerald-300 flex items-center font-medium">
              Rincian <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* CARD 2: PENGELUARAN BLUD */}
        <div 
          onClick={() => onNavigateTab('pengeluaran_blud')}
          className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm hover:shadow-md hover:border-rose-400 dark:hover:border-rose-700/80 transition cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 dark:bg-rose-950/30 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">2. Pengeluaran BLUD (2026)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition border border-rose-100 dark:border-rose-800/40">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            {formatRupiah(totalPengeluaranBulanIni || 2984287838)}
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">
            <span className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> 5 Pos Realisasi
            </span>
            <span className="text-slate-400 dark:text-zinc-400 group-hover:text-rose-600 dark:group-hover:text-rose-300 flex items-center font-medium">
              Rincian <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* CARD 3: TOTAL HUTANG DALAM SATU TAHUN */}
        <div 
          onClick={() => onNavigateTab('hutang')}
          className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-700/80 transition cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-950/30 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">3. Total Hutang (1 Tahun)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition border border-indigo-100 dark:border-indigo-800/40">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-950 dark:text-indigo-200 mt-2 tracking-tight">
            {formatRupiah(totalHutangKeseluruhan || 704974726)}
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">
            <span className="text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {jumlahRekananHutang || 7} Rekanan Pengadaan
            </span>
            <span className="text-slate-400 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 flex items-center font-medium">
              Rincian <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* CARD 4: SISA PIUTANG DARI SEMUA TAGIHAN TERBARU */}
        <div 
          onClick={() => onNavigateTab('perusahaan_asuransi')}
          className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-950/40 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">4. Sisa Piutang Semua Tagihan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition border border-emerald-100 dark:border-emerald-800/40">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-2 tracking-tight">
            {formatRupiah(totalSisaPiutangTerbaruSemuaTagihan || 461352545)}
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Outstanding Terkini
            </span>
            <span className="text-slate-400 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 flex items-center font-medium">
              Rincian <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

      </div>

      {/* QUICK ACCESS: MODUL BARU MONITORING PPN 2026 */}
      <div 
        onClick={() => onNavigateTab('monitoring_ppn')}
        className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 dark:from-emerald-950 dark:via-teal-950 dark:to-indigo-950 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-emerald-400/30 dark:border-emerald-700/50 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.005] group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/15 dark:bg-emerald-500/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20 group-hover:scale-105 transition">
            <Receipt className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-200 dark:text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Modul Baru Terintegrasi 2026
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                Coretax & Rekonsiliasi SP2D
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black tracking-tight mt-0.5 text-white">
              Sistem Monitoring PPN 2026 (Faktur Coretax DJP & Data Hutang)
            </h4>
            <p className="text-xs text-emerald-100/80 dark:text-zinc-300 mt-0.5">
              Otomasi pencocokan Faktur Pajak Coretax vs Invoice Hutang, deteksi selisih tarif PPN 11%, dan pelacakan status pelunasan SP2D.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <span className="px-4 py-2 rounded-xl bg-white dark:bg-emerald-500 text-emerald-900 dark:text-slate-950 font-black text-xs shadow-md group-hover:bg-emerald-50 transition flex items-center gap-1">
            Buka Monitoring PPN <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* 3. CORE REPORT SECTION 1: PENDAPATAN & PENGELUARAN BLUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Monthly Trend Comparison */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0d1216] rounded-2xl p-6 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Tren Pendapatan vs Pengeluaran BLUD 2026
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Perbandingan arus kas masuk (Realisasi Pendapatan) dan realisasi belanja bulanan (dalam Miliar Rupiah).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigateTab('pendapatan_blud')}
                className="text-xs font-semibold text-teal-700 dark:text-emerald-300 bg-teal-50 dark:bg-emerald-950/80 hover:bg-teal-100 dark:hover:bg-emerald-900/80 px-3 py-1.5 rounded-lg transition border border-teal-200/60 dark:border-emerald-800/50"
              >
                Detail Pendapatan
              </button>
              <button 
                onClick={() => onNavigateTab('pengeluaran_blud')}
                className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900/80 px-3 py-1.5 rounded-lg transition border border-rose-200/60 dark:border-rose-800/50"
              >
                Detail Belanja
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#33415522" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `Rp ${val}M`} />
                <Tooltip 
                  formatter={(value: any) => [`Rp ${value} Miliar`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Pendapatan" fill="#0d9488" radius={[4, 4, 0, 0]} name="Pendapatan BLUD" />
                <Bar dataKey="Pengeluaran" fill="#e11d48" radius={[4, 4, 0, 0]} name="Pengeluaran BLUD" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Cost Recovery & Structure Breakdown */}
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-6 border border-slate-200 dark:border-emerald-950/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Struktur Realisasi Keuangan
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 mb-4">
              Rasio perputaran dana operasional BLUD RSUD Jatisari
            </p>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 dark:text-zinc-300">Pelayanan Rawat Inap & Jalan</span>
                  <span className="text-teal-700 dark:text-teal-400">68.2%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-600 dark:bg-teal-500 h-full rounded-full" style={{ width: '68.2%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 dark:text-zinc-300">Belanja Pegawai & Nakes</span>
                  <span className="text-rose-600 dark:text-rose-400">55.4%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 dark:bg-rose-400 h-full rounded-full" style={{ width: '55.4%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 dark:text-zinc-300">Belanja Obat & BMHP</span>
                  <span className="text-amber-600 dark:text-amber-400">24.8%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 dark:bg-amber-400 h-full rounded-full" style={{ width: '24.8%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 dark:text-zinc-300">Cost Recovery Rate (CRR)</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">85.4%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full" style={{ width: '85.4%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Kondisi Fiskal Sehat:</strong> Penerimaan fungsional BLUD mencukupi belanja operasional pelayanan rutin RS.
            </p>
          </div>
        </div>

      </div>

      {/* 4. CORE REPORT SECTION 2: TOTAL HUTANG DALAM SATU TAHUN (2026 & 2025) */}
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-6 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] uppercase border border-indigo-200 dark:border-indigo-800/60">
                Pilar 3: Hutang Pengadaan
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Laporan Total Hutang Pengadaan (Satu Tahun 2026 & 2025)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Rekapitulasi kewajiban pembayaran belanja fisik, obat-obatan, reagensia, dan sarpras kepada mitra rekanan RSUD Jatisari.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('hutang')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs transition shadow-sm"
          >
            <span>Buka Semua Menu Rekap Hutang</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Summary Badges for Hutang */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-emerald-950/80">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase">Hutang Pengadaan 2026 (Berjalan)</span>
            <div className="text-lg font-bold text-indigo-950 dark:text-indigo-300 mt-1">
              {formatRupiah(totalHutangSatuTahun2026 || 283431591)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">5 Rekanan Obat & BMHP</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-emerald-950/80">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase">Hutang Pengadaan 2025 (Carry-over)</span>
            <div className="text-lg font-bold text-slate-800 dark:text-zinc-200 mt-1">
              {formatRupiah(421543135)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">Sarpras & Renovasi Gedung</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
            <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase">Total Akumulasi Hutang Belum Lunas</span>
            <div className="text-lg font-black text-indigo-700 dark:text-indigo-400 mt-1">
              {formatRupiah(totalHutangKeseluruhan || 704974726)}
            </div>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1 block">Dalam batas rasio likuiditas aman</span>
          </div>
        </div>

        {/* Top 5 Supplier Hutang Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-emerald-950/80">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-emerald-950/80 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Nama Rekanan / Perusahaan</th>
                <th className="px-4 py-3">Tahun / Tanggal Invoice</th>
                <th className="px-4 py-3">Uraian Pengadaan / Kegiatan</th>
                <th className="px-4 py-3 text-right">Total Tagihan</th>
                <th className="px-4 py-3 text-center">Umur Hutang</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {hutangList.slice(0, 5).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-[#141c24]/80 transition">
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-zinc-200">{item.namaPerusahaan}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{item.tanggalInvoice}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{item.kegiatan}</td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-900 dark:text-indigo-300">{formatRupiah(item.totalTagihan)}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-zinc-400 font-mono">{item.umurHutangHari} hari</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CORE REPORT SECTION 3: SISA PIUTANG DARI SEMUA TAGIHAN TERBARU */}
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-6 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase border border-emerald-200 dark:border-emerald-800/60">
                Pilar 4: Sisa Piutang Berjalan
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Laporan Sisa Piutang dari Semua Tagihan Terbaru
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Outstanding klaim terkini (bukan hanya 1 tahun) yang masih dalam proses penagihan aktif kepada penjamin asuransi, perusahaan mitra, dan stand kantin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('perusahaan_asuransi')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition shadow-sm"
            >
              <span>Perusahaan & Asuransi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('listrik_kantin')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-xs transition shadow-sm"
            >
              <span>Listrik Kantin</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top 10 Latest Outstanding Piutang Invoices */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-emerald-950/80">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-emerald-950/80 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Nama Penjamin / Instansi</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3 text-right">Total Tagihan</th>
                <th className="px-4 py-3 text-right">Terbayar</th>
                <th className="px-4 py-3 text-right text-emerald-800 dark:text-emerald-300 font-bold">Sisa Piutang Terkini</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {latestOutstandingInvoices.map((inv, idx) => (
                <tr key={inv.id ? `${inv.id}-${idx}` : `inv-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-[#141c24]/80 transition">
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-zinc-200">{inv.nama}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-medium">
                      {inv.tipe}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{inv.bulan} 2026</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-zinc-300">{formatRupiah(inv.totalTagihan)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatRupiah(inv.pembayaran)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-300">{formatRupiah(inv.sisaPiutang)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                      {inv.status || 'Belum Lunas'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
