const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `    const financeData = await db.all(\`
      SELECT 
        json_extract_string(data, '$.costCenter') as costCenter,
        TRY_CAST(REPLACE(json_extract_string(data, '$.amount'), ',', '') AS REAL) as amount,
        json_extract_string(data, '$.transactionType') as transactionType
      FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'finance_expense'
    \`);
    const costsByCenter: Record<string, number> = {};
    for (const row of financeData as any[]) {
      if (row.costCenter && row.amount) {
        const name = row.costCenter.trim();
        const amount = Number(row.amount);
        const tType = row.transactionType ? String(row.transactionType).trim() : "";
        if (tType && (tType.includes("ورود") || tType.includes("دریافت") || tType.includes("درآمد") || tType.includes("واریز"))) {
            continue; // Skip income/deposits if explicitly marked
        }
        if (!isNaN(amount)) {
          costsByCenter[name] = (costsByCenter[name] || 0) + amount;
        }
      }
    }`;

content = content.replace(/    const financeData = await db\.all\([\s\S]*?costsByCenter\[name\] \|\| 0\) \+ amount;\n        }\n      }\n    }/, replacement);

fs.writeFileSync('server.ts', content);
