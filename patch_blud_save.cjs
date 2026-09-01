const fs = require('fs');

function patchBlud(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  code = code.replace(
    "      keterangan: formKeterangan\n    };",
    "      keterangan: formKeterangan,\n      createdBy: currentUserEmail\n    };"
  );
  code = code.replace(
    "  keterangan?: string;\n}",
    "  keterangan?: string;\n  createdBy?: string;\n}"
  );
  fs.writeFileSync(filepath, code);
}

patchBlud('src/components/PendapatanBludView.tsx');
patchBlud('src/components/PengeluaranBludView.tsx');
