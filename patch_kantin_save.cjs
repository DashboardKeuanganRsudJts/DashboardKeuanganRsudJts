const fs = require('fs');
let code = fs.readFileSync('src/components/ListrikKantinView.tsx', 'utf8');

code = code.replace(
  "            status: calculatedStatus,\n            keterangan: formKeterangan || '-'\n          };",
  "            status: calculatedStatus,\n            keterangan: formKeterangan || '-',\n            createdBy: currentUserEmail\n          };"
);

code = code.replace(
  "          status: 'Belum Ada Tagihan',\n          keterangan: '-'\n        };",
  "          status: 'Belum Ada Tagihan',\n          keterangan: '-',\n          createdBy: currentUserEmail\n        };"
);

code = code.replace(
  "                status: calculatedStatus,\n                keterangan: formKeterangan || '-'\n              };",
  "                status: calculatedStatus,\n                keterangan: formKeterangan || '-',\n                createdBy: r.createdBy || currentUserEmail\n              };"
);

fs.writeFileSync('src/components/ListrikKantinView.tsx', code);
