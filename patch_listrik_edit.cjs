const fs = require('fs');
const content = fs.readFileSync('src/components/ListrikKantinView.tsx', 'utf8');

const newContent = content.replace(
  /<button\s+onClick={\(\) => handleOpenEditRow\(stand\.namaStand, m\)}[\s\S]*?<\/button>/g,
  `{isAdmin && (
                                  <button
                                    onClick={() => handleOpenEditRow(stand.namaStand, m)}
                                    className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-100 transition"
                                    title="Edit Tagihan/Pembayaran Bulan Ini"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                )}`
).replace(
  /<button\s+onClick={\(\) => handleConfirmDeleteRow\(stand\.namaStand, m\)}[\s\S]*?<\/button>/g,
  `{isAdmin && (
                                  <button
                                    onClick={() => handleConfirmDeleteRow(stand.namaStand, m)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-100 transition"
                                    title="Hapus Tagihan Bulan Ini"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}`
);

fs.writeFileSync('src/components/ListrikKantinView.tsx', newContent);
