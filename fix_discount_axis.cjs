const fs = require('fs');
let code = fs.readFileSync('src/views/DiscountAnalysisView.tsx', 'utf8');

code = code.replace(/<XAxis[\s\S]*?\/>/g, `<XAxis \n                          dataKey="name" \n                          tick={{ fontSize: 11 }} \n                          angle={-45} \n                          textAnchor="end" \n                          interval={0} \n                        />`);

code = code.replace(/<YAxis[\s\S]*?\/>/g, `<YAxis \n                          width={80}\n                          tick={{ fontSize: 12, direction: 'ltr' }}\n                          tickFormatter={(value) => new Intl.NumberFormat('fa-IR', { notation: "compact", maximumFractionDigits: 1 }).format(value)}\n                        />`);

fs.writeFileSync('src/views/DiscountAnalysisView.tsx', code);
console.log('done');
