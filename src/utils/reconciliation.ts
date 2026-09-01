import {
  CoretaxPPNRecord,
  DataHutangRecord,
  LinkedMonitoringItem,
  MonthlySummary,
  OverallStats,
  MatchingStatusType,
} from '../types/ppn';
import { NAMA_BULAN } from './ppnFormatters';

function cleanInvoiceNo(inv?: string): string {
  if (!inv) return '';
  return inv.toString().trim().toUpperCase().replace(/[\s\t\r\n]+/g, '');
}

export function reconcileData(
  coretaxList: CoretaxPPNRecord[],
  hutangList: DataHutangRecord[]
): {
  linkedItems: LinkedMonitoringItem[];
  hutangWithoutFaktur: LinkedMonitoringItem[];
  monthlySummaries: MonthlySummary[];
  overallStats: OverallStats;
} {
  // Map of hutang records keyed by normalized invoice number
  const hutangMap = new Map<string, DataHutangRecord>();
  const matchedHutangIds = new Set<string>();

  hutangList.forEach((h) => {
    const key = cleanInvoiceNo(h.nomorInvoice);
    if (key) {
      hutangMap.set(key, h);
    }
  });

  const linkedItems: LinkedMonitoringItem[] = coretaxList.map((c) => {
    const rawInv = c.nomorInvoice ? c.nomorInvoice.trim() : '';
    const cleanedKey = cleanInvoiceNo(rawInv);

    let matchedHutang: DataHutangRecord | undefined = undefined;
    if (cleanedKey) {
      matchedHutang = hutangMap.get(cleanedKey);
    }

    let status: MatchingStatusType = 'INVOICE_KOSONG';
    let statusLabel = 'NO INVOICE KOSONG';
    let statusBadgeColor = 'bg-slate-100 text-slate-700 border-slate-300';

    if (!rawInv) {
      status = 'INVOICE_KOSONG';
      statusLabel = 'NO INVOICE KOSONG';
      statusBadgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
    } else if (matchedHutang) {
      matchedHutangIds.add(matchedHutang.id);
      if (matchedHutang.statusPembayaran === 'SUDAH DIBAYAR') {
        status = 'SUDAH_DIBAYAR';
        statusLabel = 'SUDAH DIBAYAR';
        statusBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      } else {
        status = 'BELUM_DIBAYAR';
        statusLabel = matchedHutang.statusPembayaran || 'BELUM DIBAYAR';
        statusBadgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
      }
    } else {
      status = 'TIDAK_DITEMUKAN_DI_HUTANG';
      statusLabel = 'BELUM DI DATA HUTANG';
      statusBadgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
    }

    const monthNum = c.masaPajak || c.periodeBulan || (c.tanggalFaktur ? new Date(c.tanggalFaktur).getMonth() + 1 : 1);

    return {
      id: `LINK-${c.id}`,
      periodeBulan: monthNum,
      nomorFaktur: c.nomorFaktur,
      tanggalFaktur: c.tanggalFaktur,
      namaVendorCoretax: c.namaPenjual || c.namaVendor || 'Vendor Coretax',
      npwpVendor: c.npwpPenjual || c.npwpVendor || '',
      dpp: c.dpp || 0,
      ppn: c.ppn || 0,
      hargaJual: c.hargaJual || c.dpp || 0,
      nilaiInvoiceCoretax: c.nilaiInvoiceCoretax || (c.dpp || 0) + (c.ppn || 0),
      perekam: c.perekam || 'DJP-Coretax',
      statusFaktur: c.statusFaktur || 'Normal',

      nomorInvoice: rawInv,

      hutangId: matchedHutang?.id,
      namaVendorHutang: matchedHutang?.vendor,
      nilaiInvoice: matchedHutang?.nilaiInvoice || 0,
      statusPembayaranHutang: matchedHutang?.statusPembayaran,
      nomorSP2D: matchedHutang?.nomorSP2D,
      tanggalPembayaran: matchedHutang?.tanggalPembayaran,
      jenisHutang: matchedHutang?.jenisHutang,
      notes: matchedHutang?.keterangan,

      status,
      statusLabel,
      statusBadgeColor,
    };
  });

  // Hutang records that do not have matching Coretax faktur
  const hutangWithoutFaktur: LinkedMonitoringItem[] = hutangList
    .filter((h) => !matchedHutangIds.has(h.id))
    .map((h) => {
      const monthNum = h.tanggalInvoice ? new Date(h.tanggalInvoice).getMonth() + 1 : 1;
      return {
        id: `UNLINK-HTG-${h.id}`,
        periodeBulan: monthNum,
        nomorFaktur: '(BELUM ADA FAKTUR)',
        tanggalFaktur: h.tanggalInvoice,
        namaVendorCoretax: h.vendor,
        npwpVendor: '-',
        dpp: 0,
        ppn: 0,
        hargaJual: 0,
        nilaiInvoiceCoretax: 0,
        perekam: '-',
        statusFaktur: 'Belum Terbit',

        nomorInvoice: h.nomorInvoice,
        hutangId: h.id,
        namaVendorHutang: h.vendor,
        nilaiInvoice: h.nilaiInvoice,
        statusPembayaranHutang: h.statusPembayaran,
        nomorSP2D: h.nomorSP2D,
        tanggalPembayaran: h.tanggalPembayaran,
        jenisHutang: h.jenisHutang,
        notes: h.keterangan,

        status: 'HUTANG_TANPA_FAKTUR',
        statusLabel: 'TANPA FAKTUR PAJAK',
        statusBadgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      };
    });

  // Build Monthly Summaries (Jan - Des 2026)
  const monthlySummaries: MonthlySummary[] = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthItems = linkedItems.filter((it) => it.periodeBulan === monthNum);

    const jumlahFaktur = monthItems.length;
    const totalDPP = monthItems.reduce((acc, it) => acc + (it.dpp || 0), 0);
    const totalPPN = monthItems.reduce((acc, it) => acc + (it.ppn || 0), 0);

    const sudahDibayarItems = monthItems.filter((it) => it.status === 'SUDAH_DIBAYAR');
    const sudahDibayarCount = sudahDibayarItems.length;
    const sudahDibayarPPN = sudahDibayarItems.reduce((acc, it) => acc + (it.ppn || 0), 0);

    const belumDibayarItems = monthItems.filter((it) => it.status === 'BELUM_DIBAYAR');
    const belumDibayarCount = belumDibayarItems.length;
    const belumDibayarPPN = belumDibayarItems.reduce((acc, it) => acc + (it.ppn || 0), 0);

    const tidakDitemukanItems = monthItems.filter(
      (it) => it.status === 'TIDAK_DITEMUKAN_DI_HUTANG' || it.status === 'INVOICE_KOSONG'
    );
    const tidakDitemukanCount = tidakDitemukanItems.length;
    const tidakDitemukanPPN = tidakDitemukanItems.reduce((acc, it) => acc + (it.ppn || 0), 0);

    const persentaseSelesai = totalPPN > 0 ? Math.round((sudahDibayarPPN / totalPPN) * 100) : 0;

    return {
      bulan: monthNum,
      namaBulan: NAMA_BULAN[i],
      jumlahFaktur,
      totalDPP,
      totalPPN,
      sudahDibayarCount,
      sudahDibayarPPN,
      belumDibayarCount,
      belumDibayarPPN,
      tidakDitemukanCount,
      tidakDitemukanPPN,
      persentaseSelesai,
    };
  });

  // Overall Stats
  const overallStats: OverallStats = {
    totalFaktur: linkedItems.length,
    totalDPP: linkedItems.reduce((acc, it) => acc + (it.dpp || 0), 0),
    totalPPN: linkedItems.reduce((acc, it) => acc + (it.ppn || 0), 0),
    sudahDibayarCount: linkedItems.filter((it) => it.status === 'SUDAH_DIBAYAR').length,
    sudahDibayarPPN: linkedItems
      .filter((it) => it.status === 'SUDAH_DIBAYAR')
      .reduce((acc, it) => acc + (it.ppn || 0), 0),
    belumDibayarCount: linkedItems.filter((it) => it.status === 'BELUM_DIBAYAR').length,
    belumDibayarPPN: linkedItems
      .filter((it) => it.status === 'BELUM_DIBAYAR')
      .reduce((acc, it) => acc + (it.ppn || 0), 0),
    tidakDitemukanCount: linkedItems.filter(
      (it) => it.status === 'TIDAK_DITEMUKAN_DI_HUTANG' || it.status === 'INVOICE_KOSONG'
    ).length,
    tidakDitemukanPPN: linkedItems
      .filter((it) => it.status === 'TIDAK_DITEMUKAN_DI_HUTANG' || it.status === 'INVOICE_KOSONG')
      .reduce((acc, it) => acc + (it.ppn || 0), 0),
    hutangTanpaFakturCount: hutangWithoutFaktur.length,
  };

  return {
    linkedItems,
    hutangWithoutFaktur,
    monthlySummaries,
    overallStats,
  };
}

export function calculateMonthlySummaries(linkedItems: LinkedMonitoringItem[]): MonthlySummary[] {
  return Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthItems = linkedItems.filter((it) => it.periodeBulan === monthNum);

    const jumlahFaktur = monthItems.length;
    const totalDPP = monthItems.reduce((acc, it) => acc + (it.dpp || 0), 0);
    const totalPPN = monthItems.reduce((acc, it) => acc + (it.ppn || 0), 0);

    const sudahDibayarItems = monthItems.filter((it) => it.status === 'SUDAH_DIBAYAR');
    const sudahDibayarCount = sudahDibayarItems.length;
    const sudahDibayarPPN = sudahDibayarItems.reduce((acc, it) => acc + (it.ppn || 0), 0);

    const belumDibayarItems = monthItems.filter((it) => it.status === 'BELUM_DIBAYAR');
    const belumDibayarCount = belumDibayarItems.length;
    const belumDibayarPPN = belumDibayarItems.reduce((acc, it) => acc + (it.ppn || 0), 0);

    const tidakDitemukanItems = monthItems.filter(
      (it) => it.status === 'TIDAK_DITEMUKAN_DI_HUTANG' || it.status === 'INVOICE_KOSONG'
    );
    const tidakDitemukanCount = tidakDitemukanItems.length;
    const tidakDitemukanPPN = tidakDitemukanItems.reduce((acc, it) => acc + (it.ppn || 0), 0);

    const persentaseSelesai = totalPPN > 0 ? Math.round((sudahDibayarPPN / totalPPN) * 100) : 0;

    return {
      bulan: monthNum,
      namaBulan: NAMA_BULAN[i],
      jumlahFaktur,
      totalDPP,
      totalPPN,
      sudahDibayarCount,
      sudahDibayarPPN,
      belumDibayarCount,
      belumDibayarPPN,
      tidakDitemukanCount,
      tidakDitemukanPPN,
      persentaseSelesai,
    };
  });
}

export function calculateOverallStats(
  linkedItems: LinkedMonitoringItem[],
  hutangList: DataHutangRecord[] = []
): OverallStats {
  const matchingResult = reconcileData(
    linkedItems.map((it) => ({
      id: it.id.replace(/^LINK-/, ''),
      nomorFaktur: it.nomorFaktur,
      tanggalFaktur: it.tanggalFaktur,
      namaPenjual: it.namaVendorCoretax,
      dpp: it.dpp,
      ppn: it.ppn,
      nomorInvoice: it.nomorInvoice,
      masaPajak: it.periodeBulan,
      tahun: 2026,
      statusFaktur: it.statusFaktur,
      hargaJual: it.hargaJual,
      perekam: it.perekam,
    })),
    hutangList
  );

  return matchingResult.overallStats;
}

export function findDiscrepancies(linkedItems: LinkedMonitoringItem[]): LinkedMonitoringItem[] {
  return linkedItems.filter((it) => {
    // 1. Check if invoice numbers match but amounts differ significantly (PPN != 11% or total value discrepancy)
    if (it.nilaiInvoice && it.dpp > 0) {
      const coretaxTotal = (it.dpp || 0) + (it.ppn || 0);
      const diff = Math.abs(coretaxTotal - it.nilaiInvoice);
      if (diff > 1000) return true;
    }
    // 2. Check if PPN is not 11% of DPP (allow 2 rupiah rounding tolerance)
    if (it.dpp > 0 && it.ppn > 0) {
      const expectedPpn = Math.round(it.dpp * 0.11);
      if (Math.abs(expectedPpn - it.ppn) > 5) return true;
    }
    return false;
  });
}

