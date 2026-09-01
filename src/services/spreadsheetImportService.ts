import * as XLSX from 'xlsx';
import { PiutangRecord, UmurPiutangCategory, StatusKlaim, KategoriPenjamin, JenisLayanan, HutangItem } from '../types/piutang';
import { calculateUmurHari, INITIAL_RSUD_PIUTANG_DATA } from '../data/sampleRsudData';
import { 
  PerusahaanAsuransiRow, 
  InvoicePerusahaan, 
  generateDefaultInvoices, 
  generateAllMonthsPerusahaanData,
  PERUSAHAAN_ASURANSI_REAL_DATA,
  MASTER_PARTNER_COMPANIES,
  MasterPartnerInfo,
  ListrikKantinStandGroup,
  LISTRIK_KANTIN_REAL_DATA,
  SemuaRekapanGroup,
  SEMUA_REKAPAN_REAL_GROUPS,
  REKAP_BULANAN_2026_DATA,
  RekapBulanan2026Row,
  LIST_BULAN_2026
} from '../data/spreadsheetData2026';

export type TargetImportModule = 
  | 'auto_detect'
  | 'piutang_pasien'
  | 'perusahaan_asuransi'
  | 'listrik_kantin'
  | 'semua_rekapan'
  | 'rekap_bulanan_2026'
  | 'hutang';

export interface ParsedSheetInfo {
  sheetName: string;
  detectedType: TargetImportModule;
  rowCount: number;
  headers: string[];
  sampleRows: any[][];
  rawJson: any[];
}

export interface ImportResultSummary {
  piutangPasienCount?: number;
  perusahaanCount?: number;
  listrikCount?: number;
  semuaRekapanCount?: number;
  rekapBulananCount?: number;
  message: string;
}

export class SpreadsheetImportService {

  /**
   * Helper to parse money strings or numbers
   */
  public static parseNumber(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const str = String(val).trim();
    // Handle Indonesian currency notation like Rp 1.500.000,00 or 1500000
    // If it contains dots as thousand separators and commas as decimals:
    let clean = str.replace(/[^0-9,.-]/g, '');
    if (clean.includes('.') && clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',') && !clean.includes('.')) {
      // e.g. 1500,50
      clean = clean.replace(',', '.');
    }
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Helper to parse Excel dates or date strings into YYYY-MM-DD
   */
  public static parseDate(val: any): string {
    if (!val) return new Date().toISOString().split('T')[0];
    
    // If Excel serial number (e.g. 45520)
    if (typeof val === 'number') {
      try {
        const parsedDate = new Date((val - (25567 + 2)) * 86400 * 1000);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn(e);
      }
    }

    const str = String(val).trim();
    // DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (ddmmyyyy) {
      const d = ddmmyyyy[1].padStart(2, '0');
      const m = ddmmyyyy[2].padStart(2, '0');
      const y = ddmmyyyy[3];
      return `${y}-${m}-${d}`;
    }

    // YYYY-MM-DD
    const yyyymmdd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (yyyymmdd) {
      const y = yyyymmdd[1];
      const m = yyyymmdd[2].padStart(2, '0');
      const d = yyyymmdd[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Indonesian date format e.g. "11 August 2026" or "11 Agustus 2026"
    const indoMonthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05',
      jun: '06', jul: '07', agu: '08', aug: '08', sep: '09', okt: '10',
      oct: '10', nov: '11', des: '12', dec: '12'
    };
    for (const [key, num] of Object.entries(indoMonthMap)) {
      if (str.toLowerCase().includes(key)) {
        const match = str.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
        if (match) {
          const d = match[1].padStart(2, '0');
          const y = match[3];
          return `${y}-${num}-${d}`;
        }
      }
    }

    return str.substring(0, 10);
  }

  /**
   * Parse uploaded File into structured sheet workbook information
   */
  public static async parseSpreadsheetFile(file: File): Promise<{ workbook: XLSX.WorkBook; sheets: ParsedSheetInfo[] }> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    
    const parsedSheets: ParsedSheetInfo[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      
      if (!rawJson || rawJson.length === 0) continue;

      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(5, rawJson.length); i++) {
        const row = rawJson[i];
        if (row && row.some(cell => String(cell || '').trim() !== '')) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = (rawJson[headerRowIndex] || []).map(h => String(h || '').trim());
      const dataRows = rawJson.slice(headerRowIndex + 1).filter(r => r && r.some(c => String(c || '').trim() !== ''));

      const detectedType = this.detectSheetType(sheetName, headers, dataRows);

      parsedSheets.push({
        sheetName,
        detectedType,
        rowCount: dataRows.length,
        headers,
        sampleRows: dataRows.slice(0, 4),
        rawJson: dataRows
      });
    }

    return { workbook, sheets: parsedSheets };
  }

  /**
   * Heuristically detect what kind of table/data is in this sheet
   */
  public static detectSheetType(sheetName: string, headers: string[], rows: any[][]): TargetImportModule {
    const sName = sheetName.toLowerCase();
    const hText = headers.join(' ').toLowerCase();

    if (sName.includes('hutang') || sName.includes('invoice') || hText.includes('total tagihan') || hText.includes('no po') || hText.includes('nama perusahaan')) {
      return 'hutang';
    }

    if (sName.includes('perusahaan') || sName.includes('asuransi') || hText.includes('nama perusahaan') || hText.includes('jenis pengobatan')) {
      return 'perusahaan_asuransi';
    }

    if (sName.includes('listrik') || sName.includes('kantin') || hText.includes('stand') || hText.includes('kwh') || hText.includes('meter')) {
      return 'listrik_kantin';
    }

    if (sName.includes('semua rekapan') || sName.includes('rekap penjamin') || (hText.includes('penjamin') && hText.includes('piutang bulan lalu') && hText.includes('pembayaran'))) {
      return 'semua_rekapan';
    }

    if (sName.includes('dashboard') || sName.includes('rekap bulanan') || (hText.includes('januari') || (hText.includes('piutang lalu') && hText.includes('rasio')))) {
      return 'rekap_bulanan_2026';
    }

    return 'piutang_pasien';
  }

  /**
   * Parse rows into PiutangRecord[]
   */
  public static parseRowsToPiutangPasien(headers: string[], rows: any[][]): PiutangRecord[] {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const findIdx = (keywords: string[]) => lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));

    const idxInvoice = findIdx(['no invoice', 'nomor invoice', 'no. invoice', 'invoice']);
    const idxNoBukti = findIdx(['bukti', 'billing', 'no tagihan', 'faktur']);
    const idxSep = findIdx(['sep', 'klaim', 'no klaim']);
    const idxRm = findIdx(['rm', 'rekam medis', 'no rm']);
    const idxNama = findIdx(['nama', 'pasien', 'nama pasien']);
    const idxPenjamin = findIdx(['penjamin', 'debitur', 'kategori penjamin', 'bpjs', 'asuransi']);
    const idxDetailPenjamin = findIdx(['detail penjamin', 'nama penjamin', 'instansi', 'perusahaan']);
    const idxLayanan = findIdx(['layanan', 'jenis layanan', 'instalasi', 'pelayanan']);
    const idxTglPelayanan = findIdx(['tgl pelayanan', 'tanggal pelayanan', 'tgl masuk', 'tanggal']);
    const idxTglJatuhTempo = findIdx(['jatuh tempo', 'tgl jatuh tempo', 'due date']);
    const idxNominalTagihan = findIdx(['tagihan', 'nominal tagihan', 'tarif', 'biaya', 'total tarif']);
    const idxNominalDibayar = findIdx(['dibayar', 'sudah dibayar', 'nominal cair', 'cair']);
    const idxSisaPiutang = findIdx(['sisa', 'sisa piutang', 'saldo']);
    const idxStatus = findIdx(['status', 'status klaim', 'status pelunasan']);
    const idxDpjp = findIdx(['dpjp', 'dokter', 'nama dokter']);
    const idxRuangan = findIdx(['ruang', 'ruangan', 'bangsal', 'poli']);
    const idxDispute = findIdx(['dispute', 'keterangan', 'catatan', 'alasan']);
    const idxTglUpdate = findIdx(['update', 'tgl update', 'terakhir']);

    const records: PiutangRecord[] = [];

    rows.forEach((row, i) => {
      if (!row || row.length === 0 || !row.some(c => String(c || '').trim() !== '')) return;

      const getVal = (idx: number, def: string = '') => {
        return idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : def;
      };

      const namaPasien = getVal(idxNama, `Pasien #${i + 1}`);
      const rawPenjamin = getVal(idxPenjamin, 'BPJS Kesehatan - Non PBI');
      const penjamin = this.normalizePenjamin(rawPenjamin);
      const rawLayanan = getVal(idxLayanan, 'Rawat Inap');
      const jenisLayanan = this.normalizeLayanan(rawLayanan);
      const rawStatus = getVal(idxStatus, 'Pengajuan Berkas');
      const statusKlaim = this.normalizeStatus(rawStatus);

      const tglPelayanan = this.parseDate(getVal(idxTglPelayanan, ''));
      const tglJatuhTempo = this.parseDate(getVal(idxTglJatuhTempo, ''));

      const nominalTagihan = this.parseNumber(getVal(idxNominalTagihan, '0'));
      let nominalDibayar = this.parseNumber(getVal(idxNominalDibayar, '0'));
      let sisaPiutang = this.parseNumber(getVal(idxSisaPiutang, '0'));

      if (sisaPiutang === 0 && nominalTagihan > 0 && statusKlaim !== 'Lunas / Cair') {
        sisaPiutang = Math.max(0, nominalTagihan - nominalDibayar);
      } else if (statusKlaim === 'Lunas / Cair' && nominalDibayar === 0) {
        nominalDibayar = nominalTagihan;
        sisaPiutang = 0;
      }

      const { hari, kategori } = calculateUmurHari(tglPelayanan);

      records.push({
        id: `UPLOAD-${i + 1}-${Date.now()}`,
        noInvoice: getVal(idxInvoice, `INV-JTS-${String(i + 1).padStart(4, '0')}`),
        noBukti: getVal(idxNoBukti, `BILL-JTS-${String(i + 1).padStart(4, '0')}`),
        noSepKlaim: getVal(idxSep, `SEP-JTS-${String(i + 1).padStart(5, '0')}`),
        noRm: getVal(idxRm, `RM-${String((i + 1) * 31).padStart(6, '0')}`),
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
        tanggalUpdateTerakhir: this.parseDate(getVal(idxTglUpdate, '')),
        hariUmur: hari,
        kategoriUmur: kategori
      });
    });

    return records;
  }

  /**
   * Parse rows into HutangItem[]
   */
  public static parseRowsToHutang(headers: string[], rows: any[][]): HutangItem[] {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const findIdx = (keywords: string[]) => lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));

    const idxNama = findIdx(['nama', 'perusahaan', 'rekanan', 'vendor']);
    const idxTahun = findIdx(['tahun']);
    const idxJenis = findIdx(['sumber', 'jenis', 'dana']);
    const idxNoPo = findIdx(['po', 'spk', 'no']);
    const idxTgl = findIdx(['tanggal', 'tgl', 'invoice']);
    const idxTagihan = findIdx(['tagihan', 'total', 'nominal']);
    const idxUmur = findIdx(['umur', 'hari']);
    const idxKode = findIdx(['kode', 'rekening']);
    const idxKegiatan = findIdx(['kegiatan', 'uraian']);
    const idxBulan = findIdx(['bulan']);

    const items: HutangItem[] = [];

    rows.forEach((row, i) => {
      if (!row || row.length === 0 || !row.some(c => String(c || '').trim() !== '')) return;

      const getVal = (idx: number, def: string = '') => {
        return idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : def;
      };

      const totalTagihan = this.parseNumber(getVal(idxTagihan, '0'));

      items.push({
        id: `HUT-UPLOAD-${i + 1}-${Date.now()}`,
        namaPerusahaan: getVal(idxNama, `VENDOR #${i + 1}`).toUpperCase(),
        tahun: getVal(idxTahun, '2026'),
        jenisSumber: getVal(idxJenis, 'BLUD') === 'APBD' ? 'APBD' : 'BLUD',
        noPoSpk: getVal(idxNoPo, '-'),
        tanggalInvoice: this.parseDate(getVal(idxTgl, '-')),
        totalTagihan: totalTagihan,
        umurHutangHari: parseInt(getVal(idxUmur, '0')) || 0,
        kodeRekening: getVal(idxKode, '-'),
        kegiatan: getVal(idxKegiatan, '-'),
        bulan: getVal(idxBulan, 'AGUSTUS'),
        jumlahBayar: 0,
        sisaHutang: totalTagihan,
        status: 'Belum Lunas'
      });
    });

    return items;
  }

  /**
   * Parse rows into PerusahaanAsuransiRow[]
   */
  public static parseRowsToPerusahaanAsuransi(headers: string[], rows: any[][]): PerusahaanAsuransiRow[] {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const findIdx = (keywords: string[]) => lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));

    const idxBulan = findIdx(['bulan', 'periode', 'month']);
    const idxNo = findIdx(['no', 'nomor', 'id']);
    const idxNama = findIdx(['nama perusahaan', 'perusahaan', 'nama mitra', 'asuransi', 'mitra']);
    const idxLayanan = findIdx(['jenis pengobatan', 'pengobatan', 'layanan', 'jenis']);
    const idxTglPengajuan = findIdx(['tanggal pengajuan', 'tgl pengajuan', 'pengajuan']);
    const idxTglJatuhTempo = findIdx(['tanggal jatuh tempo', 'tgl jatuh tempo', 'jatuh tempo']);
    const idxPiutangLalu = findIdx(['piutang lalu', 'bulan lalu', 'sisa lalu']);
    const idxPiutangBulanIni = findIdx(['piutang bulan ini', 'tagihan bulan ini', 'klaim bulan ini']);
    const idxPiutangSdBulanIni = findIdx(['s.d bulan ini', 'sd bulan ini', 'total tagihan']);
    const idxPajak = findIdx(['pph', 'pajak', 'pph 23']);
    const idxTglBayar = findIdx(['tanggal pembayaran', 'tgl bayar', 'tgl pembayaran']);
    const idxPembayaran = findIdx(['pembayaran', 'nominal bayar', 'cair', 'sudah bayar']);
    const idxSisa = findIdx(['sisa piutang', 'sisa', 'saldo']);
    const idxStatus = findIdx(['status', 'keterangan status']);
    const idxKet = findIdx(['keterangan', 'catatan', 'keterangan / resi']);

    const list: PerusahaanAsuransiRow[] = [];

    rows.forEach((row, i) => {
      if (!row || row.length === 0 || !row.some(c => String(c || '').trim() !== '')) return;

      const getVal = (idx: number, def: string = '') => {
        return idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : def;
      };

      const bulan = getVal(idxBulan, 'AGUSTUS').toUpperCase();
      const namaPerusahaan = getVal(idxNama, `Perusahaan #${i + 1}`);
      const jenisPengobatan = getVal(idxLayanan, 'Rawat Jalan');
      const tanggalPengajuan = getVal(idxTglPengajuan, '-');
      const tanggalJatuhTempo = getVal(idxTglJatuhTempo, '-');
      const piutangLalu = this.parseNumber(getVal(idxPiutangLalu, '0'));
      const piutangBulanIni = this.parseNumber(getVal(idxPiutangBulanIni, '0'));
      let piutangSdBulanIni = this.parseNumber(getVal(idxPiutangSdBulanIni, '0'));
      if (piutangSdBulanIni === 0 && (piutangLalu > 0 || piutangBulanIni > 0)) {
        piutangSdBulanIni = piutangLalu + piutangBulanIni;
      }
      const pajakPph23 = this.parseNumber(getVal(idxPajak, '0'));
      const tanggalPembayaran = getVal(idxTglBayar, '-');
      const pembayaran = this.parseNumber(getVal(idxPembayaran, '0'));
      let sisaPiutang = this.parseNumber(getVal(idxSisa, '0'));
      if (sisaPiutang === 0 && piutangSdBulanIni > 0 && pembayaran < piutangSdBulanIni) {
        sisaPiutang = piutangSdBulanIni - pembayaran;
      }

      const rawStatus = getVal(idxStatus, '');
      let status: PerusahaanAsuransiRow['status'] = 'Belum Jatuh Tempo';
      if (sisaPiutang <= 0) {
        status = 'Lunas';
      } else if (sisaPiutang < 0) {
        status = 'Saldo Negatif/Koreksi';
      } else if (tanggalJatuhTempo === '-' || !tanggalJatuhTempo) {
        status = 'Belum Ada Tgl JT';
      } else if (rawStatus.toLowerCase().includes('lewat')) {
        status = 'Lewat Jatuh Tempo';
      } else {
        status = 'Belum Jatuh Tempo';
      }

      const keterangan = getVal(idxKet, '-');

      const parsedRow: PerusahaanAsuransiRow = {
        bulan,
        no: i + 1,
        namaPerusahaan,
        jenisPengobatan,
        tanggalPengajuan,
        tanggalJatuhTempo,
        piutangLalu,
        piutangBulanIni,
        piutangSdBulanIni,
        pajakPph23,
        tanggalPembayaran,
        pembayaran,
        sisaPiutang,
        status,
        keterangan
      };

      parsedRow.invoices = generateDefaultInvoices(parsedRow);
      list.push(parsedRow);
    });

    return list;
  }

  /**
   * Parse rows into ListrikKantinStandGroup[]
   */
  public static parseRowsToListrikKantin(headers: string[], rows: any[][]): ListrikKantinStandGroup[] {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const findIdx = (keywords: string[]) => lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));

    const idxStand = findIdx(['nama stand', 'stand', 'penyewa', 'lokasi']);
    const idxBulan = findIdx(['bulan', 'periode', 'tanggal']);
    const idxPiutang = findIdx(['piutang', 'tagihan', 'total tagihan', 'nominal']);
    const idxPembayaran = findIdx(['pembayaran', 'bayar', 'nominal bayar']);
    const idxSisa = findIdx(['sisa', 'sisa piutang', 'saldo']);
    const idxTglBayar = findIdx(['tanggal pembayaran', 'tgl bayar']);
    const idxTglJt = findIdx(['jatuh tempo', 'tgl jatuh tempo']);
    const idxStatus = findIdx(['status']);
    const idxKet = findIdx(['keterangan', 'catatan']);

    const groupsMap = new Map<string, any[]>();

    rows.forEach((row, i) => {
      if (!row || row.length === 0 || !row.some(c => String(c || '').trim() !== '')) return;

      const getVal = (idx: number, def: string = '') => {
        return idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : def;
      };

      const standName = getVal(idxStand, 'STAND KANTIN RSUD').toUpperCase();
      if (!groupsMap.has(standName)) {
        groupsMap.set(standName, []);
      }

      const bulan = getVal(idxBulan, 'AGUSTUS').toUpperCase();
      const piutang = this.parseNumber(getVal(idxPiutang, '0'));
      const pembayaran = this.parseNumber(getVal(idxPembayaran, '0'));
      const sisaPiutang = this.parseNumber(getVal(idxSisa, String(Math.max(0, piutang - pembayaran))));
      const tanggalPembayaran = getVal(idxTglBayar, '-');
      const tanggalJatuhTempo = getVal(idxTglJt, '15/09/2026');
      
      let status: 'Lunas' | 'Lewat Tempo' | 'Belum Ada Tagihan' = 'Belum Ada Tagihan';
      if (piutang > 0 && sisaPiutang === 0) {
        status = 'Lunas';
      } else if (sisaPiutang > 0) {
        status = 'Lewat Tempo';
      }

      groupsMap.get(standName)!.push({
        no: groupsMap.get(standName)!.length + 1,
        tanggalBulan: `1/${bulan}/2026`,
        bulan,
        piutang,
        pembayaran,
        sisaPiutang,
        tanggalPembayaran,
        tanggalJatuhTempo,
        status,
        keterangan: getVal(idxKet, '-')
      });
    });

    const result: ListrikKantinStandGroup[] = [];

    groupsMap.forEach((standRows, standName) => {
      const totalTagihan = standRows.reduce((sum, r) => sum + r.piutang, 0);
      const pembayaran = standRows.reduce((sum, r) => sum + r.pembayaran, 0);
      const sisaPiutang = standRows.reduce((sum, r) => sum + r.sisaPiutang, 0);
      const belumLunasCount = standRows.filter(r => r.sisaPiutang > 0).length;

      result.push({
        namaStand: standName,
        totalTagihan,
        pembayaran,
        sisaPiutang,
        belumLunasCount,
        rows: standRows
      });
    });

    return result.length > 0 ? result : LISTRIK_KANTIN_REAL_DATA;
  }

  /**
   * Parse rows into SemuaRekapanGroup Record
   */
  public static parseRowsToSemuaRekapan(headers: string[], rows: any[][]): Record<string, SemuaRekapanGroup> {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const findIdx = (keywords: string[]) => lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));

    const idxBulan = findIdx(['bulan', 'periode', 'grup']);
    const idxNama = findIdx(['nama penjamin', 'penjamin', 'debitur', 'kelompok']);
    const idxLalu = findIdx(['bulan lalu', 'piutang bulan lalu', 'tahun lalu']);
    const idxIni = findIdx(['bulan ini', 'piutang bulan ini', 'tagihan']);
    const idxSdIni = findIdx(['s.d bulan ini', 'sd bulan ini', 'total']);
    const idxBayar = findIdx(['pembayaran', 'bayar', 'cair']);
    const idxSisa = findIdx(['sisa', 'sisa piutang', 'saldo']);
    const idxStatus = findIdx(['status']);
    const idxKet = findIdx(['keterangan', 'catatan']);

    const monthGroups: Record<string, any[]> = {};

    rows.forEach((row, i) => {
      if (!row || row.length === 0 || !row.some(c => String(c || '').trim() !== '')) return;

      const getVal = (idx: number, def: string = '') => {
        return idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : def;
      };

      const bulan = getVal(idxBulan, 'AGUSTUS').toUpperCase();
      if (!monthGroups[bulan]) monthGroups[bulan] = [];

      const namaPenjamin = getVal(idxNama, `Penjamin #${i + 1}`);
      const piutangBulanLalu = this.parseNumber(getVal(idxLalu, '0'));
      const piutangBulanIni = this.parseNumber(getVal(idxIni, '0'));
      let piutangSdBulanIni = this.parseNumber(getVal(idxSdIni, '0'));
      if (piutangSdBulanIni === 0 && (piutangBulanLalu > 0 || piutangBulanIni > 0)) {
        piutangSdBulanIni = piutangBulanLalu + piutangBulanIni;
      }
      const pembayaran = this.parseNumber(getVal(idxBayar, '0'));
      let sisaPiutang = this.parseNumber(getVal(idxSisa, '0'));
      if (sisaPiutang === 0 && piutangSdBulanIni > 0 && pembayaran < piutangSdBulanIni) {
        sisaPiutang = piutangSdBulanIni - pembayaran;
      }

      const status: 'Lunas' | 'Belum Lunas' = sisaPiutang <= 0 ? 'Lunas' : 'Belum Lunas';
      const keterangan = getVal(idxKet, '-');

      monthGroups[bulan].push({
        bulan,
        no: monthGroups[bulan].length + 1,
        namaPenjamin,
        piutangBulanLalu,
        piutangBulanIni,
        piutangSdBulanIni,
        pembayaran,
        sisaPiutang,
        status,
        keterangan
      });
    });

    const result: Record<string, SemuaRekapanGroup> = { ...SEMUA_REKAPAN_REAL_GROUPS };

    for (const [bulan, gRows] of Object.entries(monthGroups)) {
      const totalPiutangSdBulanIni = gRows.reduce((sum, r) => sum + r.piutangSdBulanIni, 0);
      const totalPembayaran = gRows.reduce((sum, r) => sum + r.pembayaran, 0);
      const totalSisaPiutang = gRows.reduce((sum, r) => sum + r.sisaPiutang, 0);

      result[bulan] = {
        bulan,
        totalPiutangSdBulanIni,
        totalPembayaran,
        totalSisaPiutang,
        rows: gRows
      };
    }

    return result;
  }

  /**
   * Parse rows into RekapBulanan2026Row Record
   */
  public static parseRowsToRekapBulanan(headers: string[], rows: any[][]): Record<string, RekapBulanan2026Row> {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const findIdx = (keywords: string[]) => lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));

    const idxBulan = findIdx(['bulan', 'periode', 'month']);
    const idxLalu = findIdx(['piutang lalu', 'bulan lalu', 'sisa lalu']);
    const idxIni = findIdx(['piutang bulan ini', 'tagihan bulan ini']);
    const idxTotal = findIdx(['total piutang', 'total tagihan']);
    const idxBayar = findIdx(['pembayaran', 'bayar', 'cair']);
    const idxSisa = findIdx(['sisa piutang', 'sisa', 'saldo']);
    const idxPersen = findIdx(['persen', 'rasio', 'tertagih']);
    const idxBelumLunas = findIdx(['baris belum lunas', 'belum lunas', 'jumlah belum lunas']);

    const result: Record<string, RekapBulanan2026Row> = { ...REKAP_BULANAN_2026_DATA };

    rows.forEach((row) => {
      if (!row || row.length === 0 || !row.some(c => String(c || '').trim() !== '')) return;

      const getVal = (idx: number, def: string = '') => {
        return idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : def;
      };

      const rawBulan = getVal(idxBulan, '').toUpperCase();
      const matchedBulan = LIST_BULAN_2026.find(b => rawBulan.includes(b)) || 'AGUSTUS';

      const piutangLalu = this.parseNumber(getVal(idxLalu, '0'));
      const piutangBulanIni = this.parseNumber(getVal(idxIni, '0'));
      let totalPiutang = this.parseNumber(getVal(idxTotal, '0'));
      if (totalPiutang === 0) totalPiutang = piutangLalu + piutangBulanIni;
      const pembayaran = this.parseNumber(getVal(idxBayar, '0'));
      let sisaPiutang = this.parseNumber(getVal(idxSisa, '0'));
      if (sisaPiutang === 0 && totalPiutang > 0) {
        sisaPiutang = Math.max(0, totalPiutang - pembayaran);
      }
      let persenTertagih = this.parseNumber(getVal(idxPersen, '0'));
      if (persenTertagih === 0 && totalPiutang > 0) {
        persenTertagih = Number(((pembayaran / totalPiutang) * 100).toFixed(1));
      }
      const barisBelumLunas = Math.round(this.parseNumber(getVal(idxBelumLunas, '20')));

      result[matchedBulan] = {
        bulan: matchedBulan,
        piutangLalu,
        piutangBulanIni,
        totalPiutang,
        pembayaran,
        sisaPiutang,
        persenTertagih,
        barisBelumLunas,
        kpi: {
          totalSisaPiutang: sisaPiutang,
          piutangBulanIni,
          pembayaran,
          rasioTertagih: persenTertagih,
          belumLunasCount: barisBelumLunas,
          sisaPerusahaanAsuransi: Math.round(sisaPiutang * 0.7),
          sisaListrikKantin: Math.round(sisaPiutang * 0.03),
          sisaPiutangLainnya: Math.round(sisaPiutang * 0.27)
        }
      };
    });

    return result;
  }

  /**
   * Generate Full Master Excel Workbook (.xlsx) with all 5 pre-formatted sheets
   */
  public static generateMasterWorkbook(): Blob {
    const wb = XLSX.utils.book_new();

    // 1. Sheet: Dashboard 2026 (Rekap Bulanan)
    const dataBulanan = LIST_BULAN_2026.map(b => {
      const d = REKAP_BULANAN_2026_DATA[b];
      return {
        'Bulan': b,
        'Piutang Lalu (Rp)': d ? d.piutangLalu : 0,
        'Piutang Bulan Ini (Rp)': d ? d.piutangBulanIni : 0,
        'Total Piutang (Rp)': d ? d.totalPiutang : 0,
        'Pembayaran (Rp)': d ? d.pembayaran : 0,
        'Sisa Piutang (Rp)': d ? d.sisaPiutang : 0,
        '% Tertagih': d ? d.persenTertagih : 0,
        'Baris Belum Lunas': d ? d.barisBelumLunas : 0
      };
    });
    const wsBulanan = XLSX.utils.json_to_sheet(dataBulanan);
    XLSX.utils.book_append_sheet(wb, wsBulanan, 'Rekap Bulanan 2026');

    // 2. Sheet: Perusahaan & Asuransi (40 Mitra)
    const dataPerusahaan = PERUSAHAAN_ASURANSI_REAL_DATA.map(p => ({
      'Bulan': p.bulan,
      'No': p.no,
      'Nama Perusahaan / Asuransi': p.namaPerusahaan,
      'Jenis Pengobatan': p.jenisPengobatan,
      'Tanggal Pengajuan': p.tanggalPengajuan,
      'Tanggal Jatuh Tempo': p.tanggalJatuhTempo,
      'Piutang Lalu (Rp)': p.piutangLalu,
      'Piutang Bulan Ini (Rp)': p.piutangBulanIni,
      'Piutang s.d Bulan Ini (Rp)': p.piutangSdBulanIni,
      'Pajak PPh 23 (Rp)': p.pajakPph23,
      'Tanggal Pembayaran': p.tanggalPembayaran,
      'Pembayaran (Rp)': p.pembayaran,
      'Sisa Piutang (Rp)': p.sisaPiutang,
      'Status': p.status,
      'Keterangan': p.keterangan
    }));
    const wsPerusahaan = XLSX.utils.json_to_sheet(dataPerusahaan);
    XLSX.utils.book_append_sheet(wb, wsPerusahaan, 'Perusahaan & Asuransi');

    // 3. Sheet: Listrik Kantin (3 Stand)
    const flatListrik: any[] = [];
    LISTRIK_KANTIN_REAL_DATA.forEach(stand => {
      stand.rows.forEach(r => {
        flatListrik.push({
          'Nama Stand': stand.namaStand,
          'No': r.no,
          'Bulan': r.bulan,
          'Piutang (Rp)': r.piutang,
          'Pembayaran (Rp)': r.pembayaran,
          'Sisa Piutang (Rp)': r.sisaPiutang,
          'Tanggal Pembayaran': r.tanggalPembayaran,
          'Tanggal Jatuh Tempo': r.tanggalJatuhTempo,
          'Status': r.status,
          'Keterangan': r.keterangan
        });
      });
    });
    const wsListrik = XLSX.utils.json_to_sheet(flatListrik);
    XLSX.utils.book_append_sheet(wb, wsListrik, 'Listrik Kantin');

    // 4. Sheet: Semua Rekapan (10 Kelompok Penjamin)
    const flatSemuaRekapan: any[] = [];
    Object.values(SEMUA_REKAPAN_REAL_GROUPS).forEach(g => {
      g.rows.forEach(r => {
        flatSemuaRekapan.push({
          'Grup Bulan': r.bulan,
          'No': r.no,
          'Nama Penjamin': r.namaPenjamin,
          'Piutang Bulan Lalu (Rp)': r.piutangBulanLalu,
          'Piutang Bulan Ini (Rp)': r.piutangBulanIni,
          'Piutang s.d Bulan Ini (Rp)': r.piutangSdBulanIni,
          'Pembayaran (Rp)': r.pembayaran,
          'Sisa Piutang (Rp)': r.sisaPiutang,
          'Status': r.status,
          'Keterangan': r.keterangan
        });
      });
    });
    const wsSemua = XLSX.utils.json_to_sheet(flatSemuaRekapan);
    XLSX.utils.book_append_sheet(wb, wsSemua, 'Semua Rekapan Penjamin');

    // 5. Sheet: Rincian Klaim & Pasien BPJS
    const dataPiutang = INITIAL_RSUD_PIUTANG_DATA.map(item => ({
      'No Invoice': item.noInvoice || item.noBukti,
      'No Bukti / Billing': item.noBukti,
      'No SEP / Klaim': item.noSepKlaim,
      'No RM': item.noRm,
      'Nama Pasien': item.namaPasien,
      'Kategori Penjamin': item.penjamin,
      'Nama Detail Penjamin': item.namaDetailPenjamin || item.penjamin,
      'Jenis Layanan': item.jenisLayanan,
      'Tanggal Pelayanan': item.tanggalPelayanan,
      'Tanggal Jatuh Tempo': item.tanggalJatuhTempo,
      'Nominal Tagihan (Rp)': item.nominalTagihan,
      'Nominal Dibayar (Rp)': item.nominalDibayar,
      'Sisa Piutang (Rp)': item.sisaPiutang,
      'Status Klaim': item.statusKlaim,
      'Dokter DPJP': item.dpjp,
      'Ruangan / Poli': item.ruangan || '-',
      'Keterangan / Dispute': item.keteranganDispute || '-',
      'Tanggal Update': item.tanggalUpdateTerakhir
    }));
    const wsPiutang = XLSX.utils.json_to_sheet(dataPiutang);
    XLSX.utils.book_append_sheet(wb, wsPiutang, 'Rincian Klaim Pasien & BPJS');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Normalization Helpers
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
}
