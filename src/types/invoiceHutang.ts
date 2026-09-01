export interface InvoiceHutang2025Record {
  id: string;
  no: number;
  rekanan: string;
  bagian: string;
  bidang?: string;
  uraian: string;
  kodeRekening?: string;
  subBelanja: string;
  tglTandaTerima: string;
  tglSpbSpk: string;
  tglInvoice: string;
  tglRekap?: string;
  tglMasukSpj?: string;
  tglBayar?: string;
  bulanInvoice: string;
  noInvoice: string;
  jatuhTempo: string;
  jumlahInvoice: number;
  koreksi: number;
  totalInvoiceFix: number;
  pembayaran: number;
  sumberAnggaran: string;
  sisaHutang: number;
  sudahMasukBukuKas: boolean;
  tglSpdBukuKas: string;
  bulanSpd: string;
  noSpdBukuKas: string;
  lamaHariHutang: number;
  keterangan: string;
  koreksiPlusMinus: number;
  koreksiMinusBlud: number;
  koreksiMinusApbd: number;
  sisaHutangRiil: number;
}

export type InvoiceHutang2026Record = InvoiceHutang2025Record;

