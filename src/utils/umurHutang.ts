// src/utils/umurHutang.ts
// Utility for calculating Umur Hutang (Debt Aging) and Effective Jatuh Tempo (Due Date)

const MONTH_WORDS: Record<string, string> = {
  JANUARI: '01', JAN: '01',
  FEBRUARI: '02', FEB: '02',
  MARET: '03', MAR: '03',
  APRIL: '04', APR: '04',
  MEI: '05', MAY: '05',
  JUNI: '06', JUN: '06',
  JULI: '07', JUL: '07',
  AGUSTUS: '08', AGU: '08', AGT: '08',
  SEPTEMBER: '09', SEP: '09',
  OKTOBER: '10', OKT: '10', OCT: '10',
  NOVEMBER: '11', NOV: '11',
  DESEMBER: '12', DES: '12', DEC: '12'
};

/**
 * Normalizes any date string (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, ISO, or DD Month YYYY)
 * into ISO format 'YYYY-MM-DD' for date calculation.
 */
export const parseDateToISO = (dateStr?: string | number | null): string => {
  if (!dateStr) return '';
  if (typeof dateStr === 'number') {
    // Excel serial number
    try {
      const parsed = new Date((dateStr - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    } catch {
      return '';
    }
  }

  const trimmed = String(dateStr).trim();
  if (!trimmed || trimmed === '-' || trimmed === '0') return '';

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  // Check for words like "15 Januari 2026" or "15-Jan-2026"
  const wordMatch = trimmed.match(/^(\d{1,2})[\s\-/.]([a-zA-Z]+)[\s\-/.](20\d{2}|\d{2})$/);
  if (wordMatch) {
    const day = wordMatch[1].padStart(2, '0');
    const monthKey = wordMatch[2].toUpperCase();
    const month = MONTH_WORDS[monthKey] || '01';
    let year = wordMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Splitted by slash, dot, or dash (e.g. 15/01/2026 or 15-01-2026 or 30/8/25)
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    // DD/MM/YYYY
    if (parts[2].length === 4) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    // DD/MM/YY
    if (parts[2].length === 2) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = `20${parts[2]}`;
      return `${year}-${month}-${day}`;
    }
    // YYYY/MM/DD
    if (parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return '';
};

/**
 * Format 'YYYY-MM-DD' back to standard display 'DD/MM/YYYY'
 */
export const formatISOToDDMMYYYY = (isoStr: string): string => {
  if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return isoStr || '';
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Adds 1 month to a given date string.
 * Example:
 *  - "15/01/2026" -> "15/02/2026"
 *  - "31/01/2026" -> "28/02/2026" (or 29 on leap year)
 *  - "31/03/2026" -> "30/04/2026"
 */
export const addOneMonthToDateStr = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const iso = parseDateToISO(dateStr);
  if (!iso) return '';

  const [yStr, mStr, dStr] = iso.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10); // 1 - 12
  const d = parseInt(dStr, 10); // 1 - 31
  if (isNaN(y) || isNaN(m) || isNaN(d)) return '';

  let nextMonth = m + 1;
  let nextYear = y;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  // Days in nextMonth of nextYear
  const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
  const targetDay = Math.min(d, daysInNextMonth);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(targetDay)}/${pad(nextMonth)}/${nextYear}`;
};

/**
 * Returns effective Jatuh Tempo:
 * 1. Checks item.jatuhTempo if valid and not empty / '-' / '0'
 * 2. If empty or '-', calculates from tanggal invoice + 1 month
 * 3. If tglInvoice is also empty, falls back to tglRekap / tglTandaTerima + 1 month
 */
export const getEffectiveJatuhTempo = (item: {
  jatuhTempo?: string | null;
  tglInvoice?: string | null;
  tglRekap?: string | null;
  tglTandaTerima?: string | null;
  [key: string]: any;
}): string => {
  const jt = (item.jatuhTempo || '').trim();
  if (jt && jt !== '-' && jt !== '0') {
    const iso = parseDateToISO(jt);
    if (iso) return formatISOToDDMMYYYY(iso);
  }

  // Apabila tanggal jatuh tempo nya kosong, hitung dari tanggal invoice ditambah 1 bulan
  const baseDate = (item.tglInvoice && item.tglInvoice.trim() !== '-')
    ? item.tglInvoice
    : ((item.tglRekap && item.tglRekap.trim() !== '-') ? item.tglRekap : item.tglTandaTerima);

  if (baseDate && baseDate.trim() !== '-') {
    const derived = addOneMonthToDateStr(baseDate);
    if (derived) return derived;
  }

  return '';
};

/**
 * Calculates Umur Hutang (Debt Age in days) based on effective Jatuh Tempo:
 * - Difference in days from Jatuh Tempo to Today.
 * - If Jatuh tempo is empty, calculated from Tanggal Invoice + 1 month.
 * - If due date has passed, returns difference in days (>= 0).
 * - If not yet due, returns 0.
 */
export const calculateUmurHutang = (item: {
  jatuhTempo?: string | null;
  tglInvoice?: string | null;
  tglRekap?: string | null;
  tglTandaTerima?: string | null;
  lamaHariHutang?: number;
  sisaHutang?: number;
  [key: string]: any;
}): number => {
  const effectiveJt = getEffectiveJatuhTempo(item);
  if (!effectiveJt) {
    return Number(item.lamaHariHutang) || 0;
  }

  const iso = parseDateToISO(effectiveJt);
  if (!iso) {
    return Number(item.lamaHariHutang) || 0;
  }

  const jtDate = new Date(`${iso}T00:00:00`);
  if (isNaN(jtDate.getTime())) {
    return Number(item.lamaHariHutang) || 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - jtDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
};
