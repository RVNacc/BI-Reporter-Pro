const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const previewRegex = /app\.post\("\/api\/upload-preview", upload\.single\("file"\), async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: "خطا در پردازش فایل\." \}\);\s*\}\s*\}\);/;

const previewReplacement = `app.post("/api/upload-preview", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "فایلی آپلود نشد." });
    }

    let originalName = req.file.originalname;
    try {
        originalName = Buffer.from(originalName, 'latin1').toString('utf8');
    } catch(e) {}

    let headers: string[] = [];
    
    try {
        const workbook = xlsx.readFile(req.file.path, { sheetRows: 50 });
        const sheetName = workbook.SheetNames[0];
        if (sheetName) {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: null }) as any[][];
            
            for (const row of jsonData) {
                if (Array.isArray(row)) {
                    if (row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
                        headers = row.map(cell => cell !== null && cell !== undefined ? String(cell).trim() : '');
                        break;
                    }
                }
            }
        }
    } catch (e: any) {
        console.error("Preview Read Error:", e);
        try { fs.unlinkSync(req.file.path); } catch(e) {}
        return res.status(400).json({ error: "فرمت فایل پشتیبانی نمی‌شود یا فایل خراب است." });
    }

    try { fs.unlinkSync(req.file.path); } catch(e) {}
    res.json({ headers, id: Date.now() });
  } catch (err) {
    console.error("Upload Preview Error:", err);
    try { if (req.file) fs.unlinkSync(req.file.path); } catch(e) {}
    res.status(500).json({ error: "خطا در پردازش فایل." });
  }
});`;

content = content.replace(previewRegex, previewReplacement);

const commitRegex = /app\.post\("\/api\/upload-commit", \([^)]+\) => \{ clearCache\(\); next\(\); \}, async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: "خطا در پردازش و ذخیره فایل\." \}\);\s*\}\s*\}\);/;

const commitReplacement = `app.post("/api/upload-commit", (req, res, next) => { clearCache(); next(); }, async (req, res) => {
  try {
    const { fileId, mappings, module_type, staticMappings = {} } = req.body;
    
    const tempFilename = \`temp_\${fileId}\`;
    const filePath = path.join(UPLOADS_DIR, tempFilename);
    const originalName = req.body.originalName || "نامشخص";

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
    const dbFileId = fileIdRes[0].id;

    // Chunk processing helper
    const processChunk = async (chunk: any[]) => {
      try {
        let placeholders = chunk.map(() => '(?, ?)').join(', ');
        let values = [];
        
        for (const row of chunk) {
          const normalizedRow: any = {};
          for (const [sysKey, exKey] of Object.entries(mappings)) {
            if (exKey === '_STATIC_') {
                normalizedRow[sysKey] = staticMappings[sysKey] || 'نامشخص';
            } else if (exKey && row[exKey as string] !== undefined && row[exKey as string] !== null && row[exKey as string] !== '') {
              let val = String(row[exKey as string]).trim();
              val = val.replace(/[۰-۹]/g, (d: any) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
              val = val.replace(/[٠-٩]/g, (d: any) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
              
              if (['quantity', 'price', 'totalPrice', 'costPrice', 'lastPurchasePrice', 'amount', 'vatAmount', 'discount', 'discountLevel1', 'discountLevel2', 'freightCost', 'openingBalance', 'volume'].includes(sysKey)) {
                  val = val.replace(/,/g, '').trim();
                  if (val === '-' || val === '') val = '0';
              }
              if (sysKey === 'date') {
                 const dMatch = val.match(/^(\\d{4})[\\/-](\\d{1,2})[\\/-](\\d{1,2})/);
                 if (dMatch) {
                     val = \`\${dMatch[1]}/\${dMatch[2].padStart(2, '0')}/\${dMatch[3].padStart(2, '0')}\`;
                 }
              }
              normalizedRow[sysKey] = val;
            }
          }
          values.push(dbFileId, JSON.stringify(normalizedRow));
        }
        
        await db.run(\`INSERT INTO raw_data (file_id, data) VALUES \${placeholders}\`, ...values);
      } catch(e) { throw e; }
    };

    let totalRows = 0;
    const CHUNK_SIZE = 2000;
    
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("شیت یافت نشد.");
        const worksheet = workbook.Sheets[sheetName];
        const allRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: null }) as any[][];

        let headerRowIndex = -1;
        let headers: string[] = [];
        for (let i = 0; i < allRows.length; i++) {
            const row = allRows[i];
            if (row.some(c => c !== null && c !== undefined && String(c).trim() !== '')) {
                headerRowIndex = i;
                headers = row.map(c => c !== null && c !== undefined ? String(c).trim() : '');
                break;
            }
        }

        if (headerRowIndex === -1) {
            throw new Error("فایل خالی است.");
        }

        let currentChunk: any[] = [];
        
        for (let i = headerRowIndex + 1; i < allRows.length; i++) {
            const rowArr = allRows[i];
            if (!rowArr.some(c => c !== null && c !== undefined && String(c).trim() !== '')) continue;
            
            const rowObj: any = {};
            for (let j = 0; j < headers.length; j++) {
                if (headers[j]) {
                    rowObj[headers[j]] = rowArr[j];
                }
            }
            
            currentChunk.push(rowObj);
            totalRows++;
            
            if (currentChunk.length >= CHUNK_SIZE) {
                await processChunk(currentChunk);
                currentChunk = [];
            }
        }
        if (currentChunk.length > 0) {
            await processChunk(currentChunk);
        }
        
    } catch (e: any) {
        console.error("Parse error:", e);
        await db.run("DELETE FROM files WHERE id = ?", dbFileId);
        throw e;
    }

    // Update row count
    await db.run("UPDATE files SET row_count = ? WHERE id = ?", totalRows, dbFileId);

    res.json({ message: "فایل با موفقیت آپلود و پردازش شد.", rowsInserted: totalRows });
  } catch (err: any) {
    console.error("Upload Commit Error:", err);
    res.status(500).json({ error: "خطا در پردازش و ذخیره فایل." });
  }
});`;

content = content.replace(commitRegex, commitReplacement);
fs.writeFileSync('server.ts', content);
console.log('patched upload endpoints');
