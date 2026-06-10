const fs = require('fs');

let f = 'src/views/HrReportsView.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/import\s*\{\nimport \{ defaultXAxisProps.*/, 'import {\n  ResponsiveContainer,');
// then carefully insert it later
c = c.replace('import ExportPrintButtons from "../components/ExportPrintButtons";', 'import ExportPrintButtons from "../components/ExportPrintButtons";\nimport { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";');

fs.writeFileSync(f, c, 'utf8');

f = 'src/views/AdvancedManagementView.tsx';
c = fs.readFileSync(f, 'utf8');
if (c.includes('import { defaultXAxisProps')) {
   // probably ok
}

