const fs = require('fs');

let s = fs.readFileSync('server.ts', 'utf8');

// Replace all occurrences of literal netMode ? in strings with correct template literal syntax.
// 1. Backticks
s = s.replace(/IN \('sales', netMode \? 'sales_returns' : 'sales'\)/g, "IN ('sales', ${netMode ? \"'sales_returns'\" : \"'sales'\"})");

s = s.replace(/IN \('sales', 'purchases', netMode \? 'sales_returns' : 'sales', netMode \? 'purchase_returns' : 'purchases'\)/g, "IN ('sales', 'purchases', ${netMode ? \"'sales_returns'\" : \"'sales'\"}, ${netMode ? \"'purchase_returns'\" : \"'purchases'\"})");

// 2. Double quotes (line 926)
s = s.replace(/"SELECT json_extract\(data, '\$\.productCode'\).*?netMode \? 'sales_returns' : 'sales'\).*?1"/g, match => {
  return '`' + match.substring(1, match.length - 1).replace(/netMode \? 'sales_returns' : 'sales'/, "${netMode ? \"'sales_returns'\" : \"'sales'\"}") + '`';
});

fs.writeFileSync('server.ts', s);
