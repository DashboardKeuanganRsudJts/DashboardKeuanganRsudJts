const fs = require('fs');
const content = fs.readFileSync('src/components/PerusahaanAsuransiView.tsx', 'utf8');

const newContent = content.replace(
  /<button\s+onClick={\(e\) => handleOpenEditInvoice\(row, invoices\[0\], e\)}[\s\S]*?<\/button>/g,
  `{isAdmin && (
                                  <button
                                    onClick={(e) => handleOpenEditInvoice(row, invoices[0], e)}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
                                    title="Edit rincian tagihan"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}`
).replace(
  /<button\s+onClick={\(e\) => handleOpenEditInvoice\(row, inv, e\)}[\s\S]*?<\/button>/g,
  `{isAdmin && (
                                        <button
                                          onClick={(e) => handleOpenEditInvoice(row, inv, e)}
                                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
                                          title="Edit rincian tagihan"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                      )}`
);

fs.writeFileSync('src/components/PerusahaanAsuransiView.tsx', newContent);
