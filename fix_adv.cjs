const fs = require('fs');

let f = 'src/views/AdvancedManagementView.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/<YAxis yAxisId="left" \{\.\.\.defaultYAxisProps\} orientation="left" \/> `\$\{\(val \/ 1000000\)\.toFixed\(0\)\}M`\} \n\s*tick=\{\{ fill: "#475569" \}\} \n\s*axisLine=\{false\} \n\s*tickLine=\{false\} \n\s*width=\{80\} \n\s*orientation="right" \n\s*\/>/g, '<YAxis yAxisId="left" {...defaultYAxisProps} orientation="left"/>');

c = c.replace(/<YAxis yAxisId="right" \{\.\.\.defaultYAxisProps\} \/> `\$\{val\}%`\} \n\s*tick=\{\{ fill: "#ef4444" \}\} \n\s*axisLine=\{false\} \n\s*tickLine=\{false\} \n\s*width=\{40\} \n\s*orientation="left" \n\s*\/>/g, '<YAxis yAxisId="right" {...defaultYAxisProps} orientation="right"/>');


fs.writeFileSync(f, c, 'utf8');
