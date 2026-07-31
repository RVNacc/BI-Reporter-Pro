const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newApis = `
app.get("/api/discounts-analysis", async (req, res) => {
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
    
    res.json({ products: data, categories: catData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/comprehensive-profit", async (req, res) => {
  try {
    const period = req.query.period || '';
    const method = req.query.method || 'AVG'; // 'AVG' or 'FIFO'
    
    // In a real scenario, FIFO requires tracking batches. We'll approximate or stick to Average Cost (AVG) for standard.
    // Cost calculation: 
    // Opening balance (if exists) + Purchases (price * qty + freightCost) / Total Qty
    
    const query = \`
      WITH opening AS (
        SELECT 
          json_extract_string(data, '$.productCode') as code,
          SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL)) as qty,
          SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL)) as totalValue
        FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'opening_inventory'
        GROUP BY code
      ),
      purchases AS (
        SELECT 
          json_extract_string(data, '$.productCode') as code,
          SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL)) as qty,
          SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL) + coalesce(TRY_CAST(json_extract_string(data, '$.freightCost') AS REAL), 0)) as totalValue
        FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'purchases' AND (json_extract_string(data, '$.date') <= ? || ? = '')
        GROUP BY code
      ),
      sales AS (
        SELECT 
          coalesce(json_extract_string(data, '$.productName'), json_extract_string(data, '$.productCode'), 'نامشخص') as name,
          json_extract_string(data, '$.productCode') as code,
          SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL)) as qty,
          SUM(
            (coalesce(TRY_CAST(json_extract_string(data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL)) - coalesce(TRY_CAST(json_extract_string(data, '$.discount') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel1') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel2') AS REAL), 0))
          ) as netSales
        FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'sales' AND (json_extract_string(data, '$.date') LIKE ? || '%' OR ? = '')
        GROUP BY code, name
      )
      
      SELECT 
        s.name,
        s.code,
        s.qty as salesQty,
        s.netSales,
        o.qty as openQty,
        o.totalValue as openVal,
        p.qty as purchQty,
        p.totalValue as purchVal,
        coalesce(p.totalValue, 0) as totalPurchVal,
        CASE 
          WHEN (coalesce(o.qty, 0) + coalesce(p.qty, 0)) > 0 
          THEN (coalesce(o.totalValue, 0) + coalesce(p.totalValue, 0)) / (coalesce(o.qty, 0) + coalesce(p.qty, 0))
          ELSE 0 
        END as unitCost
      FROM sales s
      LEFT JOIN opening o ON s.code = o.code
      LEFT JOIN purchases p ON s.code = p.code
    \`;
    const data = await db.all(query, period, period, period, period);
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
`;

if (!code.includes('/api/discounts-analysis')) {
  code = code.replace('// --- API ROUTES ---', '// --- API ROUTES ---\n' + newApis);
  fs.writeFileSync('server.ts', code);
  console.log("New APIs added.");
}
