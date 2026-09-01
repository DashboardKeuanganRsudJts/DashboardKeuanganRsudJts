const fs = require('fs');
let code = fs.readFileSync('src/components/ListrikKantinView.tsx', 'utf8');

// Replace {isAdmin && (
// with {canModifyRecord(m) && (

// Let's first add canModifyRecord for the Kantin row if it doesn't exist
const func = `  const canModifyRecord = (row: any) => {\n    if (userRole === 'admin') return true;\n    if (isAdmin && row?.createdBy === currentUserEmail) return true;\n    return false;\n  };\n`;

code = code.replace("  // 1. MASTER STAND DATA", func + "  // 1. MASTER STAND DATA");

code = code.replace(
  "{isAdmin && (\n                                    <button\n                                      onClick={() => handleOpenEditRow(stand.namaStand, m)}",
  "{canModifyRecord(m) && (\n                                    <button\n                                      onClick={() => handleOpenEditRow(stand.namaStand, m)}"
);

code = code.replace(
  "{isAdmin && (\n                                      <button\n                                        onClick={() => handleOpenPay(stand.namaStand, m)}",
  "{canModifyRecord(m) && (\n                                      <button\n                                        onClick={() => handleOpenPay(stand.namaStand, m)}"
);

// Delete stand button needs protection too? The user asked that they can delete entries they made themselves. A stand has multiple rows, maybe check if they created the stand? Or just let admin delete stands.
code = code.replace(
  "onClick={() => handleDeleteStand(stand.namaStand)}",
  "onClick={() => handleDeleteStand(stand.namaStand)}\n                      disabled={userRole !== 'admin'}"
);
code = code.replace(
  "title={`Hapus stand ${stand.namaStand} dari sistem`}",
  "title={`Hapus stand ${stand.namaStand} dari sistem`}\n                      style={{ opacity: userRole !== 'admin' ? 0.5 : 1, cursor: userRole !== 'admin' ? 'not-allowed' : 'pointer' }}"
);


fs.writeFileSync('src/components/ListrikKantinView.tsx', code);
