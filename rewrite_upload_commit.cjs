const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const oldCodeStart = 'app.post("/api/upload-commit", (req, res, next) => { clearCache(); next(); }, async (req, res) => {';
const oldCodeEnd = 'res.json({ message: "فایل با موفقیت نگاشت و ذخیره شد.", fileId, rowCount });\n  } catch (err: any) {\n    console.error("Commit Error:", err);\n    res.status(500).json({ error: "خطا در نگاشت فایل: " + err.message });\n  }\n});';

const startIdx = code.indexOf(oldCodeStart);
if (startIdx === -1) {
    console.error("Could not find start");
    process.exit(1);
}

const endIdx = code.indexOf(oldCodeEnd, startIdx);
if (endIdx === -1) {
    console.error("Could not find end");
    process.exit(1);
}

const newCode = `app.post("/api/upload-commit", (req, res, next) => { clearCache(); next(); }, async (req, res) => {
  try {
    const { tempFilename, originalName, module_type, mappings, staticMappings = {} } = req.body;
    const filePath = path.join(UPLOADS_DIR, tempFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "فایل موقت یافت نشد." });
    }

    // Prepare DB entry
    await db.run(
      "INSERT INTO files (filename, original_name, module_type, row_count) VALUES (?, ?, ?, ?)",
      tempFilename,
      originalName,
      module_type,
      0 // We will update this later
    );
    const fileIdRes = await db.all("SELECT max(id) as id FROM files");
    const fileId = fileIdRes[0].id;

    // Chunk processing helper
    const processChunk = async (chunk: any[]) => {
      await db.exec("BEGIN TRANSACTION"); 
      try {
        const stmt = await db.prepare("INSERT INTO raw_data (file_id, data) VALUES (?, ?)");
        for (const row of chunk) {
          const normalizedRow: any = {};
          for (const [sysKey, exKey] of Object.entries(mappings)) {
            if (exKey === '_STATIC_') {
                normalizedRow[sysKey] = staticMappings[sysKey] || 'نامشخص';
            } else if (exKey && row[exKey as string] !== undefined && row[exKey as string] !== null && row[exKey as string] !== '') {
              let val = String(row[exKey as string]).trim();
              val = val.replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
              val = val.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
              
              if (['quantity', 'price', 'totalPrice', 'costPrice', 'lastPurchasePrice', 'amount', 'vatAmount', 'discount', 'discountLevel1', 'discountLevel2', 'freightCost', 'openingBalance', 'volume'].includes(sysKey)) {
                  val = val.replace(/,/g, '').trim();
                  if (val === '-' || val === '') val = '0';
              }
              if (sysKey === 'date') {
                 const dMatch = val.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
                 if (dMatch) {
                     val = \`\${dMatch[1]}/\${dMatch[2].padStart(2, '0')}/\${dMatch[3].padStart(2, '0')}\`;
                 }
              }
              normalizedRow[sysKey] = val;
            }
          }
          await stmt.run(fileId, JSON.stringify(normalizedRow));
        }
        await stmt.finalize();
        await db.exec("COMMIT");
      } catch(e) { 
        await db.exec("ROLLBACK"); 
        throw e; 
      }
    };

    let totalRows = 0;
    const CHUNK_SIZE = 5000;
    let currentChunk: any[] = [];
    
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
        worksheets: 'emit',
        sharedStrings: 'cache',
        styles: 'ignore',
        entries: 'ignore'
    });

    let headers: string[] = [];
    let isFirstRow = true;
    let isFirstSheet = true;

    for await (const worksheetReader of workbookReader) {
        if (!isFirstSheet) break; // Only process the first sheet
        isFirstSheet = false;

        for await (const row of worksheetReader) {
            if (isFirstRow) {
                headers = row.values.slice(1).map((h: any) => h ? String(h).trim() : '');
                isFirstRow = false;
                continue;
            }
            
            totalRows++;
            const rowData: any = {};
            for (let i = 1; i < row.values.length; i++) {
                if (i - 1 < headers.length && headers[i - 1]) {
                    let val = row.values[i];
                    if (val && typeof val === 'object' && val.result !== undefined) {
                        val = val.result;
                    } else if (val && typeof val === 'object' && val.text !== undefined) {
                        val = val.text;
                    }
                    if (val instanceof Date) {
                        // Keep YYYY-MM-DD
                        val = \`\${val.getUTCFullYear()}-\${String(val.getUTCMonth() + 1).padStart(2, '0')}-\${String(val.getUTCDate()).padStart(2, '0')}\`;
                    }
                    rowData[headers[i - 1]] = val !== undefined ? val : null;
                }
            }
            
            currentChunk.push(rowData);
            if (currentChunk.length >= CHUNK_SIZE) {
                await processChunk(currentChunk);
                currentChunk = [];
            }
        }
    }

    if (currentChunk.length > 0) {
        await processChunk(currentChunk);
    }

    await db.run("UPDATE files SET row_count = ? WHERE id = ?", totalRows, fileId);

    res.json({ message: "فایل با موفقیت نگاشت و ذخیره شد.", fileId, rowCount: totalRows });
  } catch (err: any) {
    console.error("Commit Error:", err);
    res.status(500).json({ error: "خطا در نگاشت فایل: " + err.message });
  }
});`;

const replaced = code.substring(0, startIdx) + newCode + code.substring(endIdx + oldCodeEnd.length);

fs.writeFileSync('server.ts', replaced);
console.log('Successfully rewrote /api/upload-commit');
