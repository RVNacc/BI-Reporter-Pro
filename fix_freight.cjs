const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCodeStart = 'const catData = await db.all(catQuery, period, period);\n    \n    res.json({ products: data, categories: catData });';
const newCode = `const catData = await db.all(catQuery, period, period);
    
    // Freight Analysis
    const freightQuery = \`
      SELECT 
        coalesce(json_extract_string(r.data, '$.productName'), json_extract_string(r.data, '$.productCode'), 'نامشخص') as productName,
        json_extract_string(r.data, '$.productCode') as productCode,
        SUM(TRY_CAST(REPLACE(json_extract_string(r.data, '$.quantity'), ',', '') AS REAL)) as qty,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.freightCost') AS REAL), 0)) as freightCost,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(r.data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(r.data, '$.price') AS REAL))) as grossPurchases
      FROM raw_data r 
      JOIN files f ON r.file_id = f.id 
      WHERE f.module_type = 'purchases' 
      AND (json_extract_string(r.data, '$.date') LIKE ? || '%' OR ? = '')
      GROUP BY productCode, productName
    \`;
    const freightProducts = await db.all(freightQuery, period, period);
    
    const freightCatQuery = \`
      SELECT 
        coalesce(json_extract_string(p.data, '$.mainGroup'), 'بدون گروه') as category,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.freightCost') AS REAL), 0)) as totalFreight,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(r.data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(r.data, '$.price') AS REAL))) as grossPurchases
      FROM raw_data r 
      JOIN files f ON r.file_id = f.id 
      LEFT JOIN raw_data p ON json_extract_string(r.data, '$.productCode') = json_extract_string(p.data, '$.productCode') AND p.file_id IN (SELECT id FROM files WHERE module_type = 'products')
      WHERE f.module_type = 'purchases' 
      AND (json_extract_string(r.data, '$.date') LIKE ? || '%' OR ? = '')
      GROUP BY category
    \`;
    const freightCategories = await db.all(freightCatQuery, period, period);

    res.json({ products: data, categories: catData, freightProducts, freightCategories });`;

const replaced = code.replace(oldCodeStart, newCode);
if(code !== replaced) {
  fs.writeFileSync('server.ts', replaced);
  console.log('Fixed freight endpoint');
} else {
  console.log('String not found');
}
