import { PiutangRecord, SyncStatusInfo, KategoriPenjamin, JenisLayanan, StatusKlaim } from '../types/piutang';
import { calculateUmurHari, INITIAL_RSUD_PIUTANG_DATA, SPREADSHEET_TEMPLATE_HEADERS } from '../data/sampleRsudData';
import firebaseConfigData from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'rsud_gdrive_access_token',
  TOKEN_EXPIRES_AT: 'rsud_gdrive_token_expires',
  CONFIG: 'rsud_sheets_config',
  DATA_CACHE: 'rsud_piutang_data_cache',
  LAST_DAILY_SYNC: 'rsud_last_daily_sync_date'
};

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly'
].join(' ');

// RSUD Jatisari Default Configuration
export const DEFAULT_SYNC_CONFIG: SyncStatusInfo = {
  isConfigured: false,
  isConnected: false,
  spreadsheetId: '',
  spreadsheetName: '',
  sheetName: 'Sheet1',
  lastSyncedAt: null,
  autoSyncDaily: true,
  syncIntervalMinutes: 60, // check hourly or daily
  isSyncing: false,
  error: null,
  totalRowsSynced: 0
};

export class GoogleSheetsService {
  private static tokenClient: any = null;
  private static cachedToken: string | null = null;

  public static getStoredToken(): string | null {
    if (this.cachedToken) return this.cachedToken;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (token && expiresAt && Number(expiresAt) > Date.now()) {
      this.cachedToken = token;
      return token;
    }
    return null;
  }

  public static setStoredToken(token: string, expiresInSeconds: number = 3600): void {
    this.cachedToken = token;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, (Date.now() + expiresInSeconds * 1000).toString());
  }

  public static clearStoredToken(): void {
    this.cachedToken = null;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  }

  public static loadConfig(): SyncStatusInfo {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        return { ...DEFAULT_SYNC_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse saved sheets config:', e);
    }
    return DEFAULT_SYNC_CONFIG;
  }

  public static saveConfig(config: Partial<SyncStatusInfo>): void {
    const current = this.loadConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
  }

  public static loadCachedData(): PiutangRecord[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DATA_CACHE);
      if (saved) {
        const parsed: PiutangRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Recalculate aging on load
          return parsed.map(record => {
            const { hari, kategori } = calculateUmurHari(record.tanggalPelayanan);
            return {
              ...record,
              hariUmur: hari,
              kategoriUmur: kategori
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse cached data:', e);
    }
    return INITIAL_RSUD_PIUTANG_DATA;
  }

  public static saveCachedData(data: PiutangRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.DATA_CACHE, JSON.stringify(data));
  }

  public static async requestGoogleAuth(clientId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services SDK belum siap. Silakan coba lagi beberapa saat.'));
        return;
      }

      // If client ID is not provided, we look for standard OAuth configuration
      const finalClientId = clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || firebaseConfigData.oAuthClientId;

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: finalClientId,
          scope: DEFAULT_SCOPES,
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (response.access_token) {
              GoogleSheetsService.setStoredToken(response.access_token, response.expires_in || 3600);
              resolve(response.access_token);
            } else {
              reject(new Error('Gagal mendapatkan token akses Google.'));
            }
          },
        });

        this.tokenClient = client;
        client.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * List spreadsheets from User's Google Drive
   */
  public static async listSpreadsheetsFromDrive(accessToken: string): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
    const url = "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=20";
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearStoredToken();
        throw new Error('Sesi Google OAuth telah kedaluwarsa. Silakan hubungkan ulang akun Google Anda.');
      }
      throw new Error(`Gagal memuat daftar Spreadsheet: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Fetch spreadsheet metadata (Sheets tabs list)
   */
  public static async getSpreadsheetInfo(accessToken: string, spreadsheetId: string): Promise<{ title: string; sheets: string[] }> {
    const cleanId = this.extractSpreadsheetId(spreadsheetId);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,sheets.properties.title`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearStoredToken();
        throw new Error('Sesi login Google telah kedaluwarsa. Harap login kembali.');
      }
      if (response.status === 404) {
        throw new Error('Spreadsheet tidak ditemukan. Pastikan ID atau URL spreadsheet valid dan dapat diakses.');
      }
      throw new Error(`Gagal mengakses Spreadsheet (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const title = data.properties?.title || 'RSUD Jatisari Piutang Sheet';
    const sheets = (data.sheets || []).map((s: any) => s.properties?.title as string);
    return { title, sheets };
  }

  /**
   * Read rows from Google Sheet
   */
  public static async fetchSheetRows(accessToken: string, spreadsheetId: string, sheetName: string = 'Sheet1'): Promise<any[][]> {
    const cleanId = this.extractSpreadsheetId(spreadsheetId);
    const encodedSheet = encodeURIComponent(sheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedSheet}!A1:Z5000`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearStoredToken();
        throw new Error('Sesi Google OAuth telah berakhir. Harap login kembali.');
      }
      throw new Error(`Gagal membaca data baris Google Sheet: ${response.statusText}`);
    }

    const data = await response.json();
    return data.values || [];
  }

  /**
   * Parse rows from Google Sheet into PiutangRecord array with flexible header detection
   */
  public static parseSheetRowsToPiutang(rows: any[][]): PiutangRecord[] {
    if (!rows || rows.length < 2) return [];

    const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
    
    // Find column index helper with multiple aliases
    const findIdx = (aliases: string[]): number => {
      return headers.findIndex(h => aliases.some(alias => h.includes(alias)));
    };

    const idxInvoice = findIdx(['no invoice', 'nomor invoice', 'no. invoice', 'invoice']);
    const idxNoBukti = findIdx(['bukti', 'billing', 'no tagihan', 'faktur']);
    const idxSep = findIdx(['sep', 'klaim', 'no klaim', 'no claim']);
    const idxRm = findIdx(['rm', 'rekam medis', 'no rm', 'norm']);
    const idxNama = findIdx(['nama', 'pasien', 'nama pasien']);
    const idxPenjamin = findIdx(['penjamin', 'debitur', 'kategori penjamin', 'asuransi', 'bpjs']);
    const idxDetailPenjamin = findIdx(['detail penjamin', 'nama penjamin', 'instansi', 'perusahaan']);
    const idxLayanan = findIdx(['layanan', 'jenis layanan', 'instalasi', 'pelayanan', 'unit']);
    const idxTglPelayanan = findIdx(['tgl pelayanan', 'tanggal pelayanan', 'tgl masuk', 'tgl periksa', 'tanggal']);
    const idxTglJatuhTempo = findIdx(['jatuh tempo', 'tgl jatuh tempo', 'due date']);
    const idxNominalTagihan = findIdx(['tagihan', 'nominal tagihan', 'tarif', 'biaya', 'total tarif', 'klaim diajukan']);
    const idxNominalDibayar = findIdx(['dibayar', 'sudah dibayar', 'nominal cair', 'cair', 'lunas']);
    const idxSisaPiutang = findIdx(['sisa', 'sisa piutang', 'saldo', 'sisa tagihan', 'selisih']);
    const idxStatus = findIdx(['status', 'status klaim', 'status pelunasan', 'keterangan status']);
    const idxDpjp = findIdx(['dpjp', 'dokter', 'nama dokter']);
    const idxRuangan = findIdx(['ruang', 'ruangan', 'bangsal', 'poli', 'poliklinik']);
    const idxDispute = findIdx(['dispute', 'keterangan', 'catatan', 'alasan']);
    const idxTglUpdate = findIdx(['update', 'tgl update', 'terakhir diubah']);

    const records: PiutangRecord[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(cell => String(cell || '').trim() !== '')) {
        continue; // skip empty rows
      }

      const getVal = (idx: number, def: string = ''): string => {
        return idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : def;
      };

      const parseMoney = (valStr: string): number => {
        if (!valStr) return 0;
        const cleaned = valStr.replace(/[^0-9.-]+/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const namaPasien = getVal(idxNama, `Pasien #${i}`);
      const rawPenjamin = getVal(idxPenjamin, 'BPJS Kesehatan - Non PBI');
      const penjamin = this.normalizePenjamin(rawPenjamin);
      
      const rawLayanan = getVal(idxLayanan, 'Rawat Inap');
      const jenisLayanan = this.normalizeLayanan(rawLayanan);

      const rawStatus = getVal(idxStatus, 'Pengajuan Berkas');
      const statusKlaim = this.normalizeStatus(rawStatus);

      const tglPelayanan = this.normalizeDate(getVal(idxTglPelayanan, new Date().toISOString().split('T')[0]));
      const tglJatuhTempo = this.normalizeDate(getVal(idxTglJatuhTempo, this.addDays(tglPelayanan, 30)));

      const nominalTagihan = parseMoney(getVal(idxNominalTagihan, '0'));
      let nominalDibayar = parseMoney(getVal(idxNominalDibayar, '0'));
      let sisaPiutang = parseMoney(getVal(idxSisaPiutang, '0'));

      if (sisaPiutang === 0 && nominalTagihan > 0 && statusKlaim !== 'Lunas / Cair') {
        sisaPiutang = Math.max(0, nominalTagihan - nominalDibayar);
      } else if (statusKlaim === 'Lunas / Cair' && nominalDibayar === 0) {
        nominalDibayar = nominalTagihan;
        sisaPiutang = 0;
      }

      const { hari, kategori } = calculateUmurHari(tglPelayanan);

      const parsedNoInvoice = getVal(idxInvoice, '');
      const parsedNoBukti = getVal(idxNoBukti, `BILL-JTS-${String(i).padStart(4, '0')}`);

      records.push({
        id: `ROW-${i}-${Date.now()}`,
        noInvoice: parsedNoInvoice || `INV-JTS-${String(i).padStart(4, '0')}`,
        noBukti: parsedNoBukti,
        noSepKlaim: getVal(idxSep, `SEP-JTS-${String(i).padStart(5, '0')}`),
        noRm: getVal(idxRm, `RM-${String(i * 37).padStart(6, '0')}`),
        namaPasien,
        penjamin,
        namaDetailPenjamin: getVal(idxDetailPenjamin, rawPenjamin),
        jenisLayanan,
        tanggalPelayanan: tglPelayanan,
        tanggalJatuhTempo: tglJatuhTempo,
        nominalTagihan,
        nominalDibayar,
        sisaPiutang,
        statusKlaim,
        dpjp: getVal(idxDpjp, 'dr. RSUD Jatisari'),
        ruangan: getVal(idxRuangan, 'Ruang Rawat'),
        keteranganDispute: getVal(idxDispute, ''),
        tanggalUpdateTerakhir: getVal(idxTglUpdate, new Date().toISOString().split('T')[0]),
        hariUmur: hari,
        kategoriUmur: kategori
      });
    }

    return records;
  }

  /**
   * Create a new RSUD Jatisari Spreadsheet directly on User's Drive
   */
  public static async createRsudTemplateSpreadsheet(
    accessToken: string,
    sheetTitle: string = 'Data Piutang RSUD Jatisari 2026'
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const payload = {
      properties: {
        title: sheetTitle,
      },
      sheets: [
        {
          properties: {
            title: 'Data Piutang',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: SPREADSHEET_TEMPLATE_HEADERS.map(h => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                      backgroundColor: { red: 0.05, green: 0.45, blue: 0.35 }, // Hospital Emerald Green
                    },
                  })),
                },
                ...INITIAL_RSUD_PIUTANG_DATA.map(item => ({
                  values: [
                    { userEnteredValue: { stringValue: item.noInvoice || item.noBukti } },
                    { userEnteredValue: { stringValue: item.noBukti } },
                    { userEnteredValue: { stringValue: item.noSepKlaim } },
                    { userEnteredValue: { stringValue: item.noRm } },
                    { userEnteredValue: { stringValue: item.namaPasien } },
                    { userEnteredValue: { stringValue: item.penjamin } },
                    { userEnteredValue: { stringValue: item.namaDetailPenjamin || item.penjamin } },
                    { userEnteredValue: { stringValue: item.jenisLayanan } },
                    { userEnteredValue: { stringValue: item.tanggalPelayanan } },
                    { userEnteredValue: { stringValue: item.tanggalJatuhTempo } },
                    { userEnteredValue: { numberValue: item.nominalTagihan } },
                    { userEnteredValue: { numberValue: item.nominalDibayar } },
                    { userEnteredValue: { numberValue: item.sisaPiutang } },
                    { userEnteredValue: { stringValue: item.statusKlaim } },
                    { userEnteredValue: { stringValue: item.dpjp } },
                    { userEnteredValue: { stringValue: item.ruangan || '-' } },
                    { userEnteredValue: { stringValue: item.keteranganDispute || '-' } },
                    { userEnteredValue: { stringValue: item.tanggalUpdateTerakhir } },
                  ],
                })),
              ],
            },
          ],
        },
      ],
    };

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Gagal membuat Google Spreadsheet baru: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      spreadsheetId: data.spreadsheetId,
      spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    };
  }

  /**
   * Helper to append a new Piutang record to connected Google Sheet
   */
  public static async appendRecordToSheet(
    accessToken: string,
    spreadsheetId: string,
    sheetName: string,
    record: PiutangRecord
  ): Promise<boolean> {
    const cleanId = this.extractSpreadsheetId(spreadsheetId);
    const rowValues = [
      record.noInvoice || record.noBukti,
      record.noBukti,
      record.noSepKlaim,
      record.noRm,
      record.namaPasien,
      record.penjamin,
      record.namaDetailPenjamin || record.penjamin,
      record.jenisLayanan,
      record.tanggalPelayanan,
      record.tanggalJatuhTempo,
      record.nominalTagihan,
      record.nominalDibayar,
      record.sisaPiutang,
      record.statusKlaim,
      record.dpjp,
      record.ruangan || '-',
      record.keteranganDispute || '-',
      record.tanggalUpdateTerakhir,
    ];

    const encodedSheet = encodeURIComponent(sheetName || 'Sheet1');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedSheet}!A:R:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    });

    return response.ok;
  }

  /**
   * Check if daily automatic sync is due
   */
  public static shouldRunDailyAutoSync(): boolean {
    const config = this.loadConfig();
    if (!config.autoSyncDaily || !config.spreadsheetId) return false;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastDaily = localStorage.getItem(STORAGE_KEYS.LAST_DAILY_SYNC);

    return lastDaily !== todayStr;
  }

  public static markDailySyncCompleted(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEYS.LAST_DAILY_SYNC, todayStr);
  }

  // --- Normalization Helpers ---
  public static extractSpreadsheetId(urlOrId: string): string {
    if (!urlOrId) return '';
    const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return urlOrId.trim();
  }

  private static normalizePenjamin(val: string): KategoriPenjamin {
    const v = val.toLowerCase();
    if (v.includes('pbi') && !v.includes('non')) return 'BPJS Kesehatan - PBI';
    if (v.includes('bpjs')) return 'BPJS Kesehatan - Non PBI';
    if (v.includes('jamkesda') || v.includes('karawang sehat')) return 'Jamkesda / Karawang Sehat';
    if (v.includes('raharja') || v.includes('laka')) return 'Jasa Raharja (Laka Lantas)';
    if (v.includes('inhealth') || v.includes('asuransi') || v.includes('prudential') || v.includes('admedika') || v.includes('allianz')) return 'Asuransi Swasta';
    if (v.includes('pt') || v.includes('perusahaan') || v.includes('kemitraan') || v.includes('pupuk kujang')) return 'Kemitraan Perusahaan';
    return 'Pasien Umum / Jaminan';
  }

  private static normalizeLayanan(val: string): JenisLayanan {
    const v = val.toLowerCase();
    if (v.includes('inap') || v.includes('ranap')) return 'Rawat Inap';
    if (v.includes('jalan') || v.includes('ralan') || v.includes('poli')) return 'Rawat Jalan';
    if (v.includes('igd') || v.includes('darurat') || v.includes('ugd')) return 'IGD';
    if (v.includes('hemodialisa') || v.includes('hd') || v.includes('cuci darah')) return 'Hemodialisa';
    if (v.includes('operasi') || v.includes('ok') || v.includes('bedah')) return 'Kamar Operasi';
    if (v.includes('mcu') || v.includes('check up')) return 'MCU';
    return 'Rawat Inap';
  }

  private static normalizeStatus(val: string): StatusKlaim {
    const v = val.toLowerCase();
    if (v.includes('lunas') || v.includes('cair') || v.includes('selesai')) return 'Lunas / Cair';
    if (v.includes('dispute') || v.includes('pending') || v.includes('tunda')) return 'Dispute / Pending';
    if (v.includes('tolak') || v.includes('batal')) return 'Klaim Ditolak';
    if (v.includes('cicil') || v.includes('angsur')) return 'Cicilan';
    if (v.includes('internal') || v.includes('koding') || v.includes('verif')) return 'Verifikasi Internal';
    return 'Pengajuan Berkas';
  }

  private static normalizeDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    // Check if format is DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }
    // Check standard YYYY-MM-DD
    const yyyymmdd = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (yyyymmdd) {
      const year = yyyymmdd[1];
      const month = yyyymmdd[2].padStart(2, '0');
      const day = yyyymmdd[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateStr.substring(0, 10);
  }

  private static addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
