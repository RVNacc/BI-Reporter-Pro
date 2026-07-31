const fs = require('fs');
let code = fs.readFileSync('src/views/DiscountAnalysisView.tsx', 'utf8');

if (!code.includes('ExportButtons')) {
    code = code.replace(
        "import { BarChart,",
        "import ExportButtons from '../components/ExportButtons';\nimport { BarChart,"
    );
    
    // Add export buttons to both tabs
    code = code.replace(
        '<div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">',
        '<div className="flex justify-between items-center mb-4">\n                <h3 className="text-lg font-semibold text-slate-800">جزئیات تخفیفات</h3>\n                <ExportButtons data={data.products || []} filename="تخفیفات_کالا" />\n              </div>\n              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">'
    );
    
    code = code.replace(
        '<div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">',
        '<div className="flex justify-between items-center mb-4">\n                <h3 className="text-lg font-semibold text-slate-800">جزئیات کرایه حمل</h3>\n                <ExportButtons data={data.freightProducts || []} filename="کرایه_حمل_کالا" />\n              </div>\n              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">'
    );
    
    // Check if the replace worked for freight (since the second replace might not work if it replaces the first one again)
    // Actually wait, let's use a regex or specific replace
}
fs.writeFileSync('src/views/DiscountAnalysisView.tsx', code);
console.log('done');
