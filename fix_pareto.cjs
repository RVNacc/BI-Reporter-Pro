const fs = require('fs');

let f = 'src/views/ParetoReportsView.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/<YAxis[^\n]+orientation="left"[^\n]+\(v\)\.toLocaleString\(\)\}\swidth=\{90\}\s\/>/g, '<YAxis yAxisId="left" {...defaultYAxisProps} orientation="left" />');
c = c.replace(/<YAxis[^\n]+\/>\s*v\s*\+\s*"%"\}\s*width=\{60\}\s*\/>/g, '<YAxis yAxisId="right" {...defaultYAxisProps} />');
c = c.replace(/<YAxis[^\n]+orientation="left"[^\n]+v\.toLocaleString\(\)\}\swidth=\{90\}\s\/>/g, '<YAxis yAxisId="left" {...defaultYAxisProps} orientation="left" />');
c = c.replace(/<YAxis[^\n]+\/>\s*v\.toLocaleString\(\)\}\s*width=\{110\}\s*\/>/g, '<YAxis yAxisId="right" {...defaultYAxisProps} />');

fs.writeFileSync(f, c, 'utf8');
