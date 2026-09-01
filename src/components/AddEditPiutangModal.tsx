import React, { useState } from 'react';
import { 
  X, 
  Receipt, 
  Calendar, 
  DollarSign, 
  Check, 
  Building,
  PlusCircle,
  FileText,
  Loader2
} from 'lucide-react';
import { PiutangRecord } from '../types/piutang';
import { calculateUmurHari } from '../data/sampleRsudData';
import { formatRupiah } from '../utils/formatters';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../lib/firebase';

interface AddEditPiutangModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PiutangRecord) => void;
}

export const AddEditPiutangModal: React.FC<AddEditPiutangModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  // 4 Primary Requested Fields:
  // 1. Nomor Invoice
  // 2. Tanggal Invoice
  // 3. Tanggal Jatuh Tempo
  // 4. Nominal Tagihan
  const [noInvoice, setNoInvoice] = useState(() => `INV-RSUD-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [tanggalInvoice, setTanggalInvoice] = useState(() => new Date().toISOString().split('T')[0]);
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [nominalTagihan, setNominalTagihan] = useState<number | ''>('');
  
  // Optional companion field to associate with institution/company
  const [namaInstansi, setNamaInstansi] = useState('PT Pupuk Kujang Cikampek');
  const [kategoriPenjamin, setKategoriPenjamin] = useState<'Kemitraan Perusahaan' | 'Asuransi Swasta' | 'BPJS Kesehatan - Non PBI' | 'BPJS Kesehatan - PBI' | 'Jamkesda / Karawang Sehat' | 'Jasa Raharja (Laka Lantas)'>('Kemitraan Perusahaan');
  
  // Document Upload State
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  // Automatically adjust Tanggal Jatuh Tempo if Tanggal Invoice changes
  const handleTanggalInvoiceChange = (newDate: string) => {
    setTanggalInvoice(newDate);
    if (newDate) {
      const d = new Date(newDate);
      d.setDate(d.getDate() + 30);
      setTanggalJatuhTempo(d.toISOString().split('T')[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Ukuran file terlalu besar. Maksimal 5MB.');
        return;
      }
      setDocumentFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noInvoice.trim() || !nominalTagihan) {
      alert('Harap isi Nomor Invoice dan Nominal Tagihan.');
      return;
    }

    setIsUploading(true);
    let uploadedUrl = '';

    try {
      if (documentFile) {
        const fileRef = ref(storage, `invoices/${auth.currentUser?.uid}/${Date.now()}_${documentFile.name}`);
        await uploadBytes(fileRef, documentFile);
        uploadedUrl = await getDownloadURL(fileRef);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Gagal mengupload dokumen.');
      setIsUploading(false);
      return;
    }

    const tagihan = Number(nominalTagihan) || 0;
    const { hari, kategori } = calculateUmurHari(tanggalInvoice);
    const uniqueId = `RSUD-INV-${Date.now()}`;

    const newRecord: PiutangRecord = {
      id: uniqueId,
      noInvoice: noInvoice.trim(),
      noBukti: `BILL-${noInvoice.trim().replace(/[^a-zA-Z0-9]/g, '')}`,
      noSepKlaim: `SEP-${Math.floor(100000 + Math.random() * 900000)}`,
      noRm: `RM-${Math.floor(100000 + Math.random() * 900000)}`,
      namaPasien: `Pasien Tagihan ${noInvoice.trim()}`,
      penjamin: kategoriPenjamin,
      namaDetailPenjamin: namaInstansi.trim() || 'Instansi Mitra RSUD',
      jenisLayanan: 'Rawat Inap',
      ruangan: 'Layanan Eksekutif',
      dpjp: 'dr. Penanggung Jawab RSUD',
      tanggalPelayanan: tanggalInvoice,
      tanggalJatuhTempo: tanggalJatuhTempo,
      nominalTagihan: tagihan,
      nominalDibayar: 0,
      sisaPiutang: tagihan,
      statusKlaim: 'Pengajuan Berkas',
      keteranganDispute: `Invoice baru dibuat per ${tanggalInvoice}`,
      tanggalUpdateTerakhir: new Date().toISOString().split('T')[0],
      hariUmur: hari,
      kategoriUmur: kategori,
      documentUrl: uploadedUrl || undefined,
      createdBy: auth.currentUser?.email || undefined
    };

    onSave(newRecord);
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0d1216] rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-emerald-950/80 overflow-hidden my-auto animate-in fade-in zoom-in duration-200 text-slate-800 dark:text-zinc-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-teal-900 dark:from-[#0a1f18] dark:to-[#081b22] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <Receipt className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Entri Tagihan Invoice Baru
              </h3>
              <p className="text-xs text-emerald-200/80">
                Formulir ringkas pencatatan tagihan & piutang RSUD Jatisari
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Field Simplified Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl flex items-center gap-2.5 text-emerald-900 dark:text-emerald-300">
            <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              Cukup isi <strong>Nomor Invoice</strong>, <strong>Tanggal Invoice</strong>, <strong>Tanggal Jatuh Tempo</strong>, dan <strong>Nominal Tagihan</strong>.
            </span>
          </div>

          {/* 1. NOMOR INVOICE */}
          <div>
            <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>1. Nomor Invoice <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: INV/2026/08/001 atau INV-PK-0826"
              value={noInvoice}
              onChange={(e) => setNoInvoice(e.target.value)}
              className="w-full px-3.5 py-2.5 border-2 border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/30 dark:bg-[#12181f] rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* 2 & 3. TANGGAL INVOICE & TANGGAL JATUH TEMPO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>2. Tanggal Invoice <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={tanggalInvoice}
                onChange={(e) => handleTanggalInvoiceChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>3. Tanggal Jatuh Tempo <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={tanggalJatuhTempo}
                onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#12181f] rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* 4. NOMINAL TAGIHAN */}
          <div>
            <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>4. Nominal Tagihan (Rp) <span className="text-rose-500">*</span></span>
              </span>
              {nominalTagihan !== '' && (
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs">
                  {formatRupiah(Number(nominalTagihan))}
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-xs">
                Rp
              </span>
              <input
                type="number"
                min="1"
                required
                placeholder="Contoh: 15000000"
                value={nominalTagihan}
                onChange={(e) => setNominalTagihan(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-10 pr-3.5 py-2.5 border-2 border-emerald-300 dark:border-emerald-700/60 bg-white dark:bg-[#12181f] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Mitra / Debitur Terkait */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-zinc-400 font-semibold mb-1">
                Kategori Debitur
              </label>
              <select
                value={kategoriPenjamin}
                onChange={(e) => setKategoriPenjamin(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-zinc-200 focus:outline-none"
              >
                <option value="Kemitraan Perusahaan">Kemitraan Perusahaan</option>
                <option value="Asuransi Swasta">Asuransi Swasta</option>
                <option value="BPJS Kesehatan - Non PBI">BPJS Kesehatan - Non PBI</option>
                <option value="BPJS Kesehatan - PBI">BPJS Kesehatan - PBI</option>
                <option value="Jamkesda / Karawang Sehat">Jamkesda / Karawang Sehat</option>
                <option value="Jasa Raharja (Laka Lantas)">Jasa Raharja (Laka Lantas)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-zinc-400 font-semibold mb-1">
                Nama Mitra / Instansi
              </label>
              <input
                type="text"
                placeholder="Contoh: PT Pupuk Kujang / Mandiri Inhealth"
                value={namaInstansi}
                onChange={(e) => setNamaInstansi(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#12181f] rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Upload Dokumen Invoice */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
            <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Upload Dokumen Invoice / Tagihan (Opsional)</span>
              </span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 dark:text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 dark:file:bg-emerald-950/60 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 border border-slate-200 dark:border-zinc-700 rounded-xl p-1"
              />
            </div>
            {documentFile && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                Berhasil memilih: {documentFile.name} ({(documentFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 rounded-xl bg-emerald-800 dark:bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-900 dark:hover:bg-emerald-500 transition shadow-2xs flex items-center gap-1.5 disabled:opacity-70"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isUploading ? 'Menyimpan...' : 'Simpan Tagihan Baru'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
