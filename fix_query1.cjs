const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const query1Start = "console.log(\"running advanced BI query 1\");";
const query1Regex = /console\.log\("running advanced BI query 1"\);\s+salesData = await db\.all\([\s\S]*?as any\[\];/;

const newQuery1 = `console.log("running advanced BI query 1");
    salesData = await db.all(\`
        SELECT 
          json_extract_string(data, '$.date') as date,
          SUM(CASE WHEN f.module_type = 'sales' THEN (coalesce(TRY_CAST(json_extract_string(data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL)) - coalesce(TRY_CAST(json_extract_string(data, '$.discount') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel1') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel2') AS REAL), 0)) ELSE -(coalesce(TRY_CAST(json_extract_string(data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL)) - coalesce(TRY_CAST(json_extract_string(data, '$.discount') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel1') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel2') AS REAL), 0)) END) as totalAmt,
          COUNT(*) as txCount
        FROM raw_data r JOIN files f ON r.file_id = f.id
        WHERE f.module_type IN ('sales', 'sales_returns')
        AND json_extract_string(data, '$.date') LIKE ? || '%'
        GROUP BY 1
      \`, period) as any[];`;

code = code.replace(query1Regex, newQuery1);
fs.writeFileSync('server.ts', code);
console.log("Query 1 fixed.");
