const xlsx = require('xlsx');

// Create a large fake Excel file
const ws_data = [
  ["tarakonesh", "hesab", "mablagh", "نوع"],
];
for(let i=0; i<155000; i++) {
  ws_data.push(["2024-01-01", "bank", 1000 + i, "خروج"]);
}
const ws = xlsx.utils.aoa_to_sheet(ws_data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
xlsx.writeFile(wb, "large_finance.xlsx");
console.log("File created.");
