const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix numeric parsing in processChunk
const regex = /if \(\['quantity', 'price', 'totalPrice', 'costPrice', 'lastPurchasePrice', 'amount', 'vatAmount', 'discount', 'openingBalance', 'volume'\]\.includes\(sysKey\)\) \{[\s\S]*?\}/;
const newCode = `if (['quantity', 'price', 'totalPrice', 'costPrice', 'lastPurchasePrice', 'amount', 'vatAmount', 'discount', 'discountLevel1', 'discountLevel2', 'freightCost', 'openingBalance', 'volume'].includes(sysKey)) {
                  val = val.replace(/,/g, '').trim();
                  if (val === '-' || val === '') val = '0';
              }`;
code = code.replace(regex, newCode);

// Replace CAST with TRY_CAST for robust parsing of existing data
code = code.replace(/CAST\(json_extract_string/g, "TRY_CAST(json_extract_string");

fs.writeFileSync('server.ts', code);
console.log("Updated numeric parsing and TRY_CAST");
