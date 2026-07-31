import xlsx from 'xlsx';
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet([
  ['', '', ''],
  ['', '', ''],
  ['  Cod e ', 'Name', '  Price   '],
  [1, 'Product 1', 100],
  [2, 'Product 2', 200]
]);
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
xlsx.writeFile(wb, "test.xlsx");
