const fs = require('fs');
const content = fs.readFileSync('src/components/PerusahaanAsuransiView.tsx', 'utf8');

const newContent = content.replace(
  /<button\s+type="button"\s+onClick={\(e\) => handleOpenEditInvoice\(row, invoices\[0\], e\)}[\s\S]*?<\/button>/g,
  `{isAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditInvoice(row, invoices[0], e)}
                                    className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-100 transition"
                                    title="Edit Data Invoice"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                )}`
).replace(
  /<button\s+type="button"\s+onClick={\(e\) => handleOpenDeleteInvoice\(row, invoices\[0\], e\)}[\s\S]*?<\/button>/g,
  `{isAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenDeleteInvoice(row, invoices[0], e)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-100 transition"
                                    title="Hapus Invoice"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}`
).replace(
  /<button\s+type="button"\s+onClick={\(e\) => handleOpenEditInvoice\(row, inv, e\)}[\s\S]*?<\/button>/g,
  `{isAdmin && (
                                        <button
                                          type="button"
                                          onClick={(e) => handleOpenEditInvoice(row, inv, e)}
                                          className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-100 transition"
                                          title="Edit Data Invoice"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                      )}`
).replace(
  /<button\s+type="button"\s+onClick={\(e\) => handleOpenDeleteInvoice\(row, inv, e\)}[\s\S]*?<\/button>/g,
  `{isAdmin && (
                                        <button
                                          type="button"
                                          onClick={(e) => handleOpenDeleteInvoice(row, inv, e)}
                                          className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-100 transition"
                                          title="Hapus Invoice"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}`
);

fs.writeFileSync('src/components/PerusahaanAsuransiView.tsx', newContent);
