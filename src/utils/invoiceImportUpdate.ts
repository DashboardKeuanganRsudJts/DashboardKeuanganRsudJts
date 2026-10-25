import { InvoiceHutang2025Record } from '../types/invoiceHutang';
import { getEffectiveJatuhTempo, calculateUmurHutang } from './umurHutang';
import { getMonthNameIndo } from './formatters';
import { getDeterministicInvoiceId, deduplicateInvoiceRecords } from './invoiceDeduplicator';

export type InvoiceImportMode = 'update' | 'replace' | 'append';

export interface ParsedInvoiceImportRecord extends InvoiceHutang2025Record {
  _presentFields?: Record<string, boolean>;
  _hasExplicitNoInvoice?: boolean;
  _isImported?: boolean;
}

export const normalizeStr = (s?: string): string => {
  if (!s) return '';
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const normalizeInvoice = (s?: string): string => {
  if (!s) return '';
  let str = s.trim().toUpperCase();
  if (str.startsWith('RP')) {
    str = str.replace(/^RP\.?\s*/i, '');
  }
  return str.replace(/[^A-Z0-9]/g, '');
};

/**
 * Selective update logic for Excel spreadsheet import.
 * When a cell/column in the uploaded Excel file is empty, the existing dashboard record's
 * data for that field is strictly PRESERVED (not overwritten or erased).
 * Only non-empty columns from Excel are updated on matched records.
 */
export const applySelectiveImportUpdate = (
  existingData: InvoiceHutang2025Record[],
  importedRecords: ParsedInvoiceImportRecord[],
  year: number
): {
  finalData: InvoiceHutang2025Record[];
  updatedCount: number;
  appendedCount: number;
  preservedCount: number;
} => {
  const result: InvoiceHutang2025Record[] = existingData.map(item => ({ ...item }));
  const matchedExistingIndices = new Set<number>();
  let updatedCount = 0;
  let appendedCount = 0;

  for (const importedRow of importedRecords) {
    const pf = importedRow._presentFields || {};
    let targetIdx = -1;

    // Strategy 1: Match by explicit No Invoice (if non-empty and explicit from Excel)
    if (importedRow._hasExplicitNoInvoice && importedRow.noInvoice && importedRow.noInvoice.trim() !== '-') {
      const normImpInv = normalizeInvoice(importedRow.noInvoice);
      const yearAgnosticImpInv = normImpInv.replace(/2025|2026/g, 'YEAR');
      if (normImpInv.length >= 2) {
        targetIdx = result.findIndex((item, idx) => {
          if (matchedExistingIndices.has(idx)) return false;
          const exNorm = normalizeInvoice(item.noInvoice);
          if (exNorm === normImpInv) return true;
          if (yearAgnosticImpInv.length >= 4 && exNorm.replace(/2025|2026/g, 'YEAR') === yearAgnosticImpInv) {
            return true;
          }
          return false;
        });
      }
    }

    // Strategy 2: Match by Row Number (no) in register
    if (targetIdx === -1 && importedRow.no && importedRow.no > 0) {
      const matchByNoIdx = result.findIndex((item, idx) => {
        if (matchedExistingIndices.has(idx)) return false;
        return item.no === importedRow.no;
      });

      if (matchByNoIdx !== -1) {
        // If vendor is also in Excel, check if compatible or matches
        if (pf.rekanan && importedRow.rekanan && importedRow.rekanan.trim() !== '') {
          const normExRec = normalizeStr(result[matchByNoIdx].rekanan);
          const normImpRec = normalizeStr(importedRow.rekanan);
          // If vendors match or one contains the other, high-confidence match!
          if (normExRec === normImpRec || normExRec.includes(normImpRec) || normImpRec.includes(normExRec)) {
            targetIdx = matchByNoIdx;
          } else {
            // Even if spelling differs slightly, row index 'no' matches
            targetIdx = matchByNoIdx;
          }
        } else {
          // Vendor wasn't in Excel, matched solely by row 'no'
          targetIdx = matchByNoIdx;
        }
      }
    }

    // Strategy 3: Match by Rekanan/Vendor if unique or earliest unmatched
    if (targetIdx === -1 && pf.rekanan && importedRow.rekanan && importedRow.rekanan.trim() !== '') {
      const normImpRec = normalizeStr(importedRow.rekanan);
      if (normImpRec.length >= 3) {
        targetIdx = result.findIndex((item, idx) => {
          if (matchedExistingIndices.has(idx)) return false;
          const normExRec = normalizeStr(item.rekanan);
          return normExRec === normImpRec || normExRec.includes(normImpRec) || normImpRec.includes(normExRec);
        });
      }
    }

    if (targetIdx !== -1) {
      // MATCH FOUND: Selective patch update (only non-empty columns from Excel)
      matchedExistingIndices.add(targetIdx);
      updatedCount++;

      const existing = result[targetIdx];
      const patched: InvoiceHutang2025Record = { ...existing };

      // 1. Rekanan
      if (pf.rekanan && importedRow.rekanan && importedRow.rekanan.trim() !== '') {
        patched.rekanan = importedRow.rekanan;
      }

      // 2. Bidang & Bagian
      if (pf.bidang && importedRow.bidang && importedRow.bidang.trim() !== '') {
        patched.bidang = importedRow.bidang;
        patched.bagian = importedRow.bidang;
      }

      // 3. Pos Belanja / Uraian & Sub Belanja
      if (pf.uraian && importedRow.uraian && importedRow.uraian.trim() !== '') {
        patched.uraian = importedRow.uraian;
        if (pf.subBelanja && importedRow.subBelanja) {
          patched.subBelanja = importedRow.subBelanja;
        }
      } else if (pf.subBelanja && importedRow.subBelanja && importedRow.subBelanja.trim() !== '') {
        patched.subBelanja = importedRow.subBelanja;
      }

      // 4. Tanggal Rekap / Tanda Terima
      if (pf.tglRekap && importedRow.tglRekap && importedRow.tglRekap !== '-') {
        patched.tglRekap = importedRow.tglRekap;
        patched.tglTandaTerima = importedRow.tglRekap;
      }
      if (pf.bulanRekap && importedRow.bulanRekap && importedRow.bulanRekap !== '-') {
        patched.bulanRekap = importedRow.bulanRekap;
      } else if (pf.tglRekap && patched.tglRekap && patched.tglRekap !== '-') {
        const derivedBln = getMonthNameIndo(patched.tglRekap);
        if (derivedBln) patched.bulanRekap = derivedBln;
      }

      // 5. Tanggal Masuk SPJ / SPB / SPK
      if (pf.tglMasukSpj && importedRow.tglMasukSpj && importedRow.tglMasukSpj !== '-') {
        patched.tglMasukSpj = importedRow.tglMasukSpj;
        patched.tglSpbSpk = importedRow.tglMasukSpj;
      }

      // 6. Tanggal Invoice
      if (pf.tglInvoice && importedRow.tglInvoice && importedRow.tglInvoice !== '-') {
        patched.tglInvoice = importedRow.tglInvoice;
      }
      if (pf.bulanInvoice && importedRow.bulanInvoice && importedRow.bulanInvoice !== '-') {
        patched.bulanInvoice = importedRow.bulanInvoice;
      } else if (pf.tglInvoice && patched.tglInvoice && patched.tglInvoice !== '-') {
        const derivedBln = getMonthNameIndo(patched.tglInvoice);
        if (derivedBln) patched.bulanInvoice = derivedBln;
      }

      // 7. Nomor Invoice
      if (pf.noInvoice && importedRow._hasExplicitNoInvoice && importedRow.noInvoice.trim() !== '') {
        patched.noInvoice = importedRow.noInvoice;
      }

      // 8. Tanggal Jatuh Tempo
      if (pf.jatuhTempo && importedRow.jatuhTempo && importedRow.jatuhTempo !== '-') {
        patched.jatuhTempo = importedRow.jatuhTempo;
      }

      // 9. Jumlah Invoice
      if (pf.jumlahInvoice) {
        patched.jumlahInvoice = importedRow.jumlahInvoice;
      }

      // 10. Koreksi
      if (year === 2026) {
        patched.koreksi = 0;
      } else if (pf.koreksi) {
        patched.koreksi = importedRow.koreksi;
      }

      // 11. Total Invoice Fix (Nilai SPJ)
      if (year === 2026) {
        patched.totalInvoiceFix = Number(patched.jumlahInvoice || 0);
      } else if (pf.totalInvoiceFix) {
        patched.totalInvoiceFix = importedRow.totalInvoiceFix;
      } else if (pf.jumlahInvoice || pf.koreksi) {
        patched.totalInvoiceFix = Number(patched.jumlahInvoice || 0) + Number(patched.koreksi || 0);
      }

      // 12. Pembayaran (Dibayar)
      if (pf.pembayaran) {
        patched.pembayaran = Number(importedRow.pembayaran) || 0;
      }

      // 13. Sumber Anggaran
      if (pf.sumberAnggaran && importedRow.sumberAnggaran && importedRow.sumberAnggaran.trim() !== '') {
        patched.sumberAnggaran = importedRow.sumberAnggaran;
      }

      // 14. Sisa Hutang
      if (year === 2026) {
        patched.sisaHutang = Math.max(0, Number(patched.jumlahInvoice || 0) - Number(patched.pembayaran || 0));
        patched.sisaHutangRiil = patched.sisaHutang;
      } else if (pf.sisaHutang) {
        patched.sisaHutang = importedRow.sisaHutang;
      } else if (pf.pembayaran || pf.jumlahInvoice || pf.koreksi || pf.totalInvoiceFix) {
        patched.sisaHutang = Math.max(0, Number(patched.totalInvoiceFix || 0) - Number(patched.pembayaran || 0));
      }

      // 15. Sudah Masuk Buku Kas (A)
      if (pf.sudahMasukBukuKas) {
        patched.sudahMasukBukuKas = importedRow.sudahMasukBukuKas;
      } else if (patched.sisaHutang <= 0 || Number(patched.pembayaran) > 0) {
        patched.sudahMasukBukuKas = true;
      }

      // 16. Tanggal Bayar / SPD
      if (pf.tglBayar && importedRow.tglBayar && importedRow.tglBayar !== '-') {
        patched.tglBayar = importedRow.tglBayar;
        patched.tglSpdBukuKas = importedRow.tglBayar;
      }
      if (pf.bulanSpd && importedRow.bulanSpd && importedRow.bulanSpd !== '-') {
        patched.bulanSpd = importedRow.bulanSpd;
      } else if (pf.tglBayar && patched.tglBayar && patched.tglBayar !== '-') {
        const derivedBln = getMonthNameIndo(patched.tglBayar);
        if (derivedBln) patched.bulanSpd = derivedBln;
      }

      // 17. Nomor SP2D / SPD Kas
      if (pf.noSpdBukuKas && importedRow.noSpdBukuKas && importedRow.noSpdBukuKas !== '-') {
        patched.noSpdBukuKas = importedRow.noSpdBukuKas;
      }

      // 18. Keterangan
      if (pf.keterangan && importedRow.keterangan && importedRow.keterangan.trim() !== '') {
        patched.keterangan = importedRow.keterangan;
      } else {
        patched.keterangan = patched.sisaHutang <= 0 ? 'Lunas' : 'Belum Lunas';
      }

      // 19. Additional corrections & sisa riil
      if (pf.koreksiPlusMinus) patched.koreksiPlusMinus = importedRow.koreksiPlusMinus;
      if (pf.koreksiMinusBlud) patched.koreksiMinusBlud = importedRow.koreksiMinusBlud;
      if (pf.koreksiMinusApbd) patched.koreksiMinusApbd = importedRow.koreksiMinusApbd;
      if (pf.sisaHutangRiil) {
        patched.sisaHutangRiil = importedRow.sisaHutangRiil;
      } else {
        patched.sisaHutangRiil = patched.sisaHutang;
      }

      // 20. Umur Hutang
      if (pf.lamaHariHutang) {
        patched.lamaHariHutang = importedRow.lamaHariHutang;
      } else {
        const effJt = (patched.jatuhTempo && patched.jatuhTempo !== '-' && patched.jatuhTempo !== '0')
          ? patched.jatuhTempo
          : getEffectiveJatuhTempo(patched);
        patched.lamaHariHutang = calculateUmurHutang({
          ...patched,
          jatuhTempo: effJt
        });
      }

      result[targetIdx] = patched;
    } else {
      // NO MATCH FOUND: Append as new record
      const newNo = result.length > 0 ? Math.max(...result.map(d => d.no)) + 1 : 1;
      const newRecord: InvoiceHutang2025Record = {
        ...importedRow,
        id: getDeterministicInvoiceId(year, importedRow, result.length),
        no: importedRow.no || newNo
      };
      result.push(newRecord);
      appendedCount++;
    }
  }

  const cleanFinalData = deduplicateInvoiceRecords(result, year);

  return {
    finalData: cleanFinalData,
    updatedCount,
    appendedCount,
    preservedCount: existingData.length - updatedCount
  };
};
