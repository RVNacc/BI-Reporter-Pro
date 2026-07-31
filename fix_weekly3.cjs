const fs = require('fs');
let code = fs.readFileSync('src/views/WeeklyReportsView.tsx', 'utf8');

code = code.replace(
    '<div className="bg-slate-100 p-1 flex rounded-lg">\n             <ExportPrintButtons data={[...productData, ...(totalRow ? [totalRow] : [])]} fileName="گزارش_هفتگی" />\n        </div>\n      </div>',
    `<div className="bg-slate-100 p-1 flex rounded-lg">
             <button onClick={() => setMode("amt")} className={\`px-4 py-1.5 text-sm rounded \${mode === "amt" ? "bg-white shadow text-blue-600 font-medium" : "text-slate-600 hover:text-slate-800"}\`}>ریالی</button>
             <button onClick={() => setMode("qty")} className={\`px-4 py-1.5 text-sm rounded \${mode === "qty" ? "bg-white shadow text-blue-600 font-medium" : "text-slate-600 hover:text-slate-800"}\`}>تعدادی</button>
          </div>
          <ExportPrintButtons data={[...productData, ...(totalRow ? [totalRow] : [])]} fileName="گزارش_هفتگی" />
        </div>
      </div>`
);

fs.writeFileSync('src/views/WeeklyReportsView.tsx', code);
console.log('done');
