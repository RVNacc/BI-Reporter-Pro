const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add import ExcelJS
if (!code.includes('import ExcelJS')) {
    code = code.replace('import * as xlsx from "xlsx";', 'import * as xlsx from "xlsx";\nimport ExcelJS from "exceljs";');
}

const oldUploadCommit = /const fileBuffer = fs\.readFileSync\(filePath\);[\s\S]*?await stmt\.run\(fileId, JSON\.stringify\(normalizedRow\)\);\s*}\s*try \{\s*await db\.exec\("COMMIT"\);\s*\} catch \(e\) \{\}\s*\}\s*catch \(e\) \{\s*await db\.exec\("ROLLBACK"\);\s*throw e;\s*\}\s*\}/;

const newUploadCommit = `
    const options = {
      worksheets: 'emit',
      sharedStrings: 'cache',
      hyperlinks: 'ignore',
      styles: 'ignore'
    };
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, options);
    
    let headers = [];
    let rowCount = 0;
    
    // First pass to get row count (optional, but let's just insert into files with 0 for now and update later)
    await db.run(
      "INSERT INTO files (filename, original_name, module_type, row_count) VALUES (?, ?, ?, ?)",
      tempFilename,
      originalName,
      module_type,
      0
    );
    const fileIdRes = await db.all("SELECT max(id) as id FROM files");
    const fileId = fileIdRes[0].id;
    
    const insertData = "INSERT INTO raw_data (file_id, data) VALUES (?, ?)";
    let currentChunk = [];
    const CHUNK_SIZE = 5000;
    
    const processChunk = async (chunk) => {
      if (chunk.length === 0) return;
      await db.exec("BEGIN TRANSACTION");
      try {
        const stmt = await db.prepare(insertData);
        for (const row of chunk) {
          const normalizedRow = {};
          for (const [sysKey, exKey] of Object.entries(mappings)) {
            if (exKey === '_STATIC_') {
                normalizedRow[sysKey] = staticMappings[sysKey] || 'نامشخص';
            } else if (exKey && row[exKey] !== undefined && row[exKey] !== null) {
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
          await stmt.run(fileId, JSON.stringify(normalizedRow));
        }
        await db.exec("COMMIT");
      } catch (e) {
        await db.exec("ROLLBACK");
        throw e;
      }
    };

    let isFirstRow = true;
    for await (const worksheet of workbook) {
      for await (const row of worksheet) {
        if (isFirstRow) {
          // values usually start from 1, and 0 is empty in ExcelJS row.values
          headers = (row.values || []).map(h => h ? h.toString().trim() : '');
          isFirstRow = false;
          continue;
        }
        
        rowCount++;
        const rowData = {};
        const values = row.values || [];
        headers.forEach((h, index) => {
          if (h && values[index] !== undefined) {
             let v = values[index];
             // Handle ExcelJS rich text or date objects
             if (v && typeof v === 'object' && v.richText) {
                v = v.richText.map(rt => rt.text).join('');
             } else if (v instanceof Date) {
                v = v.toISOString().split('T')[0];
             }
             rowData[h] = v;
          }
        });
        
        currentChunk.push(rowData);
        if (currentChunk.length >= CHUNK_SIZE) {
          await processChunk(currentChunk);
          currentChunk = [];
        }
      }
      break; // Only read the first sheet
    }
    
    if (currentChunk.length > 0) {
      await processChunk(currentChunk);
    }

    // Update row count
    await db.run("UPDATE files SET row_count = ? WHERE id = ?", rowCount, fileId);
`;

code = code.replace(oldUploadCommit, newUploadCommit);
fs.writeFileSync('server.ts', code);
console.log("Updated server.ts for streaming upload");
