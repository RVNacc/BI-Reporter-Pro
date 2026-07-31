const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regexActualSales = /const actualSalesQuery = await db\.all\("SELECT TRY_CAST.*?let totalExpenses = 0;\s*for \(const row of actualSalesQuery\) \{ totalSales \+= \(row as any\)\.total \|\| 0; \}\s*for \(const row of actualPurchasesQuery\) \{ totalPurchases \+= \(row as any\)\.total \|\| 0; \}\s*for \(const row of actualFinanceQuery\) \{ totalExpenses \+= \(row as any\)\.total \|\| 0; \}/g;

const newActualQueries = `
        const actualSalesQuery = await db.all("SELECT SUM(coalesce(TRY_CAST(json_extract_string(data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL)) - coalesce(TRY_CAST(json_extract_string(data, '$.discount') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel1') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel2') AS REAL), 0)) as total FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'sales' AND json_extract_string(data, '$.date') LIKE ? || '%'", period);
        
        const actualPurchasesQuery = await db.all("SELECT SUM(coalesce(TRY_CAST(json_extract_string(data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL)) - coalesce(TRY_CAST(json_extract_string(data, '$.discount') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel1') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel2') AS REAL), 0)) as total FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'purchases' AND json_extract_string(data, '$.date') LIKE ? || '%'", period);
        
        const actualFinanceQuery = await db.all("SELECT SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.amount'), ',', '') AS REAL)) as total FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'finance_expense' AND json_extract_string(data, '$.date') LIKE ? || '%'", period);

        let totalSales = (actualSalesQuery[0] as any)?.total || 0;
        let totalPurchases = (actualPurchasesQuery[0] as any)?.total || 0;
        let totalExpenses = (actualFinanceQuery[0] as any)?.total || 0;
`;

code = code.replace(regexActualSales, newActualQueries);

// Now fix rawSalesInvs
const rawSalesInvsOld = /rawSalesInvs = await db\.all\(\`[\s\S]*?as any\[\];/;
const rawSalesInvsNew = `rawSalesInvs = await db.all(\`
        SELECT 
          json_extract_string(data, '$.invoiceCode') as invCode,
          json_extract_string(data, '$.productName') as pName,
          json_extract_string(data, '$.productCode') as pCode
        FROM raw_data r JOIN files f ON r.file_id = f.id
        WHERE f.module_type = 'sales'
        AND json_extract_string(data, '$.date') LIKE ? || '%'
        LIMIT 50000 
      \`, period) as any[];`;
code = code.replace(rawSalesInvsOld, rawSalesInvsNew);

fs.writeFileSync('server.ts', code);
console.log('Fixed memory queries');
