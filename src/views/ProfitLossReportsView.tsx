import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, ComposedChart
} from "recharts";
import { BadgeDollarSign, Filter, Search } from "lucide-react";
import ExportPrintButtons from "../components/ExportPrintButtons";

export default function ProfitLossReportsView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [exactDate, setExactDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [period, setPeriod] = useState("");
  const [periods, setPeriods] = useState<any[]>([]);

  // Tabs: "day" | "range" | "hierarchy" | "charts"
  const [tab, setTab] = useState<"day" | "range" | "hierarchy" | "charts">("day");

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
        setData(json.rows || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatRial = (v: number) => Number(Math.round(v) || 0).toLocaleString();

  const lossRowsDay = useMemo(() => {
     return data.filter(r => r.status === 'loss' && r.qty > 0).sort((a,b) => a.totalProfitLoss - b.totalProfitLoss); // biggest loss first (most negative)
  }, [data]);

  const rangeAggregated = useMemo(() => {
     const agg: Record<string, any> = {};
     data.forEach(r => {
        if (!agg[r.code]) {
            agg[r.code] = { ...r, qty: 0, totalSales: 0, totalProfitLoss: 0, count: 0 };
        }
        agg[r.code].qty += r.qty;
        agg[r.code].totalSales += r.totalSales;
        agg[r.code].totalProfitLoss += r.totalProfitLoss;
        agg[r.code].count += 1;
     });
     return Object.values(agg).sort((a,b) => b.totalProfitLoss - a.totalProfitLoss);
  }, [data]);

  const hierarchyAggregated = useMemo(() => {
      const l1Agg: Record<string, any> = {};
      const l2Agg: Record<string, any> = {};

      data.forEach(r => {
          const l1 = r.l1 || 'سایر';
          const l2 = r.l2 || 'سایر';
          
          if (!l1Agg[l1]) l1Agg[l1] = { name: l1, type: 'L1', profit: 0, loss: 0, net: 0, totalSales: 0 };
          if (!l2Agg[l1+'::'+l2]) l2Agg[l1+'::'+l2] = { name: `${l1} > ${l2}`, type: 'L2', profit: 0, loss: 0, net: 0, totalSales: 0, l1, l2 };

          l1Agg[l1].net += r.totalProfitLoss;
          l1Agg[l1].totalSales += r.totalSales;
          if (r.totalProfitLoss > 0) l1Agg[l1].profit += r.totalProfitLoss;
          if (r.totalProfitLoss < 0) l1Agg[l1].loss += Math.abs(r.totalProfitLoss);

          l2Agg[l1+'::'+l2].net += r.totalProfitLoss;
          l2Agg[l1+'::'+l2].totalSales += r.totalSales;
          if (r.totalProfitLoss > 0) l2Agg[l1+'::'+l2].profit += r.totalProfitLoss;
          if (r.totalProfitLoss < 0) l2Agg[l1+'::'+l2].loss += Math.abs(r.totalProfitLoss);
      });

      return { l1: Object.values(l1Agg), l2: Object.values(l2Agg) };
  }, [data]);

  const chartData = useMemo(() => {
      const topProfits = [...rangeAggregated].filter(a => a.totalProfitLoss > 0).sort((a,b) => b.totalProfitLoss - a.totalProfitLoss).slice(0, 10);
      const topLosses = [...rangeAggregated].filter(a => a.totalProfitLoss < 0).sort((a,b) => a.totalProfitLoss - b.totalProfitLoss).slice(0, 10);
      
      const breakevenItems = data.filter(d => d.status === 'breakeven').length;
      const profitItems = data.filter(d => d.status === 'profit').length;
      const lossItems = data.filter(d => d.status === 'loss').length;
      
      const statusCounts = [
          { name: 'سودآور', value: profitItems, color: '#10b981' },
          { name: 'زیان‌ده', value: lossItems, color: '#ef4444' },
          { name: 'سربه‌سر', value: breakevenItems, color: '#94a3b8' }
      ];

      return { topProfits, topLosses, statusCounts };
  }, [rangeAggregated, data]);

  const sumTotals = {
      sales: data.reduce((sum, r) => sum + r.totalSales, 0),
      qty: data.reduce((sum, r) => sum + r.qty, 0),
      netProfitLoss: data.reduce((sum, r) => sum + r.totalProfitLoss, 0),
      totalLossOnly: data.reduce((sum, r) => r.totalProfitLoss < 0 ? sum + Math.abs(r.totalProfitLoss) : sum, 0),
      totalProfitOnly: data.reduce((sum, r) => r.totalProfitLoss > 0 ? sum + r.totalProfitLoss : sum, 0),
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
        <div className="flex items-center gap-3">
          <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none w-40 disabled:opacity-50" value={period} onChange={e => setPeriod(e.target.value)} disabled={loading}>
            <option value="">همه دوره‌ها</option>
            {periods.map((p: any) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {loading ? "در حال دریافت..." : "اعمال فیلتر"}
          </button>
          <ExportPrintButtons data={data} fileName="Profit_Loss_Report" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
        <button onClick={() => setTab('day')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${tab === 'day' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
           زیان‌های روزانه (جدول یک)
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
                <input type="date" value={exactDate} onChange={e => setExactDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm" />
                <span className="text-slate-500 text-sm">فیلتر تاریخ مشخص برای مشاهده کالاهایی که با زیان فروخته شده‌اند</span>
            </div>
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
               <table className="w-full text-sm text-right whitespace-nowrap">
                   <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm text-xs border-b">
                       <tr>
                           <th className="px-4 py-3 font-medium">مبلغ زیان</th>
                           <th className="px-4 py-3 font-medium">فاصله زیان</th>
                           <th className="px-4 py-3 font-medium">بهای تمام شده</th>
                           <th className="px-4 py-3 font-medium">آخرین قیمت خرید</th>
                           <th className="px-4 py-3 font-medium">جمع خالص (فروش)</th>
                           <th className="px-4 py-3 font-medium">نرخ فروش</th>
                           <th className="px-4 py-3 font-medium">تعداد فروش</th>
                           <th className="px-4 py-3 font-medium">واحد</th>
                           <th className="px-4 py-3 font-medium">نام کالا</th>
                           <th className="px-4 py-3 font-medium">کد کالا</th>
                           <th className="px-4 py-3 font-medium">تاریخ</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {lossRowsDay.map((r, i) => (
                           <tr key={i} className="hover:bg-slate-50">
                               <td className="px-4 py-2 font-medium text-rose-600">{formatRial(Math.abs(r.totalProfitLoss))}</td>
                               <td className="px-4 py-2">{formatRial(Math.abs(r.profitLossPerUnit))}</td>
                               <td className="px-4 py-2">{formatRial(r.costPrice)}</td>
                               <td className="px-4 py-2">{formatRial(r.lastPurchasePrice)}</td>
                               <td className="px-4 py-2">{formatRial(r.totalSales)}</td>
                               <td className="px-4 py-2 text-slate-800 font-medium">{formatRial(r.price)}</td>
                               <td className="px-4 py-2 text-center" dir="ltr">{formatRial(r.qty)}</td>
                               <td className="px-4 py-2 text-slate-500">{r.unit}</td>
                               <td className="px-4 py-2">{r.name}</td>
                               <td className="px-4 py-2 font-mono text-xs">{r.code}</td>
                               <td className="px-4 py-2 text-slate-500" dir="ltr">{r.date}</td>
                           </tr>
                       ))}
                       {lossRowsDay.length === 0 && (
                           <tr><td colSpan={11} className="py-8 text-center text-slate-500">داده زیان‌دهی در این تاریخ یافت نشد</td></tr>
                       )}
                   </tbody>
               </table>
            </div>
         </div>
      )}

      {tab === 'range' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">از تایخ:</span>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">تا تاریخ:</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <button onClick={fetchData} className="px-4 py-1.5 hover:bg-slate-200 rounded-lg text-sm bg-white border shadow-sm">به روزرسانی</button>
            </div>
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
               <table className="w-full text-sm text-right whitespace-nowrap">
                   <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm text-xs border-b">
                       <tr>
                           <th className="px-4 py-3 font-medium">سود/زیان کل</th>
                           <th className="px-4 py-3 font-medium">وضعیت</th>
                           <th className="px-4 py-3 font-medium">جمع فروش</th>
                           <th className="px-4 py-3 font-medium">تعداد کل فروخته شده</th>
                           <th className="px-4 py-3 font-medium">دفعات فروش (تعداد رکورد)</th>
                           <th className="px-4 py-3 font-medium">گروه اصلی</th>
                           <th className="px-4 py-3 font-medium">نام کالا</th>
                           <th className="px-4 py-3 font-medium">کد کالا</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {rangeAggregated.map((r, i) => (
                           <tr key={i} className={`hover:bg-slate-50`}>
                               <td className={`px-4 py-2 font-bold ${r.totalProfitLoss > 0 ? "text-emerald-600" : (r.totalProfitLoss < 0 ? "text-rose-600" : "text-slate-500")}`} dir="ltr">
                                  {formatRial(r.totalProfitLoss)}
                               </td>
                               <td className="px-4 py-2">
                                  {r.totalProfitLoss > 0 ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">سودده</span> : (r.totalProfitLoss < 0 ? <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs">زیان‌ده</span> : <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs">سربه‌سر</span>)}
                               </td>
                               <td className="px-4 py-2">{formatRial(r.totalSales)}</td>
                               <td className="px-4 py-2 text-center" dir="ltr">{formatRial(r.qty)}</td>
                               <td className="px-4 py-2 text-center">{formatRial(r.count)}</td>
                               <td className="px-4 py-2 text-slate-600">{r.l1}</td>
                               <td className="px-4 py-2">{r.name}</td>
                               <td className="px-4 py-2 font-mono text-xs text-slate-500">{r.code}</td>
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
                                <th className="p-3">گروه اصلی</th>
                                <th className="p-3">جمع فروش</th>
                                <th className="p-3 text-emerald-600">سود حاصله</th>
                                <th className="p-3 text-rose-600">زیان وارده</th>
                                <th className="p-3 font-bold">برآیند خالص</th>
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
                <div className="overflow-x-auto max-h-96 custom-scrollbar">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-100/50 text-slate-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3">گروه اصلی</th>
                                <th className="p-3">زیر گروه</th>
                                <th className="p-3">جمع فروش</th>
                                <th className="p-3 text-emerald-600">سود حاصله</th>
                                <th className="p-3 text-rose-600">زیان وارده</th>
                                <th className="p-3 font-bold">برآیند خالص</th>
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
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-96">
                   <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">پر سودترین کالاها (Top 10)</h3>
                   <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={chartData.topProfits} layout="vertical" margin={{top:0, right:30, left:20, bottom:0}}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.5} />
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 10, fill: "#475569"}} axisLine={false} tickLine={false} />
                         <RechartsTooltip formatter={(v: number) => formatRial(v) + " ریال"} />
                         <Bar dataKey="totalProfitLoss" fill="#10b981" radius={[0, 4, 4, 0]} name="سود خالص" />
                      </BarChart>
                   </ResponsiveContainer>
                </div>

                {/* Top Losses */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-96">
                   <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">پر زیان‌ترین کالاها (Top 10)</h3>
                   <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={chartData.topLosses} layout="vertical" margin={{top:0, right:30, left:20, bottom:0}}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.5} />
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 10, fill: "#475569"}} axisLine={false} tickLine={false} />
                         <RechartsTooltip formatter={(v: number) => formatRial(Math.abs(v)) + " ریال"} />
                         <Bar dataKey="totalProfitLoss" fill="#ef4444" radius={[0, 4, 4, 0]} name="زیان (نمایش منفی)" />
                      </BarChart>
                   </ResponsiveContainer>
                </div>

                {/* Hierarchy Comparison L1 - Composed Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-96 lg:col-span-2">
                   <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">مقایسه سود و زیان گروه‌های اصلی کالا</h3>
                   <ResponsiveContainer width="100%" height="85%">
                       <ComposedChart data={hierarchyAggregated.l1} margin={{top: 20, right: 20, left: 20, bottom: 20}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                          <XAxis dataKey="name" angle={-90} textAnchor="end" height={160} tick={{fontSize: 12, fontWeight: "bold", dy: 10, fill: "#475569"}} interval={0} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={(v) => (v / 1000000).toFixed(0) + "M"} width={60} />
                          <RechartsTooltip formatter={(v: number) => formatRial(v) + " ریال"} />
                          <Legend verticalAlign="top" />
                          <Bar dataKey="profit" name="سود" fill="#10b981" radius={[4,4,0,0]} />
                          <Bar dataKey="loss" name="زیان" fill="#ef4444" radius={[4,4,0,0]} />
                          <Line type="monotone" dataKey="net" name="برآیند خالص" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                       </ComposedChart>
                   </ResponsiveContainer>
                </div>

                {/* Status Pie */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-80">
                   <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">سهم رکوردهای فروش (تعدادی)</h3>
                   <ResponsiveContainer width="100%" height="85%">
                       <PieChart>
                          <Pie 
                             data={chartData.statusCounts} 
                             dataKey="value" 
                             nameKey="name" 
                             cx="50%" 
                             cy="50%" 
                             outerRadius={80}
                             labelLine={true}
                             label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
      )}

    </div>
  );
}
