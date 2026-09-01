const fs = require('fs');
const content = fs.readFileSync('src/components/PerusahaanAsuransiView.tsx', 'utf8');

const newContent = content.replace(
  /{onOpenUploadModal && \(\s+<button[\s\S]*?<\/button>\s+\)}/,
  `{onOpenUploadModal && isAdmin && (
              <button
                onClick={onOpenUploadModal}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-emerald-500/40"
                title="Upload file spreadsheet untuk memperbarui data piutang perusahaan & asuransi"
              >
                <UploadCloud className="w-4 h-4 text-emerald-300" />
                <span>Upload Spreadsheet</span>
              </button>
            )}`
).replace(
  /{\/\* Primary Action 1: Tambah Rekanan Baru \*\/}\s+<button[\s\S]*?<\/button>/,
  `{/* Primary Action 1: Tambah Rekanan Baru */}
            {isAdmin && (
              <button
                onClick={handleOpenAddPartner}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-teal-400/30"
                title="Daftarkan mitra perusahaan atau asuransi baru ke direktori RSUD"
              >
                <UserPlus className="w-4 h-4" />
                <span>🏢 + Rekanan Baru</span>
              </button>
            )}`
).replace(
  /{\/\* Primary Action 2: Entri Tagihan Baru \*\/}\s+<button[\s\S]*?<\/button>/,
  `{/* Primary Action 2: Entri Tagihan Baru */}
            {isAdmin && (
              <button
                onClick={() => handleOpenAddInvoice()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-emerald-400/30"
                title="Entri tagihan invoice baru dengan memilih mitra dari daftar"
              >
                <Plus className="w-4 h-4" />
                <span>📝 + Entri Tagihan</span>
              </button>
            )}`
).replace(
  /{\/\* Primary Action 3: Input Pembayaran Invoice \*\/}\s+<button[\s\S]*?<\/button>/,
  `{/* Primary Action 3: Input Pembayaran Invoice */}
            {isAdmin && (
              <button
                onClick={() => handleOpenPayment()}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-amber-400/30"
                title="Input pembayaran pelunasan tagihan invoice"
              >
                <CreditCard className="w-4 h-4" />
                <span>💸 Bayar Invoice</span>
              </button>
            )}`
).replace(
  /<button\s+onClick={handleResetToEmptyAllMonths}[\s\S]*?<\/button>/,
  `{isAdmin && (
              <button
                onClick={handleResetToEmptyAllMonths}
                className="px-3 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-700/50"
                title="Kosongkan seluruh data tagihan contoh di semua bulan (Jan - Des)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset 1 Tahun</span>
              </button>
            )}`
);

fs.writeFileSync('src/components/PerusahaanAsuransiView.tsx', newContent);
