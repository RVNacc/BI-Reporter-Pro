const fs = require('fs');
let code = fs.readFileSync('src/views/WeeklyReportsView.tsx', 'utf8');

code = code.replace(
    'import React, { useState, useEffect, useMemo } from "react";',
    'import React, { useState, useEffect, useMemo } from "react";\nimport ExportPrintButtons from "../components/ExportPrintButtons";'
);

// We'll replace the handleExportCSV button with ExportPrintButtons.
// We need to pass data to it. The data in table is `productData`.

code = code.replace(
    /<button\n\s*onClick=\{handleExportCSV\}[\s\S]*?خروجی اکسل\n\s*<\/button>/,
    `<ExportPrintButtons data={[...productData, ...(totalRow ? [totalRow] : [])]} fileName={\`گزارش_هفتگی\`} />`
);
fs.writeFileSync('src/views/WeeklyReportsView.tsx', code);
console.log('done');
