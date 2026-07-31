const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const startStr = '}allowedAccounts =';
const endStr = '    for (const c of costCenters) {';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
   content = content.slice(0, startIndex) + '\n' + content.slice(endIndex);
   fs.writeFileSync('server.ts', content);
}
