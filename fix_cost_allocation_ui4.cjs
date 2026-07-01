const fs = require('fs');
let s = fs.readFileSync('src/views/CostAllocationView.tsx', 'utf8');

const targetStr = `<div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-amber-500 pr-3">
            بهابای تمام شده مبتنی بر فعالیت (ABC)
          </h1>
          <p className="text-slate-500 text-sm">
            تسهیم هزینه‌های ثابت و متغیر بر روی رده‌های کالایی جهت استخراج حاشیه
            سود واقعی
          </p>
        </div>
          <ExportPrintButtons moduleName="sales" period="" fileName="Cost_Allocation" />
      </div>`;

const replacementStr = `<div className="mb-6 flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-amber-500 pr-3">
            بهابای تمام شده مبتنی بر فعالیت (ABC)
          </h1>
          <p className="text-slate-500 text-sm">
            تسهیم هزینه‌های ثابت و متغیر بر روی رده‌های کالایی جهت استخراج حاشیه
            سود واقعی
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-500">دوره هزینه‌ها (Finance):</span>
              <AdvancedPeriodFilter value={costPeriod} onChange={setCostPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
           </div>
           <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-500">دوره فروش/تسهیم (Sales):</span>
              <AdvancedPeriodFilter value={salesPeriod} onChange={setSalesPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
           </div>
           
           <div className="flex flex-col justify-end gap-1 self-stretch pb-0.5">
              <ExportPrintButtons moduleName="cost_allocation" period="" fileName="Cost_Allocation" />
           </div>
        </div>
      </div>`;

s = s.replace(targetStr, replacementStr);

fs.writeFileSync('src/views/CostAllocationView.tsx', s);
