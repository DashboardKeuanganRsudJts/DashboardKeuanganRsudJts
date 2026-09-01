const fs = require('fs');

let pa = fs.readFileSync('src/components/PerusahaanAsuransiView.tsx', 'utf8');

pa = pa.replace(
  /<button\s+type="button"\s+onClick={\(\) => handleOpenAddInvoice\(row\.namaPerusahaan, row\.jenisPengobatan, row\.bulan\)}[\s\S]*?<\/button>/g,
  `{isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddInvoice(row.namaPerusahaan, row.jenisPengobatan, row.bulan)}
                                    className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition shrink-0"
                                    title={"Tambah Invoice Baru"}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                )}`
);

pa = pa.replace(
  /<button\s+onClick={\(\) => handleOpenPayment\(row\)}[\s\S]*?<\/button>/g,
  `{isAdmin && (
                                  <button
                                    onClick={() => handleOpenPayment(row)}
                                    className="p-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                                    title="Input Pembayaran Tagihan ini"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </button>
                                )}`
);

fs.writeFileSync('src/components/PerusahaanAsuransiView.tsx', pa);
