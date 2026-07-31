const { Database } = require('duckdb-async');

async function test() {
  // Let's just print the sql idea
  const sql = `
      SELECT 
       json_extract_string(data, '$.productCode') as code,
       f.module_type,
       SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL)) as val,
       SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL)) as qty,
       COUNT(*) as lines,
       SUM(TRY_CAST(json_extract_string(data, '$.price') AS REAL)) as priceTotal,
       SUM(TRY_CAST(SUBSTR(coalesce(json_extract_string(data, '$.time'), '12:00'), 1, 2) AS INTEGER)) as hours,
       COUNT(DISTINCT json_extract_string(data, '$.invoiceCode')) as sInvoices,
       COUNT(DISTINCT json_extract_string(data, '$.receiptCode')) as pInvoices
      FROM raw_data r JOIN files f ON r.file_id = f.id 
      WHERE f.module_type IN ('sales', 'purchases', 'sales_returns', 'purchase_returns')
      AND match_period(json_extract_string(data, '$.date'), ?)
      GROUP BY code, f.module_type
  `;
  console.log(sql);
}
test();
