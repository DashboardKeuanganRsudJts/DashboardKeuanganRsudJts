const fs = require('fs');

const file = 'src/data/invoiceHutang2025Data.ts';
let content = fs.readFileSync(file, 'utf8');

const start = content.indexOf(' = [');
const end = content.lastIndexOf(']');
const dataStr = content.substring(start + 3, end + 1);
const data = JSON.parse(dataStr);

for (let i = 0; i < data.length; i++) {
  if (data[i].no === 69) {
    data[i].totalInvoiceFix = 0;
    console.log('Found and patched NO 69');
    break;
  }
}

const newContent = `import { InvoiceHutang2025Record } from '../types/invoiceHutang';

export const INITIAL_INVOICE_HUTANG_2025: InvoiceHutang2025Record[] = ${JSON.stringify(data, null, 2)};
`;

fs.writeFileSync(file, newContent);
