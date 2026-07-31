const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const selectStart = `      TRY_CAST(REPLACE(json_extract_string(data, '$.totalPrice'), ',', '') AS REAL) as totalPrice,`;
const replacementStart = `      TRY_CAST(REPLACE(json_extract_string(data, '$.totalPrice'), ',', '') AS REAL) as totalPrice,
      TRY_CAST(REPLACE(json_extract_string(data, '$.discount'), ',', '') AS REAL) as discount,
      TRY_CAST(REPLACE(json_extract_string(data, '$.discountLevel1'), ',', '') AS REAL) as discountLevel1,
      TRY_CAST(REPLACE(json_extract_string(data, '$.discountLevel2'), ',', '') AS REAL) as discountLevel2,`;

code = code.replace(selectStart, replacementStart);

const calcP = `const p = row.price || 0;
       let totalP = row.totalPrice || (p * rawQty);`;
const replacementP = `let p = row.price || 0;
       let totalP = row.totalPrice || (p * rawQty);
       if (row.module_type === 'sales' || row.module_type === 'sales_returns') {
           const disc = (row.discount || 0) + (row.discountLevel1 || 0) + (row.discountLevel2 || 0);
           if (disc > 0 && rawQty > 0) {
               p = p - (disc / rawQty);
               totalP = totalP - disc;
           }
       }`;

code = code.replace(calcP, replacementP);

fs.writeFileSync('server.ts', code);
console.log("Updated price calculation in /api/reports/profit");
