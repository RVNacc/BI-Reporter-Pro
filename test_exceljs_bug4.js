import ExcelJS from 'exceljs';
import xlsx from 'xlsx';

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet([['A', 'B'], [1, 2], [3, 4], [5, 6], [7, 8]]);
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
xlsx.writeFile(wb, "test_file_4.xlsx");

async function run() {
    const options = { sharedStrings: 'cache', hyperlinks: 'ignore', worksheets: 'emit' };
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader("test_file_4.xlsx", options);
    
    try {
        let sheetIdx = 0;
        for await (const worksheetReader of workbookReader) {
            if (sheetIdx === 0) {
                for await (const row of worksheetReader) {
                }
            } else {
                for await (const row of worksheetReader) {} // consume
            }
            sheetIdx++;
        }
        console.log("Success");
    } catch(e) {
        console.log("Caught:", e.message);
    }
}
run();
