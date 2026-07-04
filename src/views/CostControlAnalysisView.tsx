import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { MultiSelect as PeriodSelect } from "../components/MultiSelect";
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, Activity, ListFilter, AlertCircle } from 'lucide-react';

interface CostAnalysisData {
  account: string;
  amount: number;
  percentOfSales: number;
  percentOfNetIncome: number;
  trendPercent: number;
  compPercentOfSales?: number;
  compAmount?: number;
  avgAmount?: number;
  isAnomaly?: boolean;
}

const MultiSelect = ({ options, selected, onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="bg-slate-50 border rounded px-3 py-1.5 text-sm text-slate-700 cursor-pointer flex justify-between items-center min-w-[160px]"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate text-right">{selected.length === 0 ? placeholder : `${selected.length} مورد انتخاب شده`}</span>
        <span className="text-slate-400 text-xs">▼</span>
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-64 bg-white border shadow-lg rounded-md max-h-60 overflow-auto right-0">
          <label className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b font-medium text-slate-700">
            <input 
              type="checkbox" 
              className="ml-2 accent-blue-600"
              checked={selected.length === options.length && options.length > 0}
              onChange={(e) => {
                if (e.target.checked) onChange([...options]);
                else onChange([]);
              }}
            />
            انتخاب همه
          </label>
          {options.map((opt: string) => (
            <label key={opt} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-600">
              <input 
                type="checkbox" 
                className="ml-2 accent-blue-600"
                checked={selected.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...selected, opt]);
                  else onChange(selected.filter((x: string) => x !== opt));
                }}
              />
              {opt || 'نامشخص'}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CostControlAnalysisView() {

const getPeriodLabel = (val: string, fallback: string) => {
   if (!val) return fallback;
   const p = periods.find(p => p.value === val);
   return p ? p.label : fallback;
};


const formatPct = (val: number | undefined) => {
   if (val === undefined || val === null) return '-';
   if (val === 0) return '0%';
   return Number(val).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 3 }) + '%';
};

  const [data, setData] = useState<{
    totalSales: number;
    netIncome: number;
    totalExpenses: number;
    costAnalysis: CostAnalysisData[];
    timelineData: any[];
    topAccounts: string[];
  } | null>(null);
  
  const [comprehensiveData, setComprehensiveData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'comprehensive'>('overview');
  const [periods, setPeriods] = useState<{ value: string; label: string }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [comparePeriod, setComparePeriod] = useState("");
  const [grouping, setGrouping] = useState("monthly");
  const [analysisField, setAnalysisField] = useState("account");
  
  const [accountFilter, setAccountFilter] = useState<string[]>([]);
  const [tafsilFilter, setTafsilFilter] = useState<string[]>([]);
  const [comprehensiveViewType, setComprehensiveViewType] = useState<'table' | 'matrix'>('table');
  const [matrixPivot, setMatrixPivot] = useState<'account-tafsil' | 'tafsil-account'>('account-tafsil');
  const [matrixValue, setMatrixValue] = useState<'current' | 'compare' | 'trend'>('current');
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [availableTafsils, setAvailableTafsils] = useState<string[]>([]);

  const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  useEffect(() => {
    fetch("/api/periods")
      .then((res) => res.json())
      .then((res) => {
         setPeriods(res);
         if (res.length > 0 && !selectedPeriod) {
            setSelectedPeriod(res[0].value);
            if (res.length > 1) {
               setComparePeriod(res[1].value);
            }
         }
      });

    fetch("/api/reports/cost-control/accounts")
      .then(res => res.json())
      .then(res => {
         if (Array.isArray(res)) setAvailableAccounts(res);
      });

    fetch("/api/reports/cost-control/tafsils")
      .then(res => res.json())
      .then(res => {
         if (Array.isArray(res)) setAvailableTafsils(res);
      });
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
       fetchData();
    } else {
       fetchComprehensiveData();
    }
  }, [selectedPeriod, comparePeriod, grouping, analysisField, accountFilter, tafsilFilter, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
         period: selectedPeriod,
         comparePeriod: comparePeriod,
         grouping: grouping,
         analysisField: analysisField,
         accountFilter: accountFilter.join(','),
         tafsilFilter: tafsilFilter.join(',')
      });
      const res = await fetch(`/api/reports/cost-control?${q.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComprehensiveData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
         period: selectedPeriod,
         comparePeriod: comparePeriod,
         accounts: accountFilter.join(','),
         tafsils: tafsilFilter.join(',')
      });
      const res = await fetch(`/api/reports/cost-control/comprehensive?${q.toString()}`);
      const json = await res.json();
      setComprehensiveData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!data && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center h-full p-8 text-slate-500">
        در حال بارگذاری اطلاعات کنترل هزینه‌ها...
      </div>
    );
  }

  const costDistribution = data?.costAnalysis?.map((c, i) => ({
    name: c.account,
    value: c.amount,
    color: COLORS[i % COLORS.length]
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm" dir="rtl">
          <p className="font-bold text-slate-700 mb-1">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-slate-600">
              <span className="font-medium ml-1" style={{color: entry.color}}>{entry.name}:</span> 
              {Number(entry.value).toLocaleString()} ریال
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data) return <div className="p-6 flex justify-center items-center h-full text-slate-500 font-medium">در حال بارگذاری...</div>;

  return (
    <div className="p-8 h-full flex flex-col justify-start overflow-auto bg-slate-50">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-rose-500" />
            کنترل و تحلیل هزینه‌ها
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            ارزیابی ساختار هزینه‌ها، روندها و نسبت هزینه‌ها به فروش و سود خالص
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex bg-slate-200 p-1 rounded-lg self-end">
            <button 
               className={`px-4 py-1.5 text-sm rounded-md transition-all ${activeTab === 'overview' ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-600 hover:text-slate-800'}`}
               onClick={() => setActiveTab('overview')}
            >
               تحلیل روند و توزیع
            </button>
            <button 
               className={`px-4 py-1.5 text-sm rounded-md transition-all ${activeTab === 'comprehensive' ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-600 hover:text-slate-800'}`}
               onClick={() => setActiveTab('comprehensive')}
            >
               گزارش جامع ادغامی
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
         {activeTab === 'overview' && (
            <div className="flex flex-col gap-1">
               <span className="text-xs text-slate-500 mr-1">سطح تحلیل</span>
               <select
                  className="bg-slate-50 border rounded px-3 py-1.5 text-sm outline-none text-slate-700 min-w-[140px]"
                  value={analysisField}
                  onChange={(e) => setAnalysisField(e.target.value)}
               >
                  <option value="account">سرفصل (معین)</option>
                  <option value="tafsil">تفصیل</option>
               </select>
            </div>
         )}
         
         {availableAccounts.length > 0 && (
            <div className="flex flex-col gap-1">
               <span className="text-xs text-slate-500 mr-1">فیلتر سرفصل (معین)</span>
               <MultiSelect 
                  options={availableAccounts} 
                  selected={accountFilter} 
                  onChange={setAccountFilter} 
                  placeholder="همه سرفصل‌ها"
               />
            </div>
         )}

         {availableTafsils.length > 0 && (
            <div className="flex flex-col gap-1">
               <span className="text-xs text-slate-500 mr-1">فیلتر تفصیل</span>
               <MultiSelect 
                  options={availableTafsils} 
                  selected={tafsilFilter} 
                  onChange={setTafsilFilter} 
                  placeholder="همه تفصیل‌ها"
               />
            </div>
         )}

         <div className="flex flex-col gap-1 border-r border-slate-200 pr-4 ml-2">
            <span className="text-xs text-slate-500 mr-1">دوره گزارش</span>
            <PeriodSelect
               className="min-w-[140px]"
               options={[{label: 'همه دوره‌ها', value: ''}, ...periods]}
               value={selectedPeriod}
               onChange={setSelectedPeriod}
               placeholder="همه دوره‌ها"
            />
         </div>

         <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 mr-1">مقایسه با</span>
            <PeriodSelect
               className="min-w-[140px]"
               options={[{label: 'بدون مقایسه', value: ''}, ...periods]}
               value={comparePeriod}
               onChange={setComparePeriod}
               placeholder="بدون مقایسه"
            />
         </div>
      </div>

      {activeTab === 'overview' && data && (
         <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <div className="flex items-center gap-3 text-slate-500 mb-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                     <DollarSign size={20} />
                  </div>
                  <h3 className="font-medium text-sm">کل هزینه‌های دوره</h3>
               </div>
               <p className="text-2xl font-bold text-slate-800">
                  {Number(data.totalExpenses).toLocaleString()} <span className="text-sm font-normal text-slate-500">ریال</span>
               </p>
               {comparePeriod && data.compareTotalExpenses > 0 && (
                  <div className="mt-2 text-xs flex items-center gap-1">
                     <span className={data.totalExpenses > data.compareTotalExpenses ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                        {((data.totalExpenses - data.compareTotalExpenses) / data.compareTotalExpenses * 100).toFixed(1)}%
                     </span>
                     <span className="text-slate-400">نسبت به دوره قبل</span>
                  </div>
               )}
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <div className="flex items-center gap-3 text-slate-500 mb-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                     <DollarSign size={20} />
                  </div>
                  <h3 className="font-medium text-sm">کل فروش (درآمد) دوره</h3>
               </div>
               <p className="text-2xl font-bold text-slate-800">
                  {Number(data.totalSales).toLocaleString()} <span className="text-sm font-normal text-slate-500">ریال</span>
               </p>
               {comparePeriod && data.compareTotalSales > 0 && (
                  <div className="mt-2 text-xs flex items-center gap-1">
                     <span className={data.totalSales > data.compareTotalSales ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                        {((data.totalSales - data.compareTotalSales) / data.compareTotalSales * 100).toFixed(1)}%
                     </span>
                     <span className="text-slate-400">نسبت به دوره قبل</span>
                  </div>
               )}
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <div className="flex items-center gap-3 text-slate-500 mb-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                     <PieChartIcon size={20} />
                  </div>
                  <h3 className="font-medium text-sm">نسبت هزینه به فروش</h3>
               </div>
               <p className="text-2xl font-bold text-slate-800">
                  {data.totalSales > 0 ? ((data.totalExpenses / data.totalSales) * 100).toFixed(1) : 0}%
               </p>
               {comparePeriod && data.compareTotalSales > 0 && (
                  <div className="mt-2 text-xs flex items-center gap-1">
                     {(() => {
                        const currRatio = data.totalSales > 0 ? (data.totalExpenses / data.totalSales) * 100 : 0;
                        const compRatio = (data.compareTotalExpenses / data.compareTotalSales) * 100;
                        const diff = currRatio - compRatio;
                        return (
                           <>
                              <span className={diff > 0 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                                 {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                              </span>
                              <span className="text-slate-400">نسبت به دوره قبل ({compRatio.toFixed(1)}%)</span>
                           </>
                        );
                     })()}
                  </div>
               )}
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <div className="flex items-center gap-3 text-slate-500 mb-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                     <Activity size={20} />
                  </div>
                  <h3 className="font-medium text-sm">سود خالص تخمینی</h3>
               </div>
               <p className="text-2xl font-bold text-slate-800">
                  {Number(data.netIncome).toLocaleString()} <span className="text-sm font-normal text-slate-500">ریال</span>
               </p>
               {comparePeriod && data.compareNetIncome !== undefined && (
                  <div className="mt-2 text-xs flex items-center gap-1">
                     {(() => {
                        const compNet = data.compareNetIncome || 0;
                        const currNet = data.netIncome || 0;
                        if (compNet === 0) return null;
                        const diff = ((currNet - compNet) / Math.abs(compNet)) * 100;
                        return (
                           <>
                              <span className={diff < 0 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                                 {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                              </span>
                              <span className="text-slate-400">نسبت به دوره قبل</span>
                           </>
                        );
                     })()}
                  </div>
               )}
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
               {/* Cost Distribution Chart */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
               <h3 className="text-lg font-semibold text-slate-700 border-b pb-3 mb-6">ترکیب هزینه‌ها</h3>
               <div className="flex-1 min-h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                     <Pie
                        data={costDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                     >
                        {costDistribution.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip content={<CustomTooltip />} />
                     <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', marginTop: '20px' }} />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               </div>

               {/* Expenses by Account Bar Chart */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
               <h3 className="text-lg font-semibold text-slate-700 border-b pb-3 mb-6">هزینه به تفکیک {analysisField === 'tafsil' ? 'تفصیل' : 'سرفصل'}</h3>
               <div className="flex-1 min-h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={costDistribution} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" angle={-45} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, dx: -10, fill: "#475569", direction: "ltr"}} interval={0} axisLine={false} tickLine={false} />
                     <YAxis orientation="left" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", textAnchor: "end", dx: -10, direction: "ltr" }} tickFormatter={(val) => (val / 1000000).toFixed(0) + 'm'} />
                     <Tooltip content={<CustomTooltip />} />
                     <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                        {costDistribution.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
               </div>
            </div>

            {/* Historical Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
               <div className="flex justify-between items-center border-b pb-3 mb-6">
                  <h3 className="text-lg font-semibold text-slate-700">روند تاریخی هزینه‌ها ({analysisField === 'tafsil' ? 'تفصیل‌های پرهزینه' : 'سرفصل‌های پرهزینه'})</h3>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => setGrouping("daily")}
                        className={`px-3 py-1 rounded text-sm transition ${grouping === 'daily' ? 'bg-amber-100 text-amber-700 font-medium' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                     >
                        روزانه
                     </button>
                     <button 
                        onClick={() => setGrouping("weekly")}
                        className={`px-3 py-1 rounded text-sm transition ${grouping === 'weekly' ? 'bg-amber-100 text-amber-700 font-medium' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                     >
                        هفتگی
                     </button>
                     <button 
                        onClick={() => setGrouping("monthly")}
                        className={`px-3 py-1 rounded text-sm transition ${grouping === 'monthly' ? 'bg-amber-100 text-amber-700 font-medium' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                     >
                        ماهانه
                     </button>
                  </div>
               </div>
               <div className="h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={data.timelineData} margin={{ top: 10, right: 30, left: 100, bottom: 140 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="period" angle={-45} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, dx: -10, fill: "#475569", direction: "ltr"}} interval={0} axisLine={false} tickLine={false} />
                        <YAxis orientation="left" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", textAnchor: "end", dx: -10, direction: "ltr" }} tickFormatter={(val) => (val / 1000000).toFixed(0) + 'm'} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', marginTop: '20px' }} />
                        {data?.topAccounts?.map((acc, idx) => (
                           <Line key={acc} type="monotone" dataKey={acc} name={acc} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        ))}
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>

             {/* Ratio Trend Chart */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <div className="flex justify-between items-center border-b pb-3 mb-6">
                   <h3 className="text-lg font-semibold text-slate-700">روند نسبت هزینه به فروش</h3>
                </div>
                <div className="h-[450px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.timelineData} margin={{ top: 10, right: 30, left: 100, bottom: 140 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                         <XAxis dataKey="period" angle={-45} textAnchor="end" height={160} tickFormatter={(v) => v && String(v).length > 25 ? String(v).substring(0, 25) + "..." : v} tick={{fontSize: 12, fontWeight: "bold", dy: 10, dx: -10, fill: "#475569", direction: "ltr"}} interval={0} axisLine={false} tickLine={false} />
                         <YAxis orientation="left" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", textAnchor: "end", dx: -10, direction: "ltr" }} tickFormatter={(val) => val.toFixed(1) + '%'} />
                         <Tooltip 
                            content={({ active, payload, label }: any) => {
                               if (active && payload && payload.length) {
                                  return (
                                     <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm" dir="rtl">
                                        <p className="font-bold text-slate-700 mb-1">{label}</p>
                                        <p className="text-slate-600">
                                           <span className="font-medium ml-1 text-rose-500">نسبت هزینه به فروش:</span> 
                                           {Number(payload[0].value).toFixed(1)}%
                                        </p>
                                     </div>
                                  );
                               }
                               return null;
                            }}
                         />
                         <Line type="monotone" dataKey="ratioOfSales" name="نسبت هزینه به فروش" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>

            {/* Detailed Analysis Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-semibold text-slate-800">جدول تحلیل ساختار هزینه‌ها</h3>
               <button
                  onClick={() => {
                     const headers = ['سرفصل', 'مبلغ (ریال)', 'درصد از فروش', 'وضعیت هشدار (بیشتر از میانگین)'];
                     const rows = data?.costAnalysis?.map(i => [
                        i.account || 'نامشخص',
                        i.amount,
                        i.percentOfSales.toFixed(1) + '%',
                        i.isAnomaly ? 'افزایش غیرعادی' : 'عادی'
                     ]);
                     const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
                        + headers.join(',') + "\n"
                        + rows.map(e => e.join(',')).join("\n");
                     const encodedUri = encodeURI(csvContent);
                     const link = document.createElement("a");
                     link.setAttribute("href", encodedUri);
                     link.setAttribute("download", "تحلیل_ساختار_هزینه.csv");
                     document.body.appendChild(link);
                     link.click();
                     document.body.removeChild(link);
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
               >
                  خروجی اکسل (CSV)
               </button>
               </div>
               <div className="overflow-x-auto">
               <table className="w-full text-sm text-right">
                  <thead className="bg-slate-100 text-slate-600 font-medium">
                     <tr>
                     <th className="px-6 py-4 rounded-tr-lg">{analysisField === 'tafsil' ? 'تفصیل هزینه' : 'سرفصل هزینه'}</th>
                     <th className="px-6 py-4">مبلغ {selectedPeriod ? "انتخابی" : "دوره گزارش"} (ریال)</th>
                     <th className="px-6 py-4">مبلغ {comparePeriod ? "مقایسه" : "دوره مقایسه"} (ریال)</th>
                     <th className="px-6 py-4">درصد از فروش</th>
                     <th className="px-6 py-4">درصد از فروش (مقایسه)</th>
                     <th className="px-6 py-4">وضعیت</th>
                     <th className="px-6 py-4 text-center rounded-tl-lg">روند ({comparePeriod || 'مقایسه'})</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {data?.costAnalysis?.map((item, index) => (
                     <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{item.account || 'نامشخص'}</td>
                        <td className="px-6 py-4 font-mono text-slate-700">{Number(item.amount).toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono text-slate-500">{item.compAmount ? Number(item.compAmount).toLocaleString() : '-'}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700 w-12">{formatPct(item.percentOfSales)}</span>

                           <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(item.percentOfSales, 100)}%` }}></div>
                           </div>
                           </div>
                        
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">
                           {item.compPercentOfSales ? formatPct(item.compPercentOfSales) : '-'}
                        </td>
                        <td className="px-6 py-4">
                           {item.isAnomaly ? (
                              <div className="flex items-center gap-1 text-rose-600 text-xs font-medium bg-rose-50 px-2 py-1 rounded w-max" title={`میانگین تاریخی این هزینه: ${Number(item.avgAmount?.toFixed(0)).toLocaleString()} ریال`}>
                                 <AlertCircle size={14} />
                                 <span>افزایش نامتعارف</span>
                              </div>
                           ) : (
                              <span className="text-slate-400 text-xs">عادی</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-center">
                           {item.trendPercent !== 0 ? (
                           <div className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${item.trendPercent > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {item.trendPercent > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              <span dir="ltr">{formatPct(Math.abs(item.trendPercent))}</span>
                           </div>
                           ) : (
                           <span className="text-slate-400">-</span>
                           )}
                        </td>
                     </tr>
                     ))}
                     {data.costAnalysis.length === 0 && (
                        <tr>
                           <td colSpan={5} className="text-center py-8 text-slate-500">هیچ داده هزینه‌ای برای این دوره یافت نشد.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
               </div>
            </div>
         </>
      )}

      {activeTab === 'comprehensive' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <ListFilter className="text-blue-500" size={20} />
                  گزارش جامع ادغامی هزینه‌ها (معین و تفصیل)
               </h3>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                     {comprehensiveViewType === 'matrix' && (
                        <>
                           <select 
                              className="text-sm border-slate-200 rounded-md py-1.5 pl-8 pr-3 text-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
                              value={matrixPivot}
                              onChange={(e) => setMatrixPivot(e.target.value as any)}
                           >
                              <option value="account-tafsil">ردیف: معین / ستون: تفصیل</option>
                              <option value="tafsil-account">ردیف: تفصیل / ستون: معین</option>
                           </select>
                           
                           <select 
                              className="text-sm border-slate-200 rounded-md py-1.5 pl-8 pr-3 text-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
                              value={matrixValue}
                              onChange={(e) => setMatrixValue(e.target.value as any)}
                           >
                              <option value="current">مبلغ دوره گزارش</option>
                              <option value="compare">مبلغ دوره مقایسه</option>
<option value="compare-percent">درصد مقایسه</option>
                              <option value="trend">درصد تغییر (روند)</option>
                           </select>
                        </>
                     )}
                     <div className="flex bg-slate-200 p-1 rounded-lg">
                     <button 
                        className={`px-3 py-1 text-sm rounded-md transition-all ${comprehensiveViewType === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        onClick={() => setComprehensiveViewType('table')}
                     >
                        جدولی
                     </button>
                     <button 
                        className={`px-3 py-1 text-sm rounded-md transition-all ${comprehensiveViewType === 'matrix' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        onClick={() => setComprehensiveViewType('matrix')}
                     >
                        ماتریسی
                     </button>
                  </div>
                  </div>
                  <span className="text-sm text-slate-500 font-medium">مجموع هزینه‌ها: {comprehensiveData.reduce((acc, curr) => acc + (curr.total || 0), 0).toLocaleString()} ریال</span>
                  <button
                     onClick={() => {
                        const headers = ['سرفصل (معین)', 'تفصیل', 'مبلغ گزارش (ریال)', 'مبلغ مقایسه (ریال)', 'روند'];
                        const rows = comprehensiveData.map(i => [
                           i.account || 'نامشخص',
                           i.tafsil || 'نامشخص',
                           i.total,
                           i.compVal || 0,
                           i.trendPercent ? formatPct(i.trendPercent) : '-'
                        ]);
                        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
                           + headers.join(',') + "\n"
                           + rows.map(e => e.join(',')).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "گزارش_تفصیلی_ادغامی.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                     }}
                     className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors border border-blue-100"
                  >
                     دانلود CSV
                  </button>
               </div>
            </div>
            {loading ? (
               <div className="p-12 text-center text-slate-500">در حال بارگذاری گزارش جامع...</div>
            ) : (
               <div className="overflow-x-auto max-h-[600px]">
                  {comprehensiveViewType === 'matrix' ? (() => {
                     const isAccountRow = matrixPivot === 'account-tafsil';
                     
                     const rowKeys: string[] = Array.from(new Set(comprehensiveData.map(d => String(isAccountRow ? d.account : d.tafsil || 'نامشخص'))));
                     const colKeys: string[] = Array.from(new Set(comprehensiveData.map(d => String(isAccountRow ? d.tafsil : d.account || 'نامشخص'))));
                     const matrix: Record<string, Record<string, number>> = {};
                     
                     comprehensiveData.forEach(d => {
                        const row = isAccountRow ? (d.account || 'نامشخص') : (d.tafsil || 'نامشخص');
                        const col = isAccountRow ? (d.tafsil || 'نامشخص') : (d.account || 'نامشخص');
                        
                        let val = 0;
                        if (matrixValue === 'current') val = d.total || 0;
                        else if (matrixValue === 'compare') val = d.compVal || 0;
                        else if (matrixValue === 'trend') val = d.trendPercent || 0;
                        else if (matrixValue === 'compare-percent') {
                           const sumTotal = comprehensiveData.reduce((acc, curr) => acc + (curr.compVal || 0), 0);
                           val = sumTotal > 0 ? ((d.compVal || 0) / sumTotal) * 100 : 0;
                        }

                        if (!matrix[row]) matrix[row] = {};
                        matrix[row][col] = (matrix[row][col] || 0) + val;
                     });

                     const getFormattedVal = (val: number) => {
                        if (matrixValue === 'trend' || matrixValue === 'compare-percent') return val ? formatPct(val) : '-';
                        return val > 0 ? Number(val).toLocaleString() : '-';
                     };

                     return (
                        <table className="w-full text-sm text-right border-collapse">
                           <thead className="bg-slate-100 text-slate-600 font-medium sticky top-0 z-10 shadow-sm">
                              <tr>
                                 <th className="px-6 py-4 border-b border-slate-200 whitespace-nowrap">{isAccountRow ? 'سرفصل \\ تفصیل' : 'تفصیل \\ سرفصل'}</th>
                                 {colKeys.map(c => (
                                    <th key={c} className="px-6 py-4 border-b border-slate-200 whitespace-nowrap">{c}</th>
                                 ))}
                                 <th className="px-6 py-4 border-b border-slate-200 bg-slate-200 whitespace-nowrap">{matrixValue === 'trend' ? 'میانگین روند' : (matrixValue === 'compare-percent' ? 'جمع درصد' : 'جمع کل')}</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {rowKeys.map(rowKey => {
                                 let rowTotal = 0;
                                 let rowCount = 0;
                                 colKeys.forEach(c => {
                                    if (matrix[rowKey]?.[c] !== undefined && matrix[rowKey]?.[c] !== 0) {
                                       rowTotal += matrix[rowKey][c];
                                       rowCount++;
                                    }
                                 });
                                 
                                 const rowAgg = matrixValue === 'trend' ? (rowCount > 0 ? rowTotal / rowCount : 0) : rowTotal;

                                 return (
                                    <tr key={rowKey} className="hover:bg-slate-50 transition-colors">
                                       <td className="px-6 py-3 font-medium text-slate-800 bg-slate-50 border-l border-slate-100 whitespace-nowrap">{rowKey}</td>
                                       {colKeys.map(c => {
                                          const val = matrix[rowKey]?.[c] || 0;
                                          return (
                                             <td key={c} className="px-6 py-3 font-mono text-slate-700 border-l border-slate-100 whitespace-nowrap" dir={(matrixValue === 'trend' || matrixValue === 'compare-percent') ? 'ltr' : 'rtl'}>
                                                {getFormattedVal(val)}
                                             </td>
                                          );
                                       })}
                                       <td className="px-6 py-3 font-mono font-bold text-slate-800 bg-slate-50 whitespace-nowrap" dir={(matrixValue === 'trend' || matrixValue === 'compare-percent') ? 'ltr' : 'rtl'}>{getFormattedVal(rowAgg)}</td>
                                    </tr>
                                 );
                              })}
                              {rowKeys.length > 0 && (
                                 <tr className="bg-slate-100 font-medium text-slate-800">
                                    <td className="px-6 py-4 border-t border-slate-300 border-l border-slate-200 whitespace-nowrap">جمع کل ستون‌ها</td>
                                    {colKeys.map(c => {
                                       let colTotal = 0;
                                       let colCount = 0;
                                       rowKeys.forEach(r => {
                                          if (matrix[r]?.[c] !== undefined && matrix[r]?.[c] !== 0) {
                                             colTotal += matrix[r][c];
                                             colCount++;
                                          }
                                       });
                                       const colAgg = matrixValue === 'trend' ? (colCount > 0 ? colTotal / colCount : 0) : colTotal;

                                       return (
                                          <td key={c} className="px-6 py-4 font-mono border-t border-slate-300 border-l border-slate-200 whitespace-nowrap" dir={(matrixValue === 'trend' || matrixValue === 'compare-percent') ? 'ltr' : 'rtl'}>
                                             {getFormattedVal(colAgg)}
                                          </td>
                                       );
                                    })}
                                    <td className="px-6 py-4 font-mono font-bold border-t border-slate-300 bg-slate-200 whitespace-nowrap" dir={(matrixValue === 'trend' || matrixValue === 'compare-percent') ? 'ltr' : 'rtl'}>
                                       {(() => {
                                          let allTotal = 0;
                                          let allCount = 0;
                                          rowKeys.forEach(r => colKeys.forEach(c => {
                                             if (matrix[r]?.[c] !== undefined && matrix[r]?.[c] !== 0) {
                                                allTotal += matrix[r][c];
                                                allCount++;
                                             }
                                          }));
                                          const allAgg = matrixValue === 'trend' ? (allCount > 0 ? allTotal / allCount : 0) : allTotal;
                                          return getFormattedVal(allAgg);
                                       })()}
                                    </td>
                                 </tr>
                              )}
                              {rowKeys.length === 0 && (
                                 <tr>
                                    <td colSpan={colKeys.length + 2} className="text-center py-8 text-slate-500">داده‌ای یافت نشد.</td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     );
                  })() : (
                     <table className="w-full text-sm text-right">
                        <thead className="bg-slate-100 text-slate-600 font-medium sticky top-0 z-10 shadow-sm">
                           <tr>
                              <th className="px-6 py-4 rounded-tr-lg">سرفصل (معین)</th>
                              <th className="px-6 py-4">تفصیل</th>
                              <th className="px-6 py-4">مبلغ {selectedPeriod ? getPeriodLabel(selectedPeriod, "گزارش") : "گزارش"} (ریال)</th>
                              <th className="px-6 py-4">مبلغ {comparePeriod ? getPeriodLabel(comparePeriod, "مقایسه") : "مقایسه"} (ریال)</th>
                              <th className="px-6 py-4">سهم از کل گزارش</th>
                              <th className="px-6 py-4">سهم از کل مقایسه</th>
                              <th className="px-6 py-4 text-center rounded-tl-lg">روند (مقایسه)</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {comprehensiveData.map((item, index) => {
                              const sumTotal = comprehensiveData.reduce((acc, curr) => acc + (curr.total || 0), 0);
                              const percent = sumTotal > 0 ? (item.total / sumTotal) * 100 : 0;
                              const compSumTotal = comprehensiveData.reduce((acc, curr) => acc + (curr.compVal || 0), 0);
                              const compPercent = compSumTotal > 0 ? ((item.compVal || 0) / compSumTotal) * 100 : 0;
                              return (
                                 <tr key={index} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-800">{item.account || 'نامشخص'}</td>
                                    <td className="px-6 py-3 text-slate-600">{item.tafsil || 'نامشخص'}</td>
                                    <td className="px-6 py-3 font-mono text-slate-700 font-medium">{Number(item.total).toLocaleString()}</td>
                                    <td className="px-6 py-3 font-mono text-slate-500">{item.compVal ? Number(item.compVal).toLocaleString() : '-'}</td>
                                    <td className="px-6 py-3">
                                       <div className="flex items-center gap-2">
                                          <span className="font-medium text-slate-700 w-10">{formatPct(percent)}</span>
                                          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                             <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-3 font-mono text-slate-500 text-center">{item.compVal ? formatPct(compPercent) : '-'}</td>
                                    <td className="px-6 py-3 text-center">
                                       {item.trendPercent !== undefined && item.trendPercent !== 0 ? (
                                          <div className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${item.trendPercent > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                             <span dir="ltr">{item.trendPercent > 0 ? '+' : ''}{formatPct(item.trendPercent)}</span>
                                          </div>
                                       ) : (
                                          <span className="text-slate-400">-</span>
                                       )}
                                    </td>
                                 </tr>
                              )
                           })}
                           {comprehensiveData.length === 0 && (
                              <tr>
                                 <td colSpan={5} className="text-center py-8 text-slate-500">داده‌ای یافت نشد.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  )}
               </div>
            )}
         </div>
      )}

    </div>
  );
}
