const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const startCommit = content.indexOf('app.post("/api/upload-commit"');
const endCommit = content.indexOf('res.json({ message: "فایل با موفقیت نگاشت و ذخیره شد.", fileId, rowCount: totalRows });');

if (startCommit === -1 || endCommit === -1) {
    console.error("Could not find commit boundaries");
    process.exit(1);
}

const replacement = `app.post("/api/upload-commit", (req, res, next) => { clearCache(); next(); }, async (req, res) => {
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
    const processChunk = async (chunk) => {
      try {
        let placeholders = chunk.map(() => '(?, ?)').join(', ');
        let values = [];
        
        for (const row of chunk) {
          const normalizedRow = {};
          for (const [sysKey, exKey] of Object.entries(mappings)) {
            if (exKey === '_STATIC_') {
                normalizedRow[sysKey] = staticMappings[sysKey] || 'نامشخص';
            } else if (exKey && row[exKey] !== undefined && row[exKey] !== null && row[exKey] !== '') {
              let val = String(row[exKey]).trim();
              val = val.replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
              val = val.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
              
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
          values.push(fileId, JSON.stringify(normalizedRow));
        }
        
        await db.run(\`INSERT INTO raw_data (file_id, data) VALUES \${placeholders}\`, ...values);
      } catch(e) { throw e; }
    };

    let totalRows = 0;
    const CHUNK_SIZE = 2000;
    
    try {
        const xlsx = require('xlsx');
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("شیت یافت نشد.");
        const worksheet = workbook.Sheets[sheetName];
        
        // Use sheet_to_json directly with header: 1 to find the header row first
        const allRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: null });

        let headerRowIndex = -1;
        let headers = [];
        for (let i = 0; i < allRows.length; i++) {
            const row = allRows[i];
            if (Array.isArray(row) && row.some(c => c !== null && c !== undefined && String(c).trim() !== '')) {
                headerRowIndex = i;
                headers = row.map(c => c !== null && c !== undefined ? String(c).trim() : '');
                break;
            }
        }

        if (headerRowIndex === -1) {
            throw new Error("فایل خالی است.");
        }

        let currentChunk = [];
        
        for (let i = headerRowIndex + 1; i < allRows.length; i++) {
            const rowArr = allRows[i];
            if (!Array.isArray(rowArr)) continue;
            if (!rowArr.some(c => c !== null && c !== undefined && String(c).trim() !== '')) continue;
            
            const rowObj = {};
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
        
    } catch (e) {
        console.error("Parse error:", e);
        await db.run("DELETE FROM files WHERE id = ?", fileId);
        throw e;
    }

    // Update row count
    await db.run("UPDATE files SET row_count = ? WHERE id = ?", totalRows, fileId);

    res.json({ message: "فایل با موفقیت نگاشت و ذخیره شد.", fileId, rowCount: totalRows });`;

content = content.substring(0, startCommit) + replacement + content.substring(endCommit + 'res.json({ message: "فایل با موفقیت نگاشت و ذخیره شد.", fileId, rowCount: totalRows });'.length);

fs.writeFileSync('server.ts', content);
console.log('patched commit');
