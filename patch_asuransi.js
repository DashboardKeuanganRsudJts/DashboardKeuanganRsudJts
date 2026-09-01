const fs = require('fs');
let code = fs.readFileSync('src/components/PerusahaanAsuransiView.tsx', 'utf8');
code = code.replace(
  "  // 1. MASTER PARTNER DIRECTORY",
  "  const canModifyRecord = (record: any) => {\n    if (userRole === 'admin') return true;\n    if (isAdmin && record?.createdBy === currentUserEmail) return true;\n    return false;\n  };\n\n  // 1. MASTER PARTNER DIRECTORY"
);
fs.writeFileSync('src/components/PerusahaanAsuransiView.tsx', code);
