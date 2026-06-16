const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(/const amt = q \* \(row.price \|\| 0\);/g, `let amt = 0; if (row.totalPrice != null && !Number.isNaN(row.totalPrice)) { amt = row.totalPrice; } else { amt = q * (row.price || 0); }`);

s = s.replace(/const amt = q \* p \* \(isReturn \? -1 : 1\);/g, `let amtBase = 0; if (s.totalPrice != null && !Number.isNaN(s.totalPrice)) { amtBase = s.totalPrice; } else { amtBase = q * p; } const amt = amtBase * (isReturn ? -1 : 1);`);

fs.writeFileSync('server.ts', s);
