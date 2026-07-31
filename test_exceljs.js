import ExcelJS from 'exceljs';
import xlsx from 'xlsx';

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet([['A', 'B'], [1, 2]]);
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
xlsx.writeFile(wb, "test_file.xlsx");

async function run() {
    const options = { sharedStrings: 'cache', hyperlinks: 'ignore', worksheets: 'emit' };
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader("test_file.xlsx", options);
    try {
        for await (const worksheetReader of workbookReader) {
            for await (const row of worksheetReader) {
            }
        }
    } catch(e) {
        console.error("Error iterating:", e);
    }
}
run();
