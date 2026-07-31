import ExcelJS from 'exceljs';
import xlsx from 'xlsx';

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet([['A', 'B'], [1, 2], [3, 4], [5, 6], [7, 8]]);
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
xlsx.writeFile(wb, "test_file.xlsx");

async function run() {
    const options = { sharedStrings: 'cache', hyperlinks: 'ignore', worksheets: 'emit' };
    
    // Simulate upload-commit on same file ONLY
    const workbookReader2 = new ExcelJS.stream.xlsx.WorkbookReader("test_file.xlsx", options);
    try {
        for await (const worksheetReader of workbookReader2) {
            for await (const row of worksheetReader) {
            }
        }
        console.log("Success");
    } catch(e) {
        console.error("Second pass error:", e);
    }
}
run();
