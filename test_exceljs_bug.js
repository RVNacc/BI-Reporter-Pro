import ExcelJS from 'exceljs';
import xlsx from 'xlsx';

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet([['A', 'B'], [1, 2], [3, 4], [5, 6], [7, 8]]);
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
xlsx.writeFile(wb, "test_file.xlsx");

async function run() {
    const options = { sharedStrings: 'cache', hyperlinks: 'ignore', worksheets: 'emit' };
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader("test_file.xlsx", options);
    
    // Simulate upload-preview
    let count = 0;
    for await (const worksheetReader of workbookReader) {
        for await (const row of worksheetReader) {
            count++;
            if (count >= 2) break;
        }
        break;
    }
    console.log("First pass done");
    
    // Simulate upload-commit on same file
    const workbookReader2 = new ExcelJS.stream.xlsx.WorkbookReader("test_file.xlsx", options);
    try {
        for await (const worksheetReader of workbookReader2) {
            for await (const row of worksheetReader) {
            }
        }
    } catch(e) {
        console.error("Second pass error:", e);
    }
}
run();
