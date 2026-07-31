const ExcelJS = require('exceljs');
const fs = require('fs');

async function test() {
  const options = { sharedStrings: 'cache', hyperlinks: 'ignore', worksheets: 'emit' };
  const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader('test.xlsx', options);
  for await (const worksheetReader of workbookReader) {
    for await (const row of worksheetReader) {
    }
  }
  console.log(workbookReader.sharedStrings);
}
test();
