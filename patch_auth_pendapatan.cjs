const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  
  const func = `\n  const canModifyRecord = (record: any) => {\n    if (userRole === 'admin') return true;\n    if (isAdmin && record?.createdBy === currentUserEmail) return true;\n    return false;\n  };\n`;
  
  code = code.replace(
    "  const [currentSubTab, setCurrentSubTab] = useState<string>(activeSubmenu || 'fungsional_rs');",
    "  const [currentSubTab, setCurrentSubTab] = useState<string>(activeSubmenu || 'fungsional_rs');" + func
  );
  
  // They are simple lists usually.
  // Wait, let's see where the delete button is
  code = code.replace(
    "{isAdmin && (\n                          <button\n                            onClick={() => handleDelete(item.id)}",
    "{canModifyRecord(item) && (\n                          <button\n                            onClick={() => handleDelete(item.id)}"
  );
  
  code = code.replace(
    "{isAdmin && (\n                          <button\n                            onClick={() => handleEdit(item)}",
    "{canModifyRecord(item) && (\n                          <button\n                            onClick={() => handleEdit(item)}"
  );
  
  fs.writeFileSync(filepath, code);
}

patchFile('src/components/PendapatanBludView.tsx');
patchFile('src/components/PengeluaranBludView.tsx');
