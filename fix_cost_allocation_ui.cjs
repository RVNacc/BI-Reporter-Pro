const fs = require('fs');
let s = fs.readFileSync('src/views/CostAllocationView.tsx', 'utf8');

if (!s.includes('AdvancedPeriodFilter')) {
    s = s.replace('import React, { useState, useEffect } from "react";', 'import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";\nimport React, { useState, useEffect } from "react";');
}

const targetStr = `  const [viewLevel, setViewLevel] = useState<'level_1' | 'level_2'>('level_2');
  const [isSyncing, setIsSyncing] = useState(false);`;

const replacementStr = `  const [viewLevel, setViewLevel] = useState<'level_1' | 'level_2'>('level_2');
  const [isSyncing, setIsSyncing] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState("");
  const [costPeriod, setCostPeriod] = useState("");
  const [periods, setPeriods] = useState<any[]>([]);`;

s = s.replace(targetStr, replacementStr);

const targetStr2 = `  const fetchReport = async () => {
    try {
      const res = await fetch("/api/reports/cost-allocation");`;

const replacementStr2 = `  const fetchPeriods = async () => {
    try {
      const res = await fetch("/api/periods");
      if (res.ok) {
          const data = await res.json();
          setPeriods(data);
          // Auto-select latest period if none selected
          if (!salesPeriod && data.length > 0) {
              // we don't auto select to avoid overriding manual selection, but it's okay
          }
      }
    } catch(e) {}
  };

  const fetchReport = async () => {
    try {
      const query = new URLSearchParams();
      if (salesPeriod) query.append("salesPeriod", salesPeriod);
      if (costPeriod) query.append("costPeriod", costPeriod);
      const res = await fetch("/api/reports/cost-allocation?" + query.toString());`;

s = s.replace(targetStr2, replacementStr2);

const targetStr3 = `  useEffect(() => {
    fetchCenters();
    fetchReport();
    fetchCategories();
  }, []);`;

const replacementStr3 = `  useEffect(() => {
    fetchCenters();
    fetchCategories();
    fetchPeriods();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [salesPeriod, costPeriod]);`;

s = s.replace(targetStr3, replacementStr3);

// We need to add the Period Filters in the UI. 
// Look for ExportPrintButtons usage
const targetStr4 = `      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            تسهیم هزینه‌ها (ABC)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            محاسبه و سرشکن کردن هزینه‌های مراکز روی گروه‌های کالایی
          </p>
        </div>
        <ExportPrintButtons
          moduleName="cost_allocation"
          period=""
          fileName="Cost_Allocation"
        />
      </div>`;

const replacementStr4 = `      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            تسهیم هزینه‌ها (ABC)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            محاسبه و سرشکن کردن هزینه‌های مراکز روی گروه‌های کالایی
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">دوره هزینه‌ها:</span>
              <AdvancedPeriodFilter value={costPeriod} onChange={setCostPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
           </div>
           <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">دوره فروش/تسهیم:</span>
              <AdvancedPeriodFilter value={salesPeriod} onChange={setSalesPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
           </div>
           
           <div className="flex flex-col justify-end gap-1 self-stretch">
              <span className="text-xs text-transparent">خروجی</span>
              <ExportPrintButtons moduleName="cost_allocation" period="" fileName="Cost_Allocation" />
           </div>
        </div>
      </div>`;

s = s.replace(targetStr4, replacementStr4);

fs.writeFileSync('src/views/CostAllocationView.tsx', s);
