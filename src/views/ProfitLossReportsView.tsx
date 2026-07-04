import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";
import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, ComposedChart
} from "recharts";
import { BadgeDollarSign, Filter, Search } from "lucide-react";
import ExportPrintButtons from "../components/ExportPrintButtons";
import { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";


export default function ProfitLossReportsView() {
  
  const [dayRowsRaw, setDayRowsRaw] = useState<any[]>([]);
  const [rangeAggRaw, setRangeAggRaw] = useState<any[]>([]);
  const [hierarchyAggRaw, setHierarchyAggRaw] = useState<any>({l1: [], l2: []});

  const [loading, setLoading] = useState(false);
  
  // Filters
  const [exactDate, setExactDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [period, setPeriod] = useState("");
  const [periods, setPeriods] = useState<any[]>([]);

  const [statusFilter, setStatusFilter] = useState<"all" | "profit" | "loss">("all");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Tabs: "day" | "range" | "hierarchy" | "charts"
  const [tab, setTab] = useState<"day" | "range" | "hierarchy" | "charts">("day");

  useEffect(() => {
     setSortConfig(null);
  }, [tab, statusFilter]);

  useEffect(() => {
    fetch('/api/periods')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setPeriods(data);
                if (data.length > 0 && !data.find((d: any) => d.value === '')) {
                   setPeriods([{value: '', label: 'همه دوره‌ها'}, ...data]);
                } else {
                   setPeriods(data);
                }
            }
        }).catch(err => console.error("Error fetching periods:", err));
  }, []);

  useEffect(() => {
    fetchData();
  }, [period, exactDate, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
          period, 
          exactDate: tab === 'day' ? exactDate : '',
          startDate: tab !== 'day' ? startDate : '',
          endDate: tab !== 'day' ? endDate : ''
      });
      const res = await fetch("/api/reports/profit?" + q.toString());
      if (res.ok) {
        const json = await res.json();
        
  setDayRowsRaw(json.dayRows || []);
  setRangeAggRaw(json.rangeAggregated || []);
  setHierarchyAggRaw(json.hierarchyAggregated || {l1: [], l2: []});

      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatRial = (v: number) => Number(Math.round(v) || 0).toLocaleString();

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
      if (!sortConfig || sortConfig.key !== key) return <span className="text-slate-300 ml-1">↕</span>;
      return sortConfig.direction === 'asc' ? <span className="text-blue-600 ml-1">↑</span> : <span className="text-blue-600 ml-1">↓</span>;
  };

  const applySortAndFilter = (arr: any[], profitCondition: (item: any) => boolean, lossCondition: (item: any) => boolean) => {
      let result = [...arr];

      if (statusFilter === 'profit') {
          result = result.filter(profitCondition);
      } else if (statusFilter === 'loss') {
          result = result.filter(lossCondition);
      }

      if (sortConfig) {
          result.sort((a, b) => {
              const valA = a[sortConfig.key];
              const valB = b[sortConfig.key];
              if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
              if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return result;
  };

  const dayRows = useMemo(() => {
     let rows = dayRowsRaw.filter(r => r.qty > 0);
     if (!sortConfig) {
         rows.sort((a,b) => a.totalProfitLoss - b.totalProfitLoss); // biggest loss first by default
     }
     return applySortAndFilter(rows, r => r.totalProfitLoss > 0, r => r.totalProfitLoss < 0);
  }, [dayRowsRaw, statusFilter, sortConfig]);

  const [page, setPage] = useState(1);
  useEffect(() => {
      setPage(1);
  }, [dayRows]);

  const itemsPerPage = 50;
  const paginatedDayRows = useMemo(() => {
     const start = (page - 1) * itemsPerPage;
     return dayRows.slice(start, start + itemsPerPage);
  }, [dayRows, page]);
  const totalPages = Math.ceil(dayRows.length / itemsPerPage);

  const rangeAggregated = useMemo(() => {
     let arr = [...rangeAggRaw];
     if (!sortConfig) {
         arr.sort((a: any, b: any) => b.totalProfitLoss - a.totalProfitLoss);
     }
     return applySortAndFilter(arr, r => r.totalProfitLoss > 0, r => r.totalProfitLoss < 0);
  }, [rangeAggRaw, statusFilter, sortConfig]);

  const hierarchyAggregated = useMemo(() => {
      let l1 = [...hierarchyAggRaw.l1];
      let l2 = [...hierarchyAggRaw.l2];
      
      if (!sortConfig) {
          l1.sort((a: any, b: any) => b.net - a.net);
          l2.sort((a: any, b: any) => b.net - a.net);
      }

      return { 
          l1: applySortAndFilter(l1, r => r.net > 0, r => r.net < 0), 
          l2: applySortAndFilter(l2, r => r.net > 0, r => r.net < 0) 
      };
  }, [hierarchyAggRaw, statusFilter, sortConfig]);

  const chartData = useMemo(() => {
      const topProfits = [...rangeAggregated].filter(a => a.totalProfitLoss > 0).sort((a,b) => b.totalProfitLoss - a.totalProfitLoss).slice(0, 10);
      const topLosses = [...rangeAggregated].filter(a => a.totalProfitLoss < 0).sort((a,b) => a.totalProfitLoss - b.totalProfitLoss).slice(0, 10);
      
      const breakevenItems = dayRowsRaw.filter(d => d.totalProfitLoss === 0).length;
      const profitItems = dayRowsRaw.filter(d => d.totalProfitLoss > 0).length;
      const lossItems = dayRowsRaw.filter(d => d.totalProfitLoss < 0).length;
      
      const statusCounts = [
          { name: 'سودآور', value: profitItems, color: '#10b981' },
          { name: 'زیان‌ده', value: lossItems, color: '#ef4444' },
          { name: 'سربه‌سر', value: breakevenItems, color: '#94a3b8' }
      ];

      return { topProfits, topLosses, statusCounts };
  }, [rangeAggregated, dayRowsRaw]);

  const sumTotals = {
      sales: rangeAggRaw.reduce((sum, r) => sum + r.totalSales, 0),
      qty: rangeAggRaw.reduce((sum, r) => sum + r.qty, 0),
      netProfitLoss: rangeAggRaw.reduce((sum, r) => sum + r.totalProfitLoss, 0),
      totalLossOnly: rangeAggRaw.reduce((sum, r) => r.totalProfitLoss < 0 ? sum + Math.abs(r.totalProfitLoss) : sum, 0),
      totalProfitOnly: rangeAggRaw.reduce((sum, r) => r.totalProfitLoss > 0 ? sum + r.totalProfitLoss : sum, 0),
  };

  const renderKPIs = () => (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm mb-1">جمع فروش (ریال)</p>
              <h3 className="text-xl font-bold text-slate-800">{formatRial(sumTotals.sales)}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm mb-1">جمع سود (ریال)</p>
              <h3 className="text-xl font-bold text-emerald-600">{formatRial(sumTotals.totalProfitOnly)}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm mb-1">جمع زیان (ریال)</p>
              <h3 className="text-xl font-bold text-rose-600">{formatRial(sumTotals.totalLossOnly)}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm mb-1">سود/زیان خالص برآیندی</p>
              <h3 className={`text-xl font-bold ${sumTotals.netProfitLoss >= 0 ? "text-emerald-600" : "text-rose-600"}`} dir="ltr">
                  {formatRial(sumTotals.netProfitLoss)}
              </h3>
          </div>
      </div>
  );

  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BadgeDollarSign className="text-blue-600" />
            تحلیل سود و زیان سطوح
          </h2>
          <p className="text-slate-500 text-sm mt-1">مشاهده و تحلیل میزان سود و زیان (مقایسه نرخ فروش با بهای تمام‌شده و آخرین خرید)</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none bg-white min-w-[120px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
              <option value="all">همه موارد</option>
              <option value="profit">فقط سودده</option>
              <option value="loss">فقط زیان‌ده</option>
          </select>
          <AdvancedPeriodFilter value={period} onChange={setPeriod} availableYears={periods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {loading ? "در حال دریافت..." : "اعمال فیلتر"}
          </button>
          <ExportPrintButtons data={dayRowsRaw} fileName="Profit_Loss_Report" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
        <button onClick={() => setTab('day')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${tab === 'day' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
           عملکرد روزانه (جدول یک)
        </button>
        <button onClick={() => setTab('range')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${tab === 'range' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
           روند دوره‌ای کالاها (جدول دو)
        </button>
        <button onClick={() => setTab('hierarchy')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${tab === 'hierarchy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
           سطوح گروه کالایی (جدول سه)
        </button>
        <button onClick={() => setTab('charts')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${tab === 'charts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
           نمودارهای تحلیلی (تب چهار)
        </button>
      </div>

      {tab === 'day' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
                <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    value={exactDate}
                    onChange={(dateObj: any) => setExactDate(dateObj ? dateObj.format("YYYY/MM/DD") : "")}
                    format="YYYY/MM/DD"
                    placeholder="انتخاب تاریخ..."
                    inputClass="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-[120px] text-center font-mono"
                />
                <span className="text-slate-500 text-sm">فیلتر تاریخ مشخص برای مشاهده کالاهایی که با زیان فروخته شده‌اند</span>
            </div>
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
               <table className="w-full text-sm text-right whitespace-nowrap">
                   <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm text-xs border-b">
                       <tr>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('date')}>تاریخ {getSortIcon('date')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('code')}>کد کالا {getSortIcon('code')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('name')}>نام کالا {getSortIcon('name')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('unit')}>واحد {getSortIcon('unit')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('qty')}>تعداد فروش {getSortIcon('qty')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('lastPurchasePrice')}>آخرین قیمت خرید {getSortIcon('lastPurchasePrice')}</th>
                           <th className="px-4 py-3 font-medium border-l border-slate-200 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('costPrice')}>بهای تمام شده {getSortIcon('costPrice')}</th>
                           <th className="px-4 py-3 font-medium border-l border-slate-200 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('price')}>نرخ فروش {getSortIcon('price')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('totalSales')}>جمع خالص (فروش) {getSortIcon('totalSales')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('profitLossPerUnit')}>فاصله سود/زیان {getSortIcon('profitLossPerUnit')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('totalProfitLoss')}>مبلغ سود/زیان {getSortIcon('totalProfitLoss')}</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {paginatedDayRows.map((r, i) => (
                           <tr key={i} className="hover:bg-slate-50">
                               <td className="px-4 py-2 text-slate-500" dir="ltr">{r.date}</td>
                               <td className="px-4 py-2 font-mono text-xs">{r.code}</td>
                               <td className="px-4 py-2">{r.name}</td>
                               <td className="px-4 py-2 text-slate-500">{r.unit}</td>
                               <td className="px-4 py-2 text-center" dir="ltr">{formatRial(r.qty)}</td>
                               <td className="px-4 py-2 bg-slate-50/50">{formatRial(r.lastPurchasePrice)}</td>
                               <td className="px-4 py-2 border-l border-slate-100 bg-slate-50/50">{formatRial(r.costPrice)}</td>
                               <td className="px-4 py-2 text-slate-800 font-medium border-l border-slate-100 bg-blue-50/30">{formatRial(r.price)}</td>
                               <td className="px-4 py-2">{formatRial(r.totalSales)}</td>
                               <td className="px-4 py-2" dir="ltr">{formatRial(r.profitLossPerUnit)}</td>
                               <td className={`px-4 py-2 font-medium ${r.totalProfitLoss > 0 ? "text-emerald-600" : (r.totalProfitLoss < 0 ? "text-rose-600" : "text-slate-500")}`} dir="ltr">{formatRial(r.totalProfitLoss)}</td>
                           </tr>
                       ))}
                       {paginatedDayRows.length === 0 && (
                           <tr><td colSpan={11} className="py-8 text-center text-slate-500">داده‌ای متناسب با فیلتر یافت نشد</td></tr>
                       )}
                   </tbody>
               </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                    <span className="text-sm text-slate-500">
                        نمایش {(page - 1) * itemsPerPage + 1} تا {Math.min(page * itemsPerPage, dayRows.length)} از {dayRows.length} ردیف
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            disabled={page === 1}
                            className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-100"
                        >
                            قبلی
                        </button>
                        <span className="text-sm text-slate-600 font-medium px-2">
                            صفحه {page} از {totalPages}
                        </span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                            disabled={page === totalPages}
                            className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-100"
                        >
                            بعدی
                        </button>
                    </div>
                </div>
            )}
         </div>
      )}

      {tab === 'range' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">از تایخ:</span>
                    <DatePicker
                        calendar={persian}
                        locale={persian_fa}
                        calendarPosition="bottom-right"
                        value={startDate}
                        onChange={(dateObj: any) => setStartDate(dateObj ? dateObj.format("YYYY/MM/DD") : "")}
                        format="YYYY/MM/DD"
                        placeholder="انتخاب تاریخ..."
                        inputClass="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-[120px] text-center font-mono"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">تا تاریخ:</span>
                    <DatePicker
                        calendar={persian}
                        locale={persian_fa}
                        calendarPosition="bottom-right"
                        value={endDate}
                        onChange={(dateObj: any) => setEndDate(dateObj ? dateObj.format("YYYY/MM/DD") : "")}
                        format="YYYY/MM/DD"
                        placeholder="انتخاب تاریخ..."
                        inputClass="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-[120px] text-center font-mono"
                    />
                </div>
                <button onClick={fetchData} className="px-4 py-1.5 hover:bg-slate-200 rounded-lg text-sm bg-white border shadow-sm">به روزرسانی</button>
            </div>
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
               <table className="w-full text-sm text-right whitespace-nowrap">
                   <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm text-xs border-b">
                       <tr>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('code')}>کد کالا {getSortIcon('code')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('name')}>نام کالا {getSortIcon('name')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('l1')}>گروه اصلی {getSortIcon('l1')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('count')}>دفعات فروش {getSortIcon('count')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('qty')}>تعداد کل فروخته شده {getSortIcon('qty')}</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('totalSales')}>جمع فروش {getSortIcon('totalSales')}</th>
                           <th className="px-4 py-3 font-medium">وضعیت</th>
                           <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-200" onClick={() => handleSort('totalProfitLoss')}>سود/زیان کل {getSortIcon('totalProfitLoss')}</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {rangeAggregated.map((r, i) => (
                           <tr key={i} className={`hover:bg-slate-50`}>
                               <td className="px-4 py-2 font-mono text-xs text-slate-500">{r.code}</td>
                               <td className="px-4 py-2">{r.name}</td>
                               <td className="px-4 py-2 text-slate-600">{r.l1}</td>
                               <td className="px-4 py-2 text-center">{formatRial(r.count)}</td>
                               <td className="px-4 py-2 text-center" dir="ltr">{formatRial(r.qty)}</td>
                               <td className="px-4 py-2">{formatRial(r.totalSales)}</td>
                               <td className="px-4 py-2">
                                  {r.totalProfitLoss > 0 ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">سودده</span> : (r.totalProfitLoss < 0 ? <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs">زیان‌ده</span> : <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs">سربه‌سر</span>)}
                               </td>
                               <td className={`px-4 py-2 font-bold ${r.totalProfitLoss > 0 ? "text-emerald-600" : (r.totalProfitLoss < 0 ? "text-rose-600" : "text-slate-500")}`} dir="ltr">
                                  {formatRial(r.totalProfitLoss)}
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
            </div>
            {/* Total Footer Row */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center font-bold text-slate-800">
                <span className="text-sm">جمع برآیند در بازه و فیلتر جاری:</span>
                <span className={sumTotals.netProfitLoss >= 0 ? "text-emerald-600" : "text-rose-600"} dir="ltr">{formatRial(sumTotals.netProfitLoss)} ریال</span>
            </div>
          </div>
      )}

      {tab === 'hierarchy' && (
         <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b font-bold text-slate-700">زیان و سود در سطح گروه اصلی (L1)</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-100/50 text-slate-500">
                            <tr>
                                <th className="p-3 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('name')}>گروه اصلی {getSortIcon('name')}</th>
                                <th className="p-3 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('totalSales')}>جمع فروش {getSortIcon('totalSales')}</th>
                                <th className="p-3 text-emerald-600 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('profit')}>سود حاصله {getSortIcon('profit')}</th>
                                <th className="p-3 text-rose-600 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('loss')}>زیان وارده {getSortIcon('loss')}</th>
                                <th className="p-3 font-bold cursor-pointer hover:bg-slate-200" onClick={() => handleSort('net')}>برآیند خالص {getSortIcon('net')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {hierarchyAggregated.l1.map((r: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-3 font-medium">{r.name}</td>
                                    <td className="p-3">{formatRial(r.totalSales)}</td>
                                    <td className="p-3 text-emerald-600">{formatRial(r.profit)}</td>
                                    <td className="p-3 text-rose-600">{formatRial(r.loss)}</td>
                                    <td className={`p-3 font-bold ${r.net >= 0 ? "text-emerald-600" : "text-rose-600"}`} dir="ltr">{formatRial(r.net)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b font-bold text-slate-700">زیان و سود در سطح زیرگروه (L2)</div>
                <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-100/50 text-slate-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('l1')}>گروه اصلی {getSortIcon('l1')}</th>
                                <th className="p-3 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('l2')}>زیر گروه {getSortIcon('l2')}</th>
                                <th className="p-3 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('totalSales')}>جمع فروش {getSortIcon('totalSales')}</th>
                                <th className="p-3 text-emerald-600 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('profit')}>سود حاصله {getSortIcon('profit')}</th>
                                <th className="p-3 text-rose-600 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('loss')}>زیان وارده {getSortIcon('loss')}</th>
                                <th className="p-3 font-bold cursor-pointer hover:bg-slate-200" onClick={() => handleSort('net')}>برآیند خالص {getSortIcon('net')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {hierarchyAggregated.l2.map((r: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-3 text-slate-500 text-xs">{r.l1}</td>
                                    <td className="p-3 font-medium">{r.l2}</td>
                                    <td className="p-3">{formatRial(r.totalSales)}</td>
                                    <td className="p-3 text-emerald-600">{formatRial(r.profit)}</td>
                                    <td className="p-3 text-rose-600">{formatRial(r.loss)}</td>
                                    <td className={`p-3 font-bold ${r.net >= 0 ? "text-emerald-600" : "text-rose-600"}`} dir="ltr">{formatRial(r.net)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
         </div>
      )}

      {tab === 'charts' && (
          <div className="space-y-6">
             {renderKPIs()}
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Top Profitable */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[500px]">
                   <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">پر سودترین کالاها (Top 10)</h3>
                   <div dir="ltr" className="w-full h-full flex-1 min-h-0 min-w-0">
<ResponsiveContainer width="100%" height="85%">
<BarChart data={chartData.topProfits} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.5} />
                         <XAxis {...hideAxisProps} />
                         <YAxis dataKey="name" {...verticalYAxisProps} />
                         <RechartsTooltip formatter={(v: number) => formatRial(v) + " ریال"} />
                         <Bar dataKey="totalProfitLoss" fill="#10b981" radius={[0, 4, 4, 0]} name="سود خالص" />
                      </BarChart>
</ResponsiveContainer>
</div>
                </div>

                {/* Top Losses */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[500px]">
                   <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">پر زیان‌ترین کالاها (Top 10)</h3>
                   <div dir="ltr" className="w-full h-full flex-1 min-h-0 min-w-0">
<ResponsiveContainer width="100%" height="85%">
<BarChart data={chartData.topLosses} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.5} />
                         <XAxis {...hideAxisProps} />
                         <YAxis dataKey="name" {...verticalYAxisProps} />
                         <RechartsTooltip formatter={(v: number) => formatRial(Math.abs(v)) + " ریال"} />
                         <Bar dataKey="totalProfitLoss" fill="#ef4444" radius={[0, 4, 4, 0]} name="زیان (نمایش منفی)" />
                      </BarChart>
</ResponsiveContainer>
</div>
                </div>

                {/* Hierarchy Comparison L1 - Composed Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[500px] lg:col-span-2">
                   <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">مقایسه سود و زیان گروه‌های اصلی کالا</h3>
                   <div dir="ltr" className="w-full h-full flex-1 min-h-0 min-w-0">
<ResponsiveContainer width="100%" height="85%">
<ComposedChart data={hierarchyAggregated.l1} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                          <XAxis dataKey="name" {...defaultXAxisProps}  />
                          <YAxis {...defaultYAxisProps} orientation="left" />
                          <RechartsTooltip formatter={(v: number) => formatRial(v) + " ریال"} />
                          <Legend verticalAlign="top" />
                          <Bar dataKey="profit" name="سود" fill="#10b981" radius={[4,4,0,0]} />
                          <Bar dataKey="loss" name="زیان" fill="#ef4444" radius={[4,4,0,0]} />
                          <Line type="monotone" dataKey="net" name="برآیند خالص" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                       </ComposedChart>
</ResponsiveContainer>
</div>
                </div>

                {/* Status Pie */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[450px]">
                   <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">سهم رکوردهای فروش (تعدادی)</h3>
                   <div dir="ltr" className="w-full h-full flex-1 min-h-0 min-w-0">
<ResponsiveContainer width="100%" height="85%">
<PieChart>
                          <Pie 
                             data={chartData.statusCounts} 
                             dataKey="value" 
                             nameKey="name" 
                             cx="50%" 
                             cy="50%" 
                             outerRadius={80}
                          >
                              {chartData.statusCounts.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                       </PieChart>
</ResponsiveContainer>
</div>
                </div>

             </div>
          </div>
      )}

    </div>
  );
}
