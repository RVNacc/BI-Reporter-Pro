import AdvancedPeriodFilter from "../components/AdvancedPeriodFilter";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Filter, BarChart3, TrendingDown, TrendingUp, Layers } from 'lucide-react';
import ExportPrintButtons from "../components/ExportPrintButtons";
import { defaultXAxisProps, defaultYAxisProps, verticalYAxisProps, hideAxisProps } from "../components/charts/ChartConfig";

export default function ParetoReportsView() {
  const [period, setPeriod] = useState<string>('');
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [netMode, setNetMode] = useState(true);

  // Interval Settings
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(10000000);
  const [stepVal, setStepVal] = useState(1000000);
  const [customBinsStr, setCustomBinsStr] = useState("5000000,10000000,30000000,50000000,100000000,200000000");

  useEffect(() => {
    fetch('/api/periods')
      .then(res => res.json())
      .then(data => setAvailablePeriods(data || []))
      .catch(console.error);
  }, []);

  const fetchData = () => {
    setLoading(true);
    const bins = customBinsStr.split(',').map(s => parseInt(s.trim().replace(/,/g, ''))).filter(n => !isNaN(n));
    const intervalSettings = JSON.stringify({ min: minVal, max: maxVal, step: stepVal, customBins: bins, enabled: true });
    fetch(`/api/reports/pareto?period=${period}&netMode=${netMode}&intervalSettings=${encodeURIComponent(intervalSettings)}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [period, netMode]);

  const renderTopBottomLists = (items: any[], valueKey: string, title: string, formatVal: (v:any)=>string) => {
     if (!items || items.length === 0) return null;
     const sorted = [...items].sort((a,b) => b[valueKey] - a[valueKey]);
     const top10 = sorted.slice(0, 10);
     const bottom10 = [...sorted].sort((a,b) => a[valueKey] - b[valueKey]).slice(0, 10);

     return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
           <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              <h3 className="font-semibold text-slate-800">{title}</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Right panel (Top 10) in RTL */}
              <div className="p-4 border-l border-slate-100">
                 <h4 className="font-bold text-green-700 text-sm mb-4 border-b pb-2 flex items-center gap-2"><TrendingUp size={16}/> برترین‌ها (TOP 10)</h4>
                 <ul className="space-y-2">
                    {top10.map((item, idx) => (
                       <li key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded">
                          <span className="flex items-center gap-2 text-slate-700"><span className="w-5 text-center font-bold text-slate-400">{idx+1}.</span> {item.name}</span>
                          <span className="font-medium text-slate-900">{formatVal(item[valueKey])}</span>
                       </li>
                    ))}
                 </ul>
              </div>
              {/* Left panel (Bottom 10) in RTL */}
              <div className="p-4">
                 <h4 className="font-bold text-red-700 text-sm mb-4 border-b pb-2 flex items-center gap-2"><TrendingDown size={16}/> ضعیف‌ترین‌ها (BOTTOM 10)</h4>
                 <ul className="space-y-2">
                    {bottom10.map((item, idx) => (
                       <li key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded">
                          <span className="flex items-center gap-2 text-slate-700"><span className="w-5 text-center font-bold text-slate-400">{idx+1}.</span> {item.name}</span>
                          <span className="font-medium text-slate-900">{formatVal(item[valueKey])}</span>
                       </li>
                    ))}
                 </ul>
              </div>
           </div>
        </div>
     );
  };

  const renderClassATable = (items: any[], valueKey: string, title: string, formatVal: (v:any)=>string) => {
     if (!items || items.length === 0) return null;
     const classA = items.filter(i => i.cumPercent <= 80);
     
     return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
           <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-600" />
              <h3 className="font-semibold text-slate-800">{title} (کلاس A - 80٪ {title.includes('ریالی') ? 'درآمد' : 'حجم'} کل)</h3>
           </div>
           <div className="p-4 bg-purple-50 text-purple-800 text-sm border-b border-purple-100">
               این بخش شامل لیست کالاهایی است که مجموعا ۸۰٪ از {title.includes('ریالی') ? 'فروش ریالی' : 'حجم فروش'} را تشکیل می‌دهند (۲۰٪ برتر کالاها).
               تعداد کل کالاهای کلاس A: <span className="font-bold">{classA.length}</span> مورد.
           </div>
           <div className="overflow-x-auto max-h-[450px]">
              <table className="w-full text-sm text-right">
                 <thead className="bg-slate-50 sticky top-0 shadow-sm text-slate-600">
                    <tr>
                       <th className="px-4 py-3 font-medium">ردیف</th>
                       <th className="px-4 py-3 font-medium">نام کالا</th>
                       <th className="px-4 py-3 font-medium">مقدار</th>
                       <th className="px-4 py-3 font-medium text-center">سهم از کل / تجمعی</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {classA.map((item, idx) => (
                       <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500 w-16 text-center">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                          <td className="px-4 py-3 text-slate-700 font-mono">{formatVal(item[valueKey])}</td>
                          <td className="px-4 py-3 text-slate-600 text-center">
                             {item.cumPercent?.toFixed(1)}%
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
     );
  };
  const renderParetoChart = (chartData: any[], valueKey: string, nameKey: string, title: string) => {
     if (!chartData || chartData.length === 0) return null;
     const topN = chartData.slice(0, 30); // show top 30 in chart
     if (data?.error) return <div className="p-10 text-center text-red-500">{data.error}</div>;
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
           <div className="h-[550px]">
              <div dir="ltr" className="w-full h-full flex-1 min-h-0 min-w-0">
<ResponsiveContainer width="100%" height="100%">
<ComposedChart data={topN} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey={nameKey} angle={-45} textAnchor="end" height={180} tickFormatter={(v) => v && v.length > 30 ? v.substring(0, 30) + '...' : v} tick={{fontSize: 12, fontWeight: 'bold', dy: 10, dx: -10, fill: '#1e293b'}} interval={0} />
                    <YAxis yAxisId="left" {...defaultYAxisProps} orientation="left" />
                    <YAxis yAxisId="right" {...defaultYAxisProps} />
                    <Tooltip formatter={(val: number, name: string) => [name === 'درصد تجمعی' ? val.toFixed(2) + '%' : val.toLocaleString(), name]} />
                    <Legend />
                    <Bar yAxisId="left" dataKey={valueKey} name="مقدار/مبلغ" fill="#3b82f6" radius={[4,4,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="cumPercent" name="درصد تجمعی" stroke="#ef4444" strokeWidth={3} dot={false} />
                 </ComposedChart>
</ResponsiveContainer>
</div>
           </div>
        </div>
     )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600" />
            گزارشات و تحلیل پارتو (ABC)
          </h1>
          <p className="text-slate-500 text-sm mt-1">شناسایی کالاهای کلیدی و بررسی قانون ۸۰/۲۰</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 px-3 border-r border-slate-200">
             <input type="checkbox" id="netModePareto" checked={netMode} onChange={e => setNetMode(e.target.checked)} className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4" />
             <label htmlFor="netModePareto" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">فروش خالص (احتساب برگشتی)</label>
          </div>
          <ExportPrintButtons moduleName="sales" period={period} fileName="Pareto_Report" />
          <Filter size={18} className="text-slate-400" />
          <AdvancedPeriodFilter value={period} onChange={setPeriod} availableYears={availablePeriods.map((p:any) => p.value.startsWith('Y:') ? p.value.substring(2) : null).filter(Boolean) as string[]} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
         <div className="font-semibold text-sm text-slate-700 border-b pb-2">تنظیمات طبقه‌بندی مبلغی فاکتورها</div>
         <div className="flex flex-col gap-3">
             <div className="space-y-1 w-full max-w-2xl">
                <label className="text-xs text-slate-500 font-medium font-mono">طرح دلخواه طبقات (اعداد را با کاما جدا کنید)</label>
                <input type="text" placeholder="مثلا: 5000000, 10000000" className="border border-slate-300 rounded px-3 py-2 text-sm w-full font-sans text-left" dir="ltr" value={customBinsStr} onChange={(e) => setCustomBinsStr(e.target.value)} />
                <p className="text-[10px] text-slate-400 mt-1">در صورت وارد کردن مقادیر در این فیلد، تنظیمات ساده نادیده گرفته می‌شود.</p>
             </div>
             
             <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <div className="space-y-1">
                    <label className="text-xs text-slate-500">طبقات ساده (مرز پایین)</label>
                    <input type="number" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-32" value={minVal} onChange={(e) => setMinVal(parseInt(e.target.value) || 0)} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs text-slate-500">مرز بالا</label>
                    <input type="number" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-32" value={maxVal} onChange={(e) => setMaxVal(parseInt(e.target.value) || 0)} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs text-slate-500">فاصله طبقه (گام)</label>
                    <input type="number" className="border border-slate-300 rounded px-3 py-1.5 text-sm w-32" value={stepVal} onChange={(e) => setStepVal(parseInt(e.target.value) || 0)} />
                 </div>
             </div>
         </div>
         <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm font-medium transition-colors w-fit shadow-sm">
             اعمال دسته‌بندی
         </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {data?.extremes && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                     <TrendingUp size={24} />
                  </div>
                  <div>
                     <p className="text-xs text-slate-500">بیشترین فروش (ریالی)</p>
                     <p className="font-bold text-slate-800 line-clamp-1">{data.extremes.topProdAmt?.name || '-'}</p>
                     <p className="text-sm font-medium text-green-600">{data.extremes.topProdAmt?.amt?.toLocaleString()}</p>
                  </div>
               </div>
               <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                     <TrendingDown size={24} />
                  </div>
                  <div>
                     <p className="text-xs text-slate-500">کمترین فروش (ریالی)</p>
                     <p className="font-bold text-slate-800 line-clamp-1">{data.extremes.botProdAmt?.name || '-'}</p>
                     <p className="text-sm font-medium text-red-600">{data.extremes.botProdAmt?.amt?.toLocaleString()}</p>
                  </div>
               </div>
               <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                     <TrendingUp size={24} />
                  </div>
                  <div>
                     <p className="text-xs text-slate-500">بیشترین حجم (تعدادی)</p>
                     <p className="font-bold text-slate-800 line-clamp-1">{data.extremes.topProdQty?.name || '-'}</p>
                     <p className="text-sm font-medium text-blue-600">{data.extremes.topProdQty?.qty?.toLocaleString()}</p>
                  </div>
               </div>
               <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                     <TrendingDown size={24} />
                  </div>
                  <div>
                     <p className="text-xs text-slate-500">کمترین حجم (تعدادی)</p>
                     <p className="font-bold text-slate-800 line-clamp-1">{data.extremes.botProdQty?.name || '-'}</p>
                     <p className="text-sm font-medium text-orange-600">{data.extremes.botProdQty?.qty?.toLocaleString()}</p>
                  </div>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {renderParetoChart(data?.paretoProdAmt, 'amt', 'name', 'پارتو محصولات (ریالی)')}
             {renderParetoChart(data?.paretoProdQty, 'qty', 'name', 'پارتو محصولات (تعدادی)')}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {renderClassATable(data?.paretoProdAmt, 'amt', 'پارتو محصولات ریالی', (v) => Number(v || 0).toLocaleString() + ' ریال')}
             {renderClassATable(data?.paretoProdQty, 'qty', 'پارتو محصولات تعدادی', (v) => Number(v || 0).toLocaleString())}
          </div>
          
          {renderTopBottomLists(data?.paretoProdAmt, 'amt', 'پرفروش‌ترین و کم‌فروش‌ترین محصولات (ریالی)', (v) => Number(v || 0).toLocaleString() + ' ریال')}
          {renderTopBottomLists(data?.paretoProdQty, 'qty', 'پُرحجم‌ترین و کم‌حجم‌ترین محصولات (تعدادی)', (v) => Number(v || 0).toLocaleString())}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
             {renderParetoChart(data?.l1Arr, 'amt', 'name', 'پارتو سطح ۱ (ریالی)')}
             {renderParetoChart(data?.l2Arr, 'amt', 'name', 'پارتو سطح ۲ (ریالی)')}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                   <Layers size={18} className="text-blue-600" />
                   <h3 className="font-semibold text-slate-800">تحلیل گروه‌های اصلی (سطح ۱)</h3>
                </div>
                <div className="overflow-x-auto max-h-[550px]">
                   <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 sticky top-0 shadow-sm text-slate-600">
                         <tr>
                            <th className="px-4 py-3 font-medium">گروه اصلی</th>
                            <th className="px-4 py-3 font-medium">تعداد فاکتور</th>
                            <th className="px-4 py-3 font-medium">مبلغ کل</th>
                            <th className="px-4 py-3 font-medium">درصد از کل</th>
                            <th className="px-4 py-3 font-medium text-center">کلاس</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {data?.l1Arr?.map((l1: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50">
                               <td className="px-4 py-3 font-medium text-slate-800">{l1.name}</td>
                               <td className="px-4 py-3 font-medium text-blue-600">{l1.invoiceCount?.toLocaleString()}</td>
                               <td className="px-4 py-3 text-slate-700">{l1.amt?.toLocaleString()}</td>
                               <td className="px-4 py-3 text-slate-600">
                                  <div className="flex items-center gap-2">
                                     <span>{((l1.amt / (l1._totalVal || 1))*100).toFixed(1)}%</span>
                                     <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${(l1.amt / (l1._totalVal || 1))*100}%`}}></div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-4 py-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                     l1.abcClass === 'A' ? 'bg-green-100 text-green-700' :
                                     l1.abcClass === 'B' ? 'bg-orange-100 text-orange-700' :
                                     'bg-red-100 text-red-700'
                                  }`}>{l1.abcClass}</span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                   <Layers size={18} className="text-indigo-600" />
                   <h3 className="font-semibold text-slate-800">تحلیل گروه‌های فرعی (سطح ۲)</h3>
                </div>
                <div className="overflow-x-auto max-h-[550px]">
                   <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 sticky top-0 shadow-sm text-slate-600">
                         <tr>
                            <th className="px-4 py-3 font-medium">گروه فرعی</th>
                            <th className="px-4 py-3 font-medium">تعداد فاکتور</th>
                            <th className="px-4 py-3 font-medium">مبلغ کل</th>
                            <th className="px-4 py-3 font-medium">درصد از کل</th>
                            <th className="px-4 py-3 font-medium text-center">کلاس</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {data?.l2Arr?.map((l2: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50">
                               <td className="px-4 py-3 font-medium text-slate-800">{l2.name}</td>
                               <td className="px-4 py-3 font-medium text-indigo-600">{l2.invoiceCount?.toLocaleString()}</td>
                               <td className="px-4 py-3 text-slate-700">{l2.amt?.toLocaleString()}</td>
                               <td className="px-4 py-3 text-slate-600">
                                  <div className="flex items-center gap-2">
                                     <span>{((l2.amt / (l2._totalVal || 1))*100).toFixed(1)}%</span>
                                     <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${(l2.amt / (l2._totalVal || 1))*100}%`}}></div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-4 py-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                     l2.abcClass === 'A' ? 'bg-green-100 text-green-700' :
                                     l2.abcClass === 'B' ? 'bg-orange-100 text-orange-700' :
                                     'bg-red-100 text-red-700'
                                  }`}>{l2.abcClass}</span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <h3 className="font-semibold text-slate-800 mb-4 text-lg border-b pb-2">پراکندگی مبلغی فاکتورها</h3>
             {data?.invoiceClasses && data.invoiceClasses.length > 0 ? (
                 <>
                   <div className="h-[450px] mb-8">
                      <div dir="ltr" className="w-full h-full flex-1 min-h-0 min-w-0">
<ResponsiveContainer width="100%" height="100%">
<ComposedChart data={data.invoiceClasses} margin={{ top: 20, right: 30, left: 100, bottom: 140 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="range" {...defaultXAxisProps}  />
                            <YAxis yAxisId="left" {...defaultYAxisProps} orientation="left" />
                            <YAxis yAxisId="right" {...defaultYAxisProps} />
                            <Tooltip formatter={(val: number) => val.toLocaleString()} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="count" name="تعداد فاکتور" fill="#8b5cf6" radius={[4,4,0,0]} />
                            <Line yAxisId="right" type="monotone" dataKey="totalAmt" name="مبلغ کل طبقه" stroke="#f59e0b" strokeWidth={3} dot={false} />
                         </ComposedChart>
</ResponsiveContainer>
</div>
                   </div>
                   
                   <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-sm text-right text-slate-700">
                         <thead className="bg-[#0b5e86] text-white">
                            <tr>
                               <th className="px-4 py-2 border border-slate-300 font-medium">طبقه</th>
                               <th className="px-4 py-2 border border-slate-300 font-medium text-center">تعداد فاکتورها</th>
                               <th className="px-4 py-2 border border-slate-300 font-medium min-w-[150px]">نسبت تعداد</th>
                               <th className="px-4 py-2 border border-slate-300 font-medium text-center">پارتو تعدادی</th>
                               <th className="px-4 py-2 border border-slate-300 font-medium text-center">مبلغ فاکتورها</th>
                               <th className="px-4 py-2 border border-slate-300 font-medium min-w-[200px]">نسبت مبلغی فاکتور</th>
                               <th className="px-4 py-2 border border-slate-300 font-medium text-center">پارتو ریالی</th>
                            </tr>
                         </thead>
                         <tbody>
                            {data.invoiceClasses.map((cls: any, i: number) => (
                               <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                  <td className="px-4 py-2 border border-slate-300 dir-ltr text-right">{cls.range}</td>
                                  <td className="px-4 py-2 border border-slate-300 text-center">{cls.count.toLocaleString()}</td>
                                  <td className="px-4 py-2 border border-slate-300 relative text-center">
                                     <div className="absolute inset-y-0 right-0 h-full bg-[#5b9bd5] opacity-80" style={{ width: `${cls.countPercent}%` }}></div>
                                     <span className="relative z-10">{cls.countPercent.toFixed(2)}%</span>
                                  </td>
                                  <td className="px-4 py-2 border border-slate-300 text-center">{cls.cumCountPercent.toFixed(0)}%</td>
                                  <td className="px-4 py-2 border border-slate-300 text-center font-mono">{cls.totalAmt.toLocaleString()}</td>
                                  <td className="px-4 py-2 border border-slate-300 relative text-center">
                                     <div className="absolute inset-y-0 right-0 h-full bg-[#5b9bd5] opacity-80" style={{ width: `${cls.amtPercent}%` }}></div>
                                     <span className="relative z-10">{cls.amtPercent.toFixed(2)}%</span>
                                  </td>
                                  <td className="px-4 py-2 border border-slate-300 text-center">{cls.cumAmtPercent.toFixed(0)}%</td>
                               </tr>
                            ))}
                         </tbody>
                         <tfoot className="bg-slate-100 font-bold">
                             <tr>
                                 <td className="px-4 py-2 border border-slate-300 text-left">جمع</td>
                                 <td className="px-4 py-2 border border-slate-300 text-center">{data.totalInvCount?.toLocaleString()}</td>
                                 <td className="px-4 py-2 border border-slate-300 text-left">100.00%</td>
                                 <td className="px-4 py-2 border border-slate-300 text-center"></td>
                                 <td className="px-4 py-2 border border-slate-300 text-center font-mono">{data.totalInvAmt?.toLocaleString()}</td>
                                 <td className="px-4 py-2 border border-slate-300 text-left">100.00%</td>
                                 <td className="px-4 py-2 border border-slate-300 text-center"></td>
                             </tr>
                         </tfoot>
                      </table>
                   </div>
                 </>
             ) : (
                <div className="text-center py-8 text-slate-500 text-sm">ردیفی برای نمایش کلاس‌بندی فاکتورها یافت نشد.</div>
             )}
          </div>
        </>
      )}
    </div>
  );
}
