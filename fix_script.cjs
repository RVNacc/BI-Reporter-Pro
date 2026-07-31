const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const badStart = content.indexOf('      WHERE f.module_type IN (\'sales\', \'purchases\', ${netMode ? "\'sales_returns\'" : "\'sales\'"},     // Get all available accounts globally');
const goodReplacement = `      WHERE f.module_type IN ('sales', 'purchases', \${netMode ? "'sales_returns'" : "'sales'"}, \${netMode ? "'purchase_returns'" : "'purchases'"})
      AND match_period(json_extract_string(data, '$.date'), ?)
      GROUP BY code, f.module_type
    \`
      , salesPeriod);

    // 5. Get cost centers
    const allCostCenters = await db.all("SELECT * FROM cost_centers") as any[];
    // Filter out inactive cost centers for calculation
    const costCenters = allCostCenters.filter(cc => cc.is_active === 1 || cc.is_active === undefined || cc.is_active === true);

    const allSyncedCentersRows = await db.all("SELECT json_extract_string(data, '$.costCenter') as cc FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type = 'finance_expense'");
    const allSyncedCenters = new Set(
        allSyncedCentersRows.map((r) => r.cc?.trim()).filter(Boolean)
    );

    // Get all available accounts globally`;

content = content.replace('      WHERE f.module_type IN (\'sales\', \'purchases\', ${netMode ? "\'sales_returns\'" : "\'sales\'"},     // Get all available accounts globally', goodReplacement);

const dupStart = content.indexOf('allowedAccounts = centerConfig.source_accounts.split(\',\').filter(Boolean);');

if(dupStart !== -1) {
   // find the previous '            const amount = Number(row.amount);'
   const amountLine = content.lastIndexOf('            const amount = Number(row.amount);', dupStart);
   if(amountLine !== -1) {
       // We can just remove the whole block from amountLine to dupStart + duplicated part
       // Let's just fix it by replacing the whole area
       content = content.replace(/            const amount = Number\(row\.amount\);[\s\S]*?periodCostsByCenter\[center\] \|\| 0\) \+ amount;\n            }\n        }\n    }allowedAccounts = centerConfig\.source_accounts\.split\(\',\',[\s\S]*?continue;\n            }\n            if \(\!isNaN\(amount\)\) {\n                periodCostsByCenter\[center\] = \(periodCostsByCenter\[center\] \|\| 0\) \+ amount;\n            }\n        }\n    }/g, '');
   }
}

fs.writeFileSync('server.ts', content);
