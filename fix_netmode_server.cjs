const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

// 1. Pareto
s = s.replace(`const period = (req.query.period as string) || "";`, `const period = (req.query.period as string) || "";\n    const netMode = req.query.netMode !== 'false';`);
s = s.replace(`WHERE f.module_type IN ('sales', 'sales_returns') AND isInPeriod(json_extract(data, '$.date'), ?) = 1").iterate(period);`, `WHERE f.module_type IN ('sales', netMode ? 'sales_returns' : 'sales') AND isInPeriod(json_extract(data, '$.date'), ?) = 1").iterate(period);`);

// 2. Weekly
s = s.replace(`app.get("/api/reports/weekly", (req, res) => {\n  try {\n    const period = (req.query.period as string) || "";`, `app.get("/api/reports/weekly", (req, res) => {\n  try {\n    const period = (req.query.period as string) || "";\n    const netMode = req.query.netMode !== 'false';`);

// 3. Cost allocation
s = s.replace(`const costPeriod = (req.query.costPeriod as string) || "";`, `const costPeriod = (req.query.costPeriod as string) || "";\n    const netMode = req.query.netMode !== 'false';`);
s = s.replace(`f.module_type IN ('sales', 'purchases', 'sales_returns', 'purchase_returns')`, `f.module_type IN ('sales', 'purchases', netMode ? 'sales_returns' : 'sales', netMode ? 'purchase_returns' : 'purchases')`);

fs.writeFileSync('server.ts', s);
