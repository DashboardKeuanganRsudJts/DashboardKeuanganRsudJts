/**
 * Universal deduplication and deterministic ID generation for Invoices (2025 & 2026).
 * Preserves 100% of distinct spreadsheet rows without merging valid purchases.
 */

// Helper to clean vendor names: remove special unicode whitespace, quotes, and collapse multiple spaces
export const normalizeVendorName = (name?: string): string => {
  if (!name) return '';
  return String(name)
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(/^['"]+|['"]+$/g, '')
    .trim()
    .replace(/\s+/g, ' ');
};

// Canonical key used to group and count vendors exactly like Excel (case-insensitive & whitespace-collapsed)
export const getCanonicalVendorKey = (name?: string): string => {
  const norm = normalizeVendorName(name);
  if (!norm || norm === '-' || norm === '0' || norm.toUpperCase() === 'N/A' || norm.toUpperCase() === 'TOTAL' || norm.toUpperCase().includes('REKAPITULASI') || norm.toLowerCase().startsWith('total ')) {
    return '';
  }
  return norm.toUpperCase();
};

// Clean invoice number to standard uppercase alphanumeric
export const normalizeInvoiceNumber = (inv?: string): string => {
  if (!inv) return '';
  let str = String(inv).trim().toUpperCase();
  if (str.startsWith('RP')) {
    str = str.replace(/^RP\.?\s*/i, '');
  }
  str = str.replace(/^['"]+|['"]+$/g, '').trim();
  return str.replace(/[^A-Z0-9]/g, '');
};

// Year-agnostic invoice number normalizer (e.g., RS2025070246 vs RS2026070246 -> RS_YEAR_070246)
export const normalizeInvoiceNumberYearAgnostic = (inv?: string): string => {
  const norm = normalizeInvoiceNumber(inv);
  if (!norm) return '';
  return norm.replace(/2025|2026/g, 'YEAR');
};

/**
 * Generates a deterministic document ID for Firestore and IndexedDB storage.
 * Maps 1-to-1 to each register row sequence to guarantee zero collisions between distinct rows.
 */
export const getDeterministicInvoiceId = (
  year: number,
  item: {
    no?: number;
    id?: string;
    [key: string]: any;
  },
  fallbackIndex?: number
): string => {
  const numNo = item.no || (fallbackIndex !== undefined ? fallbackIndex + 1 : 1);
  return `inv-${year}-${numNo}`;
};

export const getInvoiceDeduplicationKey = (
  item: {
    no?: number;
    id?: string;
    [key: string]: any;
  },
  year: number = 2026
): string => {
  const numNo = item.no || 1;
  return `ROW_${numNo}`;
};

/**
 * Deduplicates an array of invoices strictly by row number 'no' or 'id'.
 * NEVER collapses distinct rows with the same vendor or amount (e.g., multi-line invoices or same-value purchases).
 * Preserves 100% of transactions and vendor counts from the Excel sheet.
 */
export function deduplicateInvoiceRecords<T extends Record<string, any>>(
  records: T[],
  year: number = 2026
): T[] {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return [];
  }

  const map = new Map<string, T>();
  const order: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    if (!item) continue;

    // A record's true identity within a register dataset is its sequence number 'no' or specific row ID
    const rowNo = item.no && item.no > 0 ? item.no : i + 1;
    const key = `ROW_${rowNo}`;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...item, no: rowNo, id: item.id || `inv-${year}-${rowNo}` });
      order.push(key);
    } else {
      // If two documents exist in Firestore with the EXACT SAME row number (e.g. from an old orphaned sync echo):
      // Keep the one with non-zero payment or latest update, while preserving the single row
      const merged: any = { ...existing };

      const existingBayar = Number(existing.pembayaran) || 0;
      const incomingBayar = Number(item.pembayaran) || 0;

      if (incomingBayar > existingBayar) {
        merged.pembayaran = incomingBayar;
      }

      for (const [k, v] of Object.entries(item)) {
        if (v !== undefined && v !== null && v !== '' && v !== '-') {
          if (existing[k] === undefined || existing[k] === null || existing[k] === '' || existing[k] === '-') {
            merged[k] = v;
          }
        }
      }

      // Ensure standard ID format
      if (item.id && item.id.startsWith(`inv-${year}-`)) {
        merged.id = item.id;
      }

      map.set(key, merged as T);
    }
  }

  // Return all distinct rows in sequential order
  return order.map((key, idx) => {
    const record = map.get(key)!;
    const finalNo = record.no || (idx + 1);
    return {
      ...record,
      no: finalNo,
      id: record.id || `inv-${year}-${finalNo}`
    };
  });
}
