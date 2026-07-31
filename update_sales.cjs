const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldStr = "TRY_CAST(json_extract_string(data, '$.totalPrice') AS REAL) as totalPrice";
const newStr = "(coalesce(TRY_CAST(json_extract_string(data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL)) - coalesce(TRY_CAST(json_extract_string(data, '$.discount') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel1') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel2') AS REAL), 0)) as totalPrice";

// Only replace in sales queries, not purchases. But wait, `totalPrice` for purchases won't have discountLevel1 anyway (it evaluates to 0). So it's safe to replace globally for sales/purchases queries if they alias it to totalPrice.
// Let's just do a blanket replace for now, as missing json keys return NULL, and coalesce handles it to 0.
code = code.replace(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);

fs.writeFileSync('server.ts', code);
console.log("Updated totalPrice extraction");
