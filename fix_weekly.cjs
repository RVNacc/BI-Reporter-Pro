const fs = require('fs');

let f = 'src/views/WeeklyReportsView.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/<YAxis \{\.\.\.defaultYAxisProps\}\s*\/>\s*\(v\)\.toLocaleString\(\)\}\s*width=\{90\}\s*tick=\{\{fontSize:\s*12,\s*fill:\s*"#475569"\}\}\s*\/>/g, '<YAxis {...defaultYAxisProps} />');

fs.writeFileSync(f, c, 'utf8');
