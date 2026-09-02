import { KategoriPenjamin, StatusKlaim, UmurPiutangCategory } from '../types/piutang';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} Jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} Rb`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateTimeStr: string): string {
  if (!dateTimeStr) return '-';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d) + ' WIB';
  } catch {
    return dateTimeStr;
  }
}

export function getStatusBadgeClass(status: StatusKlaim): string {
  switch (status) {
    case 'Lunas / Cair':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'Pengajuan Berkas':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Verifikasi Internal':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'Dispute / Pending':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'Cicilan':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Klaim Ditolak':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
}

export function getAgingBadgeClass(category: UmurPiutangCategory): string {
  switch (category) {
    case '0-30 Hari (Lancar)':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case '31-60 Hari (Kurang Lancar)':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case '61-90 Hari (Diragukan)':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    case '>90 Hari (Macet / Kritis)':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function getPenjaminBadgeClass(penjamin: KategoriPenjamin): string {
  switch (penjamin) {
    case 'BPJS Kesehatan - PBI':
      return 'bg-teal-50 text-teal-800 border-teal-200';
    case 'BPJS Kesehatan - Non PBI':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Jamkesda / Karawang Sehat':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'Asuransi Swasta':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'Jasa Raharja (Laka Lantas)':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Kemitraan Perusahaan':
      return 'bg-violet-50 text-violet-800 border-violet-200';
    case 'Pasien Umum / Jaminan':
      return 'bg-stone-100 text-stone-800 border-stone-300';
    default:
      return 'bg-slate-50 text-slate-800 border-slate-200';
  }
}
