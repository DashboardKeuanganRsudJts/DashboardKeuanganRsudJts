import { parseAnyDate, getMonthNameIndo, formatDateDDMMYYYY } from './src/utils/formatters';
const testDates = ['2026-04-11', '11/03/2026', '04/05/2026', '23/02/2026'];
for (const d of testDates) {
  console.log(d, "=>", formatDateDDMMYYYY(d), "=>", getMonthNameIndo(d));
}
