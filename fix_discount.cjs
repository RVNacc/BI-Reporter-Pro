const fs = require('fs');
let code = fs.readFileSync('src/views/DiscountAnalysisView.tsx', 'utf8');

// First remove the broken ones
code = code.replace(/<div className="flex justify-between items-center mb-4">[\s\S]*?جزئیات تخفیفات[\s\S]*?<\/div>/g, '');
code = code.replace(/<div className="flex justify-between items-center mb-4">[\s\S]*?جزئیات کرایه حمل[\s\S]*?<\/div>/g, '');

const parts = code.split('<div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">');
if (parts.length === 3) {
    code = parts[0] + 
           '<div className="flex justify-between items-center mb-4 mt-6">\n                <h3 className="text-lg font-semibold text-slate-800">جزئیات تخفیفات</h3>\n                <ExportButtons data={data.products || []} filename="تخفیفات_کالا" />\n              </div>\n              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">' +
           parts[1] +
           '<div className="flex justify-between items-center mb-4 mt-6">\n                <h3 className="text-lg font-semibold text-slate-800">جزئیات کرایه حمل</h3>\n                <ExportButtons data={data.freightProducts || []} filename="کرایه_حمل_کالا" />\n              </div>\n              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">' +
           parts[2];
    fs.writeFileSync('src/views/DiscountAnalysisView.tsx', code);
    console.log("Fixed successfully");
} else {
    console.log("Parts length is", parts.length);
}
