const fs = require('fs');

let s = fs.readFileSync('server.ts', 'utf8');
if (!s.includes(`const netMode = req.query.netMode !== 'false';`) || s.match(/app\.get\("\/api\/dashboard"/)) {
    // Only update dashboard route if needed
    // s = s.replace(`app.get("/api/dashboard", (req, res) => {\n  try {\n    const period = (req.query.period as string) || "";`, `app.get("/api/dashboard", (req, res) => {\n  try {\n    const period = (req.query.period as string) || "";\n    const netMode = req.query.netMode !== 'false';`);
    
    // Replace in Dashboard sales query
    s = s.replace(`FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', 'sales_returns')\n      AND isInPeriod(json_extract(data, '$.date'), ?) = 1`, `FROM raw_data r JOIN files f ON r.file_id = f.id WHERE f.module_type IN ('sales', netMode ? 'sales_returns' : 'sales')\n      AND isInPeriod(json_extract(data, '$.date'), ?) = 1`);
      
    // There's a GROUP BY query and a total one. Let's do a global replace for dashboard API.
    // Dashboard API goes from app.get("/api/dashboard" to app.get("/api/files"
    let parts = s.split('app.get("/api/files"');
    if(parts.length > 1) {
        let dashCode = parts[0];
        
        dashCode = dashCode.replace(`WHERE f.module_type IN ('sales', 'sales_returns')`, `WHERE f.module_type IN ('sales', netMode ? 'sales_returns' : 'sales')`);
        dashCode = dashCode.replace(`WHERE f.module_type IN ('sales', 'sales_returns')`, `WHERE f.module_type IN ('sales', netMode ? 'sales_returns' : 'sales')`);
        dashCode = dashCode.replace(`WHERE f.module_type IN ('sales', 'sales_returns')`, `WHERE f.module_type IN ('sales', netMode ? 'sales_returns' : 'sales')`);
        dashCode = dashCode.replace(`WHERE f.module_type IN ('sales', 'sales_returns')`, `WHERE f.module_type IN ('sales', netMode ? 'sales_returns' : 'sales')`);
        
        s = dashCode + 'app.get("/api/files"' + parts[1];
    }
    
    fs.writeFileSync('server.ts', s);
}
