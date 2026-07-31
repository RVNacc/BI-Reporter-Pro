const fs = require('fs');
let code = fs.readFileSync('src/views/CostControlAnalysisView.tsx', 'utf8');

code = code.replace(
    '        </div>\n        <ExportPrintButtons data={matrixData} fileName="تحلیل_هزینه" />\n      </div>\n\n      <div className="grid',
    '        </div>\n      </div>\n      <ExportPrintButtons data={matrixData} fileName="تحلیل_هزینه" />\n      </div>\n\n      <div className="grid'
);

fs.writeFileSync('src/views/CostControlAnalysisView.tsx', code);
console.log('done');
