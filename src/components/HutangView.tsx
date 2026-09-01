import React, { useState, useEffect, useMemo } from 'react';
import { formatRupiah } from '../utils/formatters';
import { 
  Building2, 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Trash2, 
  Edit,
  CreditCard,
  Clock,
  Printer,
  Download,
  Filter,
  Layers,
  Database,
  CheckSquare,
  FileSpreadsheet,
  TrendingDown,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Eye,
  X,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User } from 'firebase/auth';
import { HutangItem } from '../types/piutang';
import { ImportInvoiceExcelModal } from './ImportInvoiceExcelModal';
import { InvoiceHutang2025View } from './InvoiceHutang2025View';
import { InvoiceHutang2026View } from './InvoiceHutang2026View';
import { INITIAL_INVOICE_HUTANG_2025 } from '../data/invoiceHutang2025Data';
import { INITIAL_KODE_REKENING } from '../data/databaseKodeRekeningData';
import { InvoiceHutang2025Record } from '../types/invoiceHutang';
import { idbGet, idbSet } from '../utils/indexedDbStorage';
import { RekapHutang2026View } from './RekapHutang2026View';
import { SemuaRekapHutangView } from './SemuaRekapHutangView';
import DatabaseKodeRekeningView from './DatabaseKodeRekeningView';
import { aggregateRekapHutang2025, RekapPosBelanjaItem } from '../utils/rekapHutang2025Aggregator';

const STORAGE_KEY = 'rsud_hutang_blud_apbd_v2025_complete';

// Module-level singleton memory cache
let inMemoryHutangCache: HutangItem[] | null = null;

const getInitialHutangData = (): HutangItem[] => {
  if (inMemoryHutangCache && inMemoryHutangCache.length > 0) {
    return inMemoryHutangCache;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('rsud_hutang_blud_apbd');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const count2025 = parsed.filter(i => i.tahun === '2025').length;
        if (count2025 >= 31) {
          inMemoryHutangCache = parsed;
          return parsed;
        }
        // Merge initial 2025 master items
        const non2025 = parsed.filter(i => i.tahun !== '2025');
        const initial2025 = INITIAL_HUTANG_DATA.filter(i => i.tahun === '2025');
        const merged = [...initial2025, ...(non2025.length > 0 ? non2025 : INITIAL_HUTANG_DATA.filter(i => i.tahun !== '2025'))];
        inMemoryHutangCache = merged;
        return merged;
      }
    }
  } catch (e) {
    console.warn(e);
  }
  inMemoryHutangCache = INITIAL_HUTANG_DATA;
  return INITIAL_HUTANG_DATA;
};

const INITIAL_HUTANG_DATA: HutangItem[] = [
  // 2025 Rekap Pengadaan Hutang (Exact 31 items from user spreadsheet screenshot)
  { id: 'HUT-25-01', noUrut: 1, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/01', tanggalInvoice: '2025-01-01', totalTagihan: 63270000, koreksi: 0, jumlahBayar: 0, sisaHutang: 63270000, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Belanja Bahan-Isi Tabung Gas', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-02', noUrut: 2, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/02', tanggalInvoice: '2025-01-01', totalTagihan: 160316322, koreksi: 0, jumlahBayar: 56500000, sisaHutang: 103816322, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Belanja Bahan-Bahan Lainnya (APD)', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-03', noUrut: 3, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/03', tanggalInvoice: '2025-01-01', totalTagihan: 139527000, koreksi: 0, jumlahBayar: 139527000, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Belanja Bahan-Bahan Lainnya (Dialisis)', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-04', noUrut: 4, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/04', tanggalInvoice: '2025-01-01', totalTagihan: 797601404, koreksi: 0, jumlahBayar: 294095235, sisaHutang: 503506169, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Belanja Bahan-Bahan Lainnya (Farmasi)', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-07', noUrut: 7, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/07', tanggalInvoice: '2025-01-01', totalTagihan: 223554000, koreksi: 0, jumlahBayar: 0, sisaHutang: 223554000, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0025', kegiatan: 'Belanja Bahan-Bahan Lainnya - Sparepart Perbaikan Alat Kesehatan (Elektromedik)', bulan: 'Desember', status: 'Belum Lunas', isHighlighted: true },
  { id: 'HUT-25-08', noUrut: 8, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/08', tanggalInvoice: '2025-01-01', totalTagihan: 209584168, koreksi: 0, jumlahBayar: 82157205, sisaHutang: 127426963, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Belanja Suku Cadang-Suku Cadang Alat Laboratorium', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-09', noUrut: 9, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/09', tanggalInvoice: '2025-01-01', totalTagihan: 12065092, koreksi: 0, jumlahBayar: 12065092, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0024', kegiatan: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Alat Tulis Kantor', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-10', noUrut: 10, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/10', tanggalInvoice: '2025-01-01', totalTagihan: 237034828, koreksi: 0, jumlahBayar: 150765628, sisaHutang: 86269200, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0024', kegiatan: 'Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-14', noUrut: 14, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/14', tanggalInvoice: '2025-01-01', totalTagihan: 41672000, koreksi: 0, jumlahBayar: 2600000, sisaHutang: 39072000, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0024', kegiatan: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Alat/Bahan untuk Kegiatan Kantor Lainnya', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-15', noUrut: 15, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/15', tanggalInvoice: '2025-01-01', totalTagihan: 2742456074, koreksi: 0, jumlahBayar: 1134624813, sisaHutang: 1607831261, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Belanja Obat-Obatan-Obat', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-18', noUrut: 18, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/18', tanggalInvoice: '2025-01-01', totalTagihan: 9668689, koreksi: 0, jumlahBayar: 0, sisaHutang: 9668689, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Belanja Makanan dan Minuman pada Fasilitas Pelayanan Urusan Kesehatan', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-20', noUrut: 20, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/20', tanggalInvoice: '2025-01-01', totalTagihan: 18953583, koreksi: 0, jumlahBayar: 0, sisaHutang: 18953583, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Belanja Peralatan Kebersihan dan Bahan Pembersih', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-32', noUrut: 32, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/32', tanggalInvoice: '2025-01-01', totalTagihan: 120656612, koreksi: 0, jumlahBayar: 120656612, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0004', kegiatan: 'Belanja Jasa Tenaga Kebersihan', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-33', noUrut: 33, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/33', tanggalInvoice: '2025-01-01', totalTagihan: 113253300, koreksi: 0, jumlahBayar: 113253300, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0004', kegiatan: 'Belanja Jasa Tenaga Keamanan', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-36', noUrut: 36, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/36', tanggalInvoice: '2025-01-01', totalTagihan: 726150000, koreksi: 0, jumlahBayar: 247350000, sisaHutang: 478800000, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0004', kegiatan: 'Belanja Jasa Konversi Aplikasi/Sistem Informasi', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-42', noUrut: 42, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/42', tanggalInvoice: '2025-01-01', totalTagihan: 7657500, koreksi: 0, jumlahBayar: 7657500, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0004', kegiatan: 'Belanja Tagihan Air', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-43', noUrut: 43, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/43', tanggalInvoice: '2025-01-01', totalTagihan: 145765568, koreksi: 0, jumlahBayar: 145765568, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0004', kegiatan: 'Belanja Tagihan Listrik', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-44', noUrut: 44, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/44', tanggalInvoice: '2025-01-01', totalTagihan: 16505700, koreksi: 16505700, jumlahBayar: 0, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0004', kegiatan: 'Belanja Kawat/Faksimili/Internet/TV Berlangganan', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-46', noUrut: 46, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/46', tanggalInvoice: '2025-01-01', totalTagihan: 27250000, koreksi: 0, jumlahBayar: 0, sisaHutang: 27250000, umurHutangHari: 365, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Belanja Pembayaran Pajak, Bea, dan Perizinan', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-47', noUrut: 47, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/47', tanggalInvoice: '2025-01-01', totalTagihan: 30233736, koreksi: 0, jumlahBayar: 30233736, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0004', kegiatan: 'Belanja Pengolahan Air Limbah', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-57', noUrut: 57, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/57', tanggalInvoice: '2025-01-01', totalTagihan: 75135900, koreksi: 0, jumlahBayar: 75135900, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0025', kegiatan: 'Belanja Pemeliharaan Alat Angkutan-Alat Angkutan Darat Bermotor-Kendaraan Dinas Bermotor Perorangan', bulan: 'Desember', status: 'Lunas', isHighlighted: true },
  { id: 'HUT-25-58', noUrut: 58, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/58', tanggalInvoice: '2025-01-01', totalTagihan: 19536000, koreksi: 0, jumlahBayar: 19536000, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0025', kegiatan: 'Belanja Pemeliharaan Alat Bengkel dan Alat Ukur-Alat Bengkel Tak Bermesin-Alat Bengkel Tak Bermesin Lainnya', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-64', noUrut: 64, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/64', tanggalInvoice: '2025-01-01', totalTagihan: 764409500, koreksi: 234576300, jumlahBayar: 171310700, sisaHutang: 827675100, umurHutangHari: 365, kodeRekening: '5.1.02.03.02.0010', kegiatan: 'Belanja Pemeliharaan Bangunan Gedung-Bangunan Gedung Tempat Kerja-Bangunan Gedung Kantor', bulan: 'Desember', status: 'Belum Lunas', isHighlighted: true },
  { id: 'HUT-25-65', noUrut: 65, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/65', tanggalInvoice: '2025-01-01', totalTagihan: 88073727, koreksi: 0, jumlahBayar: 0, sisaHutang: 88073727, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0004', kegiatan: 'Belanja Pemeliharaan Jaringan-Jaringan Listrik-Jaringan Listrik Lainnya', bulan: 'Desember', status: 'Belum Lunas' },
  { id: 'HUT-25-73', noUrut: 73, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/73', tanggalInvoice: '2025-01-01', totalTagihan: 88255678, koreksi: 0, jumlahBayar: 88255678, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.03.02.0001', kegiatan: 'Belanja Modal Alat Rumah Tangga Lainnya (Home Use)', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-74', noUrut: 74, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/74', tanggalInvoice: '2025-01-01', totalTagihan: 44622000, koreksi: 0, jumlahBayar: 44622000, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.03.02.0001', kegiatan: 'Belanja Modal Alat Studio Lainnya', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-75', noUrut: 75, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/75', tanggalInvoice: '2025-01-01', totalTagihan: 8547000, koreksi: 0, jumlahBayar: 8547000, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.03.02.0001', kegiatan: 'Belanja Modal Alat Kesehatan Umum Lainnya', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-78', noUrut: 78, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/78', tanggalInvoice: '2025-01-01', totalTagihan: 199165935, koreksi: 0, jumlahBayar: 99978000, sisaHutang: 99187935, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0004', kegiatan: 'Beban Jasa Konsultansi Pengawasan Arsitektur', bulan: 'Desember', status: 'Belum Lunas', isHighlighted: true },
  { id: 'HUT-25-79', noUrut: 79, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/79', tanggalInvoice: '2025-01-01', totalTagihan: 175752960, koreksi: 0, jumlahBayar: 175752960, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.02.02.01.0004', kegiatan: 'Belanja Pemeliharaan Instalasi-Instalasi Pembangkit Listrik-Instalasi Pembangkit Listrik Lainnya', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-80', noUrut: 80, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/80', tanggalInvoice: '2025-01-01', totalTagihan: 844827379, koreksi: 0, jumlahBayar: 844827379, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.01.01.01.0001', kegiatan: 'Belanja Gaji Pegawai BLUD - Desember 2025', bulan: 'Desember', status: 'Lunas' },
  { id: 'HUT-25-81', noUrut: 81, namaPerusahaan: 'REKANAN BLUD', tahun: '2025', jenisSumber: 'BLUD', noPoSpk: 'PO-2025/81', tanggalInvoice: '2025-01-01', totalTagihan: 523574269, koreksi: 15148945, jumlahBayar: 538723214, sisaHutang: 0, umurHutangHari: 365, kodeRekening: '5.1.01.01.01.0001', kegiatan: 'Jasa Pelayanan Medis Dokter', bulan: 'Desember', status: 'Lunas' },

  // 2026
  { id: 'HUT-26-001', noUrut: 1, namaPerusahaan: 'PT. AIRINDO SENTRA MEDIKA', tahun: '2026', jenisSumber: 'BLUD', noPoSpk: 'PO-2026/01/014', tanggalInvoice: '16 January 2026', totalTagihan: 86580000, koreksi: 0, jumlahBayar: 40000000, sisaHutang: 46580000, umurHutangHari: 224, kodeRekening: '5.1.02.02.01.0025', kegiatan: 'Pemeliharaan Alat Elektromedis RS', bulan: 'Januari', status: 'Belum Lunas' },
  { id: 'HUT-26-002', noUrut: 2, namaPerusahaan: 'PT. AIRINDO SENTRA MEDIKA', tahun: '2026', jenisSumber: 'BLUD', noPoSpk: 'PO-2026/02/028', tanggalInvoice: '16 February 2026', totalTagihan: 133200000, koreksi: 0, jumlahBayar: 0, sisaHutang: 133200000, umurHutangHari: 193, kodeRekening: '5.1.02.02.01.0025', kegiatan: 'Pemeliharaan Alat Elektromedis RS', bulan: 'Februari', status: 'Belum Lunas' },
  { id: 'HUT-26-003', noUrut: 3, namaPerusahaan: 'PT. RANAH MULTI SEMESTA', tahun: '2026', jenisSumber: 'BLUD', noPoSpk: 'PO-2026/03/055', tanggalInvoice: '22 March 2026', totalTagihan: 53280701, koreksi: 0, jumlahBayar: 0, sisaHutang: 53280701, umurHutangHari: 159, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Pengadaan Bahan Medis Habis Pakai (BMHP)', bulan: 'Maret', status: 'Belum Lunas' },
  { id: 'HUT-26-004', noUrut: 4, namaPerusahaan: 'PT. BINA SAN PRIMA', tahun: '2026', jenisSumber: 'BLUD', noPoSpk: 'PO-2026/04/091', tanggalInvoice: '29 April 2026', totalTagihan: 4018200, koreksi: 0, jumlahBayar: 0, sisaHutang: 4018200, umurHutangHari: 121, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Pengadaan Vaksin & Obat Khusus', bulan: 'April', status: 'Belum Lunas' },
  { id: 'HUT-26-005', noUrut: 5, namaPerusahaan: 'PT. ANUGRAH ARGON MEDIKA', tahun: '2026', jenisSumber: 'APBD', noPoSpk: 'SPK-2026/APBD/03', tanggalInvoice: '10 May 2026', totalTagihan: 7032690, koreksi: 0, jumlahBayar: 0, sisaHutang: 7032690, umurHutangHari: 110, kodeRekening: '5.1.02.01.01.0019', kegiatan: 'Pengadaan Reagensia Laboratorium & Strip', bulan: 'Mei', status: 'Belum Lunas' },
  { id: 'HUT-26-006', noUrut: 6, namaPerusahaan: 'CV. MEDIKA TEKNIK UTAMA', tahun: '2026', jenisSumber: 'BLUD', noPoSpk: 'PO-2026/07/119', tanggalInvoice: '15 July 2026', totalTagihan: 24500000, koreksi: 0, jumlahBayar: 24500000, sisaHutang: 0, umurHutangHari: 44, kodeRekening: '5.1.02.02.01.0025', kegiatan: 'Kalibrasi Radiologi & USG', bulan: 'Juli', status: 'Lunas' },
];

const KODE_REKENING_LIST = [
  { kode: '5.1.01.01.01.0001', uraian: 'Belanja Gaji dan Tunjangan ASN & BLUD', jenis: 'Belanja Pegawai' },
  { kode: '5.1.02.01.01.0019', uraian: 'Belanja Obat-obatan, Bahan Kimia, dan BMHP', jenis: 'Belanja Barang & Jasa' },
  { kode: '5.1.02.01.01.0024', uraian: 'Belanja Alat Tulis Kantor & Kebutuhan Kantor', jenis: 'Belanja Barang & Jasa' },
  { kode: '5.1.02.02.01.0004', uraian: 'Belanja Listrik, Air, Telepon, dan Internet RSUD', jenis: 'Belanja Operasional' },
  { kode: '5.1.02.02.01.0025', uraian: 'Belanja Pemeliharaan & Kalibrasi Peralatan Medis', jenis: 'Belanja Pemeliharaan' },
  { kode: '5.1.02.03.02.0001', uraian: 'Belanja Modal Pengadaan Alat Kesehatan & Rumah Sakit', jenis: 'Belanja Modal' },
  { kode: '5.1.02.03.02.0010', uraian: 'Belanja Modal Sarana Prasarana Gedung & Bangunan', jenis: 'Belanja Modal Fisik' },
];

interface HutangViewProps {
  isAdmin?: boolean;
  activeSubmenu?: string;
  user?: User | null;
  role?: string;
  onOpenLoginModal?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const HutangView: React.FC<HutangViewProps> = ({ 
  isAdmin, 
  activeSubmenu = 'semua_rekap_hutang',
  user,
  role,
  onOpenLoginModal,
  onShowToast
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<string>(activeSubmenu || 'semua_rekap_hutang');

  // Role permissions
  const isSuperAdmin = (role === 'admin') || Boolean(isAdmin);
  const isPicHutangOrAdmin = isSuperAdmin || (role === 'pic_hutang');

  const canModifyRecord = (record: any) => {
    if (isSuperAdmin) return true;
    if (role === 'pic_hutang') {
      if (!record?.createdBy || record?.createdBy === user?.email) return true;
    }
    return false;
  };

  useEffect(() => {
    if (activeSubmenu) {
      setCurrentSubTab(activeSubmenu);
    }
  }, [activeSubmenu]);

  const [items, setItems] = useState<HutangItem[]>(getInitialHutangData);
  
  const saveHutangData = (updated: HutangItem[]) => {
    inMemoryHutangCache = updated;
    setItems(updated);
    try {
      idbSet(STORAGE_KEY, updated);
      localStorage.setItem('rsud_hutang_blud_apbd', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save hutang data', e);
    }
    window.dispatchEvent(new CustomEvent('rsud_hutang_data_updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('rsud_data_updated'));
  };

  const [rekapInvoice2025, setRekapInvoice2025] = useState<RekapPosBelanjaItem[]>(() => {
    let customHighlights: Record<number, boolean> = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        customHighlights = JSON.parse(localStorage.getItem('rsud_rekap_2025_highlights') || '{}');
        const saved = localStorage.getItem('rsud_invoice_hutang_2025');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const aggr = aggregateRekapHutang2025(parsed);
            return aggr.map(item => {
              if (item.noUrut && typeof customHighlights[item.noUrut] === 'boolean') {
                return { ...item, isHighlighted: customHighlights[item.noUrut] };
              }
              return item;
            });
          }
        }
      }
    } catch (e) {
      console.warn('Initial rekap 2025 sync error:', e);
    }
    const initialAggr = aggregateRekapHutang2025(INITIAL_INVOICE_HUTANG_2025);
    return initialAggr.map(item => {
      if (item.noUrut && typeof customHighlights[item.noUrut] === 'boolean') {
        return { ...item, isHighlighted: customHighlights[item.noUrut] };
      }
      return item;
    });
  });
  const [isSyncingNominal, setIsSyncingNominal] = useState(false);
  const [selectedPosBelanjaDetail, setSelectedPosBelanjaDetail] = useState<RekapPosBelanjaItem | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState('');

  // Synchronize Rekap 2025 from Invoice Hutang 2025
  const refreshRekap2025 = async (forcedInvoices?: InvoiceHutang2025Record[]) => {
    setIsSyncingNominal(true);
    try {
      let invoices: InvoiceHutang2025Record[] = forcedInvoices || INITIAL_INVOICE_HUTANG_2025;
      if (!forcedInvoices) {
        const saved = await idbGet<InvoiceHutang2025Record[]>('rsud_invoice_hutang_2025');
        if (saved && Array.isArray(saved) && saved.length > 0) {
          invoices = saved;
        }
      }
      const aggregated = aggregateRekapHutang2025(invoices);
      let customHighlights: Record<number, boolean> = {};
      try {
        customHighlights = JSON.parse(localStorage.getItem('rsud_rekap_2025_highlights') || '{}');
      } catch (e) {}

      const adjusted = aggregated.map(item => {
        if (item.noUrut && typeof customHighlights[item.noUrut] === 'boolean') {
          return { ...item, isHighlighted: customHighlights[item.noUrut] };
        }
        return item;
      });

      setRekapInvoice2025(adjusted);

      // Automatically sync the nominals into the items array
      setItems(prev => {
        const updated = prev.map(item => {
          if (item.tahun !== '2025') return item;
          
          const matched = adjusted.find(r => 
            r.noUrut === item.noUrut || 
            (r.kodeRekening && item.kodeRekening && r.kodeRekening === item.kodeRekening) ||
            r.kegiatan.toLowerCase().trim() === item.kegiatan.toLowerCase().trim()
          );
          
          if (matched) {
            return {
              ...item,
              totalTagihan: matched.totalTagihan,
              koreksi: matched.koreksi,
              jumlahBayar: matched.jumlahBayar,
              sisaHutang: matched.sisaHutang,
              isHighlighted: matched.isHighlighted,
              status: matched.sisaHutang <= 0 ? 'Lunas' : 'Belum Lunas'
            };
          }
          return item;
        });
        inMemoryHutangCache = updated;
        return updated;
      });
    } catch (err) {
      console.warn('Failed to load/aggregate invoice 2025:', err);
    } finally {
      setIsSyncingNominal(false);
    }
  };

  useEffect(() => {
    refreshRekap2025();

    const handleInvoiceUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        refreshRekap2025(customEvt.detail);
      } else {
        refreshRekap2025();
      }
    };

    window.addEventListener('rsud_invoice_hutang_2025_updated', handleInvoiceUpdate);
    window.addEventListener('storage', () => refreshRekap2025());

    return () => {
      window.removeEventListener('rsud_invoice_hutang_2025_updated', handleInvoiceUpdate);
      window.removeEventListener('storage', () => refreshRekap2025());
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSumber, setFilterSumber] = useState('Semua');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HutangItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<HutangItem | null>(null);

  // Form State
  const [formNoUrut, setFormNoUrut] = useState<string>('1');
  const [formNama, setFormNama] = useState('');
  const [formTahun, setFormTahun] = useState('2026');
  const [formSumberJenis, setFormSumberJenis] = useState<'BLUD' | 'APBD'>('BLUD');
  const [formNoPo, setFormNoPo] = useState('PO-2026/08/130');
  const [formTanggal, setFormTanggal] = useState('28 August 2026');
  const [formTotal, setFormTotal] = useState('');
  const [formKoreksi, setFormKoreksi] = useState('0');
  const [formPembayaran, setFormPembayaran] = useState('0');
  const [formUmur, setFormUmur] = useState('30');
  const [formKode, setFormKode] = useState('5.1.02.01.01.0019');
  const [formKegiatan, setFormKegiatan] = useState('Pengadaan Barang & Jasa Medis');
  const [formBulan, setFormBulan] = useState('Agustus');
  const [formIsHighlighted, setFormIsHighlighted] = useState(false);

  // Synchronize from external events
  useEffect(() => {
    const handleHutangUpdate = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('rsud_hutang_blud_apbd');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryHutangCache = parsed;
            setItems(parsed);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener('rsud_hutang_data_updated', handleHutangUpdate);
    return () => {
      window.removeEventListener('rsud_hutang_data_updated', handleHutangUpdate);
    };
  }, []);

  // Filter items based on active sub tab
  const displayedItems = useMemo(() => {
    if (currentSubTab === 'rekap_hutang_2025') {
      // Direct Live Synchronization with INVOICE HUTANG 2025
      return rekapInvoice2025.filter(item => {
        const matchSearch = !searchQuery || 
          (item.kegiatan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.kodeRekening || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.noUrut || '').toString().includes(searchQuery);

        const matchSumber = filterSumber === 'Semua' || item.jenisSumber === filterSumber;
        return matchSearch && matchSumber;
      });
    }

    return items.filter(item => {
      // 1. Tab-based filtering
      if (currentSubTab === 'rekap_hutang_2026' || currentSubTab === 'invoice_hutang_2026') {
        if (item.tahun !== '2026') return false;
      } else if (currentSubTab === 'rekap_apbd_2026') {
        if (item.jenisSumber !== 'APBD') return false;
      }

      // 2. Search filtering
      const matchSearch = (item.namaPerusahaan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.kegiatan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.kodeRekening || '').includes(searchQuery) ||
                          (item.noPoSpk || '').toLowerCase().includes(searchQuery.toLowerCase());

      // 3. Sumber filter
      const matchSumber = filterSumber === 'Semua' || item.jenisSumber === filterSumber;

      return matchSearch && matchSumber;
    });
  }, [items, rekapInvoice2025, currentSubTab, searchQuery, filterSumber]);

  // Aggregate stats
  const totalSaldoAwal = useMemo(() => {
    return displayedItems.reduce((acc, curr) => acc + (curr.totalTagihan || 0), 0);
  }, [displayedItems]);

  const totalKoreksi = useMemo(() => {
    return displayedItems.reduce((acc, curr) => acc + (curr.koreksi || 0), 0);
  }, [displayedItems]);

  const totalFix = useMemo(() => {
    return totalSaldoAwal + totalKoreksi;
  }, [totalSaldoAwal, totalKoreksi]);

  const totalHutangAktif = useMemo(() => {
    return displayedItems
      .reduce((acc, curr) => acc + (curr.sisaHutang ?? ((curr.totalTagihan || 0) + (curr.koreksi || 0) - (curr.jumlahBayar || 0))), 0);
  }, [displayedItems]);

  const totalSudahDibayar = useMemo(() => {
    return displayedItems.reduce((acc, curr) => acc + (curr.jumlahBayar || 0), 0);
  }, [displayedItems]);

  const totalRekanan = useMemo(() => {
    if (currentSubTab === 'rekap_hutang_2025') {
      return displayedItems.length;
    }
    return new Set(displayedItems.map(i => i.namaPerusahaan)).size;
  }, [displayedItems, currentSubTab]);

  const lunasCount = useMemo(() => {
    return displayedItems.filter(i => {
      const sisa = i.sisaHutang ?? ((i.totalTagihan || 0) + (i.koreksi || 0) - (i.jumlahBayar || 0));
      return sisa <= 0;
    }).length;
  }, [displayedItems]);

  const belumLunasCount = useMemo(() => {
    return displayedItems.length - lunasCount;
  }, [displayedItems, lunasCount]);

  // Supplier grouping for 'rekap_supplier_2026' and '2025'
  const supplierSummary = useMemo(() => {
    const map: Record<string, { nama: string; totalTagihan: number; terbayar: number; sisa: number; count: number }> = {};
    displayedItems.forEach(item => {
      if (!map[item.namaPerusahaan]) {
        map[item.namaPerusahaan] = { nama: item.namaPerusahaan, totalTagihan: 0, terbayar: 0, sisa: 0, count: 0 };
      }
      map[item.namaPerusahaan].totalTagihan += item.totalTagihan;
      map[item.namaPerusahaan].terbayar += (item.jumlahBayar || 0);
      map[item.namaPerusahaan].sisa += (item.status === 'Lunas' ? 0 : (item.sisaHutang || item.totalTagihan));
      map[item.namaPerusahaan].count += 1;
    });
    return Object.values(map).sort((a, b) => b.sisa - a.sisa);
  }, [displayedItems]);

  const handleExportRekap2025Excel = () => {
    const rows = displayedItems.map((item, idx) => {
      const saldoAwal = item.totalTagihan || 0;
      const koreksi = item.koreksi || 0;
      const pembayaran = item.jumlahBayar || 0;
      const saldoAkhir = item.sisaHutang ?? (saldoAwal + koreksi - pembayaran);
      return {
        'NO': item.noUrut || (idx + 1),
        'KODE REKENING': item.kodeRekening || '',
        'URAIAN / POS BELANJA': item.kegiatan || item.namaPerusahaan,
        'SALDO AWAL (HUTANG 2025)': saldoAwal,
        'KOREKSI': koreksi,
        'PEMBAYARAN': pembayaran,
        'SALDO AKHIR': saldoAkhir,
        'JUMLAH INVOICE': (item as any).invoiceCount ?? 0,
        'STATUS': saldoAkhir <= 0 ? 'LUNAS' : 'BELUM LUNAS'
      };
    });

    // Add total row
    rows.push({
      'NO': 'TOTAL' as any,
      'KODE REKENING': '',
      'URAIAN / POS BELANJA': 'TOTAL KESELURUHAN',
      'SALDO AWAL (HUTANG 2025)': totalSaldoAwal,
      'KOREKSI': totalKoreksi,
      'PEMBAYARAN': totalSudahDibayar,
      'SALDO AKHIR': totalHutangAktif,
      'JUMLAH INVOICE': (displayedItems as any[]).reduce((a, b) => a + ((b as any).invoiceCount || 0), 0),
      'STATUS': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Hutang_2025');
    XLSX.writeFile(workbook, `REKAP_PENGADAAN_HUTANG_2025_${new Date().toISOString().slice(0, 10)}.xlsx`);
    if (onShowToast) onShowToast('Data Rekap Pengadaan Hutang 2025 berhasil diexport ke Excel', 'success');
  };

  const handlePrintRekap2025 = () => {
    window.print();
  };

  const handleResetRekap2025 = () => {
    if (window.confirm('Muat ulang 31 baris data Rekap Pengadaan Hutang 2025 sesuai master data spreadsheet?')) {
      const non2025 = items.filter(i => i.tahun !== '2025');
      const fresh2025 = INITIAL_HUTANG_DATA.filter(i => i.tahun === '2025');
      saveHutangData([...fresh2025, ...non2025]);
      if (onShowToast) onShowToast('Master data Rekap Pengadaan Hutang 2025 berhasil dimuat ulang!', 'success');
    }
  };

  const handleOpenAdd = () => {
    const is2025 = currentSubTab.includes('2025');
    setFormNoUrut((displayedItems.length + 1).toString());
    setFormNama(is2025 ? 'REKANAN BLUD' : '');
    setFormTahun(is2025 ? '2025' : '2026');
    setFormSumberJenis(currentSubTab === 'rekap_apbd_2026' ? 'APBD' : 'BLUD');
    setFormNoPo(is2025 ? `PO-2025/${displayedItems.length + 1}` : `PO-2026/08/${Math.floor(100 + Math.random() * 900)}`);
    setFormTanggal(is2025 ? '2025-01-01' : '28 August 2026');
    setFormTotal('');
    setFormKoreksi('0');
    setFormPembayaran('0');
    setFormUmur(is2025 ? '365' : '30');
    setFormKode('5.1.02.01.01.0019');
    setFormKegiatan(is2025 ? '' : 'Pengadaan Barang & Jasa Medis');
    setFormBulan(is2025 ? 'Desember' : 'Agustus');
    setFormIsHighlighted(false);
    setIsAddOpen(true);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!formNama && currentSubTab !== 'rekap_hutang_2025') || !formTotal) return;

    const totalVal = parseFloat(formTotal) || 0;
    const koreksiVal = parseFloat(formKoreksi) || 0;
    const bayarVal = parseFloat(formPembayaran) || 0;
    const calculatedSisa = Math.max(0, totalVal + koreksiVal - bayarVal);

    const newItem: HutangItem = {
      id: `HUT-${formTahun.slice(-2)}-${Date.now().toString().slice(-4)}`,
      noUrut: parseInt(formNoUrut) || (displayedItems.length + 1),
      namaPerusahaan: (formNama || 'REKANAN BLUD').toUpperCase().trim(),
      tahun: formTahun,
      jenisSumber: formSumberJenis,
      noPoSpk: formNoPo.trim(),
      tanggalInvoice: formTanggal,
      totalTagihan: totalVal,
      koreksi: koreksiVal,
      jumlahBayar: bayarVal,
      sisaHutang: calculatedSisa,
      umurHutangHari: parseInt(formUmur) || 1,
      kodeRekening: formKode,
      kegiatan: formKegiatan.trim() || formNama.trim(),
      bulan: formBulan,
      status: calculatedSisa === 0 ? 'Lunas' : 'Belum Lunas',
      isHighlighted: formIsHighlighted,
      createdBy: user?.email || undefined
    };

    saveHutangData([newItem, ...items]);
    setIsAddOpen(false);
    if (onShowToast) onShowToast('Data hutang pengadaan berhasil ditambahkan!', 'success');
  };

  const handleOpenEdit = (item: HutangItem) => {
    setEditingItem(item);
    setFormNoUrut((item.noUrut || 1).toString());
    setFormNama(item.namaPerusahaan || 'REKANAN BLUD');
    setFormTahun(item.tahun);
    setFormSumberJenis(item.jenisSumber);
    setFormNoPo(item.noPoSpk || '');
    setFormTanggal(item.tanggalInvoice || '2025-01-01');
    setFormTotal(item.totalTagihan.toString());
    setFormKoreksi((item.koreksi || 0).toString());
    setFormPembayaran((item.jumlahBayar || 0).toString());
    setFormUmur(item.umurHutangHari.toString());
    setFormKode(item.kodeRekening || '5.1.02.01.01.0019');
    setFormKegiatan(item.kegiatan || item.namaPerusahaan);
    setFormBulan(item.bulan || 'Desember');
    setFormIsHighlighted(Boolean(item.isHighlighted));
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !formTotal) return;

    const totalVal = parseFloat(formTotal) || 0;
    const koreksiVal = parseFloat(formKoreksi) || 0;
    const bayarVal = parseFloat(formPembayaran) || 0;
    const noUrutVal = parseInt(formNoUrut) || undefined;
    const calculatedSisa = Math.max(0, totalVal + koreksiVal - bayarVal);

    // 1. Save highlight override to localStorage
    const targetNo = noUrutVal || editingItem.noUrut;
    if (targetNo) {
      try {
        const customHighlights = JSON.parse(localStorage.getItem('rsud_rekap_2025_highlights') || '{}');
        customHighlights[targetNo] = formIsHighlighted;
        localStorage.setItem('rsud_rekap_2025_highlights', JSON.stringify(customHighlights));
        
        import('../services/firestoreSync').then(m => m.syncHighlightsToFirestore('2025', customHighlights));
      } catch (e) {
        console.warn('Failed to save highlight preference', e);
      }
    }

    // 2. Update items state
    const updated = items.map(i => {
      if (i.id === editingItem.id || (i.tahun === '2025' && (i.noUrut === editingItem.noUrut || (noUrutVal && i.noUrut === noUrutVal)))) {
        return {
          ...i,
          noUrut: noUrutVal ?? i.noUrut,
          namaPerusahaan: (formNama || 'REKANAN BLUD').toUpperCase().trim(),
          tahun: formTahun,
          jenisSumber: formSumberJenis,
          noPoSpk: formNoPo.trim(),
          tanggalInvoice: formTanggal,
          totalTagihan: totalVal,
          koreksi: koreksiVal,
          jumlahBayar: bayarVal,
          sisaHutang: calculatedSisa,
          umurHutangHari: parseInt(formUmur) || 1,
          kodeRekening: formKode,
          kegiatan: formKegiatan.trim() || formNama.trim(),
          bulan: formBulan,
          isHighlighted: formIsHighlighted,
          status: (calculatedSisa === 0 ? 'Lunas' : 'Belum Lunas') as any
        };
      }
      return i;
    });

    saveHutangData(updated);

    // 3. Also update rekapInvoice2025 view state directly
    setRekapInvoice2025(prev => prev.map(r => {
      if (r.id === editingItem.id || r.noUrut === (noUrutVal ?? editingItem.noUrut) || (r.kegiatan && editingItem.kegiatan && r.kegiatan.trim().toLowerCase() === editingItem.kegiatan.trim().toLowerCase())) {
        return {
          ...r,
          noUrut: noUrutVal ?? r.noUrut,
          kodeRekening: formKode,
          kegiatan: formKegiatan.trim() || formNama.trim(),
          totalTagihan: totalVal,
          koreksi: koreksiVal,
          jumlahBayar: bayarVal,
          sisaHutang: calculatedSisa,
          isHighlighted: formIsHighlighted,
          status: calculatedSisa === 0 ? 'Lunas' : 'Belum Lunas'
        };
      }
      return r;
    }));

    setIsEditOpen(false);
    setEditingItem(null);
    if (onShowToast) onShowToast('Data rekap hutang berhasil diperbarui!', 'success');
  };

  const handlePromptDelete = (item: HutangItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const name = itemToDelete.namaPerusahaan;
    const updated = items.filter(i => i.id !== itemToDelete.id);
    saveHutangData(updated);
    if (onShowToast) onShowToast(`Data hutang "${name}" berhasil dihapus`, 'info');
    setItemToDelete(null);
  };

  const handleToggleLunas = (item: HutangItem) => {
    if (!canModifyRecord(item)) {
      if (onShowToast) onShowToast('Anda hanya dapat mengubah data yang Anda buat sendiri.', 'error');
      return;
    }

    const updated = items.map(i => {
      if (i.id === item.id) {
        const nextStatus = i.status === 'Belum Lunas' ? 'Lunas' : 'Belum Lunas';
        return {
          ...i,
          status: nextStatus,
          jumlahBayar: nextStatus === 'Lunas' ? i.totalTagihan : 0,
          sisaHutang: nextStatus === 'Lunas' ? 0 : i.totalTagihan
        };
      }
      return i;
    });
    saveHutangData(updated);
  };

  // Submenu Title Resolver
  const getSubmenuTitle = () => {
    switch (currentSubTab) {
      case 'semua_rekap_hutang': return 'SEMUA REKAP HUTANG (2025 & 2026)';
      case 'rekap_hutang_2026': return 'REKAP PENGADAAN HUTANG 2026';
      case 'rekap_hutang_2025': return 'REKAP PENGADAAN HUTANG 2025';
      case 'rekap_apbd_2026': return 'REKAP PENGADAAN APBD 2026';
      case 'rekap_supplier_2026': return 'REKAP PERSUPLIER TAHUN 2026';
      case 'rekap_supplier_2025': return 'REKAP PERSUPLIER TAHUN 2025';
      case 'verifikasi_po': return 'VERIFIKASI PO (PURCHASE ORDER)';
      case 'rekap_pembayaran_perbulan': return 'REKAP PEMBAYARAN PER BULAN';
      case 'invoice_hutang_2025': return 'INVOICE HUTANG 2025';
      case 'invoice_hutang_2026': return 'INVOICE HUTANG 2026';
      default: return 'REKAPITULASI HUTANG BELANJA RSUD';
    }
  };

  if (currentSubTab === 'semua_rekap_hutang' || currentSubTab === 'semua_rekap' || !currentSubTab) {
    return (
      <SemuaRekapHutangView 
        user={user}
        role={role}
        isAdmin={isAdmin}
        onShowToast={onShowToast}
        onNavigateSubmenu={(sub) => setCurrentSubTab(sub)}
      />
    );
  }

  if (currentSubTab === 'rekap_hutang_2026') {
    return (
      <RekapHutang2026View 
        user={user}
        role={role}
        isAdmin={isAdmin}
        onShowToast={onShowToast}
      />
    );
  }

  if (currentSubTab === 'invoice_hutang_2025') {
    return (
      <InvoiceHutang2025View 
        user={user}
        role={role}
        isAdmin={isAdmin}
        onShowToast={onShowToast}
      />
    );
  }

  if (currentSubTab === 'invoice_hutang_2026') {
    return (
      <InvoiceHutang2026View 
        user={user}
        role={role}
        isAdmin={isAdmin}
        onShowToast={onShowToast}
      />
    );
  }

  if (currentSubTab === 'database_kode_rekening') {
    return (
      <DatabaseKodeRekeningView 
        onShowToast={onShowToast}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50/70 to-slate-50 dark:from-slate-950 dark:via-[#0e1222] dark:to-indigo-950 text-slate-900 dark:text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-200 dark:border-indigo-900/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs font-semibold mb-2 border border-indigo-300 dark:border-indigo-500/30">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Sub Bagian Keuangan & Pengadaan
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {getSubmenuTitle()}
          </h2>
          <p className="text-slate-600 dark:text-indigo-200/80 text-xs mt-1 max-w-2xl leading-relaxed">
            Pencatatan kewajiban pembayaran belanja barang/jasa medik, obat-obatan, dan pihak ketiga RSUD Jatisari.
          </p>
        </div>

        {isPicHutangOrAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-emerald-500/40"
            >
              <FileSpreadsheet className="w-4 h-4" /> Import Excel
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md transition transform active:scale-95 border border-indigo-500/40"
            >
              <Plus className="w-4 h-4" /> Entri Data Hutang
            </button>
          </div>
        )}
      </div>

      {isUploadOpen && (
        <ImportInvoiceExcelModal 
          isOpen={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)} 
          year={2025}
          existingCount={0}
          onImportSuccess={async (records, mode) => {
            let newRecords = records;
            if (mode === 'append') {
               const existing = await idbGet<InvoiceHutang2025Record[]>('rsud_invoice_hutang_2025') || [];
               newRecords = [...existing, ...records];
            }
            await idbSet('rsud_invoice_hutang_2025', newRecords);
            window.dispatchEvent(new CustomEvent('rsud_invoice_hutang_2025_updated', { detail: newRecords }));
            if (onShowToast) onShowToast(`Berhasil mengimpor ${records.length} data Invoice Hutang 2025!`, 'success');
          }}
        />
      )}

      {/* 2. KPI Summary Cards */}
      {currentSubTab === 'rekap_hutang_2025' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Saldo Awal (2025)</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-2">{formatRupiah(totalSaldoAwal)}</div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 font-medium">
              Total Fix (+Koreksi): <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatRupiah(totalFix)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Realisasi Pembayaran</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{formatRupiah(totalSudahDibayar)}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {lunasCount} Pos Belanja Lunas
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Saldo Akhir (Sisa Hutang)</div>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2">{formatRupiah(totalHutangAktif)}</div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {belumLunasCount} Pos Belum Lunas
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Pos Belanja 2025</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-2">{displayedItems.length} Pos Belanja</div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 font-medium">
              Total Koreksi: <span className="font-semibold text-amber-600 dark:text-amber-400">{formatRupiah(totalKoreksi)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Tagihan Pengadaan</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-2">{formatRupiah(totalSaldoAwal)}</div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 font-medium">Akumulasi Nilai Invoice/PO</div>
          </div>

          <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Hutang Terbayar (Realisasi)</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{formatRupiah(totalSudahDibayar)}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Telah Dibayarkan Kasda
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Sisa Hutang Berjalan</div>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2">{formatRupiah(totalHutangAktif)}</div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium">Kewajiban Belum Lunas</div>
          </div>

          <div className="bg-white dark:bg-[#0d1216] rounded-2xl p-5 border border-slate-200 dark:border-emerald-950/80 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Rekanan / Supplier</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-2">{totalRekanan} Rekanan</div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2">Mitra Penyedia RSUD</div>
          </div>
        </div>
      )}

      {/* 3. Main Data Table */}
      {currentSubTab === 'rekap_hutang_2025' ? (
        // VIEW: REKAP PENGADAAN HUTANG 2025
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl border border-slate-200 dark:border-emerald-950/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Tersinkronisasi Otomatis
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">•</span>
                <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                  {displayedItems.length} Pos Belanja TA 2025 • {(displayedItems as any[]).reduce((a, b) => a + ((b as any).invoiceCount || 0), 0)} Total Invoice
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                REKAP PENGADAAN HUTANG TAHUN ANGGARAN 2025
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Semua data teragregasi dan tersinkronisasi langsung dari sub menu <strong className="text-emerald-700 dark:text-emerald-300">INVOICE HUTANG 2025</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative w-48 sm:w-56">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari uraian / kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>

              <button
                onClick={async () => {
                  await refreshRekap2025();
                  if (onShowToast) {
                    onShowToast('Nominal Rekap Hutang 2025 berhasil diupdate dan disinkronkan dari Invoice Hutang 2025!', 'success');
                  }
                }}
                disabled={isSyncingNominal}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition transform active:scale-95 cursor-pointer disabled:opacity-50"
                title="Update nominal terhadap data terbaru di sub menu INVOICE HUTANG 2025"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNominal ? 'animate-spin' : ''}`} />
                <span>UPDATE NOMINAL</span>
              </button>

              <button
                onClick={handleExportRekap2025Excel}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                title="Export data Rekap ke Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Export Excel</span>
              </button>

              <button
                onClick={handlePrintRekap2025}
                className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                title="Cetak Rekapitulasi"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              {isPicHutangOrAdmin && (
                <button
                  onClick={handleOpenAdd}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Tambah Pengadaan
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#a8dbc0] dark:border-[#2b5a45]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#e6f4ea] dark:bg-[#1a382b] text-[#13422d] dark:text-[#a6ecc8] font-bold border-b border-[#a8dbc0] dark:border-[#2b5a45] uppercase text-[10.5px] tracking-wide">
                <tr>
                  <th className="px-3 py-3 text-center w-12 border-r border-[#c2e5d2] dark:border-[#2b5a45]">NO</th>
                  <th className="px-4 py-3 border-r border-[#c2e5d2] dark:border-[#2b5a45]">URAIAN / JENIS PENGADAAN</th>
                  <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">SALDO AWAL (HUTANG 2025)</th>
                  <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">KOREKSI</th>
                  <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">PEMBAYARAN</th>
                  <th className="px-4 py-3 text-right border-r border-[#c2e5d2] dark:border-[#2b5a45]">SALDO AKHIR</th>
                  <th className="px-3 py-3 text-center w-24">DETAIL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80">
                {displayedItems.map((item, idx) => {
                  const saldoAwal = item.totalTagihan || 0;
                  const koreksi = item.koreksi || 0;
                  const pembayaran = item.jumlahBayar || 0;
                  const saldoAkhir = item.sisaHutang ?? (saldoAwal + koreksi - pembayaran);
                  const isHigh = Boolean(item.isHighlighted);
                  const canModify = canModifyRecord(item);
                  const invoiceCount = (item as any).invoiceCount ?? 0;

                  const handleOpenDetailModal = () => {
                    const itemInvoices = (item as any).invoices || [];
                    setSelectedPosBelanjaDetail({
                      noUrut: item.noUrut || (idx + 1),
                      kodeRekening: item.kodeRekening || '',
                      kegiatan: item.kegiatan || item.namaPerusahaan,
                      totalTagihan: saldoAwal,
                      koreksi: koreksi,
                      jumlahBayar: pembayaran,
                      sisaHutang: saldoAkhir,
                      invoiceCount: invoiceCount,
                      invoices: itemInvoices
                    });
                  };

                  return (
                    <tr 
                      key={item.id || `pos-${item.noUrut}-${idx}`} 
                      className={`transition ${
                        isHigh 
                          ? 'bg-[#ffff00] hover:bg-[#f6ee00] text-black font-semibold dark:bg-[#c9a600] dark:text-black' 
                          : 'hover:bg-slate-50/90 dark:hover:bg-[#141c24]/90 bg-white dark:bg-[#0d1216]'
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                        {item.noUrut || (idx + 1)}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200 dark:border-zinc-800">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-xs leading-snug">{item.kegiatan || item.namaPerusahaan}</div>
                            <div className={`text-[10px] font-mono mt-0.5 ${isHigh ? 'text-black/80 font-medium' : 'text-slate-500 dark:text-zinc-400'}`}>
                              {item.kodeRekening || '-'}
                            </div>
                          </div>
                          {invoiceCount > 0 ? (
                            <button
                              onClick={handleOpenDetailModal}
                              className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition flex items-center gap-1 cursor-pointer"
                              title="Klik untuk melihat rincian invoice vendor"
                            >
                              <Eye className="w-3 h-3" />
                              {invoiceCount} Inv
                            </button>
                          ) : (
                            <button
                              onClick={handleOpenDetailModal}
                              className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 transition flex items-center gap-1 cursor-pointer"
                              title="Pos Belanja Operasional / Jasa Langsung"
                            >
                              0 Inv
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                        {formatRupiah(saldoAwal)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                        {koreksi > 0 ? formatRupiah(koreksi) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium border-r border-slate-200 dark:border-zinc-800">
                        {pembayaran > 0 ? formatRupiah(pembayaran) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold border-r border-slate-200 dark:border-zinc-800">
                        {saldoAkhir > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-[#d7a9be] dark:bg-[#722c4d] text-slate-900 dark:text-pink-100 font-bold">
                            {formatRupiah(saldoAkhir)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={handleOpenDetailModal}
                            className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition"
                            title="Lihat Rincian Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isPicHutangOrAdmin && canModify && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-black/5 dark:hover:bg-white/10 transition"
                                title="Edit Baris Rekap"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handlePromptDelete(item)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/10 transition"
                                title="Hapus Baris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* TOTAL FOOTER */}
              <tfoot className="bg-[#dbe7e1] dark:bg-[#1a2e24] font-bold border-t-2 border-[#8dbba5] dark:border-[#2b5a45] text-[#123827] dark:text-white">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                    TOTAL KESELURUHAN:
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                    {formatRupiah(totalSaldoAwal)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                    {formatRupiah(totalKoreksi)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                    {formatRupiah(totalSudahDibayar)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-rose-900 dark:text-pink-300 border-r border-[#b8dbc6] dark:border-[#2b5a45]">
                    {formatRupiah(totalHutangAktif)}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
                    {(displayedItems as any[]).reduce((a, b) => a + ((b as any).invoiceCount || 0), 0)} Inv
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : currentSubTab.includes('rekap_supplier') ? (
        // VIEW: REKAP PERSUPPLIER
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl border border-slate-200 dark:border-emerald-950/80 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Rekapitulasi Hutang Persupplier / Rekanan ({currentSubTab.includes('2026') ? '2026' : '2025'})
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Akumulasi kewajiban per vendor dan penyedia jasa
              </p>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Nama Supplier / Vendor Rekanan</th>
                  <th className="px-4 py-3 text-center">Jml Invoice</th>
                  <th className="px-4 py-3 text-right">Total Tagihan</th>
                  <th className="px-4 py-3 text-right">Terbayar</th>
                  <th className="px-4 py-3 text-right font-bold text-indigo-900 dark:text-indigo-300">Sisa Hutang</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {supplierSummary.map((sup, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-[#141c24]/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-zinc-100">{sup.nama}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-zinc-400">{sup.count} invoice</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-zinc-300">{formatRupiah(sup.totalTagihan)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatRupiah(sup.terbayar)}</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-950 dark:text-indigo-300">{formatRupiah(sup.sisa)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sup.sisa === 0 ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60'}`}>
                        {sup.sisa === 0 ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // DEFAULT VIEW: LIST OF INVOICES / REKAP PENGADAAN
        <div className="bg-white dark:bg-[#0d1216] rounded-2xl border border-slate-200 dark:border-emerald-950/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-emerald-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#12181f]/80">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari rekanan, no PO, kegiatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0d1216] border border-slate-200 dark:border-emerald-950/80 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterSumber}
                onChange={(e) => setFilterSumber(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-[#0d1216] border border-slate-200 dark:border-emerald-950/80 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300"
              >
                <option value="Semua">Semua Sumber (BLUD & APBD)</option>
                <option value="BLUD">Sumber Dana BLUD</option>
                <option value="APBD">Sumber Dana APBD</option>
              </select>

              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                {displayedItems.length} Data
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-emerald-950/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Rekanan / Vendor</th>
                  <th className="px-4 py-3">No PO / SPK</th>
                  <th className="px-4 py-3">Tanggal Invoice</th>
                  <th className="px-4 py-3">Kode Rekening & Uraian</th>
                  <th className="px-4 py-3 text-right">Total Tagihan</th>
                  <th className="px-4 py-3 text-center">Umur Hutang</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  {isPicHutangOrAdmin && <th className="px-4 py-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {displayedItems.map((item) => {
                  const canModify = canModifyRecord(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-[#141c24]/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-zinc-100">{item.namaPerusahaan}</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-800/40">{item.jenisSumber}</span>
                          <span>{item.tahun}</span>
                        </div>
                        {item.createdBy && (
                          <div className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">PIC: {item.createdBy}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-zinc-300">{item.noPoSpk}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{item.tanggalInvoice}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-indigo-700 dark:text-indigo-400 text-[11px] font-semibold">{item.kodeRekening}</div>
                        <div className="text-[11px] text-slate-600 dark:text-zinc-400 truncate max-w-xs">{item.kegiatan}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-zinc-100">{formatRupiah(item.totalTagihan)}</td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-zinc-400">{item.umurHutangHari} hari</td>
                      <td className="px-4 py-3 text-center">
                        {canModify ? (
                          <button
                            onClick={() => handleToggleLunas(item)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${item.status === 'Lunas' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60 hover:bg-amber-200'}`}
                            title="Klik untuk ubah status lunas"
                          >
                            {item.status}
                          </button>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.status === 'Lunas' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60'}`}>
                            {item.status}
                          </span>
                        )}
                      </td>
                      {isPicHutangOrAdmin && (
                        <td className="px-4 py-3 text-center">
                          {canModify ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition"
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
      )}

      {/* Modal Add Hutang Item */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-emerald-950/80 text-slate-800 dark:text-zinc-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {currentSubTab === 'rekap_hutang_2025' ? 'Tambah Baris Rekap Pengadaan 2025' : 'Entri Hutang Vendor Baru'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">Tambahkan data kewajiban/belanja pengadaan RSUD Jatisari</p>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">No. Urut</label>
                  <input
                    type="number"
                    placeholder="No"
                    value={formNoUrut}
                    onChange={(e) => setFormNoUrut(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Uraian / Nama Belanja / Vendor</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Belanja Bahan-Bahan Lainnya"
                    value={formKegiatan}
                    onChange={(e) => setFormKegiatan(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kode Rekening Belanja</label>
                <input
                  type="text"
                  placeholder="Contoh: 5.1.02.01.01.0019"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Koreksi (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formKoreksi}
                    onChange={(e) => setFormKoreksi(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Pembayaran (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formPembayaran}
                    onChange={(e) => setFormPembayaran(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100 text-emerald-600 dark:text-emerald-400 font-semibold"
                  />
                </div>
              </div>

              {/* Saldo Akhir Auto Calc Box */}
              <div className="p-3 bg-slate-50 dark:bg-[#12181f] rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Estimasi Saldo Akhir (Kalkulasi):</div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500">Saldo Awal + Koreksi - Pembayaran</div>
                </div>
                <div className="text-sm font-bold font-mono text-rose-700 dark:text-rose-400">
                  {formatRupiah(Math.max(0, (parseFloat(formTotal) || 0) + (parseFloat(formKoreksi) || 0) - (parseFloat(formPembayaran) || 0)))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="add-highlight-check"
                  checked={formIsHighlighted}
                  onChange={(e) => setFormIsHighlighted(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <label htmlFor="add-highlight-check" className="text-xs text-slate-700 dark:text-zinc-300 select-none cursor-pointer">
                  Tandai baris dengan highlight kuning (sesuai dokumen acuan)
                </label>
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
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Hutang Item */}
      {isEditOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-emerald-950/80 text-slate-800 dark:text-zinc-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {currentSubTab === 'rekap_hutang_2025' ? 'Edit Baris Rekap Pengadaan 2025' : 'Edit Catatan Hutang Rekanan'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">Perbarui rincian data baris tabel pos belanja RSUD</p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">No. Urut</label>
                  <input
                    type="number"
                    value={formNoUrut}
                    onChange={(e) => setFormNoUrut(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Uraian / Kegiatan Belanja</label>
                  <input
                    type="text"
                    required
                    value={formKegiatan}
                    onChange={(e) => setFormKegiatan(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Kode Rekening Belanja</label>
                <input
                  type="text"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Koreksi (Rp)</label>
                  <input
                    type="number"
                    value={formKoreksi}
                    onChange={(e) => setFormKoreksi(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Pembayaran (Rp)</label>
                  <input
                    type="number"
                    value={formPembayaran}
                    onChange={(e) => setFormPembayaran(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-100 text-emerald-600 dark:text-emerald-400 font-semibold"
                  />
                </div>
              </div>

              {/* Saldo Akhir Auto Calc Box */}
              <div className="p-3 bg-slate-50 dark:bg-[#12181f] rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Estimasi Saldo Akhir:</div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500">Saldo Awal + Koreksi - Pembayaran</div>
                </div>
                <div className="text-sm font-bold font-mono text-rose-700 dark:text-rose-400">
                  {formatRupiah(Math.max(0, (parseFloat(formTotal) || 0) + (parseFloat(formKoreksi) || 0) - (parseFloat(formPembayaran) || 0)))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-highlight-check"
                  checked={formIsHighlighted}
                  onChange={(e) => setFormIsHighlighted(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <label htmlFor="edit-highlight-check" className="text-xs text-slate-700 dark:text-zinc-300 select-none cursor-pointer">
                  Tandai baris dengan highlight kuning (sesuai dokumen acuan)
                </label>
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
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold"
                >
                  Perbarui Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Hutang */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-zinc-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Konfirmasi Hapus Hutang</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/40 mb-5 text-xs space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white text-sm">{itemToDelete.namaPerusahaan}</div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Sumber Dana:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-100">{itemToDelete.jenisSumber}</span>
              </div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Kegiatan:</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">{itemToDelete.kegiatan}</span>
              </div>
              <div className="text-slate-600 dark:text-zinc-300 flex justify-between">
                <span>Total Tagihan:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{formatRupiah(itemToDelete.totalTagihan)}</span>
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
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus Data Hutang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Invoices Per Pos Belanja 2025 */}
      {selectedPosBelanjaDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1216] rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-[#12181f]/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                    Pos #{selectedPosBelanjaDetail.noUrut}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400">
                    {selectedPosBelanjaDetail.kodeRekening || '-'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedPosBelanjaDetail.kegiatan}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Rincian invoice dari sub menu INVOICE HUTANG 2025 yang terkelompok pada pos belanja ini ({selectedPosBelanjaDetail.invoices.length} invoice).
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedPosBelanjaDetail(null);
                  setDrilldownSearch('');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/60 dark:bg-[#10151b] border-b border-slate-200 dark:border-zinc-800">
              <div className="bg-white dark:bg-[#151c24] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase">Saldo Awal (Invoice)</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatRupiah(selectedPosBelanjaDetail.totalTagihan)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#151c24] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase">Total Koreksi</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatRupiah(selectedPosBelanjaDetail.koreksi)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#151c24] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase">Total Terbayar</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {formatRupiah(selectedPosBelanjaDetail.jumlahBayar)}
                </div>
              </div>
              <div className="bg-white dark:bg-[#151c24] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase">Sisa Hutang</div>
                <div className="text-sm font-bold text-rose-600 dark:text-pink-400 font-mono mt-0.5">
                  {formatRupiah(selectedPosBelanjaDetail.sisaHutang)}
                </div>
              </div>
            </div>

            {/* Filter Search Bar */}
            <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nomor invoice / vendor / tanggal..."
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#12181f] border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>

              <button
                onClick={() => {
                  const rows = selectedPosBelanjaDetail.invoices.map((inv, idx) => ({
                    'NO': idx + 1,
                    'NO INVOICE ASLI': inv.no,
                    'NOMOR INVOICE / SPK / PO': inv.noInvoice || (inv as any).nomorInvoice || '-',
                    'TANGGAL INVOICE': inv.tglInvoice || (inv as any).tanggalInvoice || '-',
                    'NAMA REKANAN / VENDOR': inv.rekanan || (inv as any).namaPerusahaan || '-',
                    'KODE REKENING': (inv as any).kodeRekening || selectedPosBelanjaDetail.kodeRekening,
                    'POS BELANJA': selectedPosBelanjaDetail.kegiatan,
                    'JUMLAH INVOICE': inv.jumlahInvoice || 0,
                    'KOREKSI': inv.koreksi || 0,
                    'FIX': (inv.jumlahInvoice || 0) + (inv.koreksi || 0),
                    'PEMBAYARAN': inv.pembayaran || 0,
                    'SISA HUTANG': Math.max(0, ((inv.jumlahInvoice || 0) + (inv.koreksi || 0)) - (inv.pembayaran || 0)),
                    'STATUS': ((inv.jumlahInvoice || 0) + (inv.koreksi || 0)) <= (inv.pembayaran || 0) ? 'LUNAS' : 'BELUM LUNAS'
                  }));
                  const ws = XLSX.utils.json_to_sheet(rows);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
                  XLSX.writeFile(wb, `RINCIAN_INVOICE_POS_${selectedPosBelanjaDetail.noUrut}_${new Date().toISOString().slice(0, 10)}.xlsx`);
                }}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>

            {/* Invoices List Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const filteredInvoices = selectedPosBelanjaDetail.invoices.filter(inv => {
                  if (!drilldownSearch) return true;
                  const q = drilldownSearch.toLowerCase();
                  const vendor = (inv.rekanan || (inv as any).namaPerusahaan || '').toLowerCase();
                  const noInv = (inv.noInvoice || (inv as any).nomorInvoice || '').toLowerCase();
                  const tgl = (inv.tglInvoice || (inv as any).tanggalInvoice || '').toLowerCase();
                  const noIdx = String(inv.no || '');
                  return vendor.includes(q) || noInv.includes(q) || tgl.includes(q) || noIdx.includes(q);
                });

                if (selectedPosBelanjaDetail.invoices.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 dark:bg-[#12181f] rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 my-4 space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                        Beban Operasional / Jasa Langsung BLUD
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                        Pos Belanja ini merupakan pos beban operasional/jasa langsung RSUD (misal: Jasa Pelayanan Medis Dokter, Listrik PLN, Air PDAM, dll) yang tercatat langsung pada buku rekapitulasi hutang master tanpa lembaran invoice vendor pihak ketiga.
                      </p>
                    </div>
                  );
                }

                if (filteredInvoices.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                      Tidak ada invoice yang sesuai dengan kriteria pencarian "{drilldownSearch}".
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-[#12181f] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800 uppercase text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5 text-center w-12">No Inv</th>
                          <th className="px-3 py-2.5">No Invoice / SPK / PO</th>
                          <th className="px-3 py-2.5">Tanggal</th>
                          <th className="px-3 py-2.5">Nama Vendor / Rekanan</th>
                          <th className="px-3 py-2.5 text-right">Jumlah Invoice</th>
                          <th className="px-3 py-2.5 text-right">Koreksi</th>
                          <th className="px-3 py-2.5 text-right">Fix</th>
                          <th className="px-3 py-2.5 text-right">Pembayaran</th>
                          <th className="px-3 py-2.5 text-right">Sisa Hutang</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                        {filteredInvoices.map((inv) => {
                          const rawJumlah = inv.jumlahInvoice || 0;
                          const rawKoreksi = inv.koreksi || 0;
                          const fix = inv.totalInvoiceFix || (rawJumlah + rawKoreksi);
                          const bayar = inv.pembayaran || 0;
                          const sisa = inv.sisaHutang !== undefined ? inv.sisaHutang : Math.max(0, fix - bayar);
                          const isLunas = sisa <= 0;
                          const noInvoiceStr = inv.noInvoice || (inv as any).nomorInvoice || '-';
                          const tglInvoiceStr = inv.tglInvoice || (inv as any).tanggalInvoice || '-';
                          const rekananStr = inv.rekanan || (inv as any).namaPerusahaan || '-';

                          return (
                            <tr key={inv.id || inv.no} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                              <td className="px-3 py-2 text-center font-mono font-medium text-slate-500 dark:text-zinc-400">
                                #{inv.no}
                              </td>
                              <td className="px-3 py-2 font-medium text-slate-900 dark:text-zinc-100">
                                {noInvoiceStr}
                              </td>
                              <td className="px-3 py-2 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                                {tglInvoiceStr}
                              </td>
                              <td className="px-3 py-2 font-semibold text-slate-800 dark:text-zinc-200">
                                {rekananStr}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-zinc-300">
                                {formatRupiah(rawJumlah)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-zinc-300">
                                {rawKoreksi > 0 ? formatRupiah(rawKoreksi) : '-'}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 dark:text-white">
                                {formatRupiah(fix)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                {bayar > 0 ? formatRupiah(bayar) : '-'}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-rose-600 dark:text-pink-400">
                                {sisa > 0 ? formatRupiah(sisa) : '-'}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isLunas 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                }`}>
                                  {isLunas ? 'LUNAS' : 'BELUM LUNAS'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-[#12181f] border-t border-slate-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => {
                  setSelectedPosBelanjaDetail(null);
                  setDrilldownSearch('');
                }}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
