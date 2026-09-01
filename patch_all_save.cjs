const fs = require('fs');

function patchPendapatan() {
  let code = fs.readFileSync('src/components/PendapatanBludView.tsx', 'utf8');
  code = code.replace(
    "      realisasi: Number(formRealisasi)\n    };",
    "      realisasi: Number(formRealisasi),\n      createdBy: currentUserEmail\n    };"
  );
  fs.writeFileSync('src/components/PendapatanBludView.tsx', code);
}

function patchPengeluaran() {
  let code = fs.readFileSync('src/components/PengeluaranBludView.tsx', 'utf8');
  code = code.replace(
    "      realisasi: Number(formRealisasi)\n    };",
    "      realisasi: Number(formRealisasi),\n      createdBy: currentUserEmail\n    };"
  );
  fs.writeFileSync('src/components/PengeluaranBludView.tsx', code);
}

function patchHutang() {
  let code = fs.readFileSync('src/components/HutangView.tsx', 'utf8');
  
  const func = `\n  const canModifyRecord = (record: any) => {\n    if (role === 'admin') return true;\n    if (isAdmin && record?.createdBy === user?.email) return true;\n    return false;\n  };\n`;
  
  code = code.replace(
    "  const [currentSubTab, setCurrentSubTab] = useState<string>(activeSubmenu || 'obat_farmasi');",
    "  const [currentSubTab, setCurrentSubTab] = useState<string>(activeSubmenu || 'obat_farmasi');" + func
  );
  
  code = code.replace(
    "{isAdmin && (\n                          <button\n                            onClick={() => handleEdit(item)}",
    "{canModifyRecord(item) && (\n                          <button\n                            onClick={() => handleEdit(item)}"
  );
  
  code = code.replace(
    "{isAdmin && (\n                          <button\n                            onClick={() => handleDelete(item.id)}",
    "{canModifyRecord(item) && (\n                          <button\n                            onClick={() => handleDelete(item.id)}"
  );
  
  code = code.replace(
    "      keterangan: formKeterangan\n    };",
    "      keterangan: formKeterangan,\n      createdBy: user?.email\n    };"
  );

  fs.writeFileSync('src/components/HutangView.tsx', code);
}

patchPendapatan();
patchPengeluaran();
patchHutang();
