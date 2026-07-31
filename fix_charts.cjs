const fs = require('fs');
let code = fs.readFileSync('src/views/DiscountAnalysisView.tsx', 'utf8');

code = code.replace(/<YAxis[\s\S]*?\/>/g, 
`<YAxis 
  width={100}
  tick={{ fontSize: 12, fill: '#64748b', direction: 'ltr' }}
  tickFormatter={(value) => new Intl.NumberFormat('fa-IR').format(value)}
/>`
);

code = code.replace(/<XAxis[\s\S]*?\/>/g, 
`<XAxis 
  dataKey="name" 
  tick={{ fontSize: 11, fill: '#64748b' }} 
  angle={-90} 
  textAnchor="end" 
  interval={0}
  dx={-5}
  dy={10}
/>`
);

// We need to make sure we only replaced the ones inside BarChart. Wait, PieChart doesn't have XAxis.
fs.writeFileSync('src/views/DiscountAnalysisView.tsx', code);
console.log('done');
