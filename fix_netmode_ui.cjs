const fs = require('fs');

// 1. CostAllocationView
let cUI = fs.readFileSync('src/views/CostAllocationView.tsx', 'utf8');
if (!cUI.includes('netMode')) {
    cUI = cUI.replace(`const [costPeriod, setCostPeriod] = useState("");`, `const [costPeriod, setCostPeriod] = useState("");\n  const [netMode, setNetMode] = useState(true);`);
    cUI = cUI.replace(`if (costPeriod) query.append("costPeriod", costPeriod);`, `if (costPeriod) query.append("costPeriod", costPeriod);\n      query.append("netMode", netMode.toString());`);
    cUI = cUI.replace(`}, [salesPeriod, costPeriod]);`, `}, [salesPeriod, costPeriod, netMode]);`);
    cUI = cUI.replace(`fileName="Cost_Allocation" />`, `fileName="Cost_Allocation" />\n           </div>\n           \n           <div className="flex items-center justify-end gap-2 pr-4 border-r border-slate-200 mt-2 md:mt-0">\n               <input type="checkbox" id="netModeABC" checked={netMode} onChange={e => setNetMode(e.target.checked)} className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4" />\n               <label htmlFor="netModeABC" className="text-xs font-semibold text-slate-600 cursor-pointer">احتساب برگشتی‌ها (خالص)</label>`);
    fs.writeFileSync('src/views/CostAllocationView.tsx', cUI);
}

// 2. ParetoReportsView
let pUI = fs.readFileSync('src/views/ParetoReportsView.tsx', 'utf8');
if (!pUI.includes('netMode')) {
    pUI = pUI.replace(`const [period, setPeriod] = useState("");`, `const [period, setPeriod] = useState("");\n  const [netMode, setNetMode] = useState(true);`);
    pUI = pUI.replace(`const res = await fetch(\`/api/reports/pareto?period=\${period}\`);`, `const res = await fetch(\`/api/reports/pareto?period=\${period}&netMode=\${netMode}\`);`);
    pUI = pUI.replace(`}, [period]);`, `}, [period, netMode]);`);
    pUI = pUI.replace(`intervalSettings: JSON.stringify(intervalSettings)\n      });`, `intervalSettings: JSON.stringify(intervalSettings),\n        netMode: netMode.toString()\n      });`);
    pUI = pUI.replace(`[period, intervalSettings]);`, `[period, intervalSettings, netMode]);`);
    
    const targetPUI = `<ExportPrintButtons moduleName="pareto" period={period} fileName="Pareto_Report" />`;
    const replacePUI = `<div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
               <input type="checkbox" id="netModePareto" checked={netMode} onChange={e => setNetMode(e.target.checked)} className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4" />
               <label htmlFor="netModePareto" className="text-sm font-semibold text-slate-600 cursor-pointer select-none">فروش خالص (احتساب برگشتی)</label>
            </div>\n          <ExportPrintButtons moduleName="pareto" period={period} fileName="Pareto_Report" />`;
    pUI = pUI.replace(targetPUI, replacePUI);
    fs.writeFileSync('src/views/ParetoReportsView.tsx', pUI);
}

// 3. WeeklyReportsView
let wUI = fs.readFileSync('src/views/WeeklyReportsView.tsx', 'utf8');
if (!wUI.includes('netMode')) {
    wUI = wUI.replace(`const [period, setPeriod] = useState("");`, `const [period, setPeriod] = useState("");\n  const [netMode, setNetMode] = useState(true);`);
    wUI = wUI.replace(`const res = await fetch(\`/api/reports/weekly?period=\${period}\`);`, `const res = await fetch(\`/api/reports/weekly?period=\${period}&netMode=\${netMode}\`);`);
    wUI = wUI.replace(`}, [period]);`, `}, [period, netMode]);`);
    
    const targetWUI = `<ExportPrintButtons moduleName="weekly_trend" period={period} fileName="Weekly_Trend" />`;
    const replaceWUI = `<div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
               <input type="checkbox" id="netModeWeekly" checked={netMode} onChange={e => setNetMode(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" />
               <label htmlFor="netModeWeekly" className="text-sm font-semibold text-slate-600 cursor-pointer select-none">فروش خالص (احتساب برگشتی)</label>
            </div>\n          <ExportPrintButtons moduleName="weekly_trend" period={period} fileName="Weekly_Trend" />`;
    wUI = wUI.replace(targetWUI, replaceWUI);
    fs.writeFileSync('src/views/WeeklyReportsView.tsx', wUI);
}
