const fs = require('fs');
let code = fs.readFileSync('src/views/WeeklyReportsView.tsx', 'utf8');

if (!code.includes('import ExportPrintButtons')) {
    code = code.replace(
        'import React, { useState, useEffect, useMemo } from "react";',
        'import React, { useState, useEffect, useMemo } from "react";\nimport ExportPrintButtons from "../components/ExportPrintButtons";'
    );
}

const exportBtnRegex = /<button[\s\S]*?onClick=\{handleExportCSV\}[\s\S]*?<\/button>/;
code = code.replace(exportBtnRegex, '<ExportPrintButtons data={[...productData, ...(totalRow ? [totalRow] : [])]} fileName="گزارش_هفتگی" />');

code = code.replace(/const handleExportCSV = \(\) => \{[\s\S]*?\}\;\n/g, '');

fs.writeFileSync('src/views/WeeklyReportsView.tsx', code);
console.log('done');
