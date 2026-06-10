const fs = require('fs');

let f = 'src/views/ProfitLossReportsView.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/<YAxis \{\.\.\.defaultYAxisProps\} \/> \(v \/ 1000000\)\.toFixed\(0\) \+ "M"\}\s+width=\{60\}\s+orientation="left"\s+\/>/g, '<YAxis {...defaultYAxisProps} orientation="left" />');
c = c.replace(/<YAxis \{\.\.\.defaultYAxisProps\} \/>[^\n]+width=\{60\}\s+orientation="left"\s+\/>/g, '<YAxis {...defaultYAxisProps} orientation="left" />');
c = c.replace(/<YAxis \{\.\.\.defaultYAxisProps\} \/>[^\n]+\/>/g, '<YAxis {...defaultYAxisProps} orientation="left" />');

fs.writeFileSync(f, c, 'utf8');
