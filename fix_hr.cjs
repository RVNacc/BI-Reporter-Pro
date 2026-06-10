const fs = require('fs');

let f = 'src/views/HrReportsView.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/<YAxis yAxisId="right" \{\.\.\.defaultYAxisProps\} \/> `\$\{\(val\/1000000\)\.toFixed\(0\)\}M`\}\n\s*axisLine=\{false\}\s*\n\s*tickLine=\{false\}\n\s*width=\{60\}\n\s*\/>/g, '<YAxis yAxisId="right" {...defaultYAxisProps} />');

fs.writeFileSync(f, c, 'utf8');
