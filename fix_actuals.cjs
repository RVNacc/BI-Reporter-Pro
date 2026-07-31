const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const old = `        const actualSalesQuery = await db.all("SELECT TRY_CAST(REPLACE(json_extract_string(data, '$.totalPrice'), ',', '') AS REAL) as total, json_extract_string(data, '$.productName') as pName, json_extract_string(data, '$.productCode') as pCode, json_extract_string(data, '$.category') as cat FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'sales' AND json_extract_string(data, '$.date') LIKE ? || '%'", period);
        
        const actualPurchasesQuery = await db.all("SELECT TRY_CAST(REPLACE(json_extract_string(data, '$.totalPrice'), ',', '') AS REAL) as total, json_extract_string(data, '$.productName') as pName, json_extract_string(data, '$.productCode') as pCode, json_extract_string(data, '$.category') as cat FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'purchases' AND json_extract_string(data, '$.date') LIKE ? || '%'", period);
        
        const actualFinanceQuery = await db.all("SELECT TRY_CAST(REPLACE(json_extract_string(data, '$.amount'), ',', '') AS REAL) as total, json_extract_string(data, '$.category') as cat FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'finance_expense' AND json_extract_string(data, '$.date') LIKE ? || '%'", period);

        let totalSales = 0;
        let totalPurchases = 0;
        let totalExpenses = 0;
        for (const row of actualSalesQuery) { totalSales += (row as any).total || 0; }
        for (const row of actualPurchasesQuery) { totalPurchases += (row as any).total || 0; }
        for (const row of actualFinanceQuery) { totalExpenses += (row as any).total || 0; }`;

const n = `        const actualSalesQuery = await db.all("SELECT SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.totalPrice'), ',', '') AS REAL)) as total FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'sales' AND json_extract_string(data, '$.date') LIKE ? || '%'", period);
        
        const actualPurchasesQuery = await db.all("SELECT SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.totalPrice'), ',', '') AS REAL)) as total FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'purchases' AND json_extract_string(data, '$.date') LIKE ? || '%'", period);
        
        const actualFinanceQuery = await db.all("SELECT SUM(TRY_CAST(REPLACE(json_extract_string(data, '$.amount'), ',', '') AS REAL)) as total FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'finance_expense' AND json_extract_string(data, '$.date') LIKE ? || '%'", period);

        let totalSales = actualSalesQuery[0]?.total || 0;
        let totalPurchases = actualPurchasesQuery[0]?.total || 0;
        let totalExpenses = actualFinanceQuery[0]?.total || 0;`;

if (code.includes('const actualSalesQuery')) {
    code = code.replace(old, n);
    fs.writeFileSync('server.ts', code);
    console.log('replaced');
} else {
    console.log('not found');
}
