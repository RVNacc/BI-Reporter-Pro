const fs = require('fs');

let f = 'src/views/DashboardView.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/<YAxis \{\.\.\.defaultYAxisProps\}\s*\/>\s*`\$\{\(val \/ 1000000\)\.toFixed\(0\)\}M`\}\n\s*\/>/g, '<YAxis {...defaultYAxisProps} />');

fs.writeFileSync(f, c, 'utf8');
