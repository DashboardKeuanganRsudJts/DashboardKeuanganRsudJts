import React, { useState, useEffect } from 'react';
import { X, Save, Receipt, FileSpreadsheet, Sparkles } from 'lucide-react';
import { CoretaxPPNRecord, DataHutangRecord } from '../../types/ppn';
import { NAMA_BULAN } from '../../utils/ppnFormatters';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'coretax' | 'hutang';
  editItem?: CoretaxPPNRecord | DataHutangRecord | null;
  onSaveCoretax?: (record: CoretaxPPNRecord) => void;
  onSaveHutang?: (record: DataHutangRecord) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  type,
  editItem,
  onSaveCoretax,
  onSaveHutang,
}) => {
  // Coretax state (13 Kolom)
  const [npwpPenjual, setNpwpPenjual] = useState('');
  const [namaPenjual, setNamaPenjual] = useState('');
  const [nomorFaktur, setNomorFaktur] = useState('');
  const [tanggalFaktur, setTanggalFaktur] = useState('2026-01-15');
  const [masaPajak, setMasaPajak] = useState(1);
  const [tahun, setTahun] = useState(2026);
  const [statusFaktur, setStatusFaktur] = useState('Normal');
  const [hargaJual, setHargaJual] = useState<number>(0);
  const [dpp, setDpp] = useState<number>(0);
  const [ppn, setPpn] = useState<number>(0);
  const [nilaiInvoiceCoretax, setNilaiInvoiceCoretax] = useState<number>(0);
  const [perekam, setPerekam] = useState('DJP-Coretax');
  const [nomorInvoice, setNomorInvoice] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Hutang state
  const [vendorHutang, setVendorHutang] = useState('');
  const [tanggalInvoiceHutang, setTanggalInvoiceHutang] = useState('2026-01-10');
  const [nilaiInvoiceHutang, setNilaiInvoiceHutang] = useState<number>(0);
  const [statusPembayaran, setStatusPembayaran] = useState<DataHutangRecord['statusPembayaran']>('BELUM DIBAYAR');
  const [nomorSP2D, setNomorSP2D] = useState('');
  const [tanggalPembayaran, setTanggalPembayaran] = useState('');
  const [jenisHutang, setJenisHutang] = useState('Belanja Obat-Obatan-Obat');

  useEffect(() => {
    if (editItem) {
      if (type === 'coretax') {
        const item = editItem as CoretaxPPNRecord;
        setNpwpPenjual(item.npwpPenjual || item.npwpVendor || '');
        setNamaPenjual(item.namaPenjual || item.namaVendor || '');
        setNomorFaktur(item.nomorFaktur);
        setTanggalFaktur(item.tanggalFaktur);
        setMasaPajak(item.masaPajak || item.periodeBulan || 1);
        setTahun(item.tahun || 2026);
        setStatusFaktur(item.statusFaktur || 'Normal');
        setHargaJual(item.hargaJual || item.dpp || 0);
        setDpp(item.dpp || 0);
        setPpn(item.ppn || 0);
        setNilaiInvoiceCoretax(item.nilaiInvoiceCoretax || (item.dpp + item.ppn) || 0);
        setPerekam(item.perekam || 'DJP-Coretax');
        setNomorInvoice(item.nomorInvoice || '');
        setKeterangan(item.keterangan || '');
      } else {
        const item = editItem as DataHutangRecord;
        setNomorInvoice(item.nomorInvoice);
        setTanggalInvoiceHutang(item.tanggalInvoice);
        setVendorHutang(item.vendor);
        setNilaiInvoiceHutang(item.nilaiInvoice);
        setStatusPembayaran(item.statusPembayaran);
        setNomorSP2D(item.nomorSP2D || '');
        setTanggalPembayaran(item.tanggalPembayaran || '');
        setJenisHutang(item.jenisHutang || 'Belanja Obat-Obatan-Obat');
        setKeterangan(item.keterangan || '');
      }
    } else {
      // Reset defaults
      setNpwpPenjual('');
      setNamaPenjual('');
      setNomorFaktur('');
      setTanggalFaktur('2026-01-15');
      setMasaPajak(1);
      setTahun(2026);
      setStatusFaktur('Normal');
      setHargaJual(0);
      setDpp(0);
      setPpn(0);
      setNilaiInvoiceCoretax(0);
      setPerekam('DJP-Coretax');
      setNomorInvoice('');
      setKeterangan('');
      setVendorHutang('');
      setTanggalInvoiceHutang('2026-01-10');
      setNilaiInvoiceHutang(0);
      setStatusPembayaran('BELUM DIBAYAR');
      setNomorSP2D('');
      setTanggalPembayaran('');
      setJenisHutang('Belanja Obat-Obatan-Obat');
    }
  }, [editItem, type, isOpen]);

  if (!isOpen) return null;

  const handleDppChange = (val: number) => {
    setDpp(val);
    setHargaJual(val);
    const calculatedPpn = Math.round(val * 0.11);
    setPpn(calculatedPpn);
    setNilaiInvoiceCoretax(val + calculatedPpn);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'coretax') {
      if (!nomorFaktur.trim() || !namaPenjual.trim()) {
        alert('Nomor Faktur dan Nama Penjual wajib diisi!');
        return;
      }
      const record: CoretaxPPNRecord = {
        id: editItem ? editItem.id : `CTX-${Date.now()}`,
        npwpPenjual: npwpPenjual.trim(),
        namaPenjual: namaPenjual.trim(),
        nomorFaktur: nomorFaktur.trim(),
        tanggalFaktur,
        masaPajak: Number(masaPajak),
        tahun: Number(tahun),
        statusFaktur,
        hargaJual: Number(hargaJual) || Number(dpp),
        dpp: Number(dpp),
        ppn: Number(ppn),
        nilaiInvoice: Number(nilaiInvoiceCoretax),
        nilaiInvoiceCoretax: Number(nilaiInvoiceCoretax),
        perekam,
        nomorInvoice: nomorInvoice.trim(),
        keterangan,
        namaVendor: namaPenjual.trim(),
        npwpVendor: npwpPenjual.trim(),
        periodeBulan: Number(masaPajak),
      };
      if (onSaveCoretax) onSaveCoretax(record);
    } else {
      if (!nomorInvoice.trim() || !vendorHutang.trim()) {
        alert('Nomor Invoice dan Vendor wajib diisi!');
        return;
      }
      const record: DataHutangRecord = {
        id: editItem ? editItem.id : `HTG-${Date.now()}`,
        nomorInvoice: nomorInvoice.trim(),
        tanggalInvoice: tanggalInvoiceHutang,
        vendor: vendorHutang.trim(),
        nilaiInvoice: Number(nilaiInvoiceHutang),
        statusPembayaran,
        nomorSP2D: nomorSP2D.trim() || undefined,
        tanggalPembayaran: tanggalPembayaran.trim() || undefined,
        jenisHutang,
        keterangan,
      };
      if (onSaveHutang) onSaveHutang(record);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f1418] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-zinc-900 dark:to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              {type === 'coretax' ? <Receipt className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editItem ? 'Edit Data' : 'Tambah Data'}{' '}
                {type === 'coretax' ? 'Faktur Coretax (13 Kolom)' : 'Invoice Hutang & SP2D'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {type === 'coretax'
                  ? 'Format baku 13 kolom Coretax DJP 2026'
                  : 'Master data invoice hutang dan status realisasi SP2D'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {type === 'coretax' ? (
            /* FORM CORETAX 13 KOLOM */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pastikan Nomor Invoice diisi dengan benar agar sistem dapat mencocokkan dengan data hutang secara otomatis.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    1. NPWP Penjual
                  </label>
                  <input
                    type="text"
                    value={npwpPenjual}
                    onChange={(e) => setNpwpPenjual(e.target.value)}
                    placeholder="01.892.456.7-408.000"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    2. Nama Penjual / Rekanan *
                  </label>
                  <input
                    type="text"
                    required
                    value={namaPenjual}
                    onChange={(e) => setNamaPenjual(e.target.value)}
                    placeholder="PT. Kimia Farma Trading..."
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-bold text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    3. Nomor Faktur *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomorFaktur}
                    onChange={(e) => setNomorFaktur(e.target.value)}
                    placeholder="010.000-26.00000001"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono font-bold text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    4. Tanggal Faktur
                  </label>
                  <input
                    type="date"
                    value={tanggalFaktur}
                    onChange={(e) => setTanggalFaktur(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    5. Masa Pajak (Bulan)
                  </label>
                  <select
                    value={masaPajak}
                    onChange={(e) => setMasaPajak(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-bold text-slate-900 dark:text-zinc-100"
                  >
                    {NAMA_BULAN.map((m, idx) => (
                      <option key={`m-opt-${idx + 1}`} value={idx + 1}>
                        Masa {idx + 1} - {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    6. Tahun Pajak
                  </label>
                  <input
                    type="number"
                    value={tahun}
                    onChange={(e) => setTahun(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    7. Status Faktur
                  </label>
                  <select
                    value={statusFaktur}
                    onChange={(e) => setStatusFaktur(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-bold text-slate-900 dark:text-zinc-100"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Pengganti">Pengganti</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    9. DPP Nilai Lain / DPP (Rp) *
                  </label>
                  <input
                    type="number"
                    value={dpp || ''}
                    onChange={(e) => handleDppChange(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono font-bold text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                    10. PPN (Coretax Master Truth) *
                  </label>
                  <input
                    type="number"
                    value={ppn || ''}
                    onChange={(e) => {
                      setPpn(Number(e.target.value));
                      setNilaiInvoiceCoretax(dpp + Number(e.target.value));
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl font-mono font-extrabold text-emerald-700 dark:text-emerald-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    11. Nilai Invoice (DPP + PPN)
                  </label>
                  <input
                    type="number"
                    value={nilaiInvoiceCoretax || ''}
                    onChange={(e) => setNilaiInvoiceCoretax(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    12. Perekam
                  </label>
                  <input
                    type="text"
                    value={perekam}
                    onChange={(e) => setPerekam(e.target.value)}
                    placeholder="DJP-Coretax"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-indigo-800 dark:text-indigo-300 font-black mb-1">
                    13. Nomor Invoice (Kunci Penghubung Rekonsiliasi)
                  </label>
                  <input
                    type="text"
                    value={nomorInvoice}
                    onChange={(e) => setNomorInvoice(e.target.value)}
                    placeholder="INV-2026-001..."
                    className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-700 rounded-xl font-mono font-bold text-indigo-900 dark:text-indigo-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Catatan belanja / obat BLUD..."
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* FORM DATA HUTANG & SP2D */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-indigo-800 dark:text-indigo-300 font-black mb-1">
                    Nomor Invoice (Kunci Rekonsiliasi) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomorInvoice}
                    onChange={(e) => setNomorInvoice(e.target.value)}
                    placeholder="INV-2026-001..."
                    className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-700 rounded-xl font-mono font-bold text-indigo-900 dark:text-indigo-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    Tanggal Invoice
                  </label>
                  <input
                    type="date"
                    value={tanggalInvoiceHutang}
                    onChange={(e) => setTanggalInvoiceHutang(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    Vendor / Rekanan *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorHutang}
                    onChange={(e) => setVendorHutang(e.target.value)}
                    placeholder="PT. Kimia Farma..."
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-bold text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    Nilai Invoice (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={nilaiInvoiceHutang || ''}
                    onChange={(e) => setNilaiInvoiceHutang(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono font-bold text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    Status Pembayaran *
                  </label>
                  <select
                    value={statusPembayaran}
                    onChange={(e) => setStatusPembayaran(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-bold text-slate-900 dark:text-zinc-100"
                  >
                    <option value="SUDAH DIBAYAR">🟢 SUDAH DIBAYAR (Lunas)</option>
                    <option value="BELUM DIBAYAR">🟡 BELUM DIBAYAR (Hutang)</option>
                    <option value="DIBAYAR SEBAGIAN">🔵 DIBAYAR SEBAGIAN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    Nomor SP2D
                  </label>
                  <input
                    type="text"
                    value={nomorSP2D}
                    onChange={(e) => setNomorSP2D(e.target.value)}
                    placeholder="SPD-LS/RSUD Jatisari/I/2026/00001"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    value={tanggalPembayaran}
                    onChange={(e) => setTanggalPembayaran(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    Jenis Belanja / Hutang
                  </label>
                  <input
                    type="text"
                    value={jenisHutang}
                    onChange={(e) => setJenisHutang(e.target.value)}
                    placeholder="Belanja Obat-Obatan-Obat"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Lunas Bank BJB BLUD..."
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Data</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
