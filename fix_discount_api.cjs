const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\("\/api\/discounts-analysis", async \(req, res\) => \{[\s\S]*?res\.json\(\{ products: data, categories: catData \}\);\s*\}\s*catch[^\}]+\}\s*\n\s*\}\);/m;

const replacement = `app.get("/api/discounts-analysis", async (req, res) => {
  try {
    const period = req.query.period || '';
    const query = \`
      SELECT 
        coalesce(json_extract_string(r.data, '$.productName'), json_extract_string(r.data, '$.productCode'), 'نامشخص') as productName,
        json_extract_string(r.data, '$.productCode') as productCode,
        SUM(TRY_CAST(REPLACE(json_extract_string(r.data, '$.quantity'), ',', '') AS REAL)) as qty,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.discount') AS REAL), 0)) as discountOverall,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.discountLevel1') AS REAL), 0)) as discountLevel1,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.discountLevel2') AS REAL), 0)) as discountLevel2,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(r.data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(r.data, '$.price') AS REAL))) as grossSales
      FROM raw_data r 
      JOIN files f ON r.file_id = f.id 
      WHERE f.module_type = 'sales' 
      AND (json_extract_string(r.data, '$.date') LIKE ? || '%' OR ? = '')
      GROUP BY productCode, productName
    \`;
    const data = await db.all(query, period, period);
    
    // Aggregate by category by joining with products module
    const catQuery = \`
      SELECT 
        coalesce(json_extract_string(p.data, '$.mainGroup'), 'بدون گروه') as category,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.discount') AS REAL), 0) + coalesce(TRY_CAST(json_extract_string(r.data, '$.discountLevel1') AS REAL), 0) + coalesce(TRY_CAST(json_extract_string(r.data, '$.discountLevel2') AS REAL), 0)) as totalDiscount,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(r.data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(r.data, '$.price') AS REAL))) as grossSales
      FROM raw_data r 
      JOIN files f ON r.file_id = f.id 
      LEFT JOIN raw_data p ON json_extract_string(r.data, '$.productCode') = json_extract_string(p.data, '$.productCode') AND p.file_id IN (SELECT id FROM files WHERE module_type = 'products')
      WHERE f.module_type = 'sales' 
      AND (json_extract_string(r.data, '$.date') LIKE ? || '%' OR ? = '')
      GROUP BY category
    \`;
    const catData = await db.all(catQuery, period, period);
    
    // Freight data (purchases)
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
      AND coalesce(TRY_CAST(json_extract_string(r.data, '$.freightCost') AS REAL), 0) > 0
      AND (json_extract_string(r.data, '$.date') LIKE ? || '%' OR ? = '')
      GROUP BY productCode, productName
    \`;
    const freightData = await db.all(freightQuery, period, period);
    
    // Freight category
    const freightCatQuery = \`
      SELECT 
        coalesce(json_extract_string(p.data, '$.mainGroup'), 'بدون گروه') as category,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.freightCost') AS REAL), 0)) as totalFreight,
        SUM(coalesce(TRY_CAST(json_extract_string(r.data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(r.data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(r.data, '$.price') AS REAL))) as grossPurchases
      FROM raw_data r 
      JOIN files f ON r.file_id = f.id 
      LEFT JOIN raw_data p ON json_extract_string(r.data, '$.productCode') = json_extract_string(p.data, '$.productCode') AND p.file_id IN (SELECT id FROM files WHERE module_type = 'products')
      WHERE f.module_type = 'purchases' 
      AND coalesce(TRY_CAST(json_extract_string(r.data, '$.freightCost') AS REAL), 0) > 0
      AND (json_extract_string(r.data, '$.date') LIKE ? || '%' OR ? = '')
      GROUP BY category
    \`;
    const freightCatData = await db.all(freightCatQuery, period, period);

    res.json({ products: data, categories: catData, freightProducts: freightData, freightCategories: freightCatData });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log('Fixed api discounts/freight');
