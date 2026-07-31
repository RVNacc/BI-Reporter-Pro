const fs = require('fs');
let code = fs.readFileSync('src/views/CostControlAnalysisView.tsx', 'utf8');

code = code.replace(
    '               placeholder="بدون مقایسه"\n            />\n         </div>\n      </div>',
    '               placeholder="بدون مقایسه"\n            />\n         </div>\n      </div>\n      <ExportPrintButtons data={activeTab === \'comprehensive\' ? (comprehensiveData || []) : (data?.costAnalysis || [])} fileName="تحلیل_هزینه" />\n      </div>'
);

fs.writeFileSync('src/views/CostControlAnalysisView.tsx', code);
console.log('done');
