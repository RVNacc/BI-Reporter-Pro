const fs = require('fs');

let pUI = fs.readFileSync('src/views/ParetoReportsView.tsx', 'utf8');
const targetPUI = `<ExportPrintButtons moduleName="sales" period={period} fileName="Pareto_Report" />`;
const replacePUI = `<div className="flex items-center gap-2 px-3 border-r border-slate-200">
             <input type="checkbox" id="netModePareto" checked={netMode} onChange={e => setNetMode(e.target.checked)} className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4" />
             <label htmlFor="netModePareto" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">فروش خالص (احتساب برگشتی)</label>
          </div>\n          <ExportPrintButtons moduleName="sales" period={period} fileName="Pareto_Report" />`;
pUI = pUI.replace(targetPUI, replacePUI);
fs.writeFileSync('src/views/ParetoReportsView.tsx', pUI);
