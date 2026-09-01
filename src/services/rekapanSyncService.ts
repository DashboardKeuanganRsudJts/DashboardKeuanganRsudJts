import { 
  SEMUA_REKAPAN_REAL_GROUPS, 
  SemuaRekapanGroup, 
  SemuaRekapanRow,
  PerusahaanAsuransiRow,
  ListrikKantinStandGroup,
  generateAllMonthsPerusahaanData,
  LISTRIK_KANTIN_REAL_DATA
} from '../data/spreadsheetData2026';
import { syncDocumentToFirestore } from './firestoreSync';

export const MONTH_LIST = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

/**
 * Rolls forward 'Perusahaan & Asuransi' rows across all 12 months for each company.
 * For each company:
 * - JANUARI: uses initial or edited piutangLalu, computes sisaPiutang = (piutangLalu + piutangBulanIni) - pembayaran
 * - FEBRUARI .. DESEMBER: piutangLalu = sisaPiutang of the previous month!
 *   Then computes this month's sisaPiutang = (piutangLalu + piutangBulanIni) - pembayaran
 * 
 * Automatically rolls forward across all months sequentially.
 */
export function rollForwardPerusahaanRows(
  dataList: PerusahaanAsuransiRow[]
): PerusahaanAsuransiRow[] {
  if (!dataList || dataList.length === 0) return [];

  // Group all rows by normalized company name
  const companyMap = new Map<string, PerusahaanAsuransiRow[]>();
  
  // Clone array to avoid accidental reference side-effects
  const clonedList = dataList.map(row => ({
    ...row,
    invoices: row.invoices ? [...row.invoices] : []
  }));

  clonedList.forEach(row => {
    const key = (row.namaPerusahaan || '').trim().toLowerCase();
    if (!companyMap.has(key)) {
      companyMap.set(key, []);
    }
    companyMap.get(key)!.push(row);
  });

  const updatedRows: PerusahaanAsuransiRow[] = [];

  companyMap.forEach((compRows) => {
    // Sort rows by chronological month order (JANUARI -> DESEMBER)
    compRows.sort((a, b) => {
      const idxA = MONTH_LIST.indexOf((a.bulan || '').toUpperCase());
      const idxB = MONTH_LIST.indexOf((b.bulan || '').toUpperCase());
      return (idxA !== -1 ? idxA : 0) - (idxB !== -1 ? idxB : 0);
    });

    let runningSisa = 0;

    compRows.forEach((row, mIdx) => {
      // Determine invoice tagihan and payment
      let tagihan = 0;
      let bayar = 0;

      if (row.invoices && row.invoices.length > 0) {
        tagihan = row.invoices.reduce((s, inv) => s + (inv.nominalTagihan || 0), 0);
        const invoiceBayar = row.invoices.reduce((s, inv) => s + (inv.pembayaran || 0), 0);
        bayar = Math.max(row.pembayaran || 0, invoiceBayar);
      } else {
        tagihan = row.piutangBulanIni || 0;
        bayar = row.pembayaran || 0;
      }

      let currentPiutangLalu = row.piutangLalu || 0;

      // Roll-forward: from February onwards, piutangLalu is the remaining debt (sisaPiutang) from the previous month
      if (mIdx > 0) {
        currentPiutangLalu = runningSisa;
      }

      const currentPiutangBulanIni = tagihan;
      const currentPiutangSdBulanIni = currentPiutangLalu + currentPiutangBulanIni;
      const currentPembayaran = bayar;
      const currentSisa = Math.max(0, currentPiutangSdBulanIni - currentPembayaran);

      let currentStatus: PerusahaanAsuransiRow['status'] = row.status || 'Belum Jatuh Tempo';
      if (currentSisa === 0) {
        currentStatus = 'Lunas';
      } else if (row.status === 'Lunas') {
        currentStatus = 'Belum Jatuh Tempo';
      }

      row.piutangLalu = currentPiutangLalu;
      row.piutangBulanIni = currentPiutangBulanIni;
      row.piutangSdBulanIni = currentPiutangSdBulanIni;
      row.pembayaran = currentPembayaran;
      row.sisaPiutang = currentSisa;
      row.status = currentStatus;

      // The resulting sisaPiutang cascades into the next month's piutangLalu
      runningSisa = currentSisa;

      updatedRows.push(row);
    });
  });

  return updatedRows;
}

/**
 * Synchronizes 'Semua Rekapan (10 Penjamin)' with the latest data from:
 * 1. 'Perusahaan & Asuransi' (Row 7: PERUSAHAAN DAN ASURANSI)
 * 2. 'Listrik Kantin' (Row 10: LISTRIK KANTIN JAWARA)
 * 
 * Preserves user manual edits on all other rows and months.
 */
export function syncSemuaRekapanFromSources(
  overridePerusahaanData?: PerusahaanAsuransiRow[],
  overrideListrikData?: ListrikKantinStandGroup[]
): Record<string, SemuaRekapanGroup> {
  let existingGroups: Record<string, SemuaRekapanGroup> = { ...SEMUA_REKAPAN_REAL_GROUPS };

  try {
    const saved = localStorage.getItem('rsud_semua_rekapan_2026');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        existingGroups = { ...SEMUA_REKAPAN_REAL_GROUPS, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Error reading rsud_semua_rekapan_2026:', e);
  }

  // Load Perusahaan & Asuransi data (run roll-forward first if needed)
  let rawPerusahaanData: PerusahaanAsuransiRow[] = overridePerusahaanData || [];
  if (!rawPerusahaanData || rawPerusahaanData.length === 0) {
    try {
      const savedP = localStorage.getItem('rsud_perusahaan_asuransi_2026');
      if (savedP) {
        const parsedP = JSON.parse(savedP);
        if (Array.isArray(parsedP) && parsedP.length > 0) {
          rawPerusahaanData = parsedP;
        }
      }
    } catch (e) {
      console.warn('Error reading rsud_perusahaan_asuransi_2026:', e);
    }
  }

  const perusahaanData = rawPerusahaanData && rawPerusahaanData.length > 0
    ? rollForwardPerusahaanRows(rawPerusahaanData)
    : [];

  // Load Listrik Kantin data
  let listrikData: ListrikKantinStandGroup[] = overrideListrikData || [];
  if (!listrikData || listrikData.length === 0) {
    try {
      const savedL = localStorage.getItem('rsud_listrik_kantin_2026');
      if (savedL) {
        const parsedL = JSON.parse(savedL);
        if (Array.isArray(parsedL) && parsedL.length > 0) {
          listrikData = parsedL;
        }
      }
    } catch (e) {
      console.warn('Error reading rsud_listrik_kantin_2026:', e);
    }
  }

  const updatedGroups: Record<string, SemuaRekapanGroup> = { ...existingGroups };

  // Iterate over each month
  for (const month of MONTH_LIST) {
    const defaultGroup = SEMUA_REKAPAN_REAL_GROUPS[month] || SEMUA_REKAPAN_REAL_GROUPS['AGUSTUS'];
    const currentGroup = updatedGroups[month] || {
      bulan: month,
      totalPiutangSdBulanIni: defaultGroup.totalPiutangSdBulanIni,
      totalPembayaran: defaultGroup.totalPembayaran,
      totalSisaPiutang: defaultGroup.totalSisaPiutang,
      rows: JSON.parse(JSON.stringify(defaultGroup.rows))
    };

    const rows: SemuaRekapanRow[] = currentGroup.rows && currentGroup.rows.length > 0
      ? [...currentGroup.rows]
      : JSON.parse(JSON.stringify(defaultGroup.rows));

    // 1. UPDATE ROW 7: PERUSAHAAN DAN ASURANSI
    if (perusahaanData && perusahaanData.length > 0) {
      const monthPerusahaanRows = perusahaanData.filter(
        r => r.bulan && r.bulan.toUpperCase() === month
      );

      if (monthPerusahaanRows.length > 0) {
        const totalPiutangLalu = monthPerusahaanRows.reduce((sum, r) => sum + (r.piutangLalu || 0), 0);
        const totalPiutangBulanIni = monthPerusahaanRows.reduce((sum, r) => {
          if (r.invoices && r.invoices.length > 0) {
            const invoiceSum = r.invoices.reduce((s, inv) => s + (inv.nominalTagihan || 0), 0);
            return sum + (invoiceSum > 0 ? invoiceSum : (r.piutangBulanIni || 0));
          }
          return sum + (r.piutangBulanIni || 0);
        }, 0);
        const totalPembayaran = monthPerusahaanRows.reduce((sum, r) => sum + (r.pembayaran || 0), 0);

        // Find row index for Perusahaan dan Asuransi
        const pIndex = rows.findIndex(
          r => r.no === 7 || r.namaPenjamin.toUpperCase().includes('PERUSAHAAN')
        );

        if (pIndex !== -1) {
          const oldRow = rows[pIndex];
          const finalPiutangLalu = totalPiutangLalu;
          const finalPiutangBulanIni = totalPiutangBulanIni;
          const finalPiutangSdBulanIni = finalPiutangLalu + finalPiutangBulanIni;
          const finalPembayaran = totalPembayaran;
          const finalSisa = Math.max(0, finalPiutangSdBulanIni - finalPembayaran);
          const finalStatus: 'Lunas' | 'Belum Lunas' = finalSisa <= 0 ? 'Lunas' : 'Belum Lunas';

          rows[pIndex] = {
            ...oldRow,
            piutangBulanLalu: finalPiutangLalu,
            piutangBulanIni: finalPiutangBulanIni,
            piutangSdBulanIni: finalPiutangSdBulanIni,
            pembayaran: finalPembayaran,
            sisaPiutang: finalSisa,
            status: finalStatus
          };
        }
      }
    }

    // 2. UPDATE ROW 10: LISTRIK KANTIN JAWARA
    if (listrikData && listrikData.length > 0) {
      let totalListrikPiutang = 0;
      let totalListrikPembayaran = 0;

      listrikData.forEach(stand => {
        if (stand.rows) {
          const standMonthRow = stand.rows.find(
            r => r.bulan && r.bulan.toUpperCase() === month
          );
          if (standMonthRow) {
            totalListrikPiutang += standMonthRow.piutang || 0;
            totalListrikPembayaran += standMonthRow.pembayaran || 0;
          }
        }
      });

      const lIndex = rows.findIndex(
        r => r.no === 10 || r.namaPenjamin.toUpperCase().includes('KANTIN')
      );

      if (lIndex !== -1) {
        const oldRow = rows[lIndex];
        const finalPiutangLalu = oldRow.piutangBulanLalu || 0;
        const finalPiutangBulanIni = totalListrikPiutang > 0 ? totalListrikPiutang : (oldRow.piutangBulanIni || 0);
        const finalPiutangSdBulanIni = finalPiutangLalu + finalPiutangBulanIni;
        const finalPembayaran = totalListrikPembayaran > 0 ? totalListrikPembayaran : (oldRow.pembayaran || 0);
        const finalSisa = Math.max(0, finalPiutangSdBulanIni - finalPembayaran);
        const finalStatus: 'Lunas' | 'Belum Lunas' = finalSisa <= 0 ? 'Lunas' : 'Belum Lunas';

        rows[lIndex] = {
          ...oldRow,
          piutangBulanLalu: finalPiutangLalu,
          piutangBulanIni: finalPiutangBulanIni,
          piutangSdBulanIni: finalPiutangSdBulanIni,
          pembayaran: finalPembayaran,
          sisaPiutang: finalSisa,
          status: finalStatus
        };
      }
    }

    // Recalculate group totals
    const groupTotalPiutangSdBulanIni = rows.reduce((s, r) => s + (r.piutangSdBulanIni || 0), 0);
    const groupTotalPembayaran = rows.reduce((s, r) => s + (r.pembayaran || 0), 0);
    const groupTotalSisa = rows.reduce((s, r) => s + (r.sisaPiutang || 0), 0);

    updatedGroups[month] = {
      bulan: month,
      totalPiutangSdBulanIni: groupTotalPiutangSdBulanIni,
      totalPembayaran: groupTotalPembayaran,
      totalSisaPiutang: groupTotalSisa,
      rows
    };
  }

  try {
    localStorage.setItem('rsud_semua_rekapan_2026', JSON.stringify(updatedGroups));
    syncDocumentToFirestore('semua_rekapan_2026', updatedGroups);
  } catch (e) {
    console.error('Error saving synchronized rsud_semua_rekapan_2026:', e);
  }

  return updatedGroups;
}
