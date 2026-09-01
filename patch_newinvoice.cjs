const fs = require('fs');
let code = fs.readFileSync('src/components/PerusahaanAsuransiView.tsx', 'utf8');
code = code.replace(
  "      status: 'Belum Jatuh Tempo',\n      jenisPengobatan: newJenisPengobatan,\n      keterangan: `Tagihan masuk ${newTglInvoice}`,\n      documentUrl: uploadedUrl\n    };",
  "      status: 'Belum Jatuh Tempo',\n      jenisPengobatan: newJenisPengobatan,\n      keterangan: `Tagihan masuk ${newTglInvoice}`,\n      documentUrl: uploadedUrl,\n      createdBy: currentUserEmail\n    };"
);
fs.writeFileSync('src/components/PerusahaanAsuransiView.tsx', code);
