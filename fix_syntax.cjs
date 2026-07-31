const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /    }allowedAccounts = centerConfig\.source_accounts\.split\(\',\',[\s\S]*?periodCostsByCenter\[center\] \|\| 0\) \+ amount;\n            }\n        }\n    }/g;
content = content.replace(regex, '    }');

fs.writeFileSync('server.ts', content);
