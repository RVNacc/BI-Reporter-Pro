const fs = require('fs');
let content = fs.readFileSync('src/views/CostControlAnalysisView.tsx', 'utf8');

content = content.replace(/angle=\{45\}\s*textAnchor="start"/g, 'angle={-45} textAnchor="end"');
content = content.replace(/dx: -5/g, 'dx: -10');
content = content.replace(/dy: 15/g, 'dy: 10');

fs.writeFileSync('src/views/CostControlAnalysisView.tsx', content);
