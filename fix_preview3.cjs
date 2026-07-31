const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCodeStart = 'app.post("/api/upload-preview", upload.single("file"), async (req, res) => {';
const oldCodeEnd = '});\n\n// 1.5. Upload Commit API (Step 2)';

const startIdx = code.indexOf(oldCodeStart);
const innerCode = code.substring(startIdx);
const endMatch = innerCode.indexOf('// 1.5. Upload Commit');
const endIdx = startIdx + endMatch;

const newCode = `app.post("/api/upload-preview", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "فایلی آپلود نشد." });
    }

    let originalName = req.file.originalname;
    try {
        originalName = Buffer.from(originalName, 'latin1').toString('utf8');
    } catch(e) {}

    let headers: string[] = [];
    
    // Use stream reader to prevent memory errors on large files
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(req.file.path, {
        worksheets: 'emit',
        sharedStrings: 'cache',
        styles: 'ignore',
        entries: 'ignore'
    });

    let isFirstSheet = true;
    for await (const worksheetReader of workbookReader) {
        if (!isFirstSheet) break; 
        isFirstSheet = false;

        for await (const row of worksheetReader) {
            if (row.hasValues) {
                // Found the first row with values, treat as headers
                row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
                    let val = cell.value;
                    if (val && typeof val === 'object' && 'result' in val) {
                        val = val.result;
                    } else if (val && typeof val === 'object' && 'text' in val) {
                        val = val.text;
                    }
                    const strVal = val !== undefined && val !== null ? String(val).trim() : '';
                    headers[colNumber - 1] = strVal; // 1-based index
                });
                break; // Stop after first row with values
            }
        }
    }

    // Convert undefined to empty string
    const finalHeaders = [];
    for (let i = 0; i < headers.length; i++) {
      finalHeaders.push(headers[i] || '');
    }

    res.json({
      tempFilename: req.file.filename,
      originalName: originalName,
      headers: finalHeaders,
    });
  } catch (err: any) {
    console.error("Preview Error:", err);
    res.status(500).json({ error: "خطا در پردازش فایل: " + err.message });
  }
});

`;

const replaced = code.substring(0, startIdx) + newCode + code.substring(endIdx);
fs.writeFileSync('server.ts', replaced);
console.log('Fixed preview endpoint with streaming');
