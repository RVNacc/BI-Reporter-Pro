const fs = require('fs');
let code = fs.readFileSync('src/views/ComprehensiveProfitLossView.tsx', 'utf8');

code = code.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport ExportButtons from '../components/ExportButtons';"
);

code = code.replace(
    '<div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">',
    '<div className="flex justify-between items-center mb-4">\n          <h3 className="text-lg font-semibold text-slate-800">جزئیات سود و زیان</h3>\n          <ExportButtons data={filteredData} filename="سود_و_زیان_جامع" />\n        </div>\n        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">'
);

fs.writeFileSync('src/views/ComprehensiveProfitLossView.tsx', code);
console.log('done');
