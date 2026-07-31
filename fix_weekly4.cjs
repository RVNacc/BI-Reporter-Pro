const fs = require('fs');
let code = fs.readFileSync('src/views/WeeklyReportsView.tsx', 'utf8');

code = code.replace(
    'import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";\nimport React, { useState, useEffect } from "react";',
    'import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";\nimport React, { useState, useEffect } from "react";\nimport ExportPrintButtons from "../components/ExportPrintButtons";'
);

code = code.replace(
    /<ExportPrintButtons data=\{\[\.\.\.productData, \.\.\.\(totalRow \? \[totalRow\] : \[\]\)\]\} fileName="گزارش_هفتگی" \/>/,
    '<ExportPrintButtons data={rows} fileName="گزارش_هفتگی" />'
);

fs.writeFileSync('src/views/WeeklyReportsView.tsx', code);
console.log('done');
