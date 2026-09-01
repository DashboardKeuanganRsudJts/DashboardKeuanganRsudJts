export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const RAINBOW_MONTH_COLORS: Record<number, { bg: string; text: string; border: string; badgeBg: string; badgeText: string }> = {
  1: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', badgeBg: 'bg-rose-500', badgeText: 'text-white' },
  2: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', badgeBg: 'bg-orange-500', badgeText: 'text-white' },
  3: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', badgeBg: 'bg-amber-500', badgeText: 'text-slate-950' },
  4: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300', badgeBg: 'bg-yellow-500', badgeText: 'text-slate-950' },
  5: { bg: 'bg-lime-50', text: 'text-lime-800', border: 'border-lime-300', badgeBg: 'bg-lime-600', badgeText: 'text-white' },
  6: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', badgeBg: 'bg-emerald-600', badgeText: 'text-white' },
  7: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300', badgeBg: 'bg-teal-600', badgeText: 'text-white' },
  8: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300', badgeBg: 'bg-cyan-600', badgeText: 'text-white' },
  9: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-300', badgeBg: 'bg-sky-600', badgeText: 'text-white' },
  10: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', badgeBg: 'bg-blue-600', badgeText: 'text-white' },
  11: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300', badgeBg: 'bg-indigo-600', badgeText: 'text-white' },
  12: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', badgeBg: 'bg-purple-600', badgeText: 'text-white' }
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num || 0);
}

export function formatDate(dateStr?: string): string {
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

export function getVendorColor(vendorName: string) {
  const palette = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
    { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' }
  ];

  let hash = 0;
  for (let i = 0; i < (vendorName || '').length; i++) {
    hash = vendorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}
