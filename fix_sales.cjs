const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSalesAmt = "coalesce(TRY_CAST(json_extract_string(data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL))";

const newSalesAmt = "(coalesce(TRY_CAST(json_extract_string(data, '$.totalPrice') AS REAL), TRY_CAST(REPLACE(json_extract_string(data, '$.quantity'), ',', '') AS REAL) * TRY_CAST(json_extract_string(data, '$.price') AS REAL)) - coalesce(TRY_CAST(json_extract_string(data, '$.discount') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel1') AS REAL), 0) - coalesce(TRY_CAST(json_extract_string(data, '$.discountLevel2') AS REAL), 0))";

code = code.split(oldSalesAmt).join(newSalesAmt);

const oldPrice = "TRY_CAST(json_extract_string(data, '$.price') AS REAL) as price";
// wait, price is used in both sales and purchases. I should just calculate price in the frontend based on totalPrice / qty, but it's easier to return netPrice from backend.
// We can just leave `price` as is, and the frontend can compute `netPrice = totalPrice / qty`.
// Wait, I should also replace TRY_CAST(json_extract_string(data, '$.totalPrice') AS REAL) as totalPrice
// with newSalesAmt in sales queries.
// But some queries are for purchases.

fs.writeFileSync('server.ts', code);
console.log("Replaced sales amount logic.");
