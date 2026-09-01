const fs = require('fs');
let code = fs.readFileSync('src/components/PerusahaanAsuransiView.tsx', 'utf8');

// Replace isAdmin && with canModifyRecord for the invoice edit/delete buttons
// There are multiple instances of {isAdmin && (
// Let's replace the specific button sections carefully.

code = code.replace(
  "{isAdmin && (\n                                  <button\n                                    type=\"button\"\n                                    onClick={(e) => handleOpenEditInvoice(row, invoices[0], e)}",
  "{canModifyRecord(invoices[0]) && (\n                                  <button\n                                    type=\"button\"\n                                    onClick={(e) => handleOpenEditInvoice(row, invoices[0], e)}"
);

code = code.replace(
  "{isAdmin && (\n                                  <button\n                                    type=\"button\"\n                                    onClick={(e) => handleOpenDeleteInvoice(row, invoices[0], e)}",
  "{canModifyRecord(invoices[0]) && (\n                                  <button\n                                    type=\"button\"\n                                    onClick={(e) => handleOpenDeleteInvoice(row, invoices[0], e)}"
);

code = code.replace(
  "{isAdmin && (\n                                        <button\n                                          type=\"button\"\n                                          onClick={(e) => handleOpenEditInvoice(row, inv, e)}",
  "{canModifyRecord(inv) && (\n                                        <button\n                                          type=\"button\"\n                                          onClick={(e) => handleOpenEditInvoice(row, inv, e)}"
);

code = code.replace(
  "{isAdmin && (\n                                        <button\n                                          type=\"button\"\n                                          onClick={(e) => handleOpenDeleteInvoice(row, inv, e)}",
  "{canModifyRecord(inv) && (\n                                        <button\n                                          type=\"button\"\n                                          onClick={(e) => handleOpenDeleteInvoice(row, inv, e)}"
);

fs.writeFileSync('src/components/PerusahaanAsuransiView.tsx', code);
