const fs = require('fs');
let code = fs.readFileSync('src/views/CostControlAnalysisView.tsx', 'utf8');

if (!code.includes('import ExportPrintButtons')) {
    code = code.replace(
        "import { MultiSelect as PeriodSelect } from \"../components/MultiSelect\";",
        "import { MultiSelect as PeriodSelect } from \"../components/MultiSelect\";\nimport ExportPrintButtons from \"../components/ExportPrintButtons\";"
    );
}

// Find header or a place for the button
// "      <div className=\"mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end\">"
code = code.replace(
    '<div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">',
    '<div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">\n        <div className="flex flex-wrap gap-4 items-end">'
);

// Close the inner div and add the buttons. We'll find the closing div of this header.
// It's probably followed by `<div className="grid...` or `<div>...`
code = code.replace(
    '        </div>\n      </div>\n\n      <div className="grid',
    '        </div>\n        <ExportPrintButtons data={matrixData} fileName="تحلیل_هزینه" />\n      </div>\n\n      <div className="grid'
);

fs.writeFileSync('src/views/CostControlAnalysisView.tsx', code);
console.log('done');
