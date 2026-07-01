const fs = require('fs');
let s = fs.readFileSync('src/views/CostAllocationView.tsx', 'utf8');

const targetRegex = /<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center mb-6">[\s\S]*?<ExportPrintButtons moduleName="sales" period="" fileName="Cost_Allocation" \/>\s*<\/div>/;

const replacementStr = `<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-amber-500 pr-3">
             بهابای تمام شده مبتنی بر فعالیت (ABC)
          </h1>
          <p className="text-slate-500 text-sm">
            تسهیم هزینه‌های ثابت و متغیر بر روی رده‌های کالایی جهت استخراج حاشیه
            سود واقعی
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">دوره هزینه‌ها (Finance):</span>
              <AdvancedPeriodFilter value={costPeriod} onChange={setCostPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
           </div>
           <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">دوره فروش/تسهیم:</span>
              <AdvancedPeriodFilter value={salesPeriod} onChange={setSalesPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
           </div>
           
           <div className="flex flex-col justify-end gap-1 self-stretch pb-1">
              <ExportPrintButtons moduleName="cost_allocation" period="" fileName="Cost_Allocation" />
           </div>
        </div>
      </div>`;

s = s.replace(targetRegex, replacementStr);

fs.writeFileSync('src/views/CostAllocationView.tsx', s);
