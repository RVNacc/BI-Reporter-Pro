const fs = require('fs');
let code = fs.readFileSync('src/views/DiscountAnalysisView.tsx', 'utf8');

code = code.replace(/<BarChart data={productChartData} margin=\{\{ top: 20, right: 30, left: 20, bottom: 90 \}\}>/, '<BarChart data={productChartData} margin={{ top: 20, right: 30, left: 40, bottom: 140 }}>');
code = code.replace(/<BarChart data={freightProductChartData} margin=\{\{ top: 20, right: 30, left: 20, bottom: 90 \}\}>/, '<BarChart data={freightProductChartData} margin={{ top: 20, right: 30, left: 40, bottom: 140 }}>');

code = code.replace(/<XAxis[\s\S]*?\/>/g, `<XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={160} 
                          tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} 
                          tick={{fontSize: 11, dy: 10, dx: -10, fill: "#64748b", direction: "ltr"}} 
                          interval={0} 
                        />`);

code = code.replace(/<YAxis[\s\S]*?\/>/g, `<YAxis 
                          width={80}
                          tick={{ fontSize: 12, direction: 'ltr' }}
                          tickFormatter={(value) => new Intl.NumberFormat('fa-IR', { notation: "compact", maximumFractionDigits: 1 }).format(value)}
                        />`);

fs.writeFileSync('src/views/DiscountAnalysisView.tsx', code);
console.log('done');
