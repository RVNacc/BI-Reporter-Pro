const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "const dMatch = val.match(/^(d{4})[/-](d{1,2})[/-](d{1,2})/);",
    "const dMatch = val.match(/^(\\d{4})[\\/-](\\d{1,2})[\\/-](\\d{1,2})/);"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed regex');
