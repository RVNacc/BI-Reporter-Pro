const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace('        for (const c of costCenters) {\n        if (allSyncedCenters.has(c.name)) {', '    }\n    for (const c of costCenters) {\n        if (allSyncedCenters.has(c.name)) {');

fs.writeFileSync('server.ts', content);
